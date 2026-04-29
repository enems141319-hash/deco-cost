// src/lib/validations/ceiling.ts

import { z } from "zod";
import { materialRefSchema } from "./cabinet";

export const ceilingInputSchema = z
  .object({
    areaPing: z.number().positive("坪數必須大於 0").max(500),
    autoPerimeter: z.boolean(),
    roomLengthM: z.number().positive().optional(),
    roomWidthM: z.number().positive().optional(),
    manualPerimeterM: z.number().positive().optional(),
    angleMaterialRef: materialRefSchema,
    boardMaterialRef: materialRefSchema,
    perimeterAngleMaterialRef: materialRefSchema,
  })
  .refine(
    (data) => {
      if (data.autoPerimeter) {
        return data.roomLengthM != null && data.roomWidthM != null;
      }
      return data.manualPerimeterM != null;
    },
    {
      message: "請填寫周長相關欄位",
      path: ["manualPerimeterM"],
    }
  );

export const ceilingProjectInputSchema = z.object({
  projectId: z.string().min(1),
  label: z.string().optional(),
  input: ceilingInputSchema,
});

export type CeilingProjectInputDTO = z.infer<typeof ceilingProjectInputSchema>;
