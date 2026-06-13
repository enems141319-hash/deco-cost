// src/lib/calculations/cabinet.ts
// 純函式：零 UI 依賴、零副作用。

import { ADDON_PRICES, DRAWER_FRONT_MOLD_CORNER_PRICING, DRAWER_FRONT_MOLD_PROCESSING_PRICES, PROFILE_HANDLE_BAKED_PAINT_SURCHARGE, PROFILE_HANDLE_PROCESSING_RULES, SIDE_SEAL_BENDING_PRICES, SPECIAL_PROCESSING_PRICES, UNIT_CONFIG } from "../config/units";
import { DEFAULT_DOOR_ADDONS, DEFAULT_UNIT_ADDONS } from "../../types";
import type {
  AccessoryResult,
  AddonsBreakdown,
  AreaMeasure,
  CabinetProjectResult,
  CabinetUnitInput,
  CabinetUnitResult,
  CabinetUnitSummary,
  DrawerInput,
  DoorResult,
  HardwareItemInput,
  HardwareResult,
  LTurnCabinetPosition,
  MaterialRef,
  PanelProcessResult,
  PanelResult,
  ProcessingQuantitySwitch,
  ProfileHandleStyle,
  SpecialProcessInput,
  SideSealBendingOption,
  UnitAddons,
  UnitBodyPanelProcesses,
  SlidingDoorTrackShape,
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
  return {
    cai: round(billableTotalCai, UNIT_CONFIG.AREA_DECIMAL_PLACES),
    cm2: round(billableTotalCai * UNIT_CONFIG.CAI_CM2, UNIT_CONFIG.AREA_DECIMAL_PLACES),
    m2: round((billableTotalCai * UNIT_CONFIG.CAI_CM2) / 10_000, UNIT_CONFIG.AREA_DECIMAL_PLACES),
  };
}

function toAreaMeasureFromCai(cai: number): AreaMeasure {
  return {
    cai: round(cai, UNIT_CONFIG.AREA_DECIMAL_PLACES),
    cm2: round(cai * UNIT_CONFIG.CAI_CM2, UNIT_CONFIG.AREA_DECIMAL_PLACES),
    m2: round((cai * UNIT_CONFIG.CAI_CM2) / 10_000, UNIT_CONFIG.AREA_DECIMAL_PLACES),
  };
}

function emptyBreakdown(): AddonsBreakdown {
  return {
    frontEdgeABS: 0,
    doubleDrillHoles: 0,
    nonStandardHoles: 0,
    patternMatch: 0,
    temperedGlass: 0,
    hingeHoleDrilling: 0,
    backPanelGroove: 0,
    lightGroove: 0,
    slidingDoorTrackGroove: 0,
    lTurnCabinet: 0,
    specialProcessing: 0,
    sideSealBending: 0,
    sidePanelInset: 0,
    panelHardwareProcessing: 0,
    drawerBodyKdProcessing: 0,
  };
}

function calcFrontEdgeAddon(frontEdgeABS: UnitAddons["frontEdgeABS"]): number {
  if (frontEdgeABS === "one_long") return ADDON_PRICES.FRONT_EDGE_ABS_ONE_LONG;
  if (frontEdgeABS === "two_long") return ADDON_PRICES.FRONT_EDGE_ABS_TWO_LONG;
  return 0;
}

function frontEdgeABSEdgeCount(frontEdgeABS: UnitAddons["frontEdgeABS"]): number {
  if (frontEdgeABS !== "none") return 1;
  return 0;
}

function frontEdgeABSUnitCost(materialRef: MaterialRef | null): number {
  const thicknessMm = materialThicknessMm(materialRef);
  if (thicknessMm >= 25) return UNIT_CONFIG.FRONT_EDGE_ABS_25MM_UNIT_COST_PER_CM;
  if (thicknessMm >= 18) return UNIT_CONFIG.FRONT_EDGE_ABS_18MM_UNIT_COST_PER_CM;
  return 0;
}

function frontEdgeABSProcess(
  panelId: string,
  widthCm: number,
  heightCm: number,
  quantity: number,
  materialRef: MaterialRef | null,
  frontEdgeABS: UnitAddons["frontEdgeABS"],
): PanelProcessResult | undefined {
  const edgeCount = frontEdgeABSEdgeCount(frontEdgeABS);
  const unitCost = frontEdgeABSUnitCost(materialRef);
  if (edgeCount <= 0 || unitCost <= 0) return undefined;

  const billableLengthCm = Math.min(
    Math.max(Math.max(widthCm, heightCm), UNIT_CONFIG.FRONT_EDGE_ABS_MIN_LENGTH_CM),
    UNIT_CONFIG.FRONT_EDGE_ABS_MAX_LENGTH_CM,
  );
  const processQuantity = billableLengthCm * edgeCount * quantity;

  return panelProcess(
    `${panelId}-front-edge-abs`,
    "板厚處切斜邊封ABS",
    processQuantity * unitCost,
    true,
    processQuantity,
    unitCost,
  );
}

function sidePanelInsetProcess(panelId: string, unitQty: number, includedInSubtotal = true): PanelProcessResult {
  const unitCost = UNIT_CONFIG.SIDE_PANEL_INSET_PROCESS_COST;
  return {
    id: `${panelId}-side-panel-inset`,
    label: "側板崁凹(檔板設計)",
    quantity: unitQty,
    unitCost: includedInSubtotal ? unitCost : 0,
    cost: includedInSubtotal ? unitCost * unitQty : 0,
    includedInSubtotal,
  };
}

function quantityProcess(
  id: string,
  label: string,
  option: ProcessingQuantitySwitch | undefined,
  boardQuantity: number,
  unitCost: number,
): PanelProcessResult | undefined {
  if (!option?.enabled) return undefined;
  const perBoardQuantity = Math.max(option.quantity || 0, 0);
  if (perBoardQuantity <= 0 || boardQuantity <= 0) return undefined;
  const quantity = perBoardQuantity * boardQuantity;

  return panelProcess(
    id,
    `${label}(X${perBoardQuantity})`,
    quantity * unitCost,
    true,
    quantity,
    unitCost,
  );
}

function middleDividerHoleProcesses(
  id: string,
  widthCm: number,
  heightCm: number,
  quantity: number,
  materialRef: MaterialRef | null,
  addons: { doubleDrillHoles: boolean; nonStandardHoles: boolean } | undefined,
): PanelProcessResult[] {
  if (!addons?.doubleDrillHoles) return [];
  const billableArea = toBillableAreaMeasure(widthCm * heightCm, materialRef?.minCai ?? null, quantity);
  const rows: PanelProcessResult[] = [
    {
      id: `${id}-double-drill-holes`,
      label: "\u96d9\u6392\u5b54",
      quantity: billableArea.cai,
      unitCost: ADDON_PRICES.DOUBLE_DRILL_HOLES,
      cost: round(billableArea.cai * ADDON_PRICES.DOUBLE_DRILL_HOLES, UNIT_CONFIG.COST_DECIMAL_PLACES),
      includedInSubtotal: true,
    },
  ];
  if (addons.nonStandardHoles) {
    rows.push({
      id: `${id}-non-standard-holes`,
      label: "\u975e\u6a19\u6e96\u6392\u5b54",
      quantity: billableArea.cai,
      unitCost: ADDON_PRICES.NON_STANDARD_HOLES,
      cost: round(billableArea.cai * ADDON_PRICES.NON_STANDARD_HOLES, UNIT_CONFIG.COST_DECIMAL_PLACES),
      includedInSubtotal: true,
    });
  }
  return rows;
}

function calcLightGrooveUnitCost(lengthCm: number): number {
  const lengthMm = lengthCm * 10;
  return lengthMm <= UNIT_CONFIG.LIGHT_GROOVE_LENGTH_THRESHOLD_MM
    ? UNIT_CONFIG.LIGHT_GROOVE_COST_SHORT
    : UNIT_CONFIG.LIGHT_GROOVE_COST_LONG;
}

function calcLightGrooveCost(lengthCm: number, quantity: number): number {
  return calcLightGrooveUnitCost(lengthCm) * quantity;
}

function lightGrooveProcess(id: string, label: string, lengthCm: number, quantity: number): PanelProcessResult {
  const unitCost = calcLightGrooveUnitCost(lengthCm);
  return {
    id,
    label,
    quantity,
    unitCost,
    cost: unitCost * quantity,
    includedInSubtotal: true,
  };
}

function slidingDoorTrackGrooveProcess(id: string, quantity: number, trackShape: SlidingDoorTrackShape): PanelProcessResult {
  const unitCost = UNIT_CONFIG.SLIDING_DOOR_TRACK_GROOVE_COST_PER_LINE;
  return {
    id,
    label: `推門軌道溝: ${trackShape}型軌道, 限溝寬${UNIT_CONFIG.SLIDING_DOOR_TRACK_GROOVE_WIDTH_MM}mm`,
    quantity,
    unitCost,
    cost: unitCost * quantity,
    includedInSubtotal: true,
  };
}

function lTurnCabinetPositionLabel(position: LTurnCabinetPosition): string {
  if (position === "rightTop") return "右上";
  if (position === "rightBottom") return "右下";
  if (position === "leftTop") return "左上";
  return "左下";
}

function lTurnCabinetProcess(
  id: string,
  quantity: number,
  position: LTurnCabinetPosition,
  widthMm: number,
  heightMm: number,
  includedInSubtotal = true,
): PanelProcessResult | undefined {
  if (widthMm + heightMm > UNIT_CONFIG.L_TURN_CABINET_MAX_DIMENSION_SUM_MM) return undefined;

  const unitCost = UNIT_CONFIG.L_TURN_CABINET_PROCESS_COST;
  return {
    id,
    label: `L轉櫃加工: ${lTurnCabinetPositionLabel(position)}, W=${widthMm}mm, H=${heightMm}mm`,
    quantity,
    unitCost: includedInSubtotal ? unitCost : 0,
    cost: includedInSubtotal ? unitCost * quantity : 0,
    includedInSubtotal,
  };
}

function buildBackPanelGrooveNote(): string {
  return `背板溝槽: 離後緣18mm, 寬${UNIT_CONFIG.BACK_PANEL_GROOVE_WIDTH_MM}mm, 深${UNIT_CONFIG.BACK_PANEL_GROOVE_DEPTH_MM}mm`;
}

function insetPanelDimension(outerCm: number, thicknessCm: number): number {
  return round(
    Math.max(outerCm - thicknessCm * 2 + UNIT_CONFIG.BACK_PANEL_SIZE_OVERLAP_CM, 0),
    UNIT_CONFIG.DIMENSION_DECIMAL_PLACES,
  );
}

function drawerBottomDimension(outerCm: number, wallThicknessCm: number): number {
  return round(
    Math.max(outerCm - wallThicknessCm * 2 + UNIT_CONFIG.DRAWER_BOTTOM_SIZE_OVERLAP_CM, 0),
    UNIT_CONFIG.DIMENSION_DECIMAL_PLACES,
  );
}

function drawerGrooveNote(): string {
  return `內側下方打溝 (${UNIT_CONFIG.DRAWER_GROOVE_WIDTH_MM}mm, 深${UNIT_CONFIG.DRAWER_GROOVE_DEPTH_MM}mm)`;
}

function drawerBodyKdProcess(drawerId: string, quantity: number): PanelProcessResult {
  return panelProcess(
    `${drawerId}-body-kd-processing`,
    "抽身指定KD",
    UNIT_CONFIG.DRAWER_BODY_KD_PROCESSING_COST_PER_SET * quantity,
    true,
    quantity,
    UNIT_CONFIG.DRAWER_BODY_KD_PROCESSING_COST_PER_SET,
  );
}

function backPanelOuterHeight(input: CabinetUnitInput): number {
  return Math.max(input.heightCm - (input.kickPlate?.heightCm ?? 0), 0);
}

function hasAutomaticBackPanel(input: CabinetUnitInput): boolean {
  return input.hasBackPanel && (input.backPanelMode ?? "AUTO_8MM") === "AUTO_8MM";
}

function lTurnBackPanelWidth(widthCm: number, deductionCm: number): number {
  return round(Math.max(widthCm - deductionCm, 0), UNIT_CONFIG.DIMENSION_DECIMAL_PLACES);
}

function lTurnKickPlateWidth(baseWidthCm: number, sideThicknessCm: number, direction: "width" | "depth"): number {
  const extraCm = UNIT_CONFIG.L_TURN_KICK_PLATE_SHARED_OVERLAP_CM
    + (direction === "width" ? UNIT_CONFIG.L_TURN_KICK_PLATE_WIDTH_EXTRA_CM : 0);
  return round(Math.max(baseWidthCm - sideThicknessCm + extraCm, 0), UNIT_CONFIG.DIMENSION_DECIMAL_PLACES);
}

function lTurnClosedKickPlateWidth(baseWidthCm: number, sideThicknessCm: number, direction: "width" | "depth"): number {
  const deductionCm = direction === "width"
    ? UNIT_CONFIG.L_TURN_CLOSED_KICK_PLATE_WIDTH_DEDUCTION_CM
    : UNIT_CONFIG.L_TURN_CLOSED_KICK_PLATE_DEPTH_DEDUCTION_CM;
  return round(Math.max(baseWidthCm - sideThicknessCm - deductionCm, 0), UNIT_CONFIG.DIMENSION_DECIMAL_PLACES);
}

function lTurnCabinetPanels(input: CabinetUnitInput, unitQty: number): PanelResult[] {
  const option = input.addons.lTurnCabinet;
  if (!option?.enabled) return [];

  const cutoutWidthCm = round(Math.min(Math.max(option.widthMm / 10, 0), input.widthCm), UNIT_CONFIG.DIMENSION_DECIMAL_PLACES);
  const cutoutDepthCm = round(Math.min(Math.max(option.heightMm / 10, 0), input.depthCm), UNIT_CONFIG.DIMENSION_DECIMAL_PLACES);
  const remainingWidthCm = round(Math.max(input.widthCm - cutoutWidthCm, 0), UNIT_CONFIG.DIMENSION_DECIMAL_PLACES);
  const remainingDepthCm = round(Math.max(input.depthCm - cutoutDepthCm, 0), UNIT_CONFIG.DIMENSION_DECIMAL_PLACES);
  const bodyMaterials = bodyPanelMaterialRefs(input);
  const sideThicknessCm = materialThicknessCm(bodyMaterials.side);
  const backWidthOuterCm = option.isOpening ? input.widthCm : cutoutWidthCm;
  const backDepthOuterCm = option.isOpening ? input.depthCm : cutoutDepthCm;
  const backWidthCm = lTurnBackPanelWidth(backWidthOuterCm, UNIT_CONFIG.L_TURN_BACK_PANEL_WIDTH_DEDUCTION_CM);
  const backDepthCm = lTurnBackPanelWidth(backDepthOuterCm, UNIT_CONFIG.L_TURN_BACK_PANEL_DEPTH_DEDUCTION_CM);
  const backHeightCm = insetPanelDimension(backPanelOuterHeight(input), sideThicknessCm);
  const backPanelGrooveNote = hasAutomaticBackPanel(input) ? buildBackPanelGrooveNote() : undefined;
  const backPanelGrooveCostPerLine = hasAutomaticBackPanel(input) ? UNIT_CONFIG.BACK_PANEL_GROOVE_COST_PER_LINE : 0;

  const panels: PanelResult[] = [
    buildPanelResult({
      id: `${input.id}-l-turn-side-width`,
      name: "L轉側板-寬向",
      widthCm: input.heightCm,
      heightCm: remainingWidthCm,
      quantity: unitQty,
      materialRef: bodyMaterials.side,
      isAutoGenerated: true,
      addonPricePerCai: calcFrontEdgeAddon(input.addons.frontEdgeABS),
      note: backPanelGrooveNote,
      processes: [
        ...(backPanelGrooveNote ? [panelProcess(`${input.id}-l-turn-side-width-back-groove`, backPanelGrooveNote, backPanelGrooveCostPerLine, false)] : []),
      ],
    }),
    buildPanelResult({
      id: `${input.id}-l-turn-side-depth`,
      name: "L轉側板-深向",
      widthCm: input.heightCm,
      heightCm: remainingDepthCm,
      quantity: unitQty,
      materialRef: bodyMaterials.side,
      isAutoGenerated: true,
      addonPricePerCai: calcFrontEdgeAddon(input.addons.frontEdgeABS),
      note: backPanelGrooveNote,
      processes: [
        ...(backPanelGrooveNote ? [panelProcess(`${input.id}-l-turn-side-depth-back-groove`, backPanelGrooveNote, backPanelGrooveCostPerLine, false)] : []),
      ],
    }),
  ];

  if (hasAutomaticBackPanel(input)) {
    panels.push(
      buildPanelResult({
        id: `${input.id}-l-turn-back-width`,
        name: "L轉背板-寬向",
        widthCm: backWidthCm,
        heightCm: backHeightCm,
        quantity: unitQty,
        materialRef: input.backPanelMaterialRef,
        isAutoGenerated: true,
      }),
      buildPanelResult({
        id: `${input.id}-l-turn-back-depth`,
        name: "L轉背板-深向",
        widthCm: backDepthCm,
        heightCm: backHeightCm,
        quantity: unitQty,
        materialRef: input.backPanelMaterialRef,
        isAutoGenerated: true,
      }),
    );
  }

  return panels;
}

function lTurnCabinetKickPlatePanels(input: CabinetUnitInput, unitQty: number, addonPricePerCai: number): PanelResult[] {
  const option = input.addons.lTurnCabinet;
  const kickPlate = input.kickPlate;
  if (!option?.enabled || !kickPlate) return [];

  const cutoutWidthCm = round(Math.min(Math.max(option.widthMm / 10, 0), input.widthCm), UNIT_CONFIG.DIMENSION_DECIMAL_PLACES);
  const cutoutDepthCm = round(Math.min(Math.max(option.heightMm / 10, 0), input.depthCm), UNIT_CONFIG.DIMENSION_DECIMAL_PLACES);
  const remainingWidthCm = round(Math.max(input.widthCm - cutoutWidthCm, 0), UNIT_CONFIG.DIMENSION_DECIMAL_PLACES);
  const remainingDepthCm = round(Math.max(input.depthCm - cutoutDepthCm, 0), UNIT_CONFIG.DIMENSION_DECIMAL_PLACES);
  const bodyMaterials = bodyPanelMaterialRefs(input);
  const sideThicknessCm = materialThicknessCm(bodyMaterials.side);
  const kickPlateWidthBaseCm = option.isOpening ? cutoutWidthCm : input.widthCm;
  const kickPlateDepthBaseCm = option.isOpening ? cutoutDepthCm : input.depthCm;
  const kickPlateWidthCm = option.isOpening
    ? lTurnKickPlateWidth(kickPlateWidthBaseCm, sideThicknessCm, "width")
    : lTurnClosedKickPlateWidth(kickPlateWidthBaseCm, sideThicknessCm, "width");
  const kickPlateDepthCm = option.isOpening
    ? lTurnKickPlateWidth(kickPlateDepthBaseCm, sideThicknessCm, "depth")
    : lTurnClosedKickPlateWidth(kickPlateDepthBaseCm, sideThicknessCm, "depth");
  const kickPlateLines = option.isOpening
    ? [
        { id: "cutout-width", name: "L轉踢腳板-缺口寬向", widthCm: kickPlateWidthCm },
        { id: "cutout-depth", name: "L轉踢腳板-缺口深向", widthCm: kickPlateDepthCm },
      ]
    : [
        { id: "outer-width", name: "L轉踢腳板-外側寬向", widthCm: kickPlateWidthCm },
        { id: "outer-depth", name: "L轉踢腳板-外側深向", widthCm: kickPlateDepthCm },
      ];

  return kickPlateLines
    .filter((line) => line.widthCm > 0)
    .map((line) => buildPanelResult({
      id: `${input.id}-kickplate-${line.id}`,
      name: line.name,
      widthCm: line.widthCm,
      heightCm: kickPlate.heightCm,
      quantity: unitQty,
      materialRef: bodyMaterials.side,
      isAutoGenerated: true,
      addonPricePerCai,
    }));
}

function panelProcess(
  id: string,
  label: string,
  cost: number,
  includedInSubtotal = true,
  quantity = 1,
  unitCost = cost,
): PanelProcessResult {
  return {
    id,
    label,
    quantity,
    unitCost,
    cost,
    includedInSubtotal,
  };
}

function lightGrooveNote(label: string, offsetFromFrontMm: number): string {
  return `燈溝: ${label}, 離前緣${offsetFromFrontMm}mm, 寬${UNIT_CONFIG.LIGHT_GROOVE_WIDTH_MM}mm, 深${UNIT_CONFIG.LIGHT_GROOVE_DEPTH_MM}mm`;
}

function sideSealBendingUnitCost(depthMm: number): number {
  if (depthMm <= 80) return SIDE_SEAL_BENDING_PRICES.DEPTH_80;
  if (depthMm <= 450) return SIDE_SEAL_BENDING_PRICES.DEPTH_450;
  return SIDE_SEAL_BENDING_PRICES.DEPTH_600;
}

function sideSealBendingProcesses(
  panelId: string,
  sideLabel: string,
  lengthCm: number,
  option: SideSealBendingOption | undefined,
  unitQty: number,
): PanelProcessResult[] {
  if (!option?.enabled) return [];

  const billableLengthCm = Math.max(lengthCm, UNIT_CONFIG.SIDE_SEAL_BENDING_MIN_LENGTH_CM);
  const depthMm = Math.min(Math.max(option.depthMm ?? option.depthCm ?? 80, 80), 600);
  const unitCost = sideSealBendingUnitCost(depthMm);
  const drawerNote = option.isDrawerCabinet ? "，抽屜櫃側需補中立板" : "";
  const rows: PanelProcessResult[] = [
    {
      id: `${panelId}-side-seal-bending`,
      label: `側封板R50彎曲造型加工-${sideLabel} D=${depthMm}mm${drawerNote}`,
      quantity: billableLengthCm * unitQty,
      unitCost,
      cost: billableLengthCm * unitQty * unitCost,
      includedInSubtotal: true,
    },
  ];

  if (option.visibleEdgeBand) {
    const edgeUnitCost = lengthCm <= UNIT_CONFIG.SIDE_SEAL_BENDING_VISIBLE_EDGE_SHORT_LIMIT_CM
      ? UNIT_CONFIG.SIDE_SEAL_BENDING_VISIBLE_EDGE_SHORT_COST
      : UNIT_CONFIG.SIDE_SEAL_BENDING_VISIBLE_EDGE_LONG_COST;
    rows.push({
      id: `${panelId}-side-seal-visible-edge`,
      label: `側封板內側55mm可見封邊-${sideLabel}`,
      quantity: unitQty,
      unitCost: edgeUnitCost,
      cost: edgeUnitCost * unitQty,
      includedInSubtotal: true,
    });
  }

  return rows;
}

function joinNotes(...notes: Array<string | undefined>): string | undefined {
  return notes.filter(Boolean).join("; ") || undefined;
}

function bodyPanelMaterialRefs(input: CabinetUnitInput): {
  top: MaterialRef | null;
  side: MaterialRef | null;
  bottom: MaterialRef | null;
} {
  return {
    top: input.topPanelMaterialRef ?? input.panelMaterialRef,
    side: input.sidePanelMaterialRef ?? input.panelMaterialRef,
    bottom: input.bottomPanelMaterialRef ?? input.panelMaterialRef,
  };
}

function bodyPanelProcesses(addons: UnitAddons): UnitBodyPanelProcesses {
  const defaults = DEFAULT_UNIT_ADDONS.bodyPanelProcesses!;
  const legacyLightGrooves = addons.lightGrooves;
  const legacySlidingDoorTrackGrooves = addons.slidingDoorTrackGrooves;
  const legacySideSealBending = addons.sideSealBending;
  const current = addons.bodyPanelProcesses;

  return {
    top: {
      frontEdgeABS: current?.top.frontEdgeABS ?? addons.frontEdgeABS ?? defaults.top.frontEdgeABS,
      lightGroove: current?.top.lightGroove ?? legacyLightGrooves?.topInner ?? defaults.top.lightGroove,
      slidingDoorTrackGroove: current?.top.slidingDoorTrackGroove ?? legacySlidingDoorTrackGrooves?.top ?? defaults.top.slidingDoorTrackGroove,
      bookcaseGuideWheelHole: current?.top.bookcaseGuideWheelHole ?? defaults.top.bookcaseGuideWheelHole,
    },
    bottom: {
      frontEdgeABS: current?.bottom.frontEdgeABS ?? addons.frontEdgeABS ?? defaults.bottom.frontEdgeABS,
      slidingDoorTrackGroove: current?.bottom.slidingDoorTrackGroove ?? legacySlidingDoorTrackGrooves?.bottom ?? defaults.bottom.slidingDoorTrackGroove,
      smallAdjustableFootHole: current?.bottom.smallAdjustableFootHole ?? defaults.bottom.smallAdjustableFootHole,
      lightStWheelHole: current?.bottom.lightStWheelHole ?? defaults.bottom.lightStWheelHole,
      heavyStWheelHole: current?.bottom.heavyStWheelHole ?? defaults.bottom.heavyStWheelHole,
      bookcaseGuideWheelHole: current?.bottom.bookcaseGuideWheelHole ?? defaults.bottom.bookcaseGuideWheelHole,
    },
    left: {
      frontEdgeABS: current?.left.frontEdgeABS ?? addons.frontEdgeABS ?? defaults.left.frontEdgeABS,
      lightGroove: current?.left.lightGroove ?? legacyLightGrooves?.sideInner ?? defaults.left.lightGroove,
      sideSealBending: current?.left.sideSealBending ?? legacySideSealBending?.left ?? defaults.left.sideSealBending,
      hiddenReturnSlideRail: current?.left.hiddenReturnSlideRail ?? defaults.left.hiddenReturnSlideRail,
      specialUGlassPivot: current?.left.specialUGlassPivot ?? defaults.left.specialUGlassPivot,
      tRailBedSet: current?.left.tRailBedSet ?? defaults.left.tRailBedSet,
    },
    right: {
      frontEdgeABS: current?.right.frontEdgeABS ?? addons.frontEdgeABS ?? defaults.right.frontEdgeABS,
      lightGroove: current?.right.lightGroove ?? legacyLightGrooves?.sideInner ?? defaults.right.lightGroove,
      sideSealBending: current?.right.sideSealBending ?? legacySideSealBending?.right ?? defaults.right.sideSealBending,
      hiddenReturnSlideRail: current?.right.hiddenReturnSlideRail ?? defaults.right.hiddenReturnSlideRail,
      specialUGlassPivot: current?.right.specialUGlassPivot ?? defaults.right.specialUGlassPivot,
      tRailBedSet: current?.right.tRailBedSet ?? defaults.right.tRailBedSet,
    },
  };
}

function materialThicknessCm(materialRef: MaterialRef | null): number {
  const match = materialRef?.materialName.match(/(\d+(?:\.\d+)?)\s*mm/i);
  if (!match) return 0;
  return Number(match[1]) / 10;
}

function internalFullHeightCm(input: CabinetUnitInput): number {
  const bodyMaterials = bodyPanelMaterialRefs(input);
  const topThicknessCm = materialThicknessCm(bodyMaterials.top);
  const bottomThicknessCm = materialThicknessCm(bodyMaterials.bottom);
  return round(
    Math.max(input.heightCm - topThicknessCm - bottomThicknessCm - (input.kickPlate?.heightCm ?? 0), 0),
    UNIT_CONFIG.DIMENSION_DECIMAL_PLACES,
  );
}

function internalFullDepthCm(input: CabinetUnitInput): number {
  return round(
    Math.max(input.depthCm - (hasAutomaticBackPanel(input) ? 2.8 : 0), 0),
    UNIT_CONFIG.DIMENSION_DECIMAL_PLACES,
  );
}

type ThicknessPriceGroup = "EIGHT_MM" | "THIN" | "THICK";
type SizeTier = "UNDER_900" | "UNDER_1500" | "UNDER_2400";

function materialThicknessMm(materialRef: MaterialRef | null): number {
  return materialThicknessCm(materialRef) * 10;
}

function thicknessPriceGroup(materialRef: MaterialRef | null): ThicknessPriceGroup {
  const thicknessMm = materialThicknessMm(materialRef);
  if (thicknessMm === 8) return "EIGHT_MM";
  if (thicknessMm >= 40) return "THICK";
  return "THIN";
}

function sizeTier(dimensionSumMm: number): SizeTier | null {
  if (dimensionSumMm <= 900) return "UNDER_900";
  if (dimensionSumMm <= 1500) return "UNDER_1500";
  if (dimensionSumMm <= 2400) return "UNDER_2400";
  return null;
}

function priceForGroup(prices: Partial<Record<ThicknessPriceGroup, number>>, group: ThicknessPriceGroup): number {
  return prices[group] ?? prices.THIN ?? 0;
}

function calcSpecialProcessUnitCost(process: SpecialProcessInput, materialRef: MaterialRef | null): number | null {
  const group = thicknessPriceGroup(materialRef);

  if (process.kind === "roundCorner" || process.kind === "quarterRound") {
    const radiusMm = process.radiusMm ?? 0;
    const mode = process.radiusMode ?? "factory";
    if (mode === "factory") {
      const prices = radiusMm <= 50
        ? SPECIAL_PROCESSING_PRICES.ROUND_CORNER.FACTORY_SMALL
        : SPECIAL_PROCESSING_PRICES.ROUND_CORNER.FACTORY_LARGE;
      return priceForGroup(prices, group);
    }
    if (radiusMm <= 450) return priceForGroup(SPECIAL_PROCESSING_PRICES.ROUND_CORNER.CUSTOM_450, group);
    if (radiusMm <= 750) return priceForGroup(SPECIAL_PROCESSING_PRICES.ROUND_CORNER.CUSTOM_750, group);
    if (radiusMm <= 1200) return priceForGroup(SPECIAL_PROCESSING_PRICES.ROUND_CORNER.CUSTOM_1200, group);
    return null;
  }

  const dimensionSumMm = process.dimensionSumMm ?? 0;
  if (process.kind === "cutCorner") {
    if (dimensionSumMm <= 600) return priceForGroup(SPECIAL_PROCESSING_PRICES.CUT_CORNER_UNDER_600, group);
    const tier = sizeTier(dimensionSumMm);
    return tier ? priceForGroup(SPECIAL_PROCESSING_PRICES.OUTER_SHAPE.WITH_EDGE[tier], group) : null;
  }

  const tier = sizeTier(dimensionSumMm);
  if (!tier) return null;

  if (process.kind === "outerShape") {
    const table = process.edgeBanding === "withEdge"
      ? SPECIAL_PROCESSING_PRICES.OUTER_SHAPE.WITH_EDGE
      : SPECIAL_PROCESSING_PRICES.OUTER_SHAPE.NO_EDGE;
    return priceForGroup(table[tier], group);
  }

  const table = process.edgeBanding === "withEdge"
    ? SPECIAL_PROCESSING_PRICES.INNER_CUTOUT.WITH_EDGE
    : SPECIAL_PROCESSING_PRICES.INNER_CUTOUT.NO_EDGE;
  return priceForGroup(table[tier], group);
}

function specialProcessKindLabel(kind: SpecialProcessInput["kind"]): string {
  if (kind === "roundCorner") return "\u5c0e\u5713\u52a0\u5de5";
  if (kind === "quarterRound") return "1/4\u5713\u52a0\u5de5";
  if (kind === "cutCorner") return "\u5207\u89d2\u52a0\u5de5";
  if (kind === "outerShape") return "\u677f\u5916\u9020\u578b\u52a0\u5de5";
  return "\u677f\u5167\u958b\u5b54\u52a0\u5de5";
}

function specialProcessLabel(process: SpecialProcessInput, unitCost: number | null): string {
  const label = process.label || specialProcessKindLabel(process.kind);
  if (unitCost === null) return `${specialProcessKindLabel(process.kind)}-${label} 需另詢價`;
  if (process.kind === "roundCorner" || process.kind === "quarterRound") {
    const mode = (process.radiusMode ?? "factory") === "factory" ? "廠模" : "客製";
    const radius = process.radiusMm && !label.includes(`R${process.radiusMm}`) ? ` R${process.radiusMm}` : "";
    return `${specialProcessKindLabel(process.kind)}-${label}${radius} ${mode}`;
  }
  const edge = process.edgeBanding === "withEdge" ? "有封邊" : "不封邊";
  return `${specialProcessKindLabel(process.kind)}-${label} A+B ${process.dimensionSumMm ?? 0}mm ${edge}`;
}

function calcSharpCornerCost(process: SpecialProcessInput, materialRef: MaterialRef | null): number {
  const gte90Count = process.sharpCornerGte90Count ?? 0;
  const lt90Count = process.sharpCornerLt90Count ?? 0;
  if (gte90Count <= 0 && lt90Count <= 0) return 0;

  const isThick = materialThicknessMm(materialRef) > 26;
  const gte90Price = isThick
    ? SPECIAL_PROCESSING_PRICES.SHARP_CORNER.GT_26MM_GTE_90
    : SPECIAL_PROCESSING_PRICES.SHARP_CORNER.LE_26MM_GTE_90;
  const lt90Price = isThick
    ? SPECIAL_PROCESSING_PRICES.SHARP_CORNER.GT_26MM_LT_90
    : SPECIAL_PROCESSING_PRICES.SHARP_CORNER.LE_26MM_LT_90;
  return gte90Count * gte90Price + lt90Count * lt90Price;
}

function roundCornerDiscountKey(process: SpecialProcessInput, materialRef: MaterialRef | null): string {
  return [
    process.kind,
    process.radiusMode ?? "factory",
    process.radiusMm ?? 0,
    thicknessPriceGroup(materialRef),
  ].join("|");
}

function specialProcesses(
  parentId: string,
  materialRef: MaterialRef | null,
  parentQuantity: number,
  processes: SpecialProcessInput[] | undefined,
): PanelProcessResult[] {
  const roundCornerCounts = new Map<string, number>();

  return (processes ?? []).flatMap((process) => {
    const unitCost = calcSpecialProcessUnitCost(process, materialRef);
    const sharpCornerCost = calcSharpCornerCost(process, materialRef);
    const processQuantityPerBoard = Math.max(1, process.quantity);
    const label = specialProcessLabel(process, unitCost);

    if ((process.kind === "roundCorner" || process.kind === "quarterRound") && unitCost !== null) {
      const discountKey = roundCornerDiscountKey(process, materialRef);
      const previousCountPerBoard = roundCornerCounts.get(discountKey) ?? 0;
      roundCornerCounts.set(discountKey, previousCountPerBoard + processQuantityPerBoard);

      const fullPriceQuantityPerBoard = previousCountPerBoard === 0 ? 1 : 0;
      const discountedQuantityPerBoard = processQuantityPerBoard - fullPriceQuantityPerBoard;
      const rows: PanelProcessResult[] = [];

      if (fullPriceQuantityPerBoard > 0) {
        const quantity = fullPriceQuantityPerBoard * parentQuantity;
        const totalUnitCost = unitCost + sharpCornerCost;
        rows.push({
          id: `${parentId}-special-${process.id}`,
          label,
          quantity,
          unitCost: totalUnitCost,
          cost: totalUnitCost * quantity,
          includedInSubtotal: true,
        });
      }

      if (discountedQuantityPerBoard > 0) {
        const quantity = discountedQuantityPerBoard * parentQuantity;
        const discountedUnitCost = Math.max(0, unitCost - 100);
        const totalUnitCost = discountedUnitCost + sharpCornerCost;
        rows.push({
          id: `${parentId}-special-${process.id}-discount`,
          label,
          quantity,
          unitCost: totalUnitCost,
          cost: totalUnitCost * quantity,
          includedInSubtotal: true,
        });
      }

      return rows;
    }

    const quantity = processQuantityPerBoard * parentQuantity;
    const totalUnitCost = (unitCost ?? 0) + sharpCornerCost;
    return {
      id: `${parentId}-special-${process.id}`,
      label,
      quantity,
      unitCost: totalUnitCost,
      cost: totalUnitCost * quantity,
      includedInSubtotal: true,
    };
  });
}

function calcPanelSubtotal(area: AreaMeasure, materialRef: MaterialRef | null): number {
  if (!materialRef) return 0;
  if (materialRef.unit === "才") {
    return round(area.cai * materialRef.pricePerUnit, UNIT_CONFIG.COST_DECIMAL_PLACES);
  }
  if (materialRef.unit === "m²") {
    return round(area.m2 * materialRef.pricePerUnit, UNIT_CONFIG.COST_DECIMAL_PLACES);
  }
  return 0;
}

function applyGroupedMinimumCai(rows: PanelResult[]): PanelResult[] {
  const groups = new Map<string, PanelResult[]>();

  for (const row of rows) {
    if (!row.materialRef?.minCai || row.materialRef.unit !== "才") continue;
    const existing = groups.get(row.materialRef.materialId) ?? [];
    existing.push(row);
    groups.set(row.materialRef.materialId, existing);
  }

  for (const groupRows of groups.values()) {
    const materialRef = groupRows[0]?.materialRef;
    const minCai = materialRef?.minCai ?? null;
    if (!materialRef || !minCai) continue;

    const actualCai = groupRows.reduce((sum, row) => sum + row.totalArea.cai, 0);
    const billableCai = Math.max(actualCai, minCai);
    const extraCai = billableCai - actualCai;
    if (extraCai <= 0) continue;

    const firstRow = groupRows[0];
    firstRow.billableTotalArea = toAreaMeasureFromCai(firstRow.totalArea.cai + extraCai);
    firstRow.subtotal = round(firstRow.subtotal + extraCai * materialRef.pricePerUnit, UNIT_CONFIG.COST_DECIMAL_PLACES);
  }

  return rows;
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
  extraAddonCost?: number;
  lightGrooveCost?: number;
  billableMinCai?: number | null;
  processes?: PanelProcessResult[];
  note?: string;
}): PanelResult {
  const {
    id,
    name,
    widthCm,
    heightCm,
    quantity,
    materialRef,
    isAutoGenerated,
    addonPricePerCai = 0,
    extraAddonCost = 0,
    lightGrooveCost = 0,
    billableMinCai,
    processes = [],
    note,
  } = params;
  const singleCm2 = widthCm * heightCm;
  const singleArea = toAreaMeasure(singleCm2);
  const totalArea = toAreaMeasure(singleCm2 * quantity);
  const minCai = billableMinCai === undefined ? materialRef?.minCai ?? null : billableMinCai;
  const billableTotalArea = toBillableAreaMeasure(singleCm2, minCai, quantity);
  let subtotal = calcPanelSubtotal(billableTotalArea, materialRef);
  let addonsCost = 0;

  if (materialRef?.unit === "才" && addonPricePerCai > 0) {
    addonsCost = round(billableTotalArea.cai * addonPricePerCai, UNIT_CONFIG.COST_DECIMAL_PLACES);
    subtotal += addonsCost;
  }
  if (extraAddonCost > 0) {
    addonsCost += extraAddonCost;
    subtotal += extraAddonCost;
  }

  return {
    id,
    name,
    widthCm,
    heightCm,
    quantity,
    singleArea,
    totalArea,
    billableTotalArea,
    materialRef,
    unitCost: materialRef?.pricePerUnit ?? 0,
    subtotal,
    addonsCost,
    lightGrooveCost,
    processes,
    isAutoGenerated,
    note,
  };
}

function generateFixedPanels(input: CabinetUnitInput, unitQty: number): PanelResult[] {
  const { id, widthCm, depthCm, heightCm, backPanelMaterialRef, hasBackPanel, addons } = input;
  const materials = bodyPanelMaterialRefs(input);
  const frontEdgeAddon = calcFrontEdgeAddon(addons.frontEdgeABS);
  const sideThicknessCm = materialThicknessCm(materials.side);
  const topThicknessCm = materialThicknessCm(materials.top);
  const joinMode = input.bodyPanelJoinMode ?? "SIDE_COVERS_TOP";
  const topPanelOverhang = {
    ...DEFAULT_UNIT_ADDONS.topPanelOverhang!,
    ...addons.topPanelOverhang,
  };
  const topOverhangLeftCm = topPanelOverhang.leftCm ?? ((topPanelOverhang.leftMm ?? 0) / 10);
  const topOverhangRightCm = topPanelOverhang.rightCm ?? ((topPanelOverhang.rightMm ?? 0) / 10);
  const topOverhangFrontCm = topPanelOverhang.frontCm ?? ((topPanelOverhang.frontMm ?? 0) / 10);
  const topOverhangBackCm = topPanelOverhang.backCm ?? ((topPanelOverhang.backMm ?? 0) / 10);
  const topOverhangWidthCm = joinMode === "TOP_COVERS_SIDES" && topPanelOverhang.enabled
    ? topOverhangLeftCm + topOverhangRightCm
    : 0;
  const topOverhangDepthCm = joinMode === "TOP_COVERS_SIDES" && topPanelOverhang.enabled
    ? topOverhangFrontCm + topOverhangBackCm
    : 0;
  const sidePanelWidthCm = round(
    Math.max(heightCm - (joinMode === "TOP_COVERS_SIDES" ? topThicknessCm : 0), 0),
    UNIT_CONFIG.DIMENSION_DECIMAL_PLACES,
  );
  const topWidthCm = round(
    Math.max((joinMode === "TOP_COVERS_SIDES" ? widthCm : widthCm - sideThicknessCm * 2) + topOverhangWidthCm, 0),
    UNIT_CONFIG.DIMENSION_DECIMAL_PLACES,
  );
  const topDepthCm = round(Math.max(depthCm + topOverhangDepthCm, 0), UNIT_CONFIG.DIMENSION_DECIMAL_PLACES);
  const bottomWidthCm = round(Math.max(widthCm - sideThicknessCm * 2, 0), UNIT_CONFIG.DIMENSION_DECIMAL_PLACES);
  const backPanelWidthCm = insetPanelDimension(widthCm, sideThicknessCm);
  const backPanelHeightCm = insetPanelDimension(backPanelOuterHeight(input), sideThicknessCm);
  const automaticBackPanel = hasAutomaticBackPanel(input);
  const backPanelGrooveNote = automaticBackPanel ? buildBackPanelGrooveNote() : undefined;
  const backPanelGrooveCostPerLine = automaticBackPanel ? UNIT_CONFIG.BACK_PANEL_GROOVE_COST_PER_LINE : 0;
  const panelProcesses = bodyPanelProcesses(addons);
  const topLightGroove = panelProcesses.top.lightGroove;
  const leftLightGroove = panelProcesses.left.lightGroove;
  const rightLightGroove = panelProcesses.right.lightGroove;
  const topLightGrooveCost = topLightGroove.enabled ? calcLightGrooveCost(topWidthCm, unitQty) : 0;
  const leftLightGrooveCost = leftLightGroove.enabled ? calcLightGrooveCost(sidePanelWidthCm, unitQty) : 0;
  const rightLightGrooveCost = rightLightGroove.enabled ? calcLightGrooveCost(sidePanelWidthCm, unitQty) : 0;
  const topLightGrooveNote = topLightGroove.enabled ? lightGrooveNote("上板內側", topLightGroove.offsetFromFrontMm) : undefined;
  const leftLightGrooveNote = leftLightGroove.enabled ? lightGrooveNote("側板內側", leftLightGroove.offsetFromFrontMm) : undefined;
  const rightLightGrooveNote = rightLightGroove.enabled ? lightGrooveNote("側板內側", rightLightGroove.offsetFromFrontMm) : undefined;
  const topSlidingDoorTrackGroove = panelProcesses.top.slidingDoorTrackGroove;
  const bottomSlidingDoorTrackGroove = panelProcesses.bottom.slidingDoorTrackGroove;
  const topSlidingDoorTrackGrooveProcess = topSlidingDoorTrackGroove.enabled
    ? slidingDoorTrackGrooveProcess(`${id}-top-sliding-door-track-groove`, unitQty, topSlidingDoorTrackGroove.trackShape)
    : undefined;
  const bottomSlidingDoorTrackGrooveProcess = bottomSlidingDoorTrackGroove.enabled
    ? slidingDoorTrackGrooveProcess(`${id}-bottom-sliding-door-track-groove`, unitQty, bottomSlidingDoorTrackGroove.trackShape)
    : undefined;
  const topSlidingDoorTrackGrooveCost = topSlidingDoorTrackGrooveProcess?.cost ?? 0;
  const bottomSlidingDoorTrackGrooveCost = bottomSlidingDoorTrackGrooveProcess?.cost ?? 0;
  const topSlidingDoorTrackGrooveNote = topSlidingDoorTrackGrooveProcess?.label;
  const bottomSlidingDoorTrackGrooveNote = bottomSlidingDoorTrackGrooveProcess?.label;
  const lTurnCabinet = addons.lTurnCabinet;
  const lTurnCabinetTopProcess = lTurnCabinet?.enabled
    ? lTurnCabinetProcess(
        `${id}-l-turn-cabinet`,
        unitQty,
        lTurnCabinet.position,
        lTurnCabinet.widthMm,
        lTurnCabinet.heightMm,
        false,
      )
    : undefined;
  const lTurnCabinetNote = lTurnCabinetTopProcess?.label;
  const lTurnCabinetBottomProcess = lTurnCabinet?.enabled
    ? lTurnCabinetProcess(
        `${id}-l-turn-cabinet-bottom`,
        unitQty,
        lTurnCabinet.position,
        lTurnCabinet.widthMm,
        lTurnCabinet.heightMm,
        false,
      )
    : undefined;
  const leftSideSealProcesses = sideSealBendingProcesses(`${id}-left`, "左側", sidePanelWidthCm, panelProcesses.left.sideSealBending, unitQty);
  const rightSideSealProcesses = sideSealBendingProcesses(`${id}-right`, "右側", sidePanelWidthCm, panelProcesses.right.sideSealBending, unitQty);
  const leftSideSealCost = leftSideSealProcesses.reduce((sum, process) => sum + process.cost, 0);
  const rightSideSealCost = rightSideSealProcesses.reduce((sum, process) => sum + process.cost, 0);
  const leftFrontEdgeProcess = frontEdgeABSProcess(`${id}-left`, sidePanelWidthCm, depthCm, unitQty, materials.side, panelProcesses.left.frontEdgeABS);
  const rightFrontEdgeProcess = frontEdgeABSProcess(`${id}-right`, sidePanelWidthCm, depthCm, unitQty, materials.side, panelProcesses.right.frontEdgeABS);
  const topFrontEdgeProcess = frontEdgeABSProcess(`${id}-top`, topWidthCm, topDepthCm, unitQty, materials.top, panelProcesses.top.frontEdgeABS);
  const bottomFrontEdgeProcess = frontEdgeABSProcess(`${id}-bottom`, bottomWidthCm, depthCm, unitQty, materials.bottom, panelProcesses.bottom.frontEdgeABS);
  const leftSidePanelInset = addons.sidePanelInset?.enabled ? sidePanelInsetProcess(`${id}-left`, unitQty) : undefined;
  const rightSidePanelInset = addons.sidePanelInset?.enabled ? sidePanelInsetProcess(`${id}-right`, unitQty, false) : undefined;
  const topHardwareProcesses = [
    quantityProcess(`${id}-top-bookcase-guide-wheel-hole`, "活動書櫃導輪孔", panelProcesses.top.bookcaseGuideWheelHole, unitQty, UNIT_CONFIG.BOOKCASE_GUIDE_WHEEL_HOLE_COST),
  ].filter((process): process is PanelProcessResult => Boolean(process));
  const bottomHardwareProcesses = [
    quantityProcess(`${id}-bottom-small-adjustable-foot-hole`, "小調整腳孔", panelProcesses.bottom.smallAdjustableFootHole, unitQty, UNIT_CONFIG.SMALL_ADJUSTABLE_FOOT_HOLE_COST),
    quantityProcess(`${id}-bottom-light-st-wheel-hole`, "輕型 ST 輪孔", panelProcesses.bottom.lightStWheelHole, unitQty, UNIT_CONFIG.LIGHT_ST_WHEEL_HOLE_COST),
    quantityProcess(`${id}-bottom-heavy-st-wheel-hole`, "重型 ST 輪孔", panelProcesses.bottom.heavyStWheelHole, unitQty, UNIT_CONFIG.HEAVY_ST_WHEEL_HOLE_COST),
    quantityProcess(`${id}-bottom-bookcase-guide-wheel-hole`, "活動書櫃導輪孔", panelProcesses.bottom.bookcaseGuideWheelHole, unitQty, UNIT_CONFIG.BOOKCASE_GUIDE_WHEEL_HOLE_COST),
  ].filter((process): process is PanelProcessResult => Boolean(process));
  const leftHardwareProcesses = [
    quantityProcess(`${id}-left-hidden-return-slide-rail`, "隱藏式回歸滑軌加工", panelProcesses.left.hiddenReturnSlideRail, unitQty, UNIT_CONFIG.HIDDEN_RETURN_SLIDE_RAIL_PROCESS_COST),
    quantityProcess(`${id}-left-special-u-glass-pivot`, "特殊 U 型玻璃抽加工", panelProcesses.left.specialUGlassPivot, unitQty, UNIT_CONFIG.SPECIAL_U_GLASS_PIVOT_PROCESS_COST),
    quantityProcess(`${id}-left-t-rail-bed-set`, "T螺床組加工", panelProcesses.left.tRailBedSet, unitQty, UNIT_CONFIG.T_RAIL_BED_SET_PROCESS_COST),
  ].filter((process): process is PanelProcessResult => Boolean(process));
  const rightHardwareProcesses = [
    quantityProcess(`${id}-right-hidden-return-slide-rail`, "隱藏式回歸滑軌加工", panelProcesses.right.hiddenReturnSlideRail, unitQty, UNIT_CONFIG.HIDDEN_RETURN_SLIDE_RAIL_PROCESS_COST),
    quantityProcess(`${id}-right-special-u-glass-pivot`, "特殊 U 型玻璃抽加工", panelProcesses.right.specialUGlassPivot, unitQty, UNIT_CONFIG.SPECIAL_U_GLASS_PIVOT_PROCESS_COST),
    quantityProcess(`${id}-right-t-rail-bed-set`, "T螺床組加工", panelProcesses.right.tRailBedSet, unitQty, UNIT_CONFIG.T_RAIL_BED_SET_PROCESS_COST),
  ].filter((process): process is PanelProcessResult => Boolean(process));
  const leftFrontEdgeCost = leftFrontEdgeProcess?.cost ?? 0;
  const rightFrontEdgeCost = rightFrontEdgeProcess?.cost ?? 0;
  const topFrontEdgeCost = topFrontEdgeProcess?.cost ?? 0;
  const bottomFrontEdgeCost = bottomFrontEdgeProcess?.cost ?? 0;
  const sidePanelInsetCost = leftSidePanelInset?.cost ?? 0;
  const topHardwareCost = topHardwareProcesses.reduce((sum, process) => sum + process.cost, 0);
  const bottomHardwareCost = bottomHardwareProcesses.reduce((sum, process) => sum + process.cost, 0);
  const leftHardwareCost = leftHardwareProcesses.reduce((sum, process) => sum + process.cost, 0);
  const rightHardwareCost = rightHardwareProcesses.reduce((sum, process) => sum + process.cost, 0);

  const panels: PanelResult[] = [
    buildPanelResult({ id: `${id}-left`, name: "左側板", widthCm: sidePanelWidthCm, heightCm: depthCm, quantity: unitQty, materialRef: materials.side, isAutoGenerated: true, extraAddonCost: leftFrontEdgeCost + leftLightGrooveCost + leftSideSealCost + sidePanelInsetCost + leftHardwareCost, lightGrooveCost: leftLightGrooveCost, note: joinNotes(backPanelGrooveNote, leftLightGrooveNote), processes: [
      ...(backPanelGrooveNote ? [panelProcess(`${id}-left-back-groove`, backPanelGrooveNote, backPanelGrooveCostPerLine, false)] : []),
      ...(leftFrontEdgeProcess ? [leftFrontEdgeProcess] : []),
      ...(leftSidePanelInset ? [leftSidePanelInset] : []),
      ...(leftLightGrooveNote ? [lightGrooveProcess(`${id}-left-light-groove`, leftLightGrooveNote, sidePanelWidthCm, unitQty)] : []),
      ...leftSideSealProcesses,
      ...leftHardwareProcesses,
    ] }),
    buildPanelResult({ id: `${id}-right`, name: "右側板", widthCm: sidePanelWidthCm, heightCm: depthCm, quantity: unitQty, materialRef: materials.side, isAutoGenerated: true, extraAddonCost: rightFrontEdgeCost + rightLightGrooveCost + rightSideSealCost + rightHardwareCost, lightGrooveCost: rightLightGrooveCost, note: joinNotes(backPanelGrooveNote, rightLightGrooveNote), processes: [
      ...(backPanelGrooveNote ? [panelProcess(`${id}-right-back-groove`, backPanelGrooveNote, backPanelGrooveCostPerLine, false)] : []),
      ...(rightFrontEdgeProcess ? [rightFrontEdgeProcess] : []),
      ...(rightSidePanelInset ? [rightSidePanelInset] : []),
      ...(rightLightGrooveNote ? [lightGrooveProcess(`${id}-right-light-groove`, rightLightGrooveNote, sidePanelWidthCm, unitQty)] : []),
      ...rightSideSealProcesses,
      ...rightHardwareProcesses,
    ] }),
    buildPanelResult({ id: `${id}-top`, name: "頂板", widthCm: topWidthCm, heightCm: topDepthCm, quantity: unitQty, materialRef: materials.top, isAutoGenerated: true, extraAddonCost: topFrontEdgeCost + topLightGrooveCost + topSlidingDoorTrackGrooveCost + topHardwareCost, lightGrooveCost: topLightGrooveCost, note: joinNotes(backPanelGrooveNote, topLightGrooveNote, topSlidingDoorTrackGrooveNote, lTurnCabinetNote), processes: [
      ...(backPanelGrooveNote ? [panelProcess(`${id}-top-back-groove`, backPanelGrooveNote, backPanelGrooveCostPerLine, false)] : []),
      ...(topFrontEdgeProcess ? [topFrontEdgeProcess] : []),
      ...(topLightGrooveNote ? [lightGrooveProcess(`${id}-top-light-groove`, topLightGrooveNote, topWidthCm, unitQty)] : []),
      ...(topSlidingDoorTrackGrooveProcess ? [topSlidingDoorTrackGrooveProcess] : []),
      ...topHardwareProcesses,
      ...(lTurnCabinetTopProcess ? [lTurnCabinetTopProcess] : []),
    ] }),
    buildPanelResult({ id: `${id}-bottom`, name: "底板", widthCm: bottomWidthCm, heightCm: depthCm, quantity: unitQty, materialRef: materials.bottom, isAutoGenerated: true, extraAddonCost: bottomFrontEdgeCost + bottomSlidingDoorTrackGrooveCost + bottomHardwareCost, note: joinNotes(backPanelGrooveNote, bottomSlidingDoorTrackGrooveNote, lTurnCabinetNote), processes: [
      ...(backPanelGrooveNote ? [panelProcess(`${id}-bottom-back-groove`, backPanelGrooveNote, backPanelGrooveCostPerLine, false)] : []),
      ...(bottomFrontEdgeProcess ? [bottomFrontEdgeProcess] : []),
      ...(bottomSlidingDoorTrackGrooveProcess ? [bottomSlidingDoorTrackGrooveProcess] : []),
      ...bottomHardwareProcesses,
      ...(lTurnCabinetBottomProcess ? [lTurnCabinetBottomProcess] : []),
    ] }),
  ];

  if (hasBackPanel) {
    const manualBackPanel = input.manualBackPanel;
    const useManualBackPanel = !automaticBackPanel && manualBackPanel;
    panels.push(
      buildPanelResult({
        id: `${id}-back`,
        name: automaticBackPanel ? "8mm背板" : "18mm背板",
        widthCm: useManualBackPanel ? manualBackPanel.widthCm : backPanelWidthCm,
        heightCm: useManualBackPanel ? manualBackPanel.heightCm : backPanelHeightCm,
        quantity: (useManualBackPanel ? manualBackPanel.quantity : 1) * unitQty,
        materialRef: backPanelMaterialRef,
        isAutoGenerated: automaticBackPanel,
      })
    );
  }

  if (addons.lTurnCabinet?.enabled) {
    const lTurnPanels = lTurnCabinetPanels(input, unitQty);
    const normalPanelIds = new Set([
      `${id}-left`,
      `${id}-right`,
      ...(automaticBackPanel ? [`${id}-back`] : []),
    ]);
    const panelsToKeep = panels.filter((panel) => !normalPanelIds.has(panel.id));
    panels.splice(0, panels.length, ...panelsToKeep, ...lTurnPanels);
  }

  if (input.kickPlate && addons.lTurnCabinet?.enabled) {
    panels.push(...lTurnCabinetKickPlatePanels(input, unitQty, frontEdgeAddon));
  }

  if (input.kickPlate && !addons.lTurnCabinet?.enabled) {
    panels.push(
      buildPanelResult({
        id: `${id}-kickplate`,
        name: "踢腳板",
        widthCm: bottomWidthCm,
        heightCm: input.kickPlate.heightCm,
        quantity: unitQty,
        materialRef: materials.side,
        isAutoGenerated: true,
        addonPricePerCai: frontEdgeAddon,
      }),
    );
  }

  for (const manualKickPlate of input.manualKickPlates ?? []) {
    panels.push(
      buildPanelResult({
        id: manualKickPlate.id,
        name: manualKickPlate.name,
        widthCm: manualKickPlate.widthCm,
        heightCm: manualKickPlate.heightCm,
        quantity: manualKickPlate.quantity * unitQty,
        materialRef: materials.side,
        isAutoGenerated: false,
        addonPricePerCai: frontEdgeAddon,
      }),
    );
  }

  for (const sealPanel of input.sideTopBottomSealPanels ?? []) {
    panels.push(
      buildPanelResult({
        id: sealPanel.id,
        name: sealPanel.name || "側/頂/底封板",
        widthCm: sealPanel.widthCm,
        heightCm: sealPanel.heightCm,
        quantity: sealPanel.quantity * unitQty,
        materialRef: sealPanel.materialRef,
        isAutoGenerated: true,
        addonPricePerCai: frontEdgeAddon,
      }),
    );
  }

  return panels;
}

function generateInternalParts(input: CabinetUnitInput, unitQty: number): PanelResult[] {
  const parts: PanelResult[] = [];
  const drawerParts: PanelResult[] = [];
  const frontEdgeAddon = calcFrontEdgeAddon(input.addons.frontEdgeABS);
  const autoDrawerDividerHeightCm = internalFullHeightCm(input);
  const autoFullDepthCm = internalFullDepthCm(input);
  const bodyMaterials = bodyPanelMaterialRefs(input);
  const panelProcesses = bodyPanelProcesses(input.addons);
  const sideSealBending = {
    left: panelProcesses.left.sideSealBending,
    right: panelProcesses.right.sideSealBending,
  };

  ([
    ["left", "左側"] as const,
    ["right", "右側"] as const,
  ]).forEach(([side, sideLabel]) => {
    const option = sideSealBending?.[side];
    if (!option?.enabled || !option.isDrawerCabinet) return;

    parts.push(buildPanelResult({
      id: `${input.id}-${side}-drawer-divider`,
      name: `${sideLabel}抽屜櫃補中立板`,
      widthCm: autoDrawerDividerHeightCm,
      heightCm: option.drawerDividerDepthCm ?? 55,
      quantity: unitQty,
      materialRef: bodyMaterials.side,
      isAutoGenerated: true,
      addonPricePerCai: frontEdgeAddon,
    }));
  });

  for (const d of input.middleDividers) {
    const dividerWidthCm = d.fullWidth ? autoFullDepthCm : d.widthCm;
    const dividerHeightCm = d.fullHeight ? autoDrawerDividerHeightCm : d.heightCm;
    const dividerLightGroove = d.addons?.lightGroove;
    const dividerLightGrooveCost = dividerLightGroove && dividerLightGroove.side !== "none"
      ? calcLightGrooveCost(dividerHeightCm, d.quantity * unitQty)
      : 0;
    const dividerLightGrooveNote = dividerLightGroove && dividerLightGroove.side !== "none"
      ? lightGrooveNote(dividerLightGroove.side === "left" ? "左側" : "右側", dividerLightGroove.offsetFromFrontMm)
      : undefined;
    const dividerQuantity = d.quantity * unitQty;
    const dividerHoleProcesses = middleDividerHoleProcesses(d.id, dividerWidthCm, dividerHeightCm, dividerQuantity, d.materialRef, d.addons);
    const dividerHoleCost = dividerHoleProcesses.reduce((sum, process) => sum + process.cost, 0);
    const dividerHardwareProcesses = [
      quantityProcess(`${d.id}-hidden-return-slide-rail`, "隱藏式回歸滑軌加工", d.addons?.hiddenReturnSlideRail, dividerQuantity, UNIT_CONFIG.HIDDEN_RETURN_SLIDE_RAIL_PROCESS_COST),
    ].filter((process): process is PanelProcessResult => Boolean(process));
    const dividerHardwareCost = dividerHardwareProcesses.reduce((sum, process) => sum + process.cost, 0);
    const dividerSpecialProcesses = specialProcesses(d.id, d.materialRef, dividerQuantity, d.specialProcesses);
    const dividerSpecialCost = dividerSpecialProcesses.reduce((sum, process) => sum + process.cost, 0);
    parts.push(buildPanelResult({
      id: d.id,
      name: "中立板",
      widthCm: dividerWidthCm,
      heightCm: dividerHeightCm,
      quantity: dividerQuantity,
      materialRef: d.materialRef,
      isAutoGenerated: false,
      addonPricePerCai: frontEdgeAddon,
      extraAddonCost: dividerLightGrooveCost + dividerSpecialCost + dividerHoleCost + dividerHardwareCost,
      lightGrooveCost: dividerLightGrooveCost,
      note: dividerLightGrooveNote,
      processes: [
        ...dividerHoleProcesses,
        ...(dividerLightGrooveNote
          ? [lightGrooveProcess(`${d.id}-light-groove`, dividerLightGrooveNote, dividerHeightCm, dividerQuantity)]
          : []),
        ...dividerHardwareProcesses,
        ...dividerSpecialProcesses,
      ],
    }));
  }

  for (const s of input.shelves) {
    const shelfDepthCm = s.fullDepth ? autoFullDepthCm : s.depthCm;
    const shelfLightGroove = s.lightGroove;
    const shelfLightGrooveCost = shelfLightGroove && shelfLightGroove.side !== "none"
      ? calcLightGrooveCost(s.widthCm, s.quantity * unitQty)
      : 0;
    const shelfLightGrooveNote = shelfLightGroove && shelfLightGroove.side !== "none"
      ? lightGrooveNote(shelfLightGroove.side === "top" ? "上面" : "下面", shelfLightGroove.offsetFromFrontMm)
      : undefined;
    const shelfQuantity = s.quantity * unitQty;
    const shelfSpecialProcesses = specialProcesses(s.id, s.materialRef, shelfQuantity, s.specialProcesses);
    const shelfSpecialCost = shelfSpecialProcesses.reduce((sum, process) => sum + process.cost, 0);
    const shelfHardwareProcesses = [
      quantityProcess(`${s.id}-hidden-shelf-screw-hole`, "隱藏式層板螺絲孔", s.hardwareProcesses?.hiddenShelfScrewHole, shelfQuantity, UNIT_CONFIG.HIDDEN_SHELF_SCREW_HOLE_COST),
      quantityProcess(`${s.id}-heavy-hidden-shelf-screw-hole`, "重型隱藏式層板螺絲孔", s.hardwareProcesses?.heavyHiddenShelfScrewHole, shelfQuantity, UNIT_CONFIG.HEAVY_HIDDEN_SHELF_SCREW_HOLE_COST),
    ].filter((process): process is PanelProcessResult => Boolean(process));
    const shelfHardwareCost = shelfHardwareProcesses.reduce((sum, process) => sum + process.cost, 0);
    parts.push(buildPanelResult({
      id: s.id,
      name: "櫃內層板",
      widthCm: s.widthCm,
      heightCm: shelfDepthCm,
      quantity: shelfQuantity,
      materialRef: s.materialRef,
      isAutoGenerated: false,
      addonPricePerCai: frontEdgeAddon,
      extraAddonCost: shelfLightGrooveCost + shelfSpecialCost + shelfHardwareCost,
      lightGrooveCost: shelfLightGrooveCost,
      note: shelfLightGrooveNote,
      processes: [
        ...(shelfLightGrooveNote
          ? [lightGrooveProcess(`${s.id}-light-groove`, shelfLightGrooveNote, s.widthCm, shelfQuantity)]
          : []),
        ...shelfHardwareProcesses,
        ...shelfSpecialProcesses,
      ],
    }));
  }

  for (const drawer of input.drawers ?? []) {
    const drawerLabel = drawer.name.trim() || "\u62bd\u5c5c";
    const quantity = drawer.quantity * unitQty;
    const drawerWallThicknessCm = materialThicknessCm(drawer.wallMaterialRef ?? bodyMaterials.side);
    const wallHeightCm = drawer.heightCm - 7;
    const frontBackWidthCm = drawer.widthCm - 10.2;
    const bottomWidthCm = drawerBottomDimension(drawer.widthCm, drawerWallThicknessCm);
    const bottomDepthCm = drawerBottomDimension(drawer.railLengthCm, drawerWallThicknessCm);
    const grooveNote = drawerGrooveNote();
    const sideGrooveQuantity = quantity * 2;
    const frontBackGrooveQuantity = quantity * 2;
    const sideGrooveCost = sideGrooveQuantity * UNIT_CONFIG.DRAWER_GROOVE_COST_PER_PANEL;
    const frontBackGrooveCost = frontBackGrooveQuantity * UNIT_CONFIG.DRAWER_GROOVE_COST_PER_PANEL;
    const frontProcesses = drawerFrontProcesses(drawer, quantity);
    const frontProcessCost = frontProcesses.reduce((sum, process) => sum + process.cost, 0);
    const bodyKdProcess = drawer.bodyKdProcessing ? drawerBodyKdProcess(drawer.id, quantity) : undefined;
    const bodyKdCost = bodyKdProcess?.cost ?? 0;

    drawerParts.push(buildPanelResult({
      id: `${drawer.id}-front-panel`,
      name: `${drawerLabel}-\u62bd\u5c5c\u9762\u677f/\u62bd\u982d`,
      widthCm: drawer.widthCm,
      heightCm: drawer.heightCm,
      quantity,
      materialRef: drawer.wallMaterialRef ?? bodyMaterials.side,
      isAutoGenerated: true,
      addonPricePerCai: frontEdgeAddon,
      extraAddonCost: frontProcessCost,
      processes: frontProcesses,
      billableMinCai: null,
    }));

    drawerParts.push(buildPanelResult({
      id: `${drawer.id}-side-panels`,
      name: `${drawerLabel}-\u62bd\u5c5c\u5de6\u53f3\u5074\u677f`,
      widthCm: drawer.railLengthCm,
      heightCm: wallHeightCm,
      quantity: quantity * 2,
      materialRef: drawer.wallMaterialRef,
      isAutoGenerated: true,
      addonPricePerCai: frontEdgeAddon,
      extraAddonCost: sideGrooveCost + bodyKdCost,
      billableMinCai: null,
      note: grooveNote,
      processes: [
        ...(bodyKdProcess ? [bodyKdProcess] : []),
        panelProcess(
          `${drawer.id}-side-panels-groove`,
          grooveNote,
          sideGrooveCost,
          true,
          sideGrooveQuantity,
          UNIT_CONFIG.DRAWER_GROOVE_COST_PER_PANEL,
        ),
      ],
    }));

    drawerParts.push(buildPanelResult({
      id: `${drawer.id}-front-back-panels`,
      name: `${drawerLabel}-\u62bd\u5c5c\u524d\u5f8c\u7246\u677f`,
      widthCm: frontBackWidthCm,
      heightCm: wallHeightCm,
      quantity: quantity * 2,
      materialRef: drawer.wallMaterialRef,
      isAutoGenerated: true,
      addonPricePerCai: frontEdgeAddon,
      extraAddonCost: frontBackGrooveCost,
      billableMinCai: null,
      note: grooveNote,
      processes: [
        panelProcess(
          `${drawer.id}-front-back-panels-groove`,
          grooveNote,
          frontBackGrooveCost,
          true,
          frontBackGrooveQuantity,
          UNIT_CONFIG.DRAWER_GROOVE_COST_PER_PANEL,
        ),
      ],
    }));

    drawerParts.push(buildPanelResult({
      id: `${drawer.id}-bottom-panel`,
      name: `${drawerLabel}-\u62bd\u5c5c8mm\u5e95\u677f`,
      widthCm: bottomWidthCm,
      heightCm: bottomDepthCm,
      quantity,
      materialRef: drawer.bottomMaterialRef,
      isAutoGenerated: true,
      billableMinCai: null,
    }));
  }

  parts.push(...applyGroupedMinimumCai(drawerParts));

  return parts;
}

function calculateDrawerHardware(input: CabinetUnitInput, unitQty: number): HardwareResult[] {
  return (input.drawers ?? []).filter((drawer) => drawer.includeRailInQuote ?? true).map((drawer) => {
    const quantity = drawer.quantity * unitQty;
    const railRef = drawer.railMaterialRef ?? null;
    return {
      id: `${drawer.id}-rail`,
      name: "抽屜滑軌",
      description: `${drawer.name || "抽屜"} ${drawer.widthCm}×${drawer.depthCm}cm × ${quantity}`,
      quantity,
      materialRef: railRef,
      unitCost: railRef?.pricePerUnit ?? 0,
      subtotal: railRef ? round(quantity * railRef.pricePerUnit, UNIT_CONFIG.COST_DECIMAL_PLACES) : 0,
    };
  });
}

function materialLineSubtotal(quantity: number, materialRef: MaterialRef | null): number {
  return materialRef ? round(quantity * materialRef.pricePerUnit, UNIT_CONFIG.COST_DECIMAL_PLACES) : 0;
}

function calculateExtraHardware(items: HardwareItemInput[] | undefined, unitQty: number): HardwareResult[] {
  return (items ?? []).map((item) => {
    const quantity = item.quantity * unitQty;
    const materialRef = item.materialRef ?? null;
    return {
      id: `${item.id}-hardware`,
      name: item.name || materialRef?.materialName || "五金/另料",
      description: materialRef?.materialName ?? "",
      quantity,
      materialRef,
      unitCost: materialRef?.pricePerUnit ?? 0,
      subtotal: materialLineSubtotal(quantity, materialRef),
    };
  });
}

function calculateStandaloneProcessRows(input: CabinetUnitInput, unitQty: number): HardwareResult[] {
  const lTurnCabinet = input.addons.lTurnCabinet;
  if (!lTurnCabinet?.enabled) return [];
  if (lTurnCabinet.widthMm + lTurnCabinet.heightMm > UNIT_CONFIG.L_TURN_CABINET_MAX_DIMENSION_SUM_MM) return [];

  const unitCost = UNIT_CONFIG.L_TURN_CABINET_PROCESS_COST;
  return [
    {
      id: `${input.id}-l-turn-cabinet-fee`,
      name: "L轉櫃加工費",
      description: `L轉櫃加工: ${lTurnCabinetPositionLabel(lTurnCabinet.position)}, W=${lTurnCabinet.widthMm}mm, H=${lTurnCabinet.heightMm}mm`,
      quantity: unitQty,
      materialRef: null,
      unitCost,
      subtotal: unitCost * unitQty,
    },
  ];
}

function profileHandleRule(style: ProfileHandleStyle) {
  return style in PROFILE_HANDLE_PROCESSING_RULES
    ? PROFILE_HANDLE_PROCESSING_RULES[style as keyof typeof PROFILE_HANDLE_PROCESSING_RULES]
    : null;
}

function profileHandleLengthMm(lengthCm: number): number {
  return Math.max(round(lengthCm * 10, 0), 1);
}

function profileHandleTierPrice(style: ProfileHandleStyle, lengthCm: number): number | null {
  const rule = profileHandleRule(style);
  if (!rule) return null;

  const lengthMm = profileHandleLengthMm(lengthCm);
  return rule.tiers.find((tier) => lengthMm <= tier.maxMm)?.price ?? null;
}

function profileHandleLabel(style: ProfileHandleStyle): string {
  return profileHandleRule(style)?.label ?? style;
}

function profileHandleBakedPaintSurcharge(style: ProfileHandleStyle, lengthCm: number): number | null {
  if (style !== "Y1A" && style !== "U1A" && style !== "V1A") return null;
  return profileHandleLengthMm(lengthCm) <= PROFILE_HANDLE_BAKED_PAINT_SURCHARGE.MAX_SHORT_MM
    ? PROFILE_HANDLE_BAKED_PAINT_SURCHARGE.SHORT
    : PROFILE_HANDLE_BAKED_PAINT_SURCHARGE.LONG;
}

function drawerFrontProcesses(drawer: DrawerInput, quantity: number): PanelProcessResult[] {
  const processes: PanelProcessResult[] = [];
  const frontMoldRadius = drawer.frontMoldRadius ?? (drawer.frontMoldProcessing ? "R80" : "none");

  if (frontMoldRadius !== "none") {
    const cornerCount = Math.max(drawer.frontMoldCornerCount ?? DRAWER_FRONT_MOLD_CORNER_PRICING.BASE_CORNERS, 0);
    const extraCornerCount = Math.max(cornerCount - DRAWER_FRONT_MOLD_CORNER_PRICING.BASE_CORNERS, 0);
    const moldPrice =
      DRAWER_FRONT_MOLD_PROCESSING_PRICES[frontMoldRadius].price18_25mm +
      extraCornerCount * DRAWER_FRONT_MOLD_CORNER_PRICING.EXTRA_CORNER_COST;
    processes.push(panelProcess(
      `${drawer.id}-front-mold-processing`,
      `抽頭合廠模造型加工 ${frontMoldRadius} (單板${cornerCount}個R角)`,
      moldPrice * quantity,
      true,
      quantity,
      moldPrice,
    ));
  }

  const frontHandle = drawer.frontHandle;
  if (frontHandle && frontHandle.style !== "none") {
    const price = profileHandleTierPrice(frontHandle.style, frontHandle.lengthCm);
    if (price !== null) {
      processes.push(panelProcess(
        `${drawer.id}-front-handle-processing`,
        `抽頭把手加工 ${profileHandleLabel(frontHandle.style)}`,
        price * quantity,
        true,
        quantity,
        price,
      ));
    } else {
      const billableLengthCm = Math.max(
        frontHandle.lengthCm,
        ADDON_PRICES.PROFILE_HANDLE_MIN_LENGTH_CM,
      );
      const unitCost = ADDON_PRICES.PROFILE_HANDLE_PER_CM;
      processes.push(panelProcess(
        `${drawer.id}-front-handle-processing`,
        `\u62bd\u982d\u628a\u624b\u52a0\u5de5 ${frontHandle.style}`,
        billableLengthCm * quantity * unitCost,
        true,
        billableLengthCm * quantity,
        unitCost,
      ));
    }

    if (frontHandle.bakedPaint) {
      const surcharge = profileHandleBakedPaintSurcharge(frontHandle.style, frontHandle.lengthCm);
      if (surcharge !== null) {
        processes.push(panelProcess(
          `${drawer.id}-front-handle-baked-paint`,
          "抽頭鋁片烤漆費用加價",
          surcharge * quantity,
          true,
          quantity,
          surcharge,
        ));
      }
    }
  }

  return processes;
}

function calculateDoors(
  input: CabinetUnitInput,
  unitQty: number
): { doors: DoorResult[]; hardware: HardwareResult[]; addonsBreakdown: Pick<AddonsBreakdown, "patternMatch" | "temperedGlass" | "hingeHoleDrilling"> } {
  const doors: DoorResult[] = [];
  const hardware: HardwareResult[] = [];
  let patternMatch = 0;
  let temperedGlass = 0;
  let hingeHoleDrilling = 0;

  for (const door of input.doors) {
    const doorAddons = {
      ...DEFAULT_DOOR_ADDONS,
      ...door.addons,
      profileHandle: {
        ...DEFAULT_DOOR_ADDONS.profileHandle,
        ...door.addons?.profileHandle,
      },
    };
    const totalQty = door.quantity * unitQty;
    const singleCm2 = door.widthCm * door.heightCm;
    const singleArea = toAreaMeasure(singleCm2);
    const totalArea = toAreaMeasure(singleCm2 * totalQty);
    const billableTotalArea = toBillableAreaMeasure(singleCm2, door.materialRef?.minCai ?? null, totalQty);
    const doorHardwareItems = door.hardwareItems ?? [];
    const hingeHoleQuantity = doorHardwareItems
      .filter((item) => item.includeHingeHoleDrilling)
      .reduce((sum, item) => sum + item.quantityPerDoor * totalQty, 0);

    const patternMultiplier = doorAddons.patternMatch === "grain" ? ADDON_PRICES.PATTERN_MATCH_GRAIN : 1;
    const basePrice = door.materialRef?.pricePerUnit ?? 0;
    const baseCost = door.materialRef?.unit === "才"
      ? round(billableTotalArea.cai * basePrice * patternMultiplier, UNIT_CONFIG.COST_DECIMAL_PLACES)
      : calcPanelSubtotal(billableTotalArea, door.materialRef);
    const patternCost = door.materialRef?.unit === "才"
      ? round(billableTotalArea.cai * basePrice * (patternMultiplier - 1), UNIT_CONFIG.COST_DECIMAL_PLACES)
      : 0;
    const glassCost = door.materialRef?.unit === "才" && doorAddons.temperedGlass
      ? round(billableTotalArea.cai * ADDON_PRICES.TEMPERED_GLASS, UNIT_CONFIG.COST_DECIMAL_PLACES)
      : 0;
    const hingeHoleCost = hingeHoleQuantity * ADDON_PRICES.HINGE_HOLE_DRILLING;
    const addonsCost = patternCost + glassCost + hingeHoleCost;

    patternMatch += patternCost;
    temperedGlass += glassCost;
    hingeHoleDrilling += hingeHoleCost;

    doors.push({
      id: door.id,
      type: door.type,
      isLouverDoor: door.type === "HINGED" && doorAddons.louverDoor,
      name: door.name || (door.type === "HINGED" ? "鉸鏈門" : "滑門"),
      widthCm: door.widthCm,
      heightCm: door.heightCm,
      quantity: totalQty,
      singleArea,
      totalArea,
      billableTotalArea,
      materialRef: door.materialRef,
      subtotal: baseCost + glassCost + hingeHoleCost,
      addonsCost,
      processes: hingeHoleCost > 0
        ? [
            panelProcess(
              `${door.id}-hinge-hole`,
              "\u9580\u677f\u9278\u93c8\u5b54",
              hingeHoleCost,
              true,
              hingeHoleQuantity,
              ADDON_PRICES.HINGE_HOLE_DRILLING,
            ),
          ]
        : [],
    });

    for (const item of doorHardwareItems) {
      const quantity = item.quantityPerDoor * totalQty;
      const materialRef = item.materialRef ?? null;
      hardware.push({
        id: item.id,
        name: item.name || materialRef?.materialName || "門片五金",
        description: `${door.name || "門片"}：每片 ${item.quantityPerDoor} × ${totalQty} 片`,
        quantity,
        materialRef,
        unitCost: materialRef?.pricePerUnit ?? 0,
        subtotal: materialLineSubtotal(quantity, materialRef),
      });
    }

    if (door.wireMeshMaterialRef) {
      const meshArea = toBillableAreaMeasure(singleCm2, door.wireMeshMaterialRef.minCai ?? null, totalQty);
      hardware.push({
        id: `${door.id}-wire-mesh`,
        name: "鐵網",
        description: `${door.name || "鐵網門"} ${door.widthCm}×${door.heightCm}cm × ${totalQty}`,
        quantity: meshArea.cai,
        materialRef: door.wireMeshMaterialRef,
        unitCost: door.wireMeshMaterialRef.pricePerUnit,
        subtotal: materialLineSubtotal(meshArea.cai, door.wireMeshMaterialRef),
      });

      if (doorAddons.wireMeshPaint) {
        hardware.push({
          id: `${door.id}-wire-mesh-paint`,
          name: "鐵網烤漆加工",
          description: "指定色烤漆處理",
          quantity: meshArea.cai,
          materialRef: null,
          unitCost: ADDON_PRICES.WIRE_MESH_PAINT_PER_CAI,
          subtotal: round(meshArea.cai * ADDON_PRICES.WIRE_MESH_PAINT_PER_CAI, UNIT_CONFIG.COST_DECIMAL_PLACES),
        });
      }
    }

    if (door.aluminumHandleMaterialRef) {
      hardware.push({
        id: `${door.id}-aluminum-handle`,
        name: "鋁製把手",
        description: door.aluminumHandleMaterialRef.materialName,
        quantity: totalQty,
        materialRef: door.aluminumHandleMaterialRef,
        unitCost: door.aluminumHandleMaterialRef.pricePerUnit,
        subtotal: materialLineSubtotal(totalQty, door.aluminumHandleMaterialRef),
      });
    }

    if (doorAddons.profileHandle.style !== "none") {
      const fullHeightProfileHandle = doorAddons.profileHandle.style === "SFJA" || doorAddons.profileHandle.style === "SFCA";
      const profileHandleLengthCm = fullHeightProfileHandle
        ? door.heightCm
        : doorAddons.profileHandle.lengthCm || door.widthCm;
      const tablePrice = profileHandleTierPrice(doorAddons.profileHandle.style, profileHandleLengthCm);
      if (tablePrice !== null) {
        hardware.push({
          id: `${door.id}-profile-handle`,
          name: `造型把手加工 ${profileHandleLabel(doorAddons.profileHandle.style)}`,
          description: `加工長度 ${profileHandleLengthMm(profileHandleLengthCm)}mm`,
          quantity: totalQty,
          materialRef: null,
          unitCost: tablePrice,
          subtotal: round(tablePrice * totalQty, UNIT_CONFIG.COST_DECIMAL_PLACES),
        });

        if (
          (doorAddons.profileHandle.style === "Y1A" ||
            doorAddons.profileHandle.style === "U1A" ||
            doorAddons.profileHandle.style === "V1A") &&
          doorAddons.profileHandle.bakedPaint
        ) {
          const surcharge = profileHandleLengthMm(profileHandleLengthCm) <= PROFILE_HANDLE_BAKED_PAINT_SURCHARGE.MAX_SHORT_MM
            ? PROFILE_HANDLE_BAKED_PAINT_SURCHARGE.SHORT
            : PROFILE_HANDLE_BAKED_PAINT_SURCHARGE.LONG;
          hardware.push({
            id: `${door.id}-profile-handle-baked-paint`,
            name: "鋁片烤漆費用加價",
            description: `加工長度 ${profileHandleLengthMm(profileHandleLengthCm)}mm`,
            quantity: totalQty,
            materialRef: null,
            unitCost: surcharge,
            subtotal: round(surcharge * totalQty, UNIT_CONFIG.COST_DECIMAL_PLACES),
          });
        }
      } else {
        const billableLengthCm = Math.max(
          profileHandleLengthCm,
          ADDON_PRICES.PROFILE_HANDLE_MIN_LENGTH_CM,
        );
        hardware.push({
          id: `${door.id}-profile-handle`,
          name: `造型把手加工 ${doorAddons.profileHandle.style}`,
          description: `基本長度 ${ADDON_PRICES.PROFILE_HANDLE_MIN_LENGTH_CM}cm，不足以基本長度計`,
          quantity: billableLengthCm * totalQty,
          materialRef: null,
          unitCost: ADDON_PRICES.PROFILE_HANDLE_PER_CM,
          subtotal: round(billableLengthCm * totalQty * ADDON_PRICES.PROFILE_HANDLE_PER_CM, UNIT_CONFIG.COST_DECIMAL_PLACES),
        });
      }

      if (doorAddons.profileHandle.lengthModification) {
        hardware.push({
          id: `${door.id}-profile-handle-modification`,
          name: "造型把手長度修改",
          description: "門板裁一刀，補封邊",
          quantity: 1,
          materialRef: null,
          unitCost: ADDON_PRICES.PROFILE_HANDLE_LENGTH_MODIFICATION,
          subtotal: ADDON_PRICES.PROFILE_HANDLE_LENGTH_MODIFICATION,
        });
      }
    }
  }

  return { doors, hardware, addonsBreakdown: { patternMatch, temperedGlass, hingeHoleDrilling } };
}

function calculateAccessories(input: CabinetUnitInput, unitQty: number): AccessoryResult[] {
  void input;
  void unitQty;
  return [];
}

function buildSummary(
  panels: PanelResult[],
  internalParts: PanelResult[],
  doors: DoorResult[],
  hardware: HardwareResult[],
  accessories: AccessoryResult[],
  doorAddonsBreakdown: Pick<AddonsBreakdown, "patternMatch" | "temperedGlass" | "hingeHoleDrilling">
): CabinetUnitSummary {
  const allPanels = [...panels, ...internalParts];
  const totalAreaCm2 = allPanels.reduce((acc, p) => acc + p.totalArea.cm2, 0);
  const panelsCost = panels.reduce((acc, p) => acc + p.subtotal, 0);
  const internalPartsCost = internalParts.reduce((acc, p) => acc + p.subtotal, 0);
  const doorsCost = doors.reduce((acc, d) => acc + d.subtotal, 0);
  const hardwareCost = hardware.reduce((acc, h) => acc + h.subtotal, 0);
  const accessoriesCost = accessories.reduce((acc, a) => acc + a.subtotal, 0);
  const lightGroove = allPanels.reduce((acc, p) => acc + p.lightGrooveCost, 0);
  const specialProcessing = allPanels.reduce(
    (acc, p) => acc + (p.processes ?? [])
      .filter((process) => process.id.includes("-special-") && process.includedInSubtotal)
      .reduce((sum, process) => sum + process.cost, 0),
    0,
  );
  const sideSealBending = allPanels.reduce(
    (acc, p) => acc + (p.processes ?? [])
      .filter((process) => process.id.includes("-side-seal-") && process.includedInSubtotal)
      .reduce((sum, process) => sum + process.cost, 0),
    0,
  );
  const sidePanelInset = allPanels.reduce(
    (acc, p) => acc + (p.processes ?? [])
      .filter((process) => process.id.includes("-side-panel-inset") && process.includedInSubtotal)
      .reduce((sum, process) => sum + process.cost, 0),
    0,
  );
  const drawerBodyKdProcessing = allPanels.reduce(
    (acc, p) => acc + (p.processes ?? [])
      .filter((process) => process.id.includes("-body-kd-processing") && process.includedInSubtotal)
      .reduce((sum, process) => sum + process.cost, 0),
    0,
  );
  const panelHardwareProcessing = allPanels.reduce(
    (acc, p) => acc + (p.processes ?? [])
      .filter((process) =>
        [
          "-small-adjustable-foot-hole",
          "-light-st-wheel-hole",
          "-heavy-st-wheel-hole",
          "-bookcase-guide-wheel-hole",
          "-hidden-shelf-screw-hole",
          "-heavy-hidden-shelf-screw-hole",
          "-hidden-return-slide-rail",
          "-special-u-glass-pivot",
          "-t-rail-bed-set",
        ].some((key) => process.id.includes(key)) && process.includedInSubtotal)
      .reduce((sum, process) => sum + process.cost, 0),
    0,
  );
  const slidingDoorTrackGroove = allPanels.reduce(
    (acc, p) => acc + (p.processes ?? [])
      .filter((process) => process.id.includes("-sliding-door-track-groove") && process.includedInSubtotal)
      .reduce((sum, process) => sum + process.cost, 0),
    0,
  );
  const lTurnCabinetPanelCost = allPanels.reduce(
    (acc, p) => acc + (p.processes ?? [])
      .filter((process) => process.id.includes("-l-turn-cabinet") && process.includedInSubtotal)
      .reduce((sum, process) => sum + process.cost, 0),
    0,
  );
  const lTurnCabinetStandaloneCost = hardware
    .filter((row) => row.id.endsWith("-l-turn-cabinet-fee"))
    .reduce((sum, row) => sum + row.subtotal, 0);
  const lTurnCabinet = lTurnCabinetPanelCost + lTurnCabinetStandaloneCost;
  const doubleDrillHoles = allPanels.reduce(
    (acc, p) => acc + (p.processes ?? [])
      .filter((process) => process.id.includes("-double-drill-holes") && process.includedInSubtotal)
      .reduce((sum, process) => sum + process.cost, 0),
    0,
  );
  const nonStandardHoles = allPanels.reduce(
    (acc, p) => acc + (p.processes ?? [])
      .filter((process) => process.id.includes("-non-standard-holes") && process.includedInSubtotal)
      .reduce((sum, process) => sum + process.cost, 0),
    0,
  );
  const frontEdgeABS = allPanels.reduce((acc, p) => acc + p.addonsCost - p.lightGrooveCost, 0)
    - specialProcessing
    - sideSealBending
    - sidePanelInset
    - drawerBodyKdProcessing
    - panelHardwareProcessing
    - slidingDoorTrackGroove
    - lTurnCabinetPanelCost
    - doubleDrillHoles
    - nonStandardHoles;
  const backPanelGroove = panels.reduce(
    (acc, panel) => acc + (panel.processes ?? [])
      .filter((process) => process.id.includes("-back-groove"))
      .reduce((sum, process) => sum + process.cost * panel.quantity, 0),
    0,
  );
  const addonsBreakdown: AddonsBreakdown = {
    ...emptyBreakdown(),
    frontEdgeABS,
    patternMatch: doorAddonsBreakdown.patternMatch,
    temperedGlass: doorAddonsBreakdown.temperedGlass,
    hingeHoleDrilling: doorAddonsBreakdown.hingeHoleDrilling,
    backPanelGroove,
    lightGroove,
    slidingDoorTrackGroove,
    lTurnCabinet,
    specialProcessing,
    sideSealBending,
    sidePanelInset,
    panelHardwareProcessing,
    drawerBodyKdProcessing,
    doubleDrillHoles,
    nonStandardHoles,
  };
  const addonsCost = Object.values(addonsBreakdown).reduce((acc, n) => acc + n, 0);
  const boardBackingCost = panels.filter((p) => p.name.includes("背板")).reduce((acc, p) => acc + p.subtotal, 0);
  const boardBodyCost = panels.filter((p) => !p.name.includes("背板")).reduce((acc, p) => acc + p.subtotal, 0)
    + internalPartsCost
    + accessoriesCost;

  return {
    totalAreaCm2: round(totalAreaCm2, 2),
    totalAreaM2: round(totalAreaCm2 / 10_000, 4),
    totalAreaCai: round(totalAreaCm2 / UNIT_CONFIG.CAI_CM2, 4),
    panelsCost,
    internalPartsCost,
    doorsCost,
    hardwareCost,
    accessoriesCost,
    addonsCost,
    boardBodyCost,
    boardBackingCost,
    boardDoorCost: doorsCost,
    addonsBreakdown,
    totalCost: panelsCost + internalPartsCost + doorsCost + hardwareCost + accessoriesCost + backPanelGroove,
  };
}

export function calculateCabinetUnit(input: CabinetUnitInput): CabinetUnitResult {
  const unitQty = input.quantity;
  const panels = generateFixedPanels(input, unitQty);
  const internalParts = generateInternalParts(input, unitQty);
  const { doors, hardware: doorHardware, addonsBreakdown } = calculateDoors(input, unitQty);
  const hardware = [
    ...doorHardware,
    ...calculateDrawerHardware(input, unitQty),
    ...calculateExtraHardware(input.hardwareItems, unitQty),
    ...calculateStandaloneProcessRows(input, unitQty),
  ];
  const accessories = calculateAccessories(input, unitQty);
  const summary = buildSummary(panels, internalParts, doors, hardware, accessories, addonsBreakdown);

  return {
    unitId: input.id,
    unitName: input.name,
    quantity: unitQty,
    panels,
    internalParts,
    doors,
    hardware,
    accessories,
    summary,
  };
}

export function calculateCabinetProject(units: CabinetUnitInput[]): CabinetProjectResult {
  const unitResults = units.map(calculateCabinetUnit);
  return {
    unitResults,
    projectTotal: unitResults.reduce((acc, r) => acc + r.summary.totalCost, 0),
  };
}
