import assert from "node:assert/strict";
import { materialApiErrorMessage } from "./material-api-error";

assert.equal(
  materialApiErrorMessage(401),
  "登入已過期，請重新登入後再選擇材料",
);
assert.equal(
  materialApiErrorMessage(500),
  "材料載入失敗，請稍後再試",
);

console.log("material api error tests passed");
