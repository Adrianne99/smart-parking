# Project status

**Current phase:** P1 — Core foundation + design tokens
**Progress:** P1-A (DB/Auth/API) ✅ `feat/p1-db-auth` (committed, not pushed) · P1-B (Design System) ✅ `feat/p1-design-system` (uncommitted)
**Gate P1:** ⏳ awaiting on-device native check + owner acceptance
**Gate P0:** ✅ passed 2026-11-05
**Updated:** 2026-11-05

## Gate P1 checklist

| Criterion | State | Evidence |
|---|---|---|
| Cross-tenant reads/writes denied in tests | ✅ | `apps/api/src/tenancy.test.ts`: 19 DB tests, 2 operators × 2 facilities; CI runs them on Postgres and fails if skipped |
| Lint / typecheck pass | ✅ | `pnpm turbo run lint typecheck test build --force` → 34/34 tasks, 11 packages |
| Theme + tokens work on **web** | ✅ | `/design` rendered in light and dark (headless Edge); override + persistence unit-tested |
| Theme + tokens work on **Android / iOS** | ◐ | Unit-tested (`ThemeRoot`/`ThemeSwitcher`), both apps bundle for iOS + Android with ui-mobile classes compiled in, expo-doctor 20/20. **Not yet seen on a device or emulator** |
| Exact font sizes/weights and theme inversion documented | ✅ | `docs/design/QUIET_UTILITY.md` (type scale + inversion matrix), with tests binding both to code |

**To close Gate P1:** run the staff app on one Android and one iOS device or emulator (Expo Go is fine for this check). Toggle System/Light/Dark, restart the app, and confirm the choice persists and text stays readable.

## P1-B delivered

- Tokens: new `control` border colour (≥3:1, fixes the WCAG 1.4.11 issue), shared `type-scale.json`, status glyph vocabulary; contrast tests for 15 pairs per theme.
- `@smart-parking/ui-web`: Button, TextField, StatusLabel, Card, DataTable (loading/empty/error), Dialog + ConfirmDialog (native `<dialog>`), ThemeSwitcher + pre-paint theme script.
- `@smart-parking/ui-mobile`: ThemeRoot (persisted override via Expo SQLite kv-store + `Appearance`), Button, TextField, StatusLabel, Card, Sheet (iOS page sheet / Android panel), `confirmAction` (native alert), ThemeSwitcher.
- Apps: web home + `/design` showcase; staff and driver roots use `ThemeRoot`, home has the theme switcher, staff has a design screen.
- ₱ finding: **no ₱ glyph in Instrument Sans or DM Mono** (checked the font files). Options in `QUIET_UTILITY.md`; recommended `PHP 70.00` on staff screens. Decide before the first money UI.

## Open issues

1. 320 px web check in a real mobile viewport. → web QA
2. TanStack Query focus/online managers not wired to React Native AppState/NetInfo. → Staff/Driver (P3)
3. **Rate limiting** and `trust proxy` not configured; request logs include full response headers. → before any public deployment
4. Placeholder app icons/splash and bundle IDs. → owner, before first EAS build
5. Hosted Supabase: use the direct/session connection for Prisma (ADR-007).
6. No `users`/preferences table: theme choice is per device; staff invitations by email not possible yet.
7. ₱ display decision (see above).

## Next

- Owner: push both branches, confirm CI, merge P1-A then P1-B into `main`; do the on-device theme check.
- Then **P2**: zones and capacity by vehicle category, immutable rate versions + pure pricing engine with test vectors, atomic check-in with hashed ticket tokens, occupancy with freshness.
