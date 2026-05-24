import assert from "node:assert/strict";
import {
  PROJECT_MATERIAL_SUMMARY_PRINT_CSS,
  buildProjectMaterialSummaryGroups,
  combinedProjectSummary,
  projectUnitSectionPrefix,
  rowsTotal,
} from "./ProjectCostBreakdown";
import type { CabinetProjectMaterialSummary, MaterialSummaryRow } from "@/lib/calculations/material-summary";

function row(id: string, subtotal: number): MaterialSummaryRow {
  return {
    id,
    category: "板材",
    materialId: "m1",
    material: "EGGER 18mm",
    itemName: "側板",
    quantity: 1,
    size: "60 x 240 cm",
    cai: 1,
    caiLabel: "1.00才",
    note: "",
    unitPrice: 50,
    subtotal,
    kind: "material",
  };
}

function summary(label: string, unitId: string, subtotal: number): CabinetProjectMaterialSummary {
  const summaryRow = row(`${unitId}-row`, subtotal);
  return {
    unitSummaries: [{
      unitId,
      unitName: `${label}桶身`,
      rows: [summaryRow],
      materialCaiTotals: [{ materialId: "m1", materialName: "EGGER 18mm", cai: subtotal / 100 }],
      hardwareRows: [],
      processRows: [],
      hardwareTotal: 0,
      processingTotal: 0,
      total: subtotal,
    }],
    materialCaiTotals: [{ materialId: "m1", materialName: "EGGER 18mm", cai: subtotal / 100 }],
    hardwareRows: [],
    processRows: [],
    hardwareTotal: 0,
    processingTotal: 0,
    total: subtotal,
  };
}

const groups = buildProjectMaterialSummaryGroups([
  { id: "cab-1", label: "客廳", moduleType: "CABINET", totalCost: 1200, summary: summary("客廳", "u1", 1200) },
  { id: "ceil-1", label: "天花板", moduleType: "CEILING", totalCost: 300, summary: summary("天花板", "u2", 300) },
  { id: "cab-2", label: null, moduleType: "CABINET", totalCost: 800, summary: summary("未命名", "u3", 800) },
]);

assert.equal(groups.length, 2);
assert.equal(groups[0].label, "客廳");
assert.equal(groups[1].label, "未命名估價");
assert.equal(rowsTotal(groups[0].summary.unitSummaries[0].rows), 1200);

assert.equal(projectUnitSectionPrefix(1, 0), "1-1");
assert.equal(projectUnitSectionPrefix(2, 0), "2-1");
assert.equal(projectUnitSectionPrefix(2, 1), "2-2");

const combined = combinedProjectSummary(groups.map((group) => group.summary));
assert.equal(combined.rows.length, 2);
assert.equal(combined.materialCaiTotals[0].cai, 20);
assert.ok(PROJECT_MATERIAL_SUMMARY_PRINT_CSS.includes(".cabinet-board-table .cabinet-name-col"));
assert.ok(PROJECT_MATERIAL_SUMMARY_PRINT_CSS.includes("width: 45% !important"));
assert.ok(PROJECT_MATERIAL_SUMMARY_PRINT_CSS.includes("font-size: 10.5pt !important"));
assert.ok(PROJECT_MATERIAL_SUMMARY_PRINT_CSS.includes(".cabinet-process-label"));

console.log("ProjectCostBreakdown grouping tests passed");
