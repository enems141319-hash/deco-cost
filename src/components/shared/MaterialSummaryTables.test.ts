import assert from "node:assert/strict";
import { materialProcessDetailSecondaryText } from "./MaterialSummaryTables";
import type { MaterialSummaryRow } from "@/lib/calculations/material-summary";

const processRow: MaterialSummaryRow = {
  id: "process-1",
  category: "門片加工",
  materialId: null,
  material: "加工費",
  sourceItemName: "左側門",
  itemName: "造型把手加工 Y5IA",
  quantity: 1,
  size: "-",
  cai: null,
  caiLabel: "-",
  note: "造型把手加工 Y5IA",
  unitPrice: 1500,
  subtotal: 1500,
  kind: "process",
};

assert.equal(materialProcessDetailSecondaryText(processRow), null);
assert.equal(materialProcessDetailSecondaryText({ ...processRow, note: "特殊說明" }), "特殊說明");

console.log("MaterialSummaryTables display tests passed");
