import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../generated/prisma/client';

export * from '../generated/prisma/client';
export { demo, seedDemoTenants } from './demo-tenants';

/** Server-side only. Never import this package from web or mobile code. */
export function createPrismaClient(connectionString: string) {
  // Fail fast instead of hanging requests when the database is unreachable.
  return new PrismaClient({
    adapter: new PrismaPg({ connectionString, connectionTimeoutMillis: 5_000 }),
  });
}

export type Database = ReturnType<typeof createPrismaClient>;
