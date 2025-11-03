# Database Seeding

Dokumentasi untuk database seeding Sistem Backend Posyandu Lansia.

## Overview

Seeder ini membuat admin user default untuk sistem. Seeder bersifat **idempotent**, artinya aman untuk dijalankan berkali-kali tanpa menimpa data yang sudah ada.

## Cara Menjalankan

### Menggunakan npm script (Recommended)

```bash
npm run prisma:seed
```

### Menggunakan Prisma CLI

```bash
npx prisma db seed
```

### Manual dengan ts-node

```bash
npx ts-node prisma/seed.ts
```

## Environment Variables

Seeder membaca environment variables berikut:

| Variable | Deskripsi | Default | Required |
|----------|-----------|---------|----------|
| `ADMIN_NAME` | Nama admin user | "Admin Posyandu" | No |
| `ADMIN_EMAIL` | Email admin untuk login | "admin@posyandu.local" | No |
| `ADMIN_PASS` | Password admin | *auto-generated* | No |

### Contoh Konfigurasi

**Dengan password custom:**
```env
ADMIN_NAME="Super Admin"
ADMIN_EMAIL="admin@example.com"
ADMIN_PASS="MySecurePassword123!"
```

**Dengan password auto-generated:**
```env
ADMIN_NAME="Super Admin"
ADMIN_EMAIL="admin@example.com"
# ADMIN_PASS tidak diset - akan di-generate otomatis
```

## Behavior

### Jika Admin Belum Ada

Seeder akan:
1. ✅ Membuat admin user baru
2. 🔐 Hash password dengan bcrypt (salt rounds: 12)
3. 📋 Menampilkan detail admin yang dibuat
4. 🔑 Menampilkan password (jika di-generate otomatis)

**Output Example:**
```
🌱 Memulai database seeding...

🔐 Password admin tidak ditemukan di environment
   Generating password acak yang aman...

🔒 Hashing password dengan bcrypt...
👤 Membuat admin user...

✅ Admin user berhasil dibuat!
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📋 Detail Admin:
   ID: 1
   Nama: Admin Posyandu
   Email: admin@posyandu.local
   Role: ADMIN
   Status: Aktif

🔑 PENTING - Simpan kredensial ini:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   Email: admin@posyandu.local
   Password: aB3$xY9#mN2@pQ7!
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
⚠️  Password ini hanya ditampilkan sekali!
   Simpan di tempat yang aman.
```

### Jika Admin Sudah Ada

Seeder akan:
1. ✅ Mendeteksi admin yang sudah ada
2. 📋 Menampilkan detail admin existing
3. ⏭️ Skip seeding tanpa error

**Output Example:**
```
🌱 Memulai database seeding...

✅ Admin user sudah ada di database
   Email: admin@posyandu.local
   Nama: Admin Posyandu
   Role: ADMIN

⏭️  Skipping seeding - data sudah ada
```

## Password Generation

### Karakteristik Password Auto-Generated

Jika `ADMIN_PASS` tidak diset, seeder akan generate password dengan karakteristik:

- **Panjang**: 16 karakter
- **Karakter**: Huruf besar, huruf kecil, angka, dan simbol
- **Randomness**: Menggunakan `crypto.randomBytes` untuk keamanan maksimal
- **Readability**: Menghindari karakter yang mirip (0/O, 1/l/I)

### Security

- Password di-hash dengan **bcrypt** menggunakan **12 salt rounds**
- Password plain text **tidak pernah disimpan** di database
- Password auto-generated hanya ditampilkan **sekali** saat seeding
- Gunakan password yang kuat jika set manual via `ADMIN_PASS`

## Idempotency

Seeder dirancang untuk aman dijalankan berkali-kali:

✅ **Safe to run multiple times**
- Tidak akan menimpa admin yang sudah ada
- Tidak akan membuat duplicate admin
- Tidak akan mengubah password existing admin

❌ **Will NOT**
- Update admin yang sudah ada
- Reset password admin existing
- Menghapus data yang sudah ada

## Troubleshooting

### Error: "Email sudah terdaftar"

Ini normal jika admin sudah ada. Seeder akan skip dengan aman.

### Error: "Cannot connect to database"

Pastikan:
1. PostgreSQL server berjalan
2. `DATABASE_URL` di `.env` sudah benar
3. Database sudah dibuat
4. Migrations sudah dijalankan (`npm run prisma:migrate`)

### Lupa Password Admin

Jika lupa password admin yang di-generate:

1. **Option 1**: Hapus admin dari database dan run seeder lagi
   ```sql
   DELETE FROM users WHERE email = 'admin@posyandu.local';
   ```
   ```bash
   npm run prisma:seed
   ```

2. **Option 2**: Set password baru via environment dan run seeder dengan email berbeda
   ```env
   ADMIN_EMAIL="newadmin@posyandu.local"
   ADMIN_PASS="NewPassword123!"
   ```

3. **Option 3**: Update password langsung di database (advanced)
   ```typescript
   // Gunakan bcrypt untuk hash password baru
   const bcrypt = require('bcrypt');
   const newPassword = await bcrypt.hash('YourNewPassword', 12);
   // Update di database
   ```

## Best Practices

### Development

```env
# .env.development
ADMIN_EMAIL="dev@posyandu.local"
ADMIN_PASS="dev123"  # Password simple untuk development
```

### Production

```env
# .env.production
ADMIN_EMAIL="admin@yourdomain.com"
ADMIN_PASS=""  # Kosongkan untuk auto-generate password yang kuat
```

⚠️ **PENTING**: 
- Jangan commit `.env` ke git
- Simpan password production di password manager
- Gunakan password yang kuat untuk production
- Ganti password default setelah first login

## Integration dengan Prisma

Seeder terintegrasi dengan Prisma CLI:

```json
// package.json
{
  "prisma": {
    "seed": "ts-node prisma/seed.ts"
  }
}
```

Ini memungkinkan:
- `npx prisma db seed` untuk run seeder
- `npx prisma migrate reset` akan otomatis run seeder setelah reset
- `npx prisma migrate dev` akan run seeder jika database kosong

## Related Commands

```bash
# Reset database dan run seeder
npm run prisma:migrate reset

# Generate Prisma Client
npm run prisma:generate

# Run migrations
npm run prisma:migrate

# Run seeder
npm run prisma:seed

# Open Prisma Studio
npx prisma studio
```

## Security Notes

1. **Password Hashing**: Menggunakan bcrypt dengan 12 salt rounds
2. **Random Generation**: Menggunakan `crypto.randomBytes` (cryptographically secure)
3. **No Plain Text**: Password plain text tidak pernah disimpan
4. **One-Time Display**: Password auto-generated hanya ditampilkan sekali
5. **Environment Variables**: Sensitive data dibaca dari environment, bukan hardcoded

## Support

Jika mengalami masalah dengan seeding, check:
1. Database connection (`DATABASE_URL`)
2. Prisma schema sudah up-to-date (`npm run prisma:generate`)
3. Migrations sudah dijalankan (`npm run prisma:migrate`)
4. Environment variables sudah diset dengan benar
