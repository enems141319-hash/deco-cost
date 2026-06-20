import assert from "node:assert/strict";
import { ZHENGDAO_2025_DOOR_PROCESS_RULE_BY_CODE } from "./zhengdao-door-processes";

const edgeA = ZHENGDAO_2025_DOOR_PROCESS_RULE_BY_CODE.EDGE_A;
assert.equal(edgeA.unitPrice, 10);
assert.equal(edgeA.billingMode, "PER_CAI");
assert.equal(edgeA.minCai, 1);
assert.equal(edgeA.series.includes("P6_BOARD_PROCESS"), true);

const patternMatch = ZHENGDAO_2025_DOOR_PROCESS_RULE_BY_CODE.DOOR_PATTERN_MATCH;
assert.equal(patternMatch.unitPrice, 80);
assert.equal(patternMatch.billingMode, "PER_CAI");
assert.equal(patternMatch.minCai, 5);

const g12EightMm = ZHENGDAO_2025_DOOR_PROCESS_RULE_BY_CODE.G12_8;
assert.equal(g12EightMm.unitPrice, 1200);
assert.equal(g12EightMm.billingMode, "PER_ITEM");
assert.equal(g12EightMm.series.includes("P6_BOARD_PROCESS"), true);

const g15EightMm = ZHENGDAO_2025_DOOR_PROCESS_RULE_BY_CODE.G15_8;
assert.equal(g15EightMm.unitPrice, 2000);
assert.equal(g15EightMm.billingMode, "PER_ITEM");

const hingeHole = ZHENGDAO_2025_DOOR_PROCESS_RULE_BY_CODE.HINGE_HOLE;
assert.equal(hingeHole.unitPrice, 40);
assert.equal(hingeHole.billingMode, "PER_ITEM");

const outsourcedHingeHole = ZHENGDAO_2025_DOOR_PROCESS_RULE_BY_CODE.OUTSOURCED_HINGE_HOLE;
assert.equal(outsourcedHingeHole.unitPrice, 200);
assert.equal(outsourcedHingeHole.billingMode, "PER_ITEM");

console.log("Zhengdao door process tests passed");
