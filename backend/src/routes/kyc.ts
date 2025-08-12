import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { requireAuth } from '../middleware/auth.js';
import { pool } from '../db.js';
import { v4 as uuidv4 } from 'uuid';
import { writeAuditLog } from '../services/audit.js';

const router = Router();

const storageDir = path.join(process.cwd(), 'storage', 'kyc');
fs.mkdirSync(storageDir, { recursive: true });
const upload = multer({ dest: storageDir, limits: { fileSize: 10 * 1024 * 1024 } });

router.post('/submit', requireAuth, upload.single('file'), async (req, res, next) => {
  try {
    const userId = (req as any).user.id as string;
    const { firstName, lastName, dob, address, docType, docNumber, docExpiry } = req.body as any;
    await pool.query('INSERT INTO user_profiles (user_id, first_name, last_name, dob, address) VALUES ($1,$2,$3,$4,$5) ON CONFLICT (user_id) DO UPDATE SET first_name = EXCLUDED.first_name, last_name = EXCLUDED.last_name, dob = EXCLUDED.dob, address = EXCLUDED.address', [userId, firstName ?? null, lastName ?? null, dob ?? null, address ?? null]);
    const docId = uuidv4();
    const fileInReq: any = req as any;
    const filePath = fileInReq.file ? path.relative(process.cwd(), fileInReq.file.path) : null;
    await pool.query('INSERT INTO kyc_documents (id, user_id, type, number, expiry, file_path, status) VALUES ($1,$2,$3,$4,$5,$6,$7)', [docId, userId, docType ?? 'unknown', docNumber ?? null, docExpiry ?? null, filePath, 'pending']);
    await pool.query('UPDATE users SET kyc_status = $2 WHERE id = $1', [userId, 'pending']);
    await writeAuditLog(userId, 'KYC_SUBMIT', 'kyc_document', docId, { docType });
    res.json({ kycStatus: 'pending', docId });
  } catch (e) { next(e); }
});

router.get('/status', requireAuth, async (req, res, next) => {
  try {
    const userId = (req as any).user.id as string;
    const u = await pool.query('SELECT kyc_status FROM users WHERE id = $1', [userId]);
    const docs = await pool.query('SELECT id, type, status, created_at FROM kyc_documents WHERE user_id = $1 ORDER BY created_at DESC', [userId]);
    res.json({ kycStatus: u.rows[0]?.kyc_status ?? 'unsubmitted', documents: docs.rows });
  } catch (e) { next(e); }
});

// Dev-only self-approve
router.post('/self-approve', requireAuth, async (req, res, next) => {
  try {
    if (process.env.NODE_ENV === 'production') return res.status(403).json({ error: { code: 'FORBIDDEN', message: 'Not allowed' } });
    const userId = (req as any).user.id as string;
    await pool.query('UPDATE users SET kyc_status = $2 WHERE id = $1', [userId, 'approved']);
    res.json({ kycStatus: 'approved' });
  } catch (e) { next(e); }
});

export default router;