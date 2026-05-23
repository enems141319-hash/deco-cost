// src/app/(dashboard)/layout.tsx

import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { DashboardShell } from "@/components/layout/DashboardShell";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const projects = await prisma.estimateProject.findMany({
    where: { userId: session.user.id },
    orderBy: { updatedAt: "desc" },
    select: {
      id: true,
      name: true,
      updatedAt: true,
      _count: { select: { items: true } },
    },
  });

  return (
    <DashboardShell
      user={{ name: session.user.name, email: session.user.email }}
      projects={projects.map((project) => ({
        id: project.id,
        name: project.name,
        updatedAt: project.updatedAt.toISOString(),
        itemCount: project._count.items,
      }))}
    >
      {children}
    </DashboardShell>
  );
}
