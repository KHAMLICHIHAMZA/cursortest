/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: ['localhost'],
  },
  webpack: (config, { dev }) => {
    // Workaround: cssnano-simple may fail on some generated CSS selectors.
    // Only disable minimization when DISABLE_CSS_MINIFY=1 is set.
    if (!dev && config.optimization && process.env.DISABLE_CSS_MINIFY === '1') {
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
