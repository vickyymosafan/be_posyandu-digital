/**
 * Vercel Serverless Function Entry Point
 *
 * File ini adalah entry point untuk Vercel serverless function.
 * Vercel akan otomatis detect file di folder /api sebagai serverless functions.
 *
 * Vercel akan compile TypeScript secara otomatis, jadi kita bisa langsung
 * import dari source files tanpa perlu build manual.
 */

import serverless from 'serverless-http';
import app from '../src/app';

// Export default handler untuk Vercel
export default serverless(app, {
  binary: true,
  request: { key: 'originalRequest' },
  response: { key: 'originalResponse' },
});
