import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  transpilePackages: ['@nuri/contracts', '@nuri/ui'],
};

export default nextConfig;
