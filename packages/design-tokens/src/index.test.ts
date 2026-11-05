import { createRequire } from 'node:module';
import { describe, expect, it } from 'vitest';
import { cssVariables, themeColors, themeStylesheet, type ColorToken } from './index';

const nativewindPreset = createRequire(import.meta.url)('../nativewind-preset.cjs') as {
  theme: { extend: { colors: Record<string, string> } };
};

// WCAG 2.2 relative luminance / contrast ratio for #RRGGBB colors.
function luminance(hex: string): number {
  const channels = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255);
  const [r, g, b] = channels.map((c) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r! + 0.7152 * g! + 0.0722 * b!;
}
function contrast(a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi! + 0.05) / (lo! + 0.05);
}

// [foreground, background, minimum ratio]: text needs 4.5:1, focus indicators 3:1.
const pairs: Array<[ColorToken, ColorToken, number]> = [
  ['ink', 'canvas', 4.5],
  ['ink', 'surface', 4.5],
  ['ink', 'surfaceRaised', 4.5],
  ['inkMuted', 'canvas', 4.5],
  ['inkMuted', 'surface', 4.5],
  ['inkFaint', 'canvas', 4.5],
  ['actionInk', 'action', 4.5],
  ['actionInk', 'actionHover', 4.5],
  ['focusRing', 'canvas', 3],
];

describe.each(['light', 'dark'] as const)('%s theme', (theme) => {
  it.each(pairs)('%s on %s meets WCAG AA', (fg, bg, min) => {
    expect(contrast(themeColors[theme][fg], themeColors[theme][bg])).toBeGreaterThanOrEqual(min);
  });

  it('inverts the primary action relative to the canvas', () => {
    const t = themeColors[theme];
    expect(t.action).toBe(t.ink);
    expect(contrast(t.action, t.canvas)).toBeGreaterThan(15);
  });
});

describe('CSS output', () => {
  it('emits one kebab-case variable per token', () => {
    const vars = cssVariables('light');
    expect(vars['--qu-surface-raised']).toBe('#FAFAFA');
    expect(Object.keys(vars)).toHaveLength(Object.keys(themeColors.light).length);
  });

  it('keeps the NativeWind preset in sync with every colour token', () => {
    const expected = Object.keys(cssVariables('light')).map((name) => name.replace('--qu-', ''));
    expect(Object.keys(nativewindPreset.theme.extend.colors).sort()).toEqual(expected.sort());
    expect(nativewindPreset.theme.extend.colors['surface-raised']).toBe('var(--qu-surface-raised)');
  });

  it('follows the system theme and honours explicit overrides', () => {
    const css = themeStylesheet();
    expect(css).toContain('@media (prefers-color-scheme: dark){:root:not([data-theme="light"])');
    expect(css).toContain(':root[data-theme="dark"]{--qu-canvas:#0A0A0A;');
  });
});
