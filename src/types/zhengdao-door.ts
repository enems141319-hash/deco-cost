import type { MaterialRef } from "./cabinet";

export type ZhengdaoDoorPricingMode = "FLAT" | "FINISHED" | "SHAPED" | "ALUMINUM_FRAME";

export interface ZhengdaoDoorSelection {
  mode: ZhengdaoDoorPricingMode;
  baseCode?: string;
  optionCode?: string;
  frameColor?: "ALUMINUM" | "WHITE" | "BLACK";
}

export interface ZhengdaoDoorSelectionResult {
  selection: ZhengdaoDoorSelection;
  materialRef: MaterialRef;
  note: string;
}
