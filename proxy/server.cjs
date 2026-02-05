/**
 * Reverse proxy MalocAuto — tout sur un seul port (8080)
 *
 * Routes:
 *   /api      → Backend NestJS (3000)
 *   /agency   → Frontend Agency Vite (3080)
 *   /admin    → Frontend Admin Vite (5173)
 *   /         → Frontend Web Next.js (3001)
 */

const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');

const PORT = Number(process.env.PROXY_PORT) || 8080;
const BACKEND = process.env.BACKEND_URL || 'http://localhost:3000';
const WEB = process.env.WEB_URL || 'http://localhost:3001';
const AGENCY = process.env.AGENCY_URL || 'http://localhost:3080';
const ADMIN = process.env.ADMIN_URL || 'http://localhost:5173';

const app = express();

// 1. API → Backend (priorité pour /api)
app.use(
  '/api',
  createProxyMiddleware({
    target: BACKEND,
    changeOrigin: true,
    ws: true,
  })
);

// 2. Agency (Vite avec base /agency/)
app.use(
  '/agency',
  createProxyMiddleware({
    target: AGENCY,
    changeOrigin: true,
    ws: true,
  })
);

// 3. Admin (Vite avec base /admin/)
app.use(
  '/admin',
  createProxyMiddleware({
    target: ADMIN,
    changeOrigin: true,
    ws: true,
  })
);

// 4. Tout le reste → Frontend Web (Next.js)
app.use(
  '/',
  createProxyMiddleware({
    target: WEB,
    changeOrigin: true,
    ws: true,
  })
);

app.listen(PORT, '0.0.0.0', () => {
  console.log(`[proxy] http://localhost:${PORT}`);
  console.log('  /       → Frontend Web (Next.js)');
  console.log('  /agency → Frontend Agency');
  console.log('  /admin  → Frontend Admin');
  console.log('  /api    → Backend API');
});
