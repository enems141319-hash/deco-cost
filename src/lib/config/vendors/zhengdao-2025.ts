import type {
  ZhengdaoBoardAddon,
  ZhengdaoBoardSeries,
  ZhengdaoBoardThicknessMm,
  ZhengdaoBoardUsage,
} from "@/types/zhengdao";

export const ZHENGDAO_2025_CAI_CM2 = 918.09;
export const ZHENGDAO_2025_AREA_DECIMAL_PLACES = 4;
export const ZHENGDAO_2025_COST_DECIMAL_PLACES = 0;
export const ZHENGDAO_2025_HINGE_HOLE_UNIT_PRICE = 40;
export const ZHENGDAO_2025_HIDDEN_SHELF_BRACKET_HOLE_UNIT_PRICE = 400;
export const ZHENGDAO_2025_HIDDEN_SHELF_SCREW_HOLE_UNIT_PRICE = 100;

export interface ZhengdaoSupportedBoardCombination {
  usage: ZhengdaoBoardUsage;
  series: ZhengdaoBoardSeries;
  thicknessMm: ZhengdaoBoardThicknessMm;
}

export const ZHENGDAO_2025_SUPPORTED_BOARD_COMBINATIONS: ZhengdaoSupportedBoardCombination[] = [
  ...(["ER928", "JM", "ER", "AR", "HWR", "HR"] as const).flatMap((series) => [
    { usage: "BODY_BACK" as const, series, thicknessMm: 18 as const },
  ]),
  ...(["ER928", "JM", "ER", "AR"] as const).map((series) => ({
    usage: "BODY_BACK" as const,
    series,
    thicknessMm: 8 as const,
  })),
  { usage: "BODY_BACK", series: "HWR", thicknessMm: 3 },
  { usage: "BODY_BACK", series: "HR", thicknessMm: 3 },
  { usage: "BODY_BACK", series: "MR", thicknessMm: 19 },
  { usage: "BODY_BACK", series: "MR", thicknessMm: 9 },
  { usage: "BODY_BACK", series: "PR", thicknessMm: 9 },
  ...(["ER928", "JM", "ER", "AR", "HWR", "HR"] as const).map((series) => ({
    usage: "DOOR" as const,
    series,
    thicknessMm: 18 as const,
  })),
  { usage: "DOOR", series: "MR", thicknessMm: 19 },
  { usage: "DOOR", series: "PR", thicknessMm: 19 },
  ...(["ER928", "JM", "ER", "AR", "MR"] as const).flatMap((series) => [
    { usage: "DOOR_COUNTERTOP" as const, series, thicknessMm: 25 as const },
    { usage: "DOOR_COUNTERTOP" as const, series, thicknessMm: 50 as const },
  ]),
];

export interface ZhengdaoBoardAddonRule {
  code: ZhengdaoBoardAddon;
  name: string;
  unit: "才";
  unitPrice: number;
  minCai?: number;
  usages?: ZhengdaoBoardUsage[];
}

export const ZHENGDAO_2025_BOARD_ADDON_RULES: Record<ZhengdaoBoardAddon, ZhengdaoBoardAddonRule> = {
  FRONT_ABS: {
    code: "FRONT_ABS",
    name: "前封 ABS",
    unit: "才",
    unitPrice: 10,
    minCai: 1,
    usages: ["BODY_BACK"],
  },
  FRONT_BACK_ABS: {
    code: "FRONT_BACK_ABS",
    name: "前後封 ABS",
    unit: "才",
    unitPrice: 20,
    minCai: 1,
    usages: ["BODY_BACK"],
  },
  MIDDLE_DIVIDER_DOUBLE_DRILL: {
    code: "MIDDLE_DIVIDER_DOUBLE_DRILL",
    name: "中立板雙面排孔",
    unit: "才",
    unitPrice: 20,
    minCai: 1,
    usages: ["BODY_BACK"],
  },
  SHARED_SIDE_DOUBLE_DRILL_BACK_GROOVE: {
    code: "SHARED_SIDE_DOUBLE_DRILL_BACK_GROOVE",
    name: "共側板雙面排孔含洗背板溝",
    unit: "才",
    unitPrice: 20,
    minCai: 2,
    usages: ["BODY_BACK"],
  },
  L_SHAPED_BODY: {
    code: "L_SHAPED_BODY",
    name: "L 型桶身板",
    unit: "才",
    unitPrice: 50,
    minCai: 5,
    usages: ["BODY_BACK"],
  },
  SMALL_BODY_SIDE: {
    code: "SMALL_BODY_SIDE",
    name: "任一邊小於 100mm",
    unit: "才",
    unitPrice: 20,
    usages: ["BODY_BACK"],
  },
  DOOR_GRAIN_MATCH: {
    code: "DOOR_GRAIN_MATCH",
    name: "門板對紋",
    unit: "才",
    unitPrice: 80,
    minCai: 5,
    usages: ["DOOR"],
  },
  MR_DOOR_HORIZONTAL_GRAIN: {
    code: "MR_DOOR_HORIZONTAL_GRAIN",
    name: "MR 門板橫紋",
    unit: "才",
    unitPrice: 100,
    minCai: 5,
    usages: ["DOOR"],
  },
};

export function isZhengdaoBoardCombinationSupported(
  usage: ZhengdaoBoardUsage,
  series: ZhengdaoBoardSeries,
  thicknessMm: ZhengdaoBoardThicknessMm,
): boolean {
  return ZHENGDAO_2025_SUPPORTED_BOARD_COMBINATIONS.some((combination) => (
    combination.usage === usage &&
    combination.series === series &&
    combination.thicknessMm === thicknessMm
  ));
}

export function zhengdaoBoardAddonUnitPrice(addon: ZhengdaoBoardAddon, series: ZhengdaoBoardSeries): number {
  if (addon === "DOOR_GRAIN_MATCH" && series === "MR") return 100;
  return ZHENGDAO_2025_BOARD_ADDON_RULES[addon].unitPrice;
}
