import { apiErrorBodySchema, healthResponseSchema } from '@smart-parking/contracts';
import { createPrismaClient } from '@smart-parking/database';
import express from 'express';
import { pino } from 'pino';
import request from 'supertest';
import { afterAll, describe, expect, it } from 'vitest';
import { z } from 'zod';
import { createApp } from './app';
import { loadEnv } from './config/env';
import { ApiError, errorHandler } from './http/errors';
import { requestLogger } from './http/logger';
import { testEnvVars, testVerifier } from './test-support';

const logger = pino({ level: 'silent' });
const env = loadEnv({ ...testEnvVars, CORS_ALLOWED_ORIGINS: 'http://localhost:3000' });
// Points at a closed port: these tests must not need a database.
const db = createPrismaClient(env.DATABASE_URL);
const app = createApp({ env, logger, db, verifyAccessToken: testVerifier });
afterAll(() => db.$disconnect());

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

function expectErrorEnvelope(res: request.Response, status: number, code: string) {
  expect(res.status).toBe(status);
  const body = apiErrorBodySchema.parse(res.body);
  expect(body.error.code).toBe(code);
  expect(body.error.requestId).toBe(res.headers['x-request-id']);
  return body;
}

describe('GET /v1/health', () => {
  it('returns the health contract with a request ID and no caching', async () => {
    const res = await request(app).get('/v1/health');
    expect(res.status).toBe(200);
    expect(healthResponseSchema.parse(res.body).status).toBe('ok');
    expect(res.headers['x-request-id']).toMatch(UUID);
    expect(res.headers['cache-control']).toBe('no-store');
    expect(res.headers['x-powered-by']).toBeUndefined();
  });

  it('echoes a safe caller request ID and replaces an unsafe one', async () => {
    const ok = await request(app).get('/v1/health').set('X-Request-Id', 'staff-app-1234abcd');
    expect(ok.headers['x-request-id']).toBe('staff-app-1234abcd');

    const unsafe = await request(app).get('/v1/health').set('X-Request-Id', 'x" injected=1');
    expect(unsafe.headers['x-request-id']).toMatch(UUID);
  });

  it('reports not-ready (503) when the database is unreachable', async () => {
    expectErrorEnvelope(await request(app).get('/v1/health/ready'), 503, 'SERVICE_UNAVAILABLE');
  });
});

describe('error envelope', () => {
  it('returns NOT_FOUND for unknown routes', async () => {
    expectErrorEnvelope(await request(app).get('/v1/nope'), 404, 'NOT_FOUND');
  });

  it('returns VALIDATION_FAILED for malformed JSON', async () => {
    const res = await request(app)
      .post('/v1/health')
      .set('Content-Type', 'application/json')
      .send('{"ticketToken":');
    expectErrorEnvelope(res, 400, 'VALIDATION_FAILED');
  });

  it('returns PAYLOAD_TOO_LARGE above the body limit', async () => {
    const res = await request(app)
      .post('/v1/health')
      .set('Content-Type', 'application/json')
      .send(JSON.stringify({ blob: 'x'.repeat(101 * 1024) }));
    expectErrorEnvelope(res, 413, 'PAYLOAD_TOO_LARGE');
  });

  // A throwaway app exercises the shared error middleware with failing handlers.
  const harness = express()
    .use(requestLogger(logger))
    .get('/api-error', () => {
      throw new ApiError('FORBIDDEN_FACILITY', 'You do not have access to this facility.');
    })
    .get('/zod', () => {
      z.object({ facilityId: z.uuid() }).parse({ facilityId: 'secret-value-123' });
    })
    .get('/crash', () => {
      throw new Error('db password=hunter2 leaked in message');
    })
    .use(errorHandler);

  it('maps ApiError to its registered status', async () => {
    expectErrorEnvelope(await request(harness).get('/api-error'), 403, 'FORBIDDEN_FACILITY');
  });

  it('maps Zod errors to VALIDATION_FAILED without echoing the submitted value', async () => {
    const res = await request(harness).get('/zod');
    const body = expectErrorEnvelope(res, 400, 'VALIDATION_FAILED');
    expect(body.error.details).toEqual({
      issues: [{ path: 'facilityId', message: expect.any(String) }],
    });
    expect(JSON.stringify(res.body)).not.toContain('secret-value-123');
  });

  it('hides internal error details behind INTERNAL_ERROR', async () => {
    const res = await request(harness).get('/crash');
    expectErrorEnvelope(res, 500, 'INTERNAL_ERROR');
    expect(JSON.stringify(res.body)).not.toMatch(/hunter2|stack|at /);
  });
});

describe('CORS', () => {
  it('allows configured browser origins only', async () => {
    const allowed = await request(app).get('/v1/health').set('Origin', 'http://localhost:3000');
    expect(allowed.headers['access-control-allow-origin']).toBe('http://localhost:3000');

    const denied = await request(app).get('/v1/health').set('Origin', 'https://evil.example');
    expect(denied.headers['access-control-allow-origin']).toBeUndefined();
  });
});

describe('loadEnv', () => {
  const required = {
    DATABASE_URL: testEnvVars.DATABASE_URL,
    SUPABASE_URL: 'http://127.0.0.1:54321',
  };

  it('applies safe defaults', () => {
    expect(loadEnv(required)).toMatchObject({
      PORT: 4000,
      NODE_ENV: 'development',
      CORS_ALLOWED_ORIGINS: [],
    });
  });

  it('requires the database and Supabase settings', () => {
    expect(() => loadEnv({})).toThrow(/DATABASE_URL, SUPABASE_URL/);
  });

  it('names invalid variables without printing their values', () => {
    expect(() => loadEnv({ ...required, PORT: 'not-a-port-s3cr3t' })).toThrow(/PORT/);
    expect(() => loadEnv({ ...required, PORT: 'not-a-port-s3cr3t' })).not.toThrow(/s3cr3t/);
    expect(() => loadEnv({ ...required, CORS_ALLOWED_ORIGINS: 'http://localhost:3000/' })).toThrow(
      /CORS_ALLOWED_ORIGINS/,
    );
    const leaky = { ...required, DATABASE_URL: 'mysql://user:hunter2@db/x' };
    expect(() => loadEnv(leaky)).toThrow(/DATABASE_URL/);
    expect(() => loadEnv(leaky)).not.toThrow(/hunter2/);
  });
});
