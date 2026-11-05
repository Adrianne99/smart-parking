# AI SESSION HANDOFF TEMPLATE

Create `docs/progress/HANDOFF-<session>-<date>.md` at the end of every parallel session, and share it with the Lead / Integrator.

```markdown
# Handoff: <session ID, branch, date>
## Scope and status
- Assigned phase / acceptance criteria:
- Completed:
- Partially completed or deliberately deferred:

## File ownership and changes
- Branch / worktree:
- Commits:
- Changed paths:
- New/updated env vars (names only; NO VALUES):
- Proposed schema migrations (DB owner must approve):
- Contract additions/changes (contract owner must approve):

## Tests actually executed
| Command | Result | Evidence / Notes |
|---|---|---|
| pnpm ... | PASS/FAIL/NOT RUN | ... |

## Security / privacy / financial impact
- Tenant access checks:
- Idempotency/concurrency considerations:
- Potential regression / unresolved risk:
- External provider integration: sandbox, fake, or live?

## Integration instructions
- Dependency PR(s):
- Merge conflicts or shared ownership requests:
- Manual test steps:
- Rollback instructions:

## Next recommended tasks
1. ...
2. ...
```

**Handoff rules:** Not run ≠ passed. Do not say payment is live when only a fake PSP adapter exists. Never paste secret values or personally identifying real customer data into handoff docs. One session does not claim an entire phase finished until the Integrator accepts the gate.
