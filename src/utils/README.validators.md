# Validators Documentation

## Overview

File `validators.ts` mengimplementasikan semua Zod schemas untuk validasi input di seluruh aplikasi. File ini dirancang dengan prinsip SOLID dan DRY untuk maintainability dan reusability.

## Struktur

### 1. Reusable Validators

Validators yang dapat digunakan kembali untuk menghindari duplikasi:

- `nikValidator` - Validasi NIK 16 digit numeric
- `kkValidator` - Validasi Nomor KK 16 digit numeric
- `tanggalLahirValidator` - Validasi tanggal lahir (tidak di masa depan)
- `namaValidator` - Validasi nama (1-255 karakter)
- `emailValidator` - Validasi format email
- `kataSandiValidator` - Validasi password (minimal 6 karakter)
- `genderValidator` - Validasi gender ('L' atau 'P')

### 2. Auth Schemas

- `loginRequestSchema` - Validasi request login (email, kataSandi)

### 3. User/Petugas Schemas

- `createPetugasSchema` - Validasi create petugas baru
- `updateNamaSchema` - Validasi update nama
- `updatePasswordSchema` - Validasi update password
- `updateStatusPetugasSchema` - Validasi update status aktif

### 4. Lansia Schemas

- `createLansiaSchema` - Validasi create lansia dengan NIK/KK validation
- `kodePasienQuerySchema` - Validasi query parameter kode
- `findLansiaSchema` - Validasi find lansia by kode

### 5. Pemeriksaan Schemas

- `pemeriksaanFisikSchema` - Validasi pemeriksaan fisik (tinggi, berat, tekanan darah)
- `pemeriksaanKesehatanSchema` - Validasi pemeriksaan kesehatan (lab values)
- `pemeriksaanGabunganSchema` - Validasi pemeriksaan gabungan dengan logic:
  - Minimal satu field harus diisi
  - Jika ada pemeriksaan fisik, semua field fisik harus lengkap

## Prinsip yang Diterapkan

### SOLID Principles

1. **Single Responsibility**: Setiap schema bertanggung jawab untuk satu DTO
2. **Open/Closed**: Schema dapat di-extend tanpa modifikasi existing code
3. **Interface Segregation**: Schema terpisah untuk setiap kebutuhan spesifik

### Design Principles

1. **DRY**: Reusable validators untuk NIK, KK, nama, email, dll
2. **Type Safety**: Export inferred types untuk type safety di seluruh aplikasi
3. **Clear Error Messages**: Semua error messages dalam bahasa Indonesia

## Validasi Ranges

### Pemeriksaan Fisik
- Tinggi: 50-250 cm
- Berat: 10-300 kg
- Sistolik: 40-300 mmHg
- Diastolik: 30-200 mmHg

### Pemeriksaan Kesehatan
- Semua nilai lab: non-negatif (≥ 0)

## Usage Example

```typescript
import { createLansiaSchema, type CreateLansiaDTO } from '@/utils/validators';

// Validasi input
const result = createLansiaSchema.safeParse(requestBody);

if (!result.success) {
  // Handle validation errors
  console.error(result.error.issues);
  return;
}

// Type-safe data
const data: CreateLansiaDTO = result.data;
```

## Requirements Coverage

File ini memenuhi requirements:
- 5.1: Validasi NIK 16 digit numeric
- 5.2: Validasi KK 16 digit numeric
- 5.3: Validasi nama tidak kosong, max 255 karakter
- 5.4: Validasi tanggal lahir valid dan tidak di masa depan
- 8.1: Validasi tinggi 50-250 cm
- 8.2: Validasi berat 10-300 kg
- 8.3: Validasi sistolik 40-300 mmHg
- 8.4: Validasi diastolik 30-200 mmHg
- 10.1: Validasi nilai lab non-negatif
