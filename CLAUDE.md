# DecoCost — CLAUDE.md

室內裝潢材料成本估價 SaaS。本文件是 Claude Code 的專案說明，每次開啟此專案時自動載入。

---

## 快速啟動

```bash
npm run dev -- -p 3001  # http://localhost:3001（需與 AUTH_URL 對齊）
npm run build        # 生產構建（含型別檢查）
npm run typecheck    # 僅型別檢查
npm run db:push      # 同步 Prisma schema 到 DB
npm run db:seed      # 植入初始材料資料（28 筆）
npm run db:studio    # Prisma Studio GUI
```

---

## Current Cabinet Rules

The notes below are the current source of truth for cabinet calculation behavior added during the redesign. Keep these rules in `src/lib/calculations/cabinet.ts` and constants in `src/lib/config/units.ts`; do not move calculations into UI components.

### Fixed Body Panels

- Side panels use cabinet total height by depth.
- Top and bottom panels must deduct the left and right side panel thickness from total cabinet width.
- Thickness is currently parsed from `panelMaterialRef.materialName`:
  - `18mm` => `1.8cm`
  - `25mm` => `2.5cm`
- Examples:
  - total width `40cm`, `18mm` body material => top/bottom width `36.4cm`
  - total width `40cm`, `25mm` body material => top/bottom width `35cm`
- If material thickness cannot be parsed, keep the original width instead of guessing.

### Back Panel

- Back panel width = cabinet total width - `2.2cm`.
- Back panel height = cabinet total height - `2.2cm`.
- Example: cabinet `60 x 80cm` => back panel `57.8 x 77.8cm`.
- When a back panel is enabled, add this processing note to body side/top/bottom panels:
  - `背板溝槽: 離後緣18mm, 寬8.5mm, 深9mm`

### Drawer Breakdown

Drawer input uses panel width `W`, panel height `H`, rail length `L`, and quantity.

- Front panel / drawer head: `W x H`, quantity = drawer quantity.
- Left/right side panels: `L x (H - 7cm)`, quantity = drawer quantity x 2.
- Front/back wall panels: `(W - 10.2cm) x (H - 7cm)`, quantity = drawer quantity x 2.
- 8mm bottom panel: `(W - 8.8cm) x (L - 2.2cm)`, quantity = drawer quantity.
- Drawer board material minimum `minCai` is checked by total area for the same material across all drawer board parts, not per individual drawer part row.
- Drawer wall materials have groove spec options `12`, `8.5`, `9`.
- The groove selector belongs beside `18mm牆板材料` in the drawer form.
- Drawer left/right and front/back wall panel result notes should be:
  - `內側下方打溝 (<spec>)`

### Light Groove Processing

- Light groove processing is calculated in `src/lib/calculations/cabinet.ts`.
- Body panel options:
  - top panel inner side
  - side panel inner side
- Middle divider options:
  - left side
  - right side
- Shelf options:
  - top side
  - bottom side
- User inputs distance from front edge in mm.
- Groove width is fixed at `10mm`; depth is fixed at `11mm`.
- Processing fee is per line:
  - length `<= 2400mm` => `180`
  - length `>= 2401mm` => `360`
- Side panel light groove applies to both left and right side panels.
- Store process row quantity and unit price separately from subtotal.
- Cabinet live result rows must show light groove process rows as quantity x unit price:
  - Example: two short grooves should show quantity `2`, unit price `$180`, subtotal `$360`.
  - Do not collapse this into a single `$360` unit price.

### Door And Hardware Notes

- Wire mesh door material selection uses `WIRE_MESH`.
- Wire mesh selector should show `擴張網` and `沖孔網`; specified color paint processing is a separate material item.
- Aluminum handle is a toggle; only show handle material selection after it is enabled.
- Profile handle processing is a door add-on option and is calculated in the calculation engine.
- Profile handle styles `SFJA` full J and `SFCA` full C use the door height as fixed processing length; user-entered length is ignored/disabled.
- In live cabinet results, profile handle processing should display under the related door row as an `加工-...` process row, matching body panel processing display.
- Profile handle processing should not also appear in the door hardware table.
- Additional hardware/loose items are selected through the `五金/另料` flow.

### Material Summary Notes

- Material summary aggregation belongs in `src/lib/calculations/material-summary.ts`; UI components should render prepared rows only.
- Shared summary table UI lives in `src/components/shared/MaterialSummaryTables.tsx`.
- Cabinet page material summary lives in `src/components/cabinet/MaterialSummaryPanel.tsx`.
- Project detail page summary lives in `src/components/projects/ProjectCostBreakdown.tsx`.
- Material summary detail table column order must be:
  - `材料 / 規格`
  - `部件 / 品項`
  - `數量`
  - `尺寸`
  - `才數`
  - `加工 / 備註`
  - `單價`
  - `小計`
- Each cabinet bucket summary should show its detail table, then:
  - `同板材才數總和(不考慮加工)`
  - `五金總表`
  - `加工總額`
- Project detail page should show only `本專案材料統整` in the former cost breakdown area.
  - Do not render each estimate or each cabinet bucket detail table there.
  - Show project-level same-material cai totals, hardware summary table, and processing total.
  - Stack summary sections vertically on the project page to avoid crowded tables.
- Door processing rows must appear directly under the related door material row.
- Board processing quantity must follow the parent board quantity. Example: two left side panels requiring processing should show processing quantity `2`.
- Saved `EstimateItem.resultData` may be legacy JSON. Summary builders must tolerate missing newer fields such as `PanelResult.processes` and `lightGrooveCost`.
- Detail tables may use horizontal scrolling inside their own container, but must not push the page wider than its parent.

### Material Library Notes

- System board categories are organized as:
  - `系統板材 / 桶身板材`
  - `系統板材 / 背板`
  - `系統板材 / 門片`
- System board material lists show brand before color code.
- Glass and mesh are separate groups: `玻璃` and `網材`.
- Hinge materials are grouped by brand.
- Rail and sliding-door hardware are grouped under `滑軌/推拉門五金`.
- Material library client page: `src/app/(dashboard)/materials/MaterialsClient.tsx`.
- Material edit form: `src/components/materials/MaterialForm.tsx`.
- `MaterialForm` uses uncontrolled inputs with `defaultValue`; switching the selected material must remount the form with `key={selectedMaterial.id}` or equivalent, otherwise the right edit panel will keep showing stale values.
- Enable/disable/delete controls belong on each material list row, not in the right edit panel.
- Enabled rows should show a fixed-width action button labeled `停用`; disabled rows should show `啟用`.
- Do not use a status badge as the primary enable button in the operation column; it wraps into an unreadable circle in narrow layouts.

### Verification

For cabinet calculation changes, run:

```bash
npx tsx src/lib/calculations/cabinet.redesign.test.ts
npx tsx src/lib/calculations/material-summary.test.ts
npm run typecheck
```

Demo 帳號：`demo@decoest.com` / `password123`

---

## 技術棧

| 層 | 技術 |
|---|---|
| 框架 | Next.js 15 App Router |
| 語言 | TypeScript（strict mode，禁用 any） |
| 樣式 | Tailwind CSS + shadcn/ui（手工實作於 `src/components/ui/`） |
| 表單 | React Hook Form + Zod |
| ORM | Prisma 5 |
| DB | PostgreSQL（Neon serverless） |
| 認證 | NextAuth v5（Credentials provider + JWT session） |
| 狀態 | React `useActionState`（Server Actions 回傳錯誤） |

---

## 專案架構

```
src/
├── app/
│   ├── (auth)/              # 登入 / 註冊（不走 dashboard layout）
│   ├── (dashboard)/         # 主應用（受 middleware 保護）
│   │   ├── dashboard/       # 總覽
│   │   ├── projects/        # 專案 CRUD + 估價子頁
│   │   │   └── [id]/
│   │   │       ├── cabinet/ # 系統櫃估價
│   │   │       └── ceiling/ # 天花板估價
│   │   └── materials/       # 材料管理
│   └── api/                 # REST API（供 client component fetch 用）
│       ├── auth/[...nextauth]/
│       ├── projects/
│       ├── estimate-items/
│       └── materials/
├── components/
│   ├── ui/                  # shadcn/ui 基礎元件
│   ├── cabinet/             # 系統櫃相關元件
│   ├── ceiling/             # 天花板相關元件
│   ├── materials/           # 材料管理元件
│   └── shared/              # 跨模組共用元件
├── lib/
│   ├── calculations/        # ⭐ 計算引擎（純函式）
│   ├── actions/             # Server Actions
│   ├── config/units.ts      # ⭐ 所有計算規則集中在此
│   ├── validations/         # Zod schemas
│   ├── auth.ts              # NextAuth 完整設定（含 bcryptjs）
│   ├── auth.config.ts       # Edge-compatible 設定（給 middleware 用）
│   └── db.ts                # Prisma singleton
└── types/                   # TypeScript 型別定義
```

---

## 核心規則（勿違反）

### 計算引擎
- `src/lib/calculations/` 內的函式必須是**純函式**，零副作用、零 UI 依賴
- 所有計算常數（才數換算、鉸鏈間距、天花板用量比例）集中在 `src/lib/config/units.ts`，不可在其他地方寫死數值
- `calculateCabinetUnit(input)` → `CabinetUnitResult`
- `calculateCabinetProject(units[])` → `CabinetProjectResult`
- `calculateCeilingMaterial(input)` → `CeilingResult`

### 認證分層
- `src/lib/auth.config.ts` — 僅含 Edge Runtime 相容設定，**不可引入 bcryptjs**
- `src/lib/auth.ts` — 完整設定，含 Credentials provider
- `src/middleware.ts` — 只引入 `auth.config`，不引入 `auth`

### Server Actions 型別
- 直接用於 `<form action={...}>` 的 action 必須回傳 `void | Promise<void>`
- 需要回傳錯誤的 action，用 `useActionState` 搭配 wrapper function（參考 `RegisterForm.tsx`）

### TypeScript
- 禁用 `any`（`tsconfig.json` strict mode）
- 所有型別定義在 `src/types/`
- Prisma 生成型別在 `@prisma/client`

---

## 資料庫 Schema

```
User → EstimateProject (1:N) → EstimateItem (1:N)
Material（獨立，被 UI 參照，不建 FK）
```

`EstimateItem.inputData` — 原始輸入 JSON（`CabinetUnitInput[]` 或 `CeilingInput`）
`EstimateItem.resultData` — 計算結果快照 JSON（可重新計算，此為快取）

---

## 擴充模組（預留）

新增模組（如地板、油漆）步驟：
1. `prisma/schema.prisma` → `ModuleType` enum 加新值
2. `src/types/` → 新增 input / result 型別
3. `src/lib/calculations/` → 新增純函式計算引擎
4. `src/lib/config/units.ts` → 新增計算常數
5. `src/components/` → 新增對應 UI 元件
6. `src/app/(dashboard)/projects/[id]/[module]/` → 新增頁面
7. `src/lib/actions/estimates.ts` → 新增 save/update action

---

## 環境變數

| 變數 | 說明 |
|---|---|
| `DATABASE_URL` | Neon PostgreSQL 連線字串 |
| `AUTH_SECRET` | NextAuth JWT 簽名金鑰（`openssl rand -base64 32`） |
| `AUTH_URL` | 應用程式 URL（dev: `http://localhost:3001`） |

---

## 才數換算說明

```
1 才 = 30.3cm × 30.3cm = 918.09 cm²（台尺制）
可在 src/lib/config/units.ts 的 CAI_CM2 調整
```

---

## 已知陷阱

### Prisma Decimal → JSON 序列化會變字串

**問題**：Prisma 的 `Decimal` 欄位（如 `Material.price`、`Material.wasteRate`）透過 `NextResponse.json()` 回傳時，會被序列化為**字串**（`"299.00"`），而非 JavaScript `number`。

**症狀**：儲存估價時顯示「儲存失敗」，Server log 出現：

```json
[saveCabinetEstimate] 驗證失敗: {
  "fieldErrors": { "units": ["Expected number, received string"] }
}
```

**根本原因**：`MaterialDropdown` 從 `/api/materials` 取得的 `price` 是字串，存進 `MaterialRef.pricePerUnit`，但 Zod schema 要求 `z.number()`。

**修法**（已修復於 `src/app/api/materials/route.ts`）：

```typescript
// API 回傳前強制轉型
const result = materials.map((m) => ({
  ...m,
  price: Number(m.price),
  wasteRate: Number(m.wasteRate),
}));
return NextResponse.json(result);
```

**通則**：任何 API route 若回傳含 Prisma `Decimal` 欄位的物件，都必須先 `Number()` 轉型再 `NextResponse.json()`。

---

### Server Action 的 Client 端呼叫須加 try-catch

**問題**：若 Server Action 拋出例外（DB 連線中斷、`redirect()` 等），沒有 try-catch 的 client 端呼叫會造成 unhandled rejection，save 按鈕永遠卡在「儲存中…」。

**修法**：

```typescript
const handleSave = async () => {
  setSaving(true);
  try {
    const result = await saveSomeAction(data);
    setSaveMsg(result.success ? "已儲存！" : "儲存失敗");
  } catch (err) {
    console.error(err);
    setSaveMsg("儲存失敗，請稍後再試");
  } finally {
    setSaving(false);
  }
};
```
