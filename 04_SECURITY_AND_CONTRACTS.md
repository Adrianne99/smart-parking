# SHARED SECURITY AND API CONTRACT GUARDRAILS

Read this before implementing any backend, cashier, mobile check-out, CRM, or migration change. It complements the earlier `reference/Smart_Parking_FINAL_SECURE_EXIT_API_v1.3.md`, which is an **architectural reference**, not automatically deployable production code.

## 1. Ownership and trust boundaries

1. **Supabase Auth** establishes identity; **Express API** establishes actual permissions for `organization_id`, `facility_id`, role and action.
2. Driver/staff/web clients hold **no privileged Supabase service key**. They do not directly mutate paid status, capacity or exit clearance in the database.
3. Prisma uses a correctly constrained server-side database identity. PostgreSQL constraints and row locking maintain integrity; permission checks occur in API services, backed by RLS where appropriate. When using privileged server DB access, don't assume RLS automatically protects all operations.
4. Payment gateway **authoritative settlement**, not client redirects/screenshots, determines digital payment success.
5. Manual cash settlement is recorded by an authorized cashier within an open/reconciled shift; cashier identity is auditable.
6. QR tickets are **secrets identifying sessions**, not an authorization to exit. Their bearer tokens must be high entropy, hashed at rest and never logged.
7. Only the backend confirms physical exit; automated gate control is out of MVP scope.
8. Guest ticket history requires an explicit secure claim or authorized scoped lookup; plate number alone is insufficient to claim an account.
9. Platform CRM operator account data is distinct from operator customers/cases. Do not join all driver records into an unbounded platform support search.

## 2. Suggested state machines (final names decided in P0)

**Parking session:** `ACTIVE` → `CHECKOUT_PENDING` → `PAID_AWAITING_EXIT` → `CLOSED`; exception paths for `VOIDED` (before use), `EXIT_EXCEPTION`, `OVERSTAY_REQUIRES_PAYMENT`. Payment status is stored **separately** from physical session status; don't collapse both into `paid`.

**Payment intent:** `CREATED` → `PENDING` → `SUCCEEDED` or `FAILED`/`EXPIRED`/`CANCELLED`; refund is tracked as a separate operation with lifecycle `REQUESTED`/`SUCCEEDED`/`FAILED`. A refund or chargeback may revoke exit eligibility.

**Exit authorization:** `ACTIVE` → `CONSUMED` (once only), or `EXPIRED`/`REVOKED`. It belongs to exactly one session and payment/quote context and expires under facility's configured post-payment exit window.

**QR token:** token generation bound to current session, high-entropy `crypto.randomBytes`, SHA-256/HMAC hash with appropriate per-environment secret policy, constant-time comparisons where applicable, scope checked. Mark credential invalid after successful exit or controlled ticket reissuance; reject old credentials.

**Occupancy event:** physically occupied from accepted entry to **confirmed actual departure**; payment never marks a bay available. Overstay is not an exit.

## 3. Concurrency requirements

- Use PostgreSQL transaction and row-level locks on the parking session in check-in/cash settlement/exit flows as needed; avoid ambiguous order and deadlocks. Serializable transactions are appropriate where required; implement bounded retries for serialization errors.
- Under contention for the last capacity unit, exactly one entry can commit. Define the lock owner row (e.g., zone capacity row) explicitly.
- Two device requests for the same exit must not both create a separate success/event. If one has the same idempotency key, it can receive stable idempotent response; a distinct request must be a clear already-closed outcome.
- Webhook processing first authenticates raw payload/signature using provider-specific docs, stores event dedupe reference, then applies a controlled state transition; duplicate and out-of-order events safe.
- Expired exit grace requires a **new quote and payment for additional due amount** (if policy applies), not mutating historic receipt.
- Only one final confirmed checkout/exit record per session; enforce in DB with unique constraints, not only `if` checks in JS.

## 4. Suggested HTTP contract (illustrative)

Use consistent error responses with `requestId`, machine-readable `code`, safe `message`, optional `details`, and correct HTTP status:

| Condition | Suggested HTTP | Error code |
|---|---:|---|
| Missing/invalid authentication | 401 | `UNAUTHENTICATED` |
| Authenticated but no facility permission | 403 | `FORBIDDEN_FACILITY` |
| Session not found in allowed scope | 404 | `SESSION_NOT_FOUND` |
| Ticket token invalid/revoked | 404/410 | `TICKET_INVALID` |
| Payment absent/unconfirmed | 409 | `PAYMENT_NOT_VERIFIED` |
| Payment refunded/reversed | 409 | `PAYMENT_REVERSED` |
| Exit window expired | 409 | `EXIT_WINDOW_EXPIRED` |
| Session already exited | 409 | `SESSION_ALREADY_CLOSED` |
| Duplicate write with same idempotency key | 200/201 replay | `IDEMPOTENT_REPLAY` (internal metadata) |
| Conflict / serializable retry exhausted | 409/503 | `RETRYABLE_CONFLICT` |
| Facility capacity full | 409 | `CAPACITY_EXCEEDED` |

Avoid returning raw internal authorization info to clients. Validation failure typically 400/422 according to the agreed API standard. The client should show actionable, calm messages; do not leak internal policy details across tenants.

## 5. Minimum security test matrix

| Target | Positive | Negative/adversarial |
|---|---|---|
| Auth | valid JWT/membership | tampered JWT, wrong audience/project, role injected via request |
| Tenancy | operator A sees its own | A reads B facility/case by guessed UUID or search |
| Rate | immutable correct quote | old config modified mid-session, client-supplied amount |
| Entry | 1 slot accepted | 2 concurrent last-bay entries, duplicate request |
| Cash | shift + cashier authorized | closed/wrong shift, double posting, manager bypass |
| PSP | authenticated webhook | unsigned/duplicate/replayed/out-of-order/wrong merchant |
| Exit | verified valid grace | screenshot, old token, expired grace, refund, double device scan |
| Offline | pending event reconciled | duplicate/stale local event grants an exit/payment |
| CRM | permitted case | cross-tenant case, unprivileged contact details |
| Discovery | public facility | private/resident-only facility visible publicly |
| Secrets | redacted logs | raw QR token/PSP key/JWT logged |

## 6. PH deployment gates

Before accepting production money or collecting sensitive information at scale, resolve with qualified advisers/provider: (a) who is the merchant of record and actual recipient of funds, and whether the platform's activity requires specific BSP registration/permissions, (b) parking operator's BIR-compliant invoicing and reconciliation responsibilities, (c) privacy notices, data retention, CCTV/plate capture and NPC-related obligations, and (d) equipment certification/integration contracts only if RFID devices are introduced. Don't claim compliance simply because a payment library or Supabase is installed.

## 7. Release stop signs

Block pilot/live rollout for: missing cross-tenant tests, no verified webhook signature, unpaid/expired authorizations able to close exits, non-atomic capacity or exit update, API service credentials embedded in mobile, missing cash-shift reconciliation, inability to recover from a failed callback, or lack of operator incident procedure.
