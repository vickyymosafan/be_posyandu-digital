/**
 * Asam Urat (Uric Acid) Classification Utility
 *
 * Utility untuk klasifikasi asam urat berdasarkan standar medis.
 * Klasifikasi berbeda untuk laki-laki dan perempuan.
 *
 * Prinsip yang diterapkan:
 * - Single Responsibility: Hanya handle klasifikasi asam urat
 * - DRY: Reusable function untuk klasifikasi
 */

/**
 * Klasifikasi Asam Urat berdasarkan gender
 *
 * Kategori untuk Laki-laki:
 * - Rendah: < 3.4 mg/dL
 * - Normal: 3.4-7.0 mg/dL
 * - Tinggi: > 7.0 mg/dL
 *
 * Kategori untuk Perempuan:
 * - Rendah: < 2.4 mg/dL
 * - Normal: 2.4-6.0 mg/dL
 * - Tinggi: > 6.0 mg/dL
 *
 * @param nilai - Nilai asam urat (mg/dL)
 * @param gender - Gender ('L' untuk Laki-laki, 'P' untuk Perempuan)
 * @returns Kategori klasifikasi
 */
export const klasifikasiAsamUrat = (nilai: number, gender: 'L' | 'P'): string => {
  if (gender === 'L') {
    // Klasifikasi untuk Laki-laki
    if (nilai < 3.4) {
      return 'Rendah';
    }

    if (nilai >= 3.4 && nilai <= 7.0) {
      return 'Normal';
    }

    return 'Tinggi';
  }
  // Klasifikasi untuk Perempuan
  if (nilai < 2.4) {
    return 'Rendah';
  }

  if (nilai >= 2.4 && nilai <= 6.0) {
    return 'Normal';
  }

  return 'Tinggi';
};
