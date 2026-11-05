import { THEME_STORAGE_KEY } from '@smart-parking/design-tokens';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import {
  Button,
  ConfirmDialog,
  DataTable,
  Dialog,
  StatusLabel,
  TextField,
  ThemeSwitcher,
} from './index';

beforeAll(() => {
  // jsdom lacks the modal dialog API; emulate just enough of it.
  HTMLDialogElement.prototype.showModal ??= function (this: HTMLDialogElement) {
    this.setAttribute('open', '');
  };
  HTMLDialogElement.prototype.close ??= function (this: HTMLDialogElement) {
    this.removeAttribute('open');
  };
});

afterEach(() => {
  cleanup();
  localStorage.clear();
  delete document.documentElement.dataset.theme;
});

describe('Button', () => {
  it('blocks duplicate submits while loading and announces busy state', () => {
    const onClick = vi.fn();
    render(
      <Button loading loadingLabel="Saving…" onClick={onClick}>
        Save
      </Button>,
    );
    const button = screen.getByRole('button');
    fireEvent.click(button);
    expect(onClick).not.toHaveBeenCalled();
    expect(button.getAttribute('aria-busy')).toBe('true');
    expect((button as HTMLButtonElement).disabled).toBe(true);
  });
});

describe('TextField', () => {
  it('labels the input and links the error for screen readers', () => {
    render(<TextField label="Plate number" error="Enter a plate number" />);
    const input = screen.getByLabelText('Plate number');
    expect(input.getAttribute('aria-invalid')).toBe('true');
    const noteId = input.getAttribute('aria-describedby')!;
    expect(document.getElementById(noteId)?.textContent).toContain('Enter a plate number');
  });

  it('marks optional fields in words', () => {
    render(<TextField label="Plate number" optional />);
    expect(screen.getByLabelText(/Plate number.*optional/)).toBeTruthy();
  });
});

describe('StatusLabel', () => {
  it('pairs a glyph with text, hiding the glyph from screen readers', () => {
    render(<StatusLabel tone="pending">Pending</StatusLabel>);
    expect(screen.getByText('○').getAttribute('aria-hidden')).toBe('true');
    expect(screen.getByText('Pending')).toBeTruthy();
  });
});

describe('ThemeSwitcher', () => {
  it('defaults to System, then persists and applies an explicit override', () => {
    render(<ThemeSwitcher />);
    expect((screen.getByRole('radio', { name: /System/ }) as HTMLInputElement).checked).toBe(true);

    fireEvent.click(screen.getByRole('radio', { name: /Dark/ }));
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe('dark');
    expect(document.documentElement.dataset.theme).toBe('dark');
    expect((screen.getByRole('radio', { name: /Dark/ }) as HTMLInputElement).checked).toBe(true);

    fireEvent.click(screen.getByRole('radio', { name: /System/ }));
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBeNull();
    expect(document.documentElement.dataset.theme).toBeUndefined();
  });
});

describe('DataTable', () => {
  const columns = [
    { key: 'ticket', header: 'Ticket', cell: (r: { id: string }) => r.id },
    { key: 'fee', header: 'Fee', cell: () => '₱50.00', numeric: true },
  ];

  it('renders the empty message, rows, and an error with retry', () => {
    const onRetry = vi.fn();
    const { rerender } = render(
      <DataTable
        caption="Sessions"
        columns={columns}
        rows={[]}
        getRowId={(r) => r.id}
        status="success"
        emptyMessage="No active sessions"
      />,
    );
    expect(screen.getByText('No active sessions')).toBeTruthy();

    rerender(
      <DataTable
        caption="Sessions"
        columns={columns}
        rows={[{ id: 'T-0042' }]}
        getRowId={(r) => r.id}
        status="success"
        emptyMessage="x"
      />,
    );
    expect(screen.getByRole('cell', { name: 'T-0042' })).toBeTruthy();

    rerender(
      <DataTable
        caption="Sessions"
        columns={columns}
        rows={undefined}
        getRowId={(r) => r.id}
        status="error"
        emptyMessage="x"
        onRetry={onRetry}
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Retry' }));
    expect(onRetry).toHaveBeenCalledOnce();
  });

  it('marks the table busy while loading', () => {
    render(
      <DataTable
        caption="Sessions"
        columns={columns}
        rows={undefined}
        getRowId={(r: { id: string }) => r.id}
        status="pending"
        emptyMessage="x"
      />,
    );
    expect(screen.getByRole('table', { hidden: true }).getAttribute('aria-busy')).toBe('true');
  });
});

describe('Dialog', () => {
  it('is labelled by its title and closes on Escape when dismissible', () => {
    const onClose = vi.fn();
    render(
      <Dialog
        open
        onClose={onClose}
        title="Create support case"
        description="Tell us what happened."
      />,
    );
    const dialog = screen.getByRole('dialog', { name: 'Create support case' });
    fireEvent(dialog, new Event('cancel', { cancelable: true }));
    expect(onClose).toHaveBeenCalledOnce();
  });

  it('a confirmation ignores Escape and backdrop clicks, and locks while pending', () => {
    const onCancel = vi.fn();
    const onConfirm = vi.fn();
    render(
      <ConfirmDialog
        open
        pending
        title="Suspend this operator?"
        description="Existing sessions are affected."
        confirmLabel="Suspend operator"
        onConfirm={onConfirm}
        onCancel={onCancel}
        error="The operator could not be suspended. Try again."
      />,
    );
    const dialog = screen.getByRole('dialog', { name: 'Suspend this operator?' });
    fireEvent(dialog, new Event('cancel', { cancelable: true }));
    fireEvent.click(dialog);
    expect(onCancel).not.toHaveBeenCalled();

    // While pending, assistive tech hears only the pending label.
    fireEvent.click(screen.getByRole('button', { name: 'Working…' }));
    expect(onConfirm).not.toHaveBeenCalled();
    expect(screen.getByRole('alert').textContent).toContain('could not be suspended');
  });
});
