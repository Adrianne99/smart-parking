import { createApp } from './app';
import { loadEnv } from './config/env';
import { createLogger } from './http/logger';

const env = loadEnv();
const logger = createLogger(env);

const server = createApp(env, logger).listen(env.PORT, (error) => {
  if (error) {
    logger.fatal({ err: error }, 'API failed to start');
    process.exit(1);
  }
  logger.info({ port: env.PORT, env: env.NODE_ENV }, 'API listening');
});

for (const signal of ['SIGINT', 'SIGTERM'] as const) {
  process.once(signal, () => {
    logger.info({ signal }, 'Shutting down');
    server.close(() => process.exit(0));
    setTimeout(() => process.exit(1), 10_000).unref();
  });
}
