# 🚀 Vercel Deployment Guide

## ✅ Perubahan yang Sudah Dilakukan

### 1. **api/index.ts** - Entry Point
```typescript
// Hanya export app, tidak pakai serverless-http
import app from '../src/app';
export default app;
```

### 2. **vercel.json** - Konfigurasi Routing
```json
{
  "version": 2,
  "builds": [
    {
      "src": "api/index.ts",
      "use": "@vercel/node"
    }
  ],
  "routes": [
    {
      "src": "/(.*)",
      "dest": "api/index.ts"
    }
  ],
  "env": {
    "NODE_ENV": "production"
  },
  "regions": ["sin1"]
}
```

**Penting**: 
- `builds` mendefinisikan entry point
- `routes` mendefinisikan routing semua request ke api/index.ts
- Ini adalah perbedaan utama dari konfigurasi sebelumnya yang tidak punya routing!

### 3. **package.json** - Build Script
Ditambahkan script:
```json
"vercel-build": "prisma generate"
```

### 4. **prisma/schema.prisma** - Binary Targets
```prisma
generator client {
  provider      = "prisma-client-js"
  binaryTargets = ["native", "rhel-openssl-1.0.x"]
}
```

### 5. **src/app.ts** - Routing Structure
- ✅ Tidak ada `app.listen()` (sudah benar)
- ✅ Health check di `/health`
- ✅ API routes di-mount di root `/` (karena Vercel sudah route ke `/api/*`)

## 📋 Struktur URL di Vercel

Karena file ada di `api/index.ts`, Vercel otomatis route:
- `https://your-domain.vercel.app/api/health` → `/health` di app
- `https://your-domain.vercel.app/api/auth/login` → `/auth/login` di apiRouter
- `https://your-domain.vercel.app/api/profile` → `/profile` di apiRouter

## 🔧 Environment Variables di Vercel

Set di Vercel Dashboard → Settings → Environment Variables:

```env
DATABASE_URL=postgresql://postgres.xxx:password@aws-0-region.pooler.supabase.com:5432/postgres
JWT_SECRET=your-production-secret-key
JWT_EXPIRES_IN=7d
APP_URL=https://your-frontend.vercel.app
NODE_ENV=production
```

**Penting**: Gunakan Supabase **connection pooler** URL untuk production!

## 🚀 Deployment Steps

### Via Vercel CLI:
```bash
cd backend
npm install
vercel --prod
```

### Via Vercel Dashboard:
1. Push ke GitHub
2. Import project di Vercel
3. Root Directory: `backend`
4. Build Command: `npm run vercel-build` (otomatis terdeteksi)
5. Output Directory: (kosongkan, serverless function)
6. Set environment variables
7. Deploy

## ✅ Testing Endpoints

Setelah deploy, test:

```bash
# Health check
curl https://your-api.vercel.app/api/health

# Login
curl -X POST https://your-api.vercel.app/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@posyandu.com","kataSandi":"your-password"}'
```

## 🐛 Troubleshooting

### 404 Error
- ✅ **FIXED**: Ditambahkan `routes` di vercel.json
- Pastikan request ke `/api/*` path

### Prisma Client Error
```bash
# Regenerate Prisma Client
npm run prisma:generate
```

### Database Connection Error
- Gunakan Supabase connection pooler URL
- Format: `postgresql://postgres.xxx:password@aws-0-region.pooler.supabase.com:5432/postgres`

### CORS Error
- Set `APP_URL` di environment variables
- Include frontend URL yang benar

## 📊 Perbedaan dengan Konfigurasi Sebelumnya

| Aspek | Sebelumnya (Error) | Sekarang (Fixed) |
|-------|-------------------|------------------|
| **vercel.json** | Hanya `functions` config | Ada `builds` + `routes` |
| **Routing** | ❌ Tidak ada | ✅ Route semua ke api/index.ts |
| **api/index.ts** | Pakai `serverless-http` | Export app langsung |
| **Prisma binaryTargets** | ❌ Tidak ada | ✅ Ada rhel-openssl-1.0.x |
| **Build script** | ❌ Tidak ada vercel-build | ✅ Ada vercel-build |

## ✨ Status

✅ **READY TO DEPLOY**

Konfigurasi sekarang mengikuti pattern yang berhasil dari AI_PROMPTS_QUICK_START.md
