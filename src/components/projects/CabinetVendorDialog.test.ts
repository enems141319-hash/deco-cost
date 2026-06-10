import assert from "node:assert/strict";
import { cabinetVendorPath } from "./CabinetVendorDialog";

assert.equal(cabinetVendorPath("project-1", "WEIHO"), "/projects/project-1/cabinet");
assert.equal(cabinetVendorPath("project-1", "ZHENGDAO"), "/projects/project-1/zhengdao-cabinet");

console.log("CabinetVendorDialog routing tests passed");
