## Error Handler Middleware

## Deskripsi

Error Handler adalah global error handling middleware untuk Express application. Middleware ini menangkap semua errors yang di-throw atau di-pass ke `next(error)`, memformat errors dengan konsisten, dan mengembalikan response yang sesuai ke client.

## Prinsip Design

### SOLID Principles

1. **Single Responsibility**: Hanya bertanggung jawab untuk error handling dan formatting
2. **Open/Closed**: Dapat handle error types baru tanpa modifikasi middleware
3. **Liskov Substitution**: Semua custom error classes dapat digunakan sebagai Error
4. **Dependency Inversion**: Depend pada Error abstraction, bukan implementasi konkret

### Design Patterns

- **Centralized Error Handling**: Semua errors di-handle di satu tempat
- **Fail-Safe**: Selalu return response, tidak pernah crash
- **Security by Default**: Tidak expose sensitive information di production

### Benefits

- **Consistent Error Format**: Semua errors memiliki format yang sama
- **Automatic Logging**: Semua errors di-log secara otomatis
- **Type-Safe**: Custom error classes dengan TypeScript
- **Production-Ready**: Security considerations untuk production environment
- **Debugging-Friendly**: Stack traces dan details di development

## Custom Error Classes

### AppError (Base Class)

Base class untuk semua application errors. Tidak digunakan langsung.

```typescript
class AppError extends Error {
  statusCode: number;
  isOperational: boolean;
}
```

### ValidationError - 400

Untuk validation errors yang tidak di-handle oleh Zod middleware.

```typescript
import { ValidationError } from '../utils/errors';

// Dengan details
throw new ValidationError('NIK sudah terdaftar', {
  nik: '1234567890123456',
  field: 'nik'
});

// Tanpa details
throw new ValidationError('Data tidak valid');
```

### AuthenticationError - 401

Untuk authentication failures.

```typescript
import { AuthenticationError } from '../utils/errors';

throw new AuthenticationError('Email atau kata sandi salah');
throw new AuthenticationError('Token autentikasi telah kadaluarsa');
throw new AuthenticationError(); // Default: "Autentikasi diperlukan"
```

### AuthorizationError - 403

Untuk authorization failures.

```typescript
import { AuthorizationError } from '../utils/errors';

throw new AuthorizationError('Akses ditolak');
throw new AuthorizationError('Hanya admin yang dapat mengakses resource ini');
throw new AuthorizationError(); // Default: "Akses ditolak"
```

### NotFoundError - 404

Untuk resource not found errors.

```typescript
import { NotFoundError } from '../utils/errors';

throw new NotFoundError('Lansia tidak ditemukan');
throw new NotFoundError('User dengan email tersebut tidak ditemukan', 'User');
throw new NotFoundError(); // Default: "Resource tidak ditemukan"
```

### BusinessLogicError - 400

Untuk business logic violations.

```typescript
import { BusinessLogicError } from '../utils/errors';

throw new BusinessLogicError('Tidak dapat menghapus user yang masih aktif');
throw new BusinessLogicError('Pemeriksaan hanya dapat dilakukan untuk lansia yang terdaftar');
```

### ConflictError - 409

Untuk conflict errors (duplicates, concurrent modifications).

```typescript
import { ConflictError } from '../utils/errors';

throw new ConflictError('Email sudah terdaftar');
throw new ConflictError('NIK sudah terdaftar');
```

### InternalServerError - 500

Untuk unexpected errors.

```typescript
import { InternalServerError } from '../utils/errors';

throw new InternalServerError('Gagal menghasilkan kode pasien unik');
throw new InternalServerError('Database connection failed');
throw new InternalServerError(); // Default: "Terjadi kesalahan pada sistem"
```

## Penggunaan

### Setup di Express App

Error handler harus dipasang sebagai middleware **terakhir** di Express app, setelah semua routes.

```typescript
import express from 'express';
import { errorHandler, notFoundHandler } from './middlewares';

const app = express();

// ... middlewares lain ...
// ... routes ...

// 404 handler (setelah semua routes)
app.use(notFoundHandler);

// Error handler (paling terakhir)
app.use(errorHandler);

export default app;
```

### Throwing Errors di Services

```typescript
import { NotFoundError, ValidationError } from '../utils/errors';

export const getLansiaByKode = async (kode: string) => {
  const lansia = await lansiaRepository.findByKode(kode);
  
  if (!lansia) {
    throw new NotFoundError('Lansia tidak ditemukan');
  }
  
  return lansia;
};

export const createLansia = async (data: CreateLansiaDTO) => {
  // Check NIK uniqueness
  const existingNik = await lansiaRepository.findByNIK(data.nik);
  if (existingNik) {
    throw new ValidationError('NIK sudah terdaftar', { nik: data.nik });
  }
  
  // ... create lansia ...
};
```

### Throwing Errors di Controllers

```typescript
import { AuthorizationError } from '../utils/errors';

export const deleteUser = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = parseInt(req.params.id);
    
    // Check authorization
    if (req.user?.userId !== userId && req.user?.role !== 'ADMIN') {
      throw new AuthorizationError('Anda tidak memiliki akses untuk menghapus user ini');
    }
    
    await userService.deleteUser(userId);
    
    res.status(200).json({ message: 'User berhasil dihapus' });
  } catch (error) {
    next(error); // Pass error ke error handler
  }
};
```

### Async Error Handling

Untuk async functions, gunakan try-catch dan pass error ke `next()`:

```typescript
export const createLansia = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = req.body;
    const lansia = await lansiaService.createLansia(data);
    
    res.status(201).json(lansia);
  } catch (error) {
    next(error); // Error akan di-handle oleh errorHandler
  }
};
```

Atau gunakan wrapper untuk menghindari repetitive try-catch:

```typescript
// utils/asyncHandler.ts
export const asyncHandler = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

// Usage
export const createLansia = asyncHandler(async (req: Request, res: Response) => {
  const data = req.body;
  const lansia = await lansiaService.createLansia(data);
  
  res.status(201).json(lansia);
});
```

## Error Response Format

### Success Response (Non-Error)

```json
{
  "id": 1,
  "nama": "Test Lansia",
  "kode": "pasien20250103AB"
}
```

### Error Response (Basic)

```json
{
  "error": "Lansia tidak ditemukan"
}
```

### Error Response (With Details)

```json
{
  "error": "NIK sudah terdaftar",
  "details": {
    "nik": "1234567890123456",
    "field": "nik"
  }
}
```

### Error Response (Validation - Zod)

```json
{
  "error": "Validasi input gagal",
  "details": {
    "nik": ["NIK harus 16 digit"],
    "email": ["Format email tidak valid"]
  }
}
```

### Error Response (Development Only)

Di development, response juga include stack trace:

```json
{
  "error": "Lansia tidak ditemukan",
  "stack": "NotFoundError: Lansia tidak ditemukan\n    at getLansiaByKode (/app/services/lansiaService.ts:45:11)\n    ..."
}
```

## HTTP Status Codes

| Status Code | Error Class | Description |
|-------------|-------------|-------------|
| 400 | ValidationError, BusinessLogicError | Bad Request - Invalid input atau business rule violation |
| 401 | AuthenticationError | Unauthorized - Authentication required atau failed |
| 403 | AuthorizationError | Forbidden - Insufficient permissions |
| 404 | NotFoundError | Not Found - Resource tidak ditemukan |
| 409 | ConflictError | Conflict - Duplicate resource atau concurrent modification |
| 500 | InternalServerError, Generic Error | Internal Server Error - Unexpected error |

## Logging

Error handler secara otomatis log semua errors dengan level yang sesuai:

### Error Level (500)

Untuk server errors dan unexpected errors:

```typescript
{
  level: 'error',
  message: 'Unexpected error',
  context: {
    path: '/api/lansia',
    method: 'POST',
    ip: '192.168.1.1',
    userAgent: 'Mozilla/5.0...',
    userId: 1,
    error: 'Database connection failed',
    statusCode: 500,
    stack: '...',
    errorName: 'Error'
  }
}
```

### Warn Level (4xx)

Untuk client errors:

```typescript
{
  level: 'warn',
  message: 'Client error',
  context: {
    path: '/api/lansia/pasien20250103XX',
    method: 'GET',
    ip: '192.168.1.1',
    userAgent: 'Mozilla/5.0...',
    userId: 1,
    error: 'Lansia tidak ditemukan',
    statusCode: 404
  }
}
```

## Security Considerations

### Production vs Development

**Development:**
- Expose stack traces
- Include all error details
- Use actual error messages

**Production:**
- No stack traces
- Generic messages untuk non-operational errors
- Only include details untuk operational errors

### Operational vs Non-Operational Errors

**Operational Errors** (Expected, dapat di-handle):
- ValidationError
- AuthenticationError
- AuthorizationError
- NotFoundError
- BusinessLogicError
- ConflictError

**Non-Operational Errors** (Bugs, perlu di-fix):
- InternalServerError
- Generic Error
- Unexpected exceptions

Di production, non-operational errors menggunakan generic message: "Terjadi kesalahan pada sistem"

### Sensitive Information

Error handler tidak pernah expose:
- Database connection strings
- Internal file paths (di production)
- Stack traces (di production)
- User passwords atau tokens
- Internal implementation details

## Testing

### Unit Testing Error Classes

```typescript
import { NotFoundError, ValidationError } from '../utils/errors';

describe('NotFoundError', () => {
  it('harus memiliki statusCode 404', () => {
    const error = new NotFoundError('Resource not found');
    expect(error.statusCode).toBe(404);
  });
  
  it('harus operational error', () => {
    const error = new NotFoundError('Resource not found');
    expect(error.isOperational).toBe(true);
  });
});

describe('ValidationError', () => {
  it('harus include details', () => {
    const details = { field: 'email', value: 'invalid' };
    const error = new ValidationError('Invalid email', details);
    
    expect(error.statusCode).toBe(400);
    expect(error.details).toEqual(details);
  });
});
```

### Integration Testing Error Handler

```typescript
import request from 'supertest';
import app from '../app';

describe('Error Handler', () => {
  it('harus return 404 untuk route tidak ditemukan', async () => {
    const response = await request(app).get('/api/nonexistent');
    
    expect(response.status).toBe(404);
    expect(response.body).toHaveProperty('error');
    expect(response.body.error).toContain('tidak ditemukan');
  });
  
  it('harus return 400 untuk validation error', async () => {
    const response = await request(app)
      .post('/api/lansia')
      .send({ nik: '123' }); // Invalid NIK
    
    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty('error');
    expect(response.body).toHaveProperty('details');
  });
  
  it('harus return 401 untuk unauthorized access', async () => {
    const response = await request(app).get('/api/profile');
    
    expect(response.status).toBe(401);
    expect(response.body.error).toBe('Autentikasi diperlukan');
  });
});
```

## Best Practices

1. **Always use custom error classes**: Jangan throw generic Error
2. **Provide meaningful messages**: Error messages harus jelas dan actionable
3. **Include details when helpful**: Untuk validation errors, include field-level details
4. **Use appropriate error types**: Pilih error class yang sesuai dengan situasi
5. **Don't expose sensitive info**: Jangan include passwords, tokens, atau internal details
6. **Log all errors**: Error handler sudah handle logging, tidak perlu log manual
7. **Test error scenarios**: Write tests untuk semua error cases
8. **Document error responses**: Document expected errors di API documentation

## Common Patterns

### Service Layer Error Handling

```typescript
export const createLansia = async (data: CreateLansiaDTO) => {
  // Validation
  const existingNik = await lansiaRepository.findByNIK(data.nik);
  if (existingNik) {
    throw new ConflictError('NIK sudah terdaftar');
  }
  
  // Business logic
  try {
    const kode = await generatePatientId({ tanggal: new Date() });
    const lansia = await lansiaRepository.create({ ...data, kode });
    return lansia;
  } catch (error) {
    // Re-throw dengan context
    throw new InternalServerError('Gagal membuat data lansia');
  }
};
```

### Controller Layer Error Handling

```typescript
export const createLansia = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = req.body; // Already validated by validateMiddleware
    const lansia = await lansiaService.createLansia(data);
    
    res.status(201).json(lansia);
  } catch (error) {
    next(error); // Pass ke error handler
  }
};
```

### Repository Layer Error Handling

```typescript
export const findByKode = async (kode: string) => {
  try {
    const lansia = await prisma.lansia.findUnique({
      where: { kode },
    });
    return lansia;
  } catch (error) {
    // Log dan re-throw
    logger.error('Database error', { error, kode });
    throw new InternalServerError('Gagal mengambil data lansia');
  }
};
```

## Troubleshooting

### Error tidak ter-catch

**Penyebab**: Error handler tidak dipasang atau dipasang di posisi yang salah.

**Solusi**: Pastikan error handler dipasang sebagai middleware terakhir:

```typescript
// ✅ Benar
app.use('/api', routes);
app.use(notFoundHandler);
app.use(errorHandler);

// ❌ Salah - error handler sebelum routes
app.use(errorHandler);
app.use('/api', routes);
```

### Stack trace tidak muncul di development

**Penyebab**: NODE_ENV tidak di-set ke 'development'.

**Solusi**: Set environment variable:

```bash
NODE_ENV=development npm run dev
```

### Generic error message di development

**Penyebab**: Error bukan instance dari AppError.

**Solusi**: Gunakan custom error classes:

```typescript
// ❌ Salah
throw new Error('Something went wrong');

// ✅ Benar
throw new InternalServerError('Something went wrong');
```

## Extensibility

Untuk menambah error type baru:

1. Tambahkan class di `utils/errors.ts`:

```typescript
export class RateLimitError extends AppError {
  constructor(message: string = 'Terlalu banyak percobaan') {
    super(message, 429);
    Object.setPrototypeOf(this, RateLimitError.prototype);
  }
}
```

2. Gunakan di aplikasi:

```typescript
import { RateLimitError } from '../utils/errors';

if (attempts > maxAttempts) {
  throw new RateLimitError('Terlalu banyak percobaan login');
}
```

Error handler akan otomatis handle error type baru tanpa modifikasi - ini adalah contoh **Open/Closed Principle**.
