// src/lib/actions/auth.ts
"use server";

import { redirect } from "next/navigation";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { signIn, signOut } from "@/lib/auth";

const registerSchema = z.object({
  name: z.string().min(2, "姓名至少 2 個字"),
  email: z.string().email("請輸入有效的 Email"),
  password: z.string().min(6, "密碼至少 6 個字元"),
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

  const { name, email, password } = parsed.data;

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return { success: false, errors: { email: ["此 Email 已被使用"] } };
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
