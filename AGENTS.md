# DecoCost — AGENTS.md

給 AI coding agent（Claude Code、GitHub Copilot、Codex 等）閱讀的操作指引。

---

## 專案性質

商業化 SaaS，非 demo。修改前請先閱讀 `CLAUDE.md` 了解整體架構。

---

## 禁止事項

| 禁止 | 原因 |
|---|---|
| 在 UI 元件內寫計算邏輯 | 計算必須集中在 `src/lib/calculations/`，保持可測試性 |
| 在計算引擎內寫死數值 | 所有規則集中在 `src/lib/config/units.ts` |
| 使用 `any` 型別 | 嚴格 TypeScript，會在 build 時報錯 |
| 在 `src/middleware.ts` 引入 `src/lib/auth.ts` | 會引入 bcryptjs 導致 Edge Runtime 錯誤 |
| 直接把回傳非 void 的 Server Action 放進 `<form action>` | 型別錯誤，需用 `useActionState` wrapper |
| 修改 `prisma/schema.prisma` 後不執行 `npm run db:push` | Schema 與 DB 會不同步 |
| 刪除或繞過 `src/middleware.ts` | 會讓未登入者存取受保護頁面 |
| 直接把含 Prisma `Decimal` 的物件傳給 `NextResponse.json()` | `Decimal` 會序列化為字串，導致 Zod `z.number()` 驗證失敗，儲存功能全壞 |
| 在 client 端呼叫 Server Action 時不加 try-catch | 例外會造成 unhandled rejection，按鈕卡死在「處理中」無法恢復 |

---

## 必須遵守

### 新增計算規則
1. 在 `src/lib/config/units.ts` 新增常數
2. 在 `src/lib/calculations/` 的純函式中引用該常數
3. 更新 `src/types/` 的相關型別

### 新增 UI 元件
- Server Component 優先（資料讀取、靜態展示）
- 需要 state / 事件處理 → `"use client"` + Client Component
- 需要即時計算 → 在 Client Component 內直接呼叫計算引擎（純函式可在前端執行）

### 新增 API 或 Server Action

- 必須先驗證 session（`auth()` → 取得 userId）
- 對 DB 資料的操作必須先驗證 ownership（`where: { id, userId }`）
- 回傳格式：成功 redirect 或回傳 void；失敗回傳 `{ success: false, errors: Record<string, string[]> }`
- API route 回傳含 `Decimal` 欄位的物件前，必須先轉型：

```typescript
return NextResponse.json(items.map(i => ({ ...i, price: Number(i.price) })));
```

### 在 Client Component 呼叫 Server Action

必須包 try-catch，並在 finally 中重設 loading 狀態：

```typescript
try {
  const result = await someAction(data);
  // 處理回傳值
} catch (err) {
  console.error(err);
  setErrorMsg("操作失敗，請稍後再試");
} finally {
  setLoading(false);
}
```

### 新增資料庫欄位
```bash
# 1. 修改 prisma/schema.prisma
# 2. 同步到 DB
npm run db:push
# 3. 重新生成 Prisma Client（push 時自動執行）
```

---

## 常用指令

```bash
npm run dev          # 啟動開發伺服器
npm run build        # 生產構建 + 型別檢查
npm run typecheck    # 只跑型別檢查（不構建）
npm run db:push      # Schema → DB 同步
npm run db:seed      # 植入種子資料
npm run db:studio    # 開啟 Prisma Studio（GUI 查看 DB）
```

---

## 關鍵檔案快速索引

| 目的 | 檔案 |
|---|---|
| 計算常數調整 | `src/lib/config/units.ts` |
| 系統櫃計算引擎 | `src/lib/calculations/cabinet.ts` |
| 天花板計算引擎 | `src/lib/calculations/ceiling.ts` |
| 輸入 / 輸出型別 | `src/types/cabinet.ts`, `src/types/ceiling.ts` |
| DB schema | `prisma/schema.prisma` |
| 認證設定 | `src/lib/auth.ts` |
| 路由保護 | `src/middleware.ts` |
| 材料 dropdown 元件 | `src/components/shared/MaterialDropdown.tsx` |

---

## 測試計算引擎（不需 UI）

計算函式是純函式，可直接在 Node.js 中測試：

```typescript
import { calculateCabinetUnit } from "./src/lib/calculations/cabinet";
import { calculateCeilingMaterial } from "./src/lib/calculations/ceiling";

// 系統櫃測試
const result = calculateCabinetUnit({
  id: "test-1",
  name: "測試桶身",
  widthCm: 90, depthCm: 60, heightCm: 240,
  quantity: 1,
  hasBackPanel: true,
  panelMaterialRef: { materialId: "m1", materialName: "木心板", unit: "才", pricePerUnit: 55 },
  backPanelMaterialRef: null,
  middleDividers: [], shelves: [], doors: [], kickPlate: null,
});
console.log(result.summary);

// 天花板測試
const ceiling = calculateCeilingMaterial({
  areaPing: 5,
  autoPerimeter: true,
  roomLengthM: 4, roomWidthM: 3,
  angleMaterialRef: { materialId: "m2", materialName: "木角材", unit: "支", pricePerUnit: 65 },
  boardMaterialRef: null,
  perimeterAngleMaterialRef: null,
});
console.log(ceiling.items);
```

---

## 未來擴充模組預留清單

- `FLOOR` — 地板模組（ModuleType enum 已預留）
- `PAINT` — 油漆模組（ModuleType enum 已預留）
- 損耗率計算 — `Material.wasteRate` 欄位已在 DB，計算引擎尚未套用
- 利潤率 / 人工費 — 在 `EstimateItem` 層新增欄位
- 抽屜模組 — 在 `CabinetUnitInput` 擴充 `drawers` 陣列
- 封邊計算 — 在 `PanelResult` 加入周長計算
- 板材裁切優化 — 新增獨立模組，輸入為 `PanelResult[]`
