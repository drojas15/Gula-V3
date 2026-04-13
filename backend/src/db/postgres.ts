/**
 * POSTGRESQL DATABASE SETUP
 *
 * Replaces better-sqlite3 with pg (PostgreSQL) for production deployment.
 * Connects to Supabase via DATABASE_URL environment variable.
 */

import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : undefined
});

// Validate connection on startup
pool.query('SELECT 1')
  .then(() => console.log('[DB] PostgreSQL connected'))
  .catch(err => {
    console.error('[DB] Connection failed:', err);
    process.exit(1);
  });

/**
 * Execute a query and return all rows
 */
export async function query<T = any>(sql: string, params?: any[]): Promise<T[]> {
  const result = await pool.query(sql, params);
  return result.rows;
}

/**
 * Execute a query and return the first row (or undefined)
 */
export async function queryOne<T = any>(sql: string, params?: any[]): Promise<T | undefined> {
  const result = await pool.query(sql, params);
  return result.rows[0];
}

/**
 * Execute a write query (INSERT, UPDATE, DELETE) and return affected row count
 */
export async function execute(sql: string, params?: any[]): Promise<{ rowCount: number }> {
  const result = await pool.query(sql, params);
  return { rowCount: result.rowCount ?? 0 };
}

export { pool };
