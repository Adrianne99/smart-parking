# ADR-007 — Local Supabase for development; hosted project later

**Status:** Accepted (owner decision, 2026-11-05) · **Owner:** Integrator; DB/Auth lead from P1

## Context

The owner's Supabase account has reached its hosted free-project limit. The stack stays Supabase (Postgres + Auth). We need a development database and auth server now, and a hosted project only for staging/pilot.

## Decision

- Develop against the **Supabase CLI local stack** (`supabase/config.toml`, CLI pinned as root devDependency `supabase@3.0.0`). Runs in Docker (or Podman). No hosted project, no cost, nothing leaves the machine.
- Commands: `pnpm db:keygen` (once per machine), `pnpm db:start`, `pnpm db:status`, `pnpm db:stop`, `pnpm db:reset`.
- **Asymmetric JWT signing (ES256)** is enabled locally via `signing_keys_path`, so the API verifies tokens through JWKS exactly as it will against hosted Supabase (ADR-001). `supabase/signing_keys.json` holds a private key: gitignored, generated per developer, never shared.
- **Prisma owns the schema and migrations** (`packages/database`, P1). Do **not** create SQL in `supabase/migrations` or use `supabase db diff/push`. `pnpm db:reset` wipes local data; re-run Prisma migrations and seeds afterwards.
- Disabled locally: Edge Functions (logic lives in Express) and Analytics (needs Docker TCP exposure on Windows).
- Local URLs/credentials are the CLI's public defaults and appear in `.env.example`. They are not secrets, but are only valid on localhost.

## Moving to hosted later (staging/pilot)

1. Create the hosted project (free a slot or use a paid plan). Enable asymmetric JWT signing keys in the dashboard.
2. Put the hosted `DATABASE_URL` (pooler), `DIRECT_URL`, `SUPABASE_URL` and publishable key in the deployment's secret store. Nothing in code changes.
3. Apply Prisma migrations to staging via CI/deploy, never from a laptop against production.
4. Hosted-only items to review then: backups/PITR, region (latency to Metro Manila), network restrictions, SMTP provider, auth rate limits.

## Consequences

- Each developer needs Docker Desktop (or Podman) and WSL 2 on Windows.
- CI integration tests (P1) use a disposable Postgres/Supabase container, never a hosted project.
