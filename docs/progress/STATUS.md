# Project status

**Current phase:** P0 — Discovery, architecture, repository contracts
**Gate P0:** implementation complete, **awaiting Integrator/owner acceptance** (ADR-001–004 are *Proposed* and need product/security sign-off)
**Updated:** 2026-11-05 · **Next phase:** P1 (do not start until Gate P0 is accepted)

## Gate P0 checklist

| Criterion | State | Evidence |
|---|---|---|
| App shells compile | ✅ | `pnpm turbo run build`: Next.js production build, API esbuild bundle, staff + driver `expo export` for iOS and Android (Hermes bundles) |
| Tests can be invoked | ✅ | `pnpm test` → 56 tests across 7 workspaces (Vitest + Jest/jest-expo) |
| Lint / typecheck pass | ✅ | `pnpm turbo run lint typecheck` → all green, uncached |
| Docs have decisions and open regulatory questions | ✅ | `docs/architecture/ADR-001…006`; regulatory blockers R1–R9 in ADR-004 |
| Schema and API contract owners assigned | ✅ | `docs/architecture/OWNERSHIP.md` |
| No duplicate conflicting DTO definitions | ✅ | All DTOs/error codes in `packages/contracts`; v1.3 alias codes mapped in ADR-002 |
| Entity map, RBAC matrix | ✅ | `ENTITY_MAP.md`, ADR-001 |
| CI skeleton | ✅ written / ⏳ not yet run on GitHub | `.github/workflows/ci.yml` (no remote exists yet) |
| Env validation templates | ✅ | `apps/*/.env.example`; API validates env with Zod at boot |
| Dev Supabase connected | ✅ local | Local Supabase CLI stack (ADR-007), verified 2026-11-05: Postgres 17.11 with PostGIS 3.3.7 available; JWKS serves only our ES256 public key; a signup token is ES256-signed with the matching `kid`. Test user removed |

## What is real vs. stubbed

| Area | State |
|---|---|
| `GET /v1/health` | **Real**, liveness only (no DB readiness check yet) |
| Error envelope, request IDs, redacted logs, CORS allowlist, Helmet headers, `no-store`, 100 kB body limit | **Real**, tested |
| Typed API client (contract validation, retry policy, cancellation) | **Real**, tested |
| Quiet Utility colour tokens, fonts (Instrument Sans + DM Mono), system light/dark | **Real seed**; the persisted Light/Dark/System override is not built yet (P1) |
| Auth, tenancy, database, Prisma | **Not started** (P1) |
| Payments | **Nothing exists.** No provider, no sandbox adapter yet (P5) |

## Open issues found in P0 (assign in P1)

1. **Input border contrast:** `line` (#E6E6E6) and `line-strong` (#C9C9C9) on white are below the WCAG 1.4.11 3:1 non-text minimum. Form controls need a ≥3:1 boundary or another affordance. → Design System session.
2. **₱ glyph coverage** in Instrument Sans / DM Mono is unverified (`latin-ext` subset loaded on web; native fonts unchecked). → Design System session.
3. **320 px web check** not done in a real mobile viewport (headless Windows Edge enforces a ~500 px minimum width; 520 px renders correctly). → Web QA.
4. TanStack Query `focusManager`/`onlineManager` are not wired to React Native `AppState`/NetInfo yet. → Staff/Driver sessions.
5. API request logs include full response headers (no secrets, but noisy). Rate limiting and `trust proxy` are not configured yet. → P1 API hardening.
6. Placeholder app icons/splash and bundle IDs `ph.smartparking.driver` / `ph.smartparking.staff`. → Owner decision before the first EAS build.

## Next safely parallelizable tasks (after Gate P0 acceptance)

- **P1 Session A (DB/Auth/API):** `packages/database` (Prisma 7.10.x), organizations/memberships/facilities/audit, Supabase JWKS verification, `requireFacilityPermission`, 2-org negative tests, seeds (≥2 operators × ≥2 facilities), DB readiness in health.
- **P1 Session B (Design System):** theme override + persistence, primary/secondary buttons, input, table, status, dialog/sheet foundations, `packages/ui-web` / `ui-mobile`; resolve open issues 1–2.
- **QA session (read/write `tests/security/**` only):** threat-model doc and two-tenant test harness plan.
