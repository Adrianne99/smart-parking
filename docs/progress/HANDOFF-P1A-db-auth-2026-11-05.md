# Handoff: P1-A DB/Auth/API, branch `feat/p1-db-auth` (uncommitted), 2026-11-05

## Scope and status
- **Phase / criteria:** P1 Session A: tenant-safe schema, Supabase JWT verification, scoped access, audit base, constraints, 2-org negative tests, seeds.
- **Completed:** all of the above (see `docs/progress/STATUS.md`).
- **Deferred:** `users` profile table, staff invitations by email, rate limiting, org-level membership management endpoints, facility PATCH/publishing. P1-B design system not started.

## File ownership and changes
- **New:** `packages/database/**`, `apps/api/src/modules/{auth,access,me,organizations,facilities}/**`, `apps/api/src/{test-support,test-global-setup,tenancy.test}.ts`, `apps/api/src/types/express.d.ts`, `apps/api/vitest.config.ts`, `apps/api/.env.example` (re-created: it was renamed to `.env` before the P0 commit and so was missing from git), `packages/contracts/src/tenancy.ts`, `ADR-007` notes.
- **Changed:** `apps/api/src/{app,server}.ts`, `config/env.ts`, `modules/health/health.router.ts`, `packages/contracts/src/{health,index}.ts`, `turbo.json` (`generate` task), `.github/workflows/ci.yml` (Postgres service + tenancy gate), `.gitignore`, `.prettierignore`, docs.
- **Env vars (names only):** API now **requires** `DATABASE_URL`, `SUPABASE_URL`; tests use `TEST_DATABASE_URL` (name must end in `_test`). `packages/database` uses `DATABASE_URL`, `DIRECT_URL`.
- **Migration:** `20261105051507_init`, applied to local dev and test DBs only.
- **Contract additions:** tenancy enums/DTOs, `idPageQuerySchema`, `readinessResponseSchema`.

## Tests actually executed (Windows 11, Node 24.19, local Supabase on Docker 29.9.2)
| Command | Result | Notes |
|---|---|---|
| `pnpm turbo run lint typecheck test build --force` (with `TEST_DATABASE_URL`) | PASS | 28/28 tasks |
| `pnpm --filter api test` | PASS | 45 tests: tenancy 22 (19 DB + 3 enum parity), JWT 14, app 9 (+ `migrate deploy` in setup) |
| Second run on existing test data | PASS | tests are re-runnable |
| Built API (`dist/server.js`) + real Supabase signup token | PASS | `/v1/me` 200; publishable key as bearer 401; foreign facility 404; readiness 200 |
| Supabase REST `GET /rest/v1/organizations` (Accept-Profile: app) | Blocked as intended | `PGRST106 Invalid schema: app` |
| GitHub Actions on this branch | NOT RUN | not pushed |

## Security / privacy / financial impact
- Out-of-scope ids return the same 404 as nonexistent ids (no existence oracle). Body-supplied `organizationId` is ignored (tested).
- Role claims inside JWTs are ignored. Only HS256/none-free asymmetric tokens with a UUID `sub` are accepted.
- Prisma's AI-agent guard blocked `prisma migrate reset` during this session. I did **not** bypass it. The test setup was changed to the non-destructive `migrate deploy` instead.
- No payment code. No external provider.

## Integration instructions
- `pnpm db:start` → `cp packages/database/.env.example packages/database/.env` → `pnpm --filter @smart-parking/database migrate:deploy` → `pnpm --filter @smart-parking/database seed`.
- Make sure `apps/api/.env` has `TEST_DATABASE_URL` (see `.env.example`).
- Rollback: revert the branch. The migration only touches the `app` schema.

## Next recommended tasks
1. Owner reviews the branch, commits and pushes, and confirms CI (with the Postgres service) is green, then merges to `main`.
2. P1-B Design System.
