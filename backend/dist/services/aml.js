import { pool } from '../db.js';
import { v4 as uuidv4 } from 'uuid';
const denyEmails = new Set(['blocked@example.com']);
export async function amlScreenUser(userId, email) {
    let result = 'clear';
    let score = 0;
    if (email && denyEmails.has(email.toLowerCase())) {
        result = 'deny';
        score = 100;
    }
    const id = uuidv4();
    await pool.query('INSERT INTO aml_screens (id, user_id, type, result, score) VALUES ($1,$2,$3,$4,$5)', [id, userId, 'onboard', result, score]);
    if (result !== 'clear') {
        const err = new Error('AML block');
        err.code = 'AML_BLOCKED';
        err.status = 403;
        throw err;
    }
}
export async function amlScreenTransaction(userId, txnId, amount, kycStatus) {
    let result = 'clear';
    let score = 0;
    if (kycStatus !== 'approved' && amount > 1000) {
        result = 'review';
        score = 70;
    }
    const id = uuidv4();
    await pool.query('INSERT INTO aml_screens (id, user_id, txn_id, type, result, score) VALUES ($1,$2,$3,$4,$5,$6)', [id, userId, txnId, 'transaction', result, score]);
    if (result === 'review') {
        const err = new Error('AML review required');
        err.code = 'AML_BLOCKED';
        err.status = 403;
        throw err;
    }
}
