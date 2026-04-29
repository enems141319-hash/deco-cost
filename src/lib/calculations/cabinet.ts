// src/lib/calculations/cabinet.ts
// 純函式：零 UI 依賴、零副作用。

import { ADDON_PRICES, UNIT_CONFIG } from "../config/units";
import { DEFAULT_DOOR_ADDONS } from "../../types";
import type {
  AccessoryResult,
  AddonsBreakdown,
  AreaMeasure,
  CabinetProjectResult,
  CabinetUnitInput,
  CabinetUnitResult,
  CabinetUnitSummary,
  DoorResult,
  HardwareItemInput,
  HardwareResult,
  MaterialRef,
  PanelProcessResult,
  PanelResult,
  UnitAddons,
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
  };
}

function calcFrontEdgeAddon(frontEdgeABS: UnitAddons["frontEdgeABS"]): number {
  if (frontEdgeABS === "one_long") return ADDON_PRICES.FRONT_EDGE_ABS_ONE_LONG;
  if (frontEdgeABS === "two_long") return ADDON_PRICES.FRONT_EDGE_ABS_TWO_LONG;
  return 0;
}

function calcMiddleDividerAddon(addons: { doubleDrillHoles: boolean; nonStandardHoles: boolean } | undefined): number {
  if (!addons?.doubleDrillHoles) return 0;
  return ADDON_PRICES.DOUBLE_DRILL_HOLES + (addons.nonStandardHoles ? ADDON_PRICES.NON_STANDARD_HOLES : 0);
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

function joinNotes(...notes: Array<string | undefined>): string | undefined {
  return notes.filter(Boolean).join("; ") || undefined;
}
function materialThicknessCm(materialRef: MaterialRef | null): number {
  const match = materialRef?.materialName.match(/(\d+(?:\.\d+)?)\s*mm/i);
  if (!match) return 0;
  return Number(match[1]) / 10;
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
    lightGrooveCost: extraAddonCost,
    processes,
    isAutoGenerated,
    note,
  };
}

function generateFixedPanels(input: CabinetUnitInput, unitQty: number): PanelResult[] {
  const { id, widthCm, depthCm, heightCm, panelMaterialRef, backPanelMaterialRef, hasBackPanel, addons } = input;
  const frontEdgeAddon = calcFrontEdgeAddon(addons.frontEdgeABS);
  const sideThicknessCm = materialThicknessCm(panelMaterialRef);
  const topBottomWidthCm = round(Math.max(widthCm - sideThicknessCm * 2, 0), UNIT_CONFIG.DIMENSION_DECIMAL_PLACES);
  const backPanelWidthCm = round(Math.max(widthCm - UNIT_CONFIG.BACK_PANEL_DEDUCTION_CM, 0), UNIT_CONFIG.DIMENSION_DECIMAL_PLACES);
  const backPanelHeightCm = round(Math.max(heightCm - UNIT_CONFIG.BACK_PANEL_DEDUCTION_CM, 0), UNIT_CONFIG.DIMENSION_DECIMAL_PLACES);
  const backPanelGrooveNote = hasBackPanel ? "背板溝槽: 離後緣18mm, 寬8.5mm, 深9mm" : undefined;
  const backPanelGrooveCostPerLine = hasBackPanel ? UNIT_CONFIG.BACK_PANEL_GROOVE_COST_PER_LINE : 0;
  const topLightGroove = addons.lightGrooves?.topInner;
  const sideLightGroove = addons.lightGrooves?.sideInner;
  const topLightGrooveCost = topLightGroove?.enabled ? calcLightGrooveCost(topBottomWidthCm, unitQty) : 0;
  const sideLightGrooveCost = sideLightGroove?.enabled ? calcLightGrooveCost(heightCm, unitQty) : 0;
  const topLightGrooveNote = topLightGroove?.enabled ? lightGrooveNote("上板內側", topLightGroove.offsetFromFrontMm) : undefined;
  const sideLightGrooveNote = sideLightGroove?.enabled ? lightGrooveNote("側板內側", sideLightGroove.offsetFromFrontMm) : undefined;

  const panels: PanelResult[] = [
    buildPanelResult({ id: `${id}-left`, name: "左側板", widthCm: heightCm, heightCm: depthCm, quantity: unitQty, materialRef: panelMaterialRef, isAutoGenerated: true, addonPricePerCai: frontEdgeAddon, extraAddonCost: sideLightGrooveCost, note: joinNotes(backPanelGrooveNote, sideLightGrooveNote), processes: [
      ...(backPanelGrooveNote ? [panelProcess(`${id}-left-back-groove`, backPanelGrooveNote, backPanelGrooveCostPerLine, false)] : []),
      ...(sideLightGrooveNote ? [lightGrooveProcess(`${id}-left-light-groove`, sideLightGrooveNote, heightCm, unitQty)] : []),
    ] }),
    buildPanelResult({ id: `${id}-right`, name: "右側板", widthCm: heightCm, heightCm: depthCm, quantity: unitQty, materialRef: panelMaterialRef, isAutoGenerated: true, addonPricePerCai: frontEdgeAddon, extraAddonCost: sideLightGrooveCost, note: joinNotes(backPanelGrooveNote, sideLightGrooveNote), processes: [
      ...(backPanelGrooveNote ? [panelProcess(`${id}-right-back-groove`, backPanelGrooveNote, backPanelGrooveCostPerLine, false)] : []),
      ...(sideLightGrooveNote ? [lightGrooveProcess(`${id}-right-light-groove`, sideLightGrooveNote, heightCm, unitQty)] : []),
    ] }),
    buildPanelResult({ id: `${id}-top`, name: "頂板", widthCm: topBottomWidthCm, heightCm: depthCm, quantity: unitQty, materialRef: panelMaterialRef, isAutoGenerated: true, addonPricePerCai: frontEdgeAddon, extraAddonCost: topLightGrooveCost, note: joinNotes(backPanelGrooveNote, topLightGrooveNote), processes: [
      ...(backPanelGrooveNote ? [panelProcess(`${id}-top-back-groove`, backPanelGrooveNote, backPanelGrooveCostPerLine, false)] : []),
      ...(topLightGrooveNote ? [lightGrooveProcess(`${id}-top-light-groove`, topLightGrooveNote, topBottomWidthCm, unitQty)] : []),
    ] }),
    buildPanelResult({ id: `${id}-bottom`, name: "底板", widthCm: topBottomWidthCm, heightCm: depthCm, quantity: unitQty, materialRef: panelMaterialRef, isAutoGenerated: true, addonPricePerCai: frontEdgeAddon, note: backPanelGrooveNote, processes: [
      ...(backPanelGrooveNote ? [panelProcess(`${id}-bottom-back-groove`, backPanelGrooveNote, backPanelGrooveCostPerLine, false)] : []),
    ] }),
  ];

  if (hasBackPanel) {
    panels.push(
      buildPanelResult({ id: `${id}-back`, name: "背板", widthCm: backPanelWidthCm, heightCm: backPanelHeightCm, quantity: unitQty, materialRef: backPanelMaterialRef, isAutoGenerated: true })
    );
  }

  return panels;
}

function generateInternalParts(input: CabinetUnitInput, unitQty: number): PanelResult[] {
  const parts: PanelResult[] = [];
  const drawerParts: PanelResult[] = [];
  const frontEdgeAddon = calcFrontEdgeAddon(input.addons.frontEdgeABS);

  for (const d of input.middleDividers) {
    const dividerAddon = calcMiddleDividerAddon(d.addons);
    const dividerLightGroove = d.addons?.lightGroove;
    const dividerLightGrooveCost = dividerLightGroove && dividerLightGroove.side !== "none"
      ? calcLightGrooveCost(d.heightCm, d.quantity * unitQty)
      : 0;
    const dividerLightGrooveNote = dividerLightGroove && dividerLightGroove.side !== "none"
      ? lightGrooveNote(dividerLightGroove.side === "left" ? "左側" : "右側", dividerLightGroove.offsetFromFrontMm)
      : undefined;
    parts.push(buildPanelResult({
      id: d.id,
      name: "中隔板",
      widthCm: d.widthCm,
      heightCm: d.heightCm,
      quantity: d.quantity * unitQty,
      materialRef: d.materialRef,
      isAutoGenerated: false,
      addonPricePerCai: frontEdgeAddon + dividerAddon,
      extraAddonCost: dividerLightGrooveCost,
      note: dividerLightGrooveNote,
      processes: dividerLightGrooveNote
        ? [lightGrooveProcess(`${d.id}-light-groove`, dividerLightGrooveNote, d.heightCm, d.quantity * unitQty)]
        : [],
    }));
  }

  for (const s of input.shelves) {
    const shelfLightGroove = s.lightGroove;
    const shelfLightGrooveCost = shelfLightGroove && shelfLightGroove.side !== "none"
      ? calcLightGrooveCost(s.widthCm, s.quantity * unitQty)
      : 0;
    const shelfLightGrooveNote = shelfLightGroove && shelfLightGroove.side !== "none"
      ? lightGrooveNote(shelfLightGroove.side === "top" ? "上面" : "下面", shelfLightGroove.offsetFromFrontMm)
      : undefined;
    parts.push(buildPanelResult({
      id: s.id,
      name: "層板",
      widthCm: s.widthCm,
      heightCm: s.depthCm,
      quantity: s.quantity * unitQty,
      materialRef: s.materialRef,
      isAutoGenerated: false,
      addonPricePerCai: frontEdgeAddon,
      extraAddonCost: shelfLightGrooveCost,
      note: shelfLightGrooveNote,
      processes: shelfLightGrooveNote
        ? [lightGrooveProcess(`${s.id}-light-groove`, shelfLightGrooveNote, s.widthCm, s.quantity * unitQty)]
        : [],
    }));
  }

  for (const drawer of input.drawers ?? []) {
    const quantity = drawer.quantity * unitQty;
    const wallHeightCm = drawer.heightCm - 7;
    const frontBackWidthCm = drawer.widthCm - 10.2;
    const bottomWidthCm = drawer.widthCm - 8.8;
    const bottomDepthCm = drawer.railLengthCm - 2.2;
    const grooveNote = `內側下方打溝 (${drawer.grooveSpec ?? "8.5"})`;

    drawerParts.push(buildPanelResult({
      id: `${drawer.id}-front-panel`,
      name: "抽屜面板/抽頭",
      widthCm: drawer.widthCm,
      heightCm: drawer.heightCm,
      quantity,
      materialRef: drawer.wallMaterialRef ?? input.panelMaterialRef,
      isAutoGenerated: true,
      addonPricePerCai: frontEdgeAddon,
      billableMinCai: null,
    }));

    drawerParts.push(buildPanelResult({
      id: `${drawer.id}-side-panels`,
      name: "抽屜左右側板",
      widthCm: drawer.railLengthCm,
      heightCm: wallHeightCm,
      quantity: quantity * 2,
      materialRef: drawer.wallMaterialRef,
      isAutoGenerated: true,
      addonPricePerCai: frontEdgeAddon,
      billableMinCai: null,
      note: grooveNote,
    }));

    drawerParts.push(buildPanelResult({
      id: `${drawer.id}-front-back-panels`,
      name: "抽屜前後牆板",
      widthCm: frontBackWidthCm,
      heightCm: wallHeightCm,
      quantity: quantity * 2,
      materialRef: drawer.wallMaterialRef,
      isAutoGenerated: true,
      addonPricePerCai: frontEdgeAddon,
      billableMinCai: null,
      note: grooveNote,
    }));

    drawerParts.push(buildPanelResult({
      id: `${drawer.id}-bottom-panel`,
      name: "抽屜8mm底板",
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
  return (input.drawers ?? []).map((drawer) => {
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
    const hingesPerDoor = Math.max(
      UNIT_CONFIG.MIN_HINGES_PER_DOOR,
      Math.ceil(door.heightCm / UNIT_CONFIG.HINGE_SPACING_CM)
    );

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
    const hingeHoleCost = doorAddons.hingeHoleDrilling && door.type === "HINGED"
      ? hingesPerDoor * totalQty * ADDON_PRICES.HINGE_HOLE_DRILLING
      : 0;
    const addonsCost = patternCost + glassCost + hingeHoleCost;

    patternMatch += patternCost;
    temperedGlass += glassCost;
    hingeHoleDrilling += hingeHoleCost;

    doors.push({
      id: door.id,
      type: door.type,
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
      const railRef = door.railMaterialRef ?? null;
      const quantity = railRef?.unit === "M"
        ? round((input.widthCm / 100) * unitQty, 2)
        : totalQty;

      hardware.push({
        id: `${door.id}-push-door-hardware`,
        name: "推拉門五金",
        description: railRef?.unit === "M"
          ? `滑門寬 ${input.widthCm}cm × ${unitQty} 組`
          : `${door.name || "滑門"} × ${totalQty}`,
        quantity,
        materialRef: railRef,
        unitCost: railRef?.pricePerUnit ?? 0,
        subtotal: railRef ? round(quantity * railRef.pricePerUnit, UNIT_CONFIG.COST_DECIMAL_PLACES) : 0,
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
  const accessories: AccessoryResult[] = [];

  if (input.kickPlate) {
    const { widthCm, heightCm, materialRef } = input.kickPlate;
    const singleArea = toAreaMeasure(widthCm * heightCm);
    const totalArea = toAreaMeasure(widthCm * heightCm * unitQty);

    accessories.push({
      id: `${input.id}-kickplate`,
      name: "踢腳板",
      widthCm,
      heightCm,
      quantity: unitQty,
      singleArea,
      totalArea,
      materialRef,
      subtotal: calcPanelSubtotal(totalArea, materialRef),
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
  const frontEdgeABS = allPanels.reduce((acc, p) => acc + p.addonsCost - p.lightGrooveCost, 0);
  const backPanelQuantity = panels.find((p) => p.id.endsWith("-back"))?.quantity ?? 0;
  const backPanelGroove = backPanelQuantity * UNIT_CONFIG.BACK_PANEL_GROOVE_LINES * UNIT_CONFIG.BACK_PANEL_GROOVE_COST_PER_LINE;
  const addonsBreakdown: AddonsBreakdown = {
    ...emptyBreakdown(),
    frontEdgeABS,
    patternMatch: doorAddonsBreakdown.patternMatch,
    temperedGlass: doorAddonsBreakdown.temperedGlass,
    hingeHoleDrilling: doorAddonsBreakdown.hingeHoleDrilling,
    backPanelGroove,
    lightGroove,
  };
  const addonsCost = Object.values(addonsBreakdown).reduce((acc, n) => acc + n, 0);
  const boardBackingCost = panels.filter((p) => p.name === "背板").reduce((acc, p) => acc + p.subtotal, 0);
  const boardBodyCost = panels.filter((p) => p.name !== "背板").reduce((acc, p) => acc + p.subtotal, 0)
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
