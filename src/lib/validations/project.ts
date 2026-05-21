// src/lib/validations/project.ts

import { z } from "zod";

export const createProjectSchema = z.object({
  name: z.string().min(1, "專案名稱不可空白").max(100),
  address: z.string().max(200).optional(),
  clientName: z.string().max(50).optional(),
  clientTitle: z.enum(["先生", "小姐"]).optional(),
  clientPhone: z.string().max(30).optional(),
  clientLineId: z.string().max(80).optional(),
  designerName: z.string().max(50).optional(),
  designerPhone: z.string().max(30).optional(),
  notes: z.string().max(500).optional(),
});

export const updateProjectSchema = createProjectSchema.partial();

export type CreateProjectDTO = z.infer<typeof createProjectSchema>;
export type UpdateProjectDTO = z.infer<typeof updateProjectSchema>;
