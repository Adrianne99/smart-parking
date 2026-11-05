# CRM Product Specification v1.3

**Scope:** Two connected but intentionally separate CRM experiences. `Client CRM` means a parking operator's customer-service CRM; `Platform Admin CRM` means your company's operator-account CRM. Neither replaces payment/session systems.

## Guiding principles

1. **Fast answers, not busy dashboards.** Users start with one search field, sensible filters and an action appropriate to the selected record.
2. **One screen = one job.** Summary list → record drawer/detail → task. Don't present all fields on one page.
3. **Context first.** Cases display the relevant facility, session, verified payment state and owner without exposing unrelated data.
4. **Minimize personal data.** Guest drivers don't automatically become named CRM records. Require a lawful reason before linking contact data to a person, and separate service communications from marketing permissions.
5. **Tenant boundaries.** A parking operator can never view another operator's customers, notes, cases or facilities. Platform admins do not get an all-driver activity feed.
6. **Clear history.** Record modifications as attributed events; avoid silent deletes and invisible changes.

---

## CRM A — Operator Customer CRM (`/operator/customers`)

### Who uses it

- Operator owner / authorized branch manager: find customers, follow up support cases, view scoped facility/session records.
- Operator support staff (optional explicit role): customer service but not settlement reversal, refunds, or private staff notes outside scope.
- Cashier/attendant: **not automatically** granted CRM profile access; see only operational fields required for their shift.

### Jobs to be done

- Find a known customer by verified name/contact or customer ID, **or** locate a specific session by ticket through an audited ticket-lookup workflow.
- Answer a parking-related question: fee, paid status, timestamp, lost ticket, dispute, receipt, wrong vehicle details.
- Open a support case, assign an owner, record follow-up and close with a resolution reason.
- Review **scoped** session/payment history to which the operator has a legitimate operational reason for access.
- Manage permitted customer contact preferences; avoid marketing messages until separate opt-in exists.

### MVP pages

| Page | Main content | Primary action |
|---|---|---|
| Customers | Search, name/label, contact (masked by permission), last interaction, open cases | `Add customer` only with lawful operational reason |
| Customer detail | Identity, associated vehicles if verified, linked sessions, cases, consent, activity | `Create case` |
| Cases | Table: ID, subject, customer, facility, owner, priority, status, updated | `New case` |
| Case detail | Summary, timeline, responsible owner, relevant session/quote references | `Add note` / `Resolve case` |
| Service lookup | Ticket/session lookup under operational permission | `Open ticket` |

### Customer profile data (minimize)

`customer_id`, `organization_id`, optional `driver_user_id`, `display_name`, verified/optional `email`, verified/optional `phone`, preferred channel, `created_at`, `updated_at`, anonymized/archived flags. Each optional field needs an explicit purpose. Do not use license plate as a persistent unique person identifier.

### Operator case statuses

`OPEN` → `IN_PROGRESS` → `WAITING_CUSTOMER` → `RESOLVED` → `CLOSED`; `REOPENED` transitions to `IN_PROGRESS`. `priority`: `normal`, `urgent`. Optional due date, owner, facility. Resolving requires a resolution summary. Reopening adds a case event.

### Typical customer issue journey

1. Driver reports an overcharge with a ticket.
2. Authorized staff looks up the session without requiring driver profile creation.
3. Staff opens a case with the selected facility/session attached and explains the disputed amount.
4. Manager sees the *verified* charge and payment; if a refund is eligible, they initiate a **separate controlled financial approval workflow**.
5. Support leaves a case note, optionally sends a service response through an approved channel, then resolves the case.
6. All edits, payment references and status changes remain auditable.

### Explicitly excluded

No unsolicited marketing campaigns, no open-text bulk contact scraping, no shared customer list across unrelated operators, no staff-only one-click refund, no AI-generated customer summary without privacy review.

---

## CRM B — Platform Admin Operator CRM (`/admin/accounts`)

### Who uses it

- Platform sales/onboarding: qualify leads, follow up documents, onboard facilities.
- Platform support: assigned operator accounts and tickets, limited access to operational metadata.
- Billing/admin: contracts, SaaS invoices, payment provider onboarding state (never raw gateway secrets).
- Platform super admin / auditor: approve suspensions and high-risk changes with audit trail.

### Jobs to be done

- Capture interested parking operators as leads; convert to approved organizations without losing notes/history.
- Track a clear onboarding checklist: business verification, contact confirmation, facility details, capacity, staff invitation, rates, payout merchant setup, test payment, pilot sign-off.
- Know which organizations are active, onboarding, suspended or at-risk, including facility counts and responsible account owner.
- Manage operator support requests, onboarding blockers, incident escalations, documented account notes and next action.
- View platform subscription status and contract renewal date (billing module integration rather than duplicate ledger).

### MVP pages

| Page | Main content | Primary action |
|---|---|---|
| Accounts | Operator table, status, facilities, onboarding progress, owner, last contact | `Add operator` or `New lead` |
| Account detail | Company identity, verified contacts, account owner, facility overview, onboarding checklist, tickets | `Log activity` |
| Leads | Lightweight list with stage, contact, next step, source | `New lead` |
| Onboarding | Checklist + requested docs + review status + blockers | `Request documents` |
| Support inbox | Operator cases by state, priority and assignee | `Assign` / `Resolve` |
| Account activity | Chronological calls, emails, meetings, notes, handoffs and config-change references | `Add note` |

### Lead stages

`NEW` → `CONTACTED` → `QUALIFYING` → `READY_FOR_ONBOARDING` → converted to organization; alternate `LOST` with reason. Do not model stage as a payment status.

### Operator account onboarding statuses

`PENDING_DOCUMENTS`, `UNDER_REVIEW`, `TECHNICAL_SETUP`, `PILOT_READY`, `ACTIVE`, `SUSPENDED`. Record each checklist item separately and limit transitions to authorized users.

### Typical platform admin journey

1. A parking operator fills out a contact form; sales creates a lead.
2. Sales records owner, district, business category, expected facility count and next action.
3. Lead becomes an operator organization after verified onboarding. This creates a one-to-one link, not a duplicate account.
4. Onboarding manager walks through the checklist and submits test parking and cash/digital transactions.
5. Platform admin approves publication after required checks pass.
6. Support tracks future issues in an operator-scoped helpdesk while finance reports SaaS fees separately from parking receipts.

### Access safety

Platform account support sees operator contacts, facility metadata and account tickets. To investigate a specific parking-session incident, open a purpose-bound support task with an audit record; do not provide unrestricted customer search.

---

## Shared CRM behavior

### Search, filtering, empty states

- One global contextual search in each CRM (`Search name, account, ticket or case…` with permissions determining available indexes).
- Filters in an **inline filter bar** on desktop, **bottom sheet** on mobile: status, facility, assignee, date range. Always show active filters as removable labels and `Clear all`.
- Save sort, page size and active filters in URL search params on Next.js pages. Search is server-side with pagination, debouncing and query cancellation.
- Empty state includes contextual next step (`No open cases` → `View resolved cases`). No redundant hero banners.

### Common case model

Two distinct case domains: `operator_customer_cases` (organization-private customer support) and `platform_operator_cases` (platform-to-operator support). Both can use shared UI components and workflow logic but **must use separate authorization rules and scoped indexes**.

For both: unique case ID, title, description, organization, assignee, status, priority, created/updated, timeline events, notes and optional references. Attachments should be private signed URLs, antivirus/content-scanned where practical, retention-controlled. **Avoid exposing free-text notes across customer-visible and internal channels.**

### Acceptance criteria

- [ ] Operator A cannot retrieve Operator B's customer/profile/case by id, filter or search.
- [ ] Guest parking ticket lookup does not require a permanent CRM profile.
- [ ] A staff role without CRM permission cannot read named customer contacts.
- [ ] Creating a case records creator, tenant, time and initial status in one atomic operation.
- [ ] Every status change adds timeline event and exposes clear timestamp + actor.
- [ ] Notes are append-only or versioned with edit history; never silently overwrite.
- [ ] Platform admin cannot query all drivers just because they can list operator accounts.
- [ ] `Resolve` requires an outcome description. Refund is a separate permissioned finance workflow.
- [ ] Search works by keyboard, empty/missing data has consistent text, and every control is labelled.
- [ ] No modal allows duplicate submissions when the network is slow; failures preserve the user's form.

## CRM API (proposed)

```text
GET   /v1/operator/customers?search=&facilityId=&cursor=
POST  /v1/operator/customers                       # validated consent/purpose
GET   /v1/operator/customers/:customerId
GET   /v1/operator/customer-cases?status=&cursor=
POST  /v1/operator/customer-cases
GET   /v1/operator/customer-cases/:caseId
POST  /v1/operator/customer-cases/:caseId/notes
POST  /v1/operator/customer-cases/:caseId/resolve

GET   /v1/admin/leads?stage=&cursor=
POST  /v1/admin/leads
POST  /v1/admin/leads/:leadId/convert
GET   /v1/admin/accounts?status=&cursor=
GET   /v1/admin/accounts/:organizationId
POST  /v1/admin/accounts/:organizationId/activities
PATCH /v1/admin/accounts/:organizationId/onboarding
GET   /v1/admin/operator-cases?status=&cursor=
POST  /v1/admin/operator-cases
POST  /v1/admin/operator-cases/:caseId/resolve
```

## Database notes

See `sql/003_crm_foundations.sql`. Do not store payment credentials in CRM. Foreign keys constrain ownership; service-layer authorization is still mandatory. Use a limited platform-admin app role with purpose-limited functions and audit logging. For account leads not yet associated with an approved organization, store `lead_id` separately and link it upon conversion.

## MVP metrics

- Customer lookup time; case resolution time; open aging cases; cases per 1000 sessions; billing disputes by operator/facility.
- Operator lead-to-pilot conversion, onboarding completion time, unresolved blockers, facilities activated, platform support response times.
- Privacy/security: unauthorized access attempts, data export audits, CRM record retention/deletion compliance.
