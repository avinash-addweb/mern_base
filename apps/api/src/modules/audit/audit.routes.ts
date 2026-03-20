import { Router } from "express";
import { UserRole } from "@base-mern/types";
import { getAuditLogs } from "./audit.controller.js";
import { authMiddleware } from "../../middlewares/auth.js";
import { authorize } from "../../middlewares/authorize.js";
import { validate } from "../../middlewares/validate.js";
import { auditLogQuerySchema } from "./audit.schemas.js";

const router = Router();

/**
 * @swagger
 * /audit-logs:
 *   get:
 *     summary: Get audit logs (admin only)
 *     tags: [Audit]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *       - in: query
 *         name: action
 *         schema:
 *           type: string
 *       - in: query
 *         name: resource
 *         schema:
 *           type: string
 *       - in: query
 *         name: userId
 *         schema:
 *           type: string
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *     responses:
 *       200:
 *         description: Paginated audit logs
 */
router.get(
  "/",
  authMiddleware,
  authorize(UserRole.ADMIN),
  validate(auditLogQuerySchema),
  getAuditLogs,
);

export default router;
