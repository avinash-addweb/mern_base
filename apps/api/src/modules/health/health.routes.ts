import { Router, Request, Response } from "express";
import mongoose from "mongoose";
import { prisma } from "../../config/prisma.js";
import { getRedisClient } from "../../config/redis.js";
import { getElasticsearchClient } from "../../config/elasticsearch.js";

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
 *                     redis:
 *                       type: string
 *                     elasticsearch:
 *                       type: string
 *                     uptime:
 *                       type: number
 */
router.get("/", async (_req: Request, res: Response) => {
  let mongoStatus = "disconnected";
  let postgresStatus = "disconnected";
  let redisStatus = "disconnected";
  let elasticsearchStatus = "disconnected";

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

  try {
    const redis = getRedisClient();
    const pong = await redis.ping();
    if (pong === "PONG") {
      redisStatus = "connected";
    }
  } catch {
    redisStatus = "error";
  }

  try {
    const es = getElasticsearchClient();
    await es.ping();
    elasticsearchStatus = "connected";
  } catch {
    elasticsearchStatus = "error";
  }

  res.json({
    success: true,
    data: {
      status: "ok",
      mongodb: mongoStatus,
      postgres: postgresStatus,
      redis: redisStatus,
      elasticsearch: elasticsearchStatus,
      uptime: process.uptime(),
    },
  });
});

export default router;
