# Panduan Deployment ke Vercel

Dokumen ini berisi panduan lengkap untuk deploy Sistem Backend Posyandu Lansia ke Vercel sebagai serverless function.

## Prasyarat

1. **Akun Vercel**: Daftar di [vercel.com](https://vercel.com)
2. **Vercel CLI** (optional): Install dengan `npm install -g vercel`
3. **Database PostgreSQL**: Siapkan database PostgreSQL (bisa menggunakan Vercel Postgres, Supabase, atau provider lain)
4. **Environment Variables**: Siapkan semua environment variables yang diperlukan

## Konfigurasi Vercel

File `vercel.json` sudah dikonfigurasi dengan setting optimal untuk deployment:

### Build Configuration

```json
{
  "buildCommand": "npm run prisma:generate && npm run build",
  "installCommand": "npm install",
  "outputDirectory": "dist"
}
```

**Penjelasan:**
- `buildCommand`: Generate Prisma client terlebih dahulu, kemudian compile TypeScript
- `installCommand`: Install semua dependencies dari package.json
- `outputDirectory`: Output hasil build (dist/)

### Serverless Function

```json
{
  "builds": [
    {
      "src": "dist/serverless.js",
      "use": "@vercel/node"
    }
  ]
}
```

**Penjelasan:**
- Entry point: `dist/serverless.js` (hasil compile dari `src/serverless.ts`)
- Runtime: `@vercel/node` (Node.js serverless runtime)

### Routing

```json
{
  "routes": [
    {
      "src": "/(.*)",
      "dest": "dist/serverless.js"
    }
  ]
}
```

**Penjelasan:**
- Semua requests (`/(.*)`) diarahkan ke serverless function
- Express app akan handle routing internal

### Region

```json
{
  "regions": ["sin1"]
}
```

**Penjelasan:**
- `sin1`: Singapore (optimal untuk Indonesia)
- Bisa diganti sesuai kebutuhan: `iad1` (US East), `sfo1` (US West), dll
- Pilih region yang dekat dengan database untuk latency minimal

## Environment Variables

### Required Variables

Set environment variables di Vercel Dashboard (Settings → Environment Variables):

```bash
# Database
DATABASE_URL="postgresql://user:password@host:port/database?schema=public"

# JWT Authentication
JWT_SECRET="your-super-secret-jwt-key-change-this-in-production"

# Application
NODE_ENV="production"
APP_URL="https://your-frontend-domain.vercel.app"
PORT="3001"

# Timezone
TIMEZONE="Asia/Jakarta"

# Logging
LOG_LEVEL="info"
```

### Optional Variables (Seeding)

Jika ingin run seeder di production (tidak disarankan):

```bash
ADMIN_NAME="Admin Posyandu"
ADMIN_EMAIL="admin@posyandu.local"
ADMIN_PASS="secure-password-here"
```

**Note:** Sebaiknya seeding dilakukan manual di database production, bukan via environment variables.

## Langkah Deployment

### Option 1: Deploy via Vercel Dashboard (Recommended)

1. **Login ke Vercel Dashboard**
   - Buka [vercel.com/dashboard](https://vercel.com/dashboard)
   - Login dengan akun Anda

2. **Import Project**
   - Klik "Add New..." → "Project"
   - Import repository dari GitHub/GitLab/Bitbucket
   - Pilih repository backend

3. **Configure Project**
   - Framework Preset: Other
   - Root Directory: `backend` (jika monorepo) atau `.` (jika standalone)
   - Build Command: Akan otomatis menggunakan dari `vercel.json`
   - Output Directory: Akan otomatis menggunakan dari `vercel.json`

4. **Set Environment Variables**
   - Tambahkan semua environment variables yang diperlukan
   - Pastikan `DATABASE_URL` dan `JWT_SECRET` sudah di-set

5. **Deploy**
   - Klik "Deploy"
   - Tunggu proses build dan deployment selesai
   - Vercel akan memberikan URL deployment

### Option 2: Deploy via Vercel CLI

1. **Install Vercel CLI**
   ```bash
   npm install -g vercel
   ```

2. **Login**
   ```bash
   vercel login
   ```

3. **Deploy**
   ```bash
   # Dari direktori backend/
   vercel
   
   # Atau untuk production deployment
   vercel --prod
   ```

4. **Set Environment Variables**
   ```bash
   vercel env add DATABASE_URL production
   vercel env add JWT_SECRET production
   # ... tambahkan semua variables lainnya
   ```

## Database Setup

### 1. Run Migrations

Setelah deployment pertama kali, run migrations di database production:

```bash
# Set DATABASE_URL ke production database
export DATABASE_URL="postgresql://..."

# Run migrations
npx prisma migrate deploy

# Atau via Vercel CLI
vercel env pull .env.production
npx prisma migrate deploy
```

### 2. Seed Database (Optional)

Jika perlu seed data awal (admin user):

```bash
# Set environment variables
export DATABASE_URL="postgresql://..."
export ADMIN_NAME="Admin Posyandu"
export ADMIN_EMAIL="admin@posyandu.local"
export ADMIN_PASS="secure-password"

# Run seeder
npm run prisma:seed
```

**Alternatif:** Buat admin user manual via SQL:

```sql
INSERT INTO users (nama, email, "kataSandi", role, aktif, "createdAt")
VALUES (
  'Admin Posyandu',
  'admin@posyandu.local',
  '$2b$10$...', -- bcrypt hash dari password
  'ADMIN',
  true,
  NOW()
);
```

## Verifikasi Deployment

### 1. Health Check

Test health check endpoint:

```bash
curl https://your-app.vercel.app/health
```

Expected response:
```json
{
  "status": "OK",
  "timestamp": "2025-11-03T10:00:00.000Z",
  "environment": "production"
}
```

### 2. Test API Endpoints

Test login endpoint:

```bash
curl -X POST https://your-app.vercel.app/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@posyandu.local",
    "kataSandi": "your-password"
  }'
```

### 3. Check Logs

Monitor logs di Vercel Dashboard:
- Buka project di dashboard
- Klik tab "Logs"
- Monitor real-time logs dan errors

## Troubleshooting

### Build Errors

**Error: Prisma Client not generated**
```
Solution: Pastikan buildCommand include "npm run prisma:generate"
```

**Error: TypeScript compilation failed**
```
Solution: 
1. Check tsconfig.json configuration
2. Run "npm run type-check" locally untuk debug
3. Fix type errors sebelum deploy
```

### Runtime Errors

**Error: DATABASE_URL not found**
```
Solution: Set DATABASE_URL di Vercel environment variables
```

**Error: JWT_SECRET not found**
```
Solution: Set JWT_SECRET di Vercel environment variables
```

**Error: Connection timeout**
```
Solution: 
1. Pastikan database accessible dari internet
2. Whitelist Vercel IP addresses di database firewall
3. Gunakan connection pooling (Prisma sudah handle ini)
```

### Performance Issues

**Cold Start Latency**
```
Solution:
1. Upgrade ke Vercel Pro untuk faster cold starts
2. Optimize bundle size
3. Use connection pooling untuk database
4. Consider using Vercel Edge Functions untuk critical paths
```

**Database Connection Limit**
```
Solution:
1. Set connection limit di Prisma schema
2. Use connection pooling
3. Monitor active connections
4. Consider using PgBouncer
```

## Optimasi Production

### 1. Connection Pooling

Update `prisma/schema.prisma`:

```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
  
  // Connection pooling untuk serverless
  // Adjust sesuai dengan database provider
  // Vercel Postgres: connection_limit=1
  // Supabase: connection_limit=1, pool_timeout=0
}
```

### 2. Environment-Specific Configuration

Gunakan environment variables untuk configuration:

```typescript
// src/config.ts
export const config = {
  database: {
    connectionLimit: process.env.DB_CONNECTION_LIMIT || 1,
    poolTimeout: process.env.DB_POOL_TIMEOUT || 0,
  },
  jwt: {
    expiresIn: process.env.JWT_EXPIRES_IN || '15m',
  },
  cors: {
    origin: process.env.APP_URL || 'http://localhost:3000',
  },
};
```

### 3. Monitoring

Setup monitoring untuk production:

1. **Vercel Analytics**: Enable di dashboard untuk monitoring performance
2. **Error Tracking**: Integrate dengan Sentry atau similar service
3. **Logging**: Use structured logging (sudah implemented dengan Winston)
4. **Alerts**: Setup alerts untuk critical errors

## Rollback

Jika deployment bermasalah, rollback ke versi sebelumnya:

### Via Dashboard
1. Buka project di Vercel Dashboard
2. Klik tab "Deployments"
3. Pilih deployment yang stabil
4. Klik "..." → "Promote to Production"

### Via CLI
```bash
vercel rollback
```

## Custom Domain

Setup custom domain untuk production:

1. **Add Domain**
   - Buka project settings
   - Klik "Domains"
   - Add custom domain (e.g., api.posyandu.com)

2. **Configure DNS**
   - Add CNAME record di DNS provider
   - Point ke Vercel deployment URL

3. **SSL Certificate**
   - Vercel otomatis provision SSL certificate
   - HTTPS akan aktif dalam beberapa menit

## Best Practices

1. **Environment Variables**
   - Jangan commit secrets ke repository
   - Use Vercel environment variables untuk sensitive data
   - Rotate secrets secara berkala

2. **Database**
   - Use connection pooling
   - Monitor connection limits
   - Backup database secara berkala
   - Test migrations di staging sebelum production

3. **Monitoring**
   - Monitor logs secara berkala
   - Setup alerts untuk errors
   - Track performance metrics
   - Monitor database performance

4. **Security**
   - Keep dependencies updated
   - Use strong JWT_SECRET
   - Enable rate limiting
   - Monitor for security vulnerabilities

5. **Testing**
   - Test di staging environment sebelum production
   - Run integration tests
   - Verify all endpoints working
   - Test error scenarios

## Resources

- [Vercel Documentation](https://vercel.com/docs)
- [Vercel Node.js Runtime](https://vercel.com/docs/runtimes#official-runtimes/node-js)
- [Prisma with Vercel](https://www.prisma.io/docs/guides/deployment/deployment-guides/deploying-to-vercel)
- [Serverless Functions](https://vercel.com/docs/concepts/functions/serverless-functions)

## Support

Jika mengalami masalah:
1. Check Vercel logs di dashboard
2. Check application logs (Winston)
3. Verify environment variables
4. Test database connectivity
5. Contact Vercel support jika diperlukan
