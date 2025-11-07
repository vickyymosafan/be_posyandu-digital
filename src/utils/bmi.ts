/**
 * Utility untuk kalkulasi dan klasifikasi Body Mass Index (BMI)
 *
 * Menggunakan standar klasifikasi BMI Asia Pasifik (WHO Asia-Pacific - Revised)
 * yang lebih sesuai untuk populasi Asia dibandingkan standar WHO global.
 *
 * Standar yang digunakan:
 * - < 17.0: Sangat Kurang
 * - 17.0 - 18.4: Kurang
 * - 18.5 - 25.0: Normal
 * - 25.1 - 27.0: Berlebih
 * - 27.1 - 30.0: Obesitas I
 * - > 30.0: Obesitas II
 *
 * Prinsip yang diterapkan:
 * - Single Responsibility: Fokus pada kalkulasi dan klasifikasi BMI
 * - Input Validation: Validasi range realistis untuk keamanan
 * - Type Safety: Interface yang jelas untuk return value
 * - Maintainability: Constants untuk thresholds yang mudah di-update
 */

/**
 * Interface untuk hasil kalkulasi BMI
 *
 * @property nilai - Nilai BMI yang dihitung (2 desimal)
 * @property kategori - Kategori BMI berdasarkan standar Asia Pasifik
 */
export interface BMIResult {
  nilai: number;
  kategori: string;
}

/**
 * Constants untuk validasi input
 * Range realistis untuk tinggi dan berat badan manusia
 */
const VALIDASI = {
  TINGGI_MIN: 50, // cm
  TINGGI_MAX: 250, // cm
  BERAT_MIN: 10, // kg
  BERAT_MAX: 300, // kg
} as const;

/**
 * Constants untuk threshold BMI berdasarkan standar Asia Pasifik (Updated)
 * Sumber: WHO Asia-Pacific Guidelines (Revised)
 */
const BMI_THRESHOLD = {
  SANGAT_KURANG: 17.0,
  KURANG: 18.5,
  NORMAL: 25.1,
  BERLEBIH: 27.1,
  OBESITAS_I: 30.1,
} as const;

/**
 * Kategori BMI berdasarkan standar Asia Pasifik (Updated)
 */
const KATEGORI_BMI = {
  SANGAT_KURANG: 'Sangat Kurang',
  KURANG: 'Kurang',
  NORMAL: 'Normal',
  BERLEBIH: 'Berlebih',
  OBESITAS_I: 'Obesitas I',
  OBESITAS_II: 'Obesitas II',
} as const;

/**
 * Validasi input tinggi badan
 *
 * @param tinggiCm - Tinggi badan dalam cm
 * @throws Error jika tinggi di luar range valid
 */
function validasiTinggi(tinggiCm: number): void {
  if (typeof tinggiCm !== 'number' || Number.isNaN(tinggiCm)) {
    throw new Error('Tinggi badan harus berupa angka');
  }

  if (tinggiCm < VALIDASI.TINGGI_MIN) {
    throw new Error(`Tinggi badan tidak valid. Minimal ${VALIDASI.TINGGI_MIN} cm`);
  }

  if (tinggiCm > VALIDASI.TINGGI_MAX) {
    throw new Error(`Tinggi badan tidak valid. Maksimal ${VALIDASI.TINGGI_MAX} cm`);
  }
}

/**
 * Validasi input berat badan
 *
 * @param beratKg - Berat badan dalam kg
 * @throws Error jika berat di luar range valid
 */
function validasiBerat(beratKg: number): void {
  if (typeof beratKg !== 'number' || Number.isNaN(beratKg)) {
    throw new Error('Berat badan harus berupa angka');
  }

  if (beratKg < VALIDASI.BERAT_MIN) {
    throw new Error(`Berat badan tidak valid. Minimal ${VALIDASI.BERAT_MIN} kg`);
  }

  if (beratKg > VALIDASI.BERAT_MAX) {
    throw new Error(`Berat badan tidak valid. Maksimal ${VALIDASI.BERAT_MAX} kg`);
  }
}

/**
 * Klasifikasi nilai BMI berdasarkan standar Asia Pasifik (Updated)
 *
 * Kategori BMI Asia Pasifik (WHO - Revised):
 * - < 17.0: Sangat Kurang
 * - 17.0 - 18.4: Kurang
 * - 18.5 - 25.0: Normal
 * - 25.1 - 27.0: Berlebih
 * - 27.1 - 30.0: Obesitas I
 * - > 30.0: Obesitas II
 *
 * @param bmi - Nilai BMI yang akan diklasifikasikan
 * @returns Kategori BMI
 */
function klasifikasiBMI(bmi: number): string {
  if (bmi < BMI_THRESHOLD.SANGAT_KURANG) {
    return KATEGORI_BMI.SANGAT_KURANG;
  }

  if (bmi < BMI_THRESHOLD.KURANG) {
    return KATEGORI_BMI.KURANG;
  }

  if (bmi < BMI_THRESHOLD.NORMAL) {
    return KATEGORI_BMI.NORMAL;
  }

  if (bmi < BMI_THRESHOLD.BERLEBIH) {
    return KATEGORI_BMI.BERLEBIH;
  }

  if (bmi < BMI_THRESHOLD.OBESITAS_I) {
    return KATEGORI_BMI.OBESITAS_I;
  }

  return KATEGORI_BMI.OBESITAS_II;
}

/**
 * Menghitung Body Mass Index (BMI) dan mengklasifikasikannya
 *
 * Formula BMI: berat (kg) / (tinggi (m))^2
 * Hasil dibulatkan ke 2 desimal
 *
 * @param beratKg - Berat badan dalam kilogram (10-300 kg)
 * @param tinggiCm - Tinggi badan dalam centimeter (50-250 cm)
 * @returns Object berisi nilai BMI dan kategorinya
 * @throws Error jika input tidak valid
 *
 * @example
 * ```typescript
 * const result = hitungBMI(60, 160);
 * console.log(result); // { nilai: 23.44, kategori: 'Normal' }
 * ```
 */
export function hitungBMI(beratKg: number, tinggiCm: number): BMIResult {
  // Validasi input
  validasiBerat(beratKg);
  validasiTinggi(tinggiCm);

  // Konversi tinggi dari cm ke meter
  const tinggiM = tinggiCm / 100;

  // Kalkulasi BMI: berat / (tinggi^2)
  const bmi = beratKg / (tinggiM * tinggiM);

  // Bulatkan ke 2 desimal
  const nilaiBMI = Math.round(bmi * 100) / 100;

  // Klasifikasi BMI
  const kategori = klasifikasiBMI(nilaiBMI);

  return {
    nilai: nilaiBMI,
    kategori,
  };
}
