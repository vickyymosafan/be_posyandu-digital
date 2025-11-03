/**
 * Type definitions untuk Sistem Backend Posyandu Lansia
 * File ini berisi type definitions yang digunakan di seluruh aplikasi
 */

/**
 * Interface untuk user info yang di-attach ke request
 * Digunakan setelah autentikasi berhasil
 */
export interface AuthUser {
  userId: number;
  role: string;
}

/**
 * Extend Express Request interface untuk include user info
 * Digunakan di middleware dan controllers untuk akses user info
 */
/* eslint-disable @typescript-eslint/no-namespace */
declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}
/* eslint-enable @typescript-eslint/no-namespace */

export {};
