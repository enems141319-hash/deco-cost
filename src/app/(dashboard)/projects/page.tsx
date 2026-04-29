// src/app/(dashboard)/projects/page.tsx

import { Metadata } from "next";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { requireCurrentUserId } from "@/lib/current-user";
import { formatCurrency } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FolderOpen, Plus, FileText, Trash2 } from "lucide-react";
import { deleteProject } from "@/lib/actions/projects";

export const metadata: Metadata = { title: "我的專案" };

export default async function ProjectsPage() {
  const session = await auth();
  const userId = await requireCurrentUserId(session);

  const projects = await prisma.estimateProject.findMany({
    where: { userId },
    orderBy: { updatedAt: "desc" },
    include: {
      _count: { select: { items: true } },
      items: { select: { totalCost: true, moduleType: true } },
    },
  });

  return (
    <div className="p-6 space-y-5 max-w-4xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">我的專案</h1>
          <p className="text-muted-foreground text-sm mt-1">{projects.length} 個專案</p>
        </div>
        <Button asChild>
          <Link href="/projects/new">
            <Plus className="h-4 w-4 mr-2" />新增專案
          </Link>
        </Button>
      </div>

      {projects.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="py-16 text-center">
            <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="font-medium text-muted-foreground">尚未建立任何專案</p>
            <Button asChild className="mt-5" size="sm">
              <Link href="/projects/new">建立第一個專案</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {projects.map((project) => {
            const total = project.items.reduce((acc, i) => acc + Number(i.totalCost), 0);
            const moduleTypes = [...new Set(project.items.map((i) => i.moduleType))];

            return (
              <Card key={project.id} className="hover:shadow-md transition-shadow">
                <CardContent className="py-4 px-5 flex items-center gap-4">
                  <FolderOpen className="h-5 w-5 text-muted-foreground shrink-0" />

                  <div className="flex-1 min-w-0">
                    <Link href={`/projects/${project.id}`} className="hover:underline">
                      <p className="font-semibold truncate">{project.name}</p>
                    </Link>
                    {project.clientName && (
                      <p className="text-xs text-muted-foreground">業主：{project.clientName}</p>
                    )}
                    <div className="flex gap-1.5 mt-1.5 flex-wrap">
                      {moduleTypes.map((t) => (
                        <Badge key={t} variant="secondary" className="text-[10px] px-1.5">
                          {t === "CABINET" ? "系統櫃" : t === "CEILING" ? "天花板" : t}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <p className="font-bold text-primary">{formatCurrency(total)}</p>
                    <p className="text-xs text-muted-foreground">{project._count.items} 項估價</p>
                  </div>

                  <div className="flex gap-1">
                    <Button asChild variant="outline" size="sm">
                      <Link href={`/projects/${project.id}`}>開啟</Link>
                    </Button>
                    <form action={deleteProject.bind(null, project.id)}>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" type="submit">
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
    </div>
  );
}
