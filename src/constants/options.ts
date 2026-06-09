import type { Path, RiskLevel, UserRole } from "../types";

export const collaborationStorageKey = "internflow_collaboration_records";
export const managedInternStorageKey = "internflow_managed_interns";
export const authStorageKey = "internflow_user";
export const grownestCollaborationStorageKey = "grownest:actions";
export const grownestManagedInternStorageKey = "grownest:interns";
export const grownestAuthStorageKey = "grownest:currentUser";

export const studentCalendarStartDate = "2026-06-15";
export const studentGrowthCycleDays = 91;
export const studentGrowthWeekSize = 7;

export const rolePath: Record<UserRole, Path> = {
  student: "/student",
  mentor: "/mentor",
  hr: "/hr",
  admin: "/admin",
};

export const roleName: Record<UserRole, string> = {
  student: "实习生成长端",
  mentor: "导师带教端",
  hr: "HRBP 成长运营台",
  admin: "系统管理后台",
};

export const riskClass: Record<RiskLevel, string> = {
  低风险: "border-emerald-200 bg-emerald-50 text-emerald-700",
  中风险: "border-amber-200 bg-amber-50 text-amber-700",
  高风险: "border-rose-200 bg-rose-50 text-rose-700",
};

export const attentionLabel: Record<RiskLevel, string> = {
  低风险: "稳定推进",
  中风险: "需要支持",
  高风险: "重点关注",
};

export const positionRoles = ["产品", "研发", "销售", "HR"] as const;
