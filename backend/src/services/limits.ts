import { pool } from '../db.js';

export async function getUserLimits(userId: string, kycStatus: string) {
  const res = await pool.query('SELECT daily_limit_usd, monthly_limit_usd FROM limits WHERE user_id = $1', [userId]);
  if (res.rowCount && res.rows[0]) return res.rows[0];
  if (kycStatus === 'approved') return { daily_limit_usd: 2000, monthly_limit_usd: 10000 };
  return { daily_limit_usd: 500, monthly_limit_usd: 1000 };
}

export async function getUserSpent(userId: string) {
  const today = await pool.query('SELECT COALESCE(SUM(amount),0) AS s FROM transactions WHERE from_user = $1 AND currency = $2 AND created_at::date = NOW()::date', [userId, 'USDt']);
  const month = await pool.query('SELECT COALESCE(SUM(amount),0) AS s FROM transactions WHERE from_user = $1 AND currency = $2 AND date_trunc(\'month\', created_at) = date_trunc(\'month\', NOW())', [userId, 'USDt']);
  return { daily: parseFloat(today.rows[0].s), monthly: parseFloat(month.rows[0].s) };
}

export async function enforceLimits(userId: string, kycStatus: string, amount: number) {
  const limits = await getUserLimits(userId, kycStatus);
  const spent = await getUserSpent(userId);
  if (spent.daily + amount > limits.daily_limit_usd) {
    const err: any = new Error('Daily limit exceeded');
    err.code = 'LIMIT_EXCEEDED'; err.status = 400; throw err;
  }
  if (spent.monthly + amount > limits.monthly_limit_usd) {
    const err: any = new Error('Monthly limit exceeded');
    err.code = 'LIMIT_EXCEEDED'; err.status = 400; throw err;
  }
}