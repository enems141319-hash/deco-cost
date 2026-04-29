// src/app/(auth)/register/page.tsx

import { Metadata } from "next";
import { RegisterForm } from "./RegisterForm";

export const metadata: Metadata = { title: "註冊" };

export default function RegisterPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 px-4">
      <RegisterForm />
    </div>
  );
}
