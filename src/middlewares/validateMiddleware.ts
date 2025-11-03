/**
 * Validate Middleware
 * 
 * Middleware factory untuk validasi input request menggunakan Zod schemas.
 * Memvalidasi request body, query parameters, atau route parameters.
 * 
 * Prinsip yang diterapkan:
 * - Single Responsibility: Hanya handle validasi input
 * - Open/Closed: Extensible melalui factory pattern tanpa modifikasi
 * - Liskov Substitution: Dapat digunakan di mana saja middleware diperlukan
 * - Interface Segregation: Interface sederhana (schema + target)
 * - Dependency Inversion: Depend pada Zod abstraction
 * - Factory Pattern: Menghasilkan middleware yang dikonfigurasi
 * - Fail-Fast: Validasi gagal langsung return error
 * - Type Safety: Menggunakan TypeScript generics untuk type inference
 */

import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';
import logger from '../utils/logger';

/**
 * Target validasi dalam request
 * - body: Request body (POST, PUT, PATCH)
 * - query: Query parameters (GET)
 * - params: Route parameters (/:id)
 */
export type ValidationTarget = 'body' | 'query' | 'params';

/**
 * Format error details dari Zod validation
 * Mengubah Zod error menjadi format yang user-friendly
 * 
 * @param error - ZodError dari validasi
 * @returns Object dengan field errors
 */
const formatZodError = (error: ZodError): Record<string, string[]> => {
  const formatted: Record<string, string[]> = {};
  
  error.errors.forEach((err) => {
    const path = err.path.join('.');
    const message = err.message;
    
    if (!formatted[path]) {
      formatted[path] = [];
    }
    
    formatted[path].push(message);
  });
  
  return formatted;
};

/**
 * Validate Middleware Factory
 * 
 * Factory function yang menghasilkan middleware untuk validasi input request.
 * Middleware yang dihasilkan akan memvalidasi bagian request yang ditentukan
 * menggunakan Zod schema yang diberikan.
 * 
 * Proses:
 * 1. Extract data dari request sesuai target (body/query/params)
 * 2. Validasi data menggunakan Zod schema
 * 3. Jika valid, attach validated data kembali ke request dan call next()
 * 4. Jika invalid, return 400 dengan detail error validasi
 * 
 * Keuntungan:
 * - Type safety: Validated data memiliki type yang benar
 * - Data transformation: Zod dapat transform data (trim, parse, dll)
 * - Fail-fast: Error validasi langsung ditangkap sebelum masuk controller
 * - Consistent error format: Semua validation error memiliki format sama
 * 
 * @param schema - Zod schema untuk validasi
 * @param target - Bagian request yang akan divalidasi (default: 'body')
 * @returns Express middleware function
 * 
 * @example
 * // Validasi request body
 * router.post('/lansia', validate(createLansiaSchema), createLansiaController);
 * 
 * @example
 * // Validasi query parameters
 * router.get('/lansia', validate(kodePasienQuerySchema, 'query'), getLansiaController);
 * 
 * @example
 * // Validasi route parameters
 * router.get('/lansia/:kode', validate(kodeParamSchema, 'params'), getLansiaByKodeController);
 */
export const validate = <T>(
  schema: ZodSchema<T>,
  target: ValidationTarget = 'body'
) => {
  // Validasi input factory
  if (!schema) {
    logger.error('validate: schema tidak boleh undefined', { target });
    throw new Error('validate: schema tidak boleh undefined');
  }

  // Return middleware function
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      // Extract data dari request sesuai target
      const dataToValidate = req[target];

      // Log validation attempt
      logger.debug('Memulai validasi request', {
        target,
        path: req.path,
        method: req.method,
        hasData: !!dataToValidate,
      });

      // Validasi data menggunakan Zod schema
      // parse() akan throw ZodError jika validasi gagal
      const validatedData = schema.parse(dataToValidate);

      // Attach validated data kembali ke request
      // Data sudah di-transform oleh Zod (trim, parse, dll)
      (req as any)[target] = validatedData;

      // Log validation success
      logger.debug('Validasi berhasil', {
        target,
        path: req.path,
        method: req.method,
      });

      // Lanjutkan ke handler berikutnya
      next();
    } catch (error) {
      // Handle Zod validation error
      if (error instanceof ZodError) {
        // Format error untuk response
        const formattedErrors = formatZodError(error);

        // Log validation failure
        logger.warn('Validasi gagal', {
          target,
          path: req.path,
          method: req.method,
          errors: formattedErrors,
          ip: req.ip,
        });

        // Return 400 dengan detail error
        res.status(400).json({
          error: 'Validasi input gagal',
          details: formattedErrors,
        });
        return;
      }

      // Unexpected error
      logger.error('validate: Unexpected error', {
        error: error instanceof Error ? error.message : 'Unknown error',
        target,
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
 * Helper function untuk validasi request body
 * Shortcut untuk validate(schema, 'body')
 * 
 * Ini adalah use case paling umum, sehingga dibuat helper
 * untuk meningkatkan readability dan mengurangi boilerplate.
 * 
 * @param schema - Zod schema untuk validasi body
 * @returns Express middleware function
 * 
 * @example
 * router.post('/auth/login', validateBody(loginRequestSchema), loginController);
 * router.post('/lansia', authMiddleware, validateBody(createLansiaSchema), createLansiaController);
 */
export const validateBody = <T>(schema: ZodSchema<T>) => validate(schema, 'body');

/**
 * Helper function untuk validasi query parameters
 * Shortcut untuk validate(schema, 'query')
 * 
 * Digunakan untuk endpoint GET dengan query parameters.
 * 
 * @param schema - Zod schema untuk validasi query
 * @returns Express middleware function
 * 
 * @example
 * router.get('/lansia', authMiddleware, validateQuery(kodePasienQuerySchema), getLansiaController);
 */
export const validateQuery = <T>(schema: ZodSchema<T>) => validate(schema, 'query');

/**
 * Helper function untuk validasi route parameters
 * Shortcut untuk validate(schema, 'params')
 * 
 * Digunakan untuk validasi parameter di URL path (/:id, /:kode, dll).
 * 
 * @param schema - Zod schema untuk validasi params
 * @returns Express middleware function
 * 
 * @example
 * const kodeParamSchema = z.object({ kode: z.string().min(1) });
 * router.get('/lansia/:kode', authMiddleware, validateParams(kodeParamSchema), getLansiaByKodeController);
 */
export const validateParams = <T>(schema: ZodSchema<T>) => validate(schema, 'params');
