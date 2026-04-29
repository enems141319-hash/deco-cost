// src/app/(dashboard)/projects/[id]/page.tsx

import { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { requireCurrentUserId } from "@/lib/current-user";
import { formatCurrency } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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

  return (
    <div className="p-6 space-y-6 max-w-4xl">
      {/* Header */}
      <div>
        <Link
          href="/projects"
          className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1 mb-3"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          返回專案列表
        </Link>
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">{project.name}</h1>
            {project.clientName && (
              <p className="text-muted-foreground text-sm mt-0.5">業主：{project.clientName}</p>
            )}
            {project.notes && (
              <p className="text-muted-foreground text-sm mt-1 max-w-lg">{project.notes}</p>
            )}
          </div>
          <div className="text-right shrink-0">
            <p className="text-xs text-muted-foreground">專案總計</p>
            <p className="text-2xl font-bold text-primary">{formatCurrency(grandTotal)}</p>
          </div>
        </div>
      </div>

      {/* 新增估價按鈕 */}
      <div className="flex gap-3">
        <Button asChild>
          <Link href={`/projects/${id}/cabinet`}>
            <Grid3X3 className="h-4 w-4 mr-2" />
            新增系統櫃估價
          </Link>
        </Button>
        <Button asChild variant="outline">
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
                <CardContent className="py-4 px-5 flex items-center gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant={moduleInfo.color} className="text-xs">
                        {moduleInfo.label}
                      </Badge>
                      <span className="font-medium text-sm">{item.label}</span>
                    </div>
                    {summaryLine && (
                      <p className="text-xs text-muted-foreground">{summaryLine}</p>
                    )}
                    <p className="text-[10px] text-muted-foreground mt-0.5">
                      {new Date(item.updatedAt).toLocaleDateString("zh-TW")}
                    </p>
                  </div>

                  <p className="font-bold text-primary shrink-0">
                    {formatCurrency(Number(item.totalCost))}
                  </p>

                  <div className="flex gap-1 shrink-0">
                    <Button asChild variant="outline" size="sm">
                      <Link
                        href={`/projects/${id}/${item.moduleType === "CABINET" ? "cabinet" : "ceiling"}?itemId=${item.id}`}
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
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">本專案材料統整</CardTitle>
            </CardHeader>
            <CardContent>
              <ProjectCostBreakdown items={project.items} grandTotal={grandTotal} />
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
