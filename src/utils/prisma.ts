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
 */

import { PrismaClient } from '@prisma/client';
import logger from './logger';

// Extend global namespace untuk TypeScript
// eslint-disable-next-line no-var, vars-on-top
declare global {
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined;
}

/**
 * Shared Prisma Client instance
 *
 * Di development, instance disimpan di global object untuk mendukung
 * hot reload tanpa membuat multiple connections.
 * Di production, instance dibuat sekali dan digunakan kembali.
 *
 * Connection pooling dikonfigurasi melalui DATABASE_URL parameters:
 * - connection_limit: Default 10 untuk optimal performance
 * - pool_timeout: Default 10 detik untuk wait connection
 */
export const prisma =
  global.prisma ||
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  });

// Simpan instance di global untuk development hot reload
if (process.env.NODE_ENV !== 'production') {
  global.prisma = prisma;
}

/**
 * Disconnect Prisma Client
 * Digunakan untuk graceful shutdown
 */
export const disconnectPrisma = async (): Promise<void> => {
  logger.info('Disconnecting Prisma client...');
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
    await prisma.$queryRaw`SELECT 1`;
    return true;
  } catch (error) {
    logger.error('Database health check failed:', { error });
    return false;
  }
};
