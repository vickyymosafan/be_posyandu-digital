/**
 * Lansia Repository
 *
 * Repository untuk data access layer Lansia model.
 * Bertanggung jawab untuk semua operasi database terkait Lansia.
 *
 * Prinsip yang diterapkan:
 * - Single Responsibility: Hanya handle data access untuk Lansia
 * - Separation of Concerns: Tidak ada business logic, hanya database operations
 * - DRY: Reusable functions untuk operasi Lansia
 */

import { Lansia, Prisma } from '@prisma/client';
import { prisma } from '../utils/prisma';

/**
 * Membuat data lansia baru
 *
 * @param data - Data lansia yang akan dibuat
 * @returns Lansia yang telah dibuat
 */
export const createLansia = async (data: Prisma.LansiaCreateInput): Promise<Lansia> => {
  return prisma.lansia.create({
    data,
  });
};

/**
 * Mencari lansia berdasarkan ID
 *
 * @param id - ID lansia
 * @returns Lansia jika ditemukan, null jika tidak
 */
export const findLansiaById = async (id: number): Promise<Lansia | null> => {
  return prisma.lansia.findUnique({
    where: { id },
  });
};

/**
 * Mencari lansia berdasarkan kode pasien
 *
 * @param kode - Kode pasien lansia
 * @returns Lansia jika ditemukan, null jika tidak
 */
export const findLansiaByKode = async (kode: string): Promise<Lansia | null> => {
  return prisma.lansia.findUnique({
    where: { kode },
  });
};

/**
 * Mencari lansia berdasarkan NIK
 *
 * @param nik - NIK lansia
 * @returns Lansia jika ditemukan, null jika tidak
 */
export const findLansiaByNIK = async (nik: string): Promise<Lansia | null> => {
  return prisma.lansia.findUnique({
    where: { nik },
  });
};

/**
 * Interface untuk pagination options
 */
export interface PaginationOptions {
  page?: number;
  limit?: number;
  orderBy?: Prisma.LansiaOrderByWithRelationInput;
  select?: (keyof Lansia)[];
}

/**
 * Interface untuk paginated result
 */
export interface PaginatedResult<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

/**
 * Mengambil semua data lansia dengan pagination dan field selection
 *
 * @param options - Options untuk filtering, pagination, dan field selection
 * @returns Paginated result dengan data lansia
 */
export const findAllLansia = async (
  options?: PaginationOptions
): Promise<PaginatedResult<Partial<Lansia>>> => {
  const page = options?.page || 1;
  const limit = options?.limit || 20;
  const skip = (page - 1) * limit;

  // Build select object dari array of fields
  let selectObject: Prisma.LansiaSelect | undefined;
  if (options?.select && options.select.length > 0) {
    selectObject = {};
    for (const field of options.select) {
      selectObject[field] = true;
    }
  }

  // Execute count dan findMany in parallel
  const [total, data] = await Promise.all([
    prisma.lansia.count(),
    prisma.lansia.findMany({
      skip,
      take: limit,
      orderBy: options?.orderBy || { createdAt: 'desc' },
      ...(selectObject && { select: selectObject }),
    }),
  ]);

  return {
    data: data as Partial<Lansia>[],
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
};

/**
 * Mengambil semua data lansia tanpa pagination (legacy support)
 *
 * @param options - Options untuk filtering
 * @returns Array of lansia
 */
export const findAllLansiaLegacy = async (options?: {
  skip?: number;
  take?: number;
  orderBy?: Prisma.LansiaOrderByWithRelationInput;
}): Promise<Lansia[]> => {
  return prisma.lansia.findMany({
    skip: options?.skip,
    take: options?.take,
    orderBy: options?.orderBy || { createdAt: 'desc' },
  });
};

/**
 * Mengecek apakah kode pasien sudah ada
 *
 * @param kode - Kode pasien yang akan dicek
 * @returns true jika kode sudah ada, false jika belum
 */
export const checkKodeExists = async (kode: string): Promise<boolean> => {
  const count = await prisma.lansia.count({
    where: { kode },
  });
  return count > 0;
};

/**
 * Mengecek apakah NIK sudah terdaftar
 *
 * @param nik - NIK yang akan dicek
 * @returns true jika NIK sudah ada, false jika belum
 */
export const checkNikExists = async (nik: string): Promise<boolean> => {
  const count = await prisma.lansia.count({
    where: { nik },
  });
  return count > 0;
};

/**
 * Mengecek apakah KK sudah terdaftar
 *
 * @param kk - Nomor KK yang akan dicek
 * @returns true jika KK sudah ada, false jika belum
 */
export const checkKkExists = async (kk: string): Promise<boolean> => {
  const count = await prisma.lansia.count({
    where: { kk },
  });
  return count > 0;
};

/**
 * Update data lansia
 *
 * @param id - ID lansia yang akan diupdate
 * @param data - Data yang akan diupdate
 * @returns Lansia yang telah diupdate
 */
export const updateLansia = async (id: number, data: Prisma.LansiaUpdateInput): Promise<Lansia> => {
  return prisma.lansia.update({
    where: { id },
    data,
  });
};

/**
 * Menghapus data lansia
 *
 * @param id - ID lansia yang akan dihapus
 * @returns Lansia yang telah dihapus
 */
export const deleteLansia = async (id: number): Promise<Lansia> => {
  return prisma.lansia.delete({
    where: { id },
  });
};

/**
 * Mencari lansia berdasarkan query (kode, nama, atau NIK)
 * Menggunakan case-insensitive search dengan contains
 *
 * @param query - Query pencarian
 * @returns Array of lansia yang cocok dengan query
 */
export const searchLansia = async (query: string): Promise<Lansia[]> => {
  return prisma.lansia.findMany({
    where: {
      OR: [
        { kode: { contains: query, mode: 'insensitive' } },
        { nama: { contains: query, mode: 'insensitive' } },
        { nik: { contains: query, mode: 'insensitive' } },
      ],
    },
    orderBy: { createdAt: 'desc' },
  });
};
