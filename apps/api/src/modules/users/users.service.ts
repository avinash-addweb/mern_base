import type { PaginationQuery } from "@base-mern/types";
import { AppError } from "../../middlewares/errorHandler.js";
import { usersRepository } from "./users.repository.js";
import { auditService } from "../audit/audit.service.js";
import { indexDocument, deleteDocument } from "../../services/elasticsearch.service.js";

export const usersService = {
  async getAll(query: PaginationQuery) {
    return usersRepository.findAll(query);
  },

  async getById(id: string) {
    const user = await usersRepository.findById(id);
    if (!user) {
      throw new AppError("User not found", 404, "USER_NOT_FOUND");
    }
    return user;
  },

  async update(
    id: string,
    data: { name?: string; email?: string },
    actor?: { id: string; email: string },
  ) {
    const user = await usersRepository.findById(id);
    if (!user) {
      throw new AppError("User not found", 404, "USER_NOT_FOUND");
    }

    if (data.email && data.email !== user.email) {
      const exists = await usersRepository.emailExists(data.email, id);
      if (exists) {
        throw new AppError("Email already in use", 409, "EMAIL_IN_USE");
      }
    }

    const updated = await usersRepository.update(id, data);

    indexDocument("users", id, {
      name: updated.name,
      email: updated.email,
      role: updated.role,
    }).catch(() => {});

    if (actor) {
      auditService
        .logAction({
          userId: actor.id,
          userEmail: actor.email,
          action: "USER_UPDATED",
          resource: "user",
          resourceId: id,
          details: { changes: data },
        })
        .catch(() => {});
    }

    return updated;
  },

  async changeRole(id: string, role: "USER" | "ADMIN", actor?: { id: string; email: string }) {
    const user = await usersRepository.findById(id);
    if (!user) {
      throw new AppError("User not found", 404, "USER_NOT_FOUND");
    }

    const updated = await usersRepository.changeRole(id, role);

    indexDocument("users", id, {
      name: updated.name,
      email: updated.email,
      role: updated.role,
    }).catch(() => {});

    if (actor) {
      auditService
        .logAction({
          userId: actor.id,
          userEmail: actor.email,
          action: "ROLE_CHANGED",
          resource: "user",
          resourceId: id,
          details: { oldRole: user.role, newRole: role },
        })
        .catch(() => {});
    }

    return updated;
  },

  async delete(id: string, actorId: string, actor?: { id: string; email: string }) {
    if (id === actorId) {
      throw new AppError("Cannot delete your own account", 400, "SELF_DELETE_NOT_ALLOWED");
    }

    const user = await usersRepository.findById(id);
    if (!user) {
      throw new AppError("User not found", 404, "USER_NOT_FOUND");
    }

    const deleted = await usersRepository.delete(id);

    deleteDocument("users", id).catch(() => {});

    if (actor) {
      auditService
        .logAction({
          userId: actor.id,
          userEmail: actor.email,
          action: "USER_DELETED",
          resource: "user",
          resourceId: id,
          details: { deletedUser: { email: user.email, name: user.name } },
        })
        .catch(() => {});
    }

    return deleted;
  },
};
