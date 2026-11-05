// Tenant authorization (ADR-001). Every scoped route resolves access here before touching data.
// No membership => 404 (callers can't probe other tenants); membership without the permission => 403.
import type { Database, FacilityRole, OrgRole, PlatformRole } from '@smart-parking/database';
import { ApiError } from '../../http/errors';

export type Permission =
  | 'org:read'
  | 'facility:create'
  | 'facility:read'
  | 'staff:manage'
  /** Granting or revoking the facility MANAGER role: org owners only, so managers can't mint peers. */
  | 'staff:manageManagers';

const ORG_ROLE_PERMISSIONS: Record<OrgRole, readonly Permission[]> = {
  OWNER: ['org:read', 'facility:create', 'facility:read', 'staff:manage', 'staff:manageManagers'],
  MANAGER: ['org:read', 'facility:create', 'facility:read', 'staff:manage'],
  AUDITOR: ['org:read', 'facility:read'],
};

const FACILITY_ROLE_PERMISSIONS: Record<FacilityRole, readonly Permission[]> = {
  MANAGER: ['facility:read', 'staff:manage'],
  ATTENDANT: ['facility:read'],
  CASHIER: ['facility:read'],
  AUDITOR: ['facility:read'],
};

const active = (userId: string) => ({ userId, revokedAt: null });

export async function platformRoleOf(db: Database, userId: string): Promise<PlatformRole | null> {
  const grant = await db.platformMembership.findFirst({ where: active(userId) });
  return grant?.role ?? null;
}

export type OrgAccess = { permissions: ReadonlySet<Permission> };

/** Null when the caller has no active org or facility membership in this organization. */
export async function resolveOrgAccess(
  db: Database,
  userId: string,
  organizationId: string,
): Promise<OrgAccess | null> {
  const [orgMembership, facilityMembership] = await Promise.all([
    db.orgMembership.findFirst({ where: { organizationId, ...active(userId) } }),
    db.facilityMembership.findFirst({ where: { organizationId, ...active(userId) } }),
  ]);
  if (!orgMembership && !facilityMembership) return null;
  return { permissions: new Set(orgMembership ? ORG_ROLE_PERMISSIONS[orgMembership.role] : []) };
}

export type FacilityAccess = {
  facilityId: string;
  organizationId: string;
  permissions: ReadonlySet<Permission>;
};

/** Null when the facility doesn't exist or the caller has no active membership reaching it. */
export async function resolveFacilityAccess(
  db: Database,
  userId: string,
  facilityId: string,
): Promise<FacilityAccess | null> {
  const facility = await db.facility.findUnique({
    where: { id: facilityId },
    select: {
      organizationId: true,
      memberships: { where: active(userId), select: { role: true } },
      organization: {
        select: { memberships: { where: active(userId), select: { role: true } } },
      },
    },
  });
  if (!facility) return null;

  const permissions = new Set<Permission>([
    ...facility.organization.memberships.flatMap((m) => ORG_ROLE_PERMISSIONS[m.role]),
    ...facility.memberships.flatMap((m) => FACILITY_ROLE_PERMISSIONS[m.role]),
  ]);
  if (permissions.size === 0) return null;
  return { facilityId, organizationId: facility.organizationId, permissions };
}

export function requirePermission(
  access: { permissions: ReadonlySet<Permission> },
  permission: Permission,
  code: 'FORBIDDEN' | 'FORBIDDEN_FACILITY',
): void {
  if (!access.permissions.has(permission)) {
    throw new ApiError(code, 'You do not have permission to do this.');
  }
}

export const notFound = (what: 'Organization' | 'Facility' | 'Membership') =>
  new ApiError('NOT_FOUND', `${what} not found.`);
