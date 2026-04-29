// src/app/page.tsx
// 根路由 → 已登入導向 dashboard，未登入導向 login

import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";

export default async function RootPage() {
  const session = await auth();
  if (session?.user?.id) redirect("/dashboard");
  redirect("/login");
}
