import { z } from 'zod';

/**
 * Canonical API error registry: every code maps to exactly one HTTP status.
 * Owner: Contracts lead (Integrator). Adding/renaming a code is a contract change (ADR-005).
 * v1.3 reference aliases (e.g. TICKET_ALREADY_USED) are intentionally NOT used; see ADR-005.
 */
export const ERROR_STATUS = {
  VALIDATION_FAILED: 400,
  UNAUTHENTICATED: 401,
  FORBIDDEN: 403,
  FORBIDDEN_FACILITY: 403,
  NOT_FOUND: 404,
  SESSION_NOT_FOUND: 404,
  TICKET_INVALID: 404,
  PAYMENT_NOT_VERIFIED: 409,
  PAYMENT_REVERSED: 409,
  EXIT_WINDOW_EXPIRED: 409,
  SESSION_ALREADY_CLOSED: 409,
  CAPACITY_EXCEEDED: 409,
  IDEMPOTENCY_KEY_REUSED: 409,
  RETRYABLE_CONFLICT: 409,
  PAYLOAD_TOO_LARGE: 413,
  RATE_LIMITED: 429,
  INTERNAL_ERROR: 500,
  SERVICE_UNAVAILABLE: 503,
} as const satisfies Record<string, number>;

export type ErrorCode = keyof typeof ERROR_STATUS;

export function isErrorCode(value: string): value is ErrorCode {
  return Object.hasOwn(ERROR_STATUS, value);
}

/**
 * Error body for every non-2xx response.
 * `code` is a plain string on the wire so older installed mobile builds keep parsing
 * errors when the server adds a new code; narrow it with `isErrorCode`.
 */
export const apiErrorBodySchema = z.object({
  error: z.object({
    code: z.string().min(1),
    message: z.string(),
    requestId: z.string().min(1),
    details: z.unknown().optional(),
  }),
});

export type ApiErrorBody = z.infer<typeof apiErrorBodySchema>;

/** `details` shape for VALIDATION_FAILED. Never echoes submitted values. */
export type ValidationIssue = { path: string; message: string };
