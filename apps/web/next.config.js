/** @type {import('next').NextConfig} */
const nextConfig = {
  // Reduce file watching to prevent EMFILE errors
  webpack: (config, { dev }) => {
    if (dev) {
      config.watchOptions = {
        poll: 1000, // Check for changes every second
        aggregateTimeout: 300, // Delay before rebuilding
        ignored: [
          '**/node_modules/**',
          '**/.git/**',
          '**/.next/**',
          '**/dist/**',
          '**/build/**',
        ],
      };
    }
    return config;
  },
  // Additional optimizations
  experimental: {
    // Reduce memory usage
    optimizePackageImports: ['@repo/ui'],
  },
};

export default nextConfig;
