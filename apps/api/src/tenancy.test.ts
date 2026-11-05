// Gate P1: cross-tenant reads/writes are denied. Runs against a real Postgres (TEST_DATABASE_URL).
import { randomUUID } from 'node:crypto';
import {
  apiErrorBodySchema,
  facilityRoleSchema,
  facilitySchema,
  meResponseSchema,
  orgRoleSchema,
  pageOf,
  platformRoleSchema,
  organizationSchema,
} from '@smart-parking/contracts';
import {
  createPrismaClient,
  demo,
  FacilityRole,
  OrgRole,
  PlatformRole,
  seedDemoTenants,
  type Database,
} from '@smart-parking/database';
import { pino } from 'pino';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createApp } from './app';
import { loadEnv } from './config/env';
import { testEnvVars, testVerifier, tokenFor } from './test-support';

const { users } = demo;

describe('contract enums match the database enums', () => {
  it.each([
    [platformRoleSchema.options, Object.values(PlatformRole)],
    [orgRoleSchema.options, Object.values(OrgRole)],
    [facilityRoleSchema.options, Object.values(FacilityRole)],
  ])('%j', (contract, database) => expect(contract).toEqual(database));
});

const url = process.env.TEST_DATABASE_URL;

describe.skipIf(!url)('tenant isolation against the database', () => {
  let db: Database;
  let app: ReturnType<typeof createApp>;

  beforeAll(async () => {
    db = createPrismaClient(url!);
    await seedDemoTenants(db);
    const env = loadEnv({ ...testEnvVars, DATABASE_URL: url });
    app = createApp({
      env,
      logger: pino({ level: 'silent' }),
      db,
      verifyAccessToken: testVerifier,
    });
  });
  afterAll(() => db?.$disconnect());

  const as = async (userId: string) => ({ Authorization: `Bearer ${await tokenFor(userId)}` });
  const get = async (userId: string, path: string) =>
    request(app)
      .get(path)
      .set(await as(userId));
  const post = async (userId: string, path: string, body: object) =>
    request(app)
      .post(path)
      .set(await as(userId))
      .send(body);
  const errorCode = (res: request.Response) => apiErrorBodySchema.parse(res.body).error.code;
  const facilityPage = pageOf(facilitySchema);
  const newFacility = { name: 'Test Lot', facilityType: 'INDEPENDENT_LOT' };

  describe('authentication', () => {
    it('rejects requests without a token', async () => {
      const res = await request(app).get('/v1/me');
      expect(res.status).toBe(401);
      expect(errorCode(res)).toBe('UNAUTHENTICATED');
    });

    it('rejects a malformed path id before touching the database', async () => {
      const res = await get(users.ownerA, '/v1/facilities/not-a-uuid');
      expect(res.status).toBe(400);
    });
  });

  describe('GET /v1/me', () => {
    it('returns only the caller’s own grants', async () => {
      const owner = meResponseSchema.parse((await get(users.ownerA, '/v1/me')).body);
      expect(owner.organizations).toEqual([
        { id: demo.orgA, displayName: 'Makati Parkways', role: 'OWNER' },
      ]);
      expect(owner.facilities).toEqual([]);

      const attendant = meResponseSchema.parse((await get(users.attendantA1, '/v1/me')).body);
      expect(attendant.organizations).toEqual([]);
      expect(attendant.facilities.map((f) => [f.id, f.role])).toEqual([
        [demo.facilityA1, 'ATTENDANT'],
      ]);
    });
  });

  describe('operator A vs operator B', () => {
    it('lists only the caller’s organizations', async () => {
      const page = pageOf(organizationSchema).parse(
        (await get(users.ownerA, '/v1/organizations')).body,
      );
      expect(page.data.map((o) => o.id)).toEqual([demo.orgA]);

      const outsider = pageOf(organizationSchema).parse(
        (await get(users.outsider, '/v1/organizations')).body,
      );
      expect(outsider.data).toEqual([]);
    });

    it('cannot read B’s facility or facility list, and gets the same 404 as a nonexistent id', async () => {
      const crossTenant = await get(users.ownerA, `/v1/facilities/${demo.facilityB1}`);
      const nonexistent = await get(users.ownerA, `/v1/facilities/${randomUUID()}`);
      expect(crossTenant.status).toBe(404);
      // No existence oracle: a real-but-foreign id is indistinguishable from a random one.
      expect(apiErrorBodySchema.parse(crossTenant.body).error.message).toBe(
        apiErrorBodySchema.parse(nonexistent.body).error.message,
      );

      const list = await get(users.ownerA, `/v1/organizations/${demo.orgB}/facilities`);
      expect(list.status).toBe(404);
    });

    it('cannot create a facility in B or grant staff at B’s facility', async () => {
      const before = await db.facility.count({ where: { organizationId: demo.orgB } });

      const create = await post(
        users.ownerA,
        `/v1/organizations/${demo.orgB}/facilities`,
        newFacility,
      );
      expect(create.status).toBe(404);

      const grantee = randomUUID();
      const grant = await post(users.ownerA, `/v1/facilities/${demo.facilityB1}/memberships`, {
        userId: grantee,
        role: 'ATTENDANT',
      });
      expect(grant.status).toBe(404);

      expect(await db.facility.count({ where: { organizationId: demo.orgB } })).toBe(before);
      expect(await db.facilityMembership.count({ where: { userId: grantee } })).toBe(0);
    });

    it('ignores an organizationId injected in the request body', async () => {
      const res = await post(users.ownerA, `/v1/organizations/${demo.orgA}/facilities`, {
        ...newFacility,
        organizationId: demo.orgB,
      });
      expect(res.status).toBe(201);
      expect(facilitySchema.parse(res.body).organizationId).toBe(demo.orgA);
      expect(facilitySchema.parse(res.body).visibility).toBe('PRIVATE');
    });
  });

  describe('facility-scoped staff', () => {
    it('lets an attendant see only their assigned facility', async () => {
      expect((await get(users.attendantA1, `/v1/facilities/${demo.facilityA1}`)).status).toBe(200);
      expect((await get(users.attendantA1, `/v1/facilities/${demo.facilityA2}`)).status).toBe(404);

      const list = facilityPage.parse(
        (await get(users.attendantA1, `/v1/organizations/${demo.orgA}/facilities`)).body,
      );
      expect(list.data.map((f) => f.id)).toEqual([demo.facilityA1]);
    });

    it('forbids an attendant from granting staff or creating facilities', async () => {
      const grant = await post(users.attendantA1, `/v1/facilities/${demo.facilityA1}/memberships`, {
        userId: randomUUID(),
        role: 'CASHIER',
      });
      expect([grant.status, errorCode(grant)]).toEqual([403, 'FORBIDDEN_FACILITY']);

      const create = await post(
        users.attendantA1,
        `/v1/organizations/${demo.orgA}/facilities`,
        newFacility,
      );
      expect([create.status, errorCode(create)]).toEqual([403, 'FORBIDDEN']);
    });

    it('lets a facility manager grant staff at their facility only, never another manager', async () => {
      const staff = await post(
        users.facilityManagerA1,
        `/v1/facilities/${demo.facilityA1}/memberships`,
        {
          userId: randomUUID(),
          role: 'CASHIER',
        },
      );
      expect(staff.status).toBe(201);

      const peer = await post(
        users.facilityManagerA1,
        `/v1/facilities/${demo.facilityA1}/memberships`,
        {
          userId: randomUUID(),
          role: 'MANAGER',
        },
      );
      expect([peer.status, errorCode(peer)]).toEqual([403, 'FORBIDDEN_FACILITY']);

      const elsewhere = await post(
        users.facilityManagerA1,
        `/v1/facilities/${demo.facilityA2}/memberships`,
        {
          userId: randomUUID(),
          role: 'CASHIER',
        },
      );
      expect(elsewhere.status).toBe(404);
    });

    it('revokes access on the very next request', async () => {
      const cashier = randomUUID();
      const path = `/v1/facilities/${demo.facilityA2}`;
      expect(
        (await post(users.ownerA, `${path}/memberships`, { userId: cashier, role: 'CASHIER' }))
          .status,
      ).toBe(201);
      expect((await get(cashier, path)).status).toBe(200);

      const revoke = await request(app)
        .delete(`${path}/memberships/${cashier}`)
        .set(await as(users.ownerA));
      expect(revoke.status).toBe(204);
      expect((await get(cashier, path)).status).toBe(404);
    });
  });

  describe('platform staff', () => {
    it('only a SUPER_ADMIN creates organizations, atomically with owner grant and audit', async () => {
      const body = {
        legalName: 'Pasig Parking Co.',
        displayName: 'Pasig Parking',
        ownerUserId: randomUUID(),
      };
      expect((await post(users.ownerA, '/v1/organizations', body)).status).toBe(403);

      const res = await post(users.platformAdmin, '/v1/organizations', body);
      expect(res.status).toBe(201);
      const org = organizationSchema.parse(res.body);
      expect(org.onboardingStatus).toBe('PENDING_DOCUMENTS');

      const owner = await db.orgMembership.findFirstOrThrow({ where: { organizationId: org.id } });
      expect([owner.userId, owner.role]).toEqual([body.ownerUserId, 'OWNER']);
      const audit = await db.auditLog.findFirstOrThrow({ where: { targetId: org.id } });
      expect([audit.action, audit.actorUserId, audit.requestId]).toEqual([
        'organization.created',
        users.platformAdmin,
        res.headers['x-request-id'],
      ]);
    });

    it('platform roles get no operator-tenant data access', async () => {
      expect((await get(users.platformAdmin, `/v1/facilities/${demo.facilityA1}`)).status).toBe(
        404,
      );
    });
  });

  describe('database-level guarantees', () => {
    it('keeps the audit log append-only', async () => {
      await expect(db.auditLog.updateMany({ data: { action: 'tampered' } })).rejects.toThrow();
      await expect(db.auditLog.deleteMany()).rejects.toThrow();
    });

    it('rejects a facility membership pointing at another tenant’s facility', async () => {
      await expect(
        db.facilityMembership.create({
          data: {
            organizationId: demo.orgB,
            facilityId: demo.facilityA1,
            userId: randomUUID(),
            role: 'ATTENDANT',
          },
        }),
      ).rejects.toThrow();
    });
  });

  it('paginates facility lists with a cursor', async () => {
    const path = `/v1/organizations/${demo.orgA}/facilities?limit=1`;
    const first = facilityPage.parse((await get(users.ownerA, path)).body);
    expect(first.data).toHaveLength(1);
    expect(first.page.nextCursor).toBe(first.data[0]!.id);

    const second = facilityPage.parse(
      (await get(users.ownerA, `${path}&cursor=${first.page.nextCursor}`)).body,
    );
    expect(second.data[0]!.id > first.data[0]!.id).toBe(true);
  });
});
