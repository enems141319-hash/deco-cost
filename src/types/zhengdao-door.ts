import type { MaterialRef } from "./cabinet";

export type ZhengdaoDoorPricingMode = "FLAT" | "FINISHED" | "SHAPED" | "PARTITION_DOOR";

export type ZhengdaoDoorMaterialTier = "JM_ER" | "AR" | "MR" | "PR";

export type ZhengdaoDoorProcessCode =
  | "EDGE_A"
  | "DOOR_PATTERN_MATCH"
  | "SHAPED_SLOPED_BACK"
  | "SHAPED_S_BACK"
  | "SHAPED_U"
  | "SHAPED_J"
  | "SHAPED_JU"
  | "SHAPED_JE"
  | "VR_I"
  | "FULL_VR"
  | "VR_II"
  | "VR_III"
  | "VRU"
  | "W"
  | "G1"
  | "G2"
  | "G3"
  | "G4_G5"
  | "G6_G7"
  | "G8_G9"
  | "G10"
  | "G11"
  | "G12_8"
  | "G12_18"
  | "G12_25"
  | "G12_50"
  | "G13_8"
  | "G13_18"
  | "G13_25"
  | "G13_50"
  | "G14_8"
  | "G14_18"
  | "G14_25"
  | "G14_50"
  | "G15_8"
  | "G15_18"
  | "G15_25"
  | "G15_50"
  | "C_GROOVE"
  | "ALUMINUM_STRIP_GROOVE"
  | "CUSTOM_GROOVE"
  | "TRACK_GROOVE"
  | "DOOR_STRAIGHTENER_GROOVE"
  | "WIRE_OUTLET_HOLE"
  | "VENT_HOLE"
  | "ROUND_LIGHT_HOLE"
  | "PUSH_DOOR_GUIDE_HOLE"
  | "SLIDING_CABINET_WHEEL_HOLE"
  | "RECESSED_HANDLE_HOLE"
  | "HINGE_HOLE"
  | "OUTSOURCED_HINGE_HOLE"
  | "HIDDEN_SHELF_BRACKET_HOLE"
  | "HIDDEN_SHELF_SCREW_HOLE"
  | "BODY_VENT_HOLE"
  | "ALUMINUM_FRAME_PARTITION_A1"
  | "ALUMINUM_FRAME_PARTITION_A1_1"
  | "ALUMINUM_FRAME_PARTITION_A1_2"
  | "ALUMINUM_FRAME_PARTITION_A2"
  | "ALUMINUM_FRAME_PARTITION_A2_1"
  | "ALUMINUM_FRAME_PARTITION_A2_2"
  | "H8_SEPARATOR"
  | "H8_TRACK_ALUMINUM"
  | "H8_TRACK_ANODIZED"
  | "H8_TRACK_WHITE"
  | "H8_BUFFER"
  | "H8_L_STOP"
  | "H8_HOOK_LOCK"
  | "H8_HOOK_LOCK_KEY"
  | "S2_SEPARATOR"
  | "S2_TRACK_SINGLE"
  | "S2_TRACK_DOUBLE"
  | "S2_TRACK_TRIPLE"
  | "S2_TRACK_DOUBLE_ANODIZED"
  | "S2_TRACK_DOUBLE_WHITE"
  | "S2_BUFFER"
  | "S2_HOOK_LOCK"
  | "S2_HOOK_LOCK_KEY";

export interface ZhengdaoDoorProcessInput {
  id: string;
  code: ZhengdaoDoorProcessCode;
  quantityPerDoor: number;
  lengthMm?: number;
}

export interface ZhengdaoDoorSelection {
  mode: ZhengdaoDoorPricingMode;
  baseCode?: string;
  optionCode?: string;
  materialTier?: ZhengdaoDoorMaterialTier;
}

export interface ZhengdaoDoorSelectionResult {
  selection: ZhengdaoDoorSelection;
  materialRef: MaterialRef;
  note: string;
}
