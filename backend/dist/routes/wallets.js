import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { getBalance } from '../services/ledger.js';
const router = Router();
router.get('/me', requireAuth, async (req, res, next) => {
    try {
        const userId = req.user.id;
        const balance = await getBalance(userId, 'USDt');
        res.json({ balance: { currency: 'USDt', amount: balance } });
    }
    catch (e) {
        next(e);
    }
});
export default router;
