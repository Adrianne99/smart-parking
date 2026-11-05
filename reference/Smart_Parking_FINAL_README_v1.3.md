# Metro Manila Smart Parking — Product & Engineering README

> **MVP Blueprint v1.3 · November 2026 · Design direction: Monochrome / Quiet Utility**
>

> **Start coding:** Read [Development Start Here](docs/DEVELOPMENT_START_HERE.md) first.
>
> **Status:** Architecture and design specification, not a deployed application. This repository bundle contains documentation, design-token implementations, a CRM prototype, and a conceptual SQL migration; it does not claim to implement the entire product.

## Product vision

Build a **multi-tenant B2B parking operating system** for independent lots, malls, condominiums, hospitals, and commercial facilities across Metro Manila. Parking operators run branches, rates, occupancy, attendants, and collections; drivers discover participating facilities and pay for verified parking sessions. Start with manual attendants and paper tickets, without requiring RFID, ANPR, or reservations.

### Confirmed decisions

- **Web:** Next.js + TypeScript + Tailwind CSS — platform administration, operator dashboards, both web CRM surfaces.
- **API:** Node.js + Express.js + TypeScript — the **only authoritative write path** for sessions, pricing, payment records, customer data, and physical exits.
- **Data/auth:** Supabase PostgreSQL, Supabase Auth, Prisma (with migrations owned by one migration strategy).
- **Mobile:** React Native + Expo for **separate driver and staff apps**, on Android and iOS. Different **native interaction patterns** by platform; shared domain logic and design tokens. **No PWAs.**
- **Server data:** TanStack Query for fetching, caching, invalidation, and mutations; avoid effects for ordinary API state. Use effects only for real subscriptions and imperative platform integration when necessary.
- **Mobile styling:** NativeWind, using a version compatible with the Expo SDK; web uses Tailwind CSS. Shared semantic tokens, not shared DOM components.
- **Typography:** Instrument Sans (UI, 400/500), DM Mono (operational numerals and references, 300/400/500). replacing the previous technical typeface.
- **Primary controls:** 52–56px tall black-on-white / white-on-black buttons with comfortable horizontal padding, medium-weight labels, and clear loading/disabled states.
- **Payments:** Cash and provider-verified digital from day one, **no self-issued prepaid wallet** in MVP.
- **Discovery:** Real-time **reported** occupancy, no reservations. Pilot multiple facilities within one Metro Manila district.
- **CRM:** Two **distinct, permission-separated** CRMs: Operator Customer CRM and Platform Admin Operator CRM.
- **UI direction:** Minimal white background, ink-black text, black primary CTA with white label; in dark mode invert backgrounds, foreground and button fills; no gradients or decorative glass effects.

## Design philosophy — Quiet Utility

The product should feel **confident, operational, understated, and unmistakably human-designed**.

1. Use abundant but purposeful whitespace. Layout density is responsive: desktop data tables, mobile focused tasks.
2. Use **Instrument Sans** for the interface (`400` regular / `500` medium; `600` only for small high-priority emphasis). Do **not** use Inter, Poppins, or generic heavy geometric headlines. Use **DM Mono** selectively for ticket references, audit IDs, timestamps and amounts. Optional **Instrument Serif** *only* for a marketing headline, never a dashboard or modal.
3. Use **100% neutral colors** for foundational UI. Use semantic textual statuses and icons; avoid colored status badges as the only indicator. No gradient, no random illustrations, no exaggerated pill cards, no permanent drop shadows.
4. Default **light**: page `#FFFFFF`, text `#111111`, primary button `#111111` / `#FFFFFF` text. Default **dark**: page `#0B0B0C`, text `#F5F5F4`, primary button `#F5F5F4` / `#111111` text. Follow OS theme by default with a manual Light / Dark / System setting.
5. Rely on type scale, alignment, fine separators, spacing and informative empty states rather than decoration.
6. Make actions unambiguous. Prefer clear labels (`Confirm exit`) over jargon (`Execute`). Never show a paid receipt as proof of departure approval.
7. Meet WCAG 2.2 AA targets on the web; provide minimum 44 × 44 px primary touch areas on mobile, visible focus rings, reduced motion, and accessible dialogs.

**Canonical documentation:** [Design System](docs/DESIGN_SYSTEM.md) · [CRM Specification](docs/CRM_PRODUCT_SPEC.md) · [Screens & Modals](docs/SCREENS_AND_MODALS.md) · [Development Start Here](docs/DEVELOPMENT_START_HERE.md) · [MVP Blueprint](docs/MVP_BLUEPRINT.md)

## Application map

| Surface | Stack | Users | Primary jobs |
|---|---|---|---|
| `apps/web` `/admin` | Next.js | Platform admins | Operators, onboarding, account CRM, global support, subscriptions, system controls |
| `apps/web` `/operator` | Next.js | Owners/managers/cashiers (authorized) | Facilities, capacity, rates, sessions, reconciliation, operator customer CRM |
| `apps/driver` | Expo + React Native | Drivers | Search, map, facility details, claimed ticket, quoted fee, digital checkout, history |
| `apps/staff` | Expo + React Native | Attendants/cashiers | Fast check-in, ticket scan, payment verification, cash collection, authorized exit, shift close |
| `apps/api` | Express | All authorized clients | Authz, session engine, occupancy, rate evaluation, payment security, CRM, audit, reporting |

### Conceptual monorepo

```text
smart-parking/
├── apps/
│   ├── web/                 # Next.js: /admin and /operator
│   ├── driver/              # Expo Router: driver app for Android and iOS
│   ├── staff/               # Expo Router: staff app for Android and iOS
│   └── api/                 # Express REST API + background workers
├── packages/
│   ├── design-tokens/       # Canonical light/dark themes and scales
│   ├── api-client/          # Typed fetch client, auth interceptor
│   ├── contracts/           # Zod and shared DTOs
│   ├── database/            # Prisma models and migrations
│   ├── pricing/             # Pure calculation helpers and fixtures
│   └── ui-mobile/           # Shared React Native primitives, not web UI
├── docs/
│   ├── DESIGN_SYSTEM.md
│   ├── CRM_PRODUCT_SPEC.md
│   └── SCREENS_AND_MODALS.md
└── turbo.json
```

**Note:** This document bundle is not a runnable Turborepo. The tree describes the target application. The provided files demonstrate architecture and theme decisions; connect them to your scaffolded monorepo.

## Roles & tenancy

- Platform: `platform_super_admin`, `platform_support`, `platform_sales`, `platform_auditor`.
- Organization: `owner`, `manager`, `auditor`.
- Facility: `manager`, `attendant`, `cashier`, `auditor`.
- Driver: can view only their own verified/claimed records; anonymous walk-ins remain valid.
- **Every operator CRM query is scoped to organization ID and, where appropriate, facility assignments.** The platform CRM's operator account data is not a hidden portal to every driver's parking history.
- No frontend-enforced permission is sufficient. The API validates Supabase JWT, role, scope, record ownership, field-level access and audit requirements.
- Treat platform support access to driver PII as **exceptional, purpose-bound, time-limited and audited**.

## Product scope (MVP)

### Parking operations

- Organization onboarding and multiple facilities; location type, public/private visibility, vehicle rules.
- Zones and capacity by vehicle category; report `occupied`, `available`, `blocked` and freshness timestamp separately.
- Published immutable rate versions: initial hours, succeeding hours, flat, daily/overnight, grace, exclusions and rounding.
- Staff paper/QR ticket issuance with high-entropy bearer secret; check-in and session audit events.
- Running provisional fee; server quote at checkout; paid-but-still-parked state and validated physical exit.
- Cashier shifts and reconciliation; separate cash versus digital settlements; refunds and adjustments require permission.
- Driver app facility discovery, rate display, reported availability, active session and payment history.
- Offline-tolerant staff observations in Expo SQLite: **provisional**, reconciled on connection; never approve final digital settlement or exit from untrusted cached data.

### CRM — two distinct products

**Operator Customer CRM** (`/operator/customers`): helps parking businesses support customers and look up parking history within their own organizations. Profiles are only created under a defined lawful basis; anonymous walk-in parking does **not** silently become a marketing contact. Includes profile lookup, parking history where authorized, cases, notes, customer preferences/consent, and a simple resolution workflow.

**Platform Admin Operator CRM** (`/admin/accounts`): helps your SaaS team manage business leads, operator accounts, contacts, onboarding steps, documents, facilities, contracts/subscriptions, support tickets and account activity. It is not a cross-operator driver-database view.

MVP CRM is **service and operations focused**. Marketing automations, campaigns, scoring, mass messaging and sales-pipeline forecasting are future additions. See [CRM Product Specification](docs/CRM_PRODUCT_SPEC.md).

## Core API outline

```text
POST   /v1/facilities/:facilityId/check-ins
GET    /v1/facilities/:facilityId/occupancy
POST   /v1/sessions/:sessionId/checkout-quote
POST   /v1/sessions/:sessionId/payment-intents
POST   /v1/facilities/:facilityId/exits/verify
POST   /v1/facilities/:facilityId/exits/confirm
GET    /v1/operator/customers
GET    /v1/operator/customers/:customerId
POST   /v1/operator/customer-cases
PATCH  /v1/operator/customer-cases/:caseId
GET    /v1/admin/accounts
POST   /v1/admin/account-leads
PATCH  /v1/admin/accounts/:accountId/onboarding
POST   /v1/admin/support-cases
```

All list endpoints: cursor pagination, server-side search/filter, tenant/permission checks and explicit sorts. All important mutations: idempotency keys where appropriate, structured errors, audit entries and optimistic concurrency when editing records. Never trust `organizationId` supplied by a client without verifying membership/authorization.

## Data strategy

- PostgreSQL with UUIDs, `TIMESTAMPTZ` for instants, display `Asia/Manila` times, amounts as **integer centavos**.
- Immutable payment/parking events; authoritative session mutation with transaction, row locking and idempotency.
- CRM records link to parking sessions only with authorized tenant scope; never copy full payment credentials.
- CRM customer identity != driver account != ticket bearer token. A vehicle or ticket is not proof of person identity.
- Prefer row-level security for defense in depth where it fits, but backend service-role access is **not magically protected** by RLS; maintain explicit service authorization and least-privilege DB roles.
- See [Conceptual CRM SQL](sql/003_crm_foundations.sql) for a migration **proposal**—review before applying to a real schema.

## Query / mutation guidelines

```tsx
const customersQuery = useQuery({
  queryKey: ['operator', organizationId, 'customers', filters],
  queryFn: () => api.customers.list(organizationId, filters),
  enabled: Boolean(organizationId),
  staleTime: 30_000,
});

const createCase = useMutation({
  mutationFn: api.cases.create,
  onSuccess: () => queryClient.invalidateQueries({ queryKey: ['operator', organizationId, 'cases'] }),
});
```

Do not use `useEffect` to mirror `query.data` into local state. Local form state belongs in form controls; server state belongs in TanStack Query. For real-time occupancy or payment status, integrate authoritative pushes with focused invalidation or server polling, not blind perpetual polling in every list view. React Native network/focus integration requires native lifecycle support.

## Theme implementation

- [Canonical typed tokens](packages/design-tokens/src/tokens.ts) — light/dark colors, spacing, radii, typography, elevation, motion.
- [Web CSS tokens](apps/web/styles/theme.css) — semantic custom properties, focus states and Tailwind v4 theme aliases.
- **Theme choice:** `system` default; authenticated user's override stored in account preferences, local override for logged-out users. Hydration: avoid light-to-dark flash by applying web theme before first paint. Native: use OS appearance and an explicit override if chosen.
- NativeWind and Tailwind may use **different major versions**; don't directly copy web config to mobile. Map the *same design-token values* into each renderer. NativeWind v4 currently documents Tailwind 3 setup; v5 is a prerelease and should not be assumed production-ready without evaluation.
- Do **not** commit/distribute font binary files in this document bundle. Install font packages according to your app tooling and license requirements.

## UX rules, sheets, dialogs and modals

- Prefer **page** for multi-step or complex work (new facility, rate plan, merchant onboarding), **drawer** for reading/editing a CRM record while preserving list context, **dialog** for a concise edit/decision, and **alert dialog** for irreversible or financial actions.
- Web dialog: 480–560px for short forms, max 640px for confirmation/details, focus trap, visible title, Escape/cancel, focus return. Long forms go to a page or drawer with sticky save footer.
- Native: iOS uses native-feeling bottom sheets/action sheets; Android uses Material-style sheet/dialog depending on action. Avoid copying iOS controls wholesale onto Android.
- Modals never show more than 1 primary CTA; use clear errors at the correct field; preserve draft on accidental interruption; prevent duplicate submits.
- **Security-critical:** payment status preview never authorizes the physical gate. Confirm exit always performs a fresh backend transaction and checks the ticket, verified payment, paid exit grace window and one-time consumption.

## Required UX screens

- **Operator:** Overview, Facilities, Sessions, Rates, Payments, Shift Closing, Customers (CRM), Customer Detail, Cases, Staff, Reports, Settings.
- **Platform admin:** Overview, Accounts (CRM), Lead Detail, Onboarding, Facilities, Support Inbox, Billing/Subscriptions, Audit, Settings.
- **Driver:** Nearby Parking, Facility Details, Active Ticket, Pay, Receipts/History, Profile/Theme.
- **Staff:** Facility Shift, New Check-In, Scan Ticket, Payment Status, Collect Cash, Confirm Exit, Exceptions, Close Shift.

Detailed layouts, tables, empty states, and every important modal are in [Screens & Modals](docs/SCREENS_AND_MODALS.md) · [Development Start Here](docs/DEVELOPMENT_START_HERE.md) · [MVP Blueprint](docs/MVP_BLUEPRINT.md).

## Recommended build order

1. Bootstrap monorepo, auth/tenant boundaries, DB migrations, UI foundations and shared design tokens.
2. Build facility/capacity/rate APIs plus Next.js operator configuration screens.
3. Ship React Native staff check-in, ticket scan, cashier shift and verified exit; test a full parking session.
4. Integrate verified cash and digital payments with webhooks, idempotency, refund rules and cashier reconciliation.
5. Build the React Native driver app (discovery, ticket, running fee, digital checkout).
6. Add operator customer CRM and platform account/onboarding CRM, then pilot multiple facilities in one district.

## Local setup (once application code is scaffolded)

```bash
# illustrative target workflow; this docs bundle is not a runnable app
pnpm install
pnpm turbo run lint typecheck test
pnpm --filter web dev
pnpm --filter api dev
pnpm --filter driver start
pnpm --filter staff start
```

Configure individual `.env` files. Never expose database credentials, service-role keys or payment provider secrets in `NEXT_PUBLIC_*` or `EXPO_PUBLIC_*` values. Expo builds require matching native dependencies and development builds for camera and future equipment SDKs.

## Non-goals & implementation gates

- No PWA, prepaid wallet, reservation, GPS tracking of individual drivers, RFID gate automation, ANPR, loyalty campaign or bulk marketing CRM in the first release.
- Confirm provider onboarding, settlement ownership, BIR invoicing, data privacy obligations, public/private facility permissions and required device/hardware compliance before live payments.
- The SQL and prototype in this bundle are **starting points**; not production-ready code, migration or a claim of regulatory approval.

## Documentation index

- [`docs/DEVELOPMENT_START_HERE.md`](docs/DEVELOPMENT_START_HERE.md) — exact first development tasks, scaffolding sequence, implementation gates, and font setup.
- [`docs/MVP_BLUEPRINT.md`](docs/MVP_BLUEPRINT.md) — full multi-facility product specification and detailed business rules.
- [`docs/SECURE_EXIT_API.md`](docs/SECURE_EXIT_API.md) — security integration reference for one-time verified vehicle exits.
- [`docs/DESIGN_SYSTEM.md`](docs/DESIGN_SYSTEM.md) — visual language, theme matrices, component rules, accessibility and platform-specific UI.
- [`docs/CRM_PRODUCT_SPEC.md`](docs/CRM_PRODUCT_SPEC.md) — operator/client and platform admin CRM requirements, permissions, flows and acceptance criteria.
- [`docs/SCREENS_AND_MODALS.md`](docs/SCREENS_AND_MODALS.md) — complete IA and interaction details.
- [`packages/design-tokens/src/tokens.ts`](packages/design-tokens/src/tokens.ts) — usable token source for apps.
- [`apps/web/styles/theme.css`](apps/web/styles/theme.css) — web light/dark semantic theme CSS.
- [`examples/crm-ui-preview.html`](examples/crm-ui-preview.html) — standalone non-production browser design preview with working theme toggle and dialogs.
- [`sql/003_crm_foundations.sql`](sql/003_crm_foundations.sql) — review-only conceptual CRM tables.
