/**
 * Lansia Controller
 *
 * Controller untuk handle HTTP requests terkait manajemen data lansia.
 * Bertanggung jawab untuk registrasi lansia, pencarian data lansia,
 * dan query data lansia dengan berbagai filter.
 *
 * Prinsip yang diterapkan:
 * - Single Responsibility: Hanya handle HTTP logic untuk manajemen lansia
 * - Dependency Inversion: Depend pada lansiaService abstraction
 * - Separation of Concerns: Business logic ada di service layer
 * - Security: Semua endpoints protected dengan authMiddleware
 * - Error Handling: Semua errors di-pass ke error handler middleware
 */

import { Request, Response, NextFunction } from 'express';
import {
  createLansiaWithKode,
  getLansiaByKode,
  findMinimalLansiaByKode,
} from '../services/lansiaService';
import { findAllLansia } from '../repositories/lansiaRepository';
import { findPemeriksaanByLansiaId } from '../repositories/pemeriksaanRepository';
import { ValidationError, NotFoundError } from '../utils/errors';
import logger from '../utils/logger';
import { CreateLansiaRequestBody } from '../types/requests';

/**
 * Create Lansia Controller
 *
 * Handle POST /api/lansia
 *
 * Proses:
 * 1. Extract data lansia dari request body (sudah divalidasi oleh validateMiddleware)
 * 2. Call lansiaService.createLansiaWithKode untuk membuat lansia dengan kode unik
 * 3. Return data lansia lengkap termasuk kode pasien yang dihasilkan
 *
 * Validasi:
 * - Request body divalidasi oleh validateMiddleware dengan createLansiaSchema
 * - NIK harus 16 digit angka dan unique
 * - KK harus 16 digit angka
 * - Tanggal lahir tidak boleh di masa depan
 * - Gender harus 'L' atau 'P'
 *
 * Kode Pasien:
 * - Format: "pasien" + YYYYMMDD + 2 karakter base62 (total 16 karakter)
 * - Contoh: "pasien202511031a"
 * - Dihasilkan secara otomatis oleh service layer
 * - Dijamin unique dengan retry mechanism
 *
 * Security:
 * - Endpoint ini protected oleh authMiddleware
 * - Dapat diakses oleh ADMIN dan PETUGAS
 *
 * @param req - Express request object dengan body: CreateLansiaDTO
 * @param res - Express response object
 * @param next - Express next function untuk error handling
 *
 * @example
 * // Request
 * POST /api/lansia
 * Cookie: token=<jwt_token>
 * Content-Type: application/json
 * {
 *   "nik": "3201234567890123",
 *   "kk": "3201234567890123",
 *   "nama": "Budi Santoso",
 *   "tanggalLahir": "1950-05-15",
 *   "gender": "L",
 *   "alamat": "Jl. Merdeka No. 123, Jakarta"
 * }
 *
 * // Response (201 Created)
 * {
 *   "id": 1,
 *   "kode": "pasien202511031a",
 *   "nik": "3201234567890123",
 *   "kk": "3201234567890123",
 *   "nama": "Budi Santoso",
 *   "gender": "L",
 *   "tanggalLahir": "1950-05-15T00:00:00.000Z",
 *   "alamat": "Jl. Merdeka No. 123, Jakarta",
 *   "createdAt": "2025-11-03T10:00:00.000Z"
 * }
 *
 * // Response (400 Bad Request) - NIK sudah terdaftar
 * {
 *   "error": "NIK sudah terdaftar"
 * }
 *
 * // Response (500 Internal Server Error) - gagal generate kode
 * {
 *   "error": "Gagal menghasilkan kode pasien unik"
 * }
 */
export const createLansia = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Extract data dari request body
    // Body sudah divalidasi oleh validateMiddleware dengan createLansiaSchema
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const { nik, kk, nama, tanggalLahir, gender, alamat } = req.body as CreateLansiaRequestBody;

    // Get user info untuk logging
    const userId = req.user?.userId;
    const userRole = req.user?.role;

    // Call lansiaService untuk create lansia dengan kode unik
    const lansia = await createLansiaWithKode({
      nik,
      kk,
      nama,
      tanggalLahir,
      gender,
      alamat,
    });

    // Log successful creation
    logger.info('Lansia berhasil dibuat via controller', {
      lansiaId: lansia.id,
      kode: lansia.kode,
      nama: lansia.nama,
      nik: lansia.nik,
      createdBy: userId,
      createdByRole: userRole,
      ip: req.ip,
    });

    // Return created lansia data
    // Status 201 Created untuk resource baru
    res.status(201).json(lansia);
  } catch (error) {
    // Handle specific errors
    if (error instanceof Error) {
      if (error.message === 'NIK sudah terdaftar') {
        // Convert ke ValidationError untuk proper status code (400)
        const validationError = new ValidationError(error.message);
        next(validationError);
      } else if (error.message.includes('Gagal menghasilkan kode pasien')) {
        // Error dari patientId utility, pass as is (sudah InternalServerError)
        next(error);
      } else {
        // Other errors
        next(error);
      }
    } else {
      // Unexpected error
      next(error);
    }
  }
};

/**
 * Get Lansia Controller
 *
 * Handle GET /api/lansia
 *
 * Proses:
 * 1. Check apakah ada query parameter 'kode'
 * 2. Jika ada kode, return single lansia yang sesuai
 * 3. Jika tidak ada kode, return array of all lansia
 *
 * Query Parameters:
 * - kode (optional): Kode pasien untuk filter
 *
 * Security:
 * - Endpoint ini protected oleh authMiddleware
 * - Dapat diakses oleh ADMIN dan PETUGAS
 *
 * @param req - Express request object dengan optional query: { kode?: string }
 * @param res - Express response object
 * @param next - Express next function untuk error handling
 *
 * @example
 * // Request - Get all lansia
 * GET /api/lansia
 * Cookie: token=<jwt_token>
 *
 * // Response (200 OK)
 * [
 *   {
 *     "id": 1,
 *     "kode": "pasien202511031a",
 *     "nik": "3201234567890123",
 *     "kk": "3201234567890123",
 *     "nama": "Budi Santoso",
 *     "gender": "L",
 *     "tanggalLahir": "1950-05-15T00:00:00.000Z",
 *     "alamat": "Jl. Merdeka No. 123, Jakarta",
 *     "createdAt": "2025-11-03T10:00:00.000Z"
 *   },
 *   ...
 * ]
 *
 * @example
 * // Request - Get lansia by kode
 * GET /api/lansia?kode=pasien202511031a
 * Cookie: token=<jwt_token>
 *
 * // Response (200 OK)
 * [
 *   {
 *     "id": 1,
 *     "kode": "pasien202511031a",
 *     "nik": "3201234567890123",
 *     "kk": "3201234567890123",
 *     "nama": "Budi Santoso",
 *     "gender": "L",
 *     "tanggalLahir": "1950-05-15T00:00:00.000Z",
 *     "alamat": "Jl. Merdeka No. 123, Jakarta",
 *     "createdAt": "2025-11-03T10:00:00.000Z"
 *   }
 * ]
 *
 * // Response (200 OK) - kode tidak ditemukan
 * []
 */
export const getLansia = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    // Extract kode dari query parameter
    const { kode } = req.query;

    // Get user info untuk logging
    const userId = req.user?.userId;

    // Jika ada kode, filter by kode
    if (kode && typeof kode === 'string') {
      // Get lansia by kode
      const lansia = await getLansiaByKode(kode);

      // Log successful retrieval
      logger.debug('Lansia berhasil diambil by kode via controller', {
        kode,
        lansiaId: lansia.id,
        requestedBy: userId,
        ip: req.ip,
      });

      // Return array dengan single lansia untuk konsistensi
      res.status(200).json([lansia]);
    } else {
      // Get all lansia
      const lansiaList = await findAllLansia();

      // Log successful retrieval
      logger.debug('Daftar lansia berhasil diambil via controller', {
        count: lansiaList.length,
        requestedBy: userId,
        ip: req.ip,
      });

      // Return array of lansia
      res.status(200).json(lansiaList);
    }
  } catch (error) {
    // Handle specific errors
    if (error instanceof Error && error.message === 'Lansia tidak ditemukan') {
      // Untuk GET dengan query kode, return empty array jika tidak ditemukan
      // Ini lebih user-friendly daripada 404
      logger.debug('Lansia tidak ditemukan, return empty array', {
        kode: req.query.kode,
        ip: req.ip,
      });
      res.status(200).json([]);
    } else {
      // Pass error ke error handler middleware
      next(error);
    }
  }
};

/**
 * Get Lansia By Kode Controller
 *
 * Handle GET /api/lansia/:kode
 *
 * Proses:
 * 1. Extract kode dari route params
 * 2. Call lansiaService.getLansiaByKode untuk get data lansia
 * 3. Return data lansia lengkap
 *
 * Security:
 * - Endpoint ini protected oleh authMiddleware
 * - Dapat diakses oleh ADMIN dan PETUGAS
 *
 * @param req - Express request object dengan params: { kode: string }
 * @param res - Express response object
 * @param next - Express next function untuk error handling
 *
 * @example
 * // Request
 * GET /api/lansia/pasien202511031a
 * Cookie: token=<jwt_token>
 *
 * // Response (200 OK)
 * {
 *   "id": 1,
 *   "kode": "pasien202511031a",
 *   "nik": "3201234567890123",
 *   "kk": "3201234567890123",
 *   "nama": "Budi Santoso",
 *   "gender": "L",
 *   "tanggalLahir": "1950-05-15T00:00:00.000Z",
 *   "alamat": "Jl. Merdeka No. 123, Jakarta",
 *   "createdAt": "2025-11-03T10:00:00.000Z"
 * }
 *
 * // Response (404 Not Found)
 * {
 *   "error": "Lansia tidak ditemukan"
 * }
 */
export const getLansiaByKodeParam = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Extract kode dari route params
    const { kode } = req.params;

    // Validasi kode exists
    if (!kode) {
      logger.warn('getLansiaByKode: kode tidak ditemukan di params', {
        ip: req.ip,
      });
      throw new ValidationError('Kode pasien tidak ditemukan');
    }

    // Get user info untuk logging
    const userId = req.user?.userId;

    // Call lansiaService untuk get lansia by kode
    const lansia = await getLansiaByKode(kode);

    // Log successful retrieval
    logger.debug('Lansia berhasil diambil by kode param via controller', {
      kode,
      lansiaId: lansia.id,
      requestedBy: userId,
      ip: req.ip,
    });

    // Return lansia data
    res.status(200).json(lansia);
  } catch (error) {
    // Handle specific errors
    if (error instanceof Error && error.message === 'Lansia tidak ditemukan') {
      // Convert ke NotFoundError untuk proper status code (404)
      const notFoundError = new NotFoundError(error.message);
      next(notFoundError);
    } else {
      // Pass error ke error handler middleware
      next(error);
    }
  }
};

/**
 * Find Lansia Controller
 *
 * Handle POST /api/find
 *
 * Proses:
 * 1. Extract kode dari request body (sudah divalidasi oleh validateMiddleware)
 * 2. Call lansiaService.findMinimalLansiaByKode untuk get minimal data
 * 3. Return minimal lansia data (id, kode, nama, tanggalLahir)
 *
 * Validasi:
 * - Request body divalidasi oleh validateMiddleware dengan findLansiaSchema
 * - Kode tidak boleh kosong
 *
 * Use Case:
 * - Endpoint ini digunakan untuk quick lookup sebelum pemeriksaan
 * - Return hanya data minimal yang diperlukan untuk konfirmasi identitas
 * - Lebih ringan daripada GET /api/lansia/:kode
 *
 * Security:
 * - Endpoint ini protected oleh authMiddleware
 * - Dapat diakses oleh ADMIN dan PETUGAS
 *
 * @param req - Express request object dengan body: { kode: string }
 * @param res - Express response object
 * @param next - Express next function untuk error handling
 *
 * @example
 * // Request
 * POST /api/find
 * Cookie: token=<jwt_token>
 * Content-Type: application/json
 * {
 *   "kode": "pasien202511031a"
 * }
 *
 * // Response (200 OK)
 * {
 *   "id": 1,
 *   "kode": "pasien202511031a",
 *   "nama": "Budi Santoso",
 *   "tanggalLahir": "1950-05-15T00:00:00.000Z"
 * }
 *
 * // Response (404 Not Found)
 * {
 *   "error": "Lansia tidak ditemukan"
 * }
 */
export const findLansia = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Extract kode dari request body
    // Body sudah divalidasi oleh validateMiddleware dengan findLansiaSchema
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const { kode } = req.body as { kode: string };

    // Get user info untuk logging
    const userId = req.user?.userId;

    // Call lansiaService untuk find minimal lansia data
    const minimalData = await findMinimalLansiaByKode(kode);

    // Log successful find
    logger.debug('Minimal lansia data berhasil ditemukan via controller', {
      kode,
      lansiaId: minimalData.id,
      requestedBy: userId,
      ip: req.ip,
    });

    // Return minimal lansia data
    res.status(200).json(minimalData);
  } catch (error) {
    // Handle specific errors
    if (error instanceof Error && error.message === 'Lansia tidak ditemukan') {
      // Convert ke NotFoundError untuk proper status code (404)
      const notFoundError = new NotFoundError(error.message);
      next(notFoundError);
    } else {
      // Pass error ke error handler middleware
      next(error);
    }
  }
};

/**
 * Get Pemeriksaan By Lansia Kode Controller
 *
 * Handle GET /api/lansia/:kode/pemeriksaan
 *
 * Proses:
 * 1. Extract kode dari route params
 * 2. Call lansiaService.getLansiaByKode untuk validasi dan get lansiaId
 * 3. Call pemeriksaanRepository untuk get riwayat pemeriksaan
 * 4. Return array pemeriksaan
 *
 * Security:
 * - Endpoint ini protected oleh authMiddleware
 * - Dapat diakses oleh ADMIN dan PETUGAS
 *
 * @param req - Express request object dengan params: { kode: string }
 * @param res - Express response object
 * @param next - Express next function untuk error handling
 *
 * @example
 * // Request
 * GET /api/lansia/pasien202511031a/pemeriksaan
 * Cookie: token=<jwt_token>
 *
 * // Response (200 OK)
 * [
 *   {
 *     "id": 1,
 *     "lansiaId": 1,
 *     "tanggal": "2025-11-03T10:00:00.000Z",
 *     "tinggi": 165,
 *     "berat": 70,
 *     "bmi": 25.71,
 *     "kategoriBmi": "Berat Badan Lebih",
 *     "sistolik": 120,
 *     "diastolik": 80,
 *     "tekananDarah": "Normal",
 *     "gulaPuasa": 110,
 *     "klasifikasiGula": {...},
 *     "kolesterol": 210,
 *     "klasifikasiKolesterol": "Batas Tinggi",
 *     "asamUrat": 7.5,
 *     "createdAt": "2025-11-03T10:00:00.000Z"
 *   }
 * ]
 *
 * // Response (404 Not Found)
 * {
 *   "error": "Lansia tidak ditemukan"
 * }
 */
export const getPemeriksaanByKode = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Extract kode dari route params
    const { kode } = req.params;

    // Validasi kode exists
    if (!kode) {
      logger.warn('getPemeriksaanByKode: kode tidak ditemukan di params', {
        ip: req.ip,
      });
      throw new ValidationError('Kode pasien tidak ditemukan');
    }

    // Get user info untuk logging
    const userId = req.user?.userId;

    // Get lansia by kode untuk validasi dan mendapatkan lansiaId
    const lansia = await getLansiaByKode(kode);

    // Get riwayat pemeriksaan
    const pemeriksaanList = await findPemeriksaanByLansiaId(lansia.id);

    // Log successful retrieval
    logger.debug('Riwayat pemeriksaan berhasil diambil via controller', {
      kode,
      lansiaId: lansia.id,
      count: pemeriksaanList.length,
      requestedBy: userId,
      ip: req.ip,
    });

    // Return array pemeriksaan
    res.status(200).json(pemeriksaanList);
  } catch (error) {
    // Handle specific errors
    if (error instanceof Error && error.message === 'Lansia tidak ditemukan') {
      // Convert ke NotFoundError untuk proper status code (404)
      const notFoundError = new NotFoundError(error.message);
      next(notFoundError);
    } else {
      // Pass error ke error handler middleware
      next(error);
    }
  }
};
