# Zhengdao Vendor Integration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add Zhengdao as an isolated system-cabinet vendor so users can choose either the existing Weiho engine or the new Zhengdao engine when creating an estimate, while keeping each vendor's material library, pricing rules, summaries, and PDFs separated.

**Architecture:** Preserve the current Weiho cabinet flow and add a vendor dimension at the persistence and catalog layers. Zhengdao receives its own typed input model, validation schema, pure calculation engine, UI route, server actions, and material-summary adapter. Both engines emit a common project-summary shape only after calculation, allowing project totals and PDFs to reuse shared rendering without merging rows from different vendors.

**Tech Stack:** Next.js 15 App Router, TypeScript strict mode, Prisma 5, PostgreSQL, Zod, React client components, Tailwind CSS, `npx tsx` pure-function tests.

---

## 0. Plan Status

This plan supersedes `docs/superpowers/plans/2026-05-25-brightway-calculation-engine.md`. The older draft covered only the board and base-processing engine; this plan covers the approved full Zhengdao integration scope.

---

## 1. Confirmed Product Behavior

### Estimate workflow

1. A user opens a project.
2. The user selects `新增系統櫃估價`.
3. The system presents a vendor choice:
   - `葳禾`
   - `正道`
4. Choosing Weiho opens the existing `/projects/[id]/cabinet` page and existing engine unchanged.
5. Choosing Zhengdao opens `/projects/[id]/zhengdao-cabinet` and uses only Zhengdao materials, rules, and components.
6. A project may contain Weiho cabinet estimates, Zhengdao cabinet estimates, and ceiling estimates at the same time.
7. A single cabinet estimate belongs to exactly one vendor. Mixing Weiho and Zhengdao rows inside one estimate is not supported.

### Material-library workflow

1. A user opens `/materials`.
2. The page displays a vendor segmented control:
   - `葳禾材料庫`
   - `正道材料庫`
3. Weiho remains the default so existing behavior does not change.
4. Lists, API calls, create/edit actions, enable/disable actions, and dropdowns are filtered by vendor.
5. Materials with the same display name may exist in both libraries with different prices.
6. Zhengdao library categories include board materials, door materials, door processing, styled doors, aluminum-frame doors, hinges, rails, clothes rods, sliding-door hardware, lift hardware, aluminum handles, cable-routing items, brackets, and custom items.

### Project summary and PDF workflow

1. Each saved estimate stores its vendor.
2. Project detail cards display a vendor label for cabinet estimates.
3. Project material summaries and project PDFs group rows by estimate and vendor.
4. Summary merge keys include vendor so identical names from different libraries are never combined.
5. Existing Weiho single-estimate PDF behavior remains unchanged.
6. Zhengdao receives a single-estimate PDF using the same visual language but Zhengdao-specific rows.

---

## 2. Source Data Boundary

Use only the 46 selected pages represented by:

- `docs/vendor-data/zhengdao-2025-selected-pages.md`
- `docs/vendor-data/zhengdao-2025-selected-pages.txt`

Do not import the full 140-page catalog.

The selected pages cover:

- Board prices and board-processing prices.
- PVC, crystal, crystallized-board, and curved-countertop door items.
- Styled-door processing and styled-door families.
- Aluminum-frame door families.
- BLUM hinges.
- BLUM base-mount rails.
- King Slide rails selected by the customer.
- Clothes rods.
- Sliding-door hardware.
- Lift hardware.
- Aluminum handles.
- Selected cable-routing products and brackets.
- User-entered custom items.

Board color models are intentionally excluded. Zhengdao board selection uses series, thickness, base cai, notes, edge-banding option, and price per cai.

---

## 3. Data Design

### Prisma changes

Modify `prisma/schema.prisma`.

Add:

```prisma
enum MaterialVendor {
  WEIHO
  ZHENGDAO
}
```

Extend `MaterialCategory`:

```prisma
ZHENGDAO_PROCESSING
ZHENGDAO_STYLED_DOOR
ZHENGDAO_ALUMINUM_FRAME_DOOR
ZHENGDAO_CABLE_ROUTING
ZHENGDAO_BRACKET
ZHENGDAO_CUSTOM
```

Extend `Material`:

```prisma
vendor         MaterialVendor @default(WEIHO)
vendorCode     String?
catalogVersion String?
notes          String?
pricingMeta    Json?
```

Add indexes:

```prisma
@@index([vendor])
@@index([vendor, category])
@@unique([vendor, vendorCode])
```

Extend `EstimateItem`:

```prisma
vendor MaterialVendor @default(WEIHO)
```

Add index:

```prisma
@@index([moduleType, vendor])
```

### Why reuse `Material`

Use the existing `Material` table for selectable catalog rows and editable prices. This preserves the current material-management patterns and avoids introducing a parallel admin tool.

Use `pricingMeta` only for structured attributes needed by Zhengdao rules, for example:

```json
{
  "series": "ER",
  "thicknessMm": 18,
  "edgeMode": "NONE",
  "billingMode": "PER_CAI"
}
```

Calculation formulas remain in pure TypeScript functions. Editable numeric prices come from the Zhengdao material library rather than being hard-coded in UI components.

---

## 4. File Map

### Create

- `src/types/vendor.ts`
  - Shared `CabinetVendor` and vendor-aware summary types.
- `src/types/zhengdao.ts`
  - Zhengdao-only input, result, catalog metadata, processing, hardware, and custom-row types.
- `src/lib/config/vendors/zhengdao-2025.ts`
  - Zhengdao catalog codes, supported combinations, and non-editable formula constants.
- `src/lib/calculations/zhengdao.ts`
  - Pure Zhengdao unit and project calculations.
- `src/lib/calculations/zhengdao.test.ts`
  - Zhengdao engine tests.
- `src/lib/calculations/zhengdao-summary.ts`
  - Adapter from Zhengdao results to common material-summary rows.
- `src/lib/calculations/zhengdao-summary.test.ts`
  - Adapter and merge-isolation tests.
- `src/lib/validations/zhengdao.ts`
  - Zod schemas for Zhengdao estimate input.
- `src/lib/validations/zhengdao.test.ts`
  - Zhengdao validation boundary tests.
- `src/lib/actions/zhengdao-estimates.ts`
  - Session-safe Zhengdao save/update actions.
- `src/lib/actions/zhengdao-estimates.test.ts`
  - Zhengdao persistence, ownership, and vendor-mismatch tests.
- `src/components/shared/MaterialDropdown.vendor.test.ts`
  - Material dropdown vendor-scope tests.
- `src/components/projects/CabinetVendorDialog.tsx`
  - Vendor selection dialog for new cabinet estimates.
- `src/components/zhengdao/ZhengdaoCabinetUnitList.tsx`
  - Zhengdao estimate state, save handling, totals, and PDF entry point.
- `src/components/zhengdao/ZhengdaoCabinetUnitForm.tsx`
  - Zhengdao cabinet dimensions and board selections.
- `src/components/zhengdao/ZhengdaoDoorForm.tsx`
  - Zhengdao door, styled-door, and aluminum-frame door rows.
- `src/components/zhengdao/ZhengdaoHardwareForm.tsx`
  - Zhengdao hinge, rail, rod, lift, handle, cable-routing, and bracket rows.
- `src/components/zhengdao/ZhengdaoCustomItemsForm.tsx`
  - Free-form custom rows.
- `src/components/zhengdao/ZhengdaoResultPanel.tsx`
  - Live result and single-estimate PDF.
- `src/app/(dashboard)/projects/[id]/zhengdao-cabinet/page.tsx`
  - Zhengdao create/edit route.
- `prisma/data/zhengdao-2025-catalog.ts`
  - Reviewed structured seed rows derived from the selected PDF pages.
- `prisma/seed-zhengdao.ts`
  - Idempotent Zhengdao catalog import.

### Modify

- `prisma/schema.prisma`
- `package.json`
- `src/types/index.ts`
- `src/lib/actions/materials.ts`
- `src/app/api/materials/route.ts`
- `src/components/shared/MaterialDropdown.tsx`
- `src/app/(dashboard)/materials/page.tsx`
- `src/app/(dashboard)/materials/MaterialsClient.tsx`
- `src/components/materials/MaterialForm.tsx`
- `src/app/(dashboard)/projects/[id]/page.tsx`
- `src/components/projects/ProjectCostBreakdown.tsx`
- `src/components/shared/MaterialSummaryTables.tsx`
- `src/app/api/estimate-items/route.ts`

### Keep unchanged unless a regression test proves otherwise

- `src/lib/calculations/cabinet.ts`
- `src/lib/config/units.ts`
- Existing Weiho cabinet components under `src/components/cabinet/`
- `src/app/(dashboard)/projects/[id]/cabinet/page.tsx`

---

## 5. Implementation Tasks

### Task 1: Add Vendor Persistence

**Files:**
- Modify: `prisma/schema.prisma`
- Modify: `package.json`
- Create: `src/types/vendor.ts`
- Modify: `src/types/index.ts`

- [ ] Add `MaterialVendor`, vendor fields, Zhengdao categories, and indexes exactly as described in section 3.
- [ ] Add `export type CabinetVendor = "WEIHO" | "ZHENGDAO";` to `src/types/vendor.ts`.
- [ ] Export vendor types from `src/types/index.ts`.
- [ ] Add a script:

```json
"db:seed:zhengdao": "tsx prisma/seed-zhengdao.ts"
```

- [ ] Run:

```bash
npm run db:push
npm run typecheck
```

- [ ] Verify existing material records receive `vendor = WEIHO`.
- [ ] Commit:

```bash
git add prisma/schema.prisma package.json src/types/vendor.ts src/types/index.ts
git commit -m "feat: add cabinet vendor persistence"
```

### Task 2: Make Material APIs Vendor-Aware

**Files:**
- Modify: `src/lib/actions/materials.ts`
- Modify: `src/app/api/materials/route.ts`
- Modify: `src/components/shared/MaterialDropdown.tsx`
- Test: `src/components/shared/MaterialDropdown.vendor.test.ts`

- [ ] Add `vendor` to the material Zod schema using Prisma `MaterialVendor`.
- [ ] Update `getMaterials()` and `GET /api/materials` to require an explicit vendor filter and default to `WEIHO`.
- [ ] Serialize `vendor`, `vendorCode`, `catalogVersion`, `notes`, and `pricingMeta`.
- [ ] Add this prop to `MaterialDropdown`:

```typescript
vendor?: "WEIHO" | "ZHENGDAO";
```

- [ ] Build requests as:

```typescript
const params = new URLSearchParams();
if (categoryFilter) params.set("category", categoryFilter);
params.set("vendor", vendor ?? "WEIHO");
```

- [ ] Add a test proving a Zhengdao dropdown requests `vendor=ZHENGDAO` and a Weiho dropdown never receives Zhengdao rows.
- [ ] Run:

```bash
npx tsx src/components/shared/MaterialDropdown.vendor.test.ts
npm run typecheck
```

- [ ] Commit:

```bash
git add src/lib/actions/materials.ts src/app/api/materials/route.ts src/components/shared/MaterialDropdown.tsx src/components/shared/MaterialDropdown.vendor.test.ts
git commit -m "feat: scope material APIs by vendor"
```

### Task 3: Split the Material Library UI

**Files:**
- Modify: `src/app/(dashboard)/materials/page.tsx`
- Modify: `src/app/(dashboard)/materials/MaterialsClient.tsx`
- Modify: `src/components/materials/MaterialForm.tsx`

- [ ] Serialize vendor metadata from the server page.
- [ ] Add a top-level segmented control with `葳禾材料庫` and `正道材料庫`.
- [ ] Filter sidebar groups, search results, edit selection, create defaults, and counts by selected vendor.
- [ ] Reset selected category and selected item whenever the vendor changes.
- [ ] Submit the selected vendor from `MaterialForm`.
- [ ] Keep the existing three-column desktop layout and stacked mobile layout.
- [ ] Manually verify:
  - Weiho is selected by default.
  - Switching to Zhengdao never shows Weiho rows.
  - Creating a Zhengdao row persists `vendor=ZHENGDAO`.
  - Editing an item remounts `MaterialForm` using the selected material ID.
- [ ] Run:

```bash
npm run typecheck
```

- [ ] Commit:

```bash
git add src/app/\(dashboard\)/materials/page.tsx src/app/\(dashboard\)/materials/MaterialsClient.tsx src/components/materials/MaterialForm.tsx
git commit -m "feat: split material library by vendor"
```

### Task 4: Review and Seed the Selected Zhengdao Catalog

**Files:**
- Reference: `docs/vendor-data/zhengdao-2025-selected-pages.md`
- Reference: `docs/vendor-data/zhengdao-2025-selected-pages.txt`
- Create: `prisma/data/zhengdao-2025-catalog.ts`
- Create: `prisma/seed-zhengdao.ts`

- [ ] Convert only the selected 46 pages into reviewed seed rows.
- [ ] Commit the selected-page extraction index and text file with the reviewed seed rows so every imported value remains traceable to its source.
- [ ] Do not seed board color codes.
- [ ] Store one stable `vendorCode` for every row.
- [ ] Store the original PDF page in `pricingMeta.sourcePage`.
- [ ] Store uncertain OCR rows as disabled rows with `pricingMeta.reviewRequired = true`; do not guess prices.
- [ ] Make `seed-zhengdao.ts` idempotent by upserting on `(vendor, vendorCode)`.
- [ ] Cover the agreed categories:
  - Board series and thickness rules.
  - Board-processing rows.
  - PVC, crystal, crystallized-board, and curved-countertop doors.
  - Styled doors.
  - Aluminum-frame doors.
  - BLUM hinges.
  - BLUM base-mount rails.
  - Selected King Slide rails.
  - Clothes rods.
  - Sliding-door hardware.
  - Lift hardware.
  - Aluminum handles.
  - Selected cable-routing items.
  - Selected brackets.
- [ ] Run:

```bash
npm run db:seed:zhengdao
npm run db:seed:zhengdao
```

- [ ] Verify the second run does not create duplicates.
- [ ] Commit:

```bash
git add docs/vendor-data/zhengdao-2025-selected-pages.md docs/vendor-data/zhengdao-2025-selected-pages.txt prisma/data/zhengdao-2025-catalog.ts prisma/seed-zhengdao.ts
git commit -m "feat: seed reviewed Zhengdao catalog"
```

### Task 5: Add Zhengdao Types and Validation

**Files:**
- Create: `src/types/zhengdao.ts`
- Create: `src/lib/validations/zhengdao.ts`
- Modify: `src/types/index.ts`

- [ ] Define vendor-specific input types:

```typescript
export interface ZhengdaoEstimateInput {
  vendor: "ZHENGDAO";
  catalogVersion: "2025";
  units: ZhengdaoCabinetUnitInput[];
}

export interface ZhengdaoCustomItemInput {
  id: string;
  name: string;
  unit: string;
  quantity: number;
  unitPrice: number;
  note: string;
}
```

- [ ] Define distinct collections for boards, doors, processes, hardware, and custom rows.
- [ ] Include `vendorCode` in every selected Zhengdao catalog reference.
- [ ] Define result types with stable rows for material, processing, hardware, and custom items.
- [ ] Add Zod schemas requiring positive dimensions, integer quantities where applicable, nonnegative custom prices, and `vendor: z.literal("ZHENGDAO")`.
- [ ] Add validation tests for invalid quantity, missing material code, and negative custom price.
- [ ] Run:

```bash
npx tsx src/lib/validations/zhengdao.test.ts
npm run typecheck
```

- [ ] Commit:

```bash
git add src/types/zhengdao.ts src/types/index.ts src/lib/validations/zhengdao.ts src/lib/validations/zhengdao.test.ts
git commit -m "feat: add Zhengdao estimate contracts"
```

### Task 6: Implement the Pure Zhengdao Calculation Engine

**Files:**
- Create: `src/lib/config/vendors/zhengdao-2025.ts`
- Create: `src/lib/calculations/zhengdao.ts`
- Create: `src/lib/calculations/zhengdao.test.ts`
- Modify: `src/lib/calculations/index.ts`

- [ ] Add failing tests first for:
  - Cai conversion using `widthCm * heightCm / 918.09`.
  - Minimum cai per board row.
  - Board series + thickness lookup.
  - Front ABS and front/back ABS additions.
  - Middle-divider drilling.
  - Shared-side drilling with back groove.
  - Door grain matching minimum cai.
  - Board-processing items by unit type: cai, piece, hole, set, and length.
  - Hardware quantity multiplication.
  - Custom item subtotal.
  - Unsupported or `另洽` combinations returning a typed blocking error.
- [ ] Keep all Zhengdao calculations in `src/lib/calculations/zhengdao.ts`.
- [ ] Keep non-editable formula constants in `src/lib/config/vendors/zhengdao-2025.ts`.
- [ ] Resolve editable prices from selected catalog refs rather than hard-coding prices inside the engine.
- [ ] Export:

```typescript
calculateZhengdaoCabinetUnit(input)
calculateZhengdaoProject(units)
```

- [ ] Run:

```bash
npx tsx src/lib/calculations/zhengdao.test.ts
npx tsx src/lib/calculations/cabinet.redesign.test.ts
npm run typecheck
```

- [ ] Commit:

```bash
git add src/lib/config/vendors/zhengdao-2025.ts src/lib/calculations/zhengdao.ts src/lib/calculations/zhengdao.test.ts src/lib/calculations/index.ts
git commit -m "feat: add isolated Zhengdao calculation engine"
```

### Task 7: Add Zhengdao Material-Summary Adapter

**Files:**
- Create: `src/lib/calculations/zhengdao-summary.ts`
- Create: `src/lib/calculations/zhengdao-summary.test.ts`
- Modify: `src/lib/calculations/material-summary.ts`
- Modify: `src/components/shared/MaterialSummaryTables.tsx`

- [ ] Add `vendor` to common summary rows and material-cai totals.
- [ ] Include vendor in all merge keys.
- [ ] Convert Zhengdao results into the existing display concepts:
  - Material rows.
  - Processing rows directly below parent materials where applicable.
  - Hardware rows.
  - Custom rows.
- [ ] Add tests proving:
  - A door-processing row follows its parent door.
  - Weiho and Zhengdao rows with the same material name remain separate.
  - Custom rows appear in totals.
  - Hardware totals do not merge across vendors.
- [ ] Run:

```bash
npx tsx src/lib/calculations/zhengdao-summary.test.ts
npx tsx src/lib/calculations/material-summary.test.ts
npx tsx src/components/shared/MaterialSummaryTables.test.ts
npm run typecheck
```

- [ ] Commit:

```bash
git add src/lib/calculations/zhengdao-summary.ts src/lib/calculations/zhengdao-summary.test.ts src/lib/calculations/material-summary.ts src/components/shared/MaterialSummaryTables.tsx
git commit -m "feat: adapt Zhengdao results to material summaries"
```

### Task 8: Add Zhengdao Save and Update Actions

**Files:**
- Create: `src/lib/actions/zhengdao-estimates.ts`
- Modify: `src/app/api/estimate-items/route.ts`

- [ ] Add `saveZhengdaoEstimate(rawData)` and `updateZhengdaoEstimate(itemId, rawData)`.
- [ ] Validate session and project ownership before DB access.
- [ ] Validate input with `zhengdaoProjectInputSchema`.
- [ ] Calculate using `calculateZhengdaoProject()`.
- [ ] Persist:

```typescript
moduleType: "CABINET"
vendor: "ZHENGDAO"
inputData
resultData
totalCost
```

- [ ] Restrict update queries to `id`, `projectId`, `moduleType: "CABINET"`, and `vendor: "ZHENGDAO"`.
- [ ] Add API POST support for `moduleType === "CABINET" && vendor === "ZHENGDAO"`.
- [ ] Keep existing Weiho requests defaulting to `WEIHO`.
- [ ] Test ownership rejection, invalid input rejection, and vendor mismatch rejection.
- [ ] Run:

```bash
npx tsx src/lib/actions/zhengdao-estimates.test.ts
npm run typecheck
```

- [ ] Commit:

```bash
git add src/lib/actions/zhengdao-estimates.ts src/lib/actions/zhengdao-estimates.test.ts src/app/api/estimate-items/route.ts
git commit -m "feat: persist Zhengdao cabinet estimates"
```

### Task 9: Add Vendor Choice on the Project Page

**Files:**
- Create: `src/components/projects/CabinetVendorDialog.tsx`
- Modify: `src/app/(dashboard)/projects/[id]/page.tsx`

- [ ] Replace the direct `新增系統櫃估價` link with a client dialog trigger.
- [ ] Show two choices:
  - `葳禾系統櫃`
  - `正道系統櫃`
- [ ] Route Weiho to `/projects/[id]/cabinet`.
- [ ] Route Zhengdao to `/projects/[id]/zhengdao-cabinet`.
- [ ] Add vendor labels to cabinet estimate cards.
- [ ] Route edit buttons by `item.vendor`.
- [ ] Keep ceiling behavior unchanged.
- [ ] Verify keyboard focus, mobile width, and close behavior.
- [ ] Run:

```bash
npm run typecheck
```

- [ ] Commit:

```bash
git add src/components/projects/CabinetVendorDialog.tsx src/app/\(dashboard\)/projects/\[id\]/page.tsx
git commit -m "feat: choose cabinet vendor when creating estimates"
```

### Task 10: Build the Zhengdao Estimate UI

**Files:**
- Create: `src/app/(dashboard)/projects/[id]/zhengdao-cabinet/page.tsx`
- Create: `src/components/zhengdao/ZhengdaoCabinetUnitList.tsx`
- Create: `src/components/zhengdao/ZhengdaoCabinetUnitForm.tsx`
- Create: `src/components/zhengdao/ZhengdaoDoorForm.tsx`
- Create: `src/components/zhengdao/ZhengdaoHardwareForm.tsx`
- Create: `src/components/zhengdao/ZhengdaoCustomItemsForm.tsx`
- Create: `src/components/zhengdao/ZhengdaoResultPanel.tsx`

- [ ] Build a dedicated Zhengdao route. Do not add Zhengdao conditionals throughout existing Weiho forms.
- [ ] Reuse shared controls and `MaterialDropdown vendor="ZHENGDAO"` where applicable.
- [ ] Support:
  - Cabinet dimensions and quantity.
  - Board series, thickness, edge options, and board-processing options.
  - Door materials and styled-door selections.
  - Aluminum-frame doors.
  - Hinges, rails, rods, sliding hardware, lifts, handles, cable-routing items, and brackets.
  - Free-form custom rows with name, quantity, unit, price, and note.
- [ ] Calculate live results directly with the pure Zhengdao engine.
- [ ] Wrap all save/update Server Action calls in `try/catch/finally`.
- [ ] Provide `全部展開` and `全部摺疊`.
- [ ] Make single-estimate PDF default to expanded sections.
- [ ] Verify desktop, tablet, and mobile layouts.
- [ ] Run:

```bash
npx tsx src/lib/calculations/zhengdao.test.ts
npm run typecheck
```

- [ ] Commit:

```bash
git add src/app/\(dashboard\)/projects/\[id\]/zhengdao-cabinet/page.tsx src/components/zhengdao
git commit -m "feat: add Zhengdao cabinet estimate UI"
```

### Task 11: Integrate Project Summary and Project PDF

**Files:**
- Modify: `src/components/projects/ProjectCostBreakdown.tsx`
- Modify: `src/components/shared/MaterialSummaryTables.tsx`
- Modify: `src/components/projects/ProjectCostBreakdown.test.ts`

- [ ] Parse Weiho results with the existing summary adapter.
- [ ] Parse Zhengdao results with `buildZhengdaoProjectMaterialSummary()`.
- [ ] Show vendor name as a parent label above each estimate group.
- [ ] Aggregate totals by vendor before project-level totals.
- [ ] Ensure PDF sections display:
  - Estimate name.
  - Vendor name.
  - Board/material totals.
  - Hardware totals.
  - Processing totals.
  - Custom rows.
- [ ] Add tests proving same-name rows remain split by vendor and project totals include both vendors.
- [ ] Check long hardware names wrap without overlapping numeric columns.
- [ ] Run:

```bash
npx tsx src/components/projects/ProjectCostBreakdown.test.ts
npx tsx src/components/shared/MaterialSummaryTables.test.ts
npm run typecheck
```

- [ ] Commit:

```bash
git add src/components/projects/ProjectCostBreakdown.tsx src/components/projects/ProjectCostBreakdown.test.ts src/components/shared/MaterialSummaryTables.tsx
git commit -m "feat: include Zhengdao estimates in project PDFs"
```

### Task 12: Full Regression and Deployment Verification

**Files:**
- Modify only files required by failures found during verification.

- [ ] Run database sync:

```bash
npm run db:push
npm run db:seed:zhengdao
```

- [ ] Run:

```bash
npm run typecheck
npm run build
npx tsx src/lib/calculations/cabinet.redesign.test.ts
npx tsx src/lib/calculations/material-summary.test.ts
npx tsx src/lib/calculations/zhengdao.test.ts
npx tsx src/lib/calculations/zhengdao-summary.test.ts
npx tsx src/components/shared/MaterialSummaryTables.test.ts
npx tsx src/components/projects/ProjectCostBreakdown.test.ts
```

- [ ] Start:

```bash
npm run dev -- -p 3001
```

- [ ] Browser verify:
  - Weiho material library.
  - Zhengdao material library.
  - Weiho estimate creation and editing.
  - Zhengdao estimate creation and editing.
  - A project containing both vendors.
  - Single-estimate PDFs.
  - Project PDF.
  - Tablet and mobile widths.
- [ ] Confirm no unrelated untracked catalog PDFs are committed.
- [ ] Commit only targeted verification fixes.

---

## 6. Delivery Sequence and Estimated Hours

Implement in four milestones so the user can review data and rules before the UI is complete.

### Milestone A: Vendor foundation and material libraries

- Tasks 1-4.
- Expected effort: 18-26 hours.
- Review checkpoint: Weiho and Zhengdao libraries are separated and Zhengdao catalog rows are visible for manual verification.

### Milestone B: Zhengdao calculation engine

- Tasks 5-7.
- Expected effort: 18-28 hours.
- Review checkpoint: Pure-function tests prove board, processing, hardware, and custom-item totals without UI dependencies.

### Milestone C: Estimate workflow

- Tasks 8-10.
- Expected effort: 18-26 hours.
- Review checkpoint: Users can choose a vendor, create/edit Zhengdao estimates, and export a single-estimate PDF.

### Milestone D: Project summary and final verification

- Tasks 11-12.
- Expected effort: 8-14 hours.
- Review checkpoint: Mixed-vendor projects summarize and export correctly without changing Weiho calculations.

### Total

- Expected effort: 62-94 hours.
- The range assumes the selected 46-page Zhengdao extraction is reviewed during Task 4 and ambiguous catalog rows are confirmed promptly.

---

## 7. Scope Exclusions

- Importing Zhengdao board color model numbers.
- Importing pages outside `正道整理PDF.pdf`.
- Automatic cross-vendor price comparison.
- Mixing Weiho and Zhengdao materials in one cabinet estimate.
- Changing Weiho pricing formulas unless a regression test reveals an existing bug.
- Bulk price-sync automation for future catalog editions.
- OCR guessing for unreadable or ambiguous rows.

---

## 8. Acceptance Checklist

- [ ] Existing Weiho estimates load, edit, calculate, summarize, and export as before.
- [ ] `/materials` separates Weiho and Zhengdao catalogs.
- [ ] Material APIs and dropdowns filter by vendor.
- [ ] Users choose Weiho or Zhengdao before creating a cabinet estimate.
- [ ] Zhengdao inputs are validated independently.
- [ ] Zhengdao calculations live only in Zhengdao calculation modules.
- [ ] Zhengdao catalog prices are editable through material management.
- [ ] Custom Zhengdao items support name, unit, quantity, price, and notes.
- [ ] Project totals include both vendors.
- [ ] Material summaries and PDFs never merge cross-vendor rows.
- [ ] Long names wrap cleanly in browser and PDF layouts.
- [ ] Typecheck, build, calculation tests, summary tests, and browser verification pass.
