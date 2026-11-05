/** @type {import('tailwindcss').Config} */
module.exports = {
  // Shared primitives ship as source, so their classes must be scanned too.
  content: ['./src/**/*.{ts,tsx}', '../../packages/ui-mobile/src/**/*.{ts,tsx}'],
  presets: [
    require('nativewind/preset'),
    require('@smart-parking/design-tokens/nativewind-preset'),
  ],
};
