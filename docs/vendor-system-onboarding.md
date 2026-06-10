# 廠商系統引進與計算架構整理

本文件整理 DecoCost 目前的資料流、計算邏輯與擴充方式，目標是讓未來引進其他系統櫃廠商或不同計價方式時，可以快速建立新的模組，而不是把規則硬塞進現有 UI。

## 目前系統定位

DecoCost 以「專案」為最上層，一個專案可以包含多筆估價項目。每筆估價項目代表一種模組或一張報價，例如系統櫃估價、天花板估價。系統目前主要支援：

- `CABINET`：系統櫃估價
- `CEILING`：天花板估價
- `FLOOR`、`PAINT`：Schema 已預留，尚未實作

核心原則：

- UI 只負責收集輸入與展示結果。
- 所有計算集中在 `src/lib/calculations/`。
- 所有固定規則、單位換算、加工單價集中在 `src/lib/config/units.ts`。
- 型別集中在 `src/types/`。
- 儲存時同時保存「原始輸入」與「計算結果」，方便日後重算、比對與 PDF 匯出。

## 資料模型

主要資料表在 `prisma/schema.prisma`：

```text
User
  -> EstimateProject
      -> EstimateItem

Material
```

### EstimateProject

專案資料，包含案名、地址、業主、設計師、電話、Line ID 等。

用途：

- 作為多筆估價的父層。
- 專案頁統計所有估價項目的總金額。
- 專案 PDF 的上方基本資料來源。

### EstimateItem

單筆估價。重要欄位：

- `projectId`：所屬專案
- `moduleType`：模組類型，例如 `CABINET`
- `label`：估價名稱，例如「客廳」、「主臥」
- `inputData`：使用者輸入 JSON
- `resultData`：計算結果 JSON
- `totalCost`：該估價總金額
- `sortOrder`：專案內排序

目前系統櫃的 `inputData` 是 `CabinetUnitInput[]`，也就是一張系統櫃估價可以有多個桶身。

### Material

材料與五金資料庫。重要欄位：

- `category`：材料分類，例如板材、背板、門片、鉸鏈、滑軌
- `brand`：品牌
- `colorCode`：色號
- `surfaceTreatment`：表面處理
- `boardType`：板材類型
- `name`、`spec`：名稱與規格
- `unit`：計價單位
- `price`：單價
- `minCai`：最低計價才數
- `wasteRate`：損耗率，欄位已存在但目前計算尚未全面套用
- `isActive`：是否可被選用

注意：Prisma `Decimal` 回傳 API 前要轉成 `Number()`，否則前端 Zod `z.number()` 會驗證失敗。

## 系統櫃資料收集方式

系統櫃 UI 主要在：

- `src/components/cabinet/CabinetUnitList.tsx`
- `src/components/cabinet/CabinetUnitForm.tsx`
- `src/components/cabinet/DoorForm.tsx`
- `src/components/cabinet/DrawerForm.tsx`
- `src/components/cabinet/InternalPartsForm.tsx`
- `src/components/shared/MaterialDropdown.tsx`

目前一張系統櫃估價的資料結構是：

```text
Cabinet estimate
  label: 估價名稱
  units: CabinetUnitInput[]

CabinetUnitInput
  基本尺寸：widthCm, depthCm, heightCm, quantity
  桶身材料：topPanelMaterialRef, sidePanelMaterialRef, bottomPanelMaterialRef
  背板材料：backPanelMaterialRef
  桶身加工：addons / bodyPanelProcesses
  內部構件：middleDividers, shelves, sideTopBottomSealPanels
  抽屜：drawers
  門片：doors
  五金另料：hardwareItems
  踢腳板：kickPlate
```

材料選擇不是直接存完整 `Material`，而是存 `MaterialRef`：

```typescript
interface MaterialRef {
  materialId: string;
  materialName: string;
  unit: string;
  pricePerUnit: number;
  minCai: number | null;
}
```

這樣的好處是：舊估價不會因材料庫日後改價而自動變動。若要重新套用新價格，應另外設計「重抓材料價格 / 重算」流程。

## 系統櫃計算方式

系統櫃計算入口：

- `calculateCabinetUnit(input)`：計算單一桶身
- `calculateCabinetProject(units)`：彙總整張系統櫃估價

位置：

- `src/lib/calculations/cabinet.ts`

### 計算輸出

`calculateCabinetUnit()` 會輸出 `CabinetUnitResult`，主要包含：

- `panels`：板材結果列
- `doors`：門片結果列
- `hardware`：五金結果列
- `accessories`：其他配件或加工相關結果
- `summary`：板材、五金、加工、總價等摘要

板材結果通常包含：

- 板名
- 寬高
- 數量
- 實際才數
- 計價才數
- 材料單價
- 加工費
- 小計
- `processes`：依附在該板材下方的加工列

### 才數與最低才數

目前才數換算在 `src/lib/config/units.ts`：

```typescript
CAI_CM2: 918.09
```

計算原則：

```text
實際才數 = widthCm * heightCm / 918.09
單片計價才數 = max(實際才數, materialRef.minCai)
總計價才數 = 單片計價才數 * quantity
材料費 = 總計價才數 * pricePerUnit
```

### 加工費

加工費規則都應放在 `src/lib/config/units.ts`，由 `cabinet.ts` 讀取。

目前常見加工包含：

- 封邊
- 背板溝槽
- 燈溝
- 滑門軌道溝
- L 轉櫃加工
- 側封折彎
- 門片把手加工
- 抽屜 KD、溝槽、抽頭造型
- 特殊加工，如圓角、切角、外型、內挖

原則：

- 依附於板材的加工放在 `PanelResult.processes`。
- 門片加工應跟在該門片材料列下方。
- 不要把加工混在 UI 中即時計算。

## 材料統整方式

材料統整入口：

- `src/lib/calculations/material-summary.ts`

共用表格 UI：

- `src/components/shared/MaterialSummaryTables.tsx`

用途：

- 將 `CabinetProjectResult` 或 `CabinetUnitResult` 轉為統一的材料明細列。
- 依材料彙總同板材才數。
- 彙總五金。
- 彙總加工費。
- 提供單張估價與整個專案共用的統整邏輯。

材料統整的 row 型別：

```typescript
type MaterialSummaryRowKind = "material" | "process" | "hardware" | "accessory";
```

原則：

- 材料列顯示材料名稱、尺寸、數量、才數、單價、小計。
- 加工列要跟在來源材料下方。
- 五金列進五金總表。
- 專案材料統整會多一層「估價名稱」，避免不同估價的編號重複。

## 儲存流程

系統櫃儲存流程在 `src/lib/actions/estimates.ts`：

```text
Client Component
  -> saveCabinetEstimate / updateCabinetEstimate
      -> 驗證 session
      -> 驗證 project ownership
      -> Zod 驗證 input
      -> calculateCabinetProject()
      -> 寫入 EstimateItem.inputData
      -> 寫入 EstimateItem.resultData
      -> 寫入 EstimateItem.totalCost
      -> revalidatePath()
```

天花板流程相同，只是計算入口是 `calculateCeilingMaterial()`。

Client 端呼叫 Server Action 時必須 `try/catch/finally`，避免儲存失敗後 loading 狀態卡住。

## PDF 與顯示

目前 PDF 匯出是以畫面資料產生 print document，不是後端產 PDF。

相關位置：

- 單桶 PDF：`src/components/cabinet/CabinetUnitForm.tsx`
- 單張系統櫃材料統整 PDF：`src/components/cabinet/MaterialSummaryPanel.tsx`
- 專案 PDF：`src/components/projects/ProjectCostBreakdown.tsx`

原則：

- PDF 顯示不應重新計算，應使用已經算好的 result / summary。
- PDF 樣式可以在各 component 內維護 print CSS，但資料來源要和畫面一致。
- 若新增廠商模組，需同時規劃「畫面表格」與「PDF print view」。

## 引進新廠商時的建議架構

不建議為每個廠商建立一個完全獨立網站。建議在同一系統內新增「廠商計價模組」或「廠商規則 profile」。

原因：

- 專案、客戶、材料庫、PDF、登入權限可共用。
- 不同廠商只差在輸入欄位、計價規則與材料分類。
- 同一專案可同時放 A 廠商與 B 廠商報價，方便比較。

## 新增廠商模組的標準步驟

假設要新增一個新廠商 `VENDOR_X`。

### 1. 定義業務邊界

先收集：

- 報價表欄位
- 材料分類
- 計價單位
- 尺寸單位
- 最低計價規則
- 損耗規則
- 加工費規則
- 五金是否另計
- 是否有固定套餐或級距價
- PDF / 報價表格式

不要先寫 UI，先把規則整理成可以被純函式計算的資料。

### 2. 決定資料模型

如果只是系統櫃但計價不同，優先考慮：

```text
ModuleType: CABINET
inputData 裡增加 vendor / pricingProfile
```

如果輸入結構差異很大，考慮新增：

```text
ModuleType: VENDOR_X_CABINET
```

目前 Prisma enum 需要修改後執行：

```bash
npm run db:push
```

### 3. 新增型別

新增或擴充：

- `src/types/vendor-x.ts`
- 或在 `src/types/cabinet.ts` 增加 vendor profile 相關型別

輸入型別要描述使用者填什麼，結果型別要描述計算輸出什麼。

### 4. 新增計算常數

在 `src/lib/config/units.ts` 增加廠商規則，例如：

```typescript
export const VENDOR_X_CONFIG = {
  CAI_CM2: 918.09,
  MIN_BOARD_CAI: 1,
  EDGE_BANDING_COST_PER_CM: 5,
} as const;
```

不要把單價或級距寫在 component 裡。

### 5. 新增計算引擎

新增：

```text
src/lib/calculations/vendor-x.ts
```

建議輸出仍轉成共用概念：

```text
materials
processes
hardware
summary
```

就算新廠商內部算法不同，也應在輸出層轉成可統整的列，這樣 PDF 和專案總表才能共用。

### 6. 新增驗證 schema

新增：

```text
src/lib/validations/vendor-x.ts
```

Server Action 儲存前一定要 Zod 驗證。

### 7. 新增 UI

新增：

```text
src/components/vendor-x/
src/app/(dashboard)/projects/[id]/vendor-x/
```

UI 只做：

- 表單輸入
- 材料選擇
- 呼叫計算純函式做即時預覽
- 呼叫 Server Action 儲存

### 8. 新增 Server Action

在 `src/lib/actions/estimates.ts` 新增：

```text
saveVendorXEstimate()
updateVendorXEstimate()
```

必做：

- `auth()`
- `requireCurrentUserId()`
- project ownership 驗證
- Zod 驗證
- 呼叫計算引擎
- 寫入 inputData / resultData / totalCost

### 9. 接上專案頁

專案詳細頁需要：

- 新增「新增 X 廠商估價」按鈕
- `MODULE_LABELS` 加上 label
- `modulePath()` 加上 route
- 專案總計納入該 item
- 專案 PDF / 材料統整決定是否支援該模組

### 10. 新增測試

至少新增：

- 計算引擎測試
- 材料統整測試
- 型別檢查

建議指令：

```bash
npx tsx src/lib/calculations/vendor-x.test.ts
npm run typecheck
```

## 廠商資料收集表建議

引進廠商前，建議用以下格式收集。

### 基本資料

```text
廠商名稱：
報價表版本：
幣別：
尺寸單位：
面積單位：
是否含稅：
報價有效日期：
```

### 材料分類

```text
分類：
品牌：
色號：
板厚：
表面：
規格：
計價單位：
單價：
最低計價：
是否可選：
備註：
```

### 板材規則

```text
板材才數換算：
寬高是否扣板厚：
背板尺寸扣法：
頂底板尺寸扣法：
側板尺寸扣法：
是否有最低才數：
是否同材料合併計最低才數：
損耗率：
```

### 門片規則

```text
門片類型：
門片材料：
鉸鏈計算方式：
滑門五金計算方式：
把手計價方式：
玻璃 / 鐵網 / 格柵是否獨立材料：
加工是否跟門片列在一起：
```

### 抽屜規則

```text
抽牆板尺寸：
抽底板尺寸：
滑軌長度：
滑軌是否另計：
抽頭是否另計：
溝槽加工：
KD 加工：
```

### 加工規則

```text
加工名稱：
觸發條件：
計價單位：
單價：
級距：
是否依板材數量倍增：
是否列入材料明細：
顯示位置：
```

### 輸出格式

```text
報價表欄位：
材料統整欄位：
PDF 樣式：
是否需要廠商原始格式匯出：
是否需要專案總表合併：
```

## 判斷新增廠商時該怎麼做

### 情境 A：只是價格不同

做法：

- 保留現有 `CABINET` input 結構。
- 新增材料價格或 vendor profile。
- 計算引擎加一個 pricing profile 參數。

### 情境 B：材料分類不同，但尺寸算法相近

做法：

- 擴充 Material category 或增加 vendor-specific material mapping。
- 共用大部分 `calculateCabinetUnit()`。
- 把差異規則抽成 profile。

### 情境 C：尺寸拆板與加工規則都不同

做法：

- 新增獨立計算引擎，例如 `vendor-x.ts`。
- 輸入 UI 可以獨立。
- 輸出結果轉成共用 summary row 格式。

### 情境 D：對方只提供 Excel 報價表

做法：

- 先不要直接混進現有 `CabinetUnitInput`。
- 建立 import parser，把 Excel row 轉成中介格式。
- 中介格式再轉成本系統可顯示的 material / hardware / process / summary。
- 原始 Excel 欄位可存進 `inputData.rawRows` 供追溯。

## 建議的中介輸出格式

為了讓不同廠商可以共用專案總表與 PDF，建議所有廠商計算結果最後都能轉成：

```typescript
interface StandardEstimateResult {
  sections: Array<{
    id: string;
    name: string;
    rows: Array<{
      id: string;
      kind: "material" | "process" | "hardware" | "accessory";
      itemName: string;
      materialName?: string;
      size?: string;
      quantity?: number;
      unit?: string;
      unitPrice?: number;
      subtotal?: number;
      note?: string;
    }>;
    subtotal: number;
  }>;
  materialTotals: Array<{
    materialId?: string;
    materialName: string;
    quantity: number;
    unit: string;
  }>;
  totalCost: number;
}
```

目前系統尚未正式抽出這個共用介面，但未來新增多廠商時，建議朝這個方向整理。

## 開發注意事項

- 不要在 UI component 內寫計算邏輯。
- 不要在計算引擎內寫死散落常數，集中放 `units.ts`。
- 不要使用 `any`。
- 新增 DB schema 後要執行 `npm run db:push`。
- 新增 API 回傳 Prisma Decimal 前要轉 Number。
- Client 呼叫 Server Action 要 `try/catch/finally`。
- 新模組要能容忍舊 `resultData` 缺少新欄位。
- 新廠商若要進專案材料統整，必須提供可被統整的 row 結構。

## 最小落地路線

若下一次要快速接一個新廠商，建議照這個順序：

1. 收集廠商報價表與規則。
2. 寫一份 `docs/vendor-x-rules.md`。
3. 建立 `src/types/vendor-x.ts`。
4. 建立 `src/lib/config/vendor-x.ts` 或在 `units.ts` 增加區塊。
5. 建立 `src/lib/calculations/vendor-x.ts`。
6. 先用測試資料跑純函式，不做 UI。
7. 確認 total 與廠商報價表一致。
8. 建立輸入 UI。
9. 建立 Server Action 儲存。
10. 接入專案頁、PDF、材料統整。

這樣可以避免一開始就被 UI 綁住，也能讓不同廠商規則並存。
