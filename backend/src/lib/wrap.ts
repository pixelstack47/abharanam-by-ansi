import type { NextFunction, Request, RequestHandler, Response } from "express";

/**
 * Wraps an async route handler so a rejected promise is forwarded to the
 * central Express error handler (via next) instead of crashing the process.
 *
 * Generic over the request type so handlers can accept AuthedRequest
 * (from ../lib/auth.ts) while the returned handler stays a plain
 * express RequestHandler.
 */
export function wrap<Req extends Request = Request>(
  fn: (req: Req, res: Response, next: NextFunction) => unknown,
): RequestHandler {
  return (req, res, next) => {
    Promise.resolve(fn(req as Req, res, next)).catch(next);
  };
}
