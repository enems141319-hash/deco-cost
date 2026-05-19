// src/components/cabinet/DoorForm.tsx
"use client";

import { useMemo, useState } from "react";
import { Check, ChevronDown, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { MaterialDropdown } from "@/components/shared/MaterialDropdown";
import { PROFILE_HANDLE_PROCESSING_RULES } from "@/lib/config/units";
import { cn, generateId } from "@/lib/utils";
import { DEFAULT_DOOR_ADDONS, type DoorInput, type DoorType, type ProfileHandleStyle } from "@/types";

interface Props {
  doors: DoorInput[];
  onChange: (doors: DoorInput[]) => void;
}

const profileHandleOptions: Array<{ value: ProfileHandleStyle; label: string; search: string }> = [
  { value: "none", label: "無加工", search: "none 無加工" },
  { value: "SFJA", label: "SFJA 全J型", search: "SFJA 全J型" },
  { value: "SFJB", label: "SFJB 半J型", search: "SFJB 半J型" },
  { value: "SFJC", label: "SFJC 中J型", search: "SFJC 中J型" },
  { value: "SFJD", label: "SFJD 短J型", search: "SFJD 短J型" },
  { value: "SFCA", label: "SFCA 全C型", search: "SFCA 全C型" },
  ...Object.entries(PROFILE_HANDLE_PROCESSING_RULES).map(([value, rule]) => ({
    value: value as ProfileHandleStyle,
    label: rule.label,
    search: `${value} ${rule.label}`,
  })),
];

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

function ProfileHandleSearchSelect({
  value,
  onChange,
}: {
  value: ProfileHandleStyle;
  onChange: (value: ProfileHandleStyle) => void;
}) {
  const selected = profileHandleOptions.find((option) => option.value === value) ?? profileHandleOptions[0];
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const filtered = useMemo(() => {
    const keyword = query.trim().toLowerCase();
    if (!keyword) return profileHandleOptions;
    return profileHandleOptions.filter((option) => option.search.toLowerCase().includes(keyword));
  }, [query]);

  return (
    <div className="relative">
      <button
        type="button"
        className="flex h-8 w-full items-center justify-between rounded-md border border-input bg-background px-3 text-left text-xs ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
        onClick={() => setOpen((next) => !next)}
      >
        <span className="truncate">{selected.label}</span>
        <ChevronDown className="ml-2 h-3 w-3 shrink-0 opacity-60" />
      </button>
      {open && (
        <div className="absolute z-50 mt-1 w-full rounded-md border bg-popover p-2 shadow-md">
          <Input
            autoFocus
            className="h-8 text-xs"
            placeholder="搜尋型號或品項"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Escape") setOpen(false);
            }}
          />
          <div className="mt-2 max-h-64 overflow-y-auto">
            {filtered.length === 0 && <div className="px-2 py-2 text-xs text-muted-foreground">找不到品項</div>}
            {filtered.map((option) => (
              <button
                key={option.value}
                type="button"
                className={cn(
                  "flex w-full items-center justify-between rounded px-2 py-1.5 text-left text-xs hover:bg-muted",
                  option.value === value && "bg-muted font-medium",
                )}
                onClick={() => {
                  onChange(option.value);
                  setQuery("");
                  setOpen(false);
                }}
              >
                <span className="truncate">{option.label}</span>
                {option.value === value && <Check className="ml-2 h-3 w-3 shrink-0" />}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export function DoorForm({ doors, onChange }: Props) {
  const update = (index: number, patch: Partial<DoorInput>) => {
    const next = doors.map((door, i) => (i === index ? { ...door, ...patch } : door));
    onChange(next);
  };

  const remove = (index: number) => onChange(doors.filter((_, i) => i !== index));

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Label className="text-sm font-semibold">門片</Label>
        <Button type="button" variant="outline" size="sm" onClick={() => onChange([...doors, emptyDoor()])}>
          <Plus className="mr-1 h-3 w-3" />
          新增門片
        </Button>
      </div>

      {doors.length === 0 && <p className="text-xs text-muted-foreground">未設定門片。</p>}

      {doors.map((door, i) => {
        const addons = {
          ...DEFAULT_DOOR_ADDONS,
          ...door.addons,
          profileHandle: {
            ...DEFAULT_DOOR_ADDONS.profileHandle,
            ...door.addons.profileHandle,
          },
        };
        const fullHeightProfileHandle = addons.profileHandle.style === "SFJA" || addons.profileHandle.style === "SFCA";
        const canAddBakedPaint =
          addons.profileHandle.style === "Y1A" ||
          addons.profileHandle.style === "U1A" ||
          addons.profileHandle.style === "V1A";

        return (
          <div key={door.id} className="space-y-2 rounded-md border bg-muted/20 p-3">
            <div className="flex items-center justify-between">
              <div className="flex flex-1 items-center gap-2">
                <Select value={door.type} onValueChange={(value) => update(i, { type: value as DoorType })}>
                  <SelectTrigger className="h-8 w-28 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="HINGED">鉸鏈門</SelectItem>
                    <SelectItem value="SLIDING">滑門</SelectItem>
                  </SelectContent>
                </Select>
                <Input
                  className="h-8 text-xs"
                  placeholder="門片名稱"
                  value={door.name}
                  onChange={(event) => update(i, { name: event.target.value })}
                />
              </div>
              <Button type="button" variant="ghost" size="icon" onClick={() => remove(i)} className="h-8 w-8 text-destructive">
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>

            <div className="grid grid-cols-4 gap-2">
              <div>
                <Label className="text-[10px] text-muted-foreground">寬(cm)</Label>
                <Input type="number" min={1} className="h-8 text-xs" value={door.widthCm} onChange={(event) => update(i, { widthCm: Number(event.target.value) })} />
              </div>
              <div>
                <Label className="text-[10px] text-muted-foreground">高(cm)</Label>
                <Input type="number" min={1} className="h-8 text-xs" value={door.heightCm} onChange={(event) => update(i, { heightCm: Number(event.target.value) })} />
              </div>
              <div>
                <Label className="text-[10px] text-muted-foreground">數量</Label>
                <Input type="number" min={1} className="h-8 text-xs" value={door.quantity} onChange={(event) => update(i, { quantity: Number(event.target.value) })} />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-1.5">
              <div>
                <Label className="text-[10px] text-muted-foreground">門片材料</Label>
                <MaterialDropdown value={door.materialRef} onChange={(ref) => update(i, { materialRef: ref })} categoryFilter="BOARD_DOOR" />
              </div>

              <div className="grid gap-2 rounded border p-2">
                <div className="flex items-center justify-between">
                  <Label className="text-[10px] text-muted-foreground">門片對花（材料費 x1.2）</Label>
                  <Switch checked={addons.patternMatch === "grain"} onCheckedChange={(checked) => update(i, { addons: { ...addons, patternMatch: checked ? "grain" : "none" } })} />
                </div>
                <div className="flex items-center justify-between">
                  <Label className="text-[10px] text-muted-foreground">強化玻璃加工</Label>
                  <Switch checked={addons.temperedGlass} onCheckedChange={(temperedGlass) => update(i, { addons: { ...addons, temperedGlass } })} />
                </div>
                {door.type === "HINGED" && (
                  <div className="flex items-center justify-between">
                    <Label className="text-[10px] text-muted-foreground">鉸鏈孔加工</Label>
                    <Switch checked={addons.hingeHoleDrilling} onCheckedChange={(hingeHoleDrilling) => update(i, { addons: { ...addons, hingeHoleDrilling } })} />
                  </div>
                )}
              </div>

              {door.materialRef?.materialName.includes("鐵網") && (
                <div className="grid gap-2 rounded border p-2">
                  <div>
                    <Label className="text-[10px] text-muted-foreground">鐵網材料</Label>
                    <MaterialDropdown
                      value={door.wireMeshMaterialRef ?? null}
                      onChange={(ref) => update(i, { wireMeshMaterialRef: ref })}
                      categoryFilter="WIRE_MESH"
                      nameIncludes={["擴張網", "沖孔網"]}
                      nameExcludes={["烤漆"]}
                      placeholder="選擇鐵網材料"
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label className="text-[10px] text-muted-foreground">鐵網烤漆加工</Label>
                    <Switch checked={addons.wireMeshPaint} onCheckedChange={(wireMeshPaint) => update(i, { addons: { ...addons, wireMeshPaint } })} />
                  </div>
                </div>
              )}

              <div className="grid gap-2 rounded border p-2">
                <div className="flex items-center justify-between">
                  <Label className="text-[10px] text-muted-foreground">需要鋁製把手</Label>
                  <Switch
                    checked={door.useAluminumHandle ?? Boolean(door.aluminumHandleMaterialRef)}
                    onCheckedChange={(checked) =>
                      update(i, {
                        useAluminumHandle: checked,
                        aluminumHandleMaterialRef: checked ? door.aluminumHandleMaterialRef ?? null : null,
                      })
                    }
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

                <div className="grid grid-cols-1 gap-2 sm:grid-cols-[minmax(0,1fr)_96px_auto]">
                  <div className="sm:col-span-3">
                    <Label className="text-[10px] text-muted-foreground">造型把手加工</Label>
                    <ProfileHandleSearchSelect
                      value={addons.profileHandle.style}
                      onChange={(style) =>
                        update(i, {
                          addons: {
                            ...addons,
                            profileHandle: { ...addons.profileHandle, style },
                          },
                        })
                      }
                    />
                  </div>
                  <div>
                    <Label className="text-[10px] text-muted-foreground">長度 cm</Label>
                    <Input
                      type="number"
                      min={1}
                      className="h-8 text-xs"
                      value={fullHeightProfileHandle ? door.heightCm : addons.profileHandle.lengthCm}
                      disabled={fullHeightProfileHandle}
                      onChange={(event) =>
                        update(i, {
                          addons: {
                            ...addons,
                            profileHandle: { ...addons.profileHandle, lengthCm: Number(event.target.value) },
                          },
                        })
                      }
                    />
                  </div>
                  <div className="flex items-end gap-2 pb-1">
                    <Switch
                      checked={addons.profileHandle.lengthModification}
                      onCheckedChange={(lengthModification) =>
                        update(i, {
                          addons: {
                            ...addons,
                            profileHandle: { ...addons.profileHandle, lengthModification },
                          },
                        })
                      }
                    />
                    <Label className="text-[10px] text-muted-foreground">長度修改</Label>
                  </div>
                  {canAddBakedPaint && (
                    <div className="flex items-end gap-2 pb-1">
                      <Switch
                        checked={addons.profileHandle.bakedPaint}
                        onCheckedChange={(bakedPaint) =>
                          update(i, {
                            addons: {
                              ...addons,
                              profileHandle: { ...addons.profileHandle, bakedPaint },
                            },
                          })
                        }
                      />
                      <Label className="text-[10px] text-muted-foreground">鋁片烤漆加價</Label>
                    </div>
                  )}
                </div>
              </div>

              {door.type === "HINGED" && (
                <div>
                  <Label className="text-[10px] text-muted-foreground">鉸鏈材料</Label>
                  <MaterialDropdown value={door.hingeMaterialRef ?? null} onChange={(ref) => update(i, { hingeMaterialRef: ref })} categoryFilter="HARDWARE_HINGE" />
                </div>
              )}

              {door.type === "SLIDING" && (
                <div>
                  <Label className="text-[10px] text-muted-foreground">滑門五金</Label>
                  <MaterialDropdown value={door.railMaterialRef ?? null} onChange={(ref) => update(i, { railMaterialRef: ref })} categoryFilter="HARDWARE_OTHER" fixedBrandFilter="推拉門五金" />
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
