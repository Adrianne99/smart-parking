# ADR-003 — Staff app offline boundary

**Status:** Proposed (P0) · **Date:** 2026-11-05 · **Owner:** Integrator; implemented in P3 (queue) and P7 (reconciliation)

## Context

Pilot lots have unreliable connectivity. Attendants must keep working, but an offline device must never create money or let a car leave on unverified data (FR-14, BR-21/22).

## Decision

| Offline, the staff app MAY | Offline, the staff app MUST NOT |
|---|---|
| Record **provisional** entry/exit *observations* in Expo SQLite | Mark any payment settled (cash or digital) |
| Show cached occupancy and session data labelled `Offline — actions are provisional` and last-sync time | Show `Payment verified` / green paid state from cache |
| Show a queued count and per-event sync status | Authorize or confirm a physical exit |
| Fall back to the numbered paper ticket book | Change central occupancy before the server accepts the event |

**Queued event shape:** client-generated UUIDv4 `operationId`, `deviceId`, `facilityId`, `actorUserId`, `operationType` (allowlist), `clientOccurredAt`, local monotonic `sequence`, minimal payload (no driver PII beyond the optional plate), `syncStatus`.

**Server replay** (`POST /v1/mobile/staff/sync-operations`, P7):

- Deduplicate on `UNIQUE(device_id, operation_id)`.
- Re-check the actor's *current* membership and the device's non-revoked status.
- Validate against current server state and clock skew. Store `client_occurred_at` separately from the authoritative server timestamp.
- Outcomes: `ACCEPTED` (applied once), `REJECTED` (reason), `NEEDS_REVIEW` (manager queue). Nothing is silently dropped.

**Offline cash** is handled only by the documented manual-recovery procedure (paper record → later entry with `manual recovery` provenance + manager reconciliation). It is not part of the queue in MVP.

## Consequences

- P3 may introduce the SQLite queue with explicit `PENDING SYNC` UI. Server reconciliation and the conflict UX are P7.
- Device registration and revocation (`mobile_devices`) are needed before the queue accepts real data (P1 schema proposal).
- Open: which operations each pilot site may queue, and the maximum offline duration before the app forces paper mode.
