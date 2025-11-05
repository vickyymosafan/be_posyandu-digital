/**
 * Auth Controller
 *
 * Controller untuk handle HTTP requests terkait autentikasi.
 * Bertanggung jawab untuk login dan logout user.
 *
 * Prinsip yang diterapkan:
 * - Single Responsibility: Hanya handle HTTP logic untuk autentikasi
 * - Dependency Inversion: Depend pada authService abstraction
 * - Separation of Concerns: Business logic ada di service layer
 * - Security: JWT dalam httpOnly cookie, secure di production
 * - Error Handling: Semua errors di-pass ke error handler middleware
 */

import { Request, Response, NextFunction } from 'express';
import { login as loginService, generateJWT } from '../services/authService';
import { AuthenticationError } from '../utils/errors';
import logger from '../utils/logger';

/**
 * Nama cookie yang menyimpan JWT token
 * Harus konsisten dengan authMiddleware
 */
const JWT_COOKIE_NAME = 'token';

/**
 * JWT expiration time dalam milliseconds
 * 15 menit = 900000 ms
 */
const JWT_MAX_AGE = 15 * 60 * 1000; // 15 menit

/**
 * Get cookie options berdasarkan environment
 *
 * Cookie options:
 * - httpOnly: true - Prevent XSS attacks
 * - sameSite: 'strict' - Prevent CSRF attacks
 * - secure: true di production - HTTPS only
 * - maxAge: 15 menit
 *
 * @returns Cookie options object
 */
const getCookieOptions = () => {
  return {
    httpOnly: true,
    sameSite: 'strict' as const,
    secure: process.env.NODE_ENV === 'production',
    maxAge: JWT_MAX_AGE,
  };
};

/**
 * Login Controller
 *
 * Handle POST /api/auth/login
 *
 * Proses:
 * 1. Terima email dan kataSandi dari request body (sudah divalidasi oleh validateMiddleware)
 * 2. Call authService.login untuk verifikasi credentials
 * 3. Generate JWT token menggunakan authService.generateJWT
 * 4. Set JWT token dalam httpOnly cookie
 * 5. Return user data (id, nama, role)
 *
 * Security:
 * - Password tidak pernah di-return dalam response
 * - JWT disimpan dalam httpOnly cookie (tidak accessible via JavaScript)
 * - Cookie secure di production (HTTPS only)
 * - Cookie sameSite strict (CSRF protection)
 *
 * @param req - Express request object dengan body: { email, kataSandi }
 * @param res - Express response object
 * @param next - Express next function untuk error handling
 *
 * @example
 * // Request
 * POST /api/auth/login
 * Content-Type: application/json
 * {
 *   "email": "admin@posyandu.com",
 *   "kataSandi": "password123"
 * }
 *
 * // Response (200 OK)
 * {
 *   "id": 1,
 *   "nama": "Admin Posyandu",
 *   "role": "ADMIN"
 * }
 *
 * // Response (401 Unauthorized)
 * {
 *   "error": "Email atau kata sandi salah"
 * }
 */
interface LoginRequestBody {
  email: string;
  kataSandi: string;
}

export const login = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    // Extract credentials dari request body
    // Body sudah divalidasi oleh validateMiddleware
    const { email, kataSandi } = req.body as LoginRequestBody;

    // Call authService untuk verifikasi credentials
    const user = await loginService(email, kataSandi);

    // Generate JWT token
    const token = generateJWT(user.id, user.role);

    // Set JWT token dalam httpOnly cookie
    res.cookie(JWT_COOKIE_NAME, token, getCookieOptions());

    // Log successful login
    logger.info('User login via controller', {
      userId: user.id,
      email: user.email,
      role: user.role,
      ip: req.ip,
      userAgent: req.get('user-agent'),
    });

    // Return token dan user data
    // Token juga disimpan di cookie untuk middleware
    // Token di response body untuk frontend API client
    res.status(200).json({
      token,
      user: {
        id: user.id,
        nama: user.nama,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    // Convert generic errors ke AuthenticationError untuk consistency
    if (error instanceof Error) {
      // Errors dari authService sudah memiliki message yang sesuai
      // Convert ke AuthenticationError untuk proper status code (401)
      const authError = new AuthenticationError(error.message);
      next(authError);
    } else {
      // Unexpected error
      next(error);
    }
  }
};

/**
 * Logout Controller
 *
 * Handle POST /api/auth/logout
 *
 * Proses:
 * 1. Clear JWT cookie
 * 2. Return success message
 *
 * Notes:
 * - Tidak memerlukan autentikasi (user bisa logout meskipun token expired)
 * - Simple operation, hanya clear cookie
 * - Client-side juga harus clear state/cache
 *
 * @param req - Express request object
 * @param res - Express response object
 * @param next - Express next function untuk error handling
 *
 * @example
 * // Request
 * POST /api/auth/logout
 *
 * // Response (200 OK)
 * {
 *   "message": "Logout berhasil"
 * }
 */
export const logout = (req: Request, res: Response, next: NextFunction): void => {
  try {
    // Get user info jika ada (dari authMiddleware)
    // Bisa undefined jika logout dipanggil tanpa authentication
    const userId = req.user?.userId;

    // Clear JWT cookie
    // Set maxAge ke 0 untuk immediate expiration
    res.clearCookie(JWT_COOKIE_NAME, {
      httpOnly: true,
      sameSite: 'strict' as const,
      secure: process.env.NODE_ENV === 'production',
    });

    // Log logout event
    if (userId) {
      logger.info('User logout', {
        userId,
        ip: req.ip,
      });
    } else {
      logger.debug('Logout called without authentication', {
        ip: req.ip,
      });
    }

    // Return success message
    res.status(200).json({
      message: 'Logout berhasil',
    });
  } catch (error) {
    // Unlikely to error, but handle just in case
    next(error);
  }
};
