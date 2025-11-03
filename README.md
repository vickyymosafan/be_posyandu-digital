# Sistem Backend Posyandu Lansia

Backend REST API untuk Sistem Posyandu Lansia yang dibangun dengan Express.js, TypeScript, dan PostgreSQL.

## 📋 Deskripsi

Sistem ini menyediakan API untuk mengelola data dan pemeriksaan kesehatan lanjut usia di posyandu, dengan fitur:

- ✅ Autentikasi berbasis JWT dengan httpOnly cookies
- ✅ Manajemen petugas dan admin dengan role-based access control
- ✅ Registrasi lansia dengan kode pasien unik otomatis
- ✅ Pencatatan pemeriksaan fisik dengan kalkulasi BMI otomatis
- ✅ Pencatatan pemeriksaan kesehatan dengan klasifikasi hasil lab
- ✅ Validasi data menggunakan Zod
- ✅ Rate limiting untuk keamanan
- ✅ Logging terstruktur dengan Winston

## 🏗️ Arsitektur

Sistem ini menggunakan **Layered Architecture** dengan pemisahan concerns yang jelas:

```
┌─────────────────────────────────────────┐
│         HTTP Layer (Express)            │
│  ┌─────────────────────────────────┐   │
│  │   Middlewares (auth, validate)  │   │
│  └─────────────────────────────────┘   │
└─────────────────────────────────────────┘
                  ↓
┌─────────────────────────────────────────┐
│         Controller Layer                │
│  (Handle HTTP requests/responses)       │
└─────────────────────────────────────────┘
                  ↓
┌─────────────────────────────────────────┐
│         Service Layer                   │
│  (Business logic, orchestration)        │
└─────────────────────────────────────────┘
                  ↓
┌─────────────────────────────────────────┐
│         Repository Layer                │
│  (Data access via Prisma)               │
└─────────────────────────────────────────┘
                  ↓
┌─────────────────────────────────────────┐
│         Database (PostgreSQL)           │
└─────────────────────────────────────────┘
```

### Prinsip Design

Sistem ini menerapkan prinsip-prinsip berikut:

**SOLID Principles:**
- **Single Responsibility**: Setiap class/module memiliki satu tanggung jawab
- **Open/Closed**: Extensible tanpa modifikasi kode existing
- **Liskov Substitution**: Interfaces dapat diganti implementasinya
- **Interface Segregation**: Interfaces kecil dan spesifik
- **Dependency Inversion**: Depend pada abstractions, bukan concrete implementations

**Design Principles:**
- **DRY**: Utilities direuse di berbagai services
- **KISS**: Implementasi straightforward tanpa over-engineering
- **YAGNI**: Hanya implement fitur yang diminta
- **Separation of Concerns**: Layers terpisah untuk routing, business logic, dan data access

## 📁 Struktur Direktori

```
backend/
├── src/
│   ├── controllers/          # HTTP request handlers
│   ├── services/             # Business logic
│   ├── repositories/         # Data access layer
│   ├── middlewares/          # Express middlewares
│   ├── utils/                # Utility functions
│   ├── app.ts                # Express app setup
│   ├── serverless.ts         # Serverless adapter
│   └── index.ts              # Entry point
├── prisma/
│   ├── schema.prisma         # Database schema
│   └── seed.ts               # Database seeder
├── tests/
│   ├── unit/                 # Unit tests
│   └── integration/          # Integration tests
├── .env.example              # Environment variables template
├── package.json
├── tsconfig.json
└── jest.config.ts
```

## 🚀 Getting Started

### Prerequisites

- Node.js >= 18.0.0
- npm >= 9.0.0
- PostgreSQL >= 14

### Installation

1. Clone repository dan masuk ke direktori backend:

```bash
cd backend
```

2. Install dependencies:

```bash
npm install
```

3. Setup environment variables:

```bash
cp .env.example .env
```

Edit file `.env` dan sesuaikan dengan konfigurasi Anda, terutama `DATABASE_URL` dan `JWT_SECRET`.

4. Generate Prisma Client:

```bash
npm run prisma:generate
```

5. Run database migrations:

```bash
npm run prisma:migrate
```

6. Seed database dengan admin default:

```bash
npm run prisma:seed
```

### Development

Jalankan development server dengan hot reload:

```bash
npm run dev
```

Server akan berjalan di `http://localhost:3001` (atau port yang Anda set di `.env`).

### Build

Compile TypeScript ke JavaScript:

```bash
npm run build
```

### Production

Jalankan compiled code:

```bash
npm start
```

## 🧪 Testing

### Run all tests:

```bash
npm test
```

### Run tests in watch mode:

```bash
npm run test:watch
```

### Generate coverage report:

```bash
npm run test:coverage
```

## 🔧 Available Scripts

| Script | Deskripsi |
|--------|-----------|
| `npm run dev` | Jalankan development server dengan hot reload |
| `npm run build` | Compile TypeScript ke JavaScript |
| `npm start` | Jalankan production server |
| `npm run prisma:generate` | Generate Prisma Client |
| `npm run prisma:migrate` | Run database migrations |
| `npm run prisma:seed` | Seed database dengan data awal |
| `npm test` | Run semua tests |
| `npm run test:watch` | Run tests dalam watch mode |
| `npm run test:coverage` | Generate coverage report |
| `npm run lint` | Check code dengan ESLint |
| `npm run lint:fix` | Fix linting issues otomatis |
| `npm run format` | Format code dengan Prettier |
| `npm run format:check` | Check code formatting |
| `npm run type-check` | Check TypeScript types |

## 🔐 Environment Variables

Lihat file `.env.example` untuk daftar lengkap environment variables yang diperlukan.

**Required:**
- `DATABASE_URL`: PostgreSQL connection string
- `JWT_SECRET`: Secret key untuk JWT signing
- `NODE_ENV`: Environment (development | production | test)
- `APP_URL`: Frontend URL untuk CORS

**Optional:**
- `PORT`: Server port (default: 3001)
- `TIMEZONE`: Timezone (default: Asia/Jakarta)
- `ADMIN_NAME`: Nama admin default untuk seeder
- `ADMIN_EMAIL`: Email admin default untuk seeder
- `ADMIN_PASS`: Password admin (jika kosong, akan di-generate random)

## 📚 API Documentation

### Authentication

- `POST /api/auth/login` - Login user
- `POST /api/auth/logout` - Logout user

### Profile

- `GET /api/profile` - Get user profile
- `PATCH /api/profile/nama` - Update nama
- `PATCH /api/profile/password` - Update password

### Petugas (Admin Only)

- `POST /api/petugas` - Create petugas
- `GET /api/petugas` - Get all petugas
- `PATCH /api/petugas/:id/status` - Update status petugas

### Lansia

- `POST /api/lansia` - Register lansia baru
- `GET /api/lansia` - Get lansia (dengan query parameter)
- `GET /api/lansia/:kode` - Get lansia by kode
- `POST /api/find` - Find lansia minimal data

### Pemeriksaan

- `POST /api/lansia/:kode/pemeriksaan/fisik` - Create pemeriksaan fisik
- `POST /api/lansia/:kode/pemeriksaan/kesehatan` - Create pemeriksaan kesehatan
- `POST /api/lansia/:kode/pemeriksaan` - Create pemeriksaan gabungan

## 🛡️ Security

- Password hashing dengan bcrypt (salt rounds 10+)
- JWT authentication dengan httpOnly cookies
- Rate limiting pada login endpoint
- Input validation dengan Zod
- Security headers dengan Helmet
- CORS configuration
- SQL injection prevention via Prisma

## 📦 Deployment

### Vercel (Serverless)

1. Install Vercel CLI:

```bash
npm i -g vercel
```

2. Deploy:

```bash
vercel
```

3. Set environment variables di Vercel dashboard

### Traditional Server

1. Build aplikasi:

```bash
npm run build
```

2. Set environment variables di server

3. Run migrations:

```bash
npm run prisma:migrate
```

4. Start aplikasi:

```bash
npm start
```

## 🤝 Contributing

1. Fork repository
2. Create feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'feat: add some amazing feature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Open Pull Request

## 📝 License

MIT License - lihat file LICENSE untuk detail.

## 👥 Authors

- vickymosafan

## 🙏 Acknowledgments

- Express.js untuk web framework
- Prisma untuk database ORM
- TypeScript untuk type safety
- Jest untuk testing framework
