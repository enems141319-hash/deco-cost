// src/lib/calculations/ceiling.ts
// ✅ 純函式 — 零 UI 依賴、所有進位規則從 UNIT_CONFIG 讀取

import { UNIT_CONFIG } from "../config/units";
import type { CeilingInput, CeilingLineItem, CeilingResult } from "../../types";

function round(n: number, decimals: number): number {
  const factor = Math.pow(10, decimals);
  return Math.round(n * factor) / factor;
}

function resolvePerimeterM(input: CeilingInput): number | null {
  if (input.autoPerimeter) {
    if (input.roomLengthM == null || input.roomWidthM == null) return null;
    return round(2 * (input.roomLengthM + input.roomWidthM), 2);
  }
  return input.manualPerimeterM ?? null;
}

function buildLineItem(params: {
  name: string;
  rawQuantity: number;
  unit: string;
  materialRef: CeilingInput["angleMaterialRef"];
  calculation: string;
}): CeilingLineItem {
  const quantity = Math.ceil(params.rawQuantity);
  const unitCost = params.materialRef?.pricePerUnit ?? 0;
  return {
    name: params.name,
    quantity,
    unit: params.unit,
    materialRef: params.materialRef,
    unitCost,
    subtotal: round(quantity * unitCost, UNIT_CONFIG.COST_DECIMAL_PLACES),
    calculation: params.calculation,
  };
}

export function calculateCeilingMaterial(input: CeilingInput): CeilingResult {
  const { areaPing, angleMaterialRef, boardMaterialRef, perimeterAngleMaterialRef } = input;
  const perimeterM = resolvePerimeterM(input);
  const items: CeilingLineItem[] = [];

  // 1. 天花角材
  const rawAngleQty = areaPing * UNIT_CONFIG.CEILING_ANGLE_PER_PING;
  items.push(buildLineItem({
    name: "天花角材",
    rawQuantity: rawAngleQty,
    unit: "支",
    materialRef: angleMaterialRef,
    calculation: `${areaPing} 坪 × ${UNIT_CONFIG.CEILING_ANGLE_PER_PING} 支/坪 = ${rawAngleQty} → ↑${Math.ceil(rawAngleQty)} 支`,
  }));

  // 2. 矽酸鈣板
  const rawBoardQty = areaPing * UNIT_CONFIG.CEILING_BOARD_PER_PING;
  items.push(buildLineItem({
    name: "矽酸鈣板",
    rawQuantity: rawBoardQty,
    unit: "片",
    materialRef: boardMaterialRef,
    calculation: `${areaPing} 坪 × ${UNIT_CONFIG.CEILING_BOARD_PER_PING} 片/坪 = ${rawBoardQty} → ↑${Math.ceil(rawBoardQty)} 片`,
  }));

  // 3. 周邊角材（需要周長）
  if (perimeterM !== null) {
    const perimeterCm = perimeterM * 100;
    const unitLen = UNIT_CONFIG.CEILING_PERIMETER_ANGLE_LENGTH_CM;
    const rawPerimQty = perimeterCm / unitLen;
    items.push(buildLineItem({
      name: "周邊角材",
      rawQuantity: rawPerimQty,
      unit: "支",
      materialRef: perimeterAngleMaterialRef,
      calculation: `周長 ${perimeterM}m = ${perimeterCm}cm ÷ ${unitLen}cm(8尺) = ${round(rawPerimQty, 2)} → ↑${Math.ceil(rawPerimQty)} 支`,
    }));
  }

  return {
    areaPing,
    perimeterM: perimeterM ?? 0,
    items,
    totalCost: items.reduce((acc, i) => acc + i.subtotal, 0),
  };
}
