/**
 * WEEKLY PLAN SERVICE
 *
 * Manages the 7-day activity cycle:
 * - Create plan after exam upload
 * - Fetch active plan with progress
 * - Log daily completions
 * - Swap activities
 * - Build weekly summary
 */

import { query as dbQuery, queryOne, execute } from '../db/postgres';
import { selectActivities, swapActivity, ACTIVITIES_BY_ID, UserBiomarkerInput } from './activity-prioritization.service';
import { BiomarkerKey } from '../config/biomarkers.config';

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export interface WeeklyPlanActivity {
  id: string;
  weekly_plan_id: string;
  activity_id: string;
  personalized_text: string;
  category: string;
  title: string;
  evidence_level: string;
  requires_medical_disclaimer: boolean;
  note?: string;
  primary_biomarker: string;
  primary_value: number;
  primary_unit: string;
  was_swapped: boolean;
  swapped_from_activity_id?: string;
  days_completed: number;      // 0–7 this week
  completed_today: boolean;
}

export interface WeeklyPlan {
  id: string;
  user_id: string;
  exam_id?: string;
  started_at: string;
  ends_at: string;
  status: 'active' | 'completed' | 'skipped';
  activities_continuation?: string;
  activities: WeeklyPlanActivity[];
  days_remaining: number;
}

export interface ActivityLogEntry {
  id: string;
  weekly_plan_activity_id: string;
  user_id: string;
  logged_at: string;
  log_date: string;
  completed: boolean;
}

export interface WeeklySummaryActivity {
  activity_id: string;
  title: string;
  category: string;
  days_completed: number;
  completion_rate: number;      // 0–1
  projected_impacts: Array<{
    biomarker: string;
    impact_min: number;
    impact_max: number;
    impact_unit: string;
    current_value: number;
    current_unit: string;
  }>;
}

export interface WeeklySummary {
  plan_id: string;
  activities: WeeklySummaryActivity[];
  has_critical_biomarkers: boolean;
  all_above_50_pct: boolean;
  weakest_activity?: { activity_id: string; title: string; completion_rate: number };
}

// ─────────────────────────────────────────────────────────────────────────────
// Create plan
// ─────────────────────────────────────────────────────────────────────────────

export async function createWeeklyPlan(
  userId: string,
  examId: string,
  userBiomarkers: UserBiomarkerInput[],
  excludeActivityIds: string[] = []
): Promise<WeeklyPlan | null> {
  // Cancel any currently active plan for this user
  await execute(
    `UPDATE weekly_plans SET status = 'completed'
     WHERE user_id = $1 AND status = 'active' AND ends_at > NOW()`,
    [userId]
  );

  const now = new Date();
  const endsAt = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

  // Insert plan
  const plan = await queryOne<{ id: string }>(
    `INSERT INTO weekly_plans (user_id, exam_id, started_at, ends_at, status)
     VALUES ($1, $2, $3, $4, 'active')
     RETURNING id`,
    [userId, examId, now.toISOString(), endsAt.toISOString()]
  );

  if (!plan) return null;

  // Select 3 activities
  const selected = selectActivities(userBiomarkers, excludeActivityIds);

  if (selected.length === 0) return null;

  // Insert plan activities
  for (const act of selected) {
    await execute(
      `INSERT INTO weekly_plan_activities
         (weekly_plan_id, activity_id, personalized_text, category, title,
          evidence_level, requires_medical_disclaimer, note,
          primary_biomarker, primary_value, primary_unit)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)`,
      [
        plan.id,
        act.activity_id,
        act.personalized_text,
        act.category,
        act.title,
        act.evidence_level,
        act.requires_medical_disclaimer,
        act.note ?? null,
        act.primary_biomarker,
        act.primary_value,
        act.primary_unit,
      ]
    );
  }

  return getActivePlan(userId);
}

// ─────────────────────────────────────────────────────────────────────────────
// Get active plan with progress
// ─────────────────────────────────────────────────────────────────────────────

export async function getActivePlan(userId: string): Promise<WeeklyPlan | null> {
  const plan = await queryOne<{
    id: string; user_id: string; exam_id: string | null;
    started_at: string; ends_at: string; status: string;
    activities_continuation: string | null;
  }>(
    `SELECT * FROM weekly_plans
     WHERE user_id = $1 AND status = 'active'
     ORDER BY started_at DESC LIMIT 1`,
    [userId]
  );

  if (!plan) return null;

  const activities = await getActivitiesWithProgress(plan.id, userId);

  const now = new Date();
  const endsAt = new Date(plan.ends_at);
  const msRemaining = endsAt.getTime() - now.getTime();
  const daysRemaining = Math.max(0, Math.ceil(msRemaining / (24 * 60 * 60 * 1000)));

  return {
    id: plan.id,
    user_id: plan.user_id,
    exam_id: plan.exam_id ?? undefined,
    started_at: plan.started_at,
    ends_at: plan.ends_at,
    status: plan.status as 'active' | 'completed' | 'skipped',
    activities_continuation: plan.activities_continuation ?? undefined,
    activities,
    days_remaining: daysRemaining,
  };
}

async function getActivitiesWithProgress(
  planId: string,
  userId: string
): Promise<WeeklyPlanActivity[]> {
  const rows = await dbQuery<{
    id: string; weekly_plan_id: string; activity_id: string;
    personalized_text: string; category: string; title: string;
    evidence_level: string; requires_medical_disclaimer: boolean;
    note: string | null; primary_biomarker: string;
    primary_value: number; primary_unit: string;
    was_swapped: boolean; swapped_from_activity_id: string | null;
  }>(
    `SELECT * FROM weekly_plan_activities WHERE weekly_plan_id = $1 ORDER BY created_at ASC`,
    [planId]
  );

  const today = new Date().toISOString().split('T')[0];

  return Promise.all(rows.map(async row => {
    const logs = await dbQuery<{ log_date: string; completed: boolean }>(
      `SELECT log_date, completed FROM activity_logs
       WHERE weekly_plan_activity_id = $1 AND user_id = $2 AND completed = true`,
      [row.id, userId]
    );

    // Count unique days completed (avoid duplicates if any)
    const uniqueDays = new Set(logs.map(l => new Date(l.log_date).toISOString().split('T')[0]));
    const daysCompleted = uniqueDays.size;
    // pg returns DATE columns as JS Date objects, so we must normalize before comparing
    const completedToday = uniqueDays.has(today);

    return {
      id: row.id,
      weekly_plan_id: row.weekly_plan_id,
      activity_id: row.activity_id,
      personalized_text: row.personalized_text,
      category: row.category,
      title: row.title,
      evidence_level: row.evidence_level,
      requires_medical_disclaimer: row.requires_medical_disclaimer,
      note: row.note ?? undefined,
      primary_biomarker: row.primary_biomarker,
      primary_value: row.primary_value,
      primary_unit: row.primary_unit,
      was_swapped: row.was_swapped,
      swapped_from_activity_id: row.swapped_from_activity_id ?? undefined,
      days_completed: daysCompleted,
      completed_today: completedToday,
    };
  }));
}

// ─────────────────────────────────────────────────────────────────────────────
// Log daily completion
// ─────────────────────────────────────────────────────────────────────────────

export async function logActivityCompletion(
  weeklyPlanActivityId: string,
  userId: string
): Promise<{ success: boolean; already_logged: boolean; days_completed: number }> {
  const today = new Date().toISOString().split('T')[0];

  // Check if already logged today
  const existing = await queryOne<{ id: string }>(
    `SELECT id FROM activity_logs
     WHERE weekly_plan_activity_id = $1 AND user_id = $2 AND log_date = $3`,
    [weeklyPlanActivityId, userId, today]
  );

  if (existing) {
    const count = await queryOne<{ count: string }>(
      `SELECT COUNT(*) as count FROM activity_logs
       WHERE weekly_plan_activity_id = $1 AND user_id = $2 AND completed = true`,
      [weeklyPlanActivityId, userId]
    );
    return {
      success: false,
      already_logged: true,
      days_completed: parseInt(count?.count ?? '0'),
    };
  }

  await execute(
    `INSERT INTO activity_logs (weekly_plan_activity_id, user_id, log_date, completed)
     VALUES ($1, $2, $3, true)`,
    [weeklyPlanActivityId, userId, today]
  );

  const count = await queryOne<{ count: string }>(
    `SELECT COUNT(*) as count FROM activity_logs
     WHERE weekly_plan_activity_id = $1 AND user_id = $2 AND completed = true`,
    [weeklyPlanActivityId, userId]
  );

  return {
    success: true,
    already_logged: false,
    days_completed: parseInt(count?.count ?? '1'),
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Swap activity
// ─────────────────────────────────────────────────────────────────────────────

export async function swapPlanActivity(
  planActivityId: string,
  userId: string,
  userBiomarkers: UserBiomarkerInput[]
): Promise<WeeklyPlanActivity | null> {
  // Fetch the activity to swap
  const current = await queryOne<{
    id: string; weekly_plan_id: string; activity_id: string;
    category: string; was_swapped: boolean;
  }>(
    `SELECT wpa.*, wp.user_id
     FROM weekly_plan_activities wpa
     JOIN weekly_plans wp ON wp.id = wpa.weekly_plan_id
     WHERE wpa.id = $1 AND wp.user_id = $2`,
    [planActivityId, userId]
  );

  if (!current || current.was_swapped) return null;

  // Get other activities in the same plan
  const others = await dbQuery<{ activity_id: string }>(
    `SELECT activity_id FROM weekly_plan_activities
     WHERE weekly_plan_id = $1 AND id != $2`,
    [current.weekly_plan_id, planActivityId]
  );

  const otherIds = others.map(o => o.activity_id);

  // Find next best in same category
  const replacement = swapActivity(
    current.category,
    current.activity_id,
    otherIds,
    userBiomarkers
  );

  if (!replacement) return null;

  // Mark original as swapped
  await execute(
    `UPDATE weekly_plan_activities
     SET was_swapped = true
     WHERE id = $1`,
    [planActivityId]
  );

  // Insert replacement
  await execute(
    `INSERT INTO weekly_plan_activities
       (weekly_plan_id, activity_id, personalized_text, category, title,
        evidence_level, requires_medical_disclaimer, note,
        primary_biomarker, primary_value, primary_unit,
        was_swapped, swapped_from_activity_id)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,false,$12)`,
    [
      current.weekly_plan_id,
      replacement.activity_id,
      replacement.personalized_text,
      replacement.category,
      replacement.title,
      replacement.evidence_level,
      replacement.requires_medical_disclaimer,
      replacement.note ?? null,
      replacement.primary_biomarker,
      replacement.primary_value,
      replacement.primary_unit,
      current.activity_id,
    ]
  );

  // Return full plan activities
  const updated = await getActivitiesWithProgress(current.weekly_plan_id, userId);
  return updated.find(a => a.activity_id === replacement.activity_id) ?? null;
}

// ─────────────────────────────────────────────────────────────────────────────
// Weekly summary
// ─────────────────────────────────────────────────────────────────────────────

export async function buildWeeklySummary(
  planId: string,
  userId: string,
  userBiomarkers: UserBiomarkerInput[]
): Promise<WeeklySummary> {
  const activities = await getActivitiesWithProgress(planId, userId);
  const userMap = new Map(userBiomarkers.map(b => [b.biomarker, b]));

  const summaryActivities: WeeklySummaryActivity[] = activities
    .filter(a => !a.was_swapped)
    .map(a => {
      const completionRate = a.days_completed / 7;
      const catalogActivity = ACTIVITIES_BY_ID[a.activity_id];
      const projected_impacts: WeeklySummaryActivity['projected_impacts'] = [];

      if (catalogActivity) {
        for (const impact of catalogActivity.biomarker_impacts) {
          const user = userMap.get(impact.biomarker as BiomarkerKey);
          if (!user || user.status === 'OPTIMAL') continue;

          // Direction check
          const hdlLike = user.biomarker === 'HDL';
          const directionMatches = hdlLike ? impact.direction === 'UP' : impact.direction === 'DOWN';
          if (!directionMatches) continue;

          const projMin = Math.round(impact.impact_min * completionRate);
          const projMax = Math.round(impact.impact_max * completionRate);

          if (projMin < 1) continue; // Not significant

          projected_impacts.push({
            biomarker: impact.biomarker,
            impact_min: projMin,
            impact_max: projMax,
            impact_unit: impact.impact_unit,
            current_value: user.value,
            current_unit: user.unit,
          });
        }
      }

      return {
        activity_id: a.activity_id,
        title: a.title,
        category: a.category,
        days_completed: a.days_completed,
        completion_rate: completionRate,
        projected_impacts,
      };
    });

  const has_critical_biomarkers = userBiomarkers.some(b => b.status === 'CRITICAL');
  const all_above_50_pct = summaryActivities.every(a => a.completion_rate >= 0.5);

  const weakest = summaryActivities
    .filter(a => a.completion_rate < 0.5)
    .sort((a, b) => a.completion_rate - b.completion_rate)[0];

  return {
    plan_id: planId,
    activities: summaryActivities,
    has_critical_biomarkers,
    all_above_50_pct,
    weakest_activity: weakest
      ? { activity_id: weakest.activity_id, title: weakest.title, completion_rate: weakest.completion_rate }
      : undefined,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Transition: choose next week mode
// ─────────────────────────────────────────────────────────────────────────────

export async function setActivitiesContinuation(
  planId: string,
  userId: string,
  mode: 'same' | 'new' | 'mixed',
  _keepActivityIds?: string[]   // for 'mixed' mode — reserved for future use
): Promise<void> {
  await execute(
    `UPDATE weekly_plans SET activities_continuation = $1 WHERE id = $2 AND user_id = $3`,
    [mode, planId, userId]
  );
}

/** Expire plans past their end date */
export async function expirePlans(): Promise<void> {
  await execute(
    `UPDATE weekly_plans SET status = 'completed'
     WHERE status = 'active' AND ends_at < NOW()`,
    []
  );
}
