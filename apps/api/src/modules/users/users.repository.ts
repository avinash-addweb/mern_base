import { prisma } from "../../config/prisma.js";
import type { PaginationQuery } from "@base-mern/types";
import { paginate } from "../../utils/paginate.js";

const userSelect = {
  id: true,
  email: true,
  name: true,
  role: true,
  createdAt: true,
  updatedAt: true,
} as const;

export const usersRepository = {
  async findAll(query: PaginationQuery) {
    return paginate(prisma.user, query, { select: userSelect });
  },

  async findById(id: string) {
    return prisma.user.findUnique({ where: { id }, select: userSelect });
  },

  async update(id: string, data: { name?: string; email?: string }) {
    return prisma.user.update({ where: { id }, data, select: userSelect });
  },

  async changeRole(id: string, role: "USER" | "ADMIN") {
    return prisma.user.update({ where: { id }, data: { role }, select: userSelect });
  },

  async delete(id: string) {
    return prisma.user.delete({ where: { id }, select: userSelect });
  },

  async emailExists(email: string, excludeId?: string) {
    const user = await prisma.user.findUnique({ where: { email }, select: { id: true } });
    if (!user) return false;
    if (excludeId && user.id === excludeId) return false;
    return true;
  },

  async count() {
    return prisma.user.count();
  },
};
