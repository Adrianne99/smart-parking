import { createApiClient } from '@smart-parking/api-client';

// Must be read literally so Next.js inlines it at build time.
const baseUrl = process.env.NEXT_PUBLIC_API_URL;
if (!baseUrl) {
  throw new Error(
    'NEXT_PUBLIC_API_URL is not set. Copy apps/web/.env.example to apps/web/.env.local.',
  );
}

export const api = createApiClient({ baseUrl });
