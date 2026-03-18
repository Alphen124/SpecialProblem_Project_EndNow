# Notelet Project Architecture

## 📦 Project Structure

```
Notelet/
├── Notelet-Frontend_v1/          # Node.js Frontend Server (Port 3030)
│   ├── public/                   # Static HTML, CSS, JS files
│   ├── src/
│   │   ├── index.js             # Main server file with proxy configuration
│   │   ├── routes.js            # Frontend routing
│   │   ├── controllers/         # Business logic layer
│   │   ├── routes/              # Route definitions
│   │   └── utils/               # Utility functions
│   └── package.json
│
└── noteletwebservice-development/ # Go Backend Server (Port 3001)
    ├── main.go                  # Application entry point
    ├── config/                  # Database configuration
    ├── controllers/             # HTTP request handlers
    ├── models/                  # Data models
    ├── routers/                 # API route definitions
    ├── middlewares/             # HTTP middlewares (auth, CORS, etc.)
    ├── services/                # Business logic and external services
    ├── types/                   # Type definitions (requests/responses)
    ├── utils/                   # Utility functions
    ├── migrations/              # Database schema migrations
    ├── uploads/                 # Uploaded files directory
    └── docker-compose.yml       # Docker services (if used)
```

## 🔄 Request Flow

```
Frontend (Browser)
    ↓ 
Frontend Server (Node.js:3030) 
    ├─ Static files (HTML, CSS, JS) 
    └─ API Requests (via proxy middleware)
        ↓
Backend Server (Go:3001)
    ├─ API Endpoints (/api/*)
    ├─ File Upload Handler (/uploads/*)
    └─ Database (PostgreSQL)
```

## 🚀 How to Run

### Backend (Go)
```bash
cd noteletwebservice-development
go run main.go
# Server runs on http://localhost:3001
```

### Frontend (Node.js)
```bash
cd Notelet-Frontend_v1
npm install
node src/index.js
# Server runs on http://localhost:3030
# Proxies /api/* and /uploads/* to backend
```

## 🔌 Proxy Configuration

The Node.js frontend uses `http-proxy-middleware` to forward API requests to the Go backend:
- **Path**: `/api/**` and `/uploads/**` → `http://localhost:3001`
- **Configuration**: Configured in `Notelet-Frontend_v1/src/index.js`

This setup allows:
- Frontend development without CORS issues
- Separation of concerns (frontend vs backend)
- Easy backend URL configuration via `API_URL` environment variable

## 📝 Key Files

| File | Purpose |
|------|---------|
| `noteletwebservice-development/main.go` | Backend entry point, database setup, OAuth configuration |
| `noteletwebservice-development/routers/router.go` | API route definitions and middleware setup |
| `Notelet-Frontend_v1/src/index.js` | Frontend server and API proxy configuration |
| `Notelet-Frontend_v1/public/index.html` | Main frontend HTML file |

## 🔐 Authentication

- OAuth 2.0 (Google) via `/api/auth/google`
- JWT Token-based auth via `/api/auth/login`
- Token refresh via `/api/auth/refresh`

## 📚 Environment Variables

- `GOOGLE_CLIENT_ID` - Google OAuth client ID
- `GOOGLE_CLIENT_SECRET` - Google OAuth secret
- `GOOGLE_REDIRECT_URL` - Callback URL (default: `http://localhost:3001/api/auth/google/callback`)
- `API_URL` - Backend URL for frontend proxy (default: `http://localhost:3001`)
