import fs from "node:fs/promises";
import path from "node:path";
import { AppError } from "../../middlewares/errorHandler.js";
import { uploadsRepository } from "./uploads.repository.js";
import { auditService } from "../audit/audit.service.js";

const uploadDir = path.resolve(process.cwd(), "uploads");

export const uploadsService = {
  async uploadSingle(file: Express.Multer.File, userId: string, userEmail: string) {
    const upload = await uploadsRepository.create({
      filename: file.filename,
      originalName: file.originalname,
      mimetype: file.mimetype,
      size: file.size,
      path: `/uploads/${file.filename}`,
      uploadedBy: userId,
    });

    auditService
      .logAction({
        userId,
        userEmail,
        action: "FILE_UPLOADED",
        resource: "upload",
        resourceId: upload.id,
        details: { filename: file.originalname, mimetype: file.mimetype, size: file.size },
      })
      .catch(() => {});

    return upload;
  },

  async uploadMultiple(files: Express.Multer.File[], userId: string, userEmail: string) {
    const uploads = await Promise.all(
      files.map((file) => this.uploadSingle(file, userId, userEmail)),
    );
    return uploads;
  },

  async getById(id: string) {
    const upload = await uploadsRepository.findById(id);
    if (!upload) {
      throw new AppError("Upload not found", 404, "UPLOAD_NOT_FOUND");
    }
    return upload;
  },

  async delete(id: string, actor?: { id: string; email: string }) {
    const upload = await uploadsRepository.findById(id);
    if (!upload) {
      throw new AppError("Upload not found", 404, "UPLOAD_NOT_FOUND");
    }

    // Delete file from disk
    const filePath = path.join(uploadDir, upload.filename);
    await fs.unlink(filePath).catch(() => {});

    const deleted = await uploadsRepository.delete(id);

    if (actor) {
      auditService
        .logAction({
          userId: actor.id,
          userEmail: actor.email,
          action: "FILE_DELETED",
          resource: "upload",
          resourceId: id,
          details: { filename: upload.originalName },
        })
        .catch(() => {});
    }

    return deleted;
  },
};
