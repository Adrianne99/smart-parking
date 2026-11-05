# ADR-001 — Multi-tenancy and authorization

**Status:** Accepted by owner 2026-11-05
**Date:** 2026-11-05 · **Owner:** Integrator + DB/Auth lead (P1 Session A)

## Context

Several independent operators share one platform. Operator A must never read or change operator B's facilities, sessions, money or CRM records, even with a guessed UUID (FR-01, FR-12). Platform staff need operator-account access, but must not get a hidden all-driver database.

## Decision

1. **Identity ≠ permission.** Supabase Auth proves *who* (signed JWT, verified in Express against the project's JWKS, checking `iss`, `aud`, `exp` and an asymmetric `alg`). Express decides *what* from our own membership tables. Roles in JWT metadata, request bodies or headers are ignored for authorization.
2. **Tenant key on every tenant-owned row.** Each tenant-owned table carries `organization_id`; facility-scoped rows also carry `facility_id`. Composite foreign keys (`(organization_id, facility_id)`) stop a row from pointing at another tenant's facility.
3. **Scope comes from the path and is re-checked.** `:facilityId` / `:organizationId` in the URL are *claims*. Middleware loads the caller's membership for that scope and rejects without it. Every query then filters by the authorized scope. An `organizationId` in a body is never trusted alone.
4. **Not-found vs forbidden.** Records outside the caller's scope return `404` (`*_NOT_FOUND`) so tenants cannot probe for existence. `403 FORBIDDEN_FACILITY` is only for a facility the caller can see but lacks the action permission on.
5. **Server-only database access.** Clients never get the Supabase service-role key or direct table access. Prisma runs server-side with a least-privilege role. RLS may be added as defence in depth, but **is not relied on**: the service role bypasses it.
6. **Two separate CRMs.** The Operator Customer CRM (tenant-private) and the Platform Operator CRM (platform-to-operator) use separate tables, routes (`/v1/operator/*`, `/v1/admin/*`), permissions and search indexes. No cross-operator customer search exists.
7. **Platform break-glass** access to driver/session PII is purpose-bound, time-limited and audited. It is never a standing permission.
8. **Revocation is immediate.** Each request re-reads membership (cache ≤ 60 s if needed later). A deactivated staff member or revoked device fails on the next call, whatever build is installed (FR-13).

## RBAC matrix (MVP)

Legend: ● allowed · ◐ limited/scoped · — denied. "Scope" = membership the API checks.

| Capability | Platform super admin | Platform support | Platform sales | Platform auditor | Org owner | Org manager | Org auditor | Facility manager | Cashier | Attendant | Driver |
|---|---|---|---|---|---|---|---|---|---|---|---|
| Approve/suspend organization | ● | — | — | — | — | — | — | — | — | — | — |
| Leads, onboarding checklist | ● | ◐ | ● | read | — | — | — | — | — | — | — |
| Platform support cases | ● | ● | ◐ | read | ◐ own org | ◐ own org | — | — | — | — | — |
| Manage org, facilities, staff grants | — | — | — | — | ● | ◐ | — | ◐ own facility | — | — | — |
| Publish rate version / capacity | — | — | — | — | ● | ● | — | ● | — | — | — |
| Check-in, scan, exit verify/confirm | — | — | — | — | ● | ● | — | ● | ● | ● | — |
| Record cash payment (open shift) | — | — | — | — | — | — | — | ◐ | ● | — | — |
| Open/close own cashier shift | — | — | — | — | — | — | — | ◐ | ● | — | — |
| Fee adjustment / refund request | — | — | — | — | ● | ● (approval) | — | ◐ request | — | — | — |
| Operator customer CRM + cases | — | — | — | — | ● | ● | read | ◐ | — | — | — |
| Reports / revenue | — | — | — | sanitized | ● | ● | ● | ◐ own facility | ◐ own shift | — | — |
| Audit log read | ● | ◐ | — | ● | ● | — | ● | — | — | — | — |
| Driver PII / session detail | break-glass, audited | break-glass, audited | — | — | ◐ own org | ◐ own org | — | ◐ own facility | ◐ operational fields | ◐ operational fields | own/claimed only |

Attendants and cashiers get **no CRM profile access**, only the operational fields their task needs. Platform roles get **no operator-tenant permissions** by default.

## Implementation decisions (P1, 2026-11-05)

Code: `apps/api/src/modules/access/access.ts` (the single permission map) and `modules/auth/`.

- **Org MANAGER** may create facilities and grant/revoke attendant, cashier and auditor staff. Only an **org OWNER** may grant or revoke the facility **MANAGER** role, so managers cannot create peers.
- **Facility MANAGER** manages non-manager staff at their own facility only.
- **Platform roles** can list operator organizations (B2B accounts) but get **no** facility/session access. `POST /v1/organizations` is SUPER_ADMIN only and creates the owner membership and audit row in one transaction.
- Tables live in the private `app` schema with RLS on and Supabase API roles revoked (ADR-007). The audit log is append-only via a DB trigger.
- A `users` profile table is deferred. Memberships store the Supabase Auth user id, with no FK into the `auth` schema.

## Consequences

- P1 Session A implements `requireAuth` (JWKS verification) and `requireFacilityPermission(action)` middleware, plus **two-organization negative tests** for every sensitive route. These are a P1 gate item.
- Each new endpoint must declare its auth policy and scope in its contract (ADR-005).
- Open: final role names; whether facility managers may grant staff themselves, or only owners. Confirm with pilot operators.
