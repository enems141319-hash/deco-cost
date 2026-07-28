"use client";

import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { generateId } from "@/lib/utils";
import type { OtherCostItemInput } from "@/types";

interface Props {
  items: OtherCostItemInput[];
  onChange: (items: OtherCostItemInput[]) => void;
}

function emptyOtherCostItem(): OtherCostItemInput {
  return {
    id: generateId(),
    name: "",
    quantity: 1,
    unitPrice: 0,
  };
}

export function OtherCostsForm({ items, onChange }: Props) {
  const update = (index: number, patch: Partial<OtherCostItemInput>) =>
    onChange(items.map((item, i) => (i === index ? { ...item, ...patch } : item)));

  const remove = (index: number) => onChange(items.filter((_, i) => i !== index));

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Label className="text-sm font-semibold">其他費用</Label>
        <Button type="button" variant="outline" size="sm" onClick={() => onChange([...items, emptyOtherCostItem()])}>
          <Plus className="mr-1 h-3 w-3" />
          新增費用
        </Button>
      </div>

      {items.length === 0 && <p className="text-xs text-muted-foreground">尚未新增其他費用。</p>}

      {items.map((item, index) => (
        <div key={item.id} className="space-y-2 rounded border bg-muted/20 p-3">
          <div>
            <Label className="text-[10px] text-muted-foreground">品項名稱</Label>
            <Input
              className="h-8 text-xs"
              value={item.name}
              onChange={(event) => update(index, { name: event.target.value })}
              placeholder="例：搬運費、丈量費、客製加工"
            />
          </div>
          <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)_36px] items-end gap-2">
            <div>
              <Label className="text-[10px] text-muted-foreground">數量</Label>
              <Input
                type="number"
                min={0.1}
                step={0.1}
                className="h-8 text-xs"
                value={item.quantity}
                onChange={(event) => update(index, { quantity: Number(event.target.value) })}
              />
            </div>
            <div>
              <Label className="text-[10px] text-muted-foreground">單價</Label>
              <Input
                type="number"
                min={0}
                step={1}
                className="h-8 text-xs"
                value={item.unitPrice}
                onChange={(event) => update(index, { unitPrice: Number(event.target.value) })}
              />
            </div>
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
        </div>
      ))}
    </div>
  );
}
