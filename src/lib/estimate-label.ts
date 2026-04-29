export function estimateLabelOrDefault(label: string | null | undefined, fallback: string): string {
  const normalized = label?.trim();
  return normalized || fallback;
}

export function displayEstimateLabel(label: string | null, moduleLabel: string): string {
  const normalized = label?.trim();
  if (!normalized || normalized === moduleLabel) return "未命名估價";
  return normalized;
}
