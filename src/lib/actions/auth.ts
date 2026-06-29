// src/lib/actions/auth.ts
"use server";

import { redirect } from "next/navigation";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { signIn, signOut } from "@/lib/auth";
import {
  createPasswordResetToken,
  hashPasswordResetToken,
  isPasswordResetTokenExpired,
  passwordResetExpiry,
} from "@/lib/password-reset";
import { getAppBaseUrl, sendPasswordResetEmail } from "@/lib/email/password-reset";

export type AuthActionState = {
  success?: boolean;
  message?: string;
  errors?: Record<string, string[]>;
} | null;

const registerSchema = z.object({
  name: z.string().min(2, "姓名至少需要 2 個字"),
  email: z.string().email("請輸入有效的 Email"),
  password: z.string().min(6, "密碼至少需要 6 個字"),
});

const requestPasswordResetSchema = z.object({
  email: z.string().email("請輸入有效的 Email"),
});

const resetPasswordSchema = z
  .object({
    token: z.string().min(1, "重設連結無效"),
    password: z.string().min(6, "密碼至少需要 6 個字"),
    confirmPassword: z.string().min(6, "請再次輸入密碼"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    path: ["confirmPassword"],
    message: "兩次輸入的密碼不一致",
  });

export async function registerUser(
  formData: FormData
): Promise<{ success: false; errors: Record<string, string[]> } | undefined> {
  const parsed = registerSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return { success: false, errors: parsed.error.flatten().fieldErrors };
  }

  const { name, password } = parsed.data;
  const email = parsed.data.email.toLowerCase();

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return { success: false, errors: { email: ["此 Email 已被註冊"] } };
  }

  const hashed = await bcrypt.hash(password, 10);
  await prisma.user.create({ data: { name, email, password: hashed } });

  redirect("/login?registered=1");
}

export async function loginUser(formData: FormData) {
  await signIn("credentials", {
    email: formData.get("email"),
    password: formData.get("password"),
    redirectTo: "/dashboard",
  });
}

export async function logoutUser() {
  await signOut({ redirectTo: "/login" });
}

export async function requestPasswordReset(formData: FormData): Promise<AuthActionState> {
  const parsed = requestPasswordResetSchema.safeParse({
    email: formData.get("email"),
  });

  if (!parsed.success) {
    return { success: false, errors: parsed.error.flatten().fieldErrors };
  }

  const email = parsed.data.email.toLowerCase();
  const user = await prisma.user.findUnique({ where: { email } });
  const successMessage = "如果 Email 存在，我們已寄出重設密碼連結。";

  if (!user) {
    return { success: true, message: successMessage };
  }

  const token = createPasswordResetToken();
  await prisma.passwordResetToken.create({
    data: {
      email,
      tokenHash: token.tokenHash,
      expiresAt: passwordResetExpiry(),
    },
  });

  const resetUrl = `${getAppBaseUrl()}/reset-password?token=${token.rawToken}`;
  await sendPasswordResetEmail({ to: email, resetUrl });

  return { success: true, message: successMessage };
}

export async function resetPassword(formData: FormData): Promise<AuthActionState> {
  const parsed = resetPasswordSchema.safeParse({
    token: formData.get("token"),
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
  });

  if (!parsed.success) {
    return { success: false, errors: parsed.error.flatten().fieldErrors };
  }

  const { token, password } = parsed.data;
  const resetToken = await prisma.passwordResetToken.findUnique({
    where: { tokenHash: hashPasswordResetToken(token) },
  });

  if (!resetToken || resetToken.usedAt || isPasswordResetTokenExpired(resetToken.expiresAt)) {
    return { success: false, errors: { token: ["重設連結已失效，請重新申請。"] } };
  }

  const user = await prisma.user.findUnique({ where: { email: resetToken.email } });
  if (!user) {
    return { success: false, errors: { token: ["重設連結已失效，請重新申請。"] } };
  }

  const hashed = await bcrypt.hash(password, 10);

  await prisma.$transaction([
    prisma.user.update({
      where: { id: user.id },
      data: { password: hashed },
    }),
    prisma.passwordResetToken.update({
      where: { id: resetToken.id },
      data: { usedAt: new Date() },
    }),
    prisma.passwordResetToken.deleteMany({
      where: {
        email: resetToken.email,
        id: { not: resetToken.id },
        usedAt: null,
      },
    }),
  ]);

  redirect("/login?reset=1");
}
