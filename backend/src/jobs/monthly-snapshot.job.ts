/**
 * MONTHLY SNAPSHOT JOB
 * 
 * Cron job that runs monthly (1st of each month).
 * 
 * Generates monthly health snapshot (narrative, projections).
 * 
 * IMPORTANT: This does NOT recalculate health scores.
 * Only generates projections and narrative.
 */

import { eventBus, MonthlyHealthSnapshotEvent } from '../events/event-bus';

/**
 * Monthly job to generate health snapshot
 * 
 * Runs on the 1st of each month at 00:00 UTC
 * 
 * For each active user:
 * 1. Get current health data
 * 2. Get actions completed in last 30 days
 * 3. Generate projections (soft logic)
 * 4. Generate narrative
 * 5. Emit MonthlyHealthSnapshot event
 */
export async function generateMonthlySnapshot(): Promise<void> {
  console.log('[Job] Starting monthly snapshot generation...');

  try {
    // TODO: Get all active users
    // const users = await getActiveUsers();
    const users: string[] = []; // Placeholder

    const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM

    for (const userId of users) {
      try {
        // Emit event - handlers will generate snapshot
        const event: MonthlyHealthSnapshotEvent = {
          type: 'MonthlyHealthSnapshot',
          userId,
          month: currentMonth,
          timestamp: new Date()
        };

        await eventBus.emit(event);

        console.log(`[Job] Monthly snapshot generated for user ${userId}, month ${currentMonth}`);
      } catch (error) {
        console.error(`[Job] Error generating snapshot for user ${userId}:`, error);
        // Continue with next user
      }
    }

    console.log('[Job] Monthly snapshot generation completed');
  } catch (error) {
    console.error('[Job] Error in monthly snapshot generation:', error);
    throw error;
  }
}

