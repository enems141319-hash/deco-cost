"use client";

import { AlertCircle } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import {
  DEFAULT_UNIT_ADDONS,
  type ProcessingQuantitySwitch,
  type SideSealBendingOption,
  type SlidingDoorTrackShape,
  type UnitAddons,
  type UnitBodyPanelProcesses,
  type CabinetVendor,
} from "@/types";

interface Props {
  value: UnitAddons;
  onChange: (value: UnitAddons) => void;
  vendor?: CabinetVendor;
}

type BodyPanelKey = keyof UnitBodyPanelProcesses;

function normalizedBodyPanelProcesses(value: UnitAddons): UnitBodyPanelProcesses {
  const defaults = DEFAULT_UNIT_ADDONS.bodyPanelProcesses!;

  return {
    top: {
      frontEdgeABS: value.bodyPanelProcesses?.top.frontEdgeABS
        ?? value.frontEdgeABS
        ?? defaults.top.frontEdgeABS,
      lightGroove: value.bodyPanelProcesses?.top.lightGroove
        ?? value.lightGrooves?.topInner
        ?? defaults.top.lightGroove,
      slidingDoorTrackGroove: value.bodyPanelProcesses?.top.slidingDoorTrackGroove
        ?? value.slidingDoorTrackGrooves?.top
        ?? defaults.top.slidingDoorTrackGroove,
      bookcaseGuideWheelHole: value.bodyPanelProcesses?.top.bookcaseGuideWheelHole
        ?? defaults.top.bookcaseGuideWheelHole,
    },
    bottom: {
      frontEdgeABS: value.bodyPanelProcesses?.bottom.frontEdgeABS
        ?? value.frontEdgeABS
        ?? defaults.bottom.frontEdgeABS,
      slidingDoorTrackGroove: value.bodyPanelProcesses?.bottom.slidingDoorTrackGroove
        ?? value.slidingDoorTrackGrooves?.bottom
        ?? defaults.bottom.slidingDoorTrackGroove,
      smallAdjustableFootHole: value.bodyPanelProcesses?.bottom.smallAdjustableFootHole
        ?? defaults.bottom.smallAdjustableFootHole,
      lightStWheelHole: value.bodyPanelProcesses?.bottom.lightStWheelHole
        ?? defaults.bottom.lightStWheelHole,
      heavyStWheelHole: value.bodyPanelProcesses?.bottom.heavyStWheelHole
        ?? defaults.bottom.heavyStWheelHole,
      bookcaseGuideWheelHole: value.bodyPanelProcesses?.bottom.bookcaseGuideWheelHole
        ?? defaults.bottom.bookcaseGuideWheelHole,
    },
    left: {
      frontEdgeABS: value.bodyPanelProcesses?.left.frontEdgeABS
        ?? value.frontEdgeABS
        ?? defaults.left.frontEdgeABS,
      lightGroove: value.bodyPanelProcesses?.left.lightGroove
        ?? value.lightGrooves?.sideInner
        ?? defaults.left.lightGroove,
      sideSealBending: value.bodyPanelProcesses?.left.sideSealBending
        ?? value.sideSealBending?.left
        ?? defaults.left.sideSealBending,
      hiddenReturnSlideRail: value.bodyPanelProcesses?.left.hiddenReturnSlideRail
        ?? defaults.left.hiddenReturnSlideRail,
      specialUGlassPivot: value.bodyPanelProcesses?.left.specialUGlassPivot
        ?? defaults.left.specialUGlassPivot,
      tRailBedSet: value.bodyPanelProcesses?.left.tRailBedSet
        ?? defaults.left.tRailBedSet,
    },
    right: {
      frontEdgeABS: value.bodyPanelProcesses?.right.frontEdgeABS
        ?? value.frontEdgeABS
        ?? defaults.right.frontEdgeABS,
      lightGroove: value.bodyPanelProcesses?.right.lightGroove
        ?? value.lightGrooves?.sideInner
        ?? defaults.right.lightGroove,
      sideSealBending: value.bodyPanelProcesses?.right.sideSealBending
        ?? value.sideSealBending?.right
        ?? defaults.right.sideSealBending,
      hiddenReturnSlideRail: value.bodyPanelProcesses?.right.hiddenReturnSlideRail
        ?? defaults.right.hiddenReturnSlideRail,
      specialUGlassPivot: value.bodyPanelProcesses?.right.specialUGlassPivot
        ?? defaults.right.specialUGlassPivot,
      tRailBedSet: value.bodyPanelProcesses?.right.tRailBedSet
        ?? defaults.right.tRailBedSet,
    },
  };
}

export function UnitAddonsForm({ value, onChange, vendor = "WEIHO" }: Props) {
  const bodyPanelProcesses = normalizedBodyPanelProcesses(value);
  const update = (patch: Partial<UnitAddons>) => onChange({ ...value, ...patch });
  const updateBodyPanelProcesses = (patch: Partial<UnitBodyPanelProcesses>) => {
    update({
      bodyPanelProcesses: {
        ...bodyPanelProcesses,
        ...patch,
      },
    });
  };

  const updateLightGroove = (
    panel: "top" | "left" | "right",
    patch: Partial<UnitBodyPanelProcesses["top"]["lightGroove"]>,
  ) => {
    const current = bodyPanelProcesses[panel];
    updateBodyPanelProcesses({
      [panel]: {
        ...current,
        lightGroove: { ...current.lightGroove, ...patch },
      },
    });
  };

  const updateFrontEdgeABS = (
    panel: BodyPanelKey,
    frontEdgeABS: UnitAddons["frontEdgeABS"],
  ) => {
    const current = bodyPanelProcesses[panel];
    updateBodyPanelProcesses({
      [panel]: {
        ...current,
        frontEdgeABS,
      },
    });
  };

  const updateSlidingDoorTrackGroove = (
    panel: "top" | "bottom",
    patch: Partial<UnitBodyPanelProcesses["top"]["slidingDoorTrackGroove"]>,
  ) => {
    const current = bodyPanelProcesses[panel];
    updateBodyPanelProcesses({
      [panel]: {
        ...current,
        slidingDoorTrackGroove: { ...current.slidingDoorTrackGroove, ...patch },
      },
    });
  };

  const updateSideSealBending = (
    panel: "left" | "right",
    patch: Partial<SideSealBendingOption>,
  ) => {
    const current = bodyPanelProcesses[panel];
    updateBodyPanelProcesses({
      [panel]: {
        ...current,
        sideSealBending: { ...current.sideSealBending, ...patch },
      },
    });
  };

  const updateSidePanelInset = (enabled: boolean) => {
    update({
      sidePanelInset: {
        ...(value.sidePanelInset ?? DEFAULT_UNIT_ADDONS.sidePanelInset!),
        enabled,
      },
    });
  };

  const updateQuantityProcess = <TPanel extends BodyPanelKey>(
    panel: TPanel,
    key: {
      [K in keyof UnitBodyPanelProcesses[TPanel]]: UnitBodyPanelProcesses[TPanel][K] extends ProcessingQuantitySwitch ? K : never
    }[keyof UnitBodyPanelProcesses[TPanel]],
    patch: Partial<ProcessingQuantitySwitch>,
  ) => {
    const current = bodyPanelProcesses[panel];
    const currentOption = current[key] as ProcessingQuantitySwitch;
    updateBodyPanelProcesses({
      [panel]: {
        ...current,
        [key]: { ...currentOption, ...patch },
      },
    });
  };

  const renderQuantityProcess = <TPanel extends BodyPanelKey>(
    panel: TPanel,
    key: {
      [K in keyof UnitBodyPanelProcesses[TPanel]]: UnitBodyPanelProcesses[TPanel][K] extends ProcessingQuantitySwitch ? K : never
    }[keyof UnitBodyPanelProcesses[TPanel]],
    label: string,
  ) => {
    const option = bodyPanelProcesses[panel][key] as ProcessingQuantitySwitch;

    return (
      <div className="space-y-2 rounded border bg-background px-3 py-2">
        <div className="flex items-center justify-between gap-3">
          <Label className="text-xs">{label}</Label>
          <Switch
            checked={option.enabled}
            onCheckedChange={(enabled) => updateQuantityProcess(panel, key, { enabled })}
          />
        </div>
        {option.enabled && (
          <div>
            <Label className="text-[10px] text-muted-foreground">單片加工數量</Label>
            <Input
              type="number"
              min={0}
              className="h-8 text-xs"
              value={option.quantity}
              onChange={(event) => updateQuantityProcess(panel, key, { quantity: Number(event.target.value) })}
            />
          </div>
        )}
      </div>
    );
  };

  const renderLightGroove = (panel: "top" | "left" | "right", label: string) => {
    const option = bodyPanelProcesses[panel].lightGroove;

    return (
      <div className="space-y-2 rounded border bg-background px-3 py-2">
        <div className="flex items-center justify-between gap-3">
          <Label className="text-xs">{label}</Label>
          <Switch
            checked={option.enabled}
            onCheckedChange={(enabled) => updateLightGroove(panel, { enabled })}
          />
        </div>
        {option.enabled && (
          <div>
            <Label className="text-[10px] text-muted-foreground">離前緣(mm)</Label>
            <Input
              type="number"
              min={0}
              className="h-8 text-xs"
              value={option.offsetFromFrontMm}
              onChange={(event) => updateLightGroove(panel, { offsetFromFrontMm: Number(event.target.value) })}
            />
          </div>
        )}
      </div>
    );
  };

  const renderFrontEdgeABS = (panel: BodyPanelKey) => (
    <div className="flex items-center justify-between gap-3 rounded border bg-background px-3 py-2">
      <div>
        <Label className="text-xs">板厚處切斜邊封ABS</Label>
      </div>
      <Switch
        checked={bodyPanelProcesses[panel].frontEdgeABS !== "none"}
        onCheckedChange={(enabled) => updateFrontEdgeABS(panel, enabled ? "one_long" : "none")}
      />
    </div>
  );

  const renderSlidingDoorTrackGroove = (panel: "top" | "bottom", label: string) => {
    const option = bodyPanelProcesses[panel].slidingDoorTrackGroove;

    return (
      <div className="space-y-2 rounded border bg-background px-3 py-2">
        <div className="flex items-center justify-between gap-3">
          <Label className="text-xs">{label}</Label>
          <Switch
            checked={option.enabled}
            onCheckedChange={(enabled) => updateSlidingDoorTrackGroove(panel, { enabled })}
          />
        </div>
        {option.enabled && (
          <Select
            value={option.trackShape}
            onValueChange={(trackShape) =>
              updateSlidingDoorTrackGroove(panel, { trackShape: trackShape as SlidingDoorTrackShape })
            }
          >
            <SelectTrigger className="h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ㄇ">ㄇ形軌道</SelectItem>
              <SelectItem value="V">V形軌道</SelectItem>
              <SelectItem value="T">T形軌道</SelectItem>
            </SelectContent>
          </Select>
        )}
      </div>
    );
  };

  const renderSideSealBending = (panel: "left" | "right", label: string) => {
    const option = bodyPanelProcesses[panel].sideSealBending;

    return (
      <div className="space-y-2 rounded border bg-background px-3 py-2">
        <div className="flex items-center justify-between gap-3">
          <Label className="text-xs">{label}</Label>
          <Switch
            checked={option.enabled}
            onCheckedChange={(enabled) => updateSideSealBending(panel, { enabled })}
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
                  onChange={(event) => updateSideSealBending(panel, { depthMm: Number(event.target.value) })}
                />
              </div>
              <div className="flex items-center justify-between rounded border bg-background px-3 py-2">
                <Label className="text-xs">內側55mm可見封邊</Label>
                <Switch
                  checked={option.visibleEdgeBand}
                  onCheckedChange={(visibleEdgeBand) => updateSideSealBending(panel, { visibleEdgeBand })}
                />
              </div>
            </div>
            <div className="flex items-center justify-between rounded border bg-background px-3 py-2">
              <Label className="text-xs">抽屜櫃側需補中立板</Label>
              <Switch
                checked={option.isDrawerCabinet}
                onCheckedChange={(isDrawerCabinet) => updateSideSealBending(panel, { isDrawerCabinet })}
              />
            </div>
            {option.isDrawerCabinet && (
              <div className="space-y-2 rounded border border-destructive/40 bg-destructive/10 p-3">
                <div className="flex items-start gap-2 text-xs font-medium text-destructive">
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                  <span>抽屜櫃側會自動補一片中立板，尺寸依櫃高與輸入深度計算。</span>
                </div>
                <div>
                  <Label className="text-[10px] text-muted-foreground">補中立板深度(cm)</Label>
                  <Input
                    type="number"
                    min={1}
                    className="h-8 bg-background text-xs"
                    value={option.drawerDividerDepthCm ?? 55}
                    onChange={(event) => updateSideSealBending(panel, { drawerDividerDepthCm: Number(event.target.value) })}
                  />
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  const renderPanelSection = (key: BodyPanelKey, title: string) => (
    <div className="space-y-3 rounded-md border bg-muted/20 p-3">
      <h4 className="text-xs font-semibold text-slate-700">{title}</h4>
      <div className="grid gap-2 sm:grid-cols-2">
        {key === "top" && (
          <>
            {renderFrontEdgeABS("top")}
            {renderLightGroove("top", "頂板內側燈溝")}
            {renderSlidingDoorTrackGroove("top", "推門軌道溝")}
            {renderQuantityProcess("top", "bookcaseGuideWheelHole", "活動書櫃導輪孔")}
          </>
        )}
        {key === "bottom" && (
          <>
            {renderFrontEdgeABS("bottom")}
            {renderSlidingDoorTrackGroove("bottom", "推門軌道溝")}
            {renderQuantityProcess("bottom", "smallAdjustableFootHole", "小調整腳孔")}
            {renderQuantityProcess("bottom", "lightStWheelHole", "輕型 ST 輪孔")}
            {renderQuantityProcess("bottom", "heavyStWheelHole", "重型 ST 輪孔")}
            {renderQuantityProcess("bottom", "bookcaseGuideWheelHole", "活動書櫃導輪孔")}
          </>
        )}
        {key === "left" && (
          <>
            {renderFrontEdgeABS("left")}
            {renderLightGroove("left", "左側板內側燈溝")}
            {renderSideSealBending("left", "左側封板R50彎曲造型加工")}
            {renderQuantityProcess("left", "hiddenReturnSlideRail", "隱藏式回歸滑軌加工")}
            {renderQuantityProcess("left", "specialUGlassPivot", "特殊 U 型玻璃抽加工")}
            {renderQuantityProcess("left", "tRailBedSet", "T螺床組加工")}
          </>
        )}
        {key === "right" && (
          <>
            {renderFrontEdgeABS("right")}
            {renderLightGroove("right", "右側板內側燈溝")}
            {renderSideSealBending("right", "右側封板R50彎曲造型加工")}
            {renderQuantityProcess("right", "hiddenReturnSlideRail", "隱藏式回歸滑軌加工")}
            {renderQuantityProcess("right", "specialUGlassPivot", "特殊 U 型玻璃抽加工")}
            {renderQuantityProcess("right", "tRailBedSet", "T螺床組加工")}
          </>
        )}
      </div>
    </div>
  );

  if (vendor === "ZHENGDAO") {
    return null;
  }

  return (
    <section className="space-y-3">
      <h3 className="border-b pb-1 text-sm font-semibold">加工選項</h3>

      {renderPanelSection("top", "頂板加工")}
      {renderPanelSection("bottom", "底板加工")}
      <div className="space-y-3 rounded-md border bg-muted/20 p-3">
        <h4 className="text-xs font-semibold text-slate-700">雙側板共用加工</h4>
        <div className="flex items-center justify-between gap-3 rounded border bg-background px-3 py-2">
          <Label className="text-xs">側板崁凹(檔板設計)</Label>
          <Switch
            checked={value.sidePanelInset?.enabled ?? false}
            onCheckedChange={updateSidePanelInset}
          />
        </div>
      </div>
      {renderPanelSection("left", "左側板加工")}
      {renderPanelSection("right", "右側板加工")}
    </section>
  );
}
