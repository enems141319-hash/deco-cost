// src/lib/actions/materials.ts
"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { requireCurrentUserId } from "@/lib/current-user";
import { z } from "zod";
import { MaterialCategory } from "@prisma/client";

async function requireUserId(): Promise<string> {
  const session = await auth();
  return requireCurrentUserId(session);
}

const materialSchema = z.object({
  category: z.nativeEnum(MaterialCategory),
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
  await requireUserId();
  return prisma.material.findMany({
    where: { isActive: true, ...(category ? { category } : {}) },
    orderBy: [{ category: "asc" }, { sortOrder: "asc" }, { name: "asc" }],
  });
}

export async function getMaterialsByCategory() {
  await requireUserId();
  const materials = await prisma.material.findMany({
    where: { isActive: true },
    orderBy: [{ category: "asc" }, { sortOrder: "asc" }],
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
  await requireUserId();

  const parsed = materialSchema.safeParse({
    category: formData.get("category"),
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

  await prisma.material.create({ data: parsed.data });
  revalidatePath("/materials");
  return { success: true };
}

export async function updateMaterial(materialId: string, formData: FormData) {
  await requireUserId();

  const parsed = materialSchema.partial().safeParse({
    category: formData.get("category") || undefined,
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

  await prisma.material.update({ where: { id: materialId }, data: parsed.data });
  revalidatePath("/materials");
  return { success: true };
}

export async function toggleMaterialActive(materialId: string, isActive: boolean) {
  await requireUserId();
  await prisma.material.update({ where: { id: materialId }, data: { isActive } });
  revalidatePath("/materials");
  return { success: true };
}

export async function deleteMaterial(materialId: string) {
  await requireUserId();
  await prisma.material.delete({ where: { id: materialId } });
  revalidatePath("/materials");
  return { success: true };
}
