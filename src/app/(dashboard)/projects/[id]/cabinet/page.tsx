// src/app/(dashboard)/projects/[id]/cabinet/page.tsx

import { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { requireCurrentUserId } from "@/lib/current-user";
import { ArrowLeft } from "lucide-react";
import { CabinetUnitList } from "@/components/cabinet/CabinetUnitList";
import type { CabinetUnitInput } from "@/types";

export const metadata: Metadata = { title: "系統櫃估價" };

export default async function CabinetEstimatePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ itemId?: string }>;
}) {
  const { id: projectId } = await params;
  const { itemId } = await searchParams;
  const session = await auth();
  const userId = await requireCurrentUserId(session);

  // 驗證專案所有權
  const project = await prisma.estimateProject.findFirst({
    where: { id: projectId, userId },
    select: { id: true, name: true },
  });
  if (!project) notFound();

  // 若帶了 itemId，載入既有估價
  let initialUnits: CabinetUnitInput[] | undefined;
  let initialLabel: string | null = null;
  let estimateItemId: string | undefined;
  if (itemId) {
    const item = await prisma.estimateItem.findFirst({
      where: { id: itemId, projectId, moduleType: "CABINET" },
    });
    if (!item) notFound();
    if (item) {
      initialUnits = item.inputData as unknown as CabinetUnitInput[];
      initialLabel = item.label;
      estimateItemId = item.id;
    }
  }

  return (
    <div className="p-6 space-y-5">
      <div>
        <Link
          href={`/projects/${projectId}`}
          className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1 mb-2"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          返回 {project.name}
        </Link>
        <h1 className="text-xl font-bold">系統櫃估價</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          新增桶身 → 設定尺寸與板材 → 即時查看成本
        </p>
      </div>

      <CabinetUnitList
        projectId={projectId}
        itemId={estimateItemId}
        initialLabel={initialLabel}
        initialUnits={initialUnits}
      />
    </div>
  );
}
