import assert from "node:assert/strict";
import { cabinetProjectInputSchema } from "./cabinet";

const materialRef = {
  materialId: "material-1",
  materialName: "Test board 18mm",
  unit: "cai",
  pricePerUnit: 100,
  minCai: null,
};

const result = cabinetProjectInputSchema.safeParse({
  projectId: "project-1",
  label: "Test estimate",
  vendor: "ZHENGDAO",
  clientProjectVersion: 3,
  clientVersion: 7,
  units: [
    {
      id: "unit-1",
      vendor: "ZHENGDAO",
      name: "Unit 1",
      widthCm: 60,
      depthCm: 45,
      heightCm: 80,
      quantity: 1,
      hasBackPanel: false,
      panelMaterialRef: materialRef,
      backPanelMaterialRef: null,
      addons: { frontEdgeABS: "none" },
      middleDividers: [],
      shelves: [],
      drawers: [
        {
          id: "drawer-1",
          name: "Drawer 1",
          widthCm: 50,
          heightCm: 16,
          depthCm: 45,
          railLengthCm: 45,
          quantity: 1,
          grooveSpec: "8.5",
          railMaterialRef: null,
          wallMaterialRef: materialRef,
          bottomMaterialRef: materialRef,
          zhengdaoProcesses: [
            { id: "process-1", code: "EDGE_A", quantityPerDoor: 1, lengthMm: 300 },
          ],
        },
      ],
      drawerTrays: [],
      doors: [],
      hardwareItems: [],
      otherCostItems: [],
      kickPlate: null,
      manualKickPlates: [],
    },
  ],
});

assert.equal(result.success, true);
if (!result.success) {
  throw new Error("Expected cabinetProjectInputSchema to accept concurrency payload");
}

assert.equal(result.data.clientVersion, 7);
assert.equal(result.data.clientProjectVersion, 3);
assert.deepEqual(result.data.units[0]?.drawers[0]?.zhengdaoProcesses, [
  { id: "process-1", code: "EDGE_A", quantityPerDoor: 1, lengthMm: 300 },
]);

console.log("cabinet save concurrency validation tests passed");
