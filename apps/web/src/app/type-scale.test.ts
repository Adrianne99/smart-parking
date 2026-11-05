// @vitest-environment node
// Keeps the Tailwind type scale in globals.css identical to the shared design tokens.
import { readFileSync } from 'node:fs';
import { typeScale } from '@smart-parking/design-tokens';
import { describe, expect, it } from 'vitest';

const css = readFileSync(new URL('./globals.css', import.meta.url), 'utf8');
const [mobileCss = '', desktopCss = ''] = css.split('@media (min-width: 1024px)');

describe.each(Object.entries(typeScale))('text-%s', (name, t) => {
  it('matches size, weight, line height and tracking', () => {
    expect(mobileCss).toContain(`--text-${name}: ${t.mobile}px;`);
    expect(mobileCss).toContain(`--text-${name}--font-weight: ${t.weight};`);
    expect(mobileCss).toContain(`--text-${name}--line-height: ${t.lineHeight};`);
    // Always explicit (0em too), so small text nested in a heading doesn't inherit its tracking.
    expect(mobileCss).toContain(`--text-${name}--letter-spacing: ${t.tracking}em;`);
    if (t.web !== t.mobile) expect(desktopCss).toContain(`--text-${name}: ${t.web}px;`);
  });
});
