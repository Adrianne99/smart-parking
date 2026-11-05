# Screen Layouts, Interaction Patterns & Modal Inventory

## 1. Web navigation

### Operator desktop

```text
┌──────────────────┬─────────────────────────────────────────────────────────────┐
│ SMART PARKING    │ Operator / Customers                   Search…      Profile │
│ Overview         ├─────────────────────────────────────────────────────────────┤
│ Facilities       │ Customers                                   [Create case]│
│ Parking Sessions │ Find a customer or resolve a case quickly.                 │
│ Rates            │                                                             │
│ Payments         │ [Search name / verified contact…] [Facility ▾] [Status ▾]   │
│ Customers  ←     │                                                             │
│ Cases            │ Name       Contact       Active cases   Last interaction     │
│ Reports          │ ─────────────────────────────────────────────────────────── │
│ Staff            │ Maria S.   ••••-0291      1            Today                │
│ Settings         │ Juan C.    Verified email 0            Yesterday           │
└──────────────────┴─────────────────────────────────────────────────────────────┘
```

Sidebar is compact, icon + readable label; active item has **left indicator and text weight**, not a filled black pill. Main content maximum 1440px, balanced gutters 32px desktop/16px mobile. Use inline filters and a simple line-separated data table.

### Platform admin desktop

Sidebar: `Overview · Accounts · Leads · Onboarding · Support · Billing · Audit · Settings`. Account list columns: operator, primary contact, district, facility count, onboarding stage, assigned owner, updated. Avoid redundant cards at top; a compact status summary can appear as one text line above the table.

### Record detail

- Desktop: click row → right **detail drawer** (~480px) with customer/account summary, relevant details, timeline and primary action. `Open full record` navigates to a detail page for complex cases.
- Tablet: use full-height drawer that leaves visible context when possible.
- Mobile web: full-screen route rather than cramped side drawer.
- Highlight **what changed recently**, not generic analytics widgets.

## 2. React Native driver app

### Driver tabs

`Explore · My Parking · Activity · Account`

- Explore: search bar, list/map toggle, reported availability with freshness, published rate and distance; no reservation affordance.
- My Parking: one primary live session card, elapsed time, estimated running fee, `View ticket` and `Pay now` only when eligible.
- Activity: simple previous sessions list with receipt and payment verification state.
- Account: vehicles, support, notifications, theme `System / Light / Dark`.

**iOS:** segmented control for list/map, iOS bottom sheet for facility details, native navigation stack.  
**Android:** Material-style bottom navigation, adaptive bottom sheet, system-back behavior.

## 3. React Native staff app

- `Shift`: selected facility, current cashier/attendant, open-shift status, simple capacity counts.
- `Check in`: large `New vehicle` CTA, vehicle class choice, optional plate, clear confirm action.
- `Scan`: fullscreen camera scanning ticket, preview is *informational* (plate, session, backend status, grace expiry).
- `Checkout`: breakdown, choose cash or provider-verified digital, display pending state without false success.
- `Confirm exit`: manual physical match checklist and single `Confirm vehicle exit` action. Fresh transaction API call is the only authority.
- `Exceptions`: lost ticket, missing record, cash discrepancy → permissioned supervisor workflow.
- `Close shift`: expected cash vs counted cash, discrepancy, sign-off.

A busy attendant should accomplish a normal check-in in a few interactions. Favor large tap areas, clear text and fixed bottom action.

## 4. Modals and sheets inventory

| ID | Surface | Trigger | Pattern | Required fields/actions |
|---|---|---|---|---|
| O-01 | Operator | Add customer | 520px dialog (web) | Name, optional verified contact, purpose, save/cancel |
| O-02 | Operator | Create support case | 560px dialog | Subject, facility, session if relevant, description, priority; `Create case` |
| O-03 | Operator | Edit customer | Right drawer | Fields, contact permissions, validation, save/cancel |
| O-04 | Operator | Resolve case | Confirmation dialog | Required resolution text, `Resolve case`, cancel |
| O-05 | Operator | Refund request | Dedicated finance flow | Amount, reason, related payment, approval; not a one-click modal |
| O-06 | Operator | Filter customers/cases | Popover desktop, sheet mobile | Status, facility, date range, assignee, apply/clear |
| A-01 | Platform | Add operator lead | 520px dialog | Organization, contact, district, lead source, next action |
| A-02 | Platform | Assign account owner | Small dialog | Search team member, confirm/cancel |
| A-03 | Platform | Onboarding checklist item | Inline detail / drawer | Status, required evidence, reviewer, update action |
| A-04 | Platform | Add account activity | 520px dialog | Type, note, next action date; `Log activity` |
| A-05 | Platform | Suspend operator | 420px **alert dialog** | Reason, impact explanation, typed confirmation; permission checks |
| A-06 | Platform | Create support ticket | 560px dialog | Operator, subject, category, assignee, priority |
| S-01 | Staff | Cash payment | Native sheet | Amount due, amount tendered, change, cashier/shift, confirm |
| S-02 | Staff | Exit confirmation | Native confirmation/screen | Plate/vehicle match, verified paid state, grace expiry, confirm |
| S-03 | Staff | Lost ticket | Fullscreen / dedicated exception flow | Verification, reason, manager authorization, audit |
| D-01 | Driver | Select payment method | Native sheet | Supported method, final quote, merchant, cancel/continue |
| D-02 | Driver | Support request | Native sheet or screen | Session, issue category, message, submit |

**Never put a financial adjustment inside an innocuous generic `Save changes` dialog.** Use explicit descriptions and required justification.

## 5. Modal anatomy

```text
┌────────────────────────────────────────────────────────────┐
│ Create support case                                  [×]   │
│ Tell us what happened. Relevant parking data can be linked. │
│                                                            │
│ Subject *                                                  │
│ [Incorrect parking fee                              ]      │
│ Facility *                                                 │
│ [Select facility                                     ▾]     │
│ Related ticket (optional)                                  │
│ [Search ticket…                                       ]      │
│ Description *                                              │
│ [                                                          ]│
│ [                                                          ]│
│                                                            │
│ ─────────────────────────────────────────────────────────  │
│                                   [Cancel] [Create case]   │
└────────────────────────────────────────────────────────────┘
```

- Always visible title and concise sentence under it.
- Labels outside inputs; optional fields explicitly marked; asterisk only for required fields.
- 16–20px internal spacing; header/body/footer separated by whitespace or 1px line.
- Primary CTA rightmost on desktop, sticky visible on long sheets. Cancel is neutral outline/text.
- `Saving…` blocks duplicate submits but preserves entered data on API failure.
- Escape and backdrop dismissal allowed for safe, non-destructive dialogs; caution on unsaved changes. Financial/destructive dialogs require explicit cancel/confirm and remain open until success or failure is understood.
- Focus first logical field on open, trap focus within dialog, return focus to trigger on close, announce validation errors to screen readers.

## 6. Microcopy examples

| Avoid | Use |
|---|---|
| `Proceed` | `Confirm vehicle exit` |
| `Success!` | `Cash payment recorded` |
| `Oops! An error occurred` | `Payment is still pending. Refresh its status.` |
| `Delete account?` | `Suspend this operator? Existing sessions are affected.` |
| `No data` | `No open cases for this facility` |
| `User not found` | `No matching customer in this organization` |

## 7. Essential empty, loading and error states

- Loading: skeleton matching table rows, not a full-page infinite spinner.
- No results: `No matching records`, filter-specific action `Clear filters`.
- No records yet: `No support cases yet`, call-to-action for relevant authorized action.
- Error: explain exactly what couldn't load, provide retry; don't clear successfully entered form values.
- Theme change: immediate visual update without navigation reset.
- Offline staff: prominent `Offline — actions are provisional` label, queued count and sync/reconcile screen; no green `Payment verified` state from cache.

## 8. UX acceptance checklist

- [ ] Web usable at 320px width without sideways action clipping.
- [ ] Dark-mode buttons invert foreground/background correctly.
- [ ] All modals labelled, keyboard traversable, cancellable where safe, and preserve focus.
- [ ] Long forms use a page/drawer instead of nested modal stacks.
- [ ] Operator and platform CRM records cannot mix in search/results.
- [ ] Same data and domain logic on Android/iOS; platform navigation/sheets adapt to each OS.
- [ ] Screen-reader labels cover icon-only controls, status, input errors, and progress.
- [ ] Payment/exit language never implies cached preview is authoritative.
