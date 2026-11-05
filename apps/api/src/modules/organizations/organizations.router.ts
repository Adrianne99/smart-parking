import {
  createFacilityRequestSchema,
  createOrganizationRequestSchema,
  idPageQuerySchema,
  uuidSchema,
} from '@smart-parking/contracts';
import type { Database } from '@smart-parking/database';
import { Router } from 'express';
import { z } from 'zod';
import { ApiError } from '../../http/errors';
import { afterCursor, toPage } from '../../http/pagination';
import { notFound, platformRoleOf, requirePermission, resolveOrgAccess } from '../access/access';
import { recordAudit } from '../access/audit';
import { toFacilityDto, toOrganizationDto } from '../access/dto';
import { authOf } from '../auth/require-auth';

const orgParams = z.object({ organizationId: uuidSchema });

export function organizationsRouter(db: Database) {
  const router = Router();

  // Platform staff see all operator accounts (B2B records, not drivers); others see their own.
  router.get('/', async (req, res) => {
    const { userId } = authOf(req);
    const { cursor, limit } = idPageQuerySchema.parse(req.query);
    const scope = (await platformRoleOf(db, userId))
      ? {}
      : { memberships: { some: { userId, revokedAt: null } } };
    const rows = await db.organization.findMany({
      where: { ...scope, ...afterCursor(cursor) },
      orderBy: { id: 'asc' },
      take: limit + 1,
    });
    res.json(toPage(rows.map(toOrganizationDto), limit));
  });

  router.post('/', async (req, res) => {
    const { userId } = authOf(req);
    if ((await platformRoleOf(db, userId)) !== 'SUPER_ADMIN') {
      throw new ApiError('FORBIDDEN', 'Only platform administrators can create organizations.');
    }
    const { legalName, displayName, ownerUserId } = createOrganizationRequestSchema.parse(req.body);

    const organization = await db.$transaction(async (tx) => {
      const created = await tx.organization.create({ data: { legalName, displayName } });
      await tx.orgMembership.create({
        data: { organizationId: created.id, userId: ownerUserId, role: 'OWNER' },
      });
      await recordAudit(tx, req, {
        organizationId: created.id,
        action: 'organization.created',
        targetType: 'organization',
        targetId: created.id,
        metadata: { ownerUserId },
      });
      return created;
    });
    res.status(201).json(toOrganizationDto(organization));
  });

  // Org-level members see every facility; facility-only staff see just their own.
  router.get('/:organizationId/facilities', async (req, res) => {
    const { userId } = authOf(req);
    const { organizationId } = orgParams.parse(req.params);
    const { cursor, limit } = idPageQuerySchema.parse(req.query);
    const access = await resolveOrgAccess(db, userId, organizationId);
    if (!access) throw notFound('Organization');

    const scope = access.permissions.has('facility:read')
      ? { organizationId }
      : { organizationId, memberships: { some: { userId, revokedAt: null } } };
    const rows = await db.facility.findMany({
      where: { ...scope, ...afterCursor(cursor) },
      orderBy: { id: 'asc' },
      take: limit + 1,
    });
    res.json(toPage(rows.map(toFacilityDto), limit));
  });

  router.post('/:organizationId/facilities', async (req, res) => {
    const { organizationId } = orgParams.parse(req.params);
    const access = await resolveOrgAccess(db, authOf(req).userId, organizationId);
    if (!access) throw notFound('Organization');
    requirePermission(access, 'facility:create', 'FORBIDDEN');
    // organizationId comes from the authorized path; any organizationId in the body is ignored.
    const body = createFacilityRequestSchema.parse(req.body);

    const facility = await db.$transaction(async (tx) => {
      const created = await tx.facility.create({ data: { ...body, organizationId } });
      await recordAudit(tx, req, {
        organizationId,
        action: 'facility.created',
        targetType: 'facility',
        targetId: created.id,
      });
      return created;
    });
    res.status(201).json(toFacilityDto(facility));
  });

  return router;
}
