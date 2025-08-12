import { pool } from '../db.js';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
export async function createUser(email, phone, password) {
    const password_hash = await bcrypt.hash(password, 10);
    const id = uuidv4();
    const result = await pool.query('INSERT INTO users (id, email, phone, password_hash) VALUES ($1, $2, $3, $4) RETURNING id, email, phone, password_hash', [id, email.toLowerCase(), phone, password_hash]);
    return result.rows[0];
}
export async function findUserByEmail(email) {
    const res = await pool.query('SELECT id, email, phone, password_hash FROM users WHERE email = $1', [email.toLowerCase()]);
    return res.rows[0] ?? null;
}
export async function getUserById(id) {
    const res = await pool.query('SELECT id, email, phone, password_hash FROM users WHERE id = $1', [id]);
    return res.rows[0] ?? null;
}
