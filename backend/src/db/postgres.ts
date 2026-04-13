/**
 * POSTGRESQL DATABASE SETUP
 *
 * Replaces better-sqlite3 with pg (PostgreSQL) for production deployment.
 * Connects to Supabase via DATABASE_URL environment variable.
 *
 * NOTE: Pool is lazy — created on first access so that dotenv.config()
 * has already run before DATABASE_URL is read.
 */

import { Pool } from 'pg';

let _pool: Pool | null = null;

function getPool(): Pool {
  if (!_pool) {
    if (!process.env.DATABASE_URL) {
      throw new Error('[DB] DATABASE_URL is not set. Make sure .env is loaded before importing this module.');
    }
    _pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : undefined
    });
  }
  return _pool;
}

/**
 * Validate connection on startup — call this explicitly after dotenv.config()
 */
export async function connectDB(): Promise<void> {
  await getPool().query('SELECT 1');
  console.log('[DB] PostgreSQL connected');
}

/**
 * Execute a query and return all rows
 */
export async function query<T = any>(sql: string, params?: any[]): Promise<T[]> {
  const result = await getPool().query(sql, params);
  return result.rows;
}

/**
 * Execute a query and return the first row (or undefined)
 */
export async function queryOne<T = any>(sql: string, params?: any[]): Promise<T | undefined> {
  const result = await getPool().query(sql, params);
  return result.rows[0];
}

/**
 * Execute a write query (INSERT, UPDATE, DELETE) and return affected row count
 */
export async function execute(sql: string, params?: any[]): Promise<{ rowCount: number }> {
  const result = await getPool().query(sql, params);
  return { rowCount: result.rowCount ?? 0 };
}

export { getPool as pool };
