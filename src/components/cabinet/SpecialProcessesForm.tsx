"use client";

import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { generateId } from "@/lib/utils";
import type { SpecialProcessInput, SpecialProcessKind } from "@/types";

interface Props {
  value: SpecialProcessInput[];
  onChange: (value: SpecialProcessInput[]) => void;
}

const outerShapeOptions = ["L型", "斜L型", "凹型", "斜凹型", "ㄑ型", "內弧型", "正圓", "橢圓", "半圓", "子彈型", "內拱型"];
const innerCutoutOptions = ["開圓孔", "開方孔", "拱型孔"];
const factoryRadiusOptions = [20, 30, 50, 80, 100, 150, 200, 250, 300];

const defaultLabels: Record<SpecialProcessKind, string> = {
  roundCorner: "導圓",
  cutCorner: "切角",
  outerShape: outerShapeOptions[0],
  innerCutout: innerCutoutOptions[0],
};

function defaultProcess(): SpecialProcessInput {
  return {
    id: generateId(),
    kind: "outerShape",
    label: defaultLabels.outerShape,
    edgeBanding: "withEdge",
    dimensionSumMm: 900,
    quantity: 1,
    sharpCornerGte90Count: 0,
    sharpCornerLt90Count: 0,
  };
}

function defaultRadius(kind: SpecialProcessKind): number | undefined {
  return kind === "roundCorner" ? 80 : undefined;
}

export function SpecialProcessesForm({ value, onChange }: Props) {
  const update = (index: number, patch: Partial<SpecialProcessInput>) => {
    onChange(value.map((item, i) => (i === index ? { ...item, ...patch } : item)));
  };

  const remove = (index: number) => {
    onChange(value.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-2 rounded border bg-background p-2">
      <div className="flex items-center justify-between gap-2">
        <Label className="text-xs font-medium">特殊加工</Label>
        <Button type="button" variant="outline" size="sm" className="h-7 px-2 text-xs" onClick={() => onChange([...value, defaultProcess()])}>
          <Plus className="mr-1 h-3 w-3" />
          新增
        </Button>
      </div>
      {value.length === 0 && <p className="text-xs text-muted-foreground">未設定板外造型、內開孔、切角或導圓。</p>}
      {value.map((item, index) => (
        <div key={item.id} className="space-y-2 rounded border bg-muted/20 p-2">
          <div className="grid gap-2 sm:grid-cols-[1fr_1fr_80px_32px]">
            <div>
              <Label className="text-[10px] text-muted-foreground">加工類型</Label>
              <Select
                value={item.kind}
                onValueChange={(kind) => {
                  const nextKind = kind as SpecialProcessKind;
                  update(index, {
                    kind: nextKind,
                    label: defaultLabels[nextKind],
                    radiusMm: defaultRadius(nextKind),
                    radiusMode: nextKind === "roundCorner" ? "factory" : item.radiusMode,
                  });
                }}
              >
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="outerShape">板外造型</SelectItem>
                  <SelectItem value="innerCutout">板內開孔</SelectItem>
                  <SelectItem value="cutCorner">切角</SelectItem>
                  <SelectItem value="roundCorner">導圓 / 1/4圓</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-[10px] text-muted-foreground">名稱 / 圖示</Label>
              {item.kind === "outerShape" || item.kind === "innerCutout" ? (
                <Select
                  value={item.label || defaultLabels[item.kind]}
                  onValueChange={(label) => update(index, { label })}
                >
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {(item.kind === "outerShape" ? outerShapeOptions : innerCutoutOptions).map((option) => (
                      <SelectItem key={option} value={option}>{option}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <Input
                  className="h-8 text-xs"
                  value={item.label}
                  onChange={(event) => update(index, { label: event.target.value })}
                  placeholder={defaultLabels[item.kind]}
                />
              )}
            </div>

            <div>
              <Label className="text-[10px] text-muted-foreground">數量</Label>
              <Input
                type="number"
                min={1}
                className="h-8 text-xs"
                value={item.quantity}
                onChange={(event) => update(index, { quantity: Number(event.target.value) })}
              />
            </div>
            <Button type="button" variant="ghost" size="icon" className="mt-4 h-8 w-8 text-destructive" onClick={() => remove(index)}>
              <Trash2 className="h-3 w-3" />
            </Button>
          </div>

          {item.kind === "roundCorner" ? (
            <div className="grid gap-2 sm:grid-cols-2">
              <div>
                <Label className="text-[10px] text-muted-foreground">模式</Label>
                <Select
                  value={item.radiusMode ?? "factory"}
                  onValueChange={(radiusMode) => update(index, { radiusMode: radiusMode as "factory" | "custom" })}
                >
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="factory">廠模</SelectItem>
                    <SelectItem value="custom">客製</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-[10px] text-muted-foreground">R 值 mm</Label>
                {(item.radiusMode ?? "factory") === "factory" ? (
                  <Select
                    value={String(item.radiusMm ?? 80)}
                    onValueChange={(radiusMm) => update(index, { radiusMm: Number(radiusMm) })}
                  >
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {factoryRadiusOptions.map((radius) => (
                        <SelectItem key={radius} value={String(radius)}>R{radius}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <Input
                    type="number"
                    min={1}
                    className="h-8 text-xs"
                    value={item.radiusMm ?? 450}
                    onChange={(event) => update(index, { radiusMm: Number(event.target.value) })}
                  />
                )}
              </div>
            </div>
          ) : (
            <div className="grid gap-2 sm:grid-cols-2">
              <div>
                <Label className="text-[10px] text-muted-foreground">A+B mm</Label>
                <Input
                  type="number"
                  min={1}
                  className="h-8 text-xs"
                  value={item.dimensionSumMm ?? 900}
                  onChange={(event) => update(index, { dimensionSumMm: Number(event.target.value) })}
                />
              </div>
              <div>
                <Label className="text-[10px] text-muted-foreground">封邊</Label>
                <Select
                  value={item.edgeBanding}
                  onValueChange={(edgeBanding) => update(index, { edgeBanding: edgeBanding as "none" | "withEdge" })}
                >
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="withEdge">有封邊</SelectItem>
                    <SelectItem value="none">不封邊</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          <div className="grid gap-2 sm:grid-cols-2">
            <div>
              <Label className="text-[10px] text-muted-foreground">手工刻尖 &gt;=90度 角數</Label>
              <Input
                type="number"
                min={0}
                className="h-8 text-xs"
                value={item.sharpCornerGte90Count ?? 0}
                onChange={(event) => update(index, { sharpCornerGte90Count: Number(event.target.value) })}
              />
            </div>
            <div>
              <Label className="text-[10px] text-muted-foreground">手工刻尖 &lt;90度 角數</Label>
              <Input
                type="number"
                min={0}
                className="h-8 text-xs"
                value={item.sharpCornerLt90Count ?? 0}
                onChange={(event) => update(index, { sharpCornerLt90Count: Number(event.target.value) })}
              />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
