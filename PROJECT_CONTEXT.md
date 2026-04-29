# DecoCost Estimation Redesign Context

建立日期：2026-04-27

## 來源

此資料夾是從 `C:\Users\PCUSER\Desktop\MATERIELS` 複製出的改版工作副本。

未複製內容：
- `.env`
- `.git`
- `.next`
- `node_modules`
- `dev.log`
- 大型素材檔與表格檔

## 現有運行邏輯摘要

DecoCost 是 Next.js 15 App Router SaaS，使用 TypeScript strict、Prisma 5、PostgreSQL、NextAuth v5、Tailwind 與手工 shadcn/ui 元件。

主要資料流：
- `src/middleware.ts` 使用 Edge-compatible `src/lib/auth.config.ts` 保護 dashboard route。
- `src/lib/auth.ts` 才載入 Credentials provider、Prisma adapter 與 `bcryptjs`。
- 使用者登入後建立 `EstimateProject`。
- 專案下建立 `EstimateItem`，用 `moduleType` 區分 `CABINET` / `CEILING`。
- `EstimateItem.inputData` 儲存原始輸入 JSON。
- `EstimateItem.resultData` 儲存計算結果快照。
- 系統櫃計算入口是 `calculateCabinetProject()` / `calculateCabinetUnit()`。
- 天花板計算入口是 `calculateCeilingMaterial()`。
- Client 端材料選擇透過 `/api/materials` 取得材料，API 必須把 Prisma `Decimal` 轉成 number。

目前系統櫃狀態：
- `MaterialCategory` 仍是舊分類：`BOARD`、`BACKING`、`HARDWARE`、`RAIL`、`TRIM` 等。
- `Material` 仍是簡化欄位：`category`、`name`、`spec`、`unit`、`price`、`wasteRate`。
- `MaterialRef` 尚未包含 `minCai`。
- `PanelResult` / `DoorResult` 尚未包含 `billableTotalArea` 或 `addonsCost`。
- 系統櫃計算使用實際才數直接乘單價，尚未套用每片最低才數。
- 系統櫃 UI 尚未提供桶身 add-on 或門片 add-on。
- 材料管理頁仍是 modal CRUD，尚未改成三欄式品牌 / 品項 / 表單。

## 改版規格來源

主要規格：
- `docs/superpowers/specs/2026-04-27-estimation-redesign.md`

已有實作計畫：
- `docs/superpowers/plans/2026-04-27-estimation-redesign.md`

改版範圍：
- 只改系統櫃 `CABINET`。
- 天花板 `CEILING` 不在本次範圍內。
- 不實作 CSV 批次匯入。
- 不實作牌價表 PDF 自動讀取。

## 實作重點

1. Prisma schema 重建材料模型：
   - `BOARD_BODY`
   - `BOARD_BACKING`
   - `BOARD_DOOR`
   - `HARDWARE_HINGE`
   - `HARDWARE_HANDLE`
   - `HARDWARE_RAIL`
   - `HARDWARE_OTHER`
   - `CEILING_BOARD`
   - `ANGLE_MATERIAL`
   - `OTHER`

2. `Material` 新增：
   - `brand`
   - `colorCode`
   - `surfaceTreatment`
   - `boardType`
   - `minCai`

3. `src/lib/config/units.ts` 集中新增：
   - `BOARD_TYPES`
   - `ADDON_PRICES`

4. 系統櫃計算必須加入：
   - 每片板件 `billableCai = max(actualCai, minCai ?? 0)`
   - 桶身 add-on：前緣封 ABS、雙面排孔、非規格孔位
   - 門片 add-on：對花、強化玻璃、鉸鏈孔
   - `addonsCost`
   - `boardBodyCost` / `boardBackingCost` / `boardDoorCost`

5. UI 改版：
   - 材料管理頁三欄式重建。
   - `/projects/[id]/cabinet` 增加板材統整面板。
   - `CabinetUnitForm` 增加桶身加工選項。
   - `DoorForm` 增加門片加工選項。

## 必須遵守

- 計算邏輯放在 `src/lib/calculations/`，不要寫在 UI 元件內。
- 計算常數放在 `src/lib/config/units.ts`，不要在計算引擎內寫死。
- 不使用 `any`。
- `src/middleware.ts` 不可引入 `src/lib/auth.ts`。
- 修改 `prisma/schema.prisma` 後必須執行 `npm run db:push`。
- API 回傳 Prisma `Decimal` 前必須 `Number()`。
- Client Component 呼叫 Server Action 必須 try/catch/finally。

## 建議開始方式

依照 `docs/superpowers/plans/2026-04-27-estimation-redesign.md` 逐 task 實作。

建議先從：
1. `prisma/schema.prisma`
2. `src/lib/config/units.ts`
3. `src/types/cabinet.ts`
4. `src/lib/calculations/cabinet.ts`

完成 schema 修改後，在此資料夾內執行：

```bash
npm install
npm run db:push
npm run typecheck
```

