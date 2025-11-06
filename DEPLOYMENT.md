# 🚀 Panduan Deployment ke Vercel

Dokumentasi lengkap untuk deployment Backend Sistem Posyandu Lansia ke Vercel.

## 📋 Prerequisites

Sebelum melakukan deployment, pastikan Anda memiliki:

- [x] Akun Vercel (gratis di [vercel.com](https://vercel.com))
- [x] Vercel CLI terinstall (`npm install -g vercel`)
- [x] Database PostgreSQL production (Supabase/Neon/Railway)
- [x] Git repository (GitHub/GitLab/Bitbucket)
- [x] Node.js >= 18.0.0

## 🔐 Persiapan Environment Variables

### 1. Generate JWT Secret

Jalankan command berikut untuk generate JWT secret yang kuat:

```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

**Output contoh:**
```
a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6a7b8c9d0e1f2g3h4i5j6k7l8m9n0o1p2q3r4s5t6u7v8w9x0y1z2
```

**⚠️ PENTING:** Simpan secret ini dengan aman. Jangan commit ke Git!

### 2. Siapkan Database Production

#### Opsi A: Supabase (Recommended)

1. Buat project baru di [supabase.com](https://supabase.com)
2. Copy connection string dari Settings > Database
3. Gunakan **Transaction Pooler** untuk serverless:
   ```
   postgresql://postgres.[project-ref]:[password]@aws-0-[region].pooler.supabase.com:5432/postgres
   ```

#### Opsi B: Neon

1. Buat project di [neon.tech](https://neon.tech)
2. Copy connection string (sudah optimized untuk serverless)

#### Opsi C: Railway

1. Buat project di [railway.app](https://railway.app)
2. Add PostgreSQL service
3. Copy connection string

### 3. Daftar Environment Variables

Siapkan nilai untuk environment variables berikut:

| Variable | Required | Contoh | Keterangan |
|----------|----------|--------|------------|
| `DATABASE_URL` | ✅ | `postgresql://user:pass@host:5432/db` | Connection string database production |
| `JWT_SECRET` | ✅ | `a1b2c3d4e5f6...` | Secret dari step 1 |
| `NODE_ENV` | ✅ | `production` | Environment mode |
| `APP_URL` | ✅ | `https://posyandu.vercel.app` | URL frontend production |
| `TIMEZONE` | ❌ | `Asia/Jakarta` | Timezone aplikasi |
| `LOG_LEVEL` | ❌ | `info` | Level logging |
| `ADMIN_NAME` | ❌ | `Admin Posyandu` | Nama admin untuk seeder |
| `ADMIN_EMAIL` | ❌ | `admin@posyandu.com` | Email admin untuk seeder |
| `ADMIN_PASS` | ❌ | `SecurePass123!` | Password admin (kosongkan untuk auto-generate) |

## 🛠️ Setup Database Production

### 1. Jalankan Migrations

**Via Prisma CLI (Local):**

```bash
# Set DATABASE_URL ke production
export DATABASE_URL="postgresql://..."

# Jalankan migrations
npx prisma migrate deploy

# Generate Prisma Client
npx prisma generate
```

**Via Vercel CLI (Setelah Deploy):**

```bash
# Deploy dulu, lalu jalankan command
vercel env pull .env.production
npx prisma migrate deploy
```

### 2. Seed Admin User

**Opsi A: Via Prisma Seed**

```bash
# Set environment variables
export DATABASE_URL="postgresql://..."
export ADMIN_NAME="Admin Posyandu"
export ADMIN_EMAIL="admin@posyandu.com"
export ADMIN_PASS="SecurePassword123!"

# Jalankan seeder
npm run prisma:seed
```

**Opsi B: Via SQL Manual**

```sql
-- Generate password hash dulu via bcrypt
-- Contoh: password "admin123" -> hash "$2b$10$..."

INSERT INTO users (nama, email, kata_sandi, role, aktif, created_at)
VALUES (
  'Admin Posyandu',
  'admin@posyandu.com',
  '$2b$10$YourHashedPasswordHere',
  'ADMIN',
  true,
  NOW()
);
```

**Opsi C: Via Prisma Studio**

```bash
npx prisma studio
```

Buka browser, tambahkan user manual dengan role ADMIN.

## 🚀 Deployment ke Vercel

### Metode 1: Via Vercel Dashboard (Recommended)

#### Step 1: Import Project

1. Login ke [vercel.com](https://vercel.com)
2. Click **"Add New Project"**
3. Import Git repository Anda
4. Select **backend** folder sebagai root directory

#### Step 2: Configure Project

**Build & Development Settings:**
- Framework Preset: `Other`
- Root Directory: `backend`
- Build Command: `npm run prisma:generate && npm run build`
- Output Directory: `dist`
- Install Command: `npm install`

#### Step 3: Environment Variables

Tambahkan semua environment variables:

```
DATABASE_URL=postgresql://postgres.[ref]:[pass]@aws-0-ap-southeast-1.pooler.supabase.com:5432/postgres
JWT_SECRET=a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6a7b8c9d0e1f2
NODE_ENV=production
APP_URL=https://your-frontend.vercel.app
TIMEZONE=Asia/Jakarta
LOG_LEVEL=info
```

#### Step 4: Deploy

Click **"Deploy"** dan tunggu proses selesai (2-3 menit).

### Metode 2: Via Vercel CLI

#### Step 1: Login

```bash
vercel login
```

#### Step 2: Link Project

```bash
cd backend
vercel link
```

Pilih atau buat project baru.

#### Step 3: Set Environment Variables

```bash
# Set satu per satu
vercel env add DATABASE_URL production
vercel env add JWT_SECRET production
vercel env add NODE_ENV production
vercel env add APP_URL production
vercel env add TIMEZONE production

# Atau via file
vercel env pull .env.production
```

#### Step 4: Deploy

```bash
# Preview deployment
vercel

# Production deployment
vercel --prod
```

## ✅ Verifikasi Deployment

### 1. Health Check

```bash
curl https://your-api.vercel.app/health
```

**Expected Response:**
```json
{
  "status": "OK",
  "timestamp": "2025-01-03T10:00:00.000Z",
  "environment": "production"
}
```

### 2. Test Login

```bash
curl -X POST https://your-api.vercel.app/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@posyandu.com",
    "kataSandi": "your-password"
  }'
```

**Expected Response:**
```json
{
  "id": 1,
  "nama": "Admin Posyandu",
  "email": "admin@posyandu.com",
  "role": "ADMIN"
}
```

### 3. Check Logs

```bash
# Via CLI
vercel logs

# Atau via Dashboard
# https://vercel.com/your-username/your-project/logs
```

## 🔧 Troubleshooting

### Error: "Cannot find module '@prisma/client'"

**Solusi:**
```bash
# Pastikan build command include prisma:generate
# Di vercel.json atau Vercel Dashboard:
"buildCommand": "npm run prisma:generate && npm run build"
```

### Error: "Database connection failed"

**Solusi:**
1. Pastikan `DATABASE_URL` benar
2. Gunakan **connection pooler** untuk serverless
3. Check database firewall/whitelist
4. Vercel IP: Allow all (0.0.0.0/0) untuk serverless

### Error: "JWT secret not configured"

**Solusi:**
```bash
# Set JWT_SECRET di environment variables
vercel env add JWT_SECRET production
# Paste secret yang sudah di-generate
```

### Error: "CORS blocked"

**Solusi:**
1. Pastikan `APP_URL` di environment variables match dengan frontend URL
2. Check CORS configuration di `src/app.ts`
3. Frontend harus include `credentials: true` di fetch options

### Error: "Function timeout"

**Solusi:**
- Vercel free tier: 10 detik timeout
- Optimize database queries
- Gunakan connection pooling
- Upgrade ke Pro plan jika perlu (60 detik timeout)

### Error: "Too many database connections"

**Solusi:**
1. Gunakan **connection pooler** (Supabase/Neon)
2. Set connection limit di Prisma:
   ```prisma
   datasource db {
     provider = "postgresql"
     url      = env("DATABASE_URL")
     // Tambahkan connection limit
     connection_limit = 10
   }
   ```

## 📊 Monitoring & Maintenance

### 1. Monitor Logs

```bash
# Real-time logs
vercel logs --follow

# Filter by function
vercel logs --filter=serverless

# Last 100 logs
vercel logs --limit=100
```

### 2. Monitor Performance

Dashboard Vercel menampilkan:
- Request count
- Response time
- Error rate
- Bandwidth usage

### 3. Database Monitoring

**Supabase:**
- Dashboard > Database > Connection pooling
- Monitor active connections
- Check slow queries

**Neon:**
- Dashboard > Monitoring
- Connection count
- Query performance

### 4. Alerts

Setup alerts di Vercel:
1. Project Settings > Notifications
2. Enable email/Slack notifications untuk:
   - Deployment failures
   - High error rate
   - Performance issues

## 🔄 Update & Rollback

### Update Deployment

**Via Git Push:**
```bash
git add .
git commit -m "feat: update feature"
git push origin main
# Vercel auto-deploy
```

**Via CLI:**
```bash
vercel --prod
```

### Rollback

**Via Dashboard:**
1. Deployments tab
2. Find previous successful deployment
3. Click "..." > "Promote to Production"

**Via CLI:**
```bash
# List deployments
vercel ls

# Rollback to specific deployment
vercel rollback [deployment-url]
```

## 🔐 Security Checklist

- [x] JWT_SECRET menggunakan random string yang kuat (64+ characters)
- [x] DATABASE_URL tidak di-commit ke Git
- [x] Environment variables di-set di Vercel Dashboard
- [x] CORS configured dengan APP_URL yang benar
- [x] Rate limiting enabled untuk login endpoint
- [x] Helmet middleware enabled untuk security headers
- [x] Password di-hash dengan bcrypt (salt rounds 10+)
- [x] Database menggunakan SSL connection
- [x] Admin password kuat dan unik

## 📈 Performance Optimization

### 1. Database Connection Pooling

Gunakan connection pooler untuk serverless:

**Supabase:**
```
postgresql://postgres.[ref]:[pass]@aws-0-[region].pooler.supabase.com:5432/postgres
```

**Neon:**
```
postgresql://[user]:[pass]@[host].neon.tech/[db]?sslmode=require
```

### 2. Prisma Configuration

```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
  connection_limit = 10
  pool_timeout = 20
}
```

### 3. Caching

Implement caching untuk data yang jarang berubah:
- User profile
- Lansia data
- Pemeriksaan history

### 4. Query Optimization

- Use `select` untuk limit fields
- Use `include` dengan bijak
- Implement pagination
- Add database indexes

## 🌐 Custom Domain (Optional)

### 1. Add Domain

```bash
vercel domains add api.posyandu.com
```

### 2. Configure DNS

Add CNAME record:
```
Type: CNAME
Name: api
Value: cname.vercel-dns.com
```

### 3. Update Environment Variables

```bash
# Update APP_URL jika perlu
vercel env add APP_URL production
# https://posyandu.com
```

## 📞 Support & Resources

- **Vercel Docs:** https://vercel.com/docs
- **Prisma Docs:** https://www.prisma.io/docs
- **Supabase Docs:** https://supabase.com/docs
- **Express Docs:** https://expressjs.com

## 📝 Checklist Deployment

Gunakan checklist ini sebelum deploy:

```markdown
## Pre-Deployment
- [ ] Generate JWT secret baru
- [ ] Setup database production
- [ ] Jalankan migrations di database production
- [ ] Seed admin user
- [ ] Test database connection

## Deployment
- [ ] Set semua environment variables di Vercel
- [ ] Configure build settings
- [ ] Deploy ke Vercel
- [ ] Verify deployment success

## Post-Deployment
- [ ] Test health endpoint
- [ ] Test login endpoint
- [ ] Test API endpoints
- [ ] Check logs untuk errors
- [ ] Monitor performance
- [ ] Update frontend API URL
- [ ] Test end-to-end flow

## Security
- [ ] JWT_SECRET kuat dan unik
- [ ] Database credentials aman
- [ ] CORS configured correctly
- [ ] Rate limiting active
- [ ] SSL/HTTPS enabled
```

---

**Last Updated:** 2025-01-03
**Version:** 1.0.0
**Maintainer:** Tim Pengembang Sistem Posyandu Lansia
