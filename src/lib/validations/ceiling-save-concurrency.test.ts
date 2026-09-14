import assert from "node:assert/strict";
import { ceilingProjectInputSchema } from "./ceiling";

const result = ceilingProjectInputSchema.safeParse({
  projectId: "project-1",
  label: "Ceiling estimate",
  clientProjectVersion: 4,
  input: {
    areaPing: 5,
    autoPerimeter: true,
    roomLengthM: 4,
    roomWidthM: 3,
    angleMaterialRef: null,
    boardMaterialRef: null,
    perimeterAngleMaterialRef: null,
  },
});

assert.equal(result.success, true);
if (!result.success) {
  throw new Error("Expected ceilingProjectInputSchema to accept project concurrency payload");
}

assert.equal(result.data.clientProjectVersion, 4);

console.log("ceiling save concurrency validation tests passed");
