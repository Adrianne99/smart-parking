import { z } from 'zod';
import { isoDateTimeSchema } from './common';

/** GET /v1/health — public liveness probe. No auth, no tenant data, no dependency checks yet. */
export const healthResponseSchema = z.object({
  status: z.literal('ok'),
  service: z.literal('api'),
  time: isoDateTimeSchema,
});

export type HealthResponse = z.infer<typeof healthResponseSchema>;
