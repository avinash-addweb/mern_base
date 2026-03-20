import { prisma } from "../../config/prisma.js";

const uploadSelect = {
  id: true,
  filename: true,
  originalName: true,
  mimetype: true,
  size: true,
  path: true,
  uploadedBy: true,
  createdAt: true,
} as const;

export const uploadsRepository = {
  async create(data: {
    filename: string;
    originalName: string;
    mimetype: string;
    size: number;
    path: string;
    uploadedBy: string;
  }) {
    return prisma.upload.create({ data, select: uploadSelect });
  },

  async findById(id: string) {
    return prisma.upload.findUnique({ where: { id }, select: uploadSelect });
  },

  async delete(id: string) {
    return prisma.upload.delete({ where: { id }, select: uploadSelect });
  },
};
