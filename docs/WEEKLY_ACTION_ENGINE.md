# Weekly Action Engine Documentation

## Overview

The Weekly Action Engine is a decision-support system that selects up to 3 actionable lifestyle recommendations per week based on biomarker analysis. It prioritizes clarity and actionability over completeness.

## Core Principles

1. **Decision Engine, Not Task List**: Focus on clarity and prioritization
2. **No Gamification**: No streaks, points, or badges
3. **Language-Agnostic Backend**: All user-facing text resolved in frontend via i18n
4. **No Medical Diagnosis**: Lifestyle recommendations only

## Selection Rules

### Priority Order

1. **Biomarker Severity** (highest priority):
   - CRITICAL first
   - Then OUT_OF_RANGE
   - Then GOOD
   - OPTIMAL biomarkers are excluded

2. **Biomarker Weight** (within same severity):
   - Higher weight = higher priority
   - Example: LDL (weight 18) > HDL (weight 8)

### Action Selection Logic

1. **Primary Action** (1 required):
   - Selected from highest-priority biomarker
   - Must impact the primary biomarker
   - Cannot be completed in last 14 days

2. **Secondary Actions** (up to 2):
   - Must impact different biomarkers OR
   - Support same biomarker but different category
   - Cannot duplicate action categories in same week
   - Cannot be completed in last 14 days

3. **Maintenance Mode**:
   - If no CRITICAL or OUT_OF_RANGE biomarkers
   - Select only 1 maintenance action
   - Prefers activity-based actions

## Action Instance Model

Each selected action becomes a `WeeklyActionInstance`:

```typescript
{
  weekly_action_id: string;        // Unique instance ID
  exam_id: string;                // Linked exam
  user_id: string;                // User owner
  action_id: string;              // From action library
  category: ActionCategory;       // ACTIVITY | NUTRITION | ELIMINATION | RECOVERY
  weekly_target: string;          // e.g., "150_minutes"
  success_metric: string;         // e.g., "minutes_completed"
  impacted_biomarkers: string[];  // Affected biomarkers
  difficulty: DifficultyLevel;     // LOW | MEDIUM | HIGH
  progress: number;                // 0-100
  completion_state: CompletionState; // PENDING | IN_PROGRESS | COMPLETED
  week_start_date: Date;          // Week start (Monday)
  week_end_date: Date;            // Week end (Sunday)
}
```

## Progress & Completion

### Progress Tracking

- Progress is user-updatable via manual check-ins
- Calculated as: `(current_value / target_value) * 100`
- Clamped to 0-100 range

### Completion States

- **PENDING**: progress = 0
- **IN_PROGRESS**: 0 < progress < 100
- **COMPLETED**: progress >= 100

### Completion Behavior

- **COMPLETED actions**:
  - Cannot be selected again for 14 days
  - Contribute to positive weekly feedback
  - No score penalty if not completed

- **Incomplete actions**:
  - No penalty to health score
  - Next week: reduce difficulty OR replace with simpler action

## API Endpoints

### GET /api/weekly-actions/dashboard

Returns complete dashboard data:

```json
{
  "health_score": 73,
  "biomarkers": [
    {
      "id": "LDL",
      "status": "OUT_OF_RANGE",
      "traffic_light": "ORANGE",
      "value": 145,
      "unit": "mg/dL"
    }
  ],
  "weekly_actions": [
    {
      "weekly_action_id": "wa_123",
      "action_id": "activity.cardio_150",
      "category": "ACTIVITY",
      "weekly_target": "150_minutes",
      "success_metric": "minutes_completed",
      "impacted_biomarkers": ["LDL", "HDL"],
      "difficulty": "MEDIUM",
      "progress": 40,
      "completion_state": "IN_PROGRESS",
      "week_start_date": "2024-01-15",
      "week_end_date": "2024-01-21"
    }
  ]
}
```

### PATCH /api/weekly-actions/:weeklyActionId/progress

Updates action progress:

**Request Body:**
```json
{
  "progress": 75
}
```

OR

```json
{
  "current_value": 112,
  "target_value": 150
}
```

**Response:**
```json
{
  "weekly_action_id": "wa_123",
  "progress": 75,
  "completion_state": "IN_PROGRESS",
  "message": "Progress updated successfully"
}
```

### GET /api/weekly-actions/current

Gets current week's actions for authenticated user.

## Week Calculation

- Week runs Monday to Sunday
- `week_start_date`: Monday 00:00:00
- `week_end_date`: Sunday 23:59:59
- Actions are selected at exam upload time
- New actions generated each week

## Category Diversity

The engine ensures category diversity when possible:

- Prefers actions from different categories
- Only allows duplicate categories if:
  - Actions impact different biomarkers, OR
  - No other suitable actions available

## Example Selection Flow

### Scenario 1: Multiple Critical Issues

**Biomarkers:**
- LDL: CRITICAL (weight 18)
- HDL: CRITICAL (weight 8)
- FASTING_GLUCOSE: OUT_OF_RANGE (weight 12)

**Selection:**
1. Primary: LDL action (CRITICAL, highest weight)
2. Secondary 1: HDL action (CRITICAL, different biomarker)
3. Secondary 2: FASTING_GLUCOSE action (OUT_OF_RANGE, different biomarker)

### Scenario 2: All Optimal

**Biomarkers:**
- All in OPTIMAL status

**Selection:**
1. Maintenance: `activity.daily_walk` (1 action only)

### Scenario 3: Single Issue

**Biomarkers:**
- LDL: OUT_OF_RANGE (weight 18)
- All others: OPTIMAL

**Selection:**
1. Primary: LDL action (e.g., `ldl.add_cardio`)
2. Secondary 1: LDL action, different category (e.g., `ldl.increase_fiber`)
3. Secondary 2: LDL action, different category (e.g., `ldl.reduce_saturated_fat`)

## Integration Points

### Exam Upload

When an exam is uploaded:
1. Biomarkers are analyzed
2. Health score is calculated
3. Weekly actions are automatically selected
4. Actions are returned in exam response

### Dashboard

Dashboard endpoint:
1. Gets latest exam data
2. Retrieves current week's actions
3. Returns combined health score + actions

## Database Schema (TODO)

```sql
CREATE TABLE weekly_action_instances (
  weekly_action_id VARCHAR(255) PRIMARY KEY,
  exam_id VARCHAR(255) NOT NULL REFERENCES exams(id),
  user_id VARCHAR(255) NOT NULL REFERENCES users(id),
  action_id VARCHAR(255) NOT NULL,
  category VARCHAR(20) NOT NULL,
  weekly_target VARCHAR(100) NOT NULL,
  success_metric VARCHAR(50) NOT NULL,
  impacted_biomarkers JSONB NOT NULL,
  difficulty VARCHAR(10) NOT NULL,
  progress INTEGER DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
  completion_state VARCHAR(20) NOT NULL,
  week_start_date DATE NOT NULL,
  week_end_date DATE NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_weekly_actions_user_week ON weekly_action_instances(user_id, week_start_date);
CREATE INDEX idx_weekly_actions_completed ON weekly_action_instances(user_id, completion_state, week_end_date);
```

## Important Notes

- **Max 3 actions per week** (hard limit)
- **14-day cooldown** on completed actions
- **No penalty** for incomplete actions
- **Category diversity** preferred but not required
- **Maintenance mode** uses only 1 action
- **Week boundaries** are Monday-Sunday
- **All text** resolved in frontend via i18n keys

