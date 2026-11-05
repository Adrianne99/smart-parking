'use client';

import { THEME_STORAGE_KEY, type ThemeMode } from '@smart-parking/design-tokens';
import { useSyncExternalStore } from 'react';

// The override lives in localStorage + <html data-theme>; "system" = no attribute (CSS follows the OS).
// shortcut: per-browser only; sync to the signed-in user's account once a users/preferences table exists.

function readMode(): ThemeMode {
  try {
    const value = localStorage.getItem(THEME_STORAGE_KEY);
    return value === 'light' || value === 'dark' ? value : 'system';
  } catch {
    return 'system'; // storage blocked (private mode, policy)
  }
}

const listeners = new Set<() => void>();

function subscribe(listener: () => void) {
  listeners.add(listener);
  window.addEventListener('storage', listener); // other tabs
  return () => {
    listeners.delete(listener);
    window.removeEventListener('storage', listener);
  };
}

export function setThemeMode(mode: ThemeMode) {
  try {
    if (mode === 'system') localStorage.removeItem(THEME_STORAGE_KEY);
    else localStorage.setItem(THEME_STORAGE_KEY, mode);
  } catch {
    // Still apply for this page view even if it can't be remembered.
  }
  if (mode === 'system') delete document.documentElement.dataset.theme;
  else document.documentElement.dataset.theme = mode;
  listeners.forEach((listener) => listener());
}

export function useThemeMode(): ThemeMode {
  return useSyncExternalStore(subscribe, readMode, () => 'system');
}

const options: Array<{ mode: ThemeMode; label: string }> = [
  { mode: 'system', label: 'System' },
  { mode: 'light', label: 'Light' },
  { mode: 'dark', label: 'Dark' },
];

/** System / Light / Dark as a native radio group: arrow keys, labels and state come for free. */
export function ThemeSwitcher() {
  const current = useThemeMode();
  return (
    <fieldset className="flex flex-col gap-2">
      <legend className="mb-2 text-[13px] font-medium text-ink">Theme</legend>
      <div className="inline-flex w-fit rounded-[10px] border border-control p-1">
        {options.map(({ mode, label }) => (
          <label
            key={mode}
            className="relative flex h-10 min-w-[84px] cursor-pointer items-center justify-center gap-1.5 rounded-[7px] px-3 text-[14px] text-ink-muted has-[:checked]:bg-action has-[:checked]:font-medium has-[:checked]:text-action-ink has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-focus-ring"
          >
            <input
              type="radio"
              name="qu-theme"
              value={mode}
              checked={current === mode}
              onChange={() => setThemeMode(mode)}
              className="sr-only"
            />
            {/* Selection is shown by a check mark and weight, not fill alone. */}
            {current === mode ? <span aria-hidden="true">✓</span> : null}
            {label}
          </label>
        ))}
      </div>
    </fieldset>
  );
}
