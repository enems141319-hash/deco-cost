import { formatCurrency, formatNumber } from "@/lib/utils";
import type { MaterialCaiTotal, MaterialSummaryRow } from "@/lib/calculations/material-summary";

function formatQuantity(quantity: number | null): string {
  if (quantity === null) return "-";
  return Number.isInteger(quantity) ? formatNumber(quantity, 0) : formatNumber(quantity, 2);
}

function rowClassName(row: MaterialSummaryRow, index: number, rows: MaterialSummaryRow[]): string {
  const previous = rows[index - 1];
  const startsNewItem = index > 0 && row.kind !== "process" && previous?.kind !== "process";
  return [
    row.kind === "process" ? "border-b bg-muted/10" : "border-b border-muted/50",
    startsNewItem ? "border-t-2 border-t-slate-200" : "",
  ].filter(Boolean).join(" ");
}

export function MaterialDetailTable({ rows }: { rows: MaterialSummaryRow[] }) {
  return (
    <div className="max-w-full overflow-x-auto rounded-md border">
      <table className="w-full min-w-[1040px] table-fixed text-xs">
        <colgroup>
          <col className="w-[260px]" />
          <col className="w-[150px]" />
          <col className="w-[64px]" />
          <col className="w-[122px]" />
          <col className="w-[112px]" />
          <col className="w-[240px]" />
          <col className="w-[88px]" />
          <col className="w-[98px]" />
        </colgroup>
        <thead className="bg-muted/40 text-muted-foreground">
          <tr className="border-b">
            <th className="px-3 py-2 text-left font-medium">材料 / 規格</th>
            <th className="px-3 py-2 text-left font-medium">部件 / 品項</th>
            <th className="px-3 py-2 text-right font-medium">數量</th>
            <th className="px-3 py-2 text-right font-medium">尺寸</th>
            <th className="px-3 py-2 text-right font-medium">才數</th>
            <th className="px-3 py-2 text-left font-medium">加工 / 備註</th>
            <th className="px-3 py-2 text-right font-medium">單價</th>
            <th className="px-3 py-2 text-right font-medium">小計</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <tr key={row.id} className={rowClassName(row, index, rows)}>
              <td className="px-3 py-2 align-top text-muted-foreground">
                <div className="line-clamp-2">{row.material}</div>
              </td>
              <td className="px-3 py-2 align-top font-medium">{row.itemName}</td>
              <td className="px-3 py-2 text-right align-top tabular-nums">{formatQuantity(row.quantity)}</td>
              <td className="px-3 py-2 text-right align-top tabular-nums text-muted-foreground">{row.size}</td>
              <td className="px-3 py-2 text-right align-top tabular-nums text-muted-foreground">{row.caiLabel}</td>
              <td className="px-3 py-2 align-top text-muted-foreground">
                <div className="line-clamp-2">{row.note}</div>
              </td>
              <td className="px-3 py-2 text-right align-top tabular-nums text-muted-foreground">
                {row.unitPrice !== null ? formatCurrency(row.unitPrice) : "-"}
              </td>
              <td className="px-3 py-2 text-right align-top font-semibold tabular-nums">
                {row.subtotal !== null ? formatCurrency(row.subtotal) : "-"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
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

export function SummaryTotalsBlock({
  materialCaiTotals,
  hardwareRows,
  processRows,
  layout = "grid",
}: {
  materialCaiTotals: MaterialCaiTotal[];
  hardwareRows: MaterialSummaryRow[];
  processRows: MaterialSummaryRow[];
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
        <p className="text-xs font-medium text-muted-foreground">加工總表</p>
        <ProcessingTotalsTable rows={processRows} />
      </div>
    </div>
  );
}
