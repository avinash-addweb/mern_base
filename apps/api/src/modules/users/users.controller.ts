import { Request, Response, NextFunction } from "express";
import { usersService } from "./users.service.js";

export async function getAllUsers(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const result = await usersService.getAll(req.query as never);
    res.json({ success: true, ...result });
  } catch (error) {
    next(error);
  }
}

export async function getUserById(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const user = await usersService.getById(req.params.id as string);
    res.json({ success: true, data: user });
  } catch (error) {
    next(error);
  }
}

export async function updateUser(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const actor = req.user ? { id: req.user.id, email: req.user.email } : undefined;
    const user = await usersService.update(req.params.id as string, req.body, actor);
    res.json({ success: true, data: user });
  } catch (error) {
    next(error);
  }
}

export async function changeUserRole(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const actor = req.user ? { id: req.user.id, email: req.user.email } : undefined;
    const user = await usersService.changeRole(req.params.id as string, req.body.role, actor);
    res.json({ success: true, data: user });
  } catch (error) {
    next(error);
  }
}

export async function deleteUser(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const actor = req.user ? { id: req.user.id, email: req.user.email } : undefined;
    const user = await usersService.delete(req.params.id as string, req.user!.id, actor);
    res.json({ success: true, data: user });
  } catch (error) {
    next(error);
  }
}
