import { Alert } from 'react-native';

export type ConfirmOptions = {
  title: string;
  /** Put the values being confirmed here (plate, amount, ticket) so they are visible before deciding. */
  message: string;
  /** Say exactly what happens: "Confirm vehicle exit", "Record cash payment". Never "OK". */
  confirmLabel: string;
  cancelLabel?: string;
  destructive?: boolean;
};

/**
 * Native confirmation (iOS alert / Material dialog). Resolves true only on the explicit confirm
 * button; any dismissal is a cancel. Destructive alerts can't be dismissed by tapping outside.
 */
export function confirmAction({
  title,
  message,
  confirmLabel,
  cancelLabel = 'Cancel',
  destructive = false,
}: ConfirmOptions): Promise<boolean> {
  return new Promise((resolve) => {
    Alert.alert(
      title,
      message,
      [
        { text: cancelLabel, style: 'cancel', onPress: () => resolve(false) },
        {
          text: confirmLabel,
          style: destructive ? 'destructive' : 'default',
          onPress: () => resolve(true),
        },
      ],
      { cancelable: !destructive, onDismiss: () => resolve(false) },
    );
  });
}
