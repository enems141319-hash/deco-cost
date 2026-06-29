// src/app/(auth)/login/LoginForm.tsx
"use client";

import Link from "next/link";
import { loginUser } from "@/lib/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface Props {
  registered?: boolean;
  reset?: boolean;
  error?: string;
}

export function LoginForm({ registered, reset, error }: Props) {
  return (
    <Card className="w-full max-w-sm">
      <CardHeader className="space-y-1 text-center">
        <CardTitle className="text-2xl font-bold">DecoCost</CardTitle>
        <CardDescription>裝修材料估價系統</CardDescription>
      </CardHeader>
      <CardContent>
        {registered && (
          <div className="mb-4 rounded border border-green-200 bg-green-50 p-2 text-sm text-green-700">
            註冊成功，請登入。
          </div>
        )}
        {reset && (
          <div className="mb-4 rounded border border-green-200 bg-green-50 p-2 text-sm text-green-700">
            密碼已更新，請使用新密碼登入。
          </div>
        )}
        {error && (
          <div className="mb-4 rounded bg-destructive/10 p-2 text-sm text-destructive">
            登入失敗，請確認 Email 與密碼。
          </div>
        )}
        <form action={loginUser} className="space-y-4">
          <div className="space-y-1">
            <Label htmlFor="email">Email</Label>
            <Input id="email" name="email" type="email" placeholder="you@example.com" required />
          </div>
          <div className="space-y-1">
            <div className="flex items-center justify-between gap-3">
              <Label htmlFor="password">密碼</Label>
              <Link href="/forgot-password" className="text-xs text-primary hover:underline">
                忘記密碼？
              </Link>
            </div>
            <Input id="password" name="password" type="password" required />
          </div>
          <Button type="submit" className="w-full">
            登入
          </Button>
        </form>
      </CardContent>
      <CardFooter className="justify-center text-sm text-muted-foreground">
        還沒有帳號？
        <Link href="/register" className="ml-1 text-primary hover:underline">
          建立帳號
        </Link>
      </CardFooter>
    </Card>
  );
}
