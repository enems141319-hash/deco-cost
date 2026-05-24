import assert from "node:assert/strict";
import { shouldRenderResultSectionBody } from "./CabinetResultPanel";

assert.equal(shouldRenderResultSectionBody(false, false), false);
assert.equal(shouldRenderResultSectionBody(true, false), true);
assert.equal(shouldRenderResultSectionBody(false, true), true);

console.log("CabinetResultPanel print expansion tests passed");
