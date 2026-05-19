// src/components/cabinet/CabinetUnitForm.tsx
"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { MaterialDropdown } from "@/components/shared/MaterialDropdown";
import { DoorForm } from "./DoorForm";
import { DrawerForm } from "./DrawerForm";
import { HardwareItemsForm } from "./HardwareItemsForm";
import { InternalPartsForm } from "./InternalPartsForm";
import { KickPlateForm } from "./KickPlateForm";
import { CabinetResultPanel } from "./CabinetResultPanel";
import { UnitAddonsForm } from "./UnitAddonsForm";
import { calculateCabinetUnit } from "@/lib/calculations/cabinet";
import { DEFAULT_UNIT_ADDONS, type CabinetUnitInput, type CabinetUnitResult, type LTurnCabinetPosition } from "@/types";
import { UNIT_CONFIG } from "@/lib/config/units";

interface Props {
  unit: CabinetUnitInput;
  onChange: (unit: CabinetUnitInput) => void;
  onResult?: (result: CabinetUnitResult) => void;
}

const MIN_INPUT_WIDTH_PCT = 30;
const MAX_INPUT_WIDTH_PCT = 70;

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
}): LTurnPreviewEdge[] {
  const { unitId, position, outerWidth, outerDepth, cutout, isOpening } = params;
  const x1 = cutout.x;
  const y1 = cutout.y;
  const x2 = cutout.x + cutout.width;
  const y2 = cutout.y + cutout.height;
  const isRight = position === "rightTop" || position === "rightBottom";
  const isBottom = position === "rightBottom" || position === "leftBottom";

  const sideWidthEdge: LTurnPreviewEdge = {
    id: `${unitId}-l-turn-side-width`,
    label: "L轉側板-寬向",
    x1: isRight ? 0 : x2,
    y1: isBottom ? outerDepth : 0,
    x2: isRight ? x1 : outerWidth,
    y2: isBottom ? outerDepth : 0,
  };

  const sideDepthEdge: LTurnPreviewEdge = {
    id: `${unitId}-l-turn-side-depth`,
    label: "L轉側板-深向",
    x1: isRight ? outerWidth : 0,
    y1: isBottom ? 0 : y2,
    x2: isRight ? outerWidth : 0,
    y2: isBottom ? y1 : outerDepth,
  };

  const backWidthEdge: LTurnPreviewEdge = isOpening
    ? {
        id: `${unitId}-l-turn-back-width`,
        label: "L轉背板-寬向",
        x1: 0,
        y1: isBottom ? 0 : outerDepth,
        x2: outerWidth,
        y2: isBottom ? 0 : outerDepth,
      }
    : {
        id: `${unitId}-l-turn-back-width`,
        label: "L轉背板-寬向",
        x1: isRight ? x1 : 0,
        y1: isBottom ? y1 : y2,
        x2: isRight ? outerWidth : x2,
        y2: isBottom ? y1 : y2,
      };

  const backDepthEdge: LTurnPreviewEdge = isOpening
    ? {
        id: `${unitId}-l-turn-back-depth`,
        label: "L轉背板-深向",
        x1: isRight ? 0 : outerWidth,
        y1: 0,
        x2: isRight ? 0 : outerWidth,
        y2: outerDepth,
      }
    : {
        id: `${unitId}-l-turn-back-depth`,
        label: "L轉背板-深向",
        x1: isRight ? x1 : x2,
        y1: isBottom ? y1 : 0,
        x2: isRight ? x1 : x2,
        y2: isBottom ? outerDepth : y2,
      };

  return [sideWidthEdge, sideDepthEdge, backWidthEdge, backDepthEdge];
}

function LTurnCabinetPreview({
  unitId,
  cabinetWidthCm,
  cabinetDepthCm,
  position,
  widthMm,
  heightMm,
  isOpening,
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
  highlightedBoardId: string | null;
  onBoardHover: (boardId: string | null) => void;
}) {
  const outerWidthMm = Math.max(cabinetWidthCm * 10, 1);
  const outerDepthMm = Math.max(cabinetDepthCm * 10, 1);
  const cutoutWidth = Math.min(Math.max(widthMm, 0), outerWidthMm);
  const cutoutDepth = Math.min(Math.max(heightMm, 0), outerDepthMm);
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
  });

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
              {highlightedBoardId === edge.id && (
                <line
                  x1={edge.x1}
                  y1={edge.y1}
                  x2={edge.x2}
                  y2={edge.y2}
                  stroke="hsl(var(--primary))"
                  strokeWidth="5"
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
                onPointerEnter={() => onBoardHover(edge.id)}
                onPointerLeave={() => onBoardHover(null)}
                onFocus={() => onBoardHover(edge.id)}
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
                缺口 W {Math.round(widthMm)}mm
              </text>
              <text
                x={cutout.x + cutout.width / 2}
                y={cutout.y + Math.min(cutout.height / 2 + 13, Math.max(cutout.height - 6, 12))}
                textAnchor="middle"
                dominantBaseline="middle"
                className={cutoutTextClass}
              >
                缺口 H {Math.round(heightMm)}mm
              </text>
            </>
          )}
        </g>
      </svg>
      <div className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1 text-[10px] text-muted-foreground">
        <span>總寬 {Math.round(outerWidthMm)}mm</span>
        <span>總深 {Math.round(outerDepthMm)}mm</span>
        <span>缺口寬 {Math.round(widthMm)}mm</span>
        <span>缺口高 {Math.round(heightMm)}mm</span>
        <span>剩餘寬 {Math.round(remainingWidthMm)}mm</span>
        <span>剩餘深 {Math.round(remainingDepthMm)}mm</span>
      </div>
    </div>
  );
}

export function CabinetUnitForm({ unit, onChange, onResult }: Props) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [inputWidthPct, setInputWidthPct] = useState(MIN_INPUT_WIDTH_PCT);
  const [highlightedBoardId, setHighlightedBoardId] = useState<string | null>(null);
  const update = (patch: Partial<CabinetUnitInput>) => onChange({ ...unit, ...patch });

  const result = calculateCabinetUnit(unit);
  const lTurnCabinet = {
    ...DEFAULT_UNIT_ADDONS.lTurnCabinet!,
    ...unit.addons.lTurnCabinet,
  };
  const lTurnCabinetRequiresShaping =
    lTurnCabinet.enabled &&
    lTurnCabinet.widthMm + lTurnCabinet.heightMm > UNIT_CONFIG.L_TURN_CABINET_MAX_DIMENSION_SUM_MM;
  const updateLTurnCabinet = (patch: Partial<typeof lTurnCabinet>) => update({
    addons: {
      ...unit.addons,
      lTurnCabinet: {
        ...lTurnCabinet,
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

  return (
    <div
      ref={containerRef}
      className="grid grid-cols-1 gap-6 xl:grid-cols-[var(--input-width)_10px_minmax(0,1fr)] xl:gap-0"
      style={{ "--input-width": `${inputWidthPct}%` } as React.CSSProperties}
    >
      {/* 左側輸入區 */}
      <div className="min-w-0 space-y-5 xl:pr-5">
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
          <div className="grid grid-cols-3 gap-3">
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
        </section>

        {/* 板材選料 */}
        <section className="space-y-3 rounded border bg-muted/20 p-3">
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
                  <Label className="text-xs text-muted-foreground">寬度 W(mm)</Label>
                  <Input
                    type="number"
                    min={0}
                    className="mt-1 h-8 text-xs"
                    value={lTurnCabinet.widthMm}
                    onChange={(event) => updateLTurnCabinet({ widthMm: Number(event.target.value) })}
                  />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">高度 H(mm)</Label>
                  <Input
                    type="number"
                    min={0}
                    className="mt-1 h-8 text-xs"
                    value={lTurnCabinet.heightMm}
                    onChange={(event) => updateLTurnCabinet({ heightMm: Number(event.target.value) })}
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
        </section>

        <section className="space-y-3">
          <h3 className="font-semibold text-sm border-b pb-1">板材選料</h3>
          <div>
            <Label className="text-xs text-muted-foreground">桶身板材（側板 / 頂板 / 底板）</Label>
            <div className="mt-1">
              <MaterialDropdown
                value={unit.panelMaterialRef}
                onChange={(ref) => update({ panelMaterialRef: ref })}
                categoryFilter="BOARD_BODY"
              />
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
            <div>
              <Label className="text-xs text-muted-foreground">背板材料</Label>
              <div className="mt-1">
                <MaterialDropdown
                  value={unit.backPanelMaterialRef}
                  onChange={(ref) => update({ backPanelMaterialRef: ref })}
                  categoryFilter="BOARD_BACKING"
                />
              </div>
            </div>
          )}
        </section>

        <UnitAddonsForm
          value={unit.addons}
          onChange={(addons) => update({ addons })}
        />

        <Separator />

        {/* 內部構件 */}
        <InternalPartsForm
          middleDividers={unit.middleDividers}
          shelves={unit.shelves}
          sideTopBottomSealPanels={unit.sideTopBottomSealPanels ?? []}
          onMiddleDividersChange={(v) => update({ middleDividers: v })}
          onShelvesChange={(v) => update({ shelves: v })}
          onSideTopBottomSealPanelsChange={(v) => update({ sideTopBottomSealPanels: v })}
        />

        <Separator />

        {/* 抽屜 */}
        <DrawerForm
          drawers={unit.drawers ?? []}
          onChange={(v) => update({ drawers: v })}
        />

        <Separator />

        {/* 門片 */}
        <DoorForm
          doors={unit.doors}
          onChange={(v) => update({ doors: v })}
        />

        <Separator />

        <HardwareItemsForm
          items={unit.hardwareItems ?? []}
          onChange={(v) => update({ hardwareItems: v })}
        />

        <Separator />

        {/* 踢腳板 */}
        <KickPlateForm
          value={unit.kickPlate}
          onChange={(v) => update({ kickPlate: v })}
        />
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
        <h3 className="font-semibold text-sm border-b pb-1 mb-4">即時計算結果</h3>
        <CabinetResultPanel result={result} highlightedBoardId={highlightedBoardId} />
      </div>
    </div>
  );
}
