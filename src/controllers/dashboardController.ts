/**
 * Dashboard Controller
 *
 * Controller untuk endpoint dashboard statistics.
 * Menyediakan aggregated data untuk frontend dashboard.
 *
 * Prinsip yang diterapkan:
 * - Single Responsibility: Hanya handle HTTP request/response untuk dashboard
 * - Separation of Concerns: Business logic di dashboardService
 * - Error Handling: Proper error responses
 */

import { Request, Response } from 'express';
import { getDashboardStats } from '../services/dashboardService';
import logger from '../utils/logger';

/**
 * GET /api/dashboard/stats
 *
 * Mengambil semua statistik dashboard dalam satu call.
 * Mengembalikan:
 * - totalPetugasAktif: Jumlah petugas aktif
 * - totalLansia: Total lansia terdaftar
 * - totalPemeriksaanHariIni: Jumlah pemeriksaan hari ini
 * - trendData: Data tren pemeriksaan 7 hari terakhir
 *
 * @route GET /api/dashboard/stats
 * @access Private (requires authentication)
 */
export async function getStats(_req: Request, res: Response): Promise<void> {
    try {
        logger.debug('Fetching dashboard statistics');

        const stats = await getDashboardStats();

        logger.info('Dashboard statistics fetched successfully', {
            totalPetugasAktif: stats.totalPetugasAktif,
            totalLansia: stats.totalLansia,
            totalPemeriksaanHariIni: stats.totalPemeriksaanHariIni,
            trendDataPoints: stats.trendData.length,
        });

        res.status(200).json(stats);
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';

        logger.error('Error fetching dashboard statistics', {
            error: errorMessage,
        });

        res.status(500).json({
            error: 'Gagal mengambil statistik dashboard',
            details: process.env.NODE_ENV === 'development' ? errorMessage : undefined,
        });
    }
}
