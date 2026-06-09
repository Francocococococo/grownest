import type { ManagedIntern, RiskLevel } from "../types";

export function clampProgress(value: number): number {
  return Math.max(0, Math.min(100, Number.isFinite(value) ? value : 0));
}

export function getAverageProgress(list: ManagedIntern[]): number {
  return list.length
    ? Math.round(list.reduce((sum, intern) => sum + intern.progress, 0) / list.length)
    : 0;
}

export function getMentorFeedbackRate(list: ManagedIntern[]): number {
  if (!list.length) return 0;
  const covered = list.filter((intern) => intern.feedbacks.length > 0).length;
  return Math.round((covered / list.length) * 100);
}

export function getRoleProgressData(list: ManagedIntern[]): Array<{ role: string; progress: number }> {
  return ["产品", "研发", "销售", "HR"].map((role) => {
    const roleList = list.filter((intern) => intern.role === role);
    const progress = getAverageProgress(roleList);
    return { role: `${role}岗`, progress };
  });
}

export function getRiskDistributionData(list: ManagedIntern[]): Array<{ name: RiskLevel; value: number; color: string }> {
  return [
    { name: "低风险", value: list.filter((intern) => intern.risk === "低风险").length, color: "#16a34a" },
    { name: "中风险", value: list.filter((intern) => intern.risk === "中风险").length, color: "#f59e0b" },
    { name: "高风险", value: list.filter((intern) => intern.risk === "高风险").length, color: "#ef4444" },
  ];
}

export function inferTaskDateIndex(task: { due: string }, index: number): number {
  if (task.due.includes("今天")) return 0;
  if (task.due.includes("明天")) return 1;
  if (task.due.includes("三")) return 2;
  if (task.due.includes("四")) return 3;
  if (task.due.includes("五")) return 4;
  if (task.due.includes("下周")) return 4;
  return Math.min(index, 4);
}
