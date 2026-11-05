import type { Prisma } from '@smart-parking/database';
import type { Request } from 'express';
import { authOf } from '../auth/require-auth';

/** Writes an audit row inside the caller's transaction, so the change and its record commit together. */
export function recordAudit(
  tx: Prisma.TransactionClient,
  req: Request,
  entry: {
    organizationId: string | null;
    action: string;
    targetType: string;
    targetId: string;
    metadata?: Prisma.InputJsonValue;
  },
) {
  return tx.auditLog.create({
    data: { ...entry, actorUserId: authOf(req).userId, requestId: String(req.id) },
  });
}
