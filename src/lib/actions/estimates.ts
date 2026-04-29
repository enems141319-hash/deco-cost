// src/lib/actions/estimates.ts
"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { requireCurrentUserId } from "@/lib/current-user";
import { cabinetProjectInputSchema } from "@/lib/validations/cabinet";
import { ceilingProjectInputSchema } from "@/lib/validations/ceiling";
import { calculateCabinetProject } from "@/lib/calculations/cabinet";
import { calculateCeilingMaterial } from "@/lib/calculations/ceiling";
import type { CabinetUnitInput } from "@/types";

async function requireUserId(): Promise<string> {
  const session = await auth();
  return requireCurrentUserId(session);
}

async function verifyProjectOwnership(projectId: string, userId: string): Promise<boolean> {
  const project = await prisma.estimateProject.findFirst({
    where: { id: projectId, userId },
    select: { id: true },
  });
  return !!project;
}

// ─── 儲存系統櫃估價 ───────────────────────────────────────────────────────────

export async function saveCabinetEstimate(rawData: unknown) {
  const userId = await requireUserId();

  const parsed = cabinetProjectInputSchema.safeParse(rawData);
  if (!parsed.success) {
    console.error("[saveCabinetEstimate] 驗證失敗:", JSON.stringify(parsed.error.flatten(), null, 2));
    return { success: false, errors: parsed.error.flatten() };
  }

  const { projectId, label, units } = parsed.data;
  const owned = await verifyProjectOwnership(projectId, userId);
  if (!owned) {
    console.error("[saveCabinetEstimate] 專案所有權驗證失敗 projectId:", projectId, "userId:", userId);
    return { success: false, errors: { _: ["無此專案"] } };
  }

  const result = calculateCabinetProject(units as CabinetUnitInput[]);
  const totalCost = result.projectTotal;

  // 取得目前最大 sortOrder
  const lastItem = await prisma.estimateItem.findFirst({
    where: { projectId },
    orderBy: { sortOrder: "desc" },
    select: { sortOrder: true },
  });
  const sortOrder = (lastItem?.sortOrder ?? 0) + 1;

  const item = await prisma.estimateItem.create({
    data: {
      projectId,
      moduleType: "CABINET",
      label: label ?? "系統櫃",
      sortOrder,
      inputData: units as object[],
      resultData: result as unknown as object,
      totalCost,
    },
  });

  revalidatePath(`/projects/${projectId}`);
  return { success: true, itemId: item.id };
}

// ─── 更新系統櫃估價 ───────────────────────────────────────────────────────────

export async function updateCabinetEstimate(itemId: string, rawData: unknown) {
  const userId = await requireUserId();

  const parsed = cabinetProjectInputSchema.safeParse(rawData);
  if (!parsed.success) {
    return { success: false, errors: parsed.error.flatten() };
  }

  const { projectId, label, units } = parsed.data;
  const owned = await verifyProjectOwnership(projectId, userId);
  if (!owned) return { success: false, errors: { _: ["無此專案"] } };

  const result = calculateCabinetProject(units as CabinetUnitInput[]);

  await prisma.estimateItem.update({
    where: { id: itemId },
    data: {
      label: label ?? "系統櫃",
      inputData: units as object[],
      resultData: result as unknown as object,
      totalCost: result.projectTotal,
    },
  });

  revalidatePath(`/projects/${projectId}`);
  return { success: true };
}

// ─── 儲存天花板估價 ───────────────────────────────────────────────────────────

export async function saveCeilingEstimate(rawData: unknown) {
  const userId = await requireUserId();

  const parsed = ceilingProjectInputSchema.safeParse(rawData);
  if (!parsed.success) {
    return { success: false, errors: parsed.error.flatten() };
  }

  const { projectId, label, input } = parsed.data;
  const owned = await verifyProjectOwnership(projectId, userId);
  if (!owned) return { success: false, errors: { _: ["無此專案"] } };

  const result = calculateCeilingMaterial(input);

  const lastItem = await prisma.estimateItem.findFirst({
    where: { projectId },
    orderBy: { sortOrder: "desc" },
    select: { sortOrder: true },
  });
  const sortOrder = (lastItem?.sortOrder ?? 0) + 1;

  const item = await prisma.estimateItem.create({
    data: {
      projectId,
      moduleType: "CEILING",
      label: label ?? "天花板",
      sortOrder,
      inputData: input as unknown as object,
      resultData: result as unknown as object,
      totalCost: result.totalCost,
    },
  });

  revalidatePath(`/projects/${projectId}`);
  return { success: true, itemId: item.id };
}

// ─── 刪除估價項目 ─────────────────────────────────────────────────────────────

export async function deleteEstimateItem(itemId: string, projectId: string): Promise<void> {
  const userId = await requireUserId();
  const owned = await verifyProjectOwnership(projectId, userId);
  if (!owned) return;

  await prisma.estimateItem.delete({ where: { id: itemId } });
  revalidatePath(`/projects/${projectId}`);
}
