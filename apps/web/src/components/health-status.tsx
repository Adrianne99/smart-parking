'use client';

import { ApiClientError } from '@smart-parking/api-client';
import { DISPLAY_TIME_ZONE } from '@smart-parking/contracts';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';

const manilaTime = new Intl.DateTimeFormat('en-PH', {
  timeZone: DISPLAY_TIME_ZONE,
  dateStyle: 'medium',
  timeStyle: 'medium',
});

export function HealthStatus() {
  const health = useQuery({
    queryKey: ['health'],
    queryFn: ({ signal }) => api.health(signal),
  });
  const error = health.error instanceof ApiClientError ? health.error : undefined;

  return (
    <section
      aria-labelledby="api-status-heading"
      className="flex flex-col gap-4 rounded-[10px] border border-line bg-surface p-5 sm:p-6"
    >
      <h2 id="api-status-heading" className="text-[13px] font-medium text-ink-muted">
        API connection
      </h2>

      {/* Status is always text + symbol, never colour alone. */}
      <p role="status" className="text-[15px] font-medium">
        {health.isPending ? '○ Checking…' : health.isError ? '× Unreachable' : '● Connected'}
      </p>

      {health.isSuccess && (
        <p className="text-[14px] text-ink-muted">
          Server time{' '}
          <time dateTime={health.data.time} className="font-mono text-[13px] tabular-nums">
            {manilaTime.format(new Date(health.data.time))}
          </time>
        </p>
      )}

      {health.isError && (
        <>
          <p className="text-[14px] leading-[1.5] text-ink-muted">
            {error?.code === 'NETWORK_ERROR'
              ? 'The API could not be reached. Check that it is running and try again.'
              : (error?.message ?? 'The API returned an unexpected error.')}
            {error?.requestId && (
              <>
                {' '}
                Reference <span className="font-mono text-[13px]">{error.requestId}</span>
              </>
            )}
          </p>
          <button
            type="button"
            onClick={() => health.refetch()}
            disabled={health.isFetching}
            className="h-[54px] self-start rounded-[10px] bg-action px-7 text-[15px] font-medium text-action-ink transition-colors duration-150 hover:bg-action-hover disabled:cursor-not-allowed disabled:border disabled:border-line disabled:bg-surface-raised disabled:text-ink-faint"
          >
            {health.isFetching ? 'Retrying…' : 'Retry'}
          </button>
        </>
      )}
    </section>
  );
}
