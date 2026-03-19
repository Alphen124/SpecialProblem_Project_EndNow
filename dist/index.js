"use strict";
// ============================================================
// Notelet Frontend Server
// ============================================================
// Node.js Express server that:
// 1. Serves static frontend files (HTML, CSS, JS)
// 2. Proxies API requests to the Go backend (including WebSocket)
// Runs on port 3030
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.app = void 0;
const express_1 = __importDefault(require("express"));
const http_proxy_middleware_1 = require("http-proxy-middleware");
const routes_1 = require("./routes");
const app = (0, express_1.default)();
exports.app = app;
const PORT = process.env.PORT || 3030;
const API_TARGET = process.env.API_URL || 'http://localhost:3001';
// ============================================================
// API Proxy Configuration (REST + WebSocket)
// ============================================================
// Forward /api/* and /uploads/* to the Go backend.
// ws: true enables WebSocket upgrade proxying (needed for /api/chat/ws).
const apiProxy = (0, http_proxy_middleware_1.createProxyMiddleware)({
    target: API_TARGET,
    changeOrigin: true,
    ws: true,
    pathFilter: ['/api/**', '/uploads/**'],
    on: {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        error: (err, _req, res) => {
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
app.use(express_1.default.json());
// ============================================================
// Route Configuration
// ============================================================
(0, routes_1.setRoutes)(app);
if (require.main === module) {
    app.listen(PORT, () => {
        console.log(`✓ Frontend server is running on http://localhost:${PORT}`);
        console.log(`✓ API requests proxied to ${API_TARGET}`);
        console.log(`✓ WebSocket proxy enabled for /api/chat/ws`);
    });
}
