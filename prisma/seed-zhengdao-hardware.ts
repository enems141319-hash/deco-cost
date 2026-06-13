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
};

const rows: HardwareRow[] = [
  { category: MaterialCategory.HARDWARE_HINGE, brand: "正道", code: "RW_B903608", name: "內建緩衝鉸鏈 6分", unit: "只", price: 280 },
  { category: MaterialCategory.HARDWARE_HINGE, brand: "正道", code: "RW_B903308", name: "內建緩衝鉸鏈 3分", unit: "只", price: 325 },
  { category: MaterialCategory.HARDWARE_HINGE, brand: "正道", code: "RW_B903038", name: "內建緩衝鉸鏈 -90度", unit: "只", price: 700 },
  { category: MaterialCategory.HARDWARE_HINGE, brand: "正道", code: "RW_B903658", name: "厚門內建緩衝鉸鏈 6分", unit: "只", price: 370 },
  { category: MaterialCategory.HARDWARE_HINGE, brand: "正道", code: "RW_B903358", name: "厚門內建緩衝鉸鏈 3分", unit: "只", price: 380 },
  { category: MaterialCategory.HARDWARE_HINGE, brand: "正道", code: "RW_B903058", name: "厚門內建緩衝鉸鏈 入柱", unit: "只", price: 390 },
  { category: MaterialCategory.HARDWARE_HINGE, brand: "正道", code: "RW_B703603", name: "一般鉸鏈 6分", unit: "只", price: 120 },
  { category: MaterialCategory.HARDWARE_HINGE, brand: "正道", code: "RW_B702608", name: "一般鉸鏈緩衝背包", unit: "只", price: 155, notes: "適用門板厚度 20mm 以內；適用 6 分鉸鏈" },
  { category: MaterialCategory.HARDWARE_HINGE, brand: "正道", code: "RW_B703643", name: "170度特殊鉸鏈 6分", unit: "只", price: 520 },
  { category: MaterialCategory.HARDWARE_HINGE, brand: "正道", code: "RW_B702648", name: "170度特殊鉸鏈緩衝背包", unit: "只", price: 400 },

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
];

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
