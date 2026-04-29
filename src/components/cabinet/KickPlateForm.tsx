// src/components/cabinet/KickPlateForm.tsx
"use client";

import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MaterialDropdown } from "@/components/shared/MaterialDropdown";
import type { KickPlateInput } from "@/types";

interface Props {
  value: KickPlateInput | null;
  onChange: (v: KickPlateInput | null) => void;
}

export function KickPlateForm({ value, onChange }: Props) {
  const enabled = value !== null;

  const toggle = (on: boolean) => {
    onChange(on ? { widthCm: 90, heightCm: 8, materialRef: null } : null);
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label className="text-sm font-semibold">踢腳板</Label>
        <Switch checked={enabled} onCheckedChange={toggle} />
      </div>

      {enabled && value && (
        <div className="border rounded p-2 space-y-2 bg-muted/20">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label className="text-[10px] text-muted-foreground">寬(cm)</Label>
              <Input
                type="number" min={1} className="h-8 text-xs"
                value={value.widthCm}
                onChange={(e) => onChange({ ...value, widthCm: Number(e.target.value) })}
              />
            </div>
            <div>
              <Label className="text-[10px] text-muted-foreground">高(cm)</Label>
              <Input
                type="number" min={1} className="h-8 text-xs"
                value={value.heightCm}
                onChange={(e) => onChange({ ...value, heightCm: Number(e.target.value) })}
              />
            </div>
          </div>
          <MaterialDropdown
            value={value.materialRef}
            onChange={(ref) => onChange({ ...value, materialRef: ref })}
            categoryFilter="BOARD_BODY"
          />
        </div>
      )}
    </div>
  );
}
