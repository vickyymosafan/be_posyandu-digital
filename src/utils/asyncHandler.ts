/* eslint-disable prettier/prettier */
/**
 * Async Handler Utility
 *
 * Wrapper untuk async Express route handlers.
 * Menangkap rejected promises dan meneruskannya ke error handler middleware.
 *
 * Tanpa wrapper ini, unhandled promise rejections tidak akan tertangkap
 * oleh Express error handler, yang dapat menyebabkan aplikasi crash.
 */

import { Request, Response, NextFunction, RequestHandler } from 'express';

/**
 * Type untuk async request handler
 */
type AsyncRequestHandler = (
  req: Request,
  res: Response,
  next: NextFunction
) => Promise<void> | Promise<unknown>;

/**
 * Async Handler Wrapper
 *
 * Membungkus async route handler dan menangkap rejected promises.
 *
 * @param fn - Async route handler function
 * @returns Express RequestHandler yang menangkap errors
 *
 * @example
 * // Tanpa asyncHandler (akan error di TypeScript)
 * router.get('/users', async (req, res) => {
 *   const users = await getUsers();
 *   res.json(users);
 * });
 *
 * // Dengan asyncHandler
 * router.get('/users', asyncHandler(async (req, res) => {
 *   const users = await getUsers();
 *   res.json(users);
 * }));
 */
export const asyncHandler = (fn: AsyncRequestHandler): RequestHandler => {
  return (req: Request, res: Response, next: NextFunction): void => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};
