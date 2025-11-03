/**
 * Serverless Adapter untuk Vercel
 * 
 * File ini adalah adapter untuk menjalankan Express app sebagai serverless function.
 * Digunakan untuk deployment di platform serverless seperti Vercel.
 * 
 * Prinsip yang diterapkan:
 * - Single Responsibility: Hanya bertanggung jawab untuk wrap Express app
 * - Separation of Concerns: App configuration ada di app.ts
 * - KISS (Keep It Simple): Implementasi minimal tanpa over-engineering
 * - YAGNI (You Aren't Gonna Need It): Hanya implement yang diperlukan
 */

import serverless from 'serverless-http';
import app from './app';

/**
 * Serverless Handler
 * 
 * Wrap Express app dengan serverless-http untuk compatibility dengan
 * serverless platforms seperti Vercel, AWS Lambda, dll.
 * 
 * serverless-http akan:
 * - Convert serverless event ke Express request
 * - Convert Express response ke serverless response
 * - Handle binary data (images, files, dll)
 * - Handle cookies dan headers
 * 
 * Configuration:
 * - binary: Auto-detect binary content types
 * - request: Preserve original request info
 * - response: Preserve original response info
 * 
 * @example
 * // Vercel akan call handler function untuk setiap request
 * export const handler = serverless(app);
 * 
 * // AWS Lambda
 * exports.handler = serverless(app);
 */
export const handler = serverless(app, {
  // Binary media types yang akan di-handle sebagai binary
  // Auto-detect jika tidak dispesifikasikan
  binary: true,

  // Request configuration
  request: {
    // Preserve original request info untuk logging
    key: 'originalRequest',
  },

  // Response configuration
  response: {
    // Preserve original response info untuk logging
    key: 'originalResponse',
  },
});

/**
 * Notes untuk Deployment:
 * 
 * 1. Vercel Configuration (vercel.json):
 *    - Build command: npm run build
 *    - Output directory: dist/
 *    - Entry point: dist/serverless.js
 * 
 * 2. Environment Variables:
 *    - Semua environment variables harus di-set di Vercel dashboard
 *    - DATABASE_URL, JWT_SECRET, APP_URL, dll
 * 
 * 3. Cold Start:
 *    - Serverless functions mengalami cold start
 *    - First request setelah idle akan lebih lambat
 *    - Optimize dengan keep-alive connections
 * 
 * 4. Limitations:
 *    - Execution timeout (Vercel: 10s untuk Hobby, 60s untuk Pro)
 *    - Memory limit (Vercel: 1024MB untuk Hobby, 3008MB untuk Pro)
 *    - No persistent file system (gunakan database atau cloud storage)
 * 
 * 5. Database Connections:
 *    - Gunakan connection pooling
 *    - Prisma sudah handle connection pooling secara otomatis
 *    - Set connection limit sesuai dengan serverless platform
 */
