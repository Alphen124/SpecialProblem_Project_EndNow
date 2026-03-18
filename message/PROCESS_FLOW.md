# 🎯 การแบ่งงานและ Process Notelet Project

## 📋 Module แบ่งตามหน้าที่

### 🔐 Module 1: Authentication & User Management
**ผู้รับผิดชอบ:** Backend Developer + Frontend Developer

#### Backend Tasks:
- ✅ `controllers/auth.go` - Register, Login, Profile
- ✅ `controllers/oauth.go` - Google OAuth
- ✅ `services/jwt/jwt.go` - Token management
- ✅ `middlewares/auth.go` - Authentication middleware
- ✅ `utils/password.go` - Password hashing
- ✅ `utils/email.go` - Email validation

#### Frontend Tasks:
- ✅ `login.html` - Login form
- ✅ `register.html` - Register form  
- ✅ `auth.js` - Auth helper functions

#### API Endpoints:
```
POST   /api/auth/register
POST   /api/auth/login
POST   /api/auth/refresh
GET    /api/auth/profile
GET    /api/auth/google
GET    /api/auth/google/callback
```

#### Database Tables:
- `AppUser` - Main user table
- `Owner` - Owner profiles
- `Renter` - Renter profiles

---

### 🎒 Module 2: Device Management (Owner)
**ผู้รับผิดชอบ:** Backend Developer + Frontend Developer

#### Backend Tasks:
- ✅ `controllers/device.go` (Owner functions)
  - CreateDevice
  - GetMyDevices
  - GetDevice
  - DeleteDevice
  - UpdateDeviceStatus
  - GetDeviceStatusHistory

#### Frontend Tasks:
- ✅ `rentout.html` - Device management dashboard
  - Add device form
  - Device cards with CRUD
  - Status dropdown
  - Status update buttons
  - History modal

#### API Endpoints:
```
POST   /api/devices              # Create device
GET    /api/devices/my           # Get my devices
GET    /api/devices/{id}         # Get device details
DELETE /api/devices/{id}         # Delete device
PATCH  /api/devices/{id}/status  # Update status
GET    /api/devices/{id}/history # Status history
```

#### Database Tables:
- `Device` - Device information
- `DeviceType` - Device categories
- `DeviceOwner` - Device-Owner relationship
- `Status` - Status definitions (1-4)
- `DeviceStatusHistory` - Status change log

#### Status Workflow:
```
1. Available  → Device ready for rent
2. Delivered  → Device delivered to renter
3. Returned   → Device returned successfully
4. Overdue    → Device return overdue
```

---

### 🔍 Module 3: Device Browsing & Search (Renter)
**ผู้รับผิดชอบ:** Backend Developer + Frontend Developer

#### Backend Tasks:
- ✅ `controllers/device.go` (Public functions)
  - GetAllDevices (with filters)

#### Frontend Tasks:
- ✅ `index.html` - Homepage with search
- ✅ `devicehistory.html` - Rental history

#### API Endpoints:
```
GET    /api/devices/browse       # Browse all devices
       ?type=Notebook            # Filter by type
       ?status=Available         # Filter by status
```

#### Search Features:
- Search by device name
- Filter by device type
- Filter by availability status
- Sort by price/rating

---

### 🗄️ Module 4: Database & Infrastructure
**ผู้รับผิดชอบ:** DevOps / Database Admin

#### Tasks:
- ✅ Docker Compose setup
- ✅ PostgreSQL configuration
- ✅ Database migrations
- ✅ Backup strategies
- ✅ Performance optimization

#### Files:
- `docker-compose.yml`
- `config/database/database.go`
- `migrations/`

#### Database Schema:
```
AppUser (UserId, Email, PasswordHash, IsActive)
Owner (OwnerNo, UserId, FName, LName, Tel)
Renter (RenterNo, UserId, FName, LName, Tel)
Device (DeviceNo, DeviceName, RentPrice, Status, ...)
DeviceType (DeviceTypeNo, DeviceTypeName)
DeviceOwner (DeviceNo, OwnerNo)
Status (StatusNo, Name)
DeviceStatusHistory (HistoryNo, DeviceNo, StatusNo, ChangedBy, ChangedAt)
```

---

## 🔄 Process Flows

### Process 1: User Registration & Login
```
1. User fills registration form (register.html)
2. Frontend sends POST /api/auth/register
3. Backend validates KMITL email
4. Backend creates AppUser, Owner, Renter records
5. Backend generates JWT tokens
6. Frontend stores tokens in localStorage
7. Redirect to logged-in homepage
```

**Files Involved:**
- `register.html` → `controllers/auth.go` → `models/user.go`

---

### Process 2: Add Device (Owner)
```
1. Owner clicks "Add Device" button (rentout.html)
2. Modal form appears
3. Owner fills device info (name, type, price, description, image)
4. Frontend sends POST /api/devices with JWT
5. Backend validates owner auth
6. Backend gets DeviceTypeNo from DeviceType table
7. Backend gets/creates OwnerNo from Owner table
8. Backend INSERT into Device table
9. Backend INSERT into DeviceOwner table
10. Return success with deviceNo
11. Frontend reloads device list
```

**Files Involved:**
- `rentout.html` → `controllers/device.go` → `models/device.go`

---

### Process 3: Update Device Status
```
1. Owner selects new status from dropdown
2. Owner clicks "Update" button
3. Frontend sends PATCH /api/devices/{id}/status
4. Backend verifies owner owns the device
5. Backend updates Device.Status
6. Backend logs to DeviceStatusHistory
7. Return success
8. Frontend updates UI with new status
```

**Files Involved:**
- `rentout.html` → `controllers/device.go` → `DeviceStatusHistory`

---

### Process 4: View Status History
```
1. Owner clicks "History" button on device card
2. Frontend sends GET /api/devices/{id}/history
3. Backend queries DeviceStatusHistory with JOINs
4. Return history with status names, dates, changers
5. Frontend displays timeline in modal
```

**Files Involved:**
- `rentout.html` → `controllers/device.go` → `DeviceStatusHistory`

---

### Process 5: Browse Devices (Renter)
```
1. Renter navigates to homepage (index.html)
2. Frontend sends GET /api/devices/browse
3. Backend returns all available devices
4. Frontend displays device cards
5. Renter can filter by type/status
6. Renter clicks device to view details
```

**Files Involved:**
- `index.html` → `controllers/device.go` → `models/device.go`

---

## 👥 Team Assignment Suggestions

### Backend Developer Responsibilities:
- All Go controllers, models, services
- Database schema design
- API endpoint implementation
- Authentication & authorization
- Error handling & logging
- Performance optimization

### Frontend Developer Responsibilities:
- All HTML pages
- JavaScript functionality
- CSS styling
- UI/UX design
- API integration
- Form validation
- Modal/popup management

### Full-Stack Tasks (Collaboration):
- API contract definition
- Request/Response structures
- Error message formatting
- Testing scenarios
- Documentation

### DevOps Tasks:
- Docker configuration
- Database migrations
- Environment setup
- Deployment
- Monitoring

---

## 📊 Development Phases

### Phase 1: Foundation ✅ DONE
- [x] Database setup
- [x] Authentication system
- [x] Basic CRUD for devices
- [x] JWT middleware

### Phase 2: Core Features ✅ DONE
- [x] Device status management
- [x] Status history tracking
- [x] Owner device management UI
- [x] Device browsing

### Phase 3: Enhancement (TODO)
- [ ] Rental booking system
- [ ] Payment integration
- [ ] Reviews & ratings
- [ ] Notifications
- [ ] Image upload
- [ ] Search optimization

### Phase 4: Polish (TODO)
- [ ] Performance optimization
- [ ] Error handling improvements
- [ ] UI/UX refinement
- [ ] Testing coverage
- [ ] Documentation completion

---

## 🧪 Testing Responsibilities

### Backend Testing:
```bash
# Unit tests for each controller
go test ./controllers/...

# Integration tests
go test ./... -v

# API tests
.\simple_test.ps1
```

### Frontend Testing:
- Manual testing of all pages
- Form validation testing
- API error handling testing
- Cross-browser compatibility

### Database Testing:
- Migration scripts
- Data integrity
- Performance queries

---

## 📝 Documentation Requirements

### Each Developer Should Document:
- [ ] Function comments
- [ ] API endpoint documentation
- [ ] Complex logic explanation
- [ ] Error handling scenarios
- [ ] Testing scenarios

### Team Documentation:
- [ ] API specification
- [ ] Database schema diagram
- [ ] User flow diagrams
- [ ] Deployment guide
- [ ] Troubleshooting guide

---

## 🔄 Git Workflow

### Branch Strategy:
```
main                 # Production
├── develop         # Development
    ├── feature/auth           # Authentication features
    ├── feature/device-mgmt    # Device management
    ├── feature/status-system  # Status tracking
    └── hotfix/bug-fixes       # Quick fixes
```

### Commit Message Format:
```
[Module] Brief description

Examples:
[Auth] Add Google OAuth integration
[Device] Implement status history tracking
[Frontend] Update rentout page UI
[Database] Add device status migration
[Docs] Update API documentation
```

---

**Created:** 2026-02-18  
**Status:** ✅ Current  
**Version:** 1.0
