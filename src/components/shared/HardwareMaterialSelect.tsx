"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { materialApiUrl, useCabinetVendor } from "@/components/cabinet/CabinetVendorContext";
import type { MaterialRef } from "@/types";

interface HardwareOption {
  id: string;
  name: string;
  spec: string | null;
  unit: string;
  price: number;
  minCai: number | null;
  brand: string | null;
  vendorCode: string | null;
  sortOrder: number;
}

interface Props {
  value: MaterialRef | null;
  onChange: (ref: MaterialRef | null) => void;
  category: "HARDWARE_HINGE" | "HARDWARE_OTHER";
  fixedBrandFilter?: string;
  placeholder: string;
}

interface HardwareOptionRow {
  material: HardwareOption;
  displayName: string;
}

interface HardwareOptionGroup {
  label: string | null;
  rows: HardwareOptionRow[];
}

function toMaterialRef(material: HardwareOption, displayName?: string): MaterialRef {
  return {
    materialId: material.id,
    materialName: `${displayName ?? material.name}${material.spec ? ` (${material.spec})` : ""}`,
    unit: material.unit,
    pricePerUnit: material.price,
    minCai: material.minCai,
  };
}

function hardwareDisplayName(material: HardwareOption, enabled: boolean) {
  if (!enabled) return material.name;
  const vendorCode = material.vendorCode ? `${material.vendorCode} ` : "";
  return `${vendorCode}${material.name}`;
}

const ZHENGDAO_HINGE_GROUPS = [
  {
    label: "內建緩衝鉸鏈",
    codes: ["RW_B903608", "RW_B903308", "RW_B903038"],
  },
  {
    label: "厚門內建緩衝鉸鏈",
    codes: ["RW_B903658", "RW_B903358", "RW_B903058"],
  },
  {
    label: "一般鉸鏈 / 緩衝背包",
    codes: ["RW_B703603", "RW_B702608"],
  },
  {
    label: "170° 特殊鉸鏈 / 緩衝背包",
    codes: ["RW_B703643", "RW_B702648"],
  },
] satisfies Array<{ label: string; codes: string[] }>;

const ZHENGDAO_HINGE_CODE_ORDER = ZHENGDAO_HINGE_GROUPS.flatMap((group) => group.codes);

const zhengdaoHingeOrder = new Map<string, number>(
  ZHENGDAO_HINGE_CODE_ORDER.map((code, index) => [code, index]),
);

function sortHardwareOptions(
  options: HardwareOption[],
  shouldUseZhengdaoHingeOrder: boolean,
) {
  if (!shouldUseZhengdaoHingeOrder) return options;
  return [...options].sort((a, b) => {
    const aOrder = a.vendorCode ? zhengdaoHingeOrder.get(a.vendorCode) : undefined;
    const bOrder = b.vendorCode ? zhengdaoHingeOrder.get(b.vendorCode) : undefined;
    return (aOrder ?? Number.MAX_SAFE_INTEGER) - (bOrder ?? Number.MAX_SAFE_INTEGER);
  });
}

function groupHardwareOptionRows(
  rows: HardwareOptionRow[],
  shouldUseZhengdaoHingeGroups: boolean,
): HardwareOptionGroup[] {
  if (!shouldUseZhengdaoHingeGroups) return [{ label: null, rows }];

  const groups = ZHENGDAO_HINGE_GROUPS.map((group) => ({
    label: group.label,
    rows: rows.filter((row) => row.material.vendorCode ? group.codes.includes(row.material.vendorCode) : false),
  })).filter((group) => group.rows.length > 0);

  const uncategorizedRows = rows.filter((row) => (
    row.material.vendorCode ? !zhengdaoHingeOrder.has(row.material.vendorCode) : true
  ));
  if (uncategorizedRows.length > 0) groups.push({ label: "其他鉸鏈", rows: uncategorizedRows });

  return groups;
}

export function HardwareMaterialSelect({
  value,
  onChange,
  category,
  fixedBrandFilter,
  placeholder,
}: Props) {
  const vendor = useCabinetVendor();
  const [materials, setMaterials] = useState<HardwareOption[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetch(materialApiUrl(vendor, category), { credentials: "same-origin" })
      .then(async (response) => {
        if (!response.ok) throw new Error(`Failed to load hardware: ${response.status}`);
        return response.json() as Promise<HardwareOption[]>;
      })
      .then((rows) => {
        if (!cancelled) setMaterials(rows);
      })
      .catch((error) => {
        console.error("[HardwareMaterialSelect] failed to load hardware", error);
        if (!cancelled) setMaterials([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [category, vendor]);

  const shouldNumberOptions = vendor === "ZHENGDAO" && category === "HARDWARE_HINGE";
  const options = useMemo(
    () => sortHardwareOptions(
      materials.filter((material) => !fixedBrandFilter || material.brand === fixedBrandFilter),
      shouldNumberOptions,
    ),
    [fixedBrandFilter, materials, shouldNumberOptions],
  );
  const optionRows = useMemo(
    () => options.map((material) => ({
      material,
      displayName: hardwareDisplayName(material, shouldNumberOptions),
    })),
    [options, shouldNumberOptions],
  );
  const optionGroups = useMemo(
    () => groupHardwareOptionRows(optionRows, shouldNumberOptions),
    [optionRows, shouldNumberOptions],
  );

  return (
    <Select
      value={value?.materialId ?? ""}
      onValueChange={(materialId) => {
        const row = optionRows.find((option) => option.material.id === materialId);
        onChange(row ? toMaterialRef(row.material, row.displayName) : null);
      }}
      disabled={loading}
    >
      <SelectTrigger className="h-8 w-full min-w-0 overflow-hidden text-xs [&>span]:min-w-0 [&>span]:truncate">
        <SelectValue placeholder={loading ? "載入五金中..." : placeholder} />
      </SelectTrigger>
      <SelectContent className="max-w-[calc(100vw-2rem)]">
        {optionGroups.map((group, groupIndex) => (
          <SelectGroup key={group.label ?? "hardware-options"}>
            {group.label && (
              <SelectLabel className="px-2 py-1 text-[11px] font-semibold text-primary">
                {group.label}
              </SelectLabel>
            )}
            {group.rows.map(({ material, displayName }) => (
              <SelectItem key={material.id} value={material.id} className="max-w-[calc(100vw-3rem)]">
                <span className="block max-w-[min(560px,calc(100vw-5rem))] truncate">
                  {displayName}
                  {material.spec ? ` (${material.spec})` : ""}
                  {` - $${material.price}/${material.unit}`}
                </span>
              </SelectItem>
            ))}
            {groupIndex < optionGroups.length - 1 && <SelectSeparator />}
          </SelectGroup>
        ))}
      </SelectContent>
    </Select>
  );
}
