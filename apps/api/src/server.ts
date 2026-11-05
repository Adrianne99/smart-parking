import { createPrismaClient } from '@smart-parking/database';
import { createApp } from './app';
import { loadEnv } from './config/env';
import { createLogger } from './http/logger';
import { supabaseTokenVerifier } from './modules/auth/verify-token';

const env = loadEnv();
const logger = createLogger(env);
const db = createPrismaClient(env.DATABASE_URL);

const app = createApp({
  env,
  logger,
  db,
  verifyAccessToken: supabaseTokenVerifier(env.SUPABASE_URL),
});

const server = app.listen(env.PORT, (error) => {
  if (error) {
    logger.fatal({ err: error }, 'API failed to start');
    process.exit(1);
  }
  logger.info({ port: env.PORT, env: env.NODE_ENV }, 'API listening');
});

for (const signal of ['SIGINT', 'SIGTERM'] as const) {
  process.once(signal, () => {
    logger.info({ signal }, 'Shutting down');
    server.close(() => {
      void db.$disconnect().finally(() => process.exit(0));
    });
    setTimeout(() => process.exit(1), 10_000).unref();
  });
}
