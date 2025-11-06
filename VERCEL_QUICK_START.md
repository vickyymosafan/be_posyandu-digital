# ⚡ Quick Start: Deploy ke Vercel

Panduan singkat untuk deployment cepat ke Vercel dalam 5 menit.

## 🎯 Langkah Cepat

### 1. Generate JWT Secret (30 detik)

```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

Copy output dan simpan untuk step berikutnya.

### 2. Setup Database (2 menit)

**Pilih salah satu:**

#### Supabase (Recommended)
1. Buat project di [supabase.com](https://supabase.com)
2. Copy connection string dari Settings > Database > Connection Pooling
3. Format: `postgresql://postgres.[ref]:[pass]@aws-0-[region].pooler.supabase.com:5432/postgres`

#### Neon
1. Buat project di [neon.tech](https://neon.tech)
2. Copy connection string (sudah optimized)

### 3. Deploy via Vercel Dashboard (2 menit)

1. **Import Project**
   - Login ke [vercel.com](https://vercel.com)
   - Click "Add New Project"
   - Import Git repository
   - Root Directory: `backend`

2. **Set Environment Variables**
   ```
   DATABASE_URL=postgresql://...
   JWT_SECRET=a1b2c3d4e5f6...
   NODE_ENV=production
   APP_URL=https://your-frontend.vercel.app
   TIMEZONE=Asia/Jakarta
   ```

3. **Configure Build**
   - Build Command: `npm run prisma:generate && npm run build`
   - Output Directory: `dist`
   - Install Command: `npm install`

4. **Click Deploy** 🚀

### 4. Setup Database (1 menit)

Setelah deploy berhasil:

```bash
# Pull environment variables
vercel env pull .env.production

# Jalankan migrations
npx prisma migrate deploy

# Seed admin user
npm run prisma:seed
```

### 5. Test (30 detik)

```bash
# Health check
curl https://your-api.vercel.app/health

# Test login
curl -X POST https://your-api.vercel.app/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@posyandu.local","kataSandi":"your-password"}'
```

## ✅ Done!

API Anda sudah live di: `https://your-project.vercel.app`

## 🔗 Next Steps

- Update frontend `NEXT_PUBLIC_API_URL` dengan URL API production
- Setup custom domain (optional)
- Monitor logs di Vercel Dashboard
- Baca [DEPLOYMENT.md](./DEPLOYMENT.md) untuk dokumentasi lengkap

## ⚠️ Troubleshooting Cepat

**Error: Cannot find module '@prisma/client'**
```bash
# Pastikan build command include prisma:generate
npm run prisma:generate && npm run build
```

**Error: Database connection failed**
- Gunakan connection pooler URL (bukan direct connection)
- Check DATABASE_URL di environment variables

**Error: CORS blocked**
- Set APP_URL di environment variables
- Match dengan frontend URL

## 📞 Butuh Bantuan?

Lihat [DEPLOYMENT.md](./DEPLOYMENT.md) untuk dokumentasi lengkap.
