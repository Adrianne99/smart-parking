import { ApiClientError } from '@smart-parking/api-client';
import { DISPLAY_TIME_ZONE } from '@smart-parking/contracts';
import { useQuery } from '@tanstack/react-query';
import { Pressable, Text, View } from 'react-native';
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
  const retrying = health.isFetching;

  return (
    <View className="gap-4 rounded-[10px] border border-line bg-surface p-4">
      <Text className="font-ui-medium text-[13px] text-ink-muted">API connection</Text>

      {/* Status is always text + symbol, never colour alone. */}
      <Text accessibilityLiveRegion="polite" className="font-ui-medium text-[16px] text-ink">
        {health.isPending ? '○ Checking…' : health.isError ? '× Unreachable' : '● Connected'}
      </Text>

      {health.isSuccess && (
        <Text className="font-ui text-[14px] text-ink-muted">
          Server time{' '}
          <Text className="font-data text-[13px]">
            {manilaTime.format(new Date(health.data.time))}
          </Text>
        </Text>
      )}

      {health.isError && (
        <>
          <Text className="font-ui text-[14px] leading-[21px] text-ink-muted">
            {error?.code === 'NETWORK_ERROR'
              ? 'The API could not be reached. Check your connection and try again.'
              : (error?.message ?? 'The API returned an unexpected error.')}
            {error?.requestId ? (
              <>
                {' '}
                Reference <Text className="font-data text-[13px]">{error.requestId}</Text>
              </>
            ) : null}
          </Text>
          <Pressable
            accessibilityRole="button"
            accessibilityState={{ disabled: retrying, busy: retrying }}
            disabled={retrying}
            onPress={() => health.refetch()}
            className={`h-14 items-center justify-center rounded-[10px] px-7 ${
              retrying ? 'border border-line bg-surface-raised' : 'bg-action active:bg-action-hover'
            }`}
          >
            <Text
              className={`font-ui-medium text-[16px] ${retrying ? 'text-ink-faint' : 'text-action-ink'}`}
            >
              {retrying ? 'Retrying…' : 'Retry'}
            </Text>
          </Pressable>
        </>
      )}
    </View>
  );
}
