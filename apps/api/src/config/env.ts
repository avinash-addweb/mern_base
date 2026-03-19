import dotenv from "dotenv";
dotenv.config();

export const env = {
  NODE_ENV: process.env.NODE_ENV || "development",
  PORT: parseInt(process.env.PORT || "4100", 10),
  DATABASE_URL: process.env.DATABASE_URL || "",
  MONGODB_URI: process.env.MONGODB_URI || "mongodb://localhost:27018/base_mern",
  JWT_SECRET: process.env.JWT_SECRET || "default-secret-change-me",
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || "7d",
} as const;
