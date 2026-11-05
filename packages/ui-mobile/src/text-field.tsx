import { Text, TextInput, View, type TextInputProps } from 'react-native';

export type TextFieldProps = TextInputProps & {
  label: string;
  /** Shown under the field; replaced by `error` when present. */
  helper?: string;
  error?: string;
  optional?: boolean;
};

/** Visible label above, helper/error below; the error is announced when it appears. */
export function TextField({
  label,
  helper,
  error,
  optional,
  editable = true,
  ...props
}: TextFieldProps) {
  const note = error ?? helper;
  return (
    <View className="gap-1.5">
      <Text className="font-ui-medium text-label text-ink">
        {label}
        {optional ? <Text className="font-ui text-ink-muted"> (optional)</Text> : null}
      </Text>
      <TextInput
        accessibilityLabel={optional ? `${label}, optional` : label}
        accessibilityHint={note}
        accessibilityState={{ disabled: !editable }}
        editable={editable}
        className={`h-12 rounded-[6px] px-3 font-ui text-[16px] ${
          editable ? 'bg-surface text-ink' : 'bg-surface-raised text-ink-faint'
        } ${error ? 'border-2 border-ink' : 'border border-control'}`}
        {...props}
      />
      {note ? (
        <Text
          accessibilityLiveRegion={error ? 'polite' : 'none'}
          className={`text-label ${error ? 'font-ui-medium text-ink' : 'font-ui text-ink-muted'}`}
        >
          {error ? '× ' : ''}
          {note}
        </Text>
      ) : null}
    </View>
  );
}
