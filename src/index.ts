// ============================================================
// Notelet Frontend Server
// ============================================================
// Node.js Express server that:
// 1. Serves static frontend files (HTML, CSS, JS)
// 2. Proxies API requests to the Go backend (including WebSocket)
// Runs on port 3030

import express from 'express';
import { createProxyMiddleware } from 'http-proxy-middleware';
import { setRoutes } from './routes';

const app = express();
const PORT = process.env.PORT || 3030;
const API_TARGET = process.env.API_URL || 'http://localhost:3001';

// ============================================================
// API Proxy Configuration (REST + WebSocket)
// ============================================================
// Forward /api/* and /uploads/* to the Go backend.
// ws: true enables WebSocket upgrade proxying (needed for /api/chat/ws).
const apiProxy = createProxyMiddleware({
  target: API_TARGET,
  changeOrigin: true,
  ws: true,
  pathFilter: ['/api/**', '/uploads/**'],
  on: {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    error: (err: Error, _req: any, res: any) => {
      console.error('[proxy] error:', err.message);
      if (res && typeof res.writeHead === 'function') {
        res.writeHead(502, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, message: 'Proxy error: Go backend unreachable' }));
      }
    },
  },
});

app.use(apiProxy);

// ============================================================
// Middleware Setup
// ============================================================
app.use(express.json());

// ============================================================
// Route Configuration
// ============================================================
setRoutes(app);

// ============================================================
// Start Server — attach WebSocket upgrade handler
// ============================================================
export { app };

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`✓ Frontend server is running on http://localhost:${PORT}`);
    console.log(`✓ API requests proxied to ${API_TARGET}`);
    console.log(`✓ WebSocket proxy enabled for /api/chat/ws`);
  });
}
