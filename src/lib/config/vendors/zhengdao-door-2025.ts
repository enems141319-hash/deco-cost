import type { MaterialRef, ZhengdaoDoorSelection, ZhengdaoDoorSelectionResult } from "@/types";

export interface ZhengdaoDoorCatalogOption {
  code: string;
  name: string;
  thicknessMm: number;
  pricePerCai: number;
  minCai: number;
  note: string;
}

export interface ZhengdaoDoorShapeOption {
  code: string;
  name: string;
  addonPerCai: number;
  minCai: number;
  note: string;
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
];

export const ZHENGDAO_FINISHED_DOORS: ZhengdaoDoorCatalogOption[] = [
  { code: "FR-ALUMINUM", name: "布拉革鋁封邊門板", thicknessMm: 19, pricePerCai: 1750, minCai: 5, note: "基本才 5 才；雙面同色；鉸鏈孔另計" },
  { code: "FR-ROUND-ALUMINUM", name: "布拉革鋁圓弧封邊門板", thicknessMm: 19, pricePerCai: 2000, minCai: 5, note: "基本才 5 才；門板長與寬須大於 120mm" },
  { code: "WR-4E", name: "WR 4E 水晶門板（五面）", thicknessMm: 18, pricePerCai: 340, minCai: 1, note: "基本才 1 才；底貼白 ABS 板" },
  { code: "GR-4E", name: "GR 4E 結晶門板（六面）", thicknessMm: 18, pricePerCai: 360, minCai: 1.5, note: "基本才 1.5 才" },
  { code: "GR-SLANT", name: "GR 斜背結晶門板（六面）", thicknessMm: 18, pricePerCai: 460, minCai: 2, note: "基本才 2 才；鉸鏈孔另計" },
  { code: "PF-8", name: "PF 4E／8 型彎曲門板", thicknessMm: 18, pricePerCai: 300, minCai: 1, note: "基本才 1 才；背面白 G 美耐板；同色系封邊" },
  { code: "BGD", name: "BGD 隔柵透氣門板", thicknessMm: 18, pricePerCai: 1000, minCai: 3, note: "基本才 3 才；價格以 JM、ER 為基準，其他系列另加價" },
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

const ALUMINUM_FRAME_PRICE: Record<NonNullable<ZhengdaoDoorSelection["frameColor"]>, number> = {
  ALUMINUM: 600,
  WHITE: 650,
  BLACK: 650,
};

function materialRef(code: string, name: string, thicknessMm: number, pricePerCai: number, minCai: number): MaterialRef {
  return {
    materialId: `zhengdao-door-${code}`,
    materialName: `${name} ${thicknessMm}mm`,
    unit: "才",
    pricePerUnit: pricePerCai,
    minCai,
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
    if (!option) return null;
    return { selection, materialRef: materialRef(option.code, option.name, option.thicknessMm, option.pricePerCai, option.minCai), note: option.note };
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

  const frameColor = selection.frameColor ?? "ALUMINUM";
  const colorLabel = frameColor === "ALUMINUM" ? "鋁色" : frameColor === "WHITE" ? "白色" : "黑色";
  return {
    selection: { ...selection, frameColor },
    materialRef: materialRef(`HB-${frameColor}`, `HB 鋁框懸吊門（${colorLabel}）`, 20, ALUMINUM_FRAME_PRICE[frameColor], 10),
    note: "基本 10 才；五金補貼、分隔、軌道、緩衝器與特殊中肚板尚未計入",
  };
}
