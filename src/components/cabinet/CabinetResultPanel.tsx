"use client";

import { Fragment, useEffect, useState, type ReactNode } from "react";
import { ChevronDown } from "lucide-react";
import type { CabinetUnitResult, DoorResult, HardwareResult, PanelResult } from "@/types";
import { cn, formatCurrency, formatNumber } from "@/lib/utils";
import { AreaDisplay } from "@/components/shared/AreaDisplay";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

interface Props {
  result: CabinetUnitResult;
  highlightedBoardId?: string | null;
}

type BoardRow = PanelResult | DoorResult;

type AreaSummarySource = BoardRow | CabinetUnitResult["accessories"][number];

interface MaterialAreaRow {
  materialName: string;
  cai: number;
  m2: number;
}

interface DisplayProcessRow {
  id: string;
  kind: "process" | "hardware";
  label: string;
  description?: string;
  quantity: number;
  unitCost: number;
  unit?: string;
  quantityUnit?: "cm" | "cai";
  cost: number;
  includedInSubtotal?: boolean;
}

const tableShellClass = "overflow-x-auto rounded-md border";
const headerCellClass = "px-3 py-2 text-xs font-medium text-muted-foreground";
const bodyCellClass = "px-3 py-2 align-top";
const numericCellClass = `${bodyCellClass} text-right tabular-nums whitespace-nowrap`;

interface ResultCollapseCommand {
  action: "expand" | "collapse";
  version: number;
}

function ResultSection({
  sectionNumber,
  title,
  command,
  children,
}: {
  sectionNumber: number;
  title: string;
  command?: ResultCollapseCommand;
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
        <span>{sectionNumber}.{title}</span>
        <ChevronDown className={`h-4 w-4 shrink-0 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && <div className="cabinet-result-section-body px-3 pb-3 pt-3">{children}</div>}
    </section>
  );
}

function unitPrice(row: BoardRow): number {
  return "unitCost" in row ? row.unitCost : row.materialRef?.pricePerUnit ?? 0;
}

function highlightedIds(highlightedBoardId: string | null): string[] {
  return highlightedBoardId ? highlightedBoardId.split("|") : [];
}

function panelProcessCost(row: BoardRow): number {
  return "processes" in row
    ? row.processes.reduce((acc, process) => acc + (process.includedInSubtotal ? process.cost : 0), 0)
    : 0;
}

function rowBaseSubtotal(row: BoardRow): number {
  return row.subtotal - panelProcessCost(row);
}

function processLabel(label: string): string {
  return `加工-${label.replace(": ", ":")}`;
}

function formatQuantity(quantity: number): string {
  return Number.isInteger(quantity) ? formatNumber(quantity, 0) : formatNumber(quantity, 2);
}

function isCmBasedHandleProcess(id: string, unitCost: number): boolean {
  if (unitCost >= 100) return false;
  return (
    id.includes("-front-handle-processing") ||
    (id.includes("-profile-handle") && !id.includes("-profile-handle-modification") && !id.includes("-profile-handle-baked-paint"))
  );
}

function processLabelWithPerPieceQuantity(label: string, processQuantity: number, parentQuantity: number, quantityUnit?: "cm" | "cai"): string {
  if (quantityUnit === "cai") return `${label}(X1)`;
  if (parentQuantity <= 0) return label;
  const perPieceQuantity = processQuantity / parentQuantity;
  if (perPieceQuantity < 1) return label;
  return `${label}(X${formatQuantity(perPieceQuantity)}${quantityUnit ?? ""})`;
}

function isCaiBasedProcess(id: string): boolean {
  return id.includes("-double-drill-holes") || id.includes("-non-standard-holes");
}

function isDrawerPanel(row: PanelResult): boolean {
  const drawerPanelSuffixes = ["-front-panel", "-side-panels", "-front-back-panels", "-bottom-panel"];
  return row.name.includes("\u62bd\u5c5c") || row.id.includes("drawer") || drawerPanelSuffixes.some((suffix) => row.id.endsWith(suffix));
}

function isDrawerHardware(row: HardwareResult): boolean {
  return row.id.endsWith("-rail") || row.name.includes("抽屜");
}

function isProfileHandleProcess(row: HardwareResult): boolean {
  return row.id.includes("-profile-handle");
}

function isDoorHardware(row: HardwareResult): boolean {
  return (
    row.id.includes("-hinge") ||
    row.id.includes("-push-door-hardware") ||
    row.id.includes("-wire-mesh") ||
    row.id.includes("-aluminum-handle") ||
    isProfileHandleProcess(row)
  );
}

function isDoorMaterialHardware(row: HardwareResult): boolean {
  return isDoorHardware(row) && !isProfileHandleProcess(row);
}

function isStandaloneProcessHardware(row: HardwareResult): boolean {
  return row.id.endsWith("-l-turn-cabinet-fee");
}

function attachedDoorRowLabel(row: HardwareResult): string {
  return row.name;
}

function buildDoorAttachedRows(
  hardwareRows: HardwareResult[],
  doors: DoorResult[]
): Record<string, DisplayProcessRow[]> {
  const rowsByDoorId: Record<string, DisplayProcessRow[]> = {};

  for (const row of hardwareRows.filter(isProfileHandleProcess)) {
    const door = doors.find((candidate) => row.id.startsWith(`${candidate.id}-`));
    if (!door) continue;

    rowsByDoorId[door.id] = [
      ...(rowsByDoorId[door.id] ?? []),
      {
        id: row.id,
        kind: isProfileHandleProcess(row) ? "process" : "hardware",
        label: attachedDoorRowLabel(row),
        description: row.description || row.materialRef?.materialName,
        quantity: row.quantity,
        unitCost: row.unitCost,
        unit: row.materialRef?.unit,
        quantityUnit: isCmBasedHandleProcess(row.id, row.unitCost) ? "cm" : undefined,
        cost: row.subtotal,
      },
    ];
  }

  return rowsByDoorId;
}

function BoardNameCell({ row, displayIndex }: { row: BoardRow; displayIndex: string }) {
  return (
    <div className="cabinet-board-name-cell min-w-0 space-y-1">
      <div className="flex min-w-0 flex-wrap items-baseline gap-1.5">
        <span className="cabinet-board-index shrink-0 text-sm font-semibold text-blue-700">{displayIndex}</span>
        <span className="cabinet-board-title min-w-0 break-words text-sm font-semibold text-slate-950">{row.name}</span>
      </div>
      <div className="cabinet-board-material break-words text-sm font-medium text-slate-800">
        {row.materialRef?.materialName ?? <span className="text-orange-600">未選材料</span>}
      </div>
    </div>
  );
}

function BoardTable({
  sectionNumber,
  title,
  rows,
  processRowsByRowId = {},
  highlightedBoardId = null,
  showPanelProcesses = true,
  collapseCommand,
}: {
  sectionNumber: number;
  title: string;
  rows: BoardRow[];
  processRowsByRowId?: Record<string, DisplayProcessRow[]>;
  highlightedBoardId?: string | null;
  showPanelProcesses?: boolean;
  collapseCommand?: ResultCollapseCommand;
}) {
  if (rows.length === 0) return null;
  const activeHighlightedIds = highlightedIds(highlightedBoardId);

  return (
    <ResultSection sectionNumber={sectionNumber} title={title} command={collapseCommand}>
      <div className={tableShellClass}>
        <table className="cabinet-board-table w-full min-w-[700px] table-fixed text-sm">
          <colgroup>
            <col className="cabinet-name-col w-[38%]" />
            <col className="cabinet-size-col w-[112px]" />
            <col className="cabinet-qty-col w-[64px]" />
            <col className="cabinet-area-col w-[92px]" />
            <col className="cabinet-price-col w-[104px]" />
            <col className="cabinet-subtotal-col w-[104px]" />
          </colgroup>
          <thead className="bg-muted/40">
            <tr className="border-b">
              <th className={`${headerCellClass} text-left`}>名稱 / 材料</th>
              <th className={`${headerCellClass} text-right`}>尺寸(cm)</th>
              <th className={`${headerCellClass} text-right`}>數量</th>
              <th className={`${headerCellClass} text-right`}>才數</th>
              <th className={`${headerCellClass} text-right`}>單價</th>
              <th className={`${headerCellClass} text-right`}>小計</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, rowIndex) => {
              const panelProcesses: DisplayProcessRow[] = showPanelProcesses && "processes" in row
                ? row.processes.map((process) => ({
                    id: process.id,
                    kind: "process" as const,
                    label: process.label,
                    quantity: process.quantity,
                    unitCost: process.unitCost,
                    quantityUnit: isCaiBasedProcess(process.id)
                      ? "cai"
                      : isCmBasedHandleProcess(process.id, process.unitCost)
                        ? "cm"
                        : undefined,
                    cost: process.cost,
                    includedInSubtotal: process.includedInSubtotal,
                  }))
                : [];
              const displayProcesses = [...panelProcesses, ...(processRowsByRowId[row.id] ?? [])];

              return (
                <Fragment key={row.id}>
                  <tr
                    className={cn(
                      rowIndex === 0 ? "border-t border-slate-200" : "border-t-2 border-slate-300",
                      "border-b border-slate-200 bg-muted/10 transition-colors hover:bg-muted/25",
                      activeHighlightedIds.includes(row.id) &&
                        "border-l-4 border-l-primary bg-primary/10 shadow-[inset_0_0_0_1px_hsl(var(--primary)/0.18)]"
                    )}
                  >
                    <td className={`${bodyCellClass} min-w-0`}>
                      <BoardNameCell row={row} displayIndex={`${sectionNumber}-${rowIndex + 1}`} />
                    </td>
                    <td className={numericCellClass}>{formatNumber(row.widthCm, 1)} x {formatNumber(row.heightCm, 1)}</td>
                    <td className={numericCellClass}>{row.quantity}</td>
                    <td className={numericCellClass}>
                      <AreaDisplay area={row.totalArea} />
                      {row.billableTotalArea.cai > row.totalArea.cai && (
                        <span className="block text-[11px] text-orange-600">
                          計價 <AreaDisplay area={row.billableTotalArea} />
                        </span>
                      )}
                    </td>
                    <td className={numericCellClass}>
                      {row.materialRef ? (
                        <>
                          {formatCurrency(unitPrice(row))}
                          <span className="text-muted-foreground">/{row.materialRef.unit}</span>
                        </>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </td>
                    <td className={`${numericCellClass} font-semibold`}>{formatCurrency(rowBaseSubtotal(row))}</td>
                  </tr>
                  {displayProcesses.map((process) => (
                    <tr
                      key={process.id}
                      className={cn(
                        "border-b border-slate-100 bg-background transition-colors hover:bg-muted/10",
                        activeHighlightedIds.includes(row.id) && "bg-primary/5"
                      )}
                    >
                      <td className={`${bodyCellClass} pl-7`}>
                        <div className="cabinet-process-label text-xs font-medium text-muted-foreground">
                          {process.kind === "process" ? `- ${processLabelWithPerPieceQuantity(process.label, process.quantity, row.quantity, process.quantityUnit)}` : `- \u4e94\u91d1-${process.label}`}
                        </div>
                        <div className="cabinet-secondary-text break-words text-xs text-muted-foreground">
                          {process.kind === "process" ? "" : process.description ?? "門片五金"}
                        </div>
                      </td>
                      <td className={numericCellClass}>-</td>
                      <td className={numericCellClass}>{formatQuantity(process.quantity)}</td>
                      <td className={numericCellClass}>-</td>
                      <td className={numericCellClass}>
                        {process.includedInSubtotal === false && process.cost === 0 ? "-" : formatCurrency(process.unitCost)}
                        {process.unit && <span className="text-muted-foreground">/{process.unit}</span>}
                      </td>
                      <td className={`${numericCellClass} font-semibold`}>
                        {process.includedInSubtotal === false && process.cost === 0 ? "-" : formatCurrency(process.cost)}
                      </td>
                    </tr>
                  ))}
                </Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
    </ResultSection>
  );
}

function HardwareTable({
  sectionNumber,
  title,
  rows,
  collapseCommand,
}: {
  sectionNumber: number;
  title: string;
  rows: HardwareResult[];
  collapseCommand?: ResultCollapseCommand;
}) {
  if (rows.length === 0) return null;

  return (
    <ResultSection sectionNumber={sectionNumber} title={title} command={collapseCommand}>
      <div className={tableShellClass}>
        <table className="cabinet-hardware-table w-full min-w-[520px] table-fixed text-sm">
          <colgroup>
            <col className="w-[52%]" />
            <col className="w-[72px]" />
            <col className="w-[116px]" />
            <col className="w-[104px]" />
          </colgroup>
          <thead className="bg-muted/40">
            <tr className="border-b">
              <th className={`${headerCellClass} text-left`}>名稱 / 說明</th>
              <th className={`${headerCellClass} text-right`}>數量</th>
              <th className={`${headerCellClass} text-right`}>單價</th>
              <th className={`${headerCellClass} text-right`}>小計</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((hardware, rowIndex) => (
              <tr key={hardware.id} className="border-b border-muted/50 hover:bg-muted/20">
                <td className={`${bodyCellClass} min-w-0`}>
                  <div className="flex min-w-0 items-center gap-1.5">
                    <span className="cabinet-board-index shrink-0 font-medium text-blue-700">{sectionNumber}-{rowIndex + 1}</span>
                    <span className="cabinet-board-title min-w-0 break-words font-medium">{hardware.materialRef?.materialName ?? hardware.name}</span>
                  </div>
                  <div className="cabinet-secondary-text break-words text-xs text-muted-foreground">
                    {hardware.description || hardware.name || "-"}
                  </div>
                </td>
                <td className={numericCellClass}>{hardware.quantity}</td>
                <td className={numericCellClass}>
                  {hardware.unitCost > 0 ? (
                    <>
                      {formatCurrency(hardware.unitCost)}
                      {hardware.materialRef && <span className="text-muted-foreground">/{hardware.materialRef.unit}</span>}
                    </>
                  ) : (
                    <span className="text-muted-foreground">-</span>
                  )}
                </td>
                <td className={`${numericCellClass} font-semibold`}>{formatCurrency(hardware.subtotal)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </ResultSection>
  );
}

function buildMaterialAreaRows(result: CabinetUnitResult): MaterialAreaRow[] {
  const rows = [
    ...result.panels,
    ...result.internalParts,
    ...result.doors,
    ...result.accessories,
  ] satisfies AreaSummarySource[];
  const grouped = new Map<string, MaterialAreaRow>();

  for (const row of rows) {
    const materialName = row.materialRef?.materialName ?? "未選材料";
    const current = grouped.get(materialName) ?? { materialName, cai: 0, m2: 0 };
    current.cai += row.totalArea.cai;
    current.m2 += row.totalArea.m2;
    grouped.set(materialName, current);
  }

  return Array.from(grouped.values()).sort((a, b) => b.cai - a.cai);
}

function MaterialAreaSummary({ rows }: { rows: MaterialAreaRow[] }) {
  if (rows.length === 0) {
    return <p className="text-sm text-muted-foreground">尚無板材面積</p>;
  }

  return (
    <div className="space-y-2">
      {rows.map((row, index) => (
        <div key={row.materialName} className="grid grid-cols-[1fr_auto] gap-3 border-b border-slate-100 pb-1 last:border-b-0 last:pb-0">
          <span className="break-words text-sm font-medium text-slate-800">
            <span className="cabinet-board-index mr-1 font-semibold text-blue-700">{index + 1}.</span>
            {row.materialName}
          </span>
          <span className="whitespace-nowrap text-right text-sm font-semibold text-slate-950">
            {formatNumber(row.cai, 2)} 才
          </span>
        </div>
      ))}
    </div>
  );
}

function SummaryCards({ result, printMode = false }: { result: CabinetUnitResult; printMode?: boolean }) {
  const materialAreaRows = buildMaterialAreaRows(result);
  const { summary } = result;

  return (
    <div className={cn("grid grid-cols-1 gap-3", !printMode && "sm:grid-cols-2")}>
      <Card className="bg-muted/30">
        <CardContent className="p-3">
          <p className="mb-2 text-xs text-muted-foreground">板材型號面積統計</p>
          <MaterialAreaSummary rows={materialAreaRows} />
        </CardContent>
      </Card>
      {!printMode && (
        <Card className="bg-primary/5">
          <CardContent className="flex h-full min-h-[104px] flex-col p-3">
            <p className="text-xs text-muted-foreground">估算總價</p>
            <div className="flex flex-1 items-center justify-center">
              <p className="text-[39px] font-bold leading-none text-primary">{formatCurrency(summary.totalCost)}</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export function CabinetResultPanel({ result, highlightedBoardId = null }: Props) {
  const { summary } = result;
  const [resultCollapseCommand, setResultCollapseCommand] = useState<ResultCollapseCommand>({ action: "expand", version: 0 });
  const drawerPanels = result.internalParts.filter(isDrawerPanel);
  const internalParts = result.internalParts.filter((row) => !isDrawerPanel(row));
  const drawerHardware = result.hardware.filter(isDrawerHardware);
  const doorHardware = result.hardware.filter(isDoorMaterialHardware);
  const doorAttachedRowsByDoorId = buildDoorAttachedRows(result.hardware, result.doors);
  const standaloneProcessRows = result.hardware.filter(isStandaloneProcessHardware);
  const otherHardware = result.hardware.filter((row) => !isDrawerHardware(row) && !isDoorHardware(row) && !isStandaloneProcessHardware(row));
  let sectionNumber = 0;
  const bodyPanelsSection = result.panels.length > 0 ? ++sectionNumber : 0;
  const bodyProcessSection = standaloneProcessRows.length > 0 ? ++sectionNumber : 0;
  const internalPartsSection = internalParts.length > 0 ? ++sectionNumber : 0;
  const drawerPanelsSection = drawerPanels.length > 0 ? ++sectionNumber : 0;
  const drawerHardwareSection = drawerHardware.length > 0 ? ++sectionNumber : 0;
  const doorsSection = result.doors.length > 0 ? ++sectionNumber : 0;
  const doorHardwareSection = doorHardware.length > 0 ? ++sectionNumber : 0;
  const otherHardwareSection = otherHardware.length > 0 ? ++sectionNumber : 0;
  const accessoriesSection = result.accessories.length > 0 ? ++sectionNumber : 0;

  return (
    <div className="space-y-4">
      <div className="cabinet-print-hidden">
        <SummaryCards result={result} />
      </div>

      <div className="cabinet-print-hidden flex flex-wrap items-center justify-end gap-2">
        <button
          type="button"
          className="rounded-md border px-3 py-1.5 text-xs font-medium hover:bg-muted/50"
          onClick={() => setResultCollapseCommand((current) => ({ action: "expand", version: current.version + 1 }))}
        >
          全部展開
        </button>
        <button
          type="button"
          className="rounded-md border px-3 py-1.5 text-xs font-medium hover:bg-muted/50"
          onClick={() => setResultCollapseCommand((current) => ({ action: "collapse", version: current.version + 1 }))}
        >
          全部摺疊
        </button>
      </div>

      <div className="space-y-5">
        <BoardTable sectionNumber={bodyPanelsSection} title="桶身板材" rows={result.panels} highlightedBoardId={highlightedBoardId} collapseCommand={resultCollapseCommand} />
        <HardwareTable sectionNumber={bodyProcessSection} title="桶身加工" rows={standaloneProcessRows} collapseCommand={resultCollapseCommand} />
        <BoardTable sectionNumber={internalPartsSection} title="內部構件（中立板 / 櫃內層板）" rows={internalParts} collapseCommand={resultCollapseCommand} />

        {(drawerPanels.length > 0 || drawerHardware.length > 0) && (
          <div className="space-y-3">
            <BoardTable sectionNumber={drawerPanelsSection} title="抽屜板材" rows={drawerPanels} collapseCommand={resultCollapseCommand} />
            <HardwareTable sectionNumber={drawerHardwareSection} title="抽屜五金" rows={drawerHardware} collapseCommand={resultCollapseCommand} />
          </div>
        )}

        {result.doors.length > 0 && (
          <div className="space-y-3">
            <BoardTable sectionNumber={doorsSection} title="門片" rows={result.doors} processRowsByRowId={doorAttachedRowsByDoorId} collapseCommand={resultCollapseCommand} />
            <HardwareTable sectionNumber={doorHardwareSection} title="門片五金" rows={doorHardware} collapseCommand={resultCollapseCommand} />
          </div>
        )}

        <HardwareTable sectionNumber={otherHardwareSection} title="五金 / 另料" rows={otherHardware} collapseCommand={resultCollapseCommand} />

        {result.accessories.length > 0 && (
          <ResultSection sectionNumber={accessoriesSection} title="配件" command={resultCollapseCommand}>
            <div className={tableShellClass}>
              <table className="w-full min-w-[480px] table-fixed text-sm">
                <colgroup>
                  <col className="w-[44%]" />
                  <col className="w-[128px]" />
                  <col className="w-[72px]" />
                  <col className="w-[104px]" />
                </colgroup>
                <tbody>
                  {result.accessories.map((accessory, rowIndex) => (
                    <tr key={accessory.id} className="border-b border-muted/50 hover:bg-muted/20">
                      <td className={`${bodyCellClass} font-medium`}>
                        <div className="flex min-w-0 items-center gap-1.5">
                          <span className="cabinet-board-index shrink-0 text-blue-700">{accessoriesSection}-{rowIndex + 1}</span>
                          <span className="cabinet-board-title min-w-0 break-words">{accessory.name}</span>
                        </div>
                      </td>
                      <td className={numericCellClass}>{accessory.widthCm} x {accessory.heightCm} cm</td>
                      <td className={numericCellClass}>{accessory.quantity}</td>
                      <td className={`${numericCellClass} font-semibold`}>{formatCurrency(accessory.subtotal)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </ResultSection>
        )}
      </div>

      <Separator />
      <div className="space-y-1 text-sm">
        <div className="flex justify-between text-muted-foreground">
          <span>桶身板材</span><span>{formatCurrency(summary.boardBodyCost)}</span>
        </div>
        {summary.boardBackingCost > 0 && (
          <div className="flex justify-between text-muted-foreground">
            <span>背板</span><span>{formatCurrency(summary.boardBackingCost)}</span>
          </div>
        )}
        {summary.boardDoorCost > 0 && (
          <div className="flex justify-between text-muted-foreground">
            <span>門片</span><span>{formatCurrency(summary.boardDoorCost)}</span>
          </div>
        )}
        {summary.hardwareCost > 0 && (
          <div className="flex justify-between text-muted-foreground">
            <span>五金</span><span>{formatCurrency(summary.hardwareCost)}</span>
          </div>
        )}
        {summary.addonsCost > 0 && (
          <div className="flex justify-between text-muted-foreground">
            <span>加工費</span><span>{formatCurrency(summary.addonsCost)}</span>
          </div>
        )}
        <Separator />
        <div className="flex justify-between text-base font-bold">
          <span>總計</span>
          <span className="text-primary">{formatCurrency(summary.totalCost)}</span>
        </div>
      </div>
      <div className="hidden cabinet-print-title print-summary pt-2">
        <SummaryCards result={result} printMode />
      </div>
    </div>
  );
}
