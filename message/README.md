# Notelet - Device Rental System

## 🚀 Quick Start

### Prerequisites
- Go 1.21+
- PostgreSQL (via Docker)
- Git

### Installation

1. **Clone repository:**
```bash
git clone <repository-url>
cd Notelet
```

2. **Start Database:**
```bash
cd noteletwebservice-development
docker-compose up -d
```

3. **Configure Environment:**
```bash
cp .env.example .env
# Edit .env with your configurations
```

4. **Run Backend:**
```bash
cd noteletwebservice-development
go run main.go
```

5. **Access Application:**
```
http://localhost:3001
```

---

## 📁 Project Structure

See [PROJECT_STRUCTURE.md](PROJECT_STRUCTURE.md) for detailed documentation.

```
Notelet/
├── noteletwebservice-development/  # Backend (Go API)
│   ├── controllers/                # Business logic
│   ├── middlewares/               # Auth, CORS
│   ├── models/                    # Data structures
│   ├── routers/                   # Route mappings
│   ├── services/                  # JWT, OAuth
│   └── main.go                    # Entry point
│
└── Notelet-Frontend_v1/           # Frontend (Static HTML)
    └── public/                    # HTML, JS, CSS
        ├── index.html            # Home page
        ├── login.html            # Login
        ├── register.html         # Register
        ├── rentout.html          # Device management
        └── devicehistory.html    # Rental history
```

---

## 🔑 Features

### ✅ Authentication
- Email/Password registration (KMITL only)
- JWT-based authentication
- Google OAuth integration
- Token refresh

### ✅ Device Management
- Add/Edit/Delete devices
- Status tracking (Available → Delivered → Returned → Overdue)
- Status history
- Device browsing

### ✅ User Roles
- Owner: Manage devices
- Renter: Browse and rent devices

---

## 🛠️ Technologies

**Backend:**
- Go 1.21
- PostgreSQL
- JWT Authentication
- Google OAuth2

**Frontend:**
- HTML5, CSS3, JavaScript
- Static file serving via Go

**DevOps:**
- Docker (PostgreSQL)
- Docker Compose

---

## 📚 API Documentation

### Authentication
```
POST   /api/auth/register      # Register new user
POST   /api/auth/login         # Login
POST   /api/auth/refresh       # Refresh token
GET    /api/auth/profile       # Get user profile (Protected)
```

### Devices
```
GET    /api/devices/browse     # Browse all devices (Public)
POST   /api/devices            # Create device (Protected)
GET    /api/devices/my         # Get my devices (Protected)
GET    /api/devices/{id}       # Get device details (Protected)
DELETE /api/devices/{id}       # Delete device (Protected)
PATCH  /api/devices/{id}/status # Update status (Protected)
GET    /api/devices/{id}/history # Get status history (Protected)
```

---

## 🧪 Testing

Run the test script:
```powershell
.\simple_test.ps1
```

This will test:
1. User registration
2. Login
3. Device creation
4. Status updates
5. History retrieval

---

## 🔧 Configuration

### Environment Variables (.env)
```env
# Database
DB_HOST=localhost
DB_PORT=5432
DB_USER=alphen
DB_PASSWORD=goldfutionz.124
DB_NAME=notelet

# JWT
JWT_SECRET=your-secret-key-here
JWT_ACCESS_EXPIRY=24h
JWT_REFRESH_EXPIRY=168h

# Server
PORT=3001

# Google OAuth (Optional)
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_REDIRECT_URL=http://localhost:3001/api/auth/google/callback
```

---

## 📊 Database Schema

### Main Tables
- `AppUser` - User accounts
- `Owner` - Device owners
- `Renter` - Device renters
- `Device` - Available devices
- `DeviceType` - Device categories
- `DeviceOwner` - Device-Owner relationships
- `Status` - Status definitions
- `DeviceStatusHistory` - Status change log

---

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📝 License

This project is licensed under the MIT License.

---

## 👥 Team

- Project Lead: [Your Name]
- Backend Developer: [Name]
- Frontend Developer: [Name]

---

## 📞 Support

For issues and questions:
- GitHub Issues: [repository-url/issues]
- Email: support@notelet.kmitl.ac.th

---

**Version:** 1.0.0  
**Last Updated:** 2026-02-18
