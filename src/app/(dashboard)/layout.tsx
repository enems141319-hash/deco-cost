// src/app/(dashboard)/layout.tsx

import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { DashboardShell } from "@/components/layout/DashboardShell";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  return (
    <DashboardShell user={{ name: session.user.name, email: session.user.email }}>
      {children}
    </DashboardShell>
  );
}
