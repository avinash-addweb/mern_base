import { Request, Response, NextFunction } from "express";
import { AppError } from "../../middlewares/errorHandler.js";
import { uploadsService } from "./uploads.service.js";

export async function uploadSingle(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.file) {
      throw new AppError("No file provided", 400, "NO_FILE");
    }
    const upload = await uploadsService.uploadSingle(req.file, req.user!.id, req.user!.email);
    res.status(201).json({ success: true, data: upload });
  } catch (error) {
    next(error);
  }
}

export async function uploadMultiple(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const files = req.files as Express.Multer.File[];
    if (!files || files.length === 0) {
      throw new AppError("No files provided", 400, "NO_FILES");
    }
    const uploads = await uploadsService.uploadMultiple(files, req.user!.id, req.user!.email);
    res.status(201).json({ success: true, data: uploads });
  } catch (error) {
    next(error);
  }
}

export async function getUpload(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const upload = await uploadsService.getById(req.params.id as string);
    res.json({ success: true, data: upload });
  } catch (error) {
    next(error);
  }
}

export async function deleteUpload(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const actor = req.user ? { id: req.user.id, email: req.user.email } : undefined;
    const upload = await uploadsService.delete(req.params.id as string, actor);
    res.json({ success: true, data: upload });
  } catch (error) {
    next(error);
  }
}
