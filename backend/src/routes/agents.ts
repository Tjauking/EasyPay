import { Router } from 'express';
import { z } from 'zod';
import { verifyQrJws } from '../services/qr.js';

const router = Router();

router.post('/qr/validate', async (req, res, next) => {
  try {
    const schema = z.object({ qrJws: z.string() });
    const { qrJws } = schema.parse(req.body);
    const payload = await verifyQrJws(qrJws);
    res.json({ valid: true, ...payload });
  } catch (e) {
    res.status(400).json({ valid: false, error: 'INVALID_QR' });
  }
});

export default router;