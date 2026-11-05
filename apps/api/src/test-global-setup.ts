// Vitest global setup: bring the throwaway test database up to the latest migration.
// Non-destructive on purpose (`migrate deploy`, not `reset`): tests use random ids and an
// idempotent seed, so they re-run safely on top of earlier data.
import { execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

export default function migrateTestDatabase() {
  const url = process.env.TEST_DATABASE_URL;
  if (!url) {
    console.warn('TEST_DATABASE_URL not set: database tenancy tests will be SKIPPED.');
    return;
  }
  // Tests write data: refuse anything that is not clearly a throwaway test database.
  const name = new URL(url).pathname.slice(1);
  if (!name.endsWith('_test')) {
    throw new Error(`TEST_DATABASE_URL must name a database ending in "_test" (got "${name}").`);
  }
  execSync('pnpm exec prisma migrate deploy', {
    cwd: fileURLToPath(new URL('../../../packages/database', import.meta.url)),
    env: { ...process.env, DATABASE_URL: url, DIRECT_URL: url },
    stdio: 'inherit',
  });
}
