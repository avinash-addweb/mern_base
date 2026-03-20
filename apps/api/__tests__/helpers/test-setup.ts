import { mockDeep, mockReset } from "jest-mock-extended";
import type { PrismaClient } from "@prisma/client";

// Mock Prisma
export const prismaMock = mockDeep<PrismaClient>();

jest.mock("../../src/config/prisma", () => ({
  prisma: prismaMock,
}));

// Mock Redis
const redisMock = {
  get: jest.fn(),
  set: jest.fn(),
  del: jest.fn(),
  ping: jest.fn().mockResolvedValue("PONG"),
  scan: jest.fn().mockResolvedValue(["0", []]),
};

jest.mock("../../src/config/redis", () => ({
  getRedisClient: () => redisMock,
  connectRedis: jest.fn(),
  disconnectRedis: jest.fn(),
}));

// Mock Elasticsearch
const esMock = {
  ping: jest.fn(),
  index: jest.fn(),
  search: jest.fn(),
  delete: jest.fn(),
  indices: { exists: jest.fn(), create: jest.fn() },
};

jest.mock("../../src/config/elasticsearch", () => ({
  getElasticsearchClient: () => esMock,
  connectElasticsearch: jest.fn(),
  disconnectElasticsearch: jest.fn(),
}));

// Mock email
jest.mock("../../src/services/email.service", () => ({
  initializeEmailTransport: jest.fn(),
  sendEmail: jest.fn(),
}));

// Mock audit service
jest.mock("../../src/modules/audit/audit.service", () => ({
  auditService: {
    logAction: jest.fn().mockResolvedValue(undefined),
  },
}));

// Mock ES service
jest.mock("../../src/services/elasticsearch.service", () => ({
  ensureIndex: jest.fn(),
  indexDocument: jest.fn().mockResolvedValue(undefined),
  searchDocuments: jest.fn(),
  deleteDocument: jest.fn().mockResolvedValue(undefined),
}));

// Mock email templates
jest.mock("../../src/services/email.templates", () => ({
  passwordResetTemplate: jest.fn().mockReturnValue({ subject: "Reset", html: "<p>Reset</p>" }),
  welcomeTemplate: jest.fn().mockReturnValue({ subject: "Welcome", html: "<p>Welcome</p>" }),
}));

// Silent logger — must satisfy pino-http expectations
const mockLogger = {
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
  fatal: jest.fn(),
  debug: jest.fn(),
  trace: jest.fn(),
  silent: jest.fn(),
  child: jest.fn().mockReturnThis(),
  level: "silent",
  levels: { values: { fatal: 60, error: 50, warn: 40, info: 30, debug: 20, trace: 10 } },
  isLevelEnabled: jest.fn().mockReturnValue(false),
};

jest.mock("../../src/config/logger", () => ({
  logger: mockLogger,
}));

// Mock pino-http to avoid issues with the mock logger
jest.mock("pino-http", () => ({
  pinoHttp: () => (_req: unknown, _res: unknown, next: () => void) => next(),
}));

beforeEach(() => {
  mockReset(prismaMock);
});

export { redisMock, esMock };
