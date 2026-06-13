// src/components/cabinet/KickPlateForm.tsx
"use client";

import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Plus, Trash2 } from "lucide-react";
import { generateId } from "@/lib/utils";
import type { KickPlateInput, ManualKickPlateInput } from "@/types";

interface Props {
  value: KickPlateInput | null;
  onChange: (v: KickPlateInput | null) => void;
  manualItems: ManualKickPlateInput[];
  onManualItemsChange: (items: ManualKickPlateInput[]) => void;
}

export function KickPlateForm({ value, onChange, manualItems, onManualItemsChange }: Props) {
  const enabled = value !== null;

  const toggle = (on: boolean) => {
    onChange(on ? { heightCm: 8 } : null);
  };

  const addManualItem = () => {
    onManualItemsChange([
      ...manualItems,
      {
        id: generateId(),
        name: `手動踢腳板 ${manualItems.length + 1}`,
        widthCm: 60,
        heightCm: 8,
        quantity: 1,
      },
    ]);
  };

  const updateManualItem = (index: number, patch: Partial<ManualKickPlateInput>) => {
    onManualItemsChange(manualItems.map((item, itemIndex) => (
      itemIndex === index ? { ...item, ...patch } : item
    )));
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Label className="text-sm font-semibold">自動踢腳板</Label>
        <div className="flex items-center gap-2">
          <Label className="text-xs text-muted-foreground">{enabled ? "已啟用" : "未啟用"}</Label>
          <Switch checked={enabled} onCheckedChange={toggle} />
        </div>
      </div>

      {enabled && value && (
        <div className="space-y-2 rounded border bg-muted/20 p-3">
          <p className="text-xs text-muted-foreground">
            系統依櫃體或 L 轉尺寸自動計算，並扣除背板高度與櫃內淨高。
          </p>
          <div>
            <Label className="text-xs text-muted-foreground">高度 (cm)</Label>
            <Input
              type="number" min={1} className="h-8 text-xs"
              value={value.heightCm}
              onChange={(e) => onChange({ ...value, heightCm: Number(e.target.value) })}
            />
          </div>
        </div>
      )}

      <div className="flex items-center justify-between border-t pt-3">
        <div>
          <Label className="text-sm font-semibold">手動踢腳板</Label>
          <p className="text-xs text-muted-foreground">可新增見光面或特殊踢腳，只計算材料。</p>
        </div>
        <Button type="button" size="sm" variant="outline" onClick={addManualItem}>
          <Plus className="h-4 w-4" />
          新增
        </Button>
      </div>

      {manualItems.map((item, index) => (
        <div key={item.id} className="space-y-2 rounded border bg-muted/20 p-3">
          <div className="flex items-center gap-2">
            <Input
              className="h-8 flex-1 text-xs"
              value={item.name}
              onChange={(event) => updateManualItem(index, { name: event.target.value })}
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-destructive"
              title="刪除手動踢腳板"
              onClick={() => onManualItemsChange(manualItems.filter((_, itemIndex) => itemIndex !== index))}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
          <div className="grid gap-2 sm:grid-cols-3">
            <div>
              <Label className="text-xs text-muted-foreground">寬度 (cm)</Label>
              <Input
                type="number" min={0.1} step={0.1} className="h-8 text-xs"
                value={item.widthCm}
                onChange={(event) => updateManualItem(index, { widthCm: Number(event.target.value) })}
              />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">高度 (cm)</Label>
              <Input
                type="number" min={0.1} step={0.1} className="h-8 text-xs"
                value={item.heightCm}
                onChange={(event) => updateManualItem(index, { heightCm: Number(event.target.value) })}
              />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">每櫃數量</Label>
              <Input
                type="number" min={1} step={1} className="h-8 text-xs"
                value={item.quantity}
                onChange={(event) => updateManualItem(index, { quantity: Number(event.target.value) })}
              />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
