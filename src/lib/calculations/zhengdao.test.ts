import assert from "node:assert/strict";
import {
  ZhengdaoCalculationError,
  calculateZhengdaoCabinetUnit,
  calculateZhengdaoProject,
} from "./zhengdao";
import type { ZhengdaoCabinetUnitInput } from "@/types/zhengdao";

function boardMaterial(overrides: Partial<ZhengdaoCabinetUnitInput["boardLines"][number]["material"]> = {}) {
  return {
    vendorCode: "ER-18-BODY",
    name: "ER 18mm 桶身",
    unit: "才",
    pricePerUnit: 150,
    minCai: 1,
    series: "ER" as const,
    thicknessMm: 18 as const,
    ...overrides,
  };
}

function baseUnit(overrides: Partial<ZhengdaoCabinetUnitInput> = {}): ZhengdaoCabinetUnitInput {
  return {
    id: "unit-1",
    name: "測試櫃",
    boardLines: [],
    processes: [],
    hardwareItems: [],
    customItems: [],
    ...overrides,
  };
}

const boardResult = calculateZhengdaoCabinetUnit(baseUnit({
  boardLines: [{
    id: "side",
    name: "側板",
    usage: "BODY_BACK",
    widthCm: 90,
    heightCm: 40,
    quantity: 2,
    material: boardMaterial(),
    addons: ["FRONT_ABS", "MIDDLE_DIVIDER_DOUBLE_DRILL"],
  }],
}));

assert.equal(boardResult.boardLines[0]?.actualCai, 7.8424);
assert.equal(boardResult.boardLines[0]?.billableCai, 7.8424);
assert.equal(boardResult.boardLines[0]?.materialSubtotal, 1176);
assert.equal(boardResult.boardLines[0]?.addonSubtotal, 235);
assert.equal(boardResult.materialTotal, 1176);
assert.equal(boardResult.processingTotal, 235);
assert.equal(boardResult.totalCost, 1411);

const minimumCaiResult = calculateZhengdaoCabinetUnit(baseUnit({
  boardLines: [{
    id: "small-mr-door",
    name: "MR 門片",
    usage: "DOOR",
    widthCm: 30,
    heightCm: 30,
    quantity: 2,
    material: boardMaterial({
      vendorCode: "MR-19-DOOR",
      name: "MR 19mm 門板",
      pricePerUnit: 320,
      minCai: 2,
      series: "MR",
      thicknessMm: 19,
    }),
    addons: ["DOOR_GRAIN_MATCH"],
  }],
}));

assert.equal(minimumCaiResult.boardLines[0]?.actualCai, 1.9606);
assert.equal(minimumCaiResult.boardLines[0]?.billableCai, 4);
assert.equal(minimumCaiResult.boardLines[0]?.materialSubtotal, 1280);
assert.equal(minimumCaiResult.boardLines[0]?.addonSubtotal, 500);

const backingResult = calculateZhengdaoCabinetUnit(baseUnit({
  boardLines: [{
    id: "backing",
    name: "8mm 背板",
    usage: "BODY_BACK",
    widthCm: 60,
    heightCm: 80,
    quantity: 1,
    material: boardMaterial({
      vendorCode: "ER-8-BACKING",
      name: "ER 8mm 背板",
      pricePerUnit: 110,
      series: "ER",
      thicknessMm: 8,
    }),
    addons: [],
  }],
}));

assert.equal(backingResult.boardLines[0]?.materialSubtotal, 575);

const otherRows = calculateZhengdaoCabinetUnit(baseUnit({
  boardLines: [{
    id: "door",
    name: "門片",
    usage: "DOOR",
    widthCm: 90,
    heightCm: 40,
    quantity: 1,
    material: boardMaterial({
      vendorCode: "ER-18-DOOR",
      name: "ER 18mm 門板",
      pricePerUnit: 170,
    }),
    addons: [],
  }],
  processes: [
    {
      id: "process-cai",
      name: "對紋",
      targetBoardLineId: "door",
      billingMode: "PER_CAI",
      unit: "才",
      quantity: 1,
      unitPrice: 80,
      minCai: 5,
    },
    {
      id: "process-formula",
      name: "造型加工",
      targetBoardLineId: "door",
      billingMode: "PER_ITEM",
      unit: "式",
      quantity: 1,
      unitPrice: 600,
    },
    {
      id: "process-hole",
      name: "鉸鍊孔",
      targetBoardLineId: "door",
      billingMode: "PER_ITEM",
      unit: "孔",
      quantity: 2,
      unitPrice: 40,
    },
    {
      id: "process-length",
      name: "指定洗溝",
      targetBoardLineId: "door",
      billingMode: "PER_10MM",
      unit: "10mm",
      quantity: 1,
      unitPrice: 20,
      lengthMm: 125,
    },
  ],
  hardwareItems: [{
    id: "hinge",
    name: "BLUM 鉸鍊",
    quantity: 3,
    material: {
      vendorCode: "BLUM-HINGE-1",
      name: "BLUM 鉸鍊",
      unit: "個",
      pricePerUnit: 120,
    },
  }],
  customItems: [{
    id: "custom",
    name: "臨時客製",
    unit: "式",
    quantity: 2,
    unitPrice: 350,
    note: "現場確認",
  }],
}));

assert.deepEqual(otherRows.processes.map((row) => row.subtotal), [400, 600, 80, 260]);
assert.equal(otherRows.hardwareItems[0]?.subtotal, 360);
assert.equal(otherRows.customItems[0]?.subtotal, 700);
assert.equal(otherRows.processingTotal, 1340);
assert.equal(otherRows.hardwareTotal, 360);
assert.equal(otherRows.customTotal, 700);

const project = calculateZhengdaoProject([boardResult.input, otherRows.input]);
assert.equal(project.unitResults.length, 2);
assert.equal(project.projectTotal, boardResult.totalCost + otherRows.totalCost);

assert.throws(
  () => calculateZhengdaoCabinetUnit(baseUnit({
    hardwareItems: [{
      id: "quote-required",
      name: "另洽五金",
      quantity: 1,
      material: {
        vendorCode: "QUOTE-REQUIRED",
        name: "另洽五金",
        unit: "組",
        pricePerUnit: 0,
        requiresQuote: true,
      },
    }],
  })),
  (error) => error instanceof ZhengdaoCalculationError && error.code === "QUOTE_REQUIRED",
);

assert.throws(
  () => calculateZhengdaoCabinetUnit(baseUnit({
    boardLines: [{
      id: "unsupported",
      name: "PR 19mm 桶身",
      usage: "BODY_BACK",
      widthCm: 60,
      heightCm: 80,
      quantity: 1,
      material: boardMaterial({
        vendorCode: "PR-19-BODY",
        name: "PR 19mm 桶身",
        series: "PR",
        thicknessMm: 19,
      }),
      addons: [],
    }],
  })),
  (error) => error instanceof ZhengdaoCalculationError && error.code === "UNSUPPORTED_BOARD_COMBINATION",
);

console.log("zhengdao calculation tests passed");
