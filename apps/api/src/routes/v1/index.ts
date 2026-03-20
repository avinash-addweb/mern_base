import { Router } from "express";
import healthRoutes from "../../modules/health/health.routes.js";
import authRoutes from "../../modules/auth/auth.routes.js";
import usersRoutes from "../../modules/users/users.routes.js";
import uploadsRoutes from "../../modules/uploads/uploads.routes.js";
import auditRoutes from "../../modules/audit/audit.routes.js";
import searchRoutes from "../../modules/search/search.routes.js";

const router = Router();

router.use("/health", healthRoutes);
router.use("/auth", authRoutes);
router.use("/users", usersRoutes);
router.use("/uploads", uploadsRoutes);
router.use("/audit-logs", auditRoutes);
router.use("/search", searchRoutes);

export default router;
