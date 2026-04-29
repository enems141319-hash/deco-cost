import assert from "node:assert/strict";
import { calculateCabinetUnit } from "./cabinet";
import { DEFAULT_DOOR_ADDONS } from "@/types";
import type { CabinetUnitInput, MaterialRef } from "@/types";

const bodyMaterial: MaterialRef = {
  materialId: "body-1",
  materialName: "EGGER H1145 ST10 18mm櫃體封PVC",
  unit: "才",
  pricePerUnit: 100,
  minCai: 1,
};

const thickBodyMaterial: MaterialRef = {
  materialId: "body-25",
  materialName: "HORNG CHANG G6505 ST68 25mm封ABS",
  unit: "才",
  pricePerUnit: 170,
  minCai: 1,
};

const doorMaterial: MaterialRef = {
  materialId: "door-1",
  materialName: "EGGER H1145 ST10 18mm 4E門板封ABS",
  unit: "才",
  pricePerUnit: 200,
  minCai: 1.5,
};

const baseUnit: CabinetUnitInput = {
  id: "unit-1",
  name: "測試桶身",
  widthCm: 10,
  depthCm: 10,
  heightCm: 10,
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
  doors: [],
  hardwareItems: [],
  kickPlate: null,
};

const minCaiResult = calculateCabinetUnit(baseUnit);
assert.equal(minCaiResult.panels.length, 4);
assert.equal(minCaiResult.panels[0].billableTotalArea.cai, 1);
assert.equal(minCaiResult.summary.panelsCost, 400);

const cabinetWith18mmBody = calculateCabinetUnit({
  ...baseUnit,
  widthCm: 40,
  panelMaterialRef: bodyMaterial,
});
assert.equal(cabinetWith18mmBody.panels.find((panel) => panel.id === "unit-1-top")?.widthCm, 36.4);
assert.equal(cabinetWith18mmBody.panels.find((panel) => panel.id === "unit-1-bottom")?.widthCm, 36.4);

const cabinetWith25mmBody = calculateCabinetUnit({
  ...baseUnit,
  widthCm: 40,
  panelMaterialRef: thickBodyMaterial,
});
assert.equal(cabinetWith25mmBody.panels.find((panel) => panel.id === "unit-1-top")?.widthCm, 35);
assert.equal(cabinetWith25mmBody.panels.find((panel) => panel.id === "unit-1-bottom")?.widthCm, 35);

const cabinetWithBackPanel = calculateCabinetUnit({
  ...baseUnit,
  widthCm: 60,
  heightCm: 80,
  hasBackPanel: true,
  backPanelMaterialRef: bodyMaterial,
});
const backPanel = cabinetWithBackPanel.panels.find((panel) => panel.id === "unit-1-back");
assert.equal(backPanel?.widthCm, 57.8);
assert.equal(backPanel?.heightCm, 77.8);
assert.equal(
  cabinetWithBackPanel.panels.find((panel) => panel.id === "unit-1-left")?.note,
  "背板溝槽: 離後緣18mm, 寬8.5mm, 深9mm",
);
assert.equal(
  cabinetWithBackPanel.panels.find((panel) => panel.id === "unit-1-top")?.note,
  "背板溝槽: 離後緣18mm, 寬8.5mm, 深9mm",
);
assert.equal(cabinetWithBackPanel.summary.addonsBreakdown.backPanelGroove, 480);
assert.equal(cabinetWithBackPanel.summary.addonsCost, 480);
assert.equal(
  cabinetWithBackPanel.summary.totalCost,
  cabinetWithBackPanel.summary.panelsCost + 480,
);

const lightGrooveResult = calculateCabinetUnit({
  ...baseUnit,
  widthCm: 260,
  heightCm: 250,
  addons: {
    ...baseUnit.addons,
    lightGrooves: {
      topInner: { enabled: true, offsetFromFrontMm: 55 },
      sideInner: { enabled: true, offsetFromFrontMm: 65 },
    },
  },
  middleDividers: [
    {
      id: "light-divider",
      widthCm: 60,
      heightCm: 250,
      quantity: 1,
      materialRef: bodyMaterial,
      addons: {
        doubleDrillHoles: false,
        nonStandardHoles: false,
        lightGroove: { side: "left", offsetFromFrontMm: 70 },
      },
    },
  ],
  shelves: [
    {
      id: "light-shelf",
      widthCm: 240,
      depthCm: 35,
      quantity: 1,
      materialRef: bodyMaterial,
      lightGroove: { side: "bottom", offsetFromFrontMm: 80 },
    },
  ],
});
assert.equal(lightGrooveResult.summary.addonsBreakdown.lightGroove, 1620);
assert.equal(lightGrooveResult.panels.find((panel) => panel.id === "unit-1-top")?.addonsCost, 360);
assert.equal(lightGrooveResult.panels.find((panel) => panel.id === "unit-1-left")?.addonsCost, 360);
assert.equal(lightGrooveResult.panels.find((panel) => panel.id === "unit-1-right")?.addonsCost, 360);
assert.equal(lightGrooveResult.internalParts.find((panel) => panel.id === "light-divider")?.addonsCost, 360);
assert.equal(lightGrooveResult.internalParts.find((panel) => panel.id === "light-shelf")?.addonsCost, 180);
assert.match(lightGrooveResult.panels.find((panel) => panel.id === "unit-1-top")?.note ?? "", /燈溝: 上板內側, 離前緣55mm, 寬10mm, 深11mm/);
assert.match(lightGrooveResult.internalParts.find((panel) => panel.id === "light-divider")?.note ?? "", /燈溝: 左側, 離前緣70mm, 寬10mm, 深11mm/);

const shortLightGrooveMultiQtyResult = calculateCabinetUnit({
  ...baseUnit,
  widthCm: 100,
  depthCm: 30,
  heightCm: 203,
  quantity: 2,
  addons: {
    ...baseUnit.addons,
    lightGrooves: {
      topInner: { enabled: true, offsetFromFrontMm: 55 },
      sideInner: { enabled: true, offsetFromFrontMm: 65 },
    },
  },
});
const shortTopLightGroove = shortLightGrooveMultiQtyResult.panels
  .find((panel) => panel.id === "unit-1-top")
  ?.processes.find((process) => process.id === "unit-1-top-light-groove");
const shortSideLightGroove = shortLightGrooveMultiQtyResult.panels
  .find((panel) => panel.id === "unit-1-left")
  ?.processes.find((process) => process.id === "unit-1-left-light-groove");
assert.equal(shortTopLightGroove?.unitCost, 180);
assert.equal(shortTopLightGroove?.quantity, 2);
assert.equal(shortTopLightGroove?.cost, 360);
assert.equal(shortSideLightGroove?.unitCost, 180);
assert.equal(shortSideLightGroove?.quantity, 2);
assert.equal(shortSideLightGroove?.cost, 360);

const addonResult = calculateCabinetUnit({
  ...baseUnit,
  addons: {
    frontEdgeABS: "two_long",
  },
});
assert.equal(addonResult.summary.addonsBreakdown.frontEdgeABS, 40);
assert.equal(addonResult.summary.addonsCost, 40);
assert.equal(addonResult.summary.totalCost, 440);

const doorResult = calculateCabinetUnit({
  ...baseUnit,
  panelMaterialRef: null,
  doors: [
    {
      id: "door-1",
      type: "HINGED",
      name: "測試門片",
      widthCm: 10,
      heightCm: 10,
      quantity: 1,
      materialRef: doorMaterial,
      addons: {
        ...DEFAULT_DOOR_ADDONS,
        patternMatch: "grain",
        temperedGlass: true,
        hingeHoleDrilling: true,
      },
      hingeMaterialRef: null,
      railMaterialRef: null,
    },
  ],
});
assert.equal(doorResult.doors[0].billableTotalArea.cai, 1.5);
assert.equal(doorResult.summary.addonsBreakdown.patternMatch, 60);
assert.equal(doorResult.summary.addonsBreakdown.temperedGlass, 75);
assert.equal(doorResult.summary.addonsBreakdown.hingeHoleDrilling, 10);
assert.equal(doorResult.summary.doorsCost, 445);

const dividerAddonResult = calculateCabinetUnit({
  ...baseUnit,
  middleDividers: [
    {
      id: "divider-1",
      widthCm: 10,
      heightCm: 10,
      quantity: 1,
      materialRef: bodyMaterial,
      addons: {
        doubleDrillHoles: true,
        nonStandardHoles: true,
      },
    },
  ],
});
assert.equal(dividerAddonResult.internalParts[0].addonsCost, 10);
assert.equal(dividerAddonResult.summary.internalPartsCost, 110);

const pushDoorHardware: MaterialRef = {
  materialId: "push-door-1",
  materialName: "推拉門五金 4尺",
  unit: "組",
  pricePerUnit: 500,
  minCai: null,
};
const slidingDoorResult = calculateCabinetUnit({
  ...baseUnit,
  doors: [
    {
      id: "sliding-door-1",
      type: "SLIDING",
      name: "滑門",
      widthCm: 45,
      heightCm: 90,
      quantity: 2,
      materialRef: doorMaterial,
      addons: {
        ...DEFAULT_DOOR_ADDONS,
        patternMatch: "none",
        temperedGlass: false,
        hingeHoleDrilling: false,
      },
      hingeMaterialRef: null,
      railMaterialRef: pushDoorHardware,
    },
  ],
});
assert.equal(slidingDoorResult.hardware.length, 1);
assert.equal(slidingDoorResult.hardware[0].name, "推拉門五金");
assert.equal(slidingDoorResult.hardware[0].quantity, 2);
assert.equal(slidingDoorResult.hardware[0].unitCost, 500);
assert.equal(slidingDoorResult.hardware[0].subtotal, 1000);

const wireMeshMaterial: MaterialRef = {
  materialId: "mesh-1",
  materialName: "擴張網-菱形 (1.6*10*21mm，不含烤漆)",
  unit: "才",
  pricePerUnit: 150,
  minCai: 3,
};

const aluminumHandleMaterial: MaterialRef = {
  materialId: "aluminum-handle-1",
  materialName: "鋁把手 397mm (型號：028)",
  unit: "支",
  pricePerUnit: 230,
  minCai: null,
};

const doorAddonsResult = calculateCabinetUnit({
  ...baseUnit,
  panelMaterialRef: null,
  doors: [
    {
      id: "mesh-door-1",
      type: "HINGED",
      name: "鐵網門",
      widthCm: 45,
      heightCm: 90,
      quantity: 2,
      materialRef: doorMaterial,
      addons: {
        patternMatch: "none",
        temperedGlass: false,
        hingeHoleDrilling: false,
        wireMeshPaint: true,
        profileHandle: {
          style: "SFJA",
          lengthCm: 30,
          lengthModification: true,
        },
      },
      hingeMaterialRef: null,
      railMaterialRef: null,
      wireMeshMaterialRef: wireMeshMaterial,
      aluminumHandleMaterialRef: aluminumHandleMaterial,
    },
  ],
});
assert.equal(doorAddonsResult.hardware.some((item) => item.name === "鐵網"), true);
assert.equal(doorAddonsResult.hardware.find((item) => item.name === "鐵網")?.quantity, 8.8227);
assert.equal(doorAddonsResult.hardware.find((item) => item.name === "鐵網")?.subtotal, 1323);
assert.equal(doorAddonsResult.hardware.find((item) => item.name === "鐵網烤漆加工")?.subtotal, 529);
assert.equal(doorAddonsResult.hardware.find((item) => item.name === "鋁製把手")?.subtotal, 460);
assert.equal(doorAddonsResult.hardware.find((item) => item.name === "造型把手加工 SFJA")?.subtotal, 1530);
assert.equal(doorAddonsResult.hardware.find((item) => item.name === "造型把手長度修改")?.subtotal, 200);

const extraHardwareMaterial: MaterialRef = {
  materialId: "closet-rod-1",
  materialName: "吊衣桿 800mm",
  unit: "支",
  pricePerUnit: 110,
  minCai: null,
};

const extraHardwareResult = calculateCabinetUnit({
  ...baseUnit,
  hardwareItems: [
    {
      id: "closet-rod",
      name: "吊衣桿",
      quantity: 3,
      materialRef: extraHardwareMaterial,
    },
  ],
});
assert.equal(extraHardwareResult.hardware.at(-1)?.name, "吊衣桿");
assert.equal(extraHardwareResult.hardware.at(-1)?.subtotal, 330);

const drawerRail: MaterialRef = {
  materialId: "rail-1",
  materialName: "3M52G 抽屜滑軌",
  unit: "組",
  pricePerUnit: 180,
  minCai: null,
};

const drawerMinMaterial: MaterialRef = {
  materialId: "drawer-min-1",
  materialName: "測試抽屜板 18mm",
  unit: "才",
  pricePerUnit: 100,
  minCai: 3,
};
const tinyDrawerResult = calculateCabinetUnit({
  ...baseUnit,
  panelMaterialRef: drawerMinMaterial,
  drawers: [
    {
      id: "tiny-drawer",
      name: "小抽屜",
      widthCm: 20,
      heightCm: 10,
      depthCm: 20,
      railLengthCm: 20,
      grooveSpec: "8.5",
      quantity: 1,
      railMaterialRef: null,
      wallMaterialRef: drawerMinMaterial,
      bottomMaterialRef: null,
    },
  ],
});
const tinyDrawerParts = tinyDrawerResult.internalParts.filter((part) => part.id.startsWith("tiny-drawer-"));
assert.equal(
  Number(tinyDrawerParts
    .filter((part) => part.materialRef?.materialId === drawerMinMaterial.materialId)
    .reduce((sum, part) => sum + part.billableTotalArea.cai, 0)
    .toFixed(4)),
  3,
);
assert.equal(
  tinyDrawerParts
    .filter((part) => part.materialRef?.materialId === drawerMinMaterial.materialId)
    .reduce((sum, part) => sum + part.subtotal, 0),
  300,
);

const drawerResult = calculateCabinetUnit({
  ...baseUnit,
  drawers: [
    {
      id: "drawer-1",
      name: "抽屜",
      widthCm: 60,
      heightCm: 16,
      depthCm: 45,
      railLengthCm: 45,
      quantity: 3,
      railMaterialRef: drawerRail,
      wallMaterialRef: bodyMaterial,
      bottomMaterialRef: bodyMaterial,
      grooveSpec: "8.5",
    },
  ],
});
assert.equal(drawerResult.hardware.at(-1)?.name, "抽屜滑軌");
assert.equal(drawerResult.hardware.at(-1)?.quantity, 3);
assert.equal(drawerResult.summary.hardwareCost, 540);

const drawerParts = drawerResult.internalParts.filter((part) => part.id.startsWith("drawer-1-"));
assert.equal(drawerParts.length, 4);
assert.deepEqual(
  drawerParts.map((part) => ({
    name: part.name,
    widthCm: part.widthCm,
    heightCm: part.heightCm,
    quantity: part.quantity,
    note: part.note,
  })),
  [
    { name: "抽屜面板/抽頭", widthCm: 60, heightCm: 16, quantity: 3, note: undefined },
    { name: "抽屜左右側板", widthCm: 45, heightCm: 9, quantity: 6, note: "內側下方打溝 (8.5)" },
    { name: "抽屜前後牆板", widthCm: 49.8, heightCm: 9, quantity: 6, note: "內側下方打溝 (8.5)" },
    { name: "抽屜8mm底板", widthCm: 51.2, heightCm: 42.8, quantity: 3, note: undefined },
  ],
);

console.log("cabinet redesign calculation tests passed");
