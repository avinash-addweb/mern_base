import { Request, Response, NextFunction } from "express";
import { auditService } from "./audit.service.js";

export async function getAuditLogs(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const result = await auditService.getLogs(req.query as never);
    res.json({ success: true, ...result });
  } catch (error) {
    next(error);
  }
}
