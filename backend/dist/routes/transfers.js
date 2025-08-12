import { Router } from 'express';
import { z } from 'zod';
import { requireAuth } from '../middleware/auth.js';
import { quote } from '../services/fx.js';
import { creditWallet } from '../services/ledger.js';
import { pool } from '../db.js';
import { v4 as uuidv4 } from 'uuid';
const router = Router();
router.post('/quote', requireAuth, async (req, res, next) => {
    try {
        const schema = z.object({
            sourceCurrency: z.string(),
            targetCountry: z.enum(['IN', 'ZW']),
            targetChannel: z.enum(['ECOCASH', 'AGENT', 'PHONEPE']),
            amount: z.object({ currency: z.string(), value: z.number().positive() })
        });
        const q = schema.parse(req.body);
        const qres = quote({ ...q });
        const quoteId = uuidv4();
        res.json({ quoteId, rate: qres.rate.toFixed(6), fees: qres.fees, expiresAt: new Date(Date.now() + 120000).toISOString(), targetEstAmount: qres.targetEstAmount });
    }
    catch (e) {
        next(e);
    }
});
router.post('/initiate', requireAuth, async (req, res, next) => {
    try {
        const schema = z.object({ quoteId: z.string(), recipient: z.any(), sourceFunding: z.any() });
        const { quoteId } = schema.parse(req.body);
        const userId = req.user.id;
        // For demo: simulate funding success and issue 100 USDt
        const amountUsdT = 100;
        const txnId = uuidv4();
        await pool.query('BEGIN');
        const txn = await pool.query('INSERT INTO transactions (id, type, status, from_user, to_user, amount, currency) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id', [txnId, 'remit', 'funded', userId, null, amountUsdT, 'USDt']);
        await creditWallet(userId, 'USDt', amountUsdT);
        await pool.query('COMMIT');
        res.json({ transactionId: txn.rows[0].id, status: 'funded' });
    }
    catch (e) {
        await pool.query('ROLLBACK');
        next(e);
    }
});
export default router;
