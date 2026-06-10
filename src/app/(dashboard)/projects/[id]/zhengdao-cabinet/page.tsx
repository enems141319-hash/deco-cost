import { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { MaterialVendor } from "@prisma/client";
import { ArrowLeft } from "lucide-react";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { requireCurrentUserId } from "@/lib/current-user";
import { CabinetUnitList } from "@/components/cabinet/CabinetUnitList";
import type { CabinetUnitInput } from "@/types";

export const metadata: Metadata = { title: "正道系統櫃估價" };

export default async function ZhengdaoCabinetEstimatePage({
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

  const project = await prisma.estimateProject.findFirst({
    where: { id: projectId, userId },
    select: {
      id: true,
      name: true,
      address: true,
      clientName: true,
      clientTitle: true,
      clientPhone: true,
      clientLineId: true,
      designerName: true,
      designerPhone: true,
    },
  });
  if (!project) notFound();

  let initialUnits: CabinetUnitInput[] | undefined;
  let initialLabel: string | null = null;
  let estimateItemId: string | undefined;
  if (itemId) {
    const item = await prisma.estimateItem.findFirst({
      where: {
        id: itemId,
        projectId,
        moduleType: "CABINET",
        vendor: MaterialVendor.ZHENGDAO,
      },
    });
    if (!item) notFound();
    initialUnits = item.inputData as unknown as CabinetUnitInput[];
    initialLabel = item.label;
    estimateItemId = item.id;
  }

  return (
    <div className="space-y-5 px-4 py-5 sm:p-6">
      <div>
        <Link
          href={`/projects/${projectId}`}
          className="mb-2 flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          返回 {project.name}
        </Link>
        <h1 className="text-lg font-bold sm:text-xl">正道系統櫃估價</h1>
        <p className="mt-0.5 text-sm text-muted-foreground">
          操作方式與原系統櫃相同，材料、五金及價格僅使用正道資料庫。
        </p>
      </div>

      <CabinetUnitList
        projectId={projectId}
        itemId={estimateItemId}
        initialLabel={initialLabel}
        initialUnits={initialUnits}
        projectInfo={project}
        vendor="ZHENGDAO"
      />
    </div>
  );
}
