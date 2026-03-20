import { Request } from "express";
import { AuditLog } from "./audit.model.js";

interface LogActionParams {
  userId: string;
  userEmail: string;
  action: string;
  resource: string;
  resourceId?: string;
  details?: Record<string, unknown>;
  req?: Request;
}

export const auditService = {
  async logAction(params: LogActionParams) {
    const { userId, userEmail, action, resource, resourceId, details, req } = params;
    return AuditLog.create({
      userId,
      userEmail,
      action,
      resource,
      resourceId,
      details,
      ipAddress: req?.ip,
      userAgent: req?.headers["user-agent"],
    });
  },

  async getLogs(query: {
    page?: number;
    limit?: number;
    action?: string;
    resource?: string;
    userId?: string;
    startDate?: string;
    endDate?: string;
  }) {
    const { page = 1, limit = 20, action, resource, userId, startDate, endDate } = query;

    const filter: Record<string, unknown> = {};
    if (action) filter.action = action;
    if (resource) filter.resource = resource;
    if (userId) filter.userId = userId;
    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) (filter.createdAt as Record<string, unknown>).$gte = new Date(startDate);
      if (endDate) (filter.createdAt as Record<string, unknown>).$lte = new Date(endDate);
    }

    const [data, total] = await Promise.all([
      AuditLog.find(filter)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      AuditLog.countDocuments(filter),
    ]);

    return {
      data,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  },
};
