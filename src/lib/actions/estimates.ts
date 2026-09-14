// src/lib/actions/estimates.ts
"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { requireCurrentUserId } from "@/lib/current-user";
import { estimateLabelOrDefault } from "@/lib/estimate-label";
import {
  ESTIMATE_VERSION_CONFLICT_CODE,
  ESTIMATE_VERSION_CONFLICT_MESSAGE,
} from "@/lib/estimate-conflicts";
import { cabinetProjectInputSchema } from "@/lib/validations/cabinet";
import { ceilingProjectInputSchema } from "@/lib/validations/ceiling";
import { calculateCabinetProject } from "@/lib/calculations/cabinet";
import { calculateCeilingMaterial } from "@/lib/calculations/ceiling";
import type { CabinetUnitInput } from "@/types";
import { MaterialVendor } from "@prisma/client";

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

async function getOwnedProjectVersion(projectId: string, userId: string): Promise<number | null> {
  const project = await prisma.estimateProject.findFirst({
    where: { id: projectId, userId },
    select: { version: true },
  });
  return project?.version ?? null;
}

async function verifyProjectVersion(projectId: string, userId: string, clientProjectVersion: number | undefined) {
  const projectVersion = await getOwnedProjectVersion(projectId, userId);
  if (projectVersion === null) return { owned: false as const, stale: false as const };
  return {
    owned: true as const,
    stale: clientProjectVersion === undefined || projectVersion !== clientProjectVersion,
  };
}

function estimateVersionConflictResult() {
  return {
    success: false as const,
    code: ESTIMATE_VERSION_CONFLICT_CODE,
    message: ESTIMATE_VERSION_CONFLICT_MESSAGE,
    errors: { _: [ESTIMATE_VERSION_CONFLICT_MESSAGE] },
  };
}

// ─── 儲存系統櫃估價 ───────────────────────────────────────────────────────────

export async function saveCabinetEstimate(rawData: unknown) {
  const userId = await requireUserId();

  const parsed = cabinetProjectInputSchema.safeParse(rawData);
  if (!parsed.success) {
    console.error("[saveCabinetEstimate] 驗證失敗:", JSON.stringify(parsed.error.flatten(), null, 2));
    return { success: false, errors: parsed.error.flatten() };
  }

  const { projectId, label, units, vendor, clientProjectVersion } = parsed.data;
  const projectVersion = await verifyProjectVersion(projectId, userId, clientProjectVersion);
  if (!projectVersion.owned) {
    console.error("[saveCabinetEstimate] 專案所有權驗證失敗 projectId:", projectId, "userId:", userId);
    return { success: false, errors: { _: ["無此專案"] } };
  }
  if (clientProjectVersion === undefined || projectVersion.stale) return estimateVersionConflictResult();

  const result = calculateCabinetProject(units as CabinetUnitInput[]);
  const totalCost = result.projectTotal;

  // 取得目前最大 sortOrder
  const lastItem = await prisma.estimateItem.findFirst({
    where: { projectId },
    orderBy: { sortOrder: "desc" },
    select: { sortOrder: true },
  });
  const sortOrder = (lastItem?.sortOrder ?? 0) + 1;

  const item = await prisma.$transaction(async (tx) => {
    const projectUpdate = await tx.estimateProject.updateMany({
      where: { id: projectId, userId, version: clientProjectVersion },
      data: { version: { increment: 1 }, updatedBy: userId },
    });
    if (projectUpdate.count === 0) return null;

    return tx.estimateItem.create({
      data: {
        projectId,
        moduleType: "CABINET",
        vendor: vendor === "ZHENGDAO" ? MaterialVendor.ZHENGDAO : MaterialVendor.WEIHO,
        label: estimateLabelOrDefault(label, "系統櫃"),
        sortOrder,
        inputData: units as object[],
        resultData: result as unknown as object,
        totalCost,
        updatedBy: userId,
      },
    });
  });
  if (!item) return estimateVersionConflictResult();

  revalidatePath(`/projects/${projectId}`);
  return { success: true, itemId: item.id, version: item.version, projectVersion: clientProjectVersion + 1 };
}

// ─── 更新系統櫃估價 ───────────────────────────────────────────────────────────

export async function updateCabinetEstimate(itemId: string, rawData: unknown) {
  const userId = await requireUserId();

  const parsed = cabinetProjectInputSchema.safeParse(rawData);
  if (!parsed.success) {
    return { success: false, errors: parsed.error.flatten() };
  }

  const { projectId, label, units, vendor, clientVersion, clientProjectVersion } = parsed.data;
  const projectVersion = await verifyProjectVersion(projectId, userId, clientProjectVersion);
  if (!projectVersion.owned) return { success: false, errors: { _: ["無此專案"] } };
  if (clientProjectVersion === undefined || projectVersion.stale) return estimateVersionConflictResult();
  if (clientVersion === undefined) return estimateVersionConflictResult();

  const materialVendor = vendor === "ZHENGDAO" ? MaterialVendor.ZHENGDAO : MaterialVendor.WEIHO;
  const item = await prisma.estimateItem.findFirst({
    where: {
      id: itemId,
      projectId,
      moduleType: "CABINET",
      vendor: materialVendor,
    },
    select: { id: true, version: true },
  });
  if (!item) return { success: false, errors: { _: ["無此估價項目"] } };
  if (item.version !== clientVersion) return estimateVersionConflictResult();

  const result = calculateCabinetProject(units as CabinetUnitInput[]);

  const updateResult = await prisma.$transaction(async (tx) => {
    const projectUpdate = await tx.estimateProject.updateMany({
      where: { id: projectId, userId, version: clientProjectVersion },
      data: { version: { increment: 1 }, updatedBy: userId },
    });
    if (projectUpdate.count === 0) return { itemCount: 0, projectCount: 0 };

    const itemUpdate = await tx.estimateItem.updateMany({
      where: {
        id: itemId,
        projectId,
        moduleType: "CABINET",
        vendor: materialVendor,
        version: clientVersion,
      },
      data: {
        vendor: materialVendor,
        label: estimateLabelOrDefault(label, "系統櫃"),
        inputData: units as object[],
        resultData: result as unknown as object,
        totalCost: result.projectTotal,
        version: { increment: 1 },
        updatedBy: userId,
      },
    });

    return { itemCount: itemUpdate.count, projectCount: projectUpdate.count };
  });
  if (updateResult.itemCount === 0 || updateResult.projectCount === 0) return estimateVersionConflictResult();

  revalidatePath(`/projects/${projectId}`);
  return { success: true, version: clientVersion + 1, projectVersion: clientProjectVersion + 1 };
}

// ─── 儲存天花板估價 ───────────────────────────────────────────────────────────

export async function saveCeilingEstimate(rawData: unknown) {
  const userId = await requireUserId();

  const parsed = ceilingProjectInputSchema.safeParse(rawData);
  if (!parsed.success) {
    return { success: false, errors: parsed.error.flatten() };
  }

  const { projectId, label, input, clientProjectVersion } = parsed.data;
  const projectVersion = await verifyProjectVersion(projectId, userId, clientProjectVersion);
  if (!projectVersion.owned) return { success: false, errors: { _: ["無此專案"] } };
  if (clientProjectVersion === undefined || projectVersion.stale) return estimateVersionConflictResult();

  const result = calculateCeilingMaterial(input);

  const lastItem = await prisma.estimateItem.findFirst({
    where: { projectId },
    orderBy: { sortOrder: "desc" },
    select: { sortOrder: true },
  });
  const sortOrder = (lastItem?.sortOrder ?? 0) + 1;

  const item = await prisma.$transaction(async (tx) => {
    const projectUpdate = await tx.estimateProject.updateMany({
      where: { id: projectId, userId, version: clientProjectVersion },
      data: { version: { increment: 1 }, updatedBy: userId },
    });
    if (projectUpdate.count === 0) return null;

    return tx.estimateItem.create({
      data: {
        projectId,
        moduleType: "CEILING",
        label: estimateLabelOrDefault(label, "天花板"),
        sortOrder,
        inputData: input as unknown as object,
        resultData: result as unknown as object,
        totalCost: result.totalCost,
        updatedBy: userId,
      },
    });
  });
  if (!item) return estimateVersionConflictResult();

  revalidatePath(`/projects/${projectId}`);
  return { success: true, itemId: item.id, projectVersion: clientProjectVersion + 1 };
}

// ─── 刪除估價項目 ─────────────────────────────────────────────────────────────

export async function deleteEstimateItem(itemId: string, projectId: string): Promise<void> {
  const userId = await requireUserId();
  const owned = await verifyProjectOwnership(projectId, userId);
  if (!owned) return;

  await prisma.estimateItem.deleteMany({ where: { id: itemId, projectId } });
  revalidatePath(`/projects/${projectId}`);
}
