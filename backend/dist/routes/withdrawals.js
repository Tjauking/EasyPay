import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { z } from 'zod';
import { generateQrJws } from '../services/qr.js';
import { pool } from '../db.js';
import { v4 as uuidv4 } from 'uuid';
const router = Router();
router.post('/qr', requireAuth, async (req, res, next) => {
    try {
        const schema = z.object({ amount: z.object({ currency: z.string(), value: z.number().positive() }), country: z.enum(['IN', 'ZW']) });
        const { amount, country } = schema.parse(req.body);
        const userId = req.user.id;
        const payload = { typ: 'qr_withdrawal', userId, amount, country, nonce: Math.random().toString(36).slice(2) };
        const jws = await generateQrJws(payload, 300);
        const expiresAt = new Date(Date.now() + 300000);
        const qrId = uuidv4();
        const rec = await pool.query('INSERT INTO qr_withdrawals (id, txn_id, code_jws, expires_at, status) VALUES ($1, $2, $3, $4, $5) RETURNING id', [qrId, null, jws, expiresAt, 'generated']);
        res.json({ qrId: rec.rows[0].id, qrJws: jws, expiresAt: expiresAt.toISOString() });
    }
    catch (e) {
        next(e);
    }
});
export default router;
