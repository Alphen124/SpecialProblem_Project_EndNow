# 📋 โครงสร้างโปรเจค Notelet - สรุปและแบ่งงาน

## 🎯 ภาพรวมโปรเจค
**Notelet** คือระบบให้เช่าอุปกรณ์ (Device Rental System) สำหรับผู้ใช้ @kmitl.ac.th

---

## 📁 โครงสร้างหลัก

### 1. Backend (Go API) - `noteletwebservice-development/`
**หน้าที่:** RESTful API สำหรับจัดการข้อมูลและธุรกิจ

```
noteletwebservice-development/
├── main.go                    # Entry point ของ server
├── config/
│   └── database/
│       └── database.go        # การเชื่อมต่อ PostgreSQL
├── controllers/               # Business logic
│   ├── auth.go               # Register, Login, Profile
│   ├── device.go             # CRUD อุปกรณ์, Status management
│   └── oauth.go              # Google OAuth
├── middlewares/
│   └── auth.go               # JWT validation, CORS
├── models/
│   ├── device.go             # Device struct
│   └── user.go               # User/Owner/Renter struct
├── routers/
│   └── router.go             # Route mapping
├── services/
│   ├── jwt/                  # JWT token generation/validation
│   └── oauth/                # Google OAuth config
├── types/
│   ├── requests/             # Request DTOs
│   └── responses/            # Response DTOs
└── utils/
    ├── email.go              # Email validation
    └── password.go           # Password hashing
```

### 2. Frontend (Static HTML) - `Notelet-Frontend_v1/public/`
**หน้าที่:** UI สำหรับผู้ใช้

```
public/
├── index.html                # หน้าแรก
├── login.html                # เข้าสู่ระบบ
├── register.html             # สมัครสมาชิก
├── rentout.html             # หน้าจัดการอุปกรณ์ของเจ้าของ
├── devicehistory.html       # ประวัติการเช่า
├── auth.js                  # Authentication helper
├── navpopups.js            # Navigation components
└── styles.css              # Global styles
```

---

## ⚙️ Process Flow แบ่งตาม Feature

### 🔐 **Process 1: Authentication & Authorization**
**ผู้รับผิดชอบ:** Auth Module

#### ไฟล์ที่เกี่ยวข้อง:
- `controllers/auth.go` - Register, Login, RefreshToken, GetProfile
- `controllers/oauth.go` - GoogleLogin, GoogleCallback
- `middlewares/auth.go` - AuthMiddleware, CORSMiddleware
- `services/jwt/jwt.go` - GenerateAccessToken, ValidateAccessToken
- `utils/password.go` - HashPassword, ComparePassword
- `utils/email.go` - IsKMITLEmail validation

#### Endpoints:
```
POST   /api/auth/register              # สมัครสมาชิก
POST   /api/auth/login                 # เข้าสู่ระบบ
POST   /api/auth/refresh               # Refresh token
GET    /api/auth/profile               # ดูข้อมูลผู้ใช้
GET    /api/auth/google                # OAuth login
GET    /api/auth/google/callback       # OAuth callback
```

#### Frontend Pages:
- `login.html` - หน้า login form
- `register.html` - หน้า registration form
- `auth.js` - Token management, requireAuth()

---

### 🎒 **Process 2: Device Management (Owner Side)**
**ผู้รับผิดชอบ:** Device Owner Module

#### ไฟล์ที่เกี่ยวข้อง:
- `controllers/device.go` - CreateDevice, GetMyDevices, DeleteDevice, UpdateDeviceStatus, GetDeviceStatusHistory
- `models/device.go` - Device, DeviceType structs
- `types/requests/device_request.go` - CreateDeviceRequest, UpdateDeviceStatusRequest

#### Endpoints:
```
POST   /api/devices                    # เพิ่มอุปกรณ์
GET    /api/devices/my                 # ดูอุปกรณ์ของฉัน
GET    /api/devices/{id}              # ดูรายละเอียดอุปกรณ์
DELETE /api/devices/{id}              # ลบอุปกรณ์
PATCH  /api/devices/{id}/status       # อัพเดทสถานะอุปกรณ์
GET    /api/devices/{id}/history      # ดูประวัติการเปลี่ยนสถานะ
```

#### Frontend Pages:
- `rentout.html` - จัดการอุปกรณ์ของเจ้าของ (CRUD + Status update)

#### Status Flow:
```
1. Available   → พร้อมให้เช่า
2. Delivered   → ส่งมอบอุปกรณ์สำเร็จ
3. Returned    → ส่งคืนอุปกรณ์สำเร็จ
4. Overdue     → ส่งคืนอุปกรณ์ล่าช้า
```

---

### 🔍 **Process 3: Device Browsing (Renter Side)**
**ผู้รับผิดชอบ:** Device Browser Module

#### ไฟล์ที่เกี่ยวข้อง:
- `controllers/device.go` - GetAllDevices (public endpoint)

#### Endpoints:
```
GET    /api/devices/browse             # ดูอุปกรณ์ทั้งหมด (ไม่ต้อง login)
       ?type=Notebook                  # Filter by type
       ?status=Available               # Filter by status
```

#### Frontend Pages:
- `index.html` - หน้าแรก/ค้นหาอุปกรณ์
- `devicehistory.html` - ดูประวัติการเช่า

---

## 🗄️ Database Schema

### หลัก Tables:
```sql
AppUser           # ข้อมูลผู้ใช้ (@kmitl.ac.th)
Owner             # ข้อมูลเจ้าของอุปกรณ์
Renter            # ข้อมูลผู้เช่าอุปกรณ์
Device            # อุปกรณ์
DeviceType        # ประเภทอุปกรณ์ (Notebook, MacBook, Other)
DeviceOwner       # ความสัมพันธ์ Device-Owner
Status            # สถานะอุปกรณ์ (1-4)
DeviceStatusHistory  # ประวัติการเปลี่ยนสถานะ
```

---

## 🔧 Configuration

### Environment Variables:
```env
# Database
DB_HOST=localhost
DB_PORT=5432
DB_USER=alphen
DB_PASSWORD=goldfutionz.124
DB_NAME=notelet

# JWT
JWT_SECRET=your-secret-key-here

# Google OAuth (Optional)
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_REDIRECT_URL=http://localhost:3001/api/auth/google/callback
```

### Ports:
- **Backend API:** `http://localhost:3001`
- **Frontend:** Served by Go backend
- **Database:** PostgreSQL on port `5432` (Docker)

---

## 🚀 Running the Project

### 1. Start Database:
```bash
cd noteletwebservice-development
docker-compose up -d
```

### 2. Start Backend:
```bash
cd noteletwebservice-development
go run main.go
```

### 3. Access Frontend:
```
http://localhost:3001
```

---

## ⚠️ ไฟล์ที่ไม่จำเป็น (ควรลบ)

### Backend:
- ❌ `noteletwebservice-development.exe` - Binary file (ควร gitignore)
- ❌ `NoteLetVpostgres.txt` - Temporary notes
- ❌ `update_device_schema.sql` - One-time migration (ย้ายไป migrations/)
- ❌ `API_DEVICE_DOCUMENTATION.md` - Deprecated (ข้อมูลเก่า)

### Frontend:
- ❌ `src/` folder ทั้งหมด - Node.js server ไม่จำเป็น (Go serve static files แล้ว)
- ❌ `borrowdevice.html` - Duplicate of rentdevice.html
- ❌ `borrowtype.html` - Duplicate of renttype.html  
- ❌ `borrowtypedevice.html` - Duplicate of renttypedevice.html
- ❌ `giveout.html` - ไม่ได้ใช้งาน
- ❌ `test/` folder - Empty test folder

### Root:
- ❌ `test_device_api.ps1` - Temporary test script (ย้ายไป docs/tests/)

---

## 📊 Code Statistics

### Backend:
- **Controllers:** 3 files (~900 lines)
- **Middlewares:** 1 file (~100 lines)
- **Models:** 2 files (~60 lines)
- **Services:** 2 modules (~250 lines)
- **Utils:** 2 files (~50 lines)

### Frontend:
- **HTML Pages:** 12 files (หลายไฟล์ซ้ำซ้อน)
- **JavaScript:** 2 files (~150 lines)
- **CSS:** 1 file (~2000+ lines)

---

## 🎯 ข้อเสนอแนะการปรับปรุง

### 1. ลบไฟล์ซ้ำซ้อน
- รวม rent/borrow pages เป็นหน้าเดียว
- ใช้ query parameter แทน: `?mode=rent` vs `?mode=borrow`

### 2. ปรับปรุงโครงสร้าง Frontend
- ลบ `src/` folder (Node.js server)
- ใช้ Go serve static files เท่านั้น

### 3. Database Migrations
- ย้าย SQL scripts ไป `migrations/` folder
- ใช้ migration tool เช่น `golang-migrate`

### 4. Documentation
- ลบ deprecated docs
- ใช้ PROJECT_STRUCTURE.md นี้เป็นหลัก

### 5. Testing
- สร้าง `tests/` folder แยกต่างหาก
- ใช้ Go testing package

---

## 📝 API Documentation Summary

### Authentication APIs:
- `POST /api/auth/register` - สมัครสมาชิก
- `POST /api/auth/login` - เข้าสู่ระบบ
- `POST /api/auth/refresh` - Refresh token
- `GET /api/auth/profile` - Profile (Protected)

### Device APIs:
- `GET /api/devices/browse` - Browse devices (Public)
- `POST /api/devices` - Create device (Protected)
- `GET /api/devices/my` - My devices (Protected)
- `GET /api/devices/{id}` - Get device (Protected)
- `DELETE /api/devices/{id}` - Delete device (Protected)
- `PATCH /api/devices/{id}/status` - Update status (Protected)
- `GET /api/devices/{id}/history` - Status history (Protected)

---

**สร้างเมื่อ:** 2026-02-18  
**Version:** 1.0  
**Status:** ✅ Production Ready
