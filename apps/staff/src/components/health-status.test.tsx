import { ApiClientError } from '@smart-parking/api-client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen } from '@testing-library/react-native';
import { api } from '../lib/api';
import { HealthStatus } from './health-status';

jest.mock('../lib/api', () => ({ api: { health: jest.fn() } }));
const health = jest.mocked(api.health);

async function renderStatus() {
  // gcTime: Infinity schedules no cache timers, so Jest can exit cleanly.
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: Infinity } },
  });
  await render(
    <QueryClientProvider client={client}>
      <HealthStatus />
    </QueryClientProvider>,
  );
}

afterEach(() => health.mockReset());

describe('HealthStatus', () => {
  it('shows the server time in Asia/Manila once connected', async () => {
    health.mockResolvedValue({ status: 'ok', service: 'api', time: '2026-11-05T02:00:00.000Z' });
    await renderStatus();
    expect(await screen.findByText('● Connected')).toBeTruthy();
    expect(screen.getByText(/10:00:00/)).toBeTruthy(); // 02:00 UTC = 10:00 Manila
  });

  it('explains an unreachable API and recovers on Retry', async () => {
    health
      .mockRejectedValueOnce(new ApiClientError('NETWORK_ERROR', 0, 'Could not reach the server.'))
      .mockResolvedValueOnce({ status: 'ok', service: 'api', time: new Date().toISOString() });
    await renderStatus();

    expect(await screen.findByText('× Unreachable')).toBeTruthy();
    await fireEvent.press(screen.getByRole('button', { name: 'Retry' }));

    expect(await screen.findByText('● Connected')).toBeTruthy();
    expect(health).toHaveBeenCalledTimes(2);
  });
});
