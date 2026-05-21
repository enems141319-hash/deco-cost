"use client";

import { useActionState } from "react";
import Link from "next/link";
import { createProject } from "@/lib/actions/projects";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowLeft } from "lucide-react";

type State = { errors?: Record<string, string[]> } | null;

async function action(_prev: State, formData: FormData): Promise<State> {
  const result = await createProject(formData);
  return result ?? null;
}

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="text-xs text-destructive">{message}</p>;
}

export function NewProjectForm() {
  const [state, formAction, pending] = useActionState<State, FormData>(action, null);

  return (
    <>
      <div className="mb-5">
        <Link
          href="/projects"
          className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          返回專案列表
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>新增專案</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={formAction} className="space-y-6">
            <section className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="name">專案名稱 *</Label>
                <Input id="name" name="name" placeholder="例：忠孝東路住宅系統櫃" required />
                <FieldError message={state?.errors?.name?.[0]} />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="address">專案地址</Label>
                <Input id="address" name="address" placeholder="例：台北市信義區..." />
                <FieldError message={state?.errors?.address?.[0]} />
              </div>
            </section>

            <section className="space-y-4 rounded-lg border p-4">
              <h2 className="text-sm font-semibold text-slate-700">聯絡資訊</h2>
              <div className="grid gap-4 sm:grid-cols-[1fr_120px]">
                <div className="space-y-1.5">
                  <Label htmlFor="clientName">業主姓名</Label>
                  <Input id="clientName" name="clientName" placeholder="例：陳小明" />
                  <FieldError message={state?.errors?.clientName?.[0]} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="clientTitle">稱謂</Label>
                  <Select name="clientTitle">
                    <SelectTrigger id="clientTitle">
                      <SelectValue placeholder="選擇" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="先生">先生</SelectItem>
                      <SelectItem value="小姐">小姐</SelectItem>
                    </SelectContent>
                  </Select>
                  <FieldError message={state?.errors?.clientTitle?.[0]} />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="clientPhone">聯絡電話</Label>
                  <Input id="clientPhone" name="clientPhone" placeholder="例：0912-345-678" />
                  <FieldError message={state?.errors?.clientPhone?.[0]} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="clientLineId">Line ID</Label>
                  <Input id="clientLineId" name="clientLineId" placeholder="例：line_id" />
                  <FieldError message={state?.errors?.clientLineId?.[0]} />
                </div>
              </div>
            </section>

            <section className="space-y-4 rounded-lg border p-4">
              <h2 className="text-sm font-semibold text-slate-700">設計師</h2>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="designerName">設計師姓名</Label>
                  <Input id="designerName" name="designerName" placeholder="例：王設計師" />
                  <FieldError message={state?.errors?.designerName?.[0]} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="designerPhone">聯絡電話</Label>
                  <Input id="designerPhone" name="designerPhone" placeholder="例：02-2345-6789" />
                  <FieldError message={state?.errors?.designerPhone?.[0]} />
                </div>
              </div>
            </section>

            <div className="flex gap-3 pt-2">
              <Button type="submit" className="flex-1" disabled={pending}>
                {pending ? "建立中..." : "建立專案"}
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
