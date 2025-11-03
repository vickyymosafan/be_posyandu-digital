# Rate Limiter Middleware

## Deskripsi

Rate Limiter adalah middleware untuk membatasi jumlah requests dari IP address tertentu dalam periode waktu tertentu. Middleware ini menggunakan library `rate-limiter-flexible` untuk implementasi rate limiting yang efisien dan scalable.

## Prinsip Design

### SOLID Principles

1. **Single Responsibility**: Hanya bertanggung jawab untuk rate limiting
2. **Open/Closed**: Extensible melalui factory pattern tanpa modifikasi
3. **Liskov Substitution**: Dapat digunakan di mana saja Express middleware diperlukan
4. **Interface Segregation**: Interface sederhana untuk konfigurasi
5. **Dependency Inversion**: Depend pada rate-limiter-flexible abstraction

### Design Patterns

- **Factory Pattern**: `createRateLimiter()` menghasilkan middleware yang dikonfigurasi
- **Fail-Open**: Jika rate limiter error, request tetap diizinkan (tidak menjadi single point of failure)
- **Security by Default**: Proteksi dari brute force dan abuse

### Benefits

- **Brute Force Protection**: Proteksi dari serangan brute force pada login
- **API Abuse Prevention**: Mencegah abuse API endpoints
- **DDoS Mitigation**: Membantu mitigasi DDoS attacks
- **Configurable**: Mudah dikonfigurasi untuk berbagai use cases
- **Scalable**: Dapat di-extend ke Redis untuk distributed systems

## Penggunaan

### Basic Usage

```typescript
import { Router } from 'express';
import { createRateLimiter, loginRateLimiter } from '../middlewares';

const router = Router();

// Menggunakan pre-configured loginRateLimiter
router.post('/auth/login', loginRateLimiter, loginController);

// Atau membuat custom rate limiter
const customLimiter = createRateLimiter({
  points: 10,
  duration: 60,
  message: 'Terlalu banyak requests'
});

router.post('/api/data', customLimiter, dataController);
```

### Pre-configured Rate Limiters

#### loginRateLimiter

Rate limiter khusus untuk login endpoint dengan konfigurasi ketat.

**Konfigurasi:**
- Points: 5 attempts
- Duration: 900 detik (15 menit)
- Block Duration: 900 detik (15 menit)
- Message: "Terlalu banyak percobaan login, coba lagi nanti"

```typescript
import { loginRateLimiter } from '../middlewares';

router.post('/auth/login', loginRateLimiter, loginController);
```

#### apiRateLimiter

Rate limiter untuk API umum dengan limit yang lebih tinggi.

**Konfigurasi:**
- Points: 100 requests
- Duration: 60 detik (1 menit)
- Message: "Terlalu banyak requests, coba lagi nanti"

```typescript
import { apiRateLimiter } from '../middlewares';

// Apply ke semua routes di /api
app.use('/api', apiRateLimiter);
```

### Custom Rate Limiter

Membuat rate limiter dengan konfigurasi custom:

```typescript
import { createRateLimiter } from '../middlewares';

// Rate limiter untuk password reset (3 attempts per jam)
const passwordResetLimiter = createRateLimiter({
  points: 3,
  duration: 3600, // 1 jam
  blockDuration: 3600,
  message: 'Terlalu banyak permintaan reset password',
  keyPrefix: 'password-reset'
});

router.post('/auth/reset-password', passwordResetLimiter, resetPasswordController);
```

### Configuration Options

```typescript
interface RateLimiterOptions {
  // Jumlah maksimal requests yang diizinkan
  points?: number; // default: 5

  // Durasi window dalam detik
  duration?: number; // default: 900 (15 menit)

  // Durasi block setelah limit exceeded (dalam detik)
  blockDuration?: number; // default: sama dengan duration

  // Custom error message
  message?: string; // default: 'Terlalu banyak percobaan, coba lagi nanti'

  // Key prefix untuk identifier
  keyPrefix?: string; // default: 'rl'
}
```

## Response Format

### Success (Limit Not Exceeded)

Request diteruskan ke handler berikutnya tanpa modifikasi.

### Rate Limit Exceeded (429)

```json
{
  "error": "Terlalu banyak percobaan login, coba lagi nanti",
  "details": {
    "retryAfter": "15 menit",
    "retryAfterSeconds": 900
  }
}
```

**Headers:**
- `Retry-After`: Waktu dalam detik sebelum dapat mencoba lagi

### Example Response

```http
HTTP/1.1 429 Too Many Requests
Retry-After: 900
Content-Type: application/json

{
  "error": "Terlalu banyak percobaan login, coba lagi nanti",
  "details": {
    "retryAfter": "15 menit",
    "retryAfterSeconds": 900
  }
}
```

## Client Identification

Rate limiter mengidentifikasi client berdasarkan IP address dengan prioritas:

1. **X-Forwarded-For header** (untuk proxy/load balancer)
   - Mengambil IP pertama dari header
   - Berguna untuk deployment di belakang reverse proxy

2. **req.ip** (direct connection)
   - IP address langsung dari connection

3. **'unknown'** (fallback)
   - Jika IP tidak dapat ditentukan

```typescript
// Contoh X-Forwarded-For
X-Forwarded-For: 203.0.113.1, 198.51.100.1
// Rate limiter akan menggunakan: 203.0.113.1
```

## Use Cases

### 1. Login Protection

Proteksi dari brute force attacks pada login endpoint.

```typescript
import { loginRateLimiter } from '../middlewares';

router.post('/auth/login', loginRateLimiter, loginController);
```

**Scenario:**
- User mencoba login 5 kali dengan password salah
- Request ke-6 akan di-block selama 15 menit
- User harus menunggu sebelum dapat mencoba lagi

### 2. API Endpoint Protection

Proteksi API dari abuse dan excessive usage.

```typescript
const apiLimiter = createRateLimiter({
  points: 100,
  duration: 60,
  keyPrefix: 'api'
});

app.use('/api', apiLimiter);
```

### 3. Password Reset Protection

Proteksi endpoint password reset dari abuse.

```typescript
const resetLimiter = createRateLimiter({
  points: 3,
  duration: 3600,
  message: 'Terlalu banyak permintaan reset password',
  keyPrefix: 'reset'
});

router.post('/auth/reset-password', resetLimiter, resetController);
```

### 4. Registration Protection

Proteksi endpoint registrasi dari spam.

```typescript
const registerLimiter = createRateLimiter({
  points: 5,
  duration: 3600,
  message: 'Terlalu banyak percobaan registrasi',
  keyPrefix: 'register'
});

router.post('/auth/register', registerLimiter, registerController);
```

## Logging

Rate limiter secara otomatis log events penting:

### Rate Limiter Creation

```typescript
{
  level: 'info',
  message: 'Rate limiter created',
  context: {
    points: 5,
    duration: 900,
    blockDuration: 900,
    keyPrefix: 'login'
  }
}
```

### Rate Limit Check Passed

```typescript
{
  level: 'debug',
  message: 'Rate limit check passed',
  context: {
    clientId: '203.0.113.1',
    key: 'login:203.0.113.1',
    path: '/api/auth/login',
    method: 'POST'
  }
}
```

### Rate Limit Exceeded

```typescript
{
  level: 'warn',
  message: 'Rate limit exceeded',
  context: {
    clientId: '203.0.113.1',
    path: '/api/auth/login',
    method: 'POST',
    remainingPoints: 0,
    msBeforeNext: 900000,
    retryAfter: 900,
    consumedPoints: 6
  }
}
```

## Security Considerations

### Fail-Open Strategy

Jika rate limiter mengalami error (misalnya memory issue), middleware akan **fail-open** dan mengizinkan request. Ini mencegah rate limiter menjadi single point of failure.

```typescript
catch (error) {
  if (error instanceof RateLimiterRes) {
    // Rate limit exceeded - block request
    return res.status(429).json(...);
  }
  
  // Unexpected error - fail open
  logger.error('Rate limiter error', ...);
  next(); // Izinkan request
}
```

### IP Spoofing Protection

Rate limiter menggunakan X-Forwarded-For header dengan hati-hati:
- Hanya mengambil IP pertama dari header
- Fallback ke req.ip jika header tidak ada
- Berguna untuk deployment di belakang trusted proxy

**Important:** Pastikan proxy/load balancer dikonfigurasi dengan benar untuk set X-Forwarded-For header.

### Distributed Systems

Untuk production dengan multiple servers, pertimbangkan menggunakan Redis sebagai store:

```typescript
import { RateLimiterRedis } from 'rate-limiter-flexible';
import Redis from 'ioredis';

const redisClient = new Redis({
  host: process.env.REDIS_HOST,
  port: parseInt(process.env.REDIS_PORT || '6379'),
});

const rateLimiter = new RateLimiterRedis({
  storeClient: redisClient,
  points: 5,
  duration: 900,
  keyPrefix: 'login',
});
```

## Testing

### Unit Testing Rate Limiter

```typescript
import request from 'supertest';
import app from '../app';

describe('Login Rate Limiter', () => {
  it('harus allow requests dalam limit', async () => {
    for (let i = 0; i < 5; i++) {
      const response = await request(app)
        .post('/api/auth/login')
        .send({ email: 'test@test.com', kataSandi: 'wrong' });
      
      expect(response.status).not.toBe(429);
    }
  });
  
  it('harus block request setelah limit exceeded', async () => {
    // Exhaust the limit
    for (let i = 0; i < 5; i++) {
      await request(app)
        .post('/api/auth/login')
        .send({ email: 'test@test.com', kataSandi: 'wrong' });
    }
    
    // Next request should be blocked
    const response = await request(app)
      .post('/api/auth/login')
      .send({ email: 'test@test.com', kataSandi: 'wrong' });
    
    expect(response.status).toBe(429);
    expect(response.body.error).toContain('Terlalu banyak');
    expect(response.headers['retry-after']).toBeDefined();
  });
  
  it('harus include Retry-After header', async () => {
    // Exhaust the limit
    for (let i = 0; i < 5; i++) {
      await request(app)
        .post('/api/auth/login')
        .send({ email: 'test@test.com', kataSandi: 'wrong' });
    }
    
    const response = await request(app)
      .post('/api/auth/login')
      .send({ email: 'test@test.com', kataSandi: 'wrong' });
    
    expect(response.headers['retry-after']).toBeDefined();
    const retryAfter = parseInt(response.headers['retry-after']);
    expect(retryAfter).toBeGreaterThan(0);
  });
});
```

### Integration Testing

```typescript
describe('Rate Limiter Integration', () => {
  it('harus track per IP address', async () => {
    // Request dari IP 1
    for (let i = 0; i < 5; i++) {
      await request(app)
        .post('/api/auth/login')
        .set('X-Forwarded-For', '203.0.113.1')
        .send({ email: 'test@test.com', kataSandi: 'wrong' });
    }
    
    // Request dari IP 2 harus masih allowed
    const response = await request(app)
      .post('/api/auth/login')
      .set('X-Forwarded-For', '203.0.113.2')
      .send({ email: 'test@test.com', kataSandi: 'wrong' });
    
    expect(response.status).not.toBe(429);
  });
});
```

## Best Practices

1. **Use Pre-configured Limiters**: Gunakan `loginRateLimiter` untuk login endpoint
2. **Set Appropriate Limits**: Sesuaikan points dan duration dengan use case
3. **Use Key Prefix**: Gunakan key prefix yang descriptive untuk debugging
4. **Monitor Logs**: Monitor rate limit hits untuk detect attacks
5. **Test Thoroughly**: Test rate limiter dengan berbagai scenarios
6. **Consider Redis**: Untuk production dengan multiple servers, gunakan Redis
7. **Document Limits**: Document rate limits di API documentation
8. **Provide Clear Messages**: Gunakan error messages yang jelas dan helpful

## Common Patterns

### Endpoint-Specific Limiters

```typescript
// Login - strict limit
const loginLimiter = createRateLimiter({
  points: 5,
  duration: 900,
  keyPrefix: 'login'
});

// Password reset - very strict
const resetLimiter = createRateLimiter({
  points: 3,
  duration: 3600,
  keyPrefix: 'reset'
});

// API - moderate limit
const apiLimiter = createRateLimiter({
  points: 100,
  duration: 60,
  keyPrefix: 'api'
});
```

### Combining with Other Middlewares

```typescript
import { authMiddleware, validateBody, loginRateLimiter } from '../middlewares';
import { loginRequestSchema } from '../utils/validators';

router.post(
  '/auth/login',
  loginRateLimiter,              // 1. Rate limiting
  validateBody(loginRequestSchema), // 2. Validation
  loginController                // 3. Controller
);
```

**Urutan yang direkomendasikan:**
1. Rate Limiter (paling awal untuk proteksi)
2. Validation
3. Authentication
4. Authorization
5. Controller

## Troubleshooting

### Rate Limiter Tidak Bekerja

**Penyebab**: Rate limiter tidak dipasang atau dipasang di posisi yang salah.

**Solusi**: Pastikan rate limiter dipasang sebelum controller:

```typescript
// ✅ Benar
router.post('/auth/login', loginRateLimiter, loginController);

// ❌ Salah - setelah controller
router.post('/auth/login', loginController, loginRateLimiter);
```

### Semua Requests Di-block

**Penyebab**: Limit terlalu ketat atau IP tidak teridentifikasi dengan benar.

**Solusi**: 
1. Check logs untuk melihat client identifier
2. Adjust points dan duration
3. Verify X-Forwarded-For header configuration

### Rate Limit Tidak Reset

**Penyebab**: Duration atau blockDuration terlalu lama.

**Solusi**: Adjust configuration:

```typescript
const limiter = createRateLimiter({
  points: 5,
  duration: 60, // 1 menit instead of 15
  blockDuration: 60
});
```

## Extensibility

### Adding Redis Support

Untuk production dengan multiple servers:

```typescript
import { RateLimiterRedis } from 'rate-limiter-flexible';
import Redis from 'ioredis';

export const createRedisRateLimiter = (options: RateLimiterOptions = {}) => {
  const redisClient = new Redis({
    host: process.env.REDIS_HOST,
    port: parseInt(process.env.REDIS_PORT || '6379'),
  });

  const config = {
    ...DEFAULT_OPTIONS,
    ...options,
  };

  const rateLimiter = new RateLimiterRedis({
    storeClient: redisClient,
    points: config.points,
    duration: config.duration,
    blockDuration: options.blockDuration,
    keyPrefix: config.keyPrefix,
  });

  // Return middleware...
};
```

### Custom Identifier

Untuk rate limiting berdasarkan user ID instead of IP:

```typescript
const getUserIdentifier = (req: Request): string => {
  return req.user?.userId?.toString() || getClientIdentifier(req);
};
```

## Monitoring

Monitor rate limiter metrics untuk detect attacks dan adjust limits:

- **Rate limit hits**: Jumlah requests yang di-block
- **Top blocked IPs**: IP addresses yang paling sering di-block
- **Endpoint-specific metrics**: Rate limit hits per endpoint
- **Time-based patterns**: Patterns of rate limit hits over time

```typescript
// Example monitoring log query
// Find top blocked IPs in last hour
{
  level: 'warn',
  message: 'Rate limit exceeded',
  timestamp: { $gte: Date.now() - 3600000 }
}
// Group by clientId and count
```
