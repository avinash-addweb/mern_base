import "./helpers/test-setup";
import supertest from "supertest";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import app from "../src/app";
import { prismaMock } from "./helpers/test-setup";

const request = supertest(app);
const SECRET = process.env.JWT_SECRET || "test-secret";

function createMockUser(overrides = {}) {
  return {
    id: "test-user-id",
    email: "test@example.com",
    name: "Test User",
    role: "USER",
    createdAt: new Date("2025-01-01"),
    updatedAt: new Date("2025-01-01"),
    password: "",
    resetToken: null,
    resetTokenExp: null,
    ...overrides,
  };
}

describe("Auth Module", () => {
  describe("POST /api/v1/auth/register", () => {
    it("should register a new user", async () => {
      const mockUser = createMockUser();
      prismaMock.user.findUnique.mockResolvedValue(null);
      prismaMock.user.create.mockResolvedValue(mockUser as never);
      prismaMock.refreshToken.create.mockResolvedValue({} as never);

      const res = await request
        .post("/api/v1/auth/register")
        .send({ name: "Test User", email: "test@example.com", password: "password123" });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.user.email).toBe("test@example.com");
      expect(res.body.data.accessToken).toBeDefined();
      expect(res.body.data.refreshToken).toBeDefined();
    });

    it("should return 409 for duplicate email", async () => {
      prismaMock.user.findUnique.mockResolvedValue({ id: "existing" } as never);

      const res = await request
        .post("/api/v1/auth/register")
        .send({ name: "Test", email: "existing@example.com", password: "password123" });

      expect(res.status).toBe(409);
      expect(res.body.errorCode).toBe("AUTH_EMAIL_EXISTS");
    });
  });

  describe("POST /api/v1/auth/login", () => {
    it("should login with valid credentials", async () => {
      const hashedPassword = await bcrypt.hash("password123", 12);
      const dbUser = createMockUser({ password: hashedPassword });
      prismaMock.user.findUnique.mockResolvedValue(dbUser as never);
      prismaMock.refreshToken.create.mockResolvedValue({} as never);

      const res = await request
        .post("/api/v1/auth/login")
        .send({ email: "test@example.com", password: "password123" });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.accessToken).toBeDefined();
      expect(res.body.data.refreshToken).toBeDefined();
    });

    it("should return 401 for wrong password", async () => {
      const hashedPassword = await bcrypt.hash("correct-password", 12);
      const dbUser = createMockUser({ password: hashedPassword });
      prismaMock.user.findUnique.mockResolvedValue(dbUser as never);

      const res = await request
        .post("/api/v1/auth/login")
        .send({ email: "test@example.com", password: "wrong-password" });

      expect(res.status).toBe(401);
      expect(res.body.errorCode).toBe("AUTH_INVALID_CREDENTIALS");
    });
  });

  describe("GET /api/v1/auth/me", () => {
    it("should return current user with valid token", async () => {
      const mockUser = createMockUser();
      const token = jwt.sign({ userId: mockUser.id }, SECRET, { expiresIn: "1h" });
      prismaMock.user.findUnique.mockResolvedValue(mockUser as never);

      const res = await request.get("/api/v1/auth/me").set("Authorization", `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.data.user.email).toBe(mockUser.email);
    });

    it("should return 401 with no token", async () => {
      const res = await request.get("/api/v1/auth/me");

      expect(res.status).toBe(401);
      expect(res.body.errorCode).toBe("AUTH_NO_TOKEN");
    });

    it("should return 401 with invalid token", async () => {
      const res = await request.get("/api/v1/auth/me").set("Authorization", "Bearer invalid-token");

      expect(res.status).toBe(401);
    });
  });
});
