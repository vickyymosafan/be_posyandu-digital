/**
 * Custom Error Classes untuk Sistem Backend Posyandu Lansia
 * 
 * File ini berisi custom error classes yang digunakan di seluruh aplikasi
 * untuk error handling yang konsisten dan type-safe.
 * 
 * Prinsip yang diterapkan:
 * - Single Responsibility: Setiap error class merepresentasikan satu jenis error
 * - Open/Closed: Dapat menambah error types baru tanpa modifikasi existing code
 * - Liskov Substitution: Semua error classes dapat digunakan sebagai Error
 * - Type Safety: TypeScript untuk compile-time error checking
 */

/**
 * Base class untuk semua application errors
 * Extends Error dan menambahkan statusCode property
 * 
 * Tidak digunakan langsung, tapi sebagai base untuk error classes lain
 */
export class AppError extends Error {
  public readonly statusCode: number;
  public readonly isOperational: boolean;

  constructor(message: string, statusCode: number, isOperational = true) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;

    // Maintain proper stack trace (only available on V8)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }

    // Set the prototype explicitly untuk instanceof checks
    Object.setPrototypeOf(this, AppError.prototype);
  }
}

/**
 * ValidationError - 400 Bad Request
 * 
 * Digunakan untuk validation errors yang tidak di-handle oleh Zod middleware.
 * Contoh: Business validation rules, custom validations
 * 
 * @property details - Optional details tentang validation errors
 * 
 * @example
 * throw new ValidationError('NIK sudah terdaftar', { nik: '1234567890123456' });
 */
export class ValidationError extends AppError {
  public readonly details?: any;

  constructor(message: string, details?: any) {
    super(message, 400);
    this.details = details;
    Object.setPrototypeOf(this, ValidationError.prototype);
  }
}

/**
 * AuthenticationError - 401 Unauthorized
 * 
 * Digunakan untuk authentication failures.
 * Contoh: Invalid credentials, expired token, missing token
 * 
 * @example
 * throw new AuthenticationError('Email atau kata sandi salah');
 * throw new AuthenticationError('Token autentikasi telah kadaluarsa');
 */
export class AuthenticationError extends AppError {
  constructor(message: string = 'Autentikasi diperlukan') {
    super(message, 401);
    Object.setPrototypeOf(this, AuthenticationError.prototype);
  }
}

/**
 * AuthorizationError - 403 Forbidden
 * 
 * Digunakan untuk authorization failures.
 * Contoh: Insufficient permissions, role mismatch
 * 
 * @example
 * throw new AuthorizationError('Akses ditolak');
 * throw new AuthorizationError('Hanya admin yang dapat mengakses resource ini');
 */
export class AuthorizationError extends AppError {
  constructor(message: string = 'Akses ditolak') {
    super(message, 403);
    Object.setPrototypeOf(this, AuthorizationError.prototype);
  }
}

/**
 * NotFoundError - 404 Not Found
 * 
 * Digunakan ketika resource tidak ditemukan.
 * Contoh: User not found, Lansia not found, Record not found
 * 
 * @property resource - Optional nama resource yang tidak ditemukan
 * 
 * @example
 * throw new NotFoundError('Lansia tidak ditemukan');
 * throw new NotFoundError('User dengan email tersebut tidak ditemukan', 'User');
 */
export class NotFoundError extends AppError {
  public readonly resource?: string;

  constructor(message: string = 'Resource tidak ditemukan', resource?: string) {
    super(message, 404);
    this.resource = resource;
    Object.setPrototypeOf(this, NotFoundError.prototype);
  }
}

/**
 * BusinessLogicError - 400 Bad Request
 * 
 * Digunakan untuk business logic errors.
 * Contoh: Invalid state transitions, business rule violations
 * 
 * @example
 * throw new BusinessLogicError('Tidak dapat menghapus user yang masih aktif');
 * throw new BusinessLogicError('Pemeriksaan hanya dapat dilakukan untuk lansia yang terdaftar');
 */
export class BusinessLogicError extends AppError {
  constructor(message: string) {
    super(message, 400);
    Object.setPrototypeOf(this, BusinessLogicError.prototype);
  }
}

/**
 * ConflictError - 409 Conflict
 * 
 * Digunakan untuk conflict errors (duplicate resources, concurrent modifications).
 * Contoh: Email already exists, NIK already registered
 * 
 * @example
 * throw new ConflictError('Email sudah terdaftar');
 * throw new ConflictError('NIK sudah terdaftar');
 */
export class ConflictError extends AppError {
  constructor(message: string) {
    super(message, 409);
    Object.setPrototypeOf(this, ConflictError.prototype);
  }
}

/**
 * RateLimitError - 429 Too Many Requests
 * 
 * Digunakan ketika user melebihi rate limit.
 * Contoh: Too many login attempts, API rate limit exceeded
 * 
 * @property retryAfter - Optional waktu dalam detik sebelum dapat mencoba lagi
 * 
 * @example
 * throw new RateLimitError('Terlalu banyak percobaan login');
 * throw new RateLimitError('Terlalu banyak percobaan, coba lagi nanti', 900);
 */
export class RateLimitError extends AppError {
  public readonly retryAfter?: number;

  constructor(
    message: string = 'Terlalu banyak percobaan, coba lagi nanti',
    retryAfter?: number
  ) {
    super(message, 429);
    this.retryAfter = retryAfter;
    Object.setPrototypeOf(this, RateLimitError.prototype);
  }
}

/**
 * InternalServerError - 500 Internal Server Error
 * 
 * Digunakan untuk unexpected errors yang tidak dapat di-handle.
 * Biasanya untuk errors yang tidak seharusnya terjadi.
 * 
 * @example
 * throw new InternalServerError('Gagal menghasilkan kode pasien unik');
 * throw new InternalServerError('Database connection failed');
 */
export class InternalServerError extends AppError {
  constructor(message: string = 'Terjadi kesalahan pada sistem') {
    super(message, 500, false); // isOperational = false
    Object.setPrototypeOf(this, InternalServerError.prototype);
  }
}

/**
 * Helper function untuk check apakah error adalah operational error
 * Operational errors adalah errors yang expected dan dapat di-handle
 * Non-operational errors adalah bugs yang perlu di-fix
 * 
 * @param error - Error object
 * @returns true jika error adalah operational error
 */
export const isOperationalError = (error: Error): boolean => {
  if (error instanceof AppError) {
    return error.isOperational;
  }
  return false;
};
