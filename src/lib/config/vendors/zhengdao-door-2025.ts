import type { MaterialRef, ZhengdaoDoorMaterialTier, ZhengdaoDoorSelection, ZhengdaoDoorSelectionResult } from "@/types";

export interface ZhengdaoDoorCatalogOption {
  code: string;
  name: string;
  thicknessMm: number;
  pricePerCai: number;
  minCai: number;
  note: string;
  usageLabel?: string;
}

export interface ZhengdaoTieredDoorCatalogOption {
  code: string;
  name: string;
  thicknessMm: number;
  basePricePerCai: number;
  minCai: number;
  note: string;
  tierAddons: Record<ZhengdaoDoorMaterialTier, number>;
}

export interface ZhengdaoDoorShapeOption {
  code: string;
  name: string;
  addonPerCai: number;
  minCai: number;
  note: string;
}

export type ZhengdaoDoorCatalogCategoryCode =
  | "FLAT_DOOR"
  | "BRAGG"
  | "WR_CRYSTAL"
  | "GR_CRYSTAL_BAKE"
  | "LOUVER"
  | "ROUND_LOUVER"
  | "FRAME"
  | "GLASS_FRAME"
  | "GLASS_FRAME_GRILLE"
  | "RECTANGLE_GRILLE"
  | "SLIM_FRAME"
  | "DIMENSIONAL_FRAME"
  | "VINTAGE_FRAME"
  | "COUNTRY_FRAME"
  | "SP_SPLICE"
  | "SPLICE_FRAME"
  | "FRAME_PERFORATED"
  | "FRAME_HONEYCOMB"
  | "RATTAN"
  | "GD_GRILLE";

export interface ZhengdaoDoorCatalogCategory {
  code: ZhengdaoDoorCatalogCategoryCode;
  label: string;
  page: string;
  mode: "FLAT" | "FINISHED";
  options: ZhengdaoDoorCatalogOption[];
  tieredOptions?: ZhengdaoTieredDoorCatalogOption[];
}

export interface ZhengdaoFlatDoorOptionGroup {
  series: string;
  options: ZhengdaoDoorCatalogOption[];
}

export const ZHENGDAO_FLAT_DOORS: ZhengdaoDoorCatalogOption[] = [
  { code: "ER928", name: "ER928 平板門板", thicknessMm: 18, pricePerCai: 150, minCai: 1, note: "18mm，基本才 1 才" },
  { code: "JM", name: "JM 平板門板", thicknessMm: 18, pricePerCai: 150, minCai: 1, note: "18mm，基本才 1 才" },
  { code: "ER", name: "ER 平板門板", thicknessMm: 18, pricePerCai: 170, minCai: 1, note: "18mm，基本才 1 才" },
  { code: "AR", name: "AR 平板門板", thicknessMm: 18, pricePerCai: 210, minCai: 1, note: "18mm，基本才 1 才" },
  { code: "MR", name: "MR 平板門板", thicknessMm: 19, pricePerCai: 320, minCai: 2, note: "19mm，基本才 2 才" },
  { code: "PR", name: "PR 平板門板", thicknessMm: 19, pricePerCai: 560, minCai: 2, note: "19mm，基本才 2 才" },
  { code: "HWR", name: "HWR 平板門板", thicknessMm: 18, pricePerCai: 320, minCai: 2, note: "18mm，基本才 2 才" },
  { code: "HR", name: "HR 平板門板", thicknessMm: 18, pricePerCai: 470, minCai: 2, note: "18mm，基本才 2 才" },
  { code: "ER928-25-PVC", name: "ER928 平板門板 25mm 封PVC", thicknessMm: 25, pricePerCai: 170, minCai: 2, note: "25mm 封PVC，基本才 2 才" },
  { code: "ER928-25-ABS", name: "ER928 平板門板 25mm 封ABS（門板 / 櫃面）", thicknessMm: 25, pricePerCai: 180, minCai: 2, note: "25mm 封ABS，門板 / 櫃面用，基本才 2 才", usageLabel: "門板 / 櫃面" },
  { code: "ER928-50-ABS", name: "ER928 平板門板 50mm 封ABS", thicknessMm: 50, pricePerCai: 420, minCai: 3, note: "50mm 封ABS，基本才 3 才" },
  { code: "JM-25-PVC", name: "JM 平板門板 25mm 封PVC", thicknessMm: 25, pricePerCai: 170, minCai: 2, note: "25mm 封PVC，基本才 2 才" },
  { code: "JM-25-ABS", name: "JM 平板門板 25mm 封ABS（門板 / 櫃面）", thicknessMm: 25, pricePerCai: 180, minCai: 2, note: "25mm 封ABS，門板 / 櫃面用，基本才 2 才", usageLabel: "門板 / 櫃面" },
  { code: "JM-50-ABS", name: "JM 平板門板 50mm 封ABS", thicknessMm: 50, pricePerCai: 420, minCai: 3, note: "50mm 封ABS，基本才 3 才" },
  { code: "ER-25-PVC", name: "ER 平板門板 25mm 封PVC", thicknessMm: 25, pricePerCai: 210, minCai: 2, note: "25mm 封PVC，基本才 2 才" },
  { code: "ER-25-ABS", name: "ER 平板門板 25mm 封ABS（門板 / 櫃面）", thicknessMm: 25, pricePerCai: 220, minCai: 2, note: "25mm 封ABS，門板 / 櫃面用，基本才 2 才", usageLabel: "門板 / 櫃面" },
  { code: "ER-50-ABS", name: "ER 平板門板 50mm 封ABS", thicknessMm: 50, pricePerCai: 500, minCai: 3, note: "50mm 封ABS，基本才 3 才" },
  { code: "AR-25-PVC", name: "AR 平板門板 25mm 封PVC", thicknessMm: 25, pricePerCai: 240, minCai: 2, note: "25mm 封PVC，基本才 2 才" },
  { code: "AR-25-ABS", name: "AR 平板門板 25mm 封ABS（門板 / 櫃面）", thicknessMm: 25, pricePerCai: 250, minCai: 2, note: "25mm 封ABS，門板 / 櫃面用，基本才 2 才", usageLabel: "門板 / 櫃面" },
  { code: "AR-50-ABS", name: "AR 平板門板 50mm 封ABS", thicknessMm: 50, pricePerCai: 600, minCai: 3, note: "50mm 封ABS，基本才 3 才" },
  { code: "MR-25-PVC", name: "MR 平板門板 25mm 封PVC", thicknessMm: 25, pricePerCai: 590, minCai: 2, note: "25mm 封PVC，基本才 2 才" },
  { code: "MR-25-ABS", name: "MR 平板門板 25mm 封ABS（門板 / 櫃面）", thicknessMm: 25, pricePerCai: 600, minCai: 2, note: "25mm 封ABS，門板 / 櫃面用，基本才 2 才", usageLabel: "門板 / 櫃面" },
  { code: "MR-50-ABS", name: "MR 平板門板 50mm 封ABS", thicknessMm: 50, pricePerCai: 800, minCai: 3, note: "50mm 封ABS，基本才 3 才" },
];

export function zhengdaoFlatDoorSeries(option: ZhengdaoDoorCatalogOption): string {
  return option.code.split("-")[0] ?? option.code;
}

function flatDoorSortValue(option: ZhengdaoDoorCatalogOption): number {
  if (option.thicknessMm === 25 && option.code.endsWith("-PVC")) return 25.1;
  if (option.thicknessMm === 25 && option.code.endsWith("-ABS")) return 25.2;
  return option.thicknessMm;
}

export function groupZhengdaoFlatDoorOptions(
  options: ZhengdaoDoorCatalogOption[],
): ZhengdaoFlatDoorOptionGroup[] {
  const groups = new Map<string, ZhengdaoDoorCatalogOption[]>();
  for (const option of options) {
    const series = zhengdaoFlatDoorSeries(option);
    groups.set(series, [...(groups.get(series) ?? []), option]);
  }

  return Array.from(groups.entries()).map(([series, rows]) => ({
    series,
    options: rows.sort((a, b) => flatDoorSortValue(a) - flatDoorSortValue(b)),
  }));
}

export const ZHENGDAO_FINISHED_DOORS: ZhengdaoDoorCatalogOption[] = [
  { code: "FR-ALUMINUM", name: "布拉革鋁封邊門板", thicknessMm: 19, pricePerCai: 1750, minCai: 5, note: "基本才 5 才；雙面同色；鉸鏈孔另計" },
  { code: "FR-ROUND-ALUMINUM", name: "布拉革鋁圓弧封邊門板", thicknessMm: 19, pricePerCai: 2000, minCai: 5, note: "基本才 5 才；門板長與寬須大於 120mm" },
  { code: "WR-4E", name: "WR 4E 水晶門板（五面）", thicknessMm: 18, pricePerCai: 340, minCai: 1, note: "基本才 1 才；底貼白 ABS 板" },
  { code: "GR-4E", name: "GR 4E 結晶門板（六面）", thicknessMm: 18, pricePerCai: 360, minCai: 1.5, note: "基本才 1.5 才" },
  { code: "GR-SLANT", name: "GR 斜背結晶門板（六面）", thicknessMm: 18, pricePerCai: 460, minCai: 2, note: "基本才 2 才；鉸鏈孔另計" },
  { code: "PF-8", name: "PF 4E／8 型彎曲門板", thicknessMm: 18, pricePerCai: 300, minCai: 1, note: "基本才 1 才；背面白 G 美耐板；同色系封邊" },
  { code: "GD", name: "GD 格柵門板", thicknessMm: 18, pricePerCai: 1200, minCai: 3, note: "P28；以上價格 JM、ER；AR +50/才，MR +200/才，PR +400/才；格外作法另計" },
];

export const ZHENGDAO_DOOR_MATERIAL_TIERS: Array<{
  code: ZhengdaoDoorMaterialTier;
  label: string;
  shortLabel: string;
}> = [
  { code: "JM_ER", label: "JM / ER 基準價", shortLabel: "JM / ER" },
  { code: "AR", label: "AR +50/才", shortLabel: "AR" },
  { code: "MR", label: "MR +200/才", shortLabel: "MR" },
  { code: "PR", label: "PR +400/才", shortLabel: "PR" },
];

const DEFAULT_TIER_ADDONS: Record<ZhengdaoDoorMaterialTier, number> = {
  JM_ER: 0,
  AR: 50,
  MR: 200,
  PR: 400,
};

export const ZHENGDAO_LOUVER_DOORS: ZhengdaoTieredDoorCatalogOption[] = [
  {
    code: "BY-LOUVER",
    name: "BY 百葉門板",
    thicknessMm: 18,
    basePricePerCai: 1200,
    minCai: 4,
    note: "P11；寬 70mm／厚 18mm；寬度 300-600mm，高度 1300mm 以下；不可做抽頭",
    tierAddons: DEFAULT_TIER_ADDONS,
  },
  {
    code: "BY-DOUBLE-LOUVER",
    name: "BY 雙區百葉門板",
    thicknessMm: 18,
    basePricePerCai: 1200,
    minCai: 4,
    note: "P11；寬 70mm／厚 18mm；寬度 300-600mm，高度 1301-2208mm，分二區",
    tierAddons: DEFAULT_TIER_ADDONS,
  },
];

export const ZHENGDAO_ROUND_LOUVER_DOORS: ZhengdaoTieredDoorCatalogOption[] = [
  {
    code: "ROUND-BY-LOUVER",
    name: "圓弧 BY 百葉門板",
    thicknessMm: 18,
    basePricePerCai: 1600,
    minCai: 4,
    note: "寬 70mm／厚 18mm；寬度 300-600mm，高度 1300mm 以下；不可做抽頭",
    tierAddons: DEFAULT_TIER_ADDONS,
  },
  {
    code: "ROUND-BY-DOUBLE-LOUVER",
    name: "圓弧雙區 BY 百葉門板",
    thicknessMm: 18,
    basePricePerCai: 1600,
    minCai: 4,
    note: "寬 70mm／厚 18mm；寬度 300-600mm，高度 1301-2208mm，分二區",
    tierAddons: DEFAULT_TIER_ADDONS,
  },
];

export const ZHENGDAO_FRAME_DOORS: ZhengdaoTieredDoorCatalogOption[] = [
  { code: "FRAME", name: "框型門板", thicknessMm: 18, basePricePerCai: 320, minCai: 3, note: "邊框寬 70mm／厚 18mm；高度 1300mm 以下", tierAddons: DEFAULT_TIER_ADDONS },
  { code: "DOUBLE-FRAME", name: "雙區框型門板", thicknessMm: 18, basePricePerCai: 320, minCai: 3, note: "邊框寬 70mm／厚 18mm；高度 1301-2208mm，分二區", tierAddons: DEFAULT_TIER_ADDONS },
];

export const ZHENGDAO_GLASS_FRAME_DOORS: ZhengdaoTieredDoorCatalogOption[] = [
  { code: "GLASS-H-FRAME", name: "玻璃 H 框型門板", thicknessMm: 18, basePricePerCai: 320, minCai: 3, note: "5mm 強化清玻璃；不可做抽頭", tierAddons: DEFAULT_TIER_ADDONS },
  { code: "GLASS-C-FRAME", name: "玻璃 C 框型門板", thicknessMm: 18, basePricePerCai: 340, minCai: 3, note: "5mm 強化清玻璃", tierAddons: DEFAULT_TIER_ADDONS },
  { code: "GLASS-FRAME", name: "玻璃框型門板", thicknessMm: 18, basePricePerCai: 360, minCai: 3, note: "5mm 強化清玻璃", tierAddons: DEFAULT_TIER_ADDONS },
  { code: "DOUBLE-GLASS-FRAME", name: "雙區玻璃框型門板", thicknessMm: 18, basePricePerCai: 360, minCai: 3, note: "5mm 強化清玻璃；高度 1301-2208mm，分二區", tierAddons: DEFAULT_TIER_ADDONS },
];

export const ZHENGDAO_GLASS_FRAME_GRILLE_DOORS: ZhengdaoTieredDoorCatalogOption[] = [
  { code: "GLASS-GRILLE-FRAME", name: "玻璃框型格柵門板", thicknessMm: 18, basePricePerCai: 1200, minCai: 4, note: "格柵條寬 18mm／高 12mm；5mm 強化清玻璃；不可做抽頭", tierAddons: DEFAULT_TIER_ADDONS },
  { code: "DOUBLE-GLASS-GRILLE-FRAME", name: "雙區玻璃框型格柵門板", thicknessMm: 18, basePricePerCai: 1200, minCai: 4, note: "格柵條寬 18mm／高 12mm；5mm 強化清玻璃；高度 741-1410mm，分二區", tierAddons: DEFAULT_TIER_ADDONS },
  { code: "MULTI-GLASS-GRILLE-FRAME", name: "多區玻璃框型格柵門板", thicknessMm: 18, basePricePerCai: 1200, minCai: 4, note: "格柵條寬 18mm／高 12mm；5mm 強化清玻璃；高度 1411-2208mm", tierAddons: DEFAULT_TIER_ADDONS },
];

export const ZHENGDAO_RECTANGLE_GRILLE_DOORS: ZhengdaoTieredDoorCatalogOption[] = [
  { code: "RECTANGLE-GRILLE", name: "口型格柵門板", thicknessMm: 18, basePricePerCai: 1200, minCai: 4, note: "格柵條寬 18mm／高 12mm；高度 250-740mm", tierAddons: DEFAULT_TIER_ADDONS },
  { code: "DOUBLE-RECTANGLE-GRILLE", name: "雙區口型格柵門板", thicknessMm: 18, basePricePerCai: 1200, minCai: 4, note: "格柵條寬 18mm／高 12mm；高度 741-1390mm，分二區", tierAddons: DEFAULT_TIER_ADDONS },
  { code: "MULTI-RECTANGLE-GRILLE", name: "多區口型格柵門板", thicknessMm: 18, basePricePerCai: 1200, minCai: 4, note: "格柵條寬 18mm／高 12mm；高度 1391-2208mm", tierAddons: DEFAULT_TIER_ADDONS },
];

export const ZHENGDAO_SLIM_FRAME_DOORS: ZhengdaoTieredDoorCatalogOption[] = [
  { code: "SLIM-FRAME", name: "細框框型門板", thicknessMm: 21, basePricePerCai: 360, minCai: 3, note: "邊框寬 8mm／厚 3mm；高度 1300mm 以下；搭配 GRASS 一般鉸鏈", tierAddons: DEFAULT_TIER_ADDONS },
  { code: "DOUBLE-SLIM-FRAME", name: "細框雙區框型門板", thicknessMm: 21, basePricePerCai: 360, minCai: 3, note: "邊框寬 8mm／厚 3mm；高度 1301-2208mm，分二區；搭配 GRASS 一般鉸鏈", tierAddons: DEFAULT_TIER_ADDONS },
];

export const ZHENGDAO_DIMENSIONAL_FRAME_DOORS: ZhengdaoTieredDoorCatalogOption[] = [
  { code: "DIMENSIONAL-FRAME", name: "立體框型門板", thicknessMm: 18, basePricePerCai: 400, minCai: 3, note: "雙層 70+9mm／厚 2.5mm；高度 1300mm 以下", tierAddons: DEFAULT_TIER_ADDONS },
  { code: "DOUBLE-DIMENSIONAL-FRAME", name: "立體雙區框型門板", thicknessMm: 18, basePricePerCai: 400, minCai: 3, note: "雙層 70+9mm／厚 2.5mm；高度 1301-2208mm，分二區", tierAddons: DEFAULT_TIER_ADDONS },
];

export const ZHENGDAO_VINTAGE_FRAME_DOORS: ZhengdaoTieredDoorCatalogOption[] = [
  { code: "VINTAGE-FRAME", name: "復古框型門板", thicknessMm: 18, basePricePerCai: 900, minCai: 3, note: "邊框寬 70mm／厚 18mm；高度 1300mm 以下", tierAddons: DEFAULT_TIER_ADDONS },
  { code: "DOUBLE-VINTAGE-FRAME", name: "復古雙區框型門板", thicknessMm: 18, basePricePerCai: 900, minCai: 5, note: "邊框寬 70mm／厚 18mm；高度 1301-2208mm，分二區，可分三區", tierAddons: DEFAULT_TIER_ADDONS },
];

export const ZHENGDAO_COUNTRY_FRAME_DOORS: ZhengdaoTieredDoorCatalogOption[] = [
  { code: "COUNTRY-A", name: "鄉村框型門板 A 型", thicknessMm: 18, basePricePerCai: 360, minCai: 3, note: "門框 70mm；斜板 50mm；高度 1300mm 以下", tierAddons: DEFAULT_TIER_ADDONS },
  { code: "COUNTRY-B", name: "鄉村框型門板 B 型", thicknessMm: 18, basePricePerCai: 360, minCai: 3, note: "門框 70mm；斜板 50mm；高度 1300mm 以下", tierAddons: DEFAULT_TIER_ADDONS },
  { code: "DOUBLE-COUNTRY-A", name: "雙框鄉村門板 A 型", thicknessMm: 18, basePricePerCai: 360, minCai: 3, note: "門框 70mm；斜板 50mm；高度 1301-2208mm，分二區", tierAddons: DEFAULT_TIER_ADDONS },
  { code: "DOUBLE-COUNTRY-B", name: "雙框鄉村門板 B 型", thicknessMm: 18, basePricePerCai: 360, minCai: 3, note: "門框 70mm；斜板 50mm；高度 1301-2208mm，分二區", tierAddons: DEFAULT_TIER_ADDONS },
];

export const ZHENGDAO_SP_SPLICE_DOORS: ZhengdaoTieredDoorCatalogOption[] = [
  { code: "SP-SPLICE", name: "SP 拼接門板", thicknessMm: 18, basePricePerCai: 400, minCai: 3, note: "拼條寬 >= 60mm／厚 18mm；限 ABS 封邊，可跳色封邊", tierAddons: DEFAULT_TIER_ADDONS },
];

export const ZHENGDAO_SPLICE_FRAME_DOORS: ZhengdaoTieredDoorCatalogOption[] = [
  { code: "SP-SPLICE-FRAME", name: "SP 拼接框型門板", thicknessMm: 18, basePricePerCai: 720, minCai: 3, note: "邊框寬 70mm／厚 18mm；拼條寬 60mm／厚 8mm；高度 1300mm 以下", tierAddons: DEFAULT_TIER_ADDONS },
  { code: "SP-DOUBLE-SPLICE-FRAME", name: "SP 拼接雙區框型門板", thicknessMm: 18, basePricePerCai: 720, minCai: 3, note: "邊框寬 70mm／厚 18mm；拼條寬 60mm／厚 8mm；高度 1301-2208mm，分二區", tierAddons: DEFAULT_TIER_ADDONS },
];

export const ZHENGDAO_FRAME_PERFORATED_DOORS: ZhengdaoTieredDoorCatalogOption[] = [
  { code: "PERFORATED-FRAME", name: "框型洞洞網孔門板", thicknessMm: 18, basePricePerCai: 800, minCai: 6, note: "烤漆鐵網孔距 9mm／孔徑 6mm；厚 1.6mm；黑、白", tierAddons: DEFAULT_TIER_ADDONS },
  { code: "DOUBLE-PERFORATED-FRAME", name: "雙區框型洞洞網孔門板", thicknessMm: 18, basePricePerCai: 800, minCai: 6, note: "烤漆鐵網孔距 9mm／孔徑 6mm；厚 1.6mm；黑、白", tierAddons: DEFAULT_TIER_ADDONS },
];

export const ZHENGDAO_FRAME_HONEYCOMB_DOORS: ZhengdaoTieredDoorCatalogOption[] = [
  { code: "HONEYCOMB-FRAME", name: "框型蜂巢網孔門板", thicknessMm: 18, basePricePerCai: 800, minCai: 6, note: "烤漆鐵網孔距 11mm／孔徑 8.5mm；厚 1.6mm；黑、白", tierAddons: DEFAULT_TIER_ADDONS },
  { code: "DOUBLE-HONEYCOMB-FRAME", name: "雙區框型蜂巢網孔門板", thicknessMm: 18, basePricePerCai: 800, minCai: 6, note: "烤漆鐵網孔距 11mm／孔徑 8.5mm；厚 1.6mm；黑、白", tierAddons: DEFAULT_TIER_ADDONS },
];

export const ZHENGDAO_RATTAN_DOORS: ZhengdaoTieredDoorCatalogOption[] = [
  { code: "RATTAN-FRAME", name: "框型藤編門板", thicknessMm: 18, basePricePerCai: 2200, minCai: 3, note: "天然藤編蜂巢網眼；每 600mm 加一根隱藏橫料", tierAddons: DEFAULT_TIER_ADDONS },
  { code: "DOUBLE-RATTAN-FRAME", name: "雙區框型藤編門板", thicknessMm: 18, basePricePerCai: 2200, minCai: 3, note: "天然藤編蜂巢網眼；每 600mm 加一根隱藏橫料", tierAddons: DEFAULT_TIER_ADDONS },
  { code: "HALF-ROUND-RATTAN", name: "半圓型藤編門板", thicknessMm: 18, basePricePerCai: 2200, minCai: 3, note: "天然藤編蜂巢網眼；面見寬 45mm；每 600mm 加一根隱藏橫料", tierAddons: DEFAULT_TIER_ADDONS },
  { code: "DOUBLE-HALF-ROUND-RATTAN", name: "雙區半圓型藤編門板", thicknessMm: 18, basePricePerCai: 2200, minCai: 3, note: "天然藤編蜂巢網眼；面見寬 45mm；每 600mm 加一根隱藏橫料", tierAddons: DEFAULT_TIER_ADDONS },
  { code: "ROUND-RATTAN", name: "圓弧型藤編門板", thicknessMm: 18, basePricePerCai: 2200, minCai: 3, note: "天然藤編蜂巢網眼；圓弧 R12mm；每 600mm 加一根隱藏橫料", tierAddons: DEFAULT_TIER_ADDONS },
  { code: "DOUBLE-ROUND-RATTAN", name: "雙區圓弧型藤編門板", thicknessMm: 18, basePricePerCai: 2200, minCai: 3, note: "天然藤編蜂巢網眼；圓弧 R12mm；每 600mm 加一根隱藏橫料", tierAddons: DEFAULT_TIER_ADDONS },
];

export const ZHENGDAO_GD_GRILLE_DOORS: ZhengdaoTieredDoorCatalogOption[] = [
  { code: "GD-GRILLE", name: "GD 格柵門板", thicknessMm: 18, basePricePerCai: 1200, minCai: 3, note: "基材厚 18mm；格柵條寬 18mm／高 12mm；型款 A/B/C；格柵可跳色另計", tierAddons: DEFAULT_TIER_ADDONS },
];

export const ZHENGDAO_TIERED_FINISHED_DOORS: ZhengdaoTieredDoorCatalogOption[] = [
  ...ZHENGDAO_LOUVER_DOORS,
  ...ZHENGDAO_ROUND_LOUVER_DOORS,
  ...ZHENGDAO_FRAME_DOORS,
  ...ZHENGDAO_GLASS_FRAME_DOORS,
  ...ZHENGDAO_GLASS_FRAME_GRILLE_DOORS,
  ...ZHENGDAO_RECTANGLE_GRILLE_DOORS,
  ...ZHENGDAO_SLIM_FRAME_DOORS,
  ...ZHENGDAO_DIMENSIONAL_FRAME_DOORS,
  ...ZHENGDAO_VINTAGE_FRAME_DOORS,
  ...ZHENGDAO_COUNTRY_FRAME_DOORS,
  ...ZHENGDAO_SP_SPLICE_DOORS,
  ...ZHENGDAO_SPLICE_FRAME_DOORS,
  ...ZHENGDAO_FRAME_PERFORATED_DOORS,
  ...ZHENGDAO_FRAME_HONEYCOMB_DOORS,
  ...ZHENGDAO_RATTAN_DOORS,
  ...ZHENGDAO_GD_GRILLE_DOORS,
];

const optionsByCode = (codes: string[]) => ZHENGDAO_FINISHED_DOORS.filter((option) => codes.includes(option.code));

export const ZHENGDAO_DOOR_CATALOG_CATEGORIES: ZhengdaoDoorCatalogCategory[] = [
  { code: "FLAT_DOOR", label: "1. 平板門", page: "P1", mode: "FLAT", options: ZHENGDAO_FLAT_DOORS },
  { code: "BRAGG", label: "2. 布拉革系列", page: "P2", mode: "FINISHED", options: optionsByCode(["FR-ALUMINUM", "FR-ROUND-ALUMINUM"]) },
  { code: "WR_CRYSTAL", label: "3. WR 水晶系列", page: "P3", mode: "FINISHED", options: optionsByCode(["WR-4E"]) },
  { code: "GR_CRYSTAL_BAKE", label: "4. GR 結晶鋼烤系列", page: "P4", mode: "FINISHED", options: optionsByCode(["GR-4E", "GR-SLANT"]) },
  { code: "LOUVER", label: "5. 百葉門板", page: "P11", mode: "FINISHED", options: [], tieredOptions: ZHENGDAO_LOUVER_DOORS },
  { code: "ROUND_LOUVER", label: "6. 圓弧百葉門板", page: "P12", mode: "FINISHED", options: [], tieredOptions: ZHENGDAO_ROUND_LOUVER_DOORS },
  { code: "FRAME", label: "7. 框形門板", page: "P13", mode: "FINISHED", options: [], tieredOptions: ZHENGDAO_FRAME_DOORS },
  { code: "GLASS_FRAME", label: "8. 玻璃框形門板", page: "P14", mode: "FINISHED", options: [], tieredOptions: ZHENGDAO_GLASS_FRAME_DOORS },
  { code: "GLASS_FRAME_GRILLE", label: "9. 玻璃框形格柵門板", page: "P15", mode: "FINISHED", options: [], tieredOptions: ZHENGDAO_GLASS_FRAME_GRILLE_DOORS },
  { code: "RECTANGLE_GRILLE", label: "10. 口型格柵門板", page: "P16", mode: "FINISHED", options: [], tieredOptions: ZHENGDAO_RECTANGLE_GRILLE_DOORS },
  { code: "SLIM_FRAME", label: "11. 細框框形門板", page: "P17", mode: "FINISHED", options: [], tieredOptions: ZHENGDAO_SLIM_FRAME_DOORS },
  { code: "DIMENSIONAL_FRAME", label: "12. 立體框形門板", page: "P18", mode: "FINISHED", options: [], tieredOptions: ZHENGDAO_DIMENSIONAL_FRAME_DOORS },
  { code: "VINTAGE_FRAME", label: "13. 復古框形門板", page: "P19", mode: "FINISHED", options: [], tieredOptions: ZHENGDAO_VINTAGE_FRAME_DOORS },
  { code: "COUNTRY_FRAME", label: "14. 鄉村框形門板", page: "P20", mode: "FINISHED", options: [], tieredOptions: ZHENGDAO_COUNTRY_FRAME_DOORS },
  { code: "SP_SPLICE", label: "15. SP 拼接門板", page: "P21", mode: "FINISHED", options: [], tieredOptions: ZHENGDAO_SP_SPLICE_DOORS },
  { code: "SPLICE_FRAME", label: "16. 拼接框形門板", page: "P22", mode: "FINISHED", options: [], tieredOptions: ZHENGDAO_SPLICE_FRAME_DOORS },
  { code: "FRAME_PERFORATED", label: "17. 框形洞洞網孔門板", page: "P23", mode: "FINISHED", options: [], tieredOptions: ZHENGDAO_FRAME_PERFORATED_DOORS },
  { code: "FRAME_HONEYCOMB", label: "18. 框形蜂巢網孔門板", page: "P24", mode: "FINISHED", options: [], tieredOptions: ZHENGDAO_FRAME_HONEYCOMB_DOORS },
  { code: "RATTAN", label: "19. 藤編門板", page: "P25-P27", mode: "FINISHED", options: [], tieredOptions: ZHENGDAO_RATTAN_DOORS },
  { code: "GD_GRILLE", label: "20. GD 格柵門板", page: "P28", mode: "FINISHED", options: [], tieredOptions: ZHENGDAO_GD_GRILLE_DOORS },
];

export const ZHENGDAO_SHAPED_BASE_DOORS = ZHENGDAO_FLAT_DOORS.filter((door) => door.thicknessMm === 18);

export const ZHENGDAO_DOOR_SHAPES: ZhengdaoDoorShapeOption[] = [
  { code: "SLANT", name: "斜背型門板", addonPerCai: 90, minCai: 2, note: "18mm，基本才 2 才" },
  { code: "SLANT-S", name: "斜背 S 型門板", addonPerCai: 140, minCai: 2, note: "18mm，基本才 2 才" },
  { code: "U", name: "U 型門板", addonPerCai: 140, minCai: 2, note: "18mm，基本才 2 才" },
  { code: "J", name: "J 型門板", addonPerCai: 140, minCai: 2, note: "18mm，基本才 2 才" },
  { code: "JU", name: "JU 型門板", addonPerCai: 280, minCai: 2, note: "18mm，基本才 2 才；委外加工，交期另確認" },
  { code: "JE", name: "JE 型門板", addonPerCai: 280, minCai: 2, note: "18mm，基本才 2 才；委外加工，交期另確認" },
];

export const ZHENGDAO_PARTITION_DOORS: ZhengdaoDoorCatalogOption[] = [
  {
    code: "GD",
    name: "GD 格柵門板",
    thicknessMm: 18,
    pricePerCai: 1200,
    minCai: 3,
    note: "隔間門／格柵門板；以上價格 JM、ER；AR +50/才，MR +200/才，PR +400/才；格外作法另計",
  },
  {
    code: "GW",
    name: "GW 格柵壁板／天花板",
    thicknessMm: 18,
    pricePerCai: 1200,
    minCai: 3,
    note: "隔間門／格柵壁板；以上價格 JM、ER；AR +50/才，MR +200/才，PR +400/才；格外作法另計",
  },
  {
    code: "BGD",
    name: "BGD 隔柵透氣門",
    thicknessMm: 18,
    pricePerCai: 1000,
    minCai: 3,
    note: "隔間門；以上價格 JM、ER；AR +50/才，MR +200/才，PR +400/才；格外作法另計",
  },
  {
    code: "H8-ALUMINUM",
    name: "H8 鋁框懸吊門（鋁色）",
    thicknessMm: 20,
    pricePerCai: 600,
    minCai: 10,
    note: "隔間門；基本 10 才；快拆雙向緩衝器與選配五金另計",
  },
  {
    code: "H8-BLACK",
    name: "H8 鋁框懸吊門（黑色）",
    thicknessMm: 20,
    pricePerCai: 650,
    minCai: 10,
    note: "隔間門；基本 10 才；快拆雙向緩衝器與選配五金另計",
  },
  {
    code: "H8-WHITE",
    name: "H8 鋁框懸吊門（白色）",
    thicknessMm: 20,
    pricePerCai: 650,
    minCai: 10,
    note: "隔間門；基本 10 才；快拆雙向緩衝器與選配五金另計",
  },
  {
    code: "S2-ALUMINUM",
    name: "S2 鋁框落地推拉門（鋁色）",
    thicknessMm: 20,
    pricePerCai: 550,
    minCai: 10,
    note: "隔間門；基本 10 才；五金另補貼 1600 元；緩衝器、軌道、分隔與選配五金另計",
  },
  {
    code: "S2-BLACK",
    name: "S2 鋁框落地推拉門（黑色）",
    thicknessMm: 20,
    pricePerCai: 580,
    minCai: 10,
    note: "隔間門；基本 10 才；五金另補貼 1600 元；緩衝器、軌道、分隔與選配五金另計",
  },
  {
    code: "S2-WHITE",
    name: "S2 鋁框落地推拉門（白色）",
    thicknessMm: 20,
    pricePerCai: 580,
    minCai: 10,
    note: "隔間門；基本 10 才；五金另補貼 1600 元；緩衝器、軌道、分隔與選配五金另計",
  },
];

function materialRef(code: string, name: string, thicknessMm: number, pricePerCai: number, minCai: number): MaterialRef {
  const materialName = name.includes(`${thicknessMm}mm`) ? name : `${name} ${thicknessMm}mm`;
  return {
    materialId: `zhengdao-door-${code}`,
    materialName,
    unit: "才",
    pricePerUnit: pricePerCai,
    minCai,
  };
}

export function resolveZhengdaoDoorTieredOption(
  option: ZhengdaoTieredDoorCatalogOption,
  materialTier: ZhengdaoDoorMaterialTier = "JM_ER",
): ZhengdaoDoorCatalogOption {
  const tier = ZHENGDAO_DOOR_MATERIAL_TIERS.find((row) => row.code === materialTier) ?? ZHENGDAO_DOOR_MATERIAL_TIERS[0];
  const addon = option.tierAddons[materialTier] ?? 0;
  return {
    code: `${option.code}-${tier.code}`,
    name: `${option.name}（${tier.shortLabel}）`,
    thicknessMm: option.thicknessMm,
    pricePerCai: option.basePricePerCai + addon,
    minCai: option.minCai,
    note: `${option.note}；以上價格 JM/ER，AR +50/才，MR +200/才，PR +400/才`,
  };
}

export function resolveZhengdaoDoorSelection(selection: ZhengdaoDoorSelection): ZhengdaoDoorSelectionResult | null {
  if (selection.mode === "FLAT") {
    const option = ZHENGDAO_FLAT_DOORS.find((row) => row.code === selection.optionCode);
    if (!option) return null;
    return { selection, materialRef: materialRef(option.code, option.name, option.thicknessMm, option.pricePerCai, option.minCai), note: option.note };
  }

  if (selection.mode === "FINISHED") {
    const option = ZHENGDAO_FINISHED_DOORS.find((row) => row.code === selection.optionCode);
    if (option) {
      return { selection, materialRef: materialRef(option.code, option.name, option.thicknessMm, option.pricePerCai, option.minCai), note: option.note };
    }

    const tieredOption = ZHENGDAO_TIERED_FINISHED_DOORS.find((row) => row.code === selection.optionCode);
    if (!tieredOption) return null;
    const resolvedOption = resolveZhengdaoDoorTieredOption(tieredOption, selection.materialTier);
    const resolvedSelection: ZhengdaoDoorSelection = {
      mode: "FINISHED",
      optionCode: tieredOption.code,
      materialTier: selection.materialTier ?? "JM_ER",
    };
    return {
      selection: resolvedSelection,
      materialRef: materialRef(
        resolvedOption.code,
        resolvedOption.name,
        resolvedOption.thicknessMm,
        resolvedOption.pricePerCai,
        resolvedOption.minCai,
      ),
      note: resolvedOption.note,
    };
  }

  if (selection.mode === "SHAPED") {
    const base = ZHENGDAO_SHAPED_BASE_DOORS.find((row) => row.code === selection.baseCode);
    const shape = ZHENGDAO_DOOR_SHAPES.find((row) => row.code === selection.optionCode);
    if (!base || !shape) return null;
    const minCai = Math.max(base.minCai, shape.minCai);
    const name = `${base.code} ${shape.name}`;
    return {
      selection,
      materialRef: materialRef(`${base.code}-${shape.code}`, name, base.thicknessMm, base.pricePerCai + shape.addonPerCai, minCai),
      note: `${base.name} ${base.pricePerCai} 元/才 + ${shape.name}加工 ${shape.addonPerCai} 元/才；${shape.note}`,
    };
  }

  if (selection.mode === "PARTITION_DOOR") {
    const option = ZHENGDAO_PARTITION_DOORS.find((row) => row.code === selection.optionCode);
    if (!option) return null;
    return { selection, materialRef: materialRef(option.code, option.name, option.thicknessMm, option.pricePerCai, option.minCai), note: option.note };
  }

  return null;
}
