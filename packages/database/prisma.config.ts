import { existsSync } from 'node:fs';
import { defineConfig } from 'prisma/config';

// Local dev reads packages/database/.env; CI and deploys pass real environment variables,
// which take precedence over the file.
if (existsSync('.env')) process.loadEnvFile('.env');

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: { path: 'prisma/migrations' },
  // The CLI (migrations) uses the direct, non-pooled connection.
  datasource: { url: process.env.DIRECT_URL ?? process.env.DATABASE_URL ?? '' },
});
