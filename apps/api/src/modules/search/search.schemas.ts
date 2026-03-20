import { z } from "zod";

export const searchQuerySchema = z.object({
  query: z.object({
    q: z.string().min(1, "Search query is required"),
    index: z.string().default("users"),
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(10),
  }),
});
