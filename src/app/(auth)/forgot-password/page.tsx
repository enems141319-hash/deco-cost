// src/app/(auth)/forgot-password/page.tsx

import { Metadata } from "next";
import { ForgotPasswordForm } from "./ForgotPasswordForm";

export const metadata: Metadata = { title: "忘記密碼" };

export default function ForgotPasswordPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 px-4">
      <ForgotPasswordForm />
    </div>
  );
}
