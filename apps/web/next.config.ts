import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Workspace packages ship TypeScript source.
  transpilePackages: [
    '@smart-parking/api-client',
    '@smart-parking/contracts',
    '@smart-parking/design-tokens',
  ],
  poweredByHeader: false,
};

export default nextConfig;
