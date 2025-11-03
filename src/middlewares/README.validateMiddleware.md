# Validate Middleware

## Deskripsi

Validate Middleware adalah middleware factory untuk validasi input request menggunakan Zod schemas. Middleware ini memvalidasi request body, query parameters, atau route parameters sebelum request masuk ke controller, mengimplementasikan prinsip fail-fast validation.

## Prinsip Design

### SOLID Principles

1. **Single Responsibility**: Hanya bertanggung jawab untuk validasi input request
2. **Open/Closed**: Extensible melalui Zod schemas tanpa perlu modifikasi middleware
3. **Liskov Substitution**: Dapat digunakan di mana saja Express middleware diperlukan
4. **Interface Segregation**: Interface sederhana yang hanya menerima schema dan target
5. **Dependency Inversion**: Depend pada Zod abstraction, bukan implementasi konkret

### Design Patterns

- **Factory Pattern**: `validate()` adalah factory function yang menghasilkan middleware yang dikonfigurasi
- **Fail-Fast**: Validasi gagal langsung return error sebelum masuk business logic
- **Type Safety**: Menggunakan TypeScript generics untuk type inference

### Benefits

- **Type Safety**: Validated data memiliki type yang benar
- **Data Transformation**: Zod dapat transform data (trim, parse, coerce, dll)
- **Consistent Error Format**: Semua validation error memiliki format yang sama
- **Separation of Concerns**: Validasi terpisah dari business logic
- **Reusability**: Schema dapat digunakan di multiple endpoints

## Penggunaan

### Basic Usage

```typescript
import { Router } from 'express';
import { validate, validateBody, validateQuery } from '../middlewares';
import { createLansiaSchema, kodePasienQuerySchema } from '../utils/validators';

const router = Router();

// Validasi request body (default)
router.post('/lansia', validate(createLansiaSchema), createLansiaController);

// Atau menggunakan helper validateBody (lebih eksplisit)
router.post('/lansia', validateBody(createLansiaSchema), createLansiaController);

// Validasi query parameters
router.get('/lansia', validateQuery(kodePasienQuerySchema), getLansiaController);
```

### Validation Targets

Middleware mendukung 3 target validasi:

#### 1. Body Validation (Default)

Untuk validasi request body pada POST, PUT, PATCH requests.

```typescript
import { validateBody } from '../middlewares';
import { loginRequestSchema, createPetugasSchema } from '../utils/validators';

// Login
router.post('/auth/login', validateBody(loginRequestSchema), loginController);

// Create petugas
router.post(
  '/petugas',
  authMiddleware,
  adminOnly(),
  validateBody(createPetugasSchema),
  createPetugasController
);
```

#### 2. Query Validation

Untuk validasi query parameters pada GET requests.

```typescript
import { validateQuery } from '../middlewares';
import { kodePasienQuerySchema } from '../utils/validators';

// GET /lansia?kode=pasien20250103AB
router.get(
  '/lansia',
  authMiddleware,
  validateQuery(kodePasienQuerySchema),
  getLansiaController
);
```

#### 3. Params Validation

Untuk validasi route parameters.

```typescript
import { validateParams } from '../middlewares';
import { z } from 'zod';

// Schema untuk route parameter
const kodeParamSchema = z.object({
  kode: z.string().min(1, 'Kode pasien tidak boleh kosong'),
});

// GET /lansia/:kode
router.get(
  '/lansia/:kode',
  authMiddleware,
  validateParams(kodeParamSchema),
  getLansiaByKodeController
);
```

### Combining with Other Middlewares

Validate middleware dapat dikombinasikan dengan middleware lain:

```typescript
import { authMiddleware, adminOnly, validateBody } from '../middlewares';
import { createPetugasSchema } from '../utils/validators';

router.post(
  '/petugas',
  authMiddleware,           // 1. Autentikasi
  adminOnly(),              // 2. Otorisasi (hanya admin)
  validateBody(createPetugasSchema),  // 3. Validasi input
  createPetugasController   // 4. Controller
);
```

**Urutan yang direkomendasikan:**
1. Authentication (authMiddleware)
2. Authorization (roleGuard)
3. Validation (validate)
4. Controller

## Error Response Format

### Validation Error (400)

Ketika validasi gagal, middleware mengembalikan response dengan format:

```json
{
  "error": "Validasi input gagal",
  "details": {
    "email": ["Format email tidak valid"],
    "kataSandi": ["Kata sandi minimal 6 karakter"],
    "nama": ["Nama tidak boleh kosong"]
  }
}
```

**Format details:**
- Key: Field name (path dalam object)
- Value: Array of error messages untuk field tersebut

### Nested Fields

Untuk nested objects, path menggunakan dot notation:

```json
{
  "error": "Validasi input gagal",
  "details": {
    "alamat.jalan": ["Jalan wajib diisi"],
    "alamat.kota": ["Kota wajib diisi"]
  }
}
```

### Array Fields

Untuk array, path menggunakan index:

```json
{
  "error": "Validasi input gagal",
  "details": {
    "items.0.nama": ["Nama item pertama wajib diisi"],
    "items.1.harga": ["Harga harus positif"]
  }
}
```

## Zod Schema Examples

### Basic Schema

```typescript
import { z } from 'zod';

const loginSchema = z.object({
  email: z.string().email('Format email tidak valid'),
  kataSandi: z.string().min(6, 'Kata sandi minimal 6 karakter'),
});
```

### Optional Fields

```typescript
const updateProfileSchema = z.object({
  nama: z.string().min(1).optional(),
  alamat: z.string().optional(),
});
```

### Custom Validation

```typescript
const createLansiaSchema = z.object({
  nik: z
    .string()
    .length(16, 'NIK harus 16 digit')
    .regex(/^\d{16}$/, 'NIK harus berupa angka'),
  tanggalLahir: z
    .string()
    .refine(
      (val) => {
        const date = new Date(val);
        return date <= new Date();
      },
      { message: 'Tanggal lahir tidak boleh di masa depan' }
    ),
});
```

### Conditional Validation

```typescript
const pemeriksaanGabunganSchema = z
  .object({
    tinggi: z.number().min(50).max(250).optional(),
    berat: z.number().min(10).max(300).optional(),
    sistolik: z.number().int().min(40).max(300).optional(),
    diastolik: z.number().int().min(30).max(200).optional(),
  })
  .refine(
    (data) => {
      // Jika ada salah satu field fisik, semua harus ada
      const hasFisik = data.tinggi || data.berat || data.sistolik || data.diastolik;
      if (!hasFisik) return true;
      
      return data.tinggi && data.berat && data.sistolik && data.diastolik;
    },
    {
      message: 'Jika mengisi pemeriksaan fisik, semua field harus diisi',
    }
  );
```

## Data Transformation

Zod dapat transform data sebelum masuk ke controller:

### Trim Strings

```typescript
const schema = z.object({
  nama: z.string().trim(),  // Otomatis trim whitespace
  email: z.string().trim().toLowerCase(),  // Trim dan lowercase
});
```

### Parse Numbers

```typescript
const schema = z.object({
  // String "123" akan di-parse menjadi number 123
  umur: z.string().transform((val) => parseInt(val, 10)),
  
  // Atau menggunakan coerce
  tinggi: z.coerce.number(),
});
```

### Parse Dates

```typescript
const schema = z.object({
  tanggalLahir: z.string().transform((val) => new Date(val)),
  
  // Atau menggunakan coerce
  createdAt: z.coerce.date(),
});
```

## Logging

Middleware ini menggunakan logger utility untuk mencatat:

- **Debug**: Validation attempts dan successes
- **Warn**: Validation failures dengan detail errors
- **Error**: Unexpected errors

Log format:

```typescript
// Validation success
{
  level: 'debug',
  message: 'Validasi berhasil',
  target: 'body',
  path: '/api/lansia',
  method: 'POST'
}

// Validation failure
{
  level: 'warn',
  message: 'Validasi gagal',
  target: 'body',
  path: '/api/lansia',
  method: 'POST',
  errors: {
    nik: ['NIK harus 16 digit'],
    email: ['Format email tidak valid']
  },
  ip: '192.168.1.1'
}
```

## Testing

### Unit Testing Schemas

```typescript
import { createLansiaSchema } from '../utils/validators';

describe('createLansiaSchema', () => {
  it('harus valid untuk data lengkap', () => {
    const data = {
      nik: '1234567890123456',
      kk: '1234567890123456',
      nama: 'Test Lansia',
      tanggalLahir: '1950-01-01',
      gender: 'L',
      alamat: 'Test Address',
    };
    
    expect(() => createLansiaSchema.parse(data)).not.toThrow();
  });
  
  it('harus throw error untuk NIK invalid', () => {
    const data = {
      nik: '123',  // Terlalu pendek
      // ... field lainnya
    };
    
    expect(() => createLansiaSchema.parse(data)).toThrow();
  });
});
```

### Integration Testing Middleware

```typescript
import request from 'supertest';
import app from '../app';

describe('POST /api/lansia', () => {
  it('harus return 400 untuk data invalid', async () => {
    const response = await request(app)
      .post('/api/lansia')
      .set('Cookie', authCookie)
      .send({
        nik: '123',  // Invalid: terlalu pendek
        nama: '',    // Invalid: kosong
      });
    
    expect(response.status).toBe(400);
    expect(response.body.error).toBe('Validasi input gagal');
    expect(response.body.details).toHaveProperty('nik');
    expect(response.body.details).toHaveProperty('nama');
  });
  
  it('harus return 201 untuk data valid', async () => {
    const response = await request(app)
      .post('/api/lansia')
      .set('Cookie', authCookie)
      .send({
        nik: '1234567890123456',
        kk: '1234567890123456',
        nama: 'Test Lansia',
        tanggalLahir: '1950-01-01',
        gender: 'L',
        alamat: 'Test Address',
      });
    
    expect(response.status).toBe(201);
  });
});
```

## Best Practices

1. **Define schemas in validators.ts**: Centralize semua schemas untuk reusability
2. **Use helper functions**: Gunakan `validateBody()`, `validateQuery()`, `validateParams()` untuk clarity
3. **Combine with auth middlewares**: Selalu validate setelah auth/authorization
4. **Provide clear error messages**: Gunakan custom messages di Zod schemas
5. **Test schemas separately**: Unit test schemas terpisah dari integration tests
6. **Use TypeScript inference**: Leverage `z.infer<typeof schema>` untuk type safety
7. **Transform data when needed**: Gunakan `.transform()` atau `.coerce` untuk data transformation
8. **Document validation rules**: Tambahkan comments di schema untuk dokumentasi

## Common Patterns

### Reusable Validators

```typescript
// validators.ts
export const nikValidator = z
  .string()
  .length(16, 'NIK harus 16 digit')
  .regex(/^\d{16}$/, 'NIK harus berupa angka');

export const emailValidator = z
  .string()
  .email('Format email tidak valid')
  .max(255, 'Email maksimal 255 karakter');

// Gunakan di multiple schemas
export const createUserSchema = z.object({
  email: emailValidator,
  // ...
});

export const updateUserSchema = z.object({
  email: emailValidator.optional(),
  // ...
});
```

### Partial Schemas

```typescript
// Create schema (semua field required)
const createSchema = z.object({
  nama: z.string().min(1),
  email: z.string().email(),
  alamat: z.string().min(1),
});

// Update schema (semua field optional)
const updateSchema = createSchema.partial();
```

### Pick/Omit

```typescript
// Base schema
const userSchema = z.object({
  id: z.number(),
  nama: z.string(),
  email: z.string().email(),
  kataSandi: z.string(),
  role: z.enum(['ADMIN', 'PETUGAS']),
});

// Login schema (hanya email dan password)
const loginSchema = userSchema.pick({ email: true, kataSandi: true });

// Public profile schema (tanpa password)
const profileSchema = userSchema.omit({ kataSandi: true });
```

## Troubleshooting

### Error: "schema tidak boleh undefined"

**Penyebab**: Schema yang diberikan ke validate() adalah undefined.

**Solusi**: Pastikan schema sudah di-import dengan benar:

```typescript
// ❌ Salah
import { createLansiaSchema } from '../utils/validators';
router.post('/lansia', validate(createLansiaSchma), handler);  // Typo!

// ✅ Benar
import { createLansiaSchema } from '../utils/validators';
router.post('/lansia', validate(createLansiaSchema), handler);
```

### Validation Tidak Berjalan

**Penyebab**: Middleware tidak dipasang atau urutan salah.

**Solusi**: Pastikan middleware dipasang sebelum controller:

```typescript
// ❌ Salah - validation setelah controller
router.post('/lansia', createLansiaController, validate(createLansiaSchema));

// ✅ Benar - validation sebelum controller
router.post('/lansia', validate(createLansiaSchema), createLansiaController);
```

### Type Mismatch

**Penyebab**: Type dari validated data tidak match dengan yang diharapkan controller.

**Solusi**: Gunakan type inference dari Zod:

```typescript
import { z } from 'zod';

const schema = z.object({
  nama: z.string(),
  umur: z.number(),
});

type SchemaType = z.infer<typeof schema>;

// Controller dengan type yang benar
const handler = (req: Request, res: Response) => {
  const data: SchemaType = req.body;  // Type-safe!
  // ...
};
```

## Extensibility

Untuk menambah validation rules baru:

1. Tambahkan schema di `validators.ts`
2. Export schema dan type
3. Gunakan di route dengan `validate()`

Tidak perlu modifikasi validateMiddleware - ini adalah contoh **Open/Closed Principle**.
