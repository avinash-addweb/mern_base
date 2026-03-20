import { z } from "zod";

export const auditLogQuerySchema = z.object({
  query: z.object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
    action: z.string().optional(),
    resource: z.string().optional(),
    userId: z.string().optional(),
    startDate: z.string().optional(),
    endDate: z.string().optional(),
  }),
});
