// src/app/(auth)/reset-password/page.tsx

import { Metadata } from "next";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ResetPasswordForm } from "./ResetPasswordForm";

export const metadata: Metadata = { title: "重設密碼" };

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const params = await searchParams;
  const token = params.token ?? "";

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/30 px-4">
        <Card className="w-full max-w-sm">
          <CardHeader className="space-y-1 text-center">
            <CardTitle className="text-2xl font-bold">重設連結無效</CardTitle>
            <CardDescription>請重新申請密碼重設連結。</CardDescription>
          </CardHeader>
          <CardContent className="text-center text-sm text-muted-foreground">
            連結缺少必要的驗證資訊，無法更新密碼。
          </CardContent>
          <CardFooter className="justify-center text-sm">
            <Link href="/forgot-password" className="text-primary hover:underline">
              重新申請
            </Link>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 px-4">
      <ResetPasswordForm token={token} />
    </div>
  );
}
