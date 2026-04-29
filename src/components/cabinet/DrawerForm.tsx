"use client";

import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MaterialDropdown } from "@/components/shared/MaterialDropdown";
import { generateId } from "@/lib/utils";
import type { DrawerInput } from "@/types";

interface Props {
  drawers: DrawerInput[];
  onChange: (drawers: DrawerInput[]) => void;
}

function emptyDrawer(): DrawerInput {
  return {
    id: generateId(),
    name: "抽屜",
    widthCm: 60,
    heightCm: 16,
    depthCm: 45,
    railLengthCm: 45,
    grooveSpec: "8.5",
    quantity: 1,
    railMaterialRef: null,
    wallMaterialRef: null,
    bottomMaterialRef: null,
  };
}

export function DrawerForm({ drawers, onChange }: Props) {
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

      {drawers.length === 0 && (
        <p className="text-xs text-muted-foreground">尚未新增抽屜</p>
      )}

      {drawers.map((drawer, i) => (
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

          <div className="grid grid-cols-4 gap-2">
            <div>
              <Label className="text-[10px] text-muted-foreground">寬(cm)</Label>
              <Input
                type="number"
                min={1}
                className="h-8 text-xs"
                value={drawer.widthCm}
                onChange={(event) => update(i, { widthCm: Number(event.target.value) })}
              />
            </div>
            <div>
              <Label className="text-[10px] text-muted-foreground">高(cm)</Label>
              <Input
                type="number"
                min={1}
                className="h-8 text-xs"
                value={drawer.heightCm}
                onChange={(event) => update(i, { heightCm: Number(event.target.value) })}
              />
            </div>
            <div>
              <Label className="text-[10px] text-muted-foreground">滑軌尺寸(cm)</Label>
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
              <Input
                type="number"
                min={1}
                className="h-8 text-xs"
                value={drawer.quantity}
                onChange={(event) => update(i, { quantity: Number(event.target.value) })}
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <div>
              <Label className="text-[10px] text-muted-foreground">18mm牆板材料</Label>
              <MaterialDropdown
                value={drawer.wallMaterialRef}
                onChange={(ref) => update(i, { wallMaterialRef: ref })}
                categoryFilter="BOARD_BODY"
              />
            </div>
            <div>
              <Label className="text-[10px] text-muted-foreground">內側下方打溝</Label>
              <Select
                value={drawer.grooveSpec ?? "8.5"}
                onValueChange={(value) => update(i, { grooveSpec: value as DrawerInput["grooveSpec"] })}
              >
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="12">12</SelectItem>
                  <SelectItem value="8.5">8.5</SelectItem>
                  <SelectItem value="9">9</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-[10px] text-muted-foreground">8mm底板材料</Label>
              <MaterialDropdown
                value={drawer.bottomMaterialRef}
                onChange={(ref) => update(i, { bottomMaterialRef: ref })}
                categoryFilter="BOARD_BACKING"
              />
            </div>
          </div>

          <div>
            <Label className="text-[10px] text-muted-foreground">抽屜滑軌</Label>
            <MaterialDropdown
              value={drawer.railMaterialRef}
              onChange={(ref) => update(i, { railMaterialRef: ref })}
              categoryFilter="HARDWARE_RAIL"
            />
          </div>
        </div>
      ))}
    </div>
  );
}
