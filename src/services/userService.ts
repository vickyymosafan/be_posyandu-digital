/**
 * User Service
 *
 * Service untuk business logic manajemen user (petugas dan admin).
 * Bertanggung jawab untuk CRUD user, update profile, dan password management.
 *
 * Prinsip yang diterapkan:
 * - Single Responsibility: Hanya handle logic manajemen user
 * - Dependency Inversion: Depend pada userRepository abstraction
 * - Security: Password hashing dengan bcrypt salt rounds 10+
 * - Separation of Concerns: Tidak ada HTTP logic, hanya business logic
 */

import bcrypt from 'bcrypt';
import { Role, User } from '@prisma/client';
import {
  createUser,
  findUserById,
  findAllUsers,
  updateUser,
  updateUserStatus,
  countUsersByEmail,
} from '../repositories/userRepository';
import logger from '../utils/logger';

/**
 * Konstanta untuk bcrypt salt rounds
 * Minimum 10 sesuai requirement untuk keamanan
 */
const BCRYPT_SALT_ROUNDS = 10;

/**
 * Type untuk User response tanpa password
 * Menggunakan Omit utility untuk exclude kataSandi dari response
 */
export type UserResponse = Omit<User, 'kataSandi'>;

/**
 * Interface untuk data pembuatan petugas
 */
export interface CreatePetugasData {
  nama: string;
  email: string;
  kataSandi: string;
}

/**
 * Membuat petugas baru
 *
 * Proses:
 * 1. Validasi email belum terdaftar
 * 2. Hash password dengan bcrypt
 * 3. Create user dengan role PETUGAS dan status aktif true
 * 4. Return user data tanpa password
 *
 * @param data - Data petugas yang akan dibuat
 * @returns User data tanpa password
 * @throws Error jika email sudah terdaftar
 */
export const createPetugas = async (data: CreatePetugasData): Promise<UserResponse> => {
  try {
    // Validasi email belum terdaftar
    const existingUserCount = await countUsersByEmail(data.email);

    if (existingUserCount > 0) {
      logger.warn('Gagal membuat petugas: Email sudah terdaftar', {
        email: data.email,
      });
      throw new Error('Email sudah terdaftar');
    }

    // Hash password dengan bcrypt
    const hashedPassword = await bcrypt.hash(data.kataSandi, BCRYPT_SALT_ROUNDS);

    // Create user dengan role PETUGAS
    const user = await createUser({
      nama: data.nama,
      email: data.email,
      kataSandi: hashedPassword,
      role: Role.PETUGAS,
      aktif: true,
    });

    logger.info('Petugas berhasil dibuat', {
      userId: user.id,
      email: user.email,
      nama: user.nama,
    });

    // Return user tanpa password
    const { kataSandi: _kataSandi, ...userWithoutPassword } = user;
    return userWithoutPassword;
  } catch (error) {
    // Re-throw error untuk di-handle oleh caller
    throw error;
  }
};

/**
 * Mengambil semua petugas
 *
 * @returns Array of petugas tanpa password
 */
export const getAllPetugas = async (): Promise<UserResponse[]> => {
  try {
    // Get semua user dengan role PETUGAS
    const users = await findAllUsers(Role.PETUGAS);

    logger.debug('Mengambil daftar petugas', {
      count: users.length,
    });

    // Remove password dari setiap user
    const usersWithoutPassword = users.map((user) => {
      const { kataSandi: _kataSandi, ...userWithoutPassword } = user;
      return userWithoutPassword;
    });

    return usersWithoutPassword;
  } catch (error) {
    logger.error('Gagal mengambil daftar petugas', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    throw error;
  }
};

/**
 * Update status aktif petugas
 *
 * @param id - ID petugas
 * @param aktif - Status aktif baru
 * @returns User data yang telah diupdate tanpa password
 * @throws Error jika user tidak ditemukan
 */
export const updateStatusPetugas = async (id: number, aktif: boolean): Promise<UserResponse> => {
  try {
    // Validasi user exists
    const existingUser = await findUserById(id);

    if (!existingUser) {
      logger.warn('Gagal update status petugas: User tidak ditemukan', {
        userId: id,
      });
      throw new Error('User tidak ditemukan');
    }

    // Update status
    const updatedUser = await updateUserStatus(id, aktif);

    logger.info('Status petugas berhasil diupdate', {
      userId: id,
      aktif,
      email: updatedUser.email,
    });

    // Return user tanpa password
    const { kataSandi: _kataSandi, ...userWithoutPassword } = updatedUser;
    return userWithoutPassword;
  } catch (error) {
    throw error;
  }
};

/**
 * Update nama user
 *
 * @param userId - ID user
 * @param nama - Nama baru
 * @returns User data yang telah diupdate tanpa password
 * @throws Error jika user tidak ditemukan
 */
export const updateNama = async (userId: number, nama: string): Promise<UserResponse> => {
  try {
    // Validasi user exists
    const existingUser = await findUserById(userId);

    if (!existingUser) {
      logger.warn('Gagal update nama: User tidak ditemukan', {
        userId,
      });
      throw new Error('User tidak ditemukan');
    }

    // Update nama
    const updatedUser = await updateUser(userId, { nama });

    logger.info('Nama user berhasil diupdate', {
      userId,
      namaLama: existingUser.nama,
      namaBaru: nama,
    });

    // Return user tanpa password
    const { kataSandi: _kataSandi, ...userWithoutPassword } = updatedUser;
    return userWithoutPassword;
  } catch (error) {
    throw error;
  }
};

/**
 * Update password user
 *
 * Proses:
 * 1. Validasi user exists
 * 2. Verifikasi password lama dengan bcrypt
 * 3. Hash password baru dengan bcrypt
 * 4. Update password di database
 *
 * @param userId - ID user
 * @param kataSandiLama - Password lama untuk verifikasi
 * @param kataSandiBaru - Password baru
 * @returns User data yang telah diupdate tanpa password
 * @throws Error jika user tidak ditemukan atau password lama salah
 */
export const updatePassword = async (
  userId: number,
  kataSandiLama: string,
  kataSandiBaru: string
): Promise<UserResponse> => {
  try {
    // Validasi user exists
    const existingUser = await findUserById(userId);

    if (!existingUser) {
      logger.warn('Gagal update password: User tidak ditemukan', {
        userId,
      });
      throw new Error('User tidak ditemukan');
    }

    // Verifikasi password lama
    const isPasswordValid = await bcrypt.compare(kataSandiLama, existingUser.kataSandi);

    if (!isPasswordValid) {
      logger.warn('Gagal update password: Password lama tidak cocok', {
        userId,
        email: existingUser.email,
      });
      throw new Error('Kata sandi lama tidak cocok');
    }

    // Hash password baru
    const hashedPassword = await bcrypt.hash(kataSandiBaru, BCRYPT_SALT_ROUNDS);

    // Update password
    const updatedUser = await updateUser(userId, {
      kataSandi: hashedPassword,
    });

    logger.info('Password user berhasil diupdate', {
      userId,
      email: updatedUser.email,
    });

    // Return user tanpa password
    const { kataSandi: _kataSandi, ...userWithoutPassword } = updatedUser;
    return userWithoutPassword;
  } catch (error) {
    throw error;
  }
};
