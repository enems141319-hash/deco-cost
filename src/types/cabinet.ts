// src/types/cabinet.ts

// ─── 基礎型別 ─────────────────────────────────────────────────────────────────

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

// ─── 輸入型別 ─────────────────────────────────────────────────────────────────

export type DoorType = "HINGED" | "SLIDING";
export type ProfileHandleStyle =
  | "none"
  | "SFJA" | "SFJB" | "SFJC" | "SFJD" | "SFCA"
  | "L1A" | "L5A"
  | "Y5IA" | "Y5LA" | "Y5CA" | "V5IA" | "V5LA" | "V5CA" | "U5IA" | "U5LA" | "U5CA"
  | "Y5JA" | "Y5KA" | "U5JA" | "U5KA" | "V5JA" | "V5KA"
  | "Y1A" | "U1A" | "V1A"
  | "RECESSED_BEVEL_HANDLE"
  | "RECESSED_ALUMINUM_HANDLE_NO_HARDWARE"
  | "N1A"
  | "N5IA" | "N5LA" | "N5CA"
  | "N5JA" | "N5KA"
  | "BEVEL_OR_HALF_ARC_HANDLE"
  | "HORIZONTAL_INTEGRATED"
  | "TRIANGLE_INTEGRATED_R40"
  | "QUARTER_ROUND_INTEGRATED_R40"
  | "HALF_ROUND_INTEGRATED_R40"
  | "HEART_INTEGRATED_80"
  | "SQUARE_INTEGRATED_80"
  | "HEXAGON_INTEGRATED_90"
  | "DIAMOND_INTEGRATED_100"
  | "HOURGLASS_INTEGRATED_150"
  | "SMILE_INTEGRATED";
export type LightGrooveSide = "none" | "left" | "right";
export type LightGrooveFace = "none" | "top" | "bottom";
export type SlidingDoorTrackShape = "ㄇ" | "V" | "T";
export type LTurnCabinetPosition = "rightTop" | "rightBottom" | "leftTop" | "leftBottom";
export type BodyPanelJoinMode = "SIDE_COVERS_TOP" | "TOP_COVERS_SIDES";

export interface LightGrooveSwitch {
  enabled: boolean;
  offsetFromFrontMm: number;
}

export interface ProcessingSwitch {
  enabled: boolean;
}

export interface ProcessingQuantitySwitch extends ProcessingSwitch {
  quantity: number;
}

export interface SlidingDoorTrackGrooveOption extends ProcessingSwitch {
  trackShape: SlidingDoorTrackShape;
}

export interface UnitLightGrooves {
  topInner: LightGrooveSwitch;
  sideInner: LightGrooveSwitch;
}

export interface UnitSlidingDoorTrackGrooves {
  top: SlidingDoorTrackGrooveOption;
  bottom: SlidingDoorTrackGrooveOption;
}

export interface LTurnCabinetOption {
  enabled: boolean;
  position: LTurnCabinetPosition;
  widthMm: number;
  heightMm: number;
  isOpening: boolean;
}

export interface TopPanelOverhangOption {
  enabled: boolean;
  frontCm: number;
  backCm: number;
  leftCm: number;
  rightCm: number;
  frontMm?: number;
  backMm?: number;
  leftMm?: number;
  rightMm?: number;
}

export interface SideSealBendingOption {
  enabled: boolean;
  depthMm: number;
  depthCm?: number;
  isDrawerCabinet: boolean;
  drawerDividerDepthCm?: number;
  visibleEdgeBand: boolean;
}

export interface UnitSideSealBending {
  left: SideSealBendingOption;
  right: SideSealBendingOption;
}

export interface UnitBodyPanelProcesses {
  top: {
    frontEdgeABS: UnitAddons["frontEdgeABS"];
    lightGroove: LightGrooveSwitch;
    slidingDoorTrackGroove: SlidingDoorTrackGrooveOption;
    bookcaseGuideWheelHole: ProcessingQuantitySwitch;
  };
  bottom: {
    frontEdgeABS: UnitAddons["frontEdgeABS"];
    slidingDoorTrackGroove: SlidingDoorTrackGrooveOption;
    smallAdjustableFootHole: ProcessingQuantitySwitch;
    lightStWheelHole: ProcessingQuantitySwitch;
    heavyStWheelHole: ProcessingQuantitySwitch;
    bookcaseGuideWheelHole: ProcessingQuantitySwitch;
  };
  left: {
    frontEdgeABS: UnitAddons["frontEdgeABS"];
    lightGroove: LightGrooveSwitch;
    sideSealBending: SideSealBendingOption;
    hiddenReturnSlideRail: ProcessingQuantitySwitch;
    specialUGlassPivot: ProcessingQuantitySwitch;
    tRailBedSet: ProcessingQuantitySwitch;
  };
  right: {
    frontEdgeABS: UnitAddons["frontEdgeABS"];
    lightGroove: LightGrooveSwitch;
    sideSealBending: SideSealBendingOption;
    hiddenReturnSlideRail: ProcessingQuantitySwitch;
    specialUGlassPivot: ProcessingQuantitySwitch;
    tRailBedSet: ProcessingQuantitySwitch;
  };
}

export interface MiddleDividerLightGroove {
  side: LightGrooveSide;
  offsetFromFrontMm: number;
}

export interface ShelfLightGroove {
  side: LightGrooveFace;
  offsetFromFrontMm: number;
}

export interface UnitAddons {
  frontEdgeABS: "none" | "one_long" | "two_long";
  lTurnCabinet?: LTurnCabinetOption;
  topPanelOverhang?: TopPanelOverhangOption;
  sidePanelInset?: ProcessingSwitch;
  lightGrooves?: UnitLightGrooves;
  slidingDoorTrackGrooves?: UnitSlidingDoorTrackGrooves;
  sideSealBending?: UnitSideSealBending;
  bodyPanelProcesses?: UnitBodyPanelProcesses;
}

export interface MiddleDividerAddons {
  doubleDrillHoles: boolean;
  nonStandardHoles: boolean;
  lightGroove?: MiddleDividerLightGroove;
  hiddenReturnSlideRail?: ProcessingQuantitySwitch;
}

export interface ShelfHardwareProcesses {
  hiddenShelfScrewHole: ProcessingQuantitySwitch;
  heavyHiddenShelfScrewHole: ProcessingQuantitySwitch;
}

export type SpecialProcessKind = "roundCorner" | "quarterRound" | "cutCorner" | "outerShape" | "innerCutout";
export type SpecialProcessEdgeBanding = "none" | "withEdge";
export type SpecialProcessRadiusMode = "factory" | "custom";
export type SpecialProcessOuterShapeSide = "long" | "short";

export interface SpecialProcessInput {
  id: string;
  kind: SpecialProcessKind;
  label: string;
  edgeBanding: SpecialProcessEdgeBanding;
  quantity: number;
  dimensionSumMm?: number;
  dimensionAMm?: number;
  dimensionBMm?: number;
  outerShapeSide?: SpecialProcessOuterShapeSide;
  radiusMm?: number;
  radiusMode?: SpecialProcessRadiusMode;
  sharpCornerGte90Count?: number;
  sharpCornerLt90Count?: number;
}

export interface DoorAddons {
  louverDoor?: boolean;
  patternMatch: "none" | "grain";
  temperedGlass: boolean;
  hingeHoleDrilling: boolean;
  wireMeshPaint: boolean;
  profileHandle: {
    style: ProfileHandleStyle;
    lengthCm: number;
    lengthModification: boolean;
    bakedPaint?: boolean;
  };
}

export const DEFAULT_UNIT_ADDONS: UnitAddons = {
  frontEdgeABS: "none",
  lTurnCabinet: {
    enabled: false,
    position: "rightTop",
    widthMm: 0,
    heightMm: 0,
    isOpening: true,
  },
  sidePanelInset: { enabled: false },
  topPanelOverhang: {
    enabled: false,
    frontCm: 0,
    backCm: 0,
    leftCm: 0,
    rightCm: 0,
  },
  lightGrooves: {
    topInner: { enabled: false, offsetFromFrontMm: 50 },
    sideInner: { enabled: false, offsetFromFrontMm: 50 },
  },
  slidingDoorTrackGrooves: {
    top: { enabled: false, trackShape: "ㄇ" },
    bottom: { enabled: false, trackShape: "ㄇ" },
  },
  sideSealBending: {
    left: { enabled: false, depthMm: 80, isDrawerCabinet: false, drawerDividerDepthCm: 55, visibleEdgeBand: false },
    right: { enabled: false, depthMm: 80, isDrawerCabinet: false, drawerDividerDepthCm: 55, visibleEdgeBand: false },
  },
  bodyPanelProcesses: {
    top: {
      frontEdgeABS: "none",
      lightGroove: { enabled: false, offsetFromFrontMm: 50 },
      slidingDoorTrackGroove: { enabled: false, trackShape: "ㄇ" },
      bookcaseGuideWheelHole: { enabled: false, quantity: 1 },
    },
    bottom: {
      frontEdgeABS: "none",
      slidingDoorTrackGroove: { enabled: false, trackShape: "ㄇ" },
      smallAdjustableFootHole: { enabled: false, quantity: 1 },
      lightStWheelHole: { enabled: false, quantity: 1 },
      heavyStWheelHole: { enabled: false, quantity: 1 },
      bookcaseGuideWheelHole: { enabled: false, quantity: 1 },
    },
    left: {
      frontEdgeABS: "none",
      lightGroove: { enabled: false, offsetFromFrontMm: 50 },
      sideSealBending: { enabled: false, depthMm: 80, isDrawerCabinet: false, drawerDividerDepthCm: 55, visibleEdgeBand: false },
      hiddenReturnSlideRail: { enabled: false, quantity: 1 },
      specialUGlassPivot: { enabled: false, quantity: 1 },
      tRailBedSet: { enabled: false, quantity: 1 },
    },
    right: {
      frontEdgeABS: "none",
      lightGroove: { enabled: false, offsetFromFrontMm: 50 },
      sideSealBending: { enabled: false, depthMm: 80, isDrawerCabinet: false, drawerDividerDepthCm: 55, visibleEdgeBand: false },
      hiddenReturnSlideRail: { enabled: false, quantity: 1 },
      specialUGlassPivot: { enabled: false, quantity: 1 },
      tRailBedSet: { enabled: false, quantity: 1 },
    },
  },
};

export const DEFAULT_MIDDLE_DIVIDER_ADDONS: MiddleDividerAddons = {
  doubleDrillHoles: false,
  nonStandardHoles: false,
  lightGroove: { side: "none", offsetFromFrontMm: 50 },
  hiddenReturnSlideRail: { enabled: false, quantity: 1 },
};

export const DEFAULT_DOOR_ADDONS: DoorAddons = {
  louverDoor: false,
  patternMatch: "none",
  temperedGlass: false,
  hingeHoleDrilling: false,
  wireMeshPaint: false,
  profileHandle: {
    style: "none",
    lengthCm: 40,
    lengthModification: false,
    bakedPaint: false,
  },
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
  includeHingeInQuote?: boolean;
  includeSlidingHardwareInQuote?: boolean;
  hingeMaterialRef?: MaterialRef | null;
  railMaterialRef?: MaterialRef | null;
  wireMeshMaterialRef?: MaterialRef | null;
  useAluminumHandle?: boolean;
  aluminumHandleMaterialRef?: MaterialRef | null;
  hardwareItems?: DoorHardwareItemInput[];
}

export interface DoorHardwareItemInput {
  id: string;
  name: string;
  quantityPerDoor: number;
  materialRef: MaterialRef | null;
  includeHingeHoleDrilling: boolean;
  category?: "HARDWARE_HINGE" | "HARDWARE_OTHER";
}

export interface HardwareItemInput {
  id: string;
  name: string;
  quantity: number;
  materialRef: MaterialRef | null;
}

export interface MiddleDividerInput {
  id: string;
  widthCm: number;
  heightCm: number;
  fullHeight?: boolean;
  fullWidth?: boolean;
  quantity: number;
  materialRef: MaterialRef | null;
  addons: MiddleDividerAddons;
  specialProcesses?: SpecialProcessInput[];
}

export interface ShelfInput {
  id: string;
  widthCm: number;
  depthCm: number;
  fullDepth?: boolean;
  quantity: number;
  materialRef: MaterialRef | null;
  lightGroove?: ShelfLightGroove;
  hardwareProcesses?: ShelfHardwareProcesses;
  specialProcesses?: SpecialProcessInput[];
}

export interface SideTopBottomSealPanelInput {
  id: string;
  name: string;
  widthCm: number;
  heightCm: number;
  quantity: number;
  materialRef: MaterialRef | null;
}

export interface KickPlateInput {
  widthCm?: number;
  heightCm: number;
  materialRef?: MaterialRef | null;
}

export interface ManualKickPlateInput {
  id: string;
  name: string;
  widthCm: number;
  heightCm: number;
  quantity: number;
}

export type BackPanelMode = "AUTO_8MM" | "MANUAL_18MM";

export interface ManualBackPanelInput {
  widthCm: number;
  heightCm: number;
  quantity: number;
}

export interface DrawerInput {
  id: string;
  name: string;
  widthCm: number;
  heightCm: number;
  depthCm: number;
  railLengthCm: number;
  includeRailInQuote?: boolean;
  bodyKdProcessing?: boolean;
  grooveSpec: "12" | "8.5" | "9";
  quantity: number;
  railMaterialRef: MaterialRef | null;
  wallMaterialRef: MaterialRef | null;
  bottomMaterialRef: MaterialRef | null;
  frontMoldProcessing?: boolean;
  frontMoldRadius?: "none" | "R20" | "R30" | "R50" | "R80" | "R100" | "R150" | "R200" | "R250" | "R300";
  frontMoldCornerCount?: number;
  frontHandle?: {
    style: ProfileHandleStyle;
    lengthCm: number;
    bakedPaint?: boolean;
  };
}

export interface CabinetUnitInput {
  id: string;
  vendor?: "WEIHO" | "ZHENGDAO";
  name: string;
  widthCm: number;
  depthCm: number;
  heightCm: number;
  quantity: number;
  hasBackPanel: boolean;
  backPanelMode?: BackPanelMode;
  manualBackPanel?: ManualBackPanelInput;
  bodyPanelJoinMode?: BodyPanelJoinMode;
  panelMaterialRef: MaterialRef | null;
  topPanelMaterialRef?: MaterialRef | null;
  sidePanelMaterialRef?: MaterialRef | null;
  bottomPanelMaterialRef?: MaterialRef | null;
  backPanelMaterialRef: MaterialRef | null;
  addons: UnitAddons;
  middleDividers: MiddleDividerInput[];
  shelves: ShelfInput[];
  sideTopBottomSealPanels?: SideTopBottomSealPanelInput[];
  drawers: DrawerInput[];
  doors: DoorInput[];
  hardwareItems: HardwareItemInput[];
  kickPlate: KickPlateInput | null;
  manualKickPlates?: ManualKickPlateInput[];
}

// ─── 輸出型別 ─────────────────────────────────────────────────────────────────

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
  lightGrooveCost: number;
  processes: PanelProcessResult[];
  isAutoGenerated: boolean;
  note?: string;
}

export interface PanelProcessResult {
  id: string;
  label: string;
  quantity: number;
  unitCost: number;
  cost: number;
  includedInSubtotal: boolean;
}

export interface DoorResult {
  id: string;
  type: DoorType;
  isLouverDoor?: boolean;
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
  processes: PanelProcessResult[];
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
  boardBodyCost: number;
  boardBackingCost: number;
  boardDoorCost: number;
  addonsBreakdown: AddonsBreakdown;
  totalCost: number;
}

export interface AddonsBreakdown {
  frontEdgeABS: number;
  doubleDrillHoles: number;
  nonStandardHoles: number;
  patternMatch: number;
  temperedGlass: number;
  hingeHoleDrilling: number;
  backPanelGroove: number;
  lightGroove: number;
  slidingDoorTrackGroove: number;
  lTurnCabinet: number;
  specialProcessing: number;
  sideSealBending: number;
  sidePanelInset: number;
  panelHardwareProcessing: number;
  drawerBodyKdProcessing: number;
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
