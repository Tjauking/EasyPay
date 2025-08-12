import { pool } from '../db.js';
import { v4 as uuidv4 } from 'uuid';

export async function writeAuditLog(actorUserId: string | null, action: string, entity?: string, entityId?: string, details?: any) {
  const id = uuidv4();
  await pool.query('INSERT INTO audit_logs (id, actor_user_id, action, entity, entity_id, details) VALUES ($1, $2, $3, $4, $5, $6)', [
    id,
    actorUserId,
    action,
    entity ?? null,
    entityId ?? null,
    details ? JSON.stringify(details) : null,
  ]);
}