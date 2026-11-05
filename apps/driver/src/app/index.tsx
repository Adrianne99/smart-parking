import { ThemeSwitcher } from '@smart-parking/ui-mobile';
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
          <Text className="font-ui-medium text-label text-ink-muted">Smart Parking · Driver</Text>
          <Text accessibilityRole="header" className="font-ui-medium text-h1 text-ink">
            Find and pay for parking
          </Text>
          <Text className="font-ui text-body text-ink-muted">
            Foundation build. Nearby parking, tickets and payments are not available yet.
          </Text>
        </View>
        <HealthStatus />
        <ThemeSwitcher />
      </View>
    </ScrollView>
  );
}
