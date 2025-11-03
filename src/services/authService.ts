/**
 * Auth Service
 * 
 * Service untuk business logic autentikasi dan otorisasi.
 * Bertanggung jawab untuk login, JWT generation, dan JWT verification.
 * 
 * Prinsip yang diterapkan:
 * - Single Responsibility: Hanya handle logic autentikasi
 * - Dependency Inversion: Depend pada userRepository abstraction
 * - Security: Password hashing dengan bcrypt, JWT dengan expiration
 * - Separation of Concerns: Tidak ada HTTP logic, hanya business logic
 */

import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { findUserByEmail } from '../repositories/userRepository';
import logger from '../utils/logger';

/**
 * Interface untuk JWT payload
 * Berisi informasi user yang akan di-encode dalam token
 */
export interface JWTPayload {
  userId: number;
  role: string;
}

/**
 * Interface untuk hasil login
 * Berisi data user yang dikembalikan setelah login berhasil
 */
export interface LoginResult {
  id: number;
  nama: string;
  email: string;
  role: string;
}

/**
 * Konstanta untuk JWT expiration time
 * 15 menit sesuai requirement
 */
const JWT_EXPIRATION = '15m';

/**
 * Get JWT secret dari environment variable
 * Throw error jika tidak ada untuk mencegah security issue
 */
const getJWTSecret = (): string => {
  const secret = process.env.JWT_SECRET;
  
  if (!secret) {
    logger.error('JWT_SECRET tidak ditemukan di environment variables');
    throw new Error('JWT_SECRET tidak dikonfigurasi');
  }
  
  return secret;
};

/**
 * Login user dengan email dan kata sandi
 * 
 * Proses:
 * 1. Cari user berdasarkan email
 * 2. Verifikasi user exists dan aktif
 * 3. Verifikasi password menggunakan bcrypt
 * 4. Return user data (tanpa password)
 * 
 * @param email - Email user
 * @param kataSandi - Kata sandi user (plain text)
 * @returns User data jika berhasil
 * @throws Error jika email tidak ditemukan, user tidak aktif, atau password salah
 */
export const login = async (
  email: string,
  kataSandi: string
): Promise<LoginResult> => {
  try {
    // Cari user berdasarkan email
    const user = await findUserByEmail(email);
    
    // Validasi user exists
    if (!user) {
      logger.warn('Login gagal: Email tidak ditemukan', { email });
      throw new Error('Email atau kata sandi salah');
    }
    
    // Validasi user aktif
    if (!user.aktif) {
      logger.warn('Login gagal: User tidak aktif', { 
        userId: user.id, 
        email: user.email 
      });
      throw new Error('Akun tidak aktif');
    }
    
    // Verifikasi password menggunakan bcrypt
    const isPasswordValid = await bcrypt.compare(kataSandi, user.kataSandi);
    
    if (!isPasswordValid) {
      logger.warn('Login gagal: Password salah', { 
        userId: user.id, 
        email: user.email 
      });
      throw new Error('Email atau kata sandi salah');
    }
    
    // Login berhasil - log event
    logger.info('Login berhasil', { 
      userId: user.id, 
      email: user.email,
      role: user.role
    });
    
    // Return user data tanpa password
    return {
      id: user.id,
      nama: user.nama,
      email: user.email,
      role: user.role,
    };
  } catch (error) {
    // Re-throw error untuk di-handle oleh caller
    throw error;
  }
};

/**
 * Generate JWT token untuk user
 * 
 * Token berisi:
 * - userId: ID user
 * - role: Role user (ADMIN atau PETUGAS)
 * - exp: Expiration time (15 menit)
 * 
 * @param userId - ID user
 * @param role - Role user
 * @returns JWT token string
 */
export const generateJWT = (userId: number, role: string): string => {
  try {
    const secret = getJWTSecret();
    
    const payload: JWTPayload = {
      userId,
      role,
    };
    
    // Generate JWT dengan expiration 15 menit
    const token = jwt.sign(payload, secret, {
      expiresIn: JWT_EXPIRATION,
    });
    
    logger.debug('JWT token generated', { userId, role });
    
    return token;
  } catch (error) {
    logger.error('Gagal generate JWT token', { 
      error: error instanceof Error ? error.message : 'Unknown error',
      userId,
      role
    });
    throw new Error('Gagal generate token autentikasi');
  }
};

/**
 * Verify dan decode JWT token
 * 
 * Memverifikasi:
 * - Token signature valid
 * - Token belum expired
 * 
 * @param token - JWT token string
 * @returns Decoded JWT payload
 * @throws Error jika token invalid atau expired
 */
export const verifyJWT = (token: string): JWTPayload => {
  try {
    const secret = getJWTSecret();
    
    // Verify dan decode token
    const decoded = jwt.verify(token, secret) as JWTPayload;
    
    logger.debug('JWT token verified', { userId: decoded.userId });
    
    return decoded;
  } catch (error) {
    // Log verification failure
    if (error instanceof jwt.TokenExpiredError) {
      logger.warn('JWT token expired', { 
        expiredAt: error.expiredAt 
      });
      throw new Error('Token autentikasi telah kadaluarsa');
    } else if (error instanceof jwt.JsonWebTokenError) {
      logger.warn('JWT token invalid', { 
        error: error.message 
      });
      throw new Error('Token autentikasi tidak valid');
    } else {
      logger.error('JWT verification error', { 
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw new Error('Gagal memverifikasi token autentikasi');
    }
  }
};
