import assert from "node:assert/strict";
import { calculateCabinetUnit } from "./cabinet";
import { DEFAULT_DOOR_ADDONS, DEFAULT_MIDDLE_DIVIDER_ADDONS, DEFAULT_UNIT_ADDONS } from "@/types";
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

const hingeMaterial: MaterialRef = {
  materialId: "hinge-1",
  materialName: "hinge",
  unit: "pc",
  pricePerUnit: 30,
  minCai: null,
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

const cabinetWithTopCoverSide = calculateCabinetUnit({
  ...baseUnit,
  widthCm: 90,
  depthCm: 60,
  heightCm: 240,
  bodyPanelJoinMode: "TOP_COVERS_SIDES",
  panelMaterialRef: bodyMaterial,
  topPanelMaterialRef: thickBodyMaterial,
  sidePanelMaterialRef: bodyMaterial,
  bottomPanelMaterialRef: bodyMaterial,
});
assert.equal(cabinetWithTopCoverSide.panels.find((panel) => panel.id === "unit-1-left")?.widthCm, 237.5);
assert.equal(cabinetWithTopCoverSide.panels.find((panel) => panel.id === "unit-1-right")?.widthCm, 237.5);
assert.equal(cabinetWithTopCoverSide.panels.find((panel) => panel.id === "unit-1-top")?.widthCm, 90);
assert.equal(cabinetWithTopCoverSide.panels.find((panel) => panel.id === "unit-1-bottom")?.widthCm, 86.4);
assert.equal(cabinetWithTopCoverSide.panels.find((panel) => panel.id === "unit-1-top")?.materialRef?.materialId, thickBodyMaterial.materialId);
assert.equal(cabinetWithTopCoverSide.panels.find((panel) => panel.id === "unit-1-left")?.materialRef?.materialId, bodyMaterial.materialId);

const cabinetWithPerPanelFrontEdge = calculateCabinetUnit({
  ...baseUnit,
  widthCm: 90,
  depthCm: 60,
  heightCm: 240,
  panelMaterialRef: {
    ...bodyMaterial,
    minCai: null,
  },
  addons: {
    ...baseUnit.addons,
    bodyPanelProcesses: {
      ...DEFAULT_UNIT_ADDONS.bodyPanelProcesses!,
      top: {
        ...DEFAULT_UNIT_ADDONS.bodyPanelProcesses!.top,
        frontEdgeABS: "one_long",
      },
      bottom: {
        ...DEFAULT_UNIT_ADDONS.bodyPanelProcesses!.bottom,
        frontEdgeABS: "one_long",
      },
      left: {
        ...DEFAULT_UNIT_ADDONS.bodyPanelProcesses!.left,
        frontEdgeABS: "none",
      },
      right: {
        ...DEFAULT_UNIT_ADDONS.bodyPanelProcesses!.right,
        frontEdgeABS: "none",
      },
    },
  },
});
const perPanelTop = cabinetWithPerPanelFrontEdge.panels.find((panel) => panel.id === "unit-1-top");
const perPanelBottom = cabinetWithPerPanelFrontEdge.panels.find((panel) => panel.id === "unit-1-bottom");
const perPanelLeft = cabinetWithPerPanelFrontEdge.panels.find((panel) => panel.id === "unit-1-left");
const perPanelTopFrontEdge = perPanelTop?.processes.find((process) => process.id === "unit-1-top-front-edge-abs");
const perPanelBottomFrontEdge = perPanelBottom?.processes.find((process) => process.id === "unit-1-bottom-front-edge-abs");
assert.equal(perPanelTop?.addonsCost, 432);
assert.equal(perPanelBottom?.addonsCost, 432);
assert.equal(perPanelLeft?.addonsCost, 0);
assert.equal(perPanelTopFrontEdge?.label, "板厚處切斜邊封ABS");
assert.equal(perPanelTopFrontEdge?.quantity, 86.4);
assert.equal(perPanelTopFrontEdge?.unitCost, 5);
assert.equal(perPanelTopFrontEdge?.cost, 432);
assert.equal(perPanelBottomFrontEdge?.quantity, 86.4);
assert.equal(perPanelBottomFrontEdge?.cost, 432);

const sidePanelRecessResult = calculateCabinetUnit({
  ...baseUnit,
  quantity: 2,
  addons: {
    ...baseUnit.addons,
    sidePanelInset: { enabled: true },
  },
});
const sidePanelInsetProcess = sidePanelRecessResult.panels
  .flatMap((panel) => panel.processes)
  .find((process) => process.id === "unit-1-left-side-panel-inset");
const rightSidePanelInsetProcess = sidePanelRecessResult.panels
  .flatMap((panel) => panel.processes)
  .find((process) => process.id === "unit-1-right-side-panel-inset");
assert.equal(sidePanelInsetProcess?.label, "側板崁凹(檔板設計)");
assert.equal(sidePanelInsetProcess?.quantity, 2);
assert.equal(sidePanelInsetProcess?.unitCost, 200);
assert.equal(sidePanelInsetProcess?.cost, 400);
assert.equal(rightSidePanelInsetProcess?.label, "側板崁凹(檔板設計)");
assert.equal(rightSidePanelInsetProcess?.quantity, 2);
assert.equal(rightSidePanelInsetProcess?.includedInSubtotal, false);
assert.equal(rightSidePanelInsetProcess?.cost, 0);
assert.equal(sidePanelRecessResult.summary.addonsBreakdown.sidePanelInset, 400);

const panelHardwareResult = calculateCabinetUnit({
  ...baseUnit,
  quantity: 2,
  addons: {
    ...baseUnit.addons,
    bodyPanelProcesses: {
      ...DEFAULT_UNIT_ADDONS.bodyPanelProcesses!,
      top: {
        ...DEFAULT_UNIT_ADDONS.bodyPanelProcesses!.top,
        bookcaseGuideWheelHole: { enabled: true, quantity: 2 },
      },
      bottom: {
        ...DEFAULT_UNIT_ADDONS.bodyPanelProcesses!.bottom,
        smallAdjustableFootHole: { enabled: true, quantity: 3 },
        bookcaseGuideWheelHole: { enabled: true, quantity: 1 },
      },
      left: {
        ...DEFAULT_UNIT_ADDONS.bodyPanelProcesses!.left,
        hiddenReturnSlideRail: { enabled: true, quantity: 2 },
      },
      right: {
        ...DEFAULT_UNIT_ADDONS.bodyPanelProcesses!.right,
        specialUGlassPivot: { enabled: true, quantity: 1 },
        tRailBedSet: { enabled: true, quantity: 1 },
      },
    },
  },
  middleDividers: [
    {
      id: "divider-hardware",
      widthCm: 40,
      heightCm: 80,
      quantity: 1,
      materialRef: bodyMaterial,
      addons: {
        ...DEFAULT_MIDDLE_DIVIDER_ADDONS,
        hiddenReturnSlideRail: { enabled: true, quantity: 1 },
      },
    },
  ],
  shelves: [
    {
      id: "shelf-hardware",
      widthCm: 40,
      depthCm: 35,
      quantity: 1,
      materialRef: bodyMaterial,
      hardwareProcesses: {
        hiddenShelfScrewHole: { enabled: true, quantity: 4 },
        heavyHiddenShelfScrewHole: { enabled: true, quantity: 1 },
      },
    },
  ],
});
const panelHardwareProcesses = [
  ...panelHardwareResult.panels,
  ...panelHardwareResult.internalParts,
].flatMap((panel) => panel.processes);
assert.equal(panelHardwareProcesses.find((process) => process.id === "unit-1-bottom-small-adjustable-foot-hole")?.quantity, 6);
assert.equal(panelHardwareProcesses.find((process) => process.id === "unit-1-bottom-small-adjustable-foot-hole")?.cost, 300);
assert.equal(panelHardwareProcesses.find((process) => process.id === "unit-1-top-bookcase-guide-wheel-hole")?.label, "活動書櫃導輪孔(X2)");
assert.equal(panelHardwareProcesses.find((process) => process.id === "unit-1-left-hidden-return-slide-rail")?.quantity, 4);
assert.equal(panelHardwareProcesses.find((process) => process.id === "shelf-hardware-hidden-shelf-screw-hole")?.quantity, 8);
assert.equal(panelHardwareResult.summary.addonsBreakdown.panelHardwareProcessing, 4730);

const topCoverWithOverhangResult = calculateCabinetUnit({
  ...baseUnit,
  widthCm: 90,
  depthCm: 60,
  heightCm: 240,
  bodyPanelJoinMode: "TOP_COVERS_SIDES",
  addons: {
    ...baseUnit.addons,
    topPanelOverhang: {
      enabled: true,
      frontCm: 2,
      backCm: 3,
      leftCm: 4,
      rightCm: 5,
    },
  },
});
const overhangTopPanel = topCoverWithOverhangResult.panels.find((panel) => panel.id === "unit-1-top");
assert.equal(overhangTopPanel?.widthCm, 99);
assert.equal(overhangTopPanel?.heightCm, 65);

const kickPlateBodyMaterialResult = calculateCabinetUnit({
  ...baseUnit,
  widthCm: 40,
  panelMaterialRef: {
    ...bodyMaterial,
    minCai: null,
  },
  kickPlate: {
    widthCm: 999,
    heightCm: 8,
    materialRef: null,
  },
});
const kickPlatePanel = kickPlateBodyMaterialResult.panels.find((panel) => panel.id === "unit-1-kickplate");
assert.equal(kickPlateBodyMaterialResult.accessories.length, 0);
assert.equal(kickPlatePanel?.name, "踢腳板");
assert.equal(kickPlatePanel?.widthCm, 36.4);
assert.equal(kickPlatePanel?.heightCm, 8);
assert.equal(kickPlatePanel?.materialRef?.materialId, bodyMaterial.materialId);
assert.equal(kickPlatePanel?.subtotal, 32);
assert.equal(kickPlateBodyMaterialResult.summary.accessoriesCost, 0);

const manualKickPlateResult = calculateCabinetUnit({
  ...baseUnit,
  quantity: 2,
  heightCm: 240,
  hasBackPanel: true,
  backPanelMaterialRef: bodyMaterial,
  kickPlate: {
    heightCm: 8,
  },
  manualKickPlates: [
    {
      id: "manual-kick-left",
      name: "左側見光踢腳",
      widthCm: 58,
      heightCm: 8,
      quantity: 1,
    },
    {
      id: "manual-kick-right",
      name: "右側見光踢腳",
      widthCm: 60,
      heightCm: 10,
      quantity: 2,
    },
  ],
});
assert.deepEqual(
  manualKickPlateResult.panels
    .filter((panel) => panel.id.startsWith("manual-kick-"))
    .map((panel) => ({
      id: panel.id,
      name: panel.name,
      widthCm: panel.widthCm,
      heightCm: panel.heightCm,
      quantity: panel.quantity,
    })),
  [
    { id: "manual-kick-left", name: "左側見光踢腳", widthCm: 58, heightCm: 8, quantity: 2 },
    { id: "manual-kick-right", name: "右側見光踢腳", widthCm: 60, heightCm: 10, quantity: 4 },
  ],
);
const manualKickPlateBackPanel = manualKickPlateResult.panels.find((panel) => panel.id === "unit-1-back");
assert.equal(manualKickPlateBackPanel?.heightCm, 229.8);

const lTurnOpenKickPlateResult = calculateCabinetUnit({
  ...baseUnit,
  widthCm: 90,
  depthCm: 90,
  heightCm: 240,
  hasBackPanel: true,
  backPanelMaterialRef: bodyMaterial,
  panelMaterialRef: {
    ...bodyMaterial,
    minCai: null,
  },
  addons: {
    ...baseUnit.addons,
    lTurnCabinet: {
      enabled: true,
      position: "rightBottom",
      widthMm: 300,
      heightMm: 300,
      isOpening: true,
    },
  },
  kickPlate: {
    heightCm: 8,
    materialRef: null,
  },
});
assert.deepEqual(
  lTurnOpenKickPlateResult.panels
    .filter((panel) => panel.id.includes("l-turn-back"))
    .map((panel) => ({ id: panel.id, widthCm: panel.widthCm, heightCm: panel.heightCm })),
  [
    { id: "unit-1-l-turn-back-width", widthCm: 87.1, heightCm: 229.8 },
    { id: "unit-1-l-turn-back-depth", widthCm: 86.3, heightCm: 229.8 },
  ],
);
assert.deepEqual(
  lTurnOpenKickPlateResult.panels
    .filter((panel) => panel.id.includes("kickplate"))
    .map((panel) => ({ id: panel.id, widthCm: panel.widthCm, heightCm: panel.heightCm, quantity: panel.quantity })),
  [
    { id: "unit-1-kickplate-cutout-width", widthCm: 32, heightCm: 8, quantity: 1 },
    { id: "unit-1-kickplate-cutout-depth", widthCm: 30.2, heightCm: 8, quantity: 1 },
  ],
);

const lTurnClosedKickPlateResult = calculateCabinetUnit({
  ...baseUnit,
  widthCm: 90,
  depthCm: 90,
  heightCm: 240,
  panelMaterialRef: {
    ...bodyMaterial,
    minCai: null,
  },
  addons: {
    ...baseUnit.addons,
    lTurnCabinet: {
      enabled: true,
      position: "rightBottom",
      widthMm: 300,
      heightMm: 300,
      isOpening: false,
    },
  },
  kickPlate: {
    heightCm: 8,
    materialRef: null,
  },
});
assert.deepEqual(
  lTurnClosedKickPlateResult.panels
    .filter((panel) => panel.id.includes("kickplate"))
    .map((panel) => ({ id: panel.id, widthCm: panel.widthCm, heightCm: panel.heightCm, quantity: panel.quantity })),
  [
    { id: "unit-1-kickplate-outer-width", widthCm: 86.2, heightCm: 8, quantity: 1 },
    { id: "unit-1-kickplate-outer-depth", widthCm: 84.4, heightCm: 8, quantity: 1 },
  ],
);

const sideTopBottomSealPanelResult = calculateCabinetUnit({
  ...baseUnit,
  panelMaterialRef: {
    ...bodyMaterial,
    minCai: null,
  },
  sideTopBottomSealPanels: [
    {
      id: "seal-panel-1",
      name: "左側加寬封板",
      widthCm: 20,
      heightCm: 30,
      quantity: 2,
      materialRef: {
        ...bodyMaterial,
        minCai: null,
      },
    },
  ],
});
const sideTopBottomSealPanel = sideTopBottomSealPanelResult.panels.find((panel) => panel.id === "seal-panel-1");
assert.deepEqual(
  sideTopBottomSealPanel && {
    name: sideTopBottomSealPanel.name,
    widthCm: sideTopBottomSealPanel.widthCm,
    heightCm: sideTopBottomSealPanel.heightCm,
    quantity: sideTopBottomSealPanel.quantity,
    materialId: sideTopBottomSealPanel.materialRef?.materialId,
    subtotal: sideTopBottomSealPanel.subtotal,
  },
  {
    name: "左側加寬封板",
    widthCm: 20,
    heightCm: 30,
    quantity: 2,
    materialId: bodyMaterial.materialId,
    subtotal: 131,
  },
);

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
  "背板溝槽: 離後緣18mm, 寬10mm, 深9mm",
);
assert.equal(
  cabinetWithBackPanel.panels.find((panel) => panel.id === "unit-1-top")?.note,
  "背板溝槽: 離後緣18mm, 寬10mm, 深9mm",
);
assert.equal(cabinetWithBackPanel.summary.addonsBreakdown.backPanelGroove, 480);
assert.equal(cabinetWithBackPanel.summary.addonsCost, 480);
assert.equal(
  cabinetWithBackPanel.summary.totalCost,
  cabinetWithBackPanel.summary.panelsCost + 480,
);

const cabinetWithManualBackPanel = calculateCabinetUnit({
  ...baseUnit,
  widthCm: 60,
  heightCm: 80,
  quantity: 2,
  hasBackPanel: true,
  backPanelMode: "MANUAL_18MM",
  manualBackPanel: {
    widthCm: 55,
    heightCm: 75,
    quantity: 2,
  },
  backPanelMaterialRef: bodyMaterial,
});
const manualBackPanel = cabinetWithManualBackPanel.panels.find((panel) => panel.id === "unit-1-back");
assert.equal(manualBackPanel?.widthCm, 55);
assert.equal(manualBackPanel?.heightCm, 75);
assert.equal(manualBackPanel?.quantity, 4);
assert.equal(cabinetWithManualBackPanel.panels.find((panel) => panel.id === "unit-1-left")?.note, undefined);
assert.equal(cabinetWithManualBackPanel.summary.addonsBreakdown.backPanelGroove, 0);

const thickCabinetWithBackPanel = calculateCabinetUnit({
  ...baseUnit,
  widthCm: 60,
  heightCm: 80,
  hasBackPanel: true,
  panelMaterialRef: thickBodyMaterial,
  backPanelMaterialRef: bodyMaterial,
});
const thickBackPanel = thickCabinetWithBackPanel.panels.find((panel) => panel.id === "unit-1-back");
assert.equal(thickBackPanel?.widthCm, 56.4);
assert.equal(thickBackPanel?.heightCm, 76.4);

const cabinetWithBackPanelAndKickPlate = calculateCabinetUnit({
  ...baseUnit,
  widthCm: 60,
  heightCm: 80,
  hasBackPanel: true,
  backPanelMaterialRef: bodyMaterial,
  kickPlate: {
    heightCm: 8,
    materialRef: null,
  },
});
const backPanelWithKickPlate = cabinetWithBackPanelAndKickPlate.panels.find((panel) => panel.id === "unit-1-back");
assert.equal(backPanelWithKickPlate?.widthCm, 57.8);
assert.equal(backPanelWithKickPlate?.heightCm, 69.8);

const slidingDoorTrackGrooveResult = calculateCabinetUnit({
  ...baseUnit,
  quantity: 2,
  addons: {
    ...baseUnit.addons,
    slidingDoorTrackGrooves: {
      top: { enabled: true, trackShape: "V" },
      bottom: { enabled: true, trackShape: "T" },
    },
  },
});
const topSlidingDoorTrackGroove = slidingDoorTrackGrooveResult.panels
  .find((panel) => panel.id === "unit-1-top")
  ?.processes.find((process) => process.id === "unit-1-top-sliding-door-track-groove");
const bottomSlidingDoorTrackGroove = slidingDoorTrackGrooveResult.panels
  .find((panel) => panel.id === "unit-1-bottom")
  ?.processes.find((process) => process.id === "unit-1-bottom-sliding-door-track-groove");
assert.equal(topSlidingDoorTrackGroove?.label, "推門軌道溝: V型軌道, 限溝寬10mm");
assert.equal(topSlidingDoorTrackGroove?.quantity, 2);
assert.equal(topSlidingDoorTrackGroove?.unitCost, 120);
assert.equal(topSlidingDoorTrackGroove?.cost, 240);
assert.equal(bottomSlidingDoorTrackGroove?.quantity, 2);
assert.equal(bottomSlidingDoorTrackGroove?.unitCost, 120);
assert.equal(bottomSlidingDoorTrackGroove?.cost, 240);
assert.equal(bottomSlidingDoorTrackGroove?.label, "推門軌道溝: T型軌道, 限溝寬10mm");
assert.equal(slidingDoorTrackGrooveResult.summary.addonsBreakdown.slidingDoorTrackGroove, 480);
assert.equal(slidingDoorTrackGrooveResult.summary.addonsCost, 480);

const lTurnCabinetResult = calculateCabinetUnit({
  ...baseUnit,
  quantity: 2,
  addons: {
    ...baseUnit.addons,
    lTurnCabinet: {
      enabled: true,
      position: "rightTop",
      widthMm: 700,
      heightMm: 800,
      isOpening: true,
    },
  },
});
const lTurnCabinetTopProcess = lTurnCabinetResult.panels
  .find((panel) => panel.id === "unit-1-top")
  ?.processes.find((process) => process.id === "unit-1-l-turn-cabinet");
const lTurnCabinetBottomProcess = lTurnCabinetResult.panels
  .find((panel) => panel.id === "unit-1-bottom")
  ?.processes.find((process) => process.id === "unit-1-l-turn-cabinet-bottom");
assert.equal(lTurnCabinetTopProcess?.label, "L轉櫃加工: 右上, W=700mm, H=800mm");
assert.equal(lTurnCabinetTopProcess?.includedInSubtotal, false);
assert.equal(lTurnCabinetTopProcess?.cost, 0);
assert.equal(lTurnCabinetBottomProcess?.label, "L轉櫃加工: 右上, W=700mm, H=800mm");
assert.equal(lTurnCabinetBottomProcess?.includedInSubtotal, false);
assert.equal(lTurnCabinetBottomProcess?.cost, 0);
const lTurnCabinetFee = lTurnCabinetResult.hardware.find((row) => row.id === "unit-1-l-turn-cabinet-fee");
assert.equal(lTurnCabinetFee?.name, "L轉櫃加工費");
assert.equal(lTurnCabinetFee?.quantity, 2);
assert.equal(lTurnCabinetFee?.unitCost, 600);
assert.equal(lTurnCabinetFee?.subtotal, 1200);
assert.equal(lTurnCabinetResult.summary.addonsBreakdown.lTurnCabinet, 1200);
assert.equal(lTurnCabinetResult.summary.addonsCost, 1200);

const lTurnOpenCabinetResult = calculateCabinetUnit({
  ...baseUnit,
  widthCm: 90,
  depthCm: 90,
  heightCm: 240,
  hasBackPanel: true,
  backPanelMaterialRef: bodyMaterial,
  addons: {
    ...baseUnit.addons,
    lTurnCabinet: {
      enabled: true,
      position: "rightBottom",
      widthMm: 300,
      heightMm: 300,
      isOpening: true,
    },
  },
});
assert.deepEqual(
  lTurnOpenCabinetResult.panels
    .filter((panel) => panel.id.includes("l-turn-side"))
    .map((panel) => ({
      id: panel.id,
      note: panel.note,
      processIds: panel.processes.map((process) => process.id),
    })),
  [
    {
      id: "unit-1-l-turn-side-width",
      note: "背板溝槽: 離後緣18mm, 寬10mm, 深9mm",
      processIds: ["unit-1-l-turn-side-width-back-groove"],
    },
    {
      id: "unit-1-l-turn-side-depth",
      note: "背板溝槽: 離後緣18mm, 寬10mm, 深9mm",
      processIds: ["unit-1-l-turn-side-depth-back-groove"],
    },
  ],
);
assert.equal(lTurnOpenCabinetResult.summary.addonsBreakdown.backPanelGroove, 480);
assert.deepEqual(
  lTurnOpenCabinetResult.panels
    .filter((panel) => panel.id.includes("l-turn"))
    .map((panel) => ({ id: panel.id, name: panel.name, widthCm: panel.widthCm, heightCm: panel.heightCm })),
  [
    { id: "unit-1-l-turn-side-width", name: "L轉側板-寬向", widthCm: 240, heightCm: 60 },
    { id: "unit-1-l-turn-side-depth", name: "L轉側板-深向", widthCm: 240, heightCm: 60 },
    { id: "unit-1-l-turn-back-width", name: "L轉背板-寬向", widthCm: 87.1, heightCm: 237.8 },
    { id: "unit-1-l-turn-back-depth", name: "L轉背板-深向", widthCm: 86.3, heightCm: 237.8 },
  ],
);

const lTurnOpenAsymmetricBackPanelResult = calculateCabinetUnit({
  ...baseUnit,
  widthCm: 120,
  depthCm: 90,
  heightCm: 240,
  hasBackPanel: true,
  backPanelMaterialRef: bodyMaterial,
  addons: {
    ...baseUnit.addons,
    lTurnCabinet: {
      enabled: true,
      position: "rightBottom",
      widthMm: 300,
      heightMm: 300,
      isOpening: true,
    },
  },
});
assert.deepEqual(
  lTurnOpenAsymmetricBackPanelResult.panels
    .filter((panel) => panel.id.includes("l-turn-back"))
    .map((panel) => ({ id: panel.id, widthCm: panel.widthCm, heightCm: panel.heightCm })),
  [
    { id: "unit-1-l-turn-back-width", widthCm: 117.1, heightCm: 237.8 },
    { id: "unit-1-l-turn-back-depth", widthCm: 86.3, heightCm: 237.8 },
  ],
);

const lTurnClosedCabinetResult = calculateCabinetUnit({
  ...baseUnit,
  widthCm: 90,
  depthCm: 90,
  heightCm: 240,
  hasBackPanel: true,
  backPanelMaterialRef: bodyMaterial,
  addons: {
    ...baseUnit.addons,
    lTurnCabinet: {
      enabled: true,
      position: "rightBottom",
      widthMm: 300,
      heightMm: 300,
      isOpening: false,
    },
  },
});
assert.deepEqual(
  lTurnClosedCabinetResult.panels
    .filter((panel) => panel.id.includes("l-turn"))
    .map((panel) => ({ id: panel.id, name: panel.name, widthCm: panel.widthCm, heightCm: panel.heightCm })),
  [
    { id: "unit-1-l-turn-side-width", name: "L轉側板-寬向", widthCm: 240, heightCm: 60 },
    { id: "unit-1-l-turn-side-depth", name: "L轉側板-深向", widthCm: 240, heightCm: 60 },
    { id: "unit-1-l-turn-back-width", name: "L轉背板-寬向", widthCm: 27.1, heightCm: 237.8 },
    { id: "unit-1-l-turn-back-depth", name: "L轉背板-深向", widthCm: 26.3, heightCm: 237.8 },
  ],
);

const lTurnClosedAsymmetricBackPanelResult = calculateCabinetUnit({
  ...baseUnit,
  widthCm: 120,
  depthCm: 90,
  heightCm: 240,
  hasBackPanel: true,
  backPanelMaterialRef: bodyMaterial,
  addons: {
    ...baseUnit.addons,
    lTurnCabinet: {
      enabled: true,
      position: "rightBottom",
      widthMm: 300,
      heightMm: 500,
      isOpening: false,
    },
  },
});
assert.deepEqual(
  lTurnClosedAsymmetricBackPanelResult.panels
    .filter((panel) => panel.id.includes("l-turn-back"))
    .map((panel) => ({ id: panel.id, widthCm: panel.widthCm, heightCm: panel.heightCm })),
  [
    { id: "unit-1-l-turn-back-width", widthCm: 27.1, heightCm: 237.8 },
    { id: "unit-1-l-turn-back-depth", widthCm: 46.3, heightCm: 237.8 },
  ],
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
assert.equal(addonResult.summary.addonsBreakdown.frontEdgeABS, 800);
assert.equal(addonResult.summary.addonsCost, 800);
assert.equal(addonResult.summary.totalCost, 1200);

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
      hardwareItems: [{
        id: "door-1-hinge",
        name: "鉸鏈",
        quantityPerDoor: 2,
        materialRef: null,
        includeHingeHoleDrilling: true,
      }],
    },
  ],
});
assert.equal(doorResult.doors[0].billableTotalArea.cai, 1.5);
assert.equal(doorResult.summary.addonsBreakdown.patternMatch, 60);
assert.equal(doorResult.summary.addonsBreakdown.temperedGlass, 75);
assert.equal(doorResult.summary.addonsBreakdown.hingeHoleDrilling, 10);
assert.equal(doorResult.summary.doorsCost, 445);

const manualDoorHardwareResult = calculateCabinetUnit({
  ...baseUnit,
  quantity: 2,
  doors: [
    {
      id: "manual-hardware-door",
      type: "HINGED",
      name: "手動五金門片",
      widthCm: 45,
      heightCm: 200,
      quantity: 2,
      materialRef: doorMaterial,
      addons: DEFAULT_DOOR_ADDONS,
      hardwareItems: [
        {
          id: "main-hinge",
          name: "主鉸鏈",
          quantityPerDoor: 3,
          materialRef: hingeMaterial,
          includeHingeHoleDrilling: true,
        },
        {
          id: "hinge-base",
          name: "鉸鏈底座",
          quantityPerDoor: 3,
          materialRef: hingeMaterial,
          includeHingeHoleDrilling: false,
        },
      ],
    },
  ],
});
assert.deepEqual(
  manualDoorHardwareResult.hardware.map((item) => ({
    id: item.id,
    name: item.name,
    quantity: item.quantity,
  })),
  [
    { id: "main-hinge", name: "主鉸鏈", quantity: 12 },
    { id: "hinge-base", name: "鉸鏈底座", quantity: 12 },
  ],
);
assert.equal(manualDoorHardwareResult.doors[0].processes[0]?.quantity, 12);
assert.equal(manualDoorHardwareResult.summary.addonsBreakdown.hingeHoleDrilling, 60);

const doorWithoutHingeQuoteResult = calculateCabinetUnit({
  ...baseUnit,
  panelMaterialRef: null,
  doors: [
    {
      id: "door-no-hinge-quote",
      type: "HINGED",
      name: "door",
      widthCm: 45,
      heightCm: 120,
      quantity: 2,
      materialRef: doorMaterial,
      addons: {
        ...DEFAULT_DOOR_ADDONS,
        hingeHoleDrilling: true,
      },
      includeHingeInQuote: false,
      hingeMaterialRef: hingeMaterial,
      railMaterialRef: null,
    },
  ],
});
assert.equal(doorWithoutHingeQuoteResult.hardware.some((item) => item.id === "door-no-hinge-quote-hinge"), false);
assert.equal(doorWithoutHingeQuoteResult.summary.hardwareCost, 0);
assert.equal(doorWithoutHingeQuoteResult.summary.addonsBreakdown.hingeHoleDrilling, 0);

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
assert.deepEqual(
  dividerAddonResult.internalParts[0].processes.map((process) => ({
    label: process.label,
    quantity: process.quantity,
    unitCost: process.unitCost,
    cost: process.cost,
  })),
  [
    { label: "\u96d9\u6392\u5b54", quantity: 1, unitCost: 5, cost: 5 },
    { label: "\u975e\u6a19\u6e96\u6392\u5b54", quantity: 1, unitCost: 5, cost: 5 },
  ],
);
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
      hardwareItems: [{
        id: "sliding-door-hardware",
        name: "推拉門五金",
        quantityPerDoor: 1,
        materialRef: pushDoorHardware,
        includeHingeHoleDrilling: false,
      }],
    },
  ],
});
assert.equal(slidingDoorResult.hardware.length, 1);
assert.equal(slidingDoorResult.hardware[0].name, "推拉門五金");
assert.equal(slidingDoorResult.hardware[0].quantity, 2);
assert.equal(slidingDoorResult.hardware[0].unitCost, 500);
assert.equal(slidingDoorResult.hardware[0].subtotal, 1000);

const slidingDoorWithoutHardwareQuoteResult = calculateCabinetUnit({
  ...baseUnit,
  doors: [
    {
      id: "sliding-door-no-hardware-quote",
      type: "SLIDING",
      name: "sliding door",
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
      includeSlidingHardwareInQuote: false,
      hingeMaterialRef: null,
      railMaterialRef: pushDoorHardware,
    },
  ],
});
assert.equal(
  slidingDoorWithoutHardwareQuoteResult.hardware.some((item) => item.id === "sliding-door-no-hardware-quote-push-door-hardware"),
  false,
);
assert.equal(slidingDoorWithoutHardwareQuoteResult.summary.hardwareCost, 0);

const slidingDoorWithoutHardwareResult = calculateCabinetUnit({
  ...baseUnit,
  doors: [
    {
      id: "sliding-door-no-hardware",
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
      railMaterialRef: null,
    },
  ],
});
assert.equal(slidingDoorWithoutHardwareResult.hardware.some((item) => item.name === "推拉門五金"), false);

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

const profileHandlePriceTableResult = calculateCabinetUnit({
  ...baseUnit,
  doors: [
    {
      id: "door-profile-table-1",
      type: "HINGED",
      name: "造型把手門",
      widthCm: 50,
      heightCm: 120,
      quantity: 2,
      materialRef: doorMaterial,
      hingeMaterialRef: null,
      railMaterialRef: null,
      wireMeshMaterialRef: null,
      aluminumHandleMaterialRef: null,
      addons: {
        ...DEFAULT_DOOR_ADDONS,
        profileHandle: {
          style: "N5IA",
          lengthCm: 130,
          lengthModification: false,
        },
      },
    },
  ],
});
const profileHandlePriceTableRow = profileHandlePriceTableResult.hardware.find((item) => item.id === "door-profile-table-1-profile-handle");
assert.equal(profileHandlePriceTableRow?.name, "造型把手加工 N5IA");
assert.equal(profileHandlePriceTableRow?.quantity, 2);
assert.equal(profileHandlePriceTableRow?.unitCost, 2300);
assert.equal(profileHandlePriceTableRow?.subtotal, 4600);

const fixedProfileHandlePriceResult = calculateCabinetUnit({
  ...baseUnit,
  doors: [
    {
      id: "door-profile-fixed",
      type: "HINGED",
      name: "固定造型把手門",
      widthCm: 50,
      heightCm: 90,
      quantity: 1,
      materialRef: doorMaterial,
      hingeMaterialRef: null,
      railMaterialRef: null,
      wireMeshMaterialRef: null,
      aluminumHandleMaterialRef: null,
      addons: {
        ...DEFAULT_DOOR_ADDONS,
        profileHandle: {
          style: "SMILE_INTEGRATED",
          lengthCm: 40,
          lengthModification: false,
        },
      },
    },
  ],
});
const fixedProfileHandlePriceRow = fixedProfileHandlePriceResult.hardware.find((item) => item.id === "door-profile-fixed-profile-handle");
assert.equal(fixedProfileHandlePriceRow?.name, "造型把手加工 微笑一體把手");
assert.equal(fixedProfileHandlePriceRow?.unitCost, 1950);
assert.equal(fixedProfileHandlePriceRow?.subtotal, 1950);

const bakedPaintProfileHandleResult = calculateCabinetUnit({
  ...baseUnit,
  doors: [
    {
      id: "door-profile-baked-paint",
      type: "HINGED",
      name: "烤漆造型把手門",
      widthCm: 50,
      heightCm: 90,
      quantity: 1,
      materialRef: doorMaterial,
      hingeMaterialRef: null,
      railMaterialRef: null,
      wireMeshMaterialRef: null,
      aluminumHandleMaterialRef: null,
      addons: {
        ...DEFAULT_DOOR_ADDONS,
        profileHandle: {
          style: "Y1A",
          lengthCm: 70,
          lengthModification: false,
          bakedPaint: true,
        },
      },
    },
  ],
});
assert.equal(bakedPaintProfileHandleResult.hardware.find((item) => item.id === "door-profile-baked-paint-profile-handle")?.unitCost, 1500);
assert.equal(bakedPaintProfileHandleResult.hardware.find((item) => item.id === "door-profile-baked-paint-profile-handle-baked-paint")?.unitCost, 300);

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
  780,
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
      bodyKdProcessing: true,
    },
  ],
});
assert.equal(drawerResult.hardware.at(-1)?.name, "抽屜滑軌");
assert.equal(drawerResult.hardware.at(-1)?.quantity, 3);
assert.equal(drawerResult.summary.hardwareCost, 540);

const drawerWithoutRailQuoteResult = calculateCabinetUnit({
  ...baseUnit,
  drawers: [
    {
      id: "drawer-without-rail-quote",
      name: "?賢?",
      widthCm: 60,
      heightCm: 16,
      depthCm: 45,
      railLengthCm: 45,
      includeRailInQuote: false,
      quantity: 3,
      railMaterialRef: drawerRail,
      wallMaterialRef: bodyMaterial,
      bottomMaterialRef: bodyMaterial,
      grooveSpec: "8.5",
    },
  ],
});
assert.equal(drawerWithoutRailQuoteResult.hardware.some((item) => item.id === "drawer-without-rail-quote-rail"), false);
assert.equal(drawerWithoutRailQuoteResult.summary.hardwareCost, 0);

const drawerParts = drawerResult.internalParts.filter((part) => part.id.startsWith("drawer-1-"));
const drawerGrooveProcesses = drawerParts
  .flatMap((part) => part.processes ?? [])
  .filter((process) => process.id.endsWith("-groove"));
assert.equal(drawerParts.length, 4);
assert.equal(drawerGrooveProcesses.length, 2);
assert.equal(drawerGrooveProcesses.reduce((sum, process) => sum + process.cost, 0), 1440);
const drawerBodyKdProcess = drawerParts
  .flatMap((part) => part.processes)
  .find((process) => process.id === "drawer-1-body-kd-processing");
assert.equal(drawerBodyKdProcess?.label, "抽身指定KD");
assert.equal(drawerBodyKdProcess?.quantity, 3);
assert.equal(drawerBodyKdProcess?.unitCost, 80);
assert.equal(drawerBodyKdProcess?.cost, 240);
assert.deepEqual(
  drawerParts.map((part) => ({
    name: part.name,
    widthCm: part.widthCm,
    heightCm: part.heightCm,
    quantity: part.quantity,
    note: part.note,
  })),
  [
    { name: "\u62bd\u5c5c-\u62bd\u5c5c\u9762\u677f/\u62bd\u982d", widthCm: 60, heightCm: 16, quantity: 3, note: undefined },
    { name: "\u62bd\u5c5c-\u62bd\u5c5c\u5de6\u53f3\u5074\u677f", widthCm: 45, heightCm: 9, quantity: 6, note: "內側下方打溝 (10mm, 深9mm)" },
    { name: "\u62bd\u5c5c-\u62bd\u5c5c\u524d\u5f8c\u7246\u677f", widthCm: 49.8, heightCm: 9, quantity: 6, note: "內側下方打溝 (10mm, 深9mm)" },
    { name: "\u62bd\u5c5c-\u62bd\u5c5c8mm\u5e95\u677f", widthCm: 57.8, heightCm: 42.8, quantity: 3, note: undefined },
  ],
);

const drawerFrontProcessingResult = calculateCabinetUnit({
  ...baseUnit,
  drawers: [
    {
      id: "drawer-front-processing",
      name: "抽頭加工抽屜",
      widthCm: 60,
      heightCm: 16,
      depthCm: 45,
      railLengthCm: 45,
      quantity: 2,
      railMaterialRef: null,
      wallMaterialRef: bodyMaterial,
      bottomMaterialRef: bodyMaterial,
      grooveSpec: "8.5",
      frontMoldProcessing: true,
      frontMoldRadius: "R100",
      frontMoldCornerCount: 4,
      frontHandle: {
        style: "N5IA",
        lengthCm: 130,
        bakedPaint: false,
      },
    },
  ],
});
const drawerFrontPanel = drawerFrontProcessingResult.internalParts.find((part) => part.id === "drawer-front-processing-front-panel");
assert.deepEqual(
  drawerFrontPanel?.processes.map((process) => ({
    label: process.label,
    quantity: process.quantity,
    unitCost: process.unitCost,
    cost: process.cost,
  })),
  [
    { label: "抽頭合廠模造型加工 R100 (單板4個R角)", quantity: 2, unitCost: 600, cost: 1200 },
    { label: "抽頭把手加工 N5IA", quantity: 2, unitCost: 2300, cost: 4600 },
  ],
);

const drawerFrontHandleFallbackResult = calculateCabinetUnit({
  ...baseUnit,
  drawers: [
    {
      id: "drawer-front-handle-fallback",
      name: "drawer",
      widthCm: 60,
      heightCm: 16,
      depthCm: 45,
      railLengthCm: 45,
      quantity: 2,
      railMaterialRef: null,
      wallMaterialRef: bodyMaterial,
      bottomMaterialRef: bodyMaterial,
      grooveSpec: "8.5",
      frontHandle: {
        style: "SFJA",
        lengthCm: 60,
        bakedPaint: false,
      },
    },
  ],
});
const drawerFrontHandleFallbackProcess = drawerFrontHandleFallbackResult.internalParts
  .find((part) => part.id === "drawer-front-handle-fallback-front-panel")
  ?.processes.find((process) => process.id === "drawer-front-handle-fallback-front-handle-processing");
assert.equal(drawerFrontHandleFallbackProcess?.label, "\u62bd\u982d\u628a\u624b\u52a0\u5de5 SFJA");
assert.equal(drawerFrontHandleFallbackProcess?.quantity, 120);
assert.equal(drawerFrontHandleFallbackProcess?.unitCost, 8.5);
assert.equal(drawerFrontHandleFallbackProcess?.cost, 1020);

const specialProcessingResult = calculateCabinetUnit({
  ...baseUnit,
  shelves: [
    {
      id: "shape-shelf",
      widthCm: 80,
      depthCm: 40,
      quantity: 2,
      materialRef: bodyMaterial,
      lightGroove: { side: "none", offsetFromFrontMm: 50 },
      specialProcesses: [
        {
          id: "outer-1",
          kind: "outerShape",
          label: "L型",
          edgeBanding: "withEdge",
          dimensionSumMm: 1200,
          quantity: 1,
        },
        {
          id: "inner-1",
          kind: "innerCutout",
          label: "開圓孔",
          edgeBanding: "none",
          dimensionSumMm: 800,
          quantity: 2,
        },
        {
          id: "cut-1",
          kind: "cutCorner",
          label: "切角",
          edgeBanding: "withEdge",
          dimensionSumMm: 500,
          quantity: 1,
        },
        {
          id: "round-1",
          kind: "roundCorner",
          label: "導圓 R80",
          edgeBanding: "withEdge",
          radiusMm: 80,
          radiusMode: "factory",
          quantity: 1,
        },
      ],
    },
  ],
});
const specialShelf = specialProcessingResult.internalParts.find((part) => part.id === "shape-shelf");
assert.deepEqual(
  specialShelf?.processes
    .filter((process) => process.id.includes("special"))
    .map((process) => ({
      label: process.label,
      quantity: process.quantity,
      unitCost: process.unitCost,
      cost: process.cost,
    })),
  [
    { label: "板外造型加工-L型 A+B 1200mm 有封邊", quantity: 2, unitCost: 750, cost: 1500 },
    { label: "板內開孔加工-開圓孔 A+B 800mm 不封邊", quantity: 4, unitCost: 400, cost: 1600 },
    { label: "切角加工-切角 A+B 500mm 有封邊", quantity: 2, unitCost: 400, cost: 800 },
    { label: "導圓加工-導圓 R80 廠模", quantity: 2, unitCost: 400, cost: 800 },
  ],
);
assert.equal(specialShelf?.addonsCost, 4700);
assert.equal(specialProcessingResult.summary.addonsBreakdown.specialProcessing, 4700);

const roundCornerDiscountResult = calculateCabinetUnit({
  ...baseUnit,
  shelves: [
    {
      id: "round-discount-shelf",
      widthCm: 80,
      depthCm: 40,
      quantity: 1,
      materialRef: bodyMaterial,
      lightGroove: { side: "none", offsetFromFrontMm: 50 },
      specialProcesses: [
        {
          id: "round-a",
          kind: "roundCorner",
          label: "R80",
          edgeBanding: "withEdge",
          radiusMm: 80,
          radiusMode: "factory",
          quantity: 1,
        },
        {
          id: "round-b",
          kind: "roundCorner",
          label: "R80",
          edgeBanding: "withEdge",
          radiusMm: 80,
          radiusMode: "factory",
          quantity: 1,
        },
      ],
    },
  ],
});
const roundDiscountProcesses = roundCornerDiscountResult.internalParts
  .find((part) => part.id === "round-discount-shelf")
  ?.processes.filter((process) => process.id.includes("special"));
assert.deepEqual(
  roundDiscountProcesses?.map((process) => ({
    quantity: process.quantity,
    unitCost: process.unitCost,
    cost: process.cost,
  })),
  [
    { quantity: 1, unitCost: 400, cost: 400 },
    { quantity: 1, unitCost: 300, cost: 300 },
  ],
);
assert.equal(roundCornerDiscountResult.summary.addonsBreakdown.specialProcessing, 700);

const sideSealBendingResult = calculateCabinetUnit({
  ...baseUnit,
  heightCm: 120,
  kickPlate: { heightCm: 8 },
  addons: {
    ...baseUnit.addons,
    sideSealBending: {
      left: {
        enabled: true,
        depthMm: 80,
        isDrawerCabinet: true,
        drawerDividerDepthCm: 55,
        visibleEdgeBand: false,
      },
      right: {
        enabled: true,
        depthMm: 500,
        isDrawerCabinet: false,
        visibleEdgeBand: true,
      },
    },
  },
});
const autoDrawerDivider = sideSealBendingResult.internalParts.find((part) => part.id === "unit-1-left-drawer-divider");
const leftBending = sideSealBendingResult.panels
  .find((panel) => panel.id === "unit-1-left")
  ?.processes.find((process) => process.id === "unit-1-left-side-seal-bending");
const rightBending = sideSealBendingResult.panels
  .find((panel) => panel.id === "unit-1-right")
  ?.processes.find((process) => process.id === "unit-1-right-side-seal-bending");
const rightVisibleEdge = sideSealBendingResult.panels
  .find((panel) => panel.id === "unit-1-right")
  ?.processes.find((process) => process.id === "unit-1-right-side-seal-visible-edge");
assert.deepEqual(
  {
    left: leftBending && { quantity: leftBending.quantity, unitCost: leftBending.unitCost, cost: leftBending.cost },
    right: rightBending && { quantity: rightBending.quantity, unitCost: rightBending.unitCost, cost: rightBending.cost },
    rightVisibleEdge: rightVisibleEdge && { quantity: rightVisibleEdge.quantity, unitCost: rightVisibleEdge.unitCost, cost: rightVisibleEdge.cost },
  },
  {
    left: { quantity: 120, unitCost: 80, cost: 9600 },
    right: { quantity: 120, unitCost: 120, cost: 14400 },
    rightVisibleEdge: { quantity: 1, unitCost: 500, cost: 500 },
  },
);
assert.match(leftBending?.label ?? "", /抽屜櫃側需補中立板/);
assert.deepEqual(
  autoDrawerDivider && {
    name: autoDrawerDivider.name,
    widthCm: autoDrawerDivider.widthCm,
    heightCm: autoDrawerDivider.heightCm,
    quantity: autoDrawerDivider.quantity,
    materialId: autoDrawerDivider.materialRef?.materialId,
  },
  {
    name: "左側抽屜櫃補中立板",
    widthCm: 108.4,
    heightCm: 55,
    quantity: 1,
    materialId: bodyMaterial.materialId,
  },
);
assert.equal(sideSealBendingResult.summary.addonsBreakdown.sideSealBending, 24500);

const zhengdaoFrontEdgeResult = calculateCabinetUnit({
  ...baseUnit,
  vendor: "ZHENGDAO",
  widthCm: 90,
  depthCm: 60,
  heightCm: 240,
  panelMaterialRef: { ...bodyMaterial, minCai: null },
  addons: {
    ...baseUnit.addons,
    bodyPanelProcesses: {
      ...DEFAULT_UNIT_ADDONS.bodyPanelProcesses!,
      top: {
        ...DEFAULT_UNIT_ADDONS.bodyPanelProcesses!.top,
        frontEdgeABS: "one_long",
      },
      bottom: {
        ...DEFAULT_UNIT_ADDONS.bodyPanelProcesses!.bottom,
        frontEdgeABS: "two_long",
      },
    },
  },
});
const zhengdaoTopFrontEdge = zhengdaoFrontEdgeResult.panels
  .find((panel) => panel.id === "unit-1-top")
  ?.processes.find((process) => process.id === "unit-1-top-front-edge-abs");
const zhengdaoBottomFrontEdge = zhengdaoFrontEdgeResult.panels
  .find((panel) => panel.id === "unit-1-bottom")
  ?.processes.find((process) => process.id === "unit-1-bottom-front-edge-abs");
assert.equal(zhengdaoTopFrontEdge?.unitCost, 10);
assert.equal(zhengdaoTopFrontEdge?.cost, 56);
assert.equal(zhengdaoBottomFrontEdge?.unitCost, 20);
assert.equal(zhengdaoBottomFrontEdge?.cost, 113);

const zhengdaoDividerResult = calculateCabinetUnit({
  ...baseUnit,
  vendor: "ZHENGDAO",
  middleDividers: [
    {
      id: "zhengdao-divider",
      widthCm: 40,
      heightCm: 80,
      quantity: 1,
      materialRef: { ...bodyMaterial, minCai: null },
      addons: {
        ...DEFAULT_MIDDLE_DIVIDER_ADDONS,
        doubleDrillHoles: true,
      },
    },
  ],
});
const zhengdaoDividerDrilling = zhengdaoDividerResult.internalParts
  .find((panel) => panel.id === "zhengdao-divider")
  ?.processes.find((process) => process.id === "zhengdao-divider-double-drill-holes");
assert.equal(zhengdaoDividerDrilling?.unitCost, 20);
assert.equal(zhengdaoDividerDrilling?.cost, 70);

const zhengdaoDoorResult = calculateCabinetUnit({
  ...baseUnit,
  vendor: "ZHENGDAO",
  doors: [
    {
      id: "zhengdao-door",
      type: "HINGED",
      name: "正道門片",
      widthCm: 45,
      heightCm: 90,
      quantity: 1,
      materialRef: { ...doorMaterial, minCai: null },
      addons: {
        ...DEFAULT_DOOR_ADDONS,
        patternMatch: "grain",
        temperedGlass: true,
      },
      hardwareItems: [
        {
          id: "zhengdao-hinge",
          name: "正道鉸鍊",
          quantityPerDoor: 3,
          materialRef: hingeMaterial,
          includeHingeHoleDrilling: true,
        },
      ],
    },
  ],
});
const zhengdaoHingeDrilling = zhengdaoDoorResult.doors[0]?.processes
  .find((process) => process.id === "zhengdao-door-hinge-hole");
assert.equal(zhengdaoHingeDrilling?.quantity, 3);
assert.equal(zhengdaoHingeDrilling?.unitCost, 40);
assert.equal(zhengdaoHingeDrilling?.cost, 120);
assert.equal(zhengdaoDoorResult.summary.addonsBreakdown.patternMatch, 400);
assert.equal(zhengdaoDoorResult.summary.addonsBreakdown.temperedGlass, 0);

const zhengdaoDrawerWithoutWeihoProcessing = calculateCabinetUnit({
  ...baseUnit,
  vendor: "ZHENGDAO",
  drawers: [
    {
      id: "zhengdao-drawer",
      name: "正道抽屜",
      widthCm: 60,
      heightCm: 16,
      depthCm: 45,
      railLengthCm: 45,
      quantity: 1,
      grooveSpec: "8.5",
      includeRailInQuote: true,
      bodyKdProcessing: true,
      railMaterialRef: {
        materialId: "zhengdao-rail",
        materialName: "正道滑軌",
        unit: "組",
        pricePerUnit: 1900,
        minCai: null,
      },
      wallMaterialRef: bodyMaterial,
      bottomMaterialRef: bodyMaterial,
      frontMoldProcessing: true,
      frontMoldRadius: "R80",
      frontMoldCornerCount: 2,
      frontHandle: {
        style: "Y1A",
        lengthCm: 40,
        bakedPaint: true,
      },
    },
  ],
});
const zhengdaoDrawerProcesses = zhengdaoDrawerWithoutWeihoProcessing.internalParts
  .filter((panel) => panel.id.startsWith("zhengdao-drawer"))
  .flatMap((panel) => panel.processes);
assert.equal(zhengdaoDrawerProcesses.length, 0);
assert.equal(zhengdaoDrawerWithoutWeihoProcessing.summary.addonsBreakdown.drawerBodyKdProcessing, 0);
assert.equal(zhengdaoDrawerWithoutWeihoProcessing.hardware.find((item) => item.id === "zhengdao-drawer-rail")?.subtotal, 1900);

const zhengdaoShelfHardwareResult = calculateCabinetUnit({
  ...baseUnit,
  vendor: "ZHENGDAO",
  shelves: [
    {
      id: "zhengdao-shelf",
      widthCm: 60,
      depthCm: 35,
      quantity: 1,
      materialRef: bodyMaterial,
      hardwareProcesses: {
        hiddenShelfScrewHole: { enabled: true, quantity: 2 },
        heavyHiddenShelfScrewHole: { enabled: true, quantity: 2 },
      },
    },
  ],
});
const zhengdaoShelfProcesses = zhengdaoShelfHardwareResult.internalParts
  .find((panel) => panel.id === "zhengdao-shelf")
  ?.processes;
assert.equal(zhengdaoShelfProcesses?.find((process) => process.id === "zhengdao-shelf-hidden-shelf-screw-hole")?.unitCost, 100);
assert.equal(zhengdaoShelfProcesses?.find((process) => process.id === "zhengdao-shelf-heavy-hidden-shelf-screw-hole")?.unitCost, 400);

const zhengdaoAutomaticBackPanelResult = calculateCabinetUnit({
  ...baseUnit,
  vendor: "ZHENGDAO",
  hasBackPanel: true,
  backPanelMode: "AUTO_8MM",
  backPanelMaterialRef: bodyMaterial,
});
assert.equal(zhengdaoAutomaticBackPanelResult.summary.addonsBreakdown.backPanelGroove, 0);

const zhengdaoLTurnWithoutWeihoFee = calculateCabinetUnit({
  ...baseUnit,
  vendor: "ZHENGDAO",
  addons: {
    ...baseUnit.addons,
    lTurnCabinet: {
      enabled: true,
      position: "rightTop",
      widthMm: 400,
      heightMm: 400,
      isOpening: true,
    },
  },
});
assert.equal(zhengdaoLTurnWithoutWeihoFee.summary.addonsBreakdown.lTurnCabinet, 0);
assert.equal(zhengdaoLTurnWithoutWeihoFee.hardware.some((item) => item.id.endsWith("-l-turn-cabinet-fee")), false);

const zhengdaoWithoutHiddenWeihoProcessing = calculateCabinetUnit({
  ...baseUnit,
  vendor: "ZHENGDAO",
  addons: {
    ...baseUnit.addons,
    sidePanelInset: { enabled: true },
    bodyPanelProcesses: {
      ...DEFAULT_UNIT_ADDONS.bodyPanelProcesses!,
      top: {
        ...DEFAULT_UNIT_ADDONS.bodyPanelProcesses!.top,
        lightGroove: { enabled: true, offsetFromFrontMm: 50 },
        slidingDoorTrackGroove: { enabled: true, trackShape: "ㄇ" },
        bookcaseGuideWheelHole: { enabled: true, quantity: 2 },
      },
      left: {
        ...DEFAULT_UNIT_ADDONS.bodyPanelProcesses!.left,
        sideSealBending: {
          enabled: true,
          depthMm: 50,
          isDrawerCabinet: true,
          visibleEdgeBand: true,
        },
        hiddenReturnSlideRail: { enabled: true, quantity: 1 },
      },
    },
  },
  middleDividers: [
    {
      id: "zhengdao-hidden-divider",
      widthCm: 40,
      heightCm: 80,
      quantity: 1,
      materialRef: bodyMaterial,
      addons: {
        ...DEFAULT_MIDDLE_DIVIDER_ADDONS,
        lightGroove: { side: "left", offsetFromFrontMm: 50 },
        hiddenReturnSlideRail: { enabled: true, quantity: 1 },
      },
      specialProcesses: [
        {
          id: "zhengdao-hidden-divider-shape",
          kind: "outerShape",
          label: "L 型",
          edgeBanding: "withEdge",
          dimensionSumMm: 1200,
          quantity: 1,
        },
      ],
    },
  ],
  shelves: [
    {
      id: "zhengdao-hidden-shelf",
      widthCm: 60,
      depthCm: 35,
      quantity: 1,
      materialRef: bodyMaterial,
      lightGroove: { side: "top", offsetFromFrontMm: 50 },
      specialProcesses: [
        {
          id: "zhengdao-hidden-shelf-shape",
          kind: "outerShape",
          label: "L 型",
          edgeBanding: "withEdge",
          dimensionSumMm: 1200,
          quantity: 1,
        },
      ],
    },
  ],
});
const zhengdaoHiddenWeihoProcesses = [
  ...zhengdaoWithoutHiddenWeihoProcessing.panels,
  ...zhengdaoWithoutHiddenWeihoProcessing.internalParts,
].flatMap((panel) => panel.processes);
assert.equal(zhengdaoHiddenWeihoProcesses.some((process) => process.id.includes("light-groove")), false);
assert.equal(zhengdaoHiddenWeihoProcesses.some((process) => process.id.includes("sliding-door-track-groove")), false);
assert.equal(zhengdaoHiddenWeihoProcesses.some((process) => process.id.includes("side-seal")), false);
assert.equal(zhengdaoHiddenWeihoProcesses.some((process) => process.id.includes("hidden-return-slide-rail")), false);
assert.equal(zhengdaoHiddenWeihoProcesses.some((process) => process.id.includes("special")), false);
assert.equal(zhengdaoHiddenWeihoProcesses.some((process) => process.id.includes("side-panel-inset")), false);
assert.equal(zhengdaoWithoutHiddenWeihoProcessing.internalParts.some((part) => part.id.endsWith("-drawer-divider")), false);
assert.equal(zhengdaoWithoutHiddenWeihoProcessing.summary.addonsBreakdown.lightGroove, 0);
assert.equal(zhengdaoWithoutHiddenWeihoProcessing.summary.addonsBreakdown.specialProcessing, 0);
assert.equal(zhengdaoWithoutHiddenWeihoProcessing.summary.addonsBreakdown.sideSealBending, 0);
assert.equal(zhengdaoWithoutHiddenWeihoProcessing.summary.addonsBreakdown.slidingDoorTrackGroove, 0);
assert.equal(zhengdaoWithoutHiddenWeihoProcessing.summary.addonsBreakdown.sidePanelInset, 0);

const zhengdaoCatalogDoorProcessing = calculateCabinetUnit({
  ...baseUnit,
  vendor: "ZHENGDAO",
  doors: [
    {
      id: "zhengdao-catalog-door",
      type: "HINGED",
      name: "正道加工門片",
      widthCm: 45,
      heightCm: 90,
      quantity: 1,
      materialRef: { ...doorMaterial, minCai: null },
      addons: DEFAULT_DOOR_ADDONS,
      zhengdaoProcesses: [
        { id: "process-shaped", code: "SHAPED_SLOPED_BACK", quantityPerDoor: 1 },
        { id: "process-g1", code: "G1", quantityPerDoor: 1 },
        { id: "process-groove", code: "CUSTOM_GROOVE", quantityPerDoor: 1, lengthMm: 250 },
      ],
    },
  ],
});
const zhengdaoCatalogDoorProcessRows = zhengdaoCatalogDoorProcessing.doors[0]?.processes ?? [];
assert.deepEqual(
  zhengdaoCatalogDoorProcessRows.map((process) => ({
    id: process.id,
    quantity: process.quantity,
    unitCost: process.unitCost,
    cost: process.cost,
  })),
  [
    { id: "process-shaped", quantity: 4.4113, unitCost: 90, cost: 397 },
    { id: "process-g1", quantity: 1, unitCost: 600, cost: 600 },
    { id: "process-groove", quantity: 25, unitCost: 20, cost: 500 },
  ],
);
assert.equal(zhengdaoCatalogDoorProcessing.doors[0]?.addonsCost, 1497);
assert.equal(zhengdaoCatalogDoorProcessing.summary.addonsBreakdown.zhengdaoDoorProcessing, 1497);
assert.equal(zhengdaoCatalogDoorProcessing.summary.totalCost >= 1497, true);

const zhengdaoAluminumPartitionProcessing = calculateCabinetUnit({
  ...baseUnit,
  vendor: "ZHENGDAO",
  doors: [
    {
      id: "zhengdao-s2-partition-door",
      type: "SLIDING",
      name: "S2 隔間門",
      widthCm: 45,
      heightCm: 90,
      quantity: 1,
      materialRef: {
        materialId: "zhengdao-door-S2-ALUMINUM",
        materialName: "S2 鋁框落地推拉門（鋁色） 20mm",
        unit: "才",
        pricePerUnit: 550,
        minCai: 10,
      },
      addons: DEFAULT_DOOR_ADDONS,
      zhengdaoDoorSelection: { mode: "PARTITION_DOOR", optionCode: "S2-ALUMINUM" },
      zhengdaoProcesses: [
        { id: "process-a2-2", code: "ALUMINUM_FRAME_PARTITION_A2_2", quantityPerDoor: 1 },
        { id: "process-s2-track", code: "S2_TRACK_DOUBLE", quantityPerDoor: 3 },
        { id: "process-s2-buffer", code: "S2_BUFFER", quantityPerDoor: 1 },
      ],
    },
  ],
});
const zhengdaoAluminumPartitionProcess = zhengdaoAluminumPartitionProcessing.doors[0]?.processes.find(
  (process) => process.id === "process-a2-2",
);
assert.equal(zhengdaoAluminumPartitionProcess?.label, "A2-2 鋁框門區隔");
assert.equal(zhengdaoAluminumPartitionProcess?.quantity, 4.4113);
assert.equal(zhengdaoAluminumPartitionProcess?.unitCost, 120);
assert.equal(zhengdaoAluminumPartitionProcess?.cost, 529);
assert.equal(
  zhengdaoAluminumPartitionProcessing.doors[0]?.processes.find((process) => process.id === "process-s2-track")?.cost,
  600,
);
assert.equal(
  zhengdaoAluminumPartitionProcessing.doors[0]?.processes.find((process) => process.id === "process-s2-buffer")?.cost,
  1200,
);
assert.equal(zhengdaoAluminumPartitionProcessing.summary.addonsBreakdown.zhengdaoDoorProcessing, 2329);

const zhengdaoH8HardwareProcessing = calculateCabinetUnit({
  ...baseUnit,
  vendor: "ZHENGDAO",
  doors: [
    {
      id: "zhengdao-h8-partition-door",
      type: "SLIDING",
      name: "H8 隔間門",
      widthCm: 45,
      heightCm: 90,
      quantity: 1,
      materialRef: {
        materialId: "zhengdao-door-H8-ALUMINUM",
        materialName: "H8 鋁框懸吊門（鋁色） 20mm",
        unit: "才",
        pricePerUnit: 600,
        minCai: 10,
      },
      addons: DEFAULT_DOOR_ADDONS,
      zhengdaoDoorSelection: { mode: "PARTITION_DOOR", optionCode: "H8-ALUMINUM" },
      zhengdaoProcesses: [
        { id: "process-h8-separator", code: "H8_SEPARATOR", quantityPerDoor: 1 },
        { id: "process-h8-track", code: "H8_TRACK_ANODIZED", quantityPerDoor: 2 },
        { id: "process-h8-buffer", code: "H8_BUFFER", quantityPerDoor: 1 },
      ],
    },
  ],
});
assert.equal(
  zhengdaoH8HardwareProcessing.doors[0]?.processes.find((process) => process.id === "process-h8-separator")?.cost,
  132,
);
assert.equal(
  zhengdaoH8HardwareProcessing.doors[0]?.processes.find((process) => process.id === "process-h8-track")?.cost,
  700,
);
assert.equal(
  zhengdaoH8HardwareProcessing.doors[0]?.processes.find((process) => process.id === "process-h8-buffer")?.cost,
  6700,
);
assert.equal(zhengdaoH8HardwareProcessing.summary.addonsBreakdown.zhengdaoDoorProcessing, 7532);

console.log("cabinet redesign calculation tests passed");
