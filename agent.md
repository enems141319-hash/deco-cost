# DecoCost Redesign Agent Notes

This project is a commercial SaaS codebase, not a demo. Follow `AGENTS.md` and read `CLAUDE.md` before structural changes.

## Current Project

- App folder: `roots/deco-cost-estimation-redesign`
- Dev URL: `http://localhost:3001`
- Database: configured by `.env` with Neon PostgreSQL
- Price source: `prisma/data/牌價表.xlsx`

## Commands

```bash
npm run dev -- -p 3001
npm run typecheck
npm run build
npm run db:push
npm run db:seed
```

## Rules

- Keep calculation logic in `src/lib/calculations/`.
- Keep calculation constants in `src/lib/config/units.ts`.
- Do not use `any`.
- Do not bypass `src/middleware.ts`.
- Do not import `src/lib/auth.ts` from middleware.
- Convert Prisma `Decimal` values before JSON responses.
- Client calls to Server Actions need `try/catch/finally`.

## Redesign Notes

- System cabinet calculations are in `src/lib/calculations/cabinet.ts`.
- Cabinet material summary aggregation is in `src/lib/calculations/material-summary.ts`; do not calculate summary rows in UI components.
- Material selector is `src/components/shared/MaterialDropdown.tsx`.
- Cabinet live result is `src/components/cabinet/CabinetResultPanel.tsx`.
- Cabinet material summary panel is `src/components/cabinet/MaterialSummaryPanel.tsx`.
- Project-level cost breakdown is `src/components/projects/ProjectCostBreakdown.tsx`.
- Shared material summary tables are in `src/components/shared/MaterialSummaryTables.tsx`.
- Cabinet input now includes drawers and per-divider middle board processing options.
- Sliding door hardware should use `HARDWARE_OTHER` items under push-pull door hardware.
- Drawer rails should use `HARDWARE_RAIL`.

## Cabinet Calculation Rules

- Do not calculate cabinet dimensions in UI components. UI collects input only; calculations belong in `src/lib/calculations/cabinet.ts`.
- Fixed cabinet top/bottom panels must deduct the left and right side panel thickness from total cabinet width.
  - Thickness is currently parsed from `panelMaterialRef.materialName`, for example `18mm` = `1.8cm`, `25mm` = `2.5cm`.
  - Example: total width `40cm` with `18mm` body material => top/bottom width `36.4cm`.
  - Example: total width `40cm` with `25mm` body material => top/bottom width `35cm`.
- Back panel dimensions use outer cabinet size minus `2.2cm` on width and height.
  - Example: cabinet `60 x 80cm` => back panel `57.8 x 77.8cm`.
  - When back panel is enabled, side/top/bottom body panels should include note: `背板溝槽: 離後緣18mm, 寬8.5mm, 深9mm`.
- Drawer breakdown includes:
  - Front panel / drawer head: `W x H`, quantity = drawer quantity.
  - Left/right side panels: `railLength x (H - 7cm)`, quantity = drawer quantity x 2.
  - Front/back wall panels: `(W - 10.2cm) x (H - 7cm)`, quantity = drawer quantity x 2.
  - 8mm bottom panel: `(W - 8.8cm) x (railLength - 2.2cm)`, quantity = drawer quantity.
  - Drawer board minimum `minCai` is evaluated by total area per same material across all drawer board parts, not per individual drawer part row.
- Drawer wall panels must support groove spec selection `12`, `8.5`, `9`.
  - The UI field belongs beside `18mm牆板材料`.
  - The calculation result note for drawer left/right and front/back wall panels is `內側下方打溝 (<spec>)`.
- Light groove processing is a cabinet/internal-part option.
  - Body options: top panel inner side, side panel inner side.
  - Middle divider options: left or right side.
  - Shelf options: top or bottom side.
  - User inputs distance from front edge in mm.
  - Groove width is fixed at `10mm`; depth is fixed at `11mm`.
  - Processing fee is per line: `180` when length is `<= 2400mm`, `360` when length is `>= 2401mm`.
  - Side panel light groove counts as both left and right side panels.
  - Live result process rows must show quantity, unit price, and subtotal separately. Example: two short grooves display quantity `2`, unit price `$180`, subtotal `$360`.

## Material Notes

- System board materials are grouped as `系統板材 / 桶身板材`, `系統板材 / 背板`, and `系統板材 / 門片`.
- System board material lists should display brand before color code.
- Glass and mesh should be separated as `玻璃` and `網材`.
- Wire mesh door options use `WIRE_MESH` materials. The selector modal should show only `擴張網` and `沖孔網`; paint processing is a separate material option.
- Door aluminum handle is a toggle. When enabled, the user selects a handle material/spec.
- Profile handle processing options are door add-ons, not ad hoc UI-only calculations.
- Profile handle styles `SFJA` full J and `SFCA` full C use the door height as fixed processing length; user-entered length is ignored/disabled for those styles.
- In live cabinet results, door profile handle processing should render under the related door row as an `加工-...` process row, not inside the door hardware table.

## Material Summary Rules

- Material summary detail table column order must be:
  - `材料 / 規格`
  - `部件 / 品項`
  - `數量`
  - `尺寸`
  - `才數`
  - `加工 / 備註`
  - `單價`
  - `小計`
- Per-unit cabinet material summary should show each cabinet bucket detail table, then:
  - `同板材才數總和(不考慮加工)`
  - `五金總表`
  - `加工總額`
- Project detail page cost breakdown should only show `本專案材料統整`, not each cabinet bucket detail table.
- Project-level `本專案材料統整` should show the project totals for:
  - same-material cai total without processing
  - hardware summary table
  - processing total
- Door processing rows must stay directly under the related door material row.
- Board processing quantity must follow the parent board quantity. Example: two left side panels requiring processing should show processing quantity `2`.
- Keep summary table layout responsive:
  - detail tables may scroll horizontally inside their container
  - project-level summary sections should stack vertically to avoid crowded tables
- Saved `EstimateItem.resultData` can be legacy JSON. Summary builders must tolerate missing newer fields such as `PanelResult.processes` and `lightGrooveCost`.

## Material Library UI Rules

- Material library client page is `src/app/(dashboard)/materials/MaterialsClient.tsx`.
- Material edit form is `src/components/materials/MaterialForm.tsx`.
- `MaterialForm` uses uncontrolled inputs with `defaultValue`; when switching the selected material, render it with a stable `key` based on `selectedMaterial.id` so the form remounts and displays the newly selected item.
- Row-level actions belong in the material list row, not inside the right edit panel.
  - Enabled material row action button should say `停用`.
  - Disabled material row action button should say `啟用`.
  - Keep the action column fixed-width and use non-wrapping buttons to avoid circular/wrapped status badges.
- The right edit panel should only edit the selected item or create a new item; it should not contain enable/disable/delete controls.

## Before Saying Work Is Done

Run:

```bash
npm run typecheck
npm run build
```

For calculation changes, also run:

```bash
npx tsx src/lib/calculations/cabinet.redesign.test.ts
npx tsx src/lib/calculations/material-summary.test.ts
```
