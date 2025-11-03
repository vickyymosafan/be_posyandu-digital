# Logger Utility

Dokumentasi untuk logger utility Sistem Backend Posyandu Lansia.

## Overview

Logger utility menggunakan Winston untuk structured logging dengan support untuk multiple log levels, environment-specific formatting, dan timezone-aware timestamps.

## Features

- ✅ **Multiple Log Levels**: error, warn, info, debug
- ✅ **Environment-Specific Formatting**: 
  - Development: Colorized, human-readable
  - Production: JSON format untuk easy parsing
  - Test: Silent mode
- ✅ **Structured Logging**: Support untuk context/metadata
- ✅ **Timezone-Aware**: Timestamps dengan timezone Asia/Jakarta (configurable)
- ✅ **File Logging**: Automatic file logging di production
- ✅ **Type-Safe**: Full TypeScript support

## Usage

### Basic Logging

```typescript
import logger from './utils/logger';

// Info level
logger.info('Server started successfully');

// Warning level
logger.warn('API rate limit approaching threshold');

// Error level
logger.error('Database connection failed');

// Debug level (hanya muncul di development)
logger.debug('Processing user request');
```

### Logging dengan Context

```typescript
import logger from './utils/logger';

// Login event
logger.info('User logged in', {
  userId: 1,
  email: 'user@example.com',
  ip: '192.168.1.1',
});

// Error dengan detail
logger.error('Database query failed', {
  error: err.message,
  query: 'SELECT * FROM users WHERE id = ?',
  params: [userId],
});

// Rate limit warning
logger.warn('Rate limit exceeded', {
  ip: '192.168.1.100',
  endpoint: '/api/auth/login',
  attempts: 6,
});

// Debug dengan request info
logger.debug('Processing request', {
  method: 'POST',
  path: '/api/lansia',
  body: { nik: '1234567890123456' },
});
```

### Logging di Services

```typescript
import logger from '../utils/logger';

export class AuthService {
  async login(email: string, password: string) {
    try {
      logger.info('Login attempt', { email });
      
      const user = await this.userRepository.findByEmail(email);
      
      if (!user) {
        logger.warn('Login failed - user not found', { email });
        throw new AuthenticationError('Email atau kata sandi salah');
      }
      
      const isValid = await bcrypt.compare(password, user.kataSandi);
      
      if (!isValid) {
        logger.warn('Login failed - invalid password', { email, userId: user.id });
        throw new AuthenticationError('Email atau kata sandi salah');
      }
      
      logger.info('Login successful', { userId: user.id, email: user.email });
      
      return user;
    } catch (error) {
      logger.error('Login error', { 
        email, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
      throw error;
    }
  }
}
```

### Logging di Middlewares

```typescript
import logger from '../utils/logger';

export const authMiddleware = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const token = req.cookies.token;
    
    if (!token) {
      logger.warn('Authentication failed - no token', { 
        path: req.path,
        ip: req.ip 
      });
      return res.status(401).json({ error: 'Autentikasi diperlukan' });
    }
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET!);
    req.user = decoded;
    
    logger.debug('Authentication successful', { 
      userId: decoded.userId,
      path: req.path 
    });
    
    next();
  } catch (error) {
    logger.error('Authentication error', { 
      path: req.path,
      error: error instanceof Error ? error.message : 'Unknown error' 
    });
    return res.status(401).json({ error: 'Token tidak valid' });
  }
};
```

## Configuration

### Environment Variables

| Variable | Description | Default | Values |
|----------|-------------|---------|--------|
| `LOG_LEVEL` | Minimum log level to output | Based on NODE_ENV | error, warn, info, debug |
| `NODE_ENV` | Environment mode | development | development, production, test |
| `TIMEZONE` | Timezone untuk timestamps | Asia/Jakarta | Any valid timezone |

### Default Log Levels by Environment

- **Production**: `info` (info, warn, error)
- **Development**: `debug` (all levels)
- **Test**: `error` (only errors)

### Example Configuration

**.env.development:**
```env
NODE_ENV=development
LOG_LEVEL=debug
TIMEZONE=Asia/Jakarta
```

**.env.production:**
```env
NODE_ENV=production
LOG_LEVEL=info
TIMEZONE=Asia/Jakarta
```

**.env.test:**
```env
NODE_ENV=test
LOG_LEVEL=error
```

## Output Formats

### Development Format

Colorized, human-readable output:

```
2025-11-03 10:30:45 [info]: User logged in
  Context: {
    "userId": 1,
    "email": "user@example.com",
    "ip": "192.168.1.1"
  }

2025-11-03 10:31:20 [error]: Database connection failed
  Context: {
    "error": "Connection timeout",
    "host": "localhost",
    "port": 5432
  }
```

### Production Format

JSON format untuk easy parsing:

```json
{"timestamp":"2025-11-03 10:30:45","level":"info","message":"User logged in","context":{"userId":1,"email":"user@example.com","ip":"192.168.1.1"}}
{"timestamp":"2025-11-03 10:31:20","level":"error","message":"Database connection failed","context":{"error":"Connection timeout","host":"localhost","port":5432"}}
```

## File Logging (Production Only)

Di production environment, logs otomatis disimpan ke files:

### Log Files

- **logs/error.log**: Hanya error level logs
- **logs/combined.log**: Semua level logs

### File Rotation

- **Max Size**: 5MB per file
- **Max Files**: 5 files (oldest akan dihapus otomatis)
- **Total Storage**: ~25MB per log type

### Log File Location

```
backend/
├── logs/
│   ├── error.log       # Error logs only
│   ├── error.log.1     # Rotated error logs
│   ├── combined.log    # All logs
│   └── combined.log.1  # Rotated combined logs
```

## Log Levels

### Error

Untuk errors yang perlu immediate attention:

```typescript
logger.error('Critical database error', { 
  error: err.message,
  stack: err.stack 
});
```

**When to use:**
- Database connection failures
- Unhandled exceptions
- Critical system errors
- Failed authentication attempts (after multiple tries)

### Warn

Untuk potential issues yang perlu monitoring:

```typescript
logger.warn('Rate limit approaching', { 
  ip: '192.168.1.1',
  currentAttempts: 4,
  maxAttempts: 5 
});
```

**When to use:**
- Rate limit hits
- Validation failures
- Deprecated API usage
- Resource usage warnings

### Info

Untuk important events dan milestones:

```typescript
logger.info('User registered', { 
  userId: 123,
  email: 'user@example.com' 
});
```

**When to use:**
- User login/logout
- Data creation (lansia, pemeriksaan)
- Configuration changes
- Server startup/shutdown

### Debug

Untuk detailed information saat debugging:

```typescript
logger.debug('Processing request', { 
  method: 'POST',
  path: '/api/lansia',
  body: requestBody 
});
```

**When to use:**
- Request/response details
- Function entry/exit
- Variable values
- Flow control information

## Best Practices

### DO ✅

```typescript
// Include relevant context
logger.info('Lansia created', { 
  lansiaId: lansia.id,
  kode: lansia.kode,
  createdBy: user.id 
});

// Log errors with details
logger.error('Failed to create lansia', { 
  error: err.message,
  nik: data.nik,
  userId: user.id 
});

// Use appropriate log levels
logger.warn('NIK already exists', { nik: data.nik });
logger.info('Pemeriksaan completed', { pemeriksaanId: id });
logger.debug('Calculating BMI', { berat, tinggi });
```

### DON'T ❌

```typescript
// Jangan log sensitive data
logger.info('User logged in', { 
  password: user.password  // ❌ NEVER log passwords
});

// Jangan log terlalu verbose di production
logger.debug('Variable x =', x);  // ❌ Too verbose for production

// Jangan log tanpa context
logger.error('Error occurred');  // ❌ No context, hard to debug

// Jangan log PII tanpa masking
logger.info('User data', { 
  nik: '1234567890123456'  // ⚠️ Consider masking: '1234********3456'
});
```

### Sensitive Data Handling

```typescript
// Mask sensitive data
const maskNIK = (nik: string) => {
  return nik.slice(0, 4) + '********' + nik.slice(-4);
};

logger.info('Lansia created', { 
  lansiaId: lansia.id,
  nik: maskNIK(lansia.nik),  // ✅ Masked
  nama: lansia.nama 
});

// Exclude passwords completely
const { kataSandi, ...safeUserData } = user;
logger.info('User updated', safeUserData);  // ✅ Password excluded
```

## TypeScript Support

### Type Definitions

```typescript
import logger, { LogContext } from './utils/logger';

// Context is type-safe
const context: LogContext = {
  userId: 1,
  email: 'user@example.com',
  timestamp: new Date(),
};

logger.info('User action', context);
```

### Custom Context Types

```typescript
interface UserContext {
  userId: number;
  email: string;
  role: string;
}

const logUserAction = (message: string, context: UserContext) => {
  logger.info(message, context);
};

logUserAction('User logged in', {
  userId: 1,
  email: 'user@example.com',
  role: 'ADMIN',
});
```

## Testing

### Mocking Logger in Tests

```typescript
import logger from '../utils/logger';

// Mock logger untuk tests
jest.mock('../utils/logger', () => ({
  default: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
  },
}));

describe('AuthService', () => {
  it('should log successful login', async () => {
    await authService.login('user@example.com', 'password');
    
    expect(logger.info).toHaveBeenCalledWith(
      'Login successful',
      expect.objectContaining({ email: 'user@example.com' })
    );
  });
});
```

### Silent Mode in Tests

Logger otomatis silent di test environment (NODE_ENV=test), jadi tidak perlu mock jika hanya ingin suppress output.

## Troubleshooting

### Logs tidak muncul

**Check:**
1. LOG_LEVEL environment variable
2. NODE_ENV setting
3. Console transport configuration

```typescript
// Temporary debug
console.log('Current log level:', process.env.LOG_LEVEL);
console.log('Current environment:', process.env.NODE_ENV);
```

### File logs tidak dibuat (Production)

**Check:**
1. NODE_ENV harus 'production'
2. Directory `logs/` harus exist dan writable
3. Disk space available

```bash
# Create logs directory
mkdir -p logs

# Check permissions
ls -la logs/
```

### Timestamps tidak sesuai timezone

**Check:**
1. TIMEZONE environment variable
2. System timezone configuration

```typescript
// Check current timezone
console.log('Timezone:', process.env.TIMEZONE || 'Asia/Jakarta');
```

## Related

- [Winston Documentation](https://github.com/winstonjs/winston)
- [Log Levels Best Practices](https://www.loggly.com/ultimate-guide/node-logging-basics/)
- [Structured Logging](https://www.honeycomb.io/blog/structured-logging-and-your-team)
