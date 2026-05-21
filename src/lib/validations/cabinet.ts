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
  lTurnCabinet: z.object({
    enabled: z.boolean().default(false),
    position: z.enum(["rightTop", "rightBottom", "leftTop", "leftBottom"]).default("rightTop"),
    widthMm: z.number().nonnegative().default(0),
    heightMm: z.number().nonnegative().default(0),
    isOpening: z.boolean().default(true),
  }).default({
    enabled: false,
    position: "rightTop",
    widthMm: 0,
    heightMm: 0,
    isOpening: true,
  }),
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
  slidingDoorTrackGrooves: z.object({
    top: z.object({
      enabled: z.boolean().default(false),
      trackShape: z.enum(["ㄇ", "V", "T"]).default("ㄇ"),
    }).default({ enabled: false, trackShape: "ㄇ" }),
    bottom: z.object({
      enabled: z.boolean().default(false),
      trackShape: z.enum(["ㄇ", "V", "T"]).default("ㄇ"),
    }).default({ enabled: false, trackShape: "ㄇ" }),
  }).default({
    top: { enabled: false, trackShape: "ㄇ" },
    bottom: { enabled: false, trackShape: "ㄇ" },
  }),
  sideSealBending: z.object({
    left: z.object({
      enabled: z.boolean().default(false),
      depthMm: z.number().min(80).max(600).default(80),
      depthCm: z.number().min(80).max(600).optional(),
      isDrawerCabinet: z.boolean().default(false),
      drawerDividerDepthCm: z.number().positive().default(55),
      visibleEdgeBand: z.boolean().default(false),
    }).default({ enabled: false, depthMm: 80, isDrawerCabinet: false, drawerDividerDepthCm: 55, visibleEdgeBand: false }),
    right: z.object({
      enabled: z.boolean().default(false),
      depthMm: z.number().min(80).max(600).default(80),
      depthCm: z.number().min(80).max(600).optional(),
      isDrawerCabinet: z.boolean().default(false),
      drawerDividerDepthCm: z.number().positive().default(55),
      visibleEdgeBand: z.boolean().default(false),
    }).default({ enabled: false, depthMm: 80, isDrawerCabinet: false, drawerDividerDepthCm: 55, visibleEdgeBand: false }),
  }).default({
    left: { enabled: false, depthMm: 80, isDrawerCabinet: false, drawerDividerDepthCm: 55, visibleEdgeBand: false },
    right: { enabled: false, depthMm: 80, isDrawerCabinet: false, drawerDividerDepthCm: 55, visibleEdgeBand: false },
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

export const specialProcessSchema = z.object({
  id: z.string().min(1),
  kind: z.enum(["roundCorner", "quarterRound", "cutCorner", "outerShape", "innerCutout"]),
  label: z.string().default(""),
  edgeBanding: z.enum(["none", "withEdge"]).default("withEdge"),
  quantity: z.number().int().positive().default(1),
  dimensionSumMm: z.number().positive().optional(),
  dimensionAMm: z.number().positive().optional(),
  dimensionBMm: z.number().positive().optional(),
  outerShapeSide: z.enum(["long", "short"]).default("long").optional(),
  radiusMm: z.number().positive().optional(),
  radiusMode: z.enum(["factory", "custom"]).default("factory").optional(),
  sharpCornerGte90Count: z.number().int().nonnegative().default(0).optional(),
  sharpCornerLt90Count: z.number().int().nonnegative().default(0).optional(),
});

export const doorAddonsSchema = z.object({
  louverDoor: z.boolean().default(false),
  patternMatch: z.enum(["none", "grain"]),
  temperedGlass: z.boolean(),
  hingeHoleDrilling: z.boolean(),
  wireMeshPaint: z.boolean().default(false),
  profileHandle: z.object({
    style: z.enum([
      "none",
      "SFJA", "SFJB", "SFJC", "SFJD", "SFCA",
      "L1A", "L5A",
      "Y5IA", "Y5LA", "Y5CA", "V5IA", "V5LA", "V5CA", "U5IA", "U5LA", "U5CA",
      "Y5JA", "Y5KA", "U5JA", "U5KA", "V5JA", "V5KA",
      "Y1A", "U1A", "V1A",
      "RECESSED_BEVEL_HANDLE",
      "RECESSED_ALUMINUM_HANDLE_NO_HARDWARE",
      "N1A",
      "N5IA", "N5LA", "N5CA",
      "N5JA", "N5KA",
      "BEVEL_OR_HALF_ARC_HANDLE",
      "HORIZONTAL_INTEGRATED",
      "TRIANGLE_INTEGRATED_R40",
      "QUARTER_ROUND_INTEGRATED_R40",
      "HALF_ROUND_INTEGRATED_R40",
      "HEART_INTEGRATED_80",
      "SQUARE_INTEGRATED_80",
      "HEXAGON_INTEGRATED_90",
      "DIAMOND_INTEGRATED_100",
      "HOURGLASS_INTEGRATED_150",
      "SMILE_INTEGRATED",
    ]),
    lengthCm: z.number().positive().default(40),
    lengthModification: z.boolean().default(false),
    bakedPaint: z.boolean().default(false),
  }).default({
    style: "none",
    lengthCm: 40,
    lengthModification: false,
    bakedPaint: false,
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
  includeHingeInQuote: z.boolean().default(true),
  includeSlidingHardwareInQuote: z.boolean().default(true),
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
  fullHeight: z.boolean().default(false),
  fullWidth: z.boolean().default(false),
  quantity: z.number().int().positive("數量必須大於 0"),
  materialRef: materialRefSchema,
  addons: middleDividerAddonsSchema.default({
    doubleDrillHoles: false,
    nonStandardHoles: false,
  }),
  specialProcesses: z.array(specialProcessSchema).default([]),
});

export const shelfSchema = z.object({
  id: z.string().min(1),
  widthCm: z.number().positive("寬度必須大於 0"),
  depthCm: z.number().positive("深度必須大於 0"),
  fullDepth: z.boolean().default(false),
  quantity: z.number().int().positive("數量必須大於 0"),
  materialRef: materialRefSchema,
});

export const shelfSchemaWithLightGroove = shelfSchema.extend({
  lightGroove: z.object({
    side: z.enum(["none", "top", "bottom"]).default("none"),
    offsetFromFrontMm: z.number().nonnegative().default(50),
  }).default({ side: "none", offsetFromFrontMm: 50 }),
  specialProcesses: z.array(specialProcessSchema).default([]),
});

export const sideTopBottomSealPanelSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1, "板件名稱不可空白").default("側頂底封板"),
  widthCm: z.number().positive("寬度必須大於 0"),
  heightCm: z.number().positive("高度必須大於 0"),
  quantity: z.number().int().positive("數量必須大於 0"),
  materialRef: materialRefSchema,
});

export const kickPlateSchema = z.object({
  widthCm: z.number().positive("寬度必須大於 0").optional(),
  heightCm: z.number().positive("高度必須大於 0"),
  materialRef: materialRefSchema.optional(),
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
  includeRailInQuote: z.boolean().default(true),
  railMaterialRef: materialRefSchema,
  wallMaterialRef: materialRefSchema,
  bottomMaterialRef: materialRefSchema,
  frontMoldProcessing: z.boolean().default(false),
  frontMoldRadius: z.enum(["none", "R20", "R30", "R50", "R80", "R100", "R150", "R200", "R250", "R300"]).default("none"),
  frontMoldCornerCount: z.number().int().min(0).default(2),
  frontHandle: z.object({
    style: z.enum([
      "none",
      "SFJA", "SFJB", "SFJC", "SFJD", "SFCA",
      "L1A", "L5A",
      "Y5IA", "Y5LA", "Y5CA", "V5IA", "V5LA", "V5CA", "U5IA", "U5LA", "U5CA",
      "Y5JA", "Y5KA", "U5JA", "U5KA", "V5JA", "V5KA",
      "Y1A", "U1A", "V1A",
      "RECESSED_BEVEL_HANDLE",
      "RECESSED_ALUMINUM_HANDLE_NO_HARDWARE",
      "N1A",
      "N5IA", "N5LA", "N5CA",
      "N5JA", "N5KA",
      "BEVEL_OR_HALF_ARC_HANDLE",
      "HORIZONTAL_INTEGRATED",
      "TRIANGLE_INTEGRATED_R40",
      "QUARTER_ROUND_INTEGRATED_R40",
      "HALF_ROUND_INTEGRATED_R40",
      "HEART_INTEGRATED_80",
      "SQUARE_INTEGRATED_80",
      "HEXAGON_INTEGRATED_90",
      "DIAMOND_INTEGRATED_100",
      "HOURGLASS_INTEGRATED_150",
      "SMILE_INTEGRATED",
    ]),
    lengthCm: z.number().positive().default(40),
    bakedPaint: z.boolean().default(false),
  }).default({ style: "none", lengthCm: 40, bakedPaint: false }),
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
  sideTopBottomSealPanels: z.array(sideTopBottomSealPanelSchema).default([]),
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
