import { Pressable, Text, type PressableProps } from 'react-native';

export type ButtonVariant = 'primary' | 'secondary' | 'text';

export type ButtonProps = Omit<PressableProps, 'children' | 'style'> & {
  label: string;
  variant?: ButtonVariant;
  /** Blocks further presses (no duplicate submits) and shows `loadingLabel`. */
  loading?: boolean;
  loadingLabel?: string;
};

const container: Record<ButtonVariant, { enabled: string; disabled: string }> = {
  // 56px, 10px radius, medium label; disabled changes fill and border, not just opacity.
  primary: {
    enabled: 'h-14 px-7 bg-action active:bg-action-hover',
    disabled: 'h-14 px-7 border border-line bg-surface-raised',
  },
  secondary: {
    enabled: 'h-12 px-6 border border-control bg-surface active:bg-surface-raised',
    disabled: 'h-12 px-6 border border-line bg-surface',
  },
  text: { enabled: 'min-h-11 px-1', disabled: 'min-h-11 px-1' },
};

const labelClass: Record<ButtonVariant, string> = {
  primary: 'text-action-ink',
  secondary: 'text-ink',
  text: 'text-ink underline',
};

export function Button({
  label,
  variant = 'primary',
  loading = false,
  loadingLabel,
  disabled,
  className = '',
  ...props
}: ButtonProps & { className?: string }) {
  const inactive = Boolean(disabled || loading);
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: inactive, busy: loading }}
      disabled={inactive}
      hitSlop={variant === 'text' ? 8 : undefined}
      className={`items-center justify-center rounded-[10px] ${container[variant][inactive ? 'disabled' : 'enabled']} ${className}`}
      {...props}
    >
      <Text
        className={`font-ui-medium text-[16px] ${inactive ? 'text-ink-faint' : labelClass[variant]}`}
      >
        {loading && loadingLabel ? loadingLabel : label}
      </Text>
    </Pressable>
  );
}
