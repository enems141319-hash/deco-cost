import { buildCabinetProjectMaterialSummary } from "@/lib/calculations/material-summary";
import { formatCurrency } from "@/lib/utils";
import {
  SummaryTotalsBlock,
} from "@/components/shared/MaterialSummaryTables";
import type {
  CabinetProjectResult,
  CabinetUnitInput,
} from "@/types";
import type {
  CabinetProjectMaterialSummary,
  MaterialCaiTotal,
  MaterialSummaryRow,
} from "@/lib/calculations/material-summary";

interface EstimateItemForBreakdown {
  id: string;
  label: string | null;
  moduleType: string;
  inputData: unknown;
  resultData: unknown;
  totalCost: unknown;
}

interface Props {
  items: EstimateItemForBreakdown[];
  grandTotal: number;
}

function isCabinetProjectResult(value: unknown): value is CabinetProjectResult {
  return typeof value === "object" && value !== null && "unitResults" in value && "projectTotal" in value;
}

function isCabinetUnitInputArray(value: unknown): value is CabinetUnitInput[] {
  return Array.isArray(value);
}

function mergeMaterialCaiTotals(rows: MaterialCaiTotal[]): MaterialCaiTotal[] {
  const map = new Map<string, MaterialCaiTotal>();
  for (const row of rows) {
    const existing = map.get(row.materialId);
    if (existing) {
      existing.cai += row.cai;
      continue;
    }
    map.set(row.materialId, { ...row });
  }
  return Array.from(map.values());
}

function mergeHardwareRows(rows: MaterialSummaryRow[]): MaterialSummaryRow[] {
  const map = new Map<string, MaterialSummaryRow>();
  for (const row of rows) {
    const key = [row.itemName, row.material, row.note, row.unitPrice].join("|");
    const existing = map.get(key);
    if (existing) {
      existing.quantity = (existing.quantity ?? 0) + (row.quantity ?? 0);
      existing.subtotal = (existing.subtotal ?? 0) + (row.subtotal ?? 0);
      continue;
    }
    map.set(key, { ...row, id: `project:${key}` });
  }
  return Array.from(map.values());
}

function combinedProjectSummary(summaries: CabinetProjectMaterialSummary[]) {
  const materialCaiTotals = mergeMaterialCaiTotals(summaries.flatMap((summary) => summary.materialCaiTotals));
  const hardwareRows = mergeHardwareRows(summaries.flatMap((summary) => summary.hardwareRows));
  const processingTotal = summaries.reduce((sum, summary) => sum + summary.processingTotal, 0);
  return { materialCaiTotals, hardwareRows, processingTotal };
}

export function ProjectCostBreakdown({ items, grandTotal }: Props) {
  const cabinetSummaries = items
    .map((item) => {
      const result = isCabinetProjectResult(item.resultData) ? item.resultData : null;
      const input = isCabinetUnitInputArray(item.inputData) ? item.inputData : [];
      if (item.moduleType !== "CABINET" || result === null) return null;
      return {
        id: item.id,
        label: item.label ?? "未命名估價",
        totalCost: Number(item.totalCost),
        summary: buildCabinetProjectMaterialSummary(result, input),
      };
    })
    .filter((item): item is {
      id: string;
      label: string;
      totalCost: number;
      summary: CabinetProjectMaterialSummary;
    } => item !== null);

  const projectSummary = combinedProjectSummary(cabinetSummaries.map((item) => item.summary));

  return (
    <div className="min-w-0 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-md border bg-muted/20 px-4 py-3">
        <div>
          <h3 className="text-sm font-semibold">本專案材料統整</h3>
          <p className="mt-1 text-xs text-muted-foreground">
            彙總本專案所有系統櫃估價的板材才數、五金與加工費。
          </p>
        </div>
        <div className="text-right">
          <p className="text-xs text-muted-foreground">專案總計</p>
          <p className="text-lg font-bold text-primary">{formatCurrency(grandTotal)}</p>
        </div>
      </div>
      <SummaryTotalsBlock
        materialCaiTotals={projectSummary.materialCaiTotals}
        hardwareRows={projectSummary.hardwareRows}
        processingTotal={projectSummary.processingTotal}
        layout="stacked"
      />
    </div>
  );
}
