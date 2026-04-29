// src/components/shared/AreaDisplay.tsx

import type { AreaMeasure } from "@/types";
import { formatNumber } from "@/lib/utils";

interface Props {
  area: AreaMeasure;
  showAll?: boolean;
  className?: string;
}

export function AreaDisplay({ area, showAll = false, className }: Props) {
  if (showAll) {
    return (
      <span className={className}>
        <span>{formatNumber(area.cai, 2)} 才</span>
        <span className="text-muted-foreground text-xs ml-1">
          ({formatNumber(area.m2, 3)} m²)
        </span>
      </span>
    );
  }
  return <span className={className}>{formatNumber(area.cai, 2)} 才</span>;
}
