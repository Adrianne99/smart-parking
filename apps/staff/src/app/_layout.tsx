import '../../global.css';

import { DMMono_400Regular, DMMono_500Medium } from '@expo-google-fonts/dm-mono';
import {
  InstrumentSans_400Regular,
  InstrumentSans_500Medium,
} from '@expo-google-fonts/instrument-sans';
import { shouldRetry } from '@smart-parking/api-client';
import { themeColors } from '@smart-parking/design-tokens';
import { ThemeRoot, useTheme } from '@smart-parking/ui-mobile';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: shouldRetry, staleTime: 30_000 },
    mutations: { retry: false },
  },
});

function AppStack() {
  const { theme } = useTheme();
  const colors = themeColors[theme];
  return (
    <Stack
      screenOptions={{
        contentStyle: { backgroundColor: colors.canvas },
        headerStyle: { backgroundColor: colors.canvas },
        headerTintColor: colors.ink,
        headerTitleStyle: { fontFamily: 'InstrumentSans_500Medium' },
        headerShadowVisible: false,
      }}
    >
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="design" options={{ title: 'Design system' }} />
    </Stack>
  );
}

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    InstrumentSans_400Regular,
    InstrumentSans_500Medium,
    DMMono_400Regular,
    DMMono_500Medium,
  });

  // On a font error we still render (system fallback) rather than trap the user on the splash.
  if (!fontsLoaded && !fontError) return null;

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeRoot onLayout={() => SplashScreen.hideAsync()}>
        <AppStack />
      </ThemeRoot>
    </QueryClientProvider>
  );
}
