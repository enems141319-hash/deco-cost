"use client";

import { useEffect, useState } from "react";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  ZHENGDAO_DOOR_SHAPES,
  ZHENGDAO_DOOR_CATALOG_CATEGORIES,
  ZHENGDAO_DOOR_MATERIAL_TIERS,
  ZHENGDAO_FINISHED_DOORS,
  ZHENGDAO_FLAT_DOORS,
  ZHENGDAO_PARTITION_DOORS,
  ZHENGDAO_SHAPED_BASE_DOORS,
  resolveZhengdaoDoorTieredOption,
  resolveZhengdaoDoorSelection,
} from "@/lib/config/vendors/zhengdao-door-2025";
import type {
  ZhengdaoDoorCatalogCategory,
  ZhengdaoDoorCatalogCategoryCode,
  ZhengdaoTieredDoorCatalogOption,
} from "@/lib/config/vendors/zhengdao-door-2025";
import type { MaterialRef, ZhengdaoDoorMaterialTier, ZhengdaoDoorPricingMode, ZhengdaoDoorSelection } from "@/types";

const MODE_LABELS: Record<ZhengdaoDoorPricingMode, string> = {
  FLAT: "平板門板",
  FINISHED: "特殊成品門板",
  SHAPED: "造型門板",
  PARTITION_DOOR: "隔間門",
};

export const SYSTEM_ZHENGDAO_DOOR_MODES = ["FLAT", "FINISHED"] as const satisfies readonly ZhengdaoDoorPricingMode[];
export const PARTITION_ZHENGDAO_DOOR_MODES = ["PARTITION_DOOR"] as const satisfies readonly ZhengdaoDoorPricingMode[];

function defaultSelection(mode: ZhengdaoDoorPricingMode): ZhengdaoDoorSelection {
  if (mode === "FLAT") return { mode, optionCode: ZHENGDAO_FLAT_DOORS[0].code };
  if (mode === "FINISHED") return { mode, optionCode: ZHENGDAO_FINISHED_DOORS[0].code };
  if (mode === "PARTITION_DOOR") return { mode, optionCode: ZHENGDAO_PARTITION_DOORS[0].code };
  return { mode, baseCode: ZHENGDAO_SHAPED_BASE_DOORS[0].code, optionCode: ZHENGDAO_DOOR_SHAPES[0].code };
}

function isAllowedMode(
  mode: ZhengdaoDoorPricingMode,
  allowedModes: readonly ZhengdaoDoorPricingMode[],
): boolean {
  return allowedModes.includes(mode);
}

function categoryForSelection(selection: ZhengdaoDoorSelection): ZhengdaoDoorCatalogCategory {
  if (selection.mode === "FLAT") return ZHENGDAO_DOOR_CATALOG_CATEGORIES[0];
  if (selection.mode === "FINISHED") {
    return ZHENGDAO_DOOR_CATALOG_CATEGORIES.find((category) => (
      category.options.some((option) => option.code === selection.optionCode)
      || category.tieredOptions?.some((option) => option.code === selection.optionCode)
    )) ?? ZHENGDAO_DOOR_CATALOG_CATEGORIES[1];
  }
  return ZHENGDAO_DOOR_CATALOG_CATEGORIES[0];
}

function selectionForCategory(category: ZhengdaoDoorCatalogCategory): ZhengdaoDoorSelection | null {
  const firstTieredOption = category.tieredOptions?.[0];
  if (firstTieredOption) return { mode: "FINISHED", optionCode: firstTieredOption.code, materialTier: "JM_ER" };

  const firstOption = category.options[0];
  if (!firstOption) return null;
  if (category.mode === "FLAT") return { mode: "FLAT", optionCode: firstOption.code };
  return { mode: "FINISHED", optionCode: firstOption.code };
}

export function ZhengdaoDoorMaterialPicker({
  value,
  onChange,
  allowedModes = SYSTEM_ZHENGDAO_DOOR_MODES,
  hideModeSelect = true,
  modeLabel = "正道門板計價類型",
}: {
  value?: ZhengdaoDoorSelection;
  onChange: (selection: ZhengdaoDoorSelection, materialRef: MaterialRef) => void;
  allowedModes?: readonly ZhengdaoDoorPricingMode[];
  hideModeSelect?: boolean;
  modeLabel?: string;
}) {
  const fallbackMode = allowedModes[0] ?? "FLAT";
  const valueResult = value && isAllowedMode(value.mode, allowedModes) ? resolveZhengdaoDoorSelection(value) : null;
  const selection = valueResult ? valueResult.selection : defaultSelection(fallbackMode);
  const result = resolveZhengdaoDoorSelection(selection);
  const [selectedCategoryCode, setSelectedCategoryCode] = useState<ZhengdaoDoorCatalogCategoryCode>(
    categoryForSelection(selection).code,
  );
  const selectedCategory = ZHENGDAO_DOOR_CATALOG_CATEGORIES.find((category) => category.code === selectedCategoryCode)
    ?? ZHENGDAO_DOOR_CATALOG_CATEGORIES[0];
  const hasTieredOptions = (selectedCategory.tieredOptions?.length ?? 0) > 0;
  const showResult = allowedModes.includes("PARTITION_DOOR") || selectedCategory.options.length > 0 || hasTieredOptions;

  const commit = (next: ZhengdaoDoorSelection) => {
    const resolved = resolveZhengdaoDoorSelection(next);
    if (resolved) onChange(resolved.selection, resolved.materialRef);
  };

  const commitCategory = (categoryCode: ZhengdaoDoorCatalogCategoryCode) => {
    const category = ZHENGDAO_DOOR_CATALOG_CATEGORIES.find((candidate) => candidate.code === categoryCode);
    if (!category) return;
    setSelectedCategoryCode(category.code);
    const nextSelection = selectionForCategory(category);
    if (nextSelection) commit(nextSelection);
  };

  useEffect(() => {
    if (valueResult || !result) return;
    onChange(result.selection, result.materialRef);
  }, [onChange, result, valueResult]);

  const valueCategoryCode = valueResult ? categoryForSelection(valueResult.selection).code : null;

  useEffect(() => {
    if (!valueCategoryCode) return;
    setSelectedCategoryCode(valueCategoryCode);
  }, [valueCategoryCode]);

  return (
    <div className="space-y-3 rounded border bg-background p-3">
      {!hideModeSelect && allowedModes.length > 1 && (
      <div>
        <Label className="text-[10px] text-muted-foreground">{modeLabel}</Label>
        <Select
          value={selection.mode}
          onValueChange={(mode: ZhengdaoDoorPricingMode) => commit(defaultSelection(mode))}
        >
          <SelectTrigger className="mt-1 h-8 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {allowedModes.map((mode) => (
              <SelectItem key={mode} value={mode}>{MODE_LABELS[mode]}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      )}

      {(allowedModes.includes("FLAT") || allowedModes.includes("FINISHED")) && !allowedModes.includes("PARTITION_DOOR") && (
        <>
          <div>
            <Label className="text-[10px] text-muted-foreground">門板類型</Label>
            <Select value={selectedCategoryCode} onValueChange={(categoryCode: ZhengdaoDoorCatalogCategoryCode) => commitCategory(categoryCode)}>
              <SelectTrigger className="mt-1 h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ZHENGDAO_DOOR_CATALOG_CATEGORIES.map((category) => (
                  <SelectItem key={category.code} value={category.code}>
                    {category.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {hasTieredOptions ? (
            <TieredDoorOptionCheckboxes
              value={selection}
              options={selectedCategory.tieredOptions ?? []}
              onChange={commit}
            />
          ) : selectedCategory.options.length > 0 ? (
            <DoorOptionSelect
              label="門板品項"
              value={selection.optionCode}
              options={selectedCategory.options}
              onChange={(optionCode) => commit({ mode: selectedCategory.mode, optionCode })}
            />
          ) : (
            <div className="rounded border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900">
              {selectedCategory.label}（{selectedCategory.page}）尚未建立正式價格資料，需先核對 PDF 後再開放計價。
            </div>
          )}
        </>
      )}

      {selection.mode === "SHAPED" && (
        <div className="grid gap-2 sm:grid-cols-2">
          <DoorOptionSelect
            label="基礎平板系列"
            value={selection.baseCode}
            options={ZHENGDAO_SHAPED_BASE_DOORS}
            onChange={(baseCode) => commit({ ...selection, mode: "SHAPED", baseCode })}
          />
          <DoorOptionSelect
            label="造型加工"
            value={selection.optionCode}
            options={ZHENGDAO_DOOR_SHAPES}
            onChange={(optionCode) => commit({ ...selection, mode: "SHAPED", optionCode })}
          />
        </div>
      )}

      {selection.mode === "PARTITION_DOOR" && (
        <DoorOptionSelect
          label="隔間門類型"
          value={selection.optionCode}
          options={ZHENGDAO_PARTITION_DOORS}
          onChange={(optionCode) => commit({ mode: "PARTITION_DOOR", optionCode })}
        />
      )}

      {result && showResult && (
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

function TieredDoorOptionCheckboxes({
  value,
  options,
  onChange,
}: {
  value: ZhengdaoDoorSelection;
  options: ZhengdaoTieredDoorCatalogOption[];
  onChange: (selection: ZhengdaoDoorSelection) => void;
}) {
  const selectedOptionCode = options.some((option) => option.code === value.optionCode)
    ? value.optionCode
    : options[0]?.code;
  const selectedTier = value.materialTier ?? "JM_ER";
  const selectedOption = options.find((option) => option.code === selectedOptionCode) ?? options[0];
  const resolvedOption = selectedOption ? resolveZhengdaoDoorTieredOption(selectedOption, selectedTier) : null;

  const selectOption = (optionCode: string) => {
    onChange({ mode: "FINISHED", optionCode, materialTier: selectedTier });
  };

  const selectTier = (materialTier: ZhengdaoDoorMaterialTier) => {
    if (!selectedOptionCode) return;
    onChange({ mode: "FINISHED", optionCode: selectedOptionCode, materialTier });
  };

  const tierPriceText = (materialTier: ZhengdaoDoorMaterialTier) => {
    if (materialTier === "JM_ER") return "基準價";
    const addon = selectedOption?.tierAddons[materialTier] ?? 0;
    return `+${addon}/才`;
  };

  return (
    <div className="space-y-3">
      <div>
        <Label className="text-[10px] text-muted-foreground">門型</Label>
        <div className="mt-1 grid gap-2 sm:grid-cols-2">
          {options.map((option) => {
            const checked = option.code === selectedOptionCode;
            return (
              <label
                key={option.code}
                className={`flex cursor-pointer items-start gap-2 rounded border px-3 py-2 text-xs transition ${
                  checked ? "border-blue-400 bg-blue-50 text-blue-900" : "bg-background hover:bg-muted/50"
                }`}
              >
                <input
                  type="checkbox"
                  className="mt-0.5 h-4 w-4 accent-blue-600"
                  checked={checked}
                  onChange={() => selectOption(option.code)}
                />
                <span>
                  <span className="block font-medium">{option.name}</span>
                  <span className="mt-0.5 block text-[11px] text-muted-foreground">
                    {option.basePricePerCai} 元/才，基本才 {option.minCai} 才
                  </span>
                </span>
              </label>
            );
          })}
        </div>
      </div>

      <div>
        <Label className="text-[10px] text-muted-foreground">板材級距</Label>
        <div className="mt-1 grid grid-cols-2 gap-1.5 rounded-md border bg-muted/20 p-1 sm:grid-cols-4">
          {ZHENGDAO_DOOR_MATERIAL_TIERS.map((tier) => {
            const checked = tier.code === selectedTier;
            return (
              <label
                key={tier.code}
                className={`flex min-h-[48px] cursor-pointer items-center justify-center rounded px-2.5 py-2 text-center transition ${
                  checked ? "bg-blue-600 text-white shadow-sm" : "bg-background text-foreground hover:bg-muted"
                }`}
              >
                <input
                  type="radio"
                  name={`zhengdao-door-tier-${selectedOptionCode ?? "none"}`}
                  className="sr-only"
                  checked={checked}
                  onChange={() => selectTier(tier.code)}
                />
                <span className="flex flex-col items-center leading-tight">
                  <span className="whitespace-nowrap text-xs font-semibold">{tier.shortLabel}</span>
                  <span className={`mt-0.5 whitespace-nowrap text-[10px] ${checked ? "text-blue-50" : "text-muted-foreground"}`}>
                    {tierPriceText(tier.code)}
                  </span>
                </span>
              </label>
            );
          })}
        </div>
      </div>

      {resolvedOption && (
        <div className="rounded border bg-muted/30 px-3 py-2 text-xs text-muted-foreground">
          目前價格：<span className="font-semibold text-foreground">{resolvedOption.pricePerCai} 元/才</span>
          <span className="mx-1">/</span>
          基本才 {resolvedOption.minCai} 才
        </div>
      )}
    </div>
  );
}

function DoorOptionSelect({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value?: string;
  options: Array<{ code: string; name: string; pricePerCai?: number; addonPerCai?: number }>;
  onChange: (value: string) => void;
}) {
  return (
    <div>
      <Label className="text-[10px] text-muted-foreground">{label}</Label>
      <Select value={value ?? ""} onValueChange={onChange}>
        <SelectTrigger className="mt-1 h-8 text-xs">
          <SelectValue placeholder={`選擇${label}`} />
        </SelectTrigger>
        <SelectContent>
          {options.map((option) => (
            <SelectItem key={option.code} value={option.code}>
              {option.name}（{option.pricePerCai ?? option.addonPerCai} 元/才）
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
