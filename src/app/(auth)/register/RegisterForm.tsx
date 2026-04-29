// src/app/(auth)/register/RegisterForm.tsx
"use client";

import { useActionState } from "react";
import Link from "next/link";
import { registerUser } from "@/lib/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card, CardContent, CardDescription,
  CardFooter, CardHeader, CardTitle,
} from "@/components/ui/card";

type State = {
  errors?: {
    name?: string[];
    email?: string[];
    password?: string[];
  };
} | null;

async function action(_prev: State, formData: FormData): Promise<State> {
  const result = await registerUser(formData);
  // registerUser redirects on success, so this only runs on error
  return result ?? null;
}

export function RegisterForm() {
  const [state, formAction, pending] = useActionState<State, FormData>(action, null);

  return (
    <Card className="w-full max-w-sm">
      <CardHeader className="space-y-1 text-center">
        <CardTitle className="text-2xl font-bold">建立帳號</CardTitle>
        <CardDescription>免費開始使用 DecoCost</CardDescription>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="space-y-4">
          <div className="space-y-1">
            <Label htmlFor="name">姓名</Label>
            <Input id="name" name="name" placeholder="您的姓名" required />
            {state?.errors?.name && (
              <p className="text-xs text-destructive">{state.errors.name[0]}</p>
            )}
          </div>
          <div className="space-y-1">
            <Label htmlFor="email">Email</Label>
            <Input id="email" name="email" type="email" placeholder="you@example.com" required />
            {state?.errors?.email && (
              <p className="text-xs text-destructive">{state.errors.email[0]}</p>
            )}
          </div>
          <div className="space-y-1">
            <Label htmlFor="password">密碼</Label>
            <Input id="password" name="password" type="password" placeholder="至少 6 個字元" required />
            {state?.errors?.password && (
              <p className="text-xs text-destructive">{state.errors.password[0]}</p>
            )}
          </div>
          <Button type="submit" className="w-full" disabled={pending}>
            {pending ? "建立中…" : "建立帳號"}
          </Button>
        </form>
      </CardContent>
      <CardFooter className="justify-center text-sm text-muted-foreground">
        已有帳號？
        <Link href="/login" className="ml-1 text-primary hover:underline">
          前往登入
        </Link>
      </CardFooter>
    </Card>
  );
}
