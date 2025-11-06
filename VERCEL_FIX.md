# 🔧 Perbaikan Error 404 Vercel

## Masalah yang Ditemukan

Error 404 NOT_FOUND terjadi karena konfigurasi Vercel yang tidak sesuai dengan struktur serverless function Vercel.

## Perubahan yang Dilakukan

### 1. Struktur File Baru

Dibuat file baru `/api/index.ts` sebagai entry point Vercel:

```
backend/
├── api/
│   └── index.ts          # ✨ NEW: Vercel serverless entry point
├── src/
│   ├── app.ts            # Express app configuration
│   ├── serverless.ts     # Serverless adapter (backup)
│   └── ...
```

### 2. Konfigurasi Vercel (`vercel.json`)

**Sebelum:**
```json
{
  "builds": [
    {
      "src": "dist/serverless.js",
      "use": "@vercel/node"
    }
  ],
  "routes": [
    {
      "src": "/(.*)",
      "dest": "dist/serverless.js"
    }
  ]
}
```

**Sesudah:**
```json
{
  "version": 2,
  "buildCommand": "npm run prisma:generate",
  "installCommand": "npm install",
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/api"
    }
  ]
}
```

### 3. File `/api/index.ts`

```typescript
import serverless from 'serverless-http';
import app from '../src/app';

export default serverless(app);
```

### 4. Update `tsconfig.json`

Menambahkan folder `api` ke include:
```json
"include": ["src/**/*", "api/**/*"]
```

## Cara Kerja

1. **Vercel Auto-Detection**: Vercel otomatis mendeteksi file di folder `/api` sebagai serverless functions
2. **Rewrites**: Semua request di-route ke `/api/index.ts`
3. **Serverless Handler**: `serverless-http` wrap Express app menjadi serverless function
4. **Express Routing**: Express app handle routing internal (`/api/auth/login`, dll)

## Testing Setelah Deploy

### 1. Health Check
```bash
curl https://your-api.vercel.app/health
```

Expected:
```json
{
  "status": "OK",
  "timestamp": "2025-01-03T10:00:00.000Z",
  "environment": "production"
}
```

### 2. API Endpoint
```bash
curl https://your-api.vercel.app/api/auth/login \
  -X POST \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@posyandu.local","kataSandi":"password"}'
```

## Deployment Ulang

Setelah perubahan ini, deploy ulang ke Vercel:

```bash
# Via CLI
vercel --prod

# Atau push ke Git (jika auto-deploy enabled)
git add .
git commit -m "fix: vercel 404 error - restructure serverless config"
git push origin main
```

## Troubleshooting

### Masih 404 setelah deploy?

1. **Check Build Logs**
   ```bash
   vercel logs
   ```

2. **Verify File Structure**
   - Pastikan folder `/api` ada
   - Pastikan file `/api/index.ts` ada
   - Check di Vercel Dashboard > Source

3. **Check Environment Variables**
   - DATABASE_URL
   - JWT_SECRET
   - NODE_ENV
   - APP_URL

4. **Rebuild**
   ```bash
   vercel --force
   ```

### Error: Cannot find module '../src/app'

Pastikan build command include TypeScript compilation:
```json
"buildCommand": "npm run prisma:generate && npm run build"
```

Atau Vercel akan compile TypeScript otomatis jika detect `tsconfig.json`.

### Error: Prisma Client not generated

Pastikan build command include `prisma:generate`:
```json
"buildCommand": "npm run prisma:generate"
```

## Alternatif: Menggunakan `dist/` Output

Jika ingin menggunakan compiled JavaScript:

1. Update `vercel.json`:
```json
{
  "buildCommand": "npm run prisma:generate && npm run build",
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/dist/serverless.js"
    }
  ]
}
```

2. Pastikan `src/serverless.ts` export default:
```typescript
export default serverless(app);
```

## Referensi

- [Vercel Serverless Functions](https://vercel.com/docs/functions/serverless-functions)
- [Vercel Node.js Runtime](https://vercel.com/docs/functions/runtimes/node-js)
- [serverless-http](https://github.com/dougmoscrop/serverless-http)

---

**Status:** ✅ Fixed
**Date:** 2025-01-03
