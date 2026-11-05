// Developer showcase of Quiet Utility native primitives (no real data, no API calls).
import {
  Button,
  Card,
  confirmAction,
  Sheet,
  StatusLabel,
  TextField,
  ThemeSwitcher,
} from '@smart-parking/ui-mobile';
import { useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function DesignScreen() {
  const insets = useSafeAreaInsets();
  const [sheetOpen, setSheetOpen] = useState(false);
  const [lastDecision, setLastDecision] = useState<string>('None yet');

  async function confirmExit() {
    const confirmed = await confirmAction({
      title: 'Confirm vehicle exit?',
      message: 'Plate ABC 1234 · Ticket T-000142\nCheck the vehicle matches before confirming.',
      confirmLabel: 'Confirm vehicle exit',
    });
    setLastDecision(confirmed ? 'Confirmed' : 'Cancelled');
  }

  return (
    <ScrollView
      className="flex-1 bg-canvas"
      contentContainerStyle={{ padding: 16, paddingBottom: insets.bottom + 32, gap: 32 }}
    >
      <ThemeSwitcher />

      <View className="gap-3">
        <Text accessibilityRole="header" className="font-ui-medium text-h2 text-ink">
          Type scale
        </Text>
        <Text className="font-ui-medium text-h1 text-ink">Heading 1</Text>
        <Text className="font-ui-medium text-h3 text-ink">Heading 3</Text>
        <Text className="font-ui text-body text-ink">Body text for readable operational copy.</Text>
        <Text className="font-data text-data text-ink">T-000142 · 08:12 · 1,250.00</Text>
      </View>

      <View className="gap-3">
        <Text accessibilityRole="header" className="font-ui-medium text-h2 text-ink">
          Buttons
        </Text>
        <Button label="New vehicle" />
        <Button label="Record cash payment" loading loadingLabel="Recording…" />
        <Button label="Unavailable" disabled />
        <Button variant="secondary" label="Cancel" />
        <Button variant="text" label="View all sessions" />
      </View>

      <View className="gap-4">
        <Text accessibilityRole="header" className="font-ui-medium text-h2 text-ink">
          Fields and status
        </Text>
        <TextField
          label="Plate number"
          helper="Letters and digits, e.g. ABC 1234"
          optional
          autoCapitalize="characters"
        />
        <TextField
          label="Amount tendered"
          error="Enter at least the amount due"
          keyboardType="decimal-pad"
          defaultValue="20"
        />
        <View className="flex-row flex-wrap gap-4">
          <StatusLabel tone="positive">Verified</StatusLabel>
          <StatusLabel tone="pending">Pending</StatusLabel>
          <StatusLabel tone="attention">Needs review</StatusLabel>
          <StatusLabel tone="negative">Failed</StatusLabel>
        </View>
      </View>

      <Card>
        <Text accessibilityRole="header" className="font-ui-medium text-h3 text-ink">
          Sheets and confirmations
        </Text>
        <Button variant="secondary" label="Open sheet" onPress={() => setSheetOpen(true)} />
        <Button variant="secondary" label="Ask for confirmation" onPress={confirmExit} />
        <Text className="font-ui text-compact text-ink-muted">Last decision: {lastDecision}</Text>
      </Card>

      <Sheet visible={sheetOpen} onClose={() => setSheetOpen(false)} title="Collect cash">
        <Text className="font-ui text-body text-ink-muted">Amount due</Text>
        <Text className="font-data-medium text-h1 text-ink">PHP 70.00</Text>
        <TextField label="Amount tendered" keyboardType="decimal-pad" />
        <Button label="Record cash payment" onPress={() => setSheetOpen(false)} />
      </Sheet>
    </ScrollView>
  );
}
