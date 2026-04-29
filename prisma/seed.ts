// prisma/seed.ts

import { Prisma, PrismaClient, MaterialCategory } from "@prisma/client";
import bcrypt from "bcryptjs";
import path from "node:path";
import * as XLSX from "xlsx";

const prisma = new PrismaClient();

const BOARD_TYPE_META = [
  { boardType: "8mm背板不封邊", category: MaterialCategory.BOARD_BACKING },
  { boardType: "18mm櫃體封PVC", category: MaterialCategory.BOARD_BODY },
  { boardType: "18mm 4E門板封ABS", category: MaterialCategory.BOARD_DOOR },
  { boardType: "18mm 4E H型 5mm清玻門", category: MaterialCategory.BOARD_DOOR },
  { boardType: "18mm 4E框型 5mm清玻門", category: MaterialCategory.BOARD_DOOR },
  { boardType: "18mm 4E框型肚板門", category: MaterialCategory.BOARD_DOOR },
  { boardType: "18mm 4E框鐵網門", category: MaterialCategory.BOARD_DOOR },
  { boardType: "25mm封ABS", category: MaterialCategory.BOARD_BODY },
] as const;

const KNOWN_BRANDS = ["EGGER", "SKIN", "CLEAF", "HORNG CHANG", "Longland", "JANGMEI"] as const;

function cell(row: unknown[] | undefined, index: number): string {
  if (!row) return "";
  const value = row[index];
  return value === null || value === undefined ? "" : String(value).trim();
}

function parseNumber(value: string): number | null {
  const match = value.replace(/,/g, "").match(/\d+(?:\.\d+)?/);
  return match ? Number(match[0]) : null;
}

function parseCai(value: string): number | null {
  if (!value.includes("才")) return null;
  return parseNumber(value);
}

function isKnownBrand(value: string): boolean {
  const normalized = value.replace(/^※\s*/, "").trim();
  return KNOWN_BRANDS.some((brand) => normalized === brand);
}

function parseBrandFromHeader(value: string): string | null {
  const firstLine = value.split(/\r?\n/)[0]?.replace(/^※\s*/, "").trim();
  if (!firstLine || firstLine === "色號") return null;
  return isKnownBrand(firstLine) ? firstLine : null;
}

function isColorCode(value: string): boolean {
  if (!value || value.startsWith("※") || value.includes("編號")) return false;
  return /^[A-Z]{1,5}\d[A-Z0-9-]*$/i.test(value);
}

function readRows(): unknown[][] {
  const filePath = path.join(process.cwd(), "prisma", "data", "牌價表.xlsx");
  const workbook = XLSX.readFile(filePath);
  const firstSheet = workbook.SheetNames[0];
  const sheet = workbook.Sheets[firstSheet];
  return XLSX.utils.sheet_to_json<unknown[]>(sheet, {
    header: 1,
    raw: false,
    defval: "",
  });
}

function buildBoardMaterials(rows: unknown[][]): Prisma.MaterialCreateManyInput[] {
  const materials: Prisma.MaterialCreateManyInput[] = [];
  let sortOrder = 0;

  for (let headerIndex = 0; headerIndex < rows.length; headerIndex++) {
    const headerRow = rows[headerIndex];
    const firstCell = cell(headerRow, 0);
    const surfaceHeader = cell(headerRow, 7);
    const isHeader = firstCell.includes("色號") && surfaceHeader.includes("表面處理");
    if (!isHeader) continue;

    let currentBrand = parseBrandFromHeader(firstCell);
    const minCaiRow = rows[headerIndex + 3];
    const priceColumns = minCaiRow
      .map((value, index) => ({ index, minCai: parseCai(String(value)) }))
      .filter((item): item is { index: number; minCai: number } => item.minCai !== null);

    for (let rowIndex = headerIndex + 4; rowIndex < rows.length; rowIndex++) {
      const row = rows[rowIndex];
      const marker = cell(row, 0);
      if (marker.includes("編號") || marker.includes("牌價表")) break;
      if (marker.startsWith("※") && !isKnownBrand(marker)) break;
      if (isKnownBrand(marker)) {
        currentBrand = marker.replace(/^※\s*/, "").trim();
        continue;
      }

      const colorCode = cell(row, 0);
      const surfaceTreatment = cell(row, 7);
      if (!currentBrand || !isColorCode(colorCode) || !surfaceTreatment) continue;

      for (let metaIndex = 0; metaIndex < Math.min(priceColumns.length, BOARD_TYPE_META.length); metaIndex++) {
        const { index, minCai } = priceColumns[metaIndex];
        const price = parseNumber(cell(row, index));
        if (!price || price <= 0) continue;

        const meta = BOARD_TYPE_META[metaIndex];
        materials.push({
          category: meta.category,
          brand: currentBrand,
          colorCode,
          surfaceTreatment,
          boardType: meta.boardType,
          name: `${currentBrand} ${colorCode} ${surfaceTreatment} ${meta.boardType}`,
          unit: "才",
          price,
          minCai,
          wasteRate: 0,
          sortOrder: sortOrder++,
        });
      }
    }
  }

  return materials.map((material) => {
    if (
      material.name.includes("玻璃") ||
      material.name.includes("鏡")
    ) {
      return { ...material, category: MaterialCategory.GLASS, brand: "玻璃", spec: "玻璃" };
    }

    if (
      material.name.includes("擴張網") ||
      material.name.includes("沖孔網") ||
      material.name.includes("鐵網指定色烤漆")
    ) {
      return { ...material, category: MaterialCategory.WIRE_MESH, brand: "網材", spec: "網材" };
    }

    return material;
  });
}

const HORNG_CHANG_114122601_ROWS = [
  { colorCode: "G5527", surfaceTreatment: "SM", prices: [85, 110, 125, 195, 225, 225, 220, 170] },
  { colorCode: "G5527", surfaceTreatment: "ST68", prices: [85, 110, 125, 195, 225, 225, 220, 170] },
  { colorCode: "G6505", surfaceTreatment: "ST68", prices: [85, 110, 125, 195, 225, 225, 220, 170] },
  { colorCode: "G6506", surfaceTreatment: "ST68", prices: [85, 110, 125, 195, 225, 225, 220, 170] },
  { colorCode: "G6507", surfaceTreatment: "ST68", prices: [85, 110, 125, 195, 225, 225, 220, 170] },
  { colorCode: "G5527", surfaceTreatment: "SW", prices: [85, 110, 125, 195, 225, 225, 220, 170] },
  { colorCode: "G6505", surfaceTreatment: "SW", prices: [85, 110, 125, 195, 225, 225, 220, 170] },
  { colorCode: "G6506", surfaceTreatment: "SW", prices: [85, 110, 125, 195, 225, 225, 220, 170] },
  { colorCode: "G6507", surfaceTreatment: "SW", prices: [85, 110, 125, 195, 225, 225, 220, 170] },
  { colorCode: "G6505", surfaceTreatment: "SMP", prices: [95, null, null, null, null, null, null, null] },
  { colorCode: "G6506", surfaceTreatment: "SMP", prices: [95, null, null, null, null, null, null, null] },
  { colorCode: "G6507", surfaceTreatment: "SMP", prices: [95, null, null, null, null, null, null, null] },
  { colorCode: "G6505", surfaceTreatment: "SMPP", prices: [null, 125, 140, 210, 240, 240, 235, 190] },
  { colorCode: "G6506", surfaceTreatment: "SMPP", prices: [null, 125, 140, 210, 240, 240, 235, 190] },
  { colorCode: "G6507", surfaceTreatment: "SMPP", prices: [null, 125, 140, 210, 240, 240, 235, 190] },
  { colorCode: "S5002", surfaceTreatment: "SMP", prices: [90, null, null, null, null, null, null, null] },
  { colorCode: "S5003", surfaceTreatment: "SMP", prices: [90, null, null, null, null, null, null, null] },
  { colorCode: "S5004", surfaceTreatment: "SMP", prices: [90, null, null, null, null, null, null, null] },
  { colorCode: "S5002", surfaceTreatment: "SMPP", prices: [null, 120, 135, 205, 235, 235, 230, 185] },
  { colorCode: "S5003", surfaceTreatment: "SMPP", prices: [null, 120, 135, 205, 235, 235, 230, 185] },
  { colorCode: "S5004", surfaceTreatment: "SMPP", prices: [null, 120, 135, 205, 235, 235, 230, 185] },
] as const;

const HORNG_CHANG_114122601_MIN_CAI = [1, 1, 1.5, 3, 3, 3, 3, 2] as const;

function buildHorngChang114122601Materials(
  existingMaterials: Prisma.MaterialCreateManyInput[],
): Prisma.MaterialCreateManyInput[] {
  const existingKeys = new Set(
    existingMaterials.map((material) =>
      [material.brand, material.colorCode, material.surfaceTreatment, material.boardType].join("|"),
    ),
  );
  const materials: Prisma.MaterialCreateManyInput[] = [];
  let sortOrder = 30_000;

  for (const row of HORNG_CHANG_114122601_ROWS) {
    row.prices.forEach((price, index) => {
      if (!price) return;

      const meta = BOARD_TYPE_META[index];
      const key = ["HORNG CHANG", row.colorCode, row.surfaceTreatment, meta.boardType].join("|");
      if (existingKeys.has(key)) return;

      materials.push({
        category: meta.category,
        brand: "HORNG CHANG",
        colorCode: row.colorCode,
        surfaceTreatment: row.surfaceTreatment,
        boardType: meta.boardType,
        name: `HORNG CHANG ${row.colorCode} ${row.surfaceTreatment} ${meta.boardType}`,
        unit: "\u624d",
        price,
        minCai: HORNG_CHANG_114122601_MIN_CAI[index],
        wasteRate: 0,
        sortOrder: sortOrder++,
      });
    });
  }

  return materials.map((material) => {
    if (
      material.name.includes("玻璃") ||
      material.name.includes("鏡")
    ) {
      return { ...material, category: MaterialCategory.GLASS, brand: "玻璃", spec: "玻璃" };
    }

    if (
      material.name.includes("擴張網") ||
      material.name.includes("沖孔網") ||
      material.name.includes("鐵網指定色烤漆")
    ) {
      return { ...material, category: MaterialCategory.WIRE_MESH, brand: "網材", spec: "網材" };
    }

    return material;
  });
}

function buildHardwareMaterials(rows: unknown[][]): Prisma.MaterialCreateManyInput[] {
  const materials: Prisma.MaterialCreateManyInput[] = [];
  let sortOrder = 10_000;

  const addHardware = (params: {
    category: MaterialCategory;
    brand: string;
    name: string;
    unit: string;
    price: number | null;
    colorCode?: string | null;
    spec?: string | null;
  }) => {
    const name = params.name.replace(/\s+/g, " ").trim();
    if (!name || !params.unit || !params.price || params.price <= 0) return;
    materials.push({
      category: params.category,
      brand: params.brand,
      colorCode: params.colorCode ?? null,
      spec: params.spec ?? null,
      name,
      unit: params.unit,
      price: params.price,
      minCai: null,
      wasteRate: 0,
      sortOrder: sortOrder++,
    });
  };

  let currentLeftSection = "";
  for (let rowIndex = 484; rowIndex <= 511; rowIndex++) {
    const row = rows[rowIndex];
    const section = cell(row, 2);
    if (section) currentLeftSection = section;

    const name = cell(row, 6);
    const unit = cell(row, 36);
    const price = parseNumber(cell(row, 39));
    if (!name || !unit || !price) continue;

    const category = currentLeftSection === "滑軌"
      ? MaterialCategory.HARDWARE_RAIL
      : MaterialCategory.HARDWARE_OTHER;
    const brand = currentLeftSection === "滑軌"
      ? (name.startsWith("3M") ? "3M" : name.startsWith("1B68") ? "1B68" : "滑軌")
      : currentLeftSection || "其他五金";

    addHardware({ category, brand, name, unit, price, spec: currentLeftSection || null });
  }

  let currentRightSection = "";
  for (let rowIndex = 484; rowIndex <= 509; rowIndex++) {
    const row = rows[rowIndex];
    const section = cell(row, 43);
    if (section) currentRightSection = section;

    addHardware({
      category: MaterialCategory.HARDWARE_OTHER,
      brand: currentRightSection || "五金配件",
      name: cell(row, 47),
      unit: cell(row, 70),
      price: parseNumber(cell(row, 74)),
      spec: currentRightSection || null,
    });
  }

  let currentBrand: "TITUS" | "blum" = "TITUS";
  for (let rowIndex = 518; rowIndex <= 532; rowIndex++) {
    const row = rows[rowIndex];
    const brandMarker = cell(row, 3);
    if (brandMarker.includes("blum")) currentBrand = "blum";
    if (brandMarker.includes("TITUS")) currentBrand = "TITUS";

    addHardware({
      category: MaterialCategory.HARDWARE_HINGE,
      brand: currentBrand,
      colorCode: cell(row, 11),
      name: cell(row, 22),
      unit: cell(row, 65),
      price: parseNumber(cell(row, 69)),
      spec: "鉸鍊",
    });
  }

  for (let rowIndex = 533; rowIndex <= 539; rowIndex++) {
    const row = rows[rowIndex];
    addHardware({
      category: MaterialCategory.HARDWARE_OTHER,
      brand: "鉸鍊螺絲/加工",
      colorCode: cell(row, 11) || null,
      name: cell(row, 22),
      unit: cell(row, 65),
      price: parseNumber(cell(row, 69)),
      spec: "鉸鍊螺絲/加工",
    });
  }

  for (let rowIndex = 546; rowIndex <= 580; rowIndex++) {
    const row = rows[rowIndex];
    addHardware({
      category: MaterialCategory.HARDWARE_HANDLE,
      brand: "鋁把手",
      name: cell(row, 1),
      unit: cell(row, 28),
      price: parseNumber(cell(row, 31)),
      spec: "鋁把手",
    });

    addHardware({
      category: MaterialCategory.HARDWARE_OTHER,
      brand: "玻璃/網材",
      name: cell(row, 39),
      unit: cell(row, 64),
      price: parseNumber(cell(row, 67)),
      spec: "玻璃/網材",
    });
  }

  return materials.map((material) => {
    if (
      material.name.includes("玻璃") ||
      material.name.includes("鏡")
    ) {
      return { ...material, category: MaterialCategory.GLASS, brand: "玻璃", spec: "玻璃" };
    }

    if (
      material.name.includes("擴張網") ||
      material.name.includes("沖孔網") ||
      material.name.includes("鐵網指定色烤漆")
    ) {
      return { ...material, category: MaterialCategory.WIRE_MESH, brand: "網材", spec: "網材" };
    }

    return material;
  });
}

function buildCeilingFallbackMaterials(): Prisma.MaterialCreateManyInput[] {
  return [
    { category: MaterialCategory.ANGLE_MATERIAL, name: "木角材", spec: "1×1.2寸 8尺", unit: "支", price: 65, minCai: null, wasteRate: 0.05, sortOrder: 20_000 },
    { category: MaterialCategory.ANGLE_MATERIAL, name: "輕鋼架角材", spec: "38×12mm", unit: "支", price: 85, minCai: null, wasteRate: 0.05, sortOrder: 20_001 },
    { category: MaterialCategory.ANGLE_MATERIAL, name: "周邊角材（L型）", spec: "輕鋼架用", unit: "支", price: 55, minCai: null, wasteRate: 0.05, sortOrder: 20_002 },
    { category: MaterialCategory.CEILING_BOARD, name: "矽酸鈣板", spec: "3×6尺 6mm", unit: "片", price: 280, minCai: null, wasteRate: 0.08, sortOrder: 20_010 },
    { category: MaterialCategory.CEILING_BOARD, name: "矽酸鈣板", spec: "3×6尺 9mm", unit: "片", price: 380, minCai: null, wasteRate: 0.08, sortOrder: 20_011 },
    { category: MaterialCategory.CEILING_BOARD, name: "輕鋼架天花板", spec: "60×60cm", unit: "片", price: 120, minCai: null, wasteRate: 0.05, sortOrder: 20_012 },
  ];
}

async function main() {
  console.log("🌱 開始植入種子資料...");

  const hashedPassword = await bcrypt.hash("password123", 10);
  const demoUser = await prisma.user.upsert({
    where: { email: "demo@decoest.com" },
    update: {},
    create: { name: "示範用戶", email: "demo@decoest.com", password: hashedPassword },
  });
  console.log(`✅ 建立用戶: ${demoUser.email}`);

  const rows = readRows();
  const boardMaterials = buildBoardMaterials(rows);
  const materials = [
    ...boardMaterials,
    ...buildHorngChang114122601Materials(boardMaterials),
    ...buildHardwareMaterials(rows),
    ...buildCeilingFallbackMaterials(),
  ];

  await prisma.material.deleteMany();
  const created = await prisma.material.createMany({ data: materials });
  console.log(`✅ 從牌價表.xlsx 植入材料: ${created.count} 筆`);

  await prisma.estimateProject.upsert({
    where: { id: "demo-project-001" },
    update: {},
    create: {
      id: "demo-project-001",
      userId: demoUser.id,
      name: "示範專案 - 三房裝潢",
      clientName: "陳先生",
      notes: "系統自動建立的示範專案",
    },
  });
  console.log("✅ 建立示範專案");
  console.log("🎉 種子資料植入完成！");
}

main()
  .catch((e: unknown) => {
    console.error("❌ Seed 失敗:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
