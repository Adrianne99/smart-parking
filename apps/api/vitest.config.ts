import { existsSync } from 'node:fs';
import { defineConfig } from 'vitest/config';

// Local runs pick up TEST_DATABASE_URL from apps/api/.env; CI sets it directly.
if (existsSync('.env')) process.loadEnvFile('.env');

export default defineConfig({
  test: { globalSetup: ['./src/test-global-setup.ts'] },
});
