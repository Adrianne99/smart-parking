# Folder ownership (canonical — supersedes the table in 03_PARALLEL_SESSION_PLAYBOOK.md where paths differ)

One owner per fragile path. Others propose changes in their handoff (`05_HANDOFF_TEMPLATE.md`).

| Path | Owner | Notes |
|---|---|---|
| `package.json` (root), `pnpm-lock.yaml`, `pnpm-workspace.yaml`, `turbo.json`, `.github/**`, root dotfiles | **Integrator** | Dependency changes in any workspace go through the Integrator because they change the lockfile |
| `packages/config/**` | Integrator | TS/ESLint baselines |
| `packages/contracts/**` (DTOs, error registry) | **Contracts lead = Integrator** | ADR-005 |
| `apps/api/src/app.ts` (router mounts), `apps/api/src/http/**`, `apps/api/build.mjs` | Integrator | Features export a router from their module |
| `packages/database/**` (Prisma schema + migrations) | **DB/Auth lead (P1 Session A)** | Only this owner creates/edits schema and migrations |
| `supabase/config.toml` (local stack, auth settings) | DB/Auth lead (Integrator until P1) | No SQL in `supabase/migrations`; Prisma owns schema (ADR-007) |
| `apps/api/src/modules/auth/**`, `modules/access/**`, `modules/me/**`, `modules/organizations/**`, `modules/facilities/**` | P1 Session A (DB/Auth) | `modules/access/access.ts` is the single permission map; other modules call it, never re-implement it |
| `packages/design-tokens/**`, `packages/ui-web/**`, `packages/ui-mobile/**` | **Design System (P1 Session B)** | P0 seeded tokens + NativeWind preset |
| `packages/pricing/**`, `apps/api/src/modules/parking/**`, `modules/rates/**` | P2 Session 3 | |
| `apps/api/src/modules/payments/**`, `cash/**`, `exits/**`, webhook inbox | P5 Session 5 | |
| `apps/staff/**` | Staff Mobile session | |
| `apps/driver/**` | Driver Mobile session | |
| `apps/web/src/app/operator/**`, `apps/web/src/features/operator/**` | Operator Web session | Plain `operator/` segment instead of the playbook's `(operator)` route group, so URLs are `/operator/...` |
| `apps/web/src/app/admin/**`, `apps/web/src/features/platform-crm/**` | Admin CRM session | URLs `/admin/...` |
| `apps/web/src/app/layout.tsx`, `providers.tsx`, `globals.css`, `apps/web/src/lib/**` | Integrator | Shared web shell |
| `tests/security/**`, `tests/e2e/**`, `docs/security/**`, `docs/runbooks/**` | QA session | |
| `docs/architecture/**`, `docs/progress/STATUS.md` | Integrator | Sessions add `docs/progress/HANDOFF-*.md` only |
