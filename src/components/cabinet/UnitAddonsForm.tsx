"use client";

import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import type { UnitAddons } from "@/types";

interface Props {
  value: UnitAddons;
  onChange: (value: UnitAddons) => void;
}

export function UnitAddonsForm({ value, onChange }: Props) {
  const update = (patch: Partial<UnitAddons>) => onChange({ ...value, ...patch });
  const lightGrooves = value.lightGrooves ?? {
    topInner: { enabled: false, offsetFromFrontMm: 50 },
    sideInner: { enabled: false, offsetFromFrontMm: 50 },
  };
  const updateLightGroove = (
    key: keyof NonNullable<UnitAddons["lightGrooves"]>,
    patch: Partial<NonNullable<UnitAddons["lightGrooves"]>[keyof NonNullable<UnitAddons["lightGrooves"]>]>
  ) => update({
    lightGrooves: {
      ...lightGrooves,
      [key]: { ...lightGrooves[key], ...patch },
    },
  });

  return (
    <section className="space-y-3">
      <h3 className="font-semibold text-sm border-b pb-1">加工選項</h3>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">前緣封 ABS</Label>
          <Select
            value={value.frontEdgeABS}
            onValueChange={(frontEdgeABS) => update({ frontEdgeABS: frontEdgeABS as UnitAddons["frontEdgeABS"] })}
          >
            <SelectTrigger className="h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">無</SelectItem>
              <SelectItem value="one_long">1 長（+5 元/才）</SelectItem>
              <SelectItem value="two_long">2 長（+10 元/才）</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2 rounded border bg-muted/20 p-3">
          <div className="flex items-center justify-between">
            <Label className="text-xs">上板內側燈溝</Label>
            <Switch
              checked={lightGrooves.topInner.enabled}
              onCheckedChange={(enabled) => updateLightGroove("topInner", { enabled })}
            />
          </div>
          {lightGrooves.topInner.enabled && (
            <div>
              <Label className="text-[10px] text-muted-foreground">離前緣(mm)</Label>
              <Input
                type="number"
                min={0}
                className="h-8 text-xs"
                value={lightGrooves.topInner.offsetFromFrontMm}
                onChange={(event) => updateLightGroove("topInner", { offsetFromFrontMm: Number(event.target.value) })}
              />
            </div>
          )}
        </div>
        <div className="space-y-2 rounded border bg-muted/20 p-3">
          <div className="flex items-center justify-between">
            <Label className="text-xs">側板內側燈溝</Label>
            <Switch
              checked={lightGrooves.sideInner.enabled}
              onCheckedChange={(enabled) => updateLightGroove("sideInner", { enabled })}
            />
          </div>
          {lightGrooves.sideInner.enabled && (
            <div>
              <Label className="text-[10px] text-muted-foreground">離前緣(mm)</Label>
              <Input
                type="number"
                min={0}
                className="h-8 text-xs"
                value={lightGrooves.sideInner.offsetFromFrontMm}
                onChange={(event) => updateLightGroove("sideInner", { offsetFromFrontMm: Number(event.target.value) })}
              />
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
