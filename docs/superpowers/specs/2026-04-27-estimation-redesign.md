# DecoCost 估價流程重設計

**日期**：2026-04-27  
**狀態**：已核准，待實作  
**範疇**：系統櫃（cabinet）模組，不含天花板

---

## 背景

現有材料資料（28筆）結構過於簡化，無法反映供應商牌價表（葳禾實業有限公司 114年牌價表）的實際資料結構。本次重設計涵蓋：

1. 材料資料模型重建（品牌 × 色號 × 板料類型）
2. 計算引擎加入 minCai 最低才數規則與 add-on 加購費用
3. 材料管理頁面 UI 完整重建
4. 專案層級統整才數顯示
5. 加工選項 UI（桶身層級 + 門片層級）

---

## 第一段：資料庫 Schema

### MaterialCategory enum（取代現有）

```prisma
enum MaterialCategory {
  BOARD_BODY      // 桶身板材：18mm/25mm 側板/頂板/底板/隔板/層板
  BOARD_BACKING   // 背板：8mm 背板
  BOARD_DOOR      // 門片：18mm 4E門板、框型門、H型門等
  HARDWARE_HINGE  // 鉸鏈（TITUS / blum）
  HARDWARE_HANDLE // 把手（鋁把手）
  HARDWARE_RAIL   // 滑軌（抽屜滑軌）
  HARDWARE_OTHER  // 其他五金（調整腳、吊掛器…）
  CEILING_BOARD   // 天花板板材（不動）
  ANGLE_MATERIAL  // 角材（不動）
  OTHER
}
```

### Material 模型（擴充現有）

```prisma
model Material {
  id               String           @id @default(cuid())
  category         MaterialCategory
  brand            String?          // "EGGER" / "SKIN" / "HORNG CHANG" / "TITUS" / "blum"
  colorCode        String?          // "H1145" / "K2479"（板料用）
  surfaceTreatment String?          // "ST10" / "AR" / "CB"（板料用）
  boardType        String?          // "8mm背板不封邊" / "18mm櫃體封PVC" 等固定字串常數
  name             String           // 顯示名稱（可自動組合：brand + colorCode + boardType）
  spec             String?          // 備註規格
  unit             String           // "才" / "個" / "組" / "M"
  price            Decimal          @db.Decimal(10, 2)
  minCai           Decimal?         @db.Decimal(6, 2)  // 基本才數（僅板料）
  wasteRate        Decimal          @default(0) @db.Decimal(5, 4)
  isActive         Boolean          @default(true)
  sortOrder        Int              @default(0)
  createdAt        DateTime         @default(now())
  updatedAt        DateTime         @updatedAt

  @@index([category])
  @@index([brand])
  @@index([isActive])
  @@map("materials")
}
```

### 設計決策

- `minCai`：計算引擎每片板件結算才數時，若 `actualCai < minCai`，以 `minCai` 計費
- `boardType` 用固定字串常數集中於 `src/lib/config/units.ts`，不另建 enum
- `wasteRate` 預設 0（牌價表已含加工費，不需再加損耗）
- 舊 `EstimateItem.inputData` 的 `materialRef` 結構只多 `minCai` 欄位，其餘不變

### boardType 固定常數（定義於 units.ts）

```typescript
export const BOARD_TYPES = [
  '8mm背板不封邊',
  '18mm櫃體封PVC',
  '18mm 4E門板封ABS',
  '18mm 4E H型 5mm清玻門',
  '18mm 4E框型 5mm清玻門',
  '18mm 4E框型肚板門',
  '18mm 4E框鐵網門',
  '25mm封ABS',
] as const
```

---

## 第二段：計算引擎更新

### 2-1 MaterialRef 型別

```typescript
interface MaterialRef {
  materialId: string
  materialName: string
  unit: string
  pricePerUnit: number
  minCai: number | null  // 新增
}
```

### 2-2 minCai 規則

每片板件計費才數：

```
billableCai = max(actualCai, minCai ?? 0)
```

`buildPanelResult` 保留 `actualArea`（顯示用）並新增 `billableArea`（計費用），小計改用 `billableArea` 計算。

### 2-3 Add-on 型別

```typescript
// 桶身層級（加入 CabinetUnitInput）
interface UnitAddons {
  frontEdgeABS: 'none' | 'one_long' | 'two_long'  // 前緣封ABS：+0/+5/+10 元/才
  doubleDrillHoles: boolean   // 中立板雙面排孔 +5元/才
  nonStandardHoles: boolean   // 非規格孔位 +5元/才（須 doubleDrillHoles=true）
}

// 門片層級（加入 DoorInput）
interface DoorAddons {
  patternMatch: 'none' | 'grain'  // 對花：×1.0 / ×1.2
  temperedGlass: boolean          // 強化玻璃 +50元/才
  hingeHoleDrilling: boolean      // 門板鉸鏈孔 +5元/孔（孔數由鉸鏈數決定）
}
```

> 大板對花（×2）本版不實作，預留欄位空間。

### 2-4 計算疊加順序

**BOARD_BODY（桶身板材）**：
```
才價 = (price + frontEdgeABS加價 + doubleDrillHoles加價 + nonStandardHoles加價)
小計 = billableCai × 才價
```

**BOARD_DOOR（門片）**：
```
才價 = price × patternMatch倍率 + temperedGlass加價
小計 = billableCai × 才價
鉸鏈孔費 = hingeHoleDrilling ? 鉸鏈孔數 × 5 : 0  （另計，不進才數）
```

**BOARD_BACKING（背板）**：無 add-on，直接 `billableCai × price`

### 2-5 結果結構新增

`CabinetUnitSummary` 加入：
- `addonsCost`：所有 add-on 費用小計
- `boardBodyCost` / `boardBackingCost` / `boardDoorCost`：分類板材費

---

## 第三段：材料管理頁面 UI

### 3-1 頁面結構（三欄）

```
[品牌側欄]       [品項列表]                          [編輯表單]
─────────────   ──────────────────────────────────   ─────────────────
板材             搜尋框          [+ 新增品項]          類別 dropdown
  EGGER          H1145 ST10 8mm背板    $90  1才  ●    品牌（autocomplete）
  SKIN           H1145 ST10 18mm櫃體  $120  1才  ●    色號
  HORNG CHANG    H1145 ST10 18mm門板  $135  1.5才 ●   表面處理
  CLEAF          ...                                  板料類型
  Longland                                            顯示名稱
  JANGMEI                                             單位
五金                                                  單價
  TITUS                                               基本才數（板料才顯示）
  blum                                                啟用狀態
  3M
其他
  (天花板等)
[+ 新增品牌]
```

### 3-2 品項列表欄位

每列：`色號 | 表面處理 | 板料類型 | 單價 | 基本才數 | 啟用toggle | 刪除`

### 3-3 CRUD 行為

| 操作 | 行為 |
|---|---|
| 新增 | Server Action，列表即時更新 |
| 編輯 | 點列 → 右側表單展開，失焦或按儲存觸發 Server Action |
| 刪除 | 確認 dialog；若有 EstimateItem 參照則改為停用，不刪除 DB 資料 |
| 批次停用 | 勾選多筆 → 停用 |
| 搜尋 | 前端過濾（色號/品名），不需 API 請求 |

---

## 第四段：專案統整才數顯示

### 4-1 位置

`/projects/[id]/cabinet` 頁面，桶身列表下方，儲存按鈕移至此區塊旁。

### 4-2 顯示格式

依 category 分組，每個 materialId 一列：

```
─── 板材統整 ──────────────────────────────────────────────────
桶身板材（BOARD_BODY）
  品項                                 實際才數  計費才數  基本才數/片
  EGGER H1145 ST10 18mm 櫃體封PVC       7.2才    7.2才    1才
  EGGER H3700 ST10 18mm 櫃體封PVC       3.1才    3.5才    1才  ⚠ 補足
  SKIN K2479 AR 18mm 櫃體封PVC          5.0才    5.0才    1才

背板（BOARD_BACKING）
  EGGER H1145 ST10 8mm 背板不封邊       2.8才    3.0才    1才

門片（BOARD_DOOR）
  EGGER H1145 ST10 18mm 4E門板封ABS     4.5才    6.0才    1.5才

───────────────────────────────────────────────────────────────
加工費小計：$1,250
板材費小計：$18,400
總計：$19,650                                    [儲存估價]
```

### 4-3 minCai 計算邏輯（重要）

minCai 是**每片板件**的最低才數，不是整個專案的最低。

```
對每個 unit × 每片板件：
  actualCai += panel.singleArea.cai × panel.quantity
  billableCai += max(panel.singleArea.cai, minCai ?? 0) × panel.quantity
```

### 4-4 邊界狀況

- 板件未選材料 → 不列入統整
- 計費才 > 實際才 → 淡色文字標示「已補足至基本才數」（⚠ 符號）
- 全部未選材料 → 顯示提示「請先為各板件選擇材料」

---

## 第五段：Add-on 加購選項 UI

### 5-1 桶身層級（CabinetUnitForm）

「板材選料」區塊下方新增「加工選項」小節：

```
加工選項
─────────────────────────────────────────────────────────
前緣封ABS      ○ 無  ○ 1長(+5元/才)  ● 2長(+10元/才)
中立板雙面排孔  □ (+5元/才)
  └ 非規格孔位  □ (+5元/才)   ← 僅 doubleDrillHoles=true 時可勾
```

### 5-2 門片層級（DoorForm）

每張門片展開後，材料欄位下方加選項列：

```
[鉸鏈門 90×240cm ×2]
  材料：EGGER H1145 ST10 18mm 4E門板封ABS
  □ 對花（直紋 ×1.2）
  □ 強化玻璃加價（+50元/才）
  □ 門板鉸鏈孔（+5元/孔，共 8 孔）← 孔數由鉸鏈數自動帶入
```

### 5-3 結果面板費用顯示

```
板材費         $12,400
  └ 前緣封ABS    +$620
  └ 雙面排孔     +$310
門片費          $3,600
  └ 對花加價     +$720
  └ 鉸鏈孔費     +$120
五金費          $1,840
────────────────────────
小計           $19,610
```

### 5-4 資料儲存

Add-on 選項存於 `EstimateItem.inputData` 的 `CabinetUnitInput.addons` 欄位，不需要額外 DB 欄位。

---

## 不在本次範疇

- 天花板模組（不動）
- 地板 / 油漆模組（預留 enum 不動）
- CSV 批次匯入（預留入口，不實作）
- 大板對花 ×2（預留型別，不實作）
- 牌價表 PDF 讀取自動化

---

## 影響範圍

| 檔案 | 異動類型 |
|---|---|
| `prisma/schema.prisma` | 修改 enum + 擴充 Material 模型 |
| `src/lib/config/units.ts` | 新增 BOARD_TYPES 常數 |
| `src/types/cabinet.ts` | MaterialRef + UnitAddons + DoorAddons |
| `src/lib/calculations/cabinet.ts` | minCai 規則 + add-on 計算 |
| `src/lib/validations/cabinet.ts` | Zod schema 更新 |
| `src/lib/actions/materials.ts` | CRUD Server Actions 重建 |
| `src/app/api/materials/route.ts` | 回傳新欄位 |
| `src/app/(dashboard)/materials/` | 頁面完整重建 |
| `src/components/cabinet/CabinetUnitForm.tsx` | 加工選項 UI |
| `src/components/cabinet/DoorForm.tsx` | 門片 add-on UI |
| `src/components/cabinet/CabinetResultPanel.tsx` | 費用分類顯示 |
| `src/components/cabinet/CabinetUnitList.tsx` | 統整才數區塊 |
| `prisma/seed.ts` | 替換為牌價表資料（主要品牌） |
