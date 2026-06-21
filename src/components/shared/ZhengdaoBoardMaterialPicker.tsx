"use client";

import { useEffect, useMemo, useState } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger } from "@/components/ui/select";
import { materialApiUrl } from "@/components/cabinet/CabinetVendorContext";
import { materialApiErrorMessage } from "@/components/shared/material-api-error";
import type { MaterialRef } from "@/types";

type ZhengdaoEdgeMode = "NONE" | "NO_EDGE" | "ABS";

export const ZHENGDAO_BOARD_UNSELECTED_VALUE = "__ZHENGDAO_BOARD_UNSELECTED__";

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

export interface ZhengdaoBoardMaterialVariant {
  key: string;
  series: string;
  thicknessMm: number;
  baseMaterial: ZhengdaoBoardMaterialOption;
  absMaterial: ZhengdaoBoardMaterialOption | null;
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
    ? "封 ABS"
    : material.pricingMeta?.edgeMode === "NO_EDGE"
      ? "無封邊"
      : null;
  return [thickness, edgeLabel].filter(Boolean).join(" / ");
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

function zhengdaoBoardVariantKey(material: ZhengdaoBoardMaterialOption): string {
  return `${zhengdaoBoardSeries(material)}-${material.pricingMeta?.thicknessMm ?? 0}`;
}

function preferredBaseMaterial(materials: ZhengdaoBoardMaterialOption[]): ZhengdaoBoardMaterialOption {
  return materials.find((material) => material.pricingMeta?.edgeMode === "NO_EDGE")
    ?? materials.find((material) => material.pricingMeta?.edgeMode === "NONE")
    ?? materials[0]!;
}

export function groupZhengdaoBoardMaterialVariants(
  materials: ZhengdaoBoardMaterialOption[],
): ZhengdaoBoardMaterialVariant[] {
  const grouped = new Map<string, ZhengdaoBoardMaterialOption[]>();
  for (const material of materials) {
    const thicknessMm = material.pricingMeta?.thicknessMm;
    if (thicknessMm === undefined) continue;
    const key = zhengdaoBoardVariantKey(material);
    grouped.set(key, [...(grouped.get(key) ?? []), material]);
  }

  return Array.from(grouped.entries())
    .map(([key, rows]) => {
      const baseMaterial = preferredBaseMaterial(rows);
      return {
        key,
        series: zhengdaoBoardSeries(baseMaterial),
        thicknessMm: baseMaterial.pricingMeta?.thicknessMm ?? 0,
        baseMaterial,
        absMaterial: rows.find((material) => material.pricingMeta?.edgeMode === "ABS") ?? null,
      };
    })
    .sort((a, b) => (
      a.series.localeCompare(b.series) ||
      a.thicknessMm - b.thicknessMm
    ));
}

function zhengdaoBoardVariantLabel(variant: ZhengdaoBoardMaterialVariant): string {
  const price = `$${variant.baseMaterial.price}/${variant.baseMaterial.unit}`;
  const minCai = variant.baseMaterial.minCai ? `基本 ${variant.baseMaterial.minCai} 才` : null;
  return [
    variant.series,
    `${variant.thicknessMm}mm`,
    price,
    minCai,
  ].filter(Boolean).join(" - ");
}

export function zhengdaoBoardSelectValue(variant: ZhengdaoBoardMaterialVariant | null): string {
  return variant?.key ?? ZHENGDAO_BOARD_UNSELECTED_VALUE;
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
  const variants = useMemo(() => groupZhengdaoBoardMaterialVariants(selectableMaterials), [selectableMaterials]);
  const selected = selectableMaterials.find((material) => material.id === value?.materialId) ?? null;
  const selectedVariant = selected === null ? null : variants.find((variant) => (
    variant.baseMaterial.id === selected.id ||
    variant.absMaterial?.id === selected.id
  )) ?? null;
  const selectedUsesAbs = selectedVariant?.absMaterial?.id === selected?.id;
  return (
    <div className="space-y-1">
      <Select
        value={zhengdaoBoardSelectValue(selectedVariant)}
        disabled={loading || Boolean(loadError)}
        onValueChange={(variantKey) => {
          if (variantKey === ZHENGDAO_BOARD_UNSELECTED_VALUE) return;
          const variant = variants.find((option) => option.key === variantKey) ?? null;
          const material = selectedUsesAbs && variant?.absMaterial ? variant.absMaterial : variant?.baseMaterial ?? null;
          onChange(material ? toMaterialRef(material) : null);
        }}
      >
        <SelectTrigger className={!value ? "border-destructive/60 text-destructive" : ""}>
          <span className="truncate">
            {loading
              ? "載入中..."
              : loadError ?? (selectedVariant ? zhengdaoBoardVariantLabel(selectedVariant) : placeholder)}
          </span>
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ZHENGDAO_BOARD_UNSELECTED_VALUE}>
            選擇材料
          </SelectItem>
          {variants.map((variant) => (
            <SelectItem key={variant.key} value={variant.key}>
              {zhengdaoBoardVariantLabel(variant)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {selectedVariant?.absMaterial && selectedVariant.absMaterial.id !== selectedVariant.baseMaterial.id && (
        <label className="flex items-center justify-between gap-3 rounded border bg-muted/20 px-3 py-2 text-xs">
          <span className="text-muted-foreground">
            封 ABS
            <span className="ml-1 text-[11px]">
              {`$${selectedVariant.absMaterial.price}/${selectedVariant.absMaterial.unit}`}
            </span>
          </span>
          <input
            type="checkbox"
            className="h-4 w-4 accent-blue-600"
            checked={selectedUsesAbs}
            onChange={(event) => {
              const nextMaterial = event.target.checked && selectedVariant.absMaterial
                ? selectedVariant.absMaterial
                : selectedVariant.baseMaterial;
              onChange(toMaterialRef(nextMaterial));
            }}
          />
        </label>
      )}
      <p className="text-[11px] text-muted-foreground">
        {category === "BOARD_BODY" ? "桶身可選 18/19mm" : "背板可選 8/9mm"}
      </p>
    </div>
  );
}
