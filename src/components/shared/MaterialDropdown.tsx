// src/components/shared/MaterialDropdown.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { Check, Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { materialApiErrorMessage } from "@/components/shared/material-api-error";
import { cn, formatCurrency } from "@/lib/utils";
import type { MaterialRef } from "@/types";

interface MaterialOption {
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
}

interface Props {
  value: MaterialRef | null;
  onChange: (ref: MaterialRef | null) => void;
  categoryFilter?: string;
  fixedBrandFilter?: string;
  nameIncludes?: string[];
  nameExcludes?: string[];
  placeholder?: string;
  disabled?: boolean;
}

const CATEGORY_LABELS: Record<string, string> = {
  BOARD_BODY: "桶身板材",
  BOARD_BACKING: "背板",
  BOARD_DOOR: "門片",
  HARDWARE_HINGE: "鉸鏈",
  HARDWARE_HANDLE: "把手",
  HARDWARE_RAIL: "滑軌",
  HARDWARE_OTHER: "其他五金",
  GLASS: "玻璃",
  WIRE_MESH: "鐵網/鐵網加工",
  CEILING_BOARD: "天花板板材",
  ANGLE_MATERIAL: "角材",
  OTHER: "其他",
};

function toMaterialRef(material: MaterialOption): MaterialRef {
  return {
    materialId: material.id,
    materialName: `${material.name}${material.spec ? ` (${material.spec})` : ""}`,
    unit: material.unit,
    pricePerUnit: material.price,
    minCai: material.minCai,
  };
}

function displayName(material: MaterialOption): string {
  if (material.brand && material.colorCode && material.boardType) {
    return [
      material.brand,
      material.colorCode,
      material.surfaceTreatment,
      material.boardType,
    ].filter(Boolean).join(" ");
  }
  return `${material.name}${material.spec ? ` (${material.spec})` : ""}`;
}

function searchText(material: MaterialOption): string {
  return [
    material.name,
    material.spec,
    material.brand,
    material.colorCode,
    material.surfaceTreatment,
    material.boardType,
    material.unit,
    String(material.price),
  ].filter(Boolean).join(" ").toLowerCase();
}

export function MaterialDropdown({
  value,
  onChange,
  categoryFilter,
  fixedBrandFilter,
  nameIncludes,
  nameExcludes,
  placeholder = "選擇材料",
  disabled,
}: Props) {
  const [materials, setMaterials] = useState<MaterialOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [brandFilter, setBrandFilter] = useState<string>("__all__");
  const [typeFilter, setTypeFilter] = useState<string>("__all__");
  const [prefixFilter, setPrefixFilter] = useState<string>("__all__");

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setLoadError(null);
    const url = categoryFilter
      ? `/api/materials?category=${categoryFilter}`
      : "/api/materials";

    fetch(url, { credentials: "same-origin" })
      .then(async (r) => {
        const data: unknown = await r.json().catch(() => null);
        if (!r.ok) {
          throw new Error(materialApiErrorMessage(r.status));
        }
        if (!Array.isArray(data)) {
          throw new Error("Materials API returned a non-array response");
        }
        return data as MaterialOption[];
      })
      .then((data) => {
        if (cancelled) return;
        setMaterials(data);
      })
      .catch((error) => {
        if (cancelled) return;
        console.error("[MaterialDropdown] failed to load materials", error);
        setMaterials([]);
        setLoadError(error instanceof Error ? error.message : "材料載入失敗，請稍後再試");
      })
      .finally(() => {
        if (cancelled) return;
        setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [categoryFilter]);

  useEffect(() => {
    setBrandFilter("__all__");
    setTypeFilter("__all__");
    setPrefixFilter("__all__");
    setQuery("");
  }, [categoryFilter, fixedBrandFilter]);

  const scopedMaterials = useMemo(
    () => materials.filter((material) => !fixedBrandFilter || (material.brand ?? "未分類") === fixedBrandFilter),
    [fixedBrandFilter, materials]
  );

  const selected = scopedMaterials.find((material) => material.id === value?.materialId) ?? null;

  const brands = useMemo(() => {
    const counts = new Map<string, number>();
    for (const material of scopedMaterials) {
      const brand = material.brand ?? "未分類";
      counts.set(brand, (counts.get(brand) ?? 0) + 1);
    }
    return Array.from(counts.entries()).sort((a, b) => a[0].localeCompare(b[0]));
  }, [scopedMaterials]);

  const boardTypes = useMemo(() => {
    const types = new Set<string>();
    for (const material of scopedMaterials) {
      if (material.boardType) types.add(material.boardType);
    }
    return Array.from(types).sort((a, b) => a.localeCompare(b));
  }, [scopedMaterials]);

  const prefixes = useMemo(() => {
    const counts = new Map<string, number>();
    for (const material of scopedMaterials) {
      const prefix = (material.colorCode ?? material.name).charAt(0).toUpperCase();
      if (!prefix) continue;
      counts.set(prefix, (counts.get(prefix) ?? 0) + 1);
    }
    return Array.from(counts.entries()).sort((a, b) => a[0].localeCompare(b[0]));
  }, [scopedMaterials]);

  const filteredMaterials = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return scopedMaterials.filter((material) => {
      const brand = material.brand ?? "未分類";
      const prefix = (material.colorCode ?? material.name).charAt(0).toUpperCase();
      const includeByName = !nameIncludes?.length || nameIncludes.some((keyword) => material.name.includes(keyword));
      const excludeByName = nameExcludes?.some((keyword) => material.name.includes(keyword)) ?? false;
      return (
        includeByName &&
        !excludeByName &&
        (brandFilter === "__all__" || brand === brandFilter) &&
        (typeFilter === "__all__" || material.boardType === typeFilter) &&
        (prefixFilter === "__all__" || prefix === prefixFilter) &&
        (!normalizedQuery || searchText(material).includes(normalizedQuery))
      );
    });
  }, [brandFilter, nameExcludes, nameIncludes, prefixFilter, query, scopedMaterials, typeFilter]);

  const choose = (material: MaterialOption | null) => {
    onChange(material ? toMaterialRef(material) : null);
    setOpen(false);
  };

  return (
    <>
      <Button
        type="button"
        variant="outline"
        disabled={disabled || loading}
        className={cn(
          "h-8 w-full justify-between gap-2 px-3 text-left text-xs font-normal",
          !value && "text-muted-foreground"
        )}
        onClick={() => setOpen(true)}
      >
        <span className="min-w-0 flex-1 truncate">
          {loading ? "載入中..." : loadError ? loadError : selected ? displayName(selected) : value?.materialName ?? placeholder}
        </span>
        <Search className="h-3.5 w-3.5 shrink-0 opacity-60" />
      </Button>

      {open && (
        <div className="fixed inset-0 z-50 grid place-items-center overflow-hidden bg-black/35 p-4" onMouseDown={() => setOpen(false)}>
          <div
            className="grid h-[calc(100dvh-2rem)] max-h-[760px] w-full max-w-5xl grid-cols-[220px_minmax(0,1fr)] overflow-hidden rounded-md border bg-background shadow-xl"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <aside className="flex min-h-0 flex-col border-r bg-muted/20">
              <div className="border-b px-4 py-3">
                <p className="text-sm font-semibold">{categoryFilter ? CATEGORY_LABELS[categoryFilter] ?? categoryFilter : "材料索引"}</p>
                <p className="text-xs text-muted-foreground">{scopedMaterials.length} 筆品項</p>
              </div>
              <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-2">
                <button
                  type="button"
                  className={cn(
                    "mb-1 w-full rounded px-3 py-2 text-left text-sm",
                    brandFilter === "__all__" ? "bg-primary text-primary-foreground" : "hover:bg-muted"
                  )}
                  onClick={() => setBrandFilter("__all__")}
                >
                  全部品牌
                </button>
                {brands.map(([brand, count]) => (
                  <button
                    type="button"
                    key={brand}
                    className={cn(
                      "mb-1 w-full rounded px-3 py-2 text-left text-sm",
                      brandFilter === brand ? "bg-primary text-primary-foreground" : "hover:bg-muted"
                    )}
                    onClick={() => setBrandFilter(brand)}
                  >
                    <span className="block truncate font-medium">{brand}</span>
                    <span className={brandFilter === brand ? "text-xs text-primary-foreground/80" : "text-xs text-muted-foreground"}>
                      {count} 筆
                    </span>
                  </button>
                ))}
              </div>
            </aside>

            <section className="flex min-h-0 min-w-0 flex-col">
              <div className="border-b p-4">
                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <Search className="pointer-events-none absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      autoFocus
                      className="pl-8"
                      value={query}
                      onChange={(event) => setQuery(event.target.value)}
                      placeholder="搜尋品牌、色號、表面處理、板料類型或價格"
                    />
                  </div>
                  <Button type="button" variant="ghost" size="icon" onClick={() => setOpen(false)}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>

                <div className="mt-3 flex flex-wrap gap-1.5">
                  <Button
                    type="button"
                    size="sm"
                    variant={prefixFilter === "__all__" ? "default" : "outline"}
                    className="h-7 px-2 text-xs"
                    onClick={() => setPrefixFilter("__all__")}
                  >
                    全部色號
                  </Button>
                  {prefixes.map(([prefix, count]) => (
                    <Button
                      type="button"
                      key={prefix}
                      size="sm"
                      variant={prefixFilter === prefix ? "default" : "outline"}
                      className="h-7 px-2 text-xs"
                      onClick={() => setPrefixFilter(prefix)}
                    >
                      {prefix}
                      <span className="ml-1 opacity-70">{count}</span>
                    </Button>
                  ))}
                </div>

                {boardTypes.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    <Button
                      type="button"
                      size="sm"
                      variant={typeFilter === "__all__" ? "default" : "outline"}
                      className="h-7 px-2 text-xs"
                      onClick={() => setTypeFilter("__all__")}
                    >
                      全部類型
                    </Button>
                    {boardTypes.map((type) => (
                      <Button
                        type="button"
                        key={type}
                        size="sm"
                        variant={typeFilter === type ? "default" : "outline"}
                        className="h-7 px-2 text-xs"
                        onClick={() => setTypeFilter(type)}
                      >
                        {type}
                      </Button>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between border-b px-4 py-2 text-xs text-muted-foreground">
                <span>符合 {filteredMaterials.length} 筆</span>
                <button type="button" className="hover:text-foreground" onClick={() => choose(null)}>
                  清除選擇
                </button>
              </div>

              <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
                {loadError ? (
                  <div className="p-8 text-center text-sm text-muted-foreground">{loadError}</div>
                ) : filteredMaterials.length === 0 ? (
                  <div className="p-8 text-center text-sm text-muted-foreground">沒有符合條件的材料</div>
                ) : (
                  <div className="divide-y">
                    {filteredMaterials.map((material) => {
                      const active = value?.materialId === material.id;
                      return (
                        <button
                          type="button"
                          key={material.id}
                          className={cn(
                            "grid w-full grid-cols-[1fr_auto] gap-4 px-4 py-3 text-left hover:bg-muted/40",
                            active && "bg-primary/5"
                          )}
                          onClick={() => choose(material)}
                        >
                          <span className="min-w-0">
                            <span className="flex items-center gap-2">
                              <span className="truncate text-sm font-medium">{displayName(material)}</span>
                              {active && <Check className="h-4 w-4 shrink-0 text-primary" />}
                            </span>
                            <span className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground">
                              <span>{CATEGORY_LABELS[material.category] ?? material.category}</span>
                              {material.brand && <span>品牌 {material.brand}</span>}
                              {material.colorCode && <span>色號 {material.colorCode}</span>}
                              {material.surfaceTreatment && <span>表面 {material.surfaceTreatment}</span>}
                              {material.minCai !== null && <span>{material.minCai} 才起</span>}
                            </span>
                          </span>
                          <span className="text-right">
                            <span className="block text-sm font-semibold">{formatCurrency(material.price)}</span>
                            <span className="text-xs text-muted-foreground">/{material.unit}</span>
                          </span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </section>
          </div>
        </div>
      )}
    </>
  );
}
