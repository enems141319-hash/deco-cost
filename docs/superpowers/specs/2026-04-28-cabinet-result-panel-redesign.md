# Cabinet Result Panel Redesign

**Date:** 2026-04-28  
**Scope:** Right-side instant results panel on the cabinet estimation page

---

## Goal

Reorganize the cabinet unit result display so each category (門片, 抽屜, 內部構件) shows only what belongs to it, and make each section easier to read with a bold subtotal row.

---

## New Section Layout

| Order | Section | Contents |
|-------|---------|----------|
| 1 | 桶身板件 | `result.panels` — unchanged |
| 2 | 門片 | Door board rows + door hardware as indented sub-rows per door + bold subtotal |
| 3 | 抽屜 | Drawer panel board table + drawer rails hardware table + bold subtotal (hidden when no drawers) |
| 4 | 內部構件 | Middle dividers + shelves + their processing only + bold subtotal (hidden when empty) |
| 5 | 五金/另料 | Extra hardware items only (hidden when empty) |
| 6 | 配件 | Kick plates — unchanged |

---

## Type Changes — `src/types/cabinet.ts`

### `PanelResult` — add optional field
```typescript
group?: "internal" | "drawer_panel";
```
- `"internal"` → 中隔板, 層板
- `"drawer_panel"` → 抽屜面板/側板/前後牆板/底板

### `HardwareResult` — add optional fields
```typescript
group?: "door" | "drawer" | "extra";
parentDoorId?: string;  // set for group === "door" items only
```
- `"door"` → 鉸鏈, 推拉門五金, 鐵網, 鐵網烤漆, 鋁製把手, 造型把手加工
- `"drawer"` → 抽屜滑軌
- `"extra"` → extra hardware from `hardwareItems`

### `CabinetUnitSummary` — add four new fields
```typescript
bodyBoardOnlyCost: number;   // body panels (excl. back) + internalParts(internal) + accessories
doorTotalCost: number;       // door panels + all door hardware
drawerCost: number;          // drawer panels + drawer rails
extraHardwareCost: number;   // extra hardware items only
```
Existing fields (`boardBodyCost`, `boardDoorCost`, `hardwareCost`, `totalCost`) are **not changed** — new fields are additive only.

---

## Calculation Engine Changes — `src/lib/calculations/cabinet.ts`

### `generateInternalParts()`
Set `group` on all PanelResult objects built here:
- Middle dividers → `group: "internal"`
- Shelves → `group: "internal"`
- All drawer panel parts (front-panel, side-panels, front-back-panels, bottom-panel) → `group: "drawer_panel"`

### `calculateDoors()`
Set on all hardware items pushed inside the door loop:
- `group: "door"`
- `parentDoorId: door.id`

Items affected: 鉸鏈, 推拉門五金, 鐵網, 鐵網烤漆, 鋁製把手, 造型把手加工, 造型把手長度修改.

### `calculateDrawerHardware()`
Set on each result item:
- `group: "drawer"`

### `calculateExtraHardware()`
Set on each result item:
- `group: "extra"`

### `buildSummary()`
Compute four new summary fields from the tagged arrays:

```typescript
const drawerPanelsCost = internalParts
  .filter(p => p.group === "drawer_panel")
  .reduce((acc, p) => acc + p.subtotal, 0);

const internalOnlyCost = internalParts
  .filter(p => p.group === "internal")
  .reduce((acc, p) => acc + p.subtotal, 0);

const doorHardwareCost = hardware
  .filter(h => h.group === "door")
  .reduce((acc, h) => acc + h.subtotal, 0);

const drawerHardwareCost = hardware
  .filter(h => h.group === "drawer")
  .reduce((acc, h) => acc + h.subtotal, 0);

const extraHardwareCost = hardware
  .filter(h => h.group === "extra")
  .reduce((acc, h) => acc + h.subtotal, 0);

const bodyBoardOnlyCost = panels
  .filter(p => p.name !== "背板")
  .reduce((acc, p) => acc + p.subtotal, 0)
  + internalOnlyCost
  + accessoriesCost;

const doorTotalCost = doorsCost + doorHardwareCost;
const drawerCost = drawerPanelsCost + drawerHardwareCost;
```

`totalCost` is unchanged — the new fields are a different breakdown of the same total.

---

## Display Changes — `src/components/cabinet/CabinetResultPanel.tsx`

### 門片 section
Extend `BoardTable` (or create a variant) to accept an optional `hardwareByDoorId` map. For each door row rendered, immediately after the row append indented sub-rows for door hardware items where `parentDoorId === door.id`. Sub-row columns: 名稱 / — / 數量 / — / 單價 / 材料 / 小計 (matching hardware table column pattern).

Add a `<tfoot>` bold row at the end of the table:
```
門片合計 | | | | | | NT$XX,XXX
```
Value = `summary.doorTotalCost`.

### 抽屜 section (hidden when no drawer panels)
1. `BoardTable` for `result.internalParts.filter(p => p.group === "drawer_panel")`
2. Small hardware table for `result.hardware.filter(h => h.group === "drawer")` — columns: 名稱 / 數量 / 單價 / 材料 / 小計
3. Bold subtotal row: `抽屜合計 NT$XX,XXX` — value = `summary.drawerCost`

### 內部構件 section (hidden when empty)
`BoardTable` for `result.internalParts.filter(p => p.group === "internal")`.
Bold subtotal row: `內部構件合計 NT$XX,XXX`.

### 五金/另料 section
Filter: `result.hardware.filter(h => h.group === "extra")` — layout unchanged.

### Bottom cost breakdown
Replace with:
```
桶身板材   summary.bodyBoardOnlyCost
背板       summary.boardBackingCost        (show if > 0)
門片       summary.doorTotalCost           (show if > 0)
抽屜       summary.drawerCost              (show if > 0)
五金       summary.extraHardwareCost       (show if > 0)
加工費     summary.addonsCost              (show if > 0)
───────────────────────────────────────────
總計       summary.totalCost
```

---

## Files Changed

| File | Change type |
|------|-------------|
| `src/types/cabinet.ts` | Add fields to `PanelResult`, `HardwareResult`, `CabinetUnitSummary` |
| `src/lib/calculations/cabinet.ts` | Set group tags; compute new summary fields |
| `src/components/cabinet/CabinetResultPanel.tsx` | Reorganize sections; door hardware sub-rows; bold subtotals; new cost breakdown |

No changes to: `MaterialSummaryPanel.tsx`, routes, server actions, DB schema, or other calculation files.

---

## Backwards Compatibility

`group` and `parentDoorId` are optional fields. DB-cached `resultData` from before this change won't have these tags — those rows will be filtered out of the new sections and appear in no category. Since `resultData` is documented as a re-calculable cache, this is acceptable: re-saving the estimate will regenerate the result with correct tags.

---

## Verification

After implementing, run:
```bash
npx tsx src/lib/calculations/cabinet.redesign.test.ts
npm run typecheck
```
