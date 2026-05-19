# DecoCost 本地啟動

以後要開本地環境，直接照這份做。

## 最快啟動

```bash
npm run dev -- -p 3001
```

開啟：

```text
http://localhost:3001
```

Demo 帳號：

```text
demo@decoest.com
password123
```

## Codex / Agent 啟動規則

1. 先讀 `agent.md`，確認 Dev URL 是 `http://localhost:3001`。
2. 直接啟動：

   ```powershell
   npm run dev -- -p 3001
   ```

3. 如果 `3001` 已經被占用，先確認是不是本專案的 Next dev server。
4. 如果頁面出現 Prisma `Can't reach database server`，不要反覆亂試：
   - 先重啟 `3001` 上的 dev server。
   - 再開 `http://localhost:3001/login`。
   - 如果 `/login` 是 200，繼續登入測試。

## 快速檢查

PowerShell：

```powershell
Get-NetTCPConnection -LocalPort 3001 -State Listen -ErrorAction SilentlyContinue
```

如果需要重啟 `3001`：

```powershell
$conn = Get-NetTCPConnection -LocalPort 3001 -State Listen -ErrorAction SilentlyContinue | Select-Object -First 1
if ($conn) { Stop-Process -Id $conn.OwningProcess -Force }
npm run dev -- -p 3001
```

## 注意

- `.env` 裡的 `DATABASE_URL` 使用 Neon PostgreSQL。
- 不要改 `src/middleware.ts` 來繞過登入。
- 不要為了啟動本地環境修改 Prisma schema。
- 只有修改 `prisma/schema.prisma` 後才需要跑：

  ```bash
  npm run db:push
  ```
