import { statusGlyph, type StatusTone } from '@smart-parking/design-tokens';
import { Text } from 'react-native';

/** `● Verified`, `○ Pending`: glyph + words, never colour alone. Screen readers hear only the words. */
export function StatusLabel({ tone, children }: { tone: StatusTone; children: string }) {
  return (
    <Text accessibilityLabel={children} className="font-ui-medium text-label text-ink">
      {statusGlyph[tone]} {children}
    </Text>
  );
}
