import type { HealthResponse, ReadinessResponse } from '@smart-parking/contracts';
import type { Database } from '@smart-parking/database';
import { Router } from 'express';
import { ApiError } from '../../http/errors';

export function healthRouter(db: Database) {
  return (
    Router()
      // Liveness: the process is up. No dependencies checked.
      .get('/', (_req, res) => {
        const body: HealthResponse = {
          status: 'ok',
          service: 'api',
          time: new Date().toISOString(),
        };
        res.json(body);
      })
      // Readiness: safe to route traffic here (database answers).
      .get('/ready', async (req, res) => {
        try {
          await db.$queryRaw`SELECT 1`;
        } catch (err) {
          req.log.warn({ err }, 'Readiness check failed: database');
          throw new ApiError('SERVICE_UNAVAILABLE', 'The service is not ready.');
        }
        const body: ReadinessResponse = { status: 'ready', checks: { database: 'ok' } };
        res.json(body);
      })
  );
}
