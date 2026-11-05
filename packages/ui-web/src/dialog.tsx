'use client';

import { useEffect, useId, useRef, type ReactNode } from 'react';
import { Button } from './button';

export type DialogProps = {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children?: ReactNode;
  /** Footer actions; put the single primary action last. */
  actions?: ReactNode;
  /** Escape and backdrop click close the dialog. Turn off for destructive/financial steps. */
  dismissible?: boolean;
  size?: 'form' | 'alert';
};

/**
 * Native <dialog> in modal mode: the page behind becomes inert (focus can't leave), Escape fires
 * `cancel`, and the browser returns focus to the opener on close.
 */
export function Dialog({
  open,
  onClose,
  title,
  description,
  children,
  actions,
  dismissible = true,
  size = 'form',
}: DialogProps) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const descriptionId = useId();

  // Syncing React state to the imperative <dialog> API is a legitimate effect (external system).
  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      aria-labelledby={titleId}
      aria-describedby={description ? descriptionId : undefined}
      onCancel={(event) => {
        event.preventDefault(); // we decide, so the element never closes behind React's back
        if (dismissible) onClose();
      }}
      onClick={(event) => {
        if (dismissible && event.target === ref.current) onClose(); // backdrop
      }}
      className={`m-auto w-[calc(100%-2rem)] rounded-[12px] border border-line bg-surface p-0 text-ink shadow-[0_16px_44px_rgba(0,0,0,0.12)] backdrop:bg-overlay ${
        size === 'alert' ? 'max-w-[420px]' : 'max-w-[520px]'
      }`}
    >
      <div className="flex flex-col gap-5 p-5 sm:p-6">
        <header className="flex flex-col gap-1.5">
          <h2 id={titleId} className="text-h3 font-medium">
            {title}
          </h2>
          {description ? (
            <p id={descriptionId} className="text-[14px] leading-[1.5] text-ink-muted">
              {description}
            </p>
          ) : null}
        </header>
        {children}
        {actions ? (
          <footer className="flex flex-col-reverse gap-3 border-t border-line pt-4 sm:flex-row sm:justify-end">
            {actions}
          </footer>
        ) : null}
      </div>
    </dialog>
  );
}

export type ConfirmDialogProps = {
  open: boolean;
  title: string;
  description: string;
  /** Say exactly what happens: "Confirm vehicle exit", "Suspend operator". Never "Proceed". */
  confirmLabel: string;
  pendingLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
  /** While true the dialog cannot be dismissed and the confirm button is locked. */
  pending?: boolean;
  /** Shown inside the dialog; it stays open so the user understands what happened. */
  error?: string;
};

/** For destructive or financial decisions: no backdrop dismissal, explicit cancel, no double submit. */
export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel,
  pendingLabel = 'Working…',
  onConfirm,
  onCancel,
  pending = false,
  error,
}: ConfirmDialogProps) {
  return (
    <Dialog
      open={open}
      onClose={onCancel}
      title={title}
      description={description}
      size="alert"
      dismissible={false}
      actions={
        <>
          <Button variant="secondary" onClick={onCancel} disabled={pending}>
            Cancel
          </Button>
          <Button onClick={onConfirm} loading={pending} loadingLabel={pendingLabel}>
            {confirmLabel}
          </Button>
        </>
      }
    >
      {error ? (
        <p role="alert" className="text-[14px] font-medium text-ink">
          <span aria-hidden="true">× </span>
          {error}
        </p>
      ) : null}
    </Dialog>
  );
}
