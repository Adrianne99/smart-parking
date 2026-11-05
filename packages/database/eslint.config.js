import { defineConfig, globalIgnores } from 'eslint/config';
import base from '@smart-parking/config/eslint';

export default defineConfig([base, globalIgnores(['generated/**'])]);
