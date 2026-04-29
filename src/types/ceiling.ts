// src/types/ceiling.ts

import type { MaterialRef } from "./cabinet";

export interface CeilingInput {
  areaPing: number;
  autoPerimeter: boolean;
  roomLengthM?: number;
  roomWidthM?: number;
  manualPerimeterM?: number;
  angleMaterialRef: MaterialRef | null;
  boardMaterialRef: MaterialRef | null;
  perimeterAngleMaterialRef: MaterialRef | null;
}

export interface CeilingLineItem {
  name: string;
  quantity: number;
  unit: string;
  materialRef: MaterialRef | null;
  unitCost: number;
  subtotal: number;
  calculation: string;
}

export interface CeilingResult {
  areaPing: number;
  perimeterM: number;
  items: CeilingLineItem[];
  totalCost: number;
}
