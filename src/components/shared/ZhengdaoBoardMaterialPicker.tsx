"use client";

import { useEffect, useMemo, useState } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { materialApiUrl } from "@/components/cabinet/CabinetVendorContext";
import { materialApiErrorMessage } from "@/components/shared/material-api-error";
import type { MaterialRef } from "@/types";

type ZhengdaoEdgeMode = "NONE" | "NO_EDGE" | "ABS";

export interface ZhengdaoBoardMaterialOption {
  id: string;
  name: string;
  spec: string | null;
  unit: string;
  price: number;
  minCai: number | null;
  category: string;
  brand: string | null;
  colorCode: string | null;
  surfaceTreatment: string | null;
  boardType: string | null;
  vendorCode: string | null;
  notes: string | null;
  pricingMeta: {
    series?: string;
    thicknessMm?: number;
    edgeMode?: ZhengdaoEdgeMode;
  } | null;
}

export interface ZhengdaoBoardMaterialGroup {
  series: string;
  materials: ZhengdaoBoardMaterialOption[];
}

export function filterZhengdaoBoardMaterials(
  materials: ZhengdaoBoardMaterialOption[],
  category: "BOARD_BODY" | "BOARD_BACKING",
): ZhengdaoBoardMaterialOption[] {
  const allowedThicknesses = category === "BOARD_BODY" ? [18, 19] : [8, 9];
  return materials.filter((material) => {
    const thicknessMm = material.pricingMeta?.thicknessMm;
    return thicknessMm !== undefined && allowedThicknesses.includes(thicknessMm);
  });
}

export function zhengdaoBoardSeries(material: ZhengdaoBoardMaterialOption): string {
  return material.pricingMeta?.series ?? material.name;
}

export function zhengdaoBoardSpecLabel(material: ZhengdaoBoardMaterialOption): string {
  const thickness = material.pricingMeta?.thicknessMm
    ? `${material.pricingMeta.thicknessMm}mm`
    : material.boardType ?? material.spec ?? "未標示厚度";
  const edgeLabel = material.pricingMeta?.edgeMode === "ABS"
    ? "對 ABS"
    : material.pricingMeta?.edgeMode === "NO_EDGE"
      ? "無封邊"
      : null;
  return [thickness, edgeLabel].filter(Boolean).join(" / ");
}

function zhengdaoBoardOptionLabel(material: ZhengdaoBoardMaterialOption): string {
  const price = `$${material.price}/${material.unit}`;
  const minCai = material.minCai ? `基本 ${material.minCai} 才` : null;
  return [zhengdaoBoardSeries(material), zhengdaoBoardSpecLabel(material), price, minCai]
    .filter(Boolean)
    .join(" - ");
}

export function groupZhengdaoBoardMaterials(
  materials: ZhengdaoBoardMaterialOption[],
): ZhengdaoBoardMaterialGroup[] {
  const grouped = new Map<string, ZhengdaoBoardMaterialOption[]>();
  for (const material of materials) {
    const series = zhengdaoBoardSeries(material);
    grouped.set(series, [...(grouped.get(series) ?? []), material]);
  }
  return Array.from(grouped.entries())
    .map(([series, rows]) => ({
      series,
      materials: rows.sort((a, b) => (
        (a.pricingMeta?.thicknessMm ?? 0) - (b.pricingMeta?.thicknessMm ?? 0) ||
        zhengdaoBoardSpecLabel(a).localeCompare(zhengdaoBoardSpecLabel(b))
      )),
    }))
    .sort((a, b) => a.series.localeCompare(b.series));
}

function toMaterialRef(material: ZhengdaoBoardMaterialOption): MaterialRef {
  return {
    materialId: material.id,
    materialName: `${zhengdaoBoardSeries(material)} ${zhengdaoBoardSpecLabel(material)}`,
    unit: material.unit,
    pricePerUnit: material.price,
    minCai: material.minCai,
  };
}

export function ZhengdaoBoardMaterialPicker({
  value,
  onChange,
  category,
  placeholder = "選擇正道板材",
}: {
  value: MaterialRef | null;
  onChange: (ref: MaterialRef | null) => void;
  category: "BOARD_BODY" | "BOARD_BACKING";
  placeholder?: string;
}) {
  const [materials, setMaterials] = useState<ZhengdaoBoardMaterialOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setLoadError(null);
    fetch(materialApiUrl("ZHENGDAO", category), { credentials: "same-origin" })
      .then(async (response) => {
        const data: unknown = await response.json().catch(() => null);
        if (!response.ok) throw new Error(materialApiErrorMessage(response.status));
        if (!Array.isArray(data)) throw new Error("Materials API returned a non-array response");
        return data as ZhengdaoBoardMaterialOption[];
      })
      .then((data) => {
        if (cancelled) return;
        setMaterials(data);
      })
      .catch((error) => {
        if (cancelled) return;
        console.error("[ZhengdaoBoardMaterialPicker] failed to load materials", error);
        setMaterials([]);
        setLoadError(error instanceof Error ? error.message : "材料載入失敗，請稍後再試");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [category]);

  const selectableMaterials = useMemo(
    () => filterZhengdaoBoardMaterials(materials, category),
    [category, materials],
  );
  const groups = useMemo(() => groupZhengdaoBoardMaterials(selectableMaterials), [selectableMaterials]);
  const selected = selectableMaterials.find((material) => material.id === value?.materialId) ?? null;
  return (
    <div className="space-y-1">
      <Select
        value={selected?.id ?? ""}
        disabled={loading || Boolean(loadError)}
        onValueChange={(materialId) => {
          const material = selectableMaterials.find((option) => option.id === materialId) ?? null;
          onChange(material ? toMaterialRef(material) : null);
        }}
      >
        <SelectTrigger className={!value ? "border-destructive/60 text-destructive" : ""}>
          <SelectValue placeholder={loading ? "載入中..." : loadError ?? placeholder} />
        </SelectTrigger>
        <SelectContent>
          {selectableMaterials.map((material) => (
            <SelectItem key={material.id} value={material.id}>
              {zhengdaoBoardOptionLabel(material)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <p className="text-[11px] text-muted-foreground">
        {category === "BOARD_BODY" ? "桶身可選 18/19mm" : "背板可選 8/9mm"}
      </p>
    </div>
  );
}
