// src/app/(auth)/login/LoginForm.tsx
"use client";

import { useActionState } from "react";
import Link from "next/link";
import { LoginActionState, loginUser } from "@/lib/actions/auth";
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

async function action(_prev: LoginActionState, formData: FormData): Promise<LoginActionState> {
  return loginUser(formData);
}

export function LoginForm({ registered, reset, error }: Props) {
  const [state, formAction, pending] = useActionState<LoginActionState, FormData>(action, null);
  const loginError = state?.errors?.form?.[0] ?? (error ? "登入失敗，請確認 Email 與密碼。" : null);

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
        {loginError && (
          <div className="mb-4 rounded bg-destructive/10 p-2 text-sm text-destructive">
            {loginError}
          </div>
        )}
        <form action={formAction} className="space-y-4">
          <div className="space-y-1">
            <Label htmlFor="email">Email</Label>
            <Input
              key={state?.email ?? "empty-email"}
              id="email"
              name="email"
              type="email"
              placeholder="you@example.com"
              autoComplete="email"
              defaultValue={state?.email ?? ""}
              required
            />
          </div>
          <div className="space-y-1">
            <div className="flex items-center justify-between gap-3">
              <Label htmlFor="password">密碼</Label>
              <Link href="/forgot-password" className="text-xs text-primary hover:underline">
                忘記密碼？
              </Link>
            </div>
            <Input id="password" name="password" type="password" autoComplete="current-password" required />
          </div>
          <Button type="submit" className="w-full" disabled={pending}>
            {pending ? "登入中..." : "登入"}
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
