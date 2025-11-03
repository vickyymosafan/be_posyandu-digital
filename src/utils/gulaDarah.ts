/**
 * Gula Darah (Blood Sugar) Classification Utility
 *
 * Utility untuk klasifikasi gula darah berdasarkan standar medis.
 * Menyediakan fungsi terpisah untuk GDP, GDS, dan 2JPP.
 *
 * Prinsip yang diterapkan:
 * - Single Responsibility: Hanya handle klasifikasi gula darah
 * - DRY: Reusable functions untuk berbagai jenis pengukuran
 * - Interface Segregation: Fungsi terpisah untuk setiap jenis pengukuran
 */

/**
 * Interface untuk klasifikasi gula darah lengkap
 * Digunakan untuk menyimpan hasil klasifikasi dalam format JSON
 */
export interface KlasifikasiGulaDarah {
  gdp?: string;
  gds?: string;
  duaJpp?: string;
}

/**
 * Klasifikasi Gula Darah Puasa (GDP)
 *
 * Kategori:
 * - Normal: < 100 mg/dL
 * - Pra-Diabetes: 100-125 mg/dL
 * - Diabetes: ≥ 126 mg/dL
 *
 * @param nilai - Nilai gula darah puasa (mg/dL)
 * @returns Kategori klasifikasi
 */
export const klasifikasiGDP = (nilai: number): string => {
  if (nilai < 100) {
    return 'Normal';
  }

  if (nilai >= 100 && nilai <= 125) {
    return 'Pra-Diabetes';
  }

  return 'Diabetes';
};

/**
 * Klasifikasi Gula Darah Sewaktu (GDS)
 *
 * Kategori:
 * - Normal: < 200 mg/dL
 * - Diabetes: ≥ 200 mg/dL
 *
 * @param nilai - Nilai gula darah sewaktu (mg/dL)
 * @returns Kategori klasifikasi
 */
export const klasifikasiGDS = (nilai: number): string => {
  if (nilai < 200) {
    return 'Normal';
  }

  return 'Diabetes';
};

/**
 * Klasifikasi Gula Darah 2 Jam Post Prandial (2JPP)
 *
 * Kategori:
 * - Normal: < 140 mg/dL
 * - Pra-Diabetes: 140-199 mg/dL
 * - Diabetes: ≥ 200 mg/dL
 *
 * @param nilai - Nilai gula darah 2 jam setelah makan (mg/dL)
 * @returns Kategori klasifikasi
 */
export const klasifikasiDuaJPP = (nilai: number): string => {
  if (nilai < 140) {
    return 'Normal';
  }

  if (nilai >= 140 && nilai <= 199) {
    return 'Pra-Diabetes';
  }

  return 'Diabetes';
};
