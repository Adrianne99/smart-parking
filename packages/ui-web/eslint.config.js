import { defineConfig } from 'eslint/config';
import base from '@smart-parking/config/eslint';
import reactHooks from 'eslint-plugin-react-hooks';

export default defineConfig([base, reactHooks.configs.flat.recommended]);
