import type { ReactNode } from 'react';
import { Button } from './button';

export type Column<T> = {
  key: string;
  header: string;
  cell: (row: T) => ReactNode;
  /** Right-aligned, tabular figures (money, counts, times). */
  numeric?: boolean;
};

export type DataTableProps<T> = {
  /** Accessible name for the table (visually hidden). */
  caption: string;
  columns: Column<T>[];
  rows: T[] | undefined;
  getRowId: (row: T) => string;
  status: 'pending' | 'error' | 'success';
  /** e.g. "No open cases for this facility". Say what is empty, not "No data". */
  emptyMessage: string;
  errorMessage?: string;
  onRetry?: () => void;
};

/** Line-separated table with sticky header and its loading, empty and error states built in. */
export function DataTable<T>({
  caption,
  columns,
  rows,
  getRowId,
  status,
  emptyMessage,
  errorMessage = 'This list could not be loaded.',
  onRetry,
}: DataTableProps<T>) {
  const message = (content: ReactNode) => (
    <tr>
      <td colSpan={columns.length} className="px-4 py-10 text-center text-[14px] text-ink-muted">
        {content}
      </td>
    </tr>
  );

  return (
    <div className="overflow-x-auto rounded-[10px] border border-line">
      <table
        className="w-full border-collapse text-left text-[14px]"
        aria-busy={status === 'pending'}
      >
        <caption className="sr-only">{caption}</caption>
        <thead className="sticky top-0 bg-surface-raised">
          <tr>
            {columns.map((column) => (
              <th
                key={column.key}
                scope="col"
                className={`h-11 border-b border-line px-4 text-[13px] font-medium text-ink-muted ${column.numeric ? 'text-right' : ''}`}
              >
                {column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {status === 'pending'
            ? [0, 1, 2].map((i) => (
                <tr key={i} aria-hidden="true">
                  {columns.map((column) => (
                    <td key={column.key} className="h-[52px] border-b border-line px-4">
                      <span className="block h-3 w-2/3 rounded bg-surface-raised motion-safe:animate-pulse" />
                    </td>
                  ))}
                </tr>
              ))
            : status === 'error'
              ? message(
                  <span className="flex flex-col items-center gap-3" role="alert">
                    {errorMessage}
                    {onRetry ? (
                      <Button variant="secondary" onClick={onRetry}>
                        Retry
                      </Button>
                    ) : null}
                  </span>,
                )
              : !rows?.length
                ? message(emptyMessage)
                : rows.map((row) => (
                    <tr key={getRowId(row)} className="hover:bg-surface-raised">
                      {columns.map((column) => (
                        <td
                          key={column.key}
                          className={`h-[52px] border-b border-line px-4 text-ink ${column.numeric ? 'text-right font-mono tabular-nums' : ''}`}
                        >
                          {column.cell(row)}
                        </td>
                      ))}
                    </tr>
                  ))}
        </tbody>
      </table>
    </div>
  );
}
