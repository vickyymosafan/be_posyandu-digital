/**
 * Shared Prisma Client Instance
 *
 * File ini menyediakan singleton instance dari PrismaClient untuk digunakan
 * di seluruh aplikasi. Menggunakan pattern singleton untuk menghindari
 * multiple database connections.
 *
 * Connection Pooling:
 * Prisma menggunakan connection pool secara internal. Konfigurasi pooling
 * dilakukan melalui DATABASE_URL query parameters:
 * - connection_limit: Max connections in pool
 * - pool_timeout: Seconds to wait for connection
 *
 * Prinsip yang diterapkan:
 * - Singleton Pattern: Hanya satu instance PrismaClient di seluruh aplikasi
 * - Lazy Initialization: Client dibuat saat pertama kali diakses
 * - Hot Reload Support: Menyimpan instance di global untuk development
 * - Connection Pooling: Efisien menggunakan database connections
 * - Accelerate Support: Menggunakan Prisma Accelerate untuk serverless (Vercel) - PRODUCTION ONLY
 */

import { PrismaClient } from '@prisma/client';
import { withAccelerate } from '@prisma/extension-accelerate';
import logger from './logger';

// Check if we're in production (Vercel uses Accelerate)
const isProduction = process.env.NODE_ENV === 'production';

// Extend global namespace untuk TypeScript
declare global {
  // eslint-disable-next-line no-var, vars-on-top
  var prisma: PrismaClient | ReturnType<typeof createPrismaClientWithAccelerate> | undefined;
}

/**
 * Create Prisma Client WITHOUT Accelerate (for development with direct DB connection)
 */
function createPrismaClient() {
  return new PrismaClient({
    log: ['query', 'error', 'warn'],
  });
}

/**
 * Create Prisma Client WITH Accelerate extension (for production/Vercel)
 */
function createPrismaClientWithAccelerate() {
  return new PrismaClient({
    log: ['error'],
  }).$extends(withAccelerate());
}

/**
 * Shared Prisma Client instance
 *
 * Di development, instance disimpan di global object untuk mendukung
 * hot reload tanpa membuat multiple connections.
 * Di production, instance dibuat sekali dan digunakan kembali dengan Accelerate.
 */
export const prisma =
  global.prisma || (isProduction ? createPrismaClientWithAccelerate() : createPrismaClient());

// Simpan instance di global untuk development hot reload
if (!isProduction) {
  global.prisma = prisma;
}

/**
 * Disconnect Prisma Client
 * Digunakan untuk graceful shutdown
 */
export const disconnectPrisma = async (): Promise<void> => {
  logger.info('Disconnecting Prisma client...');
  // eslint-disable-next-line @typescript-eslint/no-unsafe-call
  await prisma.$disconnect();
  logger.info('Prisma client disconnected');
};

/**
 * Health check for database connection
 * Digunakan untuk monitoring dan readiness checks
 *
 * @returns Promise<boolean> - true jika database reachable
 */
export const checkDatabaseHealth = async (): Promise<boolean> => {
  try {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call
    await prisma.$queryRaw`SELECT 1`;
    return true;
  } catch (error) {
    logger.error('Database health check failed:', { error });
    return false;
  }
};
