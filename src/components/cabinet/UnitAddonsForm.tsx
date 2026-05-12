"use client";

import { AlertCircle } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { DEFAULT_UNIT_ADDONS, type SideSealBendingOption, type UnitAddons } from "@/types";

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
  const sideSealBending = value.sideSealBending ?? DEFAULT_UNIT_ADDONS.sideSealBending!;
  const updateLightGroove = (
    key: keyof NonNullable<UnitAddons["lightGrooves"]>,
    patch: Partial<NonNullable<UnitAddons["lightGrooves"]>[keyof NonNullable<UnitAddons["lightGrooves"]>]>
  ) => update({
    lightGrooves: {
      ...lightGrooves,
      [key]: { ...lightGrooves[key], ...patch },
    },
  });
  const updateSideSealBending = (
    side: keyof NonNullable<UnitAddons["sideSealBending"]>,
    patch: Partial<SideSealBendingOption>,
  ) => update({
    sideSealBending: {
      ...sideSealBending,
      [side]: { ...sideSealBending[side], ...patch },
    },
  });

  const renderSideSealBending = (
    side: keyof NonNullable<UnitAddons["sideSealBending"]>,
    label: string,
  ) => {
    const option = sideSealBending[side];

    return (
      <div className="space-y-2 rounded border bg-muted/20 p-3">
        <div className="flex items-center justify-between">
          <Label className="text-xs">{label}側封板R50彎曲造型</Label>
          <Switch
            checked={option.enabled}
            onCheckedChange={(enabled) => updateSideSealBending(side, { enabled })}
          />
        </div>
        {option.enabled && (
          <div className="space-y-2">
            <div className="grid gap-2 sm:grid-cols-2">
              <div>
                <Label className="text-[10px] text-muted-foreground">深度 D(mm)</Label>
                <Input
                  type="number"
                  min={80}
                  max={600}
                  className="h-8 text-xs"
                  value={option.depthMm ?? option.depthCm ?? 80}
                  onChange={(event) => updateSideSealBending(side, { depthMm: Number(event.target.value) })}
                />
              </div>
              <div className="flex items-center justify-between rounded border bg-background px-3 py-2">
                <Label className="text-xs">內側55mm可見封邊</Label>
                <Switch
                  checked={option.visibleEdgeBand}
                  onCheckedChange={(visibleEdgeBand) => updateSideSealBending(side, { visibleEdgeBand })}
                />
              </div>
            </div>
            <div className="flex items-center justify-between rounded border bg-background px-3 py-2">
              <Label className="text-xs">該側是否為抽屜櫃</Label>
              <Switch
                checked={option.isDrawerCabinet}
                onCheckedChange={(isDrawerCabinet) => updateSideSealBending(side, { isDrawerCabinet })}
              />
            </div>
            {option.isDrawerCabinet && (
              <div className="space-y-2 rounded border border-destructive/40 bg-destructive/10 p-3">
                <div className="flex items-start gap-2 text-xs font-medium text-destructive">
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                  <span>系統會自動補一塊中立板，高度 = 櫃體總高 - 頂板厚度 - 底板厚度 - 踢腳板高度。</span>
                </div>
                <div>
                  <Label className="text-[10px] text-muted-foreground">補中立板深度(cm)</Label>
                  <Input
                    type="number"
                    min={1}
                    className="h-8 bg-background text-xs"
                    value={option.drawerDividerDepthCm ?? 55}
                    onChange={(event) => updateSideSealBending(side, { drawerDividerDepthCm: Number(event.target.value) })}
                  />
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <section className="space-y-3">
      <h3 className="font-semibold text-sm border-b pb-1">加工選項</h3>

      <div className="space-y-3">
        <div className="grid gap-3 sm:grid-cols-2">
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

        <div className="space-y-1.5 sm:max-w-[calc(50%-0.375rem)]">
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

        <div className="space-y-3">
          {renderSideSealBending("left", "左")}
          {renderSideSealBending("right", "右")}
        </div>
      </div>
    </section>
  );
}
