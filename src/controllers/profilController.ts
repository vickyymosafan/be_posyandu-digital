/**
 * Profil Controller
 *
 * Controller untuk handle HTTP requests terkait manajemen profil user.
 * Bertanggung jawab untuk get profile, update nama, dan update password.
 *
 * Prinsip yang diterapkan:
 * - Single Responsibility: Hanya handle HTTP logic untuk profil management
 * - Dependency Inversion: Depend pada userService abstraction
 * - Separation of Concerns: Business logic ada di service layer
 * - Security: Password tidak pernah di-return dalam response
 * - Error Handling: Semua errors di-pass ke error handler middleware
 */

import { Request, Response, NextFunction } from 'express';
import { updateNama, updatePassword } from '../services/userService';
import { findUserById } from '../repositories/userRepository';
import { NotFoundError } from '../utils/errors';
import logger from '../utils/logger';

/**
 * Get Profile Controller
 *
 * Handle GET /api/profile
 *
 * Proses:
 * 1. Extract userId dari request.user (sudah di-set oleh authMiddleware)
 * 2. Get user data dari database
 * 3. Return user profile tanpa password
 *
 * Security:
 * - Endpoint ini protected oleh authMiddleware
 * - Password tidak pernah di-return dalam response
 * - User hanya bisa melihat profil mereka sendiri
 *
 * @param req - Express request object dengan user info dari authMiddleware
 * @param res - Express response object
 * @param next - Express next function untuk error handling
 *
 * @example
 * // Request
 * GET /api/profile
 * Cookie: token=<jwt_token>
 *
 * // Response (200 OK)
 * {
 *   "id": 1,
 *   "nama": "Admin Posyandu",
 *   "email": "admin@posyandu.com",
 *   "role": "ADMIN",
 *   "aktif": true,
 *   "createdAt": "2025-11-03T10:00:00.000Z"
 * }
 *
 * // Response (401 Unauthorized) - jika tidak ada token
 * {
 *   "error": "Autentikasi diperlukan"
 * }
 */
export const getProfile = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Extract userId dari request.user
    // req.user sudah di-set oleh authMiddleware
    const userId = req.user?.userId;

    // Validasi userId exists (seharusnya selalu ada karena protected oleh authMiddleware)
    if (!userId) {
      logger.error('getProfile: userId tidak ditemukan di request.user', {
        path: req.path,
        ip: req.ip,
      });
      throw new NotFoundError('User tidak ditemukan');
    }

    // Get user data dari database
    const user = await findUserById(userId);

    // Validasi user exists
    if (!user) {
      logger.warn('getProfile: User tidak ditemukan di database', {
        userId,
        ip: req.ip,
      });
      throw new NotFoundError('User tidak ditemukan');
    }

    // Log successful profile retrieval
    logger.debug('Profile berhasil diambil', {
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    // Return user profile tanpa password
    // Destructure untuk exclude kataSandi
    const { kataSandi: _kataSandi, ...userProfile } = user;

    res.status(200).json(userProfile);
  } catch (error) {
    // Pass error ke error handler middleware
    next(error);
  }
};

/**
 * Update Nama Controller
 *
 * Handle PATCH /api/profile/nama
 *
 * Proses:
 * 1. Extract userId dari request.user (sudah di-set oleh authMiddleware)
 * 2. Extract nama baru dari request body (sudah divalidasi oleh validateMiddleware)
 * 3. Call userService.updateNama untuk update nama
 * 4. Return updated user profile tanpa password
 *
 * Validasi:
 * - Request body divalidasi oleh validateMiddleware dengan updateNamaSchema
 * - Nama tidak boleh kosong dan maksimal 255 karakter
 *
 * @param req - Express request object dengan body: { nama }
 * @param res - Express response object
 * @param next - Express next function untuk error handling
 *
 * @example
 * // Request
 * PATCH /api/profile/nama
 * Cookie: token=<jwt_token>
 * Content-Type: application/json
 * {
 *   "nama": "Nama Baru"
 * }
 *
 * // Response (200 OK)
 * {
 *   "id": 1,
 *   "nama": "Nama Baru",
 *   "email": "admin@posyandu.com",
 *   "role": "ADMIN",
 *   "aktif": true,
 *   "createdAt": "2025-11-03T10:00:00.000Z"
 * }
 *
 * // Response (400 Bad Request) - validasi gagal
 * {
 *   "error": "Validasi input gagal",
 *   "details": {
 *     "nama": ["Nama tidak boleh kosong"]
 *   }
 * }
 */
export const updateNamaController = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Extract userId dari request.user
    const userId = req.user?.userId;

    // Validasi userId exists
    if (!userId) {
      logger.error('updateNama: userId tidak ditemukan di request.user', {
        path: req.path,
        ip: req.ip,
      });
      throw new NotFoundError('User tidak ditemukan');
    }

    // Extract nama dari request body
    // Body sudah divalidasi oleh validateMiddleware
    const { nama } = req.body;

    // Call userService untuk update nama
    const updatedUser = await updateNama(userId, nama);

    // Log successful update
    logger.info('Nama user berhasil diupdate via controller', {
      userId: updatedUser.id,
      email: updatedUser.email,
      namaBaru: nama,
      ip: req.ip,
    });

    // Return updated user profile
    res.status(200).json(updatedUser);
  } catch (error) {
    // Pass error ke error handler middleware
    next(error);
  }
};

/**
 * Update Password Controller
 *
 * Handle PATCH /api/profile/password
 *
 * Proses:
 * 1. Extract userId dari request.user (sudah di-set oleh authMiddleware)
 * 2. Extract kataSandiLama dan kataSandiBaru dari request body (sudah divalidasi)
 * 3. Call userService.updatePassword untuk verifikasi dan update password
 * 4. Return success message
 *
 * Validasi:
 * - Request body divalidasi oleh validateMiddleware dengan updatePasswordSchema
 * - Kata sandi minimal 6 karakter
 * - Kata sandi lama harus cocok dengan yang tersimpan di database
 *
 * Security:
 * - Password lama diverifikasi sebelum update
 * - Password baru di-hash dengan bcrypt sebelum disimpan
 * - Password tidak pernah di-return dalam response
 *
 * @param req - Express request object dengan body: { kataSandiLama, kataSandiBaru }
 * @param res - Express response object
 * @param next - Express next function untuk error handling
 *
 * @example
 * // Request
 * PATCH /api/profile/password
 * Cookie: token=<jwt_token>
 * Content-Type: application/json
 * {
 *   "kataSandiLama": "password123",
 *   "kataSandiBaru": "newpassword456"
 * }
 *
 * // Response (200 OK)
 * {
 *   "message": "Kata sandi berhasil diubah"
 * }
 *
 * // Response (400 Bad Request) - password lama salah
 * {
 *   "error": "Kata sandi lama tidak cocok"
 * }
 *
 * // Response (400 Bad Request) - validasi gagal
 * {
 *   "error": "Validasi input gagal",
 *   "details": {
 *     "kataSandiBaru": ["Kata sandi minimal 6 karakter"]
 *   }
 * }
 */
export const updatePasswordController = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Extract userId dari request.user
    const userId = req.user?.userId;

    // Validasi userId exists
    if (!userId) {
      logger.error('updatePassword: userId tidak ditemukan di request.user', {
        path: req.path,
        ip: req.ip,
      });
      throw new NotFoundError('User tidak ditemukan');
    }

    // Extract passwords dari request body
    // Body sudah divalidasi oleh validateMiddleware
    const { kataSandiLama, kataSandiBaru } = req.body;

    // Call userService untuk update password
    // Service akan verifikasi password lama dan hash password baru
    await updatePassword(userId, kataSandiLama, kataSandiBaru);

    // Log successful password update
    logger.info('Password user berhasil diupdate via controller', {
      userId,
      ip: req.ip,
      userAgent: req.get('user-agent'),
    });

    // Return success message
    // Tidak return user data untuk security
    res.status(200).json({
      message: 'Kata sandi berhasil diubah',
    });
  } catch (error) {
    // Pass error ke error handler middleware
    // Error dari service (password lama salah, user not found) akan di-handle di sini
    next(error);
  }
};
