import pino from "pino";
import type { TransportTargetOptions } from "pino";
import { env } from "./env.js";

const targets: TransportTargetOptions[] = [];

// Console transport
if (env.NODE_ENV === "development") {
  targets.push({
    target: "pino-pretty",
    options: { colorize: true },
    level: "info",
  });
} else if (env.NODE_ENV === "production") {
  targets.push({
    target: "pino/file",
    options: { destination: 1 },
    level: "info",
  });
}

// Seq transport (optional)
if (env.SEQ_URL) {
  targets.push({
    target: "pino-seq",
    options: {
      serverUrl: env.SEQ_URL,
      apiKey: env.SEQ_API_KEY,
    },
    level: "info",
  });
}

export const logger = pino({
  level: env.NODE_ENV === "test" ? "silent" : "info",
  timestamp: pino.stdTimeFunctions.isoTime,
  base: {
    service: env.SERVICE_NAME,
    environment: env.NODE_ENV,
  },
  ...(targets.length > 0 ? { transport: { targets } } : {}),
});
