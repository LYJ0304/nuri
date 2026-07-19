import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  transpilePackages: ['@nuri/contracts', '@nuri/ui'],
  async rewrites() {
    const apiUrl = process.env.API_INTERNAL_URL ?? 'http://localhost:3001';
    return [{ source: '/api/:path*', destination: `${apiUrl}/:path*` }];
  },
};

export default nextConfig;
