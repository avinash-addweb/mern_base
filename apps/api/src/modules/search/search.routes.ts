import { Router } from "express";
import { search } from "./search.controller.js";
import { authMiddleware } from "../../middlewares/auth.js";
import { validate } from "../../middlewares/validate.js";
import { searchQuerySchema } from "./search.schemas.js";

const router = Router();

/**
 * @swagger
 * /search:
 *   get:
 *     summary: Full-text search across indices
 *     tags: [Search]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: q
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: index
 *         schema:
 *           type: string
 *           default: users
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *     responses:
 *       200:
 *         description: Search results
 */
router.get("/", authMiddleware, validate(searchQuerySchema), search);

export default router;
