// NativeWind (Tailwind 3) preset shared by apps/driver and apps/staff.
// Colour values are NOT here: the root layout injects them from src/index.ts via NativeWind `vars()`.
// React Native picks font weight by family name, so each weight is its own family utility.
const token = (name) => `var(--qu-${name})`;

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
          'action',
          'action-ink',
          'action-hover',
          'overlay',
          'focus-ring',
        ].map((name) => [name, token(name)]),
      ),
      fontFamily: {
        ui: ['InstrumentSans_400Regular'],
        'ui-medium': ['InstrumentSans_500Medium'],
        data: ['DMMono_400Regular'],
        'data-medium': ['DMMono_500Medium'],
      },
    },
  },
};
