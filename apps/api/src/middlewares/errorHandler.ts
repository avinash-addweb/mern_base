import { Request, Response, NextFunction } from "express";
import { env } from "../config/env.js";
import { logger } from "../config/logger.js";

export class AppError extends Error {
  public statusCode: number;
  public errorCode: string;
  public details?: Record<string, string[]>;

  constructor(
    message: string,
    statusCode: number,
    errorCode?: string,
    details?: Record<string, string[]>,
  ) {
    super(message);
    this.statusCode = statusCode;
    this.errorCode = errorCode || "UNKNOWN_ERROR";
    this.details = details;
    Object.setPrototypeOf(this, AppError.prototype);
  }
}

export function errorHandler(err: Error, _req: Request, res: Response, _next: NextFunction): void {
  if (err instanceof AppError) {
    const logData = {
      err,
      errorCode: err.errorCode,
      errorType: "AppError",
      component: "errorHandler",
      statusCode: err.statusCode,
    };
    if (err.statusCode >= 500) {
      logger.error(logData, err.message);
    } else {
      logger.warn(logData, err.message);
    }

    const response: Record<string, unknown> = {
      success: false,
      message: err.message,
      errorCode: err.errorCode,
    };
    if (err.details) {
      response.details = err.details;
    }
    if (env.NODE_ENV !== "production") {
      response.stack = err.stack;
    }
    res.status(err.statusCode).json(response);
    return;
  }

  logger.error(
    { err, errorCode: "INTERNAL_ERROR", errorType: "UnhandledError", component: "errorHandler" },
    "Unhandled error",
  );

  const response: Record<string, unknown> = {
    success: false,
    message: "Internal server error",
    errorCode: "INTERNAL_ERROR",
  };
  if (env.NODE_ENV !== "production") {
    response.stack = err.stack;
  }
  res.status(500).json(response);
}
