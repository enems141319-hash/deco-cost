import { MaterialCategory, PrismaClient } from "@prisma/client";
import { LOUVER_DOOR_CONFIG, LOUVER_DOOR_PRICE_OPTIONS } from "../src/lib/config/units";

const prisma = new PrismaClient();

async function main() {
  let sortOrder = 40_000;
  const data = LOUVER_DOOR_PRICE_OPTIONS.flatMap((option) =>
    option.colorCodes.map((colorCode) => ({
      category: MaterialCategory.LOUVER_DOOR,
      brand: option.brand,
      colorCode,
      surfaceTreatment: option.surfaceTreatment,
      boardType: "格柵門",
      name: `格柵門 ${option.brand} ${colorCode} ${option.surfaceTreatment}`,
      spec: null,
      unit: "才",
      price: option.unitPrice,
      minCai: LOUVER_DOOR_CONFIG.MIN_CAI,
      wasteRate: 0,
      sortOrder: sortOrder++,
    })),
  );

  await prisma.material.deleteMany({ where: { category: MaterialCategory.LOUVER_DOOR } });
  const created = await prisma.material.createMany({ data });
  console.log(`inserted louver door materials: ${created.count}`);
}

main()
  .catch((error: unknown) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
