// src/app/api/materials/route.ts

import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { MaterialCategory, MaterialVendor } from "@prisma/client";
import { getEffectiveMaterials } from "@/lib/material-overrides";

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const category = searchParams.get("category") as MaterialCategory | null;
  const requestedVendor = searchParams.get("vendor") as MaterialVendor | null;
  const vendor = requestedVendor && Object.values(MaterialVendor).includes(requestedVendor)
    ? requestedVendor
    : MaterialVendor.WEIHO;

  const effectiveCategory = category && Object.values(MaterialCategory).includes(category) ? category : undefined;
  const materials = await getEffectiveMaterials({
    userId: session.user.id,
    vendor,
    category: effectiveCategory,
  });

  const result = materials.map((m) => ({
    ...m,
  }));
  return NextResponse.json(result);
}
