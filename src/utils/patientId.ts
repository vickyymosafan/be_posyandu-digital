/**
 * Patient ID Generator Utility
 * 
 * Utility untuk generate kode pasien unik dengan format:
 * "pasien" + YYYYMMDD + suffix base62 (2 karakter)
 * Total: 16 karakter
 * 
 * Contoh: pasien20251103aB
 * 
 * Prinsip yang diterapkan:
 * - Single Responsibility: Hanya handle generation kode pasien
 * - DRY: Reusable function untuk generate kode
 * - Security: Menggunakan crypto untuk random generation
 */

import { checkKodeExists } from '../repositories/lansiaRepository';
import logger from './logger';

/**
 * Base62 character set untuk encoding
 * Menggunakan: 0-9, a-z, A-Z (total 62 karakter)
 */
const BASE62_CHARS = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';

/**
 * Interface untuk options generate patient ID
 */
export interface GeneratePatientIdOptions {
  tanggal: Date;
  suffixLength?: number;
  maxRetries?: number;
}

/**
 * Generate random base62 string dengan panjang tertentu
 * 
 * @param length - Panjang string yang diinginkan
 * @returns Random base62 string
 */
const generateBase62Suffix = (length: number): string => {
  let result = '';
  
  for (let i = 0; i < length; i++) {
    // Generate random index untuk pick character dari BASE62_CHARS
    const randomIndex = Math.floor(Math.random() * BASE62_CHARS.length);
    result += BASE62_CHARS[randomIndex];
  }
  
  return result;
};

/**
 * Format tanggal ke YYYYMMDD
 * 
 * @param date - Tanggal yang akan diformat
 * @returns String tanggal dalam format YYYYMMDD
 */
const formatDateToYYYYMMDD = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  
  return `${year}${month}${day}`;
};

/**
 * Generate kode pasien unik
 * 
 * Format: "pasien" + YYYYMMDD + suffix base62
 * Total: 16 karakter (6 + 8 + 2)
 * 
 * Proses:
 * 1. Format tanggal ke YYYYMMDD
 * 2. Generate random base62 suffix
 * 3. Gabungkan menjadi kode pasien
 * 4. Check uniqueness di database
 * 5. Jika collision, retry dengan suffix berbeda
 * 6. Throw error jika max retries exceeded
 * 
 * @param options - Options untuk generate kode
 * @returns Kode pasien unik
 * @throws Error jika gagal generate kode unik setelah max retries
 */
export const generatePatientId = async (
  options: GeneratePatientIdOptions
): Promise<string> => {
  const {
    tanggal,
    suffixLength = 2,
    maxRetries = 10,
  } = options;
  
  // Format tanggal ke YYYYMMDD
  const dateStr = formatDateToYYYYMMDD(tanggal);
  const prefix = 'pasien';
  
  // Validasi panjang total
  const totalLength = prefix.length + dateStr.length + suffixLength;
  if (totalLength !== 16) {
    logger.warn('Panjang kode pasien tidak sesuai spesifikasi', {
      totalLength,
      expected: 16,
      prefix: prefix.length,
      date: dateStr.length,
      suffix: suffixLength,
    });
  }
  
  // Retry loop untuk handle collision
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    // Generate random suffix
    const suffix = generateBase62Suffix(suffixLength);
    const kode = `${prefix}${dateStr}${suffix}`;
    
    logger.debug('Mencoba generate kode pasien', {
      attempt,
      kode,
      tanggal: tanggal.toISOString(),
    });
    
    // Check uniqueness di database
    const exists = await checkKodeExists(kode);
    
    if (!exists) {
      logger.info('Kode pasien berhasil di-generate', {
        kode,
        attempt,
        tanggal: tanggal.toISOString(),
      });
      return kode;
    }
    
    logger.warn('Kode pasien collision, retry', {
      kode,
      attempt,
      maxRetries,
    });
  }
  
  // Max retries exceeded
  logger.error('Gagal generate kode pasien unik setelah max retries', {
    maxRetries,
    tanggal: tanggal.toISOString(),
  });
  
  throw new Error('Gagal menghasilkan kode pasien unik');
};
