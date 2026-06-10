"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Factory, Grid3X3, X } from "lucide-react";
import { Button } from "@/components/ui/button";

type CabinetVendor = "WEIHO" | "ZHENGDAO";

export function cabinetVendorPath(projectId: string, vendor: CabinetVendor): string {
  return vendor === "ZHENGDAO"
    ? `/projects/${projectId}/zhengdao-cabinet`
    : `/projects/${projectId}/cabinet`;
}

export function CabinetVendorDialog({ projectId }: { projectId: string }) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [open]);

  return (
    <>
      <Button type="button" className="w-full sm:w-auto" onClick={() => setOpen(true)}>
        <Grid3X3 className="h-4 w-4" />
        新增系統櫃估價
      </Button>

      {open && (
        <div
          className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4"
          role="presentation"
          onMouseDown={() => setOpen(false)}
        >
          <section
            aria-labelledby="cabinet-vendor-title"
            aria-modal="true"
            className="w-full max-w-lg overflow-hidden rounded-md border bg-background shadow-xl"
            role="dialog"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <header className="flex items-start justify-between gap-4 border-b px-5 py-4">
              <div>
                <h2 id="cabinet-vendor-title" className="text-base font-semibold">選擇系統櫃計價廠商</h2>
                <p className="mt-1 text-sm text-muted-foreground">每一筆估價僅使用一家廠商的材料與計算規則。</p>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-8 w-8 shrink-0"
                title="關閉"
                onClick={() => setOpen(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </header>

            <div className="grid gap-3 p-5 sm:grid-cols-2">
              <Link
                href={cabinetVendorPath(projectId, "WEIHO")}
                className="group rounded-md border p-4 transition-colors hover:border-blue-500 hover:bg-blue-50"
              >
                <Grid3X3 className="h-5 w-5 text-blue-600" />
                <p className="mt-3 font-semibold">葳禾系統櫃</p>
                <p className="mt-1 text-sm leading-relaxed text-muted-foreground">使用目前既有材料庫與計算引擎。</p>
              </Link>
              <Link
                href={cabinetVendorPath(projectId, "ZHENGDAO")}
                className="group rounded-md border p-4 transition-colors hover:border-blue-500 hover:bg-blue-50"
              >
                <Factory className="h-5 w-5 text-blue-600" />
                <p className="mt-3 font-semibold">正道系統櫃</p>
                <p className="mt-1 text-sm leading-relaxed text-muted-foreground">使用正道板材、加工與五金計價規則。</p>
              </Link>
            </div>
          </section>
        </div>
      )}
    </>
  );
}
