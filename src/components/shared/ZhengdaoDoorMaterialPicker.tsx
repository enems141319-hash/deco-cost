"use client";

import { useEffect } from "react";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  ZHENGDAO_DOOR_SHAPES,
  ZHENGDAO_FINISHED_DOORS,
  ZHENGDAO_FLAT_DOORS,
  ZHENGDAO_SHAPED_BASE_DOORS,
  resolveZhengdaoDoorSelection,
} from "@/lib/config/vendors/zhengdao-door-2025";
import type { MaterialRef, ZhengdaoDoorPricingMode, ZhengdaoDoorSelection } from "@/types";

const MODE_LABELS: Record<ZhengdaoDoorPricingMode, string> = {
  FLAT: "平板門板",
  FINISHED: "特殊成品門板",
  SHAPED: "造型門板",
  ALUMINUM_FRAME: "鋁框門",
};

function defaultSelection(mode: ZhengdaoDoorPricingMode): ZhengdaoDoorSelection {
  if (mode === "FLAT") return { mode, optionCode: ZHENGDAO_FLAT_DOORS[0].code };
  if (mode === "FINISHED") return { mode, optionCode: ZHENGDAO_FINISHED_DOORS[0].code };
  if (mode === "SHAPED") return { mode, baseCode: ZHENGDAO_SHAPED_BASE_DOORS[0].code, optionCode: ZHENGDAO_DOOR_SHAPES[0].code };
  return { mode, frameColor: "ALUMINUM" };
}

export function ZhengdaoDoorMaterialPicker({
  value,
  onChange,
}: {
  value?: ZhengdaoDoorSelection;
  onChange: (selection: ZhengdaoDoorSelection, materialRef: MaterialRef) => void;
}) {
  const selection = value ?? defaultSelection("FLAT");
  const result = resolveZhengdaoDoorSelection(selection);

  const commit = (next: ZhengdaoDoorSelection) => {
    const resolved = resolveZhengdaoDoorSelection(next);
    if (resolved) onChange(resolved.selection, resolved.materialRef);
  };

  useEffect(() => {
    if (value || !result) return;
    onChange(result.selection, result.materialRef);
  }, [onChange, result, value]);

  return (
    <div className="space-y-3 rounded border bg-background p-3">
      <div>
        <Label className="text-[10px] text-muted-foreground">正道門板計價類型</Label>
        <Select
          value={selection.mode}
          onValueChange={(mode: ZhengdaoDoorPricingMode) => commit(defaultSelection(mode))}
        >
          <SelectTrigger className="mt-1 h-8 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {Object.entries(MODE_LABELS).map(([mode, label]) => (
              <SelectItem key={mode} value={mode}>{label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {selection.mode === "FLAT" && (
        <DoorOptionSelect
          label="平板門板系列"
          value={selection.optionCode}
          options={ZHENGDAO_FLAT_DOORS}
          onChange={(optionCode) => commit({ mode: "FLAT", optionCode })}
        />
      )}

      {selection.mode === "FINISHED" && (
        <DoorOptionSelect
          label="特殊成品門板"
          value={selection.optionCode}
          options={ZHENGDAO_FINISHED_DOORS}
          onChange={(optionCode) => commit({ mode: "FINISHED", optionCode })}
        />
      )}

      {selection.mode === "SHAPED" && (
        <div className="grid gap-2 sm:grid-cols-2">
          <DoorOptionSelect
            label="基礎平板系列"
            value={selection.baseCode}
            options={ZHENGDAO_SHAPED_BASE_DOORS}
            onChange={(baseCode) => commit({ ...selection, mode: "SHAPED", baseCode })}
          />
          <DoorOptionSelect
            label="造型加工"
            value={selection.optionCode}
            options={ZHENGDAO_DOOR_SHAPES}
            onChange={(optionCode) => commit({ ...selection, mode: "SHAPED", optionCode })}
          />
        </div>
      )}

      {selection.mode === "ALUMINUM_FRAME" && (
        <div>
          <Label className="text-[10px] text-muted-foreground">HB 鋁框顏色</Label>
          <Select
            value={selection.frameColor ?? "ALUMINUM"}
            onValueChange={(frameColor: "ALUMINUM" | "WHITE" | "BLACK") => commit({ mode: "ALUMINUM_FRAME", frameColor })}
          >
            <SelectTrigger className="mt-1 h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALUMINUM">鋁色</SelectItem>
              <SelectItem value="WHITE">白色</SelectItem>
              <SelectItem value="BLACK">黑色</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}

      {result && (
        <div className="rounded border border-blue-200 bg-blue-50 px-3 py-2 text-xs">
          <p className="font-medium text-blue-900">{result.materialRef.materialName}</p>
          <p className="mt-1 text-blue-800">
            {result.materialRef.pricePerUnit} 元/才，基本才 {result.materialRef.minCai ?? 0} 才
          </p>
          <p className="mt-1 leading-relaxed text-blue-700">{result.note}</p>
        </div>
      )}
    </div>
  );
}

function DoorOptionSelect({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value?: string;
  options: Array<{ code: string; name: string; pricePerCai?: number; addonPerCai?: number }>;
  onChange: (value: string) => void;
}) {
  return (
    <div>
      <Label className="text-[10px] text-muted-foreground">{label}</Label>
      <Select value={value ?? ""} onValueChange={onChange}>
        <SelectTrigger className="mt-1 h-8 text-xs">
          <SelectValue placeholder={`選擇${label}`} />
        </SelectTrigger>
        <SelectContent>
          {options.map((option) => (
            <SelectItem key={option.code} value={option.code}>
              {option.name}（{option.pricePerCai ?? option.addonPerCai} 元/才）
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
