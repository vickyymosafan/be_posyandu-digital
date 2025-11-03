/**
 * Entry Point untuk Local Development
 * 
 * File ini adalah entry point untuk menjalankan aplikasi di local development.
 * Bertanggung jawab untuk start HTTP server dan listen pada port yang ditentukan.
 * 
 * Prinsip yang diterapkan:
 * - Single Responsibility: Hanya bertanggung jawab untuk start server
 * - Separation of Concerns: App configuration ada di app.ts
 * - Error Handling: Handle server startup errors
 * - Graceful Shutdown: Handle SIGTERM dan SIGINT untuk cleanup
 * - Logging: Structured logging untuk monitoring
 */

import app from './app';
import logger from './utils/logger';

/**
 * Get port dari environment variable atau gunakan default
 * Default port: 3001 (sesuai .env.example)
 */
const PORT = process.env.PORT || 3001;

/**
 * Start HTTP Server
 * 
 * Proses:
 * 1. Listen pada port yang ditentukan
 * 2. Log server info setelah berhasil start
 * 3. Handle server errors
 * 4. Setup graceful shutdown handlers
 */
const server = app.listen(PORT, () => {
  logger.info('Server berhasil dijalankan', {
    port: PORT,
    environment: process.env.NODE_ENV || 'development',
    nodeVersion: process.version,
    timestamp: new Date().toISOString(),
  });

  // Log additional info untuk development
  if (process.env.NODE_ENV !== 'production') {
    logger.info('Server siap menerima requests', {
      url: `http://localhost:${PORT}`,
      healthCheck: `http://localhost:${PORT}/health`,
      apiBase: `http://localhost:${PORT}/api`,
    });
  }
});

/**
 * Handle Server Errors
 * 
 * Handle errors yang terjadi saat server startup atau runtime.
 * Errors yang umum:
 * - EADDRINUSE: Port sudah digunakan
 * - EACCES: Tidak ada permission untuk bind ke port
 */
server.on('error', (error: NodeJS.ErrnoException) => {
  if (error.code === 'EADDRINUSE') {
    logger.error('Port sudah digunakan', {
      port: PORT,
      error: error.message,
    });
    process.exit(1);
  } else if (error.code === 'EACCES') {
    logger.error('Tidak ada permission untuk bind ke port', {
      port: PORT,
      error: error.message,
    });
    process.exit(1);
  } else {
    logger.error('Server error', {
      error: error.message,
      code: error.code,
      stack: error.stack,
    });
    process.exit(1);
  }
});

/**
 * Graceful Shutdown Handler
 * 
 * Handle SIGTERM dan SIGINT signals untuk graceful shutdown.
 * Proses:
 * 1. Log shutdown signal
 * 2. Stop accepting new connections
 * 3. Close existing connections
 * 4. Exit process
 * 
 * Graceful shutdown penting untuk:
 * - Menyelesaikan requests yang sedang diproses
 * - Cleanup resources (database connections, dll)
 * - Prevent data corruption
 */
const gracefulShutdown = (signal: string) => {
  logger.info('Menerima shutdown signal', {
    signal,
    timestamp: new Date().toISOString(),
  });

  // Stop accepting new connections
  server.close(() => {
    logger.info('Server berhasil di-shutdown', {
      signal,
      timestamp: new Date().toISOString(),
    });

    // Exit process
    process.exit(0);
  });

  // Force shutdown setelah 10 detik jika masih ada connections
  setTimeout(() => {
    logger.warn('Forcing shutdown karena timeout', {
      signal,
      timestamp: new Date().toISOString(),
    });
    process.exit(1);
  }, 10000);
};

/**
 * Register Shutdown Handlers
 * 
 * SIGTERM: Termination signal (dari process manager seperti PM2, Docker)
 * SIGINT: Interrupt signal (Ctrl+C di terminal)
 */
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

/**
 * Handle Unhandled Promise Rejections
 * 
 * Catch unhandled promise rejections untuk prevent crash.
 * Log error dan exit process untuk restart oleh process manager.
 */
process.on('unhandledRejection', (reason: any, promise: Promise<any>) => {
  logger.error('Unhandled Promise Rejection', {
    reason: reason instanceof Error ? reason.message : reason,
    stack: reason instanceof Error ? reason.stack : undefined,
    promise: promise.toString(),
  });

  // Exit process untuk restart oleh process manager
  process.exit(1);
});

/**
 * Handle Uncaught Exceptions
 * 
 * Catch uncaught exceptions untuk prevent crash.
 * Log error dan exit process untuk restart oleh process manager.
 */
process.on('uncaughtException', (error: Error) => {
  logger.error('Uncaught Exception', {
    error: error.message,
    stack: error.stack,
  });

  // Exit process untuk restart oleh process manager
  process.exit(1);
});

// Export server untuk testing purposes
export default server;
