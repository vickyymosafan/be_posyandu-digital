/**
 * Rate Limiter Middleware
 *
 * Middleware untuk rate limiting menggunakan rate-limiter-flexible.
 * Membatasi jumlah requests dari IP address tertentu dalam periode waktu tertentu.
 *
 * Prinsip yang diterapkan:
 * - Single Responsibility: Hanya handle rate limiting
 * - Open/Closed: Extensible melalui factory pattern tanpa modifikasi
 * - Liskov Substitution: Dapat digunakan di mana saja middleware diperlukan
 * - Interface Segregation: Interface sederhana untuk konfigurasi
 * - Dependency Inversion: Depend pada rate-limiter-flexible abstraction
 * - Factory Pattern: Menghasilkan middleware yang dikonfigurasi
 * - Security: Proteksi dari brute force attacks
 */

import { Request, Response, NextFunction } from 'express';
import { RateLimiterMemory, RateLimiterRes } from 'rate-limiter-flexible';
import logger from '../utils/logger';

/**
 * Interface untuk konfigurasi rate limiter
 */
export interface RateLimiterOptions {
  /**
   * Jumlah maksimal requests yang diizinkan dalam duration
   * @default 5
   */
  points?: number;

  /**
   * Durasi window dalam detik
   * @default 900 (15 menit)
   */
  duration?: number;

  /**
   * Durasi block dalam detik setelah limit exceeded
   * @default sama dengan duration
   */
  blockDuration?: number;

  /**
   * Custom error message
   * @default 'Terlalu banyak percobaan, coba lagi nanti'
   */
  message?: string;

  /**
   * Key prefix untuk identifier
   * Berguna untuk membedakan rate limiters yang berbeda
   * @default 'rl'
   */
  keyPrefix?: string;
}

/**
 * Default configuration untuk rate limiter
 */
const DEFAULT_OPTIONS: Required<Omit<RateLimiterOptions, 'blockDuration'>> = {
  points: 5,
  duration: 900, // 15 menit
  message: 'Terlalu banyak percobaan, coba lagi nanti',
  keyPrefix: 'rl',
};

/**
 * Get client identifier dari request
 * Menggunakan IP address sebagai identifier
 *
 * @param req - Express request object
 * @returns Client identifier string
 */
const getClientIdentifier = (req: Request): string => {
  // Prioritas: X-Forwarded-For (untuk proxy/load balancer) > req.ip
  const forwardedFor = req.get('x-forwarded-for');
  if (forwardedFor) {
    // X-Forwarded-For bisa berisi multiple IPs, ambil yang pertama
    const firstIp = forwardedFor.split(',')[0];
    return firstIp ? firstIp.trim() : 'unknown';
  }

  return req.ip || 'unknown';
};

/**
 * Format retry-after time menjadi human-readable
 *
 * @param seconds - Waktu dalam detik
 * @returns Human-readable string
 */
const formatRetryAfter = (seconds: number): string => {
  if (seconds < 60) {
    return `${Math.ceil(seconds)} detik`;
  }

  const minutes = Math.ceil(seconds / 60);
  return `${minutes} menit`;
};

/**
 * Rate Limiter Factory
 *
 * Factory function yang menghasilkan middleware untuk rate limiting.
 * Middleware yang dihasilkan akan membatasi jumlah requests dari IP address
 * tertentu dalam periode waktu tertentu.
 *
 * Proses:
 * 1. Extract client identifier (IP address) dari request
 * 2. Consume 1 point dari rate limiter
 * 3. Jika berhasil, lanjutkan ke handler berikutnya
 * 4. Jika limit exceeded, return 429 dengan Retry-After header
 *
 * Use Cases:
 * - Login endpoint: Proteksi dari brute force attacks
 * - API endpoints: Proteksi dari abuse
 * - Public endpoints: Proteksi dari DDoS
 *
 * @param options - Konfigurasi rate limiter
 * @returns Express middleware function
 *
 * @example
 * // Rate limiter untuk login (5 attempts per 15 menit)
 * const loginLimiter = createRateLimiter({
 *   points: 5,
 *   duration: 900,
 *   message: 'Terlalu banyak percobaan login',
 *   keyPrefix: 'login'
 * });
 *
 * router.post('/auth/login', loginLimiter, loginController);
 *
 * @example
 * // Rate limiter untuk API umum (100 requests per menit)
 * const apiLimiter = createRateLimiter({
 *   points: 100,
 *   duration: 60,
 *   keyPrefix: 'api'
 * });
 *
 * app.use('/api', apiLimiter);
 */
export const createRateLimiter = (options: RateLimiterOptions = {}) => {
  // Merge dengan default options
  const config = {
    ...DEFAULT_OPTIONS,
    ...options,
  };

  // Create rate limiter instance
  const rateLimiter = new RateLimiterMemory({
    points: config.points,
    duration: config.duration,
    blockDuration: options.blockDuration,
    keyPrefix: config.keyPrefix,
  });

  // Log rate limiter creation
  logger.info('Rate limiter created', {
    points: config.points,
    duration: config.duration,
    blockDuration: options.blockDuration || config.duration,
    keyPrefix: config.keyPrefix,
  });

  // Return middleware function
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      // Get client identifier
      const clientId = getClientIdentifier(req);
      const key = `${config.keyPrefix}:${clientId}`;

      // Consume 1 point
      await rateLimiter.consume(key);

      // Request allowed - lanjutkan ke handler berikutnya
      logger.debug('Rate limit check passed', {
        clientId,
        key,
        path: req.path,
        method: req.method,
      });

      next();
    } catch (error) {
      // Rate limit exceeded
      if (error instanceof RateLimiterRes) {
        const clientId = getClientIdentifier(req);
        const retryAfterSeconds = Math.ceil(error.msBeforeNext / 1000);
        const retryAfterFormatted = formatRetryAfter(retryAfterSeconds);

        // Log rate limit hit
        logger.warn('Rate limit exceeded', {
          clientId,
          path: req.path,
          method: req.method,
          remainingPoints: error.remainingPoints,
          msBeforeNext: error.msBeforeNext,
          retryAfter: retryAfterSeconds,
          consumedPoints: error.consumedPoints,
        });

        // Set Retry-After header (dalam detik)
        res.set('Retry-After', String(retryAfterSeconds));

        // Return 429 response
        res.status(429).json({
          error: config.message,
          details: {
            retryAfter: retryAfterFormatted,
            retryAfterSeconds,
          },
        });
        return;
      }

      // Unexpected error
      logger.error('Rate limiter error', {
        error: error instanceof Error ? error.message : 'Unknown error',
        path: req.path,
        method: req.method,
      });

      // Fail open: Jika rate limiter error, izinkan request
      // Ini mencegah rate limiter menjadi single point of failure
      next();
    }
  };
};

/**
 * Pre-configured rate limiter untuk login endpoint
 *
 * Konfigurasi:
 * - 5 attempts per 15 menit
 * - Block duration: 15 menit
 * - Custom message untuk login
 *
 * @example
 * router.post('/auth/login', loginRateLimiter, loginController);
 */
export const loginRateLimiter = createRateLimiter({
  points: 5,
  duration: 900, // 15 menit
  blockDuration: 900, // 15 menit
  message: 'Terlalu banyak percobaan login, coba lagi nanti',
  keyPrefix: 'login',
});

/**
 * Pre-configured rate limiter untuk API umum
 *
 * Konfigurasi:
 * - 100 requests per menit
 * - Untuk proteksi API dari abuse
 *
 * @example
 * app.use('/api', apiRateLimiter);
 */
export const apiRateLimiter = createRateLimiter({
  points: 100,
  duration: 60, // 1 menit
  message: 'Terlalu banyak requests, coba lagi nanti',
  keyPrefix: 'api',
});
