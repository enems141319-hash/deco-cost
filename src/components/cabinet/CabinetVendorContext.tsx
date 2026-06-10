"use client";

import { createContext, useContext, type ReactNode } from "react";
import type { CabinetVendor } from "@/types/vendor";

const CabinetVendorContext = createContext<CabinetVendor>("WEIHO");

export function materialApiUrl(vendor: CabinetVendor, category?: string): string {
  const params = new URLSearchParams({ vendor });
  if (category) params.set("category", category);
  return `/api/materials?${params.toString()}`;
}

export function CabinetVendorProvider({
  vendor,
  children,
}: {
  vendor: CabinetVendor;
  children: ReactNode;
}) {
  return <CabinetVendorContext.Provider value={vendor}>{children}</CabinetVendorContext.Provider>;
}

export function useCabinetVendor(): CabinetVendor {
  return useContext(CabinetVendorContext);
}
