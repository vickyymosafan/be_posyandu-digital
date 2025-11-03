# Role Guard Middleware

## Deskripsi

Role Guard adalah middleware factory untuk implementasi role-based access control (RBAC) di Sistem Backend Posyandu Lansia. Middleware ini memverifikasi bahwa user yang terautentikasi memiliki role yang sesuai untuk mengakses endpoint tertentu.

## Prinsip Design

### SOLID Principles

1. **Single Responsibility**: Hanya bertanggung jawab untuk otorisasi berdasarkan role
2. **Open/Closed**: Extensible melalui factory pattern tanpa perlu modifikasi kode
3. **Liskov Substitution**: Dapat digunakan di mana saja Express middleware diperlukan
4. **Interface Segregation**: Interface sederhana yang hanya menerima array of roles
5. **Dependency Inversion**: Depend pada Express abstractions, bukan implementasi konkret

### Design Patterns

- **Factory Pattern**: `roleGuard()` adalah factory function yang menghasilkan middleware yang dikonfigurasi
- **Separation of Concerns**: Tidak ada business logic, hanya otorisasi

## Penggunaan

### Basic Usage

```typescript
import { Router } from 'express';
import { Role } from '@prisma/client';
import { authMiddleware, roleGuard } from '../middlewares';

const router = Router();

// Endpoint yang hanya dapat diakses oleh ADMIN
router.post(
  '/petugas',
  authMiddleware,
  roleGuard([Role.ADMIN]),
  createPetugasController
);

// Endpoint yang dapat diakses oleh ADMIN dan PETUGAS
router.get(
  '/lansia',
  authMiddleware,
  roleGuard([Role.ADMIN, Role.PETUGAS]),
  getLansiaController
);
```

### Helper Functions

#### adminOnly()

Shortcut untuk `roleGuard([Role.ADMIN])` - hanya mengizinkan ADMIN.

```typescript
import { authMiddleware, adminOnly } from '../middlewares';

router.post('/petugas', authMiddleware, adminOnly(), createPetugasController);
```

#### authenticated()

Shortcut untuk `roleGuard([Role.ADMIN, Role.PETUGAS])` - mengizinkan semua authenticated users.

```typescript
import { authMiddleware, authenticated } from '../middlewares';

router.get('/profile', authMiddleware, authenticated(), getProfileController);
```

## Urutan Middleware

**PENTING**: `roleGuard` HARUS digunakan setelah `authMiddleware`.

```typescript
// ✅ BENAR
router.post('/petugas', authMiddleware, roleGuard([Role.ADMIN]), handler);

// ❌ SALAH - roleGuard sebelum authMiddleware
router.post('/petugas', roleGuard([Role.ADMIN]), authMiddleware, handler);
```

### Alasan

1. `authMiddleware` bertanggung jawab untuk:
   - Extract dan verify JWT token
   - Set `req.user` dengan user info (userId, role)

2. `roleGuard` bertanggung jawab untuk:
   - Verifikasi `req.user` exists
   - Verifikasi `req.user.role` ada dalam allowed roles

Jika `roleGuard` dijalankan sebelum `authMiddleware`, `req.user` belum di-set dan akan return 401.

## Response Codes

### 401 Unauthorized

Dikembalikan jika `req.user` tidak ditemukan (authMiddleware belum dijalankan atau gagal).

```json
{
  "error": "Autentikasi diperlukan"
}
```

### 403 Forbidden

Dikembalikan jika user tidak memiliki role yang diizinkan.

```json
{
  "error": "Akses ditolak"
}
```

### 500 Internal Server Error

Dikembalikan jika terjadi unexpected error.

```json
{
  "error": "Terjadi kesalahan pada sistem"
}
```

## Logging

Middleware ini menggunakan logger utility untuk mencatat:

- **Debug**: Otorisasi berhasil dengan detail user dan role
- **Warn**: Otorisasi gagal dengan detail user, role, dan endpoint
- **Error**: Unexpected errors atau configuration errors

## Validasi Input

Factory function memvalidasi input:

```typescript
// ✅ Valid
roleGuard([Role.ADMIN]);
roleGuard([Role.ADMIN, Role.PETUGAS]);
roleGuard(['ADMIN', 'PETUGAS']); // String juga diterima

// ❌ Invalid - akan throw error
roleGuard([]); // Array kosong
roleGuard(null); // Bukan array
roleGuard(undefined); // Bukan array
```

## Testing

Untuk testing endpoint dengan roleGuard:

```typescript
import request from 'supertest';
import app from '../app';

describe('POST /api/petugas', () => {
  it('harus return 403 jika user bukan ADMIN', async () => {
    // Login sebagai PETUGAS
    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'petugas@test.com', kataSandi: 'password' });
    
    const cookie = loginRes.headers['set-cookie'];
    
    // Coba akses endpoint admin-only
    const response = await request(app)
      .post('/api/petugas')
      .set('Cookie', cookie)
      .send({ nama: 'Test', email: 'test@test.com', kataSandi: 'pass' });
    
    expect(response.status).toBe(403);
    expect(response.body.error).toBe('Akses ditolak');
  });
});
```

## Best Practices

1. **Selalu gunakan setelah authMiddleware**
2. **Gunakan Role enum dari Prisma** untuk type safety
3. **Gunakan helper functions** (`adminOnly()`, `authenticated()`) untuk readability
4. **Dokumentasikan required roles** di API documentation
5. **Test semua role combinations** untuk setiap endpoint

## Extensibility

Untuk menambah role baru:

1. Update enum `Role` di `prisma/schema.prisma`
2. Run migration: `npm run prisma:migrate`
3. Gunakan role baru di `roleGuard([Role.NEW_ROLE])`

Tidak perlu modifikasi kode roleGuard - ini adalah contoh **Open/Closed Principle**.
