/**
 * Express Application Setup
 *
 * File ini bertanggung jawab untuk setup dan konfigurasi Express application.
 * Mengimplementasikan layered architecture dengan separation of concerns.
 *
 * Prinsip yang diterapkan:
 * - Single Responsibility: Hanya setup Express app dan routing
 * - Dependency Inversion: Depend pada controllers dan middlewares abstractions
 * - Separation of Concerns: Routes terorganisir per module
 * - Security: Helmet, CORS, rate limiting, httpOnly cookies
 * - Error Handling: Global error handler
 * - Maintainability: Kode terorganisir dan mudah dibaca
 */

import express, { Application, Request, Response } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';

// Middlewares
import {
  errorHandler,
  createRateLimiter,
  authMiddleware,
  roleGuard,
  validate,
} from './middlewares';

// Controllers
import * as authController from './controllers/authController';
import * as profilController from './controllers/profilController';
import * as petugasController from './controllers/petugasController';
import * as lansiaController from './controllers/lansiaController';
import * as pemeriksaanController from './controllers/pemeriksaanController';

// Validators
import {
  loginRequestSchema,
  createPetugasSchema,
  updateNamaSchema,
  updatePasswordSchema,
  updateStatusPetugasSchema,
  createLansiaSchema,
  findLansiaSchema,
  pemeriksaanFisikSchema,
  pemeriksaanKesehatanSchema,
  pemeriksaanGabunganSchema,
} from './utils/validators';

// Logger
import logger from './utils/logger';

// Utilities
import { asyncHandler } from './utils/asyncHandler';

/**
 * Create Express Application
 *
 * Setup Express app dengan semua middlewares dan routes.
 *
 * @returns Configured Express application
 */
const createApp = (): Application => {
  const app = express();

  // ============================================
  // SECURITY MIDDLEWARES
  // ============================================

  /**
   * Helmet - Security headers
   *
   * Mengatur berbagai HTTP headers untuk keamanan:
   * - X-Content-Type-Options: nosniff
   * - X-Frame-Options: DENY
   * - X-XSS-Protection: 1; mode=block
   * - Strict-Transport-Security (HSTS)
   */
  app.use(helmet());

  /**
   * CORS - Cross-Origin Resource Sharing
   *
   * Konfigurasi:
   * - origin: Frontend URL dari environment variable
   * - credentials: true untuk allow cookies
   * - optionsSuccessStatus: 200 untuk legacy browser support
   */
  const corsOptions = {
    origin: process.env.APP_URL || 'https://posyandu-digital.vercel.app',
    credentials: true,
    optionsSuccessStatus: 200,
  };
  app.use(cors(corsOptions));

  // ============================================
  // BODY PARSING MIDDLEWARES
  // ============================================

  /**
   * JSON Body Parser
   * Parse incoming requests dengan JSON payloads
   * Limit: 10mb untuk prevent large payload attacks
   */
  app.use(express.json({ limit: '10mb' }));

  /**
   * URL-encoded Body Parser
   * Parse incoming requests dengan URL-encoded payloads
   */
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  /**
   * Cookie Parser
   * Parse cookies dari request headers
   * Diperlukan untuk JWT authentication via httpOnly cookies
   */
  app.use(cookieParser());

  // ============================================
  // RATE LIMITING
  // ============================================

  /**
   * Login Rate Limiter
   *
   * Proteksi dari brute force attacks pada login endpoint.
   * Konfigurasi:
   * - 5 attempts per 15 menit per IP address
   * - Block duration: 15 menit setelah limit exceeded
   */
  const loginRateLimiter = createRateLimiter({
    points: 5,
    duration: 900, // 15 menit
    message: 'Terlalu banyak percobaan login, coba lagi nanti',
    keyPrefix: 'login',
  });

  // ============================================
  // HEALTH CHECK ENDPOINT
  // ============================================

  /**
   * Health Check
   *
   * Endpoint untuk monitoring dan health checks.
   * Tidak memerlukan autentikasi.
   *
   * @route GET /health
   * @returns Status OK dengan timestamp
   */
  app.get('/health', (_req: Request, res: Response) => {
    res.status(200).json({
      status: 'OK',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development',
    });
  });

  // ============================================
  // API ROUTES
  // ============================================

  /**
   * API Router
   *
   * Semua API routes dimulai dengan prefix /api
   * Menggunakan Express Router untuk modular routing
   */
  const apiRouter = express.Router();

  // --------------------------------------------
  // AUTH ROUTES
  // --------------------------------------------

  /**
   * Authentication Routes
   *
   * Endpoints untuk autentikasi user (login, logout).
   * Login endpoint protected dengan rate limiter.
   */
  const authRouter = express.Router();

  /**
   * POST /api/auth/login
   *
   * Login user dengan email dan kata sandi.
   * Protected dengan rate limiter (5 attempts per 15 menit).
   *
   * @middleware loginRateLimiter - Rate limiting
   * @middleware validate - Validasi request body
   * @controller authController.login
   */
  authRouter.post(
    '/login',
    asyncHandler(loginRateLimiter),
    validate(loginRequestSchema),
    asyncHandler(authController.login)
  );

  /**
   * POST /api/auth/logout
   *
   * Logout user dengan menghapus JWT cookie.
   * Memerlukan autentikasi.
   *
   * @middleware authMiddleware - Autentikasi JWT
   * @controller authController.logout
   */
  authRouter.post('/logout', authMiddleware, authController.logout);

  apiRouter.use('/auth', authRouter);

  // --------------------------------------------
  // PROFILE ROUTES
  // --------------------------------------------

  /**
   * Profile Routes
   *
   * Endpoints untuk manajemen profil user.
   * Semua endpoints memerlukan autentikasi.
   */
  const profileRouter = express.Router();

  // Apply auth middleware untuk semua profile routes
  profileRouter.use(authMiddleware);

  /**
   * GET /api/profile
   *
   * Get profil user yang sedang login.
   *
   * @middleware authMiddleware - Autentikasi JWT
   * @controller profilController.getProfile
   */
  profileRouter.get('/', asyncHandler(profilController.getProfile));

  /**
   * PATCH /api/profile/nama
   *
   * Update nama user yang sedang login.
   *
   * @middleware authMiddleware - Autentikasi JWT
   * @middleware validate - Validasi request body
   * @controller profilController.updateNamaController
   */
  profileRouter.patch(
    '/nama',
    validate(updateNamaSchema),
    asyncHandler(profilController.updateNamaController)
  );

  /**
   * PATCH /api/profile/password
   *
   * Update password user yang sedang login.
   *
   * @middleware authMiddleware - Autentikasi JWT
   * @middleware validate - Validasi request body
   * @controller profilController.updatePasswordController
   */
  profileRouter.patch(
    '/password',
    validate(updatePasswordSchema),
    asyncHandler(profilController.updatePasswordController)
  );

  apiRouter.use('/profile', profileRouter);

  // --------------------------------------------
  // PETUGAS ROUTES (ADMIN ONLY)
  // --------------------------------------------

  /**
   * Petugas Routes
   *
   * Endpoints untuk manajemen petugas (CRUD).
   * Semua endpoints hanya dapat diakses oleh ADMIN.
   */
  const petugasRouter = express.Router();

  // Apply auth middleware dan role guard untuk semua petugas routes
  petugasRouter.use(authMiddleware, roleGuard(['ADMIN']));

  /**
   * POST /api/petugas
   *
   * Create petugas baru.
   * Hanya dapat diakses oleh ADMIN.
   *
   * @middleware authMiddleware - Autentikasi JWT
   * @middleware roleGuard - Otorisasi role ADMIN
   * @middleware validate - Validasi request body
   * @controller petugasController.createPetugas
   */
  petugasRouter.post(
    '/',
    validate(createPetugasSchema),
    asyncHandler(petugasController.createPetugas)
  );

  /**
   * GET /api/petugas
   *
   * Get daftar semua petugas.
   * Hanya dapat diakses oleh ADMIN.
   *
   * @middleware authMiddleware - Autentikasi JWT
   * @middleware roleGuard - Otorisasi role ADMIN
   * @controller petugasController.getAllPetugas
   */
  petugasRouter.get('/', asyncHandler(petugasController.getAllPetugas));

  /**
   * PATCH /api/petugas/:id/status
   *
   * Update status aktif petugas.
   * Hanya dapat diakses oleh ADMIN.
   *
   * @middleware authMiddleware - Autentikasi JWT
   * @middleware roleGuard - Otorisasi role ADMIN
   * @middleware validate - Validasi request body
   * @controller petugasController.updateStatusPetugas
   */
  petugasRouter.patch(
    '/:id/status',
    validate(updateStatusPetugasSchema),
    asyncHandler(petugasController.updateStatusPetugas)
  );

  apiRouter.use('/petugas', petugasRouter);

  // --------------------------------------------
  // LANSIA ROUTES
  // --------------------------------------------

  /**
   * Lansia Routes
   *
   * Endpoints untuk manajemen data lansia.
   * Semua endpoints memerlukan autentikasi.
   * Dapat diakses oleh ADMIN dan PETUGAS.
   */
  const lansiaRouter = express.Router();

  // Apply auth middleware untuk semua lansia routes
  lansiaRouter.use(authMiddleware);

  /**
   * POST /api/lansia
   *
   * Create data lansia baru dengan kode pasien unik.
   *
   * @middleware authMiddleware - Autentikasi JWT
   * @middleware validate - Validasi request body
   * @controller lansiaController.createLansia
   */
  lansiaRouter.post('/', validate(createLansiaSchema), asyncHandler(lansiaController.createLansia));

  /**
   * GET /api/lansia
   *
   * Get daftar lansia atau filter by kode (query parameter).
   *
   * @middleware authMiddleware - Autentikasi JWT
   * @controller lansiaController.getLansia
   */
  lansiaRouter.get('/', asyncHandler(lansiaController.getLansia));

  /**
   * GET /api/lansia/:kode
   *
   * Get data lansia by kode pasien.
   *
   * @middleware authMiddleware - Autentikasi JWT
   * @controller lansiaController.getLansiaByKodeParam
   */
  lansiaRouter.get('/:kode', asyncHandler(lansiaController.getLansiaByKodeParam));

  /**
   * GET /api/lansia/:kode/pemeriksaan
   *
   * Get riwayat pemeriksaan lansia by kode pasien.
   *
   * @middleware authMiddleware - Autentikasi JWT
   * @controller lansiaController.getPemeriksaanByKode
   */
  lansiaRouter.get('/:kode/pemeriksaan', asyncHandler(lansiaController.getPemeriksaanByKode));

  apiRouter.use('/lansia', lansiaRouter);

  // --------------------------------------------
  // FIND LANSIA ROUTE
  // --------------------------------------------

  /**
   * POST /api/find
   *
   * Find lansia dengan minimal data (quick lookup).
   * Endpoint terpisah untuk use case spesifik.
   *
   * @middleware authMiddleware - Autentikasi JWT
   * @middleware validate - Validasi request body
   * @controller lansiaController.findLansia
   */
  apiRouter.post(
    '/find',
    authMiddleware,
    validate(findLansiaSchema),
    asyncHandler(lansiaController.findLansia)
  );

  // --------------------------------------------
  // PEMERIKSAAN ROUTES
  // --------------------------------------------

  /**
   * Pemeriksaan Routes
   *
   * Endpoints untuk pencatatan pemeriksaan kesehatan lansia.
   * Semua endpoints memerlukan autentikasi.
   * Dapat diakses oleh ADMIN dan PETUGAS.
   *
   * Routes menggunakan :kode sebagai parameter untuk identifikasi lansia.
   */
  const pemeriksaanRouter = express.Router();

  // Apply auth middleware untuk semua pemeriksaan routes
  pemeriksaanRouter.use(authMiddleware);

  /**
   * POST /api/lansia/:kode/pemeriksaan/fisik
   *
   * Create pemeriksaan fisik dengan kalkulasi BMI dan klasifikasi tekanan darah.
   *
   * @middleware authMiddleware - Autentikasi JWT
   * @middleware validate - Validasi request body
   * @controller pemeriksaanController.createPemeriksaanFisik
   */
  pemeriksaanRouter.post(
    '/:kode/pemeriksaan/fisik',
    validate(pemeriksaanFisikSchema),
    asyncHandler(pemeriksaanController.createPemeriksaanFisik)
  );

  /**
   * POST /api/lansia/:kode/pemeriksaan/kesehatan
   *
   * Create pemeriksaan kesehatan dengan klasifikasi nilai laboratorium.
   *
   * @middleware authMiddleware - Autentikasi JWT
   * @middleware validate - Validasi request body
   * @controller pemeriksaanController.createPemeriksaanKesehatan
   */
  pemeriksaanRouter.post(
    '/:kode/pemeriksaan/kesehatan',
    validate(pemeriksaanKesehatanSchema),
    asyncHandler(pemeriksaanController.createPemeriksaanKesehatan)
  );

  /**
   * POST /api/lansia/:kode/pemeriksaan
   *
   * Create pemeriksaan gabungan (fisik + kesehatan).
   * Endpoint fleksibel untuk pemeriksaan lengkap atau parsial.
   *
   * @middleware authMiddleware - Autentikasi JWT
   * @middleware validate - Validasi request body
   * @controller pemeriksaanController.createPemeriksaanGabungan
   */
  pemeriksaanRouter.post(
    '/:kode/pemeriksaan',
    validate(pemeriksaanGabunganSchema),
    asyncHandler(pemeriksaanController.createPemeriksaanGabungan)
  );

  apiRouter.use('/lansia', pemeriksaanRouter);

  // Mount API router
  app.use('/api', apiRouter);

  // ============================================
  // 404 HANDLER
  // ============================================

  /**
   * 404 Not Found Handler
   *
   * Handle requests ke routes yang tidak terdefinisi.
   * Harus ditempatkan setelah semua routes.
   */
  app.use((req: Request, res: Response) => {
    logger.warn('Route tidak ditemukan', {
      method: req.method,
      path: req.path,
      ip: req.ip,
    });

    res.status(404).json({
      error: 'Route tidak ditemukan',
      path: req.path,
    });
  });

  // ============================================
  // ERROR HANDLER
  // ============================================

  /**
   * Global Error Handler
   *
   * Handle semua errors yang terjadi di aplikasi.
   * Harus ditempatkan sebagai middleware terakhir.
   *
   * Error handler akan:
   * - Format error response secara konsisten
   * - Map custom error classes ke HTTP status codes
   * - Log errors untuk monitoring
   */
  app.use(errorHandler);

  // Log successful app initialization
  logger.info('Express application initialized', {
    environment: process.env.NODE_ENV || 'development',
    corsOrigin: corsOptions.origin,
  });

  return app;
};

// Create and export app
const app = createApp();

export default app;
