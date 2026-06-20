"use client";

import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ZHENGDAO_2025_DOOR_PROCESS_RULE_BY_CODE } from "@/lib/config/vendors/zhengdao-door-processes";
import {
  ZHENGDAO_PARTITION_DOORS,
  resolveZhengdaoDoorSelection,
} from "@/lib/config/vendors/zhengdao-door-2025";
import { generateId } from "@/lib/utils";
import { DEFAULT_DOOR_ADDONS, type DoorInput } from "@/types";
import type { ZhengdaoDoorProcessCode, ZhengdaoDoorSelection } from "@/types";

interface Props {
  doors: DoorInput[];
  onChange: (doors: DoorInput[]) => void;
}

type PartitionDoorType = "GD" | "GW" | "BGD" | "H8" | "S2";
type AluminumFrameColor = "ALUMINUM" | "BLACK" | "WHITE";

function isPartitionDoor(door: DoorInput): boolean {
  return door.zhengdaoDoorSelection?.mode === "PARTITION_DOOR";
}

const ALUMINUM_FRAME_PARTITION_PROCESS_CODES = [
  "ALUMINUM_FRAME_PARTITION_A1",
  "ALUMINUM_FRAME_PARTITION_A1_1",
  "ALUMINUM_FRAME_PARTITION_A1_2",
  "ALUMINUM_FRAME_PARTITION_A2",
  "ALUMINUM_FRAME_PARTITION_A2_1",
  "ALUMINUM_FRAME_PARTITION_A2_2",
] as const satisfies readonly ZhengdaoDoorProcessCode[];
const DEFAULT_ALUMINUM_FRAME_PARTITION_PROCESS_CODE: ZhengdaoDoorProcessCode = "ALUMINUM_FRAME_PARTITION_A1";
const H8_OPTION_PROCESS_CODES = [
  "H8_SEPARATOR",
  "H8_TRACK_ALUMINUM",
  "H8_TRACK_ANODIZED",
  "H8_TRACK_WHITE",
  "H8_BUFFER",
  "H8_L_STOP",
  "H8_HOOK_LOCK",
  "H8_HOOK_LOCK_KEY",
] as const satisfies readonly ZhengdaoDoorProcessCode[];
const S2_OPTION_PROCESS_CODES = [
  "S2_SEPARATOR",
  "S2_TRACK_SINGLE",
  "S2_TRACK_DOUBLE",
  "S2_TRACK_TRIPLE",
  "S2_TRACK_DOUBLE_ANODIZED",
  "S2_TRACK_DOUBLE_WHITE",
  "S2_BUFFER",
  "S2_HOOK_LOCK",
  "S2_HOOK_LOCK_KEY",
] as const satisfies readonly ZhengdaoDoorProcessCode[];
const DOOR_SPECIFIC_PROCESS_CODES = [
  ...H8_OPTION_PROCESS_CODES,
  ...S2_OPTION_PROCESS_CODES,
] as const satisfies readonly ZhengdaoDoorProcessCode[];

function isAluminumFramePartitionProcessCode(
  code: ZhengdaoDoorProcessCode,
): code is (typeof ALUMINUM_FRAME_PARTITION_PROCESS_CODES)[number] {
  return ALUMINUM_FRAME_PARTITION_PROCESS_CODES.some((candidate) => candidate === code);
}

function isDoorSpecificProcessCode(code: ZhengdaoDoorProcessCode): boolean {
  return DOOR_SPECIFIC_PROCESS_CODES.some((candidate) => candidate === code);
}

function isAluminumFramePartitionDoor(door: DoorInput): boolean {
  const optionCode = door.zhengdaoDoorSelection?.optionCode ?? "";
  return optionCode.startsWith("H8-") || optionCode.startsWith("S2-");
}

function partitionDoorTypeFromOption(optionCode: string | undefined): PartitionDoorType {
  if (optionCode?.startsWith("H8-")) return "H8";
  if (optionCode?.startsWith("S2-")) return "S2";
  if (optionCode === "GW") return "GW";
  if (optionCode === "BGD") return "BGD";
  return "GD";
}

function aluminumFrameColorFromOption(optionCode: string | undefined): AluminumFrameColor {
  if (optionCode?.endsWith("WHITE")) return "WHITE";
  if (optionCode?.endsWith("BLACK")) return "BLACK";
  return "ALUMINUM";
}

function optionCodeForPartitionDoor(type: PartitionDoorType, color: AluminumFrameColor): string {
  if (type === "H8") {
    if (color === "BLACK") return "H8-BLACK";
    if (color === "WHITE") return "H8-WHITE";
    return "H8-ALUMINUM";
  }
  if (type === "S2") {
    if (color === "BLACK") return "S2-BLACK";
    if (color === "WHITE") return "S2-WHITE";
    return "S2-ALUMINUM";
  }
  return type;
}

function aluminumFrameDoorKind(optionCode: string | undefined): "H8" | "S2" | "OTHER" {
  if (optionCode?.startsWith("H8-")) return "H8";
  if (optionCode?.startsWith("S2-")) return "S2";
  return "OTHER";
}

function doorSpecificProcessCodes(door: DoorInput): readonly ZhengdaoDoorProcessCode[] {
  const optionCode = door.zhengdaoDoorSelection?.optionCode ?? "";
  if (optionCode.startsWith("H8-")) return H8_OPTION_PROCESS_CODES;
  if (optionCode.startsWith("S2-")) return S2_OPTION_PROCESS_CODES;
  return [];
}

function selectableDoorSpecificProcessCodes(door: DoorInput): readonly ZhengdaoDoorProcessCode[] {
  return doorSpecificProcessCodes(door).filter((code) => (
    code !== "H8_TRACK_ANODIZED"
    && code !== "H8_TRACK_WHITE"
    && code !== "S2_TRACK_DOUBLE_ANODIZED"
    && code !== "S2_TRACK_DOUBLE_WHITE"
  ));
}

function doorSpecificProcessLabel(door: DoorInput): string {
  const optionCode = door.zhengdaoDoorSelection?.optionCode ?? "";
  return optionCode.startsWith("H8-") ? "H8 五金與加工品項" : "S2 五金與加工品項";
}

function withoutAluminumFramePartitionProcesses(door: DoorInput): DoorInput["zhengdaoProcesses"] {
  return (door.zhengdaoProcesses ?? []).filter(
    (process) => !isAluminumFramePartitionProcessCode(process.code),
  );
}

function withoutDoorSpecificProcesses(door: DoorInput): DoorInput["zhengdaoProcesses"] {
  return (door.zhengdaoProcesses ?? []).filter((process) => !isDoorSpecificProcessCode(process.code));
}

function selectedAluminumFramePartitionProcessCode(door: DoorInput): ZhengdaoDoorProcessCode | "none" {
  return (door.zhengdaoProcesses ?? []).find((process) => (
    isAluminumFramePartitionProcessCode(process.code)
  ))?.code ?? DEFAULT_ALUMINUM_FRAME_PARTITION_PROCESS_CODE;
}

function processQuantityLabel(code: ZhengdaoDoorProcessCode): string {
  const rule = ZHENGDAO_2025_DOOR_PROCESS_RULE_BY_CODE[code];
  if (rule.billingMode === "PER_CHI") return "尺數";
  if (rule.billingMode === "PER_CAI") return "計價倍率";
  return "數量";
}

function processPriceLabel(code: ZhengdaoDoorProcessCode): string {
  const rule = ZHENGDAO_2025_DOOR_PROCESS_RULE_BY_CODE[code];
  if (code === "H8_TRACK_ALUMINUM") return "300 / 350 元/尺";
  if (code === "S2_TRACK_DOUBLE") return "200 / 340 元/尺";
  if (rule.billingMode === "PER_CHI") return `${rule.unitPrice} 元/尺`;
  if (rule.billingMode === "PER_CAI") return `${rule.unitPrice} 元/才`;
  return `${rule.unitPrice} 元/${rule.unitPrice === 200 && code === "H8_L_STOP" ? "個" : "組"}`;
}

function processDisplayName(code: ZhengdaoDoorProcessCode): string {
  if (code === "H8_TRACK_ALUMINUM" || code === "H8_TRACK_ANODIZED") return "H8 軌道加購";
  if (code === "S2_TRACK_DOUBLE" || code === "S2_TRACK_DOUBLE_ANODIZED") return "S2 雙軌（上、下）";
  return ZHENGDAO_2025_DOOR_PROCESS_RULE_BY_CODE[code].name;
}

function isH8TrackColorCode(code: ZhengdaoDoorProcessCode): boolean {
  return code === "H8_TRACK_ALUMINUM" || code === "H8_TRACK_ANODIZED" || code === "H8_TRACK_WHITE";
}

function isS2DoubleTrackColorCode(code: ZhengdaoDoorProcessCode): boolean {
  return code === "S2_TRACK_DOUBLE" || code === "S2_TRACK_DOUBLE_ANODIZED" || code === "S2_TRACK_DOUBLE_WHITE";
}

function normalizedProcessSelectCode(code: ZhengdaoDoorProcessCode): ZhengdaoDoorProcessCode {
  if (code === "H8_TRACK_ANODIZED" || code === "H8_TRACK_WHITE") return "H8_TRACK_ALUMINUM";
  if (code === "S2_TRACK_DOUBLE_ANODIZED" || code === "S2_TRACK_DOUBLE_WHITE") return "S2_TRACK_DOUBLE";
  return code;
}

function withDefaultAluminumFramePartitionProcess(door: DoorInput): DoorInput["zhengdaoProcesses"] {
  const existingProcesses = door.zhengdaoProcesses ?? [];
  if (existingProcesses.some((process) => isAluminumFramePartitionProcessCode(process.code))) {
    return existingProcesses;
  }

  return [
    ...existingProcesses,
    {
      id: `${door.id}-${DEFAULT_ALUMINUM_FRAME_PARTITION_PROCESS_CODE.toLowerCase()}`,
      code: DEFAULT_ALUMINUM_FRAME_PARTITION_PROCESS_CODE,
      quantityPerDoor: 1,
    },
  ];
}

function emptyPartitionDoor(): DoorInput {
  const selection: ZhengdaoDoorSelection = {
    mode: "PARTITION_DOOR",
    optionCode: ZHENGDAO_PARTITION_DOORS[0]?.code ?? "",
  };
  const resolved = resolveZhengdaoDoorSelection(selection);

  return {
    id: generateId(),
    type: "SLIDING",
    name: "隔間門",
    widthCm: 90,
    heightCm: 240,
    quantity: 1,
    materialRef: resolved?.materialRef ?? null,
    addons: DEFAULT_DOOR_ADDONS,
    includeHingeInQuote: false,
    includeSlidingHardwareInQuote: false,
    hingeMaterialRef: null,
    railMaterialRef: null,
    wireMeshMaterialRef: null,
    useAluminumHandle: false,
    aluminumHandleMaterialRef: null,
    hardwareItems: [],
    zhengdaoDoorSelection: resolved?.selection ?? selection,
    zhengdaoProcesses: [],
  };
}

function PartitionDoorTypePicker({
  door,
  onSelect,
}: {
  door: DoorInput;
  onSelect: (selection: ZhengdaoDoorSelection, materialRef: NonNullable<DoorInput["materialRef"]>) => void;
}) {
  const optionCode = door.zhengdaoDoorSelection?.optionCode;
  const doorType = partitionDoorTypeFromOption(optionCode);
  const frameColor = aluminumFrameColorFromOption(optionCode);
  const result = resolveZhengdaoDoorSelection(
    door.zhengdaoDoorSelection ?? { mode: "PARTITION_DOOR", optionCode: optionCodeForPartitionDoor(doorType, frameColor) },
  );

  const commit = (nextType: PartitionDoorType, nextColor: AluminumFrameColor) => {
    const resolved = resolveZhengdaoDoorSelection({
      mode: "PARTITION_DOOR",
      optionCode: optionCodeForPartitionDoor(nextType, nextColor),
    });
    if (resolved) onSelect(resolved.selection, resolved.materialRef);
  };

  return (
    <div className="space-y-3 rounded border bg-background p-3">
      <div>
        <Label className="text-[10px] text-muted-foreground">隔間門類型</Label>
        <Select value={doorType} onValueChange={(value: PartitionDoorType) => commit(value, frameColor)}>
          <SelectTrigger className="mt-1 h-8 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="GD">GD 格柵門板</SelectItem>
            <SelectItem value="GW">GW 格柵壁板／天花板</SelectItem>
            <SelectItem value="BGD">BGD 隔柵透氣門</SelectItem>
            <SelectItem value="H8">H8 鋁框懸吊門</SelectItem>
            <SelectItem value="S2">S2 鋁框落地推拉門</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {(doorType === "H8" || doorType === "S2") && (
        <div>
          <Label className="text-[10px] text-muted-foreground">鋁框色</Label>
          <div className="mt-1 grid grid-cols-3 gap-1.5">
            <label className="flex h-8 items-center gap-1.5 rounded border bg-muted/20 px-2 text-[11px]">
              <input
                type="checkbox"
                className="h-3.5 w-3.5 accent-blue-600"
                checked={frameColor === "ALUMINUM"}
                onChange={() => commit(doorType, "ALUMINUM")}
              />
              鋁色
            </label>
            <label className="flex h-8 items-center gap-1.5 rounded border bg-muted/20 px-2 text-[11px]">
              <input
                type="checkbox"
                className="h-3.5 w-3.5 accent-blue-600"
                checked={frameColor === "BLACK"}
                onChange={() => commit(doorType, "BLACK")}
              />
              黑色
            </label>
            <label className="flex h-8 items-center gap-1.5 rounded border bg-muted/20 px-2 text-[11px]">
              <input
                type="checkbox"
                className="h-3.5 w-3.5 accent-blue-600"
                checked={frameColor === "WHITE"}
                onChange={() => commit(doorType, "WHITE")}
              />
              白色
            </label>
          </div>
        </div>
      )}

      {result && (
        <div className="rounded border border-blue-200 bg-blue-50 px-3 py-2 text-xs">
          <p className="font-medium text-blue-900">{result.materialRef.materialName}</p>
          <p className="mt-1 text-blue-800">
            {result.materialRef.pricePerUnit} 元/才，基本才 {result.materialRef.minCai ?? 0} 才
          </p>
          <p className="mt-1 leading-relaxed text-blue-700">{result.note}</p>
        </div>
      )}
    </div>
  );
}

function TrackColorCheckboxes({
  aluminumLabel,
  blackLabel,
  whiteLabel,
  value,
  onChange,
}: {
  aluminumLabel: string;
  blackLabel: string;
  whiteLabel: string;
  value: "ALUMINUM" | "BLACK" | "WHITE";
  onChange: (value: "ALUMINUM" | "BLACK" | "WHITE") => void;
}) {
  return (
    <div className="mt-2">
      <Label className="text-[10px] text-muted-foreground">軌道顏色</Label>
      <div className="mt-1 grid grid-cols-3 gap-1.5">
      <label className="flex h-8 items-center gap-1.5 rounded border bg-background px-2 text-[11px]">
        <input
          type="checkbox"
          className="h-3.5 w-3.5 accent-blue-600"
          checked={value === "ALUMINUM"}
          onChange={() => onChange("ALUMINUM")}
        />
        {aluminumLabel}
      </label>
      <label className="flex h-8 items-center gap-1.5 rounded border bg-background px-2 text-[11px]">
        <input
          type="checkbox"
          className="h-3.5 w-3.5 accent-blue-600"
          checked={value === "BLACK"}
          onChange={() => onChange("BLACK")}
        />
        {blackLabel}
      </label>
      <label className="flex h-8 items-center gap-1.5 rounded border bg-background px-2 text-[11px]">
        <input
          type="checkbox"
          className="h-3.5 w-3.5 accent-blue-600"
          checked={value === "WHITE"}
          onChange={() => onChange("WHITE")}
        />
        {whiteLabel}
      </label>
      </div>
    </div>
  );
}

export function ZhengdaoPartitionDoorsForm({ doors, onChange }: Props) {
  const partitionEntries = doors
    .map((door, index) => ({ door, index }))
    .filter(({ door }) => isPartitionDoor(door));

  const update = (doorIndex: number, patch: Partial<DoorInput>) => {
    onChange(doors.map((door, index) => (index === doorIndex ? { ...door, ...patch } : door)));
  };

  const remove = (doorIndex: number) => {
    onChange(doors.filter((_, index) => index !== doorIndex));
  };

  return (
    <div className="space-y-3 rounded-md border border-dashed bg-background p-3">
      <div className="flex items-center justify-between">
        <div>
          <Label className="text-sm font-semibold">隔間門</Label>
          <p className="text-[10px] text-muted-foreground">隔間門獨立於系統櫃門片，不會混入門片分類。</p>
        </div>
        <Button type="button" variant="outline" size="sm" onClick={() => onChange([...doors, emptyPartitionDoor()])}>
          <Plus className="mr-1 h-3 w-3" />
          新增隔間門
        </Button>
      </div>

      {partitionEntries.length === 0 && <p className="text-xs text-muted-foreground">尚未新增隔間門。</p>}

      {partitionEntries.map(({ door, index }) => (
        <div key={door.id} className="space-y-2 rounded-md border bg-muted/20 p-3">
          <div className="flex items-center justify-between gap-2">
            <Input
              className="h-8 text-xs"
              placeholder="隔間門名稱"
              value={door.name}
              onChange={(event) => update(index, { name: event.target.value })}
            />
            <Button type="button" variant="ghost" size="icon" onClick={() => remove(index)} className="h-8 w-8 text-destructive">
              <Trash2 className="h-3 w-3" />
            </Button>
          </div>

          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            <div>
              <Label className="text-[10px] text-muted-foreground">寬(cm)</Label>
              <Input
                type="number"
                min={1}
                className="h-8 text-xs"
                value={door.widthCm}
                onChange={(event) => update(index, { widthCm: Number(event.target.value) })}
              />
            </div>
            <div>
              <Label className="text-[10px] text-muted-foreground">高(cm)</Label>
              <Input
                type="number"
                min={1}
                className="h-8 text-xs"
                value={door.heightCm}
                onChange={(event) => update(index, { heightCm: Number(event.target.value) })}
              />
            </div>
            <div>
              <Label className="text-[10px] text-muted-foreground">數量</Label>
              <Input
                type="number"
                min={1}
                className="h-8 text-xs"
                value={door.quantity}
                onChange={(event) => update(index, { quantity: Number(event.target.value) })}
              />
            </div>
          </div>

          <PartitionDoorTypePicker
            door={door}
            onSelect={(zhengdaoDoorSelection, materialRef) => {
              const nextDoor = { ...door, zhengdaoDoorSelection, materialRef };
              const previousKind = aluminumFrameDoorKind(door.zhengdaoDoorSelection?.optionCode);
              const nextKind = aluminumFrameDoorKind(zhengdaoDoorSelection.optionCode);
              const baseProcesses = previousKind === nextKind
                ? door.zhengdaoProcesses ?? []
                : withoutDoorSpecificProcesses(door);
              update(index, {
                zhengdaoDoorSelection,
                materialRef,
                zhengdaoProcesses: isAluminumFramePartitionDoor(nextDoor)
                  ? withDefaultAluminumFramePartitionProcess({
                      ...door,
                      zhengdaoProcesses: baseProcesses,
                    })
                  : withoutDoorSpecificProcesses({
                      ...door,
                      zhengdaoProcesses: withoutAluminumFramePartitionProcesses(door),
                    }),
              });
            }}
          />

          {isAluminumFramePartitionDoor(door) && (
            <div className="rounded border bg-background p-2">
              <Label className="text-[10px] text-muted-foreground">鋁框門區隔加工</Label>
              <Select
                value={selectedAluminumFramePartitionProcessCode(door)}
                onValueChange={(value) => {
                  const code = value as ZhengdaoDoorProcessCode;
                  update(index, {
                    zhengdaoProcesses: [
                      ...(withoutAluminumFramePartitionProcesses(door) ?? []),
                      { id: `${door.id}-${code.toLowerCase()}`, code, quantityPerDoor: 1 },
                    ],
                  });
                }}
              >
                <SelectTrigger className="mt-1 h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ALUMINUM_FRAME_PARTITION_PROCESS_CODES.map((code) => {
                    const rule = ZHENGDAO_2025_DOOR_PROCESS_RULE_BY_CODE[code];
                    return (
                      <SelectItem key={code} value={code}>
                        {rule.name}（+{rule.unitPrice} 元/才）
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>
          )}

          {isAluminumFramePartitionDoor(door) && (
            <div className="space-y-2 rounded border bg-background p-2">
              <div>
                <p className="mb-1 text-[10px] font-semibold text-muted-foreground">五金</p>
                <Label className="text-[10px] text-muted-foreground">{doorSpecificProcessLabel(door)}</Label>
                <p className="mt-0.5 text-[10px] text-muted-foreground">可新增多筆，軌道、緩衝器、鉤鎖等五金可分別計價。</p>
              </div>
              <Select
                value="add"
                onValueChange={(value) => {
                  if (value === "add") return;
                  const code = value as ZhengdaoDoorProcessCode;
                  update(index, {
                    zhengdaoProcesses: [
                      ...(door.zhengdaoProcesses ?? []),
                      { id: `${door.id}-${code.toLowerCase()}-${generateId()}`, code, quantityPerDoor: 1 },
                    ],
                  });
                }}
              >
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="add">新增五金/加工品項</SelectItem>
                  {selectableDoorSpecificProcessCodes(door).map((code) => (
                    <SelectItem key={code} value={code}>
                      {processDisplayName(code)}（{processPriceLabel(code)}）
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {(door.zhengdaoProcesses ?? []).filter((process) => (
                doorSpecificProcessCodes(door).some((code) => code === process.code)
              )).map((process) => (
                <div key={process.id} className="space-y-2 rounded border bg-muted/20 p-2">
                  <div>
                    <Label className="text-[10px] text-muted-foreground">五金品項</Label>
                    <Select
                      value={normalizedProcessSelectCode(process.code)}
                      onValueChange={(value) => {
                        const code = value as ZhengdaoDoorProcessCode;
                        update(index, {
                          zhengdaoProcesses: (door.zhengdaoProcesses ?? []).map((item) => (
                            item.id === process.id ? { ...item, code } : item
                          )),
                        });
                      }}
                    >
                      <SelectTrigger className="h-8 min-w-0 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {selectableDoorSpecificProcessCodes(door).map((code) => (
                          <SelectItem key={code} value={code}>
                            {processDisplayName(code)}（{processPriceLabel(code)}）
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {isH8TrackColorCode(process.code) && (
                      <TrackColorCheckboxes
                        aluminumLabel="鋁本色"
                        blackLabel="陽極黑"
                        whiteLabel="陽極白"
                        value={
                          process.code === "H8_TRACK_ANODIZED"
                            ? "BLACK"
                            : process.code === "H8_TRACK_WHITE"
                              ? "WHITE"
                              : "ALUMINUM"
                        }
                        onChange={(color) => update(index, {
                          zhengdaoProcesses: (door.zhengdaoProcesses ?? []).map((item) => (
                            item.id === process.id
                              ? {
                                  ...item,
                                  code: color === "BLACK"
                                    ? "H8_TRACK_ANODIZED"
                                    : color === "WHITE"
                                      ? "H8_TRACK_WHITE"
                                      : "H8_TRACK_ALUMINUM",
                                }
                              : item
                          )),
                        })}
                      />
                    )}
                    {isS2DoubleTrackColorCode(process.code) && (
                      <TrackColorCheckboxes
                        aluminumLabel="鋁色"
                        blackLabel="陽極黑"
                        whiteLabel="陽極白"
                        value={
                          process.code === "S2_TRACK_DOUBLE_ANODIZED"
                            ? "BLACK"
                            : process.code === "S2_TRACK_DOUBLE_WHITE"
                              ? "WHITE"
                              : "ALUMINUM"
                        }
                        onChange={(color) => update(index, {
                          zhengdaoProcesses: (door.zhengdaoProcesses ?? []).map((item) => (
                            item.id === process.id
                              ? {
                                  ...item,
                                  code: color === "BLACK"
                                    ? "S2_TRACK_DOUBLE_ANODIZED"
                                    : color === "WHITE"
                                      ? "S2_TRACK_DOUBLE_WHITE"
                                      : "S2_TRACK_DOUBLE",
                                }
                              : item
                          )),
                        })}
                      />
                    )}
                  </div>
                  <div className="grid grid-cols-[minmax(0,1fr)_36px] items-end gap-2">
                    <div>
                      <Label className="text-[10px] text-muted-foreground">{processQuantityLabel(process.code)}</Label>
                      <Input
                        type="number"
                        min={0.1}
                        step={0.1}
                        className="h-8 text-xs"
                        value={process.quantityPerDoor}
                        onChange={(event) => update(index, {
                          zhengdaoProcesses: (door.zhengdaoProcesses ?? []).map((item) => (
                            item.id === process.id ? { ...item, quantityPerDoor: Number(event.target.value) } : item
                          )),
                        })}
                      />
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive"
                      onClick={() => update(index, {
                        zhengdaoProcesses: (door.zhengdaoProcesses ?? []).filter((item) => item.id !== process.id),
                      })}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
