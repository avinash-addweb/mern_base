import { z } from "zod";

// ─── Enums ──────────────────────────────────────────────────
export enum UserRole {
  USER = "USER",
  ADMIN = "ADMIN",
}

// ─── Interfaces ─────────────────────────────────────────────
export interface IUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  createdAt: Date;
  updatedAt: Date;
}

export interface IUpload {
  id: string;
  filename: string;
  originalName: string;
  mimetype: string;
  size: number;
  path: string;
  uploadedBy: string;
  createdAt: Date;
}

export interface IAuditLog {
  _id: string;
  userId: string;
  userEmail: string;
  action: string;
  resource: string;
  resourceId?: string;
  details?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface AuthTokenPair {
  accessToken: string;
  refreshToken: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

export interface ApiErrorResponse {
  success: false;
  message: string;
  errorCode?: string;
  errors?: Record<string, string[]>;
  details?: Record<string, string[]>;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// ─── Zod Schemas ────────────────────────────────────────────

// Auth
export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

export const registerSchema = z.object({
  name: z.string().min(1, "Name is required").max(100, "Name must be 100 characters or less"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export const forgotPasswordSchema = z.object({
  email: z.string().email("Invalid email address"),
});

export const resetPasswordSchema = z.object({
  token: z.string().min(1, "Token is required"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1, "Refresh token is required"),
});

// Pagination
export const paginationQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
  sortBy: z.string().optional(),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
});

// Users
export const updateUserSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  email: z.string().email().optional(),
});

export const changeRoleSchema = z.object({
  role: z.enum(["USER", "ADMIN"]),
});

// Search
export const searchQuerySchema = z.object({
  q: z.string().min(1),
  index: z.string().default("users"),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
});

// Audit
export const auditLogQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  action: z.string().optional(),
  resource: z.string().optional(),
  userId: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
});

// ─── Inferred Types ─────────────────────────────────────────
export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
export type PaginationQuery = z.infer<typeof paginationQuerySchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
export type ChangeRoleInput = z.infer<typeof changeRoleSchema>;
export type SearchQuery = z.infer<typeof searchQuerySchema>;
export type AuditLogQuery = z.infer<typeof auditLogQuerySchema>;
