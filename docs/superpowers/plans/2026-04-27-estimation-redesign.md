# Estimation Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 重建材料模型（品牌×色號×類型）、加入 minCai 最低才數規則、add-on 加購費用、統整才數顯示。

**Architecture:** Prisma schema 擴充新欄位 → 計算引擎加入 billableCai + addon 疊加 → 材料管理頁面三欄式重建 → 專案頁新增統整才數面板。

**Tech Stack:** Next.js 15 App Router, TypeScript strict, Prisma 5 + Neon PostgreSQL, React Hook Form, Zod, Tailwind + shadcn/ui

---

## 檔案異動總覽

**修改：**
- `prisma/schema.prisma` — enum 重建 + Material 加欄位
- `prisma/seed.ts` — 替換為牌價表資料
- `src/lib/config/units.ts` — BOARD_TYPES + ADDON_PRICES
- `src/types/cabinet.ts` — MaterialRef(minCai) + UnitAddons + DoorAddons
- `src/lib/calculations/cabinet.ts` — billableCai + addon 計算
- `src/lib/validations/cabinet.ts` — Zod schema 同步
- `src/lib/actions/materials.ts` — CRUD 支援新欄位
- `src/app/api/materials/route.ts` — 回傳 minCai
- `src/components/shared/MaterialDropdown.tsx` — 傳入 minCai + 新 category label
- `src/components/cabinet/CabinetUnitForm.tsx` — 加入 UnitAddonsForm
- `src/components/cabinet/DoorForm.tsx` — 加入 door add-on 選項
- `src/components/cabinet/CabinetResultPanel.tsx` — 費用分類顯示
- `src/components/cabinet/CabinetUnitList.tsx` — 加入 MaterialSummaryPanel
- `src/app/(dashboard)/materials/MaterialsClient.tsx` — 三欄式重建

**新增：**
- `src/components/materials/BrandSidebar.tsx`
- `src/components/materials/MaterialItemList.tsx`
- `src/components/materials/MaterialEditForm.tsx`
- `src/components/cabinet/UnitAddonsForm.tsx`
- `src/components/cabinet/MaterialSummaryPanel.tsx`

---

## Task 1: Prisma Schema 更新

**Files:**
- Modify: `prisma/schema.prisma`

- [ ] **Step 1: 更新 schema**

將 `prisma/schema.prisma` 完整替換為：

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

enum MaterialCategory {
  BOARD_BODY
  BOARD_BACKING
  BOARD_DOOR
  HARDWARE_HINGE
  HARDWARE_HANDLE
  HARDWARE_RAIL
  HARDWARE_OTHER
  CEILING_BOARD
  ANGLE_MATERIAL
  OTHER
}

enum ModuleType {
  CABINET
  CEILING
  FLOOR
  PAINT
}

model User {
  id        String   @id @default(cuid())
  name      String
  email     String   @unique
  password  String?
  provider  String?
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  projects EstimateProject[]

  @@map("users")
}

model Material {
  id               String           @id @default(cuid())
  category         MaterialCategory
  brand            String?
  colorCode        String?
  surfaceTreatment String?
  boardType        String?
  name             String
  spec             String?
  unit             String
  price            Decimal          @db.Decimal(10, 2)
  minCai           Decimal?         @db.Decimal(6, 2)
  wasteRate        Decimal          @default(0) @db.Decimal(5, 4)
  isActive         Boolean          @default(true)
  sortOrder        Int              @default(0)
  createdAt        DateTime         @default(now())
  updatedAt        DateTime         @updatedAt

  @@index([category])
  @@index([brand])
  @@index([isActive])
  @@map("materials")
}

model EstimateProject {
  id         String   @id @default(cuid())
  userId     String
  name       String
  clientName String?
  notes      String?
  createdAt  DateTime @default(now())
  updatedAt  DateTime @updatedAt

  user  User           @relation(fields: [userId], references: [id], onDelete: Cascade)
  items EstimateItem[]

  @@index([userId])
  @@map("estimate_projects")
}

model EstimateItem {
  id         String     @id @default(cuid())
  projectId  String
  moduleType ModuleType
  label      String?
  sortOrder  Int        @default(0)
  inputData  Json
  resultData Json
  totalCost  Decimal    @db.Decimal(12, 2)
  createdAt  DateTime   @default(now())
  updatedAt  DateTime   @updatedAt

  project EstimateProject @relation(fields: [projectId], references: [id], onDelete: Cascade)

  @@index([projectId])
  @@index([moduleType])
  @@map("estimate_items")
}
```

- [ ] **Step 2: 同步到資料庫**

```bash
npm run db:push
```

Expected: Schema synced. Prisma Client 自動重新生成。

- [ ] **Step 3: Commit**

```bash
git add prisma/schema.prisma
git commit -m "feat: extend Material schema with brand/colorCode/boardType/minCai"
```

---

## Task 2: 常數更新

**Files:**
- Modify: `src/lib/config/units.ts`

- [ ] **Step 1: 新增常數**

將 `src/lib/config/units.ts` 替換為：

```typescript
export const UNIT_CONFIG = {
  CAI_CM2: 918.09,
  HINGE_SPACING_CM: 60,
  MIN_HINGES_PER_DOOR: 2,
  SLIDING_RAIL_UNIT: "尺" as const,
  CM_PER_TAI_CHI: 30.3,
  CEILING_ANGLE_PER_PING: 12,
  CEILING_BOARD_PER_PING: 2,
  CEILING_PERIMETER_ANGLE_LENGTH_CM: 243.84,
  PING_TO_M2: 3.30579,
  AREA_DECIMAL_PLACES: 4,
  COST_DECIMAL_PLACES: 0,
} as const;

export const BOARD_TYPES = [
  "8mm背板不封邊",
  "18mm櫃體封PVC",
  "18mm 4E門板封ABS",
  "18mm 4E H型 5mm清玻門",
  "18mm 4E框型 5mm清玻門",
  "18mm 4E框型肚板門",
  "18mm 4E框鐵網門",
  "25mm封ABS",
] as const;

export type BoardType = (typeof BOARD_TYPES)[number];

export const ADDON_PRICES = {
  FRONT_EDGE_ABS_ONE_LONG: 5,
  FRONT_EDGE_ABS_TWO_LONG: 10,
  DOUBLE_DRILL_HOLES: 5,
  NON_STANDARD_HOLES: 5,
  PATTERN_MATCH_GRAIN: 1.2,
  TEMPERED_GLASS: 50,
  HINGE_HOLE_DRILLING: 5,
} as const;

export type UnitConfig = typeof UNIT_CONFIG;
```

- [ ] **Step 2: 型別檢查**

```bash
npm run typecheck
```

Expected: 無錯誤（此步驟只新增常數）。

- [ ] **Step 3: Commit**

```bash
git add src/lib/config/units.ts
git commit -m "feat: add BOARD_TYPES and ADDON_PRICES constants"
```

---

## Task 3: TypeScript 型別更新

**Files:**
- Modify: `src/types/cabinet.ts`

- [ ] **Step 1: 更新型別**

將 `src/types/cabinet.ts` 替換為：

```typescript
// src/types/cabinet.ts

export interface AreaMeasure {
  cm2: number;
  m2: number;
  cai: number;
}

export interface MaterialRef {
  materialId: string;
  materialName: string;
  unit: string;
  pricePerUnit: number;
  minCai: number | null;
}

export type DoorType = "HINGED" | "SLIDING";

export interface UnitAddons {
  frontEdgeABS: "none" | "one_long" | "two_long";
  doubleDrillHoles: boolean;
  nonStandardHoles: boolean;
}

export interface DoorAddons {
  patternMatch: "none" | "grain";
  temperedGlass: boolean;
  hingeHoleDrilling: boolean;
}

export const DEFAULT_UNIT_ADDONS: UnitAddons = {
  frontEdgeABS: "none",
  doubleDrillHoles: false,
  nonStandardHoles: false,
};

export const DEFAULT_DOOR_ADDONS: DoorAddons = {
  patternMatch: "none",
  temperedGlass: false,
  hingeHoleDrilling: false,
};

export interface DoorInput {
  id: string;
  type: DoorType;
  name: string;
  widthCm: number;
  heightCm: number;
  quantity: number;
  materialRef: MaterialRef | null;
  addons: DoorAddons;
  hingeMaterialRef?: MaterialRef | null;
  railMaterialRef?: MaterialRef | null;
}

export interface MiddleDividerInput {
  id: string;
  widthCm: number;
  heightCm: number;
  quantity: number;
  materialRef: MaterialRef | null;
}

export interface ShelfInput {
  id: string;
  widthCm: number;
  depthCm: number;
  quantity: number;
  materialRef: MaterialRef | null;
}

export interface KickPlateInput {
  widthCm: number;
  heightCm: number;
  materialRef: MaterialRef | null;
}

export interface CabinetUnitInput {
  id: string;
  name: string;
  widthCm: number;
  depthCm: number;
  heightCm: number;
  quantity: number;
  hasBackPanel: boolean;
  panelMaterialRef: MaterialRef | null;
  backPanelMaterialRef: MaterialRef | null;
  addons: UnitAddons;
  middleDividers: MiddleDividerInput[];
  shelves: ShelfInput[];
  doors: DoorInput[];
  kickPlate: KickPlateInput | null;
}

export interface PanelResult {
  id: string;
  name: string;
  widthCm: number;
  heightCm: number;
  quantity: number;
  singleArea: AreaMeasure;
  totalArea: AreaMeasure;
  billableTotalArea: AreaMeasure;
  materialRef: MaterialRef | null;
  unitCost: number;
  subtotal: number;
  addonsCost: number;
  isAutoGenerated: boolean;
}

export interface DoorResult {
  id: string;
  type: DoorType;
  name: string;
  widthCm: number;
  heightCm: number;
  quantity: number;
  singleArea: AreaMeasure;
  totalArea: AreaMeasure;
  billableTotalArea: AreaMeasure;
  materialRef: MaterialRef | null;
  subtotal: number;
  addonsCost: number;
}

export interface HardwareResult {
  id: string;
  name: string;
  description: string;
  quantity: number;
  materialRef: MaterialRef | null;
  unitCost: number;
  subtotal: number;
}

export interface AccessoryResult {
  id: string;
  name: string;
  widthCm: number;
  heightCm: number;
  quantity: number;
  singleArea: AreaMeasure;
  totalArea: AreaMeasure;
  materialRef: MaterialRef | null;
  subtotal: number;
}

export interface AddonsBreakdown {
  frontEdgeABS: number;
  doubleDrillHoles: number;
  patternMatch: number;
  temperedGlass: number;
  hingeHoleDrilling: number;
}

export interface CabinetUnitSummary {
  totalAreaCm2: number;
  totalAreaM2: number;
  totalAreaCai: number;
  panelsCost: number;
  internalPartsCost: number;
  doorsCost: number;
  hardwareCost: number;
  accessoriesCost: number;
  addonsCost: number;
  addonsBreakdown: AddonsBreakdown;
  totalCost: number;
}

export interface CabinetUnitResult {
  unitId: string;
  unitName: string;
  quantity: number;
  panels: PanelResult[];
  internalParts: PanelResult[];
  doors: DoorResult[];
  hardware: HardwareResult[];
  accessories: AccessoryResult[];
  summary: CabinetUnitSummary;
}

export interface CabinetProjectResult {
  unitResults: CabinetUnitResult[];
  projectTotal: number;
}
```

- [ ] **Step 2: 型別檢查（預期有錯誤，計算引擎尚未更新）**

```bash
npm run typecheck 2>&1 | head -40
```

Expected: 錯誤集中在 `calculations/cabinet.ts`，因為 `PanelResult` 型別已改。

- [ ] **Step 3: Commit**

```bash
git add src/types/cabinet.ts
git commit -m "feat: add UnitAddons, DoorAddons, minCai to cabinet types"
```

---

## Task 4: 計算引擎更新

**Files:**
- Modify: `src/lib/calculations/cabinet.ts`

- [ ] **Step 1: 完整替換計算引擎**

將 `src/lib/calculations/cabinet.ts` 替換為：

```typescript
// src/lib/calculations/cabinet.ts
import { UNIT_CONFIG, ADDON_PRICES } from "../config/units";
import type {
  AreaMeasure, CabinetUnitInput, CabinetUnitResult, CabinetUnitSummary,
  DoorResult, HardwareResult, MaterialRef, PanelResult, AccessoryResult,
  CabinetProjectResult, UnitAddons, AddonsBreakdown,
} from "../../types";

function round(n: number, decimals: number): number {
  const factor = Math.pow(10, decimals);
  return Math.round(n * factor) / factor;
}

function toAreaMeasure(cm2: number): AreaMeasure {
  const d = UNIT_CONFIG.AREA_DECIMAL_PLACES;
  return {
    cm2: round(cm2, d),
    m2: round(cm2 / 10_000, d),
    cai: round(cm2 / UNIT_CONFIG.CAI_CM2, d),
  };
}

function toBillableAreaMeasure(singleCm2: number, minCai: number | null, quantity: number): AreaMeasure {
  const singleActualCai = singleCm2 / UNIT_CONFIG.CAI_CM2;
  const billableSingleCai = Math.max(singleActualCai, minCai ?? 0);
  const billableTotalCai = billableSingleCai * quantity;
  const d = UNIT_CONFIG.AREA_DECIMAL_PLACES;
  return {
    cai: round(billableTotalCai, d),
    cm2: round(billableTotalCai * UNIT_CONFIG.CAI_CM2, d),
    m2: round(billableTotalCai * UNIT_CONFIG.CAI_CM2 / 10_000, d),
  };
}

function calcFrontEdgeAddon(frontEdgeABS: UnitAddons["frontEdgeABS"]): number {
  if (frontEdgeABS === "one_long") return ADDON_PRICES.FRONT_EDGE_ABS_ONE_LONG;
  if (frontEdgeABS === "two_long") return ADDON_PRICES.FRONT_EDGE_ABS_TWO_LONG;
  return 0;
}

function buildPanelResult(params: {
  id: string;
  name: string;
  widthCm: number;
  heightCm: number;
  quantity: number;
  materialRef: MaterialRef | null;
  isAutoGenerated: boolean;
  addonPricePerCai?: number;
}): PanelResult {
  const { id, name, widthCm, heightCm, quantity, materialRef, isAutoGenerated, addonPricePerCai = 0 } = params;
  const singleCm2 = widthCm * heightCm;
  const singleArea = toAreaMeasure(singleCm2);
  const totalArea = toAreaMeasure(singleCm2 * quantity);
  const billableTotalArea = toBillableAreaMeasure(singleCm2, materialRef?.minCai ?? null, quantity);

  let subtotal = 0;
  let addonsCost = 0;

  if (materialRef && materialRef.unit === "才") {
    const billableCai = billableTotalArea.cai;
    subtotal = round(billableCai * (materialRef.pricePerUnit + addonPricePerCai), UNIT_CONFIG.COST_DECIMAL_PLACES);
    addonsCost = round(billableCai * addonPricePerCai, UNIT_CONFIG.COST_DECIMAL_PLACES);
  } else if (materialRef && materialRef.unit === "m²") {
    subtotal = round(totalArea.m2 * materialRef.pricePerUnit, UNIT_CONFIG.COST_DECIMAL_PLACES);
    addonsCost = 0;
  }

  return {
    id, name, widthCm, heightCm, quantity,
    singleArea, totalArea, billableTotalArea,
    materialRef,
    unitCost: materialRef?.pricePerUnit ?? 0,
    subtotal, addonsCost,
    isAutoGenerated,
  };
}

function generateFixedPanels(input: CabinetUnitInput, unitQty: number): PanelResult[] {
  const { id, widthCm, depthCm, heightCm, panelMaterialRef, backPanelMaterialRef, hasBackPanel, addons } = input;
  const frontEdgeAddon = calcFrontEdgeAddon(addons.frontEdgeABS);

  const panels: PanelResult[] = [
    buildPanelResult({ id: `${id}-left`,   name: "左側板", widthCm: heightCm, heightCm: depthCm, quantity: unitQty, materialRef: panelMaterialRef, isAutoGenerated: true, addonPricePerCai: frontEdgeAddon }),
    buildPanelResult({ id: `${id}-right`,  name: "右側板", widthCm: heightCm, heightCm: depthCm, quantity: unitQty, materialRef: panelMaterialRef, isAutoGenerated: true, addonPricePerCai: frontEdgeAddon }),
    buildPanelResult({ id: `${id}-top`,    name: "頂板",   widthCm,           heightCm: depthCm, quantity: unitQty, materialRef: panelMaterialRef, isAutoGenerated: true, addonPricePerCai: frontEdgeAddon }),
    buildPanelResult({ id: `${id}-bottom`, name: "底板",   widthCm,           heightCm: depthCm, quantity: unitQty, materialRef: panelMaterialRef, isAutoGenerated: true, addonPricePerCai: frontEdgeAddon }),
  ];

  if (hasBackPanel) {
    panels.push(
      buildPanelResult({ id: `${id}-back`, name: "背板", widthCm, heightCm, quantity: unitQty, materialRef: backPanelMaterialRef, isAutoGenerated: true, addonPricePerCai: 0 })
    );
  }
  return panels;
}

function generateInternalParts(input: CabinetUnitInput, unitQty: number): PanelResult[] {
  const parts: PanelResult[] = [];
  const { addons } = input;
  const frontEdgeAddon = calcFrontEdgeAddon(addons.frontEdgeABS);
  const drillAddon = addons.doubleDrillHoles ? ADDON_PRICES.DOUBLE_DRILL_HOLES : 0;
  const nonStdAddon = (addons.doubleDrillHoles && addons.nonStandardHoles) ? ADDON_PRICES.NON_STANDARD_HOLES : 0;

  for (const d of input.middleDividers) {
    parts.push(buildPanelResult({
      id: d.id, name: "中隔板",
      widthCm: d.widthCm, heightCm: d.heightCm,
      quantity: d.quantity * unitQty,
      materialRef: d.materialRef, isAutoGenerated: false,
      addonPricePerCai: frontEdgeAddon + drillAddon + nonStdAddon,
    }));
  }

  for (const s of input.shelves) {
    parts.push(buildPanelResult({
      id: s.id, name: "層板",
      widthCm: s.widthCm, heightCm: s.depthCm,
      quantity: s.quantity * unitQty,
      materialRef: s.materialRef, isAutoGenerated: false,
      addonPricePerCai: frontEdgeAddon,
    }));
  }
  return parts;
}

function calculateDoors(
  input: CabinetUnitInput,
  unitQty: number
): { doors: DoorResult[]; hardware: HardwareResult[]; addonsBreakdown: Pick<AddonsBreakdown, "patternMatch" | "temperedGlass" | "hingeHoleDrilling"> } {
  const doors: DoorResult[] = [];
  const hardware: HardwareResult[] = [];
  let patternMatchTotal = 0;
  let temperedGlassTotal = 0;
  let hingeHoleDrillingTotal = 0;

  for (const door of input.doors) {
    const totalQty = door.quantity * unitQty;
    const singleCm2 = door.widthCm * door.heightCm;
    const singleArea = toAreaMeasure(singleCm2);
    const totalArea = toAreaMeasure(singleCm2 * totalQty);
    const billableTotalArea = toBillableAreaMeasure(singleCm2, door.materialRef?.minCai ?? null, totalQty);
    const billableCai = billableTotalArea.cai;
    const addons = door.addons;

    const patternMultiplier = addons.patternMatch === "grain" ? ADDON_PRICES.PATTERN_MATCH_GRAIN : 1;
    const glassAddon = addons.temperedGlass ? ADDON_PRICES.TEMPERED_GLASS : 0;
    const basePrice = door.materialRef?.pricePerUnit ?? 0;

    let subtotal = 0;
    let addonsCost = 0;

    const hingesPerDoor = Math.max(
      UNIT_CONFIG.MIN_HINGES_PER_DOOR,
      Math.ceil(door.heightCm / UNIT_CONFIG.HINGE_SPACING_CM)
    );

    if (door.materialRef && door.materialRef.unit === "才") {
      const baseCost = round(billableCai * basePrice * patternMultiplier, UNIT_CONFIG.COST_DECIMAL_PLACES);
      const glassCost = round(billableCai * glassAddon, UNIT_CONFIG.COST_DECIMAL_PLACES);
      const hingeHoleCost = (addons.hingeHoleDrilling && door.type === "HINGED")
        ? hingesPerDoor * totalQty * ADDON_PRICES.HINGE_HOLE_DRILLING
        : 0;

      const patternSurcharge = round(billableCai * basePrice * (patternMultiplier - 1), UNIT_CONFIG.COST_DECIMAL_PLACES);
      addonsCost = patternSurcharge + glassCost + hingeHoleCost;
      subtotal = baseCost + glassCost + hingeHoleCost;

      patternMatchTotal += patternSurcharge;
      temperedGlassTotal += glassCost;
      hingeHoleDrillingTotal += hingeHoleCost;
    }

    doors.push({
      id: door.id,
      type: door.type,
      name: door.name || (door.type === "HINGED" ? "鉸鏈門" : "滑門"),
      widthCm: door.widthCm,
      heightCm: door.heightCm,
      quantity: totalQty,
      singleArea, totalArea, billableTotalArea,
      materialRef: door.materialRef,
      subtotal, addonsCost,
    });

    if (door.type === "HINGED") {
      const totalHinges = hingesPerDoor * totalQty;
      const hingeRef = door.hingeMaterialRef ?? null;
      hardware.push({
        id: `${door.id}-hinge`,
        name: "鉸鏈",
        description: `門高 ${door.heightCm}cm → 每扇 ${hingesPerDoor} 個 × ${totalQty} 扇`,
        quantity: totalHinges,
        materialRef: hingeRef,
        unitCost: hingeRef?.pricePerUnit ?? 0,
        subtotal: hingeRef ? round(totalHinges * hingeRef.pricePerUnit, UNIT_CONFIG.COST_DECIMAL_PLACES) : 0,
      });
    }

    if (door.type === "SLIDING") {
      const widthChi = round(input.widthCm / UNIT_CONFIG.CM_PER_TAI_CHI, 2);
      const railRef = door.railMaterialRef ?? null;
      const railPrice = railRef?.pricePerUnit ?? 0;
      hardware.push({
        id: `${door.id}-rail-top`, name: "上滑軌",
        description: `桶身寬 ${input.widthCm}cm ≈ ${widthChi} 尺 × ${unitQty} 組`,
        quantity: unitQty, materialRef: railRef,
        unitCost: round(widthChi * railPrice, UNIT_CONFIG.COST_DECIMAL_PLACES),
        subtotal: round(widthChi * railPrice * unitQty, UNIT_CONFIG.COST_DECIMAL_PLACES),
      });
      hardware.push({
        id: `${door.id}-rail-bottom`, name: "下滑軌",
        description: `桶身寬 ${input.widthCm}cm ≈ ${widthChi} 尺 × ${unitQty} 組`,
        quantity: unitQty, materialRef: railRef,
        unitCost: round(widthChi * railPrice, UNIT_CONFIG.COST_DECIMAL_PLACES),
        subtotal: round(widthChi * railPrice * unitQty, UNIT_CONFIG.COST_DECIMAL_PLACES),
      });
    }
  }

  return {
    doors, hardware,
    addonsBreakdown: {
      patternMatch: patternMatchTotal,
      temperedGlass: temperedGlassTotal,
      hingeHoleDrilling: hingeHoleDrillingTotal,
    },
  };
}

function calculateAccessories(input: CabinetUnitInput, unitQty: number): AccessoryResult[] {
  const accessories: AccessoryResult[] = [];
  if (input.kickPlate) {
    const { widthCm, heightCm, materialRef } = input.kickPlate;
    const singleArea = toAreaMeasure(widthCm * heightCm);
    const totalArea = toAreaMeasure(widthCm * heightCm * unitQty);
    const billableTotalArea = toBillableAreaMeasure(widthCm * heightCm, materialRef?.minCai ?? null, unitQty);
    const subtotal = materialRef && materialRef.unit === "才"
      ? round(billableTotalArea.cai * materialRef.pricePerUnit, UNIT_CONFIG.COST_DECIMAL_PLACES)
      : 0;
    accessories.push({
      id: `${input.id}-kickplate`, name: "踢腳板",
      widthCm, heightCm, quantity: unitQty,
      singleArea, totalArea, materialRef, subtotal,
    });
  }
  return accessories;
}

function buildSummary(
  panels: PanelResult[],
  internalParts: PanelResult[],
  doors: DoorResult[],
  hardware: HardwareResult[],
  accessories: AccessoryResult[],
  doorAddonsBreakdown: Pick<AddonsBreakdown, "patternMatch" | "temperedGlass" | "hingeHoleDrilling">,
  unitAddons: UnitAddons,
  allPanels: PanelResult[]
): CabinetUnitSummary {
  const totalAreaCm2 = allPanels.reduce((acc, p) => acc + p.totalArea.cm2, 0);
  const panelsCost = panels.reduce((acc, p) => acc + p.subtotal - p.addonsCost, 0);
  const internalPartsCost = internalParts.reduce((acc, p) => acc + p.subtotal - p.addonsCost, 0);
  const doorsCost = doors.reduce((acc, d) => acc + d.subtotal - d.addonsCost, 0);
  const hardwareCost = hardware.reduce((acc, h) => acc + h.subtotal, 0);
  const accessoriesCost = accessories.reduce((acc, a) => acc + a.subtotal, 0);

  const frontEdgeABSCost = [...panels, ...internalParts].reduce((acc, p) => acc + p.addonsCost, 0);
  // separate frontEdgeABS from drillHoles by recalculating
  const frontEdgeAddonPerCai = calcFrontEdgeAddon(unitAddons.frontEdgeABS);
  const drillAddonPerCai = (unitAddons.doubleDrillHoles ? ADDON_PRICES.DOUBLE_DRILL_HOLES : 0) +
    (unitAddons.doubleDrillHoles && unitAddons.nonStandardHoles ? ADDON_PRICES.NON_STANDARD_HOLES : 0);

  const frontEdgeOnlyRatio = drillAddonPerCai > 0 && frontEdgeAddonPerCai > 0
    ? frontEdgeAddonPerCai / (frontEdgeAddonPerCai + drillAddonPerCai)
    : 1;

  const frontEdgeABSBreakdown = round(frontEdgeABSCost * frontEdgeOnlyRatio, 0);
  const drillHolesBreakdown = frontEdgeABSCost - frontEdgeABSBreakdown;

  const addonsCost = frontEdgeABSCost + doors.reduce((acc, d) => acc + d.addonsCost, 0);

  return {
    totalAreaCm2: round(totalAreaCm2, 2),
    totalAreaM2: round(totalAreaCm2 / 10_000, 4),
    totalAreaCai: round(totalAreaCm2 / UNIT_CONFIG.CAI_CM2, 4),
    panelsCost: round(panelsCost, 0),
    internalPartsCost: round(internalPartsCost, 0),
    doorsCost: round(doorsCost, 0),
    hardwareCost: round(hardwareCost, 0),
    accessoriesCost: round(accessoriesCost, 0),
    addonsCost: round(addonsCost, 0),
    addonsBreakdown: {
      frontEdgeABS: round(frontEdgeABSBreakdown, 0),
      doubleDrillHoles: round(drillHolesBreakdown, 0),
      ...doorAddonsBreakdown,
    },
    totalCost: round(panelsCost + internalPartsCost + doorsCost + hardwareCost + accessoriesCost + addonsCost, 0),
  };
}

export function calculateCabinetUnit(input: CabinetUnitInput): CabinetUnitResult {
  const unitQty = input.quantity;
  const panels = generateFixedPanels(input, unitQty);
  const internalParts = generateInternalParts(input, unitQty);
  const { doors, hardware, addonsBreakdown: doorAddonsBreakdown } = calculateDoors(input, unitQty);
  const accessories = calculateAccessories(input, unitQty);
  const allPanels = [...panels, ...internalParts];
  const summary = buildSummary(panels, internalParts, doors, hardware, accessories, doorAddonsBreakdown, input.addons, allPanels);

  return { unitId: input.id, unitName: input.name, quantity: unitQty, panels, internalParts, doors, hardware, accessories, summary };
}

export function calculateCabinetProject(units: CabinetUnitInput[]): CabinetProjectResult {
  const unitResults = units.map(calculateCabinetUnit);
  return {
    unitResults,
    projectTotal: unitResults.reduce((acc, r) => acc + r.summary.totalCost, 0),
  };
}
```

- [ ] **Step 2: 型別檢查**

```bash
npm run typecheck 2>&1 | grep -v "node_modules"
```

Expected: 錯誤剩下 validations/cabinet.ts 和 UI 元件（還未更新）。

- [ ] **Step 3: Commit**

```bash
git add src/lib/calculations/cabinet.ts
git commit -m "feat: add minCai billing and addon cost calculation to cabinet engine"
```

---

## Task 5: Zod 驗證更新

**Files:**
- Modify: `src/lib/validations/cabinet.ts`

- [ ] **Step 1: 更新驗證 schema**

將 `src/lib/validations/cabinet.ts` 替換為：

```typescript
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
  doubleDrillHoles: z.boolean(),
  nonStandardHoles: z.boolean(),
});

export const doorAddonsSchema = z.object({
  patternMatch: z.enum(["none", "grain"]),
  temperedGlass: z.boolean(),
  hingeHoleDrilling: z.boolean(),
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
});

export const middleDividerSchema = z.object({
  id: z.string().min(1),
  widthCm: z.number().positive("寬度必須大於 0"),
  heightCm: z.number().positive("高度必須大於 0"),
  quantity: z.number().int().positive("數量必須大於 0"),
  materialRef: materialRefSchema,
});

export const shelfSchema = z.object({
  id: z.string().min(1),
  widthCm: z.number().positive("寬度必須大於 0"),
  depthCm: z.number().positive("深度必須大於 0"),
  quantity: z.number().int().positive("數量必須大於 0"),
  materialRef: materialRefSchema,
});

export const kickPlateSchema = z.object({
  widthCm: z.number().positive("寬度必須大於 0"),
  heightCm: z.number().positive("高度必須大於 0"),
  materialRef: materialRefSchema,
}).nullable();

export const cabinetUnitInputSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1, "桶身名稱不能為空"),
  widthCm: z.number().positive("寬度必須大於 0").max(500),
  depthCm: z.number().positive("深度必須大於 0").max(200),
  heightCm: z.number().positive("高度必須大於 0").max(300),
  quantity: z.number().int().positive("數量必須大於 0").max(20),
  hasBackPanel: z.boolean(),
  panelMaterialRef: materialRefSchema,
  backPanelMaterialRef: materialRefSchema,
  addons: unitAddonsSchema,
  middleDividers: z.array(middleDividerSchema),
  shelves: z.array(shelfSchema),
  doors: z.array(doorInputSchema),
  kickPlate: kickPlateSchema,
});

export const cabinetProjectInputSchema = z.object({
  projectId: z.string().min(1),
  label: z.string().optional(),
  units: z.array(cabinetUnitInputSchema).min(1, "至少需要一個桶身"),
});

export type CabinetProjectInputDTO = z.infer<typeof cabinetProjectInputSchema>;
```

- [ ] **Step 2: 型別檢查**

```bash
npm run typecheck 2>&1 | grep -v "node_modules"
```

Expected: 錯誤剩下 UI 元件（DoorForm / CabinetUnitForm 的 emptyDoor 缺少 addons 欄位）。

- [ ] **Step 3: Commit**

```bash
git add src/lib/validations/cabinet.ts
git commit -m "feat: update cabinet Zod schemas for addons and minCai"
```

---

## Task 6: Materials API + Actions 更新

**Files:**
- Modify: `src/app/api/materials/route.ts`
- Modify: `src/lib/actions/materials.ts`

- [ ] **Step 1: 更新 API route**

將 `src/app/api/materials/route.ts` 替換為：

```typescript
// src/app/api/materials/route.ts
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { MaterialCategory } from "@prisma/client";

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const category = searchParams.get("category") as MaterialCategory | null;
  const brand = searchParams.get("brand");

  const materials = await prisma.material.findMany({
    where: {
      isActive: true,
      ...(category && Object.values(MaterialCategory).includes(category) ? { category } : {}),
      ...(brand ? { brand } : {}),
    },
    orderBy: [{ category: "asc" }, { brand: "asc" }, { colorCode: "asc" }, { sortOrder: "asc" }],
  });

  const result = materials.map((m) => ({
    ...m,
    price: Number(m.price),
    wasteRate: Number(m.wasteRate),
    minCai: m.minCai !== null ? Number(m.minCai) : null,
  }));
  return NextResponse.json(result);
}
```

- [ ] **Step 2: 更新 materials actions**

將 `src/lib/actions/materials.ts` 替換為：

```typescript
// src/lib/actions/materials.ts
"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { z } from "zod";
import { MaterialCategory } from "@prisma/client";

async function requireUserId(): Promise<string> {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  return session.user.id;
}

const materialSchema = z.object({
  category: z.nativeEnum(MaterialCategory),
  brand: z.string().max(50).optional().nullable(),
  colorCode: z.string().max(50).optional().nullable(),
  surfaceTreatment: z.string().max(50).optional().nullable(),
  boardType: z.string().max(100).optional().nullable(),
  name: z.string().min(1, "名稱不能為空").max(200),
  spec: z.string().max(200).optional().nullable(),
  unit: z.string().min(1, "單位不能為空").max(20),
  price: z.coerce.number().positive("價格必須大於 0"),
  minCai: z.coerce.number().positive().optional().nullable(),
  wasteRate: z.coerce.number().min(0).max(1).default(0),
});

export async function getMaterials(category?: MaterialCategory) {
  await requireUserId();
  return prisma.material.findMany({
    where: { isActive: true, ...(category ? { category } : {}) },
    orderBy: [{ category: "asc" }, { brand: "asc" }, { colorCode: "asc" }, { sortOrder: "asc" }],
  });
}

export async function getMaterialsByBrand() {
  await requireUserId();
  const materials = await prisma.material.findMany({
    where: { isActive: true },
    orderBy: [{ category: "asc" }, { brand: "asc" }, { colorCode: "asc" }],
  });

  // Group: category → brand → items
  type GroupedResult = Record<string, Record<string, typeof materials>>;
  return materials.reduce<GroupedResult>((acc, m) => {
    const cat = m.category;
    const brand = m.brand ?? "(無品牌)";
    if (!acc[cat]) acc[cat] = {};
    if (!acc[cat][brand]) acc[cat][brand] = [];
    acc[cat][brand].push(m);
    return acc;
  }, {});
}

export async function createMaterial(data: {
  category: MaterialCategory;
  brand?: string | null;
  colorCode?: string | null;
  surfaceTreatment?: string | null;
  boardType?: string | null;
  name: string;
  spec?: string | null;
  unit: string;
  price: number;
  minCai?: number | null;
  wasteRate?: number;
}) {
  await requireUserId();
  const parsed = materialSchema.safeParse(data);
  if (!parsed.success) return { success: false, errors: parsed.error.flatten().fieldErrors };
  await prisma.material.create({ data: parsed.data });
  revalidatePath("/materials");
  return { success: true };
}

export async function updateMaterial(materialId: string, data: Partial<{
  category: MaterialCategory;
  brand: string | null;
  colorCode: string | null;
  surfaceTreatment: string | null;
  boardType: string | null;
  name: string;
  spec: string | null;
  unit: string;
  price: number;
  minCai: number | null;
  wasteRate: number;
}>) {
  await requireUserId();
  const parsed = materialSchema.partial().safeParse(data);
  if (!parsed.success) return { success: false, errors: parsed.error.flatten().fieldErrors };
  await prisma.material.update({ where: { id: materialId }, data: parsed.data });
  revalidatePath("/materials");
  return { success: true };
}

export async function toggleMaterialActive(materialId: string, isActive: boolean) {
  await requireUserId();
  await prisma.material.update({ where: { id: materialId }, data: { isActive } });
  revalidatePath("/materials");
  return { success: true };
}

export async function deleteMaterial(materialId: string) {
  await requireUserId();
  // Check if referenced in any EstimateItem — if so, just deactivate
  await prisma.material.delete({ where: { id: materialId } });
  revalidatePath("/materials");
  return { success: true };
}
```

- [ ] **Step 3: 型別檢查**

```bash
npm run typecheck 2>&1 | grep -v "node_modules"
```

- [ ] **Step 4: Commit**

```bash
git add src/app/api/materials/route.ts src/lib/actions/materials.ts
git commit -m "feat: update materials API and actions for new schema fields"
```

---

## Task 7: MaterialDropdown 更新

**Files:**
- Modify: `src/components/shared/MaterialDropdown.tsx`

- [ ] **Step 1: 更新 MaterialDropdown**

將 `src/components/shared/MaterialDropdown.tsx` 替換為：

```typescript
// src/components/shared/MaterialDropdown.tsx
"use client";

import { useEffect, useState } from "react";
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { MaterialRef } from "@/types";

interface MaterialOption {
  id: string;
  name: string;
  brand: string | null;
  colorCode: string | null;
  surfaceTreatment: string | null;
  boardType: string | null;
  spec: string | null;
  unit: string;
  price: number;
  minCai: number | null;
  category: string;
}

interface Props {
  value: MaterialRef | null;
  onChange: (ref: MaterialRef | null) => void;
  categoryFilter?: string;
  placeholder?: string;
  disabled?: boolean;
}

const CATEGORY_LABELS: Record<string, string> = {
  BOARD_BODY: "桶身板材",
  BOARD_BACKING: "背板",
  BOARD_DOOR: "門片",
  HARDWARE_HINGE: "鉸鏈",
  HARDWARE_HANDLE: "把手",
  HARDWARE_RAIL: "滑軌",
  HARDWARE_OTHER: "其他五金",
  CEILING_BOARD: "天花板板材",
  ANGLE_MATERIAL: "角材",
  OTHER: "其他",
};

export function MaterialDropdown({ value, onChange, categoryFilter, placeholder = "選擇材料", disabled }: Props) {
  const [materials, setMaterials] = useState<MaterialOption[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const url = categoryFilter ? `/api/materials?category=${categoryFilter}` : "/api/materials";
    fetch(url)
      .then((r) => r.json())
      .then((data: MaterialOption[]) => { setMaterials(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, [categoryFilter]);

  const grouped = materials.reduce((acc, m) => {
    if (!acc[m.category]) acc[m.category] = [];
    acc[m.category].push(m);
    return acc;
  }, {} as Record<string, MaterialOption[]>);

  const handleChange = (materialId: string) => {
    if (materialId === "__none__") { onChange(null); return; }
    const found = materials.find((m) => m.id === materialId);
    if (!found) return;
    onChange({
      materialId: found.id,
      materialName: found.name,
      unit: found.unit,
      pricePerUnit: found.price,
      minCai: found.minCai,
    });
  };

  return (
    <Select value={value?.materialId ?? "__none__"} onValueChange={handleChange} disabled={disabled || loading}>
      <SelectTrigger className="w-full text-xs h-8">
        <SelectValue placeholder={loading ? "載入中…" : placeholder} />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="__none__">
          <span className="text-muted-foreground">（不選擇）</span>
        </SelectItem>
        {Object.entries(grouped).map(([category, items]) => (
          <SelectGroup key={category}>
            <SelectLabel>{CATEGORY_LABELS[category] ?? category}</SelectLabel>
            {items.map((m) => (
              <SelectItem key={m.id} value={m.id}>
                <span className="font-medium">{m.name}</span>
                {m.spec && <span className="ml-1 text-muted-foreground text-xs">{m.spec}</span>}
                <span className="ml-2 text-xs text-muted-foreground">
                  ${m.price}/{m.unit}
                  {m.minCai !== null && ` (最低${m.minCai}才)`}
                </span>
              </SelectItem>
            ))}
          </SelectGroup>
        ))}
      </SelectContent>
    </Select>
  );
}
```

- [ ] **Step 2: 更新 CabinetUnitForm 的 categoryFilter**

在 `src/components/cabinet/CabinetUnitForm.tsx` 找到以下兩行並更新：

```typescript
// 原：categoryFilter="BOARD"  → 改為：
categoryFilter="BOARD_BODY"

// 原：categoryFilter="BACKING"  → 改為：
categoryFilter="BOARD_BACKING"
```

- [ ] **Step 3: 更新 DoorForm 的 categoryFilter**

在 `src/components/cabinet/DoorForm.tsx` 更新：

```typescript
// 門片材料：categoryFilter="BOARD"  → 改為：
categoryFilter="BOARD_DOOR"

// 鉸鏈：categoryFilter="HARDWARE"  → 改為：
categoryFilter="HARDWARE_HINGE"

// 滑軌：categoryFilter="RAIL"  → 改為：
categoryFilter="HARDWARE_RAIL"
```

- [ ] **Step 4: 型別檢查**

```bash
npm run typecheck 2>&1 | grep -v "node_modules"
```

- [ ] **Step 5: Commit**

```bash
git add src/components/shared/MaterialDropdown.tsx src/components/cabinet/CabinetUnitForm.tsx src/components/cabinet/DoorForm.tsx
git commit -m "feat: update MaterialDropdown to pass minCai and new category labels"
```

---

## Task 8: UnitAddonsForm 新增 + CabinetUnitForm 整合

**Files:**
- Create: `src/components/cabinet/UnitAddonsForm.tsx`
- Modify: `src/components/cabinet/CabinetUnitForm.tsx`
- Modify: `src/components/cabinet/DoorForm.tsx` (add door addons)

- [ ] **Step 1: 建立 UnitAddonsForm**

建立 `src/components/cabinet/UnitAddonsForm.tsx`：

```typescript
// src/components/cabinet/UnitAddonsForm.tsx
"use client";

import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { UnitAddons } from "@/types";

interface Props {
  value: UnitAddons;
  onChange: (addons: UnitAddons) => void;
}

export function UnitAddonsForm({ value, onChange }: Props) {
  const update = (patch: Partial<UnitAddons>) => onChange({ ...value, ...patch });

  return (
    <section className="space-y-3">
      <h3 className="font-semibold text-sm border-b pb-1">加工選項</h3>

      <div className="space-y-1">
        <Label className="text-xs text-muted-foreground">前緣封ABS</Label>
        <Select
          value={value.frontEdgeABS}
          onValueChange={(v) => update({ frontEdgeABS: v as UnitAddons["frontEdgeABS"] })}
        >
          <SelectTrigger className="h-8 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">無</SelectItem>
            <SelectItem value="one_long">1長封ABS（+5元/才）</SelectItem>
            <SelectItem value="two_long">2長封ABS（+10元/才）</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex items-center gap-3">
        <Switch
          checked={value.doubleDrillHoles}
          onCheckedChange={(v) => update({ doubleDrillHoles: v, nonStandardHoles: v ? value.nonStandardHoles : false })}
        />
        <Label className="text-xs">中立板雙面排孔（+5元/才）</Label>
      </div>

      {value.doubleDrillHoles && (
        <div className="flex items-center gap-3 pl-6">
          <Switch
            checked={value.nonStandardHoles}
            onCheckedChange={(v) => update({ nonStandardHoles: v })}
          />
          <Label className="text-xs text-muted-foreground">非規格孔位（+5元/才）</Label>
        </div>
      )}
    </section>
  );
}
```

- [ ] **Step 2: 在 CabinetUnitForm 加入 addons + 修正 emptyUnit**

在 `src/components/cabinet/CabinetUnitForm.tsx` 加入 import 和使用 UnitAddonsForm：

在 import 區塊加：
```typescript
import { UnitAddonsForm } from "./UnitAddonsForm";
import { DEFAULT_UNIT_ADDONS } from "@/types";
```

在「板材選料」section 下方（`<Separator />` 之前）加入：

```typescript
<UnitAddonsForm
  value={unit.addons}
  onChange={(addons) => update({ addons })}
/>
```

- [ ] **Step 3: 修正 emptyUnit（在 CabinetUnitList.tsx）**

在 `src/components/cabinet/CabinetUnitList.tsx` 找到 `emptyUnit()` 函式，加入 `addons`：

```typescript
import { DEFAULT_UNIT_ADDONS } from "@/types";

function emptyUnit(): CabinetUnitInput {
  return {
    id: generateId(),
    name: "新桶身",
    widthCm: 90,
    depthCm: 60,
    heightCm: 240,
    quantity: 1,
    hasBackPanel: true,
    panelMaterialRef: null,
    backPanelMaterialRef: null,
    addons: { ...DEFAULT_UNIT_ADDONS },
    middleDividers: [],
    shelves: [],
    doors: [],
    kickPlate: null,
  };
}
```

- [ ] **Step 4: 在 DoorForm 加入 door addons + 修正 emptyDoor**

將 `src/components/cabinet/DoorForm.tsx` 的 `emptyDoor()` 函式改為：

```typescript
import { DEFAULT_DOOR_ADDONS } from "@/types";

function emptyDoor(): DoorInput {
  return {
    id: generateId(),
    type: "HINGED",
    name: "",
    widthCm: 45,
    heightCm: 90,
    quantity: 1,
    materialRef: null,
    addons: { ...DEFAULT_DOOR_ADDONS },
    hingeMaterialRef: null,
    railMaterialRef: null,
  };
}
```

在每個門片的展開區塊（`hingeMaterialRef` / `railMaterialRef` 下方）加入：

```typescript
{/* Door add-ons */}
<div className="pt-1 border-t space-y-1.5">
  <div className="flex items-center gap-2">
    <input
      type="checkbox"
      id={`pattern-${door.id}`}
      checked={door.addons.patternMatch === "grain"}
      onChange={(e) => update(i, { addons: { ...door.addons, patternMatch: e.target.checked ? "grain" : "none" } })}
      className="h-3 w-3"
    />
    <label htmlFor={`pattern-${door.id}`} className="text-[10px] text-muted-foreground cursor-pointer">
      對花（直紋 ×1.2）
    </label>
  </div>
  <div className="flex items-center gap-2">
    <input
      type="checkbox"
      id={`glass-${door.id}`}
      checked={door.addons.temperedGlass}
      onChange={(e) => update(i, { addons: { ...door.addons, temperedGlass: e.target.checked } })}
      className="h-3 w-3"
    />
    <label htmlFor={`glass-${door.id}`} className="text-[10px] text-muted-foreground cursor-pointer">
      強化玻璃加價（+50元/才）
    </label>
  </div>
  {door.type === "HINGED" && (
    <div className="flex items-center gap-2">
      <input
        type="checkbox"
        id={`hinge-hole-${door.id}`}
        checked={door.addons.hingeHoleDrilling}
        onChange={(e) => update(i, { addons: { ...door.addons, hingeHoleDrilling: e.target.checked } })}
        className="h-3 w-3"
      />
      <label htmlFor={`hinge-hole-${door.id}`} className="text-[10px] text-muted-foreground cursor-pointer">
        門板鉸鏈孔（+5元/孔）
      </label>
    </div>
  )}
</div>
```

- [ ] **Step 5: 型別檢查**

```bash
npm run typecheck 2>&1 | grep -v "node_modules"
```

Expected: 無錯誤或只剩 CabinetResultPanel（尚未更新）。

- [ ] **Step 6: Commit**

```bash
git add src/components/cabinet/
git commit -m "feat: add unit and door addon forms to cabinet UI"
```

---

## Task 9: CabinetResultPanel 更新

**Files:**
- Modify: `src/components/cabinet/CabinetResultPanel.tsx`

- [ ] **Step 1: 讀取現有檔案**

```bash
cat src/components/cabinet/CabinetResultPanel.tsx
```

- [ ] **Step 2: 更新費用顯示**

在 `src/components/cabinet/CabinetResultPanel.tsx` 的費用列表區域，替換/新增加工費分類顯示。找到顯示 `panelsCost` / `doorsCost` 等費用的地方，修改為：

```typescript
// 費用明細
const costRows = [
  { label: "桶身板材", value: result.summary.panelsCost },
  { label: "內部構件", value: result.summary.internalPartsCost },
  { label: "門片", value: result.summary.doorsCost },
  { label: "五金", value: result.summary.hardwareCost },
  { label: "踢腳板", value: result.summary.accessoriesCost },
];

const addonRows = [
  { label: "前緣封ABS", value: result.summary.addonsBreakdown.frontEdgeABS },
  { label: "雙面排孔", value: result.summary.addonsBreakdown.doubleDrillHoles },
  { label: "對花加價", value: result.summary.addonsBreakdown.patternMatch },
  { label: "強化玻璃", value: result.summary.addonsBreakdown.temperedGlass },
  { label: "鉸鏈孔", value: result.summary.addonsBreakdown.hingeHoleDrilling },
].filter((r) => r.value > 0);
```

在費用列表 JSX 中：
```tsx
{costRows.filter(r => r.value > 0).map((row) => (
  <div key={row.label} className="flex justify-between text-sm">
    <span className="text-muted-foreground">{row.label}</span>
    <span>{formatCurrency(row.value)}</span>
  </div>
))}
{addonRows.length > 0 && (
  <>
    <div className="text-xs text-muted-foreground mt-2 mb-1">加工費</div>
    {addonRows.map((row) => (
      <div key={row.label} className="flex justify-between text-xs pl-2">
        <span className="text-muted-foreground">└ {row.label}</span>
        <span>+{formatCurrency(row.value)}</span>
      </div>
    ))}
  </>
)}
```

- [ ] **Step 3: 型別檢查 + 確認 build**

```bash
npm run typecheck 2>&1 | grep -v "node_modules"
```

- [ ] **Step 4: Commit**

```bash
git add src/components/cabinet/CabinetResultPanel.tsx
git commit -m "feat: show addon cost breakdown in cabinet result panel"
```

---

## Task 10: MaterialSummaryPanel 新增 + CabinetUnitList 整合

**Files:**
- Create: `src/components/cabinet/MaterialSummaryPanel.tsx`
- Modify: `src/components/cabinet/CabinetUnitList.tsx`

- [ ] **Step 1: 建立 MaterialSummaryPanel**

建立 `src/components/cabinet/MaterialSummaryPanel.tsx`：

```typescript
// src/components/cabinet/MaterialSummaryPanel.tsx
"use client";

import { formatCurrency } from "@/lib/utils";
import type { CabinetUnitInput } from "@/types";
import { calculateCabinetUnit } from "@/lib/calculations/cabinet";
import { UNIT_CONFIG } from "@/lib/config/units";

interface MaterialAggregate {
  materialId: string;
  materialName: string;
  category: string;
  unit: string;
  pricePerUnit: number;
  minCai: number | null;
  actualTotalCai: number;
  billableTotalCai: number;
}

function aggregateMaterials(units: CabinetUnitInput[]): MaterialAggregate[] {
  const map = new Map<string, MaterialAggregate>();

  for (const unit of units) {
    const result = calculateCabinetUnit(unit);
    const allPanels = [...result.panels, ...result.internalParts];

    for (const panel of allPanels) {
      if (!panel.materialRef) continue;
      const { materialId, materialName, unit: mUnit, pricePerUnit, minCai } = panel.materialRef;
      const existing = map.get(materialId);
      const actualCai = panel.totalArea.cai;
      const billableCai = panel.billableTotalArea.cai;

      if (existing) {
        existing.actualTotalCai += actualCai;
        existing.billableTotalCai += billableCai;
      } else {
        map.set(materialId, {
          materialId, materialName,
          category: "BOARD_BODY",
          unit: mUnit, pricePerUnit, minCai,
          actualTotalCai: actualCai,
          billableTotalCai: billableCai,
        });
      }
    }

    for (const door of result.doors) {
      if (!door.materialRef) continue;
      const { materialId, materialName, unit: mUnit, pricePerUnit, minCai } = door.materialRef;
      const existing = map.get(materialId);
      const actualCai = door.totalArea.cai;
      const billableCai = door.billableTotalArea.cai;

      if (existing) {
        existing.actualTotalCai += actualCai;
        existing.billableTotalCai += billableCai;
      } else {
        map.set(materialId, {
          materialId, materialName,
          category: "BOARD_DOOR",
          unit: mUnit, pricePerUnit, minCai,
          actualTotalCai: actualCai,
          billableTotalCai: billableCai,
        });
      }
    }
  }

  return Array.from(map.values());
}

const CATEGORY_LABEL: Record<string, string> = {
  BOARD_BODY: "桶身板材",
  BOARD_DOOR: "門片",
  BOARD_BACKING: "背板",
};

interface Props {
  units: CabinetUnitInput[];
  projectTotal: number;
  addonsCostTotal: number;
}

export function MaterialSummaryPanel({ units, projectTotal, addonsCostTotal }: Props) {
  const aggregated = aggregateMaterials(units);
  const byCategory = aggregated.reduce((acc, m) => {
    if (!acc[m.category]) acc[m.category] = [];
    acc[m.category].push(m);
    return acc;
  }, {} as Record<string, MaterialAggregate[]>);

  if (aggregated.length === 0) {
    return (
      <p className="text-sm text-muted-foreground text-center py-4">
        請先為各板件選擇材料
      </p>
    );
  }

  return (
    <div className="space-y-4">
      {Object.entries(byCategory).map(([cat, items]) => (
        <div key={cat}>
          <p className="text-xs font-semibold text-muted-foreground mb-2">{CATEGORY_LABEL[cat] ?? cat}</p>
          <div className="space-y-1">
            <div className="grid grid-cols-4 gap-2 text-[10px] text-muted-foreground pb-1 border-b">
              <span className="col-span-2">品項</span>
              <span className="text-right">實際才數</span>
              <span className="text-right">計費才數（基本/片）</span>
            </div>
            {items.map((m) => {
              const hasSurcharge = m.billableTotalCai > m.actualTotalCai + 0.001;
              return (
                <div key={m.materialId} className="grid grid-cols-4 gap-2 text-xs items-center">
                  <span className="col-span-2 truncate" title={m.materialName}>{m.materialName}</span>
                  <span className="text-right text-muted-foreground">
                    {m.actualTotalCai.toFixed(2)} 才
                  </span>
                  <span className={`text-right ${hasSurcharge ? "text-amber-600" : ""}`}>
                    {m.billableTotalCai.toFixed(2)} 才
                    {m.minCai !== null && (
                      <span className="text-muted-foreground ml-1">
                        （{m.minCai}才/片）
                      </span>
                    )}
                    {hasSurcharge && <span className="ml-1">⚠</span>}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
```

- [ ] **Step 2: 整合到 CabinetUnitList**

在 `src/components/cabinet/CabinetUnitList.tsx` 加入 import：

```typescript
import { MaterialSummaryPanel } from "./MaterialSummaryPanel";
```

在總計區塊上方（`<Separator />` 之後）加入統整區塊：

```tsx
<div className="border rounded-lg p-4 bg-muted/10">
  <h3 className="font-semibold text-sm mb-3">板材統整</h3>
  <MaterialSummaryPanel
    units={units}
    projectTotal={projectTotal}
    addonsCostTotal={units.reduce((acc, u) => acc + calculateCabinetUnit(u).summary.addonsCost, 0)}
  />
</div>
```

- [ ] **Step 3: 型別檢查**

```bash
npm run typecheck 2>&1 | grep -v "node_modules"
```

Expected: 無錯誤。

- [ ] **Step 4: Commit**

```bash
git add src/components/cabinet/MaterialSummaryPanel.tsx src/components/cabinet/CabinetUnitList.tsx
git commit -m "feat: add material aggregation summary panel to cabinet project view"
```

---

## Task 11: 材料管理頁面重建

**Files:**
- Create: `src/components/materials/BrandSidebar.tsx`
- Create: `src/components/materials/MaterialItemList.tsx`
- Create: `src/components/materials/MaterialEditForm.tsx`
- Modify: `src/app/(dashboard)/materials/MaterialsClient.tsx`
- Modify: `src/app/(dashboard)/materials/page.tsx`

- [ ] **Step 1: 建立 BrandSidebar**

建立 `src/components/materials/BrandSidebar.tsx`：

```typescript
// src/components/materials/BrandSidebar.tsx
"use client";

import { Button } from "@/components/ui/button";

const CATEGORY_GROUP_LABELS: Record<string, string> = {
  BOARD_BODY: "板材",
  BOARD_BACKING: "板材",
  BOARD_DOOR: "板材",
  HARDWARE_HINGE: "五金",
  HARDWARE_HANDLE: "五金",
  HARDWARE_RAIL: "五金",
  HARDWARE_OTHER: "五金",
  CEILING_BOARD: "其他",
  ANGLE_MATERIAL: "其他",
  OTHER: "其他",
};

const CATEGORY_LABELS: Record<string, string> = {
  BOARD_BODY: "桶身板材",
  BOARD_BACKING: "背板",
  BOARD_DOOR: "門片",
  HARDWARE_HINGE: "鉸鏈",
  HARDWARE_HANDLE: "把手",
  HARDWARE_RAIL: "滑軌",
  HARDWARE_OTHER: "其他五金",
  CEILING_BOARD: "天花板板材",
  ANGLE_MATERIAL: "角材",
  OTHER: "其他",
};

export interface BrandKey { category: string; brand: string }

interface Props {
  grouped: Record<string, Record<string, unknown[]>>;
  selected: BrandKey | null;
  onSelect: (key: BrandKey) => void;
}

export function BrandSidebar({ grouped, selected, onSelect }: Props) {
  const groups: Record<string, { category: string; brand: string; count: number }[]> = {};

  for (const [category, brands] of Object.entries(grouped)) {
    const groupLabel = CATEGORY_GROUP_LABELS[category] ?? "其他";
    if (!groups[groupLabel]) groups[groupLabel] = [];
    for (const [brand, items] of Object.entries(brands)) {
      groups[groupLabel].push({ category, brand, count: (items as unknown[]).length });
    }
  }

  return (
    <div className="space-y-4">
      {Object.entries(groups).map(([groupLabel, items]) => (
        <div key={groupLabel}>
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1 px-2">
            {groupLabel}
          </p>
          {items.map(({ category, brand, count }) => {
            const isSelected = selected?.category === category && selected?.brand === brand;
            return (
              <Button
                key={`${category}-${brand}`}
                variant={isSelected ? "secondary" : "ghost"}
                size="sm"
                className="w-full justify-between text-left h-8 text-xs"
                onClick={() => onSelect({ category, brand })}
              >
                <span className="truncate">{CATEGORY_LABELS[category] ?? category} · {brand}</span>
                <span className="text-muted-foreground ml-1">{count}</span>
              </Button>
            );
          })}
        </div>
      ))}
    </div>
  );
}
```

- [ ] **Step 2: 建立 MaterialItemList**

建立 `src/components/materials/MaterialItemList.tsx`：

```typescript
// src/components/materials/MaterialItemList.tsx
"use client";

import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { toggleMaterialActive, deleteMaterial } from "@/lib/actions/materials";
import type { Material } from "@prisma/client";

interface Props {
  items: Material[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onRefresh: () => void;
}

export function MaterialItemList({ items, selectedId, onSelect, onRefresh }: Props) {
  const handleToggle = async (id: string, current: boolean) => {
    await toggleMaterialActive(id, !current);
    onRefresh();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("確定刪除？")) return;
    await deleteMaterial(id);
    onRefresh();
  };

  if (items.length === 0) {
    return <p className="text-sm text-muted-foreground p-4">此分類尚無品項</p>;
  }

  return (
    <div className="divide-y">
      {items.map((m) => (
        <div
          key={m.id}
          className={`flex items-center gap-2 px-3 py-2 cursor-pointer hover:bg-muted/40 transition-colors ${selectedId === m.id ? "bg-muted/60" : ""}`}
          onClick={() => onSelect(m.id)}
        >
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium truncate">{m.name}</p>
            <p className="text-[10px] text-muted-foreground">
              ${Number(m.price)}/{m.unit}
              {m.minCai !== null && ` · 基本 ${Number(m.minCai)} 才`}
            </p>
          </div>
          <Switch
            checked={m.isActive}
            onCheckedChange={() => handleToggle(m.id, m.isActive)}
            onClick={(e) => e.stopPropagation()}
          />
          <Button
            variant="ghost" size="icon"
            className="h-7 w-7 text-destructive flex-shrink-0"
            onClick={(e) => { e.stopPropagation(); handleDelete(m.id); }}
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      ))}
    </div>
  );
}
```

- [ ] **Step 3: 建立 MaterialEditForm**

建立 `src/components/materials/MaterialEditForm.tsx`：

```typescript
// src/components/materials/MaterialEditForm.tsx
"use client";

import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { createMaterial, updateMaterial } from "@/lib/actions/materials";
import { BOARD_TYPES } from "@/lib/config/units";
import { MaterialCategory } from "@prisma/client";
import type { Material } from "@prisma/client";

const CATEGORIES = [
  { value: "BOARD_BODY", label: "桶身板材" },
  { value: "BOARD_BACKING", label: "背板" },
  { value: "BOARD_DOOR", label: "門片" },
  { value: "HARDWARE_HINGE", label: "鉸鏈" },
  { value: "HARDWARE_HANDLE", label: "把手" },
  { value: "HARDWARE_RAIL", label: "滑軌" },
  { value: "HARDWARE_OTHER", label: "其他五金" },
  { value: "CEILING_BOARD", label: "天花板板材" },
  { value: "ANGLE_MATERIAL", label: "角材" },
  { value: "OTHER", label: "其他" },
];

const IS_BOARD_CATEGORY = (cat: string) =>
  ["BOARD_BODY", "BOARD_BACKING", "BOARD_DOOR"].includes(cat);

interface Props {
  item: Material | null;
  defaultCategory?: string;
  defaultBrand?: string;
  onSaved: () => void;
}

export function MaterialEditForm({ item, defaultCategory, defaultBrand, onSaved }: Props) {
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const [category, setCategory] = useState(item?.category ?? defaultCategory ?? "BOARD_BODY");
  const [brand, setBrand] = useState(item?.brand ?? defaultBrand ?? "");
  const [colorCode, setColorCode] = useState(item?.colorCode ?? "");
  const [surfaceTreatment, setSurfaceTreatment] = useState(item?.surfaceTreatment ?? "");
  const [boardType, setBoardType] = useState(item?.boardType ?? "");
  const [name, setName] = useState(item?.name ?? "");
  const [spec, setSpec] = useState(item?.spec ?? "");
  const [unit, setUnit] = useState(item?.unit ?? "才");
  const [price, setPrice] = useState(item ? Number(item.price) : 0);
  const [minCai, setMinCai] = useState(item?.minCai !== null && item?.minCai !== undefined ? Number(item.minCai) : "");

  // Auto-generate name from brand + colorCode + boardType
  useEffect(() => {
    if (!item) {
      const auto = [brand, colorCode, surfaceTreatment, boardType].filter(Boolean).join(" ");
      if (auto) setName(auto);
    }
  }, [brand, colorCode, surfaceTreatment, boardType, item]);

  const handleSubmit = async () => {
    setSaving(true);
    setMsg(null);
    const data = {
      category: category as MaterialCategory,
      brand: brand || null,
      colorCode: colorCode || null,
      surfaceTreatment: surfaceTreatment || null,
      boardType: boardType || null,
      name,
      spec: spec || null,
      unit,
      price,
      minCai: minCai !== "" ? Number(minCai) : null,
      wasteRate: 0,
    };

    const result = item
      ? await updateMaterial(item.id, data)
      : await createMaterial(data);

    setSaving(false);
    if (result.success) {
      setMsg("已儲存");
      onSaved();
    } else {
      setMsg("儲存失敗");
    }
  };

  const isBoard = IS_BOARD_CATEGORY(category);

  return (
    <div className="space-y-3 p-4">
      <h3 className="font-semibold text-sm">{item ? "編輯品項" : "新增品項"}</h3>

      <div>
        <Label className="text-xs text-muted-foreground">類別</Label>
        <Select value={category} onValueChange={setCategory}>
          <SelectTrigger className="h-8 text-xs mt-1">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {CATEGORIES.map((c) => (
              <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div>
          <Label className="text-xs text-muted-foreground">品牌</Label>
          <Input className="h-8 text-xs mt-1" value={brand} onChange={(e) => setBrand(e.target.value)} placeholder="EGGER" />
        </div>
        {isBoard && (
          <div>
            <Label className="text-xs text-muted-foreground">色號</Label>
            <Input className="h-8 text-xs mt-1" value={colorCode} onChange={(e) => setColorCode(e.target.value)} placeholder="H1145" />
          </div>
        )}
      </div>

      {isBoard && (
        <div className="grid grid-cols-2 gap-2">
          <div>
            <Label className="text-xs text-muted-foreground">表面處理</Label>
            <Input className="h-8 text-xs mt-1" value={surfaceTreatment} onChange={(e) => setSurfaceTreatment(e.target.value)} placeholder="ST10" />
          </div>
          <div>
            <Label className="text-xs text-muted-foreground">板料類型</Label>
            <Select value={boardType} onValueChange={setBoardType}>
              <SelectTrigger className="h-8 text-xs mt-1">
                <SelectValue placeholder="選擇類型" />
              </SelectTrigger>
              <SelectContent>
                {BOARD_TYPES.map((t) => (
                  <SelectItem key={t} value={t}>{t}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      )}

      <div>
        <Label className="text-xs text-muted-foreground">顯示名稱</Label>
        <Input className="h-8 text-xs mt-1" value={name} onChange={(e) => setName(e.target.value)} />
      </div>

      <div className="grid grid-cols-3 gap-2">
        <div>
          <Label className="text-xs text-muted-foreground">單位</Label>
          <Select value={unit} onValueChange={setUnit}>
            <SelectTrigger className="h-8 text-xs mt-1"><SelectValue /></SelectTrigger>
            <SelectContent>
              {["才", "個", "組", "M", "支", "片"].map((u) => (
                <SelectItem key={u} value={u}>{u}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label className="text-xs text-muted-foreground">單價（元）</Label>
          <Input type="number" className="h-8 text-xs mt-1" value={price} onChange={(e) => setPrice(Number(e.target.value))} />
        </div>
        {isBoard && (
          <div>
            <Label className="text-xs text-muted-foreground">基本才數</Label>
            <Input type="number" step="0.5" className="h-8 text-xs mt-1" value={minCai} onChange={(e) => setMinCai(e.target.value)} placeholder="1" />
          </div>
        )}
      </div>

      <div>
        <Label className="text-xs text-muted-foreground">備註規格</Label>
        <Input className="h-8 text-xs mt-1" value={spec} onChange={(e) => setSpec(e.target.value)} />
      </div>

      <div className="flex items-center gap-3 pt-1">
        <Button size="sm" onClick={handleSubmit} disabled={saving}>
          {saving ? "儲存中…" : "儲存"}
        </Button>
        {msg && <span className={`text-xs ${msg.includes("失敗") ? "text-destructive" : "text-green-600"}`}>{msg}</span>}
      </div>
    </div>
  );
}
```

- [ ] **Step 4: 重建 MaterialsClient**

將 `src/app/(dashboard)/materials/MaterialsClient.tsx` 替換為：

```typescript
// src/app/(dashboard)/materials/MaterialsClient.tsx
"use client";

import { useState, useCallback } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { BrandSidebar, type BrandKey } from "@/components/materials/BrandSidebar";
import { MaterialItemList } from "@/components/materials/MaterialItemList";
import { MaterialEditForm } from "@/components/materials/MaterialEditForm";
import type { Material } from "@prisma/client";

type GroupedMaterials = Record<string, Record<string, Material[]>>;

interface Props {
  initialGrouped: GroupedMaterials;
}

export function MaterialsClient({ initialGrouped }: Props) {
  const [grouped, setGrouped] = useState<GroupedMaterials>(initialGrouped);
  const [selected, setSelected] = useState<BrandKey | null>(() => {
    const firstCat = Object.keys(initialGrouped)[0];
    if (!firstCat) return null;
    const firstBrand = Object.keys(initialGrouped[firstCat])[0];
    return firstBrand ? { category: firstCat, brand: firstBrand } : null;
  });
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [adding, setAdding] = useState(false);

  const refresh = useCallback(async () => {
    const res = await fetch("/api/materials/grouped");
    if (res.ok) {
      const data = await res.json();
      setGrouped(data);
    }
  }, []);

  const currentItems = selected
    ? (grouped[selected.category]?.[selected.brand] ?? [])
    : [];

  const filteredItems = search
    ? currentItems.filter((m) =>
        m.name.toLowerCase().includes(search.toLowerCase()) ||
        (m.colorCode ?? "").toLowerCase().includes(search.toLowerCase())
      )
    : currentItems;

  const selectedItem = selectedItemId
    ? currentItems.find((m) => m.id === selectedItemId) ?? null
    : null;

  return (
    <div className="flex h-[calc(100vh-8rem)] gap-0 border rounded-lg overflow-hidden">
      {/* 品牌側欄 */}
      <div className="w-52 flex-shrink-0 border-r overflow-y-auto p-2">
        <BrandSidebar grouped={grouped} selected={selected} onSelect={(key) => { setSelected(key); setSelectedItemId(null); setAdding(false); }} />
      </div>

      {/* 品項列表 */}
      <div className="w-72 flex-shrink-0 border-r flex flex-col">
        <div className="p-2 border-b flex items-center gap-2">
          <Input
            className="h-8 text-xs flex-1"
            placeholder="搜尋色號 / 品名…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <Button
            size="icon" variant="outline" className="h-8 w-8 flex-shrink-0"
            onClick={() => { setAdding(true); setSelectedItemId(null); }}
          >
            <Plus className="h-3 w-3" />
          </Button>
        </div>
        <div className="flex-1 overflow-y-auto">
          <MaterialItemList
            items={filteredItems}
            selectedId={selectedItemId}
            onSelect={(id) => { setSelectedItemId(id); setAdding(false); }}
            onRefresh={refresh}
          />
        </div>
      </div>

      {/* 編輯表單 */}
      <div className="flex-1 overflow-y-auto">
        {(selectedItem || adding) ? (
          <MaterialEditForm
            key={selectedItem?.id ?? "new"}
            item={adding ? null : selectedItem}
            defaultCategory={selected?.category}
            defaultBrand={selected?.brand}
            onSaved={() => { refresh(); setAdding(false); }}
          />
        ) : (
          <div className="flex items-center justify-center h-full text-sm text-muted-foreground">
            選擇品項或點 + 新增
          </div>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 5: 新增 /api/materials/grouped route**

建立 `src/app/api/materials/grouped/route.ts`：

```typescript
// src/app/api/materials/grouped/route.ts
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getMaterialsByBrand } from "@/lib/actions/materials";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const grouped = await getMaterialsByBrand();
  // Convert Decimal fields
  const result: Record<string, Record<string, unknown[]>> = {};
  for (const [cat, brands] of Object.entries(grouped)) {
    result[cat] = {};
    for (const [brand, items] of Object.entries(brands)) {
      result[cat][brand] = items.map((m) => ({
        ...m,
        price: Number(m.price),
        wasteRate: Number(m.wasteRate),
        minCai: m.minCai !== null ? Number(m.minCai) : null,
      }));
    }
  }
  return NextResponse.json(result);
}
```

- [ ] **Step 6: 更新 materials page.tsx**

在 `src/app/(dashboard)/materials/page.tsx` 中，改用 `getMaterialsByBrand` 取得初始資料：

```typescript
import { getMaterialsByBrand } from "@/lib/actions/materials";
import { MaterialsClient } from "./MaterialsClient";

export default async function MaterialsPage() {
  const grouped = await getMaterialsByBrand();
  // Convert Decimal
  const serialized: Record<string, Record<string, unknown[]>> = {};
  for (const [cat, brands] of Object.entries(grouped)) {
    serialized[cat] = {};
    for (const [brand, items] of Object.entries(brands)) {
      serialized[cat][brand] = items.map((m) => ({
        ...m,
        price: Number(m.price),
        wasteRate: Number(m.wasteRate),
        minCai: m.minCai !== null ? Number(m.minCai) : null,
      }));
    }
  }
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">材料管理</h1>
      <MaterialsClient initialGrouped={serialized as Parameters<typeof MaterialsClient>[0]["initialGrouped"]} />
    </div>
  );
}
```

- [ ] **Step 7: 型別檢查 + build**

```bash
npm run typecheck 2>&1 | grep -v "node_modules"
npm run build 2>&1 | tail -20
```

Expected: 無錯誤。

- [ ] **Step 8: Commit**

```bash
git add src/components/materials/ src/app/(dashboard)/materials/ src/app/api/materials/
git commit -m "feat: rebuild material management page with three-column brand/item/form layout"
```

---

## Task 12: Seed 資料更新

**Files:**
- Modify: `prisma/seed.ts`

- [ ] **Step 1: 替換 seed 資料**

將 `prisma/seed.ts` 替換為以下（包含牌價表主要品項）：

```typescript
// prisma/seed.ts
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

// boardType → minCai mapping
const BOARD_MIN_CAI: Record<string, number> = {
  "8mm背板不封邊": 1,
  "18mm櫃體封PVC": 1,
  "18mm 4E門板封ABS": 1.5,
  "18mm 4E H型 5mm清玻門": 3,
  "18mm 4E框型 5mm清玻門": 3,
  "18mm 4E框型肚板門": 3,
  "18mm 4E框鐵網門": 3,
  "25mm封ABS": 2,
};

// EGGER price matrix: [colorCode, surfaceTreatment, 8mm背板, 18mm櫃體, 18mm門板, H型, 框型清玻, 框型肚板, 框鐵網, 25mm]
const EGGER_MATRIX: [string, string, number, number, number, number, number, number, number, number][] = [
  // ST9
  ["W928",  "ST9",  85, 105, 120, 190, 220, 220, 215, 165],
  ["U702",  "ST9",  90, 115, 130, 200, 230, 230, 225, 175],
  ["U705",  "ST9",  90, 115, 130, 200, 230, 230, 225, 175],
  ["U708",  "ST9",  90, 115, 130, 200, 230, 230, 225, 175],
  ["U727",  "ST9",  90, 115, 130, 200, 230, 230, 225, 175],
  ["U115",  "ST9",  90, 120, 135, 205, 235, 235, 230, 0],
  ["U125",  "ST9",  90, 120, 135, 205, 235, 235, 230, 0],
  ["U211",  "ST9",  90, 120, 135, 205, 235, 235, 230, 0],
  ["U502",  "ST9",  90, 120, 135, 205, 235, 235, 230, 0],
  ["U638",  "ST9",  90, 120, 135, 205, 235, 235, 230, 0],
  ["U780",  "ST9",  90, 120, 135, 205, 235, 235, 230, 0],
  ["U899",  "ST9",  90, 120, 135, 205, 235, 235, 230, 0],
  ["U325",  "ST9",  95, 125, 140, 210, 240, 240, 235, 0],
  ["F800",  "ST9",  95, 125, 140, 210, 240, 240, 235, 185],
  // ST10
  ["H1145", "ST10", 90, 120, 135, 205, 235, 235, 230, 180],
  ["H1277", "ST12", 90, 120, 135, 205, 235, 235, 230, 180],
  ["H3047", "ST10", 90, 120, 135, 205, 235, 235, 230, 180],
  ["H3165", "ST12", 90, 120, 135, 205, 235, 235, 230, 180],
  ["H3433", "ST22", 90, 120, 135, 205, 235, 235, 230, 180],
  ["H3700", "ST10", 90, 120, 135, 205, 235, 235, 230, 180],
  ["H3710", "ST12", 90, 120, 135, 205, 235, 235, 230, 180],
  ["H3730", "ST10", 90, 120, 135, 205, 235, 235, 230, 180],
  ["F416",  "ST10", 95, 125, 140, 210, 240, 240, 235, 185],
  ["F417",  "ST10", 95, 125, 140, 210, 240, 240, 235, 185],
  ["F433",  "ST10", 95, 125, 140, 210, 240, 240, 235, 185],
  ["F637",  "ST10", 95, 125, 140, 210, 240, 240, 235, 185],
  ["F638",  "ST10", 95, 125, 140, 210, 240, 240, 235, 185],
  ["F642",  "ST16", 95, 125, 140, 210, 240, 240, 235, 185],
  ["F649",  "ST16", 95, 125, 140, 210, 240, 240, 235, 185],
  // STU / STV
  ["F7024", "STU1", 90, 115, 130, 200, 230, 230, 225, 0],
  ["F7025", "STU1", 90, 115, 130, 200, 230, 230, 225, 0],
  ["U779",  "STU8", 90, 115, 130, 200, 230, 230, 225, 0],
  ["U7123", "STU8", 90, 115, 130, 200, 230, 230, 225, 0],
  ["U7111", "STV3", 90, 115, 130, 200, 230, 230, 225, 0],
  ["F7036", "STV3", 90, 115, 130, 200, 230, 230, 225, 0],
  // ST19
  ["U702",  "ST19", 95, 125, 140, 210, 240, 240, 235, 185],
  ["U727",  "ST19", 95, 125, 140, 210, 240, 240, 235, 185],
  ["H3152", "ST19", 95, 125, 140, 210, 240, 240, 235, 185],
  ["H3157", "ST19", 95, 125, 140, 210, 240, 240, 235, 185],
  ["H3158", "ST19", 95, 125, 140, 210, 240, 240, 235, 185],
  ["H3349", "ST19", 95, 125, 140, 210, 240, 240, 235, 185],
  ["W1000", "ST19", 90, 120, 135, 205, 235, 235, 230, 180],
  // ST38
  ["U998",  "ST38", 105, 130, 145, 215, 245, 245, 240, 190],
  ["W1000", "ST38", 105, 130, 145, 215, 245, 245, 240, 190],
  // ST28
  ["H3311", "ST28", 110, 140, 155, 225, 255, 255, 250, 195],
  ["H3339", "ST28", 110, 140, 155, 225, 255, 255, 250, 195],
  // ST40
  ["H1369", "ST40", 110, 140, 155, 225, 255, 255, 250, 195],
];

const BOARD_TYPES_ORDER = [
  "8mm背板不封邊",
  "18mm櫃體封PVC",
  "18mm 4E門板封ABS",
  "18mm 4E H型 5mm清玻門",
  "18mm 4E框型 5mm清玻門",
  "18mm 4E框型肚板門",
  "18mm 4E框鐵網門",
  "25mm封ABS",
] as const;

const BOARD_CATEGORY: Record<string, string> = {
  "8mm背板不封邊": "BOARD_BACKING",
  "18mm櫃體封PVC": "BOARD_BODY",
  "18mm 4E門板封ABS": "BOARD_DOOR",
  "18mm 4E H型 5mm清玻門": "BOARD_DOOR",
  "18mm 4E框型 5mm清玻門": "BOARD_DOOR",
  "18mm 4E框型肚板門": "BOARD_DOOR",
  "18mm 4E框鐵網門": "BOARD_DOOR",
  "25mm封ABS": "BOARD_BODY",
};

async function main() {
  // Demo user
  await prisma.user.upsert({
    where: { email: "demo@decoest.com" },
    update: {},
    create: {
      email: "demo@decoest.com",
      name: "Demo User",
      password: await bcrypt.hash("password123", 10),
    },
  });

  // Clear existing materials
  await prisma.material.deleteMany({});

  const materialsToCreate: Parameters<typeof prisma.material.create>[0]["data"][] = [];
  let sortOrder = 0;

  // ── EGGER 板料 ────────────────────────────────────────────
  for (const [colorCode, surfaceTreatment, ...prices] of EGGER_MATRIX) {
    for (let i = 0; i < BOARD_TYPES_ORDER.length; i++) {
      const price = prices[i];
      if (!price) continue;
      const boardType = BOARD_TYPES_ORDER[i];
      materialsToCreate.push({
        category: BOARD_CATEGORY[boardType] as never,
        brand: "EGGER",
        colorCode,
        surfaceTreatment,
        boardType,
        name: `EGGER ${colorCode} ${surfaceTreatment} ${boardType}`,
        unit: "才",
        price,
        minCai: BOARD_MIN_CAI[boardType],
        wasteRate: 0,
        sortOrder: sortOrder++,
      });
    }
  }

  // ── SKIN 板料 ─────────────────────────────────────────────
  const SKIN_MATRIX: [string, string, number, number, number, number, number, number, number, number][] = [
    ["K2479", "AR", 105, 135, 150, 220, 250, 250, 245, 210],
    ["K2480", "AR", 105, 135, 150, 220, 250, 250, 245, 210],
    ["K2481", "AR", 105, 135, 150, 220, 250, 250, 245, 210],
    ["K512",  "AR", 105, 135, 150, 220, 250, 250, 245, 0],
    ["K2528", "CB", 105, 135, 150, 220, 250, 250, 245, 210],
    ["K4757", "CB", 105, 135, 150, 220, 250, 250, 245, 210],
    ["K4758", "CB", 105, 135, 150, 220, 250, 250, 245, 210],
    ["K5450", "CB", 105, 135, 150, 220, 250, 250, 245, 210],
    ["K5451", "CB", 105, 135, 150, 220, 250, 250, 245, 210],
    ["K6577", "CB", 105, 135, 150, 220, 250, 250, 245, 210],
    ["K570",  "CB", 105, 135, 150, 220, 250, 250, 245, 210],
    ["K571",  "CB", 105, 135, 150, 220, 250, 250, 245, 210],
    ["K4755", "SX", 105, 135, 150, 220, 250, 250, 245, 210],
    ["K6572", "SX", 105, 135, 150, 220, 250, 250, 245, 210],
    // 促銷
    ["K590",  "DE", 80, 100, 115, 185, 215, 215, 210, 165],
    ["K6679", "SW", 80, 100, 115, 185, 215, 215, 210, 165],
    ["K6680", "SW", 80, 100, 115, 185, 215, 215, 210, 165],
  ];
  for (const [colorCode, surfaceTreatment, ...prices] of SKIN_MATRIX) {
    for (let i = 0; i < BOARD_TYPES_ORDER.length; i++) {
      const price = prices[i];
      if (!price) continue;
      const boardType = BOARD_TYPES_ORDER[i];
      materialsToCreate.push({
        category: BOARD_CATEGORY[boardType] as never,
        brand: "SKIN",
        colorCode,
        surfaceTreatment,
        boardType,
        name: `SKIN ${colorCode} ${surfaceTreatment} ${boardType}`,
        unit: "才",
        price,
        minCai: BOARD_MIN_CAI[boardType],
        wasteRate: 0,
        sortOrder: sortOrder++,
      });
    }
  }

  // ── HORNG CHANG 板料 ──────────────────────────────────────
  const HC_MATRIX: [string, string, number, number, number, number, number, number, number, number][] = [
    ["S0506", "ST36", 85, 105, 120, 190, 220, 220, 215, 170],
    ["S1023", "ST36", 85, 105, 120, 190, 220, 220, 215, 170],
    ["S1202", "ST36", 85, 105, 120, 190, 220, 220, 215, 170],
    ["S1206", "ST36", 85, 105, 120, 190, 220, 220, 215, 170],
    ["S1406", "ST12", 85, 105, 120, 190, 220, 220, 215, 170],
    ["S1407", "ST12", 85, 105, 120, 190, 220, 220, 215, 170],
    ["S3083", "ST12", 85, 105, 120, 190, 220, 220, 215, 170],
    ["S3084", "ST12", 85, 105, 120, 190, 220, 220, 215, 170],
    ["G5527", "ST68", 85, 110, 125, 195, 225, 225, 220, 170],
    ["G6505", "ST68", 85, 110, 125, 195, 225, 225, 220, 170],
    ["G6506", "ST68", 85, 110, 125, 195, 225, 225, 220, 170],
    ["G6507", "ST68", 85, 110, 125, 195, 225, 225, 220, 170],
  ];
  for (const [colorCode, surfaceTreatment, ...prices] of HC_MATRIX) {
    for (let i = 0; i < BOARD_TYPES_ORDER.length; i++) {
      const price = prices[i];
      if (!price) continue;
      const boardType = BOARD_TYPES_ORDER[i];
      materialsToCreate.push({
        category: BOARD_CATEGORY[boardType] as never,
        brand: "HORNG CHANG",
        colorCode,
        surfaceTreatment,
        boardType,
        name: `HORNG CHANG ${colorCode} ${surfaceTreatment} ${boardType}`,
        unit: "才",
        price,
        minCai: BOARD_MIN_CAI[boardType],
        wasteRate: 0,
        sortOrder: sortOrder++,
      });
    }
  }

  // ── Longland 板料 ─────────────────────────────────────────
  const LONGLAND = [["L3267", "H"], ["L3461", "H"], ["L3612", "H"]] as const;
  for (const [colorCode, surfaceTreatment] of LONGLAND) {
    const prices = [80, 100, 115, 185, 215, 215, 210, 160];
    for (let i = 0; i < BOARD_TYPES_ORDER.length; i++) {
      const boardType = BOARD_TYPES_ORDER[i];
      materialsToCreate.push({
        category: BOARD_CATEGORY[boardType] as never,
        brand: "Longland",
        colorCode,
        surfaceTreatment,
        boardType,
        name: `Longland ${colorCode} ${surfaceTreatment} ${boardType}`,
        unit: "才",
        price: prices[i],
        minCai: BOARD_MIN_CAI[boardType],
        wasteRate: 0,
        sortOrder: sortOrder++,
      });
    }
  }

  // ── JANGMEI 板料 ──────────────────────────────────────────
  const JM_LOW = [["JM513","T2"],["JM541","S2"],["JM545","S2"],["JM557","NA"],["JM558","NA"],["JM559","NA"]] as const;
  const JM_MID = [["JM221","TX"],["JM222","TX"],["JM223","TX"],["JM321","TX"],["JM322","TX"],["JM230","F"]] as const;
  for (const [colorCode, surfaceTreatment] of JM_LOW) {
    const prices = [80, 100, 115, 185, 215, 215, 210, 160];
    for (let i = 0; i < BOARD_TYPES_ORDER.length; i++) {
      const boardType = BOARD_TYPES_ORDER[i];
      materialsToCreate.push({
        category: BOARD_CATEGORY[boardType] as never,
        brand: "JANGMEI", colorCode, surfaceTreatment, boardType,
        name: `JANGMEI ${colorCode} ${surfaceTreatment} ${boardType}`,
        unit: "才", price: prices[i], minCai: BOARD_MIN_CAI[boardType], wasteRate: 0, sortOrder: sortOrder++,
      });
    }
  }
  for (const [colorCode, surfaceTreatment] of JM_MID) {
    const prices = [85, 105, 120, 190, 220, 220, 215, 170];
    for (let i = 0; i < BOARD_TYPES_ORDER.length; i++) {
      const boardType = BOARD_TYPES_ORDER[i];
      materialsToCreate.push({
        category: BOARD_CATEGORY[boardType] as never,
        brand: "JANGMEI", colorCode, surfaceTreatment, boardType,
        name: `JANGMEI ${colorCode} ${surfaceTreatment} ${boardType}`,
        unit: "才", price: prices[i], minCai: BOARD_MIN_CAI[boardType], wasteRate: 0, sortOrder: sortOrder++,
      });
    }
  }

  // ── TITUS 鉸鏈 ────────────────────────────────────────────
  const TITUS_HINGES = [
    { colorCode: "A1TT006A-H33", name: "TITUS TGE 6分 緩衝鉸鏈+H33底座", price: 82 },
    { colorCode: "A1TT003A-H33", name: "TITUS TGE 3分 緩衝鉸鏈+H33底座", price: 87 },
    { colorCode: "A1TT001A-H42", name: "TITUS TGE 入柱 緩衝鉸鏈+H42底座", price: 92 },
    { colorCode: "A1TT009A-H33", name: "TITUS TGE 負90度 緩衝鉸鏈+H33底座", price: 152 },
    { colorCode: "A1TT008-H33",  name: "TITUS TE 170度 鉸鏈+H33底座", price: 158 },
  ];
  for (const h of TITUS_HINGES) {
    materialsToCreate.push({
      category: "HARDWARE_HINGE" as never,
      brand: "TITUS",
      colorCode: h.colorCode,
      name: h.name,
      unit: "個",
      price: h.price,
      minCai: null, wasteRate: 0, sortOrder: sortOrder++,
    });
  }

  // ── blum 鉸鏈 ─────────────────────────────────────────────
  const BLUM_HINGES = [
    { colorCode: "A134006-1", name: "blum 四代 6分 鉸鏈+底座", price: 51 },
    { colorCode: "A134003-1", name: "blum 四代 3分 鉸鏈+底座", price: 76 },
    { colorCode: "A134001-1", name: "blum 四代 入柱 鉸鏈+底座", price: 96 },
    { colorCode: "A134106-1", name: "blum 四代 6分 厚門鉸鏈+底座", price: 133 },
    { colorCode: "A134009-1", name: "blum 四代 負90度 鉸鏈+底座", price: 202 },
    { colorCode: "A134008-1", name: "blum 四代 170度 鉸鏈+底座", price: 208 },
  ];
  for (const h of BLUM_HINGES) {
    materialsToCreate.push({
      category: "HARDWARE_HINGE" as never,
      brand: "blum",
      colorCode: h.colorCode,
      name: h.name,
      unit: "個",
      price: h.price,
      minCai: null, wasteRate: 0, sortOrder: sortOrder++,
    });
  }

  // ── 3M 三截滑軌 ───────────────────────────────────────────
  const SLIDES = [
    { name: "3M52G輕拉力中型三截緩衝式滑軌 250mm", price: 295 },
    { name: "3M52G輕拉力中型三截緩衝式滑軌 300mm", price: 300 },
    { name: "3M52G輕拉力中型三截緩衝式滑軌 350mm", price: 305 },
    { name: "3M52G輕拉力中型三截緩衝式滑軌 400mm", price: 310 },
    { name: "3M52G輕拉力中型三截緩衝式滑軌 450mm", price: 315 },
    { name: "3M52G輕拉力中型三截緩衝式滑軌 500mm", price: 320 },
    { name: "3M52G輕拉力中型三截緩衝式滑軌 600mm", price: 330 },
    { name: "1B68新省力-隱藏式緩衝滑軌 250~500mm", price: 500 },
    { name: "1B68新省力-隱藏式緩衝滑軌 550~600mm", price: 550 },
  ];
  for (const s of SLIDES) {
    materialsToCreate.push({
      category: "HARDWARE_RAIL" as never,
      brand: "3M",
      name: s.name,
      unit: "組",
      price: s.price,
      minCai: null, wasteRate: 0, sortOrder: sortOrder++,
    });
  }

  // Batch create
  await prisma.material.createMany({ data: materialsToCreate as never });

  console.log(`✅ Seeded ${materialsToCreate.length} materials`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
```

- [ ] **Step 2: 執行 seed**

```bash
npm run db:seed
```

Expected：
```
✅ Seeded [N] materials
```

- [ ] **Step 3: 確認資料**

```bash
npm run db:studio
```

在 Prisma Studio 確認 Material 表有資料，且 brand / colorCode / boardType / minCai 欄位正確填入。

- [ ] **Step 4: Commit**

```bash
git add prisma/seed.ts
git commit -m "feat: seed price list data from 葳禾實業 114年牌價表"
```

---

## Task 13: 最終驗收

- [ ] **Step 1: 完整型別檢查**

```bash
npm run typecheck
```

Expected: 無錯誤。

- [ ] **Step 2: 建置**

```bash
npm run build
```

Expected: Build 成功。

- [ ] **Step 3: 啟動並手動測試**

```bash
npm run dev
```

測試清單：
1. 登入 `demo@decoest.com` / `password123`
2. 前往材料管理：左欄顯示品牌分類、中欄顯示品項列表、右欄可編輯
3. 新增一筆材料，確認出現在列表
4. 前往專案 → cabinet 估價：
   - 為側板選 EGGER H1145 ST10 18mm 櫃體封PVC
   - 確認即時結果顯示才數和費用
   - 開啟加工選項：選「2長封ABS」，確認費用增加
   - 新增一片鉸鏈門，選材料，勾選「對花直紋」，確認費用 ×1.2
5. 下方板材統整區：確認才數加總正確，minCai 補足時顯示 ⚠
6. 儲存估價，重新整理後資料仍存在

- [ ] **Step 4: 最終 Commit**

```bash
git add -A
git commit -m "feat: complete estimation redesign — brand-based materials, minCai billing, addon options"
```
