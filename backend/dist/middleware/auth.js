import { verifyAccessToken } from '../services/jwt.js';
export async function requireAuth(req, res, next) {
    try {
        const header = req.headers['authorization'];
        if (!header || !header.startsWith('Bearer '))
            return res.status(401).json({ error: { code: 'UNAUTHORIZED', message: 'Missing token' } });
        const token = header.substring('Bearer '.length);
        const payload = await verifyAccessToken(token);
        req.user = { id: payload.sub };
        return next();
    }
    catch (e) {
        return res.status(401).json({ error: { code: 'UNAUTHORIZED', message: 'Invalid token' } });
    }
}
