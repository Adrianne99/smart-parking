# Secure Parking Exit API — Metro Manila Parking Platform

**Reference implementation** for the user's existing MVP blueprint v1.3 (React Native + Expo staff and driver apps, Next.js operator portal, Express/Node.js backend, Supabase PostgreSQL, Prisma). This is a focused exit-security module, **not a complete payment processor or production deployment**.

## Core guarantees

- Only a verified Supabase staff JWT (`RS256` or `ES256`) is accepted.
- Staff must have the appropriate membership in the relevant facility or its owning organization; permission is checked *inside* the transaction.
- The QR encodes a **32-byte random ticket secret**, not the public sequential ticket number. Only its SHA-256 hash belongs in `parking_sessions.ticket_token_hash`.
- On **confirm**, PostgreSQL locks the session row (`FOR UPDATE`) before validating payment or changing state.
- A paid parking session needs a **currently active, unexpired exit authorization** issued by a trusted payment flow.
- The authorization is bound to the same session, quote and settled payment; pending or successful payment refunds block exit; digital payments also require a succeeded payment intent and matching provider reference.
- Clock and grace window are evaluated using the DB server's current time.
- Payment status, exit authorization consumption, closing the parking session, confirmation idempotency record, parking event and audit record commit or roll back together.
- The unique confirmation constraint enforces at most one confirmed departure per session; `closed` sessions cannot be used again. Same-staff retry with the same idempotency UUID and identical ticket returns the original result.
- Occupancy should be derived from active/paid/exception sessions, **not** a separate counter that might drift.
- The app's scan/verify response is informational; never open a gate or release a vehicle based on verify alone.

## File structure

```text
src/
  auth.ts                  # Supabase JWT signature + issuer + audience verification
  exit.service.ts          # serializable transaction + locks + one-time consume
  issue-authorization.ts   # INTERNAL payment settlement hook only
  validation.ts            # high-entropy ticket and request hashing
  server.ts                # Express endpoints and fail-closed errors
  db.ts, config.ts, errors.ts
sql/002_secure_exit.sql    # extends previous v1.0 SQL schema
prisma/schema.prisma       # minimal generator schema for raw SQL usage
```

## Install and run

1. On an empty development PostgreSQL database, apply `sql/001_initial_schema.sql` (included copy of your earlier blueprint) first. Do not reapply it to a database with existing tables.
2. Apply `sql/002_secure_exit.sql` using `psql` or Supabase SQL Editor. **Review existing data first**: the new closed-session timestamp constraint will fail if old rows say `closed` but have no `exited_at`.
3. Copy `.env.example` to `.env` and set server-only `DATABASE_URL`, `SUPABASE_URL`.
4. `npm install`
5. `npm run prisma:generate`
6. `npm run typecheck`
7. `npm test`
8. `npm run dev`

The minimal `prisma/schema.prisma` exists solely to generate Prisma's transaction and parameterized raw-query client. **Do not run `prisma migrate dev` against the existing schema with that partial Prisma model.** Maintain SQL migrations as the source of truth, or introspect the complete database and design a full Prisma schema before switching migration ownership.

The initial SQL uses a UUID `user_id` mapped to Supabase Auth user IDs; it does not include physical FK constraints to `auth.users`.

## Required ticket issuance

When the entry service creates a session:

```ts
const ticketToken = createTicketToken();
const sha256HexHash = ticketHash(ticketToken);
// In an entry DB transaction, write decode(sha256HexHash, 'hex') into
// parking_sessions.ticket_token_hash, along with facility, rate snapshot and entry.
// Put ticketToken in QR; show it only to its holder and authorized staff.
// NEVER store ticketToken in logs, analytics, push notifications or plain DB columns.
```

Do not create tickets with user-controlled or sequential secrets. Physical ticket copying is still possible; staff must compare the plate/vehicle and follow loss-of-ticket procedures. If printing ticket secrets, treat them as sensitive.

## HTTP API

Staff first scans a QR token, then optionally verifies the provisional state:

```http
POST /v1/facilities/<facility-uuid>/exits/verify
Authorization: Bearer <supabase-staff-access-token>
Content-Type: application/json

{ "ticketToken": "pk_<43-character-url-safe-token>" }
```

Example valid response:

```json
{
  "eligible": true,
  "sessionId": "<uuid>",
  "vehicle": { "plateNumber": "ABC 1234", "class": "car" },
  "authorizationExpiresAt": "2026-11-05T07:55:00.000Z",
  "checkedAt": "2026-11-05T07:53:15.000Z",
  "disclaimer": "Preview only; confirmation repeats all checks"
}
```

Staff compares the physical vehicle, then taps Confirm:

```http
POST /v1/facilities/<facility-uuid>/exits/confirm
Authorization: Bearer <supabase-staff-access-token>
Idempotency-Key: <new-random-uuid-for-this-confirm-action>
Content-Type: application/json

{ "ticketToken": "pk_<43-character-url-safe-token>" }
```

Successful response:

```json
{
  "status": "closed",
  "sessionId": "<uuid>",
  "exitedAt": "2026-11-05T07:53:16.000Z",
  "alreadyConfirmed": false
}
```

A retry with the **same** idempotency key, same staff identity and same ticket returns 200 with `alreadyConfirmed: true`. A new key on a closed ticket returns 409 `TICKET_ALREADY_USED`.

Other expected error codes: `PAYMENT_REQUIRED`, `EXIT_AUTHORIZATION_MISSING`, `PAYMENT_NOT_SETTLED`, `EXIT_GRACE_EXPIRED`, `FACILITY_ACCESS_DENIED`, `INVALID_PAYMENT_INTENT`, `IDEMPOTENCY_KEY_REUSED`. Unavailable database results in `SERVICE_UNAVAILABLE` and **no vehicle release**.

### How an authorization is issued

**Never** offer an HTTP endpoint allowing drivers or staff to mark a digital payment succeeded or generate their own exit authorization.

The payment provider adapter should independently verify webhook signatures, prevent event replays, confirm merchant ownership, payment amount in PHP centavos, quote, provider transaction reference and final settlement status. Then, in a short DB transaction:

1. Lock the session row (same global lock order as the exit endpoint).
2. Record the provider-verified successful payment and status of its payment intent.
3. Mark the corresponding valid checkout quote as `used`.
4. Call `issueExitAuthorizationInPaymentTransaction(tx, sessionId, paymentId)` before committing.

For cash payments, the authorized cashier service must verify their open cashier shift and record a genuinely received amount; the same internal function can then issue authorization. Cash fraud and cashier reconciliation still need separate operational controls.

The example issuance function accepts **already verified DB records** and cannot authenticate a payment provider by itself. It should be called within your actual payment processor's verified transaction, not from a generic public route.

The facility policy table `facility_exit_policies` defines `grace_seconds` (default 600 = 10 minutes). A repeated webhook never resets the clock. A delayed webhook may require manual reconciliation if the verified paid timestamp's grace window has already elapsed.

## Additional fees after expired grace

If the exit window expires, the exit API responds `EXIT_GRACE_EXPIRED` and does **not** release occupancy. Your pricing engine must create a **new quote for only the incremental unpaid amount**, and a new cash/digital payment records that incremental fee. The trusted payment flow then marks the old authorization expired and grants a new, time-limited authorization. The SQL migration changes the old v1.0 one-success-per-session index to one-success-per-quote for this reason.

This example does **not** implement the pricing engine, incremental fee calculation, refunds, payment webhook authentication, or exceptional free/waived tickets; these require dedicated modules and tests. A zero-fee parking session should use an audited, explicit exemption policy rather than pretending a digital payment happened.

## Race-condition testing checklist (required before production)

| Test | Required behavior |
|---|---|
| Two attendants confirm same ticket simultaneously with different keys | Exactly one 200; other 409, or retry then 409 |
| Network loses response; same staff retries same key | 200 with `alreadyConfirmed=true`; still only one departure record |
| Same idempotency key reused on another ticket | 409 `IDEMPOTENCY_KEY_REUSED` |
| Paid in past, grace expired | 409 `EXIT_GRACE_EXPIRED` |
| Digital intent pending, fake screenshot | 409; no gate release |
| Confirm another facility's ticket | 404; no cross-tenant access |
| Staff without active membership | 403 |
| Refund/reversal racing with exit | Serialized against payment lock; no read of uncommitted payment |
| Database unavailable | 503 and no exit |
| Re-scan closed ticket | 409 `TICKET_ALREADY_USED` |
| Payment provider replays webhook | Reuse existing authorization; do not extend grace |
| A vehicle leaves while verify view is open | Confirm still rejects previous preview |

`npm test` includes offline unit tests for token and request hashing. **Database concurrency/integration tests still need a seeded test database**; don't mistake a passing unit test for production assurance.

## Operational requirements beyond the module

- Enforce HTTPS and rate limiting at your edge/API; configure trusted proxy IPs correctly.
- Keep `DATABASE_URL`, gateway secrets and Supabase service-role credentials off devices.
- Consider DB roles/GRANTs preventing untrusted application components from altering `payments.status` or the exit tables. Service isolation and auditing matter because raw SQL bypasses client-side RLS assumptions.
- Any refund flow must lock the payment row and revoke its active authorization in the same transaction. Pending or successful refunds block normal exits.
- Safely handle QR photocopying, plate mismatch, ticket loss, network failure, and manual override via separately audited supervisor flows.
- For a physical gate, **only** an authenticated on-premises gate controller should act on a server-issued, short-lived, single-use exit command. This sample confirms a human-attendant exit, not a boom-barrier control system.
- The PostgreSQL schema, authorization issuance, and payment system must be tested as one unit. Supabase Auth signing keys must be asymmetric to use the local JWKS verification code.

## References

- Prisma v6 interactive transactions and isolation: https://www.prisma.io/docs/orm/v6/prisma-client/queries/transactions
- PostgreSQL row locks: https://www.postgresql.org/docs/current/explicit-locking.html
- Supabase Auth JWT verification: https://supabase.com/docs/guides/auth/jwts


## Platform integration update — Blueprint v1.2 (monochrome + dual CRM)

This exit-security package continues to be a **focused backend reference module**. The wider parking platform's updated product specification is distributed separately as `metro_manila_smart_parking_docs_v1_2.zip`, with its top-level `README.md`, `docs/DESIGN_SYSTEM.md`, `docs/CRM_PRODUCT_SPEC.md`, `docs/SCREENS_AND_MODALS.md`, and shared token source. **No CRM APIs or mobile UI components have been implemented in this focused exit-security package.**

### Current platform stack

- Next.js + TypeScript + Tailwind CSS — operator/client CRM and platform-admin CRM.
- Node.js + Express.js — authoritative REST API, including this module's server-side exit checks.
- Supabase Auth/PostgreSQL + Prisma — tenant permissions, sessions, payments, and proposed CRM records.
- React Native + Expo for **separate Android/iOS driver and staff apps**; no PWA. NativeWind for mobile styling.
- TanStack Query for server state; limit `useEffect` to actual subscriptions/native side effects.

### UI and branding contract

- Quiet Utility palette: light `#FFFFFF` background / `#111111` text, dark `#0B0B0C` background / `#F5F5F4` text, inverted primary buttons.
- Typography: Instrument Sans, mostly weights 400–500; DM Mono only for technical IDs/financial figures; no Inter/Poppins.
- Platform client/operator CRM and platform-admin account CRM have distinct data boundaries and permissions. **Neither may bypass exit authorization or directly modify payment settlement state.**
- Staff mobile exit modal must never claim that a scan/verify preview is an irreversible clearance; final release remains the atomic `POST .../exits/confirm` request in this API.

See the separate Blueprint v1.2 documentation bundle for planned architecture and page/modal specifications. Keep the `sql/002_secure_exit.sql` migration independent of the **review-only** `sql/003_crm_foundations.sql` proposal.


---

**v1.3 documentation note:** The secure-exit module is an independent reference implementation, not included as executable code in this documentation-only ZIP. The separate earlier source archive can be used as a reference; before integrating, verify migrations, transactional invariants, the payment provider settlement hook, and tests against your actual schema. The operator/admin CRM does not gain implicit authority to close or refund sessions.
