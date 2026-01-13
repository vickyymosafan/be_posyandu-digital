/**
 * Cache Middleware
 *
 * Middleware untuk menambahkan Cache-Control headers pada API responses.
 * Implementasi caching strategy per-endpoint untuk optimal performance.
 *
 * Strategi:
 * - Static data: Longer cache (5-10 menit)
 * - Dynamic data: Shorter cache (1-2 menit)
 * - Auth-required: private directive
 * - Public endpoints: public directive
 *
 * Prinsip yang diterapkan:
 * - SRP: Hanya handle cache headers
 * - Reusability: Factory function untuk different cache settings
 * - Performance: Reduce server load dengan browser caching
 */

import { Request, Response, NextFunction } from 'express';

/**
 * Cache options interface
 */
export interface CacheOptions {
    /**
     * Max age in seconds untuk client cache
     * @default 300 (5 menit)
     */
    maxAge?: number;

    /**
     * Max age in seconds untuk shared cache (CDN, proxy)
     * @default sama dengan maxAge
     */
    sMaxAge?: number;

    /**
     * Apakah response harus di-revalidate setelah expired
     * @default false
     */
    mustRevalidate?: boolean;

    /**
     * Apakah response bersifat private (user-specific)
     * @default true (untuk security, default private)
     */
    isPrivate?: boolean;

    /**
     * Disable caching completely
     * @default false
     */
    noCache?: boolean;

    /**
     * Disable storing in any cache
     * @default false
     */
    noStore?: boolean;
}

/**
 * Factory function untuk membuat cache middleware dengan options
 *
 * @param options - Cache configuration options
 * @returns Express middleware function
 *
 * @example
 * // Cache private selama 5 menit
 * router.get('/lansia', cacheControl({ maxAge: 300 }), getLansia);
 *
 * // Cache private selama 2 menit dengan revalidation
 * router.get('/dashboard/stats', cacheControl({ maxAge: 120, mustRevalidate: true }), getStats);
 *
 * // No cache untuk sensitive data
 * router.get('/profile', cacheControl({ noCache: true }), getProfile);
 */
export function cacheControl(options: CacheOptions = {}) {
    const {
        maxAge = 300,
        sMaxAge,
        mustRevalidate = false,
        isPrivate = true,
        noCache = false,
        noStore = false,
    } = options;

    return (_req: Request, res: Response, next: NextFunction): void => {
        // Build cache control directives
        const directives: string[] = [];

        if (noStore) {
            // Completely disable caching
            directives.push('no-store');
        } else if (noCache) {
            // Allow caching but require revalidation
            directives.push('no-cache');
        } else {
            // Normal caching with max-age
            directives.push(isPrivate ? 'private' : 'public');
            directives.push(`max-age=${maxAge}`);

            if (sMaxAge !== undefined) {
                directives.push(`s-maxage=${sMaxAge}`);
            }

            if (mustRevalidate) {
                directives.push('must-revalidate');
            }
        }

        // Set Cache-Control header
        res.setHeader('Cache-Control', directives.join(', '));

        next();
    };
}

/**
 * Pre-configured cache middleware untuk common use cases
 */

/**
 * No caching - untuk data yang selalu fresh
 */
export const noCache = cacheControl({ noCache: true });

/**
 * No store - untuk data sensitif
 */
export const noStore = cacheControl({ noStore: true });

/**
 * Short cache (1 menit) - untuk data yang sering berubah
 */
export const shortCache = cacheControl({ maxAge: 60 });

/**
 * Medium cache (5 menit) - untuk data yang jarang berubah
 */
export const mediumCache = cacheControl({ maxAge: 300 });

/**
 * Long cache (10 menit) - untuk data yang sangat jarang berubah
 */
export const longCache = cacheControl({ maxAge: 600 });

/**
 * Dashboard cache (2 menit) - untuk statistik dashboard
 */
export const dashboardCache = cacheControl({ maxAge: 120, mustRevalidate: true });

/**
 * List cache (5 menit) - untuk daftar data
 */
export const listCache = cacheControl({ maxAge: 300 });

/**
 * Detail cache (10 menit) - untuk detail data individual
 */
export const detailCache = cacheControl({ maxAge: 600 });
