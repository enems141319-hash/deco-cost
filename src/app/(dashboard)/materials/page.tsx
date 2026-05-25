// src/app/(dashboard)/materials/page.tsx

import { Metadata } from "next";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { MaterialsClient, type MaterialData } from "./MaterialsClient";

export const metadata: Metadata = { title: "材料管理" };

export default async function MaterialsPage() {
  await auth();

  const materials = await prisma.material.findMany({
    orderBy: [{ category: "asc" }, { brand: "asc" }, { sortOrder: "asc" }, { name: "asc" }],
  });

  const serialized: MaterialData[] = materials.map((material) => ({
    id: material.id,
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
          品牌、色號、板料類型與五金價格
        </p>
      </div>
      <MaterialsClient materials={serialized} />
    </div>
  );
}
