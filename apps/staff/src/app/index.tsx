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
          <Text className="font-ui-medium text-[13px] text-ink-muted">Smart Parking · Staff</Text>
          <Text
            accessibilityRole="header"
            className="font-ui-medium text-[28px] leading-[34px] tracking-[-1px] text-ink"
          >
            Attendant workspace
          </Text>
          <Text className="font-ui text-[16px] leading-[26px] text-ink-muted">
            Foundation build. Sign-in, shifts and vehicle check-in are not available yet.
          </Text>
        </View>
        <HealthStatus />
      </View>
    </ScrollView>
  );
}
