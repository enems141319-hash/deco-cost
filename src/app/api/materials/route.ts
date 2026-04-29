// src/app/api/materials/route.ts

import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { MaterialCategory } from "@prisma/client";

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const category = searchParams.get("category") as MaterialCategory | null;

  const materials = await prisma.material.findMany({
    where: {
      isActive: true,
      ...(category && Object.values(MaterialCategory).includes(category) ? { category } : {}),
    },
    orderBy: [{ category: "asc" }, { sortOrder: "asc" }, { name: "asc" }],
  });

  const result = materials.map((m) => ({
    ...m,
    price: Number(m.price),
    wasteRate: Number(m.wasteRate),
    minCai: m.minCai !== null ? Number(m.minCai) : null,
  }));
  return NextResponse.json(result);
}
