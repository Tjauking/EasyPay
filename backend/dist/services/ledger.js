import { pool } from '../db.js';
import { v4 as uuidv4 } from 'uuid';
export async function getOrCreateWallet(userId, currency) {
    const existing = await pool.query('SELECT id, balance FROM wallets WHERE user_id = $1 AND currency = $2', [userId, currency]);
    if ((existing.rowCount ?? 0) > 0) {
        return existing.rows[0];
    }
    const id = uuidv4();
    const res = await pool.query('INSERT INTO wallets (id, user_id, currency, balance) VALUES ($1, $2, $3, $4) RETURNING id, balance', [id, userId, currency, 0]);
    return res.rows[0];
}
export async function getBalance(userId, currency) {
    const w = await getOrCreateWallet(userId, currency);
    return w.balance;
}
export async function creditWallet(userId, currency, amount) {
    await pool.query('BEGIN');
    try {
        await getOrCreateWallet(userId, currency);
        await pool.query('UPDATE wallets SET balance = balance + $1 WHERE user_id = $2 AND currency = $3', [amount, userId, currency]);
        await pool.query('COMMIT');
    }
    catch (e) {
        await pool.query('ROLLBACK');
        throw e;
    }
}
export async function debitWallet(userId, currency, amount) {
    await pool.query('BEGIN');
    try {
        await getOrCreateWallet(userId, currency);
        const res = await pool.query('SELECT balance FROM wallets WHERE user_id = $1 AND currency = $2 FOR UPDATE', [userId, currency]);
        const balance = parseFloat(res.rows[0].balance);
        if (balance < amount)
            throw new Error('INSUFFICIENT_FUNDS');
        await pool.query('UPDATE wallets SET balance = balance - $1 WHERE user_id = $2 AND currency = $3', [amount, userId, currency]);
        await pool.query('COMMIT');
    }
    catch (e) {
        await pool.query('ROLLBACK');
        throw e;
    }
}
