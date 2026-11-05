# Handoff: P1-B Design System, branch `feat/p1-design-system` (uncommitted), 2026-11-05

## Scope and status
- **Phase / criteria:** P1 Session B: Quiet Utility tokens, fonts, theme override + persistence, 54/56px buttons, inputs, tables, status, dialog/sheet foundations, accessibility, documented type scale.
- **Completed:** all listed (see `docs/design/QUIET_UTILITY.md`).
- **Deferred:** drawer, tabs, toast, select, date picker, platform-specific `.ios/.android` screens, server-synced theme preference, ₱ display decision.

## File ownership and changes
- **New:** `packages/ui-web/**`, `packages/ui-mobile/**`, `packages/design-tokens/src/type-scale.json`, `docs/design/QUIET_UTILITY.md`, `apps/web/src/app/design/**`, `apps/web/src/app/type-scale.test.ts`, `apps/staff/src/app/design.tsx`.
- **Changed:** design-tokens (`control` token, type scale, status glyphs; removed 3 unused exports), NativeWind preset, web `globals.css`/`layout.tsx`/`page.tsx`/`next.config.ts`/health card, staff + driver `_layout.tsx`/`index.tsx`/health card/`tailwind.config.js`/`app.json` (expo-sqlite plugin), `OWNERSHIP.md`, `STATUS.md`.
- **New dependencies:** `expo-sqlite` (both native apps), `eslint-plugin-react-hooks` (ui-web). No env vars. No migrations. No contract changes.

## Tests actually executed (Windows 11, Node 24.19)
| Command | Result | Notes |
|---|---|---|
| `pnpm turbo run lint typecheck test build --force` | PASS | 34/34 tasks, 11 packages |
| Test counts | PASS | design-tokens 38, api 45, web 12, ui-web 9, ui-mobile 8, api-client 8, contracts 7, staff 2, driver 2 |
| `expo export` iOS + Android (staff, driver) | PASS | ui-mobile classes (`border-control`, `rounded-t-[16px]`, `text-h3`) confirmed present in the Hermes bundle |
| `expo-doctor` (staff, driver) | PASS | 20/20 each |
| Web `/design` in headless Edge, light + dark | PASS | Screenshots reviewed. Found and fixed letter-spacing inheritance in small type |
| Native apps on device / emulator | NOT RUN | No emulator on this machine; required to close Gate P1 |
| Dialog interaction in a real browser (focus trap / restore) | NOT RUN | jsdom has no `showModal`; logic unit-tested with a stub |

## Security / privacy / financial impact
- No data or API changes. The theme preference stores only `light`/`dark` locally. The inline theme script is a static string with no user input.
- `ConfirmDialog` / `confirmAction` enforce explicit confirmation for destructive and financial actions (future exit and cash flows).

## Integration instructions
- Merge after `feat/p1-db-auth` (this branch is based on it).
- Manual check: `pnpm --filter web dev` → http://localhost:3000/design (another project currently uses port 3000 on this machine; use `pnpm --filter web exec next dev --port 3100`). Native: `pnpm --filter staff start` → "View design system components".

## Next recommended tasks
1. On-device theme check (Android + iOS) to close Gate P1.
2. Owner decides the ₱ display option.
3. P2 parking domain.
