# Frontend Source Code

Server-side code for the Node.js frontend.

## 📂 Structure

- **`index.js`** - Entry point, server setup, proxy configuration
- **`routes.js`** - Frontend route definitions
- **`controllers/`** - Business logic for handling requests
- **`routes/`** - Route configuration details
- **`utils/`** - Helper utilities and functions

## 🔌 Proxy Configuration

The `index.js` file sets up `http-proxy-middleware` to forward requests to the backend:

```javascript
// Routes /api/* and /uploads/* to http://localhost:3001
app.use(createProxyMiddleware({
  target: process.env.API_URL || 'http://localhost:3001',
  changeOrigin: true,
  pathFilter: ['/api/**', '/uploads/**']
}));
```

## 📡 How Requests Flow

1. **Static File Request** → Served from `public/` directory
2. **API Request** (`/api/**`) → Proxied to backend on port 3001
3. **Other Routes** → Handled by `routes.js`

## 🚀 Starting Server

```bash
node src/index.js
```

Server listens on:
- Port 3030 (default, configurable via PORT env var)
- Frontend: http://localhost:3030
- Backend: http://localhost:3001

## 🛠️ Adding New Routes

Edit `src/routes.js`:

```javascript
const setRoutes = (app) => {
  app.get('/page', (req, res) => {
    res.sendFile(__dirname + '/../public/page.html');
  });
};
```

Then create `public/page.html` file.
