"use client";

import { useEffect, useMemo, useState } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger } from "@/components/ui/select";
import { materialApiUrl } from "@/components/cabinet/CabinetVendorContext";
import { materialApiErrorMessage } from "@/components/shared/material-api-error";
import type { MaterialRef } from "@/types";

type ZhengdaoEdgeMode = "NONE" | "NO_EDGE" | "PVC" | "ABS";

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
  allowedThicknesses?: number[],
): ZhengdaoBoardMaterialOption[] {
  const thicknesses = allowedThicknesses ?? (category === "BOARD_BODY" ? [18, 19] : [8, 9]);
  return materials.filter((material) => {
    const thicknessMm = material.pricingMeta?.thicknessMm;
    return thicknessMm !== undefined && thicknesses.includes(thicknessMm);
  });
}

export function zhengdaoBoardSeries(material: ZhengdaoBoardMaterialOption): string {
  return material.pricingMeta?.series ?? material.name;
}

export function zhengdaoBoardSpecLabel(material: ZhengdaoBoardMaterialOption): string {
  return material.pricingMeta?.thicknessMm
    ? `${material.pricingMeta.thicknessMm}mm`
    : material.boardType ?? material.spec ?? "未標示厚度";
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
  allowedThicknesses,
}: {
  value: MaterialRef | null;
  onChange: (ref: MaterialRef | null) => void;
  category: "BOARD_BODY" | "BOARD_BACKING";
  placeholder?: string;
  allowedThicknesses?: number[];
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
    () => filterZhengdaoBoardMaterials(materials, category, allowedThicknesses),
    [allowedThicknesses, category, materials],
  );
  const variants = useMemo(() => groupZhengdaoBoardMaterialVariants(selectableMaterials), [selectableMaterials]);
  const selected = selectableMaterials.find((material) => material.id === value?.materialId) ?? null;
  const selectedVariant = selected === null ? null : variants.find((variant) => (
    variant.baseMaterial.id === selected.id ||
    variant.absMaterial?.id === selected.id
  )) ?? null;
  return (
    <div className="space-y-1">
      <Select
        value={zhengdaoBoardSelectValue(selectedVariant)}
        disabled={loading || Boolean(loadError)}
        onValueChange={(variantKey) => {
          if (variantKey === ZHENGDAO_BOARD_UNSELECTED_VALUE) return;
          const variant = variants.find((option) => option.key === variantKey) ?? null;
          const material = variant?.baseMaterial ?? null;
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
      <p className="text-[11px] text-muted-foreground">
        {category === "BOARD_BODY"
          ? `桶身可選 ${(allowedThicknesses ?? [18, 19]).join("/")}mm`
          : "背板可選 8/9mm"}
      </p>
    </div>
  );
}
