# ADR-004 — Payment provider responsibilities and Philippine regulatory gates

**Status:** Proposed (P0) — **pending commercial, legal and provider due diligence** · **Date:** 2026-11-05 · **Owner:** Integrator + business owner

## Decision (what we build regardless of provider)

1. **PSP adapter interface** in the API (`createPaymentIntent`, `verifyWebhook(rawBody, headers)`, `getPaymentStatus`, `refund`) with a **sandbox/fake adapter** used in all development and tests. No real provider is integrated or represented as live until this ADR is accepted.
2. Webhooks are verified on the **raw body** using the provider's documented signature scheme. Events are stored in an inbox with a unique provider event ID before any state change. Duplicate and out-of-order events are safe.
3. Every settlement checks merchant/sub-account, session, quote, amount (integer centavos), currency `PHP` and final status.
4. **No stored-value wallet, top-up or custodial balance** in MVP.
5. Provider secrets live only in server-side secret storage. They are never in the DB, client bundles, logs or `NEXT_PUBLIC_*` / `EXPO_PUBLIC_*`.

## Not decided (blocks live money, not development)

| # | Question | Who must answer | Blocks |
|---|---|---|---|
| R1 | Who is merchant of record and legal recipient of parking funds: each operator (sub-merchant) or the platform? | Provider + PH payments/legal counsel | Live digital payments |
| R2 | Does our role (routing payments for multiple operators) need BSP registration/licensing (e.g. under Circular 1198 merchant acquiring / OPS rules)? | BSP-experienced counsel | Live digital payments |
| R3 | Which provider supports multi-merchant sub-accounts, split settlement, refunds, QR Ph and webhooks for this model, on which terms? | Provider sales/onboarding (e.g. Xendit, PayMongo, others) | Choosing the real adapter |
| R4 | Which party issues the BIR-compliant invoice/receipt for parking (operator), and what POS/CRM registration is needed? Is a parking ticket an invoice? (No, by default.) | Tax adviser | Pilot with real receipts |
| R5 | Platform SaaS invoicing to operators | Tax adviser | Billing |
| R6 | NPC: controller/processor roles (operator vs platform), privacy notices, retention periods, DPO/registration, PIA, breach procedure | Privacy counsel / DPO | Pilot with real driver data |
| R7 | Plate-number capture and any future CCTV/ANPR rules | Privacy counsel | Plate capture at scale |
| R8 | LGU/landlord authority over rates and visitor rules per facility type | Operators | Facility go-live |
| R9 | NTC/equipment certification if RFID/gate hardware is ever added | Hardware vendor | Post-MVP only |

**We do not claim compliance** for any item above because a library, Supabase or a provider SDK is installed.

## Consequences

- P5 builds and tests against the sandbox adapter. Gate P5 explicitly leaves live money **blocked**.
- Revisit this ADR when R1–R3 are answered. The answers may change the settlement data model, which is a DB-owner review item.
