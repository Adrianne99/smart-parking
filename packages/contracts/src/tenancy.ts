import { z } from 'zod';
import { isoDateTimeSchema, pageQuerySchema, uuidSchema } from './common';

// Must equal the Prisma enums in packages/database (enforced by apps/api tests).
export const platformRoleSchema = z.enum(['SUPER_ADMIN', 'SUPPORT', 'SALES', 'AUDITOR']);
export const orgRoleSchema = z.enum(['OWNER', 'MANAGER', 'AUDITOR']);
export const facilityRoleSchema = z.enum(['MANAGER', 'ATTENDANT', 'CASHIER', 'AUDITOR']);
export const onboardingStatusSchema = z.enum([
  'PENDING_DOCUMENTS',
  'UNDER_REVIEW',
  'TECHNICAL_SETUP',
  'PILOT_READY',
  'ACTIVE',
  'SUSPENDED',
]);
export const facilityTypeSchema = z.enum([
  'INDEPENDENT_LOT',
  'MALL',
  'CONDOMINIUM',
  'COMMERCIAL_BUILDING',
  'HOSPITAL',
  'OTHER',
]);
export const facilityVisibilitySchema = z.enum(['PUBLIC', 'PRIVATE']);
export const facilityStatusSchema = z.enum(['ACTIVE', 'PAUSED']);

/** List endpoints with id-ordered cursors. */
export const idPageQuerySchema = pageQuerySchema.extend({ cursor: uuidSchema.optional() });

const name = z.string().trim().min(1).max(200);

// GET /v1/me — authenticated; returns only the caller's own active grants.
export const meResponseSchema = z.object({
  userId: uuidSchema,
  platformRole: platformRoleSchema.nullable(),
  organizations: z.array(
    z.object({ id: uuidSchema, displayName: z.string(), role: orgRoleSchema }),
  ),
  facilities: z.array(
    z.object({
      id: uuidSchema,
      organizationId: uuidSchema,
      name: z.string(),
      role: facilityRoleSchema,
    }),
  ),
});

export const organizationSchema = z.object({
  id: uuidSchema,
  legalName: z.string(),
  displayName: z.string(),
  onboardingStatus: onboardingStatusSchema,
  createdAt: isoDateTimeSchema,
});

// POST /v1/organizations — platform SUPER_ADMIN only.
export const createOrganizationRequestSchema = z.object({
  legalName: name,
  displayName: name,
  /** Supabase Auth user id of the operator's owner. */
  ownerUserId: uuidSchema,
});

export const facilitySchema = z.object({
  id: uuidSchema,
  organizationId: uuidSchema,
  name: z.string(),
  facilityType: facilityTypeSchema,
  visibility: facilityVisibilitySchema,
  status: facilityStatusSchema,
  timezone: z.string(),
  addressLine: z.string().nullable(),
  createdAt: isoDateTimeSchema,
});

// POST /v1/organizations/:organizationId/facilities — org OWNER or MANAGER.
// The owning organization comes from the path (authorized), never from the body.
export const createFacilityRequestSchema = z.object({
  name,
  facilityType: facilityTypeSchema,
  addressLine: z.string().trim().max(300).optional(),
});

export const facilityMembershipSchema = z.object({
  facilityId: uuidSchema,
  userId: uuidSchema,
  role: facilityRoleSchema,
  createdAt: isoDateTimeSchema,
});

// POST /v1/facilities/:facilityId/memberships — grants or re-activates staff access.
export const grantFacilityMembershipRequestSchema = z.object({
  userId: uuidSchema,
  role: facilityRoleSchema,
});

export type MeResponse = z.infer<typeof meResponseSchema>;
export type Organization = z.infer<typeof organizationSchema>;
export type CreateOrganizationRequest = z.infer<typeof createOrganizationRequestSchema>;
export type Facility = z.infer<typeof facilitySchema>;
export type CreateFacilityRequest = z.infer<typeof createFacilityRequestSchema>;
export type FacilityMembership = z.infer<typeof facilityMembershipSchema>;
export type GrantFacilityMembershipRequest = z.infer<typeof grantFacilityMembershipRequestSchema>;
