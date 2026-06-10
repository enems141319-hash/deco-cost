"use client";

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { ChevronDown, Printer } from "lucide-react";
import { buildCabinetProjectMaterialSummary } from "@/lib/calculations/material-summary";
import { displayEstimateLabel } from "@/lib/estimate-label";
import { formatCurrency } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  MaterialDetailTable,
  SummaryTotalsBlock,
} from "@/components/shared/MaterialSummaryTables";
import type {
  CabinetProjectMaterialSummary,
  MaterialCaiTotal,
  MaterialSummaryRow,
} from "@/lib/calculations/material-summary";
import type {
  CabinetProjectResult,
  CabinetUnitInput,
} from "@/types";

interface EstimateItemForBreakdown {
  id: string;
  label: string | null;
  moduleType: string;
  vendor?: string;
  inputData: unknown;
  resultData: unknown;
  totalCost: number;
}

interface ProjectPrintInfo {
  name?: string | null;
  address?: string | null;
  clientName?: string | null;
  clientTitle?: string | null;
  clientPhone?: string | null;
  clientLineId?: string | null;
  designerName?: string | null;
  designerPhone?: string | null;
}

interface Props {
  items: EstimateItemForBreakdown[];
  grandTotal: number;
  projectInfo?: ProjectPrintInfo;
}

interface SummaryCollapseCommand {
  action: "expand" | "collapse";
  version: number;
}

export interface ProjectMaterialSummarySource {
  id: string;
  label: string | null;
  moduleType: string;
  totalCost: number;
  summary: CabinetProjectMaterialSummary;
}

interface ProjectMaterialSummaryGroup {
  id: string;
  label: string;
  totalCost: number;
  summary: CabinetProjectMaterialSummary;
}

export const PROJECT_MATERIAL_SUMMARY_PRINT_CSS = `
      @page {
        size: A4 portrait;
        margin: 10mm 8mm;
      }

      html,
      body {
        width: 194mm;
        margin: 0;
        background: #ffffff;
        color: #020617;
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
      }

      body {
        padding: 0;
      }

      [data-cabinet-print-target="true"] {
        box-sizing: border-box;
        width: 194mm;
        max-width: 194mm;
        margin: 0;
        padding: 0;
        background: #ffffff;
      }

      .cabinet-print-title {
        display: block !important;
      }

      .cabinet-print-hidden {
        display: none !important;
      }

      .overflow-x-auto {
        overflow: visible !important;
      }

      table {
        width: 100% !important;
        min-width: 0 !important;
        table-layout: fixed !important;
        border-collapse: collapse !important;
        page-break-inside: auto;
      }

      [data-cabinet-print-target="true"] .cabinet-board-table .cabinet-name-col {
        width: 45% !important;
      }

      [data-cabinet-print-target="true"] .cabinet-board-table .cabinet-size-col {
        width: 21mm !important;
      }

      [data-cabinet-print-target="true"] .cabinet-board-table .cabinet-qty-col {
        width: 12mm !important;
      }

      [data-cabinet-print-target="true"] .cabinet-board-table .cabinet-area-col {
        width: 18mm !important;
      }

      [data-cabinet-print-target="true"] .cabinet-board-table .cabinet-price-col,
      [data-cabinet-print-target="true"] .cabinet-board-table .cabinet-subtotal-col {
        width: 22mm !important;
      }

      [data-cabinet-print-target="true"] th {
        font-size: 10pt !important;
        line-height: 1.25 !important;
      }

      [data-cabinet-print-target="true"] td {
        font-size: 10.5pt !important;
        line-height: 1.32 !important;
        white-space: normal !important;
      }

      [data-cabinet-print-target="true"] .cabinet-board-index,
      [data-cabinet-print-target="true"] .cabinet-board-title {
        display: inline !important;
        overflow: visible !important;
        text-overflow: clip !important;
        white-space: normal !important;
        word-break: keep-all !important;
        overflow-wrap: normal !important;
        font-size: 10pt !important;
        line-height: 1.22 !important;
      }

      [data-cabinet-print-target="true"] .cabinet-board-index {
        color: #1d4ed8 !important;
      }

      [data-cabinet-print-target="true"] .cabinet-board-material {
        display: block !important;
        overflow: visible !important;
        text-overflow: clip !important;
        white-space: normal !important;
        word-break: keep-all !important;
        overflow-wrap: normal !important;
        font-size: 10pt !important;
        line-height: 1.22 !important;
      }

      [data-cabinet-print-target="true"] .cabinet-process-label,
      [data-cabinet-print-target="true"] .cabinet-secondary-text {
        font-size: 8pt !important;
        line-height: 1.18 !important;
        white-space: normal !important;
        word-break: keep-all !important;
        overflow-wrap: normal !important;
      }

      [data-cabinet-print-target="true"] .cabinet-board-table td:nth-child(2),
      [data-cabinet-print-target="true"] .cabinet-board-table td:nth-child(3),
      [data-cabinet-print-target="true"] .cabinet-board-table td:nth-child(4),
      [data-cabinet-print-target="true"] .cabinet-board-table td:nth-child(5),
      [data-cabinet-print-target="true"] .cabinet-board-table td:nth-child(6) {
        font-size: 10pt !important;
        line-height: 1.22 !important;
        white-space: nowrap !important;
      }

      [data-cabinet-print-target="true"] .cabinet-hardware-summary-table .hardware-item-col {
        width: 28mm !important;
      }

      [data-cabinet-print-target="true"] .cabinet-hardware-summary-table .hardware-qty-col {
        width: 13mm !important;
      }

      [data-cabinet-print-target="true"] .cabinet-hardware-summary-table .hardware-price-col,
      [data-cabinet-print-target="true"] .cabinet-hardware-summary-table .hardware-subtotal-col {
        width: 22mm !important;
      }

      [data-cabinet-print-target="true"] .hardware-item-cell,
      [data-cabinet-print-target="true"] .hardware-material-cell {
        white-space: normal !important;
        word-break: normal !important;
        overflow-wrap: anywhere !important;
        font-size: 9pt !important;
        line-height: 1.22 !important;
      }

      [data-cabinet-print-target="true"] .hardware-number-cell {
        white-space: nowrap !important;
        font-size: 9.5pt !important;
        line-height: 1.22 !important;
      }

      [data-cabinet-print-target="true"] .cabinet-secondary-text,
      [data-cabinet-print-target="true"] .badge,
      [data-cabinet-print-target="true"] [class*="text-\\[10px\\]"],
      [data-cabinet-print-target="true"] [class*="text-xs"] {
        font-size: 8pt !important;
        line-height: 1.25 !important;
      }

      thead {
        display: table-header-group;
      }

      tbody,
      tr {
        break-inside: auto;
        page-break-inside: auto;
      }

      .print-summary,
      .cabinet-print-title {
        break-inside: avoid;
        page-break-inside: avoid;
      }

      [data-cabinet-print-target="true"] .cabinet-result-section-header,
      [data-cabinet-print-target="true"] .cabinet-result-section thead {
        break-after: avoid;
        page-break-after: avoid;
      }

      [data-cabinet-print-target="true"] .cabinet-result-section,
      [data-cabinet-print-target="true"] .cabinet-result-section-body,
      [data-cabinet-print-target="true"] .cabinet-result-section table,
      [data-cabinet-print-target="true"] .cabinet-result-section tbody,
      [data-cabinet-print-target="true"] .cabinet-result-section tr {
        overflow: visible !important;
        break-inside: auto;
        page-break-inside: auto;
      }

      .rounded-md,
      .rounded-lg {
        border-radius: 0 !important;
      }

      .shadow,
      .shadow-sm,
      .shadow-md,
      .shadow-lg {
        box-shadow: none !important;
      }

      @media screen {
        body {
          width: auto;
          min-height: 100vh;
          padding: 24px;
          background: #f8fafc;
        }

        [data-cabinet-print-target="true"] {
          margin: 0 auto;
          padding: 10mm;
          border: 1px solid #d8dee9;
          background: #ffffff;
        }
      }
`;

function isCabinetProjectResult(value: unknown): value is CabinetProjectResult {
  return typeof value === "object" && value !== null && "unitResults" in value && "projectTotal" in value;
}

function isCabinetUnitInputArray(value: unknown): value is CabinetUnitInput[] {
  return Array.isArray(value);
}

export function rowsTotal(rows: MaterialSummaryRow[]): number {
  return rows.reduce((sum, row) => sum + (row.subtotal ?? 0), 0);
}

export function projectUnitSectionPrefix(estimateSectionNumber: number, unitIndex: number): string {
  return `${estimateSectionNumber}-${unitIndex + 1}`;
}

function mergeMaterialCaiTotals(rows: MaterialCaiTotal[]): MaterialCaiTotal[] {
  const map = new Map<string, MaterialCaiTotal>();
  for (const row of rows) {
    const existing = map.get(row.materialId);
    if (existing) {
      existing.cai += row.cai;
      continue;
    }
    map.set(row.materialId, { ...row });
  }
  return Array.from(map.values());
}

function mergeHardwareRows(rows: MaterialSummaryRow[]): MaterialSummaryRow[] {
  const map = new Map<string, MaterialSummaryRow>();
  for (const row of rows) {
    const key = [row.itemName, row.material, row.note, row.unitPrice].join("|");
    const existing = map.get(key);
    if (existing) {
      existing.quantity = (existing.quantity ?? 0) + (row.quantity ?? 0);
      existing.subtotal = (existing.subtotal ?? 0) + (row.subtotal ?? 0);
      continue;
    }
    map.set(key, { ...row, id: `project:${key}` });
  }
  return Array.from(map.values());
}

function mergeProcessRows(rows: MaterialSummaryRow[]): MaterialSummaryRow[] {
  const map = new Map<string, MaterialSummaryRow>();
  for (const row of rows) {
    const key = [row.itemName, row.note, row.unitPrice].join("|");
    const existing = map.get(key);
    if (existing) {
      existing.quantity = (existing.quantity ?? 0) + (row.quantity ?? 0);
      existing.subtotal = (existing.subtotal ?? 0) + (row.subtotal ?? 0);
      continue;
    }
    map.set(key, { ...row, id: `project-process:${key}` });
  }
  return Array.from(map.values());
}

export function combinedProjectSummary(summaries: CabinetProjectMaterialSummary[]) {
  const rows = summaries.flatMap((summary) => summary.unitSummaries.flatMap((unit) => unit.rows));
  const materialCaiTotals = mergeMaterialCaiTotals(summaries.flatMap((summary) => summary.materialCaiTotals));
  const hardwareRows = mergeHardwareRows(summaries.flatMap((summary) => summary.hardwareRows));
  const processRows = mergeProcessRows(summaries.flatMap((summary) => summary.processRows));
  return { rows, materialCaiTotals, hardwareRows, processRows };
}

export function buildProjectMaterialSummaryGroups(sources: ProjectMaterialSummarySource[]): ProjectMaterialSummaryGroup[] {
  return sources
    .filter((item) => item.moduleType === "CABINET")
    .map((item) => ({
      id: item.id,
      label: displayEstimateLabel(item.label, "系統櫃"),
      totalCost: item.totalCost,
      summary: item.summary,
    }));
}

function buildCabinetSources(items: EstimateItemForBreakdown[]): ProjectMaterialSummarySource[] {
  return items.flatMap((item) => {
    const result = isCabinetProjectResult(item.resultData) ? item.resultData : null;
    const input = isCabinetUnitInputArray(item.inputData) ? item.inputData : [];
    if (item.moduleType !== "CABINET" || result === null) return [];
    return [{
      id: item.id,
      label: item.label,
      moduleType: item.moduleType,
      totalCost: Number(item.totalCost),
      summary: buildCabinetProjectMaterialSummary(result, input),
    }];
  });
}

function SummarySection({
  sectionNumber,
  title,
  subtitle,
  total,
  command,
  children,
}: {
  sectionNumber?: number;
  title: string;
  subtitle?: string;
  total?: number;
  command?: SummaryCollapseCommand;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(true);

  useEffect(() => {
    if (!command) return;
    setOpen(command.action === "expand");
  }, [command]);

  return (
    <section className="cabinet-result-section overflow-hidden rounded-md border border-blue-200 bg-background">
      <button
        type="button"
        className="cabinet-result-section-header flex w-full items-center justify-between gap-3 bg-blue-600 px-4 py-3 text-left text-sm font-semibold text-white transition-colors hover:bg-blue-700"
        onClick={() => setOpen((next) => !next)}
      >
        <span className="min-w-0 truncate">{sectionNumber ? `${sectionNumber}.` : ""}{title}</span>
        <span className="flex shrink-0 items-center gap-3">
          {total !== undefined && <span className="text-xs font-semibold text-white/90">{formatCurrency(total)}</span>}
          <ChevronDown className={`h-4 w-4 shrink-0 transition-transform ${open ? "rotate-180" : ""}`} />
        </span>
      </button>
      <div hidden={!open} className="cabinet-result-section-body px-3 pb-3 pt-3">
        {subtitle && <p className="mb-3 text-xs text-muted-foreground">{subtitle}</p>}
        {children}
      </div>
    </section>
  );
}

function ProjectPrintTitle({ projectInfo, grandTotal }: { projectInfo?: ProjectPrintInfo; grandTotal: number }) {
  const projectClientLabel = [projectInfo?.clientName, projectInfo?.clientTitle].filter(Boolean).join("");
  const rows = [
    { label: "專案名稱", value: projectInfo?.name },
    { label: "業主", value: projectClientLabel },
    { label: "專案地址", value: projectInfo?.address },
    { label: "業主電話", value: projectInfo?.clientPhone },
    { label: "Line ID", value: projectInfo?.clientLineId },
    { label: "設計師", value: projectInfo?.designerName },
    { label: "設計師電話", value: projectInfo?.designerPhone },
  ].filter((row) => row.value);

  return (
    <div className="hidden cabinet-print-title mb-4 border-b pb-3">
      {rows.length > 0 && (
        <section className="grid grid-cols-3 gap-x-4 gap-y-2 text-[12px] leading-snug">
          {rows.map((row) => (
            <div key={row.label} className="min-w-0">
              <p className="text-[10px] font-semibold tracking-[0.16em] text-blue-700">{row.label}</p>
              <p className="mt-0.5 break-words text-foreground">{row.value}</p>
            </div>
          ))}
        </section>
      )}
      <h1 className="mt-3 text-xl font-bold">專案材料統整表</h1>
      <p className="mt-1 text-sm text-muted-foreground">專案總計：{formatCurrency(grandTotal)}</p>
    </div>
  );
}

export function ProjectCostBreakdown({ items, grandTotal, projectInfo }: Props) {
  const printRef = useRef<HTMLDivElement | null>(null);
  const [collapseCommand, setCollapseCommand] = useState<SummaryCollapseCommand>({ action: "expand", version: 0 });
  const cabinetGroups = buildProjectMaterialSummaryGroups(buildCabinetSources(items));
  const projectSummary = combinedProjectSummary(cabinetGroups.map((item) => item.summary));
  const rowCount = projectSummary.rows.length;
  const pdfDocumentTitle = [projectInfo?.name?.trim(), "專案材料統整表"].filter(Boolean).join(" - ");

  const printProject = useCallback(() => {
    const target = printRef.current;
    if (!target) return;

    const printWindow = window.open("", "_blank", "width=1100,height=800");
    if (!printWindow) return;

    const clonedTarget = target.cloneNode(true) as HTMLElement;
    clonedTarget.setAttribute("data-cabinet-print-target", "true");
    clonedTarget.querySelectorAll(".cabinet-print-hidden").forEach((element) => element.remove());
    clonedTarget.querySelectorAll("[hidden]").forEach((element) => element.removeAttribute("hidden"));

    const documentStyles = Array.from(document.querySelectorAll("link[rel='stylesheet'], style"))
      .map((node) => node.outerHTML)
      .join("\n");

    printWindow.document.open();
    printWindow.document.write(`<!doctype html>
<html lang="zh-Hant">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${pdfDocumentTitle}</title>
    ${documentStyles}
    <style>
      @page { size: A4 portrait; margin: 10mm 8mm; }
      html, body {
        width: 194mm;
        margin: 0;
        background: #ffffff;
        color: #020617;
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
      }
      body { padding: 0; }
      [data-cabinet-print-target="true"] {
        box-sizing: border-box;
        width: 194mm;
        max-width: 194mm;
        margin: 0;
        padding: 0;
        background: #ffffff;
      }
      .cabinet-print-title { display: block !important; }
      .cabinet-print-hidden { display: none !important; }
      .overflow-x-auto { overflow: visible !important; }
      table {
        width: 100% !important;
        min-width: 0 !important;
        table-layout: fixed !important;
        border-collapse: collapse !important;
        page-break-inside: auto;
      }
      [data-cabinet-print-target="true"] th {
        font-size: 10pt !important;
        line-height: 1.25 !important;
      }
      [data-cabinet-print-target="true"] td {
        font-size: 10pt !important;
        line-height: 1.28 !important;
        white-space: normal !important;
      }
      [data-cabinet-print-target="true"] .cabinet-result-section,
      [data-cabinet-print-target="true"] .cabinet-result-section-body,
      [data-cabinet-print-target="true"] table,
      [data-cabinet-print-target="true"] tbody,
      [data-cabinet-print-target="true"] tr {
        overflow: visible !important;
        break-inside: auto;
        page-break-inside: auto;
      }
      [data-cabinet-print-target="true"] .cabinet-result-section-header,
      [data-cabinet-print-target="true"] thead {
        break-after: avoid;
        page-break-after: avoid;
      }
      .rounded-md, .rounded-lg { border-radius: 0 !important; }
      .shadow, .shadow-sm, .shadow-md, .shadow-lg { box-shadow: none !important; }
      @media screen {
        body {
          width: auto;
          min-height: 100vh;
          padding: 24px;
          background: #f8fafc;
        }
        [data-cabinet-print-target="true"] {
          margin: 0 auto;
          padding: 10mm;
          border: 1px solid #d8dee9;
          background: #ffffff;
        }
      }
      ${PROJECT_MATERIAL_SUMMARY_PRINT_CSS}
    </style>
  </head>
  <body>${clonedTarget.outerHTML}</body>
</html>`);
    printWindow.document.close();
    printWindow.focus();
    printWindow.setTimeout(() => {
      printWindow.print();
    }, 350);
  }, [pdfDocumentTitle]);

  if (cabinetGroups.length === 0 || rowCount === 0) {
    return (
      <div className="rounded border bg-muted/20 p-4 text-sm text-muted-foreground">
        尚無可統整的系統櫃材料明細。
      </div>
    );
  }

  let sectionNumber = 0;

  return (
    <div className="min-w-0 space-y-4">
      <div className="cabinet-print-hidden flex flex-wrap items-center justify-between gap-3 rounded-md border bg-muted/20 px-4 py-3">
        <div>
          <h3 className="text-sm font-semibold">本專案材料統整</h3>
          <p className="mt-1 text-xs text-muted-foreground">
            依估價名稱分組彙整本專案所有系統櫃估價的板材才數、五金與加工費。
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right">
            <p className="text-xs text-muted-foreground">{cabinetGroups.length} 份估價 / {rowCount} 筆明細</p>
            <p className="text-lg font-bold text-primary">{formatCurrency(grandTotal)}</p>
          </div>
          <Button type="button" variant="outline" size="sm" onClick={printProject}>
            <Printer className="h-4 w-4" />
            匯出專案PDF
          </Button>
        </div>
      </div>

      <div className="cabinet-print-hidden flex flex-wrap items-center justify-end gap-2">
        <button
          type="button"
          className="rounded-md border px-3 py-1.5 text-xs font-medium hover:bg-muted/50"
          onClick={() => setCollapseCommand((current) => ({ action: "expand", version: current.version + 1 }))}
        >
          全部展開
        </button>
        <button
          type="button"
          className="rounded-md border px-3 py-1.5 text-xs font-medium hover:bg-muted/50"
          onClick={() => setCollapseCommand((current) => ({ action: "collapse", version: current.version + 1 }))}
        >
          全部摺疊
        </button>
      </div>

      <div ref={printRef} className="cabinet-print-area space-y-4">
        <ProjectPrintTitle projectInfo={projectInfo} grandTotal={grandTotal} />

        {cabinetGroups.map((group) => {
          const estimateSectionNumber = ++sectionNumber;
          return (
          <SummarySection
            key={group.id}
            sectionNumber={estimateSectionNumber}
            title={group.label}
            subtitle={`${group.summary.unitSummaries.length} 個桶身`}
            total={group.totalCost}
            command={collapseCommand}
          >
            <div className="space-y-4">
              {group.summary.unitSummaries.map((unit, unitIndex) => {
                const unitSectionPrefix = projectUnitSectionPrefix(estimateSectionNumber, unitIndex);
                return (
                <div key={unit.unitId} className="space-y-2">
                  <div className="flex flex-wrap items-baseline justify-between gap-3 border-b pb-1">
                    <h4 className="text-sm font-semibold text-slate-900">{unitSectionPrefix}. {unit.unitName}</h4>
                    <span className="text-sm font-semibold text-primary">{formatCurrency(rowsTotal(unit.rows))}</span>
                  </div>
                  <MaterialDetailTable rows={unit.rows} sectionNumber={unitSectionPrefix} />
                </div>
                );
              })}
              <SummaryTotalsBlock
                rows={group.summary.unitSummaries.flatMap((unit) => unit.rows)}
                materialCaiTotals={group.summary.materialCaiTotals}
                hardwareRows={group.summary.hardwareRows}
                processRows={group.summary.processRows}
                total={group.summary.total}
                layout="stacked"
              />
            </div>
          </SummarySection>
          );
        })}

        <SummarySection sectionNumber={++sectionNumber} title="本專案總計" total={grandTotal} command={collapseCommand}>
          <SummaryTotalsBlock
            rows={projectSummary.rows}
            materialCaiTotals={projectSummary.materialCaiTotals}
            hardwareRows={projectSummary.hardwareRows}
            processRows={projectSummary.processRows}
            total={grandTotal}
            layout="stacked"
          />
        </SummarySection>
      </div>
    </div>
  );
}
