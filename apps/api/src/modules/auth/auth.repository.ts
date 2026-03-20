import { prisma } from "../../config/prisma.js";

const userSelect = {
  id: true,
  email: true,
  name: true,
  role: true,
  createdAt: true,
  updatedAt: true,
} as const;

export const authRepository = {
  async findByEmail(email: string) {
    return prisma.user.findUnique({ where: { email } });
  },

  async findById(id: string) {
    return prisma.user.findUnique({
      where: { id },
      select: userSelect,
    });
  },

  async emailExists(email: string) {
    const user = await prisma.user.findUnique({ where: { email }, select: { id: true } });
    return !!user;
  },

  async create(data: { email: string; name: string; password: string }) {
    return prisma.user.create({
      data,
      select: userSelect,
    });
  },

  // Password reset
  async setResetToken(email: string, hashedToken: string, expiresAt: Date) {
    return prisma.user.update({
      where: { email },
      data: { resetToken: hashedToken, resetTokenExp: expiresAt },
      select: userSelect,
    });
  },

  async findByResetToken(hashedToken: string) {
    return prisma.user.findFirst({
      where: {
        resetToken: hashedToken,
        resetTokenExp: { gt: new Date() },
      },
    });
  },

  async clearResetToken(id: string) {
    return prisma.user.update({
      where: { id },
      data: { resetToken: null, resetTokenExp: null },
      select: userSelect,
    });
  },

  async updatePassword(id: string, password: string) {
    return prisma.user.update({
      where: { id },
      data: { password, resetToken: null, resetTokenExp: null },
      select: userSelect,
    });
  },

  // Refresh tokens
  async createRefreshToken(data: { token: string; userId: string; expiresAt: Date }) {
    return prisma.refreshToken.create({ data });
  },

  async findRefreshToken(hashedToken: string) {
    return prisma.refreshToken.findUnique({
      where: { token: hashedToken },
      include: { user: { select: userSelect } },
    });
  },

  async revokeRefreshToken(id: string) {
    return prisma.refreshToken.update({
      where: { id },
      data: { revoked: true },
    });
  },

  async revokeAllUserTokens(userId: string) {
    return prisma.refreshToken.updateMany({
      where: { userId, revoked: false },
      data: { revoked: true },
    });
  },
};
