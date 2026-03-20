import { Request, Response, NextFunction } from "express";
import { authService } from "./auth.service.js";

export async function register(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const result = await authService.registerUser(req.body);
    res.status(201).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
}

export async function login(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const result = await authService.loginUser(req.body);
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
}

export async function getMe(req: Request, res: Response): Promise<void> {
  res.json({ success: true, data: { user: req.user } });
}

export async function forgotPassword(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    await authService.forgotPassword(req.body.email);
    res.json({
      success: true,
      data: { message: "If an account exists, a reset email has been sent" },
    });
  } catch (error) {
    next(error);
  }
}

export async function resetPassword(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    await authService.resetPassword(req.body.token, req.body.password);
    res.json({ success: true, data: { message: "Password has been reset successfully" } });
  } catch (error) {
    next(error);
  }
}

export async function refreshToken(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const result = await authService.refreshTokens(req.body.refreshToken);
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
}

export async function logout(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    await authService.logout(req.body.refreshToken);
    res.json({ success: true, data: { message: "Logged out successfully" } });
  } catch (error) {
    next(error);
  }
}
