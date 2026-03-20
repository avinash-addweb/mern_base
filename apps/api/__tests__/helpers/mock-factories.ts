import type { IUser } from "@base-mern/types";
import { UserRole } from "@base-mern/types";
import jwt from "jsonwebtoken";

export function createMockUser(overrides: Partial<IUser> = {}): IUser {
  return {
    id: "test-user-id",
    email: "test@example.com",
    name: "Test User",
    role: UserRole.USER,
    createdAt: new Date("2025-01-01"),
    updatedAt: new Date("2025-01-01"),
    ...overrides,
  };
}

export function createMockAdmin(overrides: Partial<IUser> = {}): IUser {
  return createMockUser({
    id: "test-admin-id",
    email: "admin@example.com",
    name: "Admin User",
    role: UserRole.ADMIN,
    ...overrides,
  });
}

export function createMockToken(userId = "test-user-id"): string {
  return jwt.sign({ userId }, process.env.JWT_SECRET || "test-secret", { expiresIn: "1h" });
}

export function createMockAdminToken(): string {
  return createMockToken("test-admin-id");
}
