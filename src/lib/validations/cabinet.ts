// src/lib/validations/cabinet.ts

import { z } from "zod";

export const materialRefSchema = z.object({
  materialId: z.string().min(1),
  materialName: z.string().min(1),
  unit: z.string().min(1),
  pricePerUnit: z.number().nonnegative(),
  minCai: z.number().nonnegative().nullable(),
}).nullable();

export const unitAddonsSchema = z.object({
  frontEdgeABS: z.enum(["none", "one_long", "two_long"]),
  lightGrooves: z.object({
    topInner: z.object({
      enabled: z.boolean().default(false),
      offsetFromFrontMm: z.number().nonnegative().default(50),
    }).default({ enabled: false, offsetFromFrontMm: 50 }),
    sideInner: z.object({
      enabled: z.boolean().default(false),
      offsetFromFrontMm: z.number().nonnegative().default(50),
    }).default({ enabled: false, offsetFromFrontMm: 50 }),
  }).default({
    topInner: { enabled: false, offsetFromFrontMm: 50 },
    sideInner: { enabled: false, offsetFromFrontMm: 50 },
  }),
});

export const middleDividerAddonsSchema = z.object({
  doubleDrillHoles: z.boolean(),
  nonStandardHoles: z.boolean(),
  lightGroove: z.object({
    side: z.enum(["none", "left", "right"]).default("none"),
    offsetFromFrontMm: z.number().nonnegative().default(50),
  }).default({ side: "none", offsetFromFrontMm: 50 }),
});

export const doorAddonsSchema = z.object({
  patternMatch: z.enum(["none", "grain"]),
  temperedGlass: z.boolean(),
  hingeHoleDrilling: z.boolean(),
  wireMeshPaint: z.boolean().default(false),
  profileHandle: z.object({
    style: z.enum(["none", "SFJA", "SFJB", "SFJC", "SFJD", "SFCA"]),
    lengthCm: z.number().positive().default(40),
    lengthModification: z.boolean().default(false),
  }).default({
    style: "none",
    lengthCm: 40,
    lengthModification: false,
  }),
});

export const doorInputSchema = z.object({
  id: z.string().min(1),
  type: z.enum(["HINGED", "SLIDING"]),
  name: z.string(),
  widthCm: z.number().positive("寬度必須大於 0"),
  heightCm: z.number().positive("高度必須大於 0"),
  quantity: z.number().int().positive("數量必須大於 0"),
  materialRef: materialRefSchema,
  addons: doorAddonsSchema,
  hingeMaterialRef: materialRefSchema.optional(),
  railMaterialRef: materialRefSchema.optional(),
  wireMeshMaterialRef: materialRefSchema.optional(),
  useAluminumHandle: z.boolean().optional(),
  aluminumHandleMaterialRef: materialRefSchema.optional(),
});

export const hardwareItemSchema = z.object({
  id: z.string().min(1),
  name: z.string(),
  quantity: z.number().positive("數量必須大於 0"),
  materialRef: materialRefSchema,
});

export const middleDividerSchema = z.object({
  id: z.string().min(1),
  widthCm: z.number().positive("寬度必須大於 0"),
  heightCm: z.number().positive("高度必須大於 0"),
  quantity: z.number().int().positive("數量必須大於 0"),
  materialRef: materialRefSchema,
  addons: middleDividerAddonsSchema.default({
    doubleDrillHoles: false,
    nonStandardHoles: false,
  }),
});

export const shelfSchema = z.object({
  id: z.string().min(1),
  widthCm: z.number().positive("寬度必須大於 0"),
  depthCm: z.number().positive("深度必須大於 0"),
  quantity: z.number().int().positive("數量必須大於 0"),
  materialRef: materialRefSchema,
});

export const shelfSchemaWithLightGroove = shelfSchema.extend({
  lightGroove: z.object({
    side: z.enum(["none", "top", "bottom"]).default("none"),
    offsetFromFrontMm: z.number().nonnegative().default(50),
  }).default({ side: "none", offsetFromFrontMm: 50 }),
});

export const kickPlateSchema = z.object({
  widthCm: z.number().positive("寬度必須大於 0"),
  heightCm: z.number().positive("高度必須大於 0"),
  materialRef: materialRefSchema,
}).nullable();

export const drawerSchema = z.object({
  id: z.string().min(1),
  name: z.string(),
  widthCm: z.number().positive("寬度必須大於 0"),
  heightCm: z.number().positive("高度必須大於 0"),
  depthCm: z.number().positive("深度必須大於 0"),
  railLengthCm: z.number().positive("滑軌長度必須大於 0"),
  quantity: z.number().int().positive("數量必須大於 0"),
  grooveSpec: z.enum(["12", "8.5", "9"]).default("8.5"),
  railMaterialRef: materialRefSchema,
  wallMaterialRef: materialRefSchema,
  bottomMaterialRef: materialRefSchema,
});

export const cabinetUnitInputSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1, "桶身名稱不能為空"),
  widthCm: z.number().positive("寬度必須大於 0").max(500, "寬度不超過 500cm"),
  depthCm: z.number().positive("深度必須大於 0").max(200, "深度不超過 200cm"),
  heightCm: z.number().positive("高度必須大於 0").max(300, "高度不超過 300cm"),
  quantity: z.number().int().positive("數量必須大於 0").max(20),
  hasBackPanel: z.boolean(),
  panelMaterialRef: materialRefSchema,
  backPanelMaterialRef: materialRefSchema,
  addons: unitAddonsSchema,
  middleDividers: z.array(middleDividerSchema),
  shelves: z.array(shelfSchemaWithLightGroove),
  drawers: z.array(drawerSchema).default([]),
  doors: z.array(doorInputSchema),
  hardwareItems: z.array(hardwareItemSchema).default([]),
  kickPlate: kickPlateSchema,
});

export const cabinetProjectInputSchema = z.object({
  projectId: z.string().min(1),
  label: z.string().optional(),
  units: z.array(cabinetUnitInputSchema).min(1, "至少需要一個桶身"),
});

export type CabinetProjectInputDTO = z.infer<typeof cabinetProjectInputSchema>;
