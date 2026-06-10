import { MaterialCategory, MaterialVendor, Prisma, PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const commonBodyNotes = "桶身前封 ABS 每才 +10 元；前後封 ABS 每才 +20 元。";
const bodyRows = [
  ["ER928", 18, "NONE", 130, 1],
  ["ER928", 8, "NO_EDGE", 90, 1],
  ["ER928", 8, "ABS", 140, 1],
  ["JM", 18, "NONE", 130, 1],
  ["JM", 8, "NO_EDGE", 90, 1],
  ["JM", 8, "ABS", 140, 1],
  ["ER", 18, "NONE", 150, 1],
  ["ER", 8, "NO_EDGE", 110, 1],
  ["ER", 8, "ABS", 160, 1],
  ["AR", 18, "NONE", 190, 1],
  ["AR", 8, "NO_EDGE", 135, 1],
  ["AR", 8, "ABS", 190, 1],
  ["HWR", 18, "NONE", 290, 2],
  ["HWR", 3, "NONE", 120, 2],
  ["HR", 18, "NONE", 410, 2],
  ["HR", 3, "NONE", 170, 2],
] as const;

const backingRows = [
  ["ER928", 8, "NO_EDGE", 90, 1],
  ["ER928", 8, "ABS", 140, 1],
  ["JM", 8, "NO_EDGE", 90, 1],
  ["JM", 8, "ABS", 140, 1],
  ["ER", 8, "NO_EDGE", 110, 1],
  ["ER", 8, "ABS", 160, 1],
  ["AR", 8, "NO_EDGE", 135, 1],
  ["AR", 8, "ABS", 190, 1],
] as const;

type Row = readonly [series: string, thicknessMm: number, edgeMode: string, price: number, minCai: number];

function edgeLabel(edgeMode: string): string {
  if (edgeMode === "ABS") return "對 ABS";
  if (edgeMode === "NO_EDGE") return "無封邊";
  return "";
}

function toMaterial(row: Row, category: MaterialCategory): Prisma.MaterialCreateManyInput {
  const [series, thicknessMm, edgeMode, price, minCai] = row;
  const edge = edgeLabel(edgeMode);
  const spec = [ `${thicknessMm}mm`, edge ].filter(Boolean).join(" ");
  const kind = category === MaterialCategory.BOARD_BODY ? "BODY" : "BACKING";
  return {
    vendor: MaterialVendor.ZHENGDAO,
    vendorCode: `ZHENGDAO-${kind}-${series}-${thicknessMm}-${edgeMode}`,
    catalogVersion: "2025",
    category,
    brand: "正道",
    name: series,
    spec,
    boardType: spec,
    unit: "才",
    price,
    minCai,
    wasteRate: 0,
    notes: category === MaterialCategory.BOARD_BODY ? commonBodyNotes : null,
    pricingMeta: { series, thicknessMm, edgeMode },
    isActive: true,
  };
}

async function main() {
  await prisma.material.deleteMany({
    where: {
      vendor: MaterialVendor.ZHENGDAO,
      category: { in: [MaterialCategory.BOARD_BODY, MaterialCategory.BOARD_BACKING] },
    },
  });
  await prisma.material.createMany({
    data: [
      ...bodyRows.map((row) => toMaterial(row, MaterialCategory.BOARD_BODY)),
      ...backingRows.map((row) => toMaterial(row, MaterialCategory.BOARD_BACKING)),
    ],
  });
  console.log(`Seeded ${bodyRows.length} body board rows and ${backingRows.length} backing board rows.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
