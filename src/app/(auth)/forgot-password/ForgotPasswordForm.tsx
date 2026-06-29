// src/app/(auth)/forgot-password/ForgotPasswordForm.tsx
"use client";

import { useActionState } from "react";
import Link from "next/link";
import { AuthActionState, requestPasswordReset } from "@/lib/actions/auth";
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

async function action(_prev: AuthActionState, formData: FormData): Promise<AuthActionState> {
  try {
    return await requestPasswordReset(formData);
  } catch (error) {
    console.error(error);
    return {
      success: false,
      errors: { form: ["寄送失敗，請稍後再試。"] },
    };
  }
}

export function ForgotPasswordForm() {
  const [state, formAction, pending] = useActionState<AuthActionState, FormData>(action, null);

  return (
    <Card className="w-full max-w-sm">
      <CardHeader className="space-y-1 text-center">
        <CardTitle className="text-2xl font-bold">忘記密碼</CardTitle>
        <CardDescription>輸入註冊 Email，我們會寄出重設連結。</CardDescription>
      </CardHeader>
      <CardContent>
        {state?.message && (
          <div className="mb-4 rounded border border-green-200 bg-green-50 p-2 text-sm text-green-700">
            {state.message}
          </div>
        )}
        {state?.errors?.form && (
          <div className="mb-4 rounded bg-destructive/10 p-2 text-sm text-destructive">
            {state.errors.form[0]}
          </div>
        )}
        <form action={formAction} className="space-y-4">
          <div className="space-y-1">
            <Label htmlFor="email">Email</Label>
            <Input id="email" name="email" type="email" placeholder="you@example.com" required />
            {state?.errors?.email && (
              <p className="text-xs text-destructive">{state.errors.email[0]}</p>
            )}
          </div>
          <Button type="submit" className="w-full" disabled={pending}>
            {pending ? "寄送中..." : "寄送重設連結"}
          </Button>
        </form>
      </CardContent>
      <CardFooter className="justify-center text-sm text-muted-foreground">
        想起密碼了？
        <Link href="/login" className="ml-1 text-primary hover:underline">
          回到登入
        </Link>
      </CardFooter>
    </Card>
  );
}
