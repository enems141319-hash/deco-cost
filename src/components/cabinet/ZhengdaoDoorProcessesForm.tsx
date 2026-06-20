"use client";

import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ZHENGDAO_2025_DOOR_PROCESS_RULE_BY_CODE,
  ZHENGDAO_2025_DOOR_PROCESS_RULES,
  ZHENGDAO_DOOR_PROCESS_SERIES_OPTIONS,
  type ZhengdaoDoorProcessSeries,
} from "@/lib/config/vendors/zhengdao-door-processes";
import { generateId } from "@/lib/utils";
import type { ZhengdaoDoorProcessCode, ZhengdaoDoorProcessInput } from "@/types/zhengdao-door";

interface Props {
  value: ZhengdaoDoorProcessInput[];
  onChange: (value: ZhengdaoDoorProcessInput[]) => void;
}

function priceLabel(code: ZhengdaoDoorProcessCode): string {
  const rule = ZHENGDAO_2025_DOOR_PROCESS_RULE_BY_CODE[code];
  const unit = rule.billingMode === "PER_CAI"
    ? "才"
    : rule.billingMode === "PER_10MM"
      ? "10mm"
      : rule.billingMode === "PER_CHI"
        ? "尺"
        : rule.group === "挖孔"
          ? "孔／片"
          : "式";
  return `$${rule.unitPrice}/${unit}${rule.minCai ? `，基本 ${rule.minCai} 才` : ""}`;
}

export function ZhengdaoDoorProcessesForm({ value, onChange }: Props) {
  const [searchById, setSearchById] = useState<Record<string, string>>({});
  const [seriesById, setSeriesById] = useState<Record<string, ZhengdaoDoorProcessSeries>>({});

  const add = () => onChange([
    ...value,
    {
      id: generateId(),
      code: "EDGE_A",
      quantityPerDoor: 1,
    },
  ]);

  const update = (index: number, patch: Partial<ZhengdaoDoorProcessInput>) => {
    onChange(value.map((item, itemIndex) => itemIndex === index ? { ...item, ...patch } : item));
  };

  const updateSearch = (id: string, search: string) => {
    setSearchById((current) => ({ ...current, [id]: search }));
  };

  const updateSeries = (index: number, series: ZhengdaoDoorProcessSeries) => {
    const nextCode = ZHENGDAO_2025_DOOR_PROCESS_RULES.find((rule) => rule.series.includes(series))?.code;
    const item = value[index];
    if (!item || !nextCode) return;
    setSeriesById((current) => ({ ...current, [item.id]: series }));
    setSearchById((current) => ({ ...current, [item.id]: "" }));
    update(index, { code: nextCode });
  };

  return (
    <div className="space-y-2 rounded border bg-background p-2">
      <div className="flex items-center justify-between gap-3">
        <div>
          <Label className="text-sm font-semibold">正道門片加工</Label>
          <p className="text-[10px] text-muted-foreground">依正道加工價目計價，可加入多個加工項目。</p>
        </div>
        <Button type="button" variant="outline" size="sm" onClick={add}>
          <Plus className="mr-1 h-3 w-3" />
          新增加工
        </Button>
      </div>

      {value.length === 0 && <p className="text-xs text-muted-foreground">尚未加入加工。</p>}

      {value.map((item, index) => {
        const selectedRule = ZHENGDAO_2025_DOOR_PROCESS_RULE_BY_CODE[item.code];
        const selectedSeries = seriesById[item.id] ?? selectedRule.series[0] ?? "P6_BOARD_PROCESS";
        const search = searchById[item.id]?.trim().toLowerCase() ?? "";
        const visibleRules = ZHENGDAO_2025_DOOR_PROCESS_RULES.filter((rule) => {
          if (!rule.series.includes(selectedSeries)) return false;
          if (!search) return true;
          return [
            rule.name,
            rule.group,
            rule.series.join(" "),
            rule.code,
            rule.note ?? "",
          ].some((text) => text.toLowerCase().includes(search));
        });

        return (
          <div key={item.id} className="space-y-2 rounded border bg-muted/20 p-2">
            <div>
              <Label className="text-[10px] text-muted-foreground">加工系列</Label>
              <Select
                value={selectedSeries}
                onValueChange={(series) => updateSeries(index, series as ZhengdaoDoorProcessSeries)}
              >
                <SelectTrigger className="mt-1 h-8 min-w-0 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ZHENGDAO_DOOR_PROCESS_SERIES_OPTIONS.map((series) => (
                    <SelectItem key={series.code} value={series.code}>
                      {series.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-[10px] text-muted-foreground">搜尋加工品項</Label>
              <Input
                className="mt-1 h-8 text-xs"
                placeholder="輸入加工名稱、分類或代碼"
                value={searchById[item.id] ?? ""}
                onChange={(event) => updateSearch(item.id, event.target.value)}
              />
            </div>

            <div>
              <Label className="text-[10px] text-muted-foreground">加工品項</Label>
              <Select
                value={item.code}
                onValueChange={(code) => update(index, { code: code as ZhengdaoDoorProcessCode })}
              >
                <SelectTrigger className="mt-1 h-8 min-w-0 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {visibleRules.map((rule) => (
                    <SelectItem key={rule.code} value={rule.code}>
                      {rule.name}
                    </SelectItem>
                  ))}
                  {visibleRules.length === 0 && (
                    <SelectItem value="__no_result" disabled>
                      找不到符合的加工品項
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-[minmax(0,1fr)_36px] items-end gap-2">
              <div>
                <Label className="text-[10px] text-muted-foreground">每片數量</Label>
                <Input
                  type="number"
                  min={0.1}
                  step={0.1}
                  className="h-8 text-xs"
                  value={item.quantityPerDoor}
                  onChange={(event) => update(index, { quantityPerDoor: Number(event.target.value) })}
                />
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-8 w-8 self-end text-destructive"
                title="刪除加工"
                onClick={() => onChange(value.filter((_, itemIndex) => itemIndex !== index))}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
            {selectedRule.billingMode === "PER_10MM" && (
              <div>
                <Label className="text-[10px] text-muted-foreground">加工長度（mm）</Label>
                <Input
                  type="number"
                  min={0}
                  step={10}
                  className="h-8 text-xs"
                  value={item.lengthMm ?? 0}
                  onChange={(event) => update(index, { lengthMm: Number(event.target.value) })}
                />
              </div>
            )}
            <p className="text-[10px] text-muted-foreground">
              {priceLabel(item.code)}
              {selectedRule.note ? `；${selectedRule.note}` : ""}
            </p>
          </div>
        );
      })}
    </div>
  );
}
