// src/lib/actions/materials.ts
"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { requireCurrentUserId } from "@/lib/current-user";
import { z } from "zod";
import { MaterialCategory, MaterialVendor } from "@prisma/client";
import {
  getEffectiveMaterials,
  isUserMaterialId,
  materialSnapshotData,
  parseUserMaterialId,
} from "@/lib/material-overrides";

async function requireUserId(): Promise<string> {
  const session = await auth();
  return requireCurrentUserId(session);
}

const materialSchema = z.object({
  category: z.nativeEnum(MaterialCategory),
  vendor: z.nativeEnum(MaterialVendor).default(MaterialVendor.WEIHO),
  brand: z.string().max(80).optional(),
  colorCode: z.string().max(50).optional(),
  surfaceTreatment: z.string().max(50).optional(),
  boardType: z.string().max(100).optional(),
  name: z.string().min(1, "名稱不能為空").max(100),
  spec: z.string().max(200).optional(),
  unit: z.string().min(1, "單位不能為空").max(20),
  price: z.coerce.number().positive("價格必須大於 0"),
  minCai: z.coerce.number().min(0).optional().nullable(),
  wasteRate: z.coerce.number().min(0).max(1).default(0),
});

function optionalString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

function optionalNumber(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" && value.trim() ? value : null;
}

export async function getMaterials(category?: MaterialCategory) {
  const userId = await requireUserId();
  return getEffectiveMaterials({
    userId,
    vendor: MaterialVendor.WEIHO,
    category,
  });
}

export async function getMaterialsByCategory() {
  const userId = await requireUserId();
  const materials = await getEffectiveMaterials({
    userId,
    vendor: MaterialVendor.WEIHO,
  });

  const grouped = materials.reduce(
    (acc, m) => {
      if (!acc[m.category]) acc[m.category] = [];
      acc[m.category].push(m);
      return acc;
    },
    {} as Record<string, typeof materials>
  );

  return grouped;
}

export async function createMaterial(formData: FormData) {
  const userId = await requireUserId();

  const parsed = materialSchema.safeParse({
    category: formData.get("category"),
    vendor: formData.get("vendor") || MaterialVendor.WEIHO,
    brand: optionalString(formData, "brand"),
    colorCode: optionalString(formData, "colorCode"),
    surfaceTreatment: optionalString(formData, "surfaceTreatment"),
    boardType: optionalString(formData, "boardType"),
    name: formData.get("name"),
    spec: formData.get("spec") || undefined,
    unit: formData.get("unit"),
    price: formData.get("price"),
    minCai: optionalNumber(formData, "minCai"),
    wasteRate: formData.get("wasteRate") ?? 0,
  });

  if (!parsed.success) {
    return { success: false, errors: parsed.error.flatten().fieldErrors };
  }

  await prisma.userMaterialOverride.create({
    data: {
      ...parsed.data,
      userId,
      materialId: null,
    },
  });
  revalidatePath("/materials");
  return { success: true };
}

export async function updateMaterial(materialId: string, formData: FormData) {
  const userId = await requireUserId();

  const parsed = materialSchema.partial().safeParse({
    category: formData.get("category") || undefined,
    vendor: formData.get("vendor") || undefined,
    brand: optionalString(formData, "brand"),
    colorCode: optionalString(formData, "colorCode"),
    surfaceTreatment: optionalString(formData, "surfaceTreatment"),
    boardType: optionalString(formData, "boardType"),
    name: formData.get("name") || undefined,
    spec: formData.get("spec") || undefined,
    unit: formData.get("unit") || undefined,
    price: formData.get("price") || undefined,
    minCai: optionalNumber(formData, "minCai"),
    wasteRate: formData.get("wasteRate") || undefined,
  });

  if (!parsed.success) {
    return { success: false, errors: parsed.error.flatten().fieldErrors };
  }

  if (isUserMaterialId(materialId)) {
    await prisma.userMaterialOverride.update({
      where: {
        id: parseUserMaterialId(materialId),
        userId,
      },
      data: parsed.data,
    });
    revalidatePath("/materials");
    return { success: true };
  }

  const existingOverride = await prisma.userMaterialOverride.findUnique({
    where: { userId_materialId: { userId, materialId } },
  });

  if (existingOverride) {
    await prisma.userMaterialOverride.update({
      where: { id: existingOverride.id },
      data: parsed.data,
    });
    revalidatePath("/materials");
    return { success: true };
  }

  const baseMaterial = await prisma.material.findUnique({ where: { id: materialId } });
  if (!baseMaterial) {
    return { success: false, errors: { materialId: ["找不到材料"] } };
  }

  await prisma.userMaterialOverride.create({
    data: {
      ...materialSnapshotData(baseMaterial, userId),
      ...parsed.data,
    },
  });
  revalidatePath("/materials");
  return { success: true };
}

export async function toggleMaterialActive(materialId: string, isActive: boolean) {
  const userId = await requireUserId();

  if (isUserMaterialId(materialId)) {
    await prisma.userMaterialOverride.update({
      where: {
        id: parseUserMaterialId(materialId),
        userId,
      },
      data: { isActive },
    });
    revalidatePath("/materials");
    return { success: true };
  }

  const existingOverride = await prisma.userMaterialOverride.findUnique({
    where: { userId_materialId: { userId, materialId } },
  });

  if (existingOverride) {
    await prisma.userMaterialOverride.update({
      where: { id: existingOverride.id },
      data: { isActive },
    });
    revalidatePath("/materials");
    return { success: true };
  }

  const baseMaterial = await prisma.material.findUnique({ where: { id: materialId } });
  if (!baseMaterial) {
    return { success: false };
  }

  await prisma.userMaterialOverride.create({
    data: {
      ...materialSnapshotData(baseMaterial, userId),
      isActive,
    },
  });
  revalidatePath("/materials");
  return { success: true };
}

export async function deleteMaterial(materialId: string) {
  const userId = await requireUserId();

  if (isUserMaterialId(materialId)) {
    await prisma.userMaterialOverride.delete({
      where: {
        id: parseUserMaterialId(materialId),
        userId,
      },
    });
    revalidatePath("/materials");
    return { success: true };
  }

  const existingOverride = await prisma.userMaterialOverride.findUnique({
    where: { userId_materialId: { userId, materialId } },
  });

  if (existingOverride) {
    await prisma.userMaterialOverride.update({
      where: { id: existingOverride.id },
      data: { isActive: false },
    });
    revalidatePath("/materials");
    return { success: true };
  }

  const baseMaterial = await prisma.material.findUnique({ where: { id: materialId } });
  if (!baseMaterial) {
    return { success: false };
  }

  await prisma.userMaterialOverride.create({
    data: {
      ...materialSnapshotData(baseMaterial, userId),
      isActive: false,
    },
  });
  revalidatePath("/materials");
  return { success: true };
}
