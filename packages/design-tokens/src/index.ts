/**
 * Quiet Utility semantic tokens: the single source for web (CSS variables) and native (NativeWind vars).
 * P0 seed only; the Design System session owns this package from P1.
 * Near-black values follow 01_MASTER_BUILD_PROMPT (#0A0A0A), which takes precedence over the
 * v1.3 design-system table (#111111 / #0B0B0C). See docs/architecture/ADR-006.
 */
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
    action: '#F5F5F4',
    actionInk: '#0A0A0A',
    actionHover: '#DEDEDE',
    overlay: 'rgba(0,0,0,0.66)',
    focusRing: '#D8D8D8',
  },
} as const satisfies Record<ResolvedTheme, Record<ColorToken, string>>;

/** Primary button heights (px): substantial, never achieved with bold type. */
export const primaryButtonHeight = { web: 54, native: 56 } as const;
export const buttonRadius = 10;

/** Font family keys registered with expo-font (one family per weight on native). */
export const nativeFontFamily = {
  ui: 'InstrumentSans_400Regular',
  uiMedium: 'InstrumentSans_500Medium',
  data: 'DMMono_400Regular',
  dataMedium: 'DMMono_500Medium',
} as const;

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
