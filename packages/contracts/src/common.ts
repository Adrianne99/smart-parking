import { z } from 'zod';

export const HEADERS = {
  requestId: 'X-Request-Id',
  idempotencyKey: 'Idempotency-Key',
  /** Set to "true" when a write was answered from its stored idempotent result. */
  idempotentReplayed: 'Idempotent-Replayed',
} as const;

/** Instants are stored as TIMESTAMPTZ and sent as UTC ISO-8601 (`...Z`). Display in Asia/Manila. */
export const isoDateTimeSchema = z.iso.datetime();
export const DISPLAY_TIME_ZONE = 'Asia/Manila';

export const uuidSchema = z.uuid();

/**
 * Money is integer PHP centavos (₱50.00 === 5000), never floats.
 * Field names end in `Centavos`, e.g. `amountDueCentavos`. Database column type: bigint.
 */
export const centavosSchema = z.int();
export const CURRENCY = 'PHP';

export const PAGE_LIMIT_DEFAULT = 25;
export const PAGE_LIMIT_MAX = 100;

/** Query string for every list endpoint: opaque cursor pagination. */
export const pageQuerySchema = z.object({
  cursor: z.string().min(1).max(512).optional(),
  limit: z.coerce.number().int().min(1).max(PAGE_LIMIT_MAX).default(PAGE_LIMIT_DEFAULT),
});

/** Response envelope for every list endpoint. */
export function pageOf<T extends z.ZodType>(item: T) {
  return z.object({
    data: z.array(item),
    page: z.object({ nextCursor: z.string().nullable() }),
  });
}
