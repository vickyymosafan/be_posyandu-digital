/**
 * Auth Middleware
 *
 * Middleware untuk autentikasi request menggunakan JWT dari cookie.
 * Memverifikasi token dan attach user info ke request object.
 *
 * Prinsip yang diterapkan:
 * - Single Responsibility: Hanya handle autentikasi request
 * - Dependency Inversion: Depend pada authService abstraction
 * - Security: Verifikasi JWT token dari httpOnly cookie
 * - Separation of Concerns: Tidak ada business logic, hanya autentikasi
 */

import { Request, Response, NextFunction } from 'express';
import { verifyJWT } from '../services/authService';
import logger from '../utils/logger';

/**
 * Nama cookie yang menyimpan JWT token
 * Harus sama dengan yang digunakan saat login
 */
const JWT_COOKIE_NAME = 'token';

/**
 * Auth Middleware
 *
 * Proses:
 * 1. Extract JWT token dari cookie
 * 2. Verifikasi token menggunakan authService.verifyJWT
 * 3. Attach user info (userId, role) ke request.user
 * 4. Return 401 jika token tidak ada, invalid, atau expired
 *
 * @param req - Express request object
 * @param res - Express response object
 * @param next - Express next function
 */
export const authMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  try {
    // Extract token dari cookie
    const token = req.cookies?.[JWT_COOKIE_NAME];

    if (!token) {
      logger.warn('Autentikasi gagal: Token tidak ditemukan', {
        path: req.path,
        method: req.method,
        ip: req.ip,
      });

      res.status(401).json({
        error: 'Autentikasi diperlukan',
      });
      return;
    }

    // Verifikasi token
    const payload = verifyJWT(token);

    // Attach user info ke request
    req.user = {
      userId: payload.userId,
      role: payload.role,
    };

    logger.debug('Autentikasi berhasil', {
      userId: payload.userId,
      role: payload.role,
      path: req.path,
      method: req.method,
    });

    // Lanjutkan ke handler berikutnya
    next();
  } catch (error) {
    // Token invalid atau expired
    logger.warn('Autentikasi gagal: Token invalid atau expired', {
      error: error instanceof Error ? error.message : 'Unknown error',
      path: req.path,
      method: req.method,
      ip: req.ip,
    });

    res.status(401).json({
      error: 'Autentikasi diperlukan',
    });
  }
};
