import { statusGlyph, type StatusTone } from '@smart-parking/design-tokens';

/** `● Verified`, `○ Pending`: glyph + words, never colour alone. */
export function StatusLabel({ tone, children }: { tone: StatusTone; children: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-[13px] font-medium text-ink">
      <span aria-hidden="true">{statusGlyph[tone]}</span>
      {children}
    </span>
  );
}
