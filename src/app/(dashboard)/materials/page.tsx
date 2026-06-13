// src/app/(dashboard)/materials/page.tsx

import { Metadata } from "next";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { MaterialsClient, type MaterialData } from "./MaterialsClient";
import Link from "next/link";
import { MaterialVendor } from "@prisma/client";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = { title: "材料管理" };

export default async function MaterialsPage({
  searchParams,
}: {
  searchParams: Promise<{ vendor?: string }>;
}) {
  await auth();
  const { vendor: requestedVendor } = await searchParams;
  const vendor = requestedVendor === "ZHENGDAO" ? MaterialVendor.ZHENGDAO : MaterialVendor.WEIHO;

  const materials = await prisma.material.findMany({
    where: { vendor },
    orderBy: [{ category: "asc" }, { brand: "asc" }, { sortOrder: "asc" }, { name: "asc" }],
  });

  const serialized: MaterialData[] = materials.map((material) => ({
    id: material.id,
    vendor: material.vendor,
    category: material.category,
    brand: material.brand,
    colorCode: material.colorCode,
    surfaceTreatment: material.surfaceTreatment,
    boardType: material.boardType,
    name: material.name,
    spec: material.spec ?? undefined,
    unit: material.unit,
    price: Number(material.price),
    minCai: material.minCai !== null ? Number(material.minCai) : null,
    wasteRate: Number(material.wasteRate),
    isActive: material.isActive,
  }));

  return (
    <div className="space-y-4 px-4 py-5 sm:p-6">
      <div>
        <h1 className="text-xl font-bold sm:text-2xl">材料管理</h1>
        <p className="text-sm text-muted-foreground">
          葳禾與正道材料、加工及五金分庫管理
        </p>
      </div>
      <div className="flex flex-wrap gap-2" aria-label="材料庫切換">
        <Button asChild variant={vendor === MaterialVendor.WEIHO ? "default" : "outline"}>
          <Link href="/materials?vendor=WEIHO">葳禾材料庫</Link>
        </Button>
        <Button asChild variant={vendor === MaterialVendor.ZHENGDAO ? "default" : "outline"}>
          <Link href="/materials?vendor=ZHENGDAO">正道材料庫</Link>
        </Button>
      </div>
      <MaterialsClient materials={serialized} vendor={vendor} />
    </div>
  );
}
