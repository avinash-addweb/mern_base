import { randomUUID } from "node:crypto";
import path from "node:path";
import multer from "multer";
import { env } from "../../config/env.js";

const uploadDir = path.resolve(process.cwd(), "uploads");

const ALLOWED_MIMETYPES = [
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "text/plain",
  "text/csv",
];

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, uploadDir);
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${Date.now()}-${randomUUID()}${ext}`);
  },
});

function fileFilter(
  _req: Express.Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback,
) {
  if (ALLOWED_MIMETYPES.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(`File type ${file.mimetype} is not allowed`));
  }
}

export const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: env.MAX_FILE_SIZE },
});
