/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: ['localhost'],
  },
  webpack: (config, { dev }) => {
    // Temp workaround: cssnano-simple fails to minify some generated CSS selectors.
    // Disable minimization in prod builds to unblock local builds.
    if (!dev && config.optimization) {
      config.optimization.minimize = false;
    }
    return config;
  },
  // Permet l'accès depuis le réseau
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'Access-Control-Allow-Origin',
            value: '*',
          },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
