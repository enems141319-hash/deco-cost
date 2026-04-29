// src/app/(dashboard)/projects/new/NewProjectForm.tsx
"use client";

import { useActionState } from "react";
import Link from "next/link";
import { createProject } from "@/lib/actions/projects";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";

type State = { errors?: Record<string, string[]> } | null;

async function action(_prev: State, formData: FormData): Promise<State> {
  const result = await createProject(formData);
  return result ?? null;
}

export function NewProjectForm() {
  const [state, formAction, pending] = useActionState<State, FormData>(action, null);

  return (
    <>
      <div className="mb-5">
        <Link href="/projects" className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1">
          <ArrowLeft className="h-3.5 w-3.5" />
          返回專案列表
        </Link>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>建立新專案</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={formAction} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="name">專案名稱 *</Label>
              <Input id="name" name="name" placeholder="例：三房兩廳裝潢 - 信義路" required />
              {state?.errors?.name && (
                <p className="text-xs text-destructive">{state.errors.name[0]}</p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="clientName">業主姓名</Label>
              <Input id="clientName" name="clientName" placeholder="例：陳先生" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="notes">備註</Label>
              <textarea
                id="notes" name="notes" rows={3}
                placeholder="專案備注、地址、特殊需求…"
                className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 resize-none"
              />
            </div>
            <div className="flex gap-3 pt-2">
              <Button type="submit" className="flex-1" disabled={pending}>
                {pending ? "建立中…" : "建立專案"}
              </Button>
              <Button asChild variant="outline">
                <Link href="/projects">取消</Link>
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </>
  );
}
