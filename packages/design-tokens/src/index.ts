/**
 * Quiet Utility semantic tokens: the single source for web (CSS variables) and native (NativeWind vars).
 * Owner: Design System. Reference: docs/design/QUIET_UTILITY.md.
 * Near-black values follow 01_MASTER_BUILD_PROMPT (#0A0A0A), which takes precedence over the
 * v1.3 design-system table (#111111 / #0B0B0C). See docs/architecture/ADR-006.
 */
import typeScaleJson from './type-scale.json';

export type ThemeMode = 'system' | 'light' | 'dark';
export type ResolvedTheme = 'light' | 'dark';

export type ColorToken =
  | 'canvas'
  | 'surface'
  | 'surfaceRaised'
  | 'ink'
  | 'inkMuted'
  | 'inkFaint'
  | 'line'
  | 'lineStrong'
  /** Boundary of inputs and other controls: ≥3:1 against surfaces (WCAG 1.4.11). */
  | 'control'
  | 'action'
  | 'actionInk'
  | 'actionHover'
  | 'overlay'
  | 'focusRing';

export const themeColors = {
  light: {
    canvas: '#FFFFFF',
    surface: '#FFFFFF',
    surfaceRaised: '#FAFAFA',
    ink: '#0A0A0A',
    inkMuted: '#525252',
    inkFaint: '#737373',
    line: '#E6E6E6',
    lineStrong: '#C9C9C9',
    control: '#858585',
    action: '#0A0A0A',
    actionInk: '#FFFFFF',
    actionHover: '#292929',
    overlay: 'rgba(0,0,0,0.42)',
    focusRing: '#3E3E3E',
  },
  dark: {
    canvas: '#0A0A0A',
    surface: '#121214',
    surfaceRaised: '#19191B',
    ink: '#F5F5F4',
    inkMuted: '#A3A3A3',
    inkFaint: '#858585',
    line: '#303033',
    lineStrong: '#525255',
    control: '#707075',
    action: '#F5F5F4',
    actionInk: '#0A0A0A',
    actionHover: '#DEDEDE',
    overlay: 'rgba(0,0,0,0.66)',
    focusRing: '#D8D8D8',
  },
} as const satisfies Record<ResolvedTheme, Record<ColorToken, string>>;

export type TypeStyle = {
  /** px at ≥1024px viewport (web desktop). */
  web: number;
  /** px on phones (native, and web below 1024px). */
  mobile: number;
  weight: 400 | 500;
  /** Unitless multiple of font size. */
  lineHeight: number;
  /** em. */
  tracking: number;
};
export type TypeToken =
  'display' | 'h1' | 'h2' | 'h3' | 'body' | 'compact' | 'label' | 'caption' | 'data';

/** Type scale from the v1.3 design system. `data` is DM Mono (ids, money, times); the rest Instrument Sans. */
export const typeScale: Record<TypeToken, TypeStyle> = typeScaleJson as Record<
  TypeToken,
  TypeStyle
>;

/**
 * Status is never colour alone: always a glyph + plain-language label, e.g. `● Verified`.
 * Callers choose the tone by meaning, never by desired look.
 */
export const statusGlyph = {
  positive: '●',
  pending: '○',
  attention: '◐',
  negative: '×',
  neutral: '—',
} as const;
export type StatusTone = keyof typeof statusGlyph;

const kebab = (token: string) => token.replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`);

/** `{ '--qu-surface-raised': '#FAFAFA', ... }` for one theme. Used by NativeWind `vars()`. */
export function cssVariables(theme: ResolvedTheme): Record<`--qu-${string}`, string> {
  return Object.fromEntries(
    Object.entries(themeColors[theme]).map(([token, value]) => [`--qu-${kebab(token)}`, value]),
  );
}

const declarations = (theme: ResolvedTheme) =>
  Object.entries(cssVariables(theme))
    .map(([name, value]) => `${name}:${value};`)
    .join('') + `color-scheme:${theme};`;

/**
 * Web stylesheet: system theme by default, `<html data-theme="light|dark">` overrides it.
 * Rendered server-side in <head> so there is no flash of the wrong theme.
 */
export function themeStylesheet(): string {
  return [
    `:root{${declarations('light')}}`,
    `@media (prefers-color-scheme: dark){:root:not([data-theme="light"]){${declarations('dark')}}}`,
    `:root[data-theme="dark"]{${declarations('dark')}}`,
  ].join('\n');
}

/** localStorage key for the web theme override (absent = follow the system). */
export const THEME_STORAGE_KEY = 'qu-theme';
