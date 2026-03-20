import { z } from "zod";

export const getUploadSchema = z.object({
  params: z.object({
    id: z.string().min(1, "Upload ID is required"),
  }),
});

export const deleteUploadSchema = z.object({
  params: z.object({
    id: z.string().min(1, "Upload ID is required"),
  }),
});
