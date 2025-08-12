import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken } from '../services/jwt.js';

export async function requireAuth(req: Request, res: Response, next: NextFunction) {
  try {
    const header = req.headers['authorization'];
    if (!header || !header.startsWith('Bearer ')) return res.status(401).json({ error: { code: 'UNAUTHORIZED', message: 'Missing token' } });
    const token = header.substring('Bearer '.length);
    const payload = await verifyAccessToken(token);
    (req as any).user = { id: payload.sub };
    return next();
  } catch (e) {
    return res.status(401).json({ error: { code: 'UNAUTHORIZED', message: 'Invalid token' } });
  }
}