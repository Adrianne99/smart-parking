# ADR-002 — Parking session, payment and exit lifecycle

**Status:** Proposed (P0) — state names are frozen for P1–P5 unless changed through a contract change
**Date:** 2026-11-05 · **Owner:** Integrator; implemented by P2 (sessions) and P5 (payments/exit)

## Context

Paying and leaving are separate physical events. A paid car still occupies a bay until it physically exits (BR-11). Payment screenshots, QR contents, redirects and push notifications are never proof of settlement (BR-25). The v1.3 references propose slightly different state names. This ADR fixes one set.

## Decision — four independent state machines

**1. Parking session** (`parking_sessions.status`) records the *vehicle's* state, not money:

```text
ACTIVE ──quote──▶ CHECKOUT_PENDING ──settled payment──▶ PAID_AWAITING_EXIT ──confirmed exit──▶ CLOSED
  ▲                    │                                        │
  └──quote abandoned───┘                     grace expired ─────┴──▶ OVERSTAY_REQUIRES_PAYMENT ──new quote──▶ CHECKOUT_PENDING
ACTIVE ──supervisor void (before use)──▶ VOIDED
CHECKOUT_PENDING / PAID_AWAITING_EXIT ──dispute, provider inconsistency, lost ticket──▶ EXIT_EXCEPTION (manager resolution)
```

- `CLOSED` and `VOIDED` are terminal. A closed session is never reopened (BR-10). Later corrections are compensating records.
- Occupancy counts `ACTIVE`, `CHECKOUT_PENDING`, `PAID_AWAITING_EXIT`, `OVERSTAY_REQUIRES_PAYMENT` and `EXIT_EXCEPTION`. It is **derived from sessions**, not a drifting counter. Only `CLOSED`/`VOIDED` free the bay.
- Entry time is server time (BR-02). The session stores its rate-version id plus a validated rate snapshot (BR-05).

**2. Payment intent** (digital, per quote): `CREATED → PENDING → SUCCEEDED | FAILED | EXPIRED | CANCELLED`.
`SUCCEEDED` is set **only** by an authenticated provider webhook or a verified provider status query, never by a client.

**3. Refund** (separate record): `REQUESTED → SUCCEEDED | FAILED`. A pending or successful refund **revokes** any active exit authorization for that session.

**4. Exit authorization** (one per settled quote): `ACTIVE → CONSUMED` (once) `| EXPIRED | REVOKED`.
It is issued inside the same DB transaction that records a settled cash or verified digital payment. It expires after the facility's post-payment grace (`grace_seconds`, default 600). A repeated webhook never extends it.

## Exit rules (from 04_SECURITY_AND_CONTRACTS §2–3)

- `POST …/exits/verify` returns an informational preview only. It never authorizes release.
- `POST …/exits/confirm` requires `Idempotency-Key`. Inside **one transaction** it locks the session row (`SELECT … FOR UPDATE`) and re-checks tenant/facility, an active unexpired authorization, a settled payment for the current quote, and that the session is not refunded or already closed. It then consumes the authorization, sets `CLOSED` + `exited_at` + actor, and writes the parking event and audit log.
- The DB enforces at most one confirmed exit per session with a unique constraint, not just an `if` in code.
- Lock order everywhere (check-in, cash, webhook, refund, exit): **session row → payment rows → authorization row**, to avoid deadlocks. Capacity check-in locks the **zone-category capacity row** first.
- Two attendants racing: one `200`, the other `409 SESSION_ALREADY_CLOSED`. The same key retried returns the original response with `Idempotent-Replayed: true`.

## Error-code mapping

The v1.3 secure-exit reference names are superseded by the registry in `packages/contracts` (see ADR-005):

| v1.3 reference | Canonical |
|---|---|
| `TICKET_ALREADY_USED` | `SESSION_ALREADY_CLOSED` |
| `PAYMENT_REQUIRED`, `PAYMENT_NOT_SETTLED`, `EXIT_AUTHORIZATION_MISSING`, `INVALID_PAYMENT_INTENT` | `PAYMENT_NOT_VERIFIED` (reason in `details.reason`) |
| `EXIT_GRACE_EXPIRED` | `EXIT_WINDOW_EXPIRED` |
| `FACILITY_ACCESS_DENIED` | `FORBIDDEN_FACILITY` |
| `IDEMPOTENCY_KEY_REUSED`, `SERVICE_UNAVAILABLE` | unchanged |

## Consequences

- P2 owns session creation and occupancy. P5 owns payment intents, refunds, authorizations and exits.
- `details.reason` values for `PAYMENT_NOT_VERIFIED` are defined by P5 as a closed enum in contracts.
- Open (operators): grace length per facility, overstay fee policy, lost-ticket procedure, and who may void.
