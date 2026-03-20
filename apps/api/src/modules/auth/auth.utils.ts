import crypto from "node:crypto";
import jwt from "jsonwebtoken";
import { env } from "../../config/env.js";

interface TokenPayload {
  userId: string;
}

export function generateToken(userId: string): string {
  return jwt.sign({ userId }, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRES_IN as unknown as jwt.SignOptions["expiresIn"],
  });
}

export function generateAccessToken(userId: string): string {
  return jwt.sign({ userId }, env.JWT_SECRET, {
    expiresIn: env.JWT_ACCESS_EXPIRES_IN as unknown as jwt.SignOptions["expiresIn"],
  });
}

export function generateRefreshToken(): string {
  return crypto.randomBytes(40).toString("hex");
}

export function hashToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}

export function verifyToken(token: string): TokenPayload {
  return jwt.verify(token, env.JWT_SECRET) as TokenPayload;
}
