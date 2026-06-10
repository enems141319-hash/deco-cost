export type ZhengdaoVendor = "ZHENGDAO";
export type ZhengdaoCatalogVersion = "2025";

export type ZhengdaoBoardUsage = "BODY_BACK" | "DOOR" | "DOOR_COUNTERTOP";
export type ZhengdaoBoardSeries = "ER928" | "JM" | "ER" | "AR" | "HWR" | "HR" | "MR" | "PR";
export type ZhengdaoBoardThicknessMm = 3 | 8 | 9 | 18 | 19 | 25 | 50;
export type ZhengdaoBoardAddon =
  | "FRONT_ABS"
  | "FRONT_BACK_ABS"
  | "MIDDLE_DIVIDER_DOUBLE_DRILL"
  | "SHARED_SIDE_DOUBLE_DRILL_BACK_GROOVE"
  | "L_SHAPED_BODY"
  | "SMALL_BODY_SIDE"
  | "DOOR_GRAIN_MATCH"
  | "MR_DOOR_HORIZONTAL_GRAIN";

export type ZhengdaoProcessingBillingMode = "PER_CAI" | "PER_ITEM" | "PER_10MM";

export interface ZhengdaoCatalogRef {
  vendorCode: string;
  name: string;
  unit: string;
  pricePerUnit: number;
  requiresQuote?: boolean;
  note?: string;
}

export interface ZhengdaoBoardMaterialRef extends ZhengdaoCatalogRef {
  minCai: number;
  series: ZhengdaoBoardSeries;
  thicknessMm: ZhengdaoBoardThicknessMm;
}

export interface ZhengdaoBoardLineInput {
  id: string;
  name: string;
  usage: ZhengdaoBoardUsage;
  widthCm: number;
  heightCm: number;
  quantity: number;
  material: ZhengdaoBoardMaterialRef;
  addons: ZhengdaoBoardAddon[];
}

export interface ZhengdaoProcessingInput {
  id: string;
  name: string;
  targetBoardLineId: string;
  billingMode: ZhengdaoProcessingBillingMode;
  unit: string;
  quantity: number;
  unitPrice: number;
  minCai?: number;
  lengthMm?: number;
  requiresQuote?: boolean;
  note?: string;
}

export interface ZhengdaoHardwareInput {
  id: string;
  name: string;
  quantity: number;
  material: ZhengdaoCatalogRef;
  note?: string;
}

export interface ZhengdaoCustomItemInput {
  id: string;
  name: string;
  unit: string;
  quantity: number;
  unitPrice: number;
  note: string;
}

export interface ZhengdaoCabinetUnitInput {
  id: string;
  name: string;
  boardLines: ZhengdaoBoardLineInput[];
  processes: ZhengdaoProcessingInput[];
  hardwareItems: ZhengdaoHardwareInput[];
  customItems: ZhengdaoCustomItemInput[];
}

export interface ZhengdaoProjectInput {
  projectId: string;
  label?: string;
  vendor: ZhengdaoVendor;
  catalogVersion: ZhengdaoCatalogVersion;
  units: ZhengdaoCabinetUnitInput[];
}

export interface ZhengdaoBoardAddonResult {
  code: ZhengdaoBoardAddon;
  name: string;
  unit: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
}

export interface ZhengdaoBoardLineResult extends ZhengdaoBoardLineInput {
  actualCai: number;
  billableCai: number;
  materialSubtotal: number;
  addonResults: ZhengdaoBoardAddonResult[];
  addonSubtotal: number;
  subtotal: number;
}

export interface ZhengdaoProcessingResult extends ZhengdaoProcessingInput {
  billableQuantity: number;
  subtotal: number;
}

export interface ZhengdaoHardwareResult extends ZhengdaoHardwareInput {
  subtotal: number;
}

export interface ZhengdaoCustomItemResult extends ZhengdaoCustomItemInput {
  subtotal: number;
}

export interface ZhengdaoCabinetUnitResult {
  vendor: ZhengdaoVendor;
  catalogVersion: ZhengdaoCatalogVersion;
  unitId: string;
  unitName: string;
  input: ZhengdaoCabinetUnitInput;
  boardLines: ZhengdaoBoardLineResult[];
  processes: ZhengdaoProcessingResult[];
  hardwareItems: ZhengdaoHardwareResult[];
  customItems: ZhengdaoCustomItemResult[];
  materialTotal: number;
  processingTotal: number;
  hardwareTotal: number;
  customTotal: number;
  totalCost: number;
}

export interface ZhengdaoProjectResult {
  vendor: ZhengdaoVendor;
  catalogVersion: ZhengdaoCatalogVersion;
  unitResults: ZhengdaoCabinetUnitResult[];
  materialTotal: number;
  processingTotal: number;
  hardwareTotal: number;
  customTotal: number;
  projectTotal: number;
}
