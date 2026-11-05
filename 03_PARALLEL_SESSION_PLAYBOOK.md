# PARALLEL AI CODING SESSIONS — WORKTREE PLAYBOOK

**Goal:** let multiple AI coding sessions make real progress **without** overwriting one another, contradicting API contracts, or corrupting Prisma migrations.

## Start with a single orchestration session

First run `01_MASTER_BUILD_PROMPT.md` as the **Lead / Integrator**. Do not start independent feature sessions until P0 has established `AGENTS.md`, `packages/contracts`, initial schema ownership, route mounts, CI and a branch strategy. A realistic starting concurrency is **3 sessions**. Expand to 4–5 only after contracts stabilize and you have the time to review merges.

## Setup: separate git worktrees (recommended)

In your initialized Git repository (commands are illustrative; choose existing branch names and folders):

```bash
# Ensure main is clean and committed before creating branches.
git status

git worktree add ../parking-backend -b feat/backend-foundation main
git worktree add ../parking-design -b feat/design-system main
git worktree add ../parking-qa -b test/security-harness main

# Later, after the API contract is frozen:
git worktree add ../parking-staff -b feat/staff-app main
git worktree add ../parking-operator -b feat/operator-web main
```

Run one AI coding session in each worktree, not in the same folder. Commit and open PRs for integration; don't force-push others' work. Each worktree installs dependencies separately where needed; never share `node_modules` via unsafe hacks. After a contract/migration merge, bring new main into dependent worktrees in a controlled way.

**One owner per fragile resource:**

| Resource / path | Owner | Other agents do this instead |
|---|---|---|
| `pnpm-lock.yaml`, `package.json` root, `turbo.json`, CI workflow | Integrator | Request dependency/tooling change in handoff |
| `packages/database/prisma/**` and migrations | Database lead | Submit a proposed migration patch/design note |
| `packages/contracts/**` + API error registry | Contracts lead (initially Integrator) | Propose changes and wait for approval |
| `apps/api/src/app.ts` or global router mount | Integrator | Export self-contained feature router |
| `apps/web/src/app/(operator)/**` | Operator Web session | No platform admin edits there |
| `apps/web/src/app/(admin)/**` | Admin CRM session | No operator edits there |
| `apps/driver/**` | Driver Mobile session | Only consume shared packages |
| `apps/staff/**` | Staff Mobile session | Only consume shared packages |
| `packages/design-tokens/**`, `packages/ui-*/**` | Design System session | Request UI primitive changes in handoff |
| Feature `apps/api/src/modules/<name>/**` | Assigned backend session | Don't edit someone else's module |
| Security tests / audit docs | QA session | Open issues or minimal reviewed patches |

If your repository uses different route group locations, the Integrator must update this table before any parallel session runs.

## Copy/paste preamble for *every* parallel session

> You are working on the Metro Manila Smart Parking MVP inside **one isolated git worktree**. Read `AGENTS.md`, `01_MASTER_BUILD_PROMPT.md`, `02_PHASES_AND_GATES.md`, `04_SECURITY_AND_CONTRACTS.md`, the v1.3 reference specs, and current `docs/progress/STATUS.md`. Execute only the assigned scope below. Do not modify shared Prisma migrations, shared contracts, root manifests, or another team's directory unless you are the assigned owner. Prefer TanStack Query to fetching in `useEffect`. Never weaken authentication, tenant checks, payment verification, idempotency, or exit-authorization rules to make a demo work. Implement code, tests, and small docs in this session. Mark mocks clearly. End with the handoff template, exact changed paths, commands/tests actually run, and blockers. If prerequisites do not exist, create a reviewable design/contract proposal or locally testable isolated module, **not** an incompatible substitute architecture.

Paste that preamble above ONE session prompt below.

---

## Session 0 — Lead / Integrator (start first, remains active)

**When:** P0 onward. **Exclusive paths:** workspace config, contracts initial publication, root tooling, status, docs architecture and ADRs, router integration.

**Prompt:**

> Act as lead architect/integrator for a secure multi-tenant parking platform. Read the master prompt and reference docs. Scaffold/inspect pnpm + Turbo workspace, verify the current branch is clean, define directory conventions, implement root lint/test/typecheck/build scripts, env examples, contract publication flow, and CI. Own `packages/contracts`, API composition point, ADRs, and merge decisions. Create `docs/architecture/ADR-001-*` (tenancy/authorization), ADR-002 (session/payment/exit lifecycle), ADR-003 (mobile offline boundary), ADR-004 (provider responsibilities, pending due diligence), and `docs/progress/STATUS.md`. Work with DB lead to agree entities/tenant scoping; do not guess PSP merchant features. Assign non-overlapping paths to parallel sessions. As PRs arrive, check compatibility, security, migrations and end-to-end tests; merge in dependency order. End with the next phase gate and exact instructions for other sessions.

**Deliverables:** compiling monorepo skeleton, doc/contract ownership, P0 gate review, integration playbook.

## Session 1 — Database, Authentication, Authorization (can run with Session 2)

**When:** P1. **Exclusive paths:** `packages/database/**`, `apps/api/src/modules/auth/**`, `apps/api/src/modules/organizations/**`, `apps/api/src/modules/facilities/access/**` (coordinate conventions with Integrator). May request shared router export but not edit global router.

**Prompt:**

> Act as principal database and security engineer. Implement a normalized tenant-safe PostgreSQL/Prisma foundation: identities backed by Supabase Auth, organizations, memberships, facility-scoped roles, facilities, audit base, restricted staff/device grants. Verify signed Supabase JWTs using project-specific JWKS (no unsigned or client-asserted roles), enforce permissions on every scoped query, and define least-privilege service DB usage. Add constraints, foreign keys, helpful indexes, test seeds for two distinct operator organizations, negative cross-tenant API tests, integration tests for unauthorized/expired tokens. Keep one Prisma migration owner. Consult `04_SECURITY_AND_CONTRACTS.md` for invariants. Do not create payments or client screens in this session; list any missing schema required by those domains for review. Build and test your modules, then hand off exact exports to Integrator.

**Gate:** cross-tenant denial tests pass, no SQL leakage from user-supplied organization IDs.

## Session 2 — Design Tokens + UI Primitives (can run with Session 1)

**When:** P1. **Exclusive paths:** `packages/design-tokens/**`, `packages/ui-web/**`, `packages/ui-mobile/**`, design-system showcase pages only if explicitly assigned.

**Prompt:**

> Act as senior design-system engineer. Implement **Quiet Utility**, a monochrome light/dark design system shared across Next.js/Tailwind and Expo/React Native/NativeWind. Use Instrument Sans for regular UI at 400/500 and DM Mono 300/400/500 for operational IDs, fees, dates. Respect system theme and persist explicit override. Add semantic tokens for backgrounds, text, borders, overlay, state semantics (non-color indicators), spacing, radius, shadows, heights, focus/pressed/disabled states. Implement accessible 54px web / 56px native black-on-white inverted primary buttons, secondary/ghost buttons, inputs, search, tables, status, empty/loading/error, confirmations and bottom-sheet foundations. Use native navigation/sheet interaction conventions for `.ios.tsx` / `.android.tsx` when appropriate. Build component tests/stories or screens, document usage and verify no gratuitous gradients or extra bold UI typography. Do not touch Prisma, app APIs or shared package manifests; request dependency changes from the Integrator.

**Gate:** consistent light/dark tokens, contrast/focus, platform demos and typography verified.

## Session 3 — Parking Operations + Pricing API (start after P1 contracts)

**When:** P2. **Exclusive paths:** `packages/pricing/**`, `apps/api/src/modules/parking/**`, `apps/api/src/modules/rates/**`. Database changes proposed to Session 1.

**Prompt:**

> Implement facility zones and capacity services, immutable versioned rate plans, deterministic PHP-centavo pricing, secure guest check-in with hashed high-entropy ticket credential, parking events and operator-scoped active-session endpoints. Design row-level locking to prevent overbooking at the final available car/motorcycle bay. Support manual attendant workflows and public/private facility visibility. Write rate tests for partial hour, overnight, grace, midnight, configuration change, negative durations, and concurrency tests for last available space. Expose feature router + Zod contracts for integration. Avoid reservations/RFID/gate hardware and do not allow the client to set entry timestamps or money totals.

**Gate:** check-in transaction is atomic; pricing unit tests and tenant integration tests pass.

## Session 4 — Staff Mobile App (start after P2 API contract)

**When:** P3 (parallel with Session 5 sandbox adapter and Session 6 web). **Exclusive paths:** `apps/staff/**`.

**Prompt:**

> Build a polished React Native + Expo **staff app** for both Android and iOS, sharing business logic but using distinct native-feeling layouts/screens where appropriate. Create simple facility/shift selection, manual check-in, vehicle/plate optional fields, QR ticket generation/scanning, active sessions, quote detail, cashier cash-recording form, payment state, secure exit verify + confirm screens, denial reason states, and shift close. Use Instrument Sans + DM Mono, Quiet Utility tokens, TanStack Query for remote reads/mutations, and real auth tokens through typed API client. Never treat QR contents or a payment screenshot as proof of payment. Handle missing camera permission, expired grace, low connectivity, duplicate taps and pending writes. Use local SQLite only for explicitly labeled provisional events; no offline approved digital settlements. Mock API data only in explicitly labeled preview/test modes; don't claim live backend integration until real endpoint tests pass.

**Gate:** device QA for Android/iOS, no privileged direct DB writes, correct denied-exit UX.

## Session 5 — Cash, Payment Provider, Secure Exit Backend

**When:** P5; sandbox adapter can begin in parallel with Session 4 once contracts lock. **Exclusive paths:** `apps/api/src/modules/payments/**`, `apps/api/src/modules/cash/**`, `apps/api/src/modules/exits/**`, webhook inbox module. Database changes proposed to Session 1.

**Prompt:**

> Act as payments/security specialist. Build cashier-shift cash receipts/reconciliation, server-generated checkout quotes, payment-intent flow behind a PSP adapter (use a sandbox/fake provider until commercial onboarding is verified), authenticated webhook processing and idempotency. Implement exit verification preview, server-issued time-limited single-use exit authorization and atomic physical exit: lock session row, validate same facility/tenant, settled current quote/amount/currency/merchant, no reversed/refunded payment, unexpired grace and unused authorization; update status/exited_at and event log in one transaction. Retry deadlocks/serialization conflicts safely; duplicate requests return stable idempotent results without re-releasing capacity. Add concurrent two-attendant test, wrong session payment, old QR, late webhook, extra overstay fee and refund cases. Never rely on frontend cache/screenshot to authorize exit; no homemade wallet.

**Gate:** all fraud/race integration tests pass; demonstrably safe cash and sandbox digital workflows.

## Session 6 — Operator Web + Customer CRM

**When:** P4/P5, after API contracts. **Exclusive paths:** `apps/web/src/app/(operator)/**`, `apps/web/src/features/operator/**`. Backend operator CRM service assigned separately via integrator to avoid collision.

**Prompt:**

> Build the operator-facing Next.js workbench, not a generic SaaS landing page: Overview, Facilities, Zones & Capacity, Rate Editor/Preview, Live Parking Sessions, Cashier Shifts, Staff, Reports, Customer Directory, Operator Cases/Support, Settings. Use the provided design tokens, clear tables/filters/drawers, accessible modals with sensible confirm/cancel states and server-side pagination. Apply TanStack Query and tenant/facility-aware cache keys. Render payment/rate/occupancy from typed API only and display data freshness. Operator Customer CRM is tenant-scoped; guest tickets do not automatically create permanent named customers. Implement responsive desktop/tablet behavior. Do not write rate totals on client or bypass API authorization. Add accessibility and permission-state tests.

**Gate:** owner sees only their own facilities/customers and can accomplish workflows without redundant dashboards.

## Session 7 — Driver Mobile App

**When:** P6 after public-read/payment contracts stable. **Exclusive paths:** `apps/driver/**`.

**Prompt:**

> Build React Native + Expo driver app for Android and iOS with native-feeling platform-specific UI. Implement nearby parking discovery/map, public facilities only, published rate info, recorded available spaces with freshness label and explicit no-guarantee copy, facility details, optional verified ticket claim, active session/provisional fee, payment initiation, status polling or query invalidation after backend verification, receipts/history, and light/dark/system preferences. **No reservations and no wallet/top-up**. Driver app must never be required for a walk-in to park or pay cash. TanStack Query is the server-state source; avoid useEffect fetching. Privacy: no other driver's ticket accessible from guessed IDs; no merchant credentials in client. Test Android/iOS themes, permission-denied location and network errors.

**Gate:** no cross-user data exposure; no fake paid status; platform-specific interaction QA complete.

## Session 8 — Platform Admin CRM

**When:** P6 after tenant/auth/CRM contracts. **Exclusive paths:** `apps/web/src/app/(admin)/**`, `apps/web/src/features/platform-crm/**`. Backend CRM module must have assigned owner; avoid touching another module.

**Prompt:**

> Implement the platform-admin Next.js CRM: Leads, Operator Accounts, verified Contacts, Onboarding Checklist, Facilities Activation, Support Inbox, Activity Timeline, Billing/PSP status metadata, Audit. Use Quiet Utility monochrome design, accessible table/detail layouts, focused modals, review/approval dialogs, status transitions with reason, and audit entries. Strictly separate platform-account CRM from operators' named parking-customer CRM. Enforce role-restricted actions; no unrestricted all-driver search, silent delete, or secret exposure. Use TanStack Query and route-level checks; assume API also enforces permissions. Add status/error/empty-state and role denial tests.

**Gate:** lead conversion, onboarding and support workflow usable in staging with explicit permissions.

## Session 9 — QA, Threat Modeling, Concurrency, Pilot Readiness

**When:** from P1 onward; heavier in P7. **Exclusive paths:** `tests/security/**`, `tests/e2e/**`, `docs/security/**`, `docs/runbooks/**` (agreed). File bug reports for feature owners rather than silently editing their modules.

**Prompt:**

> Act as adversarial senior security and QA engineer. Review threat boundaries: tenant IDOR, role escalation, JWT tampering, QR token leakage/replay, cash fraud, spoofed/delayed PSP webhooks, double charge, double exit, capacity race, rate version edits, unpaid overstays, offline replay, leaked PII, public/private facility filtering, credential logging, audit immutability. Build isolated integration tests with two organizations and simultaneous requests, API contract checks, native app test plans, and an outage/cashier incident runbook. Document exact commands/evidence and open blocking issues. Do not state tests passed unless executed. For uncovered legal/provider constraints create explicit release blockers, not guessed compliance claims.

**Gate:** adversarial test report and clear go/no-go criteria for pilot.

---

## Example concurrency schedule

- **Wave 1:** Integrator alone -> stable base contracts.
- **Wave 2:** Session 1 DB/Auth, Session 2 Tokens/UI, Session 9 QA harness in parallel; Integrator integrates.
- **Wave 3:** Session 3 Parking Backend + Session 6 Operator Web shell + Session 4 Staff App shell (UI works against typed mocks until integration).
- **Wave 4:** Session 5 Payments/Exit Backend + Session 4 Staff API wiring + Session 6 Operator CRM + QA verification.
- **Wave 5:** Session 7 Driver App + Session 8 Platform Admin CRM + reporting/QA.
- **Wave 6:** Integrator-led hardening and pilot.

**Avoid** running DB/Auth, Parking API, Payment API, and CRM API as four independent sessions all editing `schema.prisma` or `app.ts`. The merge conflicts are obvious; the subtle transactional bugs are worse.

## PR integration protocol (mandatory)

1. Each session commits only owned paths and provides `05_HANDOFF_TEMPLATE.md` report.
2. Integrator checks incoming contract changes, schema proposals, risk classification, test evidence, and docs.
3. Rebase on current main; don't override another PR's migrations.
4. Run CI, DB integration tests, and a focused smoke test of the touched user journey.
5. Merge prerequisites first, downstream app code second.
6. Update `docs/progress/STATUS.md`, note next phase gate. Keep `main` always buildable.
