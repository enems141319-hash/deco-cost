// src/components/ceiling/CeilingResultPanel.tsx

import type { CeilingResult } from "@/types";
import { formatCurrency, formatNumber } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

interface Props {
  result: CeilingResult;
}

export function CeilingResultPanel({ result }: Props) {
  return (
    <div className="space-y-4">
      {/* 摘要卡片 */}
      <div className="grid grid-cols-2 gap-3">
        <Card className="bg-muted/30">
          <CardContent className="p-3">
            <p className="text-xs text-muted-foreground">坪數</p>
            <p className="text-lg font-bold">{formatNumber(result.areaPing, 1)} 坪</p>
          </CardContent>
        </Card>
        <Card className="bg-muted/30">
          <CardContent className="p-3">
            <p className="text-xs text-muted-foreground">周長</p>
            <p className="text-lg font-bold">{formatNumber(result.perimeterM, 1)} m</p>
          </CardContent>
        </Card>
      </div>

      {/* 明細表 */}
      <table className="w-full text-xs">
        <thead>
          <tr className="border-b text-muted-foreground">
            <th className="text-left py-1 font-medium">項目</th>
            <th className="text-right py-1 font-medium">數量</th>
            <th className="text-right py-1 font-medium">單位</th>
            <th className="text-right py-1 font-medium">單價</th>
            <th className="text-right py-1 font-medium">小計</th>
          </tr>
        </thead>
        <tbody>
          {result.items.map((item) => (
            <tr key={item.name} className="border-b border-muted/30 hover:bg-muted/20">
              <td className="py-1">
                <div>{item.name}</div>
                {item.materialRef && (
                  <div className="text-[10px] text-muted-foreground">{item.materialRef.materialName}</div>
                )}
                <div className="text-[10px] text-muted-foreground/70 mt-0.5">{item.calculation}</div>
              </td>
              <td className="text-right py-1 font-medium">{item.quantity}</td>
              <td className="text-right py-1 text-muted-foreground">{item.unit}</td>
              <td className="text-right py-1 text-muted-foreground">
                {item.materialRef ? formatCurrency(item.unitCost) : "—"}
              </td>
              <td className="text-right py-1 font-medium">
                {item.subtotal > 0 ? formatCurrency(item.subtotal) : <span className="text-orange-500">未選材料</span>}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <Separator />

      <div className="flex justify-between font-bold text-base">
        <span>合計</span>
        <span className="text-primary">{formatCurrency(result.totalCost)}</span>
      </div>
    </div>
  );
}
