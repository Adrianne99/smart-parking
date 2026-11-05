// Local/dev seed: `pnpm --filter @smart-parking/database seed`. Never run against production.
import { existsSync } from 'node:fs';
import { createPrismaClient } from './index';
import { seedDemoTenants } from './demo-tenants';

if (existsSync('.env')) process.loadEnvFile('.env');
const url = process.env.DATABASE_URL;
if (!url) throw new Error('DATABASE_URL is not set (copy packages/database/.env.example to .env).');

const db = createPrismaClient(url);
try {
  await seedDemoTenants(db);
  console.log('Seeded 2 demo organizations × 2 facilities.');
} finally {
  await db.$disconnect();
}
