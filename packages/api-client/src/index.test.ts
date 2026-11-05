import { describe, expect, it, vi } from 'vitest';
import { ApiClientError, createApiClient, shouldRetry } from './index';

const json = (status: number, body: unknown, headers: Record<string, string> = {}) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', ...headers },
  });

const clientWith = (impl: typeof fetch) =>
  createApiClient({ baseUrl: 'http://api.test/', fetch: impl });

const catchError = (p: Promise<unknown>) =>
  p.then(
    () => expect.fail('expected rejection'),
    (e: unknown) => e as ApiClientError,
  );

describe('createApiClient', () => {
  it('rejects a relative or missing base URL', () => {
    expect(() => createApiClient({ baseUrl: '' })).toThrow();
    expect(() => createApiClient({ baseUrl: '/api' })).toThrow();
  });

  it('returns a contract-validated health response', async () => {
    const time = new Date().toISOString();
    const fetchMock = vi.fn(async () => json(200, { status: 'ok', service: 'api', time }));
    await expect(clientWith(fetchMock).health()).resolves.toEqual({
      status: 'ok',
      service: 'api',
      time,
    });
    expect(fetchMock).toHaveBeenCalledWith('http://api.test/v1/health', expect.any(Object));
  });

  it('surfaces the server error envelope with its request ID', async () => {
    const body = {
      error: { code: 'FORBIDDEN_FACILITY', message: 'No access.', requestId: 'req-1234' },
    };
    const error = await catchError(clientWith(async () => json(403, body)).health());
    expect(error).toBeInstanceOf(ApiClientError);
    expect(error).toMatchObject({ code: 'FORBIDDEN_FACILITY', status: 403, requestId: 'req-1234' });
  });

  it('flags a non-contract error body (e.g. proxy 502 HTML)', async () => {
    const res = new Response('<html>Bad gateway</html>', {
      status: 502,
      headers: { 'X-Request-Id': 'edge-5678' },
    });
    const error = await catchError(clientWith(async () => res).health());
    expect(error).toMatchObject({
      code: 'UNEXPECTED_RESPONSE',
      status: 502,
      requestId: 'edge-5678',
    });
  });

  it('flags a 200 body that drifted from the contract', async () => {
    const error = await catchError(clientWith(async () => json(200, { status: 'up' })).health());
    expect(error).toMatchObject({ code: 'UNEXPECTED_RESPONSE', status: 200 });
  });

  it('maps a transport failure to NETWORK_ERROR with status 0', async () => {
    const error = await catchError(
      clientWith(async () => Promise.reject(new TypeError('fetch failed'))).health(),
    );
    expect(error).toMatchObject({ code: 'NETWORK_ERROR', status: 0 });
  });

  it('passes cancellation through instead of reporting a network error', async () => {
    const controller = new AbortController();
    controller.abort();
    const abortError = new DOMException('aborted', 'AbortError');
    const error = await catchError(
      clientWith(async () => Promise.reject(abortError)).health(controller.signal),
    );
    expect(error).toBe(abortError);
  });
});

describe('shouldRetry', () => {
  it('never retries 4xx and retries transient failures at most twice', () => {
    expect(shouldRetry(0, new ApiClientError('UNAUTHENTICATED', 401, 'x'))).toBe(false);
    expect(shouldRetry(0, new ApiClientError('RATE_LIMITED', 429, 'x'))).toBe(false);
    expect(shouldRetry(0, new ApiClientError('NETWORK_ERROR', 0, 'x'))).toBe(true);
    expect(shouldRetry(1, new ApiClientError('SERVICE_UNAVAILABLE', 503, 'x'))).toBe(true);
    expect(shouldRetry(2, new ApiClientError('SERVICE_UNAVAILABLE', 503, 'x'))).toBe(false);
  });
});
