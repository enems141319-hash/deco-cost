# Brightway 2025 Calculation Engine Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a standalone calculation engine for 正道 / Brightway 2025 board and board-processing pricing, based on PDF page 24 `板材價目表` and PDF page 25 `板材加工價目表`.

**Architecture:** Keep Brightway rules isolated from the current cabinet engine. Store vendor constants in a vendor config file, expose pure calculation functions from a vendor calculation module, and adapt the output into the existing material summary shape only after the core engine is tested. No UI changes are required for this first engine milestone.

**Tech Stack:** Next.js App Router, TypeScript strict mode, Prisma JSON persistence later, pure calculation functions under `src/lib/calculations/`, tests executed with `npx tsx`.

---

## Scope

This plan only covers the calculation engine foundation for Brightway 2025:

- Board price rules from PDF page 24.
- Board processing rules from PDF page 25.
- Typed inputs and outputs for a future Brightway UI.
- Unit tests that prove key pricing rules.
- A converter to a common estimate result shape for future project totals and PDFs.

This plan does not include:

- Full 140-page catalog import.
- Hinges, rails, drawer systems, aluminum frames, lighting, faucets, or accessories.
- User-facing UI routes.
- Database schema changes.
- Production PDF layout.

## Source Pages

Use PDF actual page numbers:

- `2025系統目錄.pdf`, PDF page 24: `板材價目表`
- `2025系統目錄.pdf`, PDF page 25: `板材加工價目表`

Important distinction:

- The specification pages show what thicknesses a color can be produced in.
- The price table page defines what can be quoted for each usage.
- The engine should price from page 24 and page 25, not only from the color specification pages.

## File Structure

- Create `src/types/brightway.ts`
  - Owns Brightway input/result types.
  - Keeps vendor-specific fields out of `src/types/cabinet.ts`.

- Create `src/lib/config/vendors/brightway-2025.ts`
  - Owns all Brightway 2025 board price and processing price constants.
  - Does not import React or Prisma.

- Create `src/lib/calculations/brightway.ts`
  - Owns pure calculation functions.
  - Calculates board material cost, processing cost, and total cost.
  - No UI, no DB, no server actions.

- Create `src/lib/calculations/brightway.test.ts`
  - Tests board pricing, minimum cai, edge add-ons, L-board minimum, processing rows, and unsupported combinations.

- Create `src/lib/calculations/brightway-summary.ts`
  - Converts Brightway results into a common row shape compatible with future material summary/PDF work.

- Create `src/lib/calculations/brightway-summary.test.ts`
  - Tests stable row ordering and totals.

- Optional later, not in this plan: `src/components/brightway/`, `src/app/(dashboard)/projects/[id]/brightway/`, and server actions.

---

### Task 1: Add Brightway Types

**Files:**
- Create: `src/types/brightway.ts`

- [ ] **Step 1: Create Brightway type file**

Add this file:

```typescript
// src/types/brightway.ts

export type BrightwayVendor = "BRIGHTWAY";
export type BrightwayCatalogVersion = "2025";

export type BrightwayBoardUsage =
  | "BODY_BACK"
  | "DOOR"
  | "DOOR_COUNTERTOP"
  | "EDGE_BANDING";

export type BrightwayBoardSeries =
  | "ER928"
  | "JM"
  | "ER"
  | "AR"
  | "HWR"
  | "HR"
  | "MR"
  | "PR";

export type BrightwayBoardThicknessMm =
  | 3
  | 8
  | 9
  | 18
  | 19
  | 25
  | 50;

export type BrightwayEdgeMode =
  | "NONE"
  | "NO_EDGE"
  | "PVC"
  | "ABS"
  | "FRONT_ABS"
  | "FRONT_BACK_ABS";

export type BrightwayDoorCountertopFinish =
  | "PVC"
  | "ABS";

export type BrightwayProcessingCode =
  | "EDGE_A"
  | "GRAIN_MATCH"
  | "G1_ARC_GROOVE"
  | "G2_RIGHT_ANGLE_GROOVE"
  | "G3_SMILE_GROOVE"
  | "G4_G5_L_CORNER"
  | "G6_G7_BEVEL"
  | "G8_G9_ROUND_CORNER"
  | "G10_INNER_RECTANGLE"
  | "G11_INNER_CIRCLE"
  | "G12_FULL_ROUND_SMALL"
  | "G13_FULL_ROUND_LARGE"
  | "G14_HALF_ROUND_SMALL"
  | "G15_HALF_ROUND_LARGE"
  | "C_SLOT"
  | "SHELF_METAL_STRIP_GROOVE"
  | "CUSTOM_GROOVE_10MM"
  | "TRACK_GROOVE_10MM"
  | "DOOR_STRAIGHTENER_GROOVE_10MM"
  | "WIRE_HOLE_COVER"
  | "VENT_HOLE_COVER"
  | "ROUND_RECESSED_LIGHT_HOLE"
  | "SLIDING_DOOR_GUIDE_WHEEL_HOLE"
  | "SLIDING_BOOKCASE_WHEEL_HOLE"
  | "RECESSED_HANDLE_HOLE"
  | "HINGE_HOLE"
  | "CUSTOM_HINGE_HOLE"
  | "BODY_VENT_HOLE"
  | "HIDDEN_SHELF_BRACKET_HOLE"
  | "HIDDEN_SHELF_SCREW_HOLE";

export interface BrightwayMaterialRef {
  series: BrightwayBoardSeries;
  colorCode?: string;
  materialName?: string;
}

export interface BrightwayBoardLineInput {
  id: string;
  name: string;
  material: BrightwayMaterialRef;
  usage: BrightwayBoardUsage;
  thicknessMm: BrightwayBoardThicknessMm;
  edgeMode: BrightwayEdgeMode;
  widthCm: number;
  heightCm: number;
  quantity: number;
}

export interface BrightwayProcessingInput {
  id: string;
  code: BrightwayProcessingCode;
  targetBoardLineId: string;
  quantity: number;
  thicknessMm?: BrightwayBoardThicknessMm;
  dimensionMm?: number;
}

export interface BrightwayEstimateInput {
  vendor: BrightwayVendor;
  catalogVersion: BrightwayCatalogVersion;
  name: string;
  boardLines: BrightwayBoardLineInput[];
  processes: BrightwayProcessingInput[];
}

export interface BrightwayPriceRule {
  usage: BrightwayBoardUsage;
  series: BrightwayBoardSeries;
  thicknessMm: BrightwayBoardThicknessMm;
  edgeMode: BrightwayEdgeMode;
  pricePerCai: number;
  minCai: number;
}

export interface BrightwayBoardLineResult {
  id: string;
  name: string;
  material: BrightwayMaterialRef;
  usage: BrightwayBoardUsage;
  thicknessMm: BrightwayBoardThicknessMm;
  edgeMode: BrightwayEdgeMode;
  widthCm: number;
  heightCm: number;
  quantity: number;
  actualCai: number;
  billableCai: number;
  pricePerCai: number;
  materialSubtotal: number;
  minCai: number;
}

export interface BrightwayProcessingResult {
  id: string;
  code: BrightwayProcessingCode;
  targetBoardLineId: string;
  label: string;
  unit: string;
  quantity: number;
  unitPrice: number;
  minCai?: number;
  subtotal: number;
}

export interface BrightwayEstimateResult {
  vendor: BrightwayVendor;
  catalogVersion: BrightwayCatalogVersion;
  name: string;
  boardLines: BrightwayBoardLineResult[];
  processes: BrightwayProcessingResult[];
  materialTotal: number;
  processingTotal: number;
  totalCost: number;
}
```

- [ ] **Step 2: Run typecheck**

Run:

```bash
npm run typecheck
```

Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add src/types/brightway.ts
git commit -m "feat: add Brightway estimate types"
```

---

### Task 2: Add Brightway 2025 Price Config

**Files:**
- Create: `src/lib/config/vendors/brightway-2025.ts`

- [ ] **Step 1: Create vendor config**

Add this file:

```typescript
// src/lib/config/vendors/brightway-2025.ts

import type {
  BrightwayBoardSeries,
  BrightwayBoardThicknessMm,
  BrightwayBoardUsage,
  BrightwayEdgeMode,
  BrightwayPriceRule,
  BrightwayProcessingCode,
} from "@/types/brightway";

export const BRIGHTWAY_2025_CAI_CM2 = 918.09;
export const BRIGHTWAY_2025_COST_DECIMAL_PLACES = 0;
export const BRIGHTWAY_2025_AREA_DECIMAL_PLACES = 4;

export const BRIGHTWAY_2025_BOARD_PRICE_RULES: BrightwayPriceRule[] = [
  { usage: "BODY_BACK", series: "ER928", thicknessMm: 18, edgeMode: "NONE", pricePerCai: 130, minCai: 1 },
  { usage: "BODY_BACK", series: "ER928", thicknessMm: 8, edgeMode: "NO_EDGE", pricePerCai: 90, minCai: 1 },
  { usage: "BODY_BACK", series: "ER928", thicknessMm: 8, edgeMode: "ABS", pricePerCai: 140, minCai: 1 },
  { usage: "BODY_BACK", series: "JM", thicknessMm: 18, edgeMode: "NONE", pricePerCai: 130, minCai: 1 },
  { usage: "BODY_BACK", series: "JM", thicknessMm: 8, edgeMode: "NO_EDGE", pricePerCai: 90, minCai: 1 },
  { usage: "BODY_BACK", series: "JM", thicknessMm: 8, edgeMode: "ABS", pricePerCai: 140, minCai: 1 },
  { usage: "BODY_BACK", series: "ER", thicknessMm: 18, edgeMode: "NONE", pricePerCai: 150, minCai: 1 },
  { usage: "BODY_BACK", series: "ER", thicknessMm: 8, edgeMode: "NO_EDGE", pricePerCai: 110, minCai: 1 },
  { usage: "BODY_BACK", series: "ER", thicknessMm: 8, edgeMode: "ABS", pricePerCai: 160, minCai: 1 },
  { usage: "BODY_BACK", series: "AR", thicknessMm: 18, edgeMode: "NONE", pricePerCai: 190, minCai: 1 },
  { usage: "BODY_BACK", series: "AR", thicknessMm: 8, edgeMode: "NO_EDGE", pricePerCai: 135, minCai: 1 },
  { usage: "BODY_BACK", series: "AR", thicknessMm: 8, edgeMode: "ABS", pricePerCai: 190, minCai: 1 },
  { usage: "BODY_BACK", series: "HWR", thicknessMm: 18, edgeMode: "NONE", pricePerCai: 290, minCai: 2 },
  { usage: "BODY_BACK", series: "HWR", thicknessMm: 3, edgeMode: "NONE", pricePerCai: 120, minCai: 2 },
  { usage: "BODY_BACK", series: "HR", thicknessMm: 18, edgeMode: "NONE", pricePerCai: 410, minCai: 2 },
  { usage: "BODY_BACK", series: "HR", thicknessMm: 3, edgeMode: "NONE", pricePerCai: 170, minCai: 2 },
  { usage: "BODY_BACK", series: "MR", thicknessMm: 19, edgeMode: "NONE", pricePerCai: 300, minCai: 2 },
  { usage: "BODY_BACK", series: "MR", thicknessMm: 9, edgeMode: "NO_EDGE", pricePerCai: 260, minCai: 2 },
  { usage: "BODY_BACK", series: "MR", thicknessMm: 9, edgeMode: "ABS", pricePerCai: 300, minCai: 2 },
  { usage: "BODY_BACK", series: "PR", thicknessMm: 9, edgeMode: "NO_EDGE", pricePerCai: 480, minCai: 2 },
  { usage: "BODY_BACK", series: "PR", thicknessMm: 9, edgeMode: "ABS", pricePerCai: 540, minCai: 2 },

  { usage: "DOOR", series: "ER928", thicknessMm: 18, edgeMode: "NONE", pricePerCai: 150, minCai: 1 },
  { usage: "DOOR", series: "JM", thicknessMm: 18, edgeMode: "NONE", pricePerCai: 150, minCai: 1 },
  { usage: "DOOR", series: "ER", thicknessMm: 18, edgeMode: "NONE", pricePerCai: 170, minCai: 1 },
  { usage: "DOOR", series: "AR", thicknessMm: 18, edgeMode: "NONE", pricePerCai: 210, minCai: 1 },
  { usage: "DOOR", series: "MR", thicknessMm: 19, edgeMode: "NONE", pricePerCai: 320, minCai: 2 },
  { usage: "DOOR", series: "PR", thicknessMm: 19, edgeMode: "NONE", pricePerCai: 560, minCai: 2 },
  { usage: "DOOR", series: "HWR", thicknessMm: 18, edgeMode: "NONE", pricePerCai: 320, minCai: 2 },
  { usage: "DOOR", series: "HR", thicknessMm: 18, edgeMode: "NONE", pricePerCai: 470, minCai: 2 },

  { usage: "DOOR_COUNTERTOP", series: "ER928", thicknessMm: 25, edgeMode: "PVC", pricePerCai: 170, minCai: 2 },
  { usage: "DOOR_COUNTERTOP", series: "ER928", thicknessMm: 25, edgeMode: "ABS", pricePerCai: 180, minCai: 2 },
  { usage: "DOOR_COUNTERTOP", series: "ER928", thicknessMm: 50, edgeMode: "ABS", pricePerCai: 420, minCai: 3 },
  { usage: "DOOR_COUNTERTOP", series: "JM", thicknessMm: 25, edgeMode: "PVC", pricePerCai: 170, minCai: 2 },
  { usage: "DOOR_COUNTERTOP", series: "JM", thicknessMm: 25, edgeMode: "ABS", pricePerCai: 180, minCai: 2 },
  { usage: "DOOR_COUNTERTOP", series: "JM", thicknessMm: 50, edgeMode: "ABS", pricePerCai: 420, minCai: 3 },
  { usage: "DOOR_COUNTERTOP", series: "ER", thicknessMm: 25, edgeMode: "PVC", pricePerCai: 210, minCai: 2 },
  { usage: "DOOR_COUNTERTOP", series: "ER", thicknessMm: 25, edgeMode: "ABS", pricePerCai: 220, minCai: 2 },
  { usage: "DOOR_COUNTERTOP", series: "ER", thicknessMm: 50, edgeMode: "ABS", pricePerCai: 500, minCai: 3 },
  { usage: "DOOR_COUNTERTOP", series: "AR", thicknessMm: 25, edgeMode: "PVC", pricePerCai: 240, minCai: 2 },
  { usage: "DOOR_COUNTERTOP", series: "AR", thicknessMm: 25, edgeMode: "ABS", pricePerCai: 250, minCai: 2 },
  { usage: "DOOR_COUNTERTOP", series: "AR", thicknessMm: 50, edgeMode: "ABS", pricePerCai: 600, minCai: 3 },
  { usage: "DOOR_COUNTERTOP", series: "MR", thicknessMm: 25, edgeMode: "PVC", pricePerCai: 590, minCai: 2 },
  { usage: "DOOR_COUNTERTOP", series: "MR", thicknessMm: 25, edgeMode: "ABS", pricePerCai: 600, minCai: 2 },
  { usage: "DOOR_COUNTERTOP", series: "MR", thicknessMm: 50, edgeMode: "ABS", pricePerCai: 800, minCai: 3 },
];

export interface BrightwayBoardAddonRule {
  usage: BrightwayBoardUsage;
  thicknessMm?: BrightwayBoardThicknessMm;
  series?: BrightwayBoardSeries;
  edgeMode?: BrightwayEdgeMode;
  pricePerCai: number;
  minCai: number;
}

export const BRIGHTWAY_2025_BOARD_ADDON_RULES = {
  bodyFrontAbs: { pricePerCai: 10, minCai: 1 },
  bodyFrontBackAbs: { pricePerCai: 20, minCai: 1 },
  bodyMiddleDividerDoubleDrill: { pricePerCai: 20, minCai: 1 },
  bodySharedSideDoubleDrillWithBackGroove: { pricePerCai: 20, minCai: 2 },
  bodyEightMmDrawerDividerUnder500: { unitPrice: 130 },
  bodyEightMmDrawerDividerOver501: { unitPrice: 250 },
  bodyLBoard: { pricePerCai: 50, minCai: 5 },
  bodySmallSideUnder100Mm: { pricePerCai: 20 },
  doorGrainMatch: { pricePerCai: 80, minCai: 5 },
  mrDoorGrainMatch: { pricePerCai: 100, minCai: 5 },
  mrDoorHorizontalGrain: { pricePerCai: 100, minCai: 5 },
  doorCountertop25SingleDrill: { pricePerCai: 20, minCai: 2 },
  doorCountertop25MiddleDividerDoubleDrill: { pricePerCai: 50, minCai: 2 },
  doorCountertop25SharedSideDoubleDrillWithBackGroove: { pricePerCai: 80, minCai: 2 },
  doorCountertop25LBoard: { pricePerCai: 70, minCai: 5 },
  doorCountertop25SmallSideUnder200Mm: { pricePerCai: 30 },
  doorCountertop50SingleDrill: { pricePerCai: 20, minCai: 3 },
  doorCountertop50MiddleDividerDoubleDrill: { pricePerCai: 50, minCai: 3 },
  doorCountertop50SharedSideDoubleDrillWithBackGroove: { pricePerCai: 80, minCai: 3 },
  doorCountertop50LBoard: { pricePerCai: 70, minCai: 5 },
  doorCountertop50SmallSideUnder200Mm: { pricePerCai: 50 },
} as const;

export interface BrightwayProcessingRule {
  code: BrightwayProcessingCode;
  label: string;
  unit: "才" | "式" | "孔" | "片" | "10mm";
  unitPrice: number;
  minCai?: number;
}

export const BRIGHTWAY_2025_PROCESSING_RULES: Record<BrightwayProcessingCode, BrightwayProcessingRule> = {
  EDGE_A: { code: "EDGE_A", label: "封A 封單邊", unit: "才", unitPrice: 10, minCai: 1 },
  GRAIN_MATCH: { code: "GRAIN_MATCH", label: "對紋 板厚3/8/18mm", unit: "才", unitPrice: 80, minCai: 5 },
  G1_ARC_GROOVE: { code: "G1_ARC_GROOVE", label: "弧形凹槽 G1", unit: "式", unitPrice: 600, minCai: 1 },
  G2_RIGHT_ANGLE_GROOVE: { code: "G2_RIGHT_ANGLE_GROOVE", label: "直角凹槽 G2", unit: "式", unitPrice: 600, minCai: 1 },
  G3_SMILE_GROOVE: { code: "G3_SMILE_GROOVE", label: "微笑槽 G3", unit: "式", unitPrice: 600, minCai: 1 },
  G4_G5_L_CORNER: { code: "G4_G5_L_CORNER", label: "切 L 角 G4/G5", unit: "式", unitPrice: 600, minCai: 1 },
  G6_G7_BEVEL: { code: "G6_G7_BEVEL", label: "切斜角 G6/G7", unit: "式", unitPrice: 600, minCai: 1 },
  G8_G9_ROUND_CORNER: { code: "G8_G9_ROUND_CORNER", label: "導 R 角 G8/G9", unit: "式", unitPrice: 500, minCai: 1 },
  G10_INNER_RECTANGLE: { code: "G10_INNER_RECTANGLE", label: "內挖方型 G10", unit: "式", unitPrice: 720, minCai: 1 },
  G11_INNER_CIRCLE: { code: "G11_INNER_CIRCLE", label: "內挖圓 G11", unit: "式", unitPrice: 1000, minCai: 1 },
  G12_FULL_ROUND_SMALL: { code: "G12_FULL_ROUND_SMALL", label: "導全圓 G12", unit: "式", unitPrice: 1200, minCai: 1 },
  G13_FULL_ROUND_LARGE: { code: "G13_FULL_ROUND_LARGE", label: "導全圓 G13", unit: "式", unitPrice: 2000, minCai: 1 },
  G14_HALF_ROUND_SMALL: { code: "G14_HALF_ROUND_SMALL", label: "1/2 導圓 G14", unit: "式", unitPrice: 1200, minCai: 1 },
  G15_HALF_ROUND_LARGE: { code: "G15_HALF_ROUND_LARGE", label: "1/2 導圓 G15", unit: "式", unitPrice: 2000, minCai: 1 },
  C_SLOT: { code: "C_SLOT", label: "切 C 型槽", unit: "式", unitPrice: 200 },
  SHELF_METAL_STRIP_GROOVE: { code: "SHELF_METAL_STRIP_GROOVE", label: "隔板加金目條洗槽", unit: "才", unitPrice: 100, minCai: 1 },
  CUSTOM_GROOVE_10MM: { code: "CUSTOM_GROOVE_10MM", label: "指定洗溝", unit: "10mm", unitPrice: 20 },
  TRACK_GROOVE_10MM: { code: "TRACK_GROOVE_10MM", label: "洗軌道溝", unit: "10mm", unitPrice: 10 },
  DOOR_STRAIGHTENER_GROOVE_10MM: { code: "DOOR_STRAIGHTENER_GROOVE_10MM", label: "門板拉直器開槽", unit: "10mm", unitPrice: 10 },
  WIRE_HOLE_COVER: { code: "WIRE_HOLE_COVER", label: "電線孔蓋", unit: "孔", unitPrice: 100 },
  VENT_HOLE_COVER: { code: "VENT_HOLE_COVER", label: "透氣孔蓋", unit: "孔", unitPrice: 500 },
  ROUND_RECESSED_LIGHT_HOLE: { code: "ROUND_RECESSED_LIGHT_HOLE", label: "圓型崁燈孔", unit: "孔", unitPrice: 700 },
  SLIDING_DOOR_GUIDE_WHEEL_HOLE: { code: "SLIDING_DOOR_GUIDE_WHEEL_HOLE", label: "推門導輪孔", unit: "片", unitPrice: 200 },
  SLIDING_BOOKCASE_WHEEL_HOLE: { code: "SLIDING_BOOKCASE_WHEEL_HOLE", label: "推拉書櫃上下輪孔", unit: "孔", unitPrice: 40 },
  RECESSED_HANDLE_HOLE: { code: "RECESSED_HANDLE_HOLE", label: "崁入式把手孔", unit: "孔", unitPrice: 60 },
  HINGE_HOLE: { code: "HINGE_HOLE", label: "鉸鍊孔", unit: "孔", unitPrice: 40 },
  CUSTOM_HINGE_HOLE: { code: "CUSTOM_HINGE_HOLE", label: "代挖鉸鍊孔", unit: "孔", unitPrice: 200 },
  BODY_VENT_HOLE: { code: "BODY_VENT_HOLE", label: "桶身透氣孔", unit: "才", unitPrice: 100, minCai: 5 },
  HIDDEN_SHELF_BRACKET_HOLE: { code: "HIDDEN_SHELF_BRACKET_HOLE", label: "隱藏式層板支架", unit: "孔", unitPrice: 400 },
  HIDDEN_SHELF_SCREW_HOLE: { code: "HIDDEN_SHELF_SCREW_HOLE", label: "隱藏式層板螺絲", unit: "孔", unitPrice: 100 },
};
```

- [ ] **Step 2: Run typecheck**

Run:

```bash
npm run typecheck
```

Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add src/lib/config/vendors/brightway-2025.ts
git commit -m "feat: add Brightway 2025 pricing config"
```

---

### Task 3: Write Failing Board Pricing Tests

**Files:**
- Create: `src/lib/calculations/brightway.test.ts`

- [ ] **Step 1: Add board pricing tests**

Create the test file:

```typescript
// src/lib/calculations/brightway.test.ts

import assert from "node:assert/strict";
import { calculateBrightwayEstimate, findBrightwayBoardPriceRule } from "./brightway";
import type { BrightwayEstimateInput } from "@/types/brightway";

function baseInput(overrides: Partial<BrightwayEstimateInput> = {}): BrightwayEstimateInput {
  return {
    vendor: "BRIGHTWAY",
    catalogVersion: "2025",
    name: "Brightway test",
    boardLines: [],
    processes: [],
    ...overrides,
  };
}

assert.deepEqual(findBrightwayBoardPriceRule({
  usage: "BODY_BACK",
  series: "ER",
  thicknessMm: 18,
  edgeMode: "NONE",
}), {
  usage: "BODY_BACK",
  series: "ER",
  thicknessMm: 18,
  edgeMode: "NONE",
  pricePerCai: 150,
  minCai: 1,
});

const erBody = calculateBrightwayEstimate(baseInput({
  boardLines: [{
    id: "body-left",
    name: "左側板",
    material: { series: "ER", colorCode: "ER1145", materialName: "自然巴多利諾橡木" },
    usage: "BODY_BACK",
    thicknessMm: 18,
    edgeMode: "NONE",
    widthCm: 90,
    heightCm: 40,
    quantity: 1,
  }],
}));

assert.equal(erBody.boardLines[0]?.pricePerCai, 150);
assert.equal(erBody.boardLines[0]?.minCai, 1);
assert.equal(erBody.boardLines[0]?.billableCai, 3.9212);
assert.equal(erBody.boardLines[0]?.materialSubtotal, 588);
assert.equal(erBody.totalCost, 588);

const smallMrDoor = calculateBrightwayEstimate(baseInput({
  boardLines: [{
    id: "mr-door",
    name: "MR 門片",
    material: { series: "MR", colorCode: "MR5001", materialName: "白金沙" },
    usage: "DOOR",
    thicknessMm: 19,
    edgeMode: "NONE",
    widthCm: 30,
    heightCm: 30,
    quantity: 1,
  }],
}));

assert.equal(smallMrDoor.boardLines[0]?.pricePerCai, 320);
assert.equal(smallMrDoor.boardLines[0]?.minCai, 2);
assert.equal(smallMrDoor.boardLines[0]?.billableCai, 2);
assert.equal(smallMrDoor.boardLines[0]?.materialSubtotal, 640);

assert.throws(
  () => calculateBrightwayEstimate(baseInput({
    boardLines: [{
      id: "unsupported-pr",
      name: "PR 19mm 桶身",
      material: { series: "PR", colorCode: "PR6032", materialName: "杏仁白" },
      usage: "BODY_BACK",
      thicknessMm: 19,
      edgeMode: "NONE",
      widthCm: 100,
      heightCm: 100,
      quantity: 1,
    }],
  })),
  /Unsupported Brightway board price rule/,
);

console.log("Brightway board pricing tests passed");
```

- [ ] **Step 2: Run test and verify it fails**

Run:

```bash
npx tsx src/lib/calculations/brightway.test.ts
```

Expected: FAIL with module not found or missing exported functions from `./brightway`.

---

### Task 4: Implement Board Pricing Engine

**Files:**
- Create: `src/lib/calculations/brightway.ts`
- Test: `src/lib/calculations/brightway.test.ts`

- [ ] **Step 1: Add minimal board pricing engine**

Create:

```typescript
// src/lib/calculations/brightway.ts

import {
  BRIGHTWAY_2025_AREA_DECIMAL_PLACES,
  BRIGHTWAY_2025_BOARD_PRICE_RULES,
  BRIGHTWAY_2025_CAI_CM2,
  BRIGHTWAY_2025_COST_DECIMAL_PLACES,
} from "@/lib/config/vendors/brightway-2025";
import type {
  BrightwayBoardLineInput,
  BrightwayBoardLineResult,
  BrightwayEstimateInput,
  BrightwayEstimateResult,
  BrightwayPriceRule,
} from "@/types/brightway";

function round(value: number, decimals: number): number {
  const factor = Math.pow(10, decimals);
  return Math.round(value * factor) / factor;
}

export function findBrightwayBoardPriceRule(input: Pick<BrightwayBoardLineInput, "usage" | "series" | "thicknessMm" | "edgeMode">): BrightwayPriceRule {
  const rule = BRIGHTWAY_2025_BOARD_PRICE_RULES.find((candidate) =>
    candidate.usage === input.usage &&
    candidate.series === input.series &&
    candidate.thicknessMm === input.thicknessMm &&
    candidate.edgeMode === input.edgeMode
  );

  if (!rule) {
    throw new Error(
      `Unsupported Brightway board price rule: ${input.usage}/${input.series}/${input.thicknessMm}mm/${input.edgeMode}`,
    );
  }

  return rule;
}

function calculateBoardLine(line: BrightwayBoardLineInput): BrightwayBoardLineResult {
  if (line.widthCm <= 0 || line.heightCm <= 0 || line.quantity <= 0) {
    throw new Error(`Invalid Brightway board dimensions or quantity: ${line.id}`);
  }

  const rule = findBrightwayBoardPriceRule({
    usage: line.usage,
    series: line.material.series,
    thicknessMm: line.thicknessMm,
    edgeMode: line.edgeMode,
  });
  const singleActualCai = (line.widthCm * line.heightCm) / BRIGHTWAY_2025_CAI_CM2;
  const billableSingleCai = Math.max(singleActualCai, rule.minCai);
  const billableCai = round(billableSingleCai * line.quantity, BRIGHTWAY_2025_AREA_DECIMAL_PLACES);
  const actualCai = round(singleActualCai * line.quantity, BRIGHTWAY_2025_AREA_DECIMAL_PLACES);
  const materialSubtotal = round(billableCai * rule.pricePerCai, BRIGHTWAY_2025_COST_DECIMAL_PLACES);

  return {
    id: line.id,
    name: line.name,
    material: line.material,
    usage: line.usage,
    thicknessMm: line.thicknessMm,
    edgeMode: line.edgeMode,
    widthCm: line.widthCm,
    heightCm: line.heightCm,
    quantity: line.quantity,
    actualCai,
    billableCai,
    pricePerCai: rule.pricePerCai,
    materialSubtotal,
    minCai: rule.minCai,
  };
}

export function calculateBrightwayEstimate(input: BrightwayEstimateInput): BrightwayEstimateResult {
  if (input.vendor !== "BRIGHTWAY" || input.catalogVersion !== "2025") {
    throw new Error(`Unsupported Brightway estimate version: ${input.vendor}/${input.catalogVersion}`);
  }

  const boardLines = input.boardLines.map(calculateBoardLine);
  const materialTotal = boardLines.reduce((sum, line) => sum + line.materialSubtotal, 0);
  const processingTotal = 0;

  return {
    vendor: input.vendor,
    catalogVersion: input.catalogVersion,
    name: input.name,
    boardLines,
    processes: [],
    materialTotal,
    processingTotal,
    totalCost: materialTotal + processingTotal,
  };
}
```

- [ ] **Step 2: Run tests**

Run:

```bash
npx tsx src/lib/calculations/brightway.test.ts
```

Expected: PASS with `Brightway board pricing tests passed`.

- [ ] **Step 3: Run typecheck**

Run:

```bash
npm run typecheck
```

Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add src/lib/calculations/brightway.ts src/lib/calculations/brightway.test.ts
git commit -m "feat: calculate Brightway board pricing"
```

---

### Task 5: Add Processing Pricing Tests

**Files:**
- Modify: `src/lib/calculations/brightway.test.ts`

- [ ] **Step 1: Append processing tests**

Append to the test file before the final `console.log` line, and then keep one final `console.log` at the end:

```typescript
const withProcesses = calculateBrightwayEstimate(baseInput({
  boardLines: [{
    id: "door-panel",
    name: "門片",
    material: { series: "ER", colorCode: "ER1145", materialName: "自然巴多利諾橡木" },
    usage: "DOOR",
    thicknessMm: 18,
    edgeMode: "NONE",
    widthCm: 90,
    heightCm: 40,
    quantity: 1,
  }],
  processes: [
    { id: "hinge-hole", code: "HINGE_HOLE", targetBoardLineId: "door-panel", quantity: 2 },
    { id: "g10", code: "G10_INNER_RECTANGLE", targetBoardLineId: "door-panel", quantity: 1 },
    { id: "grain", code: "GRAIN_MATCH", targetBoardLineId: "door-panel", quantity: 1 },
  ],
}));

assert.equal(withProcesses.processes.length, 3);
assert.equal(withProcesses.processes[0]?.label, "鉸鍊孔");
assert.equal(withProcesses.processes[0]?.subtotal, 80);
assert.equal(withProcesses.processes[1]?.subtotal, 720);
assert.equal(withProcesses.processes[2]?.minCai, 5);
assert.equal(withProcesses.processes[2]?.subtotal, 400);
assert.equal(withProcesses.processingTotal, 1200);
assert.equal(withProcesses.totalCost, withProcesses.materialTotal + 1200);
```

- [ ] **Step 2: Run test and verify it fails**

Run:

```bash
npx tsx src/lib/calculations/brightway.test.ts
```

Expected: FAIL because processing rows are not calculated yet.

---

### Task 6: Implement Processing Pricing

**Files:**
- Modify: `src/lib/calculations/brightway.ts`
- Test: `src/lib/calculations/brightway.test.ts`

- [ ] **Step 1: Add processing calculation to `brightway.ts`**

Modify `brightway.ts` by adding imports:

```typescript
import {
  BRIGHTWAY_2025_PROCESSING_RULES,
  // existing imports remain
} from "@/lib/config/vendors/brightway-2025";
import type {
  BrightwayProcessingInput,
  BrightwayProcessingResult,
  // existing type imports remain
} from "@/types/brightway";
```

Add these functions after `calculateBoardLine`:

```typescript
function calculateProcessing(
  process: BrightwayProcessingInput,
  boardLines: BrightwayBoardLineResult[],
): BrightwayProcessingResult {
  const rule = BRIGHTWAY_2025_PROCESSING_RULES[process.code];
  const target = boardLines.find((line) => line.id === process.targetBoardLineId);
  if (!target) {
    throw new Error(`Brightway processing target not found: ${process.targetBoardLineId}`);
  }
  if (process.quantity <= 0) {
    throw new Error(`Invalid Brightway processing quantity: ${process.id}`);
  }

  const billableQuantity = rule.unit === "才"
    ? Math.max(target.actualCai, rule.minCai ?? 0) * process.quantity
    : process.quantity;
  const roundedQuantity = round(billableQuantity, BRIGHTWAY_2025_AREA_DECIMAL_PLACES);
  const subtotal = round(roundedQuantity * rule.unitPrice, BRIGHTWAY_2025_COST_DECIMAL_PLACES);

  return {
    id: process.id,
    code: process.code,
    targetBoardLineId: process.targetBoardLineId,
    label: rule.label,
    unit: rule.unit,
    quantity: roundedQuantity,
    unitPrice: rule.unitPrice,
    minCai: rule.minCai,
    subtotal,
  };
}
```

Update `calculateBrightwayEstimate`:

```typescript
export function calculateBrightwayEstimate(input: BrightwayEstimateInput): BrightwayEstimateResult {
  if (input.vendor !== "BRIGHTWAY" || input.catalogVersion !== "2025") {
    throw new Error(`Unsupported Brightway estimate version: ${input.vendor}/${input.catalogVersion}`);
  }

  const boardLines = input.boardLines.map(calculateBoardLine);
  const processes = input.processes.map((process) => calculateProcessing(process, boardLines));
  const materialTotal = boardLines.reduce((sum, line) => sum + line.materialSubtotal, 0);
  const processingTotal = processes.reduce((sum, process) => sum + process.subtotal, 0);

  return {
    vendor: input.vendor,
    catalogVersion: input.catalogVersion,
    name: input.name,
    boardLines,
    processes,
    materialTotal,
    processingTotal,
    totalCost: materialTotal + processingTotal,
  };
}
```

- [ ] **Step 2: Run tests**

Run:

```bash
npx tsx src/lib/calculations/brightway.test.ts
```

Expected: PASS.

- [ ] **Step 3: Run typecheck**

Run:

```bash
npm run typecheck
```

Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add src/lib/calculations/brightway.ts src/lib/calculations/brightway.test.ts
git commit -m "feat: calculate Brightway processing pricing"
```

---

### Task 7: Add Summary Adapter

**Files:**
- Create: `src/lib/calculations/brightway-summary.ts`
- Create: `src/lib/calculations/brightway-summary.test.ts`

- [ ] **Step 1: Create failing summary test**

Create:

```typescript
// src/lib/calculations/brightway-summary.test.ts

import assert from "node:assert/strict";
import { calculateBrightwayEstimate } from "./brightway";
import { toBrightwayStandardEstimateRows } from "./brightway-summary";

const result = calculateBrightwayEstimate({
  vendor: "BRIGHTWAY",
  catalogVersion: "2025",
  name: "客廳",
  boardLines: [{
    id: "body-left",
    name: "左側板",
    material: { series: "ER", colorCode: "ER1145", materialName: "自然巴多利諾橡木" },
    usage: "BODY_BACK",
    thicknessMm: 18,
    edgeMode: "NONE",
    widthCm: 90,
    heightCm: 40,
    quantity: 1,
  }],
  processes: [
    { id: "hinge-hole", code: "HINGE_HOLE", targetBoardLineId: "body-left", quantity: 2 },
  ],
});

const rows = toBrightwayStandardEstimateRows(result);

assert.equal(rows.length, 2);
assert.equal(rows[0]?.kind, "material");
assert.equal(rows[0]?.itemName, "左側板");
assert.equal(rows[0]?.materialName, "ER1145 自然巴多利諾橡木");
assert.equal(rows[0]?.size, "90 x 40 cm");
assert.equal(rows[0]?.subtotal, 588);
assert.equal(rows[1]?.kind, "process");
assert.equal(rows[1]?.itemName, "鉸鍊孔");
assert.equal(rows[1]?.subtotal, 80);

console.log("Brightway summary adapter tests passed");
```

- [ ] **Step 2: Run test and verify it fails**

Run:

```bash
npx tsx src/lib/calculations/brightway-summary.test.ts
```

Expected: FAIL because `brightway-summary.ts` does not exist.

- [ ] **Step 3: Implement summary adapter**

Create:

```typescript
// src/lib/calculations/brightway-summary.ts

import type { BrightwayEstimateResult } from "@/types/brightway";

export interface BrightwayStandardEstimateRow {
  id: string;
  kind: "material" | "process";
  itemName: string;
  materialName?: string;
  size?: string;
  quantity?: number;
  unit?: string;
  unitPrice?: number;
  subtotal: number;
  note?: string;
}

function materialLabel(material: { series: string; colorCode?: string; materialName?: string }): string {
  return [material.colorCode, material.materialName].filter(Boolean).join(" ") || material.series;
}

export function toBrightwayStandardEstimateRows(result: BrightwayEstimateResult): BrightwayStandardEstimateRow[] {
  const rows: BrightwayStandardEstimateRow[] = [];

  for (const line of result.boardLines) {
    rows.push({
      id: line.id,
      kind: "material",
      itemName: line.name,
      materialName: materialLabel(line.material),
      size: `${line.widthCm} x ${line.heightCm} cm`,
      quantity: line.quantity,
      unit: "才",
      unitPrice: line.pricePerCai,
      subtotal: line.materialSubtotal,
      note: `${line.thicknessMm}mm / ${line.edgeMode} / 計價 ${line.billableCai}才`,
    });

    for (const process of result.processes.filter((candidate) => candidate.targetBoardLineId === line.id)) {
      rows.push({
        id: process.id,
        kind: "process",
        itemName: process.label,
        quantity: process.quantity,
        unit: process.unit,
        unitPrice: process.unitPrice,
        subtotal: process.subtotal,
        note: process.minCai ? `基本才 ${process.minCai}` : undefined,
      });
    }
  }

  return rows;
}
```

- [ ] **Step 4: Run tests**

Run:

```bash
npx tsx src/lib/calculations/brightway-summary.test.ts
```

Expected: PASS.

- [ ] **Step 5: Run all Brightway tests**

Run:

```bash
npx tsx src/lib/calculations/brightway.test.ts
npx tsx src/lib/calculations/brightway-summary.test.ts
npm run typecheck
```

Expected: all PASS.

- [ ] **Step 6: Commit**

```bash
git add src/lib/calculations/brightway-summary.ts src/lib/calculations/brightway-summary.test.ts
git commit -m "feat: adapt Brightway results for summaries"
```

---

### Task 8: Add Developer Documentation

**Files:**
- Create: `docs/brightway-2025-engine-notes.md`

- [ ] **Step 1: Create engine notes**

Create:

```markdown
# Brightway 2025 Engine Notes

## Scope

This engine currently supports:

- PDF page 24 board price table.
- PDF page 25 board processing price table.
- Pure calculation only.
- No UI, DB schema, PDF layout, or full catalog import.

## Pricing Source

Use PDF actual page numbers:

- Page 24: 板材價目表
- Page 25: 板材加工價目表

## Key Rules

- Board price is selected by usage, series, thickness, and edge mode.
- Actual cai = widthCm * heightCm / 918.09.
- Billable cai = max(actual single cai, minCai) * quantity.
- Processing rows with unit `才` use max(target actual cai, processing minCai).
- Processing rows with unit `孔`, `式`, `片`, or `10mm` use explicit quantity.

## Known Gaps

- Specification-page color thickness support is not imported yet.
- Hinges, rails, drawers, aluminum frames, lighting, and accessories are not included.
- OCR text from the PDF must be manually checked before production use.
- UI must prevent unsupported combinations before calling the engine.

## Verification

Run:

```bash
npx tsx src/lib/calculations/brightway.test.ts
npx tsx src/lib/calculations/brightway-summary.test.ts
npm run typecheck
```
```

- [ ] **Step 2: Commit**

```bash
git add docs/brightway-2025-engine-notes.md
git commit -m "docs: document Brightway engine scope"
```

---

## Acceptance Criteria

The Brightway calculation engine foundation is complete when:

- `src/types/brightway.ts` exists and compiles.
- `src/lib/config/vendors/brightway-2025.ts` contains page 24 board prices and page 25 processing prices.
- `calculateBrightwayEstimate()` calculates material totals and processing totals.
- Unsupported series/thickness/usage/edge combinations throw explicit errors.
- Brightway results can be converted to standard rows.
- These commands pass:

```bash
npx tsx src/lib/calculations/brightway.test.ts
npx tsx src/lib/calculations/brightway-summary.test.ts
npm run typecheck
```

## Later Follow-Up Plans

Create separate plans for:

- Brightway UI route and forms.
- Brightway project save/update server actions.
- Brightway PDF export.
- Brightway material color/thickness data import from specification pages.
- Brightway five-hardware catalog import.
- Brightway door/aluminum frame catalog import.

Keeping these separate prevents the first engine milestone from becoming a full catalog migration project.
