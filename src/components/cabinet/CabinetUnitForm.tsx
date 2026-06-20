// src/components/cabinet/CabinetUnitForm.tsx
"use client";

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { flushSync } from "react-dom";
import { Archive, Box, ChevronDown, DoorOpen, Printer, Wrench, type LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { MaterialDropdown } from "@/components/shared/MaterialDropdown";
import { ZhengdaoBoardMaterialPicker } from "@/components/shared/ZhengdaoBoardMaterialPicker";
import { DoorForm } from "./DoorForm";
import { DrawerForm } from "./DrawerForm";
import { HardwareItemsForm } from "./HardwareItemsForm";
import { InternalPartsForm } from "./InternalPartsForm";
import { KickPlateForm } from "./KickPlateForm";
import { ZhengdaoPartitionDoorsForm } from "./ZhengdaoPartitionDoorsForm";
import { CabinetResultPanel } from "./CabinetResultPanel";
import { UnitAddonsForm } from "./UnitAddonsForm";
import { calculateCabinetUnit } from "@/lib/calculations/cabinet";
import { DEFAULT_UNIT_ADDONS, type CabinetUnitInput, type CabinetUnitResult, type LTurnCabinetPosition } from "@/types";
import { UNIT_CONFIG } from "@/lib/config/units";
import type { CabinetVendor } from "@/types/vendor";

interface Props {
  unit: CabinetUnitInput;
  estimateLabel?: string;
  projectInfo?: CabinetPrintProjectInfo;
  onChange: (unit: CabinetUnitInput) => void;
  onResult?: (result: CabinetUnitResult) => void;
  vendor?: CabinetVendor;
}

const MIN_INPUT_WIDTH_PCT = 30;
const MAX_INPUT_WIDTH_PCT = 70;

export interface CollapseCommand {
  action: "expand" | "collapse";
  version: number;
}

export interface CabinetPrintProjectInfo {
  name: string;
  address?: string | null;
  clientName?: string | null;
  clientTitle?: string | null;
  clientPhone?: string | null;
  clientLineId?: string | null;
  designerName?: string | null;
  designerPhone?: string | null;
}

function CollapsibleSection({
  title,
  icon: Icon,
  defaultOpen = false,
  command,
  children,
}: {
  title: string;
  icon: LucideIcon;
  defaultOpen?: boolean;
  command?: CollapseCommand;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);

  useEffect(() => {
    if (!command) return;
    setOpen(command.action === "expand");
  }, [command]);

  return (
    <section className="overflow-hidden rounded-md border border-blue-200 bg-background">
      <button
        type="button"
        className="flex w-full items-center justify-between gap-3 bg-blue-600 px-4 py-3 text-left text-sm font-semibold text-white transition-colors hover:bg-blue-700"
        onClick={() => setOpen((next) => !next)}
      >
        <span className="flex min-w-0 items-center gap-2.5">
          <span className="grid h-7 w-7 shrink-0 place-items-center rounded bg-white/15">
            <Icon className="h-4 w-4" />
          </span>
          <span className="truncate">{title}</span>
        </span>
        <ChevronDown className={`h-4 w-4 shrink-0 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && <div className="space-y-4 border-t p-3">{children}</div>}
    </section>
  );
}

function lTurnCutoutRect(params: {
  position: LTurnCabinetPosition;
  outerWidth: number;
  outerDepth: number;
  cutoutWidth: number;
  cutoutDepth: number;
}) {
  const { position, outerWidth, outerDepth, cutoutWidth, cutoutDepth } = params;
  const x = position === "rightTop" || position === "rightBottom" ? outerWidth - cutoutWidth : 0;
  const y = position === "rightBottom" || position === "leftBottom" ? outerDepth - cutoutDepth : 0;
  return { x, y, width: cutoutWidth, height: cutoutDepth };
}

function lTurnPath(params: {
  position: LTurnCabinetPosition;
  outerWidth: number;
  outerDepth: number;
  cutoutWidth: number;
  cutoutDepth: number;
}): string {
  const { outerWidth, outerDepth } = params;
  const cutout = lTurnCutoutRect(params);
  const x1 = cutout.x;
  const y1 = cutout.y;
  const x2 = cutout.x + cutout.width;
  const y2 = cutout.y + cutout.height;

  if (params.position === "rightTop") return `M 0 0 H ${x1} V ${y2} H ${outerWidth} V ${outerDepth} H 0 Z`;
  if (params.position === "rightBottom") return `M 0 0 H ${outerWidth} V ${y1} H ${x1} V ${outerDepth} H 0 Z`;
  if (params.position === "leftTop") return `M ${x2} 0 H ${outerWidth} V ${outerDepth} H 0 V ${y2} H ${x2} Z`;
  return `M 0 0 H ${outerWidth} V ${outerDepth} H ${x2} V ${y1} H 0 Z`;
}

interface LTurnPreviewEdge {
  id: string;
  label: string;
  hoverId?: string;
  kind: "side" | "back" | "kickPlate";
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

function lTurnPreviewEdges(params: {
  unitId: string;
  position: LTurnCabinetPosition;
  outerWidth: number;
  outerDepth: number;
  cutout: { x: number; y: number; width: number; height: number };
  isOpening: boolean;
  hasKickPlate: boolean;
}): LTurnPreviewEdge[] {
  const { unitId, position, outerWidth, outerDepth, cutout, isOpening, hasKickPlate } = params;
  const x1 = cutout.x;
  const y1 = cutout.y;
  const x2 = cutout.x + cutout.width;
  const y2 = cutout.y + cutout.height;
  const isRight = position === "rightTop" || position === "rightBottom";
  const isBottom = position === "rightBottom" || position === "leftBottom";

  const sideWidthEdge: LTurnPreviewEdge = {
    id: `${unitId}-l-turn-side-width`,
    label: "L轉側板-寬向",
    kind: "side",
    x1: isRight ? 0 : x2,
    y1: isBottom ? outerDepth : 0,
    x2: isRight ? x1 : outerWidth,
    y2: isBottom ? outerDepth : 0,
  };

  const sideDepthEdge: LTurnPreviewEdge = {
    id: `${unitId}-l-turn-side-depth`,
    label: "L轉側板-深向",
    kind: "side",
    x1: isRight ? outerWidth : 0,
    y1: isBottom ? 0 : y2,
    x2: isRight ? outerWidth : 0,
    y2: isBottom ? y1 : outerDepth,
  };

  const backWidthEdge: LTurnPreviewEdge = isOpening
    ? {
        id: `${unitId}-l-turn-back-width`,
        label: "L轉背板-寬向",
        kind: "back",
        x1: 0,
        y1: isBottom ? 0 : outerDepth,
        x2: outerWidth,
        y2: isBottom ? 0 : outerDepth,
      }
    : {
        id: `${unitId}-l-turn-back-width`,
        label: "L轉背板-寬向",
        kind: "back",
        x1: isRight ? x1 : 0,
        y1: isBottom ? y1 : y2,
        x2: isRight ? outerWidth : x2,
        y2: isBottom ? y1 : y2,
      };

  const backDepthEdge: LTurnPreviewEdge = isOpening
    ? {
        id: `${unitId}-l-turn-back-depth`,
        label: "L轉背板-深向",
        kind: "back",
        x1: isRight ? 0 : outerWidth,
        y1: 0,
        x2: isRight ? 0 : outerWidth,
        y2: outerDepth,
      }
    : {
        id: `${unitId}-l-turn-back-depth`,
        label: "L轉背板-深向",
        kind: "back",
        x1: isRight ? x1 : x2,
        y1: isBottom ? y1 : 0,
        x2: isRight ? x1 : x2,
        y2: isBottom ? outerDepth : y2,
      };

  const kickPlateWidthId = `${unitId}-kickplate-${isOpening ? "cutout-width" : "outer-width"}`;
  const kickPlateDepthId = `${unitId}-kickplate-${isOpening ? "cutout-depth" : "outer-depth"}`;
  const kickPlateWidthEdge: LTurnPreviewEdge = isOpening
    ? {
        id: kickPlateWidthId,
        label: "L轉踢腳板-寬向",
        kind: "kickPlate",
        x1,
        y1: isBottom ? y1 : y2,
        x2,
        y2: isBottom ? y1 : y2,
      }
    : {
        id: kickPlateWidthId,
        label: "L轉踢腳板-寬向",
        kind: "kickPlate",
        x1: 0,
        y1: isBottom ? 0 : outerDepth,
        x2: outerWidth,
        y2: isBottom ? 0 : outerDepth,
      };
  const kickPlateDepthEdge: LTurnPreviewEdge = isOpening
    ? {
        id: kickPlateDepthId,
        label: "L轉踢腳板-深向",
        kind: "kickPlate",
        x1: isRight ? x1 : x2,
        y1,
        x2: isRight ? x1 : x2,
        y2,
      }
    : {
        id: kickPlateDepthId,
        label: "L轉踢腳板-深向",
        kind: "kickPlate",
        x1: isRight ? 0 : outerWidth,
        y1: 0,
        x2: isRight ? 0 : outerWidth,
        y2: outerDepth,
      };

  const edges = [sideWidthEdge, sideDepthEdge, backWidthEdge, backDepthEdge];
  if (!hasKickPlate) return edges;

  return [
    ...edges,
    kickPlateWidthEdge,
    kickPlateDepthEdge,
  ];
}

function lTurnPreviewEdgeColor(kind: LTurnPreviewEdge["kind"]): string {
  if (kind === "side") return "hsl(var(--primary))";
  if (kind === "back") return "hsl(168 76% 32%)";
  return "hsl(var(--muted-foreground))";
}

function LTurnCabinetPreview({
  unitId,
  cabinetWidthCm,
  cabinetDepthCm,
  position,
  widthMm,
  heightMm,
  isOpening,
  hasKickPlate,
  highlightedBoardId,
  onBoardHover,
}: {
  unitId: string;
  cabinetWidthCm: number;
  cabinetDepthCm: number;
  position: LTurnCabinetPosition;
  widthMm: number;
  heightMm: number;
  isOpening: boolean;
  hasKickPlate: boolean;
  highlightedBoardId: string | null;
  onBoardHover: (boardId: string | null) => void;
}) {
  const outerWidthMm = Math.max(cabinetWidthCm * 10, 1);
  const outerDepthMm = Math.max(cabinetDepthCm * 10, 1);
  const cutoutWidth = Math.min(Math.max(widthMm, 0), outerWidthMm);
  const cutoutDepth = Math.min(Math.max(heightMm, 0), outerDepthMm);
  const cutoutWidthCm = cutoutWidth / 10;
  const cutoutDepthCm = cutoutDepth / 10;
  const viewWidth = 280;
  const viewHeight = 180;
  const padding = 18;
  const scale = Math.min((viewWidth - padding * 2) / outerWidthMm, (viewHeight - padding * 2) / outerDepthMm);
  const drawingWidth = outerWidthMm * scale;
  const drawingHeight = outerDepthMm * scale;
  const offsetX = (viewWidth - drawingWidth) / 2;
  const offsetY = (viewHeight - drawingHeight) / 2;
  const remainingWidthMm = Math.max(outerWidthMm - cutoutWidth, 0);
  const remainingDepthMm = Math.max(outerDepthMm - cutoutDepth, 0);
  const cutout = lTurnCutoutRect({
    position,
    outerWidth: drawingWidth,
    outerDepth: drawingHeight,
    cutoutWidth: cutoutWidth * scale,
    cutoutDepth: cutoutDepth * scale,
  });
  const path = lTurnPath({
    position,
    outerWidth: drawingWidth,
    outerDepth: drawingHeight,
    cutoutWidth: cutoutWidth * scale,
    cutoutDepth: cutoutDepth * scale,
  });
  const dimensionTextClass = "fill-muted-foreground text-[9px]";
  const cutoutTextClass = "fill-destructive text-[9px] font-medium";
  const topSegmentLeft = position === "leftTop" && cutoutWidth > 0 ? cutout.width : 0;
  const topSegmentWidth = position === "leftTop" || position === "rightTop"
    ? Math.max(drawingWidth - cutout.width, 0)
    : drawingWidth;
  const bottomSegmentLeft = position === "leftBottom" && cutoutWidth > 0 ? cutout.width : 0;
  const bottomSegmentWidth = position === "leftBottom" || position === "rightBottom"
    ? Math.max(drawingWidth - cutout.width, 0)
    : drawingWidth;
  const leftSegmentTop = position === "leftTop" && cutoutDepth > 0 ? cutout.height : 0;
  const leftSegmentHeight = position === "leftTop" || position === "leftBottom"
    ? Math.max(drawingHeight - cutout.height, 0)
    : drawingHeight;
  const rightSegmentTop = position === "rightTop" && cutoutDepth > 0 ? cutout.height : 0;
  const rightSegmentHeight = position === "rightTop" || position === "rightBottom"
    ? Math.max(drawingHeight - cutout.height, 0)
    : drawingHeight;
  const previewEdges = lTurnPreviewEdges({
    unitId,
    position,
    outerWidth: drawingWidth,
    outerDepth: drawingHeight,
    cutout,
    isOpening,
    hasKickPlate,
  });
  const activeHighlightedIds = highlightedBoardId?.split("|") ?? [];

  return (
    <div className="rounded border bg-background p-3">
      <div className="mb-2 flex items-center justify-between gap-3">
        <span className="text-xs font-medium">2D 預覽</span>
        <span className="text-[10px] text-muted-foreground">俯視示意</span>
      </div>
      <svg
        viewBox={`0 0 ${viewWidth} ${viewHeight}`}
        className="h-[180px] w-full rounded bg-muted/20"
        role="img"
        aria-label="L轉櫃 2D 預覽"
      >
        <g transform={`translate(${offsetX} ${offsetY})`}>
          <path d={path} fill="hsl(var(--primary) / 0.16)" stroke="hsl(var(--primary))" strokeWidth="2" />
          {previewEdges.map((edge) => (
            <g key={edge.id}>
              <line
                x1={edge.x1}
                y1={edge.y1}
                x2={edge.x2}
                y2={edge.y2}
                stroke={lTurnPreviewEdgeColor(edge.kind)}
                strokeWidth={edge.kind === "kickPlate" ? 2 : 4}
                strokeLinecap="round"
                opacity={edge.kind === "kickPlate" ? 0.55 : 0.82}
              />
              {activeHighlightedIds.includes(edge.id) && (
                <line
                  x1={edge.x1}
                  y1={edge.y1}
                  x2={edge.x2}
                  y2={edge.y2}
                  stroke="hsl(var(--primary))"
                  strokeWidth={edge.kind === "kickPlate" ? 2 : 6}
                  strokeLinecap="round"
                />
              )}
              <line
                x1={edge.x1}
                y1={edge.y1}
                x2={edge.x2}
                y2={edge.y2}
                stroke="transparent"
                strokeWidth="16"
                strokeLinecap="round"
                className="cursor-help"
                role="button"
                tabIndex={0}
                aria-label={edge.label}
                onPointerEnter={() => onBoardHover(edge.hoverId ?? edge.id)}
                onPointerLeave={() => onBoardHover(null)}
                onFocus={() => onBoardHover(edge.hoverId ?? edge.id)}
                onBlur={() => onBoardHover(null)}
              >
                <title>{edge.label}</title>
              </line>
            </g>
          ))}
          <line x1="0" y1="0" x2={drawingWidth} y2="0" stroke="hsl(var(--border))" strokeDasharray="2 3" />
          <line x1={drawingWidth} y1="0" x2={drawingWidth} y2={drawingHeight} stroke="hsl(var(--border))" strokeDasharray="2 3" />
          <line x1="0" y1={drawingHeight} x2={drawingWidth} y2={drawingHeight} stroke="hsl(var(--border))" strokeDasharray="2 3" />
          <line x1="0" y1="0" x2="0" y2={drawingHeight} stroke="hsl(var(--border))" strokeDasharray="2 3" />
          {cutout.width > 0 && cutout.height > 0 && (
            <rect
              x={cutout.x}
              y={cutout.y}
              width={cutout.width}
              height={cutout.height}
              fill="hsl(var(--destructive) / 0.12)"
              stroke="hsl(var(--destructive))"
              strokeDasharray="4 3"
              strokeWidth="1.5"
            />
          )}
          <text x={drawingWidth / 2} y={-6} textAnchor="middle" className={dimensionTextClass}>
            總寬 {Math.round(outerWidthMm)}mm
          </text>
          <text
            x={drawingWidth + 8}
            y={drawingHeight / 2}
            dominantBaseline="middle"
            className={dimensionTextClass}
          >
            總深 {Math.round(outerDepthMm)}mm
          </text>

          <text x={topSegmentLeft + topSegmentWidth / 2} y="12" textAnchor="middle" className={dimensionTextClass}>
            {Math.round((topSegmentWidth / scale) || 0)}mm
          </text>
          <text
            x={bottomSegmentLeft + bottomSegmentWidth / 2}
            y={drawingHeight - 6}
            textAnchor="middle"
            className={dimensionTextClass}
          >
            {Math.round((bottomSegmentWidth / scale) || 0)}mm
          </text>
          <text
            x="6"
            y={leftSegmentTop + leftSegmentHeight / 2}
            dominantBaseline="middle"
            className={dimensionTextClass}
          >
            {Math.round((leftSegmentHeight / scale) || 0)}mm
          </text>
          <text
            x={drawingWidth - 6}
            y={rightSegmentTop + rightSegmentHeight / 2}
            textAnchor="end"
            dominantBaseline="middle"
            className={dimensionTextClass}
          >
            {Math.round((rightSegmentHeight / scale) || 0)}mm
          </text>
          {cutout.width > 0 && cutout.height > 0 && (
            <>
              <text
                x={cutout.x + cutout.width / 2}
                y={cutout.y + Math.min(cutout.height / 2, 18)}
                textAnchor="middle"
                dominantBaseline="middle"
                className={cutoutTextClass}
              >
                缺口 W {cutoutWidthCm.toFixed(1)}cm
              </text>
              <text
                x={cutout.x + cutout.width / 2}
                y={cutout.y + Math.min(cutout.height / 2 + 13, Math.max(cutout.height - 6, 12))}
                textAnchor="middle"
                dominantBaseline="middle"
                className={cutoutTextClass}
              >
                缺口 H {cutoutDepthCm.toFixed(1)}cm
              </text>
            </>
          )}
        </g>
      </svg>
      <div className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1 text-[10px] text-muted-foreground">
        <span>總寬 {Math.round(outerWidthMm)}mm</span>
        <span>總深 {Math.round(outerDepthMm)}mm</span>
        <span>缺口寬 {cutoutWidthCm.toFixed(1)}cm</span>
        <span>缺口高 {cutoutDepthCm.toFixed(1)}cm</span>
        <span>剩餘寬 {Math.round(remainingWidthMm)}mm</span>
        <span>剩餘深 {Math.round(remainingDepthMm)}mm</span>
      </div>
    </div>
  );
}

function BodyPanelJoinPreview({
  mode,
  result,
}: {
  mode: NonNullable<CabinetUnitInput["bodyPanelJoinMode"]>;
  result: CabinetUnitResult;
}) {
  const leftPanel = result.panels.find((panel) => panel.id.endsWith("-left"));
  const topPanel = result.panels.find((panel) => panel.id.endsWith("-top"));
  const bottomPanel = result.panels.find((panel) => panel.id.endsWith("-bottom"));
  const kickPlatePanel = result.panels.find((panel) => panel.id.includes("kickplate"));
  const isTopCover = mode === "TOP_COVERS_SIDES";
  const viewWidth = 320;
  const viewHeight = 230;
  const frame = { x: 58, y: 26, width: 204, height: 168 };
  const sideWidth = 28;
  const topHeight = 24;
  const bottomHeight = 22;
  const kickHeight = kickPlatePanel ? 24 : 0;
  const contentTop = frame.y + topHeight;
  const bottomY = frame.y + frame.height - bottomHeight - kickHeight;
  const sideBottom = kickPlatePanel ? bottomY + bottomHeight + kickHeight : bottomY + bottomHeight;
  const innerX = frame.x + sideWidth;
  const innerWidth = frame.width - sideWidth * 2;
  const sideY = isTopCover ? frame.y + topHeight : frame.y;
  const sideHeight = sideBottom - sideY;
  const topRect = isTopCover
    ? { x: frame.x, y: frame.y, width: frame.width, height: topHeight }
    : { x: innerX, y: frame.y, width: innerWidth, height: topHeight };
  const bottomRect = { x: innerX, y: bottomY, width: innerWidth, height: bottomHeight };
  const kickRect = { x: innerX, y: bottomY + bottomHeight, width: innerWidth, height: kickHeight };
  const formatCm = (value: number) => Number.isInteger(value) ? value.toString() : value.toFixed(1);
  const label = (name: string, panel?: { widthCm: number; heightCm: number }) =>
    panel ? `${name} ${formatCm(panel.widthCm)}x${formatCm(panel.heightCm)}cm` : `${name} -`;
  const dimensionTextClass = "fill-slate-600 text-[9px]";

  return (
    <div className="rounded-md border bg-background p-3">
      <div className="mb-2 flex items-center justify-between gap-3">
        <span className="text-xs font-semibold">桶身結合 2D 預覽</span>
        <span className="text-[10px] text-muted-foreground">{isTopCover ? "頂蓋側" : "側包頂"}</span>
      </div>
      <svg viewBox={`0 0 ${viewWidth} ${viewHeight}`} className="h-auto w-full rounded bg-slate-50" role="img" aria-label="桶身結合 2D 預覽">
        <rect x={frame.x} y={sideY} width={sideWidth} height={sideHeight} fill="#bfdbfe" stroke="#2563eb" strokeWidth="2" />
        <rect x={frame.x + frame.width - sideWidth} y={sideY} width={sideWidth} height={sideHeight} fill="#bfdbfe" stroke="#2563eb" strokeWidth="2" />
        <rect x={topRect.x} y={topRect.y} width={topRect.width} height={topRect.height} fill="#fed7aa" stroke="#ea580c" strokeWidth="2" />
        <rect x={bottomRect.x} y={bottomRect.y} width={bottomRect.width} height={bottomRect.height} fill="#dbeafe" stroke="#2563eb" strokeWidth="2" />
        {kickPlatePanel && (
          <rect x={kickRect.x} y={kickRect.y} width={kickRect.width} height={kickRect.height} fill="#dcfce7" stroke="#16a34a" strokeWidth="2" />
        )}
        <rect x={innerX} y={contentTop} width={innerWidth} height={Math.max(bottomY - contentTop, 0)} fill="#64748b" opacity="0.12" stroke="#94a3b8" strokeWidth="1" />
        <text x={viewWidth / 2} y={viewHeight - 18} textAnchor="middle" className={dimensionTextClass}>
          {label("頂", topPanel)} / {label("側", leftPanel)} / {label("底", bottomPanel)}
        </text>
        {kickPlatePanel && (
          <text x={viewWidth / 2} y={viewHeight - 6} textAnchor="middle" className={dimensionTextClass}>
            {label("踢", kickPlatePanel)}
          </text>
        )}
      </svg>
      <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[10px] text-muted-foreground">
        <span><span className="inline-block h-2 w-2 rounded-sm bg-orange-300" /> 頂板</span>
        <span><span className="inline-block h-2 w-2 rounded-sm bg-blue-200" /> 側板 / 底板</span>
        {kickPlatePanel && <span><span className="inline-block h-2 w-2 rounded-sm bg-green-200" /> 踢腳板</span>}
      </div>
    </div>
  );
}

export function CabinetUnitForm({ unit, estimateLabel, projectInfo, onChange, onResult, vendor = "WEIHO" }: Props) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const resultPrintRef = useRef<HTMLDivElement | null>(null);
  const [inputWidthPct, setInputWidthPct] = useState(MIN_INPUT_WIDTH_PCT);
  const [highlightedBoardId, setHighlightedBoardId] = useState<string | null>(null);
  const [leftCollapseCommand, setLeftCollapseCommand] = useState<CollapseCommand>({ action: "collapse", version: 0 });
  const [forceResultPrintExpanded, setForceResultPrintExpanded] = useState(false);
  const update = (patch: Partial<CabinetUnitInput>) => onChange({ ...unit, ...patch });

  const result = calculateCabinetUnit(unit);
  const bodyPanelJoinMode = unit.bodyPanelJoinMode ?? "SIDE_COVERS_TOP";
  const backPanelMode = unit.backPanelMode ?? "AUTO_8MM";
  const automaticBackPanel = unit.hasBackPanel && backPanelMode === "AUTO_8MM";
  const topPanelMaterialRef = unit.topPanelMaterialRef ?? unit.panelMaterialRef;
  const sidePanelMaterialRef = unit.sidePanelMaterialRef ?? unit.panelMaterialRef;
  const bottomPanelMaterialRef = unit.bottomPanelMaterialRef ?? unit.panelMaterialRef;
  const printTitle = [estimateLabel?.trim(), unit.name].filter(Boolean).join(" - ");
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
  const lTurnCabinet = {
    ...DEFAULT_UNIT_ADDONS.lTurnCabinet!,
    ...unit.addons.lTurnCabinet,
  };
  const lTurnCabinetRequiresShaping =
    lTurnCabinet.enabled &&
    lTurnCabinet.widthMm + lTurnCabinet.heightMm > UNIT_CONFIG.L_TURN_CABINET_MAX_DIMENSION_SUM_MM;
  const lTurnCabinetWidthCm = lTurnCabinet.widthMm / 10;
  const lTurnCabinetHeightCm = lTurnCabinet.heightMm / 10;
  const topPanelOverhang = {
    ...DEFAULT_UNIT_ADDONS.topPanelOverhang!,
    ...unit.addons.topPanelOverhang,
  };
  const updateLTurnCabinet = (patch: Partial<typeof lTurnCabinet>) => update({
    addons: {
      ...unit.addons,
      lTurnCabinet: {
        ...lTurnCabinet,
        ...patch,
      },
    },
  });
  const updateTopPanelOverhang = (patch: Partial<typeof topPanelOverhang>) => update({
    addons: {
      ...unit.addons,
      topPanelOverhang: {
        ...topPanelOverhang,
        ...patch,
      },
    },
  });

  useEffect(() => {
    onResult?.(result);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [unit]);

  const startResize = useCallback((event: React.PointerEvent<HTMLButtonElement>) => {
    event.preventDefault();
    const container = containerRef.current;
    if (!container) return;

    const resize = (moveEvent: PointerEvent) => {
      const rect = container.getBoundingClientRect();
      const next = ((moveEvent.clientX - rect.left) / rect.width) * 100;
      setInputWidthPct(Math.min(MAX_INPUT_WIDTH_PCT, Math.max(MIN_INPUT_WIDTH_PCT, next)));
    };

    const stopResize = () => {
      window.removeEventListener("pointermove", resize);
      window.removeEventListener("pointerup", stopResize);
    };

    window.addEventListener("pointermove", resize);
    window.addEventListener("pointerup", stopResize);
  }, []);

  const printResult = useCallback(() => {
    const target = resultPrintRef.current;
    if (!target) return;

    const printWindow = window.open("", "_blank", "width=1100,height=800");
    if (!printWindow) return;

    flushSync(() => {
      setForceResultPrintExpanded(true);
    });

    const clonedTarget = target.cloneNode(true) as HTMLElement;
    flushSync(() => {
      setForceResultPrintExpanded(false);
    });

    clonedTarget.setAttribute("data-cabinet-print-target", "true");
    clonedTarget.querySelectorAll(".cabinet-print-hidden").forEach((element) => element.remove());

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
        display: inline !important;
        overflow: visible !important;
        text-overflow: clip !important;
        white-space: normal !important;
        word-break: keep-all !important;
        overflow-wrap: normal !important;
        font-size: 10pt !important;
        line-height: 1.22 !important;
      }

      [data-cabinet-print-target="true"] .cabinet-board-material {
        display: block !important;
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

  return (
    <div
      ref={containerRef}
      className="grid grid-cols-1 gap-5 sm:gap-6 xl:grid-cols-[var(--input-width)_10px_minmax(0,1fr)] xl:gap-0"
      style={{ "--input-width": `${inputWidthPct}%` } as React.CSSProperties}
    >
      {/* 左側輸入區 */}
      <div className="min-w-0 space-y-4 sm:space-y-5 xl:pr-5">
        <div className="flex flex-wrap items-center justify-end gap-2">
          <button
            type="button"
            className="rounded-md border px-3 py-1.5 text-xs font-medium hover:bg-muted/50"
            onClick={() => setLeftCollapseCommand((current) => ({ action: "expand", version: current.version + 1 }))}
          >
            全部展開
          </button>
          <button
            type="button"
            className="rounded-md border px-3 py-1.5 text-xs font-medium hover:bg-muted/50"
            onClick={() => setLeftCollapseCommand((current) => ({ action: "collapse", version: current.version + 1 }))}
          >
            全部摺疊
          </button>
        </div>

        <CollapsibleSection title="桶身" icon={Box} command={leftCollapseCommand}>
        {/* 基本資料 */}
        <section className="space-y-3">
          <h3 className="font-semibold text-sm border-b pb-1">基本資料</h3>
          <div>
            <Label className="text-xs text-muted-foreground">桶身名稱</Label>
            <Input
              className="mt-1"
              value={unit.name}
              onChange={(e) => update({ name: e.target.value })}
              placeholder="例如：主臥衣櫃"
            />
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            {(["widthCm", "depthCm", "heightCm"] as const).map((field) => (
              <div key={field}>
                <Label className="text-xs text-muted-foreground">
                  {field === "widthCm" ? "寬(cm)" : field === "depthCm" ? "深(cm)" : "高(cm)"}
                </Label>
                <Input
                  type="number" min={1} className="mt-1"
                  value={unit[field]}
                  onChange={(e) => update({ [field]: Number(e.target.value) })}
                />
              </div>
            ))}
          </div>
          <div>
            <Label className="text-xs text-muted-foreground">數量</Label>
            <Input
              type="number" min={1} max={20} className="mt-1 w-24"
              value={unit.quantity}
              onChange={(e) => update({ quantity: Number(e.target.value) })}
            />
          </div>
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">桶身結合方式</Label>
            <Select
              value={bodyPanelJoinMode}
              onValueChange={(bodyPanelJoinMode) =>
                update({ bodyPanelJoinMode: bodyPanelJoinMode as NonNullable<CabinetUnitInput["bodyPanelJoinMode"]> })
              }
            >
              <SelectTrigger className="h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="SIDE_COVERS_TOP">側包頂</SelectItem>
                <SelectItem value="TOP_COVERS_SIDES">頂蓋側</SelectItem>
              </SelectContent>
            </Select>
            <BodyPanelJoinPreview mode={bodyPanelJoinMode} result={result} />
            {bodyPanelJoinMode === "TOP_COVERS_SIDES" && (
              <div className="space-y-3 rounded-md border bg-muted/20 p-3">
                <div className="flex items-center justify-between gap-3">
                  <Label className="text-xs font-medium">頂板凸出</Label>
                  <Switch
                    checked={topPanelOverhang.enabled}
                    onCheckedChange={(enabled) => updateTopPanelOverhang({ enabled })}
                  />
                </div>
                {topPanelOverhang.enabled && (
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                    {([
                      ["frontCm", "前凸(cm)"],
                      ["backCm", "後凸(cm)"],
                      ["leftCm", "左凸(cm)"],
                      ["rightCm", "右凸(cm)"],
                    ] as const).map(([field, label]) => (
                      <div key={field}>
                        <Label className="text-xs text-muted-foreground">{label}</Label>
                        <Input
                          type="number"
                          min={0}
                          className="mt-1 h-8 text-xs"
                          value={topPanelOverhang[field]}
                          onChange={(event) => updateTopPanelOverhang({ [field]: Number(event.target.value) })}
                        />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </section>

        {/* 板材選料 */}
        {vendor !== "ZHENGDAO" && <section className="space-y-3 rounded border bg-muted/20 p-3">
          <label className="flex items-center gap-2 text-sm font-semibold">
            <input
              type="checkbox"
              className="h-4 w-4 rounded border-border"
              checked={lTurnCabinet.enabled}
              onChange={(event) => updateLTurnCabinet({ enabled: event.target.checked })}
            />
            <span>L轉櫃</span>
          </label>

          {lTurnCabinet.enabled && (
            <div className="space-y-3">
              <div>
                <Label className="text-xs text-muted-foreground">L缺口位置</Label>
                <Select
                  value={lTurnCabinet.position}
                  onValueChange={(position) => updateLTurnCabinet({ position: position as LTurnCabinetPosition })}
                >
                  <SelectTrigger className="mt-1 h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="rightTop">右上</SelectItem>
                    <SelectItem value="rightBottom">右下</SelectItem>
                    <SelectItem value="leftTop">左上</SelectItem>
                    <SelectItem value="leftBottom">左下</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <label className="flex items-center justify-between rounded border bg-background px-3 py-2">
                <span className="text-xs">缺口為開口</span>
                <input
                  type="checkbox"
                  className="h-4 w-4 rounded border-border"
                  checked={lTurnCabinet.isOpening}
                  onChange={(event) => updateLTurnCabinet({ isOpening: event.target.checked })}
                />
              </label>

              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <Label className="text-xs text-muted-foreground">寬度 W(cm)</Label>
                  <Input
                    type="number"
                    min={0}
                    step={0.1}
                    className="mt-1 h-8 text-xs"
                    value={lTurnCabinetWidthCm}
                    onChange={(event) => updateLTurnCabinet({ widthMm: Number(event.target.value) * 10 })}
                  />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">高度 H(cm)</Label>
                  <Input
                    type="number"
                    min={0}
                    step={0.1}
                    className="mt-1 h-8 text-xs"
                    value={lTurnCabinetHeightCm}
                    onChange={(event) => updateLTurnCabinet({ heightMm: Number(event.target.value) * 10 })}
                  />
                </div>
              </div>

              <LTurnCabinetPreview
                unitId={unit.id}
                cabinetWidthCm={unit.widthCm}
                cabinetDepthCm={unit.depthCm}
                position={lTurnCabinet.position}
                widthMm={lTurnCabinet.widthMm}
                heightMm={lTurnCabinet.heightMm}
                isOpening={lTurnCabinet.isOpening}
                hasKickPlate={unit.kickPlate !== null}
                highlightedBoardId={highlightedBoardId}
                onBoardHover={setHighlightedBoardId}
              />

              {lTurnCabinetRequiresShaping && (
                <p className="rounded border border-destructive/40 bg-destructive/10 px-3 py-2 text-xs font-medium text-destructive">
                  須以打型加工計算
                </p>
              )}
            </div>
          )}
        </section>}

        <section className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b pb-1">
            <h3 className="font-semibold text-sm">板材選料</h3>
            {vendor === "ZHENGDAO" && sidePanelMaterialRef && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-7 text-xs"
                onClick={() => update({
                  panelMaterialRef: sidePanelMaterialRef,
                  topPanelMaterialRef: sidePanelMaterialRef,
                  sidePanelMaterialRef,
                  bottomPanelMaterialRef: sidePanelMaterialRef,
                })}
              >
                將側板材料套用至全部桶身板
              </Button>
            )}
          </div>
          <div className="grid gap-3">
            <div>
              <Label className="text-xs text-muted-foreground">頂板材料</Label>
              <div className="mt-1">
                {vendor === "ZHENGDAO" ? (
                  <ZhengdaoBoardMaterialPicker
                    value={topPanelMaterialRef}
                    onChange={(ref) => update({ topPanelMaterialRef: ref })}
                    category="BOARD_BODY"
                  />
                ) : (
                  <MaterialDropdown
                    value={topPanelMaterialRef}
                    onChange={(ref) => update({ topPanelMaterialRef: ref })}
                    categoryFilter="BOARD_BODY"
                  />
                )}
              </div>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">側板材料</Label>
              <div className="mt-1">
                {vendor === "ZHENGDAO" ? (
                  <ZhengdaoBoardMaterialPicker
                    value={sidePanelMaterialRef}
                    onChange={(ref) => update({ sidePanelMaterialRef: ref, panelMaterialRef: ref })}
                    category="BOARD_BODY"
                  />
                ) : (
                  <MaterialDropdown
                    value={sidePanelMaterialRef}
                    onChange={(ref) => update({ sidePanelMaterialRef: ref, panelMaterialRef: ref })}
                    categoryFilter="BOARD_BODY"
                  />
                )}
              </div>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">底板材料</Label>
              <div className="mt-1">
                {vendor === "ZHENGDAO" ? (
                  <ZhengdaoBoardMaterialPicker
                    value={bottomPanelMaterialRef}
                    onChange={(ref) => update({ bottomPanelMaterialRef: ref })}
                    category="BOARD_BODY"
                  />
                ) : (
                  <MaterialDropdown
                    value={bottomPanelMaterialRef}
                    onChange={(ref) => update({ bottomPanelMaterialRef: ref })}
                    categoryFilter="BOARD_BODY"
                  />
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Switch
              checked={unit.hasBackPanel}
              onCheckedChange={(v) => update({ hasBackPanel: v })}
            />
            <Label className="text-xs">含背板</Label>
          </div>
          {unit.hasBackPanel && (
            <div className="space-y-3 rounded border bg-muted/20 p-3">
              <div>
                <Label className="text-xs text-muted-foreground">背板方式</Label>
                <Select
                  value={backPanelMode}
                  onValueChange={(mode: "AUTO_8MM" | "MANUAL_18MM") => update({
                    backPanelMode: mode,
                    backPanelMaterialRef: null,
                    manualBackPanel: unit.manualBackPanel ?? {
                      widthCm: unit.widthCm,
                      heightCm: unit.heightCm,
                      quantity: 1,
                    },
                  })}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="AUTO_8MM">8mm 背板（自動計算尺寸＋開槽）</SelectItem>
                    <SelectItem value="MANUAL_18MM">18mm 背板（手動尺寸、不開槽）</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-xs text-muted-foreground">
                  {backPanelMode === "AUTO_8MM" ? "8mm 背板材料" : "18mm 背板材料"}
                </Label>
                <div className="mt-1">
                  {vendor === "ZHENGDAO" ? (
                    <ZhengdaoBoardMaterialPicker
                      value={unit.backPanelMaterialRef}
                      onChange={(ref) => update({ backPanelMaterialRef: ref })}
                      category={backPanelMode === "AUTO_8MM" ? "BOARD_BACKING" : "BOARD_BODY"}
                    />
                  ) : (
                    <MaterialDropdown
                      value={unit.backPanelMaterialRef}
                      onChange={(ref) => update({ backPanelMaterialRef: ref })}
                      categoryFilter={backPanelMode === "AUTO_8MM" ? "BOARD_BACKING" : "BOARD_BODY"}
                    />
                  )}
                </div>
              </div>

              {backPanelMode === "MANUAL_18MM" && (
                <div className="grid gap-2 sm:grid-cols-3">
                  <div>
                    <Label className="text-xs text-muted-foreground">寬度 (cm)</Label>
                    <Input
                      type="number" min={0.1} step={0.1}
                      value={unit.manualBackPanel?.widthCm ?? unit.widthCm}
                      onChange={(event) => update({
                        manualBackPanel: {
                          widthCm: Number(event.target.value),
                          heightCm: unit.manualBackPanel?.heightCm ?? unit.heightCm,
                          quantity: unit.manualBackPanel?.quantity ?? 1,
                        },
                      })}
                    />
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">高度 (cm)</Label>
                    <Input
                      type="number" min={0.1} step={0.1}
                      value={unit.manualBackPanel?.heightCm ?? unit.heightCm}
                      onChange={(event) => update({
                        manualBackPanel: {
                          widthCm: unit.manualBackPanel?.widthCm ?? unit.widthCm,
                          heightCm: Number(event.target.value),
                          quantity: unit.manualBackPanel?.quantity ?? 1,
                        },
                      })}
                    />
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">每櫃數量</Label>
                    <Input
                      type="number" min={1} step={1}
                      value={unit.manualBackPanel?.quantity ?? 1}
                      onChange={(event) => update({
                        manualBackPanel: {
                          widthCm: unit.manualBackPanel?.widthCm ?? unit.widthCm,
                          heightCm: unit.manualBackPanel?.heightCm ?? unit.heightCm,
                          quantity: Number(event.target.value),
                        },
                      })}
                    />
                  </div>
                </div>
              )}

              <p className="text-xs text-muted-foreground">
                {backPanelMode === "AUTO_8MM"
                  ? "尺寸由系統計算，並自動計入背板溝槽加工。"
                  : "使用手動輸入尺寸，不產生背板溝槽加工。"}
              </p>
            </div>
          )}
        </section>

        <UnitAddonsForm
          value={unit.addons}
          vendor={vendor}
          onChange={(addons) => update({ addons })}
        />

        {/* 踢腳板 */}
        <KickPlateForm
          value={unit.kickPlate}
          onChange={(v) => update({ kickPlate: v })}
          manualItems={unit.manualKickPlates ?? []}
          onManualItemsChange={(manualKickPlates) => update({ manualKickPlates })}
        />
        </CollapsibleSection>

        <Separator />

        {/* 內部構件 */}
        <InternalPartsForm
          middleDividers={unit.middleDividers}
          shelves={unit.shelves}
          sideTopBottomSealPanels={unit.sideTopBottomSealPanels ?? []}
          cabinetDepthCm={unit.depthCm}
          cabinetHeightCm={unit.heightCm}
          hasBackPanel={automaticBackPanel}
          panelMaterialRef={sidePanelMaterialRef}
          kickPlateHeightCm={unit.kickPlate?.heightCm ?? 0}
          collapseCommand={leftCollapseCommand}
          onMiddleDividersChange={(v) => update({ middleDividers: v })}
          onShelvesChange={(v) => update({ shelves: v })}
          onSideTopBottomSealPanelsChange={(v) => update({ sideTopBottomSealPanels: v })}
        />

        <Separator />

        {/* 抽屜 */}
        <CollapsibleSection title="抽屜" icon={Archive} command={leftCollapseCommand}>
        <DrawerForm
          drawers={unit.drawers ?? []}
          onChange={(v) => update({ drawers: v })}
        />
        </CollapsibleSection>

        <Separator />

        {/* 門片 */}
        <CollapsibleSection title="門片" icon={DoorOpen} command={leftCollapseCommand}>
        <DoorForm
          doors={unit.doors}
          onChange={(v) => update({ doors: v })}
        />
        </CollapsibleSection>

        {vendor === "ZHENGDAO" && (
          <>
            <Separator />

            {/* 隔間門 */}
            <CollapsibleSection title="隔間門" icon={DoorOpen} command={leftCollapseCommand}>
            <ZhengdaoPartitionDoorsForm
              doors={unit.doors}
              onChange={(v) => update({ doors: v })}
            />
            </CollapsibleSection>
          </>
        )}

        <Separator />

        <CollapsibleSection title="五金另料" icon={Wrench} command={leftCollapseCommand}>
        <HardwareItemsForm
          items={unit.hardwareItems ?? []}
          onChange={(v) => update({ hardwareItems: v })}
        />
        </CollapsibleSection>

      </div>

      {/* 分隔拖曳把手 */}
      <button
        type="button"
        className="relative hidden cursor-col-resize items-stretch justify-center xl:flex"
        onPointerDown={startResize}
        aria-label="調整輸入與結果區寬度"
      >
        <span className="my-1 block w-px rounded bg-border" />
        <span className="absolute top-1/2 h-10 w-1.5 -translate-y-1/2 rounded-full bg-border transition-colors hover:bg-primary/60" />
      </button>

      <div className="min-w-0 xl:pl-5">
        <div className="cabinet-print-hidden mb-4 flex flex-col items-start justify-between gap-3 border-b pb-2 sm:flex-row sm:items-center">
          <h3 className="text-sm font-semibold">即時計算結果</h3>
          <Button type="button" variant="outline" size="sm" onClick={printResult}>
            <Printer className="h-4 w-4" />
            匯出單桶PDF
          </Button>
        </div>
        <div ref={resultPrintRef} className="cabinet-print-area">
          <div className="hidden cabinet-print-title mb-4 border-b pb-3">
            {projectInfoRows.length > 0 && (
              <section className="grid grid-cols-3 gap-x-4 gap-y-2 text-[12px] leading-snug">
                {projectInfoRows.map((row) => (
                  <div key={row.label} className="min-w-0">
                    <p className="text-[10px] font-semibold tracking-[0.16em] text-blue-700">{row.label}</p>
                    <p className="mt-0.5 break-words text-foreground">{row.value}</p>
                  </div>
                ))}
              </section>
            )}
            <h1 className="mt-3 text-xl font-bold">{printTitle}</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              櫃體尺寸：{unit.widthCm} x {unit.depthCm} x {unit.heightCm} cm / 數量 {unit.quantity}
            </p>
          </div>
          <CabinetResultPanel result={result} highlightedBoardId={highlightedBoardId} forceAllExpanded={forceResultPrintExpanded} />
        </div>
      </div>
    </div>
  );
}
