// src/components/materials/MaterialForm.tsx
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem,
  SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { createMaterial, updateMaterial } from "@/lib/actions/materials";

const CATEGORIES = [
  { value: "BOARD_BODY", label: "桶身板材" },
  { value: "BOARD_BACKING", label: "背板" },
  { value: "BOARD_DOOR", label: "門片" },
  { value: "HARDWARE_HINGE", label: "鉸鏈" },
  { value: "HARDWARE_HANDLE", label: "把手" },
  { value: "HARDWARE_RAIL", label: "滑軌" },
  { value: "HARDWARE_OTHER", label: "其他五金" },
  { value: "GLASS", label: "玻璃" },
  { value: "WIRE_MESH", label: "網材" },
  { value: "CEILING_BOARD", label: "天花板板材" },
  { value: "ANGLE_MATERIAL", label: "角材" },
  { value: "OTHER", label: "其他" },
];

interface Props {
  materialId?: string;
  defaultValues?: {
    category?: string;
    brand?: string | null;
    colorCode?: string | null;
    surfaceTreatment?: string | null;
    boardType?: string | null;
    name?: string;
    spec?: string;
    unit?: string;
    price?: number;
    minCai?: number | null;
    wasteRate?: number;
  };
  onSuccess?: () => void;
}

export function MaterialForm({ materialId, defaultValues, onSuccess }: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [category, setCategory] = useState(defaultValues?.category ?? "BOARD_BODY");

  const isEdit = !!materialId;

  async function handleSubmit(formData: FormData) {
    setLoading(true);
    setError(null);
    formData.set("category", category);

    try {
      const result = isEdit
        ? await updateMaterial(materialId!, formData)
        : await createMaterial(formData);

      if (!result.success) {
        setError("儲存失敗，請檢查欄位");
      } else {
        onSuccess?.();
      }
    } catch (err) {
      console.error(err);
      setError("儲存失敗，請稍後再試");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form action={handleSubmit} className="space-y-4">
      {error && (
        <div className="text-sm text-destructive bg-destructive/10 rounded p-2">{error}</div>
      )}

      <div className="space-y-1.5">
        <Label>類別 *</Label>
        <Select value={category} onValueChange={setCategory}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {CATEGORIES.map((c) => (
              <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="brand">品牌</Label>
          <Input id="brand" name="brand" defaultValue={defaultValues?.brand ?? ""} placeholder="例：EGGER" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="colorCode">色號</Label>
          <Input id="colorCode" name="colorCode" defaultValue={defaultValues?.colorCode ?? ""} placeholder="例：H1145" />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="surfaceTreatment">表面處理</Label>
          <Input id="surfaceTreatment" name="surfaceTreatment" defaultValue={defaultValues?.surfaceTreatment ?? ""} placeholder="例：ST10" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="boardType">板料類型</Label>
          <Input id="boardType" name="boardType" defaultValue={defaultValues?.boardType ?? ""} placeholder="例：18mm櫃體封PVC" />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="name">名稱 *</Label>
          <Input
            id="name" name="name" required
            defaultValue={defaultValues?.name}
            placeholder="例：木心板"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="spec">規格</Label>
          <Input
            id="spec" name="spec"
            defaultValue={defaultValues?.spec ?? ""}
            placeholder="例：3×6尺 18mm"
          />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="unit">單位 *</Label>
          <Input
            id="unit" name="unit" required
            defaultValue={defaultValues?.unit}
            placeholder="才 / 片 / 個"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="price">單價（元）*</Label>
          <Input
            id="price" name="price" type="number" min={0} step={0.01} required
            defaultValue={defaultValues?.price}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="minCai">基本才數</Label>
          <Input
            id="minCai" name="minCai" type="number" min={0} step={0.1}
            defaultValue={defaultValues?.minCai ?? ""}
            placeholder="板料用"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="wasteRate">損耗率</Label>
          <Input
            id="wasteRate" name="wasteRate" type="number" min={0} max={1} step={0.01}
            defaultValue={defaultValues?.wasteRate ?? 0.05}
            placeholder="0.05"
          />
        </div>
      </div>

      <Button type="submit" disabled={loading} className="w-full">
        {loading ? "儲存中…" : isEdit ? "更新材料" : "新增材料"}
      </Button>
    </form>
  );
}
