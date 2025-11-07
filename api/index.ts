/**
 * Vercel Serverless Function Entry Point
 *
 * File ini adalah entry point untuk Vercel serverless function.
 * Hanya export Express app, Vercel akan handle serverless wrapping secara otomatis.
 */

import app from '../src/app';

export default app;
