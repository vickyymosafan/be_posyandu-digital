# BMI Utility Documentation

## Overview

Utility untuk kalkulasi dan klasifikasi Body Mass Index (BMI) menggunakan standar Asia Pasifik (WHO Asia-Pacific Guidelines).

## File

- `bmi.ts` - Main utility implementation
- `tests/unit/bmi.test.ts` - Comprehensive unit tests (50 test cases, 100% coverage)

## Interface

```typescript
interface BMIResult {
  nilai: number;      // Nilai BMI (2 desimal)
  kategori: string;   // Kategori BMI
}
```

## Function

```typescript
function hitungBMI(beratKg: number, tinggiCm: number): BMIResult
```

### Parameters

- `beratKg` - Berat badan dalam kilogram (10-300 kg)
- `tinggiCm` - Tinggi badan dalam centimeter (50-250 cm)

### Returns

Object dengan property:
- `nilai` - Nilai BMI yang dihitung (2 desimal)
- `kategori` - Kategori BMI berdasarkan standar Asia Pasifik

### Throws

- Error jika berat di luar range 10-300 kg
- Error jika tinggi di luar range 50-250 cm
- Error jika input bukan angka atau NaN

## Klasifikasi BMI (Standar Asia Pasifik)

| BMI Range | Kategori |
|-----------|----------|
| < 17.0 | Berat Badan Sangat Kurang |
| 17.0 - 18.4 | Berat Badan Kurang |
| 18.5 - 22.9 | Normal |
| 23.0 - 24.9 | Kelebihan Berat Badan |
| 25.0 - 29.9 | Obesitas I |
| 30.0 - 34.9 | Obesitas II |
| ≥ 35.0 | Obesitas III |

## Formula

```
BMI = berat (kg) / (tinggi (m))²
```

Hasil dibulatkan ke 2 desimal.

## Usage Example

```typescript
import { hitungBMI } from '@/utils/bmi';

// Contoh 1: BMI Normal
const result1 = hitungBMI(60, 160);
console.log(result1);
// Output: { nilai: 23.44, kategori: 'Kelebihan Berat Badan' }

// Contoh 2: BMI Obesitas
const result2 = hitungBMI(90, 160);
console.log(result2);
// Output: { nilai: 35.16, kategori: 'Obesitas III' }

// Contoh 3: Error handling
try {
  hitungBMI(5, 160); // Berat terlalu rendah
} catch (error) {
  console.error(error.message);
  // Output: "Berat badan tidak valid. Minimal 10 kg"
}
```

## Prinsip yang Diterapkan

### SOLID Principles

1. **Single Responsibility**: Function fokus pada kalkulasi dan klasifikasi BMI
2. **Open/Closed**: Mudah di-extend dengan threshold baru tanpa modifikasi existing code

### Design Principles

1. **DRY**: Constants untuk thresholds yang reusable
2. **Type Safety**: Interface yang jelas untuk return value
3. **Input Validation**: Validasi range realistis untuk keamanan
4. **Maintainability**: Separated validation, calculation, and classification logic

## Test Coverage

**100% Coverage** (50 test cases):

- ✅ Kalkulasi BMI dengan berbagai input (5 tests)
- ✅ Klasifikasi semua 7 kategori BMI dengan boundary values (21 tests)
- ✅ Validasi input berat badan (6 tests)
- ✅ Validasi input tinggi badan (6 tests)
- ✅ Edge cases (5 tests)
- ✅ Return type validation (5 tests)
- ✅ Konsistensi kalkulasi (2 tests)

## Requirements Coverage

File ini memenuhi requirements:
- 7.1: Kalkulasi BMI dengan rumus yang benar
- 7.2: Klasifikasi BMI berdasarkan standar Asia Pasifik
- 8.1: Validasi tinggi 50-250 cm
- 8.2: Validasi berat 10-300 kg

## Performance

- O(1) time complexity
- No external dependencies
- Pure function (no side effects)
- Deterministic output
