/**
 * Pemeriksaan Controller
 *
 * Controller untuk handle HTTP requests terkait pemeriksaan kesehatan lansia.
 * Bertanggung jawab untuk create pemeriksaan fisik, kesehatan, dan gabungan
 * dengan kalkulasi dan klasifikasi otomatis.
 *
 * Prinsip yang diterapkan:
 * - Single Responsibility: Hanya handle HTTP logic untuk pemeriksaan
 * - Dependency Inversion: Depend pada service abstractions
 * - Separation of Concerns: Business logic ada di service layer
 * - Security: Semua endpoints protected dengan authMiddleware
 * - Error Handling: Semua errors di-pass ke error handler middleware
 */

import { Request, Response, NextFunction } from 'express';
import {
  createPemeriksaanFisik as createPemeriksaanFisikService,
  createPemeriksaanKesehatan as createPemeriksaanKesehatanService,
  createPemeriksaanGabungan as createPemeriksaanGabunganService,
} from '../services/pemeriksaanService';
import { getLansiaByKode } from '../services/lansiaService';
import { ValidationError, NotFoundError } from '../utils/errors';
import logger from '../utils/logger';

/**
 * Create Pemeriksaan Fisik Controller
 *
 * Handle POST /api/lansia/:kode/pemeriksaan/fisik
 *
 * Proses:
 * 1. Extract kode dari route params
 * 2. Extract data pemeriksaan fisik dari request body (sudah divalidasi)
 * 3. Get lansia by kode untuk mendapatkan lansiaId
 * 4. Call pemeriksaanService.createPemeriksaanFisik
 * 5. Return pemeriksaan dengan hasil kalkulasi BMI dan klasifikasi tekanan darah
 *
 * Validasi:
 * - Request body divalidasi oleh validateMiddleware dengan pemeriksaanFisikSchema
 * - Tinggi: 50-250 cm
 * - Berat: 10-300 kg
 * - Sistolik: 40-300 mmHg
 * - Diastolik: 30-200 mmHg
 *
 * Kalkulasi Otomatis:
 * - BMI dihitung dengan rumus: berat(kg) / (tinggi(m))^2
 * - BMI dikategorikan berdasarkan standar Asia Pasifik
 * - Tekanan darah dikategorikan berdasarkan AHA guidelines
 *
 * Security:
 * - Endpoint ini protected oleh authMiddleware
 * - Dapat diakses oleh ADMIN dan PETUGAS
 *
 * @param req - Express request object dengan params: { kode } dan body: PemeriksaanFisikDTO
 * @param res - Express response object
 * @param next - Express next function untuk error handling
 *
 * @example
 * // Request
 * POST /api/lansia/pasien202511031a/pemeriksaan/fisik
 * Cookie: token=<jwt_token>
 * Content-Type: application/json
 * {
 *   "tinggi": 165,
 *   "berat": 60,
 *   "sistolik": 120,
 *   "diastolik": 80
 * }
 *
 * // Response (201 Created)
 * {
 *   "id": 1,
 *   "lansiaId": 1,
 *   "tanggal": "2025-11-03T10:00:00.000Z",
 *   "tinggi": 165,
 *   "berat": 60,
 *   "bmi": 22.04,
 *   "kategoriBmi": "Normal",
 *   "sistolik": 120,
 *   "diastolik": 80,
 *   "tekananDarah": "Normal",
 *   "asamUrat": null,
 *   "gulaPuasa": null,
 *   "gulaSewaktu": null,
 *   "gula2Jpp": null,
 *   "klasifikasiGula": null,
 *   "kolesterol": null,
 *   "klasifikasiKolesterol": null,
 *   "createdAt": "2025-11-03T10:00:00.000Z"
 * }
 *
 * // Response (404 Not Found) - lansia tidak ditemukan
 * {
 *   "error": "Lansia tidak ditemukan"
 * }
 *
 * // Response (400 Bad Request) - validasi gagal
 * {
 *   "error": "Validasi input gagal",
 *   "details": {
 *     "tinggi": ["Tinggi badan minimal 50 cm"]
 *   }
 * }
 */
export const createPemeriksaanFisik = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Extract kode dari route params
    const { kode } = req.params;

    // Validasi kode exists
    if (!kode) {
      logger.warn('createPemeriksaanFisik: kode tidak ditemukan di params', {
        ip: req.ip,
      });
      throw new ValidationError('Kode pasien tidak ditemukan');
    }

    // Extract data pemeriksaan dari request body
    // Body sudah divalidasi oleh validateMiddleware dengan pemeriksaanFisikSchema
    const { tinggi, berat, sistolik, diastolik } = req.body;

    // Get user info untuk logging
    const userId = req.user?.userId;
    const userRole = req.user?.role;

    // Get lansia by kode untuk mendapatkan lansiaId
    const lansia = await getLansiaByKode(kode);

    // Call pemeriksaanService untuk create pemeriksaan fisik
    const pemeriksaan = await createPemeriksaanFisikService(lansia.id, {
      tinggi,
      berat,
      sistolik,
      diastolik,
    });

    // Log successful creation
    logger.info('Pemeriksaan fisik berhasil dibuat via controller', {
      pemeriksaanId: pemeriksaan.id,
      lansiaId: lansia.id,
      kode: lansia.kode,
      bmi: pemeriksaan.bmi,
      kategoriBmi: pemeriksaan.kategoriBmi,
      tekananDarah: pemeriksaan.tekananDarah,
      createdBy: userId,
      createdByRole: userRole,
      ip: req.ip,
    });

    // Return created pemeriksaan data
    // Status 201 Created untuk resource baru
    res.status(201).json(pemeriksaan);
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
 * Create Pemeriksaan Kesehatan Controller
 *
 * Handle POST /api/lansia/:kode/pemeriksaan/kesehatan
 *
 * Proses:
 * 1. Extract kode dari route params
 * 2. Extract data pemeriksaan kesehatan dari request body (sudah divalidasi)
 * 3. Get lansia by kode untuk mendapatkan lansiaId
 * 4. Call pemeriksaanService.createPemeriksaanKesehatan
 * 5. Return pemeriksaan dengan hasil klasifikasi nilai laboratorium
 *
 * Validasi:
 * - Request body divalidasi oleh validateMiddleware dengan pemeriksaanKesehatanSchema
 * - Semua nilai harus non-negatif
 * - Minimal satu pemeriksaan harus diisi
 *
 * Klasifikasi Otomatis:
 * - Gula Darah Puasa (GDP): Normal < 100, Pra-Diabetes 100-125, Diabetes ≥ 126
 * - Gula Darah Sewaktu (GDS): Normal < 200, Diabetes ≥ 200
 * - Gula 2JPP: Normal < 140, Pra-Diabetes 140-199, Diabetes ≥ 200
 * - Kolesterol: Normal < 200, Batas Tinggi 200-239, Tinggi ≥ 240
 * - Asam Urat: Berdasarkan gender lansia
 *
 * Security:
 * - Endpoint ini protected oleh authMiddleware
 * - Dapat diakses oleh ADMIN dan PETUGAS
 *
 * @param req - Express request object dengan params: { kode } dan body: PemeriksaanKesehatanDTO
 * @param res - Express response object
 * @param next - Express next function untuk error handling
 *
 * @example
 * // Request
 * POST /api/lansia/pasien202511031a/pemeriksaan/kesehatan
 * Cookie: token=<jwt_token>
 * Content-Type: application/json
 * {
 *   "asamUrat": 5.5,
 *   "gulaPuasa": 95,
 *   "kolesterol": 180
 * }
 *
 * // Response (201 Created)
 * {
 *   "id": 2,
 *   "lansiaId": 1,
 *   "tanggal": "2025-11-03T10:00:00.000Z",
 *   "tinggi": null,
 *   "berat": null,
 *   "bmi": null,
 *   "kategoriBmi": null,
 *   "sistolik": null,
 *   "diastolik": null,
 *   "tekananDarah": null,
 *   "asamUrat": 5.5,
 *   "gulaPuasa": 95,
 *   "gulaSewaktu": null,
 *   "gula2Jpp": null,
 *   "klasifikasiGula": {
 *     "gdp": "Normal"
 *   },
 *   "kolesterol": 180,
 *   "klasifikasiKolesterol": "Normal",
 *   "createdAt": "2025-11-03T10:00:00.000Z"
 * }
 *
 * // Response (404 Not Found) - lansia tidak ditemukan
 * {
 *   "error": "Lansia tidak ditemukan"
 * }
 *
 * // Response (400 Bad Request) - validasi gagal
 * {
 *   "error": "Validasi input gagal",
 *   "details": {
 *     "_errors": ["Minimal satu pemeriksaan kesehatan harus diisi"]
 *   }
 * }
 */
export const createPemeriksaanKesehatan = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Extract kode dari route params
    const { kode } = req.params;

    // Validasi kode exists
    if (!kode) {
      logger.warn('createPemeriksaanKesehatan: kode tidak ditemukan di params', {
        ip: req.ip,
      });
      throw new ValidationError('Kode pasien tidak ditemukan');
    }

    // Extract data pemeriksaan dari request body
    // Body sudah divalidasi oleh validateMiddleware dengan pemeriksaanKesehatanSchema
    const { asamUrat, gulaPuasa, gulaSewaktu, gula2Jpp, kolesterol } = req.body;

    // Get user info untuk logging
    const userId = req.user?.userId;
    const userRole = req.user?.role;

    // Get lansia by kode untuk mendapatkan lansiaId
    const lansia = await getLansiaByKode(kode);

    // Call pemeriksaanService untuk create pemeriksaan kesehatan
    const pemeriksaan = await createPemeriksaanKesehatanService(lansia.id, {
      asamUrat,
      gulaPuasa,
      gulaSewaktu,
      gula2Jpp,
      kolesterol,
    });

    // Log successful creation
    logger.info('Pemeriksaan kesehatan berhasil dibuat via controller', {
      pemeriksaanId: pemeriksaan.id,
      lansiaId: lansia.id,
      kode: lansia.kode,
      klasifikasiGula: pemeriksaan.klasifikasiGula,
      klasifikasiKolesterol: pemeriksaan.klasifikasiKolesterol,
      createdBy: userId,
      createdByRole: userRole,
      ip: req.ip,
    });

    // Return created pemeriksaan data
    // Status 201 Created untuk resource baru
    res.status(201).json(pemeriksaan);
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
 * Create Pemeriksaan Gabungan Controller
 *
 * Handle POST /api/lansia/:kode/pemeriksaan
 *
 * Proses:
 * 1. Extract kode dari route params
 * 2. Extract data pemeriksaan gabungan dari request body (sudah divalidasi)
 * 3. Get lansia by kode untuk mendapatkan lansiaId
 * 4. Call pemeriksaanService.createPemeriksaanGabungan
 * 5. Return pemeriksaan dengan hasil kalkulasi dan klasifikasi
 *
 * Validasi:
 * - Request body divalidasi oleh validateMiddleware dengan pemeriksaanGabunganSchema
 * - Semua field optional, minimal satu harus diisi
 * - Jika ada pemeriksaan fisik, semua field fisik harus lengkap
 * - Semua nilai harus dalam rentang valid
 *
 * Kalkulasi dan Klasifikasi Otomatis:
 * - BMI dihitung jika ada data tinggi dan berat
 * - Tekanan darah dikategorikan jika ada data sistolik dan diastolik
 * - Semua nilai lab dikategorikan sesuai standar medis
 *
 * Use Case:
 * - Endpoint ini digunakan untuk pemeriksaan lengkap (fisik + kesehatan)
 * - Atau untuk pemeriksaan parsial (hanya beberapa parameter)
 * - Lebih fleksibel daripada endpoint fisik atau kesehatan terpisah
 *
 * Security:
 * - Endpoint ini protected oleh authMiddleware
 * - Dapat diakses oleh ADMIN dan PETUGAS
 *
 * @param req - Express request object dengan params: { kode } dan body: PemeriksaanGabunganDTO
 * @param res - Express response object
 * @param next - Express next function untuk error handling
 *
 * @example
 * // Request - Pemeriksaan lengkap
 * POST /api/lansia/pasien202511031a/pemeriksaan
 * Cookie: token=<jwt_token>
 * Content-Type: application/json
 * {
 *   "tinggi": 165,
 *   "berat": 60,
 *   "sistolik": 120,
 *   "diastolik": 80,
 *   "asamUrat": 5.5,
 *   "gulaPuasa": 95,
 *   "kolesterol": 180
 * }
 *
 * // Response (201 Created)
 * {
 *   "id": 3,
 *   "lansiaId": 1,
 *   "tanggal": "2025-11-03T10:00:00.000Z",
 *   "tinggi": 165,
 *   "berat": 60,
 *   "bmi": 22.04,
 *   "kategoriBmi": "Normal",
 *   "sistolik": 120,
 *   "diastolik": 80,
 *   "tekananDarah": "Normal",
 *   "asamUrat": 5.5,
 *   "gulaPuasa": 95,
 *   "gulaSewaktu": null,
 *   "gula2Jpp": null,
 *   "klasifikasiGula": {
 *     "gdp": "Normal"
 *   },
 *   "kolesterol": 180,
 *   "klasifikasiKolesterol": "Normal",
 *   "createdAt": "2025-11-03T10:00:00.000Z"
 * }
 *
 * @example
 * // Request - Pemeriksaan parsial (hanya kesehatan)
 * POST /api/lansia/pasien202511031a/pemeriksaan
 * Cookie: token=<jwt_token>
 * Content-Type: application/json
 * {
 *   "gulaPuasa": 110,
 *   "kolesterol": 220
 * }
 *
 * // Response (201 Created)
 * {
 *   "id": 4,
 *   "lansiaId": 1,
 *   "tanggal": "2025-11-03T10:00:00.000Z",
 *   "tinggi": null,
 *   "berat": null,
 *   "bmi": null,
 *   "kategoriBmi": null,
 *   "sistolik": null,
 *   "diastolik": null,
 *   "tekananDarah": null,
 *   "asamUrat": null,
 *   "gulaPuasa": 110,
 *   "gulaSewaktu": null,
 *   "gula2Jpp": null,
 *   "klasifikasiGula": {
 *     "gdp": "Pra-Diabetes"
 *   },
 *   "kolesterol": 220,
 *   "klasifikasiKolesterol": "Batas Tinggi",
 *   "createdAt": "2025-11-03T10:00:00.000Z"
 * }
 *
 * // Response (404 Not Found) - lansia tidak ditemukan
 * {
 *   "error": "Lansia tidak ditemukan"
 * }
 *
 * // Response (400 Bad Request) - validasi gagal
 * {
 *   "error": "Validasi input gagal",
 *   "details": {
 *     "_errors": ["Jika mengisi pemeriksaan fisik, semua field (tinggi, berat, sistolik, diastolik) harus diisi"]
 *   }
 * }
 */
export const createPemeriksaanGabungan = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Extract kode dari route params
    const { kode } = req.params;

    // Validasi kode exists
    if (!kode) {
      logger.warn('createPemeriksaanGabungan: kode tidak ditemukan di params', {
        ip: req.ip,
      });
      throw new ValidationError('Kode pasien tidak ditemukan');
    }

    // Extract data pemeriksaan dari request body
    // Body sudah divalidasi oleh validateMiddleware dengan pemeriksaanGabunganSchema
    const {
      tinggi,
      berat,
      sistolik,
      diastolik,
      asamUrat,
      gulaPuasa,
      gulaSewaktu,
      gula2Jpp,
      kolesterol,
    } = req.body;

    // Get user info untuk logging
    const userId = req.user?.userId;
    const userRole = req.user?.role;

    // Get lansia by kode untuk mendapatkan lansiaId
    const lansia = await getLansiaByKode(kode);

    // Call pemeriksaanService untuk create pemeriksaan gabungan
    const pemeriksaan = await createPemeriksaanGabunganService(lansia.id, {
      tinggi,
      berat,
      sistolik,
      diastolik,
      asamUrat,
      gulaPuasa,
      gulaSewaktu,
      gula2Jpp,
      kolesterol,
    });

    // Determine jenis pemeriksaan untuk logging
    const hasFisik = !!(tinggi && berat && sistolik && diastolik);
    const hasKesehatan = !!(asamUrat || gulaPuasa || gulaSewaktu || gula2Jpp || kolesterol);

    let jenisPemeriksaan = 'gabungan';
    if (hasFisik && !hasKesehatan) {
      jenisPemeriksaan = 'fisik';
    } else if (!hasFisik && hasKesehatan) {
      jenisPemeriksaan = 'kesehatan';
    }

    // Log successful creation
    logger.info('Pemeriksaan gabungan berhasil dibuat via controller', {
      pemeriksaanId: pemeriksaan.id,
      lansiaId: lansia.id,
      kode: lansia.kode,
      jenisPemeriksaan,
      hasFisik,
      hasKesehatan,
      bmi: pemeriksaan.bmi,
      kategoriBmi: pemeriksaan.kategoriBmi,
      tekananDarah: pemeriksaan.tekananDarah,
      klasifikasiGula: pemeriksaan.klasifikasiGula,
      klasifikasiKolesterol: pemeriksaan.klasifikasiKolesterol,
      createdBy: userId,
      createdByRole: userRole,
      ip: req.ip,
    });

    // Return created pemeriksaan data
    // Status 201 Created untuk resource baru
    res.status(201).json(pemeriksaan);
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
