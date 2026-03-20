import "./helpers/test-setup";
import supertest from "supertest";
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
    password: "hashed",
    resetToken: null,
    resetTokenExp: null,
    ...overrides,
  };
}

function createMockAdmin(overrides = {}) {
  return createMockUser({
    id: "test-admin-id",
    email: "admin@example.com",
    name: "Admin User",
    role: "ADMIN",
    ...overrides,
  });
}

function makeToken(userId: string) {
  return jwt.sign({ userId }, SECRET, { expiresIn: "1h" });
}

describe("Users Module", () => {
  describe("GET /api/v1/users", () => {
    it("should return paginated users for admin", async () => {
      const admin = createMockAdmin();
      const token = makeToken(admin.id);
      const users = [createMockUser(), createMockAdmin()];

      prismaMock.user.findUnique.mockResolvedValue(admin as never);
      prismaMock.user.findMany.mockResolvedValue(users as never);
      prismaMock.user.count.mockResolvedValue(2);

      const res = await request
        .get("/api/v1/users?page=1&limit=10")
        .set("Authorization", `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveLength(2);
      expect(res.body.pagination).toBeDefined();
    });

    it("should return 403 for non-admin", async () => {
      const user = createMockUser();
      const token = makeToken(user.id);

      prismaMock.user.findUnique.mockResolvedValue(user as never);

      const res = await request.get("/api/v1/users").set("Authorization", `Bearer ${token}`);

      expect(res.status).toBe(403);
      expect(res.body.errorCode).toBe("FORBIDDEN");
    });

    it("should return 401 for unauthenticated", async () => {
      const res = await request.get("/api/v1/users");
      expect(res.status).toBe(401);
    });
  });

  describe("DELETE /api/v1/users/:id", () => {
    it("should prevent self-delete", async () => {
      const admin = createMockAdmin();
      const token = makeToken(admin.id);

      prismaMock.user.findUnique.mockResolvedValue(admin as never);

      const res = await request
        .delete(`/api/v1/users/${admin.id}`)
        .set("Authorization", `Bearer ${token}`);

      expect(res.status).toBe(400);
      expect(res.body.errorCode).toBe("SELF_DELETE_NOT_ALLOWED");
    });
  });

  describe("PATCH /api/v1/users/:id/role", () => {
    it("should change user role for admin", async () => {
      const admin = createMockAdmin();
      const token = makeToken(admin.id);
      const targetUser = createMockUser({ id: "target-id" });
      const updatedUser = { ...targetUser, role: "ADMIN" };

      prismaMock.user.findUnique
        .mockResolvedValueOnce(admin as never)
        .mockResolvedValueOnce(targetUser as never);
      prismaMock.user.update.mockResolvedValue(updatedUser as never);

      const res = await request
        .patch("/api/v1/users/target-id/role")
        .set("Authorization", `Bearer ${token}`)
        .send({ role: "ADMIN" });

      expect(res.status).toBe(200);
      expect(res.body.data.role).toBe("ADMIN");
    });
  });
});
