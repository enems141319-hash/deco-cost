"use client";

import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { generateId } from "@/lib/utils";
import type { SpecialProcessInput, SpecialProcessKind } from "@/types";

interface Props {
  value: SpecialProcessInput[];
  onChange: (value: SpecialProcessInput[]) => void;
  boardWidthCm: number;
  boardHeightCm: number;
}

const outerShapeOptions = ["L\u578b", "\u659cL\u578b", "\u6b63\u5713", "\u6a62\u5713", "\u51f9\u578b", "\u659c\u51f9\u578b", "\u534a\u5713", "\u5b50\u5f48\u578b", "\u3111\u578b", "\u5167\u5f27\u578b", "\u5167\u62f1\u578b"];
const innerCutoutOptions = ["\u958b\u5713\u5b54", "\u958b\u65b9\u5b54", "\u62f1\u578b\u5b54"];
const factoryRadiusOptions = [20, 30, 50, 80, 100, 150, 200, 250, 300];

const defaultLabels: Record<SpecialProcessKind, string> = {
  roundCorner: "\u5c0e\u5713",
  quarterRound: "1/4\u5713",
  cutCorner: "\u5207\u89d2",
  outerShape: outerShapeOptions[0],
  innerCutout: innerCutoutOptions[0],
};

function defaultProcess(): SpecialProcessInput {
  return {
    id: generateId(),
    kind: "outerShape",
    label: defaultLabels.outerShape,
    edgeBanding: "withEdge",
    dimensionSumMm: 900,
    dimensionAMm: 450,
    dimensionBMm: 450,
    outerShapeSide: "long",
    quantity: 1,
    sharpCornerGte90Count: 0,
    sharpCornerLt90Count: 0,
  };
}

function defaultRadius(kind: SpecialProcessKind): number | undefined {
  return kind === "roundCorner" || kind === "quarterRound" ? 80 : undefined;
}

function processColor(kind: SpecialProcessKind): string {
  if (kind === "roundCorner" || kind === "quarterRound") return "hsl(var(--primary))";
  if (kind === "cutCorner") return "hsl(25 92% 45%)";
  if (kind === "innerCutout") return "hsl(168 76% 32%)";
  return "hsl(280 70% 45%)";
}

function clampDimension(value: number, max: number): number {
  return Math.max(4, Math.min(value, max));
}

function processDimensionPx(process: SpecialProcessInput, scale: number, width: number, height: number) {
  return {
    a: clampDimension((dimensionA(process) / 10) * scale, width),
    b: clampDimension((dimensionB(process) / 10) * scale, height),
  };
}

function outerShapePath(label: string, width: number, height: number, a: number, b: number): string | null {
  const cutA = clampDimension(a, width);
  const cutB = clampDimension(b, height);
  const centerA = clampDimension(a, width * 0.8);
  const centerB = clampDimension(b, height * 0.8);
  const centerX = (width - centerA) / 2;
  if (label === outerShapeOptions[0]) return `M 0 0 H ${cutA} V ${cutB} H ${width} V ${height} H 0 Z`;
  if (label === outerShapeOptions[1]) return `M 0 0 H ${Math.max(cutA * 0.7, 4)} L ${cutA} ${cutB} H ${width} V ${height} H 0 Z`;
  if (label === outerShapeOptions[4]) return `M 0 0 H ${centerX} V ${centerB} H ${centerX + centerA} V 0 H ${width} V ${height} H 0 Z`;
  if (label === outerShapeOptions[5]) return `M 0 0 H ${centerX} L ${centerX + centerA * 0.22} ${centerB} H ${centerX + centerA * 0.78} L ${centerX + centerA} 0 H ${width} V ${height} H 0 Z`;
  if (label === outerShapeOptions[8]) return `M 0 0 H ${centerX} L ${centerX + centerA / 2} ${centerB} L ${centerX + centerA} 0 H ${width} V ${height} H 0 Z`;
  if (label === outerShapeOptions[9]) return `M 0 0 H ${width} V ${height} H 0 V 0 M ${width} ${height - cutB} Q ${width - cutA} ${height - cutB} ${width - cutA} ${height} H ${width} Z`;
  if (label === outerShapeOptions[10]) return `M 0 0 H ${width} V ${height} H ${(width + centerA) / 2} V ${height - centerB} Q ${width / 2} ${height - centerB * 1.35} ${(width - centerA) / 2} ${height - centerB} V ${height} H 0 Z`;
  if (label === outerShapeOptions[6]) return `M 0 0 H ${width - cutA} Q ${width} ${height / 2} ${width - cutA} ${height} H 0 Z`;
  if (label === outerShapeOptions[7]) return `M 0 0 H ${width - cutA} Q ${width} ${height / 2} ${width - cutA} ${height} H 0 Z`;
  return null;
}

function dimensionA(process: SpecialProcessInput): number {
  return process.dimensionAMm ?? Math.round((process.dimensionSumMm ?? 900) / 2);
}

function dimensionB(process: SpecialProcessInput): number {
  return process.dimensionBMm ?? Math.max((process.dimensionSumMm ?? 900) - dimensionA(process), 1);
}

function shouldRotateOuterShape(process: SpecialProcessInput, widthCm: number, heightCm: number): boolean {
  if (process.kind !== "outerShape") return false;
  const selectedSide = process.outerShapeSide ?? "long";
  const longSideIsHeight = heightCm > widthCm;
  return selectedSide === "long" ? longSideIsHeight : !longSideIsHeight;
}

function dimensionGuide(process: SpecialProcessInput, width: number, height: number, scale: number, holeWidth: number, holeHeight: number) {
  const { a, b } = processDimensionPx(process, scale, width, height);
  if (process.kind === "innerCutout") {
    const x = (width - holeWidth) / 2;
    const y = (height - holeHeight) / 2;
    return { x, y, width: holeWidth, height: holeHeight };
  }

  if (process.kind === "cutCorner") {
    return { x: width - a, y: 0, width: a, height: b };
  }

  if (process.kind === "outerShape" && process.label === outerShapeOptions[0]) {
    return { x: 0, y: 0, width: a, height: b };
  }

  if (process.kind === "outerShape" && process.label === outerShapeOptions[1]) {
    return { x: 0, y: 0, width: a, height: b };
  }

  if (process.kind === "outerShape" && (process.label === outerShapeOptions[4] || process.label === outerShapeOptions[5])) {
    return { x: (width - a) / 2, y: 0, width: a, height: b };
  }

  if (process.kind === "outerShape" && process.label === outerShapeOptions[8]) {
    return { x: (width - a) / 2, y: 0, width: a, height: b };
  }

  if (process.kind === "outerShape" && process.label === outerShapeOptions[9]) {
    return { x: width - a, y: height - b, width: a, height: b };
  }

  if (process.kind === "outerShape" && process.label === outerShapeOptions[10]) {
    return { x: (width - a) / 2, y: height - b, width: a, height: b };
  }

  if (process.kind === "outerShape" && (process.label === outerShapeOptions[6] || process.label === outerShapeOptions[7])) {
    return { x: width - a, y: 0, width: a, height };
  }

  return { x: 0, y: 0, width, height };
}

function SpecialProcessPreview({ processes, widthCm, heightCm }: { processes: SpecialProcessInput[]; widthCm: number; heightCm: number }) {
  const viewWidth = 280;
  const baseViewHeight = 150;
  const padding = 20;
  const labelRightPadding = 56;
  const labelBottomPadding = 34;
  const safeWidth = Math.max(widthCm, 1);
  const safeHeight = Math.max(heightCm, 1);
  const scale = Math.min((viewWidth - padding * 2 - labelRightPadding) / safeWidth, (baseViewHeight - padding * 2) / safeHeight);
  const boardWidth = safeWidth * scale;
  const boardHeight = safeHeight * scale;
  const viewHeight = Math.max(baseViewHeight, padding * 2 + boardHeight + labelBottomPadding);
  const offsetX = (viewWidth - labelRightPadding - boardWidth) / 2;
  const offsetY = (viewHeight - labelBottomPadding - boardHeight) / 2;
  const holeWidth = boardWidth * 0.34;
  const holeHeight = boardHeight * 0.34;
  const outerShape = processes.find((process) => process.kind === "outerShape");
  const rotateOuterShape = outerShape ? shouldRotateOuterShape(outerShape, widthCm, heightCm) : false;
  const shapeWidth = rotateOuterShape ? boardHeight : boardWidth;
  const shapeHeight = rotateOuterShape ? boardWidth : boardHeight;
  const baseOuterShapeDimensions = outerShape ? processDimensionPx(outerShape, scale, shapeWidth, shapeHeight) : null;
  const baseOuterPath = outerShape && baseOuterShapeDimensions
    ? outerShapePath(outerShape.label, shapeWidth, shapeHeight, baseOuterShapeDimensions.a, baseOuterShapeDimensions.b)
    : null;
  const baseIsEllipse = outerShape?.label === outerShapeOptions[2] || outerShape?.label === outerShapeOptions[3];
  const dimensionProcess = processes.find((process) => process.kind !== "roundCorner" && process.kind !== "quarterRound");
  const dimensionAMm = dimensionProcess ? dimensionA(dimensionProcess) : null;
  const dimensionBMm = dimensionProcess ? dimensionB(dimensionProcess) : null;
  const rawGuide = dimensionProcess ? dimensionGuide(dimensionProcess, shapeWidth, shapeHeight, scale, holeWidth, holeHeight) : null;
  const guide = rawGuide && rotateOuterShape && dimensionProcess?.kind === "outerShape"
    ? { x: boardWidth - rawGuide.y - rawGuide.height, y: rawGuide.x, width: rawGuide.height, height: rawGuide.width }
    : rawGuide;

  return (
    <div className="rounded border bg-background p-2">
      <div className="mb-1 flex items-center justify-between">
        <span className="text-[10px] font-medium">2D加工預覽</span>
        <span className="text-[10px] text-muted-foreground">{widthCm} x {heightCm}cm</span>
      </div>
      <svg viewBox={`0 0 ${viewWidth} ${viewHeight}`} style={{ height: viewHeight }} className="w-full rounded bg-muted/20" role="img" aria-label="特殊加工 2D 預覽">
        <g transform={`translate(${offsetX} ${offsetY})`}>
          {rotateOuterShape && !baseIsEllipse && baseOuterPath ? (
            <g transform={`translate(${boardWidth} 0) rotate(90)`}>
              <path d={baseOuterPath} fill="hsl(var(--primary) / 0.12)" stroke="hsl(var(--border))" strokeWidth="1.5" />
            </g>
          ) : baseIsEllipse ? (
            <ellipse cx={boardWidth / 2} cy={boardHeight / 2} rx={boardWidth / 2} ry={boardHeight / 2} fill="hsl(var(--primary) / 0.12)" stroke="hsl(var(--border))" strokeWidth="1.5" />
          ) : baseOuterPath ? (
            <path d={baseOuterPath} fill="hsl(var(--primary) / 0.12)" stroke="hsl(var(--border))" strokeWidth="1.5" />
          ) : (
            <rect x="0" y="0" width={boardWidth} height={boardHeight} fill="hsl(var(--primary) / 0.12)" stroke="hsl(var(--border))" strokeWidth="1.5" />
          )}
          {processes.map((process, index) => {
            const color = processColor(process.kind);
            const inset = index * 4;
            if (process.kind === "roundCorner" || process.kind === "quarterRound") {
              const radius = Math.max(8, Math.min(Math.min(boardWidth, boardHeight) * 0.22, ((process.radiusMm ?? 80) * scale) / 10));
              return (
                <g key={process.id} stroke={color} strokeWidth="3" fill="none" strokeLinecap="round">
                  <path d={`M ${radius} ${inset} Q ${inset} ${inset} ${inset} ${radius}`} />
                  <path d={`M ${boardWidth - radius} ${inset} Q ${boardWidth - inset} ${inset} ${boardWidth - inset} ${radius}`} />
                  <path d={`M ${boardWidth - inset} ${boardHeight - radius} Q ${boardWidth - inset} ${boardHeight - inset} ${boardWidth - radius} ${boardHeight - inset}`} />
                  <path d={`M ${radius} ${boardHeight - inset} Q ${inset} ${boardHeight - inset} ${inset} ${boardHeight - radius}`} />
                </g>
              );
            }
            if (process.kind === "cutCorner") {
              const { a, b } = processDimensionPx(process, scale, boardWidth, boardHeight);
              return (
                <g key={process.id} stroke={color} strokeWidth="3" fill="hsl(25 92% 45% / 0.14)">
                  <path d={`M ${boardWidth - a - inset} ${inset} L ${boardWidth - inset} ${b + inset} L ${boardWidth - inset} ${inset} Z`} />
                  <line x1={boardWidth - a - inset} y1={inset} x2={boardWidth - inset} y2={b + inset} />
                </g>
              );
            }
            if (process.kind === "innerCutout") {
              if (process.label === innerCutoutOptions[0]) {
                return <ellipse key={process.id} cx={boardWidth / 2} cy={boardHeight / 2} rx={holeWidth / 2} ry={holeHeight / 2} fill="hsl(var(--background))" stroke={color} strokeWidth="3" />;
              }
              if (process.label === innerCutoutOptions[2]) {
                const x = (boardWidth - holeWidth) / 2;
                const y = (boardHeight - holeHeight) / 2;
                return <path key={process.id} d={`M ${x} ${y + holeHeight} V ${y + holeHeight * 0.42} Q ${x + holeWidth / 2} ${y - holeHeight * 0.15} ${x + holeWidth} ${y + holeHeight * 0.42} V ${y + holeHeight} Z`} fill="hsl(var(--background))" stroke={color} strokeWidth="3" />;
              }
              return <rect key={process.id} x={(boardWidth - holeWidth) / 2} y={(boardHeight - holeHeight) / 2} width={holeWidth} height={holeHeight} fill="hsl(var(--background))" stroke={color} strokeWidth="3" />;
            }
            if (process.kind === "outerShape") {
              const rotate = shouldRotateOuterShape(process, widthCm, heightCm);
              const pathWidth = rotate ? boardHeight : boardWidth;
              const pathHeight = rotate ? boardWidth : boardHeight;
              const { a, b } = processDimensionPx(process, scale, pathWidth, pathHeight);
              const path = outerShapePath(process.label, pathWidth, pathHeight, a, b);
              if (process.label === outerShapeOptions[2]) return <circle key={process.id} cx={boardWidth / 2} cy={boardHeight / 2} r={Math.max(Math.min(boardWidth, boardHeight) / 2 - inset, 1)} fill="none" stroke={color} strokeWidth="3" />;
              if (process.label === outerShapeOptions[3]) return <ellipse key={process.id} cx={boardWidth / 2} cy={boardHeight / 2} rx={Math.max(boardWidth / 2 - inset, 1)} ry={Math.max(boardHeight / 2 - inset, 1)} fill="none" stroke={color} strokeWidth="3" />;
              return path ? (
                <g key={process.id} transform={rotate ? `translate(${boardWidth} 0) rotate(90)` : undefined}>
                  <path d={path} fill="none" stroke={color} strokeWidth="3" />
                </g>
              ) : null;
            }
            return null;
          })}
          {dimensionAMm !== null && dimensionBMm !== null && (
            <g stroke="hsl(var(--foreground))" fill="hsl(var(--foreground))" strokeWidth="1">
              <line x1={guide?.x ?? 0} y1={(guide?.y ?? 0) + (guide?.height ?? boardHeight) + 10} x2={(guide?.x ?? 0) + (guide?.width ?? boardWidth)} y2={(guide?.y ?? 0) + (guide?.height ?? boardHeight) + 10} />
              <line x1={guide?.x ?? 0} y1={(guide?.y ?? 0) + (guide?.height ?? boardHeight) + 6} x2={guide?.x ?? 0} y2={(guide?.y ?? 0) + (guide?.height ?? boardHeight) + 14} />
              <line x1={(guide?.x ?? 0) + (guide?.width ?? boardWidth)} y1={(guide?.y ?? 0) + (guide?.height ?? boardHeight) + 6} x2={(guide?.x ?? 0) + (guide?.width ?? boardWidth)} y2={(guide?.y ?? 0) + (guide?.height ?? boardHeight) + 14} />
              <text x={(guide?.x ?? 0) + (guide?.width ?? boardWidth) / 2} y={(guide?.y ?? 0) + (guide?.height ?? boardHeight) + 24} textAnchor="middle" className="text-[9px]">
                A {dimensionAMm}mm
              </text>
              <line x1={(guide?.x ?? 0) + (guide?.width ?? boardWidth) + 10} y1={guide?.y ?? 0} x2={(guide?.x ?? 0) + (guide?.width ?? boardWidth) + 10} y2={(guide?.y ?? 0) + (guide?.height ?? boardHeight)} />
              <line x1={(guide?.x ?? 0) + (guide?.width ?? boardWidth) + 6} y1={guide?.y ?? 0} x2={(guide?.x ?? 0) + (guide?.width ?? boardWidth) + 14} y2={guide?.y ?? 0} />
              <line x1={(guide?.x ?? 0) + (guide?.width ?? boardWidth) + 6} y1={(guide?.y ?? 0) + (guide?.height ?? boardHeight)} x2={(guide?.x ?? 0) + (guide?.width ?? boardWidth) + 14} y2={(guide?.y ?? 0) + (guide?.height ?? boardHeight)} />
              <text x={(guide?.x ?? 0) + (guide?.width ?? boardWidth) + 18} y={(guide?.y ?? 0) + (guide?.height ?? boardHeight) / 2} className="text-[9px]">
                B {dimensionBMm}mm
              </text>
            </g>
          )}
        </g>
      </svg>
    </div>
  );
}

export function SpecialProcessesForm({ value, onChange, boardWidthCm, boardHeightCm }: Props) {
  const update = (index: number, patch: Partial<SpecialProcessInput>) => {
    onChange(value.map((item, i) => (i === index ? { ...item, ...patch } : item)));
  };
  const updateDimensions = (index: number, item: SpecialProcessInput, patch: { dimensionAMm?: number; dimensionBMm?: number }) => {
    const nextA = patch.dimensionAMm ?? dimensionA(item);
    const nextB = patch.dimensionBMm ?? dimensionB(item);
    update(index, {
      ...patch,
      dimensionSumMm: nextA + nextB,
    });
  };

  const remove = (index: number) => {
    onChange(value.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-2 rounded border bg-background p-2">
      <div className="flex items-center justify-between gap-2">
        <Label className="text-xs font-medium">特殊加工</Label>
        <Button type="button" variant="outline" size="sm" className="h-7 px-2 text-xs" onClick={() => onChange([...value, defaultProcess()])}>
          <Plus className="mr-1 h-3 w-3" />
          新增
        </Button>
      </div>
      {value.length === 0 && <p className="text-xs text-muted-foreground">未設定板外造型、內開孔、切角或導圓。</p>}
      {value.map((item, index) => (
        <div key={item.id} className="space-y-2 rounded border bg-muted/20 p-2">
          <div className="grid gap-2 sm:grid-cols-[1fr_1fr_80px_32px]">
            <div>
              <Label className="text-[10px] text-muted-foreground">加工類型</Label>
              <Select
                value={item.kind}
                onValueChange={(kind) => {
                  const nextKind = kind as SpecialProcessKind;
                  update(index, {
                    kind: nextKind,
                    label: defaultLabels[nextKind],
                    radiusMm: defaultRadius(nextKind),
                    radiusMode: nextKind === "roundCorner" || nextKind === "quarterRound" ? "factory" : item.radiusMode,
                  });
                }}
              >
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="outerShape">板外造型</SelectItem>
                  <SelectItem value="innerCutout">板內開孔</SelectItem>
                  <SelectItem value="cutCorner">切角</SelectItem>
                  <SelectItem value="roundCorner">導圓</SelectItem>
                  <SelectItem value="quarterRound">1/4圓</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-[10px] text-muted-foreground">名稱 / 圖示</Label>
              {item.kind === "outerShape" || item.kind === "innerCutout" ? (
                <Select
                  value={item.label || defaultLabels[item.kind]}
                  onValueChange={(label) => update(index, { label })}
                >
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {(item.kind === "outerShape" ? outerShapeOptions : innerCutoutOptions).map((option, optionIndex) => (
                      <SelectItem key={`${option}-${optionIndex}`} value={option}>{option}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <Input
                  className="h-8 text-xs"
                  value={item.label}
                  onChange={(event) => update(index, { label: event.target.value })}
                  placeholder={defaultLabels[item.kind]}
                />
              )}
            </div>

            <div>
              <Label className="text-[10px] text-muted-foreground">數量</Label>
              <Input
                type="number"
                min={1}
                className="h-8 text-xs"
                value={item.quantity}
                onChange={(event) => update(index, { quantity: Number(event.target.value) })}
              />
            </div>
            <Button type="button" variant="ghost" size="icon" className="mt-4 h-8 w-8 text-destructive" onClick={() => remove(index)}>
              <Trash2 className="h-3 w-3" />
            </Button>
          </div>

          {item.kind === "roundCorner" || item.kind === "quarterRound" ? (
            <div className="grid gap-2 sm:grid-cols-2">
              <div>
                <Label className="text-[10px] text-muted-foreground">模式</Label>
                <Select
                  value={item.radiusMode ?? "factory"}
                  onValueChange={(radiusMode) => update(index, { radiusMode: radiusMode as "factory" | "custom" })}
                >
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="factory">廠模</SelectItem>
                    <SelectItem value="custom">客製</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-[10px] text-muted-foreground">R 值 mm</Label>
                {(item.radiusMode ?? "factory") === "factory" ? (
                  <Select
                    value={String(item.radiusMm ?? 80)}
                    onValueChange={(radiusMm) => update(index, { radiusMm: Number(radiusMm) })}
                  >
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {factoryRadiusOptions.map((radius) => (
                        <SelectItem key={radius} value={String(radius)}>R{radius}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <Input
                    type="number"
                    min={1}
                    className="h-8 text-xs"
                    value={item.radiusMm ?? 450}
                    onChange={(event) => update(index, { radiusMm: Number(event.target.value) })}
                  />
                )}
              </div>
            </div>
          ) : (
            <div className="grid gap-2 sm:grid-cols-3">
              {item.kind === "outerShape" && (
                <div>
                  <Label className="text-[10px] text-muted-foreground">造型位置</Label>
                  <Select
                    value={item.outerShapeSide ?? "long"}
                    onValueChange={(outerShapeSide) => update(index, { outerShapeSide: outerShapeSide as "long" | "short" })}
                  >
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="long">長邊</SelectItem>
                      <SelectItem value="short">短邊</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
              <div>
                <Label className="text-[10px] text-muted-foreground">A(mm)</Label>
                <Input
                  type="number"
                  min={1}
                  className="h-8 text-xs"
                  value={dimensionA(item)}
                  onChange={(event) => updateDimensions(index, item, { dimensionAMm: Number(event.target.value) })}
                />
              </div>
              <div>
                <Label className="text-[10px] text-muted-foreground">B(mm)</Label>
                <Input
                  type="number"
                  min={1}
                  className="h-8 text-xs"
                  value={dimensionB(item)}
                  onChange={(event) => updateDimensions(index, item, { dimensionBMm: Number(event.target.value) })}
                />
              </div>
              <div>
                <Label className="text-[10px] text-muted-foreground">封邊</Label>
                <Select
                  value={item.edgeBanding}
                  onValueChange={(edgeBanding) => update(index, { edgeBanding: edgeBanding as "none" | "withEdge" })}
                >
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="withEdge">有封邊</SelectItem>
                    <SelectItem value="none">不封邊</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          <div className="grid gap-2 sm:grid-cols-2">
            <div>
              <Label className="text-[10px] text-muted-foreground">手工刻尖 &gt;=90度 角數</Label>
              <Input
                type="number"
                min={0}
                className="h-8 text-xs"
                value={item.sharpCornerGte90Count ?? 0}
                onChange={(event) => update(index, { sharpCornerGte90Count: Number(event.target.value) })}
              />
            </div>
            <div>
              <Label className="text-[10px] text-muted-foreground">手工刻尖 &lt;90度 角數</Label>
              <Input
                type="number"
                min={0}
                className="h-8 text-xs"
                value={item.sharpCornerLt90Count ?? 0}
                onChange={(event) => update(index, { sharpCornerLt90Count: Number(event.target.value) })}
              />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
