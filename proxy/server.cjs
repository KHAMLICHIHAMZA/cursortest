/**
 * Reverse proxy MalocAuto — tout sur un seul port (8080)
 *
 * Architecture unifiée :
 *   /api  → Backend NestJS (3000)
 *   /*    → Frontend Web Next.js (3001) — gère /admin, /company, /agency
 */

const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');

const PORT = Number(process.env.PROXY_PORT) || 8080;
const BACKEND = process.env.BACKEND_URL || 'http://localhost:3000';
const WEB = process.env.WEB_URL || 'http://localhost:3001';

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

// 2. Tout le reste → Frontend Web unifié (Next.js)
//    Gère /admin/*, /company/*, /agency/*, /login, etc.
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
  console.log('  /api  → Backend API (NestJS)');
  console.log('  /*    → Frontend Web unifié (Next.js)');
});
