// NativeWind (Tailwind 3) preset shared by apps/driver and apps/staff.
// Colour values are NOT here: ThemeRoot (@smart-parking/ui-mobile) injects them via NativeWind `vars()`.
// React Native picks font weight by family name, so each weight is its own family utility.
const typeScale = require('./src/type-scale.json');

const token = (name) => `var(--qu-${name})`;

/** text-h1, text-body, ...: mobile sizes, line height and tracking converted to px. */
const fontSize = Object.fromEntries(
  Object.entries(typeScale).map(([name, t]) => [
    name,
    [
      `${t.mobile}px`,
      {
        lineHeight: `${Math.round(t.mobile * t.lineHeight)}px`,
        letterSpacing: `${Math.round(t.mobile * t.tracking * 100) / 100}px`,
      },
    ],
  ]),
);

/** @type {import('tailwindcss').Config} */
module.exports = {
  theme: {
    extend: {
      colors: Object.fromEntries(
        [
          'canvas',
          'surface',
          'surface-raised',
          'ink',
          'ink-muted',
          'ink-faint',
          'line',
          'line-strong',
          'control',
          'action',
          'action-ink',
          'action-hover',
          'overlay',
          'focus-ring',
        ].map((name) => [name, token(name)]),
      ),
      fontSize,
      fontFamily: {
        ui: ['InstrumentSans_400Regular'],
        'ui-medium': ['InstrumentSans_500Medium'],
        data: ['DMMono_400Regular'],
        'data-medium': ['DMMono_500Medium'],
      },
    },
  },
};
