import { Router, Request, Response } from "express";
import mongoose from "mongoose";
import { prisma } from "../../config/prisma.js";

const router = Router();

/**
 * @swagger
 * /health:
 *   get:
 *     summary: Health check endpoint
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: Service is healthy
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     status:
 *                       type: string
 *                     mongodb:
 *                       type: string
 *                     postgres:
 *                       type: string
 *                     uptime:
 *                       type: number
 */
router.get("/", async (_req: Request, res: Response) => {
  let mongoStatus = "disconnected";
  let postgresStatus = "disconnected";

  try {
    if (mongoose.connection.readyState === 1) {
      mongoStatus = "connected";
    }
  } catch {
    mongoStatus = "error";
  }

  try {
    await prisma.$queryRaw`SELECT 1`;
    postgresStatus = "connected";
  } catch {
    postgresStatus = "error";
  }

  res.json({
    success: true,
    data: {
      status: "ok",
      mongodb: mongoStatus,
      postgres: postgresStatus,
      uptime: process.uptime(),
    },
  });
});

export default router;
