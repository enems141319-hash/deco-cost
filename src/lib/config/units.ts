// src/lib/config/units.ts
// ??  ???蝞????ㄐ霈???渡??刻?蝞??? UI ?批神甇餅??

export const UNIT_CONFIG = {
  // ?? ??? ??????????????????????????????????????????????????????????????
  // 1 ??= 1 ?啣偕 ? 1 ?啣偕 = 30.3cm ? 30.3cm = 918.09 cm簡
  CAI_CM2: 918.09,

  // ?? ????????????????????????????????????????????????????????????????
  HINGE_SPACING_CM: 60,
  MIN_HINGES_PER_DOOR: 2,

  // ?? 皛?皛? ??????????????????????????????????????????????????????????????
  SLIDING_RAIL_UNIT: "台尺" as const,
  CM_PER_TAI_CHI: 30.3,

  // ?? 憭抵??????????????????????????????????????????????????????????????????
  CEILING_ANGLE_PER_PING: 12,
  CEILING_BOARD_PER_PING: 2,
  CEILING_PERIMETER_ANGLE_LENGTH_CM: 243.84, // 8 ?勗偕
  PING_TO_M2: 3.30579,

  // ?? 蝎曉漲 ??????????????????????????????????????????????????????????????????
  DIMENSION_DECIMAL_PLACES: 2,
  BACK_PANEL_SIZE_OVERLAP_CM: 1.4,
  L_TURN_BACK_PANEL_WIDTH_DEDUCTION_CM: 2.9,
  L_TURN_BACK_PANEL_DEPTH_DEDUCTION_CM: 3.7,
  L_TURN_KICK_PLATE_SHARED_OVERLAP_CM: 2,
  L_TURN_KICK_PLATE_WIDTH_EXTRA_CM: 1.8,
  L_TURN_CLOSED_KICK_PLATE_WIDTH_DEDUCTION_CM: 2,
  L_TURN_CLOSED_KICK_PLATE_DEPTH_DEDUCTION_CM: 3.8,
  BACK_PANEL_GROOVE_WIDTH_MM: 10,
  BACK_PANEL_GROOVE_DEPTH_MM: 9,
  BACK_PANEL_GROOVE_LINES: 4,
  BACK_PANEL_GROOVE_COST_PER_LINE: 120,
  DRAWER_BOTTOM_SIZE_OVERLAP_CM: 1.4,
  DRAWER_GROOVE_WIDTH_MM: 10,
  DRAWER_GROOVE_DEPTH_MM: 9,
  DRAWER_GROOVE_COST_PER_PANEL: 120,
  DRAWER_BODY_KD_PROCESSING_COST_PER_SET: 80,
  L_TURN_CABINET_PROCESS_COST: 600,
  L_TURN_CABINET_MAX_DIMENSION_SUM_MM: 1500,
  SLIDING_DOOR_TRACK_GROOVE_COST_PER_LINE: 120,
  SLIDING_DOOR_TRACK_GROOVE_WIDTH_MM: 10,
  LIGHT_GROOVE_WIDTH_MM: 10,
  LIGHT_GROOVE_DEPTH_MM: 11,
  LIGHT_GROOVE_LENGTH_THRESHOLD_MM: 2400,
  LIGHT_GROOVE_COST_SHORT: 180,
  LIGHT_GROOVE_COST_LONG: 360,
  SIDE_SEAL_BENDING_MIN_LENGTH_CM: 40,
  SIDE_SEAL_BENDING_VISIBLE_EDGE_SHORT_LIMIT_CM: 120,
  SIDE_SEAL_BENDING_VISIBLE_EDGE_SHORT_COST: 500,
  SIDE_SEAL_BENDING_VISIBLE_EDGE_LONG_COST: 700,
  FRONT_EDGE_ABS_MIN_LENGTH_CM: 40,
  FRONT_EDGE_ABS_MAX_LENGTH_CM: 120,
  FRONT_EDGE_ABS_18MM_UNIT_COST_PER_CM: 5,
  FRONT_EDGE_ABS_25MM_UNIT_COST_PER_CM: 7,
  SIDE_PANEL_INSET_PROCESS_COST: 200,
  SMALL_ADJUSTABLE_FOOT_HOLE_COST: 50,
  LIGHT_ST_WHEEL_HOLE_COST: 80,
  HEAVY_ST_WHEEL_HOLE_COST: 100,
  BOOKCASE_GUIDE_WHEEL_HOLE_COST: 130,
  HIDDEN_SHELF_SCREW_HOLE_COST: 100,
  HEAVY_HIDDEN_SHELF_SCREW_HOLE_COST: 300,
  HIDDEN_RETURN_SLIDE_RAIL_PROCESS_COST: 175,
  SPECIAL_U_GLASS_PIVOT_PROCESS_COST: 350,
  T_RAIL_BED_SET_PROCESS_COST: 250,
  AREA_DECIMAL_PLACES: 4,
  COST_DECIMAL_PLACES: 0,
} as const;

export const BOARD_TYPES = [
  "8mm背板不封邊",
  "18mm木芯板封PVC",
  "18mm 4E門板封ABS",
  "18mm 4E H型5mm鋁框門",
  "18mm 4E玻璃 5mm鋁框門",
  "18mm 4E玻璃崁板門",
  "18mm 4E鋁框鐵網門",
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

export const PROFILE_HANDLE_PROCESSING_RULES = {
  L1A: { label: "L1A", tiers: [{ maxMm: 600, price: 1100 }, { maxMm: 1000, price: 1400 }, { maxMm: 1400, price: 1700 }, { maxMm: 1800, price: 2000 }, { maxMm: 2200, price: 2300 }, { maxMm: 2600, price: 2600 }, { maxMm: Infinity, price: 2900 }] },
  L5A: { label: "L5A", tiers: [{ maxMm: 600, price: 1100 }, { maxMm: 1000, price: 1400 }, { maxMm: 1400, price: 1700 }, { maxMm: 1800, price: 2000 }, { maxMm: 2200, price: 2300 }, { maxMm: 2600, price: 2600 }, { maxMm: Infinity, price: 2900 }] },
  Y5IA: { label: "Y5IA", tiers: [{ maxMm: 600, price: 1500 }, { maxMm: 900, price: 1650 }, { maxMm: 1200, price: 1800 }, { maxMm: 1800, price: 2100 }, { maxMm: 2400, price: 2400 }, { maxMm: Infinity, price: 2700 }] },
  Y5LA: { label: "Y5LA", tiers: [{ maxMm: 600, price: 1500 }, { maxMm: 900, price: 1650 }, { maxMm: 1200, price: 1800 }, { maxMm: 1800, price: 2100 }, { maxMm: 2400, price: 2400 }, { maxMm: Infinity, price: 2700 }] },
  Y5CA: { label: "Y5CA", tiers: [{ maxMm: 600, price: 1500 }, { maxMm: 900, price: 1650 }, { maxMm: 1200, price: 1800 }, { maxMm: 1800, price: 2100 }, { maxMm: 2400, price: 2400 }, { maxMm: Infinity, price: 2700 }] },
  V5IA: { label: "V5IA", tiers: [{ maxMm: 600, price: 1500 }, { maxMm: 900, price: 1650 }, { maxMm: 1200, price: 1800 }, { maxMm: 1800, price: 2100 }, { maxMm: 2400, price: 2400 }, { maxMm: Infinity, price: 2700 }] },
  V5LA: { label: "V5LA", tiers: [{ maxMm: 600, price: 1500 }, { maxMm: 900, price: 1650 }, { maxMm: 1200, price: 1800 }, { maxMm: 1800, price: 2100 }, { maxMm: 2400, price: 2400 }, { maxMm: Infinity, price: 2700 }] },
  V5CA: { label: "V5CA", tiers: [{ maxMm: 600, price: 1500 }, { maxMm: 900, price: 1650 }, { maxMm: 1200, price: 1800 }, { maxMm: 1800, price: 2100 }, { maxMm: 2400, price: 2400 }, { maxMm: Infinity, price: 2700 }] },
  U5IA: { label: "U5IA", tiers: [{ maxMm: 600, price: 1500 }, { maxMm: 900, price: 1650 }, { maxMm: 1200, price: 1800 }, { maxMm: 1800, price: 2100 }, { maxMm: 2400, price: 2400 }, { maxMm: Infinity, price: 2700 }] },
  U5LA: { label: "U5LA", tiers: [{ maxMm: 600, price: 1500 }, { maxMm: 900, price: 1650 }, { maxMm: 1200, price: 1800 }, { maxMm: 1800, price: 2100 }, { maxMm: 2400, price: 2400 }, { maxMm: Infinity, price: 2700 }] },
  U5CA: { label: "U5CA", tiers: [{ maxMm: 600, price: 1500 }, { maxMm: 900, price: 1650 }, { maxMm: 1200, price: 1800 }, { maxMm: 1800, price: 2100 }, { maxMm: 2400, price: 2400 }, { maxMm: Infinity, price: 2700 }] },
  Y5JA: { label: "Y5JA", tiers: [{ maxMm: 600, price: 1600 }, { maxMm: 900, price: 1750 }, { maxMm: 1200, price: 1900 }, { maxMm: 1800, price: 2200 }, { maxMm: 2400, price: 2500 }, { maxMm: Infinity, price: 2800 }] },
  Y5KA: { label: "Y5KA", tiers: [{ maxMm: 600, price: 1600 }, { maxMm: 900, price: 1750 }, { maxMm: 1200, price: 1900 }, { maxMm: 1800, price: 2200 }, { maxMm: 2400, price: 2500 }, { maxMm: Infinity, price: 2800 }] },
  U5JA: { label: "U5JA", tiers: [{ maxMm: 600, price: 1600 }, { maxMm: 900, price: 1750 }, { maxMm: 1200, price: 1900 }, { maxMm: 1800, price: 2200 }, { maxMm: 2400, price: 2500 }, { maxMm: Infinity, price: 2800 }] },
  U5KA: { label: "U5KA", tiers: [{ maxMm: 600, price: 1600 }, { maxMm: 900, price: 1750 }, { maxMm: 1200, price: 1900 }, { maxMm: 1800, price: 2200 }, { maxMm: 2400, price: 2500 }, { maxMm: Infinity, price: 2800 }] },
  V5JA: { label: "V5JA", tiers: [{ maxMm: 600, price: 1600 }, { maxMm: 900, price: 1750 }, { maxMm: 1200, price: 1900 }, { maxMm: 1800, price: 2200 }, { maxMm: 2400, price: 2500 }, { maxMm: Infinity, price: 2800 }] },
  V5KA: { label: "V5KA", tiers: [{ maxMm: 600, price: 1600 }, { maxMm: 900, price: 1750 }, { maxMm: 1200, price: 1900 }, { maxMm: 1800, price: 2200 }, { maxMm: 2400, price: 2500 }, { maxMm: Infinity, price: 2800 }] },
  Y1A: { label: "Y1A", tiers: [{ maxMm: 200, price: 1200 }, { maxMm: 400, price: 1350 }, { maxMm: Infinity, price: 1500 }] },
  U1A: { label: "U1A", tiers: [{ maxMm: 200, price: 1200 }, { maxMm: 400, price: 1350 }, { maxMm: Infinity, price: 1500 }] },
  V1A: { label: "V1A", tiers: [{ maxMm: 200, price: 1200 }, { maxMm: 400, price: 1350 }, { maxMm: Infinity, price: 1500 }] },
  RECESSED_BEVEL_HANDLE: { label: "崁凹斜把手", tiers: [{ maxMm: 600, price: 1000 }, { maxMm: 900, price: 1150 }, { maxMm: 1200, price: 1300 }, { maxMm: 1800, price: 1600 }, { maxMm: 2400, price: 1900 }, { maxMm: Infinity, price: 2200 }] },
  RECESSED_ALUMINUM_HANDLE_NO_HARDWARE: { label: "崁凹鋁把手（不含五金）", tiers: [{ maxMm: 600, price: 550 }, { maxMm: 900, price: 700 }, { maxMm: 1200, price: 850 }, { maxMm: 1800, price: 1000 }, { maxMm: 2400, price: 1150 }, { maxMm: Infinity, price: 1300 }] },
  N1A: { label: "N1A", tiers: [{ maxMm: 1200, price: 1100 }, { maxMm: Infinity, price: 1400 }] },
  N5IA: { label: "N5IA", tiers: [{ maxMm: 600, price: 1700 }, { maxMm: 900, price: 1850 }, { maxMm: 1200, price: 2000 }, { maxMm: 1800, price: 2300 }, { maxMm: 2400, price: 2600 }, { maxMm: Infinity, price: 2900 }] },
  N5LA: { label: "N5LA", tiers: [{ maxMm: 600, price: 1700 }, { maxMm: 900, price: 1850 }, { maxMm: 1200, price: 2000 }, { maxMm: 1800, price: 2300 }, { maxMm: 2400, price: 2600 }, { maxMm: Infinity, price: 2900 }] },
  N5CA: { label: "N5CA", tiers: [{ maxMm: 600, price: 1700 }, { maxMm: 900, price: 1850 }, { maxMm: 1200, price: 2000 }, { maxMm: 1800, price: 2300 }, { maxMm: 2400, price: 2600 }, { maxMm: Infinity, price: 2900 }] },
  N5JA: { label: "N5JA", tiers: [{ maxMm: 600, price: 1800 }, { maxMm: 900, price: 1950 }, { maxMm: 1200, price: 2100 }, { maxMm: 1800, price: 2400 }, { maxMm: 2400, price: 2700 }, { maxMm: Infinity, price: 3000 }] },
  N5KA: { label: "N5KA", tiers: [{ maxMm: 600, price: 1800 }, { maxMm: 900, price: 1950 }, { maxMm: 1200, price: 2100 }, { maxMm: 1800, price: 2400 }, { maxMm: 2400, price: 2700 }, { maxMm: Infinity, price: 3000 }] },
  BEVEL_OR_HALF_ARC_HANDLE: { label: "缺角斜把手 / 帆船(半弧)型把手", tiers: [{ maxMm: 200, price: 600 }, { maxMm: 400, price: 650 }, { maxMm: 600, price: 700 }, { maxMm: 1200, price: 900 }, { maxMm: 2400, price: 1200 }, { maxMm: Infinity, price: 1500 }] },
  HORIZONTAL_INTEGRATED: { label: "水平一體把手", tiers: [{ maxMm: 100, price: 2050 }, { maxMm: 200, price: 2200 }, { maxMm: Infinity, price: 2350 }] },
  TRIANGLE_INTEGRATED_R40: { label: "三角一體把手 R40", tiers: [{ maxMm: Infinity, price: 1600 }] },
  QUARTER_ROUND_INTEGRATED_R40: { label: "1/4圓一體把手 R40", tiers: [{ maxMm: Infinity, price: 1600 }] },
  HALF_ROUND_INTEGRATED_R40: { label: "1/2圓一體把手 R40", tiers: [{ maxMm: Infinity, price: 1800 }] },
  HEART_INTEGRATED_80: { label: "心型一體把手 80mm", tiers: [{ maxMm: Infinity, price: 1800 }] },
  SQUARE_INTEGRATED_80: { label: "方型一體把手 80mm", tiers: [{ maxMm: Infinity, price: 1800 }] },
  HEXAGON_INTEGRATED_90: { label: "六角一體把手 90mm", tiers: [{ maxMm: Infinity, price: 1800 }] },
  DIAMOND_INTEGRATED_100: { label: "菱型一體把手 100mm", tiers: [{ maxMm: Infinity, price: 1800 }] },
  HOURGLASS_INTEGRATED_150: { label: "沙漏一體把手 150mm", tiers: [{ maxMm: Infinity, price: 1800 }] },
  SMILE_INTEGRATED: { label: "微笑一體把手", tiers: [{ maxMm: 200, price: 1800 }, { maxMm: 400, price: 1950 }, { maxMm: Infinity, price: 2100 }] },
} as const;
export const PROFILE_HANDLE_BAKED_PAINT_SURCHARGE = {
  MAX_SHORT_MM: 600,
  SHORT: 200,
  LONG: 300,
} as const;

export const DRAWER_FRONT_MOLD_PROCESSING_PRICES = {
  R20: { label: "R20", price18_25mm: 350 },
  R30: { label: "R30", price18_25mm: 350 },
  R50: { label: "R50", price18_25mm: 350 },
  R80: { label: "R80", price18_25mm: 400 },
  R100: { label: "R100", price18_25mm: 400 },
  R150: { label: "R150", price18_25mm: 400 },
  R200: { label: "R200", price18_25mm: 400 },
  R250: { label: "R250", price18_25mm: 400 },
  R300: { label: "R300", price18_25mm: 400 },
} as const;

export const DRAWER_FRONT_MOLD_CORNER_PRICING = {
  BASE_CORNERS: 2,
  EXTRA_CORNER_COST: 100,
} as const;

export const SPECIAL_PROCESSING_PRICES = {
  ROUND_CORNER: {
    FACTORY_SMALL: { THIN: 350, EIGHT_MM: 400, THICK: 750 },
    FACTORY_LARGE: { THIN: 400, EIGHT_MM: 450, THICK: 1100 },
    CUSTOM_450: { THIN: 550, EIGHT_MM: 600, THICK: 1100 },
    CUSTOM_750: { THIN: 750, EIGHT_MM: 850, THICK: 1500 },
    CUSTOM_1200: { THIN: 1000, EIGHT_MM: 1150, THICK: 1900 },
  },
  CUT_CORNER_UNDER_600: { THIN: 400, EIGHT_MM: 450, THICK: 1100 },
  OUTER_SHAPE: {
    NO_EDGE: {
      UNDER_900: { THIN: 350, THICK: 700 },
      UNDER_1500: { THIN: 450, THICK: 950 },
      UNDER_2400: { THIN: 650, THICK: 1200 },
    },
    WITH_EDGE: {
      UNDER_900: { THIN: 550, EIGHT_MM: 600, THICK: 1100 },
      UNDER_1500: { THIN: 750, EIGHT_MM: 850, THICK: 1500 },
      UNDER_2400: { THIN: 1000, EIGHT_MM: 1150, THICK: 1900 },
    },
  },
  INNER_CUTOUT: {
    NO_EDGE: {
      UNDER_900: { THIN: 400, THICK: 900 },
      UNDER_1500: { THIN: 500, THICK: 1150 },
      UNDER_2400: { THIN: 700, THICK: 1300 },
    },
    WITH_EDGE: {
      UNDER_900: { THIN: 650, EIGHT_MM: 700, THICK: 1300 },
      UNDER_1500: { THIN: 850, EIGHT_MM: 950, THICK: 1750 },
      UNDER_2400: { THIN: 1100, EIGHT_MM: 1250, THICK: 2200 },
    },
  },
  SHARP_CORNER: {
    LE_26MM_GTE_90: 50,
    LE_26MM_LT_90: 100,
    GT_26MM_GTE_90: 100,
    GT_26MM_LT_90: 150,
  },
} as const;

export const SIDE_SEAL_BENDING_PRICES = {
  DEPTH_80: 80,
  DEPTH_450: 100,
  DEPTH_600: 120,
} as const;

export const LOUVER_DOOR_CONFIG = {
  MIN_CAI: 4,
  STANDARD_MAX_WIDTH_MM: 600,
  EIGHT_MM_STRIP_WIDTH_MM: 20,
  EIGHT_MM_STRIP_GAP_MM: 20,
  EIGHT_MM_SIDE_MARGIN_MIN_MM: 5,
  EIGHT_MM_SIDE_MARGIN_MAX_MM: 24,
  EIGHTEEN_MM_SURCHARGE_PER_CAI: 30,
  EIGHTEEN_MM_STRIP_WIDTH_MM: 20,
  EIGHTEEN_MM_STRIP_GAP_MM: 20,
  EIGHTEEN_MM_SIDE_MARGIN_MIN_MM: 20,
  EIGHTEEN_MM_SIDE_MARGIN_MAX_MM: 39,
  HOLLOW_FIXED_BORDER_MM: 80,
  HOLLOW_HOLE_PROCESS_COST: 500,
  SHORT_STRIP_LENGTH_THRESHOLD_MM: 300,
  SHORT_STRIP_SURCHARGE_PER_CAI: 120,
  SPECIAL_PROCESS_MAX_THREE_STRIPS_PER_CAI: 330,
  SPECIAL_PROCESS_FOUR_OR_MORE_STRIPS_PER_CAI: 660,
  LINE_ALIGNMENT_SURCHARGE_PER_CAI: 100,
  LOOSE_STRIP_PROCESS_COST: 350,
} as const;

export const LOUVER_DOOR_PRICE_OPTIONS = [
  {
    id: "HORNG_CHANG_ST12_730",
    brand: "HORNG CHANG",
    colorCodes: [
      "S0506", "S1023", "S1202", "S1206", "S1406", "S1407", "S3083", "S3084",
      "S3298", "S3299", "S3474", "S3475", "I1931", "I3361", "L3371", "L3372",
      "L3374", "P3385", "P3386", "P3387",
    ],
    surfaceTreatment: "ST12",
    unitPrice: 730,
  },
  {
    id: "SM_SW_SMP_ST68_760",
    brand: "SM / SW / SMP",
    colorCodes: ["G5527", "G6505", "G6506", "G6507", "S5002", "S5003", "S5004"],
    surfaceTreatment: "ST68",
    unitPrice: 760,
  },
  {
    id: "LONGLAND_H_730",
    brand: "Longland",
    colorCodes: ["L3267", "L3461", "L3612"],
    surfaceTreatment: "H",
    unitPrice: 730,
  },
  {
    id: "JANGMEI_ST22_730",
    brand: "JANGMEI",
    colorCodes: [
      "JM513", "JM541", "JM545", "JM557", "JM558", "JM559", "JM221", "JM222",
      "JM223", "JM224", "JM226", "JM227", "JM321", "JM322", "JM394", "JM230", "JM231",
    ],
    surfaceTreatment: "ST22",
    unitPrice: 730,
  },
  {
    id: "EGGER_ST9_760",
    brand: "EGGER",
    colorCodes: [
      "H1145", "H1277", "H3047", "H3165", "H3433", "H3700", "H3710", "H3730",
      "W928", "F800", "U115", "U125", "U211", "U325", "U502", "U505", "U604",
      "U638", "U705", "U708", "U741", "U780", "U899", "F416", "F417", "F433",
      "F637", "F638", "F642", "F649",
    ],
    surfaceTreatment: "ST9",
    unitPrice: 760,
  },
  {
    id: "EGGER_ST19_780",
    brand: "EGGER",
    colorCodes: ["U702", "U727", "H3152", "H3157", "H3158", "H3349", "W1000"],
    surfaceTreatment: "ST19",
    unitPrice: 780,
  },
  {
    id: "EGGER_STU1_780",
    brand: "EGGER",
    colorCodes: ["F7024", "F7025", "U779", "U7123", "U7111"],
    surfaceTreatment: "STU1",
    unitPrice: 780,
  },
  {
    id: "EGGER_STV3_780",
    brand: "EGGER",
    colorCodes: ["F7036"],
    surfaceTreatment: "STV3",
    unitPrice: 780,
  },
  {
    id: "EGGER_ST38_780",
    brand: "EGGER",
    colorCodes: ["U998", "W1000"],
    surfaceTreatment: "ST38",
    unitPrice: 780,
  },
  {
    id: "EGGER_ST28_780",
    brand: "EGGER",
    colorCodes: ["H3311", "H3339"],
    surfaceTreatment: "ST28",
    unitPrice: 780,
  },
  {
    id: "EGGER_ST40_780",
    brand: "EGGER",
    colorCodes: ["H1369"],
    surfaceTreatment: "ST40",
    unitPrice: 780,
  },
  {
    id: "EGGER_ST76_780",
    brand: "EGGER",
    colorCodes: ["F235", "F243", "F244"],
    surfaceTreatment: "ST76",
    unitPrice: 780,
  },
  {
    id: "SKIN_AR_780",
    brand: "SKIN",
    colorCodes: ["K2479", "K2480", "K2481", "K512"],
    surfaceTreatment: "AR",
    unitPrice: 780,
  },
  {
    id: "SKIN_CB_780",
    brand: "SKIN",
    colorCodes: [
      "K2528", "K4757", "K4758", "K5450", "K5451", "K6577", "K570", "K571",
    ],
    surfaceTreatment: "CB",
    unitPrice: 780,
  },
  {
    id: "SKIN_SX_780",
    brand: "SKIN",
    colorCodes: ["K4755", "K6572"],
    surfaceTreatment: "SX",
    unitPrice: 780,
  },
  {
    id: "SKIN_SW_780",
    brand: "SKIN",
    colorCodes: ["K6679", "K6680"],
    surfaceTreatment: "SW",
    unitPrice: 780,
  },
  {
    id: "SKIN_DE_780",
    brand: "SKIN",
    colorCodes: ["K590"],
    surfaceTreatment: "DE",
    unitPrice: 780,
  },
] as const;

export type UnitConfig = typeof UNIT_CONFIG;
