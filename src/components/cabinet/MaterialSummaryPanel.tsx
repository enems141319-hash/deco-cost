"use client";

import { calculateCabinetProject } from "@/lib/calculations/cabinet";
import { buildCabinetProjectMaterialSummary } from "@/lib/calculations/material-summary";
import { formatCurrency } from "@/lib/utils";
import {
  MaterialDetailTable,
  SummaryTotalsBlock,
} from "@/components/shared/MaterialSummaryTables";
import type { MaterialSummaryRow } from "@/lib/calculations/material-summary";
import type { CabinetUnitInput } from "@/types";

interface Props {
  units: CabinetUnitInput[];
}

function isDoorSummaryRow(row: MaterialSummaryRow): boolean {
  return row.category === "門片" || row.category === "門片加工" || row.category === "門片五金";
}

function isDrawerSummaryRow(row: MaterialSummaryRow): boolean {
  return row.category === "抽屜板材" || row.category === "抽屜加工" || row.category === "抽屜五金";
}

export function MaterialSummaryPanel({ units }: Props) {
  const summary = buildCabinetProjectMaterialSummary(calculateCabinetProject(units), units);
  const rowCount = summary.unitSummaries.reduce((acc, unit) => acc + unit.rows.length, 0);

  if (rowCount === 0) {
    return (
      <div className="rounded border bg-muted/20 p-4 text-sm text-muted-foreground">
        尚未有可統整的材料或五金。
      </div>
    );
  }

  return (
    <div className="min-w-0 rounded border">
      <div className="flex items-center justify-between border-b px-4 py-3">
        <div>
          <h3 className="text-sm font-semibold">材料統整表</h3>
          <p className="mt-1 text-xs text-muted-foreground">
            詳列各桶身板件、門片加工、五金與金額。
          </p>
        </div>
        <div className="text-right">
          <p className="text-xs text-muted-foreground">{rowCount} 筆明細</p>
          <p className="font-semibold text-primary">{formatCurrency(summary.total)}</p>
        </div>
      </div>

      <div className="min-w-0 space-y-6 p-4">
        {summary.unitSummaries.map((unit) => {
          const input = units.find((item) => item.id === unit.unitId);
          const bodyRows = unit.rows.filter((row) => !isDoorSummaryRow(row) && !isDrawerSummaryRow(row));
          const drawerRows = unit.rows.filter(isDrawerSummaryRow);
          const doorRows = unit.rows.filter(isDoorSummaryRow);
          return (
            <section key={unit.unitId} className="min-w-0 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h4 className="text-sm font-semibold">{unit.unitName}</h4>
                  {input && (
                    <p className="text-xs text-muted-foreground">
                      {input.widthCm} x {input.depthCm} x {input.heightCm} cm · 數量 {input.quantity}
                    </p>
                  )}
                </div>
                <div className="text-sm font-semibold">{formatCurrency(unit.total)}</div>
              </div>
              {bodyRows.length > 0 && (
                <div className="min-w-0 space-y-1">
                  <p className="text-xs font-medium text-muted-foreground">桶身 / 背板 / 內部構件</p>
                  <MaterialDetailTable rows={bodyRows} />
                </div>
              )}
              {drawerRows.length > 0 && (
                <div className="min-w-0 space-y-1">
                  <p className="text-xs font-medium text-muted-foreground">抽屜 / 抽屜加工 / 抽屜五金</p>
                  <MaterialDetailTable rows={drawerRows} />
                </div>
              )}
              {doorRows.length > 0 && (
                <div className="min-w-0 space-y-1">
                  <p className="text-xs font-medium text-muted-foreground">門片 / 門片加工 / 門片五金</p>
                  <MaterialDetailTable rows={doorRows} />
                </div>
              )}
              <SummaryTotalsBlock
                materialCaiTotals={unit.materialCaiTotals}
                hardwareRows={unit.hardwareRows}
                processRows={unit.processRows}
              />
            </section>
          );
        })}

        <section className="min-w-0 space-y-3 border-t pt-4">
          <div className="flex items-center justify-between gap-3">
            <h4 className="text-sm font-semibold">本專案統整</h4>
            <span className="text-sm font-semibold text-primary">{formatCurrency(summary.total)}</span>
          </div>
          <SummaryTotalsBlock
            materialCaiTotals={summary.materialCaiTotals}
            hardwareRows={summary.hardwareRows}
            processRows={summary.processRows}
          />
        </section>
      </div>
    </div>
  );
}
