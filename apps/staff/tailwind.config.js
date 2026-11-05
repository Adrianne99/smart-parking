/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{ts,tsx}'],
  presets: [
    require('nativewind/preset'),
    require('@smart-parking/design-tokens/nativewind-preset'),
  ],
};
