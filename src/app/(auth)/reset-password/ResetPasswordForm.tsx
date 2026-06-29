// src/app/(auth)/reset-password/ResetPasswordForm.tsx
"use client";

import { useActionState } from "react";
import Link from "next/link";
import { AuthActionState, resetPassword } from "@/lib/actions/auth";
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

type Props = {
  token: string;
};

function isNextRedirectError(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "digest" in error &&
    typeof error.digest === "string" &&
    error.digest.startsWith("NEXT_REDIRECT")
  );
}

async function action(_prev: AuthActionState, formData: FormData): Promise<AuthActionState> {
  try {
    return await resetPassword(formData);
  } catch (error) {
    if (isNextRedirectError(error)) {
      throw error;
    }

    console.error(error);
    return {
      success: false,
      errors: { form: ["更新失敗，請稍後再試。"] },
    };
  }
}

export function ResetPasswordForm({ token }: Props) {
  const [state, formAction, pending] = useActionState<AuthActionState, FormData>(action, null);
  const tokenError = state?.errors?.token?.[0];

  return (
    <Card className="w-full max-w-sm">
      <CardHeader className="space-y-1 text-center">
        <CardTitle className="text-2xl font-bold">重設密碼</CardTitle>
        <CardDescription>請輸入新的登入密碼。</CardDescription>
      </CardHeader>
      <CardContent>
        {tokenError && (
          <div className="mb-4 rounded bg-destructive/10 p-2 text-sm text-destructive">
            {tokenError}
          </div>
        )}
        {state?.errors?.form && (
          <div className="mb-4 rounded bg-destructive/10 p-2 text-sm text-destructive">
            {state.errors.form[0]}
          </div>
        )}
        <form action={formAction} className="space-y-4">
          <input type="hidden" name="token" value={token} />
          <div className="space-y-1">
            <Label htmlFor="password">新密碼</Label>
            <Input id="password" name="password" type="password" minLength={6} required />
            {state?.errors?.password && (
              <p className="text-xs text-destructive">{state.errors.password[0]}</p>
            )}
          </div>
          <div className="space-y-1">
            <Label htmlFor="confirmPassword">再次輸入新密碼</Label>
            <Input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              minLength={6}
              required
            />
            {state?.errors?.confirmPassword && (
              <p className="text-xs text-destructive">{state.errors.confirmPassword[0]}</p>
            )}
          </div>
          <Button type="submit" className="w-full" disabled={pending || !token}>
            {pending ? "更新中..." : "更新密碼"}
          </Button>
        </form>
      </CardContent>
      <CardFooter className="justify-center text-sm text-muted-foreground">
        <Link href="/login" className="text-primary hover:underline">
          回到登入
        </Link>
      </CardFooter>
    </Card>
  );
}
