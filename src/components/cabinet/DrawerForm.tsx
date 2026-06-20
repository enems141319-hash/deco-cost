"use client";

import { useMemo, useState } from "react";
import { Check, ChevronDown, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { MaterialDropdown } from "@/components/shared/MaterialDropdown";
import { VendorBoardMaterialDropdown } from "@/components/shared/VendorBoardMaterialDropdown";
import { DRAWER_FRONT_MOLD_PROCESSING_PRICES, PROFILE_HANDLE_PROCESSING_RULES } from "@/lib/config/units";
import { cn, generateId } from "@/lib/utils";
import type { DrawerInput, ProfileHandleStyle } from "@/types";
import { useCabinetVendor } from "./CabinetVendorContext";

interface Props {
  drawers: DrawerInput[];
  onChange: (drawers: DrawerInput[]) => void;
}

type DrawerFrontMoldRadius = NonNullable<DrawerInput["frontMoldRadius"]>;

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

const moldRadiusOptions: Array<{ value: DrawerFrontMoldRadius; label: string }> = [
  { value: "none", label: "無加工" },
  ...Object.entries(DRAWER_FRONT_MOLD_PROCESSING_PRICES).map(([value, rule]) => ({
    value: value as DrawerFrontMoldRadius,
    label: `${rule.label} / ${rule.price18_25mm}元`,
  })),
];

function emptyDrawer(): DrawerInput {
  return {
    id: generateId(),
    name: "抽屜",
    widthCm: 60,
    heightCm: 16,
    depthCm: 45,
    railLengthCm: 45,
    includeRailInQuote: true,
    bodyKdProcessing: false,
    grooveSpec: "8.5",
    quantity: 1,
    railMaterialRef: null,
    wallMaterialRef: null,
    bottomMaterialRef: null,
    frontMoldRadius: "none",
    frontHandle: { style: "none", lengthCm: 40, bakedPaint: false },
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

export function DrawerForm({ drawers, onChange }: Props) {
  const vendor = useCabinetVendor();
  const update = (index: number, patch: Partial<DrawerInput>) =>
    onChange(drawers.map((drawer, i) => (i === index ? { ...drawer, ...patch } : drawer)));

  const remove = (index: number) => onChange(drawers.filter((_, i) => i !== index));

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Label className="text-sm font-semibold">抽屜</Label>
        <Button type="button" variant="outline" size="sm" onClick={() => onChange([...drawers, emptyDrawer()])}>
          <Plus className="mr-1 h-3 w-3" />
          新增抽屜
        </Button>
      </div>

      {drawers.length === 0 && <p className="text-xs text-muted-foreground">未設定抽屜。</p>}

      {drawers.map((drawer, i) => {
        const frontHandle = {
          style: "none" as ProfileHandleStyle,
          lengthCm: 40,
          bakedPaint: false,
          ...drawer.frontHandle,
        };
        const canAddBakedPaint = frontHandle.style === "Y1A" || frontHandle.style === "U1A" || frontHandle.style === "V1A";

        return (
          <div key={drawer.id} className="space-y-2 rounded border bg-muted/20 p-3">
            <div className="flex items-center gap-2">
              <Input
                className="h-8 text-xs"
                value={drawer.name}
                onChange={(event) => update(i, { name: event.target.value })}
                placeholder="抽屜名稱"
              />
              <Button type="button" variant="ghost" size="icon" onClick={() => remove(i)} className="h-8 w-8 text-destructive">
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>

            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              <div>
                <Label className="text-[10px] text-muted-foreground">寬(cm)</Label>
                <Input type="number" min={1} className="h-8 text-xs" value={drawer.widthCm} onChange={(event) => update(i, { widthCm: Number(event.target.value) })} />
              </div>
              <div>
                <Label className="text-[10px] text-muted-foreground">高(cm)</Label>
                <Input type="number" min={1} className="h-8 text-xs" value={drawer.heightCm} onChange={(event) => update(i, { heightCm: Number(event.target.value) })} />
              </div>
              <div>
                <Label className="text-[10px] text-muted-foreground">抽身長度(cm)</Label>
                <Input
                  type="number"
                  min={1}
                  className="h-8 text-xs"
                  value={drawer.railLengthCm}
                  onChange={(event) => update(i, { railLengthCm: Number(event.target.value), depthCm: Number(event.target.value) })}
                />
              </div>
              <div>
                <Label className="text-[10px] text-muted-foreground">數量</Label>
                <Input type="number" min={1} className="h-8 text-xs" value={drawer.quantity} onChange={(event) => update(i, { quantity: Number(event.target.value) })} />
              </div>
            </div>

            <div className={cn("grid grid-cols-1 gap-2", vendor === "ZHENGDAO" ? "sm:grid-cols-2" : "sm:grid-cols-3")}>
              <div>
                <Label className="text-[10px] text-muted-foreground">18mm牆板材料</Label>
                <VendorBoardMaterialDropdown value={drawer.wallMaterialRef} onChange={(ref) => update(i, { wallMaterialRef: ref })} category="BOARD_BODY" />
              </div>
              {vendor !== "ZHENGDAO" && <div>
                <Label className="text-[10px] text-muted-foreground">底板溝規格</Label>
                <Select value={drawer.grooveSpec ?? "8.5"} onValueChange={(value) => update(i, { grooveSpec: value as DrawerInput["grooveSpec"] })}>
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="12">12</SelectItem>
                    <SelectItem value="8.5">8.5</SelectItem>
                    <SelectItem value="9">9</SelectItem>
                  </SelectContent>
                </Select>
              </div>}
              <div>
                <Label className="text-[10px] text-muted-foreground">8mm底板材料</Label>
                <VendorBoardMaterialDropdown value={drawer.bottomMaterialRef} onChange={(ref) => update(i, { bottomMaterialRef: ref })} category="BOARD_BACKING" />
              </div>
            </div>

            {vendor !== "ZHENGDAO" && <div className="grid gap-2 rounded border bg-background p-2">
              <div className="flex items-center justify-between rounded border bg-muted/20 px-3 py-2">
                <Label className="text-xs">抽身指定KD</Label>
                <Switch
                  checked={drawer.bodyKdProcessing ?? false}
                  onCheckedChange={(bodyKdProcessing) => update(i, { bodyKdProcessing })}
                />
              </div>
              <div className="grid gap-2 sm:grid-cols-[160px_96px_minmax(0,1fr)_96px_auto]">
                <div>
                  <Label className="text-[10px] text-muted-foreground">抽頭合廠模 R角</Label>
                  <Select
                    value={drawer.frontMoldRadius ?? (drawer.frontMoldProcessing ? "R80" : "none")}
                    onValueChange={(frontMoldRadius) =>
                      update(i, {
                        frontMoldRadius: frontMoldRadius as DrawerFrontMoldRadius,
                        frontMoldProcessing: frontMoldRadius !== "none",
                      })
                    }
                  >
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {moldRadiusOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-[10px] text-muted-foreground">單板R角數</Label>
                  <Input
                    type="number"
                    min={0}
                    className="h-8 text-xs"
                    value={drawer.frontMoldCornerCount ?? 2}
                    disabled={(drawer.frontMoldRadius ?? "none") === "none" && !drawer.frontMoldProcessing}
                    onChange={(event) => update(i, { frontMoldCornerCount: Number(event.target.value) })}
                  />
                </div>
                <div className="sm:col-span-5">
                  <Label className="text-[10px] text-muted-foreground">抽頭把手加工</Label>
                  <ProfileHandleSearchSelect
                    value={frontHandle.style}
                    onChange={(style) => update(i, { frontHandle: { ...frontHandle, style } })}
                  />
                </div>
                <div>
                  <Label className="text-[10px] text-muted-foreground">長度 cm</Label>
                  <Input
                    type="number"
                    min={1}
                    className="h-8 text-xs"
                    value={frontHandle.lengthCm}
                    onChange={(event) => update(i, { frontHandle: { ...frontHandle, lengthCm: Number(event.target.value) } })}
                  />
                </div>
                {canAddBakedPaint && (
                  <label className="flex items-end gap-2 pb-1 text-[10px] text-muted-foreground">
                    <input
                      type="checkbox"
                      className="h-4 w-4 rounded border-border"
                      checked={frontHandle.bakedPaint}
                      onChange={(event) => update(i, { frontHandle: { ...frontHandle, bakedPaint: event.target.checked } })}
                    />
                    鋁片烤漆
                  </label>
                )}
              </div>
            </div>}

            <div className="space-y-2 rounded border bg-background p-2">
              <div className="flex items-center justify-between gap-3">
                <Label className="text-sm font-semibold">訂購滑軌</Label>
                <Switch
                  checked={drawer.includeRailInQuote ?? true}
                  onCheckedChange={(checked) => update(i, { includeRailInQuote: checked })}
                />
              </div>
              <MaterialDropdown
                value={drawer.railMaterialRef}
                onChange={(ref) => update(i, { railMaterialRef: ref })}
                categoryFilter="HARDWARE_RAIL"
                placeholder={vendor === "ZHENGDAO" ? "選擇正道滑軌" : "選擇滑軌"}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
