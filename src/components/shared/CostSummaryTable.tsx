// src/components/shared/CostSummaryTable.tsx

import { formatCurrency } from "@/lib/utils";
import { Separator } from "@/components/ui/separator";

interface SummaryRow {
  label: string;
  amount: number;
  highlight?: boolean;
}

interface Props {
  rows: SummaryRow[];
  totalLabel?: string;
  total: number;
}

export function CostSummaryTable({ rows, totalLabel = "合計", total }: Props) {
  return (
    <div className="space-y-1 text-sm">
      {rows.map((row) => (
        <div key={row.label} className={`flex justify-between ${row.highlight ? "font-medium" : "text-muted-foreground"}`}>
          <span>{row.label}</span>
          <span>{formatCurrency(row.amount)}</span>
        </div>
      ))}
      <Separator className="my-2" />
      <div className="flex justify-between font-bold text-base">
        <span>{totalLabel}</span>
        <span className="text-primary">{formatCurrency(total)}</span>
      </div>
    </div>
  );
}
