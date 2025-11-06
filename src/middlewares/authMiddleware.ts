/**
 * Auth Middleware
 *
 * Middleware untuk autentikasi request menggunakan JWT dari cookie atau Authorization header.
 * Memverifikasi token dan attach user info ke request object.
 *
 * Prinsip yang diterapkan:
 * - Single Responsibility: Hanya handle autentikasi request
 * - Dependency Inversion: Depend pada authService abstraction
 * - Security: Verifikasi JWT token dari httpOnly cookie atau Bearer token
 * - Separation of Concerns: Tidak ada business logic, hanya autentikasi
 * - Flexibility: Support both cookie-based dan header-based authentication
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
 * 1. Extract JWT token dari cookie atau Authorization header (Bearer token)
 * 2. Verifikasi token menggunakan authService.verifyJWT
 * 3. Attach user info (userId, role) ke request.user
 * 4. Return 401 jika token tidak ada, invalid, atau expired
 *
 * Token Sources (in order of priority):
 * 1. Cookie: req.cookies.token (for SSR and browser requests)
 * 2. Authorization Header: Bearer <token> (for API clients)
 *
 * @param req - Express request object
 * @param res - Express response object
 * @param next - Express next function
 */
export const authMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  try {
    // Extract token dari cookie ATAU Authorization header
    let token = req.cookies?.[JWT_COOKIE_NAME];

    // Jika tidak ada di cookie, cek Authorization header
    if (!token) {
      const authHeader = req.headers.authorization;
      if (authHeader && authHeader.startsWith('Bearer ')) {
        token = authHeader.substring(7); // Remove 'Bearer ' prefix
        logger.debug('Token extracted from Authorization header', {
          path: req.path,
          method: req.method,
        });
      }
    } else {
      logger.debug('Token extracted from cookie', {
        path: req.path,
        method: req.method,
      });
    }

    if (!token) {
      logger.warn('Autentikasi gagal: Token tidak ditemukan', {
        path: req.path,
        method: req.method,
        ip: req.ip,
        hasCookie: !!req.cookies?.[JWT_COOKIE_NAME],
        hasAuthHeader: !!req.headers.authorization,
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
