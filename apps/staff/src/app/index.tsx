import { Button, ThemeSwitcher } from '@smart-parking/ui-mobile';
import { router } from 'expo-router';
import { ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { HealthStatus } from '../components/health-status';

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  return (
    <ScrollView
      className="flex-1 bg-canvas"
      contentContainerStyle={{
        flexGrow: 1,
        justifyContent: 'center',
        paddingTop: insets.top + 32,
        paddingBottom: insets.bottom + 32,
      }}
    >
      <View className="gap-8 px-4">
        <View className="gap-3">
          <Text className="font-ui-medium text-label text-ink-muted">Smart Parking · Staff</Text>
          <Text accessibilityRole="header" className="font-ui-medium text-h1 text-ink">
            Attendant workspace
          </Text>
          <Text className="font-ui text-body text-ink-muted">
            Foundation build. Sign-in, shifts and vehicle check-in are not available yet.
          </Text>
        </View>
        <HealthStatus />
        <ThemeSwitcher />
        <Button
          variant="text"
          label="View design system components"
          onPress={() => router.push('/design')}
        />
      </View>
    </ScrollView>
  );
}
