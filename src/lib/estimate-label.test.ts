import assert from "node:assert/strict";
import { displayEstimateLabel, estimateLabelOrDefault } from "./estimate-label";

assert.equal(estimateLabelOrDefault(" 主臥室 ", "系統櫃"), "主臥室");
assert.equal(estimateLabelOrDefault("", "系統櫃"), "系統櫃");
assert.equal(displayEstimateLabel("主臥室", "系統櫃"), "主臥室");
assert.equal(displayEstimateLabel("系統櫃", "系統櫃"), "未命名估價");
assert.equal(displayEstimateLabel(null, "系統櫃"), "未命名估價");

console.log("estimate label tests passed");
