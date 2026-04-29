"use client";

import { useMemo, useState } from "react";
import { Power, PowerOff, Plus, Search, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MaterialForm } from "@/components/materials/MaterialForm";
import { deleteMaterial, toggleMaterialActive } from "@/lib/actions/materials";
import { cn, formatCurrency } from "@/lib/utils";

export interface MaterialData {
  id: string;
  category: string;
  brand?: string | null;
  colorCode?: string | null;
  surfaceTreatment?: string | null;
  boardType?: string | null;
  name: string;
  spec?: string;
  unit: string;
  price: number;
  minCai?: number | null;
  wasteRate: number;
  isActive: boolean;
}

interface Props {
  materials: MaterialData[];
}

interface FilterKey {
  id: string;
  category: string;
  brand: string | null;
  label: string;
  section: string;
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
  WIRE_MESH: "網材",
  CEILING_BOARD: "天花板板材",
  ANGLE_MATERIAL: "角材",
  OTHER: "其他",
};

function materialBrand(material: MaterialData) {
  return material.brand?.trim() || "未分類";
}

function matchesFilter(material: MaterialData, filter: FilterKey) {
  return material.category === filter.category && (filter.brand === null || materialBrand(material) === filter.brand);
}

function isSystemBoardCategory(category: string) {
  return category === "BOARD_BODY" || category === "BOARD_BACKING" || category === "BOARD_DOOR";
}

function materialMainLabel(material: MaterialData) {
  return material.colorCode || material.name;
}

function materialDetailLabel(material: MaterialData) {
  return [material.surfaceTreatment, material.boardType || material.spec].filter(Boolean).join(" / ") || "-";
}

function buildGroups(materials: MaterialData[]) {
  const result: { filter: FilterKey; count: number }[] = [];
  const add = (filter: FilterKey) => {
    const count = materials.filter((material) => matchesFilter(material, filter)).length;
    if (count > 0) result.push({ filter, count });
  };

  add({ id: "BOARD_BODY", section: "系統板材", label: "桶身板材", category: "BOARD_BODY", brand: null });
  add({ id: "BOARD_BACKING", section: "系統板材", label: "背板", category: "BOARD_BACKING", brand: null });
  add({ id: "BOARD_DOOR", section: "系統板材", label: "門片", category: "BOARD_DOOR", brand: null });

  const hingeBrands = Array.from(
    new Set(materials.filter((material) => material.category === "HARDWARE_HINGE").map(materialBrand)),
  ).sort();
  for (const brand of hingeBrands) {
    add({ id: `HARDWARE_HINGE:${brand}`, section: "五金絞鏈", label: brand, category: "HARDWARE_HINGE", brand });
  }

  add({ id: "HARDWARE_RAIL", section: "滑軌 / 推拉門五金", label: "滑軌", category: "HARDWARE_RAIL", brand: null });
  add({ id: "PUSH_DOOR_HARDWARE", section: "滑軌 / 推拉門五金", label: "推拉門", category: "HARDWARE_OTHER", brand: "推拉門五金" });
  add({ id: "HARDWARE_HANDLE", section: "把手", label: "把手", category: "HARDWARE_HANDLE", brand: null });
  add({ id: "GLASS", section: "玻璃 / 網材", label: "玻璃", category: "GLASS", brand: null });
  add({ id: "WIRE_MESH", section: "玻璃 / 網材", label: "網材", category: "WIRE_MESH", brand: null });

  const otherBrands = Array.from(
    new Set(
      materials
        .filter((material) => material.category === "HARDWARE_OTHER" && materialBrand(material) !== "推拉門五金")
        .map(materialBrand),
    ),
  ).sort();
  for (const brand of otherBrands) {
    add({ id: `HARDWARE_OTHER:${brand}`, section: "五金 / 另料", label: brand, category: "HARDWARE_OTHER", brand });
  }

  for (const material of materials) {
    if (
      [
        "BOARD_BODY",
        "BOARD_BACKING",
        "BOARD_DOOR",
        "HARDWARE_HINGE",
        "HARDWARE_RAIL",
        "HARDWARE_HANDLE",
        "HARDWARE_OTHER",
        "GLASS",
        "WIRE_MESH",
      ].includes(material.category)
    ) {
      continue;
    }

    const filter = {
      id: material.category,
      section: "其他",
      label: CATEGORY_LABELS[material.category] ?? material.category,
      category: material.category,
      brand: null,
    };
    if (!result.some((group) => group.filter.id === filter.id)) add(filter);
  }

  return result;
}

export function MaterialsClient({ materials }: Props) {
  const router = useRouter();
  const groups = useMemo(() => buildGroups(materials), [materials]);
  const firstFilter = groups[0]?.filter ?? {
    id: "BOARD_BODY",
    category: "BOARD_BODY",
    brand: null,
    label: "桶身板材",
    section: "系統板材",
  };

  const [selectedFilter, setSelectedFilter] = useState<FilterKey>(firstFilter);
  const [selectedId, setSelectedId] = useState<string | null>(materials.find((material) => matchesFilter(material, firstFilter))?.id ?? null);
  const [adding, setAdding] = useState(false);
  const [query, setQuery] = useState("");
  const [actionError, setActionError] = useState<string | null>(null);

  const visibleMaterials = materials.filter((material) => {
    const groupMatch = matchesFilter(material, selectedFilter);
    const text = [
      material.name,
      material.brand,
      material.colorCode,
      material.surfaceTreatment,
      material.boardType,
      material.spec,
    ].filter(Boolean).join(" ").toLowerCase();
    return groupMatch && text.includes(query.trim().toLowerCase());
  });

  const showBrandColumn = isSystemBoardCategory(selectedFilter.category);
  const selectedMaterial = adding ? null : materials.find((material) => material.id === selectedId) ?? null;

  async function handleDelete(material: MaterialData) {
    if (!confirm(`確定要刪除「${material.name}」？`)) return;

    setActionError(null);
    try {
      await deleteMaterial(material.id);
      if (selectedId === material.id) {
        const fallback = visibleMaterials.find((item) => item.id !== material.id);
        setSelectedId(fallback?.id ?? null);
      }
      router.refresh();
    } catch (err) {
      console.error(err);
      setActionError("刪除失敗，請稍後再試");
    }
  }

  async function handleToggle(material: MaterialData) {
    setActionError(null);
    try {
      await toggleMaterialActive(material.id, !material.isActive);
      router.refresh();
    } catch (err) {
      console.error(err);
      setActionError("狀態更新失敗，請稍後再試");
    }
  }

  return (
    <div className="grid min-h-[calc(100vh-8rem)] grid-cols-[220px_minmax(420px,1fr)_420px] overflow-hidden rounded border bg-background">
      <aside className="border-r bg-muted/20">
        <div className="border-b px-4 py-3">
          <h2 className="text-sm font-semibold">分類</h2>
          <p className="text-xs text-muted-foreground">{materials.length} 筆材料</p>
        </div>
        <div className="space-y-1 p-2">
          {groups.map((group, index) => {
            const active = group.filter.id === selectedFilter.id;
            const showSection = index === 0 || groups[index - 1]?.filter.section !== group.filter.section;
            return (
              <div key={group.filter.id}>
                {showSection && (
                  <div className="px-3 pb-1 pt-3 text-[11px] font-semibold text-muted-foreground">
                    {group.filter.section}
                  </div>
                )}
                <button
                  type="button"
                  className={cn(
                    "w-full rounded px-3 py-2 text-left text-sm transition-colors",
                    active ? "bg-primary text-primary-foreground" : "hover:bg-muted",
                  )}
                  onClick={() => {
                    setSelectedFilter(group.filter);
                    const first = materials.find((material) => matchesFilter(material, group.filter));
                    setSelectedId(first?.id ?? null);
                    setAdding(false);
                  }}
                >
                  <span className="block font-medium">{group.filter.label}</span>
                  <span className={active ? "text-xs text-primary-foreground/80" : "text-xs text-muted-foreground"}>
                    {CATEGORY_LABELS[group.filter.category] ?? group.filter.category} · {group.count}
                  </span>
                </button>
              </div>
            );
          })}
        </div>
      </aside>

      <section className="border-r">
        <div className="flex items-center gap-2 border-b px-4 py-3">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              className="pl-8"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="搜尋名稱、品牌、色號或規格"
            />
          </div>
          <Button
            size="sm"
            onClick={() => {
              setAdding(true);
              setSelectedId(null);
            }}
          >
            <Plus className="mr-1 h-4 w-4" />
            新增品項
          </Button>
        </div>

        <div className="overflow-auto">
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-muted/40 text-xs text-muted-foreground">
              <tr>
                {showBrandColumn && <th className="px-4 py-2 text-left font-medium">品牌</th>}
                <th className="px-4 py-2 text-left font-medium">色號 / 名稱</th>
                <th className="px-3 py-2 text-left font-medium">表面</th>
                <th className="px-3 py-2 text-left font-medium">規格</th>
                <th className="px-3 py-2 text-right font-medium">單價</th>
                <th className="px-3 py-2 text-right font-medium">最低才數</th>
                <th className="w-[150px] px-4 py-2 text-center font-medium">操作</th>
              </tr>
            </thead>
            <tbody>
              {visibleMaterials.map((material) => (
                <tr
                  key={material.id}
                  className={cn(
                    "cursor-pointer border-t hover:bg-muted/30",
                    selectedId === material.id && !adding ? "bg-primary/5" : "",
                    !material.isActive ? "opacity-60" : "",
                  )}
                  onClick={() => {
                    setSelectedId(material.id);
                    setAdding(false);
                  }}
                >
                  {showBrandColumn && <td className="px-4 py-2 text-muted-foreground">{material.brand ?? "-"}</td>}
                  <td className="px-4 py-2">
                    <div className="font-medium">{materialMainLabel(material)}</div>
                    {material.colorCode && material.name !== material.colorCode && (
                      <div className="text-xs text-muted-foreground">{material.name}</div>
                    )}
                  </td>
                  <td className="px-3 py-2 text-muted-foreground">{material.surfaceTreatment ?? "-"}</td>
                  <td className="px-3 py-2 text-muted-foreground">{material.boardType ?? material.spec ?? "-"}</td>
                  <td className="px-3 py-2 text-right font-medium">{formatCurrency(material.price)}</td>
                  <td className="px-3 py-2 text-right text-muted-foreground">
                    {material.minCai !== null && material.minCai !== undefined ? `${material.minCai}才` : "-"}
                  </td>
                  <td className="w-[150px] px-4 py-2">
                    <div className="flex items-center justify-end gap-2" onClick={(event) => event.stopPropagation()}>
                      <Button
                        variant={material.isActive ? "outline" : "default"}
                        size="sm"
                        className="h-8 min-w-[72px] whitespace-nowrap px-2"
                        title={material.isActive ? "停用" : "啟用"}
                        onClick={() => handleToggle(material)}
                      >
                        {material.isActive ? <PowerOff className="mr-1 h-4 w-4" /> : <Power className="mr-1 h-4 w-4" />}
                        {material.isActive ? "停用" : "啟用"}
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive"
                        title="刪除"
                        onClick={() => handleDelete(material)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <aside className="overflow-auto">
        <div className="border-b px-4 py-3">
          <h2 className="text-sm font-semibold">{adding ? "新增品項" : selectedMaterial ? "編輯品項" : "品項"}</h2>
          {actionError && <p className="mt-1 text-xs text-destructive">{actionError}</p>}
        </div>
        <div className="p-4">
          {adding || selectedMaterial ? (
            <MaterialForm
              key={selectedMaterial?.id ?? `new-${selectedFilter.id}`}
              materialId={selectedMaterial?.id}
              defaultValues={selectedMaterial ?? {
                category: selectedFilter.category,
                brand: selectedFilter.brand ?? "",
                unit: "才",
                wasteRate: 0,
              }}
              onSuccess={() => {
                setAdding(false);
                router.refresh();
              }}
            />
          ) : (
            <p className="text-sm text-muted-foreground">選擇一個品項後即可編輯。</p>
          )}
        </div>
      </aside>
    </div>
  );
}
