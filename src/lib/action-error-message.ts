function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function firstString(value: unknown): string | null {
  if (typeof value === "string" && value.trim()) return value;
  if (!Array.isArray(value)) return null;

  for (const item of value) {
    if (typeof item === "string" && item.trim()) return item;
  }
  return null;
}

function firstNestedString(value: unknown): string | null {
  const direct = firstString(value);
  if (direct) return direct;

  if (!isRecord(value)) return null;

  for (const nested of Object.values(value)) {
    const message = firstString(nested);
    if (message) return message;
  }
  return null;
}

export function getServerActionErrorMessage(result: unknown, fallback: string): string {
  if (!isRecord(result)) return fallback;

  if (typeof result.message === "string" && result.message.trim()) {
    return result.message;
  }

  if (!isRecord(result.errors)) return fallback;

  const directMessage = firstNestedString(result.errors._);
  if (directMessage) return directMessage;

  const formMessage = firstNestedString(result.errors.formErrors);
  if (formMessage) return formMessage;

  const fieldMessage = firstNestedString(result.errors.fieldErrors);
  if (fieldMessage) return fieldMessage;

  return fallback;
}
