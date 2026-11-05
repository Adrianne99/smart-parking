import type { ThemeMode } from '@smart-parking/design-tokens';
import { Pressable, Text, View } from 'react-native';
import { useTheme } from './theme-root';

const options: { mode: ThemeMode; label: string }[] = [
  { mode: 'system', label: 'System' },
  { mode: 'light', label: 'Light' },
  { mode: 'dark', label: 'Dark' },
];

/** System / Light / Dark. Selection shown by check mark + weight, not fill alone. */
export function ThemeSwitcher() {
  const { mode, setMode } = useTheme();
  return (
    <View className="gap-2">
      <Text nativeID="theme-label" className="font-ui-medium text-label text-ink">
        Theme
      </Text>
      <View
        accessibilityRole="radiogroup"
        accessibilityLabelledBy="theme-label"
        className="flex-row rounded-[10px] border border-control p-1"
      >
        {options.map((option) => {
          const selected = option.mode === mode;
          return (
            <Pressable
              key={option.mode}
              accessibilityRole="radio"
              accessibilityLabel={option.label}
              accessibilityState={{ checked: selected }}
              onPress={() => setMode(option.mode)}
              className={`h-11 flex-1 items-center justify-center rounded-[7px] ${selected ? 'bg-action' : ''}`}
            >
              <Text
                className={`text-[15px] ${selected ? 'font-ui-medium text-action-ink' : 'font-ui text-ink-muted'}`}
              >
                {selected ? '✓ ' : ''}
                {option.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}
