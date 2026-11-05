# PHASE-BY-PHASE BUILD ROADMAP AND ACCEPTANCE GATES

**Rule:** Parallelize independent work *inside* phases; do not bypass prerequisites. This is a dependency roadmap, not a promise of calendar duration. All phases should deliver working, testable vertical slices.

## Milestone graph

```text
P0 Context + contracts + repo rules
 ├── P1 Core foundation (DB/Auth/API) ----┐
 └── P1 Visual foundations (tokens/UI) ---┤
                                          v
P2 Facility + capacity + rate engine + public read APIs
 ├── P3 Staff native app + manual check-in/shift workflows
 ├── P4 Operator web operations + Operator CRM shell
 └── P5 PSP adapter/payment + atomic exit backend (requires P3 contracts)
                                          v
P6 Driver app + operator/platform CRM integration + reporting
                                          v
P7 Offline reconciliation + fraud/race testing + mobile releases
                                          v
P8 Multi-facility district pilot / hardening
```

## P0 — Discovery, architecture, repository contracts

**Owner:** lead/orchestrator with database and product/security sign-off. **Other sessions:** may review design tokens and screen inventories read-only.

Deliver: initial repo setup (pnpm workspace, Turbo, strict TypeScript, lint/typecheck/test scripts), baseline ADRs (multi-tenancy, payment merchant model pending commercial confirmation, lifecycle states, offline fallbacks), canonical `/v1` DTOs and error codes, entity/relationship map, RBAC matrix, agreed folder ownership, CI skeleton, environment validation templates, `docs/progress/STATUS.md`. Connect local **development** Supabase only when credentials are available; never commit secrets.

**Gate P0:** app shells compile; docs have decisions and open regulatory questions; tests can be invoked; schema and API contract owners assigned; no duplicate conflicting DTO definitions.

## P1 — Core foundation + design tokens (safe parallel split)

**Session A (DB/Auth/API):** `organizations`, `memberships`, `facilities` baseline, staff facility grants, Supabase JWT verification, tenant-scoped access, audit base, DB constraints, API integration tests, test seeds (>=2 operators, >=2 facilities each). Only **A** edits Prisma migrations.

**Session B (Design/UI):** shared Quiet Utility tokens, Instrument Sans + DM Mono, theme system/light/dark override, 54px web and 56px mobile primary button, inputs, cards, tables, status, sheets/dialog foundations, accessibility. Only **B** edits token/UI modules. Can generate static stories/previews while API is underway; must use contract types for real screens.

**Gate P1:** cross-tenant reads/writes are denied in tests; theme and tokens work web/Android/iOS; lint/typecheck pass; exact font sizes/weights and theme inversion are documented.

## P2 — Parking domain: facilities, zones, occupancy and rates

**Dependencies:** P1 DB/Auth and frozen `facility/rate/capacity` contracts.

Build: operator facility configuration, zone capacities by category, out-of-service adjustment, gate/location metadata (manual only), public/private discoverability, immutable versioned rate rules, PHP exact-money calculations, check-in with locked capacity and random QR ticket hashes, event/audit logs, current occupancy and freshness fields.

**QA:** concurrency at last available bay: exactly one check-in succeeds; rate tests cover minimum, partial-hour rounding, overnight, weekend, boundary and rate changes; no public exposure of private condos; no customer names required for guest check-in.

**Gate P2:** a staff/API caller can create a valid entry, and the system shows correct active session and physically occupied count; rates are versioned, test suite green.

## P3 — Staff native manual-operations app

**Dependencies:** P2 routes and ticket formats.

Build: Expo Router staff app for Android and iOS with distinct layouts/components where appropriate; auth/facility switching; simple Start Shift/End Shift; Create Ticket (optionally plate), printed/ticket-sharing fallback; active sessions, scan QR; cash collection screens; exit verification preview with *clear denied states*; user-friendly error and zero-connectivity screens. Staff workflows should minimize taps. Basic Expo SQLite provisional event queue may be introduced with explicit 'PENDING SYNC' UI but not authoritative settlement.

**QA:** staff without facility permissions cannot see another branch; QR scan does not claim payment; scan permission denied case works; Android hardware-back and iOS sheets feel native; no direct DB privileged writes.

**Gate P3:** test attendant can check in a car, locate its session, see provisional fee, and begin checkout. Real cash/digital finalization comes from P5; do not claim it works before integration.

## P4 — Operator web dashboard and customer CRM

**Dependencies:** P1 design foundation, P2 API contracts.

Build: operator overview with nonredundant stats, facilities and rate configurator, active sessions, staff grants, shift/reconciliation views, customer-support CRM with opt-in/verified customer profiles and service cases, accessible search/filter/detail, controlled fee adjustment entrypoints (not automatic refund). Tables must paginate server-side. Include clear freshness timestamps and incident states.

**Gate P4:** organization owner manages only their own facilities; case lookup scoped; user sees rate preview before publishing; admin action logs are readable and immutable.

## P5 — Money and secure physical exit

**Dependencies:** P2 sessions/rates + P3 staff workflow interfaces + decisions on digital payment partner. Can implement a *sandbox provider adapter* in parallel with P3 UI after API contracts freeze; real provider credentials are not necessary for early tests.

Build: checkout quote snapshot; cash shifts/cash movements and reconciliation; PSP adapter, provider-signed webhook verification, merchant-reference validation, deduplicated events, no double charge; payment intents/success/refunds; time-limited one-time exit authorization; `exits/verify` read/preview and atomic `exits/confirm` with `SELECT FOR UPDATE`/conditional update; robust error codes and audit. Recalculate for expired post-payment grace. The original payment never counts toward an unrelated session.

**QA (blocking):** repeated webhooks, user screenshot forgery, wrong facility, old/closed ticket, refund after payment, two exits concurrently, late webhook, unpaid overtime, authorization reuse, two cashiers on one ticket, API timeout/retries and wrong org roles. Simulate multi-provider behavior with fake/sandbox adapter. Never mark space free before physical departure.

**Gate P5:** cash and sandbox digital payment can settle a session, only an authorized attendant can close it exactly once, and shift/report totals reconcile. Live-money launch remains **blocked** until provider/legal/commercial requirements are signed off.

## P6 — Driver app, platform admin CRM, reports

**Dependencies:** P2 public discovery; P5 payment/checkout stable; P1 UI foundations.

**Driver app:** nearby parking search (PostGIS), facility detail, public-only rate/capacity, freshness labels, no reservations, secure ticket claim, running fee, digital payment initiation/status, history; guest/no-install workflow remains via attendant and optional browser-hosted checkout (not a PWA).

**Platform Admin CRM:** leads, operator accounts, onboarding checklist, verification status, platform support cases, account activities, limited billing/PSP merchant status metadata, restricted escalation. Platform admins do not receive a global list of all drivers by default.

**Reports:** shift/day/branch income by method, exceptions, active sessions, reconciliation differences. Report tax/invoice ownership as config/metadata pending BIR compliance decision.

**Gate P6:** driver cannot read another driver's session, private facility not discoverable, delayed payment shows pending until verified; operator and platform CRMs have separate tenant/role tests; report totals agree with ledger/event records.

## P7 — Reliability, accessibility, mobile delivery and security

**Dependencies:** P3/P4/P5/P6 functional integration.

Deliver: staff offline event queue reconciliation with dedicated conflict-resolution UX; permanent local event IDs and server idempotency; failed payment recovery; Postgres concurrency soak tests; secrets checks, dependency audit, observability dashboards, backups and recovery drill; WCAG/web keyboard/focus QA; Android/iOS EAS development/preview builds tested on actual devices; deploy/staging smoke tests; security threat model updated.

**Gate P7:** outage runbook works, critical security/fraud scenarios pass, releases build on supported Android/iOS devices, no hard-coded credentials or uncontrolled elevated permissions.

## P8 — Multi-facility Metro Manila pilot

**Dependencies:** all critical P7 gates, operator training, provider/legal reviews. Roll out to **several** facilities in a single district, initially manual operations.

Pilot checklist: sign operator agreements, define merchant/settlement & invoice ownership, configure facility-specific vehicle zones and rates, train staff, perform opening balance/occupancy count, simulate entry/fee/payment/exit, monitor error queue, reconcile daily cash and digital settlements, execute offline incident drill, verify live recorded occupancy accuracy.

**Suggested success metrics (targets to validate in discovery):** unpaid exits prevented, check-in and exit transaction success, percent reconciled shifts, payment mismatch count, occupancy variance, median attendant operation time, number of support exceptions. Avoid invented performance claims; benchmark on devices and facilities.

## Parallel workload by gate

| Window | Session A | Session B | Session C | Session D | Integrator |
|---|---|---|---|---|---|
| P0 | Contracts/DB plan | UI exploration read-only | Threat model read-only | — | Lead owns repo setup |
| P1 | DB/Auth/API | Tokens/UI primitives | QA harness | — | Lead owns shared manifests |
| P2 | Parking/rates API | Operator facility UI | Staff app scaffolding | Pricing tests | Lead merges contracts first |
| P3–P5 | Payments + exit backend | Staff app | Operator web + customer CRM | PSP sandbox/test QA | Lead integrates incrementally |
| P6 | Driver app | Admin CRM | Reports + QA | Mobile native QA | Lead handles API compatibility |
| P7–P8 | Hardening | Accessibility | Offline recovery | Pilot ops docs | Lead release owner |

**Do not start four parallel sessions on one working tree.** Use worktrees/branches, paths and clear read/write ownership; rebase, run CI and merge through integration owner.
