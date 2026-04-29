// src/lib/actions/projects.ts
"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { requireCurrentUserId } from "@/lib/current-user";
import { createProjectSchema, updateProjectSchema } from "@/lib/validations/project";

async function requireUserId(): Promise<string> {
  const session = await auth();
  return requireCurrentUserId(session);
}

// ─── 建立專案 ─────────────────────────────────────────────────────────────────

export async function createProject(
  formData: FormData
): Promise<{ success: false; errors: Record<string, string[]> } | undefined> {
  const userId = await requireUserId();

  const parsed = createProjectSchema.safeParse({
    name: formData.get("name"),
    clientName: formData.get("clientName") || undefined,
    notes: formData.get("notes") || undefined,
  });

  if (!parsed.success) {
    return { success: false, errors: parsed.error.flatten().fieldErrors };
  }

  const project = await prisma.estimateProject.create({
    data: { userId, ...parsed.data },
  });

  revalidatePath("/projects");
  redirect(`/projects/${project.id}`);
}

// ─── 更新專案 ─────────────────────────────────────────────────────────────────

export async function updateProject(projectId: string, formData: FormData) {
  const userId = await requireUserId();

  const project = await prisma.estimateProject.findFirst({
    where: { id: projectId, userId },
  });
  if (!project) return { success: false, errors: { _: ["專案不存在"] } };

  const parsed = updateProjectSchema.safeParse({
    name: formData.get("name"),
    clientName: formData.get("clientName") || undefined,
    notes: formData.get("notes") || undefined,
  });

  if (!parsed.success) {
    return { success: false, errors: parsed.error.flatten().fieldErrors };
  }

  await prisma.estimateProject.update({
    where: { id: projectId },
    data: parsed.data,
  });

  revalidatePath(`/projects/${projectId}`);
  return { success: true };
}

// ─── 刪除專案 ─────────────────────────────────────────────────────────────────

export async function deleteProject(projectId: string): Promise<void> {
  const userId = await requireUserId();

  await prisma.estimateProject.deleteMany({
    where: { id: projectId, userId },
  });

  revalidatePath("/projects");
  redirect("/projects");
}

// ─── 讀取列表 ─────────────────────────────────────────────────────────────────

export async function getProjects() {
  const userId = await requireUserId();

  return prisma.estimateProject.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    include: {
      _count: { select: { items: true } },
    },
  });
}

// ─── 讀取單一專案 ─────────────────────────────────────────────────────────────

export async function getProject(projectId: string) {
  const userId = await requireUserId();

  return prisma.estimateProject.findFirst({
    where: { id: projectId, userId },
    include: {
      items: { orderBy: { sortOrder: "asc" } },
    },
  });
}
