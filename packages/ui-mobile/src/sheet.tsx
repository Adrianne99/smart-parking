import type { ReactNode } from 'react';
import { Modal, Platform, Pressable, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button } from './button';

export type SheetProps = {
  visible: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
};

/**
 * Bottom sheet for short tasks (cash entry, filters, details).
 * iOS: the system page sheet (swipe down to close). Android: slide-up panel over a dimmed
 * backdrop; tap outside or press Back to close. For irreversible decisions use `confirmAction`.
 */
export function Sheet({ visible, onClose, title, children }: SheetProps) {
  const insets = useSafeAreaInsets();
  const body = (
    <View className="gap-4 px-4 pt-4" style={{ paddingBottom: insets.bottom + 16 }}>
      <View className="flex-row items-center justify-between gap-4">
        <Text accessibilityRole="header" className="flex-1 font-ui-medium text-h3 text-ink">
          {title}
        </Text>
        <Button variant="text" label="Close" onPress={onClose} />
      </View>
      {children}
    </View>
  );

  if (Platform.OS === 'ios') {
    return (
      <Modal
        visible={visible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={onClose}
      >
        <ScrollView className="flex-1 bg-surface">{body}</ScrollView>
      </Modal>
    );
  }

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      statusBarTranslucent
      navigationBarTranslucent
      onRequestClose={onClose}
    >
      <View className="flex-1 justify-end">
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Close"
          onPress={onClose}
          className="absolute inset-0 bg-overlay"
        />
        <View className="max-h-[90%] rounded-t-[16px] border-t border-line bg-surface">
          <ScrollView>{body}</ScrollView>
        </View>
      </View>
    </Modal>
  );
}
