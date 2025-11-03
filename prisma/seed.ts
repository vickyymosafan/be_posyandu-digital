/**
 * Database Seeder untuk Sistem Backend Posyandu Lansia
 * 
 * Seeder ini membuat admin user default jika belum ada.
 * Seeder bersifat idempotent - tidak akan menimpa data yang sudah ada.
 * 
 * Environment Variables:
 * - ADMIN_NAME: Nama admin (default: "Admin Posyandu")
 * - ADMIN_EMAIL: Email admin (default: "admin@posyandu.local")
 * - ADMIN_PASS: Password admin (jika kosong, akan di-generate secara random)
 */

import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';

const prisma = new PrismaClient();

/**
 * Generate password acak yang aman
 * 
 * Password yang di-generate memiliki karakteristik:
 * - Panjang 16 karakter
 * - Kombinasi huruf besar, huruf kecil, angka, dan simbol
 * - Menggunakan crypto.randomBytes untuk randomness yang kuat
 * 
 * @returns Password acak yang aman
 */
function generateSecurePassword(): string {
  const length = 16;
  const charset = 'abcdefghijkmnopqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789!@#$%^&*';
  const charsetLength = charset.length;
  
  let password = '';
  const randomBytes = crypto.randomBytes(length);
  
  for (let i = 0; i < length; i++) {
    const randomIndex = randomBytes[i] % charsetLength;
    password += charset[randomIndex];
  }
  
  return password;
}

/**
 * Hash password menggunakan bcrypt
 * 
 * @param password - Password plain text yang akan di-hash
 * @returns Password yang sudah di-hash
 */
async function hashPassword(password: string): Promise<string> {
  const saltRounds = 12; // Salt rounds untuk bcrypt (lebih tinggi = lebih aman tapi lebih lambat)
  return bcrypt.hash(password, saltRounds);
}

/**
 * Main seeder function
 * 
 * Membuat admin user default jika belum ada di database.
 * Seeder bersifat idempotent - tidak akan menimpa data yang sudah ada.
 */
async function main() {
  console.log('🌱 Memulai database seeding...\n');

  // Baca environment variables dengan default values
  const adminName = process.env.ADMIN_NAME || 'Admin Posyandu';
  const adminEmail = process.env.ADMIN_EMAIL || 'admin@posyandu.local';
  let adminPassword = process.env.ADMIN_PASS || '';
  
  // Flag untuk track apakah password di-generate
  let isPasswordGenerated = false;

  try {
    // Check apakah admin sudah ada
    const existingAdmin = await prisma.user.findUnique({
      where: { email: adminEmail },
    });

    if (existingAdmin) {
      console.log('✅ Admin user sudah ada di database');
      console.log(`   Email: ${adminEmail}`);
      console.log(`   Nama: ${existingAdmin.nama}`);
      console.log(`   Role: ${existingAdmin.role}`);
      console.log('\n⏭️  Skipping seeding - data sudah ada\n');
      return;
    }

    // Generate password jika tidak ada di environment
    if (!adminPassword) {
      adminPassword = generateSecurePassword();
      isPasswordGenerated = true;
      console.log('🔐 Password admin tidak ditemukan di environment');
      console.log('   Generating password acak yang aman...\n');
    }

    // Hash password
    console.log('🔒 Hashing password dengan bcrypt...');
    const hashedPassword = await hashPassword(adminPassword);

    // Create admin user
    console.log('👤 Membuat admin user...');
    const admin = await prisma.user.create({
      data: {
        nama: adminName,
        email: adminEmail,
        kataSandi: hashedPassword,
        role: 'ADMIN',
        aktif: true,
      },
    });

    console.log('\n✅ Admin user berhasil dibuat!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📋 Detail Admin:');
    console.log(`   ID: ${admin.id}`);
    console.log(`   Nama: ${admin.nama}`);
    console.log(`   Email: ${admin.email}`);
    console.log(`   Role: ${admin.role}`);
    console.log(`   Status: ${admin.aktif ? 'Aktif' : 'Tidak Aktif'}`);
    
    // Tampilkan password jika di-generate
    if (isPasswordGenerated) {
      console.log('\n🔑 PENTING - Simpan kredensial ini:');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log(`   Email: ${admin.email}`);
      console.log(`   Password: ${adminPassword}`);
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('⚠️  Password ini hanya ditampilkan sekali!');
      console.log('   Simpan di tempat yang aman.\n');
    } else {
      console.log('\n✅ Menggunakan password dari environment variable ADMIN_PASS\n');
    }

  } catch (error) {
    console.error('\n❌ Error saat seeding database:');
    console.error(error);
    throw error;
  }
}

// Jalankan seeder
main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    // Cleanup: disconnect Prisma client
    await prisma.$disconnect();
  });
