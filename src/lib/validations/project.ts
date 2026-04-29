// src/lib/validations/project.ts

import { z } from "zod";

export const createProjectSchema = z.object({
  name: z.string().min(1, "專案名稱不能為空").max(100),
  clientName: z.string().max(50).optional(),
  notes: z.string().max(500).optional(),
});

export const updateProjectSchema = createProjectSchema.partial();

export type CreateProjectDTO = z.infer<typeof createProjectSchema>;
export type UpdateProjectDTO = z.infer<typeof updateProjectSchema>;
