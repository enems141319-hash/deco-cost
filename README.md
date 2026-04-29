# DecoCost — 室內裝潢材料成本估價

室內裝潢系統櫃、天花板等項目的成本估價 SaaS，基於 Next.js 15 App Router 開發。

---

## 環境需求

- Node.js 18 以上
- npm 9 以上
- PostgreSQL 資料庫（本專案使用 [Neon](https://neon.tech) serverless）

---

## 快速啟動

### 1. 安裝套件

```bash
npm install
```

### 2. 設定環境變數

在專案根目錄建立 `.env` 檔案（參考 `.env.example`）：

```env
DATABASE_URL="postgresql://..."
AUTH_SECRET="your-secret-key"
AUTH_URL="http://localhost:3000"
```

- `DATABASE_URL`：Neon 或其他 PostgreSQL 連線字串
- `AUTH_SECRET`：JWT 簽名金鑰，可用 `openssl rand -base64 32` 產生
- `AUTH_URL`：開發環境填 `http://localhost:3000`

### 3. 初始化資料庫

```bash
# 同步 Prisma schema 到資料庫（建立所有資料表）
npm run db:push

# 植入初始材料資料（28 筆板材、五金、滑軌等）
npm run db:seed
```

### 4. 啟動開發伺服器

```bash
npm run dev
```

打開瀏覽器前往 [http://localhost:3000](http://localhost:3000)

### 5. 登入測試

Demo 帳號：`demo@decoest.com` / `password123`

> Demo 帳號由 `prisma/seed.ts` 植入，密碼已 bcrypt hash。

---

## 常用指令

```bash
npm run dev          # 啟動開發伺服器 (http://localhost:3000)
npm run build        # 生產構建（含 TypeScript 型別檢查）
npm run typecheck    # 僅執行型別檢查，不構建
npm run db:push      # 同步 Prisma schema 到資料庫
npm run db:seed      # 植入種子資料（材料 + demo 帳號）
npm run db:studio    # 開啟 Prisma Studio GUI（瀏覽 DB 內容）
```

---

## 技術棧

| 層 | 技術 |
|---|---|
| 框架 | Next.js 15 App Router |
| 語言 | TypeScript（strict mode） |
| 樣式 | Tailwind CSS + shadcn/ui |
| 表單驗證 | React Hook Form + Zod |
| ORM | Prisma 5 |
| 資料庫 | PostgreSQL（Neon serverless） |
| 認證 | NextAuth v5（Credentials + JWT） |

---

## 專案結構

```
src/
├── app/
│   ├── (auth)/              # 登入 / 註冊頁
│   ├── (dashboard)/         # 主應用（middleware 保護）
│   │   ├── dashboard/       # 總覽
│   │   ├── projects/        # 專案管理 + 估價
│   │   │   └── [id]/
│   │   │       ├── cabinet/ # 系統櫃估價
│   │   │       └── ceiling/ # 天花板估價
│   │   └── materials/       # 材料管理
│   └── api/                 # REST API
├── components/
│   ├── ui/                  # shadcn/ui 基礎元件
│   ├── cabinet/             # 系統櫃元件
│   ├── ceiling/             # 天花板元件
│   └── shared/              # 跨模組元件（MaterialDropdown 等）
├── lib/
│   ├── calculations/        # 計算引擎（純函式）
│   ├── actions/             # Server Actions
│   ├── config/units.ts      # 計算常數
│   └── validations/         # Zod schemas
└── types/                   # TypeScript 型別
```

---

## Debug 紀錄

### 問題：選了材料後點「儲存估價」一直顯示「儲存失敗」

**發現日期**：2026-04-26

**症狀**
- 儲存估價按鈕回應「儲存失敗，請稍後再試」
- HTTP 回應是 200，表示 Server Action 有執行到，但回傳 `{ success: false }`

**診斷步驟**

1. 確認 HTTP 狀態正常（200），排除網路與認證問題
2. 在 Server Action `saveCabinetEstimate` 加入 `console.error` 印出 Zod 驗證錯誤：

```typescript
const parsed = cabinetProjectInputSchema.safeParse(rawData);
if (!parsed.success) {
  console.error("[saveCabinetEstimate] 驗證失敗:", JSON.stringify(parsed.error.flatten(), null, 2));
  return { success: false, errors: parsed.error.flatten() };
}
```

3. 再次觸發儲存，Server log 出現：

```json
[saveCabinetEstimate] 驗證失敗: {
  "fieldErrors": {
    "units": ["Expected number, received string", "Expected number, received string"]
  }
}
```

4. 追蹤 `units` 內哪個欄位是字串 → 鎖定 `MaterialRef.pricePerUnit`
5. 找到 `MaterialDropdown.tsx` 中 `pricePerUnit: found.price`，`found` 來自 `/api/materials` 的回應
6. 查看 `/api/materials/route.ts`：直接回傳 Prisma 查詢結果，而 Prisma 的 `Decimal` 欄位（`price`）透過 `NextResponse.json()` 序列化後是**字串**，非 `number`

**根本原因**

Prisma 的 `Decimal` 型別不是原生 JavaScript `number`，JSON 序列化時會輸出字串（如 `"299.00"`）。`MaterialDropdown` 直接把這個字串存進 `MaterialRef.pricePerUnit`，但 Zod schema 要求 `z.number().nonnegative()`，因此只要使用者選擇任何材料，儲存必然失敗。

**修法**

在 `src/app/api/materials/route.ts` 回傳前強制轉型：

```typescript
const result = materials.map((m) => ({
  ...m,
  price: Number(m.price),
  wasteRate: Number(m.wasteRate),
}));
return NextResponse.json(result);
```

**通則**：所有含 Prisma `Decimal` 欄位的 API route，回傳前必須先 `Number()` 轉型。

---

### 問題：Server Action 拋出例外時，儲存按鈕卡死在「儲存中…」

**症狀**
- 按下儲存後按鈕永久 disabled，UI 無法恢復

**根本原因**

Client Component 呼叫 Server Action 時沒有 try-catch：

```typescript
// 有問題的寫法
const result = await saveCabinetEstimate({ projectId, units });
setSaving(false); // 若上面拋出例外，這行不會執行
```

Server Action 拋出例外（DB 連線中斷、`redirect()` 等），`setSaving(false)` 永遠不會執行。

**修法**（已修復於 `src/components/cabinet/CabinetUnitList.tsx`）

```typescript
const handleSave = async () => {
  setSaving(true);
  try {
    const result = await saveCabinetEstimate({ projectId, units });
    setSaveMsg(result.success ? "已儲存！" : "儲存失敗，請稍後再試");
    if (result.success) setTimeout(() => setSaveMsg(null), 3000);
  } catch (err) {
    console.error("[handleSave] 例外：", err);
    setSaveMsg("儲存失敗，請稍後再試");
  } finally {
    setSaving(false);
  }
};
```

**通則**：所有呼叫 Server Action 的 async 事件處理器都必須包 try-catch，並在 `finally` 中重設 loading 狀態。
