/**
 * Tekanan Darah (Blood Pressure) Classification Utility
 *
 * Utility untuk klasifikasi tekanan darah berdasarkan AHA (American Heart Association) guidelines.
 * Mengklasifikasikan tekanan darah ke dalam 5 kategori dan mendeteksi kondisi emergency.
 *
 * Prinsip yang diterapkan:
 * - Single Responsibility: Hanya handle klasifikasi tekanan darah
 * - DRY: Reusable function untuk klasifikasi
 */

/**
 * Interface untuk hasil klasifikasi tekanan darah
 */
export interface TekananDarahResult {
  kategori: string;
  emergency: boolean;
}

/**
 * Klasifikasi tekanan darah berdasarkan AHA guidelines
 *
 * Kategori:
 * 1. Normal: Sistolik < 120 dan Diastolik < 80
 * 2. Elevated (Meningkat): Sistolik 120-129 dan Diastolik < 80
 * 3. Hipertensi Stage 1: Sistolik 130-139 atau Diastolik 80-89
 * 4. Hipertensi Stage 2: Sistolik 140-179 atau Diastolik 90-119
 * 5. Krisis Hipertensi: Sistolik ≥ 180 atau Diastolik ≥ 120 (EMERGENCY)
 *
 * @param sistolik - Tekanan darah sistolik (mmHg)
 * @param diastolik - Tekanan darah diastolik (mmHg)
 * @returns Hasil klasifikasi dengan kategori dan flag emergency
 */
export const klasifikasiTekananDarah = (
  sistolik: number,
  diastolik: number
): TekananDarahResult => {
  // Krisis Hipertensi (Emergency)
  if (sistolik >= 180 || diastolik >= 120) {
    return {
      kategori: 'Krisis Hipertensi',
      emergency: true,
    };
  }

  // Hipertensi Stage 2
  if (sistolik >= 140 || diastolik >= 90) {
    return {
      kategori: 'Hipertensi Stage 2',
      emergency: false,
    };
  }

  // Hipertensi Stage 1
  if (sistolik >= 130 || diastolik >= 80) {
    return {
      kategori: 'Hipertensi Stage 1',
      emergency: false,
    };
  }

  // Elevated (Meningkat)
  if (sistolik >= 120 && diastolik < 80) {
    return {
      kategori: 'Meningkat',
      emergency: false,
    };
  }

  // Normal
  return {
    kategori: 'Normal',
    emergency: false,
  };
};
