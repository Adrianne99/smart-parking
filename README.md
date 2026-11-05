# Metro Manila Smart Parking

Monorepo for the multi-tenant parking platform. Product specs: `00_START_HERE.md`, `01_MASTER_BUILD_PROMPT.md`, `reference/`. Current progress: [`docs/progress/STATUS.md`](docs/progress/STATUS.md). Decisions: [`docs/architecture/`](docs/architecture/).

| Path | What |
|---|---|
| `apps/api` | Express 5 REST API (`/v1`), the only authoritative write path |
| `apps/web` | Next.js 16: operator + platform admin |
| `apps/staff` | Expo (Android/iOS) attendant/cashier app |
| `apps/driver` | Expo (Android/iOS) driver app |
| `packages/contracts` | Zod DTOs, error registry, API conventions |
| `packages/api-client` | Typed fetch client used by web and native |
| `packages/design-tokens` | Quiet Utility semantic tokens (web CSS vars + NativeWind preset) |
| `packages/config` | Shared TypeScript and ESLint config |

## Setup

Requires Node 24 (`.nvmrc`), pnpm 9.12+, and Docker Desktop or Podman (for the local Supabase stack, ADR-007).

```bash
pnpm install
pnpm db:keygen              # once per machine: local ES256 JWT key (gitignored)
pnpm db:start               # local Postgres + Auth + Studio (http://127.0.0.1:54323)
pnpm db:status              # URLs and the local publishable key for .env files
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env.local
cp apps/staff/.env.example apps/staff/.env.local
cp apps/driver/.env.example apps/driver/.env.local

pnpm --filter api dev       # http://localhost:4000/v1/health
pnpm --filter web dev       # http://localhost:3000
pnpm --filter staff start   # Expo dev server (also: driver)
```

## Checks (same as CI)

```bash
pnpm format:check
pnpm turbo run lint typecheck test build
```

Never put secrets in `NEXT_PUBLIC_*` or `EXPO_PUBLIC_*` variables: they ship to browsers and app binaries.
