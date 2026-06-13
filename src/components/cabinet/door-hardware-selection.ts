import type { MaterialRef } from "@/types";
import type { DoorHardwareItemInput, DoorType } from "@/types/cabinet";
import type { CabinetVendor } from "@/types/vendor";

type DoorHardwareCategory = "HARDWARE_HINGE" | "HARDWARE_OTHER";

export function createBlankDoorHardwareItem(
  doorType: DoorType,
  id: string,
): DoorHardwareItemInput {
  const hinged = doorType === "HINGED";
  return {
    id,
    name: hinged ? "鉸鏈" : "推拉門五金",
    quantityPerDoor: 1,
    materialRef: null,
    includeHingeHoleDrilling: hinged,
    category: hinged ? "HARDWARE_HINGE" : "HARDWARE_OTHER",
  };
}

export function doorHardwareBrandFilter(
  vendor: CabinetVendor,
  category: DoorHardwareCategory,
): string | undefined {
  if (vendor === "WEIHO" && category === "HARDWARE_OTHER") {
    return "推拉門五金";
  }
  return undefined;
}

export function doorHardwareMaterialPatch(materialRef: MaterialRef | null): {
  materialRef: MaterialRef | null;
  name?: string;
} {
  return materialRef
    ? { materialRef, name: materialRef.materialName }
    : { materialRef: null };
}
