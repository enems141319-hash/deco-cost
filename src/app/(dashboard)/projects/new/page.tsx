// src/app/(dashboard)/projects/new/page.tsx

import { Metadata } from "next";
import { NewProjectForm } from "./NewProjectForm";

export const metadata: Metadata = { title: "新增專案" };

export default function NewProjectPage() {
  return (
    <div className="p-6 max-w-lg">
      <NewProjectForm />
    </div>
  );
}
