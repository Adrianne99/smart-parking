import type { HealthResponse } from '@smart-parking/contracts';
import { Router } from 'express';

// Liveness only. A readiness check (DB reachability) is added with the database in P1.
export const healthRouter = Router().get('/', (_req, res) => {
  const body: HealthResponse = { status: 'ok', service: 'api', time: new Date().toISOString() };
  res.json(body);
});
