import { useId, type InputHTMLAttributes } from 'react';

export type TextFieldProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'id'> & {
  label: string;
  /** Shown under the field; replaced by `error` when present. */
  helper?: string;
  error?: string;
  optional?: boolean;
};

/** Visible label above, helper/error below, both wired to assistive tech. */
export function TextField({
  label,
  helper,
  error,
  optional,
  className = '',
  ...props
}: TextFieldProps) {
  const id = useId();
  const noteId = `${id}-note`;
  const note = error ?? helper;
  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      <label htmlFor={id} className="text-[13px] font-medium text-ink">
        {label}
        {optional ? <span className="font-normal text-ink-muted"> (optional)</span> : null}
      </label>
      <input
        id={id}
        aria-invalid={error ? true : undefined}
        aria-describedby={note ? noteId : undefined}
        className={`h-12 rounded-[6px] border bg-surface px-3 text-[15px] text-ink transition-colors duration-150 disabled:bg-surface-raised disabled:text-ink-faint ${
          error ? 'border-2 border-ink' : 'border-control'
        }`}
        {...props}
      />
      {note ? (
        <p
          id={noteId}
          className={`text-[13px] ${error ? 'font-medium text-ink' : 'text-ink-muted'}`}
        >
          {error ? <span aria-hidden="true">× </span> : null}
          {note}
        </p>
      ) : null}
    </div>
  );
}
