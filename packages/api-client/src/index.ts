import { apiErrorBodySchema, HEADERS, healthResponseSchema } from '@smart-parking/contracts';
import type { z } from 'zod';

/** Client-side codes for failures that never produced a contract-shaped server error. */
export type ClientErrorCode = 'NETWORK_ERROR' | 'UNEXPECTED_RESPONSE';

export class ApiClientError extends Error {
  constructor(
    /** A server ErrorCode (see @smart-parking/contracts) or a ClientErrorCode. */
    readonly code: string,
    /** HTTP status; 0 when no HTTP response was received (offline, DNS, CORS). */
    readonly status: number,
    message: string,
    /** Quote this to support; it matches the API's logs. */
    readonly requestId?: string,
    options?: ErrorOptions,
  ) {
    super(message, options);
    this.name = 'ApiClientError';
  }
}

export type ApiClientOptions = {
  /** Absolute http(s) origin of the API, e.g. https://api.example.ph */
  baseUrl: string;
  fetch?: typeof globalThis.fetch;
};

export function createApiClient({
  baseUrl,
  fetch: fetchImpl = globalThis.fetch,
}: ApiClientOptions) {
  if (!/^https?:\/\/[^/\s]+/.test(baseUrl)) {
    throw new Error('API base URL must be an absolute http(s) URL.');
  }
  const origin = baseUrl.replace(/\/+$/, '');

  async function request<T>(path: string, schema: z.ZodType<T>, init: RequestInit = {}) {
    let res: Response;
    try {
      res = await fetchImpl(`${origin}${path}`, {
        ...init,
        headers: { Accept: 'application/json', ...init.headers },
      });
    } catch (cause) {
      if (init.signal?.aborted) throw cause; // cancellation is not an error state
      throw new ApiClientError('NETWORK_ERROR', 0, 'Could not reach the server.', undefined, {
        cause,
      });
    }

    const requestId = res.headers.get(HEADERS.requestId) ?? undefined;
    const body: unknown = await res.json().catch(() => undefined);

    if (!res.ok) {
      const parsed = apiErrorBodySchema.safeParse(body);
      if (parsed.success) {
        const { code, message, requestId: id } = parsed.data.error;
        throw new ApiClientError(code, res.status, message, id);
      }
      throw new ApiClientError(
        'UNEXPECTED_RESPONSE',
        res.status,
        `Unexpected ${res.status} response.`,
        requestId,
      );
    }

    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      throw new ApiClientError(
        'UNEXPECTED_RESPONSE',
        res.status,
        'Response did not match the API contract.',
        requestId,
      );
    }
    return parsed.data;
  }

  return {
    health: (signal?: AbortSignal) => request('/v1/health', healthResponseSchema, { signal }),
  };
}

export type ApiClient = ReturnType<typeof createApiClient>;

/**
 * TanStack Query `retry` policy for reads: never retry 4xx (auth, permission, validation
 * won't fix themselves), retry network/5xx twice. Writes must not auto-retry; they rely
 * on Idempotency-Key and an explicit user action instead.
 */
export function shouldRetry(failureCount: number, error: unknown): boolean {
  if (error instanceof ApiClientError && error.status >= 400 && error.status < 500) return false;
  return failureCount < 2;
}
