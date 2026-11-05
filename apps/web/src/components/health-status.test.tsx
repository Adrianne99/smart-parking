import { ApiClientError } from '@smart-parking/api-client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { api } from '@/lib/api';
import { HealthStatus } from './health-status';

vi.mock('@/lib/api', () => ({ api: { health: vi.fn() } }));
const health = vi.mocked(api.health);

function renderStatus() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  render(
    <QueryClientProvider client={client}>
      <HealthStatus />
    </QueryClientProvider>,
  );
}

afterEach(() => {
  cleanup();
  health.mockReset();
});

describe('HealthStatus', () => {
  it('shows a pending state, then the server time in Asia/Manila', async () => {
    health.mockResolvedValue({ status: 'ok', service: 'api', time: '2026-11-05T02:00:00.000Z' });
    renderStatus();
    expect(screen.getByRole('status').textContent).toBe('○ Checking…');
    expect(await screen.findByText('● Connected')).toBeTruthy();
    expect(screen.getByText(/10:00:00/)).toBeTruthy(); // 02:00 UTC = 10:00 Manila
  });

  it('explains an unreachable API and recovers on Retry', async () => {
    health
      .mockRejectedValueOnce(new ApiClientError('NETWORK_ERROR', 0, 'Could not reach the server.'))
      .mockResolvedValueOnce({ status: 'ok', service: 'api', time: new Date().toISOString() });
    renderStatus();

    expect(await screen.findByText('× Unreachable')).toBeTruthy();
    expect(screen.getByText(/could not be reached/)).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Retry' }));

    expect(await screen.findByText('● Connected')).toBeTruthy();
    expect(health).toHaveBeenCalledTimes(2);
  });

  it('shows the server message and request ID for support', async () => {
    health.mockRejectedValue(
      new ApiClientError('SERVICE_UNAVAILABLE', 503, 'Service is restarting.', 'req-abc12345'),
    );
    renderStatus();
    expect(await screen.findByText(/Service is restarting\./)).toBeTruthy();
    expect(screen.getByText('req-abc12345')).toBeTruthy();
  });
});
