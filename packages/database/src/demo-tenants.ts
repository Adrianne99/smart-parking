import type { Database } from './index';

/**
 * Two operator organizations with two facilities each, plus one user per role.
 * Fixed UUIDs so tests and local tooling can refer to them. These are NOT Supabase Auth users;
 * to sign in locally, grant your own auth user a membership (see packages/database/README.md).
 */
export const demo = {
  users: {
    platformAdmin: '00000000-0000-4000-8000-000000000001',
    ownerA: '00000000-0000-4000-8000-0000000000a1',
    managerA: '00000000-0000-4000-8000-0000000000a2',
    facilityManagerA1: '00000000-0000-4000-8000-0000000000a3',
    attendantA1: '00000000-0000-4000-8000-0000000000a4',
    ownerB: '00000000-0000-4000-8000-0000000000b1',
    outsider: '00000000-0000-4000-8000-0000000000ff',
  },
  orgA: '10000000-0000-4000-8000-00000000000a',
  orgB: '10000000-0000-4000-8000-00000000000b',
  facilityA1: '20000000-0000-4000-8000-0000000000a1',
  facilityA2: '20000000-0000-4000-8000-0000000000a2',
  facilityB1: '20000000-0000-4000-8000-0000000000b1',
  facilityB2: '20000000-0000-4000-8000-0000000000b2',
} as const;

/** Idempotent: safe to run repeatedly against an empty or already-seeded database. */
export async function seedDemoTenants(db: Database) {
  const { users } = demo;
  await db.$transaction(async (tx) => {
    await tx.platformMembership.upsert({
      where: { userId: users.platformAdmin },
      update: {},
      create: { userId: users.platformAdmin, role: 'SUPER_ADMIN' },
    });

    const orgs = [
      { id: demo.orgA, legalName: 'Makati Parkways Inc.', displayName: 'Makati Parkways' },
      { id: demo.orgB, legalName: 'BGC Lots Corporation', displayName: 'BGC Lots' },
    ];
    for (const org of orgs) {
      await tx.organization.upsert({ where: { id: org.id }, update: {}, create: org });
    }

    const facilities = [
      {
        id: demo.facilityA1,
        organizationId: demo.orgA,
        name: 'Ayala Ave Open Lot',
        facilityType: 'INDEPENDENT_LOT',
      },
      {
        id: demo.facilityA2,
        organizationId: demo.orgA,
        name: 'Legaspi Tower Basement',
        facilityType: 'COMMERCIAL_BUILDING',
      },
      {
        id: demo.facilityB1,
        organizationId: demo.orgB,
        name: 'High Street Annex',
        facilityType: 'MALL',
      },
      {
        id: demo.facilityB2,
        organizationId: demo.orgB,
        name: 'Forbes Residences',
        facilityType: 'CONDOMINIUM',
      },
    ] as const;
    for (const facility of facilities) {
      await tx.facility.upsert({ where: { id: facility.id }, update: {}, create: facility });
    }

    const orgMembers = [
      { organizationId: demo.orgA, userId: users.ownerA, role: 'OWNER' },
      { organizationId: demo.orgA, userId: users.managerA, role: 'MANAGER' },
      { organizationId: demo.orgB, userId: users.ownerB, role: 'OWNER' },
    ] as const;
    for (const m of orgMembers) {
      await tx.orgMembership.upsert({
        where: { organizationId_userId: { organizationId: m.organizationId, userId: m.userId } },
        update: { revokedAt: null, role: m.role },
        create: m,
      });
    }

    const facilityMembers = [
      {
        organizationId: demo.orgA,
        facilityId: demo.facilityA1,
        userId: users.facilityManagerA1,
        role: 'MANAGER',
      },
      {
        organizationId: demo.orgA,
        facilityId: demo.facilityA1,
        userId: users.attendantA1,
        role: 'ATTENDANT',
      },
    ] as const;
    for (const m of facilityMembers) {
      await tx.facilityMembership.upsert({
        where: { facilityId_userId: { facilityId: m.facilityId, userId: m.userId } },
        update: { revokedAt: null, role: m.role },
        create: m,
      });
    }
  });
}
