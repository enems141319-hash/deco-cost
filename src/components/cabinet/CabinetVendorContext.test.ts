import assert from "node:assert/strict";
import { materialApiUrl } from "./CabinetVendorContext";

assert.equal(materialApiUrl("WEIHO", "BOARD_BODY"), "/api/materials?vendor=WEIHO&category=BOARD_BODY");
assert.equal(materialApiUrl("ZHENGDAO", "BOARD_BODY"), "/api/materials?vendor=ZHENGDAO&category=BOARD_BODY");
assert.equal(materialApiUrl("ZHENGDAO"), "/api/materials?vendor=ZHENGDAO");

console.log("CabinetVendorContext tests passed");
