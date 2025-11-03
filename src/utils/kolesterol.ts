/**
 * Kolesterol (Cholesterol) Classification Utility
 *
 * Utility untuk klasifikasi kolesterol total berdasarkan standar medis.
 *
 * Prinsip yang diterapkan:
 * - Single Responsibility: Hanya handle klasifikasi kolesterol
 * - DRY: Reusable function untuk klasifikasi
 */

/**
 * Klasifikasi Kolesterol Total
 *
 * Kategori berdasarkan standar medis:
 * - Normal: < 200 mg/dL
 * - Batas Tinggi: 200-239 mg/dL
 * - Tinggi: ≥ 240 mg/dL
 *
 * @param nilai - Nilai kolesterol total (mg/dL)
 * @returns Kategori klasifikasi
 */
export const klasifikasiKolesterol = (nilai: number): string => {
  if (nilai < 200) {
    return 'Normal';
  }

  if (nilai >= 200 && nilai <= 239) {
    return 'Batas Tinggi';
  }

  return 'Tinggi';
};
