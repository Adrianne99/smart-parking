# START HERE — Use This Package to Build Smart Parking with Multiple AI Sessions

This package is **a prompt-driven engineering playbook**, not a runnable app. It is designed to be copied into a new project repository and given to coding-capable AI agents in IDE/terminal/workspace environments.

## Recommended starting order

1. Create an empty **private** Git repository and bring in these Markdown files (`AGENTS.md`, `01_*` through `05_*`, `reference/`). Keep real credentials out of Git.
2. Open **one lead coding session** in the repository. Paste the **complete content** of `01_MASTER_BUILD_PROMPT.md`. This is the lead/integrator prompt, not a request for a one-message code dump.
3. Let the lead complete **P0 contracts and workspace foundation** before creating parallel feature worktrees. Update `docs/progress/STATUS.md`.
4. Create 2–3 separate git worktrees, then give each AI coding session the **common preamble** and an assigned role prompt from `03_PARALLEL_SESSION_PLAYBOOK.md`.
5. Integrate each branch via PR/review into `main`. Gate the next phase using `02_PHASES_AND_GATES.md` and `04_SECURITY_AND_CONTRACTS.md`.
6. Repeat with Staff, Payments/Exit, Operator CRM, Driver, Platform CRM and QA. End with actual device, provider sandbox and parking-facility pilot tests.

## Files in this package

| File | Use |
|---|---|
| `01_MASTER_BUILD_PROMPT.md` | Full platform build prompt to paste into lead AI coding session |
| `02_PHASES_AND_GATES.md` | Exact phase order, dependencies, deliverables and acceptance gates |
| `03_PARALLEL_SESSION_PLAYBOOK.md` | Worktree setup, ownership matrix, and **10 copy-paste prompts** for specialized agents |
| `04_SECURITY_AND_CONTRACTS.md` | Tenant, payment, exit, concurrency, privacy and security test rules |
| `05_HANDOFF_TEMPLATE.md` | Standardized per-session status report and integration handoff |
| `AGENTS.md` | Short repository instruction file for coding agents |
| `reference/Smart_Parking_FINAL_*.md` | Your previously agreed v1.3 product, design, CRM, screens and exit requirements |

## Smallest useful first sprint

- Root pnpm/Turborepo with stable package/version choices.
- Typed Express `/v1/health` and error format, dev Supabase connection, Prisma initial migration.
- Auth verification and organization/facility RBAC with **two-tenant negative tests**.
- Semantic light/dark tokens and 54px web/56px native button, Instrument Sans + DM Mono installed.
- Next.js operator facilities empty/list screen using TanStack Query.
- Expo driver and staff app shells with independent Android/iOS UI conventions.
- CI typecheck/lint/unit tests; documentation on what is stubbed and what is real.

**First success criterion:** organization A cannot access facility or CRM records belonging to organization B; all application shells build, and main branch is clean. Do not attempt real payment checkout until tenant isolation and server-side contracts are verified.

## Working assumptions

- Cash and digital payments from MVP, but digital will use a sandbox PSP adapter until onboarding and legal/merchant responsibilities are verified.
- Multiple facility types are modeled by policy; legacy RFID hardware integrations and automatic gate control remain future phases.
- Guest walk-in tickets work without installation; driver app is React Native for iOS/Android, not a PWA.
- Platform-admin CRM tracks parking operators, while operator CRM handles scoped customer support and cases.
- Recorded availability is derived from manually captured occupancy and includes a freshness indicator.

## Package compatibility

The v1.3 reference documents are product/design **inputs**. Some contain earlier illustrative SQL, API snippets and integrations. Do not apply unreviewed migrations or paste reference code directly into production. On any discrepancy, use: approved ADR/actual code contract > `01_MASTER_BUILD_PROMPT.md` > the current `02_PHASES_AND_GATES.md` > v1.3 historical reference, while recording why a deviation occurred.
