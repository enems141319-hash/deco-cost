// src/app/(dashboard)/projects/[id]/ceiling/page.tsx

import { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { requireCurrentUserId } from "@/lib/current-user";
import { ArrowLeft } from "lucide-react";
import { CeilingForm } from "@/components/ceiling/CeilingForm";

export const metadata: Metadata = { title: "天花板估價" };

export default async function CeilingEstimatePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: projectId } = await params;
  const session = await auth();
  const userId = await requireCurrentUserId(session);

  const project = await prisma.estimateProject.findFirst({
    where: { id: projectId, userId },
    select: { id: true, name: true },
  });
  if (!project) notFound();

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
        <h1 className="text-xl font-bold">天花板估價</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          輸入坪數與周長 → 自動計算角材與板材用量
        </p>
      </div>

      <CeilingForm projectId={projectId} />
    </div>
  );
}
