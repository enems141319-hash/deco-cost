import assert from "node:assert/strict";
import { calculateCabinetProject, calculateCabinetUnit } from "./cabinet";
import {
  buildCabinetProjectMaterialSummary,
  buildCabinetUnitMaterialSummary,
} from "./material-summary";
import { DEFAULT_DOOR_ADDONS } from "@/types";
import type { CabinetUnitInput, CabinetUnitResult, MaterialRef } from "@/types";

const bodyMaterial: MaterialRef = {
  materialId: "body",
  materialName: "櫃體板 18mm",
  unit: "才",
  pricePerUnit: 100,
  minCai: 1,
};

const doorMaterial: MaterialRef = {
  materialId: "door",
  materialName: "門片板 18mm",
  unit: "才",
  pricePerUnit: 200,
  minCai: 1,
};

const hingeMaterial: MaterialRef = {
  materialId: "hinge",
  materialName: "鉸鏈",
  unit: "個",
  pricePerUnit: 30,
  minCai: null,
};

const baseUnit: CabinetUnitInput = {
  id: "unit-1",
  name: "測試桶身",
  widthCm: 60,
  depthCm: 45,
  heightCm: 80,
  quantity: 1,
  hasBackPanel: false,
  panelMaterialRef: bodyMaterial,
  backPanelMaterialRef: null,
  addons: {
    frontEdgeABS: "none",
  },
  middleDividers: [],
  shelves: [],
  drawers: [],
  doors: [
    {
      id: "door-1",
      type: "HINGED",
      name: "測試門片",
      widthCm: 30,
      heightCm: 80,
      quantity: 2,
      materialRef: doorMaterial,
      addons: {
        ...DEFAULT_DOOR_ADDONS,
        patternMatch: "grain",
        hingeHoleDrilling: true,
        profileHandle: {
          style: "SFJA",
          lengthCm: 10,
          lengthModification: true,
        },
      },
      hingeMaterialRef: hingeMaterial,
      railMaterialRef: null,
    },
  ],
  hardwareItems: [],
  kickPlate: null,
};

const unitResult = calculateCabinetUnit(baseUnit);
const unitSummary = buildCabinetUnitMaterialSummary(unitResult, baseUnit);

const doorRowIndex = unitSummary.rows.findIndex((row) => row.id === "door-1");
assert.notEqual(doorRowIndex, -1);
assert.equal(unitSummary.rows[doorRowIndex]?.material, "門片板 18mm");
assert.deepEqual(
  unitSummary.rows.slice(doorRowIndex + 1, doorRowIndex + 5).map((row) => row.itemName),
  ["門片對花", "門板鉸鏈孔", "造型把手加工 SFJA", "造型把手長度修改"],
);

assert.equal(unitSummary.hardwareRows.length, 1);
assert.equal(unitSummary.hardwareRows[0]?.itemName, "鉸鏈");
assert.equal(
  unitSummary.processingTotal,
  unitSummary.processRows.reduce((sum, row) => sum + (row.subtotal ?? 0), 0),
);

const doorMaterialTotal = unitSummary.materialCaiTotals.find((row) => row.materialId === "door");
assert.equal(doorMaterialTotal?.cai, unitResult.doors[0]?.billableTotalArea.cai);

const projectSummary = buildCabinetProjectMaterialSummary(calculateCabinetProject([baseUnit]), [baseUnit]);
assert.equal(projectSummary.materialCaiTotals.find((row) => row.materialId === "door")?.cai, doorMaterialTotal?.cai);
assert.equal(projectSummary.hardwareRows.length, 1);
assert.equal(projectSummary.processingTotal, unitSummary.processingTotal);

const legacyUnitResult = {
  ...unitResult,
  panels: unitResult.panels.map((panel) => {
    const { processes: _processes, lightGrooveCost: _lightGrooveCost, ...legacyPanel } = panel;
    return legacyPanel;
  }),
} as unknown as CabinetUnitResult;
const legacySummary = buildCabinetUnitMaterialSummary(legacyUnitResult, baseUnit);
assert.equal(legacySummary.rows.length > 0, true);
assert.equal(legacySummary.processRows.length > 0, true);

const multiPanelProcessingResult = calculateCabinetUnit({
  ...baseUnit,
  quantity: 2,
  hasBackPanel: true,
  backPanelMaterialRef: bodyMaterial,
  addons: {
    frontEdgeABS: "one_long",
  },
  doors: [],
});
const multiPanelSummary = buildCabinetUnitMaterialSummary(multiPanelProcessingResult, {
  ...baseUnit,
  quantity: 2,
  hasBackPanel: true,
  backPanelMaterialRef: bodyMaterial,
  addons: {
    frontEdgeABS: "one_long",
  },
  doors: [],
});
const leftPanelAddon = multiPanelSummary.rows.find((row) => row.id === "unit-1-left:panel-addon");
assert.equal(leftPanelAddon?.quantity, 2);
assert.equal(
  leftPanelAddon?.subtotal,
  multiPanelProcessingResult.panels.find((panel) => panel.id === "unit-1-left")?.addonsCost,
);
const leftBackGroove = multiPanelSummary.rows.find((row) => row.id === "unit-1-left:unit-1-left-back-groove");
assert.equal(leftBackGroove?.quantity, 2);
assert.equal(leftBackGroove?.subtotal, (leftBackGroove?.unitPrice ?? 0) * 2);

console.log("material summary tests passed");
