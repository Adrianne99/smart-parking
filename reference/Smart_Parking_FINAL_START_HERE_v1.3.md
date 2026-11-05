# START HERE — Smart Parking Development Plan v1.3

**Target:** Multi-tenant Metro Manila Smart Parking MVP • **Status:** Build instructions and architectural decisions, not a prebuilt runnable application • **Updated:** November 2026

## 0. Lock the decisions

| Subject | Decision |
|---|---|
| Web | Next.js, TypeScript, Tailwind CSS |
| Backend | Node.js + Express.js, TypeScript; authoritative REST endpoints |
| Database | Supabase PostgreSQL + Prisma; single migration owner |
| Native | React Native + Expo; **separate `driver` and `staff` apps**, both Android and iOS |
| Native UI | NativeWind + shared semantic token values; platform-specific `*.ios.tsx` / `*.android.tsx` when needed |
| Data fetching | TanStack Query for server state; limit `useEffect` to genuine external subscriptions |
| Fonts | **Instrument Sans** 400/500 for UI; **DM Mono** 300/400/500 for operational data |
| Themes | `system` default; light white/black and dark near-black/off-white |
| Main buttons | 54px web; 56px mobile; 10px radius; 500-weight text |
| MVP | Multiple facility types and sites, manual staff tickets, cash + PSP-verified digital payments, no reservations, two CRMs |

## 1. What is and is not included

This ZIP contains the **documentation and design starter assets**: README, blueprint, UX specifications, security reference, design tokens, a standalone web CRM preview, and conceptual SQL schemas. It does **not** contain working Next.js/Expo/Express app scaffolds, configured external payment credentials, live Supabase project, or production-approved migrations. The older secure-exit TypeScript reference exists as a separate archive.

Start the application repository by scaffolding your apps, then copy the relevant token modules and docs into that repo. Never treat conceptual SQL files as safe to apply without review.

## 2. Suggested workspace structure

```text
smart-parking/
├── apps/
│   ├── web/                 # Next.js — operator + platform admin
│   ├── api/                 # Express — all sensitive transactions
│   ├── driver/              # Expo Router — iOS + Android driver app
│   └── staff/               # Expo Router — iOS + Android attendant app
├── packages/
│   ├── design-tokens/       # use these bundled tokens as a starting point
│   ├── database/            # Prisma schema + migrations
│   ├── contracts/           # DTOs + Zod validation
│   ├── api-client/          # typed client + auth headers
│   ├── pricing/             # pure rate evaluator + fixtures
│   └── ui-mobile/           # shared RN primitives
├── docs/
├── pnpm-workspace.yaml
└── turbo.json
```

Choose **one package manager** (PNPM recommended), pin your actual Node/Expo/NativeWind/Next versions, and commit a lockfile. For the first scaffold, you can run `npx create-turbo@latest smart-parking` and adapt the generated workspace; scaffold Expo apps inside the workspace using `npx create-expo-app@latest`. Verify SDK/NativeWind compatibility before installing native dependencies. Do not copy older instructions blindly across mismatched versions.

### API baseline

- Express routes under `/v1/*` with TypeScript and Zod validation.
- Supabase Auth for identities; verify JWTs and memberships in Express, do not trust a UI role string.
- Prisma/PostgreSQL with explicit tenant scope, transactions, and audit logs.
- Server-side entry timestamp, server-side fee engine, payment-provider webhook verification, and one-time exit confirmation.
- Structured error format, idempotency keys, request IDs, and tenant-aware rate limiting.

## 3. Install the selected fonts

### Next.js web

Use `next/font/google` — fonts are self-hosted by Next.js during build. The complete `layout.tsx` example is in `DESIGN_SYSTEM.md`.

```tsx
import { Instrument_Sans, DM_Mono } from 'next/font/google';

const ui = Instrument_Sans({ subsets: ['latin'], weight: ['400','500','600'], variable: '--font-instrument', display: 'swap' });
const data = DM_Mono({ subsets: ['latin'], weight: ['300','400','500'], variable: '--font-dm-mono', display: 'swap' });
```

Apply `${ui.variable} ${data.variable}` to the root `<html>` and import `apps/web/styles/theme.css` from your global CSS. Use `font-sans` for all UI and `font-mono` only for ticket IDs, money, plate numbers, and timestamps.

### React Native (repeat in `apps/driver` and `apps/staff`)

```bash
npx expo install expo-font @expo-google-fonts/instrument-sans @expo-google-fonts/dm-mono
```

```tsx
import { useFonts } from 'expo-font';
import { InstrumentSans_400Regular, InstrumentSans_500Medium } from '@expo-google-fonts/instrument-sans';
import { DMMono_400Regular, DMMono_500Medium } from '@expo-google-fonts/dm-mono';

const [fontsLoaded] = useFonts({
  InstrumentSans_400Regular,
  InstrumentSans_500Medium,
  DMMono_400Regular,
  DMMono_500Medium,
});
```

This is a legitimate font-loading hook, **not** a `useEffect` used to mirror API state. For a production app, consider embedding fonts using `expo-font` config plugin and test both platforms. Fonts themselves are not included in these documents.

## 4. The first 6 milestones (in implementation order)

| Milestone | Build | Done when |
|---|---|---|
| M0 — foundation | Monorepo, CI, format/lint/typecheck, env validation, themes, fonts, auth, RBAC, tenant-scoped CRUD | Multiple operator accounts cannot access one another |
| M1 — parking | Organizations, facilities, vehicle categories, zones, rate versions, capacity, check-ins, secure ticket issuance | Two concurrent check-ins never exceed usable capacity |
| M2 — checkout | Quote calculator, cash shifts, payment intents, signed PSP webhooks, refund/adjustment policy | Fee changes, duplicate webhooks and disputes are correctly handled |
| M3 — exits | Staff scan, server verification, grace clock, one-time atomic confirm, departure audit, occupancy release | Fake screenshot and reused ticket always fail; only one concurrent exit wins |
| M4 — consumer | Driver discovery, rate details, reported availability, optional ticket claim, digital pay, history | Public/private listing scopes are correct; driver cannot see others' sessions |
| M5 — CRM + pilot | Operator customer support cases, platform operator accounts/onboarding, analytics, offline recovery + QA | Multi-facility pilot reconciles attendance and cash/digital sales reliably |

Although the CRM is listed at M5, you can implement a small platform operator onboarding table at M0 so real pilot organizations can be entered without mock records.

## 5. First sprint backlog (coding starts here)

1. Create repository/workspace and branch protections; decide naming conventions and commit hooks.
2. Create Supabase **development** project; initialize Prisma with migration ownership clearly defined.
3. Implement `organizations`, scoped `organization_memberships`, `facilities`, facility memberships, and audit metadata.
4. Build Supabase JWT verification middleware and API `requirePermission` middleware with tests for cross-tenant access.
5. Add typed Zod contracts and API client with auth headers, request IDs and retry-safe idempotency for writes.
6. Install the two fonts and define light/dark semantic tokens. Build a **54px primary button**, input, status pill, dialog, and table components.
7. Create Next.js platform admin organization-onboarding and operator facilities list screens.
8. Use TanStack Query with correct query keys for organization/facility context; no data-fetching `useEffect`.
9. Add basic CI: typecheck, lint, unit tests and database test job.
10. Create seeds for at least 2 operators with 2 facilities each and verify row/data isolation in API integration tests.

## 6. Core security and data design rules

- No authority from QR contents, payment screenshots, UI cache or stale local state.
- Random high-entropy QR secrets are bearer credentials; store their **hash**, never log the token.
- Only payment provider verified success or authorized cashier payment creates a settled payment.
- Physical exit must be confirmed independently from payment and must be atomic/idempotent.
- Never release occupancy at payment time; only at actual confirmed departure.
- Use integer centavos and `TIMESTAMPTZ`; format display in `Asia/Manila`.
- Make digital payment amount/merchant/quote checks server-side; lock session row for final exit.
- Customers in operator CRM are scoped to the operator and not silently collected from anonymous tickets.
- Platform CRM is about **operator businesses**, not a global driver history database.
- Before money goes live, finalize contractual roles, merchant settlement, invoice issuance, privacy notices and incident procedures with appropriate professionals and provider partners.

## 7. Key test scenarios to write before piloting

- Two phones check in at the final available bay simultaneously.
- Two attendants confirm the same paid ticket simultaneously.
- Driver shows a real payment belonging to a different session.
- Payment webhook repeats several times or arrives out of order.
- Successful digital payment arrives after the client's request times out.
- Paid driver overstays the configured post-payment exit grace period.
- Cash collection exists but cashier shift is closed or wrong facility.
- Phone loses connectivity mid-check-in; pending local event is reconciled without duplicate.
- Manager changes rates while a car is parked; old rate version remains immutable.
- Owner from Operator A requests Operator B's customer CRM record.
- Driver and staff apps switch between light/dark/system without broken text/button contrast.

## 8. API and UI implementation conventions

```tsx
// Remote data uses TanStack Query. A query key always includes tenant and filters.
const sessions = useQuery({
  queryKey: ['facility', facilityId, 'sessions', filters],
  queryFn: () => api.sessions.list(facilityId, filters),
  enabled: Boolean(facilityId),
  staleTime: 10_000,
});
```

- On successful mutations, invalidate the narrowest relevant queries; use optimistic updates only on **non-financial**, safely reversible edits.
- For real-time occupancy, reconcile push events with the server rather than blindly assuming a WebSocket event is an authoritative count.
- Use `useEffect` for true external subscriptions/native lifecycle synchronization only, with cleanup.
- Do not nest dialogs or use one giant modal for facility onboarding or rate configuration.

## 9. Helpful documentation links

- [Main README](../README.md)
- [Full MVP blueprint](MVP_BLUEPRINT.md)
- [Design system](DESIGN_SYSTEM.md)
- [Operator and platform CRM](CRM_PRODUCT_SPEC.md)
- [Pages, screens, dialogs and sheets](SCREENS_AND_MODALS.md)
- [Secure exit integration](SECURE_EXIT_API.md)
- [Official Expo fonts guide](https://docs.expo.dev/develop/user-interface/fonts/)
- [DM Mono repository/license](https://github.com/googlefonts/dm-mono)

**First proof of success:** start an authenticated shift, check in a vehicle, calculate its rate correctly, record valid cash or provider-verified digital settlement, confirm a one-time physical departure, and show accurate available capacity and cash reconciliation without trusting a payment screenshot.
