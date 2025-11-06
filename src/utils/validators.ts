/**
 * Validators menggunakan Zod untuk validasi input di seluruh aplikasi
 *
 * File ini mengimplementasikan:
 * - Reusable validators untuk data umum (NIK, KK, tanggal)
 * - Zod schemas untuk semua DTOs (Auth, User, Lansia, Pemeriksaan)
 * - Type inference untuk type safety
 *
 * Prinsip yang diterapkan:
 * - Single Responsibility: Setiap schema bertanggung jawab untuk satu DTO
 * - Open/Closed: Schema dapat di-extend tanpa modifikasi
 * - DRY: Reusable validators untuk menghindari duplikasi
 * - Interface Segregation: Schema terpisah untuk setiap kebutuhan
 */

import { z } from 'zod';

// ============================================
// REUSABLE VALIDATORS
// ============================================

/**
 * Validator untuk NIK (Nomor Induk Kependudukan)
 * NIK harus berupa string 16 digit angka
 *
 * @example "3201234567890123"
 */
export const nikValidator = z
  .string({ required_error: 'NIK wajib diisi' })
  .trim()
  .length(16, 'NIK harus 16 digit')
  .regex(/^\d{16}$/, 'NIK harus berupa 16 digit angka');

/**
 * Validator untuk Nomor Kartu Keluarga (KK)
 * KK harus berupa string 16 digit angka
 *
 * @example "3201234567890123"
 */
export const kkValidator = z
  .string({ required_error: 'Nomor KK wajib diisi' })
  .trim()
  .length(16, 'Nomor KK harus 16 digit')
  .regex(/^\d{16}$/, 'Nomor KK harus berupa 16 digit angka');

/**
 * Validator untuk tanggal lahir
 * Tanggal harus valid dan tidak boleh di masa depan
 *
 * @example "1950-01-15"
 */
export const tanggalLahirValidator = z
  .string({ required_error: 'Tanggal lahir wajib diisi' })
  .refine(
    (val) => {
      const date = new Date(val);
      return !Number.isNaN(date.getTime());
    },
    { message: 'Format tanggal tidak valid' }
  )
  .refine(
    (val) => {
      const date = new Date(val);
      const now = new Date();
      return date <= now;
    },
    { message: 'Tanggal lahir tidak boleh di masa depan' }
  );

/**
 * Validator untuk nama
 * Nama tidak boleh kosong dan maksimal 255 karakter
 */
export const namaValidator = z
  .string({ required_error: 'Nama wajib diisi' })
  .trim()
  .min(1, 'Nama tidak boleh kosong')
  .max(255, 'Nama maksimal 255 karakter');

/**
 * Validator untuk email
 * Email harus format valid
 */
export const emailValidator = z
  .string({ required_error: 'Email wajib diisi' })
  .trim()
  .email('Format email tidak valid')
  .max(255, 'Email maksimal 255 karakter');

/**
 * Validator untuk kata sandi
 * Password minimal 6 karakter untuk keamanan dasar
 * Tidak di-trim untuk preserve whitespace
 */
export const kataSandiValidator = z
  .string({ required_error: 'Kata sandi wajib diisi' })
  .min(6, 'Kata sandi minimal 6 karakter');

/**
 * Validator untuk gender/jenis kelamin
 * Harus 'L' (Laki-laki) atau 'P' (Perempuan)
 */
export const genderValidator = z.enum(['L', 'P'], {
  errorMap: () => ({ message: 'Gender harus L (Laki-laki) atau P (Perempuan)' }),
});

// ============================================
// AUTH SCHEMAS
// ============================================

/**
 * Schema untuk request login
 *
 * @property email - Email user
 * @property kataSandi - Kata sandi user
 */
export const loginRequestSchema = z.object({
  email: emailValidator,
  kataSandi: kataSandiValidator,
});

export type LoginRequestDTO = z.infer<typeof loginRequestSchema>;

// ============================================
// USER/PETUGAS SCHEMAS
// ============================================

/**
 * Schema untuk membuat petugas baru
 *
 * @property nama - Nama lengkap petugas
 * @property email - Email petugas (unique)
 * @property kataSandi - Kata sandi petugas
 */
export const createPetugasSchema = z.object({
  nama: namaValidator,
  email: emailValidator,
  kataSandi: kataSandiValidator,
});

export type CreatePetugasDTO = z.infer<typeof createPetugasSchema>;

/**
 * Schema untuk update nama user
 *
 * @property nama - Nama baru
 */
export const updateNamaSchema = z.object({
  nama: namaValidator,
});

export type UpdateNamaDTO = z.infer<typeof updateNamaSchema>;

/**
 * Schema untuk update password user
 *
 * @property kataSandiLama - Kata sandi lama untuk verifikasi
 * @property kataSandiBaru - Kata sandi baru
 */
export const updatePasswordSchema = z.object({
  kataSandiLama: kataSandiValidator,
  kataSandiBaru: kataSandiValidator,
});

export type UpdatePasswordDTO = z.infer<typeof updatePasswordSchema>;

/**
 * Schema untuk update status aktif petugas
 *
 * @property aktif - Status aktif (true/false)
 */
export const updateStatusPetugasSchema = z.object({
  aktif: z.boolean({ required_error: 'Status aktif wajib diisi' }),
});

export type UpdateStatusPetugasDTO = z.infer<typeof updateStatusPetugasSchema>;

// ============================================
// LANSIA SCHEMAS
// ============================================

/**
 * Schema untuk membuat data lansia baru
 *
 * @property nik - Nomor Induk Kependudukan (16 digit)
 * @property kk - Nomor Kartu Keluarga (16 digit)
 * @property nama - Nama lengkap lansia
 * @property tanggalLahir - Tanggal lahir (ISO date string)
 * @property gender - Jenis kelamin ('L' atau 'P')
 * @property alamat - Alamat lengkap
 */
export const createLansiaSchema = z.object({
  nik: nikValidator,
  kk: kkValidator,
  nama: namaValidator,
  tanggalLahir: tanggalLahirValidator,
  gender: genderValidator,
  alamat: z
    .string({ required_error: 'Alamat wajib diisi' })
    .trim()
    .min(1, 'Alamat tidak boleh kosong'),
});

export type CreateLansiaDTO = z.infer<typeof createLansiaSchema>;

/**
 * Schema untuk query parameter kode pasien
 *
 * @property kode - Kode pasien lansia
 */
export const kodePasienQuerySchema = z.object({
  kode: z.string().optional(),
});

export type KodePasienQueryDTO = z.infer<typeof kodePasienQuerySchema>;

/**
 * Schema untuk find/search lansia
 * Search berdasarkan kode, nama, atau NIK
 *
 * @property query - Query pencarian (kode/nama/NIK)
 */
export const findLansiaSchema = z.object({
  query: z
    .string({ required_error: 'Query pencarian wajib diisi' })
    .trim()
    .min(1, 'Query pencarian tidak boleh kosong'),
});

export type FindLansiaDTO = z.infer<typeof findLansiaSchema>;

// ============================================
// PEMERIKSAAN SCHEMAS
// ============================================

/**
 * Schema untuk pemeriksaan fisik
 * Semua field wajib diisi
 *
 * @property tinggi - Tinggi badan dalam cm (50-250)
 * @property berat - Berat badan dalam kg (10-300)
 * @property sistolik - Tekanan darah sistolik dalam mmHg (40-300)
 * @property diastolik - Tekanan darah diastolik dalam mmHg (30-200)
 */
export const pemeriksaanFisikSchema = z.object({
  tinggi: z
    .number({ required_error: 'Tinggi badan wajib diisi' })
    .min(50, 'Tinggi badan minimal 50 cm')
    .max(250, 'Tinggi badan maksimal 250 cm'),
  berat: z
    .number({ required_error: 'Berat badan wajib diisi' })
    .min(10, 'Berat badan minimal 10 kg')
    .max(300, 'Berat badan maksimal 300 kg'),
  sistolik: z
    .number({ required_error: 'Tekanan darah sistolik wajib diisi' })
    .int('Tekanan darah sistolik harus bilangan bulat')
    .min(40, 'Tekanan darah sistolik minimal 40 mmHg')
    .max(300, 'Tekanan darah sistolik maksimal 300 mmHg'),
  diastolik: z
    .number({ required_error: 'Tekanan darah diastolik wajib diisi' })
    .int('Tekanan darah diastolik harus bilangan bulat')
    .min(30, 'Tekanan darah diastolik minimal 30 mmHg')
    .max(200, 'Tekanan darah diastolik maksimal 200 mmHg'),
});

export type PemeriksaanFisikDTO = z.infer<typeof pemeriksaanFisikSchema>;

/**
 * Schema untuk pemeriksaan kesehatan/laboratorium
 * Semua field optional, minimal satu harus diisi
 * Semua nilai dalam mg/dL dan harus non-negatif
 *
 * @property asamUrat - Kadar asam urat
 * @property gulaPuasa - Gula Darah Puasa (GDP)
 * @property gulaSewaktu - Gula Darah Sewaktu (GDS)
 * @property gula2Jpp - Gula Darah 2 Jam Post Prandial (2JPP)
 * @property kolesterol - Kadar kolesterol total
 */
export const pemeriksaanKesehatanSchema = z
  .object({
    asamUrat: z.number().nonnegative('Nilai asam urat tidak boleh negatif').optional(),
    gulaPuasa: z.number().nonnegative('Nilai gula darah puasa tidak boleh negatif').optional(),
    gulaSewaktu: z.number().nonnegative('Nilai gula darah sewaktu tidak boleh negatif').optional(),
    gula2Jpp: z.number().nonnegative('Nilai gula darah 2JPP tidak boleh negatif').optional(),
    kolesterol: z.number().nonnegative('Nilai kolesterol tidak boleh negatif').optional(),
  })
  .refine(
    (data) =>
      data.asamUrat !== undefined ||
      data.gulaPuasa !== undefined ||
      data.gulaSewaktu !== undefined ||
      data.gula2Jpp !== undefined ||
      data.kolesterol !== undefined,
    {
      message: 'Minimal satu pemeriksaan kesehatan harus diisi',
    }
  );

export type PemeriksaanKesehatanDTO = z.infer<typeof pemeriksaanKesehatanSchema>;

/**
 * Schema untuk pemeriksaan gabungan (fisik + kesehatan)
 * Semua field optional, minimal satu harus diisi
 * Jika ada pemeriksaan fisik, semua field fisik harus lengkap
 *
 * @property tinggi - Tinggi badan dalam cm (50-250)
 * @property berat - Berat badan dalam kg (10-300)
 * @property sistolik - Tekanan darah sistolik dalam mmHg (40-300)
 * @property diastolik - Tekanan darah diastolik dalam mmHg (30-200)
 * @property asamUrat - Kadar asam urat
 * @property gulaPuasa - Gula Darah Puasa (GDP)
 * @property gulaSewaktu - Gula Darah Sewaktu (GDS)
 * @property gula2Jpp - Gula Darah 2 Jam Post Prandial (2JPP)
 * @property kolesterol - Kadar kolesterol total
 */
export const pemeriksaanGabunganSchema = z
  .object({
    // Pemeriksaan Fisik (optional tapi jika ada harus lengkap)
    tinggi: z
      .number()
      .min(50, 'Tinggi badan minimal 50 cm')
      .max(250, 'Tinggi badan maksimal 250 cm')
      .optional(),
    berat: z
      .number()
      .min(10, 'Berat badan minimal 10 kg')
      .max(300, 'Berat badan maksimal 300 kg')
      .optional(),
    sistolik: z
      .number()
      .int('Tekanan darah sistolik harus bilangan bulat')
      .min(40, 'Tekanan darah sistolik minimal 40 mmHg')
      .max(300, 'Tekanan darah sistolik maksimal 300 mmHg')
      .optional(),
    diastolik: z
      .number()
      .int('Tekanan darah diastolik harus bilangan bulat')
      .min(30, 'Tekanan darah diastolik minimal 30 mmHg')
      .max(200, 'Tekanan darah diastolik maksimal 200 mmHg')
      .optional(),
    // Pemeriksaan Kesehatan (optional)
    asamUrat: z.number().nonnegative('Nilai asam urat tidak boleh negatif').optional(),
    gulaPuasa: z.number().nonnegative('Nilai gula darah puasa tidak boleh negatif').optional(),
    gulaSewaktu: z.number().nonnegative('Nilai gula darah sewaktu tidak boleh negatif').optional(),
    gula2Jpp: z.number().nonnegative('Nilai gula darah 2JPP tidak boleh negatif').optional(),
    kolesterol: z.number().nonnegative('Nilai kolesterol tidak boleh negatif').optional(),
  })
  .refine(
    (data) => {
      // Minimal satu field harus diisi
      return (
        data.tinggi !== undefined ||
        data.berat !== undefined ||
        data.sistolik !== undefined ||
        data.diastolik !== undefined ||
        data.asamUrat !== undefined ||
        data.gulaPuasa !== undefined ||
        data.gulaSewaktu !== undefined ||
        data.gula2Jpp !== undefined ||
        data.kolesterol !== undefined
      );
    },
    {
      message: 'Minimal satu data pemeriksaan harus diisi',
    }
  )
  .refine(
    (data) => {
      // Jika ada salah satu field fisik, semua harus ada
      const hasFisik =
        data.tinggi !== undefined ||
        data.berat !== undefined ||
        data.sistolik !== undefined ||
        data.diastolik !== undefined;

      if (!hasFisik) return true;

      return (
        data.tinggi !== undefined &&
        data.berat !== undefined &&
        data.sistolik !== undefined &&
        data.diastolik !== undefined
      );
    },
    {
      message:
        'Jika mengisi pemeriksaan fisik, semua field (tinggi, berat, sistolik, diastolik) harus diisi',
    }
  );

export type PemeriksaanGabunganDTO = z.infer<typeof pemeriksaanGabunganSchema>;
