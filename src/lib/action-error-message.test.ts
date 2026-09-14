import assert from "node:assert/strict";
import { getServerActionErrorMessage } from "./action-error-message";

assert.equal(
  getServerActionErrorMessage(
    { success: false, message: "此專案已在其他裝置更新，請重新載入最新資料後再儲存。" },
    "儲存失敗，請稍後再試",
  ),
  "此專案已在其他裝置更新，請重新載入最新資料後再儲存。",
);

assert.equal(
  getServerActionErrorMessage(
    { success: false, errors: { _: ["無此專案"] } },
    "儲存失敗，請稍後再試",
  ),
  "無此專案",
);

assert.equal(
  getServerActionErrorMessage(
    { success: false, errors: { fieldErrors: { units: ["至少需要一個桶身"] } } },
    "儲存失敗，請稍後再試",
  ),
  "至少需要一個桶身",
);

assert.equal(
  getServerActionErrorMessage({ success: false }, "儲存失敗，請稍後再試"),
  "儲存失敗，請稍後再試",
);

console.log("action error message tests passed");
