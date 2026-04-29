// src/app/(auth)/login/page.tsx

import { Metadata } from "next";
import { LoginForm } from "./LoginForm";

export const metadata: Metadata = { title: "登入" };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ registered?: string; error?: string }>;
}) {
  const params = await searchParams;
  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 px-4">
      <LoginForm registered={!!params.registered} error={params.error} />
    </div>
  );
}
