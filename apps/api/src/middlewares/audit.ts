import { Request, Response, NextFunction } from "express";
import { auditService } from "../modules/audit/audit.service.js";

export function auditAction(action: string, resource: string) {
  return (req: Request, res: Response, next: NextFunction) => {
    res.on("finish", () => {
      if (res.statusCode >= 200 && res.statusCode < 300 && req.user) {
        auditService
          .logAction({
            userId: req.user.id,
            userEmail: req.user.email,
            action,
            resource,
            resourceId: req.params.id as string | undefined,
            req,
          })
          .catch(() => {});
      }
    });
    next();
  };
}
