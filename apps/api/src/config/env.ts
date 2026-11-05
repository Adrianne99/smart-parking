import { z } from 'zod';

const originList = z
  .string()
  .default('')
  .transform((raw) =>
    raw
      .split(',')
      .map((origin) => origin.trim())
      .filter(Boolean),
  )
  .pipe(z.array(z.string().regex(/^https?:\/\/[^/\s]+$/, 'origin without path or trailing slash')));

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().min(1).max(65535).default(4000),
  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent']).default('info'),
  /** Browser origins allowed to call the API. Native apps don't need CORS. */
  CORS_ALLOWED_ORIGINS: originList,
});

export type Env = z.infer<typeof envSchema>;

export function loadEnv(source: Record<string, string | undefined> = process.env): Env {
  const result = envSchema.safeParse(source);
  if (!result.success) {
    // Name the variables but never print values: env may contain secrets.
    const names = [...new Set(result.error.issues.map((issue) => issue.path[0]))].join(', ');
    throw new Error(`Invalid API environment variables: ${names}. See apps/api/.env.example.`);
  }
  return result.data;
}
