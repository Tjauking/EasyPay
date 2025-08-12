import { Router } from 'express';
const router = Router();
router.post('/phonepe', async (req, res) => {
    // TODO: verify signature headers
    res.json({ received: true });
});
router.post('/ecocash', async (req, res) => {
    // TODO: verify mTLS/signature per provider
    res.json({ received: true });
});
export default router;
