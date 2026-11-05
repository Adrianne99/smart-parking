import { ApiClientError } from '@smart-parking/api-client';
import { DISPLAY_TIME_ZONE } from '@smart-parking/contracts';
import { Button, Card, StatusLabel } from '@smart-parking/ui-mobile';
import { useQuery } from '@tanstack/react-query';
import { Text, View } from 'react-native';
import { api } from '../lib/api';

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
    <Card>
      <Text className="font-ui-medium text-label text-ink-muted">API connection</Text>

      <View accessibilityLiveRegion="polite">
        {health.isPending ? (
          <StatusLabel tone="pending">Checking…</StatusLabel>
        ) : health.isError ? (
          <StatusLabel tone="negative">Unreachable</StatusLabel>
        ) : (
          <StatusLabel tone="positive">Connected</StatusLabel>
        )}
      </View>

      {health.isSuccess && (
        <Text className="font-ui text-compact text-ink-muted">
          Server time{' '}
          <Text className="font-data text-data">
            {manilaTime.format(new Date(health.data.time))}
          </Text>
        </Text>
      )}

      {health.isError && (
        <>
          <Text className="font-ui text-compact text-ink-muted">
            {error?.code === 'NETWORK_ERROR'
              ? 'The API could not be reached. Check your connection and try again.'
              : (error?.message ?? 'The API returned an unexpected error.')}
            {error?.requestId ? (
              <>
                {' '}
                Reference <Text className="font-data text-data">{error.requestId}</Text>
              </>
            ) : null}
          </Text>
          <Button
            label="Retry"
            loading={health.isFetching}
            loadingLabel="Retrying…"
            onPress={() => health.refetch()}
          />
        </>
      )}
    </Card>
  );
}
