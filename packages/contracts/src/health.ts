import { z } from 'zod';
import { isoDateTimeSchema } from './common';

/** GET /v1/health — public liveness probe. No auth, no tenant data, no dependency checks yet. */
export const healthResponseSchema = z.object({
  status: z.literal('ok'),
  service: z.literal('api'),
  time: isoDateTimeSchema,
});

export type HealthResponse = z.infer<typeof healthResponseSchema>;

/** GET /v1/health/ready — 200 when the database answers, otherwise 503 SERVICE_UNAVAILABLE. */
export const readinessResponseSchema = z.object({
  status: z.literal('ready'),
  checks: z.object({ database: z.literal('ok') }),
});

export type ReadinessResponse = z.infer<typeof readinessResponseSchema>;
