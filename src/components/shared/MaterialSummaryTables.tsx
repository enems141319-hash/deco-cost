import { cn, formatCurrency, formatNumber } from "@/lib/utils";
import type { MaterialCaiTotal, MaterialSummaryRow } from "@/lib/calculations/material-summary";

function formatQuantity(quantity: number | null): string {
  if (quantity === null) return "-";
  return Number.isInteger(quantity) ? formatNumber(quantity, 0) : formatNumber(quantity, 2);
}

function rowClassName(row: MaterialSummaryRow, index: number, rows: MaterialSummaryRow[]): string {
  const previous = rows[index - 1];
  const startsNewItem = index > 0 && row.kind !== "process" && previous?.kind !== "process";
  return [
    row.kind === "process" ? "border-b border-slate-100 bg-background" : "border-b border-slate-200 bg-muted/10",
    startsNewItem ? "border-t-2 border-t-slate-300" : "border-t border-slate-200",
  ].filter(Boolean).join(" ");
}

function materialDisplayIndex(rows: MaterialSummaryRow[], rowIndex: number, sectionNumber?: number | string): string {
  const itemNumber = rows.slice(0, rowIndex + 1).filter((row) => row.kind !== "process").length;
  return sectionNumber ? `${sectionNumber}-${itemNumber}` : `${itemNumber}`;
}

function isMissingMaterialLabel(material: string): boolean {
  return material.includes("未選");
}

export function MaterialDetailTable({ rows, sectionNumber }: { rows: MaterialSummaryRow[]; sectionNumber?: number | string }) {
  return (
    <>
    <div className="space-y-2 sm:hidden">
      {rows.map((row, index) => {
        const isProcess = row.kind === "process";
        const processSecondaryText = materialProcessDetailSecondaryText(row);
        return (
          <div
            key={row.id}
            className={cn(
              "rounded-md border bg-background px-3 py-3",
              isProcess && "ml-4 border-slate-200 bg-muted/20",
            )}
          >
            {isProcess ? (
              <div>
                <p className="text-xs font-medium text-muted-foreground">- {row.itemName}</p>
                {processSecondaryText && (
                  <p className="mt-0.5 break-words text-xs text-muted-foreground">{processSecondaryText}</p>
                )}
              </div>
            ) : (
              <div className="space-y-2">
                <div>
                  <div className="flex min-w-0 flex-wrap items-baseline gap-1.5">
                    <span className="shrink-0 text-sm font-semibold text-blue-700">{materialDisplayIndex(rows, index, sectionNumber)}</span>
                    <span className="min-w-0 break-words text-sm font-semibold text-slate-950">{row.itemName}</span>
                  </div>
                  <p className={cn("mt-1 break-words text-sm font-medium text-slate-800", isMissingMaterialLabel(row.material) && "text-destructive")}>
                    {row.material}
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-xs">
                  <span className="text-muted-foreground">尺寸</span>
                  <span className="text-right tabular-nums">{row.size}</span>
                  <span className="text-muted-foreground">數量</span>
                  <span className="text-right tabular-nums">{formatQuantity(row.quantity)}</span>
                  <span className="text-muted-foreground">才數</span>
                  <span className="text-right tabular-nums">{row.caiLabel}</span>
                  <span className="text-muted-foreground">單價</span>
                  <span className="text-right tabular-nums">{row.unitPrice !== null ? formatCurrency(row.unitPrice) : "-"}</span>
                  <span className="font-medium text-muted-foreground">小計</span>
                  <span className="text-right font-semibold tabular-nums">{row.subtotal !== null ? formatCurrency(row.subtotal) : "-"}</span>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
    <div className="hidden max-w-full overflow-x-auto rounded-md border sm:block">
      <table className="cabinet-board-table w-full min-w-[780px] table-fixed text-sm">
        <colgroup>
          <col className="cabinet-name-col w-[38%]" />
          <col className="cabinet-size-col w-[130px]" />
          <col className="cabinet-qty-col w-[64px]" />
          <col className="cabinet-area-col w-[92px]" />
          <col className="cabinet-price-col w-[104px]" />
          <col className="cabinet-subtotal-col w-[104px]" />
        </colgroup>
        <thead className="bg-muted/40">
          <tr className="border-b">
            <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground">名稱 / 材料</th>
            <th className="px-3 py-2 text-right text-xs font-medium text-muted-foreground">尺寸</th>
            <th className="px-3 py-2 text-right text-xs font-medium text-muted-foreground">數量</th>
            <th className="px-3 py-2 text-right text-xs font-medium text-muted-foreground">才數</th>
            <th className="px-3 py-2 text-right text-xs font-medium text-muted-foreground">單價</th>
            <th className="px-3 py-2 text-right text-xs font-medium text-muted-foreground">小計</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => {
            const isProcess = row.kind === "process";
            const processSecondaryText = materialProcessDetailSecondaryText(row);
            return (
              <tr key={row.id} className={rowClassName(row, index, rows)}>
                <td className={`px-3 py-2 align-top ${isProcess ? "pl-7" : ""}`}>
                  {isProcess ? (
                    <>
                      <div className="cabinet-process-label text-xs font-medium text-muted-foreground">- {row.itemName}</div>
                      {processSecondaryText && (
                        <div className="cabinet-secondary-text break-words text-xs text-muted-foreground">{processSecondaryText}</div>
                      )}
                    </>
                  ) : (
                    <div className="cabinet-board-name-cell min-w-0 space-y-1">
                      <div className="flex min-w-0 flex-wrap items-baseline gap-1.5">
                        <span className="cabinet-board-index shrink-0 text-sm font-semibold text-blue-700">{materialDisplayIndex(rows, index, sectionNumber)}</span>
                        <span className="cabinet-board-title min-w-0 break-words text-sm font-semibold text-slate-950">{row.itemName}</span>
                      </div>
                      <div className={cn("cabinet-board-material break-words text-sm font-medium text-slate-800", isMissingMaterialLabel(row.material) && "text-destructive")}>{row.material}</div>
                    </div>
                  )}
                </td>
                <td className="px-3 py-2 text-right align-top tabular-nums whitespace-nowrap text-muted-foreground">{isProcess ? "-" : row.size}</td>
                <td className="px-3 py-2 text-right align-top tabular-nums whitespace-nowrap">{formatQuantity(row.quantity)}</td>
                <td className="px-3 py-2 text-right align-top tabular-nums whitespace-nowrap text-muted-foreground">{row.caiLabel}</td>
                <td className="px-3 py-2 text-right align-top tabular-nums whitespace-nowrap text-muted-foreground">
                  {row.unitPrice !== null ? formatCurrency(row.unitPrice) : "-"}
                </td>
                <td className="px-3 py-2 text-right align-top font-semibold tabular-nums whitespace-nowrap">
                  {row.subtotal !== null ? formatCurrency(row.subtotal) : "-"}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
    </>
  );
}

export function materialProcessDetailSecondaryText(row: MaterialSummaryRow): string | null {
  if (row.kind !== "process") return null;
  if (!row.note || row.note === "-" || row.note === row.itemName) return null;
  return row.note;
}

export function MaterialCaiTotalsTable({ rows }: { rows: MaterialCaiTotal[] }) {
  if (rows.length === 0) return <p className="text-xs text-muted-foreground">沒有板材才數</p>;
  return (
    <div className="max-w-full overflow-x-auto rounded-md border">
      <table className="w-full min-w-[360px] text-xs">
        <thead className="bg-muted/30 text-muted-foreground">
          <tr className="border-b">
            <th className="px-3 py-2 text-left font-medium">材料 / 規格</th>
            <th className="px-3 py-2 text-right font-medium">才數總和</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.materialId} className="border-b border-muted/40">
              <td className="px-3 py-2 text-muted-foreground">{row.materialName}</td>
              <td className="px-3 py-2 text-right tabular-nums">{formatNumber(row.cai, 2)}才</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function HardwareTotalsTable({ rows }: { rows: MaterialSummaryRow[] }) {
  if (rows.length === 0) return <p className="text-xs text-muted-foreground">沒有五金配件</p>;
  return (
    <div className="max-w-full overflow-x-auto rounded-md border">
      <table className="w-full min-w-[520px] text-xs">
        <thead className="bg-muted/30 text-muted-foreground">
          <tr className="border-b">
            <th className="px-3 py-2 text-left font-medium">五金 / 品項</th>
            <th className="px-3 py-2 text-left font-medium">材料 / 規格</th>
            <th className="px-3 py-2 text-right font-medium">數量</th>
            <th className="px-3 py-2 text-right font-medium">單價</th>
            <th className="px-3 py-2 text-right font-medium">小計</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.id} className="border-b border-muted/40">
              <td className="px-3 py-2 font-medium">{row.itemName}</td>
              <td className="px-3 py-2 text-muted-foreground">{row.material}</td>
              <td className="px-3 py-2 text-right tabular-nums">{formatQuantity(row.quantity)}</td>
              <td className="px-3 py-2 text-right tabular-nums text-muted-foreground">
                {row.unitPrice !== null ? formatCurrency(row.unitPrice) : "-"}
              </td>
              <td className="px-3 py-2 text-right font-semibold tabular-nums">
                {row.subtotal !== null ? formatCurrency(row.subtotal) : "-"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function ProcessingTotalsTable({ rows }: { rows: MaterialSummaryRow[] }) {
  if (rows.length === 0) return <p className="text-xs text-muted-foreground">沒有加工項目</p>;
  return (
    <div className="max-w-full overflow-x-auto rounded-md border">
      <table className="w-full min-w-[520px] text-xs">
        <thead className="bg-muted/30 text-muted-foreground">
            <tr className="border-b">
              <th className="px-3 py-2 text-left font-medium">部件 / 品項</th>
              <th className="px-3 py-2 text-left font-medium">材料 / 規格</th>
              <th className="px-3 py-2 text-left font-medium">加工內容</th>
              <th className="px-3 py-2 text-right font-medium">金額</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.id} className="border-b border-muted/40">
              <td className="px-3 py-2 font-medium">{row.sourceItemName ?? row.itemName}</td>
              <td className="px-3 py-2 text-muted-foreground">{row.sourceMaterial ?? row.material}</td>
              <td className="px-3 py-2 text-muted-foreground">{row.note}</td>
              <td className="px-3 py-2 text-right font-semibold tabular-nums">
                {row.subtotal !== null ? formatCurrency(row.subtotal) : "-"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function rowSubtotal(row: MaterialSummaryRow): number {
  return row.subtotal ?? 0;
}

function isBackingMaterialRow(row: MaterialSummaryRow): boolean {
  return row.kind !== "process" && (
    row.category.includes("背板") ||
    row.itemName.includes("背板") ||
    row.material.includes("背板")
  );
}

function materialRowsTotal(rows: MaterialSummaryRow[], backing: boolean): number {
  return rows
    .filter((row) => (row.kind === "material" || row.kind === "accessory") && isBackingMaterialRow(row) === backing)
    .reduce((sum, row) => sum + rowSubtotal(row), 0);
}

function rowsSubtotal(rows: MaterialSummaryRow[]): number {
  return rows.reduce((sum, row) => sum + rowSubtotal(row), 0);
}

export function SummaryCostBreakdown({
  rows,
  hardwareRows,
  processRows,
  total,
}: {
  rows: MaterialSummaryRow[];
  hardwareRows: MaterialSummaryRow[];
  processRows: MaterialSummaryRow[];
  total: number;
}) {
  const bodyMaterialTotal = materialRowsTotal(rows, false);
  const backingMaterialTotal = materialRowsTotal(rows, true);
  const hardwareTotal = rowsSubtotal(hardwareRows);
  const processingTotal = rowsSubtotal(processRows);

  return (
    <div className="rounded-md border bg-background px-3 py-3">
      <div className="space-y-1 border-y py-2 text-sm">
        {[
          ["櫃身板材", bodyMaterialTotal],
          ["背板", backingMaterialTotal],
          ["五金", hardwareTotal],
          ["加工費", processingTotal],
        ].map(([label, value]) => (
          <div key={label} className="flex items-baseline justify-between gap-4 text-muted-foreground">
            <span>{label}</span>
            <span className="tabular-nums">{formatCurrency(value as number)}</span>
          </div>
        ))}
      </div>
      <div className="mt-2 flex items-baseline justify-between gap-4 text-base font-bold">
        <span>總計</span>
        <span className="text-xl tabular-nums text-blue-600">{formatCurrency(total)}</span>
      </div>
    </div>
  );
}

export function SummaryTotalsBlock({
  rows,
  materialCaiTotals,
  hardwareRows,
  processRows,
  total,
  layout = "grid",
}: {
  rows: MaterialSummaryRow[];
  materialCaiTotals: MaterialCaiTotal[];
  hardwareRows: MaterialSummaryRow[];
  processRows: MaterialSummaryRow[];
  total: number;
  layout?: "grid" | "stacked";
}) {
  return (
    <div className="max-w-full space-y-3">
      <div className={layout === "stacked" ? "max-w-full space-y-4" : "grid max-w-full gap-3 xl:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]"}>
        <div className="min-w-0 space-y-1">
          <p className="text-xs font-medium text-muted-foreground">同板材才數總和(不考慮加工)</p>
          <MaterialCaiTotalsTable rows={materialCaiTotals} />
        </div>
        <div className="min-w-0 space-y-1">
          <p className="text-xs font-medium text-muted-foreground">五金總表</p>
          <HardwareTotalsTable rows={hardwareRows} />
        </div>
      </div>
      <div className="min-w-0 space-y-1">
        <p className="text-xs font-medium text-muted-foreground">總計</p>
        <SummaryCostBreakdown rows={rows} hardwareRows={hardwareRows} processRows={processRows} total={total} />
      </div>
    </div>
  );
}
