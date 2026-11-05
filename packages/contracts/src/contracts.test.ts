import { describe, expect, it } from 'vitest';
import {
  apiErrorBodySchema,
  centavosSchema,
  ERROR_STATUS,
  healthResponseSchema,
  isErrorCode,
  pageOf,
  pageQuerySchema,
  uuidSchema,
} from './index';

describe('error registry', () => {
  it('maps every code to a 4xx/5xx status', () => {
    for (const [code, status] of Object.entries(ERROR_STATUS)) {
      expect(code).toMatch(/^[A-Z][A-Z_]+$/);
      expect(status >= 400 && status <= 599).toBe(true);
    }
  });

  it('narrows known codes and rejects unknown ones', () => {
    expect(isErrorCode('SESSION_ALREADY_CLOSED')).toBe(true);
    expect(isErrorCode('TICKET_ALREADY_USED')).toBe(false); // v1.3 alias, superseded
    expect(isErrorCode('toString')).toBe(false); // no prototype leakage
  });

  it('requires a requestId in the error envelope but tolerates unknown codes', () => {
    const body = { error: { code: 'SOME_FUTURE_CODE', message: 'x', requestId: 'r-12345678' } };
    expect(apiErrorBodySchema.safeParse(body).success).toBe(true);
    expect(apiErrorBodySchema.safeParse({ error: { code: 'X', message: 'x' } }).success).toBe(
      false,
    );
  });
});

describe('money', () => {
  it('accepts integer centavos only', () => {
    expect(centavosSchema.safeParse(5000).success).toBe(true);
    expect(centavosSchema.safeParse(50.5).success).toBe(false);
    expect(centavosSchema.safeParse('5000').success).toBe(false);
    expect(centavosSchema.safeParse(Number.MAX_SAFE_INTEGER + 1).success).toBe(false);
  });
});

describe('pagination', () => {
  it('defaults and bounds the limit', () => {
    expect(pageQuerySchema.parse({})).toEqual({ limit: 25 });
    expect(pageQuerySchema.parse({ limit: '10' }).limit).toBe(10);
    expect(pageQuerySchema.safeParse({ limit: '101' }).success).toBe(false);
    expect(pageQuerySchema.safeParse({ limit: '0' }).success).toBe(false);
  });

  it('builds a typed list envelope', () => {
    const schema = pageOf(uuidSchema);
    expect(schema.safeParse({ data: [], page: { nextCursor: null } }).success).toBe(true);
    expect(schema.safeParse({ data: ['not-a-uuid'], page: { nextCursor: null } }).success).toBe(
      false,
    );
  });
});

describe('health', () => {
  it('accepts a UTC ISO timestamp and rejects a zone-less one', () => {
    const ok = { status: 'ok', service: 'api', time: new Date().toISOString() };
    expect(healthResponseSchema.safeParse(ok).success).toBe(true);
    expect(healthResponseSchema.safeParse({ ...ok, time: '2026-11-05 10:00:00' }).success).toBe(
      false,
    );
  });
});
