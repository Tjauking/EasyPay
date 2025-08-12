import { Router } from 'express';
import { z } from 'zod';
import { requireAuth } from '../middleware/auth.js';
import { quote } from '../services/fx.js';
import { creditWallet } from '../services/ledger.js';
import { pool } from '../db.js';
import { v4 as uuidv4 } from 'uuid';
import { enforceLimits } from '../services/limits.js';
import { amlScreenTransaction } from '../services/aml.js';
import { writeAuditLog } from '../services/audit.js';
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
        const schema = z.object({ quoteId: z.string(), recipient: z.any(), sourceFunding: z.any(), amountUsd: z.number().positive().default(100).optional() });
        const parsed = schema.parse(req.body);
        const amountUsd = parsed.amountUsd ?? 100;
        const userId = req.user.id;
        const userRes = await pool.query('SELECT kyc_status, email FROM users WHERE id = $1', [userId]);
        const kycStatus = userRes.rows[0]?.kyc_status ?? 'unsubmitted';
        await enforceLimits(userId, kycStatus, amountUsd);
        const txnId = uuidv4();
        await pool.query('BEGIN');
        const txn = await pool.query('INSERT INTO transactions (id, type, status, from_user, to_user, amount, currency) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id', [txnId, 'remit', 'funded', userId, null, amountUsd, 'USDt']);
        await amlScreenTransaction(userId, txnId, amountUsd, kycStatus);
        await creditWallet(userId, 'USDt', amountUsd);
        await writeAuditLog(userId, 'TRANSFER_INITIATE', 'transaction', txnId, { amountUsd });
        await pool.query('COMMIT');
        res.json({ transactionId: txn.rows[0].id, status: 'funded' });
    }
    catch (e) {
        await pool.query('ROLLBACK');
        next(e);
    }
});
export default router;
