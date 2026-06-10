import assert from "node:assert/strict";
import { zhengdaoProjectInputSchema } from "./zhengdao";

const baseInput = {
  projectId: "project-1",
  label: "正道測試",
  vendor: "ZHENGDAO",
  catalogVersion: "2025",
  units: [{
    id: "unit-1",
    name: "客廳櫃",
    boardLines: [],
    processes: [],
    hardwareItems: [],
    customItems: [],
  }],
};

assert.equal(zhengdaoProjectInputSchema.safeParse(baseInput).success, true);

assert.equal(zhengdaoProjectInputSchema.safeParse({
  ...baseInput,
  vendor: "WEIHO",
}).success, false);

assert.equal(zhengdaoProjectInputSchema.safeParse({
  ...baseInput,
  units: [{
    ...baseInput.units[0],
    boardLines: [{
      id: "board-1",
      name: "側板",
      usage: "BODY_BACK",
      widthCm: 60,
      heightCm: 240,
      quantity: 0,
      material: {
        vendorCode: "ER-18-BODY",
        name: "ER 18mm 桶身",
        unit: "才",
        pricePerUnit: 150,
        minCai: 1,
        series: "ER",
        thicknessMm: 18,
      },
      addons: [],
    }],
  }],
}).success, false);

assert.equal(zhengdaoProjectInputSchema.safeParse({
  ...baseInput,
  units: [{
    ...baseInput.units[0],
    customItems: [{
      id: "custom-1",
      name: "臨時加工",
      unit: "式",
      quantity: 1,
      unitPrice: -1,
      note: "",
    }],
  }],
}).success, false);

assert.equal(zhengdaoProjectInputSchema.safeParse({
  ...baseInput,
  units: [{
    ...baseInput.units[0],
    hardwareItems: [{
      id: "hardware-1",
      name: "鉸鍊",
      quantity: 2,
      material: {
        vendorCode: "",
        name: "BLUM 鉸鍊",
        unit: "個",
        pricePerUnit: 100,
      },
    }],
  }],
}).success, false);

console.log("zhengdao validation tests passed");
