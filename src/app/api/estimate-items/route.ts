// src/app/api/estimate-items/route.ts

import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { cabinetProjectInputSchema } from "@/lib/validations/cabinet";
import { ceilingProjectInputSchema } from "@/lib/validations/ceiling";
import { calculateCabinetProject } from "@/lib/calculations/cabinet";
import { calculateCeilingMaterial } from "@/lib/calculations/ceiling";
import type { CabinetUnitInput } from "@/types";

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const moduleType: string = body.moduleType ?? "";

  // 驗證專案所有權
  const projectId: string = body.projectId ?? "";
  const project = await prisma.estimateProject.findFirst({
    where: { id: projectId, userId: session.user.id },
  });
  if (!project) return NextResponse.json({ error: "Project not found" }, { status: 404 });

  const lastItem = await prisma.estimateItem.findFirst({
    where: { projectId },
    orderBy: { sortOrder: "desc" },
    select: { sortOrder: true },
  });
  const sortOrder = (lastItem?.sortOrder ?? 0) + 1;

  if (moduleType === "CABINET") {
    const parsed = cabinetProjectInputSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

    const result = calculateCabinetProject(parsed.data.units as CabinetUnitInput[]);
    const item = await prisma.estimateItem.create({
      data: {
        projectId,
        moduleType: "CABINET",
        label: parsed.data.label ?? "系統櫃",
        sortOrder,
        inputData: parsed.data.units as object[],
        resultData: result as unknown as object,
        totalCost: result.projectTotal,
      },
    });
    return NextResponse.json(item, { status: 201 });
  }

  if (moduleType === "CEILING") {
    const parsed = ceilingProjectInputSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

    const result = calculateCeilingMaterial(parsed.data.input);
    const item = await prisma.estimateItem.create({
      data: {
        projectId,
        moduleType: "CEILING",
        label: parsed.data.label ?? "天花板",
        sortOrder,
        inputData: parsed.data.input as unknown as object,
        resultData: result as unknown as object,
        totalCost: result.totalCost,
      },
    });
    return NextResponse.json(item, { status: 201 });
  }

  return NextResponse.json({ error: "Unknown moduleType" }, { status: 400 });
}

export async function DELETE(request: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const itemId = searchParams.get("id");
  if (!itemId) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  const item = await prisma.estimateItem.findFirst({
    where: { id: itemId },
    include: { project: { select: { userId: true } } },
  });

  if (!item || item.project.userId !== session.user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await prisma.estimateItem.delete({ where: { id: itemId } });
  return NextResponse.json({ success: true });
}
