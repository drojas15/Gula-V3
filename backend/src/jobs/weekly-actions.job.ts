/**
 * WEEKLY ACTIONS JOB
 * 
 * Cron job that runs every Monday.
 * 
 * Generates weekly actions for all active users.
 * 
 * IMPORTANT: This does NOT recalculate health scores.
 * Health scores are only recalculated on exam events.
 */

import { getActiveUsers } from '../services/weekly-actions-db.service'; // TODO: Implement
import { getLatestExamData } from '../services/weekly-actions-db.service';
import { selectWeeklyActions } from '../services/weekly-actions.service';
import { calculateHealthScoreWithAnalysis } from '../services/scoring-engine.service';

/**
 * Weekly job to generate actions
 * 
 * Runs every Monday at 00:00 UTC
 * 
 * For each active user:
 * 1. Get latest exam data
 * 2. Generate weekly actions based on current biomarkers
 * 3. Save actions to database
 */
export async function generateWeeklyActions(): Promise<void> {
  console.log('[Job] Starting weekly actions generation...');

  try {
    // TODO: Get all active users
    // const users = await getActiveUsers();
    const users: string[] = []; // Placeholder

    for (const userId of users) {
      try {
        // Get latest exam data
        const examData = await getLatestExamData(userId);
        
        if (!examData) {
          console.log(`[Job] No exam data for user ${userId}, skipping`);
          continue;
        }

        // Convert to BiomarkerValue format
        const biomarkerValues = examData.biomarkers.map(b => ({
          biomarker: b.biomarker as any,
          value: b.value,
          unit: '' // TODO: Get from database
        }));

        // Analyze biomarkers
        const analysis = calculateHealthScoreWithAnalysis(biomarkerValues);

        // Generate weekly actions
        await selectWeeklyActions(analysis.biomarkers, userId);

        console.log(`[Job] Weekly actions generated for user ${userId}`);
      } catch (error) {
        console.error(`[Job] Error generating actions for user ${userId}:`, error);
        // Continue with next user
      }
    }

    console.log('[Job] Weekly actions generation completed');
  } catch (error) {
    console.error('[Job] Error in weekly actions generation:', error);
    throw error;
  }
}

