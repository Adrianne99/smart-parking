# Project status

**Current phase:** P1 — Core foundation + design tokens
**Progress:** P1-A (DB/Auth/API) ✅ implemented on `feat/p1-db-auth` · P1-B (Design System) ⏳ next
**Gate P0:** ✅ passed 2026-11-05 (ADR-001–004 accepted by owner; CI green on `main`)
**Updated:** 2026-11-05

## Gate P1 checklist

| Criterion | State | Evidence |
|---|---|---|
| Cross-tenant reads/writes denied in tests | ✅ | `apps/api/src/tenancy.test.ts`: 19 tests against real Postgres (2 operators × 2 facilities). CI runs them on a Postgres service and fails if they are skipped |
| JWT verification (tampered / wrong project / role injection) | ✅ | `verify-token.test.ts`: 14 adversarial cases; verified live against local Supabase ES256 JWKS |
| Lint / typecheck pass | ✅ | `pnpm turbo run lint typecheck test build --force` → 28/28 |
| Theme and tokens work web / Android / iOS (incl. override) | ⏳ P1-B | |
| Exact font sizes/weights and theme inversion documented | ⏳ P1-B | |

## P1-A delivered

- `packages/database`: Prisma 7.10.1 schema + first migration (`20261105051507_init`): platform/org/facility memberships, organizations, facilities, append-only audit log. Private `app` schema, RLS on, Supabase API roles revoked (verified: REST returns `PGRST106`). Idempotent demo seed.
- API: Supabase JWT verification (ES256/RS256 only), `requireAuth`, single permission map (`modules/access`), and the endpoints `GET /v1/me`, `GET/POST /v1/organizations`, `GET/POST /v1/organizations/:id/facilities`, `GET /v1/facilities/:id`, `POST/DELETE /v1/facilities/:id/memberships[/:userId]`, `GET /v1/health/ready`. Every mutation writes an audit row in the same transaction.
- Contracts: tenancy DTOs and enums, with a test keeping them equal to the DB enums.

## Open issues (carried / new)

1. **Input border contrast** below WCAG 1.4.11 (`line`/`line-strong`). → P1-B
2. **₱ glyph coverage** unverified. → P1-B
3. 320 px web check in a real mobile viewport. → web QA
4. TanStack Query focus/online managers not wired to React Native AppState/NetInfo. → Staff/Driver
5. **Rate limiting** and `trust proxy` not configured; request logs include full response headers. → before any public deployment
6. Placeholder app icons/splash and bundle IDs. → owner, before first EAS build
7. Hosted Supabase: use the **direct or session-mode** connection for Prisma (`pg` prepared statements). Confirm pooler mode when going hosted (ADR-007).
8. No `users` profile table yet; staff invitations by email are not possible until it exists (P2/P4).

## Next

- **P1-B (Design System):** Light/Dark/System override + persistence (web + native), buttons, input, table, status, dialog/sheet foundations, `ui-web`/`ui-mobile`, documented type scale; fix issues 1–2.
- Then P1 gate review → P2 (zones, capacity, rates, check-in).
