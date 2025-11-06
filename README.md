# Sistem Backend Posyandu Lansia

Backend REST API untuk Sistem Posyandu Lansia yang dibangun dengan Express.js dan TypeScript. Sistem ini mengelola data dan pemeriksaan kesehatan lanjut usia di posyandu dengan fitur autentikasi, manajemen petugas, registrasi lansia, dan pencatatan pemeriksaan kesehatan dengan kalkulasi otomatis.

## 📋 Fitur Utama

- **Autentikasi & Otorisasi**: JWT-based authentication dengan role-based access control (Admin & Petugas)
- **Manajemen Petugas**: Admin dapat mengelola akun petugas
- **Registrasi Lansia**: Pendaftaran lansia dengan kode pasien unik otomatis
- **Pemeriksaan Fisik**: Pencatatan tinggi, berat, tekanan darah dengan kalkulasi BMI otomatis
- **Pemeriksaan Kesehatan**: Pencatatan hasil lab (gula darah, kolesterol, asam urat) dengan klasifikasi otomatis
- **Validasi Data**: Validasi komprehensif menggunakan Zod schemas
- **Rate Limiting**: Proteksi dari brute force attacks
- **Logging**: Structured logging dengan Winston
- **Security**: Helmet, CORS, bcrypt password hashing

## 🛠️ Teknologi Stack

- **Runtime**: Node.js 18+
- **Framework**: Express.js
- **Language**: TypeScript (strict mode)
- **Database**: PostgreSQL
- **ORM**: Prisma
- **Authentication**: JWT dengan bcrypt
- **Validation**: Zod
- **Testing**: Jest + Supertest
- **Logging**: Winston
- **Security**: Helmet, CORS, rate-limiter-flexible
- **Code Quality**: ESLint, Prettier, Husky

## 🏗️ Prinsip Design yang Diterapkan

### SOLID Principles

- **Single Responsibility**: Setiap class/module memiliki satu tanggung jawab
  - Controllers: Handle HTTP requests/responses
  - Services: Business logic dan orchestration
  - Repositories: Data access layer
  - Utilities: Reusable functions

- **Open/Closed**: Extensible tanpa modifikasi kode existing
  - Validator utilities dapat ditambah tanpa mengubah yang ada
  - Middleware factory functions untuk reusability

- **Liskov Substitution**: Interfaces dapat diganti implementasinya
  - Repository pattern memungkinkan swap database implementation

- **Interface Segregation**: Interfaces kecil dan spesifik
  - DTO per endpoint untuk type safety

- **Dependency Inversion**: High-level modules tidak depend pada low-level
  - Services depend pada repository abstractions

### Design Principles

- **DRY (Don't Repeat Yourself)**: Utilities untuk kalkulasi medis direuse di berbagai services
- **KISS (Keep It Simple)**: Implementasi straightforward tanpa over-engineering
- **YAGNI (You Aren't Gonna Need It)**: Hanya implement fitur yang diminta
- **Separation of Concerns**: Layers terpisah untuk routing, business logic, dan data access

## 📦 Prerequisites

Pastikan sistem Anda sudah terinstall:

- Node.js >= 18.0.0
- npm >= 9.0.0
- PostgreSQL >= 14
- Git

## 🚀 Setup Lokal

### 1. Clone Repository

```bash
git clone <repository-url>
cd backend
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Setup Environment Variables

Copy file `.env.example` menjadi `.env`:

```bash
cp .env.example .env
```

Edit file `.env` dan sesuaikan dengan konfigurasi lokal Anda:

```env
DATABASE_URL="postgresql://postgres:password@localhost:5432/posyandu_lansia?schema=public"
JWT_SECRET="your-super-secret-jwt-key-change-this"
NODE_ENV="development"
APP_URL="http://localhost:3000"
PORT="3001"
TIMEZONE="Asia/Jakarta"
ADMIN_NAME="Admin Posyandu"
ADMIN_EMAIL="admin@posyandu.local"
ADMIN_PASS=""
```

### 4. Setup Database

Jalankan migrasi database:

```bash
npm run prisma:migrate
```

Generate Prisma Client:

```bash
npm run prisma:generate
```

### 5. Seed Database

Jalankan seeder untuk membuat admin default:

```bash
npm run prisma:seed
```

**Catatan**: Jika `ADMIN_PASS` kosong, password akan di-generate otomatis dan ditampilkan di console.

### 6. Jalankan Development Server

```bash
npm run dev
```

Server akan berjalan di `http://localhost:3001`

## 🔐 Environment Variables

| Variable | Required | Default | Deskripsi |
|----------|----------|---------|-----------|
| `DATABASE_URL` | ✅ | - | PostgreSQL connection string |
| `JWT_SECRET` | ✅ | - | Secret key untuk JWT signing (gunakan string random yang kuat) |
| `NODE_ENV` | ✅ | development | Environment: development, production, test |
| `APP_URL` | ✅ | http://localhost:3000 | Frontend URL untuk CORS |
| `PORT` | ❌ | 3001 | Port untuk local development |
| `TIMEZONE` | ❌ | Asia/Jakarta | Timezone aplikasi |
| `ADMIN_NAME` | ❌ | Admin Posyandu | Nama admin default untuk seeder |
| `ADMIN_EMAIL` | ❌ | admin@posyandu.local | Email admin default |
| `ADMIN_PASS` | ❌ | (auto-generated) | Password admin (kosongkan untuk generate otomatis) |
| `LOG_LEVEL` | ❌ | info | Level logging: error, warn, info, debug |
| `RATE_LIMIT_WINDOW_MS` | ❌ | 900000 | Window rate limiting (ms) |
| `RATE_LIMIT_MAX_REQUESTS` | ❌ | 5 | Max requests per window |

## 📜 NPM Scripts

### Development

```bash
npm run dev              # Jalankan development server dengan hot reload
npm run build            # Compile TypeScript ke JavaScript
npm run start            # Jalankan production server (setelah build)
```

### Database

```bash
npm run prisma:generate  # Generate Prisma Client
npm run prisma:migrate   # Jalankan database migrations
npm run prisma:seed      # Seed database dengan data awal
```

### Testing

```bash
npm run test             # Jalankan semua tests
npm run test:watch       # Jalankan tests dalam watch mode
npm run test:coverage    # Jalankan tests dengan coverage report
```

### Code Quality

```bash
npm run lint             # Check linting errors
npm run lint:fix         # Fix linting errors otomatis
npm run format           # Format code dengan Prettier
npm run format:check     # Check formatting tanpa modify
npm run type-check       # TypeScript type checking
```

## 🔌 API Endpoints

### Authentication

#### Login
```bash
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@posyandu.local",
    "kataSandi": "your-password"
  }'
```

Response:
```json
{
  "id": 1,
  "nama": "Admin Posyandu",
  "role": "ADMIN"
}
```

#### Logout
```bash
curl -X POST http://localhost:3001/api/auth/logout \
  -H "Cookie: token=your-jwt-token"
```

### Profile Management

#### Get Profile
```bash
curl -X GET http://localhost:3001/api/profile \
  -H "Cookie: token=your-jwt-token"
```

#### Update Nama
```bash
curl -X PATCH http://localhost:3001/api/profile/nama \
  -H "Content-Type: application/json" \
  -H "Cookie: token=your-jwt-token" \
  -d '{
    "nama": "Nama Baru"
  }'
```

#### Update Password
```bash
curl -X PATCH http://localhost:3001/api/profile/password \
  -H "Content-Type: application/json" \
  -H "Cookie: token=your-jwt-token" \
  -d '{
    "kataSandiLama": "old-password",
    "kataSandiBaru": "new-password"
  }'
```

### Petugas Management (Admin Only)

#### Create Petugas
```bash
curl -X POST http://localhost:3001/api/petugas \
  -H "Content-Type: application/json" \
  -H "Cookie: token=admin-jwt-token" \
  -d '{
    "nama": "Petugas Baru",
    "email": "petugas@posyandu.local",
    "kataSandi": "password123"
  }'
```

#### Get All Petugas
```bash
curl -X GET http://localhost:3001/api/petugas \
  -H "Cookie: token=admin-jwt-token"
```

#### Update Status Petugas
```bash
curl -X PATCH http://localhost:3001/api/petugas/2/status \
  -H "Content-Type: application/json" \
  -H "Cookie: token=admin-jwt-token" \
  -d '{
    "aktif": false
  }'
```

### Lansia Management

#### Register Lansia
```bash
curl -X POST http://localhost:3001/api/lansia \
  -H "Content-Type: application/json" \
  -H "Cookie: token=your-jwt-token" \
  -d '{
    "nik": "1234567890123456",
    "kk": "1234567890123456",
    "nama": "Budi Santoso",
    "tanggalLahir": "1950-01-15",
    "gender": "L",
    "alamat": "Jl. Merdeka No. 123, Jakarta"
  }'
```

Response:
```json
{
  "id": 1,
  "kode": "pasien20250103Ab",
  "nik": "1234567890123456",
  "kk": "1234567890123456",
  "nama": "Budi Santoso",
  "gender": "L",
  "tanggalLahir": "1950-01-15T00:00:00.000Z",
  "alamat": "Jl. Merdeka No. 123, Jakarta",
  "createdAt": "2025-01-03T10:00:00.000Z"
}
```

#### Get Lansia by Kode
```bash
curl -X GET http://localhost:3001/api/lansia/pasien20250103Ab \
  -H "Cookie: token=your-jwt-token"
```

#### Find Lansia (Minimal Data)
```bash
curl -X POST http://localhost:3001/api/find \
  -H "Content-Type: application/json" \
  -H "Cookie: token=your-jwt-token" \
  -d '{
    "kode": "pasien20250103Ab"
  }'
```

### Pemeriksaan

#### Pemeriksaan Fisik
```bash
curl -X POST http://localhost:3001/api/lansia/pasien20250103Ab/pemeriksaan/fisik \
  -H "Content-Type: application/json" \
  -H "Cookie: token=your-jwt-token" \
  -d '{
    "tinggi": 165,
    "berat": 70,
    "sistolik": 120,
    "diastolik": 80
  }'
```

Response (dengan kalkulasi BMI dan klasifikasi tekanan darah):
```json
{
  "id": 1,
  "lansiaId": 1,
  "tanggal": "2025-01-03T10:00:00.000Z",
  "tinggi": 165,
  "berat": 70,
  "bmi": 25.71,
  "kategoriBmi": "Berat Badan Lebih",
  "sistolik": 120,
  "diastolik": 80,
  "tekananDarah": "Normal",
  "createdAt": "2025-01-03T10:00:00.000Z"
}
```

#### Pemeriksaan Kesehatan
```bash
curl -X POST http://localhost:3001/api/lansia/pasien20250103Ab/pemeriksaan/kesehatan \
  -H "Content-Type: application/json" \
  -H "Cookie: token=your-jwt-token" \
  -d '{
    "gulaPuasa": 110,
    "kolesterol": 210,
    "asamUrat": 7.5
  }'
```

#### Pemeriksaan Gabungan
```bash
curl -X POST http://localhost:3001/api/lansia/pasien20250103Ab/pemeriksaan \
  -H "Content-Type: application/json" \
  -H "Cookie: token=your-jwt-token" \
  -d '{
    "tinggi": 165,
    "berat": 70,
    "sistolik": 120,
    "diastolik": 80,
    "gulaPuasa": 110,
    "kolesterol": 210,
    "asamUrat": 7.5
  }'
```

## 📁 Struktur Direktori

```
backend/
├── src/
│   ├── controllers/          # HTTP request handlers
│   │   ├── authController.ts
│   │   ├── profilController.ts
│   │   ├── petugasController.ts
│   │   ├── lansiaController.ts
│   │   └── pemeriksaanController.ts
│   ├── services/             # Business logic
│   │   ├── authService.ts
│   │   ├── userService.ts
│   │   ├── lansiaService.ts
│   │   └── pemeriksaanService.ts
│   ├── repositories/         # Data access layer
│   │   ├── userRepository.ts
│   │   ├── lansiaRepository.ts
│   │   └── pemeriksaanRepository.ts
│   ├── middlewares/          # Express middlewares
│   │   ├── authMiddleware.ts
│   │   ├── roleGuard.ts
│   │   ├── validateMiddleware.ts
│   │   ├── errorHandler.ts
│   │   └── rateLimiter.ts
│   ├── utils/                # Utility functions
│   │   ├── patientId.ts      # Kode pasien generator
│   │   ├── validators.ts     # Zod schemas
│   │   ├── bmi.ts            # BMI calculator
│   │   ├── tekananDarah.ts   # Blood pressure classifier
│   │   ├── gulaDarah.ts      # Blood sugar classifier
│   │   ├── kolesterol.ts     # Cholesterol classifier
│   │   ├── asamUrat.ts       # Uric acid classifier
│   │   ├── logger.ts         # Winston logger
│   │   └── errors.ts         # Custom error classes
│   ├── types/                # TypeScript types
│   ├── app.ts                # Express app setup
│   ├── serverless.ts         # Serverless adapter
│   └── index.ts              # Entry point
├── prisma/
│   ├── schema.prisma         # Database schema
│   ├── migrations/           # Database migrations
│   └── seed.ts               # Database seeder
├── tests/
│   ├── unit/                 # Unit tests
│   └── integration/          # Integration tests
├── .env.example              # Environment variables template
├── .eslintrc.json            # ESLint configuration
├── .prettierrc               # Prettier configuration
├── .lintstagedrc.json        # Lint-staged configuration
├── jest.config.ts            # Jest configuration
├── tsconfig.json             # TypeScript configuration
├── vercel.json               # Vercel deployment config
└── package.json              # Dependencies dan scripts
```

## 🧪 Testing

### Menjalankan Tests

```bash
# Jalankan semua tests
npm run test

# Watch mode untuk development
npm run test:watch

# Generate coverage report
npm run test:coverage
```

### Unit Tests

Unit tests tersedia untuk utility functions:
- `bmi.test.ts`: Test kalkulasi BMI dan klasifikasi
- `tekananDarah.test.ts`: Test klasifikasi tekanan darah
- `gulaDarah.test.ts`: Test klasifikasi gula darah
- `kolesterol.test.ts`: Test klasifikasi kolesterol
- `asamUrat.test.ts`: Test klasifikasi asam urat

Target coverage: 80%+ untuk utility functions

### Integration Tests

Integration tests mencakup:
- Authentication flow (login, logout, protected routes)
- Lansia management (create, get, kode generation)
- Pemeriksaan flow (fisik, kesehatan, kalkulasi otomatis)

## 🚢 Deployment

### Quick Start

Untuk deployment cepat ke Vercel (5 menit):

📖 **[VERCEL_QUICK_START.md](./VERCEL_QUICK_START.md)** - Panduan deployment cepat

### Dokumentasi Lengkap

Untuk deployment production dengan best practices:

📖 **[DEPLOYMENT.md](./DEPLOYMENT.md)** - Dokumentasi deployment lengkap

### Production Checklist

Sebelum deploy ke production, pastikan semua checklist terpenuhi:

📋 **[PRODUCTION_CHECKLIST.md](./PRODUCTION_CHECKLIST.md)** - Checklist deployment production

### Environment Variables untuk Production

Pastikan set environment variables berikut di platform deployment:

```env
DATABASE_URL="postgresql://user:pass@host:5432/db"
JWT_SECRET="strong-random-secret-key"
NODE_ENV="production"
APP_URL="https://your-frontend-url.com"
TIMEZONE="Asia/Jakarta"
```

**⚠️ PENTING:** 
- Generate JWT secret baru dengan: `node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"`
- Jangan gunakan default value dari `.env.example`
- Gunakan connection pooler untuk database (Supabase/Neon)

## 🔒 Security

- **Password Hashing**: bcrypt dengan salt rounds 10+
- **JWT Authentication**: httpOnly cookies dengan sameSite strict
- **Rate Limiting**: Max 5 login attempts per 15 minutes
- **Input Validation**: Zod schemas untuk semua inputs
- **SQL Injection Prevention**: Prisma prepared statements
- **Security Headers**: Helmet middleware
- **CORS**: Configured untuk frontend URL

## 📝 Logging

Aplikasi menggunakan Winston untuk structured logging:

- **error**: Errors yang perlu immediate attention
- **warn**: Potential issues (rate limit hit, validation failures)
- **info**: Important events (login, create lansia, pemeriksaan)
- **debug**: Detailed information untuk debugging

Logs dapat dilihat di console (development) atau file (production).

## 🤝 Contributing

1. Fork repository
2. Create feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'feat: add amazing feature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Open Pull Request

### Commit Convention

Gunakan conventional commits:
- `feat:` untuk fitur baru
- `fix:` untuk bug fixes
- `docs:` untuk dokumentasi
- `style:` untuk formatting
- `refactor:` untuk refactoring
- `test:` untuk tests
- `chore:` untuk maintenance

## 📄 License

MIT License - lihat file LICENSE untuk detail

## 👥 Authors

Tim Pengembang Sistem Posyandu Lansia

## 📞 Support

Untuk pertanyaan atau issues, silakan buka issue di repository atau hubungi tim development.

---

**Catatan**: Pastikan untuk tidak commit file `.env` ke repository. Gunakan `.env.example` sebagai template.
