"use client";

import { useEffect, useMemo, useState } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
}

interface Props {
  value: MaterialRef | null;
  onChange: (ref: MaterialRef | null) => void;
  category: "HARDWARE_HINGE" | "HARDWARE_OTHER";
  fixedBrandFilter?: string;
  placeholder: string;
}

function toMaterialRef(material: HardwareOption): MaterialRef {
  return {
    materialId: material.id,
    materialName: `${material.name}${material.spec ? ` (${material.spec})` : ""}`,
    unit: material.unit,
    pricePerUnit: material.price,
    minCai: material.minCai,
  };
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

  const options = useMemo(
    () => materials.filter((material) => !fixedBrandFilter || material.brand === fixedBrandFilter),
    [fixedBrandFilter, materials],
  );

  return (
    <Select
      value={value?.materialId ?? ""}
      onValueChange={(materialId) => {
        const material = options.find((option) => option.id === materialId);
        onChange(material ? toMaterialRef(material) : null);
      }}
      disabled={loading}
    >
      <SelectTrigger className="h-8 w-full min-w-0 overflow-hidden text-xs [&>span]:min-w-0 [&>span]:truncate">
        <SelectValue placeholder={loading ? "載入五金中..." : placeholder} />
      </SelectTrigger>
      <SelectContent className="max-w-[calc(100vw-2rem)]">
        {options.map((material) => (
          <SelectItem key={material.id} value={material.id} className="max-w-[calc(100vw-3rem)]">
            <span className="block max-w-[min(560px,calc(100vw-5rem))] truncate">
              {material.name}
              {material.spec ? ` (${material.spec})` : ""}
              {` - $${material.price}/${material.unit}`}
            </span>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
