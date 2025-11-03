/**
 * Lansia Service
 * 
 * Service untuk business logic manajemen data lansia.
 * Bertanggung jawab untuk registrasi lansia dengan kode pasien unik,
 * pencarian data lansia, dan validasi uniqueness.
 * 
 * Prinsip yang diterapkan:
 * - Single Responsibility: Hanya handle logic manajemen lansia
 * - Dependency Inversion: Depend pada lansiaRepository abstraction
 * - Separation of Concerns: Tidak ada HTTP logic, hanya business logic
 */

import { Gender, Lansia } from '@prisma/client';
import {
  createLansia,
  findLansiaByKode,
  checkNikExists,
} from '../repositories/lansiaRepository';
import { generatePatientId } from '../utils/patientId';
import logger from '../utils/logger';

/**
 * Interface untuk data pembuatan lansia
 */
export interface CreateLansiaData {
  nik: string;
  kk: string;
  nama: string;
  tanggalLahir: string; // ISO date string
  gender: 'L' | 'P';
  alamat: string;
}

/**
 * Interface untuk minimal lansia data (untuk find endpoint)
 */
export interface MinimalLansiaData {
  id: number;
  kode: string;
  nama: string;
  tanggalLahir: Date;
}

/**
 * Membuat data lansia baru dengan kode pasien unik
 * 
 * Proses:
 * 1. Validasi NIK belum terdaftar
 * 2. Generate kode pasien unik menggunakan patientId utility
 * 3. Parse tanggal lahir dari string ke Date
 * 4. Create lansia di database
 * 5. Return data lansia lengkap
 * 
 * @param data - Data lansia yang akan dibuat
 * @returns Lansia yang telah dibuat dengan kode unik
 * @throws Error jika NIK sudah terdaftar atau gagal generate kode
 */
export const createLansiaWithKode = async (
  data: CreateLansiaData
): Promise<Lansia> => {
  try {
    // Validasi NIK belum terdaftar
    const nikExists = await checkNikExists(data.nik);
    
    if (nikExists) {
      logger.warn('Gagal membuat lansia: NIK sudah terdaftar', {
        nik: data.nik,
      });
      throw new Error('NIK sudah terdaftar');
    }
    
    // Parse tanggal lahir
    const tanggalLahir = new Date(data.tanggalLahir);
    
    // Validasi tanggal lahir valid
    if (Number.isNaN(tanggalLahir.getTime())) {
      logger.warn('Gagal membuat lansia: Tanggal lahir tidak valid', {
        tanggalLahir: data.tanggalLahir,
      });
      throw new Error('Format tanggal lahir tidak valid');
    }
    
    // Generate kode pasien unik menggunakan tanggal hari ini
    const kode = await generatePatientId({
      tanggal: new Date(),
      suffixLength: 2,
      maxRetries: 10,
    });
    
    // Create lansia di database
    const lansia = await createLansia({
      kode,
      nik: data.nik,
      kk: data.kk,
      nama: data.nama,
      gender: data.gender as Gender,
      tanggalLahir,
      alamat: data.alamat,
    });
    
    logger.info('Lansia berhasil dibuat', {
      lansiaId: lansia.id,
      kode: lansia.kode,
      nama: lansia.nama,
      nik: lansia.nik,
    });
    
    return lansia;
  } catch (error) {
    // Re-throw error untuk di-handle oleh caller
    throw error;
  }
};

/**
 * Mengambil data lansia berdasarkan kode pasien
 * 
 * @param kode - Kode pasien lansia
 * @returns Lansia jika ditemukan
 * @throws Error jika lansia tidak ditemukan
 */
export const getLansiaByKode = async (kode: string): Promise<Lansia> => {
  try {
    const lansia = await findLansiaByKode(kode);
    
    if (!lansia) {
      logger.warn('Lansia tidak ditemukan', { kode });
      throw new Error('Lansia tidak ditemukan');
    }
    
    logger.debug('Lansia ditemukan', {
      lansiaId: lansia.id,
      kode: lansia.kode,
      nama: lansia.nama,
    });
    
    return lansia;
  } catch (error) {
    throw error;
  }
};

/**
 * Mencari data minimal lansia berdasarkan kode pasien
 * Digunakan untuk endpoint find yang hanya return data minimal
 * 
 * @param kode - Kode pasien lansia
 * @returns Minimal lansia data (id, kode, nama, tanggalLahir)
 * @throws Error jika lansia tidak ditemukan
 */
export const findMinimalLansiaByKode = async (
  kode: string
): Promise<MinimalLansiaData> => {
  try {
    const lansia = await findLansiaByKode(kode);
    
    if (!lansia) {
      logger.warn('Lansia tidak ditemukan untuk find', { kode });
      throw new Error('Lansia tidak ditemukan');
    }
    
    logger.debug('Minimal lansia data ditemukan', {
      lansiaId: lansia.id,
      kode: lansia.kode,
    });
    
    // Return hanya data minimal
    return {
      id: lansia.id,
      kode: lansia.kode,
      nama: lansia.nama,
      tanggalLahir: lansia.tanggalLahir,
    };
  } catch (error) {
    throw error;
  }
};
