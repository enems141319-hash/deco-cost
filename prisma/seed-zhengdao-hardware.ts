import { MaterialCategory, MaterialVendor, Prisma, PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

type HardwareRow = {
  category: MaterialCategory;
  brand: string;
  code: string;
  name: string;
  spec?: string;
  unit: string;
  price: number;
  notes?: string;
  sortOrder?: number;
};

const rows: HardwareRow[] = [
  { category: MaterialCategory.HARDWARE_HINGE, brand: "正道", code: "RW_B903608", name: "內建緩衝鉸鏈 6分", unit: "只", price: 280, sortOrder: 1 },
  { category: MaterialCategory.HARDWARE_HINGE, brand: "正道", code: "RW_B903308", name: "內建緩衝鉸鏈 3分", unit: "只", price: 325, sortOrder: 2 },
  { category: MaterialCategory.HARDWARE_HINGE, brand: "正道", code: "RW_B903038", name: "內建緩衝鉸鏈 -90度", unit: "只", price: 700, sortOrder: 3 },
  { category: MaterialCategory.HARDWARE_HINGE, brand: "正道", code: "RW_B903658", name: "厚門內建緩衝鉸鏈 6分", unit: "只", price: 370, sortOrder: 4 },
  { category: MaterialCategory.HARDWARE_HINGE, brand: "正道", code: "RW_B903358", name: "厚門內建緩衝鉸鏈 3分", unit: "只", price: 380, sortOrder: 5 },
  { category: MaterialCategory.HARDWARE_HINGE, brand: "正道", code: "RW_B903058", name: "厚門內建緩衝鉸鏈 入柱", unit: "只", price: 390, sortOrder: 6 },
  { category: MaterialCategory.HARDWARE_HINGE, brand: "正道", code: "RW_B703603", name: "一般鉸鏈 6分", unit: "只", price: 120, sortOrder: 7 },
  { category: MaterialCategory.HARDWARE_HINGE, brand: "正道", code: "RW_B702608", name: "一般鉸鏈緩衝背包", unit: "只", price: 155, notes: "適用門板厚度 20mm 以內；適用 6 分鉸鏈", sortOrder: 8 },
  { category: MaterialCategory.HARDWARE_HINGE, brand: "正道", code: "RW_B703643", name: "170度特殊鉸鏈 6分", unit: "只", price: 520, sortOrder: 9 },
  { category: MaterialCategory.HARDWARE_HINGE, brand: "正道", code: "RW_B702648", name: "170度特殊鉸鏈緩衝背包", unit: "只", price: 400, sortOrder: 10 },

  ...([
    ["RW_B347250", 250, 240, 1900],
    ["RW_B347300", 300, 290, 1900],
    ["RW_B347350", 350, 340, 1900],
    ["RW_B347400", 400, 390, 1900],
    ["RW_B347450", 450, 440, 2100],
    ["RW_B347500", 500, 490, 2100],
    ["RW_B347550", 550, 540, 2600],
    ["RW_B347600", 600, 590, 2900],
  ] as const).map(([code, length, depth, price]) => ({
    category: MaterialCategory.HARDWARE_RAIL,
    brand: "BLUM",
    code,
    name: "BLUM 座式緩衝木抽滑軌 30kg",
    spec: `${length}mm／抽屜深度 ${depth}mm`,
    unit: "組",
    price,
    notes: "抽牆 18mm 用",
  })),

  ...([
    ["RW_H0051", 450, 2250],
    ["RW_H0052", 500, 2400],
    ["RW_H0053", 550, 2500],
    ["RW_H0054", 600, 2650],
    ["RW_H0056", 700, 2950],
    ["RW_H0058", 800, 3450],
    ["RW_H0059", 900, 4100],
    ["RW_H0060", 1000, 4500],
  ] as const).map(([code, length, price]) => ({
    category: MaterialCategory.HARDWARE_RAIL,
    brand: "川湖",
    code,
    name: "川湖三節式重滑軌 90kg",
    spec: `${length}mm`,
    unit: "組",
    price,
  })),

  ...([
    ["RW_H9025", 250, 600],
    ["RW_H9030", 300, 600],
    ["RW_H9035", 350, 600],
    ["RW_H9040", 400, 630],
    ["RW_H9050", 500, 680],
    ["RW_H9055", 550, 700],
    ["RW_H9060", 600, 730],
  ] as const).map(([code, length, price]) => ({
    category: MaterialCategory.HARDWARE_RAIL,
    brand: "川湖",
    code,
    name: "川湖三節式緩衝滑軌 45kg",
    spec: `${length}mm`,
    unit: "組",
    price,
  })),

  { category: MaterialCategory.HARDWARE_OTHER, brand: "推拉門五金", code: "RW_748101", name: "ㄇ型走槽上軌", spec: "3000mm", unit: "支", price: 230 },
  { category: MaterialCategory.HARDWARE_OTHER, brand: "推拉門五金", code: "RW_748102", name: "VT型走槽下軌", spec: "3000mm", unit: "支", price: 285 },
  { category: MaterialCategory.HARDWARE_OTHER, brand: "推拉門五金", code: "RW_748221", name: "ST 推門上導輪 20kg", unit: "個", price: 165 },
  { category: MaterialCategory.HARDWARE_OTHER, brand: "推拉門五金", code: "RW_748222", name: "ST 推門下V導輪 20kg", unit: "個", price: 165 },
  { category: MaterialCategory.HARDWARE_OTHER, brand: "推拉門五金", code: "RW_748231", name: "ST 推門上導輪 80kg", unit: "個", price: 350 },
  { category: MaterialCategory.HARDWARE_OTHER, brand: "推拉門五金", code: "RW_748232", name: "ST 推門下T導輪 80kg", unit: "個", price: 350 },
  { category: MaterialCategory.HARDWARE_OTHER, brand: "推拉門五金", code: "RW_FD019", name: "書櫃下軌", spec: "6尺", unit: "支", price: 1200, notes: "不可裁切" },
  { category: MaterialCategory.HARDWARE_OTHER, brand: "推拉門五金", code: "RW_FD020", name: "書櫃上軌", spec: "6尺", unit: "支", price: 510 },
  { category: MaterialCategory.HARDWARE_OTHER, brand: "推拉門五金", code: "RW_FD021", name: "書櫃下輪", spec: "每組4個輪子", unit: "組", price: 110 },
  { category: MaterialCategory.HARDWARE_OTHER, brand: "推拉門五金", code: "RW_FD022", name: "書櫃上輪", spec: "每組2個輪子", unit: "組", price: 100 },
  { category: MaterialCategory.HARDWARE_OTHER, brand: "推拉門五金", code: "RW_F0981", name: "玻璃推門軌道下軌", spec: "原始20尺", unit: "支", price: 70 },
  { category: MaterialCategory.HARDWARE_OTHER, brand: "推拉門五金", code: "RW_F0971", name: "玻璃推門軌道上軌", spec: "原始20尺", unit: "支", price: 60 },
  { category: MaterialCategory.HARDWARE_OTHER, brand: "推拉門五金", code: "RW_F07852", name: "玻璃推門夾邊條", spec: "原始10尺", unit: "支", price: 90, notes: "限 5mm 玻璃" },
  { category: MaterialCategory.HARDWARE_OTHER, brand: "推拉門五金", code: "RW_F0785", name: "玻璃推門輪", unit: "個", price: 100 },

  { category: MaterialCategory.HARDWARE_OTHER, brand: "掀桿", code: "RW_75600L", name: "600型上掀桿 左", unit: "支", price: 740, notes: "木門用；組裝工資另計 200/支" },
  { category: MaterialCategory.HARDWARE_OTHER, brand: "掀桿", code: "RW_75600R", name: "600型上掀桿 右", unit: "支", price: 740, notes: "木門用；組裝工資另計 200/支" },
  { category: MaterialCategory.HARDWARE_OTHER, brand: "掀桿", code: "RW_75600LS", name: "600型上掀桿 左", spec: "細鋁框用", unit: "支", price: 800, notes: "組裝工資另計 200/支" },
  { category: MaterialCategory.HARDWARE_OTHER, brand: "掀桿", code: "RW_75600RS", name: "600型上掀桿 右", spec: "細鋁框用", unit: "支", price: 800, notes: "組裝工資另計 200/支" },
  { category: MaterialCategory.HARDWARE_OTHER, brand: "掀桿", code: "RW_75601L", name: "601型掀桿 左", unit: "支", price: 740, notes: "木門用；組裝工資另計 200/支" },
  { category: MaterialCategory.HARDWARE_OTHER, brand: "掀桿", code: "RW_75601R", name: "601型掀桿 右", unit: "支", price: 740, notes: "木門用；組裝工資另計 200/支" },
  { category: MaterialCategory.HARDWARE_OTHER, brand: "掀桿", code: "RW_G700007", name: "平檯鉸鏈", unit: "個", price: 100 },
  { category: MaterialCategory.HARDWARE_OTHER, brand: "掀桿", code: "RW_75602L", name: "602型掀桿 左", unit: "支", price: 740, notes: "木門用；組裝工資另計 200/支" },
  { category: MaterialCategory.HARDWARE_OTHER, brand: "掀桿", code: "RW_75602R", name: "602型掀桿 右", unit: "支", price: 740, notes: "木門用；組裝工資另計 200/支" },
  { category: MaterialCategory.HARDWARE_OTHER, brand: "掀桿", code: "RW_75606", name: "德國進口搖臂（隨意停）", unit: "支", price: 850, notes: "木門用；組裝工資另計 200/支" },
  { category: MaterialCategory.HARDWARE_OTHER, brand: "掀桿", code: "RW_75606S", name: "德國進口搖臂（隨意停）", spec: "細鋁框用", unit: "支", price: 850, notes: "組裝工資另計 200/支" },

  ...createZhengdaoOtherHardwareRows(),
  ...createZhengdaoHandleRows(),
];

function createZhengdaoOtherHardwareRows(): HardwareRow[] {
  const rows: HardwareRow[] = [];
  const push = (row: Omit<HardwareRow, "category" | "sortOrder">) => {
    rows.push({
      category: MaterialCategory.HARDWARE_OTHER,
      sortOrder: 2000 + rows.length,
      ...row,
    });
  };

  [
    ["RW_854W", "白色"],
    ["RW_854B", "黑色"],
    ["RW_854G", "灰色"],
  ].forEach(([code, color]) => push({
    brand: "出線孔 / 集線器",
    code,
    name: `${code} PVC圓形出線口`,
    spec: `${color}／規格 Ø60／挖孔 Ø54mm`,
    unit: "只",
    price: 50,
    notes: "P45",
  }));

  push({
    brand: "出線孔 / 集線器",
    code: "RW_J3051",
    name: "RW_J3051 鋁出線盒",
    spec: "鋁色／規格 Ø61／挖孔 Ø54mm",
    unit: "只",
    price: 250,
    notes: "P45",
  });

  [
    ["RW_J3051DA", "雙線鋁色"],
    ["RW_J3051DB", "雙線黑色"],
  ].forEach(([code, color]) => push({
    brand: "出線孔 / 集線器",
    code,
    name: `${code} 雙線鋁出線盒`,
    spec: `${color}／規格 Ø65／挖孔 Ø55mm`,
    unit: "只",
    price: 200,
    notes: "P45",
  }));

  [
    ["RW_82807150", "150x80", "125x65", 125],
    ["RW_82807225", "225x80", "200x65", 150],
    ["RW_82807300", "300x80", "270x65", 170],
    ["RW_82807410", "410x80", "380x65", 205],
    ["RW_82807480", "480x80", "450x65", 270],
  ].forEach(([code, size, cutout, price]) => push({
    brand: "長型鋁透氣孔",
    code: String(code),
    name: `${code} 長型鋁透氣孔`,
    spec: `${size}mm／挖孔 ${cutout}mm`,
    unit: "片",
    price: Number(price),
    notes: "P45",
  }));

  [
    ["RW_1088120A", "鋁", "56x120x20", "53x106x18", 920],
    ["RW_1088120B", "黑", "56x120x20", "53x106x18", 920],
    ["RW_1088220A", "鋁", "56x222x20", "53x206x18", 1050],
    ["RW_1088220B", "黑", "56x222x20", "53x206x18", 1050],
  ].forEach(([code, color, size, cutout, price]) => push({
    brand: "出線孔 / 集線器",
    code: String(code),
    name: `${code} 鋁合金集線器`,
    spec: `${color}／規格 ${size}mm／挖孔 ${cutout}mm`,
    unit: "個",
    price: Number(price),
    notes: "P45",
  }));

  [
    ["RW_BQ009_350LB", "檯面支撐架-D350", "左"],
    ["RW_BQ009_350RB", "檯面支撐架-D350", "右"],
    ["RW_BQ009_450LB", "檯面支撐架-D450", "左"],
    ["RW_BQ009_450RB", "檯面支撐架-D450", "右"],
  ].forEach(([code, name, side]) => push({
    brand: "檯面支撐架",
    code,
    name: `${code} ${name}`,
    spec: side,
    unit: "支",
    price: 480,
    notes: "P46；附螺絲",
  }));

  [
    ["RW_CK003_1", "隱藏式層板支架", "280mm", 340],
    ["RW_CK003_2", "隱藏式層板支架", "165mm", 300],
  ].forEach(([code, name, size, price]) => push({
    brand: "隱藏式層板支架",
    code: String(code),
    name: `${code} ${name}`,
    spec: String(size),
    unit: "支",
    price: Number(price),
    notes: "P46；挖孔工資 400/孔",
  }));

  push({
    brand: "隱藏式層板支架",
    code: "RW_702105",
    name: "RW_702105 隱藏式層板螺絲",
    spec: "10x120mm",
    unit: "支",
    price: 80,
    notes: "P46；挖孔工資 100/孔",
  });

  return rows;
}

function createZhengdaoHandleRows(): HardwareRow[] {
  const rows: HardwareRow[] = [];
  const colors = [
    { suffix: "G", label: "拉絲金" },
    { suffix: "T", label: "鈦灰" },
    { suffix: "B", label: "黑色" },
  ];
  const rw051Prices = [
    [197, 150],
    [297, 180],
    [357, 250],
    [397, 260],
    [447, 285],
    [497, 305],
    [597, 360],
    [797, 475],
    [897, 540],
    [997, 630],
  ] as const;

  for (const color of colors) {
    for (const [lengthMm, price] of rw051Prices) {
      rows.push({
        category: MaterialCategory.HARDWARE_HANDLE,
        brand: "上嵌式鋁把手",
        code: `RW_051${color.suffix}_${lengthMm}`,
        name: "RW_051 隨意型上嵌式鋁把手",
        spec: `${lengthMm}mm／${color.label}`,
        unit: "支",
        price,
        notes: "P43；1000mm 以上另報價；組裝工資另計；B 型 NC 崁入工資另計",
        sortOrder: 1000 + rows.length,
      });
    }
  }

  const longHandleRows = [
    {
      code: "RW_050A",
      name: "RW_050A 豪華型上嵌式鋁把手",
      color: "鋁色",
      prices: [
        [197, 135],
        [297, 160],
        [357, 170],
        [397, 180],
        [447, 205],
        [497, 225],
        [597, 260],
        [797, 330],
        [897, 360],
        [997, 395],
        [2700, 1020],
      ],
      notes: "P44；規格外尺寸裁切每片另加 100 元；1000mm 以上牌價 7 元/cm、組裝工資 2 元/cm",
    },
    {
      code: "RW_055",
      name: "RW_055 夏都型上嵌式鋁把手",
      color: "鋁色",
      prices: [
        [197, 135],
        [297, 160],
        [357, 170],
        [397, 180],
        [447, 205],
        [497, 225],
        [597, 260],
        [797, 330],
        [897, 360],
        [997, 395],
        [2700, 1200],
      ],
      notes: "P44；適用板材厚度 18mm；規格外尺寸裁切每片另加 100 元；1000mm 以上牌價 7 元/cm、組裝工資 2 元/cm",
    },
  ] as const;

  for (const handle of longHandleRows) {
    for (const [lengthMm, price] of handle.prices) {
      rows.push({
        category: MaterialCategory.HARDWARE_HANDLE,
        brand: "上嵌式鋁把手",
        code: `${handle.code}_${lengthMm}`,
        name: handle.name,
        spec: `${lengthMm}mm／${handle.color}`,
        unit: "支",
        price,
        notes: handle.notes,
        sortOrder: 1000 + rows.length,
      });
    }
  }

  const rw077Prices = [
    [100, 140],
    [200, 180],
    [300, 250],
    [450, 370],
  ] as const;
  for (const [lengthMm, price] of rw077Prices) {
    rows.push({
      category: MaterialCategory.HARDWARE_HANDLE,
      brand: "上嵌式鋁把手",
      code: `RW_077_${lengthMm}`,
      name: "RW_077 舒適型上嵌式鋁把手",
      spec: `${lengthMm}mm／鈦金色`,
      unit: "支",
      price,
      notes: "P44；適用板材厚度 18mm；組裝工資另計",
      sortOrder: 1000 + rows.length,
    });
  }

  const rw078tPrices = [
    [147, 100, 135],
    [197, 100, 180],
    [297, 100, 260],
    [357, 250, 305],
    [397, 250, 350],
    [447, 250, 385],
    [497, 350, 460],
    [597, 350, 500],
    [797, 450, 650],
    [897, 450, 750],
    [997, 450, 810],
  ] as const;
  for (const [slotLengthMm, handleLengthMm, price] of rw078tPrices) {
    rows.push({
      category: MaterialCategory.HARDWARE_HANDLE,
      brand: "上嵌式鋁把手",
      code: `RW_078T_${slotLengthMm}_${handleLengthMm}`,
      name: "RW_078T 小爵士型上嵌式鋁把手",
      spec: `入規 ${slotLengthMm}mm／掛把 ${handleLengthMm}mm／鈦金色`,
      unit: "支",
      price,
      notes: "P44；組裝工資另計",
      sortOrder: 1000 + rows.length,
    });
  }

  return rows;
}

function toMaterial(row: HardwareRow): Prisma.MaterialCreateManyInput {
  return {
    vendor: MaterialVendor.ZHENGDAO,
    vendorCode: row.code,
    catalogVersion: "2025",
    category: row.category,
    brand: row.brand,
    name: row.name,
    spec: row.spec,
    unit: row.unit,
    price: row.price,
    minCai: null,
    wasteRate: 0,
    notes: row.notes,
    pricingMeta: { source: "正道整理PDF", vendorCode: row.code },
    isActive: true,
    sortOrder: row.sortOrder ?? 0,
  };
}

async function main() {
  await prisma.material.deleteMany({
    where: {
      vendor: MaterialVendor.ZHENGDAO,
      category: {
        in: [
          MaterialCategory.HARDWARE_HINGE,
          MaterialCategory.HARDWARE_RAIL,
          MaterialCategory.HARDWARE_HANDLE,
          MaterialCategory.HARDWARE_OTHER,
        ],
      },
    },
  });
  await prisma.material.createMany({ data: rows.map(toMaterial) });
  console.log(`Seeded ${rows.length} Zhengdao hardware rows.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
