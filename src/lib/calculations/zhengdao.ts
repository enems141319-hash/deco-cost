import {
  ZHENGDAO_2025_AREA_DECIMAL_PLACES,
  ZHENGDAO_2025_BOARD_ADDON_RULES,
  ZHENGDAO_2025_CAI_CM2,
  ZHENGDAO_2025_COST_DECIMAL_PLACES,
  isZhengdaoBoardCombinationSupported,
  zhengdaoBoardAddonUnitPrice,
} from "@/lib/config/vendors/zhengdao-2025";
import type {
  ZhengdaoBoardAddonResult,
  ZhengdaoBoardLineInput,
  ZhengdaoBoardLineResult,
  ZhengdaoCabinetUnitInput,
  ZhengdaoCabinetUnitResult,
  ZhengdaoCatalogRef,
  ZhengdaoCustomItemResult,
  ZhengdaoHardwareResult,
  ZhengdaoProcessingInput,
  ZhengdaoProcessingResult,
  ZhengdaoProjectResult,
} from "@/types/zhengdao";

export type ZhengdaoCalculationErrorCode =
  | "INVALID_INPUT"
  | "QUOTE_REQUIRED"
  | "UNSUPPORTED_BOARD_COMBINATION"
  | "UNSUPPORTED_ADDON"
  | "PROCESS_TARGET_NOT_FOUND";

export class ZhengdaoCalculationError extends Error {
  constructor(
    public readonly code: ZhengdaoCalculationErrorCode,
    message: string,
  ) {
    super(message);
    this.name = "ZhengdaoCalculationError";
  }
}

function round(value: number, decimals: number): number {
  const factor = Math.pow(10, decimals);
  return Math.round(value * factor) / factor;
}

function sum(values: number[]): number {
  return values.reduce((total, value) => total + value, 0);
}

function assertPositive(value: number, label: string): void {
  if (!Number.isFinite(value) || value <= 0) {
    throw new ZhengdaoCalculationError("INVALID_INPUT", `${label} must be greater than zero`);
  }
}

function assertPriceAvailable(ref: ZhengdaoCatalogRef, label: string): void {
  if (ref.requiresQuote) {
    throw new ZhengdaoCalculationError("QUOTE_REQUIRED", `${label} requires a manual quote`);
  }
  if (!Number.isFinite(ref.pricePerUnit) || ref.pricePerUnit < 0) {
    throw new ZhengdaoCalculationError("INVALID_INPUT", `${label} has an invalid price`);
  }
}

function calculateAddonResults(line: ZhengdaoBoardLineInput, actualCai: number): ZhengdaoBoardAddonResult[] {
  return line.addons.map((addon) => {
    const rule = ZHENGDAO_2025_BOARD_ADDON_RULES[addon];
    if (!rule.usages?.includes(line.usage)) {
      throw new ZhengdaoCalculationError(
        "UNSUPPORTED_ADDON",
        `${addon} is not supported for ${line.usage}`,
      );
    }

    const quantity = round(Math.max(actualCai, rule.minCai ?? 0), ZHENGDAO_2025_AREA_DECIMAL_PLACES);
    const unitPrice = zhengdaoBoardAddonUnitPrice(addon, line.material.series);
    return {
      code: addon,
      name: rule.name,
      unit: rule.unit,
      quantity,
      unitPrice,
      subtotal: round(quantity * unitPrice, ZHENGDAO_2025_COST_DECIMAL_PLACES),
    };
  });
}

function calculateBoardLine(line: ZhengdaoBoardLineInput): ZhengdaoBoardLineResult {
  assertPositive(line.widthCm, `${line.name} width`);
  assertPositive(line.heightCm, `${line.name} height`);
  assertPositive(line.quantity, `${line.name} quantity`);
  assertPriceAvailable(line.material, line.name);

  if (!isZhengdaoBoardCombinationSupported(line.usage, line.material.series, line.material.thicknessMm)) {
    throw new ZhengdaoCalculationError(
      "UNSUPPORTED_BOARD_COMBINATION",
      `Unsupported Zhengdao board combination: ${line.usage}/${line.material.series}/${line.material.thicknessMm}mm`,
    );
  }

  const singleActualCai = line.widthCm * line.heightCm / ZHENGDAO_2025_CAI_CM2;
  const actualCai = round(singleActualCai * line.quantity, ZHENGDAO_2025_AREA_DECIMAL_PLACES);
  const billableCai = round(
    Math.max(singleActualCai, line.material.minCai) * line.quantity,
    ZHENGDAO_2025_AREA_DECIMAL_PLACES,
  );
  const materialSubtotal = round(
    billableCai * line.material.pricePerUnit,
    ZHENGDAO_2025_COST_DECIMAL_PLACES,
  );
  const addonResults = calculateAddonResults(line, actualCai);
  const addonSubtotal = sum(addonResults.map((result) => result.subtotal));

  return {
    ...line,
    actualCai,
    billableCai,
    materialSubtotal,
    addonResults,
    addonSubtotal,
    subtotal: materialSubtotal + addonSubtotal,
  };
}

function calculateProcessing(
  process: ZhengdaoProcessingInput,
  boardLines: ZhengdaoBoardLineResult[],
): ZhengdaoProcessingResult {
  assertPositive(process.quantity, `${process.name} quantity`);
  if (process.requiresQuote) {
    throw new ZhengdaoCalculationError("QUOTE_REQUIRED", `${process.name} requires a manual quote`);
  }
  if (!Number.isFinite(process.unitPrice) || process.unitPrice < 0) {
    throw new ZhengdaoCalculationError("INVALID_INPUT", `${process.name} has an invalid price`);
  }

  const target = boardLines.find((line) => line.id === process.targetBoardLineId);
  if (!target) {
    throw new ZhengdaoCalculationError(
      "PROCESS_TARGET_NOT_FOUND",
      `Zhengdao processing target not found: ${process.targetBoardLineId}`,
    );
  }

  let billableQuantity = process.quantity;
  if (process.billingMode === "PER_CAI") {
    billableQuantity = Math.max(target.actualCai, process.minCai ?? 0) * process.quantity;
  } else if (process.billingMode === "PER_10MM") {
    if (process.lengthMm === undefined) {
      throw new ZhengdaoCalculationError("INVALID_INPUT", `${process.name} requires lengthMm`);
    }
    assertPositive(process.lengthMm, `${process.name} length`);
    billableQuantity = Math.ceil(process.lengthMm / 10) * process.quantity;
  }

  const roundedQuantity = round(billableQuantity, ZHENGDAO_2025_AREA_DECIMAL_PLACES);
  return {
    ...process,
    billableQuantity: roundedQuantity,
    subtotal: round(roundedQuantity * process.unitPrice, ZHENGDAO_2025_COST_DECIMAL_PLACES),
  };
}

function calculateHardware(input: ZhengdaoCabinetUnitInput["hardwareItems"][number]): ZhengdaoHardwareResult {
  assertPositive(input.quantity, `${input.name} quantity`);
  assertPriceAvailable(input.material, input.name);
  return {
    ...input,
    subtotal: round(input.quantity * input.material.pricePerUnit, ZHENGDAO_2025_COST_DECIMAL_PLACES),
  };
}

function calculateCustomItem(input: ZhengdaoCabinetUnitInput["customItems"][number]): ZhengdaoCustomItemResult {
  assertPositive(input.quantity, `${input.name} quantity`);
  if (!Number.isFinite(input.unitPrice) || input.unitPrice < 0) {
    throw new ZhengdaoCalculationError("INVALID_INPUT", `${input.name} has an invalid price`);
  }
  return {
    ...input,
    subtotal: round(input.quantity * input.unitPrice, ZHENGDAO_2025_COST_DECIMAL_PLACES),
  };
}

export function calculateZhengdaoCabinetUnit(input: ZhengdaoCabinetUnitInput): ZhengdaoCabinetUnitResult {
  const boardLines = input.boardLines.map(calculateBoardLine);
  const processes = input.processes.map((process) => calculateProcessing(process, boardLines));
  const hardwareItems = input.hardwareItems.map(calculateHardware);
  const customItems = input.customItems.map(calculateCustomItem);
  const materialTotal = sum(boardLines.map((line) => line.materialSubtotal));
  const processingTotal = sum([
    ...boardLines.map((line) => line.addonSubtotal),
    ...processes.map((process) => process.subtotal),
  ]);
  const hardwareTotal = sum(hardwareItems.map((item) => item.subtotal));
  const customTotal = sum(customItems.map((item) => item.subtotal));

  return {
    vendor: "ZHENGDAO",
    catalogVersion: "2025",
    unitId: input.id,
    unitName: input.name,
    input,
    boardLines,
    processes,
    hardwareItems,
    customItems,
    materialTotal,
    processingTotal,
    hardwareTotal,
    customTotal,
    totalCost: materialTotal + processingTotal + hardwareTotal + customTotal,
  };
}

export function calculateZhengdaoProject(units: ZhengdaoCabinetUnitInput[]): ZhengdaoProjectResult {
  const unitResults = units.map(calculateZhengdaoCabinetUnit);
  const materialTotal = sum(unitResults.map((result) => result.materialTotal));
  const processingTotal = sum(unitResults.map((result) => result.processingTotal));
  const hardwareTotal = sum(unitResults.map((result) => result.hardwareTotal));
  const customTotal = sum(unitResults.map((result) => result.customTotal));

  return {
    vendor: "ZHENGDAO",
    catalogVersion: "2025",
    unitResults,
    materialTotal,
    processingTotal,
    hardwareTotal,
    customTotal,
    projectTotal: materialTotal + processingTotal + hardwareTotal + customTotal,
  };
}
