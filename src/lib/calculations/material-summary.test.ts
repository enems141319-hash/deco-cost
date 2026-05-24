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
  materialName: "Body board 18mm",
  unit: "才",
  pricePerUnit: 100,
  minCai: 1,
};

const doorMaterial: MaterialRef = {
  materialId: "door",
  materialName: "Door board 18mm",
  unit: "才",
  pricePerUnit: 200,
  minCai: 1,
};

const hingeMaterial: MaterialRef = {
  materialId: "hinge",
  materialName: "Hinge",
  unit: "組",
  pricePerUnit: 30,
  minCai: null,
};

const baseUnit: CabinetUnitInput = {
  id: "unit-1",
  name: "Test cabinet",
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
      name: "Left door",
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
assert.equal(unitSummary.rows[doorRowIndex]?.material, "Door board 18mm");

const rowsAfterDoor = unitSummary.rows.slice(doorRowIndex + 1, doorRowIndex + 6);
assert.deepEqual(
  rowsAfterDoor.map((row) => row.kind),
  ["process", "process", "process", "process", "hardware"],
);
assert.equal(rowsAfterDoor.at(-1)?.category, "門片五金");
assert.equal(rowsAfterDoor.at(-1)?.materialId, "hinge");

assert.equal(unitSummary.hardwareRows.length, 1);
assert.equal(unitSummary.hardwareRows[0]?.materialId, "hinge");
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

const noHingeQuoteUnit: CabinetUnitInput = {
  ...baseUnit,
  id: "unit-no-hinge-quote",
  doors: baseUnit.doors.map((door) => ({
    ...door,
    id: "door-no-hinge-quote",
    includeHingeInQuote: false,
  })),
};
const noHingeQuoteSummary = buildCabinetUnitMaterialSummary(
  calculateCabinetUnit(noHingeQuoteUnit),
  noHingeQuoteUnit,
);
assert.equal(noHingeQuoteSummary.hardwareRows.some((row) => row.materialId === hingeMaterial.materialId), false);

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
const leftPanelAddon = multiPanelSummary.rows.find((row) => row.id === "unit-1-left:unit-1-left-front-edge-abs");
assert.equal(leftPanelAddon?.quantity, 160);
assert.equal(
  leftPanelAddon?.subtotal,
  multiPanelProcessingResult.panels.find((panel) => panel.id === "unit-1-left")?.addonsCost,
);
const leftBackGroove = multiPanelSummary.rows.find((row) => row.id === "unit-1-left:unit-1-left-back-groove");
assert.equal(leftBackGroove?.quantity, 2);
assert.equal(leftBackGroove?.subtotal, (leftBackGroove?.unitPrice ?? 0) * 2);
assert.equal(leftBackGroove?.sourceItemName, "左側板");
assert.equal(leftBackGroove?.sourceMaterial, "Body board 18mm");

const drawerRailMaterial: MaterialRef = {
  materialId: "drawer-rail",
  materialName: "Drawer rail",
  unit: "組",
  pricePerUnit: 180,
  minCai: null,
};
const drawerInput = {
  id: "random-drawer-id",
  name: "Test drawer",
  widthCm: 60,
  heightCm: 16,
  depthCm: 45,
  railLengthCm: 45,
  grooveSpec: "8.5" as const,
  quantity: 1,
  railMaterialRef: drawerRailMaterial,
  wallMaterialRef: bodyMaterial,
  bottomMaterialRef: bodyMaterial,
};
const drawerSummary = buildCabinetUnitMaterialSummary(calculateCabinetUnit({
  ...baseUnit,
  doors: [],
  drawers: [drawerInput],
}), {
  ...baseUnit,
  doors: [],
  drawers: [drawerInput],
});
assert.equal(drawerSummary.rows.some((row) => row.category === "抽屜板材"), true);
assert.equal(drawerSummary.rows.some((row) => row.category === "抽屜五金" && row.materialId === drawerRailMaterial.materialId), true);
assert.equal(drawerSummary.rows.some((row) => row.category === "抽屜加工" && row.kind === "process"), true);

const drawerWithoutRailQuote = {
  ...drawerInput,
  id: "drawer-no-rail-quote",
  includeRailInQuote: false,
};
const drawerSummaryWithoutRail = buildCabinetUnitMaterialSummary(calculateCabinetUnit({
  ...baseUnit,
  doors: [],
  drawers: [drawerWithoutRailQuote],
}), {
  ...baseUnit,
  doors: [],
  drawers: [drawerWithoutRailQuote],
});
assert.equal(drawerSummaryWithoutRail.rows.some((row) => row.materialId === drawerRailMaterial.materialId), false);

console.log("material-summary tests passed");
