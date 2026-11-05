// API composition point. Owner: Integrator. Feature sessions export a router from
// src/modules/<name>/ and the Integrator mounts it here.
import { HEADERS } from '@smart-parking/contracts';
import type { Database } from '@smart-parking/database';
import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import type { Logger } from 'pino';
import type { Env } from './config/env';
import { errorHandler, notFoundHandler } from './http/errors';
import { requestLogger } from './http/logger';
import { requireAuth } from './modules/auth/require-auth';
import type { AccessTokenVerifier } from './modules/auth/verify-token';
import { facilitiesRouter } from './modules/facilities/facilities.router';
import { healthRouter } from './modules/health/health.router';
import { meRouter } from './modules/me/me.router';
import { organizationsRouter } from './modules/organizations/organizations.router';

export type AppDeps = {
  env: Env;
  logger: Logger;
  db: Database;
  verifyAccessToken: AccessTokenVerifier;
};

export function createApp({ env, logger, db, verifyAccessToken }: AppDeps) {
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

  app.use('/v1/health', healthRouter(db));

  // Everything below requires a verified Supabase access token.
  const authenticated = requireAuth(verifyAccessToken);
  app.use('/v1/me', authenticated, meRouter(db));
  app.use('/v1/organizations', authenticated, organizationsRouter(db));
  app.use('/v1/facilities', authenticated, facilitiesRouter(db));

  app.use(notFoundHandler);
  app.use(errorHandler);
  return app;
}
