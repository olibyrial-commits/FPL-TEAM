/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  
  productionBrowserSourceMaps: false,
  
  webpack: (config, { dev, isServer }) => {
    if (dev && !isServer) {
      config.cache = {
        type: 'filesystem',
        cacheDirectory: require('path').resolve('.next/cache/webpack'),
      };
    }
    return config;
  },
  
  async rewrites() {
    return [
      {
        source: '/api/fpl/:path*',
        destination: 'http://localhost:8000/api/fpl/:path*',
      },
      {
        source: '/api/fpl/:path*/:path*',
        destination: 'http://localhost:8000/api/fpl/:path*/:path*',
      },
      {
        source: '/health',
        destination: 'http://localhost:8000/health',
      },
    ];
  },
};

module.exports = nextConfig;
