import type { ButtonHTMLAttributes, ReactNode } from 'react';

export type ButtonVariant = 'primary' | 'secondary' | 'text';

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  /** Blocks further presses and shows `loadingLabel` without changing the button's width. */
  loading?: boolean;
  loadingLabel?: ReactNode;
};

const base =
  'inline-flex items-center justify-center rounded-[10px] font-medium transition-colors duration-150 disabled:cursor-not-allowed';

const variants: Record<ButtonVariant, string> = {
  // Substantial height, medium (not bold) label; disabled changes fill and border, not just opacity.
  primary:
    'h-[54px] px-7 text-[15px] bg-action text-action-ink hover:bg-action-hover disabled:bg-surface-raised disabled:text-ink-faint disabled:border disabled:border-line',
  secondary:
    'h-12 px-6 text-[15px] border border-control bg-surface text-ink hover:bg-surface-raised disabled:border-line disabled:text-ink-faint',
  text: 'min-h-11 px-1 text-[15px] text-ink underline-offset-4 hover:underline focus-visible:underline disabled:text-ink-faint',
};

export function Button({
  variant = 'primary',
  loading = false,
  loadingLabel,
  disabled,
  className = '',
  type = 'button',
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={`${base} ${variants[variant]} ${className}`}
      {...props}
    >
      {/* Both labels share one grid cell, so the width fits the longer one and never jumps. */}
      <span className="grid">
        <span
          aria-hidden={loading && loadingLabel ? true : undefined}
          className={`col-start-1 row-start-1 ${loading && loadingLabel ? 'invisible' : ''}`}
        >
          {children}
        </span>
        {loadingLabel ? (
          <span
            aria-hidden={!loading}
            className={`col-start-1 row-start-1 ${loading ? '' : 'invisible'}`}
          >
            {loadingLabel}
          </span>
        ) : null}
      </span>
    </button>
  );
}
