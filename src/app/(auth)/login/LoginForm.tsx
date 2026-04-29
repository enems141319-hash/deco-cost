// src/app/(auth)/login/LoginForm.tsx
"use client";

import Link from "next/link";
import { loginUser } from "@/lib/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card, CardContent, CardDescription,
  CardFooter, CardHeader, CardTitle,
} from "@/components/ui/card";

interface Props {
  registered?: boolean;
  error?: string;
}

export function LoginForm({ registered, error }: Props) {
  return (
    <Card className="w-full max-w-sm">
      <CardHeader className="space-y-1 text-center">
        <CardTitle className="text-2xl font-bold">DecoCost</CardTitle>
        <CardDescription>裝潢材料成本估價系統</CardDescription>
      </CardHeader>
      <CardContent>
        {registered && (
          <div className="mb-4 text-sm text-green-600 bg-green-50 rounded p-2 border border-green-200">
            註冊成功，請登入
          </div>
        )}
        {error && (
          <div className="mb-4 text-sm text-destructive bg-destructive/10 rounded p-2">
            帳號或密碼錯誤
          </div>
        )}
        <form action={loginUser} className="space-y-4">
          <div className="space-y-1">
            <Label htmlFor="email">Email</Label>
            <Input id="email" name="email" type="email" placeholder="you@example.com" required />
          </div>
          <div className="space-y-1">
            <Label htmlFor="password">密碼</Label>
            <Input id="password" name="password" type="password" required />
          </div>
          <Button type="submit" className="w-full">登入</Button>
        </form>
      </CardContent>
      <CardFooter className="justify-center text-sm text-muted-foreground">
        還沒有帳號？
        <Link href="/register" className="ml-1 text-primary hover:underline">
          立即註冊
        </Link>
      </CardFooter>
    </Card>
  );
}
