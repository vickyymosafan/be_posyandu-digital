/**
 * User Repository
 *
 * Repository untuk data access layer User model.
 * Bertanggung jawab untuk semua operasi database terkait User.
 *
 * Prinsip yang diterapkan:
 * - Single Responsibility: Hanya handle data access untuk User
 * - Separation of Concerns: Tidak ada business logic, hanya database operations
 * - DRY: Reusable functions untuk operasi User
 */

import { User, Role, Prisma } from '@prisma/client';
import { prisma } from '../utils/prisma';

/**
 * Membuat user baru
 *
 * @param data - Data user yang akan dibuat
 * @returns User yang telah dibuat
 */
export const createUser = async (data: Prisma.UserCreateInput): Promise<User> => {
  return prisma.user.create({
    data,
  });
};

/**
 * Mencari user berdasarkan ID
 *
 * @param id - ID user
 * @returns User jika ditemukan, null jika tidak
 */
export const findUserById = async (id: number): Promise<User | null> => {
  return prisma.user.findUnique({
    where: { id },
  });
};

/**
 * Mencari user berdasarkan email
 *
 * @param email - Email user
 * @returns User jika ditemukan, null jika tidak
 */
export const findUserByEmail = async (email: string): Promise<User | null> => {
  return prisma.user.findUnique({
    where: { email },
  });
};

/**
 * Mengambil semua user dengan role tertentu
 *
 * @param role - Role user yang ingin diambil (optional)
 * @returns Array of users
 */
export const findAllUsers = async (role?: Role): Promise<User[]> => {
  return prisma.user.findMany({
    where: role ? { role } : undefined,
    orderBy: { createdAt: 'desc' },
  });
};

/**
 * Update data user
 *
 * @param id - ID user yang akan diupdate
 * @param data - Data yang akan diupdate
 * @returns User yang telah diupdate
 */
export const updateUser = async (id: number, data: Prisma.UserUpdateInput): Promise<User> => {
  return prisma.user.update({
    where: { id },
    data,
  });
};

/**
 * Update status aktif user
 *
 * @param id - ID user
 * @param aktif - Status aktif baru
 * @returns User yang telah diupdate
 */
export const updateUserStatus = async (id: number, aktif: boolean): Promise<User> => {
  return prisma.user.update({
    where: { id },
    data: { aktif },
  });
};

/**
 * Menghitung jumlah user dengan email tertentu
 * Berguna untuk check uniqueness sebelum create
 *
 * @param email - Email yang akan dicek
 * @returns Jumlah user dengan email tersebut
 */
export const countUsersByEmail = async (email: string): Promise<number> => {
  return prisma.user.count({
    where: { email },
  });
};
