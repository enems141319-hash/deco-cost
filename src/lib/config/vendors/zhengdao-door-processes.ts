import type { ZhengdaoDoorProcessCode } from "@/types/zhengdao-door";

export type ZhengdaoDoorProcessGroup = "造型門板" | "G 系列造型" | "洗槽" | "挖孔" | "鋁框門區隔" | "H8 五金加工" | "S2 五金加工";
export type ZhengdaoDoorProcessSeries = "P6_BOARD_PROCESS" | "P7_SHAPED_DOOR" | "P8_9_HANDMADE_DOOR" | "P10_HANDMADE_SHAPED";
export type ZhengdaoDoorProcessBillingMode = "PER_CAI" | "PER_ITEM" | "PER_10MM" | "PER_CHI";

export interface ZhengdaoDoorProcessRule {
  code: ZhengdaoDoorProcessCode;
  name: string;
  group: ZhengdaoDoorProcessGroup;
  series: ZhengdaoDoorProcessSeries[];
  billingMode: ZhengdaoDoorProcessBillingMode;
  unitPrice: number;
  minCai?: number;
  note?: string;
}

const rule = (
  code: ZhengdaoDoorProcessCode,
  name: string,
  group: ZhengdaoDoorProcessGroup,
  series: ZhengdaoDoorProcessSeries | ZhengdaoDoorProcessSeries[],
  billingMode: ZhengdaoDoorProcessBillingMode,
  unitPrice: number,
  options: Pick<ZhengdaoDoorProcessRule, "minCai" | "note"> = {},
): ZhengdaoDoorProcessRule => ({
  code,
  name,
  group,
  series: Array.isArray(series) ? series : [series],
  billingMode,
  unitPrice,
  ...options,
});

const nonDoorProcessRule = (
  code: ZhengdaoDoorProcessCode,
  name: string,
  group: ZhengdaoDoorProcessGroup,
  billingMode: ZhengdaoDoorProcessBillingMode,
  unitPrice: number,
  options: Pick<ZhengdaoDoorProcessRule, "minCai" | "note"> = {},
): ZhengdaoDoorProcessRule => ({ code, name, group, series: [], billingMode, unitPrice, ...options });

export const ZHENGDAO_2025_DOOR_PROCESS_RULES: ZhengdaoDoorProcessRule[] = [
  rule("EDGE_A", "封 A（封單邊）", "洗槽", "P6_BOARD_PROCESS", "PER_CAI", 10, { minCai: 1 }),
  rule("DOOR_PATTERN_MATCH", "對紋（板厚 3/8/18mm）", "洗槽", "P6_BOARD_PROCESS", "PER_CAI", 80, { minCai: 5 }),
  rule("SHAPED_SLOPED_BACK", "斜背型門板", "造型門板", "P7_SHAPED_DOOR", "PER_CAI", 90, { minCai: 2 }),
  rule("SHAPED_S_BACK", "斜背 S 型門板", "造型門板", "P7_SHAPED_DOOR", "PER_CAI", 140, { minCai: 2 }),
  rule("SHAPED_U", "U 型門板", "造型門板", "P7_SHAPED_DOOR", "PER_CAI", 140, { minCai: 2 }),
  rule("SHAPED_J", "J 型門板", "造型門板", "P7_SHAPED_DOOR", "PER_CAI", 140, { minCai: 2 }),
  rule("SHAPED_JU", "JU 型門板", "造型門板", "P7_SHAPED_DOOR", "PER_CAI", 280, { minCai: 2, note: "委外加工，交期另行確認" }),
  rule("SHAPED_JE", "JE 型門板", "造型門板", "P7_SHAPED_DOOR", "PER_CAI", 280, { minCai: 2, note: "委外加工，交期另行確認" }),
  rule("VR_I", "VR 型 I 門板", "造型門板", "P8_9_HANDMADE_DOOR", "PER_ITEM", 720, { note: "加工長度 150–300mm" }),
  rule("FULL_VR", "全 VR 型門板", "造型門板", "P8_9_HANDMADE_DOOR", "PER_ITEM", 2600),
  rule("VR_II", "VR 型 II 門板", "造型門板", "P8_9_HANDMADE_DOOR", "PER_ITEM", 2000, { note: "加工長度 301–1200mm" }),
  rule("VR_III", "VR 型 III 門板", "造型門板", "P8_9_HANDMADE_DOOR", "PER_ITEM", 1200, { note: "加工長度 50–150mm" }),
  rule("VRU", "VRU 型門板", "造型門板", "P8_9_HANDMADE_DOOR", "PER_ITEM", 720, { note: "加工長度 150–300mm" }),
  rule("W", "W 型門板", "造型門板", "P8_9_HANDMADE_DOOR", "PER_ITEM", 720, { note: "部分斜背" }),
  rule("G1", "G1 弧形凹槽", "G 系列造型", ["P6_BOARD_PROCESS", "P8_9_HANDMADE_DOOR"], "PER_ITEM", 600, { minCai: 1, note: "含封邊；加工長度 <= 300mm" }),
  rule("G2", "G2 直角凹槽", "G 系列造型", ["P6_BOARD_PROCESS", "P8_9_HANDMADE_DOOR"], "PER_ITEM", 600, { minCai: 1, note: "含封邊；加工長度 <= 300mm" }),
  rule("G3", "G3 微笑槽", "G 系列造型", ["P6_BOARD_PROCESS", "P8_9_HANDMADE_DOOR"], "PER_ITEM", 600, { minCai: 1, note: "含封邊；加工長度 <= 300mm" }),
  rule("G4_G5", "G4/G5 切 L 角", "G 系列造型", ["P6_BOARD_PROCESS", "P8_9_HANDMADE_DOOR"], "PER_ITEM", 600, { minCai: 1, note: "含封邊；加工長度 <= 300mm" }),
  rule("G6_G7", "G6/G7 切斜角", "G 系列造型", ["P6_BOARD_PROCESS", "P8_9_HANDMADE_DOOR"], "PER_ITEM", 600, { minCai: 1, note: "含封邊；加工斜度 <= 300mm" }),
  rule("G8_G9", "G8/G9 導 R 角 8/18mm", "G 系列造型", ["P6_BOARD_PROCESS", "P8_9_HANDMADE_DOOR"], "PER_ITEM", 500, { minCai: 1, note: "含封邊；20mm <= R < 150mm" }),
  rule("G10", "G10 內挖方型", "G 系列造型", ["P6_BOARD_PROCESS", "P8_9_HANDMADE_DOOR"], "PER_ITEM", 720, { minCai: 1, note: "150mm <= 加工長度 <= 300mm" }),
  rule("G11", "G11 內挖圓", "G 系列造型", ["P6_BOARD_PROCESS", "P8_9_HANDMADE_DOOR"], "PER_ITEM", 1000, { minCai: 1, note: "150mm <= 加工直徑 <= 300mm" }),
  rule("G12_8", "G12 導全圓 8mm／150–600mm", "G 系列造型", ["P6_BOARD_PROCESS", "P10_HANDMADE_SHAPED"], "PER_ITEM", 1200, { minCai: 1, note: "含封邊；150mm <= 加工直徑 <= 600mm" }),
  rule("G12_18", "G12 導全圓 18mm／150–600mm", "G 系列造型", ["P6_BOARD_PROCESS", "P10_HANDMADE_SHAPED"], "PER_ITEM", 1200, { minCai: 1, note: "含封邊；150mm <= 加工直徑 <= 600mm" }),
  rule("G12_25", "G12 導全圓 25mm／150–600mm", "G 系列造型", ["P6_BOARD_PROCESS", "P10_HANDMADE_SHAPED"], "PER_ITEM", 1800, { minCai: 1, note: "含封邊；150mm <= 加工直徑 <= 600mm" }),
  rule("G12_50", "G12 導全圓 50mm／150–600mm", "G 系列造型", ["P6_BOARD_PROCESS", "P10_HANDMADE_SHAPED"], "PER_ITEM", 2400, { minCai: 1, note: "含封邊；150mm <= 加工直徑 <= 600mm" }),
  rule("G13_8", "G13 導全圓 8mm／601–1200mm", "G 系列造型", ["P6_BOARD_PROCESS", "P10_HANDMADE_SHAPED"], "PER_ITEM", 2000, { minCai: 1, note: "含封邊；601mm <= 加工直徑 <= 1200mm" }),
  rule("G13_18", "G13 導全圓 18mm／601–1200mm", "G 系列造型", ["P6_BOARD_PROCESS", "P10_HANDMADE_SHAPED"], "PER_ITEM", 2000, { minCai: 1, note: "含封邊；601mm <= 加工直徑 <= 1200mm" }),
  rule("G13_25", "G13 導全圓 25mm／601–1200mm", "G 系列造型", ["P6_BOARD_PROCESS", "P10_HANDMADE_SHAPED"], "PER_ITEM", 2600, { minCai: 1, note: "含封邊；601mm <= 加工直徑 <= 1200mm" }),
  rule("G13_50", "G13 導全圓 50mm／601–1200mm", "G 系列造型", ["P6_BOARD_PROCESS", "P10_HANDMADE_SHAPED"], "PER_ITEM", 3200, { minCai: 1, note: "含封邊；601mm <= 加工直徑 <= 1200mm" }),
  rule("G14_8", "G14 1/2 導圓 8mm／150–600mm", "G 系列造型", ["P6_BOARD_PROCESS", "P10_HANDMADE_SHAPED"], "PER_ITEM", 1200, { minCai: 1, note: "含封邊；150mm <= 加工直徑 <= 600mm" }),
  rule("G14_18", "G14 1/2 導圓 18mm／150–600mm", "G 系列造型", ["P6_BOARD_PROCESS", "P10_HANDMADE_SHAPED"], "PER_ITEM", 1200, { minCai: 1, note: "含封邊；150mm <= 加工直徑 <= 600mm" }),
  rule("G14_25", "G14 1/2 導圓 25mm／150–600mm", "G 系列造型", ["P6_BOARD_PROCESS", "P10_HANDMADE_SHAPED"], "PER_ITEM", 1800, { minCai: 1, note: "含封邊；150mm <= 加工直徑 <= 600mm" }),
  rule("G14_50", "G14 1/2 導圓 50mm／150–600mm", "G 系列造型", ["P6_BOARD_PROCESS", "P10_HANDMADE_SHAPED"], "PER_ITEM", 2400, { minCai: 1, note: "含封邊；150mm <= 加工直徑 <= 600mm" }),
  rule("G15_8", "G15 1/2 導圓 8mm／601–1200mm", "G 系列造型", ["P6_BOARD_PROCESS", "P10_HANDMADE_SHAPED"], "PER_ITEM", 2000, { minCai: 1, note: "含封邊；601mm <= 加工直徑 <= 1200mm" }),
  rule("G15_18", "G15 1/2 導圓 18mm／601–1200mm", "G 系列造型", ["P6_BOARD_PROCESS", "P10_HANDMADE_SHAPED"], "PER_ITEM", 2000, { minCai: 1, note: "含封邊；601mm <= 加工直徑 <= 1200mm" }),
  rule("G15_25", "G15 1/2 導圓 25mm／601–1200mm", "G 系列造型", ["P6_BOARD_PROCESS", "P10_HANDMADE_SHAPED"], "PER_ITEM", 2600, { minCai: 1, note: "含封邊；601mm <= 加工直徑 <= 1200mm" }),
  rule("G15_50", "G15 1/2 導圓 50mm／601–1200mm", "G 系列造型", ["P6_BOARD_PROCESS", "P10_HANDMADE_SHAPED"], "PER_ITEM", 3200, { minCai: 1, note: "含封邊；601mm <= 加工直徑 <= 1200mm" }),
  rule("C_GROOVE", "切 C 型槽", "洗槽", "P6_BOARD_PROCESS", "PER_ITEM", 200, { note: "18/25mm，不封邊" }),
  rule("ALUMINUM_STRIP_GROOVE", "隔板加鋁條洗槽", "洗槽", "P6_BOARD_PROCESS", "PER_CAI", 100, { minCai: 1 }),
  rule("CUSTOM_GROOVE", "指定洗溝", "洗槽", "P6_BOARD_PROCESS", "PER_10MM", 20),
  rule("TRACK_GROOVE", "洗軌道溝", "洗槽", "P6_BOARD_PROCESS", "PER_10MM", 10),
  rule("DOOR_STRAIGHTENER_GROOVE", "門板拉直器開槽", "洗槽", "P6_BOARD_PROCESS", "PER_10MM", 10),
  rule("WIRE_OUTLET_HOLE", "電線孔蓋孔", "挖孔", "P6_BOARD_PROCESS", "PER_ITEM", 100),
  rule("VENT_HOLE", "透氣孔蓋孔", "挖孔", "P6_BOARD_PROCESS", "PER_ITEM", 500),
  rule("ROUND_LIGHT_HOLE", "圓型崁燈孔", "挖孔", "P6_BOARD_PROCESS", "PER_ITEM", 700),
  rule("PUSH_DOOR_GUIDE_HOLE", "推門導輪孔", "挖孔", "P6_BOARD_PROCESS", "PER_ITEM", 200),
  rule("SLIDING_CABINET_WHEEL_HOLE", "推拉櫃上下輪孔", "挖孔", "P6_BOARD_PROCESS", "PER_ITEM", 40),
  rule("RECESSED_HANDLE_HOLE", "崁入式把手孔", "挖孔", "P6_BOARD_PROCESS", "PER_ITEM", 60),
  rule("HINGE_HOLE", "鉸鏈孔", "挖孔", "P6_BOARD_PROCESS", "PER_ITEM", 40),
  rule("OUTSOURCED_HINGE_HOLE", "代挖鉸鏈孔", "挖孔", "P6_BOARD_PROCESS", "PER_ITEM", 200),
  rule("BODY_VENT_HOLE", "桶身透氣孔", "挖孔", "P6_BOARD_PROCESS", "PER_CAI", 100, { minCai: 5 }),
  rule("HIDDEN_SHELF_BRACKET_HOLE", "隱藏式層板支架孔", "挖孔", "P6_BOARD_PROCESS", "PER_ITEM", 400, { note: "適用 40mm 以上板材" }),
  rule("HIDDEN_SHELF_SCREW_HOLE", "隱藏式層板螺絲孔", "挖孔", "P6_BOARD_PROCESS", "PER_ITEM", 100, { note: "適用 25mm 以下板材" }),
  nonDoorProcessRule("ALUMINUM_FRAME_PARTITION_A1", "A1 鋁框門區隔", "鋁框門區隔", "PER_CAI", 0),
  nonDoorProcessRule("ALUMINUM_FRAME_PARTITION_A1_1", "A1-1 鋁框門區隔", "鋁框門區隔", "PER_CAI", 40),
  nonDoorProcessRule("ALUMINUM_FRAME_PARTITION_A1_2", "A1-2 鋁框門區隔", "鋁框門區隔", "PER_CAI", 60),
  nonDoorProcessRule("ALUMINUM_FRAME_PARTITION_A2", "A2 鋁框門區隔", "鋁框門區隔", "PER_CAI", 40),
  nonDoorProcessRule("ALUMINUM_FRAME_PARTITION_A2_1", "A2-1 鋁框門區隔", "鋁框門區隔", "PER_CAI", 80),
  nonDoorProcessRule("ALUMINUM_FRAME_PARTITION_A2_2", "A2-2 鋁框門區隔", "鋁框門區隔", "PER_CAI", 120),
  nonDoorProcessRule("H8_SEPARATOR", "H8 每一分隔加價", "H8 五金加工", "PER_CAI", 30),
  nonDoorProcessRule("H8_TRACK_ALUMINUM", "H8 軌道加購 鋁本色", "H8 五金加工", "PER_CHI", 300),
  nonDoorProcessRule("H8_TRACK_ANODIZED", "H8 軌道加購 陽極黑", "H8 五金加工", "PER_CHI", 350),
  nonDoorProcessRule("H8_TRACK_WHITE", "H8 軌道加購 陽極白", "H8 五金加工", "PER_CHI", 350),
  nonDoorProcessRule("H8_BUFFER", "H8 快拆雙向緩衝器", "H8 五金加工", "PER_ITEM", 6700, { note: "單組價格；載重 100kg，緩衝寬度至少 600mm" }),
  nonDoorProcessRule("H8_L_STOP", "H8 L型下門止", "H8 五金加工", "PER_ITEM", 200),
  nonDoorProcessRule("H8_HOOK_LOCK", "H8 鉤鎖 D 型鋁條專用", "H8 五金加工", "PER_ITEM", 1000),
  nonDoorProcessRule("H8_HOOK_LOCK_KEY", "H8 鉤鎖 D 型鋁條專用（附鑰匙）", "H8 五金加工", "PER_ITEM", 1500),
  nonDoorProcessRule("S2_SEPARATOR", "S2 每一分隔加價", "S2 五金加工", "PER_CAI", 30),
  nonDoorProcessRule("S2_TRACK_SINGLE", "S2 單軌（上、下）", "S2 五金加工", "PER_CHI", 140),
  nonDoorProcessRule("S2_TRACK_DOUBLE", "S2 雙軌（上、下）", "S2 五金加工", "PER_CHI", 200),
  nonDoorProcessRule("S2_TRACK_TRIPLE", "S2 三軌（上、下）", "S2 五金加工", "PER_CHI", 400),
  nonDoorProcessRule("S2_TRACK_DOUBLE_ANODIZED", "S2 雙軌陽極黑（上、下）", "S2 五金加工", "PER_CHI", 340),
  nonDoorProcessRule("S2_TRACK_DOUBLE_WHITE", "S2 雙軌陽極白（上、下）", "S2 五金加工", "PER_CHI", 340),
  nonDoorProcessRule("S2_BUFFER", "S2 鋁框單向落地緩衝器 50KG", "S2 五金加工", "PER_ITEM", 1200, { note: "單組價格；單緩衝寬度至少 530mm，雙緩衝寬度至少 830mm" }),
  nonDoorProcessRule("S2_HOOK_LOCK", "S2 鉤鎖 D 型鋁條專用", "S2 五金加工", "PER_ITEM", 1000),
  nonDoorProcessRule("S2_HOOK_LOCK_KEY", "S2 鉤鎖 D 型鋁條專用（附鑰匙）", "S2 五金加工", "PER_ITEM", 1500),
];

export const ZHENGDAO_DOOR_PROCESS_SERIES_OPTIONS: Array<{
  code: ZhengdaoDoorProcessSeries;
  label: string;
}> = [
  { code: "P6_BOARD_PROCESS", label: "板材加工" },
  { code: "P7_SHAPED_DOOR", label: "造型門板" },
  { code: "P8_9_HANDMADE_DOOR", label: "手工門板" },
  { code: "P10_HANDMADE_SHAPED", label: "手工造型板" },
];

export const ZHENGDAO_2025_DOOR_PROCESS_RULE_BY_CODE = Object.fromEntries(
  ZHENGDAO_2025_DOOR_PROCESS_RULES.map((processRule) => [processRule.code, processRule]),
) as Record<ZhengdaoDoorProcessCode, ZhengdaoDoorProcessRule>;
