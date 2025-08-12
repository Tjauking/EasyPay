import { Router } from 'express';
import { z } from 'zod';
import { createUser, findUserByEmail } from '../services/users.js';
import bcrypt from 'bcryptjs';
import { generateAccessToken } from '../services/jwt.js';

const router = Router();

router.post('/register', async (req, res, next) => {
  try {
    const schema = z.object({ email: z.string().email(), phone: z.string().optional(), password: z.string().min(8) });
    const { email, phone, password } = schema.parse(req.body);
    const existing = await findUserByEmail(email);
    if (existing) return res.status(409).json({ error: { code: 'DUPLICATE', message: 'Email already registered' } });
    const user = await createUser(email, phone ?? null, password);
    return res.json({ userId: user.id, requiresKyc: true });
  } catch (e) { next(e); }
});

router.post('/login', async (req, res, next) => {
  try {
    const schema = z.object({ email: z.string().email(), password: z.string() });
    const { email, password } = schema.parse(req.body);
    const user = await findUserByEmail(email);
    if (!user) return res.status(401).json({ error: { code: 'INVALID_CREDENTIALS', message: 'Invalid credentials' } });
    const ok = await bcrypt.compare(password, user.password_hash);
    if (!ok) return res.status(401).json({ error: { code: 'INVALID_CREDENTIALS', message: 'Invalid credentials' } });
    const token = await generateAccessToken(user.id, { email: user.email });
    return res.json({ accessToken: token });
  } catch (e) { next(e); }
});

export default router;