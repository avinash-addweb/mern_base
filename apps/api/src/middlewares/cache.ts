import { Request, Response, NextFunction } from "express";
import { cacheGet, cacheSet } from "../services/cache.service.js";

export function cacheMiddleware(ttlSeconds = 60) {
  return async (req: Request, res: Response, next: NextFunction) => {
    if (req.method !== "GET") {
      return next();
    }

    const key = `cache:${req.originalUrl}`;

    try {
      const cached = await cacheGet<{ body: unknown; statusCode: number }>(key);
      if (cached) {
        res.status(cached.statusCode).json(cached.body);
        return;
      }
    } catch {
      // Cache miss or error — proceed normally
    }

    const originalJson = res.json.bind(res);
    res.json = function (body: unknown) {
      cacheSet(key, { body, statusCode: res.statusCode }, ttlSeconds).catch(() => {});
      return originalJson(body);
    };

    next();
  };
}
