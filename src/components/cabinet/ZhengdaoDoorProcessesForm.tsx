"use client";

import { useState } from "react";
import { Plus, Search, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  ZHENGDAO_2025_DOOR_PROCESS_RULE_BY_CODE,
  ZHENGDAO_2025_DOOR_PROCESS_RULES,
  ZHENGDAO_DOOR_PROCESS_SERIES_OPTIONS,
} from "@/lib/config/vendors/zhengdao-door-processes";
import { generateId } from "@/lib/utils";
import type { ZhengdaoDoorProcessCode, ZhengdaoDoorProcessInput } from "@/types/zhengdao-door";

interface Props {
  value: ZhengdaoDoorProcessInput[];
  onChange: (value: ZhengdaoDoorProcessInput[]) => void;
  title?: string;
  description?: string;
  boardWidthCm?: number;
  boardHeightCm?: number;
}

const seriesLabelByCode = Object.fromEntries(
  ZHENGDAO_DOOR_PROCESS_SERIES_OPTIONS.map((series) => [series.code, series.label]),
) as Record<string, string>;

type EdgeMode = "NONE" | "PVC" | "ABS_SINGLE" | "ABS_DOUBLE";

function isEdgeProcessCode(code: ZhengdaoDoorProcessCode): code is "EDGE_A" | "EDGE_A_DOUBLE" | "EDGE_P" {
  return code === "EDGE_A" || code === "EDGE_A_DOUBLE" || code === "EDGE_P";
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

export function ZhengdaoDoorProcessesForm({
  value,
  onChange,
  title = "正道門片加工",
  description = "依正道加工價目計價，可加入多個加工項目。",
  boardWidthCm,
  boardHeightCm,
}: Props) {
  const [searchById, setSearchById] = useState<Record<string, string>>({});
  const [openById, setOpenById] = useState<Record<string, boolean>>({});
  const processItems = value.filter((item) => !isEdgeProcessCode(item.code));
  const edgeMode: EdgeMode = value.some((item) => item.code === "EDGE_A_DOUBLE")
    ? "ABS_DOUBLE"
    : value.some((item) => item.code === "EDGE_A")
      ? "ABS_SINGLE"
    : value.some((item) => item.code === "EDGE_P")
      ? "PVC"
      : "NONE";

  const add = () => onChange([
    ...value,
    {
      id: generateId(),
      code: "CUSTOM_GROOVE",
      quantityPerDoor: 1,
    },
  ]);

  const updateEdgeMode = (mode: EdgeMode) => {
    const nonEdgeItems = value.filter((item) => !isEdgeProcessCode(item.code));
    if (mode === "NONE") {
      onChange(nonEdgeItems);
      return;
    }

    onChange([
      ...nonEdgeItems,
      {
        id: generateId(),
        code: mode === "ABS_DOUBLE" ? "EDGE_A_DOUBLE" : mode === "ABS_SINGLE" ? "EDGE_A" : "EDGE_P",
        quantityPerDoor: 1,
      },
    ]);
  };

  const update = (index: number, patch: Partial<ZhengdaoDoorProcessInput>) => {
    onChange(value.map((item, itemIndex) => itemIndex === index ? { ...item, ...patch } : item));
  };

  const updateSearch = (id: string, search: string) => {
    setSearchById((current) => ({ ...current, [id]: search }));
    setOpenById((current) => ({ ...current, [id]: true }));
  };

  const selectProcess = (index: number, code: ZhengdaoDoorProcessCode) => {
    const item = value[index];
    if (!item) return;
    const nextRule = ZHENGDAO_2025_DOOR_PROCESS_RULE_BY_CODE[code];
    setSearchById((current) => ({ ...current, [item.id]: nextRule.name }));
    setOpenById((current) => ({ ...current, [item.id]: false }));
    update(index, { code });
  };

  return (
    <div className="space-y-2 rounded border bg-background p-2">
      <div className="space-y-1.5 rounded-md border bg-muted/20 p-2">
        <div className="text-[11px] font-medium text-muted-foreground">封邊方式</div>
        <label
          className={[
            "flex min-h-11 cursor-pointer items-center gap-3 rounded-md border px-3 py-2 text-xs transition",
            edgeMode === "PVC" ? "border-blue-500 bg-blue-50 text-blue-700" : "bg-background hover:bg-muted/50",
          ].join(" ")}
        >
          <input
            type="checkbox"
            className="h-4 w-4 shrink-0 accent-blue-600"
            checked={edgeMode === "PVC"}
            onChange={(event) => updateEdgeMode(event.target.checked ? "PVC" : "NONE")}
          />
          <span className="min-w-0 flex-1 font-medium">封 PVC（P 邊）</span>
          <span className="shrink-0 whitespace-nowrap text-right text-[11px] text-muted-foreground">不加價</span>
        </label>
        <label
          className={[
            "flex min-h-11 cursor-pointer items-center gap-3 rounded-md border px-3 py-2 text-xs transition",
            edgeMode === "ABS_SINGLE" ? "border-blue-500 bg-blue-50 text-blue-700" : "bg-background hover:bg-muted/50",
          ].join(" ")}
        >
          <input
            type="checkbox"
            className="h-4 w-4 shrink-0 accent-blue-600"
            checked={edgeMode === "ABS_SINGLE"}
            onChange={(event) => updateEdgeMode(event.target.checked ? "ABS_SINGLE" : "NONE")}
          />
          <span className="min-w-0 flex-1 font-medium">封 ABS（單邊）</span>
          <span className="shrink-0 whitespace-nowrap text-right text-[11px] text-muted-foreground">+$10/才，基本 1 才</span>
        </label>
        <label
          className={[
            "flex min-h-11 cursor-pointer items-center gap-3 rounded-md border px-3 py-2 text-xs transition",
            edgeMode === "ABS_DOUBLE" ? "border-blue-500 bg-blue-50 text-blue-700" : "bg-background hover:bg-muted/50",
          ].join(" ")}
        >
          <input
            type="checkbox"
            className="h-4 w-4 shrink-0 accent-blue-600"
            checked={edgeMode === "ABS_DOUBLE"}
            onChange={(event) => updateEdgeMode(event.target.checked ? "ABS_DOUBLE" : "NONE")}
          />
          <span className="min-w-0 flex-1 font-medium">封 ABS（雙邊）</span>
          <span className="shrink-0 whitespace-nowrap text-right text-[11px] text-muted-foreground">+$20/才，基本 1 才</span>
        </label>
      </div>

      <div className="flex items-center justify-between gap-3 pt-2">
        <div>
          <Label className="text-sm font-semibold">{title}</Label>
          <p className="text-[10px] text-muted-foreground">{description}</p>
        </div>
        <Button type="button" variant="outline" size="sm" onClick={add}>
          <Plus className="mr-1 h-3 w-3" />
          新增加工
        </Button>
      </div>

      {processItems.length === 0 && <p className="text-xs text-muted-foreground">尚未加入其他加工。</p>}

      {processItems.map((item) => {
        const index = value.findIndex((candidate) => candidate.id === item.id);
        if (index < 0) return null;
        const selectedRule = ZHENGDAO_2025_DOOR_PROCESS_RULE_BY_CODE[item.code];
        const inputValue = searchById[item.id] ?? selectedRule.name;
        const search = (searchById[item.id] ?? "").trim().toLowerCase();
        const isOpen = openById[item.id] ?? false;
        const visibleRules = ZHENGDAO_2025_DOOR_PROCESS_RULES.filter((rule) => {
          if (isEdgeProcessCode(rule.code)) return false;
          if (rule.series.length === 0) return false;
          if (!search) return true;
          return [
            rule.name,
            rule.group,
            ...rule.series.map((series) => seriesLabelByCode[series] ?? series),
            rule.code,
            rule.note ?? "",
          ].some((text) => text.toLowerCase().includes(search));
        }).slice(0, 40);

        return (
          <div key={item.id} className="space-y-2 rounded border bg-muted/20 p-2">
            <div
              className="relative"
              onBlur={(event) => {
                if (!event.currentTarget.contains(event.relatedTarget)) {
                  setOpenById((current) => ({ ...current, [item.id]: false }));
                }
              }}
            >
              <Label className="text-[10px] text-muted-foreground">加工品項</Label>
              <div className="relative mt-1">
                <Input
                  className="h-8 pr-8 text-xs font-medium text-slate-900"
                  placeholder="輸入關鍵字搜尋加工品項"
                  value={inputValue}
                  onFocus={() => setOpenById((current) => ({ ...current, [item.id]: true }))}
                  onChange={(event) => updateSearch(item.id, event.target.value)}
                />
                <Search className="pointer-events-none absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
              </div>
              {isOpen && (
                <div className="absolute z-30 mt-1 max-h-56 w-full overflow-y-auto rounded-md border bg-background p-1 shadow-lg">
                  {visibleRules.map((rule) => (
                    <button
                      key={rule.code}
                      type="button"
                      className="flex w-full flex-col rounded px-2 py-1.5 text-left text-xs hover:bg-muted"
                      onMouseDown={(event) => event.preventDefault()}
                      onClick={() => selectProcess(index, rule.code)}
                    >
                      <span className="font-medium">{rule.name}</span>
                      <span className="text-[10px] text-muted-foreground">
                        {[rule.group, ...rule.series.map((series) => seriesLabelByCode[series] ?? series)].join(" / ")}
                      </span>
                    </button>
                  ))}
                  {visibleRules.length === 0 && (
                    <div className="px-2 py-2 text-xs text-muted-foreground">找不到符合的加工品項</div>
                  )}
                </div>
              )}
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
                onClick={() => onChange(value.filter((candidate) => candidate.id !== item.id))}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
            {selectedRule.billingMode === "PER_10MM" && (
              <div className="space-y-1.5">
                <div className="flex items-center justify-between gap-2">
                  <Label className="text-[10px] text-muted-foreground">加工長度（mm）</Label>
                  <div className="flex shrink-0 gap-1">
                    {typeof boardWidthCm === "number" && boardWidthCm > 0 && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="h-6 px-2 text-[11px]"
                        onClick={() => update(index, { lengthMm: Math.round(boardWidthCm * 10) })}
                      >
                        全寬
                      </Button>
                    )}
                    {typeof boardHeightCm === "number" && boardHeightCm > 0 && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="h-6 px-2 text-[11px]"
                        onClick={() => update(index, { lengthMm: Math.round(boardHeightCm * 10) })}
                      >
                        全高
                      </Button>
                    )}
                  </div>
                </div>
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
