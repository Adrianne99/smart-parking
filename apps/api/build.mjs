// Bundles the API and the workspace TypeScript packages it imports into dist/server.js.
// Third-party dependencies stay external and are loaded from node_modules at runtime.
import { build } from 'esbuild';
import { readFileSync } from 'node:fs';

const { dependencies = {} } = JSON.parse(readFileSync('package.json', 'utf8'));

await build({
  entryPoints: ['src/server.ts'],
  outfile: 'dist/server.js',
  bundle: true,
  platform: 'node',
  format: 'esm',
  target: 'node22',
  sourcemap: true,
  external: Object.keys(dependencies).filter((name) => !name.startsWith('@smart-parking/')),
});
