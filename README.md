# AttendX — Smart QR Attendance System

A production-grade, full-stack QR-based attendance management system built with **Next.js**, **Node.js**, and **MongoDB Atlas**.

---

## 🗂 Project Structure

```
qr-attendance/
├── backend/                 # Node.js + Express API
│   ├── models/              # Mongoose models
│   │   ├── User.js          # Students & teachers
│   │   ├── Subject.js       # Subjects/courses
│   │   ├── Attendance.js    # Attendance records
│   │   └── QRSession.js     # QR sessions
│   ├── routes/              # API routes
│   │   ├── auth.js          # Login, /me
│   │   ├── student.js       # Student dashboard & history
│   │   ├── teacher.js       # Teacher dashboard, subject detail, CSV
│   │   ├── qr.js            # QR generation & validation
│   │   └── attendance.js    # Mark attendance
│   ├── middleware/
│   │   └── auth.js          # JWT protect + requireRole
│   ├── scripts/
│   │   └── seed.js          # Seeds 20 students, 3 teachers, 6 subjects
│   ├── server.js            # Express app entry
│   └── .env.example
│
└── frontend/                # Next.js 14 App Router
    └── src/
        ├── app/
        │   ├── page.js           # Root redirect
        │   ├── layout.js         # Root layout + AuthProvider
        │   ├── login/page.js     # Login page
        │   ├── scan/page.js      # QR scan + geolocation
        │   ├── student/
        │   │   ├── dashboard/    # Student dashboard with charts
        │   │   └── attendance/   # Attendance history
        │   └── teacher/
        │       ├── dashboard/    # Teacher overview
        │       └── subject/[id]/ # Subject detail + QR generator
        ├── components/
        │   ├── Sidebar.js        # Navigation sidebar
        │   └── AttendanceRing.js # SVG donut ring chart
        ├── context/
        │   └── AuthContext.js    # Auth state + JWT
        ├── lib/
        │   └── api.js            # Axios API client
        └── styles/
            └── globals.css       # Design system + animations
```

---

## 🚀 Quick Start

### 1. MongoDB Atlas Setup

1. Go to [cloud.mongodb.com](https://cloud.mongodb.com)
2. Create a free cluster
3. Create a database user with read/write access
4. Add your IP to the Network Access whitelist (or use `0.0.0.0/0` for development)
5. Copy your connection string: `mongodb+srv://<user>:<pass>@cluster.xxxxx.mongodb.net/`

### 2. Backend Setup

```bash
cd backend
npm install

# Create .env from example
cp .env.example .env

# Edit .env with your MongoDB URI and JWT secret
nano .env
```

Your `.env` should look like:
```
PORT=5000
MONGODB_URI=mongodb+srv://youruser:yourpass@cluster0.xxxxx.mongodb.net/qr_attendance?retryWrites=true&w=majority
JWT_SECRET=some_very_long_random_secret_string_here
JWT_EXPIRES_IN=7d
CLIENT_URL=http://localhost:3000
NODE_ENV=development
```

```bash
# Seed the database (creates 20 students, 3 teachers, 6 subjects)
npm run seed

# Start the backend
npm run dev
```

Backend runs on: **http://localhost:5000**

### 3. Frontend Setup

```bash
cd frontend
npm install

# Create .env.local
cp .env.local.example .env.local
# NEXT_PUBLIC_API_URL=http://localhost:5000/api

npm run dev
```

Frontend runs on: **http://localhost:3000**

---

## 🔐 Default Credentials (after seeding)

### Teachers
| Email | Password |
|-------|----------|
| priya.sharma@college.edu | teacher123 |
| rajesh.kumar@college.edu | teacher123 |
| anita.bose@college.edu | teacher123 |

### Students (all use password: `student123`)
| Email | Roll No |
|-------|---------|
| arjun.mehta@student.edu | CS21001 |
| priya.patel@student.edu | CS21002 |
| rohan.das@student.edu | CS21003 |
| ... (17 more) | ... |

---

## 📋 Subject Assignments

| Subject | Code | Teacher |
|---------|------|---------|
| Data Structures & Algorithms | CS301 | Dr. Priya Sharma |
| Database Management Systems | CS302 | Dr. Priya Sharma |
| Operating Systems | CS303 | Prof. Rajesh Kumar |
| Computer Networks | CS304 | Prof. Rajesh Kumar |
| Software Engineering | CS305 | Dr. Anita Bose |
| Machine Learning | CS401 | Dr. Anita Bose |

---

## 🔒 Security Features

| Feature | Implementation |
|---------|---------------|
| QR Expiry | 5–30 minute TTL (configurable per session) |
| Geofencing | Haversine formula, 100m classroom radius |
| Device Fingerprinting | Canvas fingerprint + screen resolution + CPU cores |
| Duplicate Prevention | Compound index: `(session, student)` unique |
| Device Duplicate | Compound index: `(session, deviceFingerprint)` |
| JWT Auth | HS256, 7-day expiry, role-based |
| Rate Limiting | 5 QR generations/min/IP, 200 global req/15min |
| Payload Signing | SHA-256 HMAC on QR payload |
| Password Hashing | bcrypt with 12 rounds |

---

## 🌐 API Endpoints

### Auth
```
POST /api/auth/login           # Login
GET  /api/auth/me              # Get current user
POST /api/auth/logout          # Logout
```

### Student
```
GET  /api/student/dashboard           # Dashboard data
GET  /api/student/attendance/history  # Attendance records
```

### Teacher
```
GET  /api/teacher/dashboard                      # Teacher overview
GET  /api/teacher/subject/:id                    # Subject detail
GET  /api/teacher/subject/:id/download-csv       # Download CSV
```

### QR
```
POST   /api/qr/generate           # Generate QR (teacher)
GET    /api/qr/session/:sessionId # Validate session
GET    /api/qr/active/:subjectId  # Check active session
DELETE /api/qr/invalidate/:id     # End session
```

### Attendance
```
POST /api/attendance/mark                        # Mark attendance (student)
GET  /api/attendance/session/:sessionId/students # Session attendees
```

---

## 🎨 Design System

- **Fonts**: Syne (display/headings), DM Sans (body), JetBrains Mono (code/data)
- **Theme**: Dark, deep violet/teal gradient mesh
- **Components**: Glass morphism cards, animated progress rings, recharts graphs
- **Motion**: Staggered fade-up animations, pulsing orbs, smooth transitions

---

## 🛠 Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 14 (App Router) |
| UI | Tailwind CSS + Custom CSS Design System |
| Charts | Recharts |
| Backend | Node.js + Express |
| Database | MongoDB Atlas + Mongoose |
| Auth | JWT (jsonwebtoken) + bcryptjs |
| QR | qrcode npm package |
| CSV | json2csv |
| Security | helmet, express-rate-limit, CORS |

---

## 🚢 Deployment

### Backend → Railway / Render / Fly.io
```bash
# Set environment variables in your platform dashboard
# PORT, MONGODB_URI, JWT_SECRET, CLIENT_URL, NODE_ENV=production
npm start
```

### Frontend → Vercel
```bash
# Set NEXT_PUBLIC_API_URL to your deployed backend URL
vercel deploy
```

---

## 📱 How the QR Flow Works

```
Teacher generates QR
        ↓
QR session created (15 min TTL)
        ↓
QR image displayed on screen
        ↓
Student scans QR with phone camera
        ↓
Phone opens /scan?session=<id>
        ↓
App requests GPS location
        ↓
Backend validates:
  ✓ Session not expired
  ✓ Student enrolled in subject
  ✓ Within 100m of classroom (Haversine)
  ✓ No duplicate (session + student)
  ✓ Device fingerprint not reused
        ↓
Attendance marked ✓
```
