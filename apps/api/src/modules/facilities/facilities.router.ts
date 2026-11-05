import { grantFacilityMembershipRequestSchema, uuidSchema } from '@smart-parking/contracts';
import type { Database } from '@smart-parking/database';
import { Router } from 'express';
import { z } from 'zod';
import { notFound, requirePermission, resolveFacilityAccess } from '../access/access';
import { recordAudit } from '../access/audit';
import { toFacilityDto, toFacilityMembershipDto } from '../access/dto';
import { authOf } from '../auth/require-auth';

const facilityParams = z.object({ facilityId: uuidSchema });
const memberParams = facilityParams.extend({ userId: uuidSchema });

export function facilitiesRouter(db: Database) {
  const router = Router();

  async function accessOrNotFound(userId: string, facilityId: string) {
    const access = await resolveFacilityAccess(db, userId, facilityId);
    if (!access) throw notFound('Facility');
    return access;
  }

  router.get('/:facilityId', async (req, res) => {
    const { facilityId } = facilityParams.parse(req.params);
    const access = await accessOrNotFound(authOf(req).userId, facilityId);
    requirePermission(access, 'facility:read', 'FORBIDDEN_FACILITY');
    const facility = await db.facility.findUniqueOrThrow({ where: { id: facilityId } });
    res.json(toFacilityDto(facility));
  });

  // Grant (or re-activate) staff access to this facility.
  router.post('/:facilityId/memberships', async (req, res) => {
    const { facilityId } = facilityParams.parse(req.params);
    const access = await accessOrNotFound(authOf(req).userId, facilityId);
    requirePermission(access, 'staff:manage', 'FORBIDDEN_FACILITY');
    const { userId, role } = grantFacilityMembershipRequestSchema.parse(req.body);
    if (role === 'MANAGER') requirePermission(access, 'staff:manageManagers', 'FORBIDDEN_FACILITY');

    const membership = await db.$transaction(async (tx) => {
      const existing = await tx.facilityMembership.findUnique({
        where: { facilityId_userId: { facilityId, userId } },
      });
      // Changing an existing manager's grant needs the same authority as creating one.
      if (existing?.role === 'MANAGER' && existing.revokedAt === null) {
        requirePermission(access, 'staff:manageManagers', 'FORBIDDEN_FACILITY');
      }
      const saved = await tx.facilityMembership.upsert({
        where: { facilityId_userId: { facilityId, userId } },
        update: { role, revokedAt: null },
        create: { facilityId, userId, role, organizationId: access.organizationId },
      });
      await recordAudit(tx, req, {
        organizationId: access.organizationId,
        action: 'facility_membership.granted',
        targetType: 'facility_membership',
        targetId: saved.id,
        metadata: { facilityId, userId, role, previousRole: existing?.role ?? null },
      });
      return saved;
    });
    res.status(201).json(toFacilityMembershipDto(membership));
  });

  // Revocation takes effect on the target's next request (membership is re-read every call).
  router.delete('/:facilityId/memberships/:userId', async (req, res) => {
    const { facilityId, userId } = memberParams.parse(req.params);
    const access = await accessOrNotFound(authOf(req).userId, facilityId);
    requirePermission(access, 'staff:manage', 'FORBIDDEN_FACILITY');

    await db.$transaction(async (tx) => {
      const membership = await tx.facilityMembership.findUnique({
        where: { facilityId_userId: { facilityId, userId } },
      });
      if (!membership || membership.revokedAt) throw notFound('Membership');
      if (membership.role === 'MANAGER') {
        requirePermission(access, 'staff:manageManagers', 'FORBIDDEN_FACILITY');
      }
      await tx.facilityMembership.update({
        where: { id: membership.id },
        data: { revokedAt: new Date() },
      });
      await recordAudit(tx, req, {
        organizationId: access.organizationId,
        action: 'facility_membership.revoked',
        targetType: 'facility_membership',
        targetId: membership.id,
        metadata: { facilityId, userId, role: membership.role },
      });
    });
    res.status(204).end();
  });

  return router;
}
