/**
 * Dashboard Service
 *
 * Service untuk aggregasi data statistik dashboard.
 * Mengoptimalkan performa dengan single database call untuk multiple stats.
 *
 * Prinsip yang diterapkan:
 * - Single Responsibility: Hanya handle dashboard statistics
 * - Performance: Use Prisma count() instead of findMany().length
 * - Efficiency: Parallel queries with Promise.all
 */

import { prisma } from '../utils/prisma';

/**
 * Interface untuk statistik dashboard
 */
export interface DashboardStats {
    totalPetugasAktif: number;
    totalLansia: number;
    totalPemeriksaanHariIni: number;
    trendData: TrendDataItem[];
}

/**
 * Interface untuk data tren pemeriksaan
 */
export interface TrendDataItem {
    tanggal: string;
    jumlah: number;
}

/**
 * Helper function untuk mendapatkan start of day
 */
function startOfDay(date: Date): Date {
    const result = new Date(date);
    result.setHours(0, 0, 0, 0);
    return result;
}

/**
 * Helper function untuk mendapatkan end of day
 */
function endOfDay(date: Date): Date {
    const result = new Date(date);
    result.setHours(23, 59, 59, 999);
    return result;
}

/**
 * Helper function untuk format tanggal ke dd/MM
 */
function formatDate(date: Date): string {
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    return `${day}/${month}`;
}

/**
 * Helper function untuk subtract days dari date
 */
function subDays(date: Date, days: number): Date {
    const result = new Date(date);
    result.setDate(result.getDate() - days);
    return result;
}

/**
 * Mengambil data tren pemeriksaan 7 hari terakhir
 *
 * @returns Array of trend data dengan tanggal dan jumlah pemeriksaan
 */
async function getTrendData(): Promise<TrendDataItem[]> {
    const today = new Date();

    // Gunakan Promise.all untuk parallel queries
    const trendPromises: Promise<TrendDataItem>[] = [];
    for (let i = 6; i >= 0; i--) {
        const date = subDays(today, i);
        const startDate = startOfDay(date);
        const endDate = endOfDay(date);

        trendPromises.push(
            prisma.pemeriksaan
                .count({
                    where: {
                        tanggal: {
                            gte: startDate,
                            lte: endDate,
                        },
                    },
                })
                .then((count) => ({
                    tanggal: formatDate(date),
                    jumlah: count,
                }))
        );
    }

    const results = await Promise.all(trendPromises);
    return results;
}

/**
 * Mengambil semua statistik dashboard dalam satu call
 *
 * Optimized untuk:
 * - Single database round-trip dengan Promise.all
 * - Menggunakan count() instead of findMany().length
 * - Parallel execution untuk semua queries
 *
 * @returns DashboardStats object dengan semua statistik
 */
export async function getDashboardStats(): Promise<DashboardStats> {
    const today = new Date();
    const startOfToday = startOfDay(today);
    const endOfToday = endOfDay(today);

    // Execute all queries in parallel for maximum performance
    const [totalPetugasAktif, totalLansia, totalPemeriksaanHariIni, trendData] =
        await Promise.all([
            // Count active petugas (PETUGAS role yang aktif)
            prisma.user.count({
                where: {
                    role: 'PETUGAS',
                    aktif: true,
                },
            }),
            // Count total lansia
            prisma.lansia.count(),
            // Count pemeriksaan hari ini
            prisma.pemeriksaan.count({
                where: {
                    tanggal: {
                        gte: startOfToday,
                        lte: endOfToday,
                    },
                },
            }),
            // Get trend data untuk 7 hari terakhir
            getTrendData(),
        ]);

    return {
        totalPetugasAktif,
        totalLansia,
        totalPemeriksaanHariIni,
        trendData,
    };
}
