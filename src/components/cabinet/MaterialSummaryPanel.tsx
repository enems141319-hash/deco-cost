"use client";

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { ChevronDown, Printer } from "lucide-react";
import { calculateCabinetProject } from "@/lib/calculations/cabinet";
import { buildCabinetProjectMaterialSummary } from "@/lib/calculations/material-summary";
import { formatCurrency } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  MaterialDetailTable,
  SummaryTotalsBlock,
} from "@/components/shared/MaterialSummaryTables";
import type { MaterialSummaryRow } from "@/lib/calculations/material-summary";
import type { CabinetUnitInput } from "@/types";
import type { CabinetPrintProjectInfo } from "./CabinetUnitForm";

interface Props {
  units: CabinetUnitInput[];
  estimateLabel?: string;
  projectInfo?: CabinetPrintProjectInfo;
}

interface SummaryCollapseCommand {
  action: "expand" | "collapse";
  version: number;
}

function rowsTotal(rows: MaterialSummaryRow[]): number {
  return rows.reduce((sum, row) => sum + (row.subtotal ?? 0), 0);
}

function SummarySection({
  sectionNumber,
  title,
  subtitle,
  total,
  command,
  children,
}: {
  sectionNumber: number;
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
        <span className="min-w-0 truncate">{sectionNumber}.{title}</span>
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

export function MaterialSummaryPanel({ units, estimateLabel, projectInfo }: Props) {
  const summaryPrintRef = useRef<HTMLDivElement | null>(null);
  const summary = buildCabinetProjectMaterialSummary(calculateCabinetProject(units), units);
  const rowCount = summary.unitSummaries.reduce((acc, unit) => acc + unit.rows.length, 0);
  const [summaryCollapseCommand, setSummaryCollapseCommand] = useState<SummaryCollapseCommand>({ action: "expand", version: 0 });
  const printTitle = [estimateLabel?.trim(), "材料統整表"].filter(Boolean).join(" - ");
  const pdfDocumentTitle = [projectInfo?.name?.trim(), printTitle].filter(Boolean).join(" - ");
  const projectClientLabel = [projectInfo?.clientName, projectInfo?.clientTitle].filter(Boolean).join("");
  const projectInfoRows = [
    { label: "專案名稱", value: projectInfo?.name },
    { label: "業主", value: projectClientLabel },
    { label: "專案地址", value: projectInfo?.address },
    { label: "業主電話", value: projectInfo?.clientPhone },
    { label: "Line ID", value: projectInfo?.clientLineId },
    { label: "設計師", value: projectInfo?.designerName },
    { label: "設計師電話", value: projectInfo?.designerPhone },
  ].filter((row) => row.value);
  let sectionNumber = 0;

  const printSummary = useCallback(() => {
    const target = summaryPrintRef.current;
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

      [data-cabinet-print-target="true"] td:nth-child(2),
      [data-cabinet-print-target="true"] td:nth-child(3),
      [data-cabinet-print-target="true"] td:nth-child(4),
      [data-cabinet-print-target="true"] td:nth-child(5),
      [data-cabinet-print-target="true"] td:nth-child(6) {
        font-size: 10pt !important;
        line-height: 1.22 !important;
        white-space: nowrap !important;
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

  if (rowCount === 0) {
    return (
      <div className="rounded border bg-muted/20 p-4 text-sm text-muted-foreground">
        目前沒有可統整的材料明細
      </div>
    );
  }

  return (
    <div className="min-w-0 rounded border bg-background">
      <div className="cabinet-print-hidden flex items-center justify-between border-b px-4 py-3">
        <div>
          <h3 className="text-sm font-semibold">材料統整表</h3>
          <p className="mt-1 text-xs text-muted-foreground">
            依桶身彙整所有板材、加工與五金，編號方式對齊即時運算表。
          </p>
        </div>
        <div className="text-right">
          <p className="text-xs text-muted-foreground">{rowCount} 筆明細</p>
          <p className="font-semibold text-primary">{formatCurrency(summary.total)}</p>
        </div>
      </div>

      <div className="min-w-0 space-y-4 p-4">
        <div className="flex flex-wrap items-center justify-end gap-2">
          <button
            type="button"
            className="rounded-md border px-3 py-1.5 text-xs font-medium hover:bg-muted/50"
            onClick={() => setSummaryCollapseCommand((current) => ({ action: "expand", version: current.version + 1 }))}
          >
            全部展開
          </button>
          <button
            type="button"
            className="rounded-md border px-3 py-1.5 text-xs font-medium hover:bg-muted/50"
            onClick={() => setSummaryCollapseCommand((current) => ({ action: "collapse", version: current.version + 1 }))}
          >
            全部摺疊
          </button>
          <Button type="button" variant="outline" size="sm" onClick={printSummary}>
            <Printer className="h-4 w-4" />
            匯出PDF
          </Button>
        </div>

        <div ref={summaryPrintRef} className="cabinet-print-area space-y-4">
          <div className="hidden cabinet-print-title mb-4 border-b pb-3">
            {projectInfoRows.length > 0 && (
              <section className="grid grid-cols-3 gap-x-4 gap-y-2 text-[12px] leading-snug">
                {projectInfoRows.map((row) => (
                  <div key={row.label} className="min-w-0">
                    <p className="text-[10px] font-semibold tracking-[0.16em] text-muted-foreground">{row.label}</p>
                    <p className="mt-0.5 break-words text-foreground">{row.value}</p>
                  </div>
                ))}
              </section>
            )}
            <h1 className="mt-3 text-xl font-bold">{printTitle}</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              桶身數量：{summary.unitSummaries.length} / 明細 {rowCount} 筆
            </p>
          </div>

          {summary.unitSummaries.map((unit) => {
            const input = units.find((item) => item.id === unit.unitId);
            return (
              <SummarySection
                key={unit.unitId}
                sectionNumber={++sectionNumber}
                title={unit.unitName}
                subtitle={input ? `${input.widthCm} x ${input.depthCm} x ${input.heightCm} cm / 數量 ${input.quantity}` : undefined}
                total={rowsTotal(unit.rows)}
                command={summaryCollapseCommand}
              >
                <MaterialDetailTable rows={unit.rows} sectionNumber={sectionNumber} />
              </SummarySection>
            );
          })}

          <SummarySection sectionNumber={++sectionNumber} title="總計" total={summary.total} command={summaryCollapseCommand}>
            <SummaryTotalsBlock
              rows={summary.unitSummaries.flatMap((unit) => unit.rows)}
              materialCaiTotals={summary.materialCaiTotals}
              hardwareRows={summary.hardwareRows}
              processRows={summary.processRows}
              total={summary.total}
            />
          </SummarySection>
        </div>
      </div>
    </div>
  );
}
