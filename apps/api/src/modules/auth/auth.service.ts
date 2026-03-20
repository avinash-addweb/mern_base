import crypto from "node:crypto";
import bcrypt from "bcrypt";
import type { IUser } from "@base-mern/types";
import { AppError } from "../../middlewares/errorHandler.js";
import { generateAccessToken, generateRefreshToken, hashToken } from "./auth.utils.js";
import { authRepository } from "./auth.repository.js";
import { sendEmail } from "../../services/email.service.js";
import { passwordResetTemplate } from "../../services/email.templates.js";
import { auditService } from "../audit/audit.service.js";
import { indexDocument } from "../../services/elasticsearch.service.js";
import { env } from "../../config/env.js";

function getRefreshExpiry(): Date {
  const match = env.JWT_REFRESH_EXPIRES_IN.match(/^(\d+)([smhd])$/);
  if (!match) return new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7d default
  const value = parseInt(match[1], 10);
  const unit = match[2];
  const multipliers: Record<string, number> = { s: 1000, m: 60000, h: 3600000, d: 86400000 };
  return new Date(Date.now() + value * (multipliers[unit] || 86400000));
}

export const authService = {
  async registerUser(input: { email: string; name: string; password: string }) {
    const exists = await authRepository.emailExists(input.email);
    if (exists) {
      throw new AppError("Email already registered", 409, "AUTH_EMAIL_EXISTS");
    }

    const hashedPassword = await bcrypt.hash(input.password, 12);
    const user = await authRepository.create({ ...input, password: hashedPassword });
    const accessToken = generateAccessToken(user.id);
    const rawRefreshToken = generateRefreshToken();
    const hashedRefresh = hashToken(rawRefreshToken);

    await authRepository.createRefreshToken({
      token: hashedRefresh,
      userId: user.id,
      expiresAt: getRefreshExpiry(),
    });

    indexDocument("users", user.id, { name: user.name, email: user.email, role: user.role }).catch(
      () => {},
    );

    auditService
      .logAction({
        userId: user.id,
        userEmail: user.email,
        action: "USER_REGISTERED",
        resource: "auth",
      })
      .catch(() => {});

    return { user, accessToken, refreshToken: rawRefreshToken };
  },

  async loginUser(input: { email: string; password: string }) {
    const user = await authRepository.findByEmail(input.email);
    if (!user) {
      throw new AppError("Invalid credentials", 401, "AUTH_INVALID_CREDENTIALS");
    }

    const isPasswordValid = await bcrypt.compare(input.password, user.password);
    if (!isPasswordValid) {
      throw new AppError("Invalid credentials", 401, "AUTH_INVALID_CREDENTIALS");
    }

    const accessToken = generateAccessToken(user.id);
    const rawRefreshToken = generateRefreshToken();
    const hashedRefresh = hashToken(rawRefreshToken);

    await authRepository.createRefreshToken({
      token: hashedRefresh,
      userId: user.id,
      expiresAt: getRefreshExpiry(),
    });

    const { password: _, resetToken: _rt, resetTokenExp: _rte, ...userWithoutPassword } = user;

    auditService
      .logAction({
        userId: user.id,
        userEmail: user.email,
        action: "USER_LOGIN",
        resource: "auth",
      })
      .catch(() => {});

    return { user: userWithoutPassword, accessToken, refreshToken: rawRefreshToken };
  },

  async getUserById(id: string): Promise<IUser> {
    const user = await authRepository.findById(id);
    if (!user) {
      throw new AppError("User not found", 401, "AUTH_USER_NOT_FOUND");
    }
    return user as IUser;
  },

  async forgotPassword(email: string) {
    const user = await authRepository.findByEmail(email);
    // Always return success to prevent email enumeration
    if (!user) return;

    const rawToken = crypto.randomBytes(32).toString("hex");
    const hashedToken = crypto.createHash("sha256").update(rawToken).digest("hex");
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await authRepository.setResetToken(email, hashedToken, expiresAt);

    const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:4200"}/reset-password?token=${rawToken}`;
    const template = passwordResetTemplate(resetUrl);
    await sendEmail(email, template.subject, template.html);
  },

  async resetPassword(token: string, newPassword: string) {
    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");
    const user = await authRepository.findByResetToken(hashedToken);

    if (!user) {
      throw new AppError("Invalid or expired reset token", 400, "INVALID_RESET_TOKEN");
    }

    const hashedPassword = await bcrypt.hash(newPassword, 12);
    await authRepository.updatePassword(user.id, hashedPassword);

    auditService
      .logAction({
        userId: user.id,
        userEmail: user.email,
        action: "PASSWORD_RESET",
        resource: "auth",
      })
      .catch(() => {});
  },

  async refreshTokens(refreshToken: string) {
    const hashedToken = hashToken(refreshToken);
    const stored = await authRepository.findRefreshToken(hashedToken);

    if (!stored || stored.revoked || stored.expiresAt < new Date()) {
      throw new AppError("Invalid or expired refresh token", 401, "INVALID_REFRESH_TOKEN");
    }

    // Revoke old token
    await authRepository.revokeRefreshToken(stored.id);

    // Issue new pair
    const newAccessToken = generateAccessToken(stored.userId);
    const newRawRefreshToken = generateRefreshToken();
    const newHashedRefresh = hashToken(newRawRefreshToken);

    await authRepository.createRefreshToken({
      token: newHashedRefresh,
      userId: stored.userId,
      expiresAt: getRefreshExpiry(),
    });

    return {
      accessToken: newAccessToken,
      refreshToken: newRawRefreshToken,
    };
  },

  async logout(refreshToken: string) {
    const hashedToken = hashToken(refreshToken);
    const stored = await authRepository.findRefreshToken(hashedToken);
    if (stored && !stored.revoked) {
      await authRepository.revokeRefreshToken(stored.id);
    }
  },
};
