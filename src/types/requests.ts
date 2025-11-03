/**
 * Request Body Type Definitions
 *
 * Type definitions untuk request bodies yang digunakan di controllers.
 * Ini membantu TypeScript untuk type checking dan menghindari unsafe any warnings.
 */

import { Gender } from '@prisma/client';

// Auth Controller Request Bodies
export interface LoginRequestBody {
  email: string;
  kataSandi: string;
}

// Lansia Controller Request Bodies
export interface CreateLansiaRequestBody {
  nik: string;
  kk: string;
  nama: string;
  tanggalLahir: string;
  gender: Gender;
  alamat: string;
}

export interface UpdateLansiaRequestBody {
  nik?: string;
  kk?: string;
  nama?: string;
  tanggalLahir?: string;
  gender?: Gender;
  alamat?: string;
}

// Pemeriksaan Controller Request Bodies
export interface CreatePemeriksaanRequestBody {
  kode: string;
  tanggalPemeriksaan: string;
  beratBadan?: number;
  tinggiBadan?: number;
  tekananDarahSistolik?: number;
  tekananDarahDiastolik?: number;
  asamUrat?: number;
  gulaDarahPuasa?: number;
  gulaDarahSewaktu?: number;
  gulaDarah2JPP?: number;
  kolesterol?: number;
  keterangan?: string;
}

export interface UpdatePemeriksaanRequestBody {
  tanggalPemeriksaan?: string;
  beratBadan?: number;
  tinggiBadan?: number;
  tekananDarahSistolik?: number;
  tekananDarahDiastolik?: number;
  asamUrat?: number;
  gulaDarahPuasa?: number;
  gulaDarahSewaktu?: number;
  gulaDarah2JPP?: number;
  kolesterol?: number;
  keterangan?: string;
}

// Petugas Controller Request Bodies
export interface CreatePetugasRequestBody {
  nama: string;
  email: string;
  kataSandi: string;
}

export interface UpdateStatusPetugasRequestBody {
  aktif: boolean;
}

// Profil Controller Request Bodies
export interface UpdateNamaRequestBody {
  nama: string;
}

export interface UpdatePasswordRequestBody {
  kataSandiLama: string;
  kataSandiBaru: string;
}
