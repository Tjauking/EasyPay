import { Pool } from 'pg';
import { config } from './config.js';
const inMemory = process.env.USE_INMEM_DB === '1';
export let pool;
export async function ensureSchema() {
    if (!pool) {
        if (inMemory) {
            const { newDb } = await import('pg-mem');
            const mem = newDb({ autoCreateForeignKeyIndices: true });
            const pgAdapter = mem.adapters.createPg();
            pool = new pgAdapter.Pool();
        }
        else {
            pool = new Pool({ connectionString: config.databaseUrl });
        }
    }
    // Skip extensions in in-memory mode
    if (!inMemory) {
        try {
            await pool.query('CREATE EXTENSION IF NOT EXISTS "uuid-ossp";');
        }
        catch { }
    }
    await pool.query(`CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    phone TEXT,
    password_hash TEXT NOT NULL,
    mfa_enabled BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
  );`);
    await pool.query(`CREATE TABLE IF NOT EXISTS user_profiles (
    user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    first_name TEXT,
    last_name TEXT,
    dob DATE,
    address TEXT
  );`);
    await pool.query(`CREATE TABLE IF NOT EXISTS wallets (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    currency TEXT NOT NULL,
    balance NUMERIC(18,2) NOT NULL DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'active',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(user_id, currency)
  );`);
    await pool.query(`CREATE TABLE IF NOT EXISTS ledger_accounts (
    id UUID PRIMARY KEY,
    user_id UUID,
    type TEXT NOT NULL,
    currency TEXT NOT NULL
  );`);
    await pool.query(`CREATE TABLE IF NOT EXISTS transactions (
    id UUID PRIMARY KEY,
    type TEXT NOT NULL,
    status TEXT NOT NULL,
    from_user UUID,
    to_user UUID,
    amount NUMERIC(18,2) NOT NULL,
    currency TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    idempotency_key TEXT
  );`);
    await pool.query(`CREATE TABLE IF NOT EXISTS ledger_entries (
    id UUID PRIMARY KEY,
    account_id UUID NOT NULL REFERENCES ledger_accounts(id),
    txn_id UUID REFERENCES transactions(id),
    amount NUMERIC(18,2) NOT NULL,
    dr_cr TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
  );`);
    await pool.query(`CREATE TABLE IF NOT EXISTS qr_withdrawals (
    id UUID PRIMARY KEY,
    txn_id UUID REFERENCES transactions(id),
    code_jws TEXT NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    status TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
  );`);
}
