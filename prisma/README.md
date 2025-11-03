# Prisma Database Schema

Dokumentasi untuk database schema Sistem Backend Posyandu Lansia.

## Models

### User
Model untuk autentikasi dan otorisasi user (Admin dan Petugas).

**Fields:**
- `id`: Primary key (auto-increment)
- `nama`: Nama lengkap user (max 255 karakter)
- `email`: Email unik untuk login (max 255 karakter)
- `kataSandi`: Password yang di-hash dengan bcrypt (max 255 karakter)
- `role`: Role user (ADMIN atau PETUGAS)
- `aktif`: Status aktif user (default: true)
- `createdAt`: Timestamp pembuatan record

**Indexes:**
- `email` (unique): Untuk login dan pencarian user
- `role`: Untuk filter berdasarkan role

**Constraints:**
- Email harus unique
- Role harus ADMIN atau PETUGAS

---

### Lansia
Model untuk data lanjut usia yang terdaftar di posyandu.

**Fields:**
- `id`: Primary key (auto-increment)
- `kode`: Kode pasien unik (format: pasien + YYYYMMDD + 2 karakter base62, total 16 karakter)
- `nik`: Nomor Induk Kependudukan (16 digit, unique)
- `kk`: Nomor Kartu Keluarga (16 digit)
- `nama`: Nama lengkap lansia (max 255 karakter)
- `gender`: Jenis kelamin (L atau P)
- `tanggalLahir`: Tanggal lahir (date only)
- `alamat`: Alamat lengkap (text)
- `createdAt`: Timestamp pembuatan record

**Relations:**
- `pemeriksaan`: One-to-many dengan Pemeriksaan

**Indexes:**
- `kode` (unique): Untuk pencarian cepat berdasarkan kode pasien
- `nik` (unique): Untuk validasi dan pencarian berdasarkan NIK
- `createdAt`: Untuk sorting dan filter berdasarkan tanggal registrasi

**Constraints:**
- Kode pasien harus unique
- NIK harus unique
- Gender harus L atau P

---

### Pemeriksaan
Model untuk data pemeriksaan fisik dan kesehatan lansia.

**Fields:**

*Metadata:*
- `id`: Primary key (auto-increment)
- `lansiaId`: Foreign key ke Lansia
- `tanggal`: Timestamp pemeriksaan (default: now)
- `createdAt`: Timestamp pembuatan record

*Pemeriksaan Fisik:*
- `tinggi`: Tinggi badan dalam cm (optional, double precision)
- `berat`: Berat badan dalam kg (optional, double precision)
- `bmi`: Body Mass Index hasil kalkulasi (optional, double precision)
- `kategoriBmi`: Kategori BMI berdasarkan standar Asia Pasifik (optional, max 100 karakter)
- `sistolik`: Tekanan darah sistolik dalam mmHg (optional, integer)
- `diastolik`: Tekanan darah diastolik dalam mmHg (optional, integer)
- `tekananDarah`: Kategori tekanan darah berdasarkan AHA guidelines (optional, max 100 karakter)

*Pemeriksaan Kesehatan (Lab):*
- `asamUrat`: Kadar asam urat dalam mg/dL (optional, double precision)
- `gulaPuasa`: Gula Darah Puasa (GDP) dalam mg/dL (optional, double precision)
- `gulaSewaktu`: Gula Darah Sewaktu (GDS) dalam mg/dL (optional, double precision)
- `gula2Jpp`: Gula darah 2 Jam Post Prandial dalam mg/dL (optional, double precision)
- `klasifikasiGula`: Klasifikasi gula darah dalam format JSON (optional)
- `kolesterol`: Kadar kolesterol total dalam mg/dL (optional, double precision)
- `klasifikasiKolesterol`: Klasifikasi kolesterol (optional, max 100 karakter)

**Relations:**
- `lansia`: Many-to-one dengan Lansia (cascade delete)

**Indexes:**
- `lansiaId`: Untuk query pemeriksaan berdasarkan lansia
- `tanggal`: Untuk sorting dan filter berdasarkan tanggal pemeriksaan
- `createdAt`: Untuk sorting berdasarkan waktu input

**Constraints:**
- lansiaId harus reference ke Lansia.id yang valid
- Cascade delete: Jika lansia dihapus, semua pemeriksaan terkait juga dihapus

---

## Enums

### Role
Role user dalam sistem:
- `ADMIN`: Akses penuh untuk mengelola petugas dan semua fitur
- `PETUGAS`: Dapat mencatat data lansia dan pemeriksaan

### Gender
Jenis kelamin:
- `L`: Laki-laki
- `P`: Perempuan

---

## Database Commands

### Generate Prisma Client
```bash
npm run prisma:generate
```

### Create Migration
```bash
npx prisma migrate dev --name nama_migration
```

### Run Migrations
```bash
npm run prisma:migrate
```

### Seed Database
```bash
npm run prisma:seed
```

### Open Prisma Studio
```bash
npx prisma studio
```

### Reset Database (Development Only)
```bash
npx prisma migrate reset
```

---

## Notes

1. **Unique Constraints**: Email, kode pasien, dan NIK harus unique untuk menjaga integritas data
2. **Indexes**: Ditambahkan pada field yang sering di-query untuk optimasi performa
3. **Cascade Delete**: Pemeriksaan akan otomatis terhapus jika lansia terkait dihapus
4. **Optional Fields**: Semua field pemeriksaan fisik dan kesehatan bersifat optional untuk mendukung pemeriksaan parsial
5. **Data Types**: 
   - Float/DoublePrecision untuk nilai medis yang memerlukan desimal
   - Integer untuk tekanan darah (nilai bulat)
   - JSON untuk klasifikasi gula darah yang kompleks
   - Text untuk alamat yang bisa panjang
   - VarChar dengan length limit untuk field lainnya

---

## ER Diagram

```
┌─────────────┐
│    User     │
├─────────────┤
│ id (PK)     │
│ nama        │
│ email (UQ)  │
│ kataSandi   │
│ role        │
│ aktif       │
│ createdAt   │
└─────────────┘

┌─────────────────┐         ┌──────────────────────┐
│     Lansia      │         │    Pemeriksaan       │
├─────────────────┤         ├──────────────────────┤
│ id (PK)         │────┐    │ id (PK)              │
│ kode (UQ)       │    │    │ lansiaId (FK)        │
│ nik (UQ)        │    └───<│ tanggal              │
│ kk              │         │ tinggi               │
│ nama            │         │ berat                │
│ gender          │         │ bmi                  │
│ tanggalLahir    │         │ kategoriBmi          │
│ alamat          │         │ sistolik             │
│ createdAt       │         │ diastolik            │
└─────────────────┘         │ tekananDarah         │
                            │ asamUrat             │
                            │ gulaPuasa            │
                            │ gulaSewaktu          │
                            │ gula2Jpp             │
                            │ klasifikasiGula      │
                            │ kolesterol           │
                            │ klasifikasiKolesterol│
                            │ createdAt            │
                            └──────────────────────┘

Legend:
PK = Primary Key
FK = Foreign Key
UQ = Unique Constraint
──< = One-to-Many Relationship
```
