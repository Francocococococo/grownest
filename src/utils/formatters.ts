export function nowLabel(): string {
  return new Date().toLocaleString("zh-CN", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function createId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`;
}

export function normalizeDepartment(value?: string): string {
  return (value ?? "")
    .split("/")
    .map((part) => part.trim())
    .filter(Boolean)
    .at(-1) ?? "";
}

export function isSameDepartment(left?: string, right?: string): boolean {
  const normalizedLeft = normalizeDepartment(left);
  const normalizedRight = normalizeDepartment(right);
  return !!normalizedLeft && !!normalizedRight && normalizedLeft === normalizedRight;
}

export function startOfDay(date: Date): Date {
  const next = new Date(date);
  next.setHours(0, 0, 0, 0);
  return next;
}

export function addDays(date: Date, days: number): Date {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

export function toDateKey(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export function formatMonthDay(date: Date): string {
  return date.toLocaleDateString("zh-CN", { month: "2-digit", day: "2-digit" });
}

export function formatWeekday(date: Date): string {
  return date.toLocaleDateString("zh-CN", { weekday: "short" });
}
