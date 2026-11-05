import Storage from 'expo-sqlite/kv-store';
import { fireEvent, render, screen } from '@testing-library/react-native';
import { Alert, Appearance } from 'react-native';
import { Button, confirmAction, StatusLabel, TextField, ThemeRoot, ThemeSwitcher } from './index';

jest.mock('expo-sqlite/kv-store', () => ({
  __esModule: true,
  default: { getItemSync: jest.fn(), setItemSync: jest.fn(), removeItemSync: jest.fn() },
}));
const storage = jest.mocked(Storage);

beforeEach(() => {
  jest.clearAllMocks();
  jest.spyOn(Appearance, 'setColorScheme').mockImplementation(() => {});
});

describe('ThemeRoot + ThemeSwitcher', () => {
  it('applies the saved override at startup', async () => {
    storage.getItemSync.mockReturnValue('dark');
    await render(
      <ThemeRoot>
        <ThemeSwitcher />
      </ThemeRoot>,
    );
    expect(Appearance.setColorScheme).toHaveBeenCalledWith('dark');
    expect(screen.getByRole('radio', { name: 'Dark' }).props.accessibilityState.checked).toBe(true);
  });

  it('persists a new choice, and System clears the override', async () => {
    storage.getItemSync.mockReturnValue(null);
    await render(
      <ThemeRoot>
        <ThemeSwitcher />
      </ThemeRoot>,
    );
    expect(screen.getByRole('radio', { name: 'System' }).props.accessibilityState.checked).toBe(
      true,
    );

    await fireEvent.press(screen.getByRole('radio', { name: 'Light' }));
    expect(storage.setItemSync).toHaveBeenCalledWith('qu-theme', 'light');
    expect(Appearance.setColorScheme).toHaveBeenLastCalledWith('light');

    await fireEvent.press(screen.getByRole('radio', { name: 'System' }));
    expect(storage.removeItemSync).toHaveBeenCalledWith('qu-theme');
    expect(Appearance.setColorScheme).toHaveBeenLastCalledWith('auto');
  });

  it('falls back to System if storage is unavailable', async () => {
    storage.getItemSync.mockImplementation(() => {
      throw new Error('database locked');
    });
    await render(
      <ThemeRoot>
        <ThemeSwitcher />
      </ThemeRoot>,
    );
    expect(screen.getByRole('radio', { name: 'System' }).props.accessibilityState.checked).toBe(
      true,
    );
  });
});

describe('Button', () => {
  it('ignores presses while loading and reports busy', async () => {
    const onPress = jest.fn();
    await render(
      <Button label="Record cash payment" loading loadingLabel="Recording…" onPress={onPress} />,
    );
    const button = screen.getByRole('button', { name: 'Record cash payment' });
    await fireEvent.press(button);
    expect(onPress).not.toHaveBeenCalled();
    expect(button.props.accessibilityState).toMatchObject({ disabled: true, busy: true });
    expect(screen.getByText('Recording…')).toBeTruthy();
  });
});

describe('TextField and StatusLabel', () => {
  it('exposes the label and error to screen readers', async () => {
    await render(<TextField label="Plate number" optional error="Use letters and digits only" />);
    const input = screen.getByLabelText('Plate number, optional');
    expect(input.props.accessibilityHint).toBe('Use letters and digits only');
  });

  it('reads status as words, not the glyph', async () => {
    await render(<StatusLabel tone="positive">Verified</StatusLabel>);
    expect(screen.getByLabelText('Verified')).toBeTruthy();
  });
});

describe('confirmAction', () => {
  type AlertButtons = Parameters<typeof Alert.alert>[2];
  const pressButton = (index: number) => {
    const buttons = jest.mocked(Alert.alert).mock.calls[0]![2] as NonNullable<AlertButtons>;
    buttons[index]!.onPress?.();
  };

  beforeEach(() => jest.spyOn(Alert, 'alert').mockImplementation(() => {}));

  it('resolves true only on the explicit confirm button', async () => {
    const result = confirmAction({
      title: 'Confirm exit?',
      message: 'ABC 1234',
      confirmLabel: 'Confirm vehicle exit',
    });
    pressButton(1);
    await expect(result).resolves.toBe(true);
  });

  it('treats cancel as no, and blocks outside-tap dismissal when destructive', async () => {
    const result = confirmAction({
      title: 'Void ticket?',
      message: 'T-0042',
      confirmLabel: 'Void ticket',
      destructive: true,
    });
    expect(jest.mocked(Alert.alert).mock.calls[0]![3]).toMatchObject({ cancelable: false });
    pressButton(0);
    await expect(result).resolves.toBe(false);
  });
});
