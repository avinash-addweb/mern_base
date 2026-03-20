import { Request, Response, NextFunction } from "express";
import { UserRole } from "@base-mern/types";
import { AppError } from "./errorHandler.js";

export function authorize(...roles: UserRole[]) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new AppError("Authentication required", 401, "AUTH_REQUIRED"));
    }
    if (!roles.includes(req.user.role)) {
      return next(new AppError("Insufficient permissions", 403, "FORBIDDEN"));
    }
    next();
  };
}
