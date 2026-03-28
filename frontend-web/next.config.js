/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  async rewrites() {
    // Évite le 404 sur les requêtes navigateur vers /favicon.ico (icône = app/icon.svg).
    return [{ source: '/favicon.ico', destination: '/icon.svg' }];
  },
  // Allow per-session/per-port cache directories to avoid dev chunk corruption
  // when multiple Next dev servers are accidentally launched.
  distDir: process.env.NEXT_DIST_DIR || '.next',
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
};

module.exports = nextConfig;
