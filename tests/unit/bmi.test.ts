/**
 * Unit tests untuk BMI utility
 * 
 * Test coverage:
 * - Kalkulasi BMI dengan berbagai input
 * - Klasifikasi untuk semua 7 kategori BMI
 * - Validasi input (error cases)
 * - Boundary values
 * - Edge cases
 * 
 * Target coverage: 80%+
 */

import { hitungBMI, type BMIResult } from '../../src/utils/bmi';

describe('hitungBMI', () => {
  describe('Kalkulasi BMI', () => {
    it('harus menghitung BMI dengan benar untuk input normal', () => {
      const result = hitungBMI(60, 160);
      expect(result.nilai).toBe(23.44);
      expect(result.kategori).toBe('Kelebihan Berat Badan');
    });

    it('harus menghitung BMI dengan benar untuk input lain', () => {
      const result = hitungBMI(70, 170);
      expect(result.nilai).toBe(24.22);
      expect(result.kategori).toBe('Kelebihan Berat Badan');
    });

    it('harus membulatkan BMI ke 2 desimal', () => {
      const result = hitungBMI(65.5, 175.3);
      expect(result.nilai).toBeCloseTo(21.31, 2);
    });

    it('harus menghitung BMI untuk berat dan tinggi minimal', () => {
      const result = hitungBMI(10, 50);
      expect(result.nilai).toBe(40);
      expect(result.kategori).toBe('Obesitas III');
    });

    it('harus menghitung BMI untuk berat dan tinggi maksimal', () => {
      const result = hitungBMI(300, 250);
      expect(result.nilai).toBe(48);
      expect(result.kategori).toBe('Obesitas III');
    });
  });

  describe('Klasifikasi BMI - Berat Badan Sangat Kurang (< 17.0)', () => {
    it('harus mengklasifikasi BMI 16.9 sebagai Berat Badan Sangat Kurang', () => {
      const result = hitungBMI(43, 160);
      expect(result.nilai).toBe(16.8);
      expect(result.kategori).toBe('Berat Badan Sangat Kurang');
    });

    it('harus mengklasifikasi BMI 15.0 sebagai Berat Badan Sangat Kurang', () => {
      const result = hitungBMI(38.4, 160);
      expect(result.nilai).toBe(15);
      expect(result.kategori).toBe('Berat Badan Sangat Kurang');
    });

    it('harus mengklasifikasi BMI 10.0 sebagai Berat Badan Sangat Kurang', () => {
      const result = hitungBMI(25.6, 160);
      expect(result.nilai).toBe(10);
      expect(result.kategori).toBe('Berat Badan Sangat Kurang');
    });
  });

  describe('Klasifikasi BMI - Berat Badan Kurang (17.0 - 18.4)', () => {
    it('harus mengklasifikasi BMI 17.0 sebagai Berat Badan Kurang (boundary)', () => {
      const result = hitungBMI(43.52, 160);
      expect(result.nilai).toBe(17);
      expect(result.kategori).toBe('Berat Badan Kurang');
    });

    it('harus mengklasifikasi BMI 17.5 sebagai Berat Badan Kurang', () => {
      const result = hitungBMI(44.8, 160);
      expect(result.nilai).toBe(17.5);
      expect(result.kategori).toBe('Berat Badan Kurang');
    });

    it('harus mengklasifikasi BMI 18.4 sebagai Berat Badan Kurang (boundary)', () => {
      const result = hitungBMI(47.1, 160);
      expect(result.nilai).toBe(18.4);
      expect(result.kategori).toBe('Berat Badan Kurang');
    });
  });

  describe('Klasifikasi BMI - Normal (18.5 - 22.9)', () => {
    it('harus mengklasifikasi BMI 18.5 sebagai Normal (boundary)', () => {
      const result = hitungBMI(47.36, 160);
      expect(result.nilai).toBe(18.5);
      expect(result.kategori).toBe('Normal');
    });

    it('harus mengklasifikasi BMI 20.0 sebagai Normal', () => {
      const result = hitungBMI(51.2, 160);
      expect(result.nilai).toBe(20);
      expect(result.kategori).toBe('Normal');
    });

    it('harus mengklasifikasi BMI 22.9 sebagai Normal (boundary)', () => {
      const result = hitungBMI(58.6, 160);
      expect(result.nilai).toBe(22.89);
      expect(result.kategori).toBe('Normal');
    });
  });

  describe('Klasifikasi BMI - Kelebihan Berat Badan (23.0 - 24.9)', () => {
    it('harus mengklasifikasi BMI 23.0 sebagai Kelebihan Berat Badan (boundary)', () => {
      const result = hitungBMI(58.88, 160);
      expect(result.nilai).toBe(23);
      expect(result.kategori).toBe('Kelebihan Berat Badan');
    });

    it('harus mengklasifikasi BMI 24.0 sebagai Kelebihan Berat Badan', () => {
      const result = hitungBMI(61.44, 160);
      expect(result.nilai).toBe(24);
      expect(result.kategori).toBe('Kelebihan Berat Badan');
    });

    it('harus mengklasifikasi BMI 24.9 sebagai Kelebihan Berat Badan (boundary)', () => {
      const result = hitungBMI(63.7, 160);
      expect(result.nilai).toBe(24.88);
      expect(result.kategori).toBe('Kelebihan Berat Badan');
    });
  });

  describe('Klasifikasi BMI - Obesitas I (25.0 - 29.9)', () => {
    it('harus mengklasifikasi BMI 25.0 sebagai Obesitas I (boundary)', () => {
      const result = hitungBMI(64, 160);
      expect(result.nilai).toBe(25);
      expect(result.kategori).toBe('Obesitas I');
    });

    it('harus mengklasifikasi BMI 27.0 sebagai Obesitas I', () => {
      const result = hitungBMI(69.12, 160);
      expect(result.nilai).toBe(27);
      expect(result.kategori).toBe('Obesitas I');
    });

    it('harus mengklasifikasi BMI 29.9 sebagai Obesitas I (boundary)', () => {
      const result = hitungBMI(76.5, 160);
      expect(result.nilai).toBe(29.88);
      expect(result.kategori).toBe('Obesitas I');
    });
  });

  describe('Klasifikasi BMI - Obesitas II (30.0 - 34.9)', () => {
    it('harus mengklasifikasi BMI 30.0 sebagai Obesitas II (boundary)', () => {
      const result = hitungBMI(76.8, 160);
      expect(result.nilai).toBe(30);
      expect(result.kategori).toBe('Obesitas II');
    });

    it('harus mengklasifikasi BMI 32.0 sebagai Obesitas II', () => {
      const result = hitungBMI(81.92, 160);
      expect(result.nilai).toBe(32);
      expect(result.kategori).toBe('Obesitas II');
    });

    it('harus mengklasifikasi BMI 34.9 sebagai Obesitas II (boundary)', () => {
      const result = hitungBMI(89.3, 160);
      expect(result.nilai).toBe(34.88);
      expect(result.kategori).toBe('Obesitas II');
    });
  });

  describe('Klasifikasi BMI - Obesitas III (≥ 35.0)', () => {
    it('harus mengklasifikasi BMI 35.0 sebagai Obesitas III (boundary)', () => {
      const result = hitungBMI(89.6, 160);
      expect(result.nilai).toBe(35);
      expect(result.kategori).toBe('Obesitas III');
    });

    it('harus mengklasifikasi BMI 40.0 sebagai Obesitas III', () => {
      const result = hitungBMI(102.4, 160);
      expect(result.nilai).toBe(40);
      expect(result.kategori).toBe('Obesitas III');
    });

    it('harus mengklasifikasi BMI 50.0 sebagai Obesitas III', () => {
      const result = hitungBMI(128, 160);
      expect(result.nilai).toBe(50);
      expect(result.kategori).toBe('Obesitas III');
    });
  });

  describe('Validasi Input - Berat Badan', () => {
    it('harus throw error jika berat kurang dari 10 kg', () => {
      expect(() => hitungBMI(9, 160)).toThrow(
        'Berat badan tidak valid. Minimal 10 kg'
      );
    });

    it('harus throw error jika berat lebih dari 300 kg', () => {
      expect(() => hitungBMI(301, 160)).toThrow(
        'Berat badan tidak valid. Maksimal 300 kg'
      );
    });

    it('harus throw error jika berat bukan angka', () => {
      expect(() => hitungBMI(NaN, 160)).toThrow(
        'Berat badan harus berupa angka'
      );
    });

    it('harus throw error jika berat adalah string', () => {
      expect(() => hitungBMI('60' as any, 160)).toThrow(
        'Berat badan harus berupa angka'
      );
    });

    it('harus throw error jika berat negatif', () => {
      expect(() => hitungBMI(-10, 160)).toThrow(
        'Berat badan tidak valid. Minimal 10 kg'
      );
    });

    it('harus throw error jika berat adalah 0', () => {
      expect(() => hitungBMI(0, 160)).toThrow(
        'Berat badan tidak valid. Minimal 10 kg'
      );
    });
  });

  describe('Validasi Input - Tinggi Badan', () => {
    it('harus throw error jika tinggi kurang dari 50 cm', () => {
      expect(() => hitungBMI(60, 49)).toThrow(
        'Tinggi badan tidak valid. Minimal 50 cm'
      );
    });

    it('harus throw error jika tinggi lebih dari 250 cm', () => {
      expect(() => hitungBMI(60, 251)).toThrow(
        'Tinggi badan tidak valid. Maksimal 250 cm'
      );
    });

    it('harus throw error jika tinggi bukan angka', () => {
      expect(() => hitungBMI(60, NaN)).toThrow(
        'Tinggi badan harus berupa angka'
      );
    });

    it('harus throw error jika tinggi adalah string', () => {
      expect(() => hitungBMI(60, '160' as any)).toThrow(
        'Tinggi badan harus berupa angka'
      );
    });

    it('harus throw error jika tinggi negatif', () => {
      expect(() => hitungBMI(60, -160)).toThrow(
        'Tinggi badan tidak valid. Minimal 50 cm'
      );
    });

    it('harus throw error jika tinggi adalah 0', () => {
      expect(() => hitungBMI(60, 0)).toThrow(
        'Tinggi badan tidak valid. Minimal 50 cm'
      );
    });
  });

  describe('Edge Cases', () => {
    it('harus menangani input desimal dengan benar', () => {
      const result = hitungBMI(60.5, 165.5);
      expect(result.nilai).toBeCloseTo(22.09, 2);
      expect(result.kategori).toBe('Normal');
    });

    it('harus menangani tinggi sangat pendek dengan berat normal', () => {
      const result = hitungBMI(50, 100);
      expect(result.nilai).toBe(50);
      expect(result.kategori).toBe('Obesitas III');
    });

    it('harus menangani tinggi sangat tinggi dengan berat normal', () => {
      const result = hitungBMI(100, 240);
      expect(result.nilai).toBeCloseTo(17.36, 2);
      expect(result.kategori).toBe('Berat Badan Kurang');
    });

    it('harus menangani berat minimal dengan tinggi maksimal', () => {
      const result = hitungBMI(10, 250);
      expect(result.nilai).toBe(1.6);
      expect(result.kategori).toBe('Berat Badan Sangat Kurang');
    });

    it('harus menangani berat maksimal dengan tinggi minimal', () => {
      const result = hitungBMI(300, 50);
      expect(result.nilai).toBe(1200);
      expect(result.kategori).toBe('Obesitas III');
    });
  });

  describe('Return Type', () => {
    it('harus mengembalikan object dengan property nilai dan kategori', () => {
      const result = hitungBMI(60, 160);
      expect(result).toHaveProperty('nilai');
      expect(result).toHaveProperty('kategori');
    });

    it('harus mengembalikan nilai sebagai number', () => {
      const result = hitungBMI(60, 160);
      expect(typeof result.nilai).toBe('number');
    });

    it('harus mengembalikan kategori sebagai string', () => {
      const result = hitungBMI(60, 160);
      expect(typeof result.kategori).toBe('string');
    });

    it('harus mengembalikan nilai BMI yang tidak NaN', () => {
      const result = hitungBMI(60, 160);
      expect(Number.isNaN(result.nilai)).toBe(false);
    });

    it('harus mengembalikan kategori yang tidak kosong', () => {
      const result = hitungBMI(60, 160);
      expect(result.kategori.length).toBeGreaterThan(0);
    });
  });

  describe('Konsistensi Kalkulasi', () => {
    it('harus memberikan hasil yang sama untuk input yang sama', () => {
      const result1 = hitungBMI(60, 160);
      const result2 = hitungBMI(60, 160);
      expect(result1.nilai).toBe(result2.nilai);
      expect(result1.kategori).toBe(result2.kategori);
    });

    it('harus memberikan hasil berbeda untuk input berbeda', () => {
      const result1 = hitungBMI(60, 160);
      const result2 = hitungBMI(70, 170);
      expect(result1.nilai).not.toBe(result2.nilai);
    });
  });
});
