"use client";

import { useCabinetVendor } from "@/components/cabinet/CabinetVendorContext";
import { MaterialDropdown } from "@/components/shared/MaterialDropdown";
import { ZhengdaoBoardMaterialPicker } from "@/components/shared/ZhengdaoBoardMaterialPicker";
import type { MaterialRef } from "@/types";

export function VendorBoardMaterialDropdown({
  value,
  onChange,
  category,
}: {
  value: MaterialRef | null;
  onChange: (ref: MaterialRef | null) => void;
  category: "BOARD_BODY" | "BOARD_BACKING";
}) {
  const vendor = useCabinetVendor();

  if (vendor === "ZHENGDAO") {
    return <ZhengdaoBoardMaterialPicker value={value} onChange={onChange} category={category} />;
  }

  return <MaterialDropdown value={value} onChange={onChange} categoryFilter={category} />;
}
