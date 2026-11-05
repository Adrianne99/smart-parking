# ADR-005 — API contract conventions

**Status:** Accepted for P0 code (implemented in `packages/contracts`, `apps/api`, `packages/api-client`) · **Date:** 2026-11-05 · **Owner:** Contracts lead (Integrator)

## Single source of truth

`packages/contracts` holds every request/response Zod schema, the error registry and the shared conventions. Apps import from it, so nobody re-declares DTOs. A contract change is a PR touching `packages/contracts/**` approved by the Integrator. Other sessions propose changes in their handoff.

## Conventions

| Topic | Rule |
|---|---|
| Base path | `/v1/...`. Breaking changes need `/v2` or an additive migration path, because installed mobile builds lag. |
| Errors | Every non-2xx body is `{ "error": { "code", "message", "requestId", "details?" } }`. `code` comes from `ERROR_STATUS` (one code ↔ one HTTP status). Clients parse `code` as a string so new codes don't break old app builds. |
| Validation | `400 VALIDATION_FAILED` with `details.issues[] = { path, message }`. Submitted values are never echoed. |
| Not found / scope | Out-of-scope records return 404 (see ADR-001). |
| Request ID | The API reads a safe `X-Request-Id` (`[\w-]{8,128}`) or mints a UUID, echoes it in the response header, and includes it in every log line and error body. |
| Idempotency | Every write that creates money/sessions/exits requires `Idempotency-Key` (UUID). Records are bound to user + organization + action + request hash. Same key + same request → original response with `Idempotent-Replayed: true`. Same key + different request → `409 IDEMPOTENCY_KEY_REUSED`. |
| Retries | Reads: clients retry network/5xx at most twice, never 4xx (`shouldRetry`). Writes: never auto-retried; the user retries with the same idempotency key. |
| Cancellation | Clients pass TanStack Query's `AbortSignal` to `fetch`; aborts are not shown as errors. |
| Money | Integer **centavos** (`centavosSchema`), field suffix `Centavos`, currency `PHP`, DB `bigint`. No floats anywhere in money paths. |
| Time | `TIMESTAMPTZ` in DB; UTC ISO-8601 `…Z` on the wire (`isoDateTimeSchema`); display in `Asia/Manila` (`DISPLAY_TIME_ZONE`). Server time is authoritative. |
| IDs | UUIDs. Human ticket numbers are separate display values. Ticket bearer tokens are **only ever in JSON bodies**, never in URLs, query strings or headers (URLs are logged). |
| Pagination | Cursor based: `?cursor=&limit=` (default 25, max 100), response `{ data: [...], page: { nextCursor } }` (`pageQuerySchema`, `pageOf`). Server-side search/filter/sort. |
| Caching | API responses default to `Cache-Control: no-store`. |
| Auth policy | Each endpoint's contract states: public / authenticated / scope (`organization` or `facility`) + required permission. |

## Error registry (canonical)

`VALIDATION_FAILED 400 · UNAUTHENTICATED 401 · FORBIDDEN 403 · FORBIDDEN_FACILITY 403 · NOT_FOUND 404 · SESSION_NOT_FOUND 404 · TICKET_INVALID 404 · PAYMENT_NOT_VERIFIED 409 · PAYMENT_REVERSED 409 · EXIT_WINDOW_EXPIRED 409 · SESSION_ALREADY_CLOSED 409 · CAPACITY_EXCEEDED 409 · IDEMPOTENCY_KEY_REUSED 409 · RETRYABLE_CONFLICT 409 · PAYLOAD_TOO_LARGE 413 · RATE_LIMITED 429 · INTERNAL_ERROR 500 · SERVICE_UNAVAILABLE 503`

Choices where `04_SECURITY_AND_CONTRACTS.md` left a range: validation is **400** (not 422); `TICKET_INVALID` is **404** for both unknown and revoked tokens (not 410), so token existence isn't revealed; `RETRYABLE_CONFLICT` is **409**. v1.3 alias mapping is in ADR-002. Client-only codes: `NETWORK_ERROR` (status 0) and `UNEXPECTED_RESPONSE` (body didn't match the contract).
