import { Request, Response, NextFunction } from "express";
import { ZodSchema, ZodError } from "zod";
import { AppError } from "./errorHandler.js";

export function validate(schema: ZodSchema) {
  return (req: Request, _res: Response, next: NextFunction) => {
    try {
      schema.parse({ body: req.body, query: req.query, params: req.params });
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const details: Record<string, string[]> = {};
        for (const issue of error.issues) {
          const path = issue.path.slice(1).join(".") || issue.path[0]?.toString() || "unknown";
          if (!details[path]) details[path] = [];
          details[path].push(issue.message);
        }
        next(new AppError("Validation failed", 400, "VALIDATION_ERROR", details));
      } else {
        next(error);
      }
    }
  };
}
