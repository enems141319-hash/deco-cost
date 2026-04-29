// src/components/cabinet/DoorForm.tsx
"use client";

import { Trash2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { MaterialDropdown } from "@/components/shared/MaterialDropdown";
import { generateId } from "@/lib/utils";
import { DEFAULT_DOOR_ADDONS, type DoorInput, type DoorType, type ProfileHandleStyle } from "@/types";

interface Props {
  doors: DoorInput[];
  onChange: (doors: DoorInput[]) => void;
}

function emptyDoor(): DoorInput {
  return {
    id: generateId(),
    type: "HINGED",
    name: "",
    widthCm: 45,
    heightCm: 90,
    quantity: 1,
    materialRef: null,
    addons: DEFAULT_DOOR_ADDONS,
    hingeMaterialRef: null,
    railMaterialRef: null,
    wireMeshMaterialRef: null,
    useAluminumHandle: false,
    aluminumHandleMaterialRef: null,
  };
}

export function DoorForm({ doors, onChange }: Props) {
  const update = (index: number, patch: Partial<DoorInput>) => {
    const next = doors.map((d, i) => (i === index ? { ...d, ...patch } : d));
    onChange(next);
  };

  const remove = (index: number) => onChange(doors.filter((_, i) => i !== index));

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Label className="text-sm font-semibold">門片</Label>
        <Button type="button" variant="outline" size="sm" onClick={() => onChange([...doors, emptyDoor()])}>
          <Plus className="h-3 w-3 mr-1" />新增門片
        </Button>
      </div>

      {doors.length === 0 && (
        <p className="text-xs text-muted-foreground">尚未新增門片</p>
      )}

      {doors.map((door, i) => {
        const fullHeightProfileHandle = door.addons.profileHandle.style === "SFJA" || door.addons.profileHandle.style === "SFCA";

        return (
        <div key={door.id} className="border rounded-md p-3 space-y-2 bg-muted/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 flex-1">
              <Select
                value={door.type}
                onValueChange={(v) => update(i, { type: v as DoorType })}
              >
                <SelectTrigger className="w-28 h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="HINGED">鉸鏈門</SelectItem>
                  <SelectItem value="SLIDING">滑門</SelectItem>
                </SelectContent>
              </Select>
              <Input
                className="h-8 text-xs"
                placeholder="門片名稱（選填）"
                value={door.name}
                onChange={(e) => update(i, { name: e.target.value })}
              />
            </div>
            <Button type="button" variant="ghost" size="icon" onClick={() => remove(i)} className="h-8 w-8 text-destructive">
              <Trash2 className="h-3 w-3" />
            </Button>
          </div>

          <div className="grid grid-cols-4 gap-2">
            <div>
              <Label className="text-[10px] text-muted-foreground">寬(cm)</Label>
              <Input
                type="number" min={1} className="h-8 text-xs"
                value={door.widthCm}
                onChange={(e) => update(i, { widthCm: Number(e.target.value) })}
              />
            </div>
            <div>
              <Label className="text-[10px] text-muted-foreground">高(cm)</Label>
              <Input
                type="number" min={1} className="h-8 text-xs"
                value={door.heightCm}
                onChange={(e) => update(i, { heightCm: Number(e.target.value) })}
              />
            </div>
            <div>
              <Label className="text-[10px] text-muted-foreground">數量</Label>
              <Input
                type="number" min={1} className="h-8 text-xs"
                value={door.quantity}
                onChange={(e) => update(i, { quantity: Number(e.target.value) })}
              />
            </div>
          </div>

          {/* 門片材料 */}
          <div className="grid grid-cols-1 gap-1.5">
            <div>
              <Label className="text-[10px] text-muted-foreground">門片材料</Label>
              <MaterialDropdown
                value={door.materialRef}
                onChange={(ref) => update(i, { materialRef: ref })}
                categoryFilter="BOARD_DOOR"
              />
            </div>

            <div className="grid gap-2 rounded border p-2">
              <div className="flex items-center justify-between">
                <Label className="text-[10px] text-muted-foreground">對花（直紋 ×1.2）</Label>
                <Switch
                  checked={door.addons.patternMatch === "grain"}
                  onCheckedChange={(checked) =>
                    update(i, { addons: { ...door.addons, patternMatch: checked ? "grain" : "none" } })
                  }
                />
              </div>
              <div className="flex items-center justify-between">
                <Label className="text-[10px] text-muted-foreground">強化玻璃（+50 元/才）</Label>
                <Switch
                  checked={door.addons.temperedGlass}
                  onCheckedChange={(temperedGlass) => update(i, { addons: { ...door.addons, temperedGlass } })}
                />
              </div>
              {door.type === "HINGED" && (
                <div className="flex items-center justify-between">
                  <Label className="text-[10px] text-muted-foreground">門板鉸鏈孔（+5 元/孔）</Label>
                  <Switch
                    checked={door.addons.hingeHoleDrilling}
                    onCheckedChange={(hingeHoleDrilling) => update(i, { addons: { ...door.addons, hingeHoleDrilling } })}
                  />
                  {fullHeightProfileHandle && (
                    <p className="mt-1 text-[10px] text-muted-foreground">全J/全C依門片高度計算</p>
                  )}
                </div>
              )}
            </div>

            {door.materialRef?.materialName.includes("鐵網") && (
              <div className="grid gap-2 rounded border p-2">
                <div>
                  <Label className="text-[10px] text-muted-foreground">鐵網型號</Label>
                  <MaterialDropdown
                    value={door.wireMeshMaterialRef ?? null}
                    onChange={(ref) => update(i, { wireMeshMaterialRef: ref })}
                    categoryFilter="WIRE_MESH"
                    nameIncludes={["擴張網", "沖孔網"]}
                    nameExcludes={["烤漆"]}
                    placeholder="選擇擴張網或沖孔網"
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label className="text-[10px] text-muted-foreground">鐵網指定色烤漆加工（+60 元/才）</Label>
                  <Switch
                    checked={door.addons.wireMeshPaint}
                    onCheckedChange={(wireMeshPaint) => update(i, { addons: { ...door.addons, wireMeshPaint } })}
                  />
                </div>
              </div>
            )}

            <div className="grid gap-2 rounded border p-2">
              <div className="flex items-center justify-between">
                <Label className="text-[10px] text-muted-foreground">需要鋁製把手</Label>
                <Switch
                  checked={door.useAluminumHandle ?? Boolean(door.aluminumHandleMaterialRef)}
                  onCheckedChange={(checked) => {
                    update(i, {
                      useAluminumHandle: checked,
                      aluminumHandleMaterialRef: checked ? door.aluminumHandleMaterialRef ?? null : null,
                    });
                  }}
                />
              </div>
              {(door.useAluminumHandle ?? Boolean(door.aluminumHandleMaterialRef)) && (
                <div>
                  <Label className="text-[10px] text-muted-foreground">鋁把手型號</Label>
                  <MaterialDropdown
                    value={door.aluminumHandleMaterialRef ?? null}
                    onChange={(ref) => update(i, { aluminumHandleMaterialRef: ref })}
                    categoryFilter="HARDWARE_HANDLE"
                    placeholder="選擇鋁把手型號"
                  />
                </div>
              )}
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-[1fr_96px_auto]">
                <div>
                  <Label className="text-[10px] text-muted-foreground">造型把手加工</Label>
                  <Select
                    value={door.addons.profileHandle.style}
                    onValueChange={(style) =>
                      update(i, {
                        addons: {
                          ...door.addons,
                          profileHandle: { ...door.addons.profileHandle, style: style as ProfileHandleStyle },
                        },
                      })
                    }
                  >
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">不加工</SelectItem>
                      <SelectItem value="SFJA">SFJA 全J型</SelectItem>
                      <SelectItem value="SFJB">SFJB 半J型</SelectItem>
                      <SelectItem value="SFJC">SFJC 中J型</SelectItem>
                      <SelectItem value="SFJD">SFJD 短J型</SelectItem>
                      <SelectItem value="SFCA">SFCA 全C型</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-[10px] text-muted-foreground">長度 cm</Label>
                  <Input
                    type="number"
                    min={1}
                    className="h-8 text-xs"
                    value={fullHeightProfileHandle ? door.heightCm : door.addons.profileHandle.lengthCm}
                    disabled={fullHeightProfileHandle}
                    onChange={(event) =>
                      update(i, {
                        addons: {
                          ...door.addons,
                          profileHandle: { ...door.addons.profileHandle, lengthCm: Number(event.target.value) },
                        },
                      })
                    }
                  />
                </div>
                <div className="flex items-end gap-2 pb-1">
                  <Switch
                    checked={door.addons.profileHandle.lengthModification}
                    onCheckedChange={(lengthModification) =>
                      update(i, {
                        addons: {
                          ...door.addons,
                          profileHandle: { ...door.addons.profileHandle, lengthModification },
                        },
                      })
                    }
                  />
                  <Label className="text-[10px] text-muted-foreground">長度修改</Label>
                </div>
              </div>
            </div>

            {door.type === "HINGED" && (
              <div>
                <Label className="text-[10px] text-muted-foreground">
                  鉸鏈（自動計算數量）
                </Label>
                <MaterialDropdown
                  value={door.hingeMaterialRef ?? null}
                  onChange={(ref) => update(i, { hingeMaterialRef: ref })}
                  categoryFilter="HARDWARE_HINGE"
                />
              </div>
            )}

            {door.type === "SLIDING" && (
              <div>
                <Label className="text-[10px] text-muted-foreground">
                  推拉門五金
                </Label>
                <MaterialDropdown
                  value={door.railMaterialRef ?? null}
                  onChange={(ref) => update(i, { railMaterialRef: ref })}
                  categoryFilter="HARDWARE_OTHER"
                />
              </div>
            )}
          </div>
        </div>
        );
      })}
    </div>
  );
}
