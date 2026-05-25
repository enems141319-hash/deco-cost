// src/app/(dashboard)/projects/new/page.tsx

import { Metadata } from "next";
import { NewProjectForm } from "./NewProjectForm";

export const metadata: Metadata = { title: "新增專案" };

export default function NewProjectPage() {
  return (
    <div className="max-w-2xl px-4 py-5 sm:p-6">
      <NewProjectForm />
    </div>
  );
}
