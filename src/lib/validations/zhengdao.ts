import { z } from "zod";

const catalogRefSchema = z.object({
  vendorCode: z.string().min(1),
  name: z.string().min(1),
  unit: z.string().min(1),
  pricePerUnit: z.number().nonnegative(),
  requiresQuote: z.boolean().optional(),
  note: z.string().optional(),
});

const boardMaterialRefSchema = catalogRefSchema.extend({
  minCai: z.number().nonnegative(),
  series: z.enum(["ER928", "JM", "ER", "AR", "HWR", "HR", "MR", "PR"]),
  thicknessMm: z.union([
    z.literal(3),
    z.literal(8),
    z.literal(9),
    z.literal(18),
    z.literal(19),
    z.literal(25),
    z.literal(50),
  ]),
});

const boardAddonSchema = z.enum([
  "FRONT_ABS",
  "FRONT_BACK_ABS",
  "MIDDLE_DIVIDER_DOUBLE_DRILL",
  "SHARED_SIDE_DOUBLE_DRILL_BACK_GROOVE",
  "L_SHAPED_BODY",
  "SMALL_BODY_SIDE",
  "DOOR_GRAIN_MATCH",
  "MR_DOOR_HORIZONTAL_GRAIN",
]);

export const zhengdaoBoardLineSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  usage: z.enum(["BODY_BACK", "DOOR", "DOOR_COUNTERTOP"]),
  widthCm: z.number().positive(),
  heightCm: z.number().positive(),
  quantity: z.number().int().positive(),
  material: boardMaterialRefSchema,
  addons: z.array(boardAddonSchema).default([]),
});

export const zhengdaoProcessingSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  targetBoardLineId: z.string().min(1),
  billingMode: z.enum(["PER_CAI", "PER_ITEM", "PER_10MM"]),
  unit: z.string().min(1),
  quantity: z.number().positive(),
  unitPrice: z.number().nonnegative(),
  minCai: z.number().nonnegative().optional(),
  lengthMm: z.number().positive().optional(),
  requiresQuote: z.boolean().optional(),
  note: z.string().optional(),
}).superRefine((value, ctx) => {
  if (value.billingMode === "PER_10MM" && value.lengthMm === undefined) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["lengthMm"],
      message: "PER_10MM processing requires lengthMm",
    });
  }
});

export const zhengdaoHardwareSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  quantity: z.number().positive(),
  material: catalogRefSchema,
  note: z.string().optional(),
});

export const zhengdaoCustomItemSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  unit: z.string().min(1),
  quantity: z.number().positive(),
  unitPrice: z.number().nonnegative(),
  note: z.string(),
});

export const zhengdaoCabinetUnitSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  boardLines: z.array(zhengdaoBoardLineSchema),
  processes: z.array(zhengdaoProcessingSchema),
  hardwareItems: z.array(zhengdaoHardwareSchema),
  customItems: z.array(zhengdaoCustomItemSchema),
});

export const zhengdaoProjectInputSchema = z.object({
  projectId: z.string().min(1),
  label: z.string().optional(),
  vendor: z.literal("ZHENGDAO"),
  catalogVersion: z.literal("2025"),
  units: z.array(zhengdaoCabinetUnitSchema).min(1),
});
