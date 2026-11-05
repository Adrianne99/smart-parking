import type {
  Facility as FacilityDto,
  FacilityMembership as FacilityMembershipDto,
  Organization as OrganizationDto,
} from '@smart-parking/contracts';
import type { Facility, FacilityMembership, Organization } from '@smart-parking/database';

// Explicit field mapping: database columns never reach clients by accident.
export const toOrganizationDto = (o: Organization): OrganizationDto => ({
  id: o.id,
  legalName: o.legalName,
  displayName: o.displayName,
  onboardingStatus: o.onboardingStatus,
  createdAt: o.createdAt.toISOString(),
});

export const toFacilityDto = (f: Facility): FacilityDto => ({
  id: f.id,
  organizationId: f.organizationId,
  name: f.name,
  facilityType: f.facilityType,
  visibility: f.visibility,
  status: f.status,
  timezone: f.timezone,
  addressLine: f.addressLine,
  createdAt: f.createdAt.toISOString(),
});

export const toFacilityMembershipDto = (m: FacilityMembership): FacilityMembershipDto => ({
  facilityId: m.facilityId,
  userId: m.userId,
  role: m.role,
  createdAt: m.createdAt.toISOString(),
});
