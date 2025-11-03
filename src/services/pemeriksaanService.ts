/**
 * Pemeriksaan Service
 *
 * Service untuk business logic pemeriksaan kesehatan lansia.
 * Bertanggung jawab untuk create pemeriksaan dengan kalkulasi dan klasifikasi otomatis.
 *
 * Prinsip yang diterapkan:
 * - Single Responsibility: Hanya handle logic pemeriksaan
 * - Dependency Inversion: Depend pada repository dan utility abstractions
 * - Separation of Concerns: Tidak ada HTTP logic, hanya business logic
 * - DRY: Reuse medical utility functions
 */

import { Pemeriksaan } from '@prisma/client';
import { createPemeriksaan } from '../repositories/pemeriksaanRepository';
import { findLansiaById } from '../repositories/lansiaRepository';
import { hitungBMI } from '../utils/bmi';
import { klasifikasiTekananDarah } from '../utils/tekananDarah';
import {
  klasifikasiGDP,
  klasifikasiGDS,
  klasifikasiDuaJPP,
  KlasifikasiGulaDarah,
} from '../utils/gulaDarah';
import { klasifikasiKolesterol } from '../utils/kolesterol';
import { klasifikasiAsamUrat } from '../utils/asamUrat';
import logger from '../utils/logger';

/**
 * Interface untuk data pemeriksaan fisik
 */
export interface PemeriksaanFisikData {
  tinggi: number;
  berat: number;
  sistolik: number;
  diastolik: number;
}

/**
 * Interface untuk data pemeriksaan kesehatan
 */
export interface PemeriksaanKesehatanData {
  asamUrat?: number;
  gulaPuasa?: number;
  gulaSewaktu?: number;
  gula2Jpp?: number;
  kolesterol?: number;
}

/**
 * Interface untuk data pemeriksaan gabungan
 */
export interface PemeriksaanGabunganData {
  tinggi?: number;
  berat?: number;
  sistolik?: number;
  diastolik?: number;
  asamUrat?: number;
  gulaPuasa?: number;
  gulaSewaktu?: number;
  gula2Jpp?: number;
  kolesterol?: number;
}

/**
 * Create pemeriksaan fisik dengan kalkulasi BMI dan klasifikasi tekanan darah
 *
 * Proses:
 * 1. Validasi lansia exists
 * 2. Hitung BMI menggunakan utility
 * 3. Klasifikasi tekanan darah menggunakan utility
 * 4. Create pemeriksaan di database
 * 5. Return pemeriksaan dengan hasil kalkulasi
 *
 * @param lansiaId - ID lansia
 * @param data - Data pemeriksaan fisik
 * @returns Pemeriksaan yang telah dibuat dengan hasil kalkulasi
 * @throws Error jika lansia tidak ditemukan
 */
export const createPemeriksaanFisik = async (
  lansiaId: number,
  data: PemeriksaanFisikData
): Promise<Pemeriksaan> => {
  try {
    // Validasi lansia exists
    const lansia = await findLansiaById(lansiaId);

    if (!lansia) {
      logger.warn('Gagal create pemeriksaan fisik: Lansia tidak ditemukan', {
        lansiaId,
      });
      throw new Error('Lansia tidak ditemukan');
    }

    // Hitung BMI
    const bmiResult = hitungBMI(data.berat, data.tinggi);

    // Klasifikasi tekanan darah
    const tekananDarahResult = klasifikasiTekananDarah(data.sistolik, data.diastolik);

    // Create pemeriksaan
    const pemeriksaan = await createPemeriksaan({
      lansia: {
        connect: { id: lansiaId },
      },
      tinggi: data.tinggi,
      berat: data.berat,
      bmi: bmiResult.nilai,
      kategoriBmi: bmiResult.kategori,
      sistolik: data.sistolik,
      diastolik: data.diastolik,
      tekananDarah: tekananDarahResult.kategori,
    });

    logger.info('Pemeriksaan fisik berhasil dibuat', {
      pemeriksaanId: pemeriksaan.id,
      lansiaId,
      bmi: bmiResult.nilai,
      kategoriBmi: bmiResult.kategori,
      tekananDarah: tekananDarahResult.kategori,
      emergency: tekananDarahResult.emergency,
    });

    return pemeriksaan;
  } catch (error) {
    throw error;
  }
};

/**
 * Create pemeriksaan kesehatan dengan klasifikasi nilai laboratorium
 *
 * Proses:
 * 1. Validasi lansia exists
 * 2. Klasifikasi semua nilai lab menggunakan utilities
 * 3. Create pemeriksaan di database
 * 4. Return pemeriksaan dengan hasil klasifikasi
 *
 * @param lansiaId - ID lansia
 * @param data - Data pemeriksaan kesehatan
 * @returns Pemeriksaan yang telah dibuat dengan hasil klasifikasi
 * @throws Error jika lansia tidak ditemukan
 */
export const createPemeriksaanKesehatan = async (
  lansiaId: number,
  data: PemeriksaanKesehatanData
): Promise<Pemeriksaan> => {
  try {
    // Validasi lansia exists
    const lansia = await findLansiaById(lansiaId);

    if (!lansia) {
      logger.warn('Gagal create pemeriksaan kesehatan: Lansia tidak ditemukan', {
        lansiaId,
      });
      throw new Error('Lansia tidak ditemukan');
    }

    // Klasifikasi gula darah
    const klasifikasiGula: KlasifikasiGulaDarah = {};

    if (data.gulaPuasa !== undefined) {
      klasifikasiGula.gdp = klasifikasiGDP(data.gulaPuasa);
    }

    if (data.gulaSewaktu !== undefined) {
      klasifikasiGula.gds = klasifikasiGDS(data.gulaSewaktu);
    }

    if (data.gula2Jpp !== undefined) {
      klasifikasiGula.duaJpp = klasifikasiDuaJPP(data.gula2Jpp);
    }

    // Klasifikasi kolesterol
    let klasifikasiKolesterolResult: string | undefined;
    if (data.kolesterol !== undefined) {
      klasifikasiKolesterolResult = klasifikasiKolesterol(data.kolesterol);
    }

    // Klasifikasi asam urat (perlu gender dari lansia)
    // Tidak disimpan di pemeriksaan karena tidak ada field untuk itu
    // Hanya untuk logging
    if (data.asamUrat !== undefined) {
      const klasifikasiAsamUratResult = klasifikasiAsamUrat(
        data.asamUrat,
        lansia.gender as 'L' | 'P'
      );

      logger.debug('Klasifikasi asam urat', {
        lansiaId,
        gender: lansia.gender,
        nilai: data.asamUrat,
        klasifikasi: klasifikasiAsamUratResult,
      });
    }

    // Create pemeriksaan
    const pemeriksaan = await createPemeriksaan({
      lansia: {
        connect: { id: lansiaId },
      },
      asamUrat: data.asamUrat,
      gulaPuasa: data.gulaPuasa,
      gulaSewaktu: data.gulaSewaktu,
      gula2Jpp: data.gula2Jpp,
      klasifikasiGula:
        Object.keys(klasifikasiGula).length > 0 ? (klasifikasiGula as any) : undefined,
      kolesterol: data.kolesterol,
      klasifikasiKolesterol: klasifikasiKolesterolResult,
    });

    logger.info('Pemeriksaan kesehatan berhasil dibuat', {
      pemeriksaanId: pemeriksaan.id,
      lansiaId,
      klasifikasiGula,
      klasifikasiKolesterol: klasifikasiKolesterolResult,
    });

    return pemeriksaan;
  } catch (error) {
    throw error;
  }
};

/**
 * Create pemeriksaan gabungan (fisik + kesehatan)
 *
 * Proses:
 * 1. Validasi lansia exists
 * 2. Hitung BMI jika ada data tinggi dan berat
 * 3. Klasifikasi tekanan darah jika ada data sistolik dan diastolik
 * 4. Klasifikasi semua nilai lab yang ada
 * 5. Create pemeriksaan di database
 * 6. Return pemeriksaan dengan hasil kalkulasi dan klasifikasi
 *
 * @param lansiaId - ID lansia
 * @param data - Data pemeriksaan gabungan
 * @returns Pemeriksaan yang telah dibuat dengan hasil kalkulasi dan klasifikasi
 * @throws Error jika lansia tidak ditemukan
 */
export const createPemeriksaanGabungan = async (
  lansiaId: number,
  data: PemeriksaanGabunganData
): Promise<Pemeriksaan> => {
  try {
    // Validasi lansia exists
    const lansia = await findLansiaById(lansiaId);

    if (!lansia) {
      logger.warn('Gagal create pemeriksaan gabungan: Lansia tidak ditemukan', {
        lansiaId,
      });
      throw new Error('Lansia tidak ditemukan');
    }

    // Hitung BMI jika ada data lengkap
    let bmiNilai: number | undefined;
    let bmiKategori: string | undefined;

    if (data.tinggi !== undefined && data.berat !== undefined) {
      const bmiResult = hitungBMI(data.berat, data.tinggi);
      bmiNilai = bmiResult.nilai;
      bmiKategori = bmiResult.kategori;
    }

    // Klasifikasi tekanan darah jika ada data lengkap
    let tekananDarahKategori: string | undefined;

    if (data.sistolik !== undefined && data.diastolik !== undefined) {
      const tekananDarahResult = klasifikasiTekananDarah(data.sistolik, data.diastolik);
      tekananDarahKategori = tekananDarahResult.kategori;
    }

    // Klasifikasi gula darah
    const klasifikasiGula: KlasifikasiGulaDarah = {};

    if (data.gulaPuasa !== undefined) {
      klasifikasiGula.gdp = klasifikasiGDP(data.gulaPuasa);
    }

    if (data.gulaSewaktu !== undefined) {
      klasifikasiGula.gds = klasifikasiGDS(data.gulaSewaktu);
    }

    if (data.gula2Jpp !== undefined) {
      klasifikasiGula.duaJpp = klasifikasiDuaJPP(data.gula2Jpp);
    }

    // Klasifikasi kolesterol
    let klasifikasiKolesterolResult: string | undefined;
    if (data.kolesterol !== undefined) {
      klasifikasiKolesterolResult = klasifikasiKolesterol(data.kolesterol);
    }

    // Create pemeriksaan
    const pemeriksaan = await createPemeriksaan({
      lansia: {
        connect: { id: lansiaId },
      },
      tinggi: data.tinggi,
      berat: data.berat,
      bmi: bmiNilai,
      kategoriBmi: bmiKategori,
      sistolik: data.sistolik,
      diastolik: data.diastolik,
      tekananDarah: tekananDarahKategori,
      asamUrat: data.asamUrat,
      gulaPuasa: data.gulaPuasa,
      gulaSewaktu: data.gulaSewaktu,
      gula2Jpp: data.gula2Jpp,
      klasifikasiGula:
        Object.keys(klasifikasiGula).length > 0 ? (klasifikasiGula as any) : undefined,
      kolesterol: data.kolesterol,
      klasifikasiKolesterol: klasifikasiKolesterolResult,
    });

    logger.info('Pemeriksaan gabungan berhasil dibuat', {
      pemeriksaanId: pemeriksaan.id,
      lansiaId,
      hasFisik: !!(data.tinggi && data.berat && data.sistolik && data.diastolik),
      hasKesehatan: !!(
        data.asamUrat ||
        data.gulaPuasa ||
        data.gulaSewaktu ||
        data.gula2Jpp ||
        data.kolesterol
      ),
    });

    return pemeriksaan;
  } catch (error) {
    throw error;
  }
};
