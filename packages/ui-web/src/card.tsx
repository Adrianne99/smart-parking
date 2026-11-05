import type { HTMLAttributes } from 'react';

/** 1px outline, no shadow. Use only when grouping genuinely helps. */
export function Card({ className = '', ...props }: HTMLAttributes<HTMLElement>) {
  return (
    <section
      className={`rounded-[10px] border border-line bg-surface p-5 sm:p-6 ${className}`}
      {...props}
    />
  );
}
