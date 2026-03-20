import { randomUUID } from "node:crypto";
import path from "node:path";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import { pinoHttp } from "pino-http";
import swaggerUi from "swagger-ui-express";
import { swaggerSpec } from "./config/swagger.js";
import { logger } from "./config/logger.js";
import { errorHandler } from "./middlewares/errorHandler.js";
import { globalLimiter } from "./middlewares/rateLimiter.js";
import v1Routes from "./routes/v1/index.js";
import v2Routes from "./routes/v2/index.js";

const app = express();

// Middleware
app.use(helmet());
app.use(cors());
app.use(
  pinoHttp({
    logger,
    genReqId: (req) => (req.headers["x-request-id"] as string) || randomUUID(),
    customProps: (req) => ({ traceId: req.id }),
  }),
);
app.use(globalLimiter);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Static file serving for uploads
app.use("/uploads", express.static(path.resolve(process.cwd(), "uploads")));

// Swagger docs
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// API routes
app.use("/api/v1", v1Routes);
app.use("/api/v2", v2Routes);

// Error handler
app.use(errorHandler);

export default app;
