// Deliberately NOT a 'use client' module: Server Components (the root layout) import this string.
import { THEME_STORAGE_KEY } from '@smart-parking/design-tokens';

/**
 * Inline this in <head> (before any content) so a saved override applies before first paint.
 * Pair with `suppressHydrationWarning` on <html>, since it sets an attribute React didn't render.
 */
export const themeInitScript = `try{var t=localStorage.getItem(${JSON.stringify(
  THEME_STORAGE_KEY,
)});if(t==="light"||t==="dark")document.documentElement.dataset.theme=t}catch(e){}`;
