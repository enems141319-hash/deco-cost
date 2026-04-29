// src/app/(dashboard)/dashboard/page.tsx

import { Metadata } from "next";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { requireCurrentUserId } from "@/lib/current-user";
import { formatCurrency } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FolderOpen, Plus, TrendingUp, Package, FileText } from "lucide-react";

export const metadata: Metadata = { title: "總覽" };

export default async function DashboardPage() {
  const session = await auth();
  const userId = await requireCurrentUserId(session);

  const [projects, materialCount] = await Promise.all([
    prisma.estimateProject.findMany({
      where: { userId },
      orderBy: { updatedAt: "desc" },
      take: 5,
      include: {
        _count: { select: { items: true } },
        items: { select: { totalCost: true } },
      },
    }),
    prisma.material.count({ where: { isActive: true } }),
  ]);

  const totalProjects = await prisma.estimateProject.count({ where: { userId } });

  const totalEstimateValue = projects
    .flatMap((p) => p.items)
    .reduce((acc, item) => acc + Number(item.totalCost), 0);

  return (
    <div className="p-6 space-y-6 max-w-5xl">
      <div>
        <h1 className="text-2xl font-bold">總覽</h1>
        <p className="text-muted-foreground text-sm mt-1">
          歡迎回來，{session?.user?.name}
        </p>
      </div>

      {/* 統計卡片 */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <FolderOpen className="h-4 w-4" />
              專案數量
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{totalProjects}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              近期估價總額
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-primary">{formatCurrency(totalEstimateValue)}</p>
            <p className="text-xs text-muted-foreground mt-1">最近 5 個專案</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Package className="h-4 w-4" />
              材料種類
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{materialCount}</p>
            <Link href="/materials" className="text-xs text-primary hover:underline mt-1 block">
              管理材料 →
            </Link>
          </CardContent>
        </Card>
      </div>

      {/* 近期專案 */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-base">近期專案</h2>
          <Button asChild size="sm">
            <Link href="/projects/new">
              <Plus className="h-4 w-4 mr-1" />新增專案
            </Link>
          </Button>
        </div>

        {projects.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="py-10 text-center">
              <FileText className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground">尚未建立任何專案</p>
              <Button asChild className="mt-4" size="sm">
                <Link href="/projects/new">建立第一個專案</Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-2">
            {projects.map((project) => {
              const projectTotal = project.items.reduce(
                (acc, i) => acc + Number(i.totalCost),
                0
              );
              return (
                <Link key={project.id} href={`/projects/${project.id}`}>
                  <Card className="hover:shadow-md transition-shadow cursor-pointer">
                    <CardContent className="py-3 px-4 flex items-center gap-3">
                      <FolderOpen className="h-4 w-4 text-muted-foreground shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{project.name}</p>
                        {project.clientName && (
                          <p className="text-xs text-muted-foreground">{project.clientName}</p>
                        )}
                      </div>
                      <Badge variant="outline" className="text-xs shrink-0">
                        {project._count.items} 項估價
                      </Badge>
                      <span className="font-semibold text-sm text-primary shrink-0">
                        {formatCurrency(projectTotal)}
                      </span>
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
            {totalProjects > 5 && (
              <Link href="/projects" className="text-sm text-primary hover:underline block text-center pt-1">
                查看全部 {totalProjects} 個專案 →
              </Link>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
