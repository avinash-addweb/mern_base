import { z } from "zod";
import { paginationQuerySchema } from "@base-mern/types";

export const listUsersSchema = z.object({
  query: paginationQuerySchema,
});

export const getUserSchema = z.object({
  params: z.object({
    id: z.string().min(1, "User ID is required"),
  }),
});

export const updateUserSchema = z.object({
  params: z.object({
    id: z.string().min(1, "User ID is required"),
  }),
  body: z.object({
    name: z.string().min(1, "Name is required").max(100).optional(),
    email: z.string().email("Invalid email").optional(),
  }),
});

export const changeRoleSchema = z.object({
  params: z.object({
    id: z.string().min(1, "User ID is required"),
  }),
  body: z.object({
    role: z.enum(["USER", "ADMIN"], { message: "Role must be USER or ADMIN" }),
  }),
});

export const deleteUserSchema = z.object({
  params: z.object({
    id: z.string().min(1, "User ID is required"),
  }),
});
