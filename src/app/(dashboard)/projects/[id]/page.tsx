// src/app/(dashboard)/projects/[id]/page.tsx

import { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { requireCurrentUserId } from "@/lib/current-user";
import { displayEstimateLabel } from "@/lib/estimate-label";
import { formatCurrency } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, Plus, Layers, Grid3X3, Trash2 } from "lucide-react";
import { deleteEstimateItem } from "@/lib/actions/estimates";
import { ProjectCostBreakdown } from "@/components/projects/ProjectCostBreakdown";
import type { CabinetProjectResult } from "@/types";
import type { CeilingResult } from "@/types";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const project = await prisma.estimateProject.findFirst({
    where: { id },
    select: { name: true },
  });
  return { title: project?.name ?? "專案詳情" };
}

const MODULE_LABELS: Record<string, { label: string; color: "default" | "secondary" }> = {
  CABINET: { label: "系統櫃", color: "default" },
  CEILING: { label: "天花板", color: "secondary" },
};

function modulePath(moduleType: string): string {
  if (moduleType === "CABINET") return "cabinet";
  if (moduleType === "CEILING") return "ceiling";
  return "cabinet";
}

export default async function ProjectDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await auth();
  const userId = await requireCurrentUserId(session);

  const project = await prisma.estimateProject.findFirst({
    where: { id, userId },
    include: { items: { orderBy: { sortOrder: "asc" } } },
  });

  if (!project) notFound();

  const grandTotal = project.items.reduce((acc, i) => acc + Number(i.totalCost), 0);
  const materialBreakdownItems = project.items.map((item) => ({
    id: item.id,
    label: item.label,
    moduleType: item.moduleType,
    inputData: item.inputData,
    resultData: item.resultData,
    totalCost: Number(item.totalCost),
  }));
  const projectPrintInfo = {
    name: project.name,
    address: project.address,
    clientName: project.clientName,
    clientTitle: project.clientTitle,
    clientPhone: project.clientPhone,
    clientLineId: project.clientLineId,
    designerName: project.designerName,
    designerPhone: project.designerPhone,
  };
  const clientLabel = [project.clientName, project.clientTitle].filter(Boolean).join("");
  const contactRows = [
    project.address ? `專案地址：${project.address}` : null,
    clientLabel ? `業主：${clientLabel}` : null,
    project.clientPhone ? `業主電話：${project.clientPhone}` : null,
    project.clientLineId ? `Line ID：${project.clientLineId}` : null,
    project.designerName ? `設計師：${project.designerName}` : null,
    project.designerPhone ? `設計師電話：${project.designerPhone}` : null,
  ].filter((row): row is string => Boolean(row));

  return (
    <div className="max-w-4xl space-y-5 px-4 py-5 sm:space-y-6 sm:p-6">
      {/* Header */}
      <div>
        <Link
          href="/projects"
          className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1 mb-3"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          返回專案列表
        </Link>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <h1 className="break-words text-xl font-bold sm:text-2xl">{project.name}</h1>
            {contactRows.length > 0 && (
              <div className="mt-2 grid gap-x-5 gap-y-1 text-sm text-muted-foreground sm:grid-cols-2">
                {contactRows.map((row) => (
                  <p key={row}>{row}</p>
                ))}
              </div>
            )}
            {project.notes && (
              <p className="text-muted-foreground text-sm mt-1 max-w-lg">{project.notes}</p>
            )}
          </div>
          <div className="shrink-0 sm:text-right">
            <p className="text-xs text-muted-foreground">專案總計</p>
            <p className="text-xl font-bold text-primary sm:text-2xl">{formatCurrency(grandTotal)}</p>
          </div>
        </div>
      </div>

      {/* 新增估價按鈕 */}
      <div className="flex flex-col gap-3 sm:flex-row">
        <Button asChild className="w-full sm:w-auto">
          <Link href={`/projects/${id}/cabinet`}>
            <Grid3X3 className="h-4 w-4 mr-2" />
            新增系統櫃估價
          </Link>
        </Button>
        <Button asChild variant="outline" className="w-full sm:w-auto">
          <Link href={`/projects/${id}/ceiling`}>
            <Layers className="h-4 w-4 mr-2" />
            新增天花板估價
          </Link>
        </Button>
      </div>

      <Separator />

      {/* 估價項目列表 */}
      {project.items.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <Plus className="h-10 w-10 mx-auto mb-3 opacity-30" />
          <p>尚未新增任何估價項目</p>
          <p className="text-sm mt-1">點擊上方按鈕開始估價</p>
        </div>
      ) : (
        <div className="space-y-3">
          {project.items.map((item) => {
            const moduleInfo = MODULE_LABELS[item.moduleType] ?? { label: item.moduleType, color: "secondary" as const };

            // 從 resultData 取得摘要資訊
            let summaryLine = "";
            if (item.moduleType === "CABINET") {
              const result = item.resultData as unknown as CabinetProjectResult;
              summaryLine = `${result.unitResults?.length ?? 0} 個桶身`;
            } else if (item.moduleType === "CEILING") {
              const result = item.resultData as unknown as CeilingResult;
              summaryLine = `${result.areaPing} 坪`;
            }

            return (
              <Card key={item.id}>
                <CardContent className="flex flex-col items-start gap-3 px-4 py-4 sm:flex-row sm:items-center sm:gap-4 sm:px-5">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant={moduleInfo.color} className="text-xs">
                        {moduleInfo.label}
                      </Badge>
                      <span className="font-medium text-sm">
                        {displayEstimateLabel(item.label, moduleInfo.label)}
                      </span>
                    </div>
                    {summaryLine && (
                      <p className="text-xs text-muted-foreground">{summaryLine}</p>
                    )}
                    <p className="text-[10px] text-muted-foreground mt-0.5">
                      {new Date(item.updatedAt).toLocaleDateString("zh-TW")}
                    </p>
                  </div>

                  <p className="shrink-0 font-bold text-primary sm:text-right">
                    {formatCurrency(Number(item.totalCost))}
                  </p>

                  <div className="flex w-full shrink-0 gap-1 sm:w-auto">
                    <Button asChild variant="outline" size="sm" className="flex-1 sm:flex-none">
                      <Link
                        href={`/projects/${id}/${modulePath(item.moduleType)}?itemId=${item.id}`}
                      >
                        編輯
                      </Link>
                    </Button>
                    <form action={deleteEstimateItem.bind(null, item.id, id)}>
                      <Button
                        variant="ghost" size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-destructive"
                        type="submit"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </form>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* 費用分解 */}
      {project.items.length > 0 && (
        <>
          <Separator />
          <ProjectCostBreakdown items={materialBreakdownItems} grandTotal={grandTotal} projectInfo={projectPrintInfo} />
        </>
      )}
    </div>
  );
}
