// src/components/ceiling/CeilingForm.tsx
"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { MaterialDropdown } from "@/components/shared/MaterialDropdown";
import { CeilingResultPanel } from "./CeilingResultPanel";
import { calculateCeilingMaterial } from "@/lib/calculations/ceiling";
import { saveCeilingEstimate } from "@/lib/actions/estimates";
import type { CeilingInput, CeilingResult } from "@/types";

interface Props {
  projectId: string;
}

const DEFAULT_INPUT: CeilingInput = {
  areaPing: 5,
  autoPerimeter: true,
  roomLengthM: 4,
  roomWidthM: 3,
  manualPerimeterM: undefined,
  angleMaterialRef: null,
  boardMaterialRef: null,
  perimeterAngleMaterialRef: null,
};

export function CeilingForm({ projectId }: Props) {
  const [input, setInput] = useState<CeilingInput>(DEFAULT_INPUT);
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState<string | null>(null);

  const update = (patch: Partial<CeilingInput>) => setInput((prev) => ({ ...prev, ...patch }));

  let result: CeilingResult | null = null;
  try {
    result = calculateCeilingMaterial(input);
  } catch {
    result = null;
  }

  const handleSave = async () => {
    setSaving(true);
    const res = await saveCeilingEstimate({ projectId, input });
    setSaving(false);
    setSaveMsg(res.success ? "已儲存！" : "儲存失敗");
    if (res.success) setTimeout(() => setSaveMsg(null), 3000);
  };

  return (
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
      {/* 左：輸入 */}
      <div className="space-y-5">
        <section className="space-y-3">
          <h3 className="font-semibold text-sm border-b pb-1">天花板資訊</h3>
          <div>
            <Label className="text-xs text-muted-foreground">坪數</Label>
            <Input
              type="number" min={0.1} step={0.5} className="mt-1"
              value={input.areaPing}
              onChange={(e) => update({ areaPing: Number(e.target.value) })}
            />
          </div>

          <div className="flex items-center gap-3">
            <Switch
              checked={input.autoPerimeter}
              onCheckedChange={(v) => update({ autoPerimeter: v })}
            />
            <Label className="text-xs">自動計算周長（由房間尺寸）</Label>
          </div>

          {input.autoPerimeter ? (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs text-muted-foreground">房間長(m)</Label>
                <Input
                  type="number" min={0.1} step={0.1} className="mt-1"
                  value={input.roomLengthM ?? ""}
                  onChange={(e) => update({ roomLengthM: Number(e.target.value) })}
                />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">房間寬(m)</Label>
                <Input
                  type="number" min={0.1} step={0.1} className="mt-1"
                  value={input.roomWidthM ?? ""}
                  onChange={(e) => update({ roomWidthM: Number(e.target.value) })}
                />
              </div>
            </div>
          ) : (
            <div>
              <Label className="text-xs text-muted-foreground">手動周長(m)</Label>
              <Input
                type="number" min={0.1} step={0.1} className="mt-1"
                value={input.manualPerimeterM ?? ""}
                onChange={(e) => update({ manualPerimeterM: Number(e.target.value) })}
              />
            </div>
          )}
        </section>

        <section className="space-y-3">
          <h3 className="font-semibold text-sm border-b pb-1">材料選擇</h3>
          <div>
            <Label className="text-xs text-muted-foreground">天花角材</Label>
            <div className="mt-1">
              <MaterialDropdown
                value={input.angleMaterialRef}
                onChange={(ref) => update({ angleMaterialRef: ref })}
                categoryFilter="ANGLE_MATERIAL"
              />
            </div>
          </div>
          <div>
            <Label className="text-xs text-muted-foreground">矽酸鈣板</Label>
            <div className="mt-1">
              <MaterialDropdown
                value={input.boardMaterialRef}
                onChange={(ref) => update({ boardMaterialRef: ref })}
                categoryFilter="CEILING_BOARD"
              />
            </div>
          </div>
          <div>
            <Label className="text-xs text-muted-foreground">周邊角材（L型）</Label>
            <div className="mt-1">
              <MaterialDropdown
                value={input.perimeterAngleMaterialRef}
                onChange={(ref) => update({ perimeterAngleMaterialRef: ref })}
                categoryFilter="ANGLE_MATERIAL"
              />
            </div>
          </div>
        </section>

        <div className="flex items-center gap-3 pt-2">
          <Button onClick={handleSave} disabled={saving || !result}>
            {saving ? "儲存中…" : "儲存估價"}
          </Button>
          {saveMsg && (
            <span className={`text-sm ${saveMsg.includes("失敗") ? "text-destructive" : "text-green-600"}`}>
              {saveMsg}
            </span>
          )}
        </div>
      </div>

      {/* 右：即時結果 */}
      <div className="xl:border-l xl:pl-6">
        <h3 className="font-semibold text-sm border-b pb-1 mb-4">即時計算結果</h3>
        {result ? (
          <CeilingResultPanel result={result} />
        ) : (
          <p className="text-sm text-muted-foreground">請填寫完整資料</p>
        )}
      </div>
    </div>
  );
}
