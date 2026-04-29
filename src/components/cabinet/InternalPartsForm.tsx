// src/components/cabinet/InternalPartsForm.tsx
"use client";

import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { MaterialDropdown } from "@/components/shared/MaterialDropdown";
import { generateId } from "@/lib/utils";
import { DEFAULT_MIDDLE_DIVIDER_ADDONS, type MiddleDividerInput, type ShelfInput } from "@/types";

interface Props {
  middleDividers: MiddleDividerInput[];
  shelves: ShelfInput[];
  onMiddleDividersChange: (v: MiddleDividerInput[]) => void;
  onShelvesChange: (v: ShelfInput[]) => void;
}

export function InternalPartsForm({ middleDividers, shelves, onMiddleDividersChange, onShelvesChange }: Props) {
  const defaultDividerAddons = {
    ...DEFAULT_MIDDLE_DIVIDER_ADDONS,
    lightGroove: DEFAULT_MIDDLE_DIVIDER_ADDONS.lightGroove ?? { side: "none", offsetFromFrontMm: 50 },
  };

  const addDivider = () =>
    onMiddleDividersChange([
      ...middleDividers,
      {
        id: generateId(),
        widthCm: 60,
        heightCm: 80,
        quantity: 1,
        materialRef: null,
        addons: defaultDividerAddons,
      },
    ]);

  const updateDivider = (i: number, patch: Partial<MiddleDividerInput>) =>
    onMiddleDividersChange(middleDividers.map((d, idx) => (idx === i ? { ...d, ...patch } : d)));

  const removeDivider = (i: number) =>
    onMiddleDividersChange(middleDividers.filter((_, idx) => idx !== i));

  const addShelf = () =>
    onShelvesChange([
      ...shelves,
      { id: generateId(), widthCm: 60, depthCm: 35, quantity: 1, materialRef: null, lightGroove: { side: "none", offsetFromFrontMm: 50 } },
    ]);

  const updateShelf = (i: number, patch: Partial<ShelfInput>) =>
    onShelvesChange(shelves.map((s, idx) => (idx === i ? { ...s, ...patch } : s)));

  const removeShelf = (i: number) =>
    onShelvesChange(shelves.filter((_, idx) => idx !== i));

  return (
    <div className="space-y-4">
      {/* 中隔板 */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label className="text-sm font-semibold">中隔板</Label>
          <Button type="button" variant="outline" size="sm" onClick={addDivider}>
            <Plus className="h-3 w-3 mr-1" />新增
          </Button>
        </div>
        {middleDividers.length === 0 && (
          <p className="text-xs text-muted-foreground">尚未新增中隔板</p>
        )}
        {middleDividers.map((d, i) => (
          <div key={d.id} className="border rounded p-2 space-y-2 bg-muted/20">
            <div className="grid grid-cols-4 gap-2 items-end">
              <div>
                <Label className="text-[10px] text-muted-foreground">寬(cm)</Label>
                <Input type="number" min={1} className="h-8 text-xs" value={d.widthCm}
                  onChange={(e) => updateDivider(i, { widthCm: Number(e.target.value) })} />
              </div>
              <div>
                <Label className="text-[10px] text-muted-foreground">高(cm)</Label>
                <Input type="number" min={1} className="h-8 text-xs" value={d.heightCm}
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
              <div>
                <Label className="text-[10px] text-muted-foreground">中隔板燈溝面</Label>
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
          </div>
        ))}
      </div>

      {/* 層板 */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label className="text-sm font-semibold">層板</Label>
          <Button type="button" variant="outline" size="sm" onClick={addShelf}>
            <Plus className="h-3 w-3 mr-1" />新增
          </Button>
        </div>
        {shelves.length === 0 && (
          <p className="text-xs text-muted-foreground">尚未新增層板</p>
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
                <Input type="number" min={1} className="h-8 text-xs" value={s.depthCm}
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
            <MaterialDropdown value={s.materialRef} onChange={(ref) => updateShelf(i, { materialRef: ref })} categoryFilter="BOARD_BODY" />
            <div className="grid gap-2 sm:grid-cols-2">
              <div>
                <Label className="text-[10px] text-muted-foreground">層板燈溝面</Label>
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
          </div>
        ))}
      </div>
    </div>
  );
}
