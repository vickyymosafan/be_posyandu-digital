/**
 * Role Guard Middleware
 *
 * Middleware factory untuk otorisasi berdasarkan role user.
 * Memverifikasi bahwa user memiliki role yang diizinkan untuk mengakses endpoint.
 *
 * Prinsip yang diterapkan:
 * - Single Responsibility: Hanya handle otorisasi berdasarkan role
 * - Open/Closed: Extensible melalui factory pattern tanpa modifikasi
 * - Liskov Substitution: Dapat digunakan di mana saja middleware diperlukan
 * - Interface Segregation: Interface kecil dan spesifik (hanya terima roles)
 * - Dependency Inversion: Depend pada Express abstractions
 * - Factory Pattern: Menghasilkan middleware yang dikonfigurasi
 * - Separation of Concerns: Tidak ada business logic, hanya otorisasi
 */

import { Request, Response, NextFunction } from 'express';
import { Role } from '@prisma/client';
import logger from '../utils/logger';

/**
 * Role Guard Factory
 *
 * Factory function yang menghasilkan middleware untuk role-based access control.
 * Middleware yang dihasilkan akan memverifikasi bahwa user memiliki salah satu
 * role yang diizinkan.
 *
 * Proses:
 * 1. Verifikasi req.user exists (harus sudah di-set oleh authMiddleware)
 * 2. Verifikasi user.role ada dalam allowedRoles
 * 3. Return 403 jika role tidak sesuai
 * 4. Call next() jika role sesuai
 *
 * Catatan:
 * - Middleware ini HARUS digunakan setelah authMiddleware
 * - authMiddleware bertanggung jawab untuk set req.user
 * - roleGuard hanya bertanggung jawab untuk verifikasi role
 *
 * @param allowedRoles - Array of roles yang diizinkan mengakses endpoint
 * @returns Express middleware function
 *
 * @example
 * // Hanya ADMIN yang dapat mengakses
 * router.post('/petugas', authMiddleware, roleGuard([Role.ADMIN]), createPetugas);
 *
 * @example
 * // ADMIN dan PETUGAS dapat mengakses
 * router.get('/lansia', authMiddleware, roleGuard([Role.ADMIN, Role.PETUGAS]), getLansia);
 */
export const roleGuard = (allowedRoles: Role[] | string[]) => {
  // Validasi input
  if (!Array.isArray(allowedRoles) || allowedRoles.length === 0) {
    logger.error('roleGuard: allowedRoles harus berupa array non-empty', {
      allowedRoles,
    });
    throw new Error('roleGuard: allowedRoles harus berupa array non-empty');
  }

  // Convert allowedRoles ke array of strings untuk comparison
  const allowedRolesStr = allowedRoles.map((role) => String(role));

  // Return middleware function
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      // Verifikasi req.user exists
      // Jika tidak ada, berarti authMiddleware belum dijalankan atau gagal
      if (!req.user) {
        logger.error('roleGuard: req.user tidak ditemukan', {
          path: req.path,
          method: req.method,
          note: 'authMiddleware harus dijalankan sebelum roleGuard',
        });

        res.status(401).json({
          error: 'Autentikasi diperlukan',
        });
        return;
      }

      // Verifikasi user.role ada dalam allowedRoles
      const userRole = req.user.role;
      const isAuthorized = allowedRolesStr.includes(userRole);

      if (!isAuthorized) {
        // User tidak memiliki role yang diizinkan
        logger.warn('Otorisasi gagal: Role tidak sesuai', {
          userId: req.user.userId,
          userRole,
          allowedRoles: allowedRolesStr,
          path: req.path,
          method: req.method,
          ip: req.ip,
        });

        res.status(403).json({
          error: 'Akses ditolak',
        });
        return;
      }

      // User memiliki role yang diizinkan
      logger.debug('Otorisasi berhasil', {
        userId: req.user.userId,
        userRole,
        allowedRoles: allowedRolesStr,
        path: req.path,
        method: req.method,
      });

      // Lanjutkan ke handler berikutnya
      next();
    } catch (error) {
      // Unexpected error
      logger.error('roleGuard: Unexpected error', {
        error: error instanceof Error ? error.message : 'Unknown error',
        path: req.path,
        method: req.method,
      });

      res.status(500).json({
        error: 'Terjadi kesalahan pada sistem',
      });
    }
  };
};

/**
 * Helper function untuk membuat roleGuard khusus ADMIN
 * Shortcut untuk roleGuard([Role.ADMIN])
 *
 * @returns Express middleware function yang hanya mengizinkan ADMIN
 *
 * @example
 * router.post('/petugas', authMiddleware, adminOnly(), createPetugas);
 */
export const adminOnly = () => roleGuard([Role.ADMIN]);

/**
 * Helper function untuk membuat roleGuard yang mengizinkan semua authenticated users
 * Shortcut untuk roleGuard([Role.ADMIN, Role.PETUGAS])
 *
 * @returns Express middleware function yang mengizinkan semua role
 *
 * @example
 * router.get('/profile', authMiddleware, authenticated(), getProfile);
 */
export const authenticated = () => roleGuard([Role.ADMIN, Role.PETUGAS]);
