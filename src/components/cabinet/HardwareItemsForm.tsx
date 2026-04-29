"use client";

import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MaterialDropdown } from "@/components/shared/MaterialDropdown";
import { generateId } from "@/lib/utils";
import type { HardwareItemInput } from "@/types";

interface Props {
  items: HardwareItemInput[];
  onChange: (items: HardwareItemInput[]) => void;
}

function emptyHardwareItem(): HardwareItemInput {
  return {
    id: generateId(),
    name: "五金/另料",
    quantity: 1,
    materialRef: null,
  };
}

export function HardwareItemsForm({ items, onChange }: Props) {
  const update = (index: number, patch: Partial<HardwareItemInput>) =>
    onChange(items.map((item, i) => (i === index ? { ...item, ...patch } : item)));

  const remove = (index: number) => onChange(items.filter((_, i) => i !== index));

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Label className="text-sm font-semibold">五金/另料</Label>
        <Button type="button" variant="outline" size="sm" onClick={() => onChange([...items, emptyHardwareItem()])}>
          <Plus className="mr-1 h-3 w-3" />新增五金/另料
        </Button>
      </div>

      {items.length === 0 && <p className="text-xs text-muted-foreground">尚未新增吊衣桿或五金配件</p>}

      {items.map((item, i) => (
        <div key={item.id} className="space-y-2 rounded border bg-muted/20 p-3">
          <div className="grid grid-cols-[1fr_88px_auto] gap-2">
            <Input
              className="h-8 text-xs"
              value={item.name}
              onChange={(event) => update(i, { name: event.target.value })}
              placeholder="項目名稱"
            />
            <Input
              type="number"
              min={0.1}
              step={0.1}
              className="h-8 text-xs"
              value={item.quantity}
              onChange={(event) => update(i, { quantity: Number(event.target.value) })}
            />
            <Button type="button" variant="ghost" size="icon" onClick={() => remove(i)} className="h-8 w-8 text-destructive">
              <Trash2 className="h-3 w-3" />
            </Button>
          </div>

          <div>
            <Label className="text-[10px] text-muted-foreground">吊衣桿 / 五金配件</Label>
            <MaterialDropdown
              value={item.materialRef}
              onChange={(ref) => update(i, { materialRef: ref, name: ref?.materialName ?? item.name })}
              categoryFilter="HARDWARE_OTHER"
              placeholder="選擇吊衣桿或五金配件"
            />
          </div>
        </div>
      ))}
    </div>
  );
}
