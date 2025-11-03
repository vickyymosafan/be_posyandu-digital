/**
 * Type definitions untuk Sistem Backend Posyandu Lansia
 * File ini berisi type definitions yang digunakan di seluruh aplikasi
 */

import { Request } from 'express';

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
declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

export {};
