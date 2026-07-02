import type { Material, MaterialCategory, MaterialVendor, Prisma, UserMaterialOverride } from "@prisma/client";
import { prisma } from "@/lib/db";

export const USER_MATERIAL_ID_PREFIX = "user:";

export type MaterialSource = "SYSTEM" | "OVERRIDE" | "CUSTOM";

export type EffectiveMaterial = {
  id: string;
  source: MaterialSource;
  overrideId: string | null;
  baseMaterialId: string | null;
  category: MaterialCategory;
  vendor: MaterialVendor;
  brand: string | null;
  colorCode: string | null;
  surfaceTreatment: string | null;
  boardType: string | null;
  name: string;
  spec: string | null;
  unit: string;
  price: number;
  minCai: number | null;
  wasteRate: number;
  isActive: boolean;
  sortOrder: number;
  vendorCode: string | null;
  catalogVersion: string | null;
  notes: string | null;
  pricingMeta: Prisma.JsonValue | null;
};

type MaterialData = Material | UserMaterialOverride;

function materialIdForOverride(override: UserMaterialOverride): string {
  return override.materialId ?? `${USER_MATERIAL_ID_PREFIX}${override.id}`;
}

function toEffectiveMaterial(
  row: MaterialData,
  source: MaterialSource,
  overrideId: string | null,
  baseMaterialId: string | null,
  id = row.id,
): EffectiveMaterial {
  return {
    id,
    source,
    overrideId,
    baseMaterialId,
    category: row.category,
    vendor: row.vendor,
    brand: row.brand,
    colorCode: row.colorCode,
    surfaceTreatment: row.surfaceTreatment,
    boardType: row.boardType,
    name: row.name,
    spec: row.spec,
    unit: row.unit,
    price: Number(row.price),
    minCai: row.minCai !== null ? Number(row.minCai) : null,
    wasteRate: Number(row.wasteRate),
    isActive: row.isActive,
    sortOrder: row.sortOrder,
    vendorCode: row.vendorCode,
    catalogVersion: row.catalogVersion,
    notes: row.notes,
    pricingMeta: row.pricingMeta,
  };
}

export function isUserMaterialId(materialId: string): boolean {
  return materialId.startsWith(USER_MATERIAL_ID_PREFIX);
}

export function parseUserMaterialId(materialId: string): string {
  return isUserMaterialId(materialId) ? materialId.slice(USER_MATERIAL_ID_PREFIX.length) : materialId;
}

export function materialSnapshotData(
  material: Material,
  userId: string,
): Prisma.UserMaterialOverrideUncheckedCreateInput {
  return {
    userId,
    materialId: material.id,
    category: material.category,
    vendor: material.vendor,
    brand: material.brand,
    colorCode: material.colorCode,
    surfaceTreatment: material.surfaceTreatment,
    boardType: material.boardType,
    name: material.name,
    spec: material.spec,
    unit: material.unit,
    price: material.price,
    minCai: material.minCai,
    wasteRate: material.wasteRate,
    isActive: material.isActive,
    sortOrder: material.sortOrder,
    vendorCode: material.vendorCode,
    catalogVersion: material.catalogVersion,
    notes: material.notes,
    pricingMeta: material.pricingMeta ?? undefined,
  };
}

export async function getEffectiveMaterials(params: {
  userId: string;
  vendor: MaterialVendor;
  category?: MaterialCategory;
  includeInactive?: boolean;
}): Promise<EffectiveMaterial[]> {
  const { userId, vendor, category, includeInactive = false } = params;
  const [materials, overrides] = await Promise.all([
    prisma.material.findMany({
      where: {
        vendor,
        ...(includeInactive ? {} : { isActive: true }),
        ...(category ? { category } : {}),
      },
      orderBy: [{ category: "asc" }, { brand: "asc" }, { sortOrder: "asc" }, { name: "asc" }],
    }),
    prisma.userMaterialOverride.findMany({
      where: {
        userId,
        vendor,
        ...(includeInactive ? {} : { isActive: true }),
        ...(category ? { category } : {}),
      },
      orderBy: [{ category: "asc" }, { brand: "asc" }, { sortOrder: "asc" }, { name: "asc" }],
    }),
  ]);

  const overridesByBaseId = new Map(
    overrides
      .filter((override) => override.materialId !== null)
      .map((override) => [override.materialId as string, override]),
  );
  const effective: EffectiveMaterial[] = [];

  for (const material of materials) {
    const override = overridesByBaseId.get(material.id);
    effective.push(
      override
        ? toEffectiveMaterial(override, "OVERRIDE", override.id, material.id, material.id)
        : toEffectiveMaterial(material, "SYSTEM", null, material.id),
    );
  }

  for (const override of overrides) {
    if (override.materialId !== null) continue;
    effective.push(toEffectiveMaterial(override, "CUSTOM", override.id, null, materialIdForOverride(override)));
  }

  return effective.sort((a, b) => (
    a.category.localeCompare(b.category) ||
    (a.brand ?? "").localeCompare(b.brand ?? "") ||
    a.sortOrder - b.sortOrder ||
    a.name.localeCompare(b.name)
  ));
}
