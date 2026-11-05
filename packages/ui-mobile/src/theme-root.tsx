import { cssVariables, type ResolvedTheme, type ThemeMode } from '@smart-parking/design-tokens';
import Storage from 'expo-sqlite/kv-store';
import { StatusBar } from 'expo-status-bar';
import { vars } from 'nativewind';
import { createContext, useContext, useState, type ReactNode } from 'react';
import { Appearance, useColorScheme, View, type ViewProps } from 'react-native';

const STORAGE_KEY = 'qu-theme';
const themeVars = { light: vars(cssVariables('light')), dark: vars(cssVariables('dark')) };

function readStoredMode(): ThemeMode {
  try {
    const value = Storage.getItemSync(STORAGE_KEY);
    return value === 'light' || value === 'dark' ? value : 'system';
  } catch {
    return 'system';
  }
}

// Overriding Appearance makes useColorScheme(), native alerts, pickers and keyboards follow suit.
const applyOverride = (mode: ThemeMode) =>
  Appearance.setColorScheme(mode === 'system' ? 'auto' : mode);

type ThemeContextValue = {
  /** What the user chose. */
  mode: ThemeMode;
  /** What is on screen now. */
  theme: ResolvedTheme;
  setMode: (mode: ThemeMode) => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

/**
 * App root: applies the saved System/Light/Dark choice synchronously (no flash), provides the
 * Quiet Utility colour variables to every NativeWind class below it, and sets the status bar.
 */
export function ThemeRoot({
  children,
  onLayout,
}: {
  children: ReactNode;
  onLayout?: ViewProps['onLayout'];
}) {
  const [mode, setModeState] = useState<ThemeMode>(() => {
    const stored = readStoredMode();
    applyOverride(stored); // idempotent, so a double-invoked initializer is harmless
    return stored;
  });
  const theme: ResolvedTheme = useColorScheme() === 'dark' ? 'dark' : 'light';

  const setMode = (next: ThemeMode) => {
    setModeState(next);
    applyOverride(next);
    try {
      if (next === 'system') Storage.removeItemSync(STORAGE_KEY);
      else Storage.setItemSync(STORAGE_KEY, next);
    } catch {
      // Still applied for this session even if it can't be remembered.
    }
  };

  return (
    <ThemeContext.Provider value={{ mode, theme, setMode }}>
      <View style={[themeVars[theme], { flex: 1 }]} onLayout={onLayout}>
        {children}
      </View>
      <StatusBar style={theme === 'dark' ? 'light' : 'dark'} />
    </ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextValue {
  const value = useContext(ThemeContext);
  if (!value) throw new Error('useTheme() must be used inside <ThemeRoot>.');
  return value;
}
