'use client';

import { ApiClientError } from '@smart-parking/api-client';
import { DISPLAY_TIME_ZONE } from '@smart-parking/contracts';
import { Button, Card, StatusLabel } from '@smart-parking/ui-web';
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
    <Card aria-labelledby="api-status-heading" className="flex flex-col gap-4">
      <h2 id="api-status-heading" className="text-label text-ink-muted">
        API connection
      </h2>

      <p role="status">
        {health.isPending ? (
          <StatusLabel tone="pending">Checking…</StatusLabel>
        ) : health.isError ? (
          <StatusLabel tone="negative">Unreachable</StatusLabel>
        ) : (
          <StatusLabel tone="positive">Connected</StatusLabel>
        )}
      </p>

      {health.isSuccess && (
        <p className="text-compact text-ink-muted">
          Server time{' '}
          <time dateTime={health.data.time} className="font-mono text-data tabular-nums">
            {manilaTime.format(new Date(health.data.time))}
          </time>
        </p>
      )}

      {health.isError && (
        <>
          <p className="text-compact text-ink-muted">
            {error?.code === 'NETWORK_ERROR'
              ? 'The API could not be reached. Check that it is running and try again.'
              : (error?.message ?? 'The API returned an unexpected error.')}
            {error?.requestId && (
              <>
                {' '}
                Reference <span className="font-mono text-data">{error.requestId}</span>
              </>
            )}
          </p>
          <Button
            className="self-start"
            onClick={() => health.refetch()}
            loading={health.isFetching}
            loadingLabel="Retrying…"
          >
            Retry
          </Button>
        </>
      )}
    </Card>
  );
}
