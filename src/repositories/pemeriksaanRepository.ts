/**
 * Pemeriksaan Repository
 *
 * Repository untuk data access layer Pemeriksaan model.
 * Bertanggung jawab untuk semua operasi database terkait Pemeriksaan.
 *
 * Prinsip yang diterapkan:
 * - Single Responsibility: Hanya handle data access untuk Pemeriksaan
 * - Separation of Concerns: Tidak ada business logic, hanya database operations
 * - DRY: Reusable functions untuk operasi Pemeriksaan
 */

import { Pemeriksaan, Prisma } from '@prisma/client';
import { prisma } from '../utils/prisma';

/**
 * Membuat data pemeriksaan baru
 *
 * @param data - Data pemeriksaan yang akan dibuat
 * @returns Pemeriksaan yang telah dibuat
 */
export const createPemeriksaan = async (
  data: Prisma.PemeriksaanCreateInput
): Promise<Pemeriksaan> => {
  return prisma.pemeriksaan.create({
    data,
  });
};

/**
 * Mencari pemeriksaan berdasarkan ID
 *
 * @param id - ID pemeriksaan
 * @returns Pemeriksaan jika ditemukan, null jika tidak
 */
export const findPemeriksaanById = async (id: number): Promise<Pemeriksaan | null> => {
  return prisma.pemeriksaan.findUnique({
    where: { id },
    include: {
      lansia: true,
    },
  });
};

/**
 * Mengambil semua pemeriksaan untuk lansia tertentu
 *
 * @param lansiaId - ID lansia
 * @param options - Options untuk filtering dan pagination (optional)
 * @returns Array of pemeriksaan
 */
export const findPemeriksaanByLansiaId = async (
  lansiaId: number,
  options?: {
    skip?: number;
    take?: number;
    orderBy?: Prisma.PemeriksaanOrderByWithRelationInput;
  }
): Promise<Pemeriksaan[]> => {
  return prisma.pemeriksaan.findMany({
    where: { lansiaId },
    skip: options?.skip,
    take: options?.take,
    orderBy: options?.orderBy || { tanggal: 'desc' },
  });
};

/**
 * Mengambil pemeriksaan terbaru untuk lansia tertentu
 *
 * @param lansiaId - ID lansia
 * @returns Pemeriksaan terbaru jika ada, null jika tidak
 */
export const findLatestPemeriksaanByLansiaId = async (
  lansiaId: number
): Promise<Pemeriksaan | null> => {
  return prisma.pemeriksaan.findFirst({
    where: { lansiaId },
    orderBy: { tanggal: 'desc' },
  });
};

/**
 * Mengambil semua pemeriksaan dengan filter tanggal
 *
 * @param options - Options untuk filtering berdasarkan tanggal
 * @returns Array of pemeriksaan
 */
export const findPemeriksaanByDateRange = async (options: {
  startDate?: Date;
  endDate?: Date;
  lansiaId?: number;
}): Promise<Pemeriksaan[]> => {
  const { startDate, endDate, lansiaId } = options;

  return prisma.pemeriksaan.findMany({
    where: {
      lansiaId,
      tanggal: {
        gte: startDate,
        lte: endDate,
      },
    },
    orderBy: { tanggal: 'desc' },
    include: {
      lansia: true,
    },
  });
};

/**
 * Update data pemeriksaan
 *
 * @param id - ID pemeriksaan yang akan diupdate
 * @param data - Data yang akan diupdate
 * @returns Pemeriksaan yang telah diupdate
 */
export const updatePemeriksaan = async (
  id: number,
  data: Prisma.PemeriksaanUpdateInput
): Promise<Pemeriksaan> => {
  return prisma.pemeriksaan.update({
    where: { id },
    data,
  });
};

/**
 * Menghapus data pemeriksaan
 *
 * @param id - ID pemeriksaan yang akan dihapus
 * @returns Pemeriksaan yang telah dihapus
 */
export const deletePemeriksaan = async (id: number): Promise<Pemeriksaan> => {
  return prisma.pemeriksaan.delete({
    where: { id },
  });
};

/**
 * Menghitung jumlah pemeriksaan untuk lansia tertentu
 *
 * @param lansiaId - ID lansia
 * @returns Jumlah pemeriksaan
 */
export const countPemeriksaanByLansiaId = async (lansiaId: number): Promise<number> => {
  return prisma.pemeriksaan.count({
    where: { lansiaId },
  });
};
