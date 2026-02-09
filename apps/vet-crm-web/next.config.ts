import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@petspond/types', '@petspond/api-client'],
};

export default nextConfig;
