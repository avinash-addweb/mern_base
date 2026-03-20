import dotenv from "dotenv";
import { z } from "zod";

dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  PORT: z.coerce.number().default(4100),
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
  DATABASE_PROVIDER: z.enum(["postgresql", "mysql"]).default("postgresql"),
  MONGODB_URI: z.string().default("mongodb://localhost:27018/base_mern"),
  JWT_SECRET: z.string().min(1, "JWT_SECRET is required"),
  JWT_EXPIRES_IN: z.string().default("7d"),
  JWT_ACCESS_EXPIRES_IN: z.string().default("15m"),
  JWT_REFRESH_EXPIRES_IN: z.string().default("7d"),
  SEQ_URL: z.string().url().optional(),
  SEQ_API_KEY: z.string().optional(),
  SERVICE_NAME: z.string().default("base-mern-api"),
  REDIS_URL: z.string().default("redis://localhost:6380"),
  ELASTICSEARCH_URL: z.string().default("http://localhost:9201"),
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.coerce.number().optional(),
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),
  SMTP_FROM: z.string().default("noreply@base-mern.dev"),
  MAX_FILE_SIZE: z.coerce.number().default(10485760),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error("Invalid environment variables:", parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const env = parsed.data;
