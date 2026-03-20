import { z } from "zod";
import {
  loginSchema as loginFields,
  registerSchema as registerFields,
  forgotPasswordSchema as forgotPasswordFields,
  resetPasswordSchema as resetPasswordFields,
  refreshTokenSchema as refreshTokenFields,
} from "@base-mern/types";

export const loginSchema = z.object({
  body: loginFields,
});

export const registerSchema = z.object({
  body: registerFields,
});

export const forgotPasswordSchema = z.object({
  body: forgotPasswordFields,
});

export const resetPasswordSchema = z.object({
  body: resetPasswordFields,
});

export const refreshTokenSchema = z.object({
  body: refreshTokenFields,
});
