/**
 * CRON JOBS
 * 
 * Only 2 cron jobs:
 * 1. Weekly (Monday): Generate Weekly Actions
 * 2. Monthly (1st): Generate Monthly Snapshot
 * 
 * IMPORTANT: These jobs do NOT recalculate health scores.
 * Health scores are only recalculated on exam events.
 */

import cron from 'node-cron';
import { generateWeeklyActions } from './weekly-actions.job';
import { generateMonthlySnapshot } from './monthly-snapshot.job';

/**
 * Initialize all cron jobs
 */
export function initializeCronJobs(): void {
  // Weekly job: Every Monday at 00:00 UTC
  cron.schedule('0 0 * * 1', async () => {
    console.log('[Cron] Running weekly actions job...');
    await generateWeeklyActions();
  });

  // Monthly job: 1st of each month at 00:00 UTC
  cron.schedule('0 0 1 * *', async () => {
    console.log('[Cron] Running monthly snapshot job...');
    await generateMonthlySnapshot();
  });

  console.log('[Cron] Cron jobs initialized');
}

