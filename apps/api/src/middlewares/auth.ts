import { Request, Response, NextFunction } from "express";
import { verifyToken } from "../modules/auth/auth.utils.js";
import { authService } from "../modules/auth/auth.service.js";
import { AppError } from "./errorHandler.js";

export async function authMiddleware(
  req: Request,
  _res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      throw new AppError("No token provided", 401, "AUTH_NO_TOKEN");
    }

    const token = authHeader.split(" ")[1];
    const payload = verifyToken(token);
    const user = await authService.getUserById(payload.userId);

    req.user = user;
    next();
  } catch (error) {
    if (error instanceof AppError) {
      next(error);
    } else {
      next(new AppError("Invalid token", 401, "AUTH_INVALID_TOKEN"));
    }
  }
}
