import assert from "node:assert/strict";
import { resolveZhengdaoDoorSelection } from "./zhengdao-door-2025";

const flat = resolveZhengdaoDoorSelection({ mode: "FLAT", optionCode: "ER" });
assert.equal(flat?.materialRef.pricePerUnit, 170);
assert.equal(flat?.materialRef.minCai, 1);

const shaped = resolveZhengdaoDoorSelection({ mode: "SHAPED", baseCode: "AR", optionCode: "JU" });
assert.equal(shaped?.materialRef.pricePerUnit, 490);
assert.equal(shaped?.materialRef.minCai, 2);
assert.equal(resolveZhengdaoDoorSelection({ mode: "SHAPED", baseCode: "MR", optionCode: "JU" }), null);

const aluminum = resolveZhengdaoDoorSelection({ mode: "ALUMINUM_FRAME", frameColor: "BLACK" });
assert.equal(aluminum?.materialRef.pricePerUnit, 650);
assert.equal(aluminum?.materialRef.minCai, 10);

console.log("Zhengdao door catalog tests passed");
