import { createApiClient } from '@smart-parking/api-client';

// Must be read literally so Expo inlines it at build time.
const baseUrl = process.env.EXPO_PUBLIC_API_URL;
if (!baseUrl) {
  throw new Error(
    'EXPO_PUBLIC_API_URL is not set. Copy apps/driver/.env.example to apps/driver/.env.local.',
  );
}

export const api = createApiClient({ baseUrl });
