/**
 * Shared Prisma Client Instance
 *
 * File ini menyediakan singleton instance dari PrismaClient untuk digunakan
 * di seluruh aplikasi. Menggunakan pattern singleton untuk menghindari
 * multiple database connections.
 *
 * Prinsip yang diterapkan:
 * - Singleton Pattern: Hanya satu instance PrismaClient di seluruh aplikasi
 * - Lazy Initialization: Client dibuat saat pertama kali diakses
 * - Hot Reload Support: Menyimpan instance di global untuk development
 */

import { PrismaClient } from '@prisma/client';

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
  await prisma.$disconnect();
};
