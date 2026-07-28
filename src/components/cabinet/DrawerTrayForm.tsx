"use client";

import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { MaterialDropdown } from "@/components/shared/MaterialDropdown";
import { VendorBoardMaterialDropdown } from "@/components/shared/VendorBoardMaterialDropdown";
import { generateId } from "@/lib/utils";
import type { DrawerTrayInput } from "@/types";

interface Props {
  trays: DrawerTrayInput[];
  onChange: (trays: DrawerTrayInput[]) => void;
}

function emptyTray(): DrawerTrayInput {
  return {
    id: generateId(),
    name: "抽盤",
    widthCm: 60,
    depthCm: 45,
    quantity: 1,
    materialRef: null,
    includeRailInQuote: false,
    railQuantity: 1,
    railMaterialRef: null,
    frontPanel: {
      enabled: false,
      widthCm: 60,
      heightCm: 16,
      materialRef: null,
    },
  };
}

export function DrawerTrayForm({ trays, onChange }: Props) {
  const update = (index: number, patch: Partial<DrawerTrayInput>) =>
    onChange(trays.map((tray, i) => (i === index ? { ...tray, ...patch } : tray)));

  const remove = (index: number) => onChange(trays.filter((_, i) => i !== index));

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Label className="text-sm font-semibold">抽盤</Label>
        <Button type="button" variant="outline" size="sm" onClick={() => onChange([...trays, emptyTray()])}>
          <Plus className="mr-1 h-3 w-3" />
          新增抽盤
        </Button>
      </div>

      {trays.length === 0 && <p className="text-xs text-muted-foreground">未設定抽盤。</p>}

      {trays.map((tray, index) => {
        const frontPanel = {
          enabled: false,
          widthCm: tray.widthCm,
          heightCm: 16,
          materialRef: null,
          ...tray.frontPanel,
        };
        const includeRailInQuote = tray.includeRailInQuote ?? false;

        return (
          <div key={tray.id} className="space-y-3 rounded border bg-muted/20 p-3">
            <div className="flex items-center gap-2">
              <Input
                className="h-8 text-xs"
                value={tray.name}
                onChange={(event) => update(index, { name: event.target.value })}
                placeholder="抽盤名稱"
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => remove(index)}
                className="h-8 w-8 text-destructive"
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div>
                <Label className="text-[10px] text-muted-foreground">寬(cm)</Label>
                <Input
                  type="number"
                  min={1}
                  className="h-8 text-xs"
                  value={tray.widthCm}
                  onChange={(event) => update(index, { widthCm: Number(event.target.value) })}
                />
              </div>
              <div>
                <Label className="text-[10px] text-muted-foreground">深(cm)</Label>
                <Input
                  type="number"
                  min={1}
                  className="h-8 text-xs"
                  value={tray.depthCm}
                  onChange={(event) => update(index, { depthCm: Number(event.target.value) })}
                />
              </div>
              <div>
                <Label className="text-[10px] text-muted-foreground">數量</Label>
                <Input
                  type="number"
                  min={1}
                  className="h-8 text-xs"
                  value={tray.quantity}
                  onChange={(event) => update(index, { quantity: Number(event.target.value) })}
                />
              </div>
            </div>

            <div>
              <Label className="text-[10px] text-muted-foreground">抽盤材料</Label>
              <VendorBoardMaterialDropdown
                value={tray.materialRef}
                onChange={(materialRef) => update(index, { materialRef })}
                category="BOARD_BACKING"
              />
            </div>

            <div className="space-y-2 rounded border bg-background p-3">
              <div className="flex items-center justify-between gap-3">
                <Label className="text-sm font-semibold">訂購滑軌</Label>
                <Switch
                  checked={includeRailInQuote}
                  onCheckedChange={(checked) => update(index, { includeRailInQuote: checked })}
                />
              </div>
              {includeRailInQuote && (
                <div className="space-y-2">
                  <div>
                    <Label className="text-[10px] text-muted-foreground">滑軌數量</Label>
                    <Input
                      type="number"
                      min={0.1}
                      step={0.1}
                      className="h-8 text-xs"
                      value={tray.railQuantity ?? tray.quantity}
                      onChange={(event) => update(index, { railQuantity: Number(event.target.value) })}
                    />
                  </div>
                  <MaterialDropdown
                    value={tray.railMaterialRef ?? null}
                    onChange={(railMaterialRef) => update(index, { railMaterialRef })}
                    categoryFilter="HARDWARE_RAIL"
                    placeholder="選擇正道滑軌"
                  />
                </div>
              )}
            </div>

            <div className="space-y-2 rounded border bg-background p-3">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <Label className="text-xs font-semibold">抽頭</Label>
                  <p className="text-[10px] text-muted-foreground">開啟後可另計抽頭尺寸與板材。</p>
                </div>
                <Switch
                  checked={frontPanel.enabled}
                  onCheckedChange={(enabled) => update(index, { frontPanel: { ...frontPanel, enabled } })}
                />
              </div>

              {frontPanel.enabled && (
                <div className="space-y-2">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label className="text-[10px] text-muted-foreground">抽頭寬(cm)</Label>
                      <Input
                        type="number"
                        min={1}
                        className="h-8 text-xs"
                        value={frontPanel.widthCm}
                        onChange={(event) =>
                          update(index, { frontPanel: { ...frontPanel, widthCm: Number(event.target.value) } })
                        }
                      />
                    </div>
                    <div>
                      <Label className="text-[10px] text-muted-foreground">抽頭高(cm)</Label>
                      <Input
                        type="number"
                        min={1}
                        className="h-8 text-xs"
                        value={frontPanel.heightCm}
                        onChange={(event) =>
                          update(index, { frontPanel: { ...frontPanel, heightCm: Number(event.target.value) } })
                        }
                      />
                    </div>
                  </div>
                  <div>
                    <Label className="text-[10px] text-muted-foreground">抽頭材料</Label>
                    <VendorBoardMaterialDropdown
                      value={frontPanel.materialRef}
                      onChange={(materialRef) => update(index, { frontPanel: { ...frontPanel, materialRef } })}
                      category="BOARD_BODY"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
