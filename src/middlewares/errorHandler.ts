/**
 * Error Handler Middleware
 * 
 * Global error handler untuk Express application.
 * Menangkap semua errors yang di-throw atau di-pass ke next(error).
 * 
 * Prinsip yang diterapkan:
 * - Single Responsibility: Hanya handle error formatting dan response
 * - Open/Closed: Dapat handle error types baru tanpa modifikasi
 * - Dependency Inversion: Depend pada Error abstraction
 * - Fail-Safe: Selalu return response, tidak pernah crash
 * - Security: Tidak expose sensitive information di production
 * - Logging: Log semua errors untuk monitoring dan debugging
 */

import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import {
  AppError,
  ValidationError,
  NotFoundError,
  isOperationalError,
} from '../utils/errors';
import logger from '../utils/logger';

/**
 * Interface untuk error response
 * Konsisten dengan format yang digunakan di seluruh aplikasi
 */
interface ErrorResponse {
  error: string;
  details?: any;
}

/**
 * Format Zod validation errors
 * Mengubah ZodError menjadi format yang user-friendly
 * 
 * @param error - ZodError instance
 * @returns Formatted error details
 */
const formatZodError = (error: ZodError): Record<string, string[]> => {
  const formatted: Record<string, string[]> = {};

  error.errors.forEach((err) => {
    const path = err.path.join('.') || 'general';
    const message = err.message;

    if (!formatted[path]) {
      formatted[path] = [];
    }

    formatted[path].push(message);
  });

  return formatted;
};

/**
 * Determine apakah error details harus di-include dalam response
 * Di production, hanya include details untuk operational errors
 * 
 * @param error - Error instance
 * @returns true jika details harus di-include
 */
const shouldIncludeDetails = (error: Error): boolean => {
  // Di development, selalu include details
  if (process.env.NODE_ENV !== 'production') {
    return true;
  }

  // Di production, hanya include untuk operational errors
  return isOperationalError(error);
};

/**
 * Get error message yang aman untuk di-expose ke client
 * Di production, gunakan generic message untuk non-operational errors
 * 
 * @param error - Error instance
 * @param defaultMessage - Default message jika error message tidak aman
 * @returns Safe error message
 */
const getSafeErrorMessage = (error: Error, defaultMessage: string): string => {
  // Di development, selalu return actual message
  if (process.env.NODE_ENV !== 'production') {
    return error.message || defaultMessage;
  }

  // Di production, check apakah operational error
  if (isOperationalError(error)) {
    return error.message || defaultMessage;
  }

  // Non-operational errors: gunakan generic message
  return defaultMessage;
};

/**
 * Global Error Handler Middleware
 * 
 * Middleware ini harus dipasang sebagai middleware terakhir di Express app.
 * Menangkap semua errors yang tidak di-handle oleh middleware sebelumnya.
 * 
 * Proses:
 * 1. Identify error type (custom error, Zod error, atau generic error)
 * 2. Extract status code dan error details
 * 3. Log error dengan level yang sesuai
 * 4. Format error response
 * 5. Send response ke client
 * 
 * Error Handling Strategy:
 * - Custom AppError: Use statusCode dan message dari error
 * - ZodError: Return 400 dengan validation details
 * - Generic Error: Return 500 dengan generic message
 * 
 * Security Considerations:
 * - Di production, tidak expose stack traces
 * - Di production, gunakan generic message untuk unexpected errors
 * - Tidak expose internal implementation details
 * 
 * @param err - Error object
 * @param req - Express request object
 * @param res - Express response object
 * @param next - Express next function (tidak digunakan, tapi required untuk signature)
 */
export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction
): void => {
  // Default values
  let statusCode = 500;
  let errorMessage = 'Terjadi kesalahan pada sistem';
  let errorDetails: any = undefined;

  // Log context untuk semua errors
  const logContext = {
    path: req.path,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('user-agent'),
    userId: req.user?.userId,
  };

  // Handle custom AppError instances
  if (err instanceof AppError) {
    statusCode = err.statusCode;
    errorMessage = getSafeErrorMessage(err, errorMessage);

    // Include details untuk ValidationError dan NotFoundError
    if (err instanceof ValidationError && err.details) {
      errorDetails = err.details;
    } else if (err instanceof NotFoundError && err.resource) {
      errorDetails = { resource: err.resource };
    }

    // Log dengan level yang sesuai
    if (statusCode >= 500) {
      logger.error('Application error', {
        ...logContext,
        error: err.message,
        statusCode,
        stack: err.stack,
        isOperational: err.isOperational,
      });
    } else {
      logger.warn('Client error', {
        ...logContext,
        error: err.message,
        statusCode,
        details: errorDetails,
      });
    }
  }
  // Handle Zod validation errors (fallback jika tidak di-handle oleh validateMiddleware)
  else if (err instanceof ZodError) {
    statusCode = 400;
    errorMessage = 'Validasi input gagal';
    errorDetails = formatZodError(err);

    logger.warn('Validation error', {
      ...logContext,
      error: errorMessage,
      details: errorDetails,
    });
  }
  // Handle generic errors
  else {
    // Check apakah error memiliki statusCode property (dari library lain)
    if ('statusCode' in err && typeof (err as any).statusCode === 'number') {
      statusCode = (err as any).statusCode;
    }

    errorMessage = getSafeErrorMessage(err, errorMessage);

    // Log unexpected errors dengan level error
    logger.error('Unexpected error', {
      ...logContext,
      error: err.message,
      statusCode,
      stack: err.stack,
      errorName: err.name,
    });
  }

  // Construct error response
  const errorResponse: ErrorResponse = {
    error: errorMessage,
  };

  // Include details jika ada dan aman untuk di-expose
  if (errorDetails && shouldIncludeDetails(err)) {
    errorResponse.details = errorDetails;
  }

  // Include stack trace di development
  if (process.env.NODE_ENV === 'development' && err.stack) {
    (errorResponse as any).stack = err.stack;
  }

  // Send error response
  res.status(statusCode).json(errorResponse);
};

/**
 * Not Found Handler
 * 
 * Middleware untuk handle 404 errors (route tidak ditemukan).
 * Harus dipasang sebelum errorHandler tapi setelah semua routes.
 * 
 * @param req - Express request object
 * @param res - Express response object
 * @param next - Express next function
 */
export const notFoundHandler = (
  req: Request,
  _res: Response,
  next: NextFunction
): void => {
  const error = new NotFoundError(
    `Route ${req.method} ${req.path} tidak ditemukan`,
    'Route'
  );

  logger.warn('Route not found', {
    path: req.path,
    method: req.method,
    ip: req.ip,
  });

  // Pass error ke error handler
  next(error);
};
