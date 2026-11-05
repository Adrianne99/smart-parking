# Quiet Utility: implementation reference

How the v1.3 design system (`reference/Smart_Parking_FINAL_DESIGN_SYSTEM_v1.3.md`) is implemented in code. **Owner: Design System.** Showcases: web `/design`, staff app "View design system components".

## Sources of truth

| What | File | Kept in sync by |
|---|---|---|
| Colours (light + dark) | `packages/design-tokens/src/index.ts` → `themeColors` | Web: rendered as `--qu-*` CSS variables in `<head>`. Native: `vars()` in `ThemeRoot`. Test: NativeWind preset lists every token |
| Type scale | `packages/design-tokens/src/type-scale.json` | Native: preset reads the JSON. Web: `apps/web/src/app/globals.css`, test fails on any mismatch |
| Status glyphs | `statusGlyph` in design-tokens | Shared by both `StatusLabel`s |
| Web primitives | `packages/ui-web` | Tests in `ui-web.test.tsx` |
| Native primitives | `packages/ui-mobile` | Tests in `ui-mobile.test.tsx` |

## Theme inversion matrix

Every value below is tested for WCAG 2.2 contrast in both themes (`design-tokens` tests): text ≥4.5:1, focus rings and control boundaries ≥3:1.

| Token (Tailwind) | Light | Dark | Use |
|---|---|---|---|
| `canvas` | `#FFFFFF` | `#0A0A0A` | Page background |
| `surface` | `#FFFFFF` | `#121214` | Cards, dialogs, fields |
| `surface-raised` | `#FAFAFA` | `#19191B` | Table header, hover, disabled fill |
| `ink` | `#0A0A0A` | `#F5F5F4` | Primary text |
| `ink-muted` | `#525252` | `#A3A3A3` | Secondary text |
| `ink-faint` | `#737373` | `#858585` | Quiet metadata, disabled labels |
| `line` | `#E6E6E6` | `#303033` | Decorative dividers, card outlines |
| `line-strong` | `#C9C9C9` | `#525255` | Active outlines |
| **`control`** | `#858585` | `#707075` | **Input and secondary-button borders** (3.5–4:1) |
| `action` | `#0A0A0A` | `#F5F5F4` | Primary button fill (inverts) |
| `action-ink` | `#FFFFFF` | `#0A0A0A` | Primary button label |
| `action-hover` | `#292929` | `#DEDEDE` | Hover/pressed fill |
| `overlay` | `rgba(0,0,0,.42)` | `rgba(0,0,0,.66)` | Modal backdrop |
| `focus-ring` | `#3E3E3E` | `#D8D8D8` | 2px keyboard focus outline, 2px offset |

**Deviations from v1.3, recorded:**
- Near-black is `#0A0A0A`, following the master prompt (ADR-006).
- `control` is new. The v1.3 `line`/`line-strong` (1.2–1.6:1) are too faint to be the only visible edge of an input under WCAG 1.4.11. They remain for decoration only.

## Light / Dark / System

| | Web | Android / iOS |
|---|---|---|
| Default | System (`prefers-color-scheme`) | System (`useColorScheme`) |
| Override | `<html data-theme="light|dark">`, applied by an inline `<head>` script before first paint | `Appearance.setColorScheme()`, so native alerts, pickers and keyboards follow |
| Stored in | `localStorage['qu-theme']` (absent = System) | Expo SQLite key-value store `qu-theme`, read synchronously at startup (no flash) |
| Control | `ThemeSwitcher` (native radio group) | `ThemeSwitcher` (`radiogroup` / `radio` roles) |

Per-device only for now. Syncing the choice to the signed-in user's account needs a user-preferences table (see STATUS).

## Typography

Instrument Sans for the UI; DM Mono **only** for ticket ids, plates, times, money and audit ids. Never bold: weights 400/500 (600 is loaded on web for rare emphasis only).

| Token | Web ≥1024px | Phone (native, web <1024px) | Weight | Line height | Tracking |
|---|---:|---:|---:|---:|---:|
| `display` | 48 | 36 | 400 | 1.1 | −0.045em |
| `h1` | 32 | 28 | 500 | 1.2 | −0.035em |
| `h2` | 24 | 22 | 500 | 1.25 | −0.025em |
| `h3` | 18 | 18 | 500 | 1.35 | −0.015em |
| `body` | 15 | 16 | 400 | 1.6 | −0.005em |
| `compact` | 14 | 14 | 400 | 1.45 | 0 |
| `label` | 13 | 13 | 500 | 1.4 | 0 |
| `caption` | 12 | 12 | 400 | 1.5 | 0 |
| `data` (DM Mono) | 14 | 15 | 400 | 1.45 | 0 |

- **Web:** `text-h1` etc. set size, line height, tracking and weight; sizes switch at 1024px automatically. Add `font-mono` for `data`.
- **Native:** `text-h1` sets size, line height and tracking in px. React Native selects weight by font family, so pair it with `font-ui` / `font-ui-medium` / `font-data` / `font-data-medium`.

### ₱ (peso sign): finding

Checked the actual font files (cmap tables): **neither Instrument Sans nor DM Mono contains U+20B1 ₱.** Browsers, Android and iOS fall back to a system font for that one glyph, so it renders but looks slightly different. The decision is due with the first money UI (P2/P3). Options:
1. Keep `₱` and accept the system-font glyph (zero work).
2. Show the code: `PHP 70.00` (`Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP', currencyDisplay: 'code' })`), which matches the typeface exactly. **Recommended for staff/cashier screens.**
3. Subset a matched ₱ glyph into a custom font build (design + licensing work).

Money is always formatted from integer centavos, server-authoritative.

## Sizes, shape, motion

- Primary button **54px web / 56px native**, 10px radius, medium label. Secondary 48px. Inputs 48px. All touch targets ≥44px.
- Radius: inputs 6, buttons/cards 10, dialogs 12, sheets 16.
- No shadows except overlays (dialog). Transitions 150ms. `prefers-reduced-motion` is honoured on web (global rule) and skeletons pulse only with `motion-safe`.

## Components

| Need | Web (`@smart-parking/ui-web`) | Native (`@smart-parking/ui-mobile`) |
|---|---|---|
| Actions | `Button` primary / secondary / text, `loading` + `loadingLabel` (no double submit, width preserved) | `Button`, same variants |
| Text input | `TextField`: label above, helper/error below, `aria-invalid` + `aria-describedby`, "(optional)" in words | `TextField`: label, hint, error announced via live region |
| Status | `StatusLabel tone="positive|pending|attention|negative|neutral"` → `● Verified` | same |
| Grouping | `Card` (1px outline) | `Card` |
| Lists | `DataTable`: sticky header, 52px rows, numeric columns right-aligned in DM Mono, built-in loading / empty / error+retry | Use `FlatList` per screen (no shared table on phones) |
| Short task | `Dialog` (native `<dialog>`: inert background, Escape, focus restore). 520px forms | `Sheet`: iOS system page sheet; Android slide-up panel, Back/outside closes |
| Irreversible / financial | `ConfirmDialog`: no backdrop/Escape dismissal, locks while pending, keeps errors visible | `confirmAction()`: native alert, resolves `true` only on the explicit button; destructive can't be dismissed by an outside tap |
| Theme | `ThemeSwitcher`, `themeInitScript` | `ThemeRoot` (wrap the app), `useTheme()`, `ThemeSwitcher` |

Rules that reviewers check:
- Status is never colour alone; selection is never fill alone (check mark + weight).
- Labels say what happens ("Confirm vehicle exit"), never "OK"/"Proceed".
- One primary action per dialog, last on the right on desktop.
- 3+ step tasks get a page, not a modal. Never nest modals.
- Remote data uses TanStack Query. The only `useEffect` in the primitives syncs React state to the `<dialog>` element.

## Not built yet (add when a screen needs it)

Drawer, tabs, toast, select/combobox, search field, date picker, platform-specific `.ios.tsx`/`.android.tsx` screens, server-synced theme preference.
