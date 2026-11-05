// API composition point. Owner: Integrator. Feature sessions export a router from
// src/modules/<name>/ and the Integrator mounts it here.
import { HEADERS } from '@smart-parking/contracts';
import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import type { Logger } from 'pino';
import type { Env } from './config/env';
import { errorHandler, notFoundHandler } from './http/errors';
import { requestLogger } from './http/logger';
import { healthRouter } from './modules/health/health.router';

export function createApp(env: Env, logger: Logger) {
  const app = express();

  app.disable('x-powered-by');
  app.use(requestLogger(logger));
  app.use(helmet());
  app.use(
    cors({
      origin: env.CORS_ALLOWED_ORIGINS, // empty list = no browser origin allowed
      allowedHeaders: ['Authorization', 'Content-Type', HEADERS.idempotencyKey, HEADERS.requestId],
      exposedHeaders: [HEADERS.requestId, HEADERS.idempotentReplayed],
      maxAge: 600,
    }),
  );
  // Tenant and payment data must never be cached by browsers or intermediaries.
  app.use((_req, res, next) => {
    res.setHeader('Cache-Control', 'no-store');
    next();
  });
  app.use(express.json({ limit: '100kb' }));

  app.use('/v1/health', healthRouter);

  app.use(notFoundHandler);
  app.use(errorHandler);
  return app;
}
