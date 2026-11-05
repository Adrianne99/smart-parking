# Design System — Quiet Utility v1.3

**Product:** Metro Manila Smart Parking  
**Surfaces:** Next.js operator + platform admin web dashboards, Expo React Native staff + driver apps  
**Mood:** Contemporary, elegant, monochrome, light, editorial precision, calm utility. Not over-designed.

## 1. The non-negotiable visual direction

- Primary visual: near-white/light background, dark text, thin gray borders, clean alignment; dark mode reverses luminance without introducing decorative accents.
- No gradients, glassmorphism, heavy blur, random floating cards, 3D illustrations, glow effects, AI-style decorative blobs, oversized full-bold headlines, or unnecessary panels.
- Avoid Inter, Poppins, Geist, Outfit and Manrope as the primary font in this product.
- No pure color for status communication alone. Pair status with icon + plain-language text (e.g. `● Confirmed`, `○ Pending`, `× Rejected`); chromatic cues may be added later only if accessible and needed.
- Use restrained shadows only for overlays. In-page cards should use 1px outlines or separators, and whitespace.

## 2. Typography

**Primary:** Instrument Sans, SIL OFL 1.1; human, confident neo-grotesque with distinctive subtle shapes.  
**Numerical/technical:** **DM Mono**, SIL OFL 1.1, only for ticket IDs, plate references, audit IDs, financial values and timestamps. Use `300` sparingly for larger decorative numeric displays, `400` by default for readable 12–16px data, and `500` for key totals.  
**Optional marketing display only:** Instrument Serif at 40–64px; not in tables or work-intensive screens.

| Token | Desktop | Mobile | Weight | Line height | Letter spacing |
|---|---:|---:|---:|---:|---:|
| Display | 48px | 36px | 400 | 1.1 | -0.045em |
| H1 | 32px | 28px | 500 | 1.2 | -0.035em |
| H2 | 24px | 22px | 500 | 1.25 | -0.025em |
| H3 | 18px | 18px | 500 | 1.35 | -0.015em |
| Body | 15px | 16px | 400 | 1.6 | -0.005em |
| Compact UI | 14px | 14px | 400 | 1.45 | 0 |
| Label | 13px | 13px | 500 | 1.4 | 0 |
| Caption | 12px | 12px | 400 | 1.5 | 0 |
| Money / Ticket | 13–16px | 13–16px | 400 | 1.45 | 0 |

Use `font-variant-numeric: tabular-nums` for tabular amounts and time series. Keep regular body and medium heading weights; do not make every card heading `700`.

**Practical font application:**

- `font-ui`: Instrument Sans 400 for body, 500 for buttons/section headings, 600 reserved for rare operational emphasis.
- `font-data`: DM Mono 400 for plate/ticket IDs, timestamp, price breakdowns and tabular totals; 500 for large payable amounts. Avoid 300 below 16px because lighter strokes reduce readability on small devices.
- For the Philippine peso sign (`₱`), confirm glyph coverage in the exact deployed font and ensure a visually matched fallback where necessary.
- Do **not** put all paragraphs, entire customer tables, dialogs, or navigation into DM Mono. A little mono conveys precision; too much makes the interface dense.


## 3. Color tokens

**Use semantic names**, not raw `black/white` classes in shared components, so inversion is correct.

| Semantic | Light | Dark | Usage |
|---|---|---|---|
| `canvas` | `#FFFFFF` | `#0B0B0C` | Main app background |
| `surface` | `#FFFFFF` | `#121214` | Cards, drawers, fields |
| `surface-raised` | `#FAFAFA` | `#19191B` | Toolbar, hover, grouped rows |
| `ink` | `#111111` | `#F5F5F4` | Primary text |
| `ink-muted` | `#525252` | `#A3A3A3` | Secondary text |
| `ink-faint` | `#737373` | `#858585` | Quiet metadata only |
| `line` | `#E6E6E6` | `#303033` | Outlines, dividers |
| `line-strong` | `#C9C9C9` | `#525255` | Active outlines |
| `action` | `#111111` | `#F5F5F4` | Filled primary CTA |
| `action-ink` | `#FFFFFF` | `#111111` | CTA text |
| `action-hover` | `#292929` | `#DEDEDE` | Hover/press background |
| `overlay` | `rgba(0,0,0,.42)` | `rgba(0,0,0,.66)` | Modal backdrop |
| `focus-ring` | `#3E3E3E` | `#D8D8D8` | Keyboard focus indicator |

Light-mode primary buttons are black with white text; dark-mode primary buttons are light with black text. Secondary buttons are outlined neutral with dark text/light text based on theme. Tertiary links are text only and underlined on hover/focus.

### Contrast and state

- The main neutral palette is intentionally high contrast. Validate all final components against WCAG 2.2 AA text, icon, and focus contrast.
- Avoid faded placeholder text that is indistinguishable from disabled controls.
- Disabled state: change background/border and show real disabled behavior; do not rely on opacity alone.
- Status labels: use text + icon + tone, not colored dots only. Payment state should use `Verified`, `Pending`, `Failed`, not just `green/red`.

## 4. Core spacing, sizing and layout

**4px scale:** `0, 4, 8, 12, 16, 20, 24, 32, 40, 48, 64, 80`.  
**Border radius:** 6px inputs, **10px buttons**, 10px cards, 12px drawers/large panels, 16px sheets; avoid excessive rounded-pill surfaces.  
**Borders:** 1px neutral.  
**Elevation:** 0 on pages; overlay only (`0 16px 44px rgba(0,0,0,0.12)` light, `0 20px 56px rgba(0,0,0,0.40)` dark).  
**Transition:** 120–180ms for hover and drawer movement; honor `prefers-reduced-motion`.  
**Web widths:** app container max 1440px, reading columns max 720px, table sections can use full remaining width; sidebar 240px; details drawer width 480px; form dialog 520px; destructive alert 420px.  
**Grid:** 12 columns desktop, 6 tablet, 4 mobile; typical card padding 20–24px desktop, 16px mobile; sections separated by 32–48px.

## 5. Component treatments

| Component | Design | Behavior |
|---|---|---|
| Primary button | Solid `action`, `action-ink`, **height 52–56px**, **10px radius**, 22–28px horizontal padding, 500-weight Instrument Sans | Loading state with preserved width; no duplicate submit |
| Secondary button | 1px line, neutral surface, 10px radius, 44–48px height | At least a 44px target |
| Text button | No box, underlined on hover/focus | For navigation or low-priority actions |
| Input | White/near-black surface, neutral outline, 44–48px | Visible label above, useful helper/error below |
| Select | Matches input; single clear-chevron affordance | Keyboard and screen-reader support |
| Table | No inner card per row; 48–56px rows | Sticky header when long; filters above; row click via accessible action |
| Card | 1px outline, no shadow, 8–12px radius | Only when grouping actually improves comprehension |
| Tabs | Minimal underline + text state | No giant pill tab rows |
| Status | Small semantic text + icon | `Verified` / `Pending` / `Needs review` / `Closed` |
| Toast | Short confirmation/error, no blocking | Accessible live region; do not replace validation errors |
| Skeleton | Neutral steady/light pulse only | Match final layout and honor reduced motion |
| Dialog | High-contrast surface, 1px border, light shadow | Focus trapped, labelled title, Escape where safe |
| Bottom sheet | Native-feeling iOS / Android styles | Handle system safe areas and keyboard |

## 6. Theme preferences

Offer `System` (default), `Light`, `Dark` in account settings. In web, apply `data-theme="light" | "dark"` to `<html>` and `color-scheme` accordingly; when `system`, follow `prefers-color-scheme`. On React Native, respect system mode by default and use NativeWind's supported color scheme API for the installed version. Persist a user override on the server when signed in, locally when guest. Avoid revealing saved theme before auth: local preference may be applied immediately; cloud preference can sync after login.

**Avoid `useEffect` for ordinary server data or derived theme values**; use controlled state, React Native `useColorScheme`, or a dedicated theme provider. A necessary imperative listener is acceptable for native AppState/NetInfo/appearance integration; do not over-rotate into eliminating every effect.

## 7. Android and iOS native distinction

Keep fonts, colors, spacing, labels, icons and accessibility consistent; vary presentation where platform expectations differ.

| Task | iOS | Android |
|---|---|---|
| Primary navigation | Native-feeling bottom tabs, stacked pushes, back swipe | Android back handling, adaptive bottom nav, material transition |
| Record details | Push detail or detent sheet | Full screen / adaptive sheet where appropriate |
| Action menu | iOS action sheet | Android bottom sheet or overflow menu |
| Date/time | iOS-style native wheel/compact picker | Android native date/time picker |
| Confirmation | Concise iOS alert, safe dismissal | Material alert with labelled actions |
| Scanner | Fullscreen camera with safe-area overlay | Fullscreen camera with Android system-bar handling |

Do not equate "different UI" with duplicated code. Share hooks, DTOs, app logic and base components; use `*.ios.tsx` / `*.android.tsx` only when native interaction truly differs.

## 8. Web accessibility and modal rules

1. Every modal has semantic title, description, accessible trigger, focus trap and focus restore. Escape closes non-destructive dialogs; a destructive confirmation has a visible cancel action and must not accidentally dismiss on an overlay click.
2. Never nest more than one modal. Go to a dedicated page for 3+ step tasks.
3. Use inline field errors, live announcements and optimistic loading indicators with rollback.
4. On narrow screens, drawers become a full-screen page or bottom sheet with a persistent close/back action, not a 480px drawer overflowing screen width.
5. Keep sticky actions reachable above the mobile keyboard; support Dynamic Type and text scaling.
6. Selection and active states must be indicated through more than fill color (e.g. border, underlines, explicit checkmarks).

## 9. Anti-pattern checklist

- [ ] No heavy font weight everywhere.
- [ ] No gradient backgrounds, saturated accent color, floating glass cards or overdrawn shadows.
- [ ] No five different KPI cards saying essentially the same thing.
- [ ] No modal for a complex rate-plan wizard or onboarding sequence.
- [ ] No `useEffect` for fetching customer lists.
- [ ] No cross-tenant CRM search or global driver directory.
- [ ] No action that trusts a screenshot or stale cached payment as settlement.
- [ ] No dark-mode hardcoded black text on black surfaces.
- [ ] No unlabeled icons, invisible focus states or touch targets under 44px.

## 10. Font integration examples

### Next.js App Router (self-hosted by `next/font`)

```tsx
// apps/web/src/app/layout.tsx
import { Instrument_Sans, DM_Mono } from 'next/font/google';

const instrument = Instrument_Sans({
  subsets: ['latin'], weight: ['400', '500', '600'],
  variable: '--font-instrument', display: 'swap',
});
const dmMono = DM_Mono({
  subsets: ['latin'], weight: ['300', '400', '500'],
  variable: '--font-dm-mono', display: 'swap',
});

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${instrument.variable} ${dmMono.variable}`}>
      <body>{children}</body>
    </html>
  );
}
```

In Tailwind v4 global CSS, use `@theme inline` aliases for `--font-sans` and `--font-mono` (already present in `apps/web/styles/theme.css`). Apply DM Mono with `font-mono` **only** to operational numbers/IDs.

### Expo React Native

From each Expo app directory, install fonts using `npx expo install expo-font @expo-google-fonts/instrument-sans @expo-google-fonts/dm-mono`.

```tsx
import { useFonts } from 'expo-font';
import { InstrumentSans_400Regular, InstrumentSans_500Medium } from '@expo-google-fonts/instrument-sans';
import { DMMono_400Regular, DMMono_500Medium } from '@expo-google-fonts/dm-mono';

const [loaded] = useFonts({
  InstrumentSans_400Regular, InstrumentSans_500Medium,
  DMMono_400Regular, DMMono_500Medium,
});

// Inside a root layout: render your splash/placeholder until fonts are loaded.
// fontFamily in React Native should match the registered key above.
```

Use the `expo-font` build-time configuration plugin when appropriate for production; validate font family names on physical Android and iOS devices. No font binaries are included with these documents.

## 10. References and licenses

- Instrument Sans font: https://github.com/Instrument/instrument-sans (SIL OFL 1.1)
- Instrument Serif (optional): https://github.com/Instrument/instrument-serif (SIL OFL 1.1)
- DM Mono: https://github.com/googlefonts/dm-mono (SIL OFL 1.1)
- DM Mono specimen: https://fonts.google.com/specimen/DM+Mono
- Radix dialog accessibility: https://www.radix-ui.com/primitives/docs/components/dialog
- NativeWind installation/dark mode: https://www.nativewind.dev/docs/getting-started/installation

No font binaries are distributed in this bundle.
