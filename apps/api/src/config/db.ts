import mongoose from "mongoose";
import { env } from "./env.js";
import { logger } from "./logger.js";

export async function connectMongoDB(): Promise<void> {
  try {
    await mongoose.connect(env.MONGODB_URI);
    logger.info("MongoDB connected successfully");
  } catch (error) {
    logger.fatal(error, "MongoDB connection error");
    process.exit(1);
  }
}
