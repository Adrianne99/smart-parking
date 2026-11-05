import '../../global.css';

import { DMMono_400Regular, DMMono_500Medium } from '@expo-google-fonts/dm-mono';
import {
  InstrumentSans_400Regular,
  InstrumentSans_500Medium,
} from '@expo-google-fonts/instrument-sans';
import { shouldRetry } from '@smart-parking/api-client';
import { cssVariables, themeColors } from '@smart-parking/design-tokens';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { vars } from 'nativewind';
import { useColorScheme, View } from 'react-native';

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: shouldRetry, staleTime: 30_000 },
    mutations: { retry: false },
  },
});

const themeVars = { light: vars(cssVariables('light')), dark: vars(cssVariables('dark')) };

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    InstrumentSans_400Regular,
    InstrumentSans_500Medium,
    DMMono_400Regular,
    DMMono_500Medium,
  });
  // System theme for now; the persisted Light/Dark/System override lands with the P1 design system.
  const theme = useColorScheme() === 'dark' ? 'dark' : 'light';

  // On a font error we still render (system fallback) rather than trap the user on the splash.
  if (!fontsLoaded && !fontError) return null;

  return (
    <QueryClientProvider client={queryClient}>
      <View style={[themeVars[theme], { flex: 1 }]} onLayout={() => SplashScreen.hideAsync()}>
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: themeColors[theme].canvas },
          }}
        />
      </View>
      <StatusBar style={theme === 'dark' ? 'light' : 'dark'} />
    </QueryClientProvider>
  );
}
