// src/lib/config/units.ts
// ⚠️  所有計算規則從這裡讀取，嚴禁在計算引擎或 UI 內寫死數值

export const UNIT_CONFIG = {
  // ── 才數換算 ──────────────────────────────────────────────────────────────
  // 1 才 = 1 台尺 × 1 台尺 = 30.3cm × 30.3cm = 918.09 cm²
  CAI_CM2: 918.09,

  // ── 門片鉸鏈規則 ──────────────────────────────────────────────────────────
  HINGE_SPACING_CM: 60,
  MIN_HINGES_PER_DOOR: 2,

  // ── 滑門滑軌 ──────────────────────────────────────────────────────────────
  SLIDING_RAIL_UNIT: "尺" as const,
  CM_PER_TAI_CHI: 30.3,

  // ── 天花板 ────────────────────────────────────────────────────────────────
  CEILING_ANGLE_PER_PING: 12,
  CEILING_BOARD_PER_PING: 2,
  CEILING_PERIMETER_ANGLE_LENGTH_CM: 243.84, // 8 英尺
  PING_TO_M2: 3.30579,

  // ── 精度 ──────────────────────────────────────────────────────────────────
  DIMENSION_DECIMAL_PLACES: 2,
  BACK_PANEL_DEDUCTION_CM: 2.2,
  BACK_PANEL_GROOVE_LINES: 4,
  BACK_PANEL_GROOVE_COST_PER_LINE: 120,
  LIGHT_GROOVE_WIDTH_MM: 10,
  LIGHT_GROOVE_DEPTH_MM: 11,
  LIGHT_GROOVE_LENGTH_THRESHOLD_MM: 2400,
  LIGHT_GROOVE_COST_SHORT: 180,
  LIGHT_GROOVE_COST_LONG: 360,
  AREA_DECIMAL_PLACES: 4,
  COST_DECIMAL_PLACES: 0,
} as const;

export const BOARD_TYPES = [
  "8mm背板不封邊",
  "18mm櫃體封PVC",
  "18mm 4E門板封ABS",
  "18mm 4E H型 5mm清玻門",
  "18mm 4E框型 5mm清玻門",
  "18mm 4E框型肚板門",
  "18mm 4E框鐵網門",
  "25mm封ABS",
] as const;

export type BoardType = (typeof BOARD_TYPES)[number];

export const ADDON_PRICES = {
  FRONT_EDGE_ABS_ONE_LONG: 5,
  FRONT_EDGE_ABS_TWO_LONG: 10,
  DOUBLE_DRILL_HOLES: 5,
  NON_STANDARD_HOLES: 5,
  PATTERN_MATCH_GRAIN: 1.2,
  TEMPERED_GLASS: 50,
  HINGE_HOLE_DRILLING: 5,
  WIRE_MESH_PAINT_PER_CAI: 60,
  PROFILE_HANDLE_PER_CM: 8.5,
  PROFILE_HANDLE_MIN_LENGTH_CM: 40,
  PROFILE_HANDLE_LENGTH_MODIFICATION: 200,
} as const;

export type UnitConfig = typeof UNIT_CONFIG;
