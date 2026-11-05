# AGENTS.md — Repository-wide AI coding instructions

**The source of truth is `01_MASTER_BUILD_PROMPT.md` plus approved ADRs and `02_PHASES_AND_GATES.md`.** Use the project's finalized v1.3 reference documents for product/design detail. Read these before making changes.

## Non-negotiables

- TypeScript, Next.js, Express, Supabase PostgreSQL/Prisma, Expo React Native (separate native driver/staff apps), Tailwind/NativeWind, TanStack Query.
- No PWAs replacing native mobile apps; no wallet, reservations, RFID/ANPR/gates in MVP.
- Instrument Sans 400/500 UI; DM Mono 300/400/500 operational values; Quiet Utility white/black inverted theme; large strong buttons with medium labels.
- Never use `useEffect` merely to fetch remote API data; TanStack Query owns server state.
- Server authoritative on check-in time, fees, settled payments, authorized exit and occupancy. No trusted screenshots or QR-only release.
- Multi-tenant and facility-bound permissions on every sensitive endpoint. No global driver CRM.
- Database migration ownership is exclusive; do not concurrently edit Prisma schema. Contract changes require Integrator approval.
- Every change needs tests and realistic error/empty/loading/denial paths; no dummy financial integrations represented as production.
- Do not guess BSP/BIR/NPC compliance or payment-provider support; flag external approvals.
- Keep `main` buildable, use independent worktrees, and submit `05_HANDOFF_TEMPLATE.md` with every feature.

## Every session must

1. Check git status and assigned file ownership.
2. Read current `docs/progress/STATUS.md` and feature contracts.
3. State exact phase and small verifiable acceptance criteria.
4. Implement code and tests within ownership.
5. Report actual test commands/outcomes, limitations and changed paths.
6. Prepare handoff and request Integrator review.
