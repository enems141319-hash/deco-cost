// src/components/cabinet/InternalPartsForm.tsx
"use client";

import { useEffect, useState, type ReactNode } from "react";
import { ChevronDown, Columns3, Layers3, PanelTop, Plus, Trash2, type LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { MaterialDropdown } from "@/components/shared/MaterialDropdown";
import { generateId } from "@/lib/utils";
import { DEFAULT_MIDDLE_DIVIDER_ADDONS, type MaterialRef, type MiddleDividerInput, type ProcessingQuantitySwitch, type ShelfInput, type SideTopBottomSealPanelInput } from "@/types";
import { SpecialProcessesForm } from "./SpecialProcessesForm";
import type { CollapseCommand } from "./CabinetUnitForm";

interface Props {
  middleDividers: MiddleDividerInput[];
  shelves: ShelfInput[];
  sideTopBottomSealPanels: SideTopBottomSealPanelInput[];
  cabinetDepthCm: number;
  cabinetHeightCm: number;
  hasBackPanel: boolean;
  panelMaterialRef: MaterialRef | null;
  kickPlateHeightCm: number;
  onMiddleDividersChange: (v: MiddleDividerInput[]) => void;
  onShelvesChange: (v: ShelfInput[]) => void;
  onSideTopBottomSealPanelsChange: (v: SideTopBottomSealPanelInput[]) => void;
  collapseCommand?: CollapseCommand;
}

function materialThicknessCm(materialRef: MaterialRef | null): number {
  const match = materialRef?.materialName.match(/(\d+(?:\.\d+)?)\s*mm/i);
  if (!match) return 0;
  return Number(match[1]) / 10;
}

function autoFullHeightCm(params: {
  cabinetHeightCm: number;
  panelMaterialRef: MaterialRef | null;
  kickPlateHeightCm: number;
}): number {
  return Math.max(params.cabinetHeightCm - materialThicknessCm(params.panelMaterialRef) * 2 - params.kickPlateHeightCm, 0);
}

function autoFullDepthCm(cabinetDepthCm: number, hasBackPanel: boolean): number {
  return Math.max(cabinetDepthCm - (hasBackPanel ? 2.8 : 0), 0);
}

function CollapsibleGroup({
  title,
  icon: Icon,
  defaultOpen = false,
  command,
  children,
}: {
  title: string;
  icon: LucideIcon;
  defaultOpen?: boolean;
  command?: CollapseCommand;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);

  useEffect(() => {
    if (!command) return;
    setOpen(command.action === "expand");
  }, [command]);

  return (
    <div className="overflow-hidden rounded-md border border-blue-200 bg-background">
      <button
        type="button"
        className="flex w-full items-center justify-between gap-3 bg-blue-600 px-4 py-3 text-left text-sm font-semibold text-white transition-colors hover:bg-blue-700"
        onClick={() => setOpen((next) => !next)}
      >
        <span className="flex min-w-0 items-center gap-2.5">
          <span className="grid h-7 w-7 shrink-0 place-items-center rounded bg-white/15">
            <Icon className="h-4 w-4" />
          </span>
          <span className="truncate">{title}</span>
        </span>
        <ChevronDown className={`h-4 w-4 shrink-0 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && <div className="space-y-3 border-t p-3">{children}</div>}
    </div>
  );
}

export function InternalPartsForm({
  middleDividers,
  shelves,
  sideTopBottomSealPanels,
  cabinetDepthCm,
  cabinetHeightCm,
  hasBackPanel,
  panelMaterialRef,
  kickPlateHeightCm,
  onMiddleDividersChange,
  onShelvesChange,
  onSideTopBottomSealPanelsChange,
  collapseCommand,
}: Props) {
  const defaultDividerAddons = {
    ...DEFAULT_MIDDLE_DIVIDER_ADDONS,
    lightGroove: DEFAULT_MIDDLE_DIVIDER_ADDONS.lightGroove ?? { side: "none", offsetFromFrontMm: 50 },
    hiddenReturnSlideRail: DEFAULT_MIDDLE_DIVIDER_ADDONS.hiddenReturnSlideRail ?? { enabled: false, quantity: 1 },
  };
  const defaultShelfHardwareProcesses = {
    hiddenShelfScrewHole: { enabled: false, quantity: 1 },
    heavyHiddenShelfScrewHole: { enabled: false, quantity: 1 },
  };
  const computedFullHeightCm = autoFullHeightCm({ cabinetHeightCm, panelMaterialRef, kickPlateHeightCm });
  const computedFullDepthCm = autoFullDepthCm(cabinetDepthCm, hasBackPanel);

  const addDivider = () =>
    onMiddleDividersChange([
      ...middleDividers,
      {
        id: generateId(),
        widthCm: 60,
        heightCm: 80,
        fullHeight: false,
        fullWidth: false,
        quantity: 1,
        materialRef: null,
        addons: defaultDividerAddons,
        specialProcesses: [],
      },
    ]);

  const updateDivider = (i: number, patch: Partial<MiddleDividerInput>) =>
    onMiddleDividersChange(middleDividers.map((d, idx) => (idx === i ? { ...d, ...patch } : d)));

  const removeDivider = (i: number) =>
    onMiddleDividersChange(middleDividers.filter((_, idx) => idx !== i));

  const addShelf = () =>
    onShelvesChange([
      ...shelves,
      { id: generateId(), widthCm: 60, depthCm: 35, fullDepth: false, quantity: 1, materialRef: null, lightGroove: { side: "none", offsetFromFrontMm: 50 }, hardwareProcesses: defaultShelfHardwareProcesses, specialProcesses: [] },
    ]);

  const updateShelf = (i: number, patch: Partial<ShelfInput>) =>
    onShelvesChange(shelves.map((s, idx) => (idx === i ? { ...s, ...patch } : s)));

  const renderQuantityProcess = (
    label: string,
    option: ProcessingQuantitySwitch | undefined,
    onPatch: (patch: Partial<ProcessingQuantitySwitch>) => void,
  ) => {
    const normalized = option ?? { enabled: false, quantity: 1 };

    return (
      <div className="space-y-2 rounded border bg-background px-3 py-2">
        <div className="flex items-center justify-between gap-3">
          <Label className="text-xs">{label}</Label>
          <Switch
            checked={normalized.enabled}
            onCheckedChange={(enabled) => onPatch({ enabled })}
          />
        </div>
        {normalized.enabled && (
          <div>
            <Label className="text-[10px] text-muted-foreground">單片加工數量</Label>
            <Input
              type="number"
              min={0}
              className="h-8 text-xs"
              value={normalized.quantity}
              onChange={(event) => onPatch({ quantity: Number(event.target.value) })}
            />
          </div>
        )}
      </div>
    );
  };

  const removeShelf = (i: number) =>
    onShelvesChange(shelves.filter((_, idx) => idx !== i));

  const addSideTopBottomSealPanel = () =>
    onSideTopBottomSealPanelsChange([
      ...sideTopBottomSealPanels,
      { id: generateId(), name: "側/頂/底封板", widthCm: 60, heightCm: 35, quantity: 1, materialRef: null },
    ]);

  const updateSideTopBottomSealPanel = (i: number, patch: Partial<SideTopBottomSealPanelInput>) =>
    onSideTopBottomSealPanelsChange(sideTopBottomSealPanels.map((panel, idx) => (idx === i ? { ...panel, ...patch } : panel)));

  const removeSideTopBottomSealPanel = (i: number) =>
    onSideTopBottomSealPanelsChange(sideTopBottomSealPanels.filter((_, idx) => idx !== i));

  return (
    <div className="space-y-4">
      {/* 中立板 */}
      <CollapsibleGroup title={"\u4e2d\u7acb\u677f"} icon={Columns3} command={collapseCommand}>
        <div className="flex items-center justify-between">
          <Label className="text-sm font-semibold">中立板</Label>
          <Button type="button" variant="outline" size="sm" onClick={addDivider}>
            <Plus className="h-3 w-3 mr-1" />新增
          </Button>
        </div>
        {middleDividers.length === 0 && (
          <p className="text-xs text-muted-foreground">尚未新增中立板</p>
        )}
        {middleDividers.map((d, i) => (
          <div key={d.id} className="border rounded p-2 space-y-2 bg-muted/20">
            <div className="grid grid-cols-4 gap-2 items-end">
              <div>
                <Label className="text-[10px] text-muted-foreground">寬(cm)</Label>
                <Input type="number" min={1} className="h-8 text-xs" value={d.fullWidth ? computedFullDepthCm : d.widthCm}
                  disabled={d.fullWidth}
                  onChange={(e) => updateDivider(i, { widthCm: Number(e.target.value) })} />
              </div>
              <div>
                <Label className="text-[10px] text-muted-foreground">高(cm)</Label>
                <Input type="number" min={1} className="h-8 text-xs" value={d.fullHeight ? computedFullHeightCm : d.heightCm}
                  disabled={d.fullHeight}
                  onChange={(e) => updateDivider(i, { heightCm: Number(e.target.value) })} />
              </div>
              <div>
                <Label className="text-[10px] text-muted-foreground">數量</Label>
                <Input type="number" min={1} className="h-8 text-xs" value={d.quantity}
                  onChange={(e) => updateDivider(i, { quantity: Number(e.target.value) })} />
              </div>
              <Button type="button" variant="ghost" size="icon" onClick={() => removeDivider(i)} className="h-8 w-8 text-destructive">
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
              <label className="flex items-center justify-between rounded border bg-background px-3 py-2">
                <span className="text-xs">全高</span>
                <Switch
                  checked={d.fullHeight ?? false}
                  onCheckedChange={(fullHeight) => updateDivider(i, { fullHeight })}
                />
              </label>
              <label className="flex items-center justify-between rounded border bg-background px-3 py-2">
                <span className="text-xs">全寬</span>
                <Switch
                  checked={d.fullWidth ?? false}
                  onCheckedChange={(fullWidth) => updateDivider(i, { fullWidth })}
                />
              </label>
            </div>
            <MaterialDropdown value={d.materialRef} onChange={(ref) => updateDivider(i, { materialRef: ref })} categoryFilter="BOARD_BODY" />
            <div className="grid gap-2 sm:grid-cols-2">
              <div className="flex items-center justify-between rounded border bg-background px-3 py-2">
                <Label className="text-xs">雙排孔（+5 元/才）</Label>
                <Switch
                  checked={(d.addons ?? DEFAULT_MIDDLE_DIVIDER_ADDONS).doubleDrillHoles}
                  onCheckedChange={(doubleDrillHoles) =>
                    updateDivider(i, {
                      addons: {
                        ...(d.addons ?? DEFAULT_MIDDLE_DIVIDER_ADDONS),
                        doubleDrillHoles,
                        nonStandardHoles: doubleDrillHoles
                          ? (d.addons ?? DEFAULT_MIDDLE_DIVIDER_ADDONS).nonStandardHoles
                          : false,
                      },
                    })
                  }
                />
              </div>
              <div className="flex items-center justify-between rounded border bg-background px-3 py-2">
                <Label className="text-xs text-muted-foreground">非規格孔位（+5 元/才）</Label>
                <Switch
                  checked={(d.addons ?? DEFAULT_MIDDLE_DIVIDER_ADDONS).nonStandardHoles}
                  disabled={!(d.addons ?? DEFAULT_MIDDLE_DIVIDER_ADDONS).doubleDrillHoles}
                  onCheckedChange={(nonStandardHoles) =>
                    updateDivider(i, { addons: { ...(d.addons ?? DEFAULT_MIDDLE_DIVIDER_ADDONS), nonStandardHoles } })
                  }
                />
              </div>
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
              {renderQuantityProcess(
                "隱藏式回歸滑軌加工",
                (d.addons ?? defaultDividerAddons).hiddenReturnSlideRail,
                (patch) =>
                  updateDivider(i, {
                    addons: {
                      ...(d.addons ?? defaultDividerAddons),
                      hiddenReturnSlideRail: {
                        ...((d.addons ?? defaultDividerAddons).hiddenReturnSlideRail ?? { enabled: false, quantity: 1 }),
                        ...patch,
                      },
                    },
                  }),
              )}
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
              <div>
                <Label className="text-[10px] text-muted-foreground">中立板燈溝面</Label>
                <Select
                  value={(d.addons ?? defaultDividerAddons).lightGroove?.side ?? "none"}
                  onValueChange={(side) =>
                    updateDivider(i, {
                      addons: {
                        ...(d.addons ?? defaultDividerAddons),
                        lightGroove: {
                          ...((d.addons ?? defaultDividerAddons).lightGroove ?? { side: "none", offsetFromFrontMm: 50 }),
                          side: side as "none" | "left" | "right",
                        },
                      },
                    })
                  }
                >
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">不開</SelectItem>
                    <SelectItem value="left">左側</SelectItem>
                    <SelectItem value="right">右側</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {((d.addons ?? defaultDividerAddons).lightGroove?.side ?? "none") !== "none" && (
                <div>
                  <Label className="text-[10px] text-muted-foreground">離前緣(mm)</Label>
                  <Input
                    type="number"
                    min={0}
                    className="h-8 text-xs"
                    value={(d.addons ?? defaultDividerAddons).lightGroove?.offsetFromFrontMm ?? 50}
                    onChange={(event) =>
                      updateDivider(i, {
                        addons: {
                          ...(d.addons ?? defaultDividerAddons),
                          lightGroove: {
                            ...((d.addons ?? defaultDividerAddons).lightGroove ?? { side: "none", offsetFromFrontMm: 50 }),
                            offsetFromFrontMm: Number(event.target.value),
                          },
                        },
                      })
                    }
                  />
                </div>
              )}
            </div>
            <SpecialProcessesForm
              value={d.specialProcesses ?? []}
              onChange={(specialProcesses) => updateDivider(i, { specialProcesses })}
              boardWidthCm={d.fullWidth ? computedFullDepthCm : d.widthCm}
              boardHeightCm={d.fullHeight ? computedFullHeightCm : d.heightCm}
            />
          </div>
        ))}
      </CollapsibleGroup>

      {/* 櫃內層板 */}
      <CollapsibleGroup title={"\u5c64\u677f"} icon={Layers3} command={collapseCommand}>
        <div className="flex items-center justify-between">
          <Label className="text-sm font-semibold">櫃內層板</Label>
          <Button type="button" variant="outline" size="sm" onClick={addShelf}>
            <Plus className="h-3 w-3 mr-1" />新增
          </Button>
        </div>
        {shelves.length === 0 && (
          <p className="text-xs text-muted-foreground">尚未新增櫃內層板</p>
        )}
        {shelves.map((s, i) => (
          <div key={s.id} className="border rounded p-2 space-y-2 bg-muted/20">
            <div className="grid grid-cols-4 gap-2 items-end">
              <div>
                <Label className="text-[10px] text-muted-foreground">寬(cm)</Label>
                <Input type="number" min={1} className="h-8 text-xs" value={s.widthCm}
                  onChange={(e) => updateShelf(i, { widthCm: Number(e.target.value) })} />
              </div>
              <div>
                <Label className="text-[10px] text-muted-foreground">深(cm)</Label>
                <Input type="number" min={1} className="h-8 text-xs" value={s.fullDepth ? computedFullDepthCm : s.depthCm}
                  disabled={s.fullDepth}
                  onChange={(e) => updateShelf(i, { depthCm: Number(e.target.value) })} />
              </div>
              <div>
                <Label className="text-[10px] text-muted-foreground">數量</Label>
                <Input type="number" min={1} className="h-8 text-xs" value={s.quantity}
                  onChange={(e) => updateShelf(i, { quantity: Number(e.target.value) })} />
              </div>
              <Button type="button" variant="ghost" size="icon" onClick={() => removeShelf(i)} className="h-8 w-8 text-destructive">
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>
            <label className="flex items-center justify-between rounded border bg-background px-3 py-2">
              <span className="text-xs">全深</span>
              <Switch
                checked={s.fullDepth ?? false}
                onCheckedChange={(fullDepth) => updateShelf(i, { fullDepth })}
              />
            </label>
            <MaterialDropdown value={s.materialRef} onChange={(ref) => updateShelf(i, { materialRef: ref })} categoryFilter="BOARD_BODY" />
            <div className="grid gap-2 sm:grid-cols-2">
              {renderQuantityProcess(
                "隱藏式層板螺絲孔（限25mm）",
                (s.hardwareProcesses ?? defaultShelfHardwareProcesses).hiddenShelfScrewHole,
                (patch) =>
                  updateShelf(i, {
                    hardwareProcesses: {
                      ...(s.hardwareProcesses ?? defaultShelfHardwareProcesses),
                      hiddenShelfScrewHole: {
                        ...((s.hardwareProcesses ?? defaultShelfHardwareProcesses).hiddenShelfScrewHole),
                        ...patch,
                      },
                    },
                  }),
              )}
              {renderQuantityProcess(
                "重型隱藏式層板螺絲孔",
                (s.hardwareProcesses ?? defaultShelfHardwareProcesses).heavyHiddenShelfScrewHole,
                (patch) =>
                  updateShelf(i, {
                    hardwareProcesses: {
                      ...(s.hardwareProcesses ?? defaultShelfHardwareProcesses),
                      heavyHiddenShelfScrewHole: {
                        ...((s.hardwareProcesses ?? defaultShelfHardwareProcesses).heavyHiddenShelfScrewHole),
                        ...patch,
                      },
                    },
                  }),
              )}
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
              <div>
                <Label className="text-[10px] text-muted-foreground">櫃內層板燈溝面</Label>
                <Select
                  value={s.lightGroove?.side ?? "none"}
                  onValueChange={(side) =>
                    updateShelf(i, {
                      lightGroove: {
                        ...(s.lightGroove ?? { side: "none", offsetFromFrontMm: 50 }),
                        side: side as "none" | "top" | "bottom",
                      },
                    })
                  }
                >
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">不開</SelectItem>
                    <SelectItem value="top">上面</SelectItem>
                    <SelectItem value="bottom">下面</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {(s.lightGroove?.side ?? "none") !== "none" && (
                <div>
                  <Label className="text-[10px] text-muted-foreground">離前緣(mm)</Label>
                  <Input
                    type="number"
                    min={0}
                    className="h-8 text-xs"
                    value={s.lightGroove?.offsetFromFrontMm ?? 50}
                    onChange={(event) =>
                      updateShelf(i, {
                        lightGroove: {
                          ...(s.lightGroove ?? { side: "none", offsetFromFrontMm: 50 }),
                          offsetFromFrontMm: Number(event.target.value),
                        },
                      })
                    }
                  />
                </div>
              )}
            </div>
            <SpecialProcessesForm
              value={s.specialProcesses ?? []}
              onChange={(specialProcesses) => updateShelf(i, { specialProcesses })}
              boardWidthCm={s.widthCm}
              boardHeightCm={s.fullDepth ? computedFullDepthCm : s.depthCm}
            />
          </div>
        ))}
      </CollapsibleGroup>

      {/* 側/頂/底封板 */}
      <CollapsibleGroup title={"\u5074\u9802\u5e95\u5c01\u677f"} icon={PanelTop} command={collapseCommand}>
        <div className="flex items-center justify-between">
          <Label className="text-sm font-semibold">側/頂/底封板</Label>
          <Button type="button" variant="outline" size="sm" onClick={addSideTopBottomSealPanel}>
            <Plus className="h-3 w-3 mr-1" />新增
          </Button>
        </div>
        {sideTopBottomSealPanels.length === 0 && (
          <p className="text-xs text-muted-foreground">尚未新增側/頂/底封板</p>
        )}
        {sideTopBottomSealPanels.map((panel, i) => (
          <div key={panel.id} className="border rounded p-2 space-y-2 bg-muted/20">
            <div>
              <Label className="text-[10px] text-muted-foreground">品項名稱</Label>
              <Input
                className="h-8 text-xs"
                value={panel.name}
                onChange={(e) => updateSideTopBottomSealPanel(i, { name: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-4 gap-2 items-end">
              <div>
                <Label className="text-[10px] text-muted-foreground">寬(cm)</Label>
                <Input type="number" min={1} className="h-8 text-xs" value={panel.widthCm}
                  onChange={(e) => updateSideTopBottomSealPanel(i, { widthCm: Number(e.target.value) })} />
              </div>
              <div>
                <Label className="text-[10px] text-muted-foreground">高(cm)</Label>
                <Input type="number" min={1} className="h-8 text-xs" value={panel.heightCm}
                  onChange={(e) => updateSideTopBottomSealPanel(i, { heightCm: Number(e.target.value) })} />
              </div>
              <div>
                <Label className="text-[10px] text-muted-foreground">數量</Label>
                <Input type="number" min={1} className="h-8 text-xs" value={panel.quantity}
                  onChange={(e) => updateSideTopBottomSealPanel(i, { quantity: Number(e.target.value) })} />
              </div>
              <Button type="button" variant="ghost" size="icon" onClick={() => removeSideTopBottomSealPanel(i)} className="h-8 w-8 text-destructive">
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>
            <MaterialDropdown
              value={panel.materialRef}
              onChange={(ref) => updateSideTopBottomSealPanel(i, { materialRef: ref })}
              categoryFilter="BOARD_BODY"
            />
          </div>
        ))}
      </CollapsibleGroup>
    </div>
  );
}
