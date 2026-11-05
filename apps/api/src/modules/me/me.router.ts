import type { MeResponse } from '@smart-parking/contracts';
import type { Database } from '@smart-parking/database';
import { Router } from 'express';
import { platformRoleOf } from '../access/access';
import { authOf } from '../auth/require-auth';

/** GET /v1/me — the caller's own active grants (drives the org/facility switcher). */
export function meRouter(db: Database) {
  return Router().get('/', async (req, res) => {
    const { userId } = authOf(req);
    const [platformRole, orgMemberships, facilityMemberships] = await Promise.all([
      platformRoleOf(db, userId),
      db.orgMembership.findMany({
        where: { userId, revokedAt: null },
        select: { role: true, organization: { select: { id: true, displayName: true } } },
        orderBy: { createdAt: 'asc' },
      }),
      db.facilityMembership.findMany({
        where: { userId, revokedAt: null },
        select: {
          role: true,
          facility: { select: { id: true, organizationId: true, name: true } },
        },
        orderBy: { createdAt: 'asc' },
      }),
    ]);

    const body: MeResponse = {
      userId,
      platformRole,
      organizations: orgMemberships.map((m) => ({ ...m.organization, role: m.role })),
      facilities: facilityMemberships.map((m) => ({ ...m.facility, role: m.role })),
    };
    res.json(body);
  });
}
