// src/components/cabinet/CabinetUnitList.tsx
"use client";

import { useState } from "react";
import { AlertCircle, Plus, Save, Trash2, ChevronDown, ChevronUp, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { CabinetUnitForm } from "./CabinetUnitForm";
import { MaterialSummaryPanel } from "./MaterialSummaryPanel";
import { formatCurrency, generateId } from "@/lib/utils";
import { calculateCabinetUnit } from "@/lib/calculations/cabinet";
import { saveCabinetEstimate, updateCabinetEstimate } from "@/lib/actions/estimates";
import { DEFAULT_DOOR_ADDONS, DEFAULT_MIDDLE_DIVIDER_ADDONS, DEFAULT_UNIT_ADDONS, type CabinetUnitInput } from "@/types";

interface Props {
  projectId: string;
  itemId?: string;
  initialLabel?: string | null;
  initialUnits?: CabinetUnitInput[];
}

function emptyUnit(): CabinetUnitInput {
  return {
    id: generateId(),
    name: "新桶身",
    widthCm: 90,
    depthCm: 60,
    heightCm: 240,
    quantity: 1,
    hasBackPanel: true,
    panelMaterialRef: null,
    backPanelMaterialRef: null,
    addons: DEFAULT_UNIT_ADDONS,
    middleDividers: [],
    shelves: [],
    drawers: [],
    doors: [],
    hardwareItems: [],
    kickPlate: null,
  };
}

function normalizeUnit(unit: CabinetUnitInput): CabinetUnitInput {
  return {
    ...unit,
    addons: {
      ...DEFAULT_UNIT_ADDONS,
      ...unit.addons,
      lightGrooves: {
        topInner: unit.addons?.lightGrooves?.topInner ?? DEFAULT_UNIT_ADDONS.lightGrooves!.topInner,
        sideInner: unit.addons?.lightGrooves?.sideInner ?? DEFAULT_UNIT_ADDONS.lightGrooves!.sideInner,
      },
    },
    middleDividers: (unit.middleDividers ?? []).map((divider) => ({
      ...divider,
      addons: {
        ...DEFAULT_MIDDLE_DIVIDER_ADDONS,
        ...divider.addons,
        lightGroove: {
          side: divider.addons?.lightGroove?.side ?? DEFAULT_MIDDLE_DIVIDER_ADDONS.lightGroove!.side,
          offsetFromFrontMm: divider.addons?.lightGroove?.offsetFromFrontMm ?? DEFAULT_MIDDLE_DIVIDER_ADDONS.lightGroove!.offsetFromFrontMm,
        },
      },
    })),
    shelves: (unit.shelves ?? []).map((shelf) => ({
      ...shelf,
      lightGroove: shelf.lightGroove ?? { side: "none", offsetFromFrontMm: 50 },
    })),
    drawers: (unit.drawers ?? []).map((drawer) => ({
      ...drawer,
      heightCm: drawer.heightCm ?? 16,
      railLengthCm: drawer.railLengthCm ?? drawer.depthCm,
      grooveSpec: drawer.grooveSpec ?? "8.5",
      wallMaterialRef: drawer.wallMaterialRef ?? unit.panelMaterialRef ?? null,
      bottomMaterialRef: drawer.bottomMaterialRef ?? unit.backPanelMaterialRef ?? null,
    })),
    doors: (unit.doors ?? []).map((door) => ({
      ...door,
      addons: {
        ...DEFAULT_DOOR_ADDONS,
        ...door.addons,
        profileHandle: {
          ...DEFAULT_DOOR_ADDONS.profileHandle,
          ...door.addons?.profileHandle,
        },
      },
      wireMeshMaterialRef: door.wireMeshMaterialRef ?? null,
      useAluminumHandle: door.useAluminumHandle ?? Boolean(door.aluminumHandleMaterialRef),
      aluminumHandleMaterialRef: door.aluminumHandleMaterialRef ?? null,
    })),
    hardwareItems: unit.hardwareItems ?? [],
    kickPlate: unit.kickPlate ?? null,
  };
}

export function CabinetUnitList({ projectId, itemId, initialLabel, initialUnits }: Props) {
  const [currentItemId, setCurrentItemId] = useState<string | undefined>(itemId);
  const [estimateLabel, setEstimateLabel] = useState(initialLabel ?? "");
  const [units, setUnits] = useState<CabinetUnitInput[]>(
    initialUnits?.map(normalizeUnit) ?? [emptyUnit()]
  );
  const [expandedId, setExpandedId] = useState<string>(units[0]?.id ?? "");
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState<string | null>(null);

  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  const markChanged = () => setHasUnsavedChanges(true);

  const updateUnit = (id: string, updated: CabinetUnitInput) => {
    markChanged();
    setUnits((prev) => prev.map((u) => (u.id === id ? updated : u)));
  };

  const duplicateUnit = (unit: CabinetUnitInput) => {
    const clone: CabinetUnitInput = { ...unit, id: generateId(), name: `${unit.name} (複製)` };
    markChanged();
    setUnits((prev) => [...prev, clone]);
    setExpandedId(clone.id);
  };

  const removeUnit = (id: string) => {
    markChanged();
    setUnits((prev) => prev.filter((u) => u.id !== id));
  };

  const projectTotal = units.reduce(
    (acc, u) => acc + calculateCabinetUnit(u).summary.totalCost,
    0
  );

  const handleSave = async () => {
    setSaving(true);
    setSaveMsg(null);
    try {
      const payload = { projectId, label: estimateLabel, units };
      const result = currentItemId
        ? await updateCabinetEstimate(currentItemId, payload)
        : await saveCabinetEstimate(payload);

      if (result.success) {
        if (!currentItemId && "itemId" in result && typeof result.itemId === "string") {
          setCurrentItemId(result.itemId);
        }
        setHasUnsavedChanges(false);
        setSaveMsg(currentItemId ? "已更新估價" : "已儲存估價");
        setTimeout(() => setSaveMsg(null), 3000);
        return;
      }

      setSaveMsg("儲存失敗，請稍後再試");
    } catch (err) {
      console.error("[handleSave] save cabinet estimate failed", err);
      setSaveMsg("儲存失敗，請稍後再試");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="fixed right-4 top-16 z-30 flex flex-col items-end gap-2 lg:right-6">
        <Button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="relative h-11 rounded-full px-4 shadow-lg shadow-black/10"
          aria-label={currentItemId ? "更新估價" : "儲存估價"}
        >
          <Save className="h-4 w-4" />
          <span className="hidden sm:inline">
            {saving ? "儲存中..." : currentItemId ? "更新估價" : "儲存估價"}
          </span>
          {hasUnsavedChanges && (
            <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-[11px] font-bold leading-none text-destructive-foreground ring-2 ring-background">
              !
            </span>
          )}
        </Button>
        {hasUnsavedChanges && (
          <div className="flex items-center gap-1 rounded-full border bg-background px-2.5 py-1 text-xs text-muted-foreground shadow-sm">
            <AlertCircle className="h-3.5 w-3.5 text-destructive" />
            <span>尚未儲存</span>
          </div>
        )}
      </div>

      <div className="rounded-md border bg-muted/20 p-4">
        <Label htmlFor="cabinet-estimate-label" className="text-sm font-semibold">
          估價名稱
        </Label>
        <Input
          id="cabinet-estimate-label"
          value={estimateLabel}
          onChange={(event) => {
            setEstimateLabel(event.target.value);
            markChanged();
          }}
          placeholder="例如：主臥室、客廳電視牆"
          className="mt-2"
        />
        <p className="mt-1 text-xs text-muted-foreground">
          此名稱會顯示在專案列表的系統櫃標籤後方。
        </p>
      </div>

      {/* 桶身列表 */}
      {units.map((unit) => {
        const result = calculateCabinetUnit(unit);
        const isExpanded = expandedId === unit.id;

        return (
          <div key={unit.id} className="border rounded-lg overflow-hidden">
            {/* Header */}
            <div
              className="flex items-center gap-2 px-4 py-3 bg-muted/30 cursor-pointer hover:bg-muted/50 transition-colors"
              onClick={() => setExpandedId(isExpanded ? "" : unit.id)}
            >
              {isExpanded ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
              <span className="font-medium flex-1">{unit.name}</span>
              <Badge variant="outline" className="text-xs">
                {unit.widthCm} × {unit.depthCm} × {unit.heightCm} cm
              </Badge>
              <Badge variant="secondary" className="text-xs">×{unit.quantity}</Badge>
              <span className="font-semibold text-primary text-sm">
                {formatCurrency(result.summary.totalCost)}
              </span>
              <Button
                type="button" variant="ghost" size="icon"
                className="h-7 w-7"
                onClick={(e) => { e.stopPropagation(); duplicateUnit(unit); }}
              >
                <Copy className="h-3 w-3" />
              </Button>
              <Button
                type="button" variant="ghost" size="icon"
                className="h-7 w-7 text-destructive"
                onClick={(e) => { e.stopPropagation(); removeUnit(unit.id); }}
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>

            {/* Body */}
            {isExpanded && (
              <div className="p-4">
                <CabinetUnitForm
                  unit={unit}
                  onChange={(updated) => updateUnit(unit.id, updated)}
                />
              </div>
            )}
          </div>
        );
      })}

      {/* 新增桶身 */}
      <Button
        type="button" variant="outline" className="w-full border-dashed"
        onClick={() => {
          const u = emptyUnit();
          markChanged();
          setUnits((prev) => [...prev, u]);
          setExpandedId(u.id);
        }}
      >
        <Plus className="h-4 w-4 mr-2" />新增桶身
      </Button>

      <Separator />

      <MaterialSummaryPanel units={units} />

      {/* 總計 + 儲存 */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-muted-foreground">{units.length} 個桶身</p>
          <p className="text-xl font-bold text-primary">
            總計：{formatCurrency(projectTotal)}
          </p>
        </div>
        {saveMsg && (
          <span className={`text-sm ${saveMsg.includes("失敗") ? "text-destructive" : "text-green-600"}`}>
            {saveMsg}
          </span>
        )}
      </div>
    </div>
  );
}
