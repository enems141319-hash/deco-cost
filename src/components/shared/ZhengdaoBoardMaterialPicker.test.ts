import assert from "node:assert/strict";
import {
  filterZhengdaoBoardMaterials,
  groupZhengdaoBoardMaterials,
  zhengdaoBoardSpecLabel,
  type ZhengdaoBoardMaterialOption,
} from "./ZhengdaoBoardMaterialPicker";

const materials: ZhengdaoBoardMaterialOption[] = [
  {
    id: "er-18",
    name: "ER",
    spec: "18mm",
    unit: "才",
    price: 150,
    minCai: 1,
    category: "BOARD_BODY",
    brand: "正道",
    colorCode: null,
    surfaceTreatment: null,
    boardType: "18mm",
    vendorCode: "ZHENGDAO-BODY-ER-18",
    notes: "桶身前封 ABS 每才 +10 元",
    pricingMeta: { series: "ER", thicknessMm: 18, edgeMode: "NONE" },
  },
  {
    id: "er-8-abs",
    name: "ER",
    spec: "8mm 對 ABS",
    unit: "才",
    price: 160,
    minCai: 1,
    category: "BOARD_BODY",
    brand: "正道",
    colorCode: null,
    surfaceTreatment: null,
    boardType: "8mm 對 ABS",
    vendorCode: "ZHENGDAO-BODY-ER-8-ABS",
    notes: null,
    pricingMeta: { series: "ER", thicknessMm: 8, edgeMode: "ABS" },
  },
  {
    id: "mr-19",
    name: "MR",
    spec: "19mm",
    unit: "才",
    price: 300,
    minCai: 2,
    category: "BOARD_BODY",
    brand: "正道",
    colorCode: null,
    surfaceTreatment: null,
    boardType: "19mm",
    vendorCode: "ZHENGDAO-BODY-MR-19",
    notes: null,
    pricingMeta: { series: "MR", thicknessMm: 19, edgeMode: "NONE" },
  },
  {
    id: "mr-9",
    name: "MR",
    spec: "9mm",
    unit: "才",
    price: 260,
    minCai: 2,
    category: "BOARD_BACKING",
    brand: "正道",
    colorCode: null,
    surfaceTreatment: null,
    boardType: "9mm",
    vendorCode: "ZHENGDAO-BACK-MR-9",
    notes: null,
    pricingMeta: { series: "MR", thicknessMm: 9, edgeMode: "NONE" },
  },
  {
    id: "pr-9-abs",
    name: "PR",
    spec: "9mm 對 ABS",
    unit: "才",
    price: 540,
    minCai: 2,
    category: "BOARD_BACKING",
    brand: "正道",
    colorCode: null,
    surfaceTreatment: null,
    boardType: "9mm 對 ABS",
    vendorCode: "ZHENGDAO-BACK-PR-9-ABS",
    notes: null,
    pricingMeta: { series: "PR", thicknessMm: 9, edgeMode: "ABS" },
  },
];

const groups = groupZhengdaoBoardMaterials(materials);
assert.deepEqual(groups.map((group) => group.series), ["ER", "MR", "PR"]);
assert.equal(groups[0]?.materials.length, 2);
assert.equal(zhengdaoBoardSpecLabel(materials[0]), "18mm");
assert.equal(zhengdaoBoardSpecLabel(materials[1]), "8mm / 對 ABS");
assert.deepEqual(
  filterZhengdaoBoardMaterials(materials, "BOARD_BODY").map((material) => material.id),
  ["er-18", "mr-19"],
);
assert.deepEqual(
  filterZhengdaoBoardMaterials(materials, "BOARD_BACKING").map((material) => material.id),
  ["er-8-abs", "mr-9", "pr-9-abs"],
);

console.log("ZhengdaoBoardMaterialPicker tests passed");
