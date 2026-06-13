import assert from "node:assert/strict";
import type { MaterialRef } from "@/types";
import {
  createBlankDoorHardwareItem,
  doorHardwareBrandFilter,
  doorHardwareMaterialPatch,
} from "./door-hardware-selection";

const hinge: MaterialRef = {
  materialId: "zhengdao-hinge-1",
  materialName: "內建緩衝鉸鏈 6分",
  unit: "個",
  pricePerUnit: 280,
  minCai: null,
};

assert.equal(doorHardwareBrandFilter("WEIHO", "HARDWARE_OTHER"), "推拉門五金");
assert.equal(doorHardwareBrandFilter("ZHENGDAO", "HARDWARE_OTHER"), undefined);
assert.equal(doorHardwareBrandFilter("ZHENGDAO", "HARDWARE_HINGE"), undefined);

assert.deepEqual(doorHardwareMaterialPatch(hinge), {
  materialRef: hinge,
  name: "內建緩衝鉸鏈 6分",
});
assert.deepEqual(doorHardwareMaterialPatch(null), {
  materialRef: null,
});

assert.deepEqual(createBlankDoorHardwareItem("HINGED", "hinge-row"), {
  id: "hinge-row",
  name: "鉸鏈",
  quantityPerDoor: 1,
  materialRef: null,
  includeHingeHoleDrilling: true,
  category: "HARDWARE_HINGE",
});
assert.deepEqual(createBlankDoorHardwareItem("SLIDING", "sliding-row"), {
  id: "sliding-row",
  name: "推拉門五金",
  quantityPerDoor: 1,
  materialRef: null,
  includeHingeHoleDrilling: false,
  category: "HARDWARE_OTHER",
});

console.log("door hardware selection tests passed");
