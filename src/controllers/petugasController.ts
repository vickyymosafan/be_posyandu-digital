/**
 * Petugas Controller
 * 
 * Controller untuk handle HTTP requests terkait manajemen petugas.
 * Bertanggung jawab untuk CRUD petugas (admin only).
 * 
 * Prinsip yang diterapkan:
 * - Single Responsibility: Hanya handle HTTP logic untuk manajemen petugas
 * - Dependency Inversion: Depend pada userService abstraction
 * - Separation of Concerns: Business logic ada di service layer
 * - Security: Semua endpoints protected dengan authMiddleware dan roleGuard(ADMIN)
 * - Error Handling: Semua errors di-pass ke error handler middleware
 */

import { Request, Response, NextFunction } from 'express';
import {
  createPetugas as createPetugasService,
  getAllPetugas as getAllPetugasService,
  updateStatusPetugas as updateStatusPetugasService,
} from '../services/userService';
import { ValidationError, NotFoundError } from '../utils/errors';
import logger from '../utils/logger';

/**
 * Create Petugas Controller
 * 
 * Handle POST /api/petugas
 * 
 * Proses:
 * 1. Extract data petugas dari request body (sudah divalidasi oleh validateMiddleware)
 * 2. Call userService.createPetugas untuk membuat petugas baru
 * 3. Return data petugas yang telah dibuat tanpa password
 * 
 * Validasi:
 * - Request body divalidasi oleh validateMiddleware dengan createPetugasSchema
 * - Email harus unique (divalidasi di service layer)
 * - Password minimal 6 karakter
 * 
 * Security:
 * - Endpoint ini protected oleh authMiddleware dan roleGuard(ADMIN)
 * - Hanya ADMIN yang dapat membuat petugas baru
 * - Password di-hash dengan bcrypt sebelum disimpan
 * - Password tidak pernah di-return dalam response
 * 
 * @param req - Express request object dengan body: { nama, email, kataSandi }
 * @param res - Express response object
 * @param next - Express next function untuk error handling
 * 
 * @example
 * // Request
 * POST /api/petugas
 * Cookie: token=<admin_jwt_token>
 * Content-Type: application/json
 * {
 *   "nama": "Petugas Baru",
 *   "email": "petugas@posyandu.com",
 *   "kataSandi": "password123"
 * }
 * 
 * // Response (201 Created)
 * {
 *   "id": 2,
 *   "nama": "Petugas Baru",
 *   "email": "petugas@posyandu.com",
 *   "role": "PETUGAS",
 *   "aktif": true,
 *   "createdAt": "2025-11-03T10:00:00.000Z"
 * }
 * 
 * // Response (400 Bad Request) - email sudah terdaftar
 * {
 *   "error": "Email sudah terdaftar"
 * }
 * 
 * // Response (403 Forbidden) - bukan admin
 * {
 *   "error": "Akses ditolak"
 * }
 */
export const createPetugas = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Extract data dari request body
    // Body sudah divalidasi oleh validateMiddleware
    const { nama, email, kataSandi } = req.body;

    // Get admin info untuk logging
    const adminId = req.user?.userId;
    const adminRole = req.user?.role;

    // Call userService untuk create petugas
    const petugas = await createPetugasService({
      nama,
      email,
      kataSandi,
    });

    // Log successful creation
    logger.info('Petugas berhasil dibuat via controller', {
      petugasId: petugas.id,
      petugasEmail: petugas.email,
      petugasNama: petugas.nama,
      createdBy: adminId,
      createdByRole: adminRole,
      ip: req.ip,
    });

    // Return created petugas data
    // Status 201 Created untuk resource baru
    res.status(201).json(petugas);
  } catch (error) {
    // Handle specific errors
    if (error instanceof Error && error.message === 'Email sudah terdaftar') {
      // Convert ke ValidationError untuk proper status code (400)
      const validationError = new ValidationError(error.message);
      next(validationError);
    } else {
      // Pass error ke error handler middleware
      next(error);
    }
  }
};

/**
 * Get All Petugas Controller
 * 
 * Handle GET /api/petugas
 * 
 * Proses:
 * 1. Call userService.getAllPetugas untuk mengambil semua petugas
 * 2. Return array of petugas tanpa password
 * 
 * Security:
 * - Endpoint ini protected oleh authMiddleware dan roleGuard(ADMIN)
 * - Hanya ADMIN yang dapat melihat daftar petugas
 * - Password tidak pernah di-return dalam response
 * 
 * @param req - Express request object
 * @param res - Express response object
 * @param next - Express next function untuk error handling
 * 
 * @example
 * // Request
 * GET /api/petugas
 * Cookie: token=<admin_jwt_token>
 * 
 * // Response (200 OK)
 * [
 *   {
 *     "id": 2,
 *     "nama": "Petugas 1",
 *     "email": "petugas1@posyandu.com",
 *     "role": "PETUGAS",
 *     "aktif": true,
 *     "createdAt": "2025-11-03T10:00:00.000Z"
 *   },
 *   {
 *     "id": 3,
 *     "nama": "Petugas 2",
 *     "email": "petugas2@posyandu.com",
 *     "role": "PETUGAS",
 *     "aktif": false,
 *     "createdAt": "2025-11-03T11:00:00.000Z"
 *   }
 * ]
 * 
 * // Response (403 Forbidden) - bukan admin
 * {
 *   "error": "Akses ditolak"
 * }
 */
export const getAllPetugas = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Get admin info untuk logging
    const adminId = req.user?.userId;

    // Call userService untuk get all petugas
    const petugasList = await getAllPetugasService();

    // Log successful retrieval
    logger.debug('Daftar petugas berhasil diambil via controller', {
      count: petugasList.length,
      requestedBy: adminId,
      ip: req.ip,
    });

    // Return array of petugas
    res.status(200).json(petugasList);
  } catch (error) {
    // Pass error ke error handler middleware
    next(error);
  }
};

/**
 * Update Status Petugas Controller
 * 
 * Handle PATCH /api/petugas/:id/status
 * 
 * Proses:
 * 1. Extract petugas ID dari route params
 * 2. Extract status aktif dari request body (sudah divalidasi oleh validateMiddleware)
 * 3. Call userService.updateStatusPetugas untuk update status
 * 4. Return updated petugas data tanpa password
 * 
 * Validasi:
 * - Request body divalidasi oleh validateMiddleware dengan updateStatusPetugasSchema
 * - ID petugas harus valid dan exists (divalidasi di service layer)
 * 
 * Security:
 * - Endpoint ini protected oleh authMiddleware dan roleGuard(ADMIN)
 * - Hanya ADMIN yang dapat mengubah status petugas
 * - Password tidak pernah di-return dalam response
 * 
 * @param req - Express request object dengan params: { id } dan body: { aktif }
 * @param res - Express response object
 * @param next - Express next function untuk error handling
 * 
 * @example
 * // Request - Nonaktifkan petugas
 * PATCH /api/petugas/2/status
 * Cookie: token=<admin_jwt_token>
 * Content-Type: application/json
 * {
 *   "aktif": false
 * }
 * 
 * // Response (200 OK)
 * {
 *   "id": 2,
 *   "nama": "Petugas 1",
 *   "email": "petugas1@posyandu.com",
 *   "role": "PETUGAS",
 *   "aktif": false,
 *   "createdAt": "2025-11-03T10:00:00.000Z"
 * }
 * 
 * // Response (404 Not Found) - petugas tidak ditemukan
 * {
 *   "error": "User tidak ditemukan"
 * }
 * 
 * // Response (403 Forbidden) - bukan admin
 * {
 *   "error": "Akses ditolak"
 * }
 */
export const updateStatusPetugas = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Extract petugas ID dari route params
    const idParam = req.params.id;
    
    // Validasi ID exists
    if (!idParam) {
      logger.warn('updateStatusPetugas: ID tidak ditemukan', {
        ip: req.ip,
      });
      throw new ValidationError('ID petugas tidak ditemukan');
    }
    
    const petugasId = parseInt(idParam, 10);

    // Validasi ID adalah number yang valid
    if (isNaN(petugasId)) {
      logger.warn('updateStatusPetugas: ID tidak valid', {
        id: idParam,
        ip: req.ip,
      });
      throw new ValidationError('ID petugas tidak valid');
    }

    // Extract status aktif dari request body
    // Body sudah divalidasi oleh validateMiddleware
    const { aktif } = req.body;

    // Get admin info untuk logging
    const adminId = req.user?.userId;

    // Call userService untuk update status
    const updatedPetugas = await updateStatusPetugasService(petugasId, aktif);

    // Log successful update
    logger.info('Status petugas berhasil diupdate via controller', {
      petugasId: updatedPetugas.id,
      petugasEmail: updatedPetugas.email,
      statusBaru: aktif,
      updatedBy: adminId,
      ip: req.ip,
    });

    // Return updated petugas data
    res.status(200).json(updatedPetugas);
  } catch (error) {
    // Handle specific errors
    if (error instanceof Error && error.message === 'User tidak ditemukan') {
      // Convert ke NotFoundError untuk proper status code (404)
      const notFoundError = new NotFoundError(error.message);
      next(notFoundError);
    } else {
      // Pass error ke error handler middleware
      next(error);
    }
  }
};
