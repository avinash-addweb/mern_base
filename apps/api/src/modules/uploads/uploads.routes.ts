import { Router } from "express";
import { UserRole } from "@base-mern/types";
import { uploadSingle, uploadMultiple, getUpload, deleteUpload } from "./uploads.controller.js";
import { authMiddleware } from "../../middlewares/auth.js";
import { authorize } from "../../middlewares/authorize.js";
import { validate } from "../../middlewares/validate.js";
import { getUploadSchema, deleteUploadSchema } from "./uploads.schemas.js";
import { upload } from "./uploads.utils.js";

const router = Router();

/**
 * @swagger
 * /uploads:
 *   post:
 *     summary: Upload a single file
 *     tags: [Uploads]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *     responses:
 *       201:
 *         description: File uploaded
 */
router.post("/", authMiddleware, upload.single("file"), uploadSingle);

/**
 * @swagger
 * /uploads/multiple:
 *   post:
 *     summary: Upload multiple files (max 10)
 *     tags: [Uploads]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               files:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *     responses:
 *       201:
 *         description: Files uploaded
 */
router.post("/multiple", authMiddleware, upload.array("files", 10), uploadMultiple);

/**
 * @swagger
 * /uploads/{id}:
 *   get:
 *     summary: Get upload metadata
 *     tags: [Uploads]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Upload metadata
 */
router.get("/:id", authMiddleware, validate(getUploadSchema), getUpload);

/**
 * @swagger
 * /uploads/{id}:
 *   delete:
 *     summary: Delete upload (admin only)
 *     tags: [Uploads]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Upload deleted
 */
router.delete(
  "/:id",
  authMiddleware,
  authorize(UserRole.ADMIN),
  validate(deleteUploadSchema),
  deleteUpload,
);

export default router;
