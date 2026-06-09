import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { CSSProperties, ElementType, HTMLAttributes, ReactNode } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  AlertTriangle,
  Bot,
  BrainCircuit,
  CalendarCheck,
  CheckCircle2,
  ChevronRight,
  ClipboardList,
  Copy,
  Clock3,
  FileText,
  GraduationCap,
  Home,
  LayoutDashboard,
  ListChecks,
  LockKeyhole,
  Loader2,
  LogIn,
  LogOut,
  Flag,
  MapPinned,
  MessageSquareText,
  Plus,
  RotateCcw,
  Search,
  Send,
  ShieldCheck,
  Sparkles,
  SquarePen,
  Target,
  Trash2,
  TrendingUp,
  UserCheck,
  UserRound,
  Users,
  X,
} from "lucide-react";
import { cn } from "./lib/utils";
import { useAuth } from "./hooks/useAuth";
import { useInterns } from "./hooks/useInterns";
import ThemePreviewPage from "./ThemePreviewPage";
import { getAverageProgress, getMentorFeedbackRate } from "./utils/calculations";
import { createId, isSameDepartment, normalizeDepartment, nowLabel } from "./utils/formatters";
import {
  growthStages,
  internSeeds,
  interns,
  mentorInterns,
  mentorRhythmTodos,
  mockUsers,
  positionGrowthStages,
  recruiterSummary,
  studentWeeklyTasks,
  type Intern,
  type MockUser,
  type RiskLevel,
  type UserRole,
} from "./data/mock";

const retainedLegacyImports = [
  Bar,
  BarChart,
  CartesianGrid,
  Tooltip,
  XAxis,
  YAxis,
  Copy,
  Target,
  TrendingUp,
  recruiterSummary,
  getAverageProgress,
  getMentorFeedbackRate,
];
void retainedLegacyImports;

gsap.registerPlugin(useGSAP, ScrollTrigger);
gsap.defaults({ duration: 0.36, ease: "power2.out" });

type AuthUser = Omit<MockUser, "password">;
type Path = "/" | "/login" | "/student" | "/mentor" | "/hr" | "/admin" | "/preview-theme";
type AIFeedback = {
  highlights: string;
  improvements: string;
  nextStep: string;
  messageToIntern: string;
};
type AIQuestions = {
  questions: string[];
};
type AIReport = {
  report: string;
};
type AIHrAction = {
  title: string;
  detail: string;
};
type AIDailyPlan = {
  recommendation: string;
  reason: string;
  actions: string[];
};
type AIGenerationResult<T> = {
  output: T;
};
type CollaborationRecord = {
  id: string;
  internName: string;
  sourceRole: "实习生" | "导师" | "HR";
  targetRole: "实习生" | "导师" | "HR";
  title: string;
  detail: string;
  status: "待处理" | "已同步" | "已创建";
  createdAt: string;
  question?: string;
  answer?: string;
  answeredAt?: string;
};
type TaskStatus = "已完成" | "进行中" | "未开始" | "未完成";
type ProcessStatus = Intern["processStatus"];
type LoopStatus = "待确认" | "进行中" | "已完成" | "待复盘";
type GrowthTask = {
  id: string;
  title: string;
  status: TaskStatus;
  due: string;
  owner: "实习生" | "导师" | "HR";
  note: string;
};
type MentorFeedbackRecord = {
  id: string;
  mentor: string;
  content: string;
  score: number;
  createdAt: string;
};
type ManagedIntern = {
  id: string;
  name: string;
  role: string;
  title: string;
  department: string;
  mentor: string;
  week: string;
  progress: number;
  risk: RiskLevel;
  reason: string;
  todo: string;
  processStatus: ProcessStatus;
  status: "在岗" | "暂停" | "已结束";
  riskTags: string[];
  tasks: GrowthTask[];
  feedbacks: MentorFeedbackRecord[];
  createdAt: string;
  updatedAt: string;
};
type InternStatus = "在岗" | "暂停" | "已结束";
type InternFormState = Pick<ManagedIntern, "name" | "role" | "title" | "department" | "mentor" | "week" | "progress" | "risk" | "reason" | "todo" | "processStatus" | "status"> & {
  riskTagsText: string;
};
type TaskFormState = Pick<GrowthTask, "title" | "status" | "due" | "owner" | "note">;
type FeedbackFormState = Pick<MentorFeedbackRecord, "mentor" | "content" | "score">;
type ManagedInternPatch = Partial<Omit<ManagedIntern, "id" | "tasks" | "feedbacks" | "createdAt">>;
const defaultTaskDueDate = "2026-06-19";
type SignalSource = "student" | "mentor" | "hrbp" | "ai";
type SignalType = "task" | "question" | "feedback" | "risk" | "followup";
type SignalStatus = "pending" | "confirmed" | "in_progress" | "completed" | "review";
type GrowthSignal = {
  id: string;
  internId: string;
  internName: string;
  mentorName: string;
  source: SignalSource;
  sourceLabel: string;
  type: SignalType;
  title: string;
  description: string;
  status: SignalStatus;
  statusLabel: string;
  visibleToStudent: boolean;
  visibleToMentor: boolean;
  visibleToHrbp: boolean;
  createdAt: string;
  updatedAt: string;
  sourceRecordId?: string;
};
type DemoAccountStatus = "pending" | "active" | "disabled";
type DemoMentorAccount = {
  id: string;
  name: string;
  email: string;
  department: string;
  status: DemoAccountStatus;
  createdAt: string;
};
type DemoInternProgram = {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  status: "active" | "review" | "closed";
};


// ====== 缺失工具 / hook 兜底实现 ======
function shouldReduceMotion(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;
}

function useHomeHeroAnimation(ref: React.RefObject<HTMLElement | null>) {
  useGSAP(
    () => {
      if (!ref.current) return;
      const ctx = gsap.context(() => {
        const ambient = gsap.utils.toArray<HTMLElement>("[data-home-ambient]");
        const insightIcons = gsap.utils.toArray<HTMLElement>("[data-home-insight-icon]");
        const stageCards = gsap.utils.toArray<HTMLElement>("[data-home-stage-card]");
        const paths = gsap.utils.toArray<SVGPathElement>("[data-home-path]");

        paths.forEach((p) => {
          const length = p.getTotalLength?.() ?? 0;
          if (!length) return;
          p.style.strokeDasharray = String(length);
          p.style.strokeDashoffset = String(length);
        });

        if (shouldReduceMotion()) {
          gsap.set("[data-home-nav], [data-home-copy], [data-home-title], [data-home-cta], [data-home-ambient], [data-home-stage-column], [data-home-stage-card], [data-home-stage-product], [data-home-insight-row], [data-home-screen-row], [data-home-path], [data-home-signal]", { autoAlpha: 1, y: 0, x: 0, scale: 1 });
          paths.forEach((p) => { p.style.strokeDashoffset = "0"; });
          return;
        }

        gsap.set(ambient, { autoAlpha: 0, scale: 0.86 });
        gsap.set("[data-home-nav]", { autoAlpha: 0, y: -10 });
        gsap.set("[data-home-stage-column]", { autoAlpha: 0, y: 18 });
        gsap.set(stageCards, { autoAlpha: 0, y: 18, scale: 0.96 });
        gsap.set("[data-home-stage-product]", { autoAlpha: 0, scale: 0.96, y: 14 });
        gsap.set("[data-home-insight-row]", { autoAlpha: 0, x: -10 });
        gsap.set("[data-home-screen-row]", { autoAlpha: 0, y: 8 });
        gsap.set("[data-home-signal]", { scaleX: 0, transformOrigin: "left center" });

        gsap
          .timeline({ defaults: { ease: "power3.out" } })
          .to(ambient, { autoAlpha: 1, scale: 1, duration: 0.7, stagger: 0.06 }, 0)
          .to("[data-home-nav]", { autoAlpha: 1, y: 0, duration: 0.48 }, 0.05)
          .from("[data-home-copy]", { autoAlpha: 0, y: 18, duration: 0.46, stagger: 0.06 }, 0.15)
          .from("[data-home-title]", { autoAlpha: 0, y: 26, duration: 0.64, ease: "power4.out" }, 0.1)
          .from("[data-home-cta]", { autoAlpha: 0, y: 14, duration: 0.4, stagger: 0.06 }, 0.4)
          .to("[data-home-stage-column]", { autoAlpha: 1, y: 0, duration: 0.5, stagger: 0.1, ease: "power3.out" }, 0.3)
          .to("[data-home-stage-product]", { autoAlpha: 1, scale: 1, y: 0, duration: 0.6, ease: "power3.out" }, 0.45)
          .to(stageCards, { autoAlpha: 1, y: 0, scale: 1, duration: 0.5, stagger: 0.08, ease: "power3.out" }, 0.55)
          .to("[data-home-insight-row]", { autoAlpha: 1, x: 0, duration: 0.36, stagger: 0.06, ease: "power2.out" }, 0.7)
          .to("[data-home-screen-row]", { autoAlpha: 1, y: 0, duration: 0.32, stagger: 0.06, ease: "power2.out" }, 0.75)
          .to(paths, { strokeDashoffset: 0, duration: 0.9, stagger: 0.12, ease: "power2.out" }, 0.55)
          .to("[data-home-signal]", { scaleX: 1, duration: 0.9, stagger: 0.08, ease: "power3.inOut" }, 0.96);

        gsap.to(ambient, {
          yPercent: 6,
          duration: 7,
          ease: "sine.inOut",
          repeat: -1,
          yoyo: true,
          stagger: { each: 0.4, from: "random" },
        });

        gsap.to(insightIcons, {
          rotate: 8,
          duration: 2.4,
          ease: "sine.inOut",
          repeat: -1,
          yoyo: true,
        });

        gsap.to(stageCards, {
          y: -7,
          duration: 3.8,
          ease: "sine.inOut",
          repeat: -1,
          yoyo: true,
          stagger: 0.28,
        });

        gsap.to("[data-home-stage-product]", {
          y: -5,
          duration: 4.6,
          ease: "sine.inOut",
          repeat: -1,
          yoyo: true,
        });

        gsap.to("[data-home-signal]", {
          opacity: 0.58,
          duration: 1.8,
          ease: "sine.inOut",
          repeat: -1,
          yoyo: true,
          stagger: 0.18,
        });
      }, ref);
      return () => ctx.revert();
    },
    { scope: ref },
  );
}

function useHomeCapabilityAnimation(ref: React.RefObject<HTMLElement | null>) {
  useGSAP(
    () => {
      if (!ref.current) return;
      const ctx = gsap.context(() => {
        const workflowNodes = gsap.utils.toArray<HTMLElement>("[data-workflow-node]");
        const workflowStages = gsap.utils.toArray<HTMLElement>("[data-workflow-stage]");
        if (shouldReduceMotion()) {
          gsap.set("[data-workflow-node], [data-workflow-stage], [data-workflow-number], [data-action-loop-step], [data-action-loop-bar-source], [data-capability-card], [data-workbench-item], [data-home-showcase-card], [data-role-showcase-reveal]", { autoAlpha: 1, y: 0, x: 0, scale: 1 });
          gsap.set("[data-action-loop-bar], [data-capability-line], [data-role-flow-line]", { scaleX: 1 });
          workflowNodes.forEach((node, index) => {
            node.dataset.active = index === 0 ? "true" : "false";
            node.dataset.complete = "false";
          });
          workflowStages.forEach((stage, index) => {
            stage.dataset.active = index === 0 ? "true" : "false";
            stage.dataset.complete = "false";
          });
          return;
        }

        gsap.set("[data-workflow-node]", { autoAlpha: 0, y: 18, scale: 0.97 });
        gsap.set("[data-workflow-stage]", { autoAlpha: 0, y: 6 });
        gsap.set("[data-workflow-number]", { autoAlpha: 0, scale: 0.6 });
        gsap.set("[data-action-loop-step]", { autoAlpha: 0, x: -10 });
        gsap.set("[data-action-loop-bar-source]", { autoAlpha: 0, y: 10 });
        gsap.set("[data-action-loop-bar]", { scaleX: 0, transformOrigin: "left center" });
        gsap.set("[data-capability-card]", { autoAlpha: 0, y: 16 });
        gsap.set("[data-workbench-item]", { autoAlpha: 0, y: 10 });
        gsap.set("[data-home-showcase-card]", { autoAlpha: 0, y: 10 });
        gsap.set("[data-capability-line]", { scaleX: 0, transformOrigin: "left center" });
        gsap.set("[data-role-showcase-reveal]", { autoAlpha: 0, y: 14 });
        gsap.set("[data-role-flow-line]", { scaleX: 0, transformOrigin: "left center" });
        const setWorkflowStep = (activeIndex: number) => {
          workflowNodes.forEach((node, index) => {
            node.dataset.active = index === activeIndex ? "true" : "false";
            node.dataset.complete = index < activeIndex ? "true" : "false";
          });
          workflowStages.forEach((stage, index) => {
            stage.dataset.active = index === activeIndex ? "true" : "false";
            stage.dataset.complete = index < activeIndex ? "true" : "false";
          });
        };
        setWorkflowStep(0);

        gsap
          .timeline({
            defaults: { ease: "power3.out" },
            scrollTrigger: {
              trigger: ref.current,
              start: "top 72%",
              once: true,
            },
          })
          .to("[data-role-showcase-reveal]", { autoAlpha: 1, y: 0, duration: 0.46, stagger: 0.08 }, 0)
          .to("[data-role-flow-line]", { scaleX: 1, duration: 0.85, ease: "power3.inOut" }, 0.25)
          .to("[data-workflow-node]", { autoAlpha: 1, y: 0, scale: 1, duration: 0.5, stagger: 0.08 }, 0)
          .to("[data-workflow-number]", { autoAlpha: 1, scale: 1, duration: 0.5, ease: "back.out(1.6)", stagger: 0.08 }, 0.35)
          .to("[data-workflow-stage]", { autoAlpha: 1, y: 0, duration: 0.32, stagger: 0.06 }, 0.4)
          .to("[data-action-loop-bar-source]", { autoAlpha: 1, y: 0, duration: 0.4 }, 0.55)
          .to("[data-action-loop-step]", { autoAlpha: 1, x: 0, duration: 0.36, stagger: 0.08, ease: "power2.out" }, 0.65)
          .to("[data-capability-card]", { autoAlpha: 1, y: 0, duration: 0.44, stagger: 0.08 }, 0.5)
          .to("[data-workbench-item]", { autoAlpha: 1, y: 0, duration: 0.32, stagger: 0.05 }, 0.7)
          .to("[data-home-showcase-card]", { autoAlpha: 1, y: 0, duration: 0.34, stagger: 0.06 }, 0.85)
          .to("[data-action-loop-bar]", { scaleX: 1, duration: 1.2, ease: "power3.inOut" }, 0.7)
          .to("[data-capability-line]", { scaleX: 1, duration: 0.9, ease: "power2.out", stagger: 0.12 }, 0.7);
      }, ref);
      return () => ctx.revert();
    },
    { scope: ref },
  );
}

function useScopedEntrance(ref: React.RefObject<HTMLElement | null>, deps: unknown[], _opts?: Record<string, unknown>) {
  void _opts;
  useGSAP(
    () => {
      if (!ref.current) return;
      const ctx = gsap.context(() => {
        if (shouldReduceMotion()) {
          gsap.set("[data-scoped-reveal]", { autoAlpha: 1, y: 0 });
          return;
        }
        gsap.from("[data-scoped-reveal]", {
          autoAlpha: 0,
          y: 12,
          duration: 0.36,
          stagger: 0.06,
          ease: "power2.out",
        });
      }, ref);
      return () => ctx.revert();
    },
    { scope: ref, dependencies: deps },
  );
}

function useGsapHover(ref: React.RefObject<HTMLElement | null>) {
  useGSAP(
    () => {
      if (!ref.current) return;
      const ctx = gsap.context(() => {
        if (shouldReduceMotion()) return;
        gsap.utils.toArray<HTMLElement>("[data-gsap-hover]").forEach((el) => {
          gsap.set(el, { transformOrigin: "50% 50%" });
          el.addEventListener("mouseenter", () => gsap.to(el, { y: -2, duration: 0.18, ease: "power2.out" }));
          el.addEventListener("mouseleave", () => gsap.to(el, { y: 0, duration: 0.18, ease: "power2.out" }));
        });
      }, ref);
      return () => ctx.revert();
    },
    { scope: ref },
  );
}

function useResultReveal(ref: React.RefObject<HTMLElement | null>, deps: unknown[], selector: string) {
  useGSAP(
    () => {
      if (!ref.current) return;
      const ctx = gsap.context(() => {
        if (shouldReduceMotion()) {
          gsap.set(selector, { autoAlpha: 1, y: 0 });
          return;
        }
        gsap.from(selector, { autoAlpha: 0, y: 10, duration: 0.32, stagger: 0.04, ease: "power2.out" });
      }, ref);
      return () => ctx.revert();
    },
    { scope: ref, dependencies: deps },
  );
}

function inferPositionRole(user: AuthUser): "产品" | "研发" | "销售" | "HR" {
  if (user.role === "student") {
    const seed = (interns.find((i) => i.name === user.name)?.role) as string | undefined;
    if (seed === "产品" || seed === "研发" || seed === "销售" || seed === "HR") return seed;
  }
  const title = (user.title ?? "").toLowerCase();
  if (title.includes("产品") || title.includes("运营")) return "产品";
  if (title.includes("研发") || title.includes("开发") || title.includes("工程")) return "研发";
  if (title.includes("销售") || title.includes("客户") || title.includes("商务")) return "销售";
  return "HR";
}

function managedToIntern(intern: ManagedIntern): Intern {
  return {
    name: intern.name,
    role: intern.role,
    week: intern.week,
    progress: intern.progress,
    mentorFeedback: intern.feedbacks.at(-1)?.content ?? "",
    risk: intern.risk,
    reason: intern.reason,
    todo: intern.todo,
    evidence: intern.riskTags,
    evidenceMetrics: [],
    possibleCause: "",
    hrAction: intern.processStatus,
    syncMentor: intern.mentor,
    reviewReminder: "",
    confidence: 0,
    riskTags: intern.riskTags,
    processStatus: intern.processStatus,
    activityLog: [],
  };
}

function getRoleProgressData(list: ManagedIntern[]) {
  return ["产品", "研发", "销售", "HR"].map((role) => {
    const roleList = list.filter((intern) => intern.role === role);
    const avg = roleList.length
      ? Math.round(roleList.reduce((sum, intern) => sum + intern.progress, 0) / roleList.length)
      : 0;
    return { role: `${role}岗`, progress: avg };
  });
}

function getRiskDistributionData(list: ManagedIntern[]) {
  return [
    { name: "低风险", value: list.filter((intern) => intern.risk === "低风险").length, color: "#16a34a" },
    { name: "中风险", value: list.filter((intern) => intern.risk === "中风险").length, color: "#f59e0b" },
    { name: "高风险", value: list.filter((intern) => intern.risk === "高风险").length, color: "#ef4444" },
  ];
}

function seedManagedInterns(): ManagedIntern[] {
  return internSeeds.map((seed, index) => {
    const [name, role, mentor] = seed;
    return {
      id: `intern-seed-${index + 1}`,
      name,
      role,
      title: `${role}岗实习生`,
      department: role === "销售" ? "销售部" : role === "研发" ? "研发中心" : "产品部",
      mentor,
      week: "第 1 周",
      progress: 0,
      risk: "低风险" as RiskLevel,
      reason: "",
      todo: "",
      processStatus: "已关闭" as ProcessStatus,
      status: "在岗" as InternStatus,
      riskTags: [],
      tasks: [],
      feedbacks: [],
      createdAt: "系统录入",
      updatedAt: "系统录入",
    };
  });
}


const collaborationStorageKey = "internflow_collaboration_records";
const managedInternStorageKey = "internflow_managed_interns";
const grownestCollaborationStorageKey = "grownest:actions";
const grownestManagedInternStorageKey = "grownest:interns";
const grownestAuthStorageKey = "grownest:currentUser";
const grownestMentorStorageKey = "grownest:mentors";
const grownestProgramStorageKey = "grownest:programs";
const legacyGrownestProgramStorageKey = "grownest:batches";
const grownestReviewStorageKey = "grownest:reviews";

type ReviewRecord = {
  id: string;
  internName: string;
  signalTitle: string;
  signalType: string;
  conclusion: string;
  nextStep: string;
  reviewer: string;
  createdAt: string;
};
const demoTodayDate = "2026-06-03";
const studentCalendarStartDate = "2026-06-15";
const studentGrowthCycleDays = 91;
const studentGrowthWeekSize = 7;

const rolePath: Record<UserRole, Path> = {
  student: "/student",
  mentor: "/mentor",
  hr: "/hr",
  admin: "/admin",
};

const roleName: Record<UserRole, string> = {
  student: "实习生成长端",
  mentor: "导师带教端",
  hr: "HRBP 成长运营台",
  admin: "系统管理后台",
};

type RoleTheme = {
  accent: string;
  accentStrong: string;
  soft: string;
  border: string;
  shadow: string;
};

type LoginRoleTheme = {
  labelText: string;
  bgBase: string;
  wash: string;
  panel: string;
  panelAlt: string;
  preview: string;
};

const unifiedBlueRoleTheme: RoleTheme = {
  accent: "#2563EB",
  accentStrong: "#143C9B",
  soft: "rgba(37, 99, 235, 0.1)",
  border: "rgba(37, 99, 235, 0.2)",
  shadow: "rgba(37, 99, 235, 0.16)",
};

const unifiedBlueLoginTheme: LoginRoleTheme = {
  labelText: "#2563EB",
  bgBase: "#F3F7FF",
  wash: "radial-gradient(circle at 14% 16%, rgba(37, 99, 235, 0.18), transparent 34%), radial-gradient(circle at 84% 18%, rgba(14, 165, 233, 0.12), transparent 32%), #F3F7FF",
  panel: "linear-gradient(145deg, rgba(255,255,255,0.9), rgba(239,246,255,0.82))",
  panelAlt: "rgba(239, 246, 255, 0.78)",
  preview: "rgba(37, 99, 235, 0.08)",
};

const roleThemes = {
  student: unifiedBlueRoleTheme,
  mentor: unifiedBlueRoleTheme,
  hr: unifiedBlueRoleTheme,
  admin: unifiedBlueRoleTheme,
} satisfies Record<UserRole, RoleTheme>;

const loginRoleThemes = {
  student: unifiedBlueLoginTheme,
  mentor: unifiedBlueLoginTheme,
  hr: unifiedBlueLoginTheme,
  admin: unifiedBlueLoginTheme,
} satisfies Record<UserRole, LoginRoleTheme>;

function roleThemeStyle(role: UserRole): CSSProperties {
  const theme = roleThemes[role];
  return {
    "--role-accent": theme.accent,
    "--role-accent-strong": theme.accentStrong,
    "--role-soft": theme.soft,
    "--role-border": theme.border,
    "--role-shadow": theme.shadow,
  } as CSSProperties;
}

function loginThemeStyle(role: UserRole): CSSProperties {
  const loginTheme = loginRoleThemes[role];
  return {
    ...roleThemeStyle(role),
    "--login-bg-base": loginTheme.bgBase,
    "--login-label": loginTheme.labelText,
    "--login-wash": loginTheme.wash,
    "--login-panel": loginTheme.panel,
    "--login-panel-alt": loginTheme.panelAlt,
    "--login-preview": loginTheme.preview,
  } as CSSProperties;
}

const riskClass: Record<RiskLevel, string> = {
  低风险: "border-[#32B889]/20 bg-[#32B889]/10 text-[#247B60]",
  中风险: "border-[#C9922E]/22 bg-[#C9922E]/10 text-[#8A641C]",
  高风险: "border-[#C25055]/22 bg-[#C25055]/10 text-[#9A3E43]",
};

const attentionLabel: Record<RiskLevel, string> = {
  低风险: "稳定推进",
  中风险: "需要支持",
  高风险: "重点关注",
};

const loopStatusStyles: Record<LoopStatus, string> = {
  待确认: "border-amber-200 bg-amber-50 text-amber-700",
  进行中: "border-[var(--role-border)] bg-[var(--role-soft)] text-[var(--role-accent)]",
  已完成: "border-emerald-200 bg-emerald-50 text-emerald-700",
  待复盘: "border-rose-200 bg-rose-50 text-rose-700",
};

const mvpScopes = [
  { title: "成长路径", detail: "按岗位提供 30-60-90 天阶段目标、任务和验收标准。", status: "MVP 必做" },
  { title: "导师周反馈", detail: "每周一次轻量评分和 AI 反馈草稿，导师确认后同步。", status: "MVP 必做" },
  { title: "HRBP 成长运营台", detail: "聚合进度、导师反馈完成率、需关注和高潜名单。", status: "MVP 必做" },
  { title: "招聘效能复盘模块", detail: "作为 HRBP 成长运营台里的只读分析模块，反哺下一轮校招画像。", status: "MVP 必做" },
  { title: "自动留用决策", detail: "涉及关键用人判断，首版只提供参考证据。", status: "暂缓" },
];

const permissionBoundaries = [
  { role: "实习生成长端", canSee: "个人成长路径、任务、导师反馈", hidden: "内部关注标签和招聘判断" },
  { role: "导师带教端", canSee: "负责实习生的任务、提问、反馈草稿", hidden: "其他导师带教明细" },
  { role: "HRBP 成长运营台", canSee: "人员池总览、关注原因、协同记录", hidden: "非必要私密沟通原文" },
  { role: "招聘效能复盘模块", canSee: "适岗趋势、高潜/观察摘要、画像反哺建议", hidden: "完整成长记录和私聊细节" },
  { role: "系统管理后台", canSee: "账号角色、实习项目、岗位模板、权限和数据字典", hidden: "非管理员不可见" },
];

const mentorScoreDimensions = ["学习主动性", "任务完成度", "沟通协作", "岗位理解", "成长潜力"];

type MentorScoreMap = Record<(typeof mentorScoreDimensions)[number], number>;

function createDefaultMentorScores(intern: { risk: RiskLevel; progress: number; focus: string }): MentorScoreMap {
  const base = intern.risk === "低风险" ? 4 : intern.risk === "高风险" ? 2 : 3;
  return {
    学习主动性: Math.min(5, base + (intern.progress >= 80 ? 1 : 0)),
    任务完成度: Math.max(1, Math.round(intern.progress / 20)),
    沟通协作: intern.focus.includes("沟通") ? 3 : base,
    岗位理解: intern.focus.includes("业务") || intern.focus.includes("文档") ? Math.max(2, base - 1) : base,
    成长潜力: intern.progress >= 85 ? 5 : base + 1,
  };
}

const aiReliabilityChecks = [
  { label: "规则先判定", detail: "任务完成度、延期次数、导师反馈缺失等硬信号先触发关注候选。" },
  { label: "证据再生成", detail: "AI 只基于任务、成长路径、导师观察和协同记录生成建议，不直接下组织结论。" },
  { label: "人工确认", detail: "导师反馈、HRBP 介入和留用观察必须由对应角色确认后同步。" },
];

const collaborationFlow = ["识别信号", "人工确认", "分派跟进", "复盘沉淀"];

// 招聘画像反哺建议从 managedInterns 派生：按 role 聚合 progress、任务完成度、riskTags，动态生成信号 + 反哺建议
function deriveHiringFeedback(list: ManagedIntern[]): Array<{ segment: string; signal: string; suggestion: string; confidence: string }> {
  const buckets = ["产品", "研发", "销售", "HR"].map((role) => {
    const roleList = list.filter((intern) => intern.role === role);
    const total = roleList.length;
    const avgProgress = total ? Math.round(roleList.reduce((sum, intern) => sum + intern.progress, 0) / total) : 0;
    const completedTasks = roleList.reduce((sum, intern) => sum + intern.tasks.filter((task) => task.status === "已完成").length, 0);
    const totalTasks = roleList.reduce((sum, intern) => sum + intern.tasks.length, 0);
    const completionRate = totalTasks ? Math.round((completedTasks / totalTasks) * 100) : 0;
    const archiveCount = roleList.filter((intern) => intern.status === "已结束").length;
    const activeCount = total - archiveCount;
    const riskTagSet = new Set<string>();
    roleList.forEach((intern) => intern.riskTags.forEach((tag) => riskTagSet.add(tag)));
    const riskCount = roleList.filter((intern) => intern.risk === "中风险" || intern.risk === "高风险").length;
    return { role, total, avgProgress, completionRate, completionTaskCount: completedTasks, totalTasks, archiveCount, activeCount, riskCount, riskTags: Array.from(riskTagSet) };
  });

  const out: Array<{ segment: string; signal: string; suggestion: string; confidence: string }> = [];
  for (const b of buckets) {
    if (b.total === 0) continue;
	    // 4 个岗位都进入卡片列表,空数据走空状态卡
	    const hasData = !(b.avgProgress === 0 && b.totalTasks === 0);
	    if (!hasData) {
	      out.push({ segment: `${b.role}岗 · 暂无任务数据`, signal: "", suggestion: "", confidence: "—" });
	      continue;
	    }
	    const confidence = b.total >= 5 ? "高" : b.total >= 3 ? "中" : "低";
	    const baseSignal = b.avgProgress >= 75
	      ? `${b.role}岗 ${b.activeCount} 名在岗实习生，平均进度 ${b.avgProgress}%，任务完成率 ${b.completionRate}%，整体适岗表现稳定。`
	      : b.avgProgress >= 40
	        ? `${b.role}岗 ${b.activeCount} 名在岗实习生，平均进度 ${b.avgProgress}%，任务完成率 ${b.completionRate}%，呈两极分化，需关注中低进度对象。`
	        : `${b.role}岗 ${b.activeCount} 名在岗实习生，平均进度 ${b.avgProgress}%，早期适应和支持节奏不足。`;
	    const signal = b.riskTags.length > 0
	      ? `${baseSignal} 重点信号：${b.riskTags.slice(0, 3).join("、")}。`
	      : baseSignal;
	    let suggestion: string;
	    if (b.role === "产品") {
	      suggestion = b.avgProgress >= 75
        ? "校招画像继续保持需求评审准备、用户反馈整理等权重，并提升高潜同学的独立需求跟进。"
        : "面试中增加一次需求拆解样题、入职前同步产品 SOP 与业务术语表，验证结构化表达。";
    } else if (b.role === "研发") {
      suggestion = b.avgProgress >= 75
        ? "保持技术题面强度，重点观察工程规范与任务拆解，可邀请稳定同学参与代码走读。"
        : "面试增加代码走读或故障定位题，验证工程化表达；入职前推送开发环境搭建手册。";
    } else if (b.role === "销售") {
      suggestion = b.avgProgress >= 75
        ? "画像保持客户沟通、线索跟进维度，保留挑战任务以验证上限。"
        : "面试加入客户异议处理演练与客户画像题，入职前同步产品学习包与客户场景手册。";
    } else {
      suggestion = b.avgProgress >= 75
        ? "校招画像继续考察流程执行、候选人记录完整度，挑战任务可延展到跨部门协同。"
        : "面试中考察招聘流程熟悉度，入职前同步公司岗位说明书与历史面试评估样例。";
    }
	    out.push({ segment: `${b.role}岗 · ${b.activeCount} 名在岗 · 平均 ${b.avgProgress}%`, signal, suggestion, confidence });
	  }
  return out;
}



function processStatusToLoopStatus(status: ProcessStatus): LoopStatus {
  if (status === "已关闭") return "已完成";
  if (status === "复盘中") return "待复盘";
  if (status === "已同步导师") return "进行中";
  return "待确认";
}

function getTaskDrivenProgress(tasks: GrowthTask[], fallbackProgress: number) {
  if (!tasks.length) return fallbackProgress;
  const completed = tasks.filter((task) => task.status === "已完成").length;
  const taskProgress = Math.round((completed / tasks.length) * 100);
  return Math.max(fallbackProgress, taskProgress);
}

function nextProcessStatusFromRecord(record: Omit<CollaborationRecord, "id" | "createdAt">): ProcessStatus | null {
  const content = `${record.title} ${record.detail}`;
  if (content.includes("复盘") || content.includes("沉淀")) return "复盘中";
  if (record.sourceRole === "HR" && record.targetRole === "HR") return "待 HR 沟通";
  if (record.sourceRole === "HR" && record.targetRole === "导师") return "已同步导师";
  if (record.sourceRole === "导师") return "已同步导师";
  if (record.sourceRole === "实习生" && record.targetRole === "导师") return "已同步导师";
  return record.status === "已同步" ? "已同步导师" : null;
}

function signalSourceForIntern(intern: Intern | ManagedIntern) {
  if ("feedbacks" in intern && intern.feedbacks.length > 0) return "导师反馈";
  if ("tasks" in intern && intern.tasks.some((task) => task.status !== "已完成")) return "任务进度";
  if ("activityLog" in intern && intern.activityLog.some((log) => log.includes("提问"))) return "实习生提问";
  if (intern.risk === "高风险") return "任务延期、导师反馈与低沟通信号共同触发";
  if (intern.risk === "中风险") return "成长进度波动和单项能力短板触发";
  return "HRBP 观察";
}

function sourceRoleToSignalSource(role: CollaborationRecord["sourceRole"]): SignalSource {
  if (role === "实习生") return "student";
  if (role === "导师") return "mentor";
  return "hrbp";
}

function sourceRoleToSignalLabel(role: CollaborationRecord["sourceRole"]) {
  if (role === "实习生") return "来自实习生端";
  if (role === "导师") return "来自导师反馈";
  return "来自 HRBP 端";
}

function recordToSignalType(record: CollaborationRecord): SignalType {
  if (record.question) return "question";
  if (record.sourceRole === "导师") return "feedback";
  if (record.sourceRole === "HR") return record.title.includes("复盘") ? "followup" : "risk";
  return "followup";
}

function statusToSignalStatus(status: CollaborationRecord["status"], answer?: string): SignalStatus {
  if (answer) return "confirmed";
  if (status === "待处理") return "pending";
  if (status === "已创建") return "in_progress";
  return "completed";
}

function processStatusToSignalStatus(status: ProcessStatus): SignalStatus {
  if (status === "已关闭") return "completed";
  if (status === "复盘中") return "review";
  if (status === "已同步导师") return "in_progress";
  return "pending";
}

function signalStatusLabel(status: SignalStatus) {
  const labels: Record<SignalStatus, string> = {
    pending: "待确认",
    confirmed: "已确认",
    in_progress: "进行中跟进",
    completed: "已完成",
    review: "复盘中",
  };
  return labels[status];
}

function buildGrowthSignals(internsList: ManagedIntern[], records: CollaborationRecord[]): GrowthSignal[] {
  const signals: GrowthSignal[] = [];
  internsList.forEach((intern) => {
    const baseStatus = processStatusToSignalStatus(intern.processStatus);
    const hasHrbpSignal = Boolean(intern.reason.trim() || intern.todo.trim() || intern.riskTags.length || intern.processStatus !== "已关闭");
    if (hasHrbpSignal) {
      signals.push({
        id: `risk-${intern.id}`,
        internId: intern.id,
        internName: intern.name,
        mentorName: intern.mentor,
        source: "ai",
        sourceLabel: "HRBP 辅助整理",
        type: "risk",
        title: `${intern.name} 成长信号摘要`,
        description: intern.reason || intern.todo || "HRBP 已记录关注原因，等待人工确认后进入跟进闭环",
        status: baseStatus,
        statusLabel: signalStatusLabel(baseStatus),
        visibleToStudent: false,
        visibleToMentor: true,
        visibleToHrbp: true,
        createdAt: intern.createdAt,
        updatedAt: intern.updatedAt,
      });
    }
    intern.tasks.forEach((task) => {
      const status: SignalStatus = task.status === "已完成" ? "completed" : "in_progress";
      signals.push({
        id: `task-${intern.id}-${task.id}`,
        internId: intern.id,
        internName: intern.name,
        mentorName: intern.mentor,
        source: "student",
        sourceLabel: "来自实习生端",
        type: "task",
        title: task.title,
        description: `${task.owner} · ${task.note || task.due}`,
        status,
        statusLabel: task.status === "已完成" ? "已同步给导师" : "任务进行中",
        visibleToStudent: true,
        visibleToMentor: true,
        visibleToHrbp: true,
        createdAt: intern.createdAt,
        updatedAt: intern.updatedAt,
      });
    });
    intern.feedbacks.forEach((feedback) => {
      signals.push({
        id: `feedback-${intern.id}-${feedback.id}`,
        internId: intern.id,
        internName: intern.name,
        mentorName: feedback.mentor,
        source: "mentor",
        sourceLabel: "来自导师反馈",
        type: "feedback",
        title: `${intern.name} 导师反馈`,
        description: feedback.content,
        status: "confirmed",
        statusLabel: "导师已确认",
        visibleToStudent: true,
        visibleToMentor: true,
        visibleToHrbp: true,
        createdAt: feedback.createdAt,
        updatedAt: intern.updatedAt,
      });
    });
  });
  records.forEach((record) => {
    const intern = internsList.find((item) => item.name === record.internName);
    if (!intern) return;
    const status = statusToSignalStatus(record.status, record.answer);
    signals.push({
      id: `record-${record.id}`,
      internId: intern.id,
      internName: intern.name,
      mentorName: intern.mentor,
      source: sourceRoleToSignalSource(record.sourceRole),
      sourceLabel: sourceRoleToSignalLabel(record.sourceRole),
      type: recordToSignalType(record),
      title: record.title,
      description: record.answer ? `${record.detail}\n回复：${record.answer}` : record.detail,
      status,
      statusLabel: signalStatusLabel(status),
      visibleToStudent: record.targetRole === "实习生" || record.sourceRole === "实习生",
      visibleToMentor: record.targetRole === "导师" || record.sourceRole === "导师",
      visibleToHrbp: true,
      createdAt: record.createdAt,
      updatedAt: record.answeredAt ?? record.createdAt,
      sourceRecordId: record.id,
    });
  });
  return signals;
}

function getVisibleInterns(user: AuthUser, internsList: ManagedIntern[]): ManagedIntern[] {
  // 已结束的实习生进入归档，不出现在日常带教端
  const activeInterns = internsList.filter((intern) => intern.status !== "已结束");

  if (user.role === "student") {
    return activeInterns.filter((intern) => intern.name === user.name);
  }

  if (user.role === "mentor") {
    return activeInterns.filter((intern) =>
      isSameDepartment(intern.department, user.department) &&
      (intern.mentor === user.name || user.ownedInterns?.includes(intern.name)),
    );
  }

  return activeInterns;
}

function getVisibleRecords(user: AuthUser, internsList: ManagedIntern[], records: CollaborationRecord[]): CollaborationRecord[] {
  if (user.role === "hr" || user.role === "admin") return records;

  const visibleInternNames = new Set(getVisibleInterns(user, internsList).map((intern) => intern.name));
  return records.filter((record) => visibleInternNames.has(record.internName));
}

function getVisibleGrowthSignals(user: AuthUser, internsList: ManagedIntern[], records: CollaborationRecord[]): GrowthSignal[] {
  const visibleInterns = getVisibleInterns(user, internsList);
  const visibleRecords = getVisibleRecords(user, internsList, records);
  const signals = buildGrowthSignals(visibleInterns, visibleRecords);

  if (user.role === "student") return signals.filter((signal) => signal.visibleToStudent);
  if (user.role === "mentor") return signals.filter((signal) => signal.visibleToMentor);
  return signals.filter((signal) => signal.visibleToHrbp);
}

function canAssignAction(user: AuthUser): boolean {
  return user.role === "hr" || user.role === "admin";
}

// 导师反馈编辑权限：HRBP / admin 可改全部；mentor 只能改自己署名的反馈；student 不可改
function canEditFeedback(user: AuthUser, feedback: MentorFeedbackRecord): boolean {
  if (user.role === "hr" || user.role === "admin") return true;
  if (user.role === "mentor") {
    return (feedback.mentor || "").trim() === (user.name || "").trim();
  }
  return false;
}

function isGrowthCycleStarted() {
  return startOfDay(new Date(`${demoTodayDate}T00:00:00`)) >= startOfDay(new Date(`${studentCalendarStartDate}T00:00:00`));
}

function emptyInternForm(): InternFormState {
  return {
    name: "",
    role: "产品",
    title: "产品实习生",
    department: "产品部",
    mentor: "王老师",
    week: "第1周",
    progress: 0,
    risk: "低风险",
    reason: "",
    todo: "保持观察",
    processStatus: "待 HR 沟通",
    status: "在岗",
    riskTagsText: "",
  };
}

function internToForm(intern: ManagedIntern): InternFormState {
  return {
    name: intern.name,
    role: intern.role,
    title: intern.title,
    department: intern.department,
    mentor: intern.mentor,
    week: intern.week,
    progress: intern.progress,
    risk: intern.risk,
    reason: intern.reason,
    todo: intern.todo,
    processStatus: intern.processStatus,
    status: intern.status,
    riskTagsText: intern.riskTags.join("、"),
  };
}

type AIGenerationType = "feedback" | "questions" | "report" | "hrAction" | "dailyPlan";

async function requestAiGeneration<T>(type: AIGenerationType, payload: unknown): Promise<AIGenerationResult<T>> {
  const apiBase = import.meta.env.DEV ? (import.meta.env.VITE_API_BASE ?? "http://127.0.0.1:3001") : "";
  const response = await fetch(`${apiBase}/api/generate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ type, payload }),
  });
  const data = await response.json().catch(() => ({}));

  if (!response.ok || data.mocked) {
    const rawError = String(data.error || "");
    const friendlyError = rawError.includes("Unexpected token") || rawError.includes("JSON")
      ? "AI 返回内容格式不稳定，请点击重新生成。"
      : rawError || "AI 服务未连接，请先配置真实 AI 接口。";
    throw new Error(friendlyError);
  }

  if (!data.output) {
    throw new Error("AI 未返回有效内容，请稍后重试。");
  }

  return { output: data.output as T };
}

function readStoredUser(): AuthUser | null {
  try {
    const raw = localStorage.getItem("internflow_user") ?? localStorage.getItem(grownestAuthStorageKey);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as AuthUser & { role?: string };
    if (!parsed.role || !["student", "mentor", "hr", "admin"].includes(parsed.role)) {
      localStorage.removeItem("internflow_user");
      return null;
    }
    return parsed as AuthUser;
  } catch {
    return null;
  }
}

function readCollaborationRecords(): CollaborationRecord[] {
  try {
    const raw = localStorage.getItem(collaborationStorageKey) ?? localStorage.getItem(grownestCollaborationStorageKey);
    return raw ? (JSON.parse(raw) as CollaborationRecord[]) : [];
  } catch {
    return [];
  }
}

function persistCollaborationRecords(records: CollaborationRecord[]): void {
  const serialized = JSON.stringify(records);
  localStorage.setItem(collaborationStorageKey, serialized);
  localStorage.setItem(grownestCollaborationStorageKey, serialized);
}

function readReviewRecords(): ReviewRecord[] {
  try {
    const raw = localStorage.getItem(grownestReviewStorageKey);
    return raw ? (JSON.parse(raw) as ReviewRecord[]) : [];
  } catch {
    return [];
  }
}

function persistReviewRecords(records: ReviewRecord[]): void {
  localStorage.setItem(grownestReviewStorageKey, JSON.stringify(records.slice(0, 30)));
}

function defaultEmailForName(name: string) {
  return `${encodeURIComponent(name).replaceAll("%", "").toLowerCase()}@grownest.demo`;
}

function defaultDepartmentForMentor(name: string) {
  if (name === "李老师") return "研发中心";
  if (name === "陈老师") return "销售部";
  if (name === "王老师") return "产品部";
  return null;
}

function seedMentorAccounts(internsList: ManagedIntern[]): DemoMentorAccount[] {
  const mentorMap = new Map<string, DemoMentorAccount>();
  internsList.forEach((intern) => {
    if (!intern.mentor.trim()) return;
    if (mentorMap.has(intern.mentor)) return;
    mentorMap.set(intern.mentor, {
      id: createId("mentor"),
      name: intern.mentor,
      email: defaultEmailForName(intern.mentor),
      department: defaultDepartmentForMentor(intern.mentor) ?? intern.department,
      status: "active",
      createdAt: intern.createdAt,
    });
  });
  return Array.from(mentorMap.values());
}

function readMentorAccounts(internsList: ManagedIntern[]): DemoMentorAccount[] {
  const seeded = seedMentorAccounts(internsList);
  try {
    const raw = localStorage.getItem(grownestMentorStorageKey);
    if (!raw) return seeded;
    const stored = JSON.parse(raw) as DemoMentorAccount[];
    const merged = new Map<string, DemoMentorAccount>();
    [...seeded, ...stored].forEach((mentor) => {
      if (!mentor.name.trim()) return;
      merged.set(mentor.name, {
        ...mentor,
        department: defaultDepartmentForMentor(mentor.name) ?? mentor.department,
      });
    });
    return Array.from(merged.values());
  } catch {
    return seeded;
  }
}

function persistMentorAccounts(mentors: DemoMentorAccount[]) {
  localStorage.setItem(grownestMentorStorageKey, JSON.stringify(mentors));
}

function readDemoInternPrograms(): DemoInternProgram[] {
  const seeded: DemoInternProgram[] = [
    {
      id: "program-default-2026-06",
      name: "实习生成长人才池",
      startDate: "2026-06-15",
      endDate: "2026-09-12",
      status: "active",
    },
  ];
  const legacyNameWords = [String.fromCharCode(22799, 20196, 33829), String.fromCharCode(25209, 27425)];
  const normalizeProjectName = (name: string) =>
    legacyNameWords.some((word) => name.includes(word)) ? "实习生成长人才池" : name;
  try {
    const raw = localStorage.getItem(grownestProgramStorageKey) ?? localStorage.getItem(legacyGrownestProgramStorageKey);
    const stored = raw ? (JSON.parse(raw) as DemoInternProgram[]) : seeded;
    return stored.map((item) => ({
      ...item,
      name: normalizeProjectName(item.name),
    }));
  } catch {
    return seeded;
  }
}

function persistDemoInternPrograms(programs: DemoInternProgram[]) {
  const serialized = JSON.stringify(programs);
  localStorage.setItem(grownestProgramStorageKey, serialized);
  localStorage.setItem(legacyGrownestProgramStorageKey, serialized);
}

function publicUser(user: MockUser): AuthUser {
  return {
    username: user.username,
    role: user.role,
    roleLabel: user.roleLabel,
    name: user.name,
    title: user.title,
    department: user.department,
    mentor: user.mentor,
    scope: user.scope,
    ownedInterns: user.ownedInterns,
  };
}

function LogoMark({ compact = false }: { compact?: boolean }) {
  return (
    <div
      className={cn(
        "fx-logo relative shrink-0 overflow-hidden rounded-xl border border-[#BFDBFE] bg-white/72 shadow-sm",
        compact ? "h-9 w-9" : "h-12 w-12",
      )}
    >
      <svg viewBox="0 0 64 64" aria-hidden="true" className="h-full w-full">
        <circle cx="32" cy="32" r="21" fill="none" stroke="#2563EB" strokeOpacity="0.16" strokeWidth="2" />
        <path d="M18 36c8-12 20-15 30-7" fill="none" stroke="#241A48" strokeLinecap="round" strokeWidth="3.4" />
        <path d="M23 40c7-6 15-7 24-2" fill="none" stroke="#2563EB" strokeLinecap="round" strokeWidth="3.4" />
        <path d="M33 21c-2.4 5.6-2.1 10.4.8 14.4" fill="none" stroke="#32B889" strokeLinecap="round" strokeWidth="3.4" />
      </svg>
    </div>
  );
}

function BrandLogo({ small = false }: { small?: boolean }) {
  return (
    <div className="flex min-w-0 items-center gap-3">
      <LogoMark compact={small} />
      <div className="min-w-0">
        <div className={cn("whitespace-nowrap font-black leading-none tracking-[0]", small ? "text-sm" : "text-xl sm:text-2xl")}>
          <span className="inline-block text-[#241A48]">GrowNest</span>
          <span className="ml-2 inline-block text-[#171321]">鹅苗成长舱</span>
        </div>
        {!small && <p className="mt-2 text-sm text-[#6F6A7A]">让实习生成长可见，让导师带教有序，让 HR 协同更轻。</p>}
      </div>
    </div>
  );
}

function Card({ className, children, ...props }: HTMLAttributes<HTMLElement> & { children: ReactNode }) {
  return (
    <section
      className={cn(
        "future-card fx-reveal rounded-[16px] border border-[#504678]/12 bg-white/70 p-5 shadow-[0_1px_2px_rgba(36,26,72,0.04)] backdrop-blur-[18px]",
        className,
      )}
      data-gsap-hover=""
      {...props}
    >
      {children}
    </section>
  );
}

function Button({
  className,
  variant = "primary",
  children,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "primary" | "soft" | "ghost" }) {
  return (
    <button
      className={cn(
        "fx-button inline-flex items-center justify-center gap-2 rounded-[8px] px-3.5 py-2 text-sm font-medium transition active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-55",
        variant === "primary" && "border border-[#2563EB] bg-[#2563EB] text-white shadow-none hover:border-[#143C9B] hover:bg-[#143C9B]",
        variant === "soft" && "border border-[#BFDBFE] bg-[#2563EB]/7 text-[#2563EB] hover:border-[#2563EB]/20 hover:bg-[#2563EB]/10",
        variant === "ghost" && "border border-[#504678]/12 bg-white/50 text-[#6F6A7A] hover:border-[#504678]/18 hover:bg-white/74 hover:text-[#171321]",
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}

function AttentionBadge({ risk }: { risk: RiskLevel }) {
  return <span className={cn("inline-flex items-center rounded-md border px-2.5 py-1 text-xs font-semibold", riskClass[risk])}>{attentionLabel[risk]}</span>;
}

function StatusPill({ status }: { status: string }) {
  const styles: Record<string, string> = {
    已完成: "border-emerald-200 bg-emerald-50 text-emerald-700",
    进行中: "border-[var(--role-border)] bg-[var(--role-soft)] text-[var(--role-accent)]",
    待确认: loopStatusStyles.待确认,
    待复盘: loopStatusStyles.待复盘,
    未开始: "border-slate-200 bg-slate-100 text-slate-500",
    未完成: "border-slate-200 bg-slate-100 text-slate-600",
  };

  return <span className={cn("inline-flex items-center rounded-md border px-2.5 py-1 text-xs font-bold", styles[status] ?? styles.未开始)}>{status}</span>;
}

function SyncFlowBadge({ record, compact = false }: { record: Pick<CollaborationRecord, "sourceRole" | "targetRole">; compact?: boolean }) {
  const sourceText = record.sourceRole === "HR" ? "HRBP" : record.sourceRole;
  const targetText = record.targetRole === "HR" ? "HRBP" : record.targetRole;
  return (
    <span className={cn(
      "inline-flex shrink-0 items-center gap-1 rounded-full bg-white font-bold text-[var(--role-accent)] ring-1 ring-[var(--role-border)]",
      compact ? "px-2 py-0.5 text-[11px]" : "px-2.5 py-1 text-xs",
    )}>
      <span>来自{sourceText}</span>
      <ChevronRight className="h-3 w-3" />
      <span>同步{targetText}</span>
    </span>
  );
}

function hasSyncFlow(record: unknown): record is Pick<CollaborationRecord, "sourceRole" | "targetRole"> {
  if (!record || typeof record !== "object") return false;
  const maybe = record as { sourceRole?: unknown; targetRole?: unknown };
  return (
    (maybe.sourceRole === "实习生" || maybe.sourceRole === "导师" || maybe.sourceRole === "HR") &&
    (maybe.targetRole === "实习生" || maybe.targetRole === "导师" || maybe.targetRole === "HR")
  );
}

function LoopStatusPill({ status }: { status: LoopStatus }) {
  return <span className={cn("inline-flex items-center rounded-md border px-2.5 py-1 text-xs font-semibold", loopStatusStyles[status])}>{status}</span>;
}
function HrbpSignalPanel({
  signals,
  internsList,
  onAddRecord,
  onAddReview,
  canManageActions,
}: {
  signals: GrowthSignal[];
  internsList: ManagedIntern[];
  onAddRecord: (record: Omit<CollaborationRecord, "id" | "createdAt">) => void;
  onAddReview: (review: Omit<ReviewRecord, "id" | "createdAt">) => void;
  canManageActions: boolean;
}) {
  const [mentorFilter, setMentorFilter] = useState("全部");
  const [roleFilter, setRoleFilter] = useState("全部");
  const [statusFilter, setStatusFilter] = useState("全部");

  const mentorOptions = Array.from(new Set(internsList.map((intern) => intern.mentor))).filter(Boolean);
  const roleOptions = Array.from(new Set(internsList.map((intern) => intern.role))).filter(Boolean);
  const visibleSignals = signals
    .filter((signal) => signal.visibleToHrbp)
    .filter((signal) => mentorFilter === "全部" || signal.mentorName === mentorFilter)
    .filter((signal) => roleFilter === "全部" || internsList.find((intern) => intern.id === signal.internId)?.role === roleFilter)
    .filter((signal) => statusFilter === "全部" || signal.statusLabel === statusFilter)
    .slice(0, 10);

  const assignMentorFollowup = (signal: GrowthSignal) => {
    onAddRecord({
      internName: signal.internName,
      sourceRole: "HR",
      targetRole: "导师",
      title: `${signal.internName} 跟进行动已分派`,
      detail: `基于「${signal.title}」：请导师补充下一步带教动作，并在确认后同步给 HRBP。`,
      status: "已创建",
    });
  };

  const assignStudentAction = (signal: GrowthSignal) => {
    onAddRecord({
      internName: signal.internName,
      sourceRole: "HR",
      targetRole: "实习生",
      title: `${signal.internName} 行动建议已同步`,
      detail: `基于「${signal.title}」：请实习生补充一次行动记录或阶段产出，完成后回流 HRBP 复盘。`,
      status: "已创建",
    });
  };

  const markReviewRecord = (signal: GrowthSignal) => {
    const targetIntern = internsList.find((intern) => intern.name === signal.internName);
    onAddRecord({
      internName: signal.internName,
      sourceRole: "HR",
      targetRole: "HR",
      title: `${signal.internName} 复盘记录已沉淀`,
      detail: `基于「${signal.title}」完成人工确认，进入跟进闭环与复盘沉淀。`,
      status: "已创建",
    });
    onAddReview({
      internName: signal.internName,
      signalTitle: signal.title,
      signalType: signal.type,
      conclusion: `已确认${signal.statusLabel}，结论：当前阶段按原计划推进`,
      nextStep: targetIntern?.todo || "继续按导师反馈节奏推进",
      reviewer: "HRBP",
    });
  };

  return (
    <Card className="glass-panel" data-list-panel="">
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
          <SectionTitle
            icon={ShieldCheck}
            title="全局成长信号池"
            subtitle="只处理已经由任务、提问、导师反馈或 HRBP 记录触发的成长信号；基础账号档案不在这里判断"
          />
          <div className="grid gap-2 sm:grid-cols-3 xl:min-w-[420px]">
            {[
              { label: "导师", value: mentorFilter, onChange: setMentorFilter, options: mentorOptions },
              { label: "岗位", value: roleFilter, onChange: setRoleFilter, options: roleOptions },
              { label: "状态", value: statusFilter, onChange: setStatusFilter, options: Array.from(new Set(signals.map((signal) => signal.statusLabel))) },
            ].map((filter) => (
              <label key={filter.label} className="text-xs font-bold text-slate-500">
                {filter.label}
                <select
                  value={filter.value}
                  onChange={(event) => filter.onChange(event.target.value)}
                  className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-800 outline-none transition focus:border-[var(--role-accent)] focus:ring-2 focus:ring-[var(--role-soft)]"
                >
                  <option value="全部">全部</option>
                  {filter.options.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </label>
            ))}
          </div>
        </div>
        <div className="rounded-xl border border-[#BFDBFE] bg-[#EFF6FF] px-4 py-3 text-sm leading-6 text-[#1D4ED8]">
          <strong className="font-black">这个模块用于：</strong>
          识别需要 HRBP 人工确认的成长线索，并决定下一步是同步导师跟进、分派实习生行动，还是沉淀为复盘记录。
        </div>
      </div>
      <div className="mt-5 grid gap-3">
        {visibleSignals.length > 0 ? (
          visibleSignals.map((signal) => (
            <div key={signal.id} className="rounded-xl border border-slate-100 bg-white/84 p-4 shadow-[0_10px_24px_rgba(15,23,42,0.04)]">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2 text-xs font-bold">
                    <span className="rounded-md bg-[var(--role-soft)] px-2 py-1 text-[var(--role-accent)]">{signal.sourceLabel}</span>
                    <span className="rounded-md bg-slate-100 px-2 py-1 text-slate-600">{signal.statusLabel}</span>
                    <span className="text-slate-400">{signal.mentorName} · {signal.internName}</span>
                  </div>
                  <p className="mt-3 text-base font-black text-slate-950">{signal.title}</p>
                  <p className="mt-2 text-sm leading-6 text-slate-600">{signal.description}</p>
                </div>
                {canManageActions && (
                  <div className="flex shrink-0 flex-wrap gap-2 lg:justify-end">
                    <button
                      type="button"
                      onClick={() => assignMentorFollowup(signal)}
                      className="inline-flex items-center gap-2 rounded-lg border border-[#BFDBFE] bg-white px-3 py-2 text-xs font-black text-[#2563EB] transition hover:bg-[#EFF6FF]"
                    >
                      <Send className="h-4 w-4" />
                      同步导师跟进
                    </button>
                    <button
                      type="button"
                      onClick={() => assignStudentAction(signal)}
                      className="inline-flex items-center gap-2 rounded-lg border border-amber-100 bg-amber-50 px-3 py-2 text-xs font-black text-amber-700 transition hover:bg-amber-100"
                    >
                      <UserCheck className="h-4 w-4" />
                      分派学生行动
                    </button>
                    <button
                      type="button"
                      onClick={() => markReviewRecord(signal)}
                      className="inline-flex items-center gap-2 rounded-lg border border-emerald-100 bg-emerald-50 px-3 py-2 text-xs font-black text-emerald-700 transition hover:bg-emerald-100"
                    >
                      <CheckCircle2 className="h-4 w-4" />
                      标记进入复盘
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))
        ) : (
          <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-6 text-sm leading-6 text-slate-500">
            <p className="font-black text-slate-700">当前暂无需要处理的成长信号。</p>
            <p className="mt-1">这不代表 20 位同学已经完成评估，只表示学生端任务、导师反馈、提问或 HRBP 关注记录还没有触发待处理线索。请在“人员池花名册”查看基础档案，在“项目与账号管理”录入任务或反馈。</p>
          </div>
        )}
      </div>
    </Card>
  );
}

function HrbpActionLoopSummary({
  growthSignals,
  managedInterns,
  pendingHrReview,
  pendingMentorSync,
  inReview,
  activeFollowups,
  completedReviews,
  activeRecords,
  onOpenWorkspace,
}: {
  growthSignals: GrowthSignal[];
  managedInterns: ManagedIntern[];
  pendingHrReview: number;
  pendingMentorSync: number;
  inReview: number;
  activeFollowups: number;
  completedReviews: number;
  activeRecords: CollaborationRecord[];
  onOpenWorkspace: () => void;
}) {
  const inProgressCount = activeFollowups + inReview;
  const reviewRate = completedReviews + inReview > 0
    ? Math.round((completedReviews / (completedReviews + inReview)) * 100)
    : 0;
  const topActions = [
    ...managedInterns.filter((i) => i.processStatus === "待 HR 沟通").slice(0, 2),
    ...managedInterns.filter((i) => i.processStatus === "已同步导师").slice(0, 1),
  ].slice(0, 3);

  return (
    <Card className="glass-panel border-[var(--role-border)]/40 bg-gradient-to-br from-white/90 via-white/78 to-[var(--role-soft)]/40 p-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-[11px] font-black uppercase tracking-[0.16em] text-[var(--role-accent)]">Action Loop</p>
            <span className="rounded-md border border-slate-200 bg-slate-50 px-2 py-0.5 text-[10px] font-bold text-slate-500">{growthSignals.length} 条信号</span>
          </div>
          <h3 className="mt-1 text-lg font-black text-slate-950">行动闭环 · 今日推进</h3>
          <p className="mt-1 text-xs font-semibold text-slate-500">从识别信号到复盘沉淀，每条动作都跑得完、有据可查</p>
        </div>
        <Button variant="soft" onClick={onOpenWorkspace} className="shrink-0">
          打开工作台
          <ChevronRight className="h-3.5 w-3.5" />
        </Button>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-3 md:grid-cols-4">
        {[
          { label: "进行中", value: String(inProgressCount), hint: "分派 + 复盘中" },
          { label: "待确认", value: String(pendingHrReview + pendingMentorSync), hint: "HR 沟通 + 导师分派" },
          { label: "本周完成", value: String(activeRecords.length), hint: "跨端协同记录" },
          { label: "复盘率", value: `${reviewRate}%`, hint: "已完成 / 闭环总数" },
        ].map((m) => (
          <div key={m.label} className="rounded-2xl border border-white/55 bg-white/78 p-3.5">
            <p className="text-[10px] font-bold uppercase tracking-wide text-slate-500">{m.label}</p>
            <p className="mt-1 text-xl font-black text-slate-950">{m.value}</p>
            <p className="mt-0.5 text-[10px] font-semibold text-slate-500">{m.hint}</p>
          </div>
        ))}
      </div>

      {topActions.length > 0 ? (
        <div className="mt-5">
          <p className="text-[11px] font-black uppercase tracking-wide text-slate-500">今日待推进</p>
          <ul className="mt-2 space-y-1.5">
            {topActions.map((intern) => (
              <li key={intern.id} className="flex items-center justify-between gap-3 rounded-xl border border-slate-100 bg-white/78 px-3 py-2">
                <div className="min-w-0">
                  <p className="truncate text-sm font-black text-slate-950">{intern.name} <span className="text-xs font-semibold text-slate-500">· {intern.role}</span></p>
                  <p className="truncate text-[11px] font-semibold text-slate-500">{intern.todo || intern.reason}</p>
                </div>
                <span className="shrink-0 rounded-md bg-[var(--role-soft)] px-2 py-0.5 text-[10px] font-bold text-[var(--role-accent)] ring-1 ring-[var(--role-border)]">
                  {intern.processStatus}
                </span>
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <div className="mt-5 rounded-2xl border border-dashed border-slate-200 bg-slate-50/60 px-4 py-5 text-center">
          <p className="text-sm font-semibold text-slate-500">今日没有待推进的动作</p>
          <p className="mt-1 text-[11px] text-slate-400">学生端录入任务或导师反馈后，信号会进入这里</p>
        </div>
      )}
    </Card>
  );
}

function HrbpActionLoopWorkspace({
  growthSignals,
  managedInterns,
  reviewRecords,
  onOpenSignals,
}: {
  growthSignals: GrowthSignal[];
  managedInterns: ManagedIntern[];
  reviewRecords: ReviewRecord[];
  onOpenSignals: () => void;
}) {
  type KanbanItem = {
    id: string;
    name: string;
    reason: string;
    meta: string;
    role?: string;
    week?: string;
    progress: number;
    risk: RiskLevel | null;
    action: string;
    isReview: boolean;
  };
  const visibleSignals = growthSignals.filter((s) => s.visibleToHrbp);
  const stageIdentify: KanbanItem[] = visibleSignals.slice(0, 6).map((s) => ({
    id: s.id,
    name: s.internName,
    reason: s.title,
    meta: s.sourceLabel + " · " + s.createdAt,
    progress: 0,
    risk: null,
    action: "去确认",
    isReview: false,
  }));
  const stageConfirm: KanbanItem[] = managedInterns
    .filter((i) => i.processStatus === "待 HR 沟通")
    .map((i) => ({
      id: i.id,
      name: i.name,
      role: i.role,
      week: i.week,
      progress: i.progress,
      risk: i.progress > 0 ? i.risk : null,
      reason: i.reason,
      meta: i.mentor ? "导师 " + i.mentor : "未分配",
      action: "确认分派",
      isReview: false,
    }));
  const stageAssign: KanbanItem[] = managedInterns
    .filter((i) => i.processStatus === "已同步导师")
    .map((i) => ({
      id: i.id,
      name: i.name,
      role: i.role,
      week: i.week,
      progress: i.progress,
      risk: i.progress > 0 ? i.risk : null,
      reason: i.todo || i.reason,
      meta: i.mentor ? "导师 " + i.mentor : "未分配",
      action: "进入复盘",
      isReview: false,
    }));
  const stageReview: KanbanItem[] = [
    ...managedInterns
      .filter((i) => i.processStatus === "复盘中")
      .map((i) => ({
        id: i.id,
        name: i.name,
        role: i.role,
        week: i.week,
        progress: i.progress,
        risk: i.progress > 0 ? i.risk : null,
        reason: i.todo || "等待阶段结论",
        meta: i.mentor || "—",
        action: "标记完成",
        isReview: false,
      })),
    ...reviewRecords.slice(0, 4).map((r) => ({
      id: r.id,
      name: r.internName,
      reason: r.conclusion,
      meta: r.createdAt + " · " + r.reviewer,
      progress: 0,
      risk: null,
      action: "已沉淀",
      isReview: true,
    })),
  ];

  const columns: Array<{ key: string; label: string; hint: string; items: KanbanItem[] }> = [
    { key: "identify", label: "识别信号", hint: "从学生 / 导师 / HRBP 端自动整理", items: stageIdentify },
    { key: "confirm", label: "人工确认", hint: "HRBP 判断是否需要介入", items: stageConfirm },
    { key: "assign", label: "分派跟进", hint: "已同步导师，等待反馈回流", items: stageAssign },
    { key: "review", label: "复盘沉淀", hint: "阶段结论，可追溯", items: stageReview },
  ];

  return (
    <Card className="glass-panel" data-list-panel="">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <SectionTitle
          icon={ListChecks}
          title="行动闭环工作台"
          subtitle="识别 → 确认 → 分派 → 复盘，每条动作都有归属和证据"
        />
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 rounded-xl border border-slate-100 bg-white/72 px-3 py-2 text-[11px] font-bold text-slate-600">
          {columns.map((c, i) => (
            <span key={c.key} className="inline-flex items-center gap-1.5">
              {i > 0 && <ChevronRight className="h-3 w-3 text-slate-300" />}
              <span className="text-slate-950">{c.items.length}</span>
              <span className="text-slate-500">{c.label}</span>
            </span>
          ))}
        </div>
      </div>
      <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {columns.map((col, idx) => (
          <div key={col.key} className="flex h-full flex-col rounded-2xl border border-slate-100 bg-white/72">
            <div className="rounded-t-2xl border-b border-slate-100 bg-slate-50/60 px-3.5 py-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="flex h-6 w-6 items-center justify-center rounded-md bg-[var(--role-soft)] text-[10px] font-black text-[var(--role-accent)] ring-1 ring-[var(--role-border)]">
                    {idx + 1}
                  </span>
                  <p className="text-sm font-black text-slate-950">{col.label}</p>
                </div>
                <span className="rounded-md bg-white px-2 py-0.5 text-[10px] font-bold text-slate-600 ring-1 ring-slate-200">
                  {col.items.length}
                </span>
              </div>
              <p className="mt-1 text-[10px] font-semibold text-slate-500">{col.hint}</p>
            </div>
            <div className="flex-1 space-y-2 px-3 py-3">
              {col.items.length === 0 ? (
                <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/60 px-3 py-6 text-center text-[11px] text-slate-500">
                  暂无待处理
                </div>
              ) : (
                col.items.map((item) => (
                  <div key={item.id} className="rounded-xl border border-slate-100 bg-white p-2.5">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-xs font-black text-slate-950">{item.name}</p>
                      {item.risk && <AttentionBadge risk={item.risk} />}
                    </div>
                    {(item.role || item.week) && (
                      <p className="mt-0.5 text-[10px] font-semibold text-slate-500">{item.role}{item.week ? " · " + item.week : ""}</p>
                    )}
                    {typeof item.progress === "number" && item.progress > 0 && (
                      <div className="mt-2 flex items-center gap-1.5">
                        <div className="h-1 flex-1 rounded-full bg-slate-200">
                          <div className="h-1 rounded-full bg-[#31B88A]" style={{ width: `${item.progress}%` }} />
                        </div>
                        <span className="text-[9px] font-black text-slate-600">{item.progress}%</span>
                      </div>
                    )}
                    <p className="mt-2 line-clamp-2 text-[11px] leading-5 text-slate-600">{item.reason}</p>
                    <div className="mt-2 flex items-center justify-between">
                      <span className="text-[9px] font-semibold text-slate-400">{item.meta}</span>
                      {!item.isReview && (
                        <button
                          onClick={onOpenSignals}
                          className="inline-flex items-center gap-0.5 text-[10px] font-bold text-[var(--role-accent)] hover:underline"
                        >
                          {item.action}
                          <ChevronRight className="h-3 w-3" />
                        </button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}

function FeedbackNotice({
  tone,
  children,
  className,
  ...props
}: HTMLAttributes<HTMLParagraphElement> & { tone: "success" | "error" | "info" | "warning"; children: ReactNode }) {
  return (
    <p className={cn("app-feedback px-4 py-3 text-sm font-bold", `app-feedback-${tone}`, className)} {...props}>
      {children}
    </p>
  );
}

function SectionTitle({ icon: Icon, title, subtitle }: { icon: ElementType; title: string; subtitle?: string }) {
  return (
      <div className="flex items-start gap-3">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[8px] bg-[#2563EB]/7 text-[#2563EB] ring-1 ring-[#BFDBFE]">
        <Icon className="h-[18px] w-[18px]" />
      </div>
      <div>
        <h2 className="text-sm font-semibold tracking-[0] text-[#171321]">{title}</h2>
        {subtitle && <p className="mt-1 text-sm text-[#6F6A7A]">{subtitle}</p>}
	              </div>
		            </div>
  );
}
function MeasuredChart({
  height = 288,
  minWidth = 280,
  children,
  className,
}: {
  height?: number;
  minWidth?: number;
  children: (width: number, height: number) => ReactNode;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [width, setWidth] = useState(0);

  useEffect(() => {
    if (!ref.current) return;
    const element = ref.current;
    const observer = new ResizeObserver(([entry]) => {
      setWidth(Math.max(minWidth, Math.floor(entry.contentRect.width)));
    });
    observer.observe(element);
    setWidth(Math.max(minWidth, Math.floor(element.getBoundingClientRect().width)));
    return () => observer.disconnect();
  }, [minWidth]);

  return (
    <div ref={ref} className={cn("mt-4 min-w-0", className)} style={{ height }}>
      {width > 0 && children(width, height)}
    </div>
  );
}

function RoleCollaborationShowcase() {
  const showcaseRef = useRef<HTMLDivElement | null>(null);
  const collaborationShowcaseRoles = [
    { id: "student", label: "Student", accent: "#2563EB", soft: "rgba(37,99,235,0.08)" },
    { id: "mentor", label: "Mentor", accent: "#2563EB", soft: "rgba(37,99,235,0.08)" },
    { id: "hr", label: "HRBP", accent: "#2563EB", soft: "rgba(37,99,235,0.08)" },
  ];

  useGSAP(
    () => {
      if (!showcaseRef.current) return;
      const ctx = gsap.context(() => {
        if (shouldReduceMotion()) {
          gsap.set("[data-role-showcase-reveal]", { autoAlpha: 1, y: 0 });
          return;
        }
        gsap
          .timeline({ defaults: { ease: "power3.out" } })
          .from("[data-role-showcase-copy]", { autoAlpha: 0, y: 18, duration: 0.46 })
          .from("[data-role-showcase-tabs]", { autoAlpha: 0, y: 14, scale: 0.985, duration: 0.38 }, "-=0.18")
          .from("[data-role-flow-node]", { autoAlpha: 0, y: 8, stagger: 0.08, duration: 0.28 }, "-=0.18");

        const flowTl = gsap.timeline({ repeat: -1, repeatDelay: 0.8, delay: 0.7 });
        flowTl
          .fromTo("[data-role-flow-line]", { scaleX: 0, autoAlpha: 1, transformOrigin: "left center" }, { scaleX: 1, duration: 1.35, ease: "power2.inOut" })
          .to("[data-role-flow-node]", { color: "#17324D", y: -2, stagger: 0.18, duration: 0.24, ease: "power2.out" }, "<0.1")
          .to("[data-role-flow-line]", { autoAlpha: 0, duration: 0.35, delay: 0.4 })
          .set("[data-role-flow-line]", { autoAlpha: 1, scaleX: 0 })
          .to("[data-role-flow-node]", {
            color: (_, target) => (target as HTMLElement).dataset.accent ?? "#5F6978",
            y: 0,
            duration: 0.2,
          }, "<");

        gsap.to("[data-role-showcase-tab]", {
          y: -5,
          duration: 0.42,
          ease: "sine.inOut",
          repeat: -1,
          yoyo: true,
          repeatDelay: 1.45,
          stagger: { each: 0.22, repeat: -1, repeatDelay: 1.9 },
        });
      }, showcaseRef);
      return () => ctx.revert();
    },
    { scope: showcaseRef },
  );

  return (
    <div
      ref={showcaseRef}
      className="role-collab-showcase capability-summary relative overflow-hidden rounded-[20px] border border-[#D8DEE6] bg-white/76 p-6"
      data-capability-summary=""
      data-role-showcase-reveal=""
    >
      <p className="text-sm leading-7 text-[#5F6978]" data-role-showcase-copy="">
        GrowNest 将 <span className="text-[#17324D]">任务进度</span>、<span className="text-[#17324D]">导师反馈</span> 与 <span className="text-[#17324D]">HRBP 跟进</span> 连接起来，让每一次成长信号都能被确认、跟进并沉淀为复盘记录。
      </p>

      <div className="role-collab-tabs mt-5 rounded-[14px] border border-[#D8DEE6] bg-[#F8FAFC] p-1.5" data-role-showcase-tabs="">
        <div className="grid grid-cols-3 gap-1.5 text-center font-semibold">
          {collaborationShowcaseRoles.map(({ id, label, accent, soft }) => (
            <div
              key={id}
              className="role-collab-tab flex min-h-[48px] items-center justify-center rounded-[11px] border border-transparent bg-white/74 px-3 py-3 text-[#17324D]"
              style={{ color: accent, "--role-tab-accent": accent, "--role-tab-soft": soft } as CSSProperties}
              data-role-showcase-tab=""
            >
              {label}
            </div>
          ))}
        </div>
      </div>

      <div className="role-flow-strip relative mt-5 overflow-hidden rounded-[14px] border border-[#D8DEE6] bg-white/72 px-3 py-3">
        <div className="role-flow-track relative flex items-center justify-between gap-2 text-[11px] font-semibold text-[#5F6978]">
          <span className="role-flow-line" data-role-flow-line="" />
          {[
            ["成长输入", "#2563EB", "rgba(37,99,235,0.10)"],
            ["反馈确认", "#2563EB", "rgba(37,99,235,0.10)"],
            ["HR 跟进", "#2563EB", "rgba(37,99,235,0.10)"],
          ].map(([item, accent, soft]) => (
            <span
              key={item}
              className="role-flow-node relative z-10 rounded-full border border-[#D8DEE6] bg-white px-3 py-2 shadow-sm"
              style={{ color: accent, "--role-flow-accent": accent, "--role-flow-soft": soft } as CSSProperties}
              data-accent={accent}
              data-role-flow-node=""
            >
              {item}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

function HomePage({ onNavigate }: { onNavigate: (path: Path) => void }) {
  const homeRef = useRef<HTMLElement | null>(null);
  const capabilityRef = useRef<HTMLElement | null>(null);
  const [activeWorkbenchIndex, setActiveWorkbenchIndex] = useState(0);
  useHomeHeroAnimation(homeRef);
  useHomeCapabilityAnimation(capabilityRef);

  const roleCards = [
    {
      id: "student",
      label: "Student",
      title: "成长路径",
      body: "本周任务与阶段目标",
      detail: "把 30-60-90 天目标拆成每日行动",
      accent: "#2563EB",
      soft: "rgba(37,99,235,0.07)",
      icon: GraduationCap,
      depth: 1.15,
    },
    {
      id: "mentor",
      label: "Mentor",
      title: "导师反馈",
      body: "观察记录与反馈确认",
      detail: "把带教经验沉淀为可复盘建议",
      accent: "#2563EB",
      soft: "rgba(37,99,235,0.07)",
      icon: MessageSquareText,
      depth: 1.35,
    },
    {
      id: "hr",
      label: "HR",
      title: "风险洞察",
      body: "关注队列与跟进闭环",
      detail: "只展示经过人工确认的跟进线索",
      accent: "#2563EB",
      soft: "rgba(37,99,235,0.07)",
      icon: LayoutDashboard,
      depth: 1.55,
    },
  ];

  const productModules = [
    {
      title: "实习生成长路径",
      detail: "汇聚阶段目标、周任务与导师提问，形成可跟进的成长记录。",
      accent: "#2563EB",
      statusAccent: "#2563EB",
      chips: ["阶段目标", "本周任务", "导师提问"],
      flow: ["阶段目标", "本周任务", "导师提问"],
      summary: "成长信号采集",
      icon: GraduationCap,
      workbenchTitle: "实习生成长工作台",
      workbenchMeta: "Student Portal · Growth Workspace",
      workbenchItems: ["阶段目标：明确当前成长方向", "成长任务：拆解阶段行动清单", "导师提问：沉淀待确认问题"],
    },
    {
      title: "导师反馈确认",
      detail: "将导师观察转成反馈建议，并由导师确认后同步。",
      accent: "#2563EB",
      statusAccent: "#2563EB",
      chips: ["观察记录", "反馈建议", "同步确认"],
      flow: ["观察记录", "反馈建议", "同步确认"],
      summary: "导师确认",
      icon: MessageSquareText,
      workbenchTitle: "导师反馈工作台",
      workbenchMeta: "Mentor Portal · Feedback Workspace",
      workbenchItems: ["观察记录：沉淀带教过程信息", "反馈建议：生成结构化反馈建议", "同步确认：确认后同步 HR 跟进"],
    },
    {
      title: "HR 风险洞察",
      detail: "辅助识别成长阻塞点，供 HR 确认跟进行动。",
      accent: "#2563EB",
      statusAccent: "#2563EB",
      chips: ["风险信号", "跟进建议", "复盘记录"],
      flow: ["风险信号", "跟进建议", "复盘记录"],
      summary: "组织跟进输出",
      icon: ShieldCheck,
      workbenchTitle: "HR 风险洞察台",
      workbenchMeta: "HR Portal · Risk Insight",
      workbenchItems: ["风险信号：识别成长阻塞点", "跟进建议：提示可支持动作", "复盘记录：沉淀可追踪闭环"],
    },
  ];

  const capabilityFlowNodes = [
    {
      id: "input",
      label: "成长信号采集",
      detail: "任务 / 打卡 / 导师观察",
      description: "汇聚实习生成长过程数据",
      stage: "信号采集",
      color: "#2563EB",
    },
    {
      id: "parse",
      label: "AI 结构化解析",
      detail: "摘要 / 归因 / 优先级",
      description: "将分散信息转化为信号",
      stage: "结构化解析",
      color: "#3B82F6",
    },
    {
      id: "mentor",
      label: "导师反馈确认",
      detail: "观察 / 反馈 / 建议",
      description: "沉淀结构化带教动作",
      stage: "导师确认",
      color: "#60A5FA",
    },
    {
      id: "risk",
      label: "HR 风险洞察",
      detail: "风险 / 适岗 / 队列",
      description: "提前识别需关注对象",
      stage: "HR 确认",
      color: "#2563EB",
    },
    {
      id: "loop",
      label: "行动闭环复盘",
      detail: "同步 / 跟进 / 复盘",
      description: "形成可追踪改进闭环",
      stage: "闭环复盘",
      color: "#143C9B",
    },
  ];

  const actionLoopSteps = [
    { title: "识别信号", detail: "从任务进度、导师反馈和提问中整理线索", icon: Search },
    { title: "人工确认", detail: "由导师或 HRBP 确认是否需要跟进", icon: UserCheck },
    { title: "推动跟进", detail: "将建议动作同步给对应角色执行", icon: Send },
    { title: "复盘沉淀", detail: "回到成长记录供后续判断", icon: FileText },
  ];

  return (
    <main ref={homeRef} className="home-shell relative min-h-screen overflow-hidden bg-[#F3F7FF] text-[#171321]">
      <div className="home-ambient home-ambient-a" data-home-ambient="" />
      <div className="home-ambient home-ambient-b" data-home-ambient="" />
      <div className="home-grid-glow" aria-hidden="true" />

      <nav className="relative z-20 mx-auto flex max-w-[1500px] items-center justify-between gap-5 px-[clamp(1.25rem,3vw,2.5rem)] py-5" data-home-nav="">
        <BrandLogo />
        <div className="hidden items-center gap-7 rounded-[12px] border border-[#D8DEE6] bg-white/76 px-5 py-2 text-sm font-medium text-[#5F6978] shadow-sm md:flex">
          <a href="#intro" className="transition hover:text-[#171321]">产品介绍</a>
          <a href="#capability" className="transition hover:text-[#171321]">核心能力</a>
        </div>
      </nav>

      <section id="intro" className="relative z-10 mx-auto grid min-h-[calc(100vh-82px)] max-w-[1500px] items-center gap-[clamp(2rem,4vw,4.5rem)] overflow-visible px-[clamp(1.25rem,3vw,2.5rem)] pb-20 pt-8 lg:grid-cols-[minmax(360px,0.82fr)_minmax(620px,1.18fr)]">
        <div className="max-w-[560px]">
          <p className="home-kicker text-sm font-semibold text-[#2563EB]" data-home-copy="">Internship Growth Operations</p>
          <h1 className="home-title-brand mt-5 text-[#171321]" data-home-title="">
            <span className="home-title-brand-main">GrowNest</span>
            <span className="home-title-brand-sub">鹅苗成长舱</span>
          </h1>
          <p className="home-hero-copy mt-7 max-w-xl text-lg leading-8 text-[#5F6978]" data-home-copy="">
            面向实习生、导师与 HRBP 的成长协同系统。
          </p>
          <p className="mt-4 max-w-2xl text-[1.72rem] font-semibold leading-snug text-[#143C9B]" data-home-copy="">
            把任务进度、导师反馈和 HRBP 跟进收敛成一条可确认、可追踪的成长闭环。
          </p>
          <div className="mt-9 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => onNavigate("/login")}
              className="inline-flex items-center gap-2 rounded-[10px] bg-[#2563EB] px-5 py-3 text-sm font-semibold text-white shadow-[0_16px_34px_rgba(37,99,235,0.18)] transition hover:bg-[#143C9B]"
              data-home-cta=""
            >
              进入系统
              <ChevronRight className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => document.getElementById("capability")?.scrollIntoView({ behavior: "smooth" })}
              className="rounded-[10px] border border-[#BFDBFE] bg-white/78 px-5 py-3 text-sm font-semibold text-[#2563EB] transition hover:border-[#93C5FD] hover:bg-white"
              data-home-cta=""
            >
              查看产品设计
            </button>
          </div>
        </div>

        <div className="home-stage-wrap relative min-w-0 justify-self-stretch" data-home-reveal="">
          <div className="home-stage relative grid min-h-[620px] w-full max-w-[820px] items-center gap-4 overflow-hidden rounded-[24px] py-6 md:grid-cols-2 lg:min-h-[680px] lg:grid-cols-[minmax(150px,0.72fr)_minmax(320px,1.3fr)_minmax(150px,0.72fr)] xl:gap-5" data-home-stage="">
            <svg className="pointer-events-none absolute inset-0 z-0 h-full w-full" viewBox="0 0 980 620" fill="none" aria-hidden="true">
              <path data-home-path="insight" d="M210 318 C318 288 364 264 426 284" stroke="rgba(37,99,235,0.2)" strokeWidth="1.4" strokeLinecap="round" />
              <path data-home-path="student" d="M558 250 C642 170 726 130 820 146" stroke="rgba(37,99,235,0.22)" strokeWidth="1.4" strokeLinecap="round" />
              <path data-home-path="mentor" d="M570 308 C660 294 726 294 820 308" stroke="rgba(5,150,105,0.22)" strokeWidth="1.4" strokeLinecap="round" />
              <path data-home-path="hr" d="M558 366 C650 448 728 490 820 474" stroke="rgba(79,70,229,0.22)" strokeWidth="1.4" strokeLinecap="round" />
            </svg>

            <div className="pointer-events-none absolute left-1/2 top-1/2 z-0 h-[520px] w-[520px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-[#BFDBFE]/60" />
            <div className="pointer-events-none absolute left-1/2 top-1/2 z-0 h-[350px] w-[350px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-[#BFDBFE]/46" />

            <div className="relative z-20 order-2 flex justify-center md:order-2 lg:order-1" data-home-column="insight" data-home-stage-column="">
              <div className="home-insight-panel w-full max-w-[236px] rounded-[16px] border border-[#D8DEE6] bg-white/88 p-3.5 shadow-[0_14px_34px_rgba(20,33,52,0.06)]" data-home-insight-panel="">
                <div className="mb-4 flex items-center justify-between">
                  <p className="text-sm font-semibold text-[#171321]">AI Insight</p>
                  <Sparkles className="h-4 w-4 text-[#2563EB]" data-home-insight-icon="" />
                </div>
                {[
                  ["识别", "整理成长过程信号"],
                  ["确认", "交由导师人工判断"],
                  ["跟进", "沉淀可执行下一步"],
                ].map(([label, item]) => (
                  <div key={item} className="mb-2 rounded-[10px] border border-[#BFDBFE] bg-[#EFF6FF] px-3 py-2 text-xs font-medium text-[#143C9B]" data-home-insight="" data-home-insight-row="">
                    <span className="mr-2 text-[#6A7482]">{label}</span>{item}
                  </div>
                ))}
              </div>
            </div>

            <div className="relative z-30 order-1 flex justify-center md:col-span-2 lg:order-2 lg:col-span-1" data-home-column="engine" data-home-stage-column="">
              <div className="home-product-shell w-full max-w-[430px] rounded-[18px] border border-[#D8DEE6] bg-white/92 p-4 shadow-[0_22px_54px_rgba(20,33,52,0.08)]" data-home-stage-product="">
              <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-[#2563EB]">Operations Layer</p>
                  <p className="mt-1 text-lg font-semibold text-[#171321]">三端成长协同引擎</p>
                </div>
                <BrainCircuit className="h-7 w-7 text-[#2563EB]" />
              </div>
              <div className="mt-4 grid grid-cols-3 gap-2">
                {[
                  ["路径", "阶段目标"],
                  ["反馈", "导师确认"],
                  ["闭环", "HRBP 跟进"],
                ].map(([value, label]) => (
                  <div key={label} className="rounded-[12px] border border-[#E2E8F0] bg-[#F8FAFC] px-3 py-2">
                    <p className="text-lg font-black text-[#2563EB]">{value}</p>
                    <p className="mt-0.5 text-[11px] font-semibold text-[#6A7482]">{label}</p>
                  </div>
                ))}
              </div>
              <div className="mt-4 grid gap-2.5">
                {[
                  ["01", "成长路径", "实习生确认阶段任务", "#2563EB"],
                  ["02", "反馈确认", "导师沉淀结构化建议", "#3B82F6"],
                  ["03", "HRBP 跟进", "人工确认后进入队列", "#143C9B"],
                ].map(([step, label, detail, color]) => (
                  <div key={label} className="rounded-[12px] border border-[#E2E8F0] bg-white p-2.5" data-home-screen-row="">
                    <div className="flex items-start gap-3">
                      <span className="mt-0.5 rounded-full px-2 py-1 text-[10px] font-semibold text-white" style={{ backgroundColor: color }}>
                        {step}
                      </span>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-[#171321]">{label}</p>
                        <p className="mt-1 text-[11px] leading-5 text-[#6A7482]">{detail}</p>
                      </div>
                    </div>
                    <div className="mt-3 flex items-center gap-1.5">
                      {[0, 1, 2, 3].map((index) => (
                        <span
                          key={index}
                          className="h-1.5 flex-1 rounded-full"
                          style={{ backgroundColor: index < Number(step) + 1 ? color : "rgba(148,163,184,0.18)" }}
                          data-home-signal={index < Number(step) + 1 ? "" : undefined}
                        />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
              </div>
            </div>

            <div className="relative z-20 order-3 grid gap-3 justify-items-center" data-home-column="roles" data-home-stage-column="">
              {roleCards.map(({ id, label, title, body, detail, accent, soft, icon: Icon, depth }) => (
                <div
                  key={id}
                  className="home-role-card w-full max-w-[220px] rounded-[16px] border border-[#D8DEE6] bg-white/86 p-3.5 shadow-[0_14px_34px_rgba(20,33,52,0.055)]"
                  data-home-card={id}
                  data-home-stage-card=""
                  data-depth={depth}
                  data-accent={accent}
                  style={{ "--home-card-accent": accent, "--home-card-soft": soft } as CSSProperties}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-xs font-semibold" style={{ color: accent }}>{label}</p>
                      <p className="mt-2 text-lg font-semibold text-[#171321]">{title}</p>
                    </div>
                    <div className="home-role-icon flex h-10 w-10 shrink-0 items-center justify-center rounded-[12px] bg-[#F8FAFC] ring-1 ring-[#E2E8F0]">
                      <Icon className="h-5 w-5" style={{ color: accent }} />
                    </div>
                  </div>
                  <p className="mt-3 text-sm font-medium text-[#143C9B]">{body}</p>
                  <p className="mt-2 text-xs leading-5 text-[#6A7482]">{detail}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section ref={capabilityRef} id="capability" className="capability-section relative z-30 px-5 pt-14 pb-24" data-capability-section="">
        <div className="mx-auto max-w-7xl">
          <div className="mb-8 grid gap-6 lg:grid-cols-[0.92fr_1.08fr] lg:items-start">
            <div>
              <p className="text-sm font-semibold text-[#2563EB]" data-capability-kicker="" data-workflow-header="">AI-HR 协同工作流</p>
              <h2 className="mt-3 max-w-2xl text-3xl font-semibold leading-tight text-[#171321] md:text-[3.2rem]" data-capability-title="">
                从成长信号到跟进行动，形成闭环
              </h2>
            </div>
            <RoleCollaborationShowcase />
          </div>

          <div className="capability-rail capability-flow-map relative mb-5 overflow-hidden rounded-[28px] border border-[#BFDBFE] bg-white/70 p-5 shadow-[0_24px_70px_rgba(37,99,235,0.07)] backdrop-blur-[18px] md:p-7" data-workflow-panel="">
            <div className="absolute right-5 top-5 z-20 rounded-full border border-[#BFDBFE] bg-white/82 px-3 py-1.5 text-xs font-semibold text-[#2563EB] backdrop-blur" data-workflow-copy="">
              同一工作流内完成流转
            </div>

            <div className="workflow-board relative z-10 mt-12 md:mt-14">
              <div className="workflow-card-grid grid gap-4 md:grid-cols-5">
                {capabilityFlowNodes.map((node, index) => (
                  <div
                    key={node.id}
                    className="workflow-node relative flex h-[172px] w-full flex-col rounded-[20px] border border-[#BFDBFE] bg-white/80 p-4 shadow-[0_12px_34px_rgba(37,99,235,0.055)] backdrop-blur-[18px]"
                    data-workflow-node=""
                    data-workflow-index={index}
                    data-active={index === 0 ? "true" : "false"}
                    data-complete="false"
                    data-accent={node.color}
                  >
                    <div className="flex items-center gap-3">
                      <span className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#DBEAFE] text-sm font-semibold text-[#2563EB] shadow-[0_8px_18px_rgba(37,99,235,0.08)]" data-workflow-number="">
                        0{index + 1}
                      </span>
                      <p className="min-w-0 whitespace-nowrap text-[17px] font-semibold leading-tight text-[#171321]" data-workflow-title="">{node.label}</p>
                    </div>
                    <p className="mt-4 whitespace-nowrap text-[13px] font-medium leading-5 text-[#6F6A7A]">{node.detail}</p>
                    <p className="mt-4 text-[13px] font-medium leading-6 text-[#143C9B]" data-workflow-description="">{node.description}</p>
                    {index < capabilityFlowNodes.length - 1 && (
                      <ChevronRight className="workflow-step-arrow hidden h-4 w-4 text-[#A8A1B8] md:block" aria-hidden="true" />
                    )}
                  </div>
                ))}
              </div>
              <div className="workflow-stagebar workflow-card-grid pointer-events-none mt-5 hidden grid rounded-[16px] border border-[#BFDBFE] bg-white/60 p-2 text-[11px] font-semibold text-[#5F6978] backdrop-blur md:grid md:grid-cols-5" data-workflow-copy="">
                {capabilityFlowNodes.map((node, index) => (
                  <span key={node.stage} className="flex min-w-0 items-center justify-center gap-2 rounded-[12px] border border-transparent px-2 py-2 text-center" data-workflow-stage="" data-workflow-stage-index={index} data-active={index === 0 ? "true" : "false"} data-complete="false">
                    <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-[#60A5FA]" data-workflow-stage-dot="" />
                    <span className="truncate">{index + 1}. {node.stage}</span>
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div className="action-loop-bar mb-5 rounded-[20px] border border-[#BFDBFE] bg-white/72 p-4 backdrop-blur-[18px]">
            <div className="relative z-10 grid gap-4 lg:grid-cols-[0.34fr_0.66fr] lg:items-center">
              <div data-action-loop-copy="">
                <p className="text-sm font-semibold text-[#2563EB]">贯穿式行动闭环</p>
                <p className="mt-2 text-sm leading-6 text-[#6F6A7A]">
                  每一次成长信号都会经过识别、确认、跟进与沉淀，最终回流为后续带教和 HRBP 判断的依据。
                </p>
                <div className="action-loop-progress mt-4" aria-hidden="true" data-action-loop-bar-source="">
                  <span className="action-loop-progress-fill" data-action-loop-bar="" />
                </div>
              </div>
              <div className="action-loop-chain grid gap-3 md:grid-cols-4" aria-label="贯穿式行动闭环机制">
                {actionLoopSteps.map(({ title, detail, icon: Icon }, index) => (
                  <div key={title} className="action-loop-pill relative min-h-[118px] rounded-[16px] border border-[#BFDBFE] bg-white/80 p-4 text-[#5F6978]" data-action-loop-step="" data-action-loop-index={index}>
                    <div className="flex items-start gap-3">
                      <span className="action-loop-icon flex h-9 w-9 shrink-0 items-center justify-center rounded-[12px] bg-[#DBEAFE] text-[#2563EB] ring-1 ring-[#BFDBFE]" data-action-loop-icon="">
                        <Icon className="h-[18px] w-[18px]" />
                      </span>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-[#171321]" data-action-loop-title="">{title}</p>
                        <p className="mt-1 text-xs leading-5 text-[#5F6978]" data-action-loop-detail="">{detail}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="capability-workbench grid gap-5 rounded-[28px] border border-[#4E4965]/10 bg-[#FFFFFF]/48 p-4 shadow-[0_24px_70px_rgba(36,26,72,0.06)] backdrop-blur-[20px] lg:grid-cols-[0.38fr_0.62fr]">
            <div className="grid gap-3">
              {productModules.map(({ title, detail, accent, statusAccent, chips, icon: Icon }, index) => (
                <button
                  key={title}
                  type="button"
                  className="capability-card relative overflow-hidden rounded-[22px] border border-[#4E4965]/10 bg-[#FFFFFF]/62 p-4 text-left shadow-[0_18px_52px_rgba(36,26,72,0.055)] backdrop-blur-[18px]"
                  data-capability-card=""
                  data-home-showcase-card=""
                  data-accent={statusAccent}
                  data-module-index={index}
                  data-active={activeWorkbenchIndex === index ? "true" : "false"}
                  onMouseEnter={() => setActiveWorkbenchIndex(index)}
                  onFocus={() => setActiveWorkbenchIndex(index)}
                  onClick={() => setActiveWorkbenchIndex(index)}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <span className="text-xs font-semibold" style={{ color: accent }}>0{index + 1}</span>
                      <h3 className="mt-3 text-lg font-semibold text-[#171321]">{title}</h3>
                    </div>
                    <div className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-[15px] bg-[#F8F7FB]/80 ring-1 ring-[#4E4965]/10">
                      <span className="absolute inset-0 rounded-[15px]" style={{ backgroundColor: accent, opacity: 0.07 }} data-capability-pulse="" />
                      <Icon className="relative h-5 w-5" style={{ color: accent }} />
                    </div>
                  </div>
                  <p className="mt-3 text-sm leading-6 text-[#6F6A7A]">{detail}</p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {chips.map((chip) => (
                      <span key={chip} className="rounded-full border border-[#4E4965]/10 bg-[#F8F7FB]/72 px-3 py-1.5 text-[11px] font-medium text-[#2D2544]" data-capability-chip="">
                        <span className="mr-1.5 inline-block h-1.5 w-1.5 rounded-full" style={{ backgroundColor: statusAccent }} />
                        {chip}
                      </span>
                    ))}
                  </div>
                  <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-[#4E4965]/10">
                    <div className="h-full rounded-full" style={{ "--capability-line-color": statusAccent } as CSSProperties} data-capability-line="" />
                  </div>
                </button>
              ))}
            </div>

            <div className="capability-console relative min-h-[520px] overflow-hidden rounded-[24px] border border-[#BFDBFE] bg-[#EFF6FF]/72 p-5">
              <div className="mb-5 flex items-center justify-between border-b border-[#BFDBFE] pb-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-[#2563EB]">Simulated Workbench</p>
                  <p className="mt-1 text-lg font-semibold text-[#171321]">成长协同模拟工作台</p>
                </div>
                <span className="hidden rounded-full border border-[#BFDBFE] bg-white/80 px-3 py-1.5 text-xs font-semibold text-[#2563EB] sm:inline-flex">
                  悬停左侧模块查看
                </span>
                <Bot className="h-6 w-6 text-[#2563EB]" />
              </div>

              {productModules.map(({ workbenchTitle, workbenchMeta, workbenchItems, accent, statusAccent, flow }, index) => (
                <div
                  key={workbenchTitle}
                  className="absolute inset-x-5 top-[92px]"
                  data-workbench-panel=""
                  data-active={activeWorkbenchIndex === index ? "true" : "false"}
                  aria-hidden={activeWorkbenchIndex !== index}
                >
                  <div className="rounded-[22px] border border-[#BFDBFE] bg-white/76 p-5 shadow-[0_18px_54px_rgba(37,99,235,0.07)]">
                    <div className="flex items-start justify-between gap-4" data-workbench-item="">
                      <div>
                        <p className="text-sm font-semibold" style={{ color: accent }}>{workbenchMeta}</p>
                        <h3 className="mt-2 text-2xl font-semibold text-[#171321]">{workbenchTitle}</h3>
                      </div>
                      <span className="rounded-full px-3 py-1.5 text-xs font-semibold text-white" style={{ backgroundColor: accent }}>Active</span>
                    </div>
                    <div className="mt-5 grid gap-3">
                      {workbenchItems.map((item) => (
                        <div key={item} className="rounded-[12px] border border-[#E2E8F0] bg-[#F8FAFC] px-4 py-3 text-sm font-medium text-[#17324D]" data-workbench-item="">
                          <span className="mr-2 inline-block h-1.5 w-1.5 rounded-full align-middle" style={{ backgroundColor: statusAccent }} />
                          {item}
                        </div>
                      ))}
                    </div>
                    <div className="mt-5 grid grid-cols-3 gap-3" data-workbench-item="">
                      {flow.map((step, flowIndex) => (
                        <div key={step} className="rounded-[15px] bg-white/72 p-3 text-center" data-capability-visual-step="">
                          <span className="mx-auto block h-1.5 w-10 rounded-full" style={{ backgroundColor: flowIndex === 1 ? statusAccent : "rgba(148,163,184,0.22)" }} />
                          <p className="mt-2 truncate text-[11px] font-semibold text-[#17324D]">{step}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      </section>
    </main>
  );
}

function LoginPage({ onLogin }: { onLogin: (user: AuthUser) => void }) {
  const loginRef = useRef<HTMLElement | null>(null);
  const [role, setRole] = useState<UserRole>("student");
  const [username, setUsername] = useState("student");
  const [password, setPassword] = useState("123456");
  const [error, setError] = useState("");
  const [showLogin, setShowLogin] = useState(false);

  const selectedUser = mockUsers.find((user) => user.role === role)!;
  const loginRoleMeta: Record<string, { shortLabel: string; title: string; detail: string }> = {
    student: {
      shortLabel: "实习生",
      title: "成长端",
      detail: "查看今日任务、成长路径、导师反馈，并把困惑整理成可沟通的问题。",
    },
    mentor: {
      shortLabel: "导师",
      title: "带教端",
      detail: "查看带教优先事项，回复实习生提问，并生成结构化阶段反馈。",
    },
    hr: {
      shortLabel: "HRBP",
      title: "运营台",
      detail: "管理人员状态、关注队列、导师反馈节奏和跨角色协同记录。",
    },
    admin: {
      shortLabel: "后台",
      title: "系统管理",
      detail: "配置账号、实习项目、岗位成长模板和权限范围，保障业务端数据可维护。",
    },
  };
  const portalShowcases: Record<string, {
    eyebrow: string;
    title: string;
    heroTitle: string;
    heroBody: string;
    description: string;
    icon: ElementType;
    tone: string;
    rotate: number;
  }> = {
    student: {
      eyebrow: "Student Portal",
      title: "实习生成长端",
      heroTitle: "让实习里的每一次行动，都能沉淀成成长证据",
      heroBody: "实习生不只是完成待办，而是在同一条成长线上留下任务进展、导师反馈、沟通上下文和阶段复盘。",
      description: "把个人行动记录、反馈建议和阶段变化沉淀为长期可追踪的成长档案。",
      icon: GraduationCap,
      tone: "from-white via-[#f8fafc] to-[#edf2f7]",
      rotate: 0,
    },
    mentor: {
      eyebrow: "Mentor Portal",
      title: "导师带教端",
      heroTitle: "把带教对象、问题回复和阶段反馈收进同一节奏",
      heroBody: "导师先看需要跟进的学员，再处理提问、记录观察，并沉淀可复盘的反馈建议。",
      description: "把带教对象、待反馈、待回复问题放在同一个工作面，减少导师凭经验漏动作。",
      icon: MessageSquareText,
      tone: "from-white via-[#f8fafc] to-[#edf2f7]",
      rotate: 0,
    },
    hr: {
      eyebrow: "HRBP Portal",
      title: "HRBP 运营台",
      heroTitle: "把成长状态、关注线索和跟进行动统一起来",
      heroBody: "HRBP 先确认真实成长信号，再协调导师、实习生和招聘侧完成闭环跟进。",
      description: "成长状态、关注队列、导师反馈完成率和适岗摘要集中管理，减少私聊追问。",
      icon: LayoutDashboard,
      tone: "from-white via-[#f8fafc] to-[#edf2f7]",
      rotate: 0,
    },
    admin: {
      eyebrow: "Admin Console",
      title: "系统管理后台",
      heroTitle: "把账号、项目、模板和权限配置清楚",
      heroBody: "管理员维护基础数据和岗位成长模板，让各端看到一致、可运营的工作口径。",
      description: "维护账号、实习项目、岗位模板和权限规则，保证前台数据长期可运营。",
      icon: LockKeyhole,
      tone: "from-white via-[#f8fafc] to-[#edf2f7]",
      rotate: 0,
    },
  };
  const selectedPortal = portalShowcases[role] ?? portalShowcases.student;
  const PortalIcon = selectedPortal.icon;
  const primaryPortalRoles = mockUsers.filter((item) => item.role !== "admin");
  const adminUser = mockUsers.find((item) => item.role === "admin")!;
  const roleContent: Record<string, {
    eyebrow: string;
    headline: string;
    body: string;
    features: Array<[string, string, ElementType]>;
    aiTitle: string;
    aiBody: string;
    aiChips: string[];
  }> = {
    student: {
      eyebrow: "Student Workspace",
      headline: "把个人成长变成可执行、可复盘的工作节奏",
      body: "实习生进入后先看到当前任务、资源确认、导师反馈和待提问事项，减少靠记忆推进和反复私聊确认。",
      features: [
        ["阶段任务", "按当前阶段展示最该处理的任务和下一步动作。", ClipboardList],
        ["资源确认", "把文档、系统和业务资料是否可用放进同一处核对。", GraduationCap],
        ["导师沟通", "把不确定点整理成可以直接发给导师的问题。", MessageSquareText],
      ],
      aiTitle: "AI 成长助手",
      aiBody: "AI 会基于岗位、阶段任务和反馈记录给出行动建议，帮助个人成长过程持续被看见、被跟进。",
      aiChips: ["行动建议", "资源核对", "导师问题"],
    },
    mentor: {
      eyebrow: "Mentor Workflow",
      headline: "把带教经验变成稳定可复用的节奏",
      body: "导师进入后先看到带教对象、今日待办、待回复提问和待提交反馈，减少漏跟进和临时补材料。",
      features: [
        ["带教待办", "按周提醒 1v1、任务确认和阶段反馈。", CalendarCheck],
        ["结构化反馈", "用评分和观察快速生成反馈草稿。", SquarePen],
        ["学员问答", "集中处理实习生从成长端发来的问题。", Send],
      ],
      aiTitle: "AI 带教赋能",
      aiBody: "AI 会把导师的碎片观察改写成表现亮点、待提升点和下阶段建议。",
      aiChips: ["反馈草稿", "任务建议", "沟通话术"],
    },
    hr: {
      eyebrow: "HRBP Operations",
      headline: "把一批实习生的状态放进同一个运营节奏",
      body: "HRBP 可以查看人员池进度、关注队列、导师反馈完成率和适岗周报，减少跨角色反复同步。",
      features: [
        ["人员池总览", "快速看到稳定推进、需支持和高潜观察。", LayoutDashboard],
        ["关注队列", "把需要 HRBP 介入的人和原因聚合起来。", AlertTriangle],
        ["适岗周报", "一键生成可同步给招聘侧的摘要。", FileText],
      ],
      aiTitle: "AI 运营赋能",
      aiBody: "AI 会汇总任务、反馈和协同记录，生成成长摘要、关注原因和下周动作建议。",
      aiChips: ["成长摘要", "关注原因", "周报生成"],
    },
    admin: {
      eyebrow: "Admin Console",
      headline: "把账号、项目、模板和权限配置清楚",
      body: "管理员维护基础数据和岗位成长模板，让前台的成长路径、反馈节奏和看板口径保持一致。",
      features: [
        ["账号权限", "维护不同角色可见和可操作范围。", LockKeyhole],
        ["人员池管理", "管理实习生名单、导师绑定和岗位分布。", Users],
        ["模板配置", "维护不同岗位的成长阶段和默认任务。", ListChecks],
      ],
      aiTitle: "AI 配置赋能",
      aiBody: "AI 可以辅助生成岗位成长模板、默认任务清单和人员池初始化建议。",
      aiChips: ["模板建议", "任务清单", "人员池初始化"],
    },
  };
  const selectedRoleContent = roleContent[role] ?? roleContent.student;
  const portalAccessNotes: Record<UserRole, Array<[string, string]>> = {
    student: [
      ["行动有记录", "任务进展不只停留在待办状态"],
      ["反馈有上下文", "导师建议能回到具体任务和问题"],
      ["成长可追踪", "阶段变化沉淀为长期成长档案"],
    ],
    mentor: [
      ["今天先看谁", "快速识别需要跟进的学员"],
      ["反馈更省力", "把观察整理成结构化草稿"],
      ["节奏不遗漏", "按周提醒关键带教动作"],
    ],
    hr: [
      ["整体有把握", "一眼看到人员成长状态"],
      ["支持更及时", "优先处理需要帮助的同学"],
      ["沟通更顺畅", "沉淀可复盘的周报摘要"],
    ],
    admin: [
      ["账号可维护", "集中配置角色和成员"],
      ["模板可复用", "维护岗位成长路径"],
      ["规则更清楚", "统一权限与基础口径"],
    ],
  };
  const selectedAccessNotes = portalAccessNotes[role] ?? portalAccessNotes.student;
  const loginStageCopy: Record<UserRole, { eyebrow: string; heroTitle: string; heroBody: string; notes: Array<[string, string]> }> = {
    student: {
      eyebrow: "Student Login",
      heroTitle: "确认身份后，进入你的个人成长档案",
      heroBody: "这一层不再介绍端口价值，而是完成账号确认；系统会按个人身份加载任务、反馈、提问和阶段记录。",
      notes: [
        ["身份确认", "匹配个人成长记录"],
        ["权限加载", "只进入自己的成长空间"],
        ["档案延续", "承接任务、反馈和阶段复盘"],
      ],
    },
    mentor: {
      eyebrow: "Mentor Login",
      heroTitle: "确认导师身份，进入自己的带教对象池",
      heroBody: "登录后系统会按导师绑定关系加载学员、提问、反馈草稿和本周带教动作。",
      notes: [
        ["导师身份", "匹配负责学员"],
        ["对象加载", "只展示绑定名单"],
        ["反馈延续", "承接问答和带教记录"],
      ],
    },
    hr: {
      eyebrow: "HRBP Login",
      heroTitle: "确认 HRBP 身份，进入成长运营台",
      heroBody: "登录后系统会按部门与角色权限加载花名册、协同记录和需要跟进的运营动作。",
      notes: [
        ["人员池权限", "匹配运营范围"],
        ["协同记录", "读取跨端同步事项"],
        ["运营闭环", "沉淀跟进和复盘证据"],
      ],
    },
    admin: {
      eyebrow: "Admin Login",
      heroTitle: "确认管理员身份，进入系统配置后台",
      heroBody: "登录后系统会加载账号、岗位模板、实习项目配置和权限边界，支撑长期运营维护。",
      notes: [
        ["账号配置", "维护角色与成员"],
        ["模板配置", "维护岗位成长路径"],
        ["权限审计", "统一系统操作边界"],
      ],
    },
  };
  const displayedPortal = showLogin
    ? { ...selectedPortal, ...loginStageCopy[role] }
    : selectedPortal;
  const displayedAccessNotes = showLogin ? loginStageCopy[role].notes : selectedAccessNotes;
  useScopedEntrance(loginRef, [role, showLogin], { login: true });
  useGsapHover(loginRef);

  const selectRole = (nextRole: UserRole) => {
    const user = mockUsers.find((item) => item.role === nextRole)!;
    setRole(nextRole);
    setUsername(user.username);
    setPassword("123456");
    setError("");
  };

  const openLogin = (nextRole: UserRole) => {
    selectRole(nextRole);
    setShowLogin(true);
  };

  const submit = () => {
    const user = mockUsers.find((item) => item.username === username && item.password === password && item.role === role);
    if (!user) {
      setError("账号、密码或端口不匹配。可使用快速体验入口进入。");
      return;
    }
    onLogin(publicUser(user));
  };

  return (
    <main ref={loginRef} className="login-theme-shell glass-theme-shell relative min-h-screen overflow-hidden px-5 py-8" style={loginThemeStyle(role)}>
      <div key={`theme-${role}`} className="login-theme-transition" aria-hidden="true" />
      {!showLogin && (
        <button
          type="button"
          onClick={() => openLogin(adminUser.role)}
          className="glass-muted-button absolute right-5 top-5 z-30 hidden items-center gap-2 rounded-[12px] px-4 py-2 text-xs font-bold shadow-sm transition lg:flex"
        >
          <LockKeyhole className="h-3.5 w-3.5" />
          管理员入口
        </button>
      )}
      <div className="mx-auto grid min-h-[calc(100vh-64px)] max-w-6xl items-center gap-10 lg:grid-cols-[0.95fr_0.88fr]">
        <section className="relative min-w-0" data-gsap-login-brand="">
          <div data-gsap-logo="">
            <BrandLogo />
          </div>
          <div className="mt-8 max-w-xl">
            <div
              key={role}
              className="portal-stage login-hero-panel glass-panel relative overflow-hidden rounded-[20px] p-7 lg:min-h-[480px]"
              style={{ transform: `rotate(${selectedPortal.rotate}deg)` }}
            >
              <div className="relative z-10 flex min-h-[420px] flex-col justify-between gap-7">
                <div>
                  <p className="login-kicker">{displayedPortal.eyebrow}</p>
                  <h1 className="login-hero-title mt-5 max-w-[480px] text-4xl font-semibold leading-[1.12] text-[#171321] sm:text-[3.1rem]">
                    {displayedPortal.heroTitle}
                  </h1>
                  <p className="mt-6 max-w-[520px] text-base font-normal leading-8 text-[#5F6978]">
                    {displayedPortal.heroBody}
                  </p>
                </div>

                <div className="grid gap-3 sm:grid-cols-3">
                  {displayedAccessNotes.map(([label, detail]) => (
                    <div key={label} className="rounded-[12px] border border-[#E2E8F0] bg-white/70 px-4 py-3" data-gsap-feature="">
                      <p className="text-sm font-medium text-[#171321]">{label}</p>
                      <p className="mt-2 text-xs leading-5 text-[#5F6978]">{detail}</p>
                    </div>
                  ))}
                </div>

                {!showLogin && (
                  <div className="flex items-center justify-between gap-4">
                    <div className="login-role-dots flex items-center gap-3" role="group" aria-label="切换登录端口">
                      {primaryPortalRoles.map((item) => {
                        const active = item.role === role;
                        return (
                          <button
                            key={item.role}
                            type="button"
                            onClick={() => selectRole(item.role)}
                            className={cn("login-role-dot", active && "is-active")}
                            aria-label={`切换到${loginRoleMeta[item.role]?.shortLabel}端口`}
                            aria-pressed={active}
                            title={loginRoleMeta[item.role]?.shortLabel}
                          />
                        );
                      })}
                    </div>
                    <button
                      type="button"
                      onClick={() => openLogin(role)}
                      className="login-enter-button inline-flex h-11 w-11 items-center justify-center rounded-[13px] border border-white/70 bg-[var(--role-accent)] text-white shadow-[0_12px_28px_rgba(29,12,59,0.10)] transition"
                      aria-label={`进入${loginRoleMeta[role]?.shortLabel ?? "当前"}登录`}
                      title="进入登录"
                    >
                      <LogIn className="h-5 w-5" />
                    </button>
                  </div>
                )}

                {showLogin && (
                  <div className="rounded-[12px] border border-[#E2E8F0] bg-white/78 p-4">
                    <Button variant="ghost" onClick={() => setShowLogin(false)} className="w-full rounded-xl bg-white/88">
                      返回端口选择
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>

        <section className="space-y-6 lg:min-h-[520px]">
          {showLogin ? (
            <div className="login-form-panel glass-panel overflow-hidden rounded-[24px]" data-gsap-login-card="">
            <div className="h-1 bg-[var(--role-accent)]" />
            <div className="p-6">
              <div className="mb-6 flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <p className="login-kicker">{loginRoleMeta[role]?.title} Login</p>
                  <h2 className="mt-3 text-3xl font-semibold text-[#17324D]">{selectedUser.roleLabel}</h2>
                  <p className="mt-2 max-w-md text-sm leading-6 text-[#5F6978]">请输入该端口账号密码，系统会按当前端口权限进入对应工作台。</p>
                </div>
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[12px] bg-[var(--role-accent)] text-white shadow-lg shadow-[var(--role-shadow)]">
                  <PortalIcon className="h-5 w-5" />
                </div>
              </div>

              <div className="space-y-4 rounded-2xl border border-slate-100 bg-slate-50/72 p-4">
                <label className="block">
                  <span className="text-sm font-bold text-slate-600">账号</span>
                  <div className="app-field mt-2 flex items-center gap-3 px-3 py-3 transition">
                    <UserRound className="h-4 w-4 shrink-0 text-[var(--role-accent)]" />
                    <input
                      value={username}
                      onChange={(event) => setUsername(event.target.value)}
                      className="min-w-0 flex-1 bg-transparent text-base font-semibold text-slate-800 outline-none"
                    />
                  </div>
                </label>
                <label className="block">
                  <span className="text-sm font-bold text-slate-600">密码</span>
                  <div className="app-field mt-2 flex items-center gap-3 px-3 py-3 transition">
                    <LockKeyhole className="h-4 w-4 shrink-0 text-[var(--role-accent)]" />
                    <input
                      type="password"
                      value={password}
                      onChange={(event) => setPassword(event.target.value)}
                      className="min-w-0 flex-1 bg-transparent text-base font-semibold text-slate-800 outline-none"
                    />
                  </div>
                </label>
              </div>
              {error && <FeedbackNotice tone="error" className="mt-4">{error}</FeedbackNotice>}
              <Button onClick={submit} className="mt-5 h-12 w-full rounded-xl px-5">
                进入工作台
                <ChevronRight className="h-4 w-4" />
              </Button>
              <Button variant="ghost" onClick={() => onLogin(publicUser(selectedUser))} className="glass-muted-button mt-3 h-12 w-full rounded-xl px-5">
                快速体验
              </Button>
            </div>
          </div>
          ) : (
            <>
              <div key={`${role}-copy`} className="fx-role-panel">
                <p className="login-kicker text-sm">{selectedRoleContent.eyebrow}</p>
                {selectedRoleContent.headline && (
                  <h1 className="login-copy-title mt-4 text-3xl font-semibold leading-tight text-[#17324D] lg:text-[2.56rem]">
                    {selectedRoleContent.headline}
                  </h1>
                )}
                {selectedRoleContent.body && (
                  <p className={cn("text-base leading-8 text-[#6F6E72]", selectedRoleContent.headline ? "mt-5" : "mt-4")}>
                    {selectedRoleContent.body}
                  </p>
                )}
              </div>

              <div className="grid gap-4">
                {selectedRoleContent.features.map(([title, detail, Icon]) => (
                  <div key={title as string} className="future-card glass-panel-soft flex items-start gap-4 rounded-[20px] p-4" data-gsap-role-entry="" data-gsap-hover="">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[14px] bg-[var(--role-soft)] text-[var(--role-accent)] ring-1 ring-[var(--role-border)]">
                      <Icon className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="font-semibold text-[#1D0C3B]">{title as string}</p>
                      <p className="mt-1 text-sm leading-6 text-slate-600">{detail as string}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="rounded-[14px] border border-[#C1B5C2]/35 bg-white/42 p-5 backdrop-blur">
                <p className="text-sm font-semibold text-[var(--login-label)]">{selectedRoleContent.aiTitle}</p>
                <p className="mt-2 text-sm leading-7 text-slate-600">
                  {selectedRoleContent.aiBody}
                </p>
                <div className="mt-4 grid gap-3 sm:grid-cols-3">
                  {selectedRoleContent.aiChips.map((item) => (
                    <div key={item} className="rounded-2xl bg-white/82 px-3 py-3 text-center text-xs font-semibold text-slate-700" data-gsap-feature="">
                      {item}
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </section>
      </div>
    </main>
  );
}

function UserMenu({ user, onLogout, onResetDemo }: { user: AuthUser; onLogout: () => void; onResetDemo: () => void }) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="flex items-center gap-3 rounded-xl border border-[var(--role-border)] bg-[var(--role-soft)] px-3 py-2">
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--role-accent)] text-sm font-black text-white">
          {user.name.slice(0, 1)}
        </div>
        <div>
          <p className="text-sm font-bold leading-none text-slate-950">{user.name}</p>
          <p className="mt-1 text-xs text-[var(--role-accent)]">{roleName[user.role]} · {user.department}</p>
        </div>
      </div>
      <Button variant="ghost" onClick={onResetDemo}>
        <RotateCcw className="h-4 w-4" />
        重置演示数据
      </Button>
      <Button variant="ghost" onClick={onLogout}>
        <LogOut className="h-4 w-4" />
        退出登录
      </Button>
    </div>
  );
}

function AppLayout({
  user,
  title,
  children,
  onLogout,
  onResetDemo,
}: {
  user: AuthUser;
  title: string;
  children: ReactNode;
  onLogout: () => void;
  onResetDemo: () => void;
}) {
  const layoutRef = useRef<HTMLDivElement | null>(null);
  const nav: Array<{ path: Path; label: string; roles: UserRole[]; icon: ElementType }> = [
    { path: "/student", label: "实习生成长端", roles: ["student"], icon: GraduationCap },
    { path: "/mentor", label: "导师带教端", roles: ["mentor"], icon: MessageSquareText },
    { path: "/hr", label: "HRBP 成长运营台", roles: ["hr"], icon: LayoutDashboard },
    { path: "/admin", label: "系统管理后台", roles: ["admin"], icon: LockKeyhole },
  ];
  const [searchTerm, setSearchTerm] = useState("");
  const searchResults = useMemo(() => {
    const keyword = searchTerm.trim().toLowerCase();
    if (!keyword) return [];

    const matches = (values: Array<string | number | undefined>) =>
      values.some((value) => String(value ?? "").toLowerCase().includes(keyword));

    const results: Array<{ title: string; meta: string; type: string }> = [];

    if (user.role === "student") {
      studentWeeklyTasks.forEach((task) => {
        if (matches([task.label, task.status, task.due])) {
          results.push({ title: task.label, meta: `${task.status} · ${task.due}`, type: "本周任务" });
        }
      });
      growthStages.forEach((stage) => {
        if (matches([stage.period, stage.theme])) {
          results.push({ title: stage.theme, meta: `${stage.title} · ${stage.period}`, type: "成长路径" });
        }
        stage.tasks.forEach((task) => {
          if (matches([task.label, task.status, stage.theme])) {
            results.push({ title: task.label, meta: `${stage.period} · ${task.status}`, type: "成长任务" });
          }
        });
      });
    }

    if (user.role === "mentor") {
      mentorInterns.forEach((intern) => {
        if (matches([intern.name, intern.title, intern.risk, intern.action, intern.detail, intern.focus, ...intern.weeklyRecord, ...intern.aiSignals])) {
          results.push({ title: `${intern.name}｜${intern.title}`, meta: `${intern.progress}% · ${intern.risk} · ${intern.action}`, type: "负责实习生" });
        }
      });
      mentorRhythmTodos.forEach((todo) => {
        if (matches([todo])) {
          results.push({ title: todo, meta: "本周导师动作", type: "带教提醒" });
        }
      });
    }

    if (user.role === "hr") {
      interns.forEach((intern) => {
        if (matches([intern.name, intern.role, intern.risk, intern.reason, intern.todo, intern.mentorFeedback, intern.processStatus, ...intern.riskTags])) {
          results.push({ title: `${intern.name}｜${intern.role}`, meta: `${intern.progress}% · ${attentionLabel[intern.risk]} · ${intern.processStatus}`, type: "关注看板" });
        }
      });
    }

    return results.slice(0, 6);
  }, [searchTerm, user.role]);

  useScopedEntrance(layoutRef, [user.role]);
  useGsapHover(layoutRef);

  const sidebarCard = (
    <Card className={cn("enterprise-sidebar p-2", user.role === "hr" && "hr-sidebar-card", user.role === "mentor" && "mentor-sidebar-card p-2")}>
      <div className={cn("mb-3 border-b border-slate-100 px-2 pb-3 pt-1", user.role === "mentor" && "flex justify-center px-0")}>
        {user.role === "mentor" ? <LogoMark compact /> : <BrandLogo small />}
      </div>
      <button
        className={cn(
          "mb-1 flex w-full items-center gap-3 whitespace-nowrap rounded-[9px] bg-[var(--role-accent)] px-3 py-2.5 text-left text-sm font-semibold text-white shadow-lg shadow-[var(--role-shadow)]",
          user.role === "mentor" && "h-11 justify-center px-0",
        )}
        aria-label="当前工作台"
        title="当前工作台"
      >
        <Home className="h-4 w-4" />
        {user.role !== "mentor" && "当前工作台"}
      </button>
      {nav.filter((item) => item.roles.includes(user.role)).map((item) => {
        const Icon = item.icon;
        return (
          <button
            key={item.path}
            className={cn(
              "mb-1 flex w-full items-center gap-3 whitespace-nowrap rounded-[9px] px-3 py-2.5 text-left text-sm font-semibold text-slate-600 transition hover:bg-[var(--role-soft)] hover:text-[var(--role-accent)]",
              user.role === "mentor" && "h-11 justify-center px-0",
            )}
            aria-label={item.label}
            title={item.label}
          >
            <Icon className="h-4 w-4" />
            {user.role !== "mentor" && item.label}
          </button>
        );
      })}
    </Card>
  );

  const workbenchCard = (
    <Card className={cn("overflow-hidden p-0", user.role === "student" && "w-full")}>
      <div className={cn("relative overflow-hidden bg-white p-4", (user.role === "student" || user.role === "mentor") && "p-3")} data-gsap-title="">
        <div className="absolute inset-x-0 top-0 h-1 bg-[var(--role-accent)]" />
        <div className={cn("flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between", user.role === "mentor" && "gap-2")}>
          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-[var(--role-accent)]">
              当前工作台
            </p>
            <h1 className={cn("mt-1 text-xl font-black tracking-[0] text-slate-950 lg:text-2xl", user.role === "student" && "lg:text-[1.7rem]", user.role === "mentor" && "lg:text-[1.55rem]")}>{title}</h1>
            <p className={cn("mt-1 text-sm text-slate-600", (user.role === "student" || user.role === "mentor") && "text-xs")}>
              {user.name} / {roleName[user.role]}{user.role === "mentor" ? ` · ${user.department}` : ""}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {["实时同步", "AI 赋能"].map((item) => (
              <span key={item} className={cn("rounded-md bg-[var(--role-soft)] px-3 py-2 text-xs font-black text-[var(--role-accent)] ring-1 ring-[var(--role-border)]", user.role === "mentor" && "py-1.5")}>
                {item}
              </span>
            ))}
          </div>
        </div>
      </div>
    </Card>
  );

  return (
    <div ref={layoutRef} className={cn("enterprise-shell min-h-screen", user.role === "hr" && "glass-theme-shell", user.role === "mentor" && "mentor-shell")} style={roleThemeStyle(user.role)}>
      <header className="enterprise-header sticky top-0 z-40 backdrop-blur-xl">
        <div className="mx-auto flex max-w-[1480px] flex-col gap-4 px-5 py-3 lg:flex-row lg:items-center lg:justify-between">
          <BrandLogo />
          <div className="relative hidden min-w-96 xl:block">
            <div className="app-field flex items-center gap-2 px-3 py-2 text-sm text-slate-500 transition">
              <Search className="h-4 w-4" />
              <input
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="搜索任务、反馈、成长记录"
                className="w-full bg-transparent text-sm text-slate-700 outline-none placeholder:text-slate-400"
              />
            </div>
            {searchTerm.trim() && (
              <div className="absolute left-0 right-0 top-12 z-50 overflow-hidden rounded-[14px] border border-slate-200 bg-white shadow-[0_22px_54px_rgba(21,41,71,0.16)]">
                <div className="border-b border-slate-100 px-4 py-3 text-xs font-bold text-slate-500">
                  已按{roleName[user.role]}权限找到 {searchResults.length} 条结果
                </div>
                {searchResults.length > 0 ? (
                  <div className="max-h-80 overflow-auto p-2">
                    {searchResults.map((result) => (
                      <button
                        key={`${result.type}-${result.title}`}
                        onClick={() => setSearchTerm(result.title)}
                        className="block w-full rounded-lg px-3 py-3 text-left transition hover:bg-[var(--role-soft)]"
                      >
                        <div className="flex items-center justify-between gap-3">
                          <p className="text-sm font-bold text-slate-950">{result.title}</p>
                          <span className="shrink-0 rounded-full bg-[var(--role-soft)] px-2 py-1 text-xs font-bold text-[var(--role-accent)]">{result.type}</span>
                        </div>
                        <p className="mt-1 text-xs text-slate-500">{result.meta}</p>
                      </button>
                    ))}
                  </div>
                ) : (
                  <p className="px-4 py-5 text-sm font-semibold text-slate-500">没有找到匹配内容，试试姓名、关注状态或任务关键词。</p>
                )}
              </div>
            )}
          </div>
          <UserMenu user={user} onLogout={onLogout} onResetDemo={onResetDemo} />
        </div>
      </header>

      <div className={cn(
        "mx-auto gap-4 px-4 py-4",
        user.role === "student" ? "w-full max-w-none" : user.role === "hr" ? "max-w-[1520px] xl:px-3 2xl:px-2" : "max-w-[1440px]",
        user.role === "mentor" ? "block" : "flex",
      )}>
        {user.role !== "mentor" && user.role !== "hr" && (
          <aside className={cn("hidden w-[228px] shrink-0 xl:block", user.role === "student" && "xl:hidden")}>
            <div className="sticky top-24 space-y-3">{sidebarCard}</div>
          </aside>
        )}

        {user.role === "mentor" ? (
          <main className="min-w-0 space-y-4">
            {workbenchCard}
            <section className="min-w-0 space-y-4">
              {children}
            </section>
          </main>
        ) : (
          <main className="min-w-0 flex-1 space-y-4">
            {workbenchCard}
            {children}
          </main>
        )}
      </div>
    </div>
  );
}

function StatCard({ label, value, icon: Icon, tone }: { label: string; value: string; icon: ElementType; tone: "blue" | "green" | "amber" | "rose" }) {
  const styles = {
    blue: "border border-[var(--role-border)] bg-[var(--role-soft)] text-[var(--role-accent)]",
    green: "border border-emerald-100 bg-emerald-50 text-emerald-700",
    amber: "border border-amber-100 bg-amber-50 text-amber-700",
    rose: "border border-rose-100 bg-rose-50 text-rose-700",
  };
  return (
    <Card className="p-5" data-stat-card="">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-slate-500">{label}</p>
          <p className="mt-2 text-3xl font-black text-slate-950">{value}</p>
        </div>
        <div className={cn("flex h-12 w-12 items-center justify-center rounded-2xl", styles[tone])}>
          <Icon className="h-6 w-6" />
        </div>
      </div>
    </Card>
  );
}

const growthMapStops = [
  { x: 7, y: 68, name: "启程" },
  { x: 14, y: 38, name: "资料" },
  { x: 24, y: 30, name: "观察" },
  { x: 34, y: 48, name: "业务营地" },
  { x: 43, y: 71, name: "练习" },
  { x: 53, y: 62, name: "协作" },
  { x: 61, y: 37, name: "评审" },
  { x: 70, y: 29, name: "项目峡湾" },
  { x: 79, y: 47, name: "交付" },
  { x: 86, y: 70, name: "复盘" },
  { x: 91, y: 47, name: "挑战" },
  { x: 95, y: 28, name: "成果灯塔" },
  { x: 98, y: 56, name: "终点" },
];

function GrowthMapRoute({
  currentWeek,
  selectedWeekIndex,
  onSelectWeek,
  selectedDateLabel,
  todayTasksCount,
  pendingTasksCount,
}: {
  currentWeek: number;
  selectedWeekIndex: number;
  onSelectWeek: (weekIndex: number) => void;
  selectedDateLabel: string;
  todayTasksCount: number;
  pendingTasksCount: number;
}) {
  const milestones = [
    { day: "30", label: "熟悉业务检查点", week: 4, place: "业务营地" },
    { day: "60", label: "项目参与检查点", week: 8, place: "项目峡湾" },
    { day: "90", label: "成果复盘检查点", week: 12, place: "成果灯塔" },
  ];
  const currentStop = growthMapStops[Math.min(selectedWeekIndex, growthMapStops.length - 1)];
  const progress = Math.min(100, Math.max(0, (selectedWeekIndex / 12) * 100));

  return (
    <div className="growth-map-route overflow-hidden rounded-lg border border-[var(--role-border)] bg-gradient-to-br from-white via-white/70 to-emerald-50/50 p-2">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <div className="flex items-center gap-2">
            <MapPinned className="h-4 w-4 text-[var(--role-accent)]" />
            <p className="text-sm font-black text-slate-950">90 天成长地图</p>
          </div>
          <p className="mt-1 text-xs font-semibold text-slate-500">沿着路线推进 13 个成长站点，点击站点切换周。</p>
        </div>
        <span className="rounded-full bg-white px-2.5 py-1 text-xs font-black text-[var(--role-accent)] ring-1 ring-[var(--role-border)]">
          当前第 {currentWeek} 周 · {currentStop.name}
        </span>
      </div>
      <div className="mt-2 overflow-x-auto rounded-lg bg-white/82 p-2 ring-1 ring-[var(--role-border)]">
        <div className="relative min-h-[168px] min-w-[760px] overflow-hidden rounded-lg border border-[var(--role-border)] bg-[radial-gradient(circle_at_18%_24%,rgba(37,99,235,0.12),transparent_18%),radial-gradient(circle_at_78%_32%,rgba(16,185,129,0.14),transparent_20%),linear-gradient(180deg,#f8fbff,#ffffff)] p-3 md:min-w-0">
          <div className="absolute left-[8%] top-[16%] rounded-full bg-white/75 px-3 py-1 text-[11px] font-black text-[var(--role-accent)] ring-1 ring-[var(--role-border)]">学习湾</div>
          <div className="absolute left-[44%] top-[14%] rounded-full bg-white/75 px-3 py-1 text-[11px] font-black text-emerald-700 ring-1 ring-emerald-100">协作桥</div>
          <div className="absolute bottom-[13%] left-[72%] rounded-full bg-white/75 px-3 py-1 text-[11px] font-black text-[var(--role-accent)] ring-1 ring-[var(--role-border)]">复盘谷</div>
          <svg className="absolute inset-0 h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
            <path d="M 7 68 C 18 20 31 24 42 70 S 61 20 74 31 S 90 84 98 56" fill="none" stroke="#e2e8f0" strokeLinecap="round" strokeWidth="3" />
            <path
              d="M 7 68 C 18 20 31 24 42 70 S 61 20 74 31 S 90 84 98 56"
              fill="none"
              pathLength="100"
              stroke="var(--role-accent)"
              strokeDasharray={`${progress} 100`}
              strokeLinecap="round"
              strokeWidth="3"
            />
          </svg>
          {growthMapStops.map((stop, index) => {
            const active = index === selectedWeekIndex;
            const passed = index < selectedWeekIndex;
            const milestone = milestones.find((item) => item.week === index + 1);
            return (
              <button
                key={`${stop.name}-${index}`}
                onClick={() => onSelectWeek(index)}
                className="group absolute -translate-x-1/2 -translate-y-1/2 rounded-xl px-1 py-1 text-center transition hover:bg-white/70"
                style={{ left: `${stop.x}%`, top: `${stop.y}%` }}
              >
                <span
                  className={cn(
                    "relative z-10 mx-auto flex h-9 w-9 items-center justify-center rounded-full border text-xs font-black shadow-sm transition",
                    active && "border-[var(--role-accent)] bg-[var(--role-accent)] text-white shadow-[var(--role-shadow)] ring-4 ring-[var(--role-border)]",
                    passed && !active && "border-emerald-200 bg-emerald-50 text-emerald-700",
                    !passed && !active && "border-slate-200 bg-white text-slate-500",
                  )}
                >
                  {milestone ? <Flag className="h-4 w-4" /> : index + 1}
                </span>
                <span className={cn("mt-1 block whitespace-nowrap text-[10px] font-bold", active ? "text-[var(--role-accent)]" : "text-slate-500")}>W{index + 1}</span>
                <span className={cn("block whitespace-nowrap text-[10px] font-semibold opacity-0 transition group-hover:opacity-100", active ? "text-[var(--role-accent)] opacity-100" : "text-slate-500")}>{stop.name}</span>
              </button>
            );
          })}
          <div
            className="pointer-events-none absolute -translate-x-1/2 -translate-y-[115%] rounded-full bg-slate-950 px-3 py-1.5 text-xs font-black text-white shadow-lg shadow-slate-900/20 transition-all"
            style={{ left: `${currentStop.x}%`, top: `${currentStop.y}%` }}
          >
            你在这里
          </div>
        </div>
        <div className="mt-2 grid grid-cols-2 gap-2 md:grid-cols-4">
          <div className="rounded-lg border border-[var(--role-border)] bg-[var(--role-soft)] px-3 py-2">
            <p className="text-xs font-black text-[var(--role-accent)]">当前站点 · {currentStop.name}</p>
            <p className="mt-1 text-sm font-bold text-slate-700">{selectedDateLabel}，今日 {todayTasksCount} 个任务，待办 {pendingTasksCount} 个</p>
          </div>
          {milestones.map((item) => (
            <div key={item.day} className="rounded-lg bg-slate-50 px-3 py-2 ring-1 ring-slate-100">
              <p className="text-xs font-black text-[var(--role-accent)]">第 {item.day} 天 · {item.label}</p>
              <p className="mt-1 text-xs font-semibold text-slate-500">{item.place}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function startOfDay(date: Date) {
  const next = new Date(date);
  next.setHours(0, 0, 0, 0);
  return next;
}

function addDays(date: Date, days: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function toDateKey(date: Date) {
  return date.toISOString().slice(0, 10);
}

function formatMonthDay(date: Date) {
  return date.toLocaleDateString("zh-CN", { month: "2-digit", day: "2-digit" });
}

function formatWeekday(date: Date) {
  return date.toLocaleDateString("zh-CN", { weekday: "short" });
}

function isIsoDate(value: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(value);
}

function taskDueToDateValue(due: string) {
  if (isIsoDate(due)) return due;
  const legacyMap: Record<string, string> = {
    今天: "2026-06-15",
    明天: "2026-06-16",
    本周二: "2026-06-16",
    本周三: "2026-06-17",
    本周四: "2026-06-18",
    本周五: defaultTaskDueDate,
    本周内: defaultTaskDueDate,
    下周一: "2026-06-22",
    下周前: "2026-06-26",
    下周五: "2026-06-26",
    两周内: "2026-06-29",
  };
  return legacyMap[due] ?? defaultTaskDueDate;
}

function inferTaskDateIndex(task: { due: string }, index: number) {
  if (isIsoDate(task.due)) {
    const start = new Date(`${studentCalendarStartDate}T00:00:00`);
    const due = new Date(`${task.due}T00:00:00`);
    const diffDays = Math.round((due.getTime() - start.getTime()) / 86400000);
    return Math.min(Math.max(diffDays, 0), 4);
  }
  if (task.due.includes("今天")) return 0;
  if (task.due.includes("明天")) return 1;
  if (task.due.includes("三")) return 2;
  if (task.due.includes("四")) return 3;
  if (task.due.includes("五")) return 4;
  if (task.due.includes("下周")) return 4;
  return Math.min(index, 4);
}

function StudentDashboard({
  user,
  records,
  onAddRecord,
  onUpdateRecord,
  managedInterns,
  onUpdateTask,
  reviewRecords,
}: {
  user: AuthUser;
  records: CollaborationRecord[];
  onAddRecord: (record: Omit<CollaborationRecord, "id" | "createdAt">) => void;
  onUpdateRecord: (id: string, patch: Partial<CollaborationRecord>) => void;
  managedInterns: ManagedIntern[];
  onUpdateTask: (internId: string, taskId: string, patch: Partial<GrowthTask>) => void;
  reviewRecords: ReviewRecord[];
}) {
  const studentRef = useRef<HTMLDivElement | null>(null);
  const [showQuestions, setShowQuestions] = useState(false);
  const [questions, setQuestions] = useState<string[]>([]);
  const [studentQuestionDraft, setStudentQuestionDraft] = useState("");
  const [questionFocus, setQuestionFocus] = useState("业务指标怎么理解？");
  const [questionError, setQuestionError] = useState("");
  const [questionMessage, setQuestionMessage] = useState("");
  const studentVisibleInterns = useMemo(() => getVisibleInterns(user, managedInterns), [managedInterns, user]);
  const studentVisibleRecords = useMemo(() => getVisibleRecords(user, managedInterns, records), [managedInterns, records, user]);
  const currentIntern = studentVisibleInterns[0];
  const [tasks, setTasks] = useState(studentWeeklyTasks);
  const [taskMessage, setTaskMessage] = useState("");
  const [questionLoading, setQuestionLoading] = useState(false);
  const [dailyPlan, setDailyPlan] = useState<AIDailyPlan | null>(null);
  const [dailyPlanLoading, setDailyPlanLoading] = useState(false);
  const [dailyPlanError, setDailyPlanError] = useState("");
  const [selectedWeekIndex, setSelectedWeekIndex] = useState(0);
  const [selectedDateKey, setSelectedDateKey] = useState(studentCalendarStartDate);
  const positionRole = inferPositionRole(user);
  const studentGrowthStages = positionGrowthStages[positionRole];
  const allGrowthDays = useMemo(() => {
    const startDate = startOfDay(new Date(`${studentCalendarStartDate}T00:00:00`));
    return Array.from({ length: studentGrowthCycleDays }, (_, index) => {
      const date = addDays(startDate, index);
      return {
        key: toDateKey(date),
        date,
        label: `第${index + 1}天`,
        weekday: formatWeekday(date),
        monthDay: formatMonthDay(date),
      };
    });
  }, []);
  const maxGrowthWeekIndex = Math.ceil(studentGrowthCycleDays / studentGrowthWeekSize) - 1;
  const weekDays = useMemo(
    () => allGrowthDays.slice(selectedWeekIndex * studentGrowthWeekSize, selectedWeekIndex * studentGrowthWeekSize + studentGrowthWeekSize),
    [allGrowthDays, selectedWeekIndex],
  );
  const currentWeekStart = weekDays[0] ?? allGrowthDays[0];
  const currentWeekEnd = weekDays[weekDays.length - 1] ?? currentWeekStart;
  const currentWeekNumber = selectedWeekIndex + 1;
  const hasGrowthStarted = isGrowthCycleStarted();
  const displayTasks = currentIntern
    ? currentIntern.tasks.map((task, index) => ({
        id: task.id,
        label: task.title,
        status: task.status,
        due: task.due,
        owner: task.owner === "导师" ? "导师协助" : "我负责",
        note: task.note,
        dateKey: allGrowthDays[inferTaskDateIndex(task, index)]?.key ?? allGrowthDays[0].key,
      }))
    : tasks.map((task, index) => ({
        ...task,
        id: task.label,
        owner: "实习生" as const,
        note: "本周默认任务",
        dateKey: allGrowthDays[inferTaskDateIndex(task, index)]?.key ?? allGrowthDays[0].key,
      }));
  const completedTasks = displayTasks.filter((task) => task.status === "已完成").length;
  const taskCompletionProgress = displayTasks.length ? Math.round((completedTasks / displayTasks.length) * 100) : 0;
  const studentProgress = taskCompletionProgress;
  const pendingTasks = displayTasks.filter((task) => task.status !== "已完成");
  const weekTodoTasks = displayTasks.filter((task) => task.status !== "已完成");
  const completedWeekTasks = displayTasks.filter((task) => task.status === "已完成");
  const todayTasks = displayTasks.filter((task) => task.dateKey === selectedDateKey);
  const selectedDate = allGrowthDays.find((day) => day.key === selectedDateKey) ?? currentWeekStart;
  const primaryTask = pendingTasks[0] ?? displayTasks[0];
  const supportFocus = currentIntern?.reason || (positionRole === "产品" ? "业务指标理解" : `${positionRole}岗核心能力补齐`);
  const taskStatusByLabel = new Map<string, TaskStatus>(displayTasks.map((task) => [task.label, task.status as TaskStatus]));
  const studentGrowthStagesForDisplay = studentGrowthStages.map((stage) => ({
    ...stage,
    tasks: stage.tasks.map((task) => ({
      ...task,
      status: taskStatusByLabel.get(task.label) ?? "未完成",
    })),
  }));
  const mentorFeedbackRecords = studentVisibleRecords.filter(
    (record) => record.internName === user.name && record.sourceRole === "导师" && record.targetRole === "实习生",
  );
  const combinedMentorFeedbackRecords = [
    ...mentorFeedbackRecords,
    ...(currentIntern?.feedbacks ?? []).map((feedback) => ({
      id: feedback.id,
      title: `${user.name} 的导师反馈记录`,
      detail: feedback.content,
      status: `${feedback.score}/5 分`,
      createdAt: feedback.createdAt,
    })),
  ];
  const recentMentorFeedbacks = combinedMentorFeedbackRecords.slice(0, 3).map((record) => ({
    content: record.detail,
    status: record.status,
    createdAt: record.createdAt,
  }));
  const latestMentorFeedback = recentMentorFeedbacks[0]?.content ?? "";
  const dynamicSuggestionContext = {
    role: currentIntern?.title ?? user.title ?? `${positionRole}岗实习生`,
    supportFocus,
    selectedDate: `${selectedDate.monthDay} ${selectedDate.weekday}`,
    todayTasks: todayTasks.map((task) => ({
      name: task.label,
      status: task.status,
      owner: task.owner,
      note: task.note,
    })),
    pendingTasks: pendingTasks.slice(0, 5).map((task) => ({
      name: task.label,
      due: task.due,
      note: task.note,
    })),
    mentorFeedbacks: recentMentorFeedbacks,
    frontEndJudgement: `当前是${currentIntern?.title ?? user.title ?? `${positionRole}岗实习生`}，${selectedDate.monthDay} ${selectedDate.weekday} 有 ${todayTasks.length} 个任务，本周还有 ${pendingTasks.length} 个未完成任务，当前支持项是「${supportFocus}」。${latestMentorFeedback ? `导师最近反馈是「${latestMentorFeedback}」。` : "目前还没有导师反馈记录，建议只基于当天任务和支持项给出轻量建议。"}建议围绕「${todayTasks[0]?.label ?? primaryTask?.label ?? supportFocus}」把学习动作、导师反馈和可交付产出对齐。`,
  };
  const mentorQuestionRecords = studentVisibleRecords.filter(
    (record) => record.internName === user.name && record.sourceRole === "实习生" && record.targetRole === "导师" && record.question,
  );
  const studentActionRecords = studentVisibleRecords.filter(
    (record) => record.internName === user.name && record.sourceRole === "HR" && record.targetRole === "实习生",
  );
  const studentReviewRecords = reviewRecords.filter((record) => record.internName === user.name).slice(0, 4);
  const studentSignals = useMemo(
    () => getVisibleGrowthSignals(user, currentIntern ? [currentIntern] : [], studentVisibleRecords),
    [currentIntern, studentVisibleRecords, user],
  );
  const currentStageIndex = Math.min(2, Math.floor(selectedWeekIndex / 4));
  const currentStage = studentGrowthStagesForDisplay[currentStageIndex] ?? studentGrowthStagesForDisplay[0];
  const currentStageDone = currentStage?.tasks.filter((task) => task.status === "已完成").length ?? 0;
  const currentStageTotal = currentStage?.tasks.length ?? 0;
  const currentStopName = growthMapStops[Math.min(selectedWeekIndex, growthMapStops.length - 1)]?.name ?? "启程";

  useResultReveal(studentRef, [dailyPlan, showQuestions, taskMessage, questionMessage], "[data-gsap-result]");

  const generateDailyPlan = async () => {
    if (!hasGrowthStarted) {
      setDailyPlanLoading(false);
      setDailyPlanError("");
      setDailyPlan({
        recommendation: "任务、反馈和提问录入后会生成今日建议",
        reason: "当前账号已绑定导师和岗位方向，但还没有形成可计算的成长数据。建议先补充个人目标、资料权限和首次沟通记录。",
        actions: [
          "确认导师和岗位方向是否正确",
          "整理资料权限和业务文档中的问题",
          "任务记录录入后再推进成长地图里的节点任务",
        ],
      });
      return;
    }
    setDailyPlanLoading(true);
    setDailyPlanError("");
    setDailyPlan(null);
    try {
      const result = await requestAiGeneration<AIDailyPlan>("dailyPlan", {
        student: {
          name: user.name,
          title: currentIntern?.title ?? user.title,
          department: currentIntern?.department ?? user.department,
          mentor: currentIntern?.mentor ?? user.mentor,
          week: currentIntern?.week ?? "第 1 周",
          supportFocus,
        },
        date: selectedDate,
        tasks: todayTasks,
        weekTasks: displayTasks,
        stage: studentGrowthStagesForDisplay[0],
        latestFeedback: latestMentorFeedback,
        mentorFeedbacks: recentMentorFeedbacks,
        frontendSuggestion: dynamicSuggestionContext,
        completion: {
          completedTasks,
          totalTasks: displayTasks.length,
          taskCompletionProgress,
        },
      });
      setDailyPlan(result.output);
    } catch {
      setDailyPlanError("AI 建议暂时不可用，已先给你一版本地成长建议。");
      setDailyPlan({
        recommendation: `今天先完成「${todayTasks[0]?.label ?? primaryTask?.label ?? supportFocus}」，把交付物和不确定点各整理 1 条。`,
        reason: `当前本周还有 ${pendingTasks.length} 个待办，成长重点是「${supportFocus}」。先推进最明确的节点任务，可以减少迷茫感，也方便导师给出具体反馈。`,
        actions: [
          `先花 25 分钟处理「${todayTasks[0]?.label ?? primaryTask?.label ?? "当前任务"}」`,
          "把不确定的名词、指标或验收标准写成一句具体问题",
          `完成后在本页点击“完成”，再用下方提问助手同步导师`,
        ],
      });
    } finally {
      setDailyPlanLoading(false);
    }
  };

  useEffect(() => {
    const timer = window.setTimeout(() => void generateDailyPlan(), 0);
    return () => window.clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDateKey]);

	  const updateTaskStatus = (taskId: string, label: string) => {
	    if (!hasGrowthStarted) {
	      setTaskMessage("任务录入后会自动同步到成长地图");
	      return;
	    }
    const targetTask = displayTasks.find((task) => task.id === taskId);
    if (!targetTask || targetTask.status === "已完成") return;
    const nextStatus = "已完成";

	    if (currentIntern) {
	      onUpdateTask(currentIntern.id, taskId, { status: nextStatus, due: nextStatus === "已完成" ? "已完成" : targetTask.due });
	      onAddRecord({
	        internName: user.name,
	        sourceRole: "实习生",
	        targetRole: "导师",
	        title: `${user.name} 完成成长任务`,
	        detail: `已完成「${label}」，请导师在下次带教时确认产出质量，并给出下一步建议。`,
	        status: "已同步",
	      });
	    } else {
	      setTasks((current) =>
        current.map((task) => {
          if (task.label !== label) return task;
          if (task.status === "已完成") return task;
          return { ...task, status: nextStatus, due: nextStatus === "已完成" ? "已完成" : task.due };
        }),
      );
    }
    setTaskMessage(`已更新「${label}」的任务状态，成长进度已重新计算。`);
  };

  const generateQuestions = async () => {
    setQuestionLoading(true);
    setShowQuestions(false);
    setQuestionError("");
    setQuestionMessage("");
    try {
      const result = await requestAiGeneration<AIQuestions>("questions", {
        student: {
          name: user.name,
          title: user.title,
          department: user.department,
	          mentor: user.mentor,
	          week: currentIntern?.week ?? "第 3 周",
	          progress: taskCompletionProgress,
	          supportStatus: supportFocus,
	        },
        weeklyTasks: displayTasks,
        growthStages: studentGrowthStages,
        aiSuggestion: `本周当前重点是${supportFocus}，建议结合任务「${primaryTask?.label ?? "成长记录"}」向导师确认标准。`,
        focusTopic: questionFocus,
        studentDraft: studentQuestionDraft || "实习生没有输入具体问题，请根据当前任务和成长建议生成适合向导师请教的问题。",
        variationSeed: `${questionFocus}-${Date.now()}`,
      });
      setQuestions(result.output.questions?.slice(0, 3) ?? []);
      setShowQuestions(true);
      setQuestionMessage("提问清单已生成，可直接发送给导师或继续调整。");
    } catch (error) {
      setQuestionError(error instanceof Error ? error.message : "AI 生成失败，请稍后重试。");
    } finally {
      setQuestionLoading(false);
    }
  };

  const sendQuestionToMentor = (question: string) => {
    onAddRecord({
      internName: user.name,
      sourceRole: "实习生",
      targetRole: "导师",
      title: `${user.name} 向导师提问`,
      detail: question,
      question,
      status: "待处理",
    });
    setQuestionMessage("问题已发送给导师，可在下方「导师问答」查看回复状态。");
  };

  const changeGrowthWeek = (direction: -1 | 1) => {
    const next = Math.max(0, Math.min(maxGrowthWeekIndex, selectedWeekIndex + direction));
    const nextStart = allGrowthDays[next * studentGrowthWeekSize];
    setSelectedWeekIndex(next);
    if (nextStart) {
      setSelectedDateKey(nextStart.key);
    }
  };

  const selectGrowthWeek = (weekIndex: number) => {
    const next = Math.max(0, Math.min(maxGrowthWeekIndex, weekIndex));
    const nextStart = allGrowthDays[next * studentGrowthWeekSize];
    setSelectedWeekIndex(next);
    if (nextStart) {
      setSelectedDateKey(nextStart.key);
    }
  };

  return (
    <div ref={studentRef} className="space-y-4">
      <Card className="overflow-hidden border-slate-200 bg-white p-0 shadow-sm" data-list-panel="">
        <div className="border-b border-slate-100 bg-slate-50/80 px-4 py-2.5">
          <div className="flex flex-col gap-2.5 xl:flex-row xl:items-center xl:justify-between">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
                <h2 className="text-xl font-black tracking-[0] text-slate-950 lg:text-[1.35rem]">
                  我的成长地图
                </h2>
                <span className="rounded-full bg-[var(--role-soft)] px-2.5 py-1 text-xs font-black text-[var(--role-accent)] ring-1 ring-[var(--role-border)]">
                  {hasGrowthStarted ? `第 ${currentWeekNumber}/13 周 · ${selectedDate.label} · ${currentStopName}` : "任务录入后会形成本周成长节点"}
                </span>
                <span className="text-xs font-bold text-slate-500">
                  {hasGrowthStarted ? `${currentWeekStart.monthDay}-${currentWeekEnd.monthDay} · ${selectedDate.monthDay} ${selectedDate.weekday}` : "任务、反馈和提问录入后会生成成长进度"}
                </span>
              </div>
              <div className="mt-2 flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1 text-xs font-bold text-slate-600">
                <span>{currentIntern?.title ?? user.title ?? "产品运营实习生"}</span>
                <span className="h-3 w-px bg-slate-200" />
                <span>导师 {currentIntern?.mentor ?? user.mentor ?? "王老师"}</span>
                <span className="h-3 w-px bg-slate-200" />
                <span className="min-w-0 truncate">重点 {supportFocus}</span>
              </div>
              <div className="mt-1.5 flex items-center gap-2 text-xs font-bold text-slate-500">
                <span className="h-2 w-2 rounded-full bg-[var(--role-accent)]" />
                <span>{hasGrowthStarted ? `当前位置：第 ${currentWeekNumber} 周 · ${selectedDate.label} · ${currentStopName}` : "当前位置：成长地图 · 任务录入后自动累计"}</span>
              </div>
            </div>
            <div className="flex w-full flex-wrap items-center justify-between gap-3 rounded-lg border border-slate-200 bg-white/84 px-2.5 py-2 xl:w-auto">
              <div className="flex items-center gap-1.5">
                <button
                  className="inline-flex items-center gap-1 rounded-md px-2 py-1.5 text-xs font-black text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                  disabled={selectedWeekIndex === 0}
                  onClick={() => changeGrowthWeek(-1)}
                >
                  <ChevronRight className="h-3.5 w-3.5 rotate-180" />
                  上一周
                </button>
                <span className="rounded-md bg-[var(--role-soft)] px-2 py-1 text-xs font-black text-[var(--role-accent)]">90 天路线</span>
                <button
                  className="inline-flex items-center gap-1 rounded-md px-2 py-1.5 text-xs font-black text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                  disabled={selectedWeekIndex === maxGrowthWeekIndex}
                  onClick={() => changeGrowthWeek(1)}
                >
                  下一周
                  <ChevronRight className="h-3.5 w-3.5" />
                </button>
              </div>
              <div className="flex min-w-[150px] items-center gap-3 border-l border-slate-100 pl-3">
                <div className="min-w-0">
                  <p className="text-xs font-bold text-slate-500">成长进度</p>
                  <p className="text-lg font-black leading-none text-slate-950">{studentProgress}%</p>
                </div>
                <div className="min-w-[72px] flex-1">
                  <div className="h-1.5 rounded-full bg-slate-100">
                    <div className="h-1.5 rounded-full bg-[var(--role-accent)] transition-all duration-500" data-progress-fill="" style={{ width: `${studentProgress}%` }} />
                  </div>
                  <p className="mt-1 text-xs font-black text-emerald-700">{hasGrowthStarted ? `${completedTasks}/${displayTasks.length} 已完成` : "录入后自动形成"}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="mentor-sync-strip mx-4 mt-4" aria-label="学生端、导师端、HRBP端数据同步状态">
          {[
            ["我的成长端", `${displayTasks.length} 项任务 · ${mentorQuestionRecords.length} 条提问`],
            ["导师端", `${combinedMentorFeedbackRecords.length} 条反馈${combinedMentorFeedbackRecords.length ? "" : "· 导师回复后自动回流"}`],
            ["HRBP端", `${studentActionRecords.length} 条协同 · ${studentReviewRecords.length} 条复盘`],
          ].map(([label, value], index) => (
            <div key={label} className="mentor-sync-node" style={{ animationDelay: `${index * 160}ms` }}>
              <span>{label}</span>
              <strong>{value}</strong>
            </div>
          ))}
          <span className="mentor-sync-line" aria-hidden="true" />
          <span className="mentor-sync-packet mentor-sync-packet-a" aria-hidden="true" />
          <span className="mentor-sync-packet mentor-sync-packet-b" aria-hidden="true" />
        </div>

        {!hasGrowthStarted && (
          <div className="mx-4 mt-4 rounded-lg border border-dashed border-[var(--role-border)] bg-[var(--role-soft)] px-4 py-3">
            <p className="text-sm font-black text-[var(--role-accent)]">任务、反馈和提问录入后自动形成</p>
            <p className="mt-1 text-sm leading-6 text-slate-600">
              系统已完成账号和导师绑定；任务、反馈和提问记录录入后，会自动更新成长进度、建议和导师协同信息。
            </p>
          </div>
        )}

        <div className="px-4 pt-4">
          <GrowthMapRoute
            currentWeek={currentWeekNumber}
            selectedWeekIndex={selectedWeekIndex}
            onSelectWeek={selectGrowthWeek}
            selectedDateLabel={selectedDate.label}
            todayTasksCount={todayTasks.length}
            pendingTasksCount={pendingTasks.length}
          />
        </div>

        <div className="grid items-start gap-4 p-4 2xl:grid-cols-[minmax(0,1fr)_300px]">
          <div className="min-w-0 space-y-4">
            <div className="grid auto-cols-[minmax(92px,1fr)] grid-flow-col gap-2 overflow-x-auto pb-2 md:grid-flow-row md:grid-cols-7 md:overflow-visible md:pb-0">
              {weekDays.map((day) => {
                const dayTasks = displayTasks.filter((task) => task.dateKey === day.key);
                const doneCount = dayTasks.filter((task) => task.status === "已完成").length;
                const active = day.key === selectedDateKey;
                const weekend = day.date.getDay() === 0 || day.date.getDay() === 6;
                return (
                  <button
                    key={day.key}
                    onClick={() => setSelectedDateKey(day.key)}
                    className={cn(
                      "min-w-0 rounded-lg border p-2 text-left transition",
                      active && "border-[var(--role-border)] bg-[var(--role-soft)] ring-2 ring-[var(--role-border)]",
                      !active && weekend && "border-slate-100 bg-slate-50/70 text-slate-400 hover:border-slate-200",
                      !active && !weekend && "border-slate-200 bg-white hover:border-[var(--role-border)] hover:bg-slate-50",
                    )}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="whitespace-nowrap text-xs font-black text-[var(--role-accent)]">{day.label}</span>
                      <span className="text-xs font-semibold text-slate-500">{day.monthDay}</span>
                    </div>
                    <p className="mt-1.5 text-xs font-semibold text-slate-500">{day.weekday}</p>
                    <p className={cn("mt-2 text-sm font-black", weekend && !dayTasks.length ? "text-slate-400" : "text-slate-950")}>
                      {weekend && !dayTasks.length ? "休息" : `${doneCount}/${dayTasks.length} 完成`}
                    </p>
                  </button>
                );
              })}
            </div>

            <div className="rounded-lg border border-slate-200 bg-white p-3">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-base font-black text-slate-950">{hasGrowthStarted ? `${selectedDate.label}节点任务` : "当前任务池"}</p>
                  <p className="mt-1 text-sm text-slate-500">{hasGrowthStarted ? "沿着今天的成长节点推进学习和交付动作。" : "任务状态录入后会自动同步到成长地图"}</p>
                </div>
                <span className="rounded-full bg-[var(--role-soft)] px-3 py-1 text-xs font-bold text-[var(--role-accent)] ring-1 ring-[var(--role-border)]">
                  {todayTasks.filter((task) => task.status === "已完成").length}/{todayTasks.length} 完成
                </span>
              </div>
              <div className="mt-3 grid gap-2">
                {todayTasks.length > 0 ? (
                  todayTasks.map((task) => (
                    <div key={task.id} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-slate-100 bg-slate-50 p-2.5">
                      <div className="flex items-start gap-3">
                        <CheckCircle2 className={cn("mt-0.5 h-5 w-5", task.status === "已完成" ? "text-emerald-500" : "text-slate-300")} />
                        <div>
                          <p className="text-sm font-bold text-slate-950">{task.label}</p>
                          <p className="mt-1 text-xs text-slate-500">{task.owner} · {task.note}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {hasGrowthStarted ? <StatusPill status={task.status} /> : <span className="inline-flex items-center rounded-md border border-slate-200 bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-500">待录入</span>}
                        <Button variant={task.status === "已完成" || !hasGrowthStarted ? "ghost" : "primary"} className="px-3 py-2 text-xs" disabled={task.status === "已完成" || !hasGrowthStarted} onClick={() => updateTaskStatus(task.id, task.label)}>
                          {!hasGrowthStarted ? "待录入" : task.status === "已完成" ? "已完成" : "完成"}
                        </Button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50 px-4 py-5 text-center text-sm text-slate-500">
                    这一天还没有节点任务，适合复盘本周记录或提前整理导师问题。
                  </div>
                )}
              </div>
              {taskMessage && <FeedbackNotice tone="success" className="mt-3">{taskMessage}</FeedbackNotice>}
            </div>
          </div>

          <div className="min-w-0 space-y-3">
            <div className="rounded-lg border border-[var(--role-border)] bg-white p-3 shadow-[0_8px_24px_rgba(24,119,255,0.06)]">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-[var(--role-accent)]" />
                  <p className="text-sm font-black text-[var(--role-accent)]">AI 今日建议</p>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="ghost" className="px-3 py-1.5 text-xs" onClick={generateDailyPlan} disabled={dailyPlanLoading}>
                    {dailyPlanLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
                    {dailyPlanLoading ? "AI 正在分析..." : hasGrowthStarted ? "重新生成建议" : "生成建议"}
                  </Button>
                </div>
              </div>
              {dailyPlanError && <FeedbackNotice tone="warning" className="mt-3 text-xs">{dailyPlanError}</FeedbackNotice>}
              {dailyPlan ? (
                <div className="mt-3 space-y-2">
                  <div className="rounded-lg bg-[var(--role-soft)] p-3 ring-1 ring-[var(--role-border)]" data-gsap-result="">
                    <p className="text-xs font-black text-[var(--role-accent)]">今日判断</p>
                    <p className="mt-1 text-sm leading-6 text-slate-700">{dailyPlan.recommendation}</p>
                  </div>
                  <div className="rounded-lg bg-slate-50 p-2.5 ring-1 ring-slate-100" data-gsap-result="">
                    <p className="line-clamp-2 text-xs font-semibold leading-5 text-slate-600">{dailyPlan.reason}</p>
                    <div className="mt-2 space-y-1.5">
                      {dailyPlan.actions.slice(0, 2).map((action, index) => (
                        <div key={action} className="flex gap-2 rounded-md bg-white px-2.5 py-1.5 text-xs leading-5 text-slate-700 ring-1 ring-slate-100" data-gsap-result="">
                          <span className="font-black text-[var(--role-accent)]">{index + 1}.</span>
                          {action}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="mt-3 rounded-lg bg-[var(--role-soft)] p-4 text-sm font-semibold text-slate-500 ring-1 ring-[var(--role-border)]">
                  {dailyPlanLoading ? "AI 正在根据当前任务和岗位生成今日建议..." : "点击“重新生成建议”获取今日建议。"}
                </div>
              )}
            </div>
          </div>
        </div>
      </Card>

      <Card data-list-panel="">
        <SectionTitle icon={GraduationCap} title="当前站点详情" subtitle="把地图里的当前位置翻译成今天该推进的成长动作" />
        <div className="mt-4 grid gap-4 xl:grid-cols-[0.86fr_1.14fr]">
          <div className="rounded-lg border border-[var(--role-border)] bg-[var(--role-soft)] p-4 shadow-[0_10px_28px_rgba(37,99,235,0.06)]">
            <p className="text-xs font-black text-[var(--role-accent)]">{currentStage?.period ?? "当前阶段"} · 第 {currentWeekNumber} 周</p>
            <h3 className="mt-2 text-xl font-black text-slate-950">{currentStage?.theme ?? "阶段目标推进"}</h3>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              当前阶段已完成 {currentStageDone}/{currentStageTotal} 个节点。本周优先把「{primaryTask?.label ?? supportFocus}」推进到可反馈状态。
            </p>
            <div className="mt-4 h-2 rounded-full bg-white ring-1 ring-[var(--role-border)]">
              <div className="h-2 rounded-full bg-[var(--role-accent)]" data-progress-fill="" style={{ width: `${currentStageTotal ? Math.round((currentStageDone / currentStageTotal) * 100) : 0}%` }} />
            </div>
          </div>
          <div className="grid min-w-0 gap-2 md:grid-cols-2">
            {(currentStage?.tasks ?? []).length > 0 ? (currentStage?.tasks ?? []).map((task) => (
              <div key={task.label} className="flex min-h-[58px] items-center justify-between gap-3 rounded-lg border border-slate-200 bg-white px-3 py-2.5 shadow-[0_8px_22px_rgba(15,23,42,0.04)]">
                <span className="min-w-0 text-sm font-bold leading-5 text-slate-800">{task.label}</span>
                <StatusPill status={task.status} />
              </div>
            )) : (
              <div className="md:col-span-2 rounded-lg border border-dashed border-slate-200 bg-slate-50 px-4 py-5 text-center text-sm font-bold text-slate-500">
                阶段任务录入后会在这里展示，并同步更新成长地图。
              </div>
            )}
          </div>
        </div>
      </Card>

      <div className="grid gap-4 xl:grid-cols-[minmax(340px,0.72fr)_minmax(420px,1fr)]">
        <Card data-chart-card="">
          <SectionTitle icon={ClipboardList} title="本周待办池" subtitle={hasGrowthStarted ? "未完成和已完成分开沉淀，避免和今日任务重复" : "当前展示已配置任务，状态录入后会自动更新"} />
          <div className="mt-4 grid gap-2">
            {weekTodoTasks.length > 0 ? weekTodoTasks.map((task) => (
              <div key={task.label} className="future-card flex items-center justify-between rounded-lg border border-slate-100 bg-white p-3">
                <div className="flex items-center gap-3">
                  <CheckCircle2 className={cn("h-5 w-5", task.status === "已完成" ? "text-emerald-500" : "text-[var(--role-accent)]")} />
                  <div>
                    <p className="font-semibold text-slate-800">{task.label}</p>
                    <div className="mt-1 flex items-center gap-2">
                      <StatusPill status={task.status} />
                      <span className="text-xs text-slate-500">{task.due}</span>
                    </div>
                  </div>
                </div>
                <button
                  className={cn(
                    "shrink-0 rounded-full px-3 py-1.5 text-xs font-black transition",
                    task.status === "已完成" || !hasGrowthStarted
                      ? "cursor-default bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100"
                      : "bg-[var(--role-accent)] text-white shadow-sm shadow-[var(--role-shadow)] hover:bg-[var(--role-accent-strong)]",
                  )}
                  disabled={task.status === "已完成" || !hasGrowthStarted}
                  onClick={() => updateTaskStatus(task.id, task.label)}
                >
                  {!hasGrowthStarted ? "待录入" : task.status === "已完成" ? "已完成" : "完成"}
                </button>
              </div>
            )) : (
              <div className="rounded-lg border border-dashed border-emerald-200 bg-emerald-50 px-4 py-6 text-center text-sm font-bold text-emerald-700">
                本周待办已全部完成，可以整理复盘或向导师确认下一步挑战任务。
              </div>
            )}
          </div>
          {completedWeekTasks.length > 0 && (
            <div className="mt-4 rounded-lg bg-slate-50 p-3 ring-1 ring-slate-100">
              <p className="text-xs font-black text-slate-500">已完成记录</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {completedWeekTasks.map((task) => (
                  <span key={task.id} className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700 ring-1 ring-emerald-100">
                    {task.label}
                  </span>
                ))}
              </div>
            </div>
          )}
          {taskMessage && <FeedbackNotice tone="success" className="mt-3">{taskMessage}</FeedbackNotice>}
        </Card>
        <Card className="bg-white/92" data-list-panel="">
          <SectionTitle icon={BrainCircuit} title="AI 本周成长建议" subtitle="先写下自己的困惑，AI 会帮你整理成更适合问导师的问题" />
          <p className="mt-4 text-sm leading-6 text-slate-600">
            你当前的成长重点是「{supportFocus}」。建议先围绕「{primaryTask?.label ?? "本周核心任务"}」确认验收标准，再把不确定点整理成 1v1 问题。
          </p>
          <div className="mt-4 rounded-lg border border-[var(--role-border)] bg-white/75 p-3">
            <label className="text-sm font-black text-slate-950">我想问导师</label>
            <textarea
              value={studentQuestionDraft}
              onChange={(event) => {
                setStudentQuestionDraft(event.target.value);
                setQuestionFocus(event.target.value.trim() ? "自定义问题" : "业务指标怎么理解？");
                setShowQuestions(false);
                setQuestionError("");
                setQuestionMessage("");
              }}
              placeholder="比如：我做竞品分析时不知道怎么把产品功能和 GMV、转化率这些指标联系起来，也不确定需求评审前应该准备哪些问题..."
              className="mt-2 min-h-24 w-full resize-none rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm leading-6 text-slate-700 outline-none transition focus:border-[var(--role-accent)] focus:bg-white focus:ring-4 focus:ring-[var(--role-border)]"
            />
            <div className="mt-3 flex flex-wrap gap-2">
              {["业务指标怎么理解？", "需求评审前怎么准备？", "我离合格水平差什么？"].map((prompt) => (
                <button
                  key={prompt}
                  onClick={() => {
                    setQuestionFocus(prompt);
                    setStudentQuestionDraft(prompt);
                    setShowQuestions(false);
                    setQuestions([]);
                    setQuestionMessage("");
                    setQuestionError("");
                  }}
                  className={cn(
                    "rounded-full px-3 py-1.5 text-xs font-bold transition",
                    questionFocus === prompt ? "bg-[var(--role-accent)] text-white shadow-md shadow-[var(--role-shadow)]" : "bg-[var(--role-soft)] text-[var(--role-accent)] hover:bg-[var(--role-soft)]",
                  )}
                >
                  + {prompt}
                </button>
              ))}
            </div>
            <p className="mt-3 text-xs font-semibold text-slate-500">当前提问主题：{questionFocus}</p>
          </div>
          <Button className="mt-4" onClick={generateQuestions} disabled={questionLoading}>
            {questionLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            {questionLoading ? "AI 正在分析..." : studentQuestionDraft.trim() ? "AI 优化成提问清单" : "AI 帮我生成提问清单"}
          </Button>
          {questionError && <FeedbackNotice tone="error" className="mt-3">{questionError}</FeedbackNotice>}
          {questionMessage && <FeedbackNotice tone="success" className="mt-3">{questionMessage}</FeedbackNotice>}
          {showQuestions && (
            <div className="mt-4 rounded-lg bg-white/80 p-3 ring-1 ring-slate-100">
              <p className="text-sm font-black text-slate-950">可直接发给导师的问题</p>
              <ol className="mt-3 space-y-2">
                {questions.map((question, index) => (
                  <li key={question} className="flex gap-3 rounded-lg bg-slate-50 p-3 text-sm leading-6 text-slate-700" data-gsap-result="">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[var(--role-accent)] text-xs font-bold text-white">{index + 1}</span>
                    <span className="flex-1">{question}</span>
                    <Button variant="ghost" className="shrink-0 px-3 py-2 text-xs" onClick={() => sendQuestionToMentor(question)}>
                      发送导师
                    </Button>
                  </li>
                ))}
              </ol>
            </div>
          )}
        </Card>
      </div>

      <Card data-list-panel="">
        <SectionTitle icon={MessageSquareText} title="导师沟通中心" subtitle="问题、回复和阶段反馈统一沉淀在这里" />
        <div className="mt-4 grid gap-4 xl:grid-cols-2">
          <div>
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm font-black text-slate-950">问答记录</p>
              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600">{mentorQuestionRecords.length} 条</span>
            </div>
            <div className="mt-3 grid gap-2">
              {mentorQuestionRecords.length > 0 ? (
                mentorQuestionRecords.map((record) => (
                  <div key={record.id} className="rounded-lg border border-slate-200 bg-white p-3">
	                    <div className="flex flex-wrap items-center justify-between gap-3">
	                      <p className="font-black text-slate-950">{record.question}</p>
	                      <div className="flex flex-wrap items-center justify-end gap-2">
	                        <SyncFlowBadge record={record} compact />
	                        <span className={cn("rounded-full px-3 py-1 text-xs font-bold", record.answer ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700")}>
	                          {record.answer ? "导师已回复" : "等待导师回复"}
	                        </span>
	                      </div>
	                    </div>
                    {record.answer ? (
                      <div className="mt-3 rounded-lg bg-[var(--role-soft)] p-3 text-sm leading-7 text-slate-700">
                        <strong className="text-slate-950">导师回复：</strong>{record.answer}
                        <p className="mt-2 text-xs font-semibold text-[var(--role-accent)]">{record.answeredAt ?? "刚刚"}</p>
                      </div>
                    ) : (
                      <p className="mt-3 text-sm text-slate-500">问题已同步到导师端，导师回复后会自动显示在这里。</p>
                    )}
                  </div>
                ))
              ) : (
                <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-center">
                  <p className="text-sm font-bold text-slate-600">提问后会出现在这里</p>
                  <p className="mt-2 text-sm text-slate-500">先在上方让 AI 优化问题，再点击“发送导师”。</p>
                </div>
              )}
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm font-black text-slate-950">导师反馈</p>
              <span className="rounded-full bg-[var(--role-soft)] px-3 py-1 text-xs font-bold text-[var(--role-accent)] ring-1 ring-[var(--role-border)]">{combinedMentorFeedbackRecords.length} 条</span>
            </div>
            <div className="mt-3 grid gap-2">
              {combinedMentorFeedbackRecords.length > 0 ? (
                combinedMentorFeedbackRecords.map((record) => (
                  <div key={record.id} className="rounded-lg border border-[var(--role-border)] bg-[var(--role-soft)] p-3">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <p className="font-black text-slate-950">{record.title}</p>
	                        <p className="mt-1 text-xs font-semibold text-[var(--role-accent)]">{record.createdAt} · 来自导师</p>
	                      </div>
	                      <div className="flex flex-wrap items-center justify-end gap-2">
	                        {hasSyncFlow(record) && <SyncFlowBadge record={record} compact />}
	                        <span className="rounded-full bg-white px-3 py-1 text-xs font-bold text-[var(--role-accent)]">{record.status}</span>
	                      </div>
	                    </div>
                    <p className="mt-2 text-sm leading-6 text-slate-700">{record.detail}</p>
                  </div>
                ))
              ) : (
                <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-center">
                  <p className="text-sm font-bold text-slate-600">导师确认反馈后会出现在这里</p>
                  <p className="mt-2 text-sm text-slate-500">导师确认反馈后，你会在这里看到下一步成长重点。</p>
                </div>
              )}
            </div>
          </div>
        </div>
	        <div className="mt-4 rounded-lg border border-[var(--role-border)] bg-white/86 p-3">
	          <div className="flex flex-wrap items-center justify-between gap-3">
	            <p className="text-sm font-black text-slate-950">我的跨端同步状态</p>
            <span className="rounded-full bg-[var(--role-soft)] px-3 py-1 text-xs font-bold text-[var(--role-accent)] ring-1 ring-[var(--role-border)]">
              {studentSignals.length} 条成长信号
            </span>
          </div>
          <div className="mt-3 grid gap-2 md:grid-cols-3">
            {studentSignals.slice(0, 6).map((signal) => (
              <div key={signal.id} className="rounded-lg bg-slate-50 px-3 py-2.5 ring-1 ring-slate-100">
                <div className="flex items-center justify-between gap-2">
                  <p className="truncate text-xs font-black text-slate-800">{signal.title}</p>
                  <span className="shrink-0 rounded-full bg-white px-2 py-0.5 text-[11px] font-bold text-[var(--role-accent)]">{signal.statusLabel}</span>
                </div>
                <p className="mt-1 line-clamp-2 text-xs leading-5 text-slate-500">{signal.sourceLabel} · {signal.visibleToHrbp ? "HRBP 可查看摘要" : "仅导师同步"}</p>
              </div>
	            ))}
	          </div>
	        </div>
	        <div className="mt-4 rounded-lg border border-amber-100 bg-amber-50/70 p-3">
	          <div className="flex flex-wrap items-center justify-between gap-3">
	            <p className="text-sm font-black text-slate-950">行动待办</p>
	            <span className="rounded-full bg-white px-3 py-1 text-xs font-bold text-amber-700">{studentActionRecords.length} 项</span>
	          </div>
	          <div className="mt-3 grid gap-2">
	            {studentActionRecords.length > 0 ? (
	              studentActionRecords.map((record) => (
	                <div key={record.id} className="rounded-lg bg-white px-3 py-2.5 ring-1 ring-amber-100">
	                  <div className="flex flex-wrap items-center justify-between gap-3">
		                    <div>
		                      <p className="text-sm font-black text-slate-900">{record.title}</p>
		                      <p className="mt-1 text-xs leading-5 text-slate-600">{record.detail}</p>
		                    </div>
		                    <div className="flex flex-wrap items-center justify-end gap-2">
		                      <SyncFlowBadge record={record} compact />
		                      {record.status === "已同步" ? (
		                        <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700">已完成</span>
		                      ) : (
		                        <Button className="px-3 py-2 text-xs" onClick={() => onUpdateRecord(record.id, { status: "已同步" })}>
		                          <CheckCircle2 className="h-3.5 w-3.5" />
		                          标记完成
		                        </Button>
		                      )}
		                    </div>
		                  </div>
	                </div>
	              ))
	            ) : (
	              <p className="rounded-lg border border-dashed border-amber-200 bg-white/70 px-3 py-4 text-sm text-slate-500">
	                暂无 HRBP 分派给你的行动。后续阶段提醒会出现在这里。
	              </p>
	            )}
	          </div>
	        </div>
	              <div className="mt-4 rounded-lg border border-emerald-100 bg-emerald-50/70 p-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm font-black text-slate-950">复盘沉淀</p>
            <span className="rounded-full bg-white px-3 py-1 text-xs font-bold text-emerald-700">{studentReviewRecords.length} 条</span>
          </div>
          <div className="mt-3 grid gap-2">
            {studentReviewRecords.length > 0 ? (
              studentReviewRecords.map((record) => (
                <div key={record.id} className="rounded-lg bg-white px-3 py-2.5 ring-1 ring-emerald-100">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-sm font-black text-slate-900">{record.signalTitle}</p>
                    <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-bold text-emerald-700">已复盘</span>
                  </div>
                  <p className="mt-1 text-xs leading-5 text-slate-600">{record.conclusion}</p>
                  <p className="mt-1 text-[11px] font-semibold text-slate-400">{record.createdAt} · 由 {record.reviewer} 沉淀</p>
                </div>
              ))
            ) : (
              <p className="rounded-lg border border-dashed border-emerald-200 bg-white/70 px-3 py-4 text-sm text-slate-500">
                暂无复盘记录。HRBP 标记复盘后，会在这里看到阶段结论。
              </p>
            )}
          </div>
        </div>
</Card>
    </div>
  );
}

function MentorDashboard({
  user,
  records,
  onAddRecord,
  onUpdateRecord,
  managedInterns,
  onCreateFeedback,
  reviewRecords,
}: {
  user: AuthUser;
  records: CollaborationRecord[];
  onAddRecord: (record: Omit<CollaborationRecord, "id" | "createdAt">) => void;
  onUpdateRecord: (id: string, patch: Partial<CollaborationRecord>) => void;
  managedInterns: ManagedIntern[];
  onCreateFeedback: (internId: string, form: FeedbackFormState) => void;
  reviewRecords: ReviewRecord[];
}) {
  const mentorRef = useRef<HTMLDivElement | null>(null);
  const hasGrowthStarted = isGrowthCycleStarted();
  const mentorScopedInterns = useMemo(() => getVisibleInterns(user, managedInterns), [managedInterns, user]);
  const mentorVisibleRecords = useMemo(() => getVisibleRecords(user, managedInterns, records), [managedInterns, records, user]);
  const mentorViewInterns = useMemo(() => {
    return mentorScopedInterns.map((intern) => ({
      name: intern.name,
      title: intern.title,
      department: intern.department,
      progress: hasGrowthStarted ? intern.progress : 0,
      risk: hasGrowthStarted ? intern.risk : "低风险" as RiskLevel,
      action: hasGrowthStarted ? (intern.feedbacks.length ? "已记录反馈" : "待阶段反馈") : "录入后自动形成",
      detail: hasGrowthStarted ? (intern.reason || intern.todo || "录入后会形成风险说明，建议保持每周反馈节奏") : "导师已绑定，任务、提问和反馈录入后自动形成可追踪的成长记录",
      observationHint: hasGrowthStarted ? (intern.feedbacks[0]?.content || `${intern.name}当前成长进度 ${intern.progress}%，主要关注点是${intern.reason || intern.todo || "阶段目标推进"}。`) : `${intern.name}建议先录入首次沟通纪要、任务目标或资料权限确认结果，自动形成成长记录。`,
      focus: hasGrowthStarted ? (intern.risk === "低风险" ? "挑战任务安排" : intern.reason || "阶段能力补齐") : "录入任务和反馈后自动形成",
      weeklyRecord: intern.tasks.length
        ? intern.tasks.map((task) => `${task.title} ${hasGrowthStarted ? task.status : "待录入"}`)
        : ["确认岗位目标和首周任务", "检查工具权限与学习资料", "记录首次沟通纪要"],
      aiSignals: hasGrowthStarted ? [`成长进度 ${intern.progress}%`, `关注状态 ${attentionLabel[intern.risk]}`, `任务数量 ${intern.tasks.length}`] : ["录入任务和反馈后会自动汇总"],
      managedId: intern.id,
    }));
  }, [hasGrowthStarted, mentorScopedInterns]);
  const [selectedName, setSelectedName] = useState(mentorViewInterns[0]?.name ?? "");
  const selected = useMemo(() => mentorViewInterns.find((intern) => intern.name === selectedName) ?? mentorViewInterns[0], [mentorViewInterns, selectedName]);
  const firstMentorInternName = mentorViewInterns[0]?.name ?? "";
  const mentorInternNames = useMemo(
    () => new Set(mentorScopedInterns.map((intern) => intern.name)),
    [mentorScopedInterns],
  );
  useEffect(() => {
    if (firstMentorInternName) setSelectedName(firstMentorInternName);
  }, [firstMentorInternName, user.department, user.name]);
  const [feedback, setFeedback] = useState(selected?.observationHint ?? "");
  const [draftFeedback, setDraftFeedback] = useState<AIFeedback | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [aiError, setAiError] = useState("");
  const [saved, setSaved] = useState(false);
  const [feedbackGenerated, setFeedbackGenerated] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [mentorScores, setMentorScores] = useState<MentorScoreMap>(() => selected ? createDefaultMentorScores(selected) : {
    学习主动性: 3,
    任务完成度: 3,
    沟通协作: 3,
    岗位理解: 3,
    成长潜力: 3,
  });
  const [answerDrafts, setAnswerDrafts] = useState<Record<string, string>>({});
  const [selectedMentorWeekIndex, setSelectedMentorWeekIndex] = useState(0);
  const [selectedMentorDateKey, setSelectedMentorDateKey] = useState(studentCalendarStartDate);
  useEffect(() => {
    if (!selected) return;
    setFeedback(selected.observationHint);
    setMentorScores(createDefaultMentorScores(selected));
    setDraftFeedback(null);
    setSaved(false);
    setFeedbackGenerated(false);
  }, [selectedName, selected?.observationHint]);
  if (!selected) {
    return (
      <div className="space-y-6">
        <div className="mentor-stats-row grid gap-3 md:grid-cols-3">
          <StatCard label="负责实习生" value="0 人" icon={Users} tone="green" />
          <StatCard label="本周待反馈" value="0 条" icon={MessageSquareText} tone="amber" />
          <StatCard label="需重点关注" value="0 人" icon={AlertTriangle} tone="rose" />
        </div>
        <Card className="border-[var(--role-border)] bg-[var(--role-soft)]">
          <SectionTitle icon={LockKeyhole} title="暂无可带教学员" subtitle="导师端只展示同部门且已绑定给当前导师的实习生" />
          <p className="mt-4 text-sm leading-6 text-slate-600">
            当前账号没有匹配到「{normalizeDepartment(user.department)}」下的绑定实习生。请由 HRBP 或系统管理员在人员池管理中完成导师绑定后再查看。
          </p>
        </Card>
      </div>
    );
  }
  const relatedRecords = mentorVisibleRecords.filter((record) => record.internName === selected.name);
  const studentQuestions = relatedRecords.filter(
    (record) => record.sourceRole === "实习生" && record.targetRole === "导师" && record.question,
  );
  const mentorScopedRecords = mentorVisibleRecords;
  const selectedManagedIntern = mentorScopedInterns.find((intern) => intern.name === selected.name);
  const selectedSignals = useMemo(
    () => getVisibleGrowthSignals(user, selectedManagedIntern ? [selectedManagedIntern] : [], mentorVisibleRecords),
    [mentorVisibleRecords, selectedManagedIntern, user],
  );
  const mentorReviewRecords = reviewRecords
    .filter((record) => mentorInternNames.has(record.internName))
    .slice(0, 4);
  const mentorInternCount = mentorViewInterns.length;
  const pendingFeedbackCount = hasGrowthStarted ? mentorViewInterns.filter((intern) => intern.action.includes("待")).length : 0;
  const attentionCount = hasGrowthStarted ? mentorViewInterns.filter((intern) => intern.risk !== "低风险").length : 0;
  const unansweredQuestionCount = mentorScopedRecords.filter(
    (record) => record.sourceRole === "实习生" && record.targetRole === "导师" && record.question && !record.answer,
  ).length;
  const hrSyncCount = mentorScopedRecords.filter((record) => record.sourceRole === "HR" && record.targetRole === "导师").length;
  const publishedFeedbackCount = mentorScopedRecords.filter((record) => record.sourceRole === "导师").length;
  const averageProgress = hasGrowthStarted && mentorViewInterns.length
    ? Math.round(mentorViewInterns.reduce((sum, intern) => sum + intern.progress, 0) / mentorViewInterns.length)
    : 0;
  const mentorGrowthDays = useMemo(() => {
    const startDate = startOfDay(new Date(`${studentCalendarStartDate}T00:00:00`));
    return Array.from({ length: studentGrowthCycleDays }, (_, index) => {
      const date = addDays(startDate, index);
      return {
        key: toDateKey(date),
        date,
        label: `第${index + 1}天`,
        weekday: formatWeekday(date),
        monthDay: formatMonthDay(date),
      };
    });
  }, []);
  const maxMentorWeekIndex = Math.ceil(studentGrowthCycleDays / studentGrowthWeekSize) - 1;
  const mentorWeekDays = useMemo(
    () => mentorGrowthDays.slice(selectedMentorWeekIndex * studentGrowthWeekSize, selectedMentorWeekIndex * studentGrowthWeekSize + studentGrowthWeekSize),
    [mentorGrowthDays, selectedMentorWeekIndex],
  );
  const mentorWeekStart = mentorWeekDays[0] ?? mentorGrowthDays[0];
  const mentorWeekEnd = mentorWeekDays[mentorWeekDays.length - 1] ?? mentorWeekStart;
  const selectedMentorDate = mentorGrowthDays.find((day) => day.key === selectedMentorDateKey) ?? mentorWeekStart;
  const getMentorDayStatus = (day: { date: Date }) => {
    if (!hasGrowthStarted) return "未完成";
    const today = startOfDay(new Date(`${demoTodayDate}T00:00:00`));
    const current = startOfDay(day.date);
    if (current < today) return "已完成";
    if (current.getTime() === today.getTime()) return "进行中";
    return "未完成";
  };
  const changeMentorWeek = (direction: -1 | 1) => {
    const next = Math.max(0, Math.min(maxMentorWeekIndex, selectedMentorWeekIndex + direction));
    const nextStart = mentorGrowthDays[next * studentGrowthWeekSize];
    setSelectedMentorWeekIndex(next);
    if (nextStart) setSelectedMentorDateKey(nextStart.key);
  };
  const mentorCheckpointPlan = [
    { day: "第 1 天", action: "确认岗位目标、工具权限和首周学习资料" },
    { day: "第 3 天", action: "完成新人 Check-in，确认是否知道该学什么" },
    { day: "第 7 天", action: "检查首周任务产出，补充业务上下文" },
    { day: "第 14 天", action: "提交阶段反馈，明确一项待提升能力" },
    { day: "第 30 天", action: "完成首次成长评价并同步 HR/招聘观察结论" },
    { day: "第 45 天", action: "复盘中期成长证据，校准任务难度和带教频率" },
    { day: "第 60 天", action: "完成中期能力评价，确认是否进入加压或补强计划" },
    { day: "第 75 天", action: "检查核心项目产出，沉淀可复用的业务案例" },
    { day: "第 90 天", action: "完成周期总结、留用观察和下一阶段发展建议" },
  ];
  const mentorCheckpoints = mentorCheckpointPlan.map((checkpoint, index) => ({
    ...checkpoint,
    status: !hasGrowthStarted ? "未完成" : index < 2 ? "已完成" : index === 2 ? "进行中" : "未开始",
  }));

  useResultReveal(mentorRef, [selectedName, draftFeedback, saved], "[data-gsap-result]");

  const selectIntern = (intern: typeof mentorViewInterns[number]) => {
    setSelectedName(intern.name);
    setFeedback(intern.observationHint);
    setDraftFeedback(null);
    setIsGenerating(false);
    setAiError("");
    setSaved(false);
    setFeedbackGenerated(false);
    setIsSaving(false);
    setMentorScores(createDefaultMentorScores(intern));
  };

  const saveFeedback = () => {
    if (!draftFeedback) return;
    setIsSaving(true);
    setSaved(false);
    window.setTimeout(() => {
      onAddRecord({
        internName: selected.name,
        sourceRole: "导师",
        targetRole: "HR",
        title: `${selected.name} 阶段反馈已同步`,
        detail: `评分：${Object.entries(mentorScores).map(([key, value]) => `${key}${value}/5`).join("、")}；表现亮点：${draftFeedback.highlights}；待提升点：${draftFeedback.improvements}；下阶段建议：${draftFeedback.nextStep}`,
        status: "已同步",
      });
      onAddRecord({
        internName: selected.name,
        sourceRole: "导师",
        targetRole: "实习生",
        title: `${selected.name} 的本周导师反馈`,
        detail: `表现亮点：${draftFeedback.highlights} 待提升点：${draftFeedback.improvements} 下阶段建议：${draftFeedback.nextStep} 给你的话：${draftFeedback.messageToIntern}`,
        status: "已同步",
      });
      if (selected.managedId) {
        onCreateFeedback(selected.managedId, {
          mentor: user.name,
          content: `表现亮点：${draftFeedback.highlights}；待提升点：${draftFeedback.improvements}；下阶段建议：${draftFeedback.nextStep}`,
          score: Math.round(Object.values(mentorScores).reduce((sum, score) => sum + score, 0) / Object.values(mentorScores).length),
        });
      }
      setIsSaving(false);
      setSaved(true);
    }, 520);
  };


  const generateFeedback = async () => {
    if (!feedback.trim()) return;
    setIsGenerating(true);
    setAiError("");
    setDraftFeedback(null);
    setSaved(false);
    setFeedbackGenerated(false);

    try {
      const result = await requestAiGeneration<AIFeedback>("feedback", {
        intern: selected,
        mentor: {
          name: user.name,
          department: user.department,
        },
        observation: feedback,
        context: {
          focus: selected.focus,
          weeklyRecord: selected.weeklyRecord,
          aiSignals: selected.aiSignals,
          mentorScores,
        },
      });
      setDraftFeedback(result.output);
      setFeedbackGenerated(true);
    } catch (error) {
      setAiError(error instanceof Error ? error.message : "AI 生成失败，请稍后重试。");
    } finally {
      setIsGenerating(false);
    }
  };

	  const replyQuestion = (record: CollaborationRecord) => {
	    const answer = answerDrafts[record.id]?.trim();
	    if (!answer) return;
	    onUpdateRecord(record.id, {
	      answer,
	      answeredAt: "刚刚",
	      status: "已同步",
	      detail: `${record.question}\n导师回复：${answer}`,
	    });
	    onAddRecord({
	      internName: record.internName,
	      sourceRole: "导师",
	      targetRole: "HR",
	      title: `${record.internName} 提问已由导师回复`,
	      detail: `学员提问：「${record.question ?? record.detail}」；导师回复：「${answer}」。该记录已同步 HRBP 端用于成长信号沉淀。`,
	      status: "已同步",
	    });
	    setAnswerDrafts((current) => ({ ...current, [record.id]: "" }));
	  };
  const mentorPriorityItems = [
    {
      title: "回复学员提问",
      detail: unansweredQuestionCount > 0 ? "学生端已有未回复问题，需要导师给出明确口径。" : "当前没有未回复问题",
      value: `${unansweredQuestionCount} 条`,
      source: "学生端",
      impact: "回复后回到学生端「导师沟通中心」。",
      icon: MessageSquareText,
      tone: "blue",
    },
    {
      title: "补齐阶段反馈",
      detail: pendingFeedbackCount > 0 ? "仍有实习生缺少本周阶段反馈，会影响 HRBP 对人员成长状态的判断。" : "本周阶段反馈已覆盖当前负责对象。",
      value: `${pendingFeedbackCount} 条`,
      source: "导师端",
      impact: "发布后同步学生端反馈收件箱和 HRBP 看板。",
      icon: SquarePen,
      tone: "teal",
    },
    {
      title: "关注风险对象",
      detail: attentionCount > 0 ? "优先看中高风险学员的任务记录、提问和 HR 同步事项。" : "当前负责对象整体稳定。",
      value: `${attentionCount} 人`,
      source: "HRBP/规则",
      impact: "处理结果会沉淀为 HRBP 复盘证据。",
      icon: AlertTriangle,
      tone: "amber",
    },
    {
      title: "确认 HR 同步",
      detail: hrSyncCount > 0 ? "HRBP 已同步过协同事项，导师需要结合当前对象查看详情。" : "当前没有 HRBP 同步事项",
      value: `${hrSyncCount} 条`,
      source: "HRBP端",
      impact: "导师反馈后关闭或推进协同闭环。",
      icon: LayoutDashboard,
      tone: "slate",
    },
  ];

  return (
    <div ref={mentorRef} className="mentor-dashboard space-y-4">
      <div className="mentor-stats-row grid gap-3 md:grid-cols-3">
        <StatCard label="负责实习生" value={`${mentorInternCount} 人`} icon={Users} tone="green" />
        <StatCard label="本周待反馈" value={`${pendingFeedbackCount} 条`} icon={MessageSquareText} tone="amber" />
        <StatCard label="需重点关注" value={`${attentionCount} 人`} icon={AlertTriangle} tone="rose" />
      </div>
      <Card className="mentor-command-panel overflow-hidden border-[var(--role-border)] bg-gradient-to-br from-white via-white/70 to-emerald-50/60 p-4">
        <div className="grid gap-4 xl:grid-cols-[minmax(300px,0.82fr)_minmax(0,1.18fr)]">
          <aside className="mentor-focus-card rounded-xl border border-[var(--role-border)] bg-white/88 p-4 shadow-[0_12px_30px_rgba(15,23,42,0.06)]">
            <div className="flex items-start justify-between gap-3">
              <div className="mentor-command-heading">
                <span className="mentor-kicker">Mentor Command</span>
                <p className="text-xs font-black text-[var(--role-accent)]">当前处理对象</p>
                <h3 className="mt-2 text-2xl font-black text-slate-950">{selected.name}</h3>
                <p className="mt-1 text-sm font-semibold text-slate-500">{selected.title} · {selected.department}</p>
              </div>
              {hasGrowthStarted ? <AttentionBadge risk={selected.risk} /> : <span className="inline-flex items-center rounded-md border border-slate-200 bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">录入后自动汇总</span>}
            </div>
            <div className="mt-4 grid gap-3 sm:grid-cols-[0.72fr_1fr] xl:grid-cols-1">
              <div className="rounded-lg bg-slate-50 p-3">
                <div className="flex items-end justify-between gap-3">
                  <div>
                    <p className="text-xs font-bold text-slate-500">成长进度</p>
                    <p className="mt-1 text-3xl font-black text-slate-950">{selected.progress}%</p>
                  </div>
                  <span className="rounded-full bg-white px-3 py-1 text-xs font-black text-[var(--role-accent)] ring-1 ring-[var(--role-border)]">{selected.action}</span>
                </div>
                <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-200">
                  <div className="mentor-progress-fill h-full rounded-full" data-progress-fill="" style={{ width: `${selected.progress}%` }} />
                </div>
              </div>
              <div className="rounded-lg bg-[var(--role-soft)] p-3">
                <p className="text-xs font-black text-[var(--role-accent)]">本次辅导重点</p>
                <p className="mt-1 text-sm font-semibold leading-6 text-slate-700">{selected.focus}</p>
              </div>
            </div>
          </aside>
          <div className="min-w-0">
          <SectionTitle icon={ShieldCheck} title="今日带教工作台" subtitle="先看真实待办，再处理当前对象；导师端动作会回流学生端和 HRBP 看板" />
          <div className="mentor-sync-strip mt-4" aria-label="学生端、导师端、HRBP端数据同步状态">
            {[
              ["学生端", `${unansweredQuestionCount} 条提问待回复`],
              ["导师端", `${pendingFeedbackCount} 条反馈待确认`],
              ["HRBP端", `${hrSyncCount} 条协同记录`],
            ].map(([label, value], index) => (
              <div key={label} className="mentor-sync-node" style={{ animationDelay: `${index * 160}ms` }}>
                <span>{label}</span>
                <strong>{value}</strong>
              </div>
            ))}
            <span className="mentor-sync-line" aria-hidden="true" />
	                  <span className="mentor-sync-packet mentor-sync-packet-a" aria-hidden="true" />
	                  <span className="mentor-sync-packet mentor-sync-packet-b" aria-hidden="true" />
	                </div>
	                <div className="rounded-lg border border-[var(--role-border)] bg-white/72 px-3 py-2">
	                  <div className="flex flex-wrap items-center gap-2 text-xs font-bold text-slate-600">
	                    <span className="rounded-full bg-[var(--role-soft)] px-2.5 py-1 text-[var(--role-accent)]">联动链路</span>
	                    <span>学生完成任务或发起提问</span>
	                    <ChevronRight className="h-3.5 w-3.5 text-slate-400" />
	                    <span>导师回复/确认反馈</span>
	                    <ChevronRight className="h-3.5 w-3.5 text-slate-400" />
	                    <span>HRBP 信号池人工确认并沉淀复盘</span>
	                  </div>
	                </div>
	                <div className="mt-4 grid gap-3 md:grid-cols-3">
            {[
              {
                title: "学生端输入",
                metric: `${unansweredQuestionCount} 条待回复`,
                detail: "学员完成任务、发起提问，形成导师可处理的真实成长信号。",
                icon: GraduationCap,
                tone: "text-[var(--role-accent)] bg-[var(--role-soft)] ring-[var(--role-border)]",
              },
              {
                title: "导师端确认",
                metric: `${publishedFeedbackCount} 条已沉淀`,
                detail: "导师评分、反馈、回复和任务建议会成为学生端下一步动作。",
                icon: MessageSquareText,
                tone: "text-emerald-700 bg-emerald-50 ring-emerald-100",
              },
              {
                title: "HRBP 读取",
                metric: `${hrSyncCount} 条协同`,
                detail: "HRBP 只看聚合证据和需介入动作，减少反复私聊追问。",
                icon: LayoutDashboard,
                tone: "text-amber-700 bg-amber-50 ring-amber-100",
              },
            ].map((item) => {
              const FlowIcon = item.icon;
              return (
              <div key={item.title} className="mentor-flow-card rounded-lg bg-white/88 p-3 ring-1 ring-[var(--role-border)]" data-list-panel="">
                  <div className={cn("flex h-9 w-9 items-center justify-center rounded-lg ring-1", item.tone)}>
                    <FlowIcon className="h-4 w-4" />
                  </div>
                  <p className="mt-3 text-sm font-black text-slate-950">{item.title}</p>
                  <p className="mt-1 text-xl font-black text-slate-950">{item.metric}</p>
                  <p className="mt-2 text-xs leading-5 text-slate-600">{item.detail}</p>
                </div>
              );
            })}
          </div>
          </div>
        </div>
          <div className="mt-4 grid gap-3 rounded-lg border border-[var(--role-border)] bg-white/82 p-3 md:grid-cols-4">
            {[
              ["平均进度", `${averageProgress}%`, hasGrowthStarted ? "来自学生任务状态" : "录入后自动形成"],
              ["待反馈", `${pendingFeedbackCount} 条`, "进入导师今日动作"],
              ["学员提问", `${studentQuestions.length} 条`, "回复后回流学生端"],
              ["当前对象", selected.name, "右侧所有操作对象"],
            ].map(([label, value, detail]) => (
              <div key={label}>
                <p className="text-xs font-bold text-slate-500">{label}</p>
                <p className="mt-1 text-lg font-black text-slate-950">{value}</p>
                <p className="mt-1 text-xs font-semibold text-[var(--role-accent)]">{detail}</p>
              </div>
            ))}
          </div>
      </Card>

	      <Card className="p-4">
	        <SectionTitle icon={CalendarCheck} title="今日带教优先事项" subtitle="只展示真实待处理信号；具体处理在下方问答、反馈和协同记录里完成" />
		        <div className="mt-4 grid gap-2 lg:grid-cols-4">
	        {mentorPriorityItems.map((item, index) => {
              const PriorityIcon = item.icon;
              return (
	            <div key={item.title} className={cn("mentor-priority-card rounded-xl border p-3", `mentor-priority-${item.tone}`)} style={{ animationDelay: `${index * 80}ms` }}>
                <div className="flex items-center justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-3">
                    <span className="mentor-priority-icon">
                      <PriorityIcon className="h-4 w-4" />
                    </span>
	                  <p className="truncate font-black text-slate-950">{item.title}</p>
                  </div>
                  <span className="shrink-0 rounded-full bg-white px-2.5 py-1 text-xs font-black text-[var(--role-accent)] ring-1 ring-[var(--role-border)]">{item.value}</span>
                </div>
	              <p className="mt-2 line-clamp-2 text-xs leading-5 text-slate-700">{item.detail}</p>
                <div className="mt-3 rounded-lg bg-white/80 px-3 py-2">
                  <p className="text-xs font-bold text-slate-500">来源：{item.source}</p>
                  <p className="mt-1 truncate text-xs font-semibold text-[var(--role-accent)]">{item.impact}</p>
                </div>
		            </div>
	          );
            })}
				            </div>
	      </Card>

      <div className="mentor-roster-workspace grid items-start gap-4 lg:grid-cols-[minmax(300px,0.45fr)_minmax(0,1fr)]">
        <Card className="mentor-roster-panel h-full p-4" data-chart-card="">
          <SectionTitle icon={Users} title="带教对象" subtitle={`仅展示 ${normalizeDepartment(user.department)} 下绑定给 ${user.name} 的实习生`} />
          <div className="mt-4 grid gap-2">
            {mentorViewInterns.map((intern, index) => (
              <button
                key={intern.name}
                onClick={() => selectIntern(intern)}
                className={cn(
                  "mentor-intern-card rounded-xl border px-3 py-2.5 text-left transition hover:bg-[var(--role-soft)]",
                  selected.name === intern.name ? "border-[var(--role-border)] bg-[var(--role-soft)] ring-2 ring-[var(--role-border)]" : "border-slate-100 bg-white",
                )}
                style={{ animationDelay: `${index * 70}ms` }}
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="text-sm font-black text-slate-950">{intern.name}</p>
                    <p className="mt-0.5 text-xs font-semibold text-slate-500">{intern.title} · {intern.department}</p>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm font-bold text-[var(--role-accent)]">{intern.progress}%</span>
				            </div>
		            </div>
                <div className="mt-2 h-1 overflow-hidden rounded-full bg-slate-100">
                  <div className="mentor-progress-fill h-full rounded-full" data-progress-fill="" style={{ width: `${intern.progress}%` }} />
                </div>
              </button>
            ))}
          </div>
        </Card>

        <Card className="mentor-detail-card min-h-[430px] p-5">
          <div className="mentor-detail-hero">
            <div className="min-w-0">
              <SectionTitle icon={BrainCircuit} title={`${selected.name} 成长详情`} subtitle={`${selected.title} · ${selected.department}`} />
              <p className="mt-4 max-w-2xl text-sm font-semibold leading-6 text-slate-600">{selected.detail}</p>
            </div>
            <div className="mentor-detail-progress">
              <p className="text-xs font-black text-slate-500">成长进度</p>
              <p className="mt-1 text-4xl font-black text-slate-950">{selected.progress}%</p>
              <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-200">
                <div className="mentor-progress-fill h-full rounded-full" data-progress-fill="" style={{ width: `${selected.progress}%` }} />
              </div>
            </div>
          </div>

          <div className="mt-5 grid gap-3 md:grid-cols-3">
            {[
              ["岗位", selected.title],
              ["导师", user.name],
              ["当前关注", selected.focus],
            ].map(([label, value]) => (
              <div key={label} className="mentor-detail-stat">
                <span>{label}</span>
                <strong>{value}</strong>
              </div>
            ))}
          </div>

          <div className="mt-5 grid gap-4 lg:grid-cols-[1.04fr_0.96fr]">
            <div className="rounded-2xl border border-[var(--role-border)] bg-white p-4">
              <p className="text-sm font-black text-slate-950">下一步带教建议</p>
              <p className="mt-1 text-xs font-semibold leading-5 text-slate-500">还没有任务或反馈时，先把这些基础事项确认下来，系统会据此形成第一批成长记录。</p>
              <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-1 2xl:grid-cols-2">
              {selected.weeklyRecord.map((record) => (
                  <div key={record} className="rounded-xl bg-slate-50 px-3 py-2 text-xs font-semibold leading-5 text-slate-600">
                    {record}
                  </div>
              ))}
              </div>
            </div>

            <div className="rounded-2xl bg-[var(--role-soft)] p-4">
              <p className="text-sm font-black text-slate-950">系统同步说明</p>
              <div className="mt-3 grid gap-2">
                {selected.aiSignals.map((signal) => (
                  <div key={signal} className="flex items-center gap-2 rounded-xl bg-white px-3 py-2 text-xs font-bold text-slate-600 ring-1 ring-slate-100">
                    <Sparkles className="h-3.5 w-3.5 shrink-0 text-[var(--role-accent)]" />
                    {signal}
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div className="mt-5 rounded-2xl border border-[var(--role-border)] bg-white p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-sm font-black text-slate-950">当前对象成长信号</p>
              <span className="rounded-full bg-[var(--role-soft)] px-3 py-1 text-xs font-bold text-[var(--role-accent)] ring-1 ring-[var(--role-border)]">
                {selectedSignals.length} 条可见信号
              </span>
            </div>
            <div className="mt-3 grid gap-2 md:grid-cols-2">
              {selectedSignals.slice(0, 6).map((signal) => (
                <div key={signal.id} className="rounded-xl bg-slate-50 px-3 py-2.5 ring-1 ring-slate-100">
                  <div className="flex items-center justify-between gap-2">
                    <p className="truncate text-xs font-black text-slate-800">{signal.title}</p>
                    <span className="shrink-0 rounded-full bg-white px-2 py-0.5 text-[11px] font-bold text-[var(--role-accent)]">{signal.statusLabel}</span>
                  </div>
                  <p className="mt-1 line-clamp-2 text-xs leading-5 text-slate-500">{signal.sourceLabel} · {signal.visibleToHrbp ? "已同步 HRBP" : "导师端可见"}</p>
                </div>
              ))}
            </div>
          </div>
        </Card>
      </div>

      <div className="grid gap-5 xl:grid-cols-2">
        <div className="space-y-5">
          <Card>
            <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
              <SectionTitle icon={CalendarCheck} title="带教节奏日历" subtitle="按完整带教周期查看每日节奏和导师动作" />
              <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white/84 px-2.5 py-2">
                <button
                  className="inline-flex items-center gap-1 rounded-md px-2 py-1.5 text-xs font-black text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                  disabled={selectedMentorWeekIndex === 0}
                  onClick={() => changeMentorWeek(-1)}
                >
                  <ChevronRight className="h-3.5 w-3.5 rotate-180" />
                  上一周
                </button>
                <span className="rounded-md bg-[var(--role-soft)] px-2 py-1 text-xs font-black text-[var(--role-accent)]">
                  第 {selectedMentorWeekIndex + 1}/13 周
                </span>
                <button
                  className="inline-flex items-center gap-1 rounded-md px-2 py-1.5 text-xs font-black text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                  disabled={selectedMentorWeekIndex === maxMentorWeekIndex}
                  onClick={() => changeMentorWeek(1)}
                >
                  下一周
                  <ChevronRight className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
            <div className="mt-4 rounded-2xl border border-[var(--role-border)] bg-[var(--role-soft)] p-4">
              <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <p className="text-xs font-black text-[var(--role-accent)]">当前查看日期</p>
                  <p className="mt-1 text-lg font-black text-slate-950">{selectedMentorDate.label} · {selectedMentorDate.monthDay} {selectedMentorDate.weekday}</p>
                </div>
                <p className="text-xs font-bold text-slate-500">{mentorWeekStart.monthDay}-{mentorWeekEnd.monthDay} · 90 天带教周期</p>
              </div>
              <div className="mt-4 grid gap-2 sm:grid-cols-7">
                {mentorWeekDays.map((day) => {
                  const active = selectedMentorDateKey === day.key;
                  const status = getMentorDayStatus(day);
                  return (
                    <button
                      key={day.key}
                      onClick={() => setSelectedMentorDateKey(day.key)}
                      className={cn(
                        "rounded-xl border px-2 py-3 text-left transition",
                        active ? "border-[var(--role-accent)] bg-white shadow-[0_8px_24px_rgba(37,99,235,0.12)]" : "border-white/70 bg-white/70 hover:bg-white",
                      )}
                    >
                      <span className="block text-xs font-black text-[var(--role-accent)]">{day.label}</span>
                      <span className="mt-1 block text-sm font-black text-slate-950">{day.monthDay}</span>
                      <span className="mt-0.5 block text-xs font-semibold text-slate-500">{day.weekday}</span>
                      <span className="mt-2 inline-flex rounded-md bg-slate-100 px-2 py-1 text-xs font-black text-slate-600">{status}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </Card>

          <Card>
            <div className="space-y-3">
              {mentorRhythmTodos.map((todo) => (
                <div key={todo} className="flex gap-3 rounded-2xl bg-[var(--role-soft)] p-4 text-sm font-semibold text-slate-700">
                  <ChevronRight className="mt-0.5 h-4 w-4 shrink-0 text-[var(--role-accent)]" />
                  {todo}
                </div>
              ))}
            </div>
            <div className="mt-5 rounded-3xl border border-[var(--role-border)] bg-white p-4">
              <p className="text-sm font-black text-slate-950">标准化带教节点</p>
              <p className="mt-1 text-xs text-slate-500">把导师经验沉淀成可检查节奏，避免只凭感觉带教。</p>
              <div className="mt-4 space-y-2">
                {mentorCheckpoints.map((checkpoint) => (
                  <div key={checkpoint.day} className="grid grid-cols-[64px_1fr_auto] items-center gap-3 rounded-2xl bg-slate-50 px-3 py-3 text-sm">
                    <span className="font-black text-[var(--role-accent)]">{checkpoint.day}</span>
                    <span className="leading-6 text-slate-700">{checkpoint.action}</span>
                    <StatusPill status={checkpoint.status} />
                  </div>
                ))}
              </div>
            </div>
            <div className="mt-5 rounded-3xl border border-[var(--role-border)] bg-white p-4">
              <p className="text-sm font-black text-slate-950">HR 协同记录</p>
              <p className="mt-1 text-xs text-slate-500">展示 HR 针对当前实习生同步给导师的动作。</p>
              <div className="mt-4 space-y-3">
                {relatedRecords.filter((record) => record.sourceRole === "HR" && record.targetRole === "导师").length > 0 ? (
	                  relatedRecords.filter((record) => record.sourceRole === "HR" && record.targetRole === "导师").map((record) => (
	                    <div key={record.id} className="rounded-2xl bg-[var(--role-soft)] p-3">
	                      <div className="flex items-center justify-between gap-3">
	                        <p className="text-sm font-bold text-slate-950">{record.title}</p>
	                        <div className="flex flex-wrap items-center justify-end gap-2">
	                          <SyncFlowBadge record={record} compact />
	                          <span className="rounded-full bg-white px-2 py-1 text-xs font-bold text-[var(--role-accent)]">{record.status}</span>
	                        </div>
	                      </div>
	                      <p className="mt-2 text-xs leading-5 text-slate-600">{record.detail}</p>
		                      <p className="mt-2 text-xs font-semibold text-slate-400">{record.createdAt} · HRBP 已同步导师端</p>
	                      {record.status === "已同步" ? (
	                        <span className="mt-3 inline-flex rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700">已完成并回流 HRBP</span>
	                      ) : (
	                        <Button className="mt-3 px-3 py-2 text-xs" onClick={() => onUpdateRecord(record.id, { status: "已同步" })}>
	                          <CheckCircle2 className="h-3.5 w-3.5" />
	                          标记完成
	                        </Button>
	                      )}
	                    </div>
	                  ))
                ) : (
                  <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-3 py-4 text-sm text-slate-500">
                    暂无 HRBP 同步事项。HRBP 在关注卡点击“同步导师”或“创建复盘提醒”后会出现在这里。
                  </div>
                )}
              </div>
            </div>
            <div className="mt-5 rounded-3xl border border-emerald-100 bg-emerald-50/50 p-4">
              <p className="text-sm font-black text-slate-950">学员提问待回复</p>
              <p className="mt-1 text-xs text-slate-500">实习生从成长地图发送的问题会同步到这里，导师回复后会回到学员端。</p>
              <div className="mt-4 space-y-3">
                {studentQuestions.length > 0 ? (
                  studentQuestions.map((record) => (
                    <div key={record.id} className="rounded-2xl bg-white p-3">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <p className="text-sm font-bold text-slate-950">{record.question}</p>
                        <span className={cn("rounded-full px-2 py-1 text-xs font-bold", record.answer ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700")}>
                          {record.answer ? "已回复" : "待回复"}
                        </span>
                      </div>
                      {record.answer ? (
                        <p className="mt-2 rounded-xl bg-[var(--role-soft)] px-3 py-2 text-xs leading-5 text-slate-600">已回复：{record.answer}</p>
                      ) : (
                        <>
                          <textarea
                            value={answerDrafts[record.id] ?? ""}
                            onChange={(event) => setAnswerDrafts((current) => ({ ...current, [record.id]: event.target.value }))}
                            placeholder="请输入给实习生的回复，例如：你可以先看 GMV、转化率和留存率分别对应哪个业务环节..."
                            className="mt-3 min-h-20 w-full resize-none rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm leading-6 text-slate-700 outline-none focus:border-[var(--role-accent)] focus:bg-white focus:ring-4 focus:ring-[var(--role-border)]"
                          />
                          <Button className="mt-2 px-3 py-2 text-xs" onClick={() => replyQuestion(record)} disabled={!answerDrafts[record.id]?.trim()}>
                            回复并同步学员/HRBP
                          </Button>
                        </>
                      )}
                    </div>
                  ))
                ) : (
                  <div className="rounded-2xl border border-dashed border-slate-200 bg-white/70 px-3 py-4 text-sm text-slate-500">
                    暂无学员提问。实习生点击“发送导师”后会出现在这里。
                  </div>
                )}
              </div>
            </div>
                      <div className="mt-5 rounded-3xl border border-emerald-100 bg-emerald-50/50 p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="text-sm font-black text-slate-950">复盘沉淀</p>
                <span className="rounded-full bg-white px-3 py-1 text-xs font-bold text-emerald-700">{mentorReviewRecords.length} 条</span>
              </div>
              <div className="mt-3 grid gap-2">
                {mentorReviewRecords.length > 0 ? (
                  mentorReviewRecords.map((record) => (
                    <div key={record.id} className="rounded-2xl bg-white p-3 ring-1 ring-emerald-100">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <p className="text-sm font-black text-slate-900">{record.internName} · {record.signalTitle}</p>
                        <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-bold text-emerald-700">已复盘</span>
                      </div>
                      <p className="mt-1 text-xs leading-5 text-slate-600">{record.conclusion}</p>
                      <p className="mt-1 text-[11px] font-semibold text-slate-400">下一步：{record.nextStep}</p>
                    </div>
                  ))
                ) : (
                  <p className="rounded-2xl border border-dashed border-emerald-200 bg-white/70 px-3 py-4 text-sm text-slate-500">
                    暂无复盘记录。HRBP 在全局信号池标记复盘后，会出现在这里。
                  </p>
                )}
              </div>
            </div>
</Card>
        </div>

        <Card className="h-full self-start">
          <SectionTitle icon={Bot} title="AI 结构化反馈生成器" subtitle={`当前反馈对象：${selected.name}`} />
          <div className="mt-5 grid gap-3 rounded-3xl border border-[var(--role-border)] bg-[var(--role-soft)] p-4 md:grid-cols-[0.8fr_1.2fr]">
            <div>
              <p className="text-xs font-bold text-[var(--role-accent)]">当前辅导重点</p>
              <p className="mt-1 text-lg font-black text-slate-950">{selected.focus}</p>
              <p className="mt-2 text-sm leading-6 text-slate-600">{selected.detail}</p>
            </div>
            <div className="grid gap-2">
              {selected.aiSignals.map((signal) => (
                <div key={signal} className="flex items-center gap-2 rounded-2xl bg-white px-3 py-2 text-sm font-semibold text-slate-700">
                  <Sparkles className="h-4 w-4 shrink-0 text-[var(--role-accent)]" />
                  {signal}
                </div>
              ))}
            </div>
          </div>
          <div className="mt-5 rounded-3xl border border-slate-100 bg-slate-50 p-4">
            <p className="text-sm font-black text-slate-950">轻量评价维度</p>
            <p className="mt-1 text-xs text-slate-500">导师先点选五个维度评分，AI 再结合碎片观察生成可同步反馈。</p>
            <div className="mt-4 grid gap-3 md:grid-cols-5">
              {mentorScoreDimensions.map((dimension) => (
                <div key={dimension} className="rounded-2xl bg-white p-3 ring-1 ring-slate-100">
                  <p className="text-xs font-bold text-slate-500">{dimension}</p>
                  <div className="mt-3 flex items-center justify-between gap-1">
                    {[1, 2, 3, 4, 5].map((score) => (
                      <button
                        key={score}
                        onClick={() => {
                          setMentorScores((current) => ({ ...current, [dimension]: score }));
                          setDraftFeedback(null);
                          setSaved(false);
                        }}
                        className={cn(
                          "flex h-7 w-7 items-center justify-center rounded-full text-xs font-black transition",
                          mentorScores[dimension] >= score ? "bg-[var(--role-accent)] text-white" : "bg-slate-100 text-slate-400 hover:bg-[var(--role-soft)] hover:text-[var(--role-accent)]",
                        )}
                        aria-label={`${dimension} ${score} 分`}
                      >
                        {score}
                      </button>
                    ))}
                  </div>
                  <p className="mt-2 text-xs font-bold text-[var(--role-accent)]">{mentorScores[dimension]}/5 分</p>
                </div>
              ))}
            </div>
          </div>
          <textarea
            value={feedback}
            onChange={(event) => {
              setFeedback(event.target.value);
              setDraftFeedback(null);
              setSaved(false);
              setAiError("");
            }}
            placeholder={`请输入你对${selected.name}的观察，例如：${selected.observationHint}`}
            className="mt-5 min-h-32 w-full resize-none rounded-3xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700 outline-none transition focus:border-[var(--role-accent)] focus:bg-white focus:ring-4 focus:ring-[var(--role-border)]"
          />
          <div className="mt-3 flex flex-wrap gap-2">
            {selected.weeklyRecord.map((record) => (
              <button
                key={record}
                onClick={() => {
                  setFeedback((current) => current.includes(record) ? current : `${current.trim()} ${record}`.trim());
                  setDraftFeedback(null);
                  setSaved(false);
                }}
                className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-bold text-slate-600 transition hover:bg-[var(--role-soft)] hover:text-[var(--role-accent)]"
              >
                + {record}
              </button>
            ))}
          </div>
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <Button onClick={generateFeedback} disabled={!feedback.trim() || isGenerating}>
              {isGenerating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
              {isGenerating ? "AI 正在分析..." : "AI 生成结构化反馈"}
            </Button>
            <Button
              variant="soft"
              onClick={saveFeedback}
              disabled={!draftFeedback || isSaving}
            >
              {isSaving && <Loader2 className="h-4 w-4 animate-spin" />}
              {isSaving ? "正在同步..." : saved ? "已同步 HR" : "同步给学员和 HR"}
            </Button>
          </div>
          {isGenerating && (
            <div className="mt-4 rounded-2xl bg-[var(--role-soft)] px-4 py-3 text-sm font-semibold text-[var(--role-accent)]">
              正在分析导师观察、成长进度、关注信号和本周任务记录...
            </div>
          )}
          {aiError && <FeedbackNotice tone="error" className="mt-4">{aiError}</FeedbackNotice>}
          {feedbackGenerated && !saved && <FeedbackNotice tone="success" className="mt-4">AI 反馈草稿已生成，可编辑后同步。</FeedbackNotice>}
          {saved && <FeedbackNotice tone="success" className="mt-4">反馈已发送给学员，HR 可在关注看板中查看同步记录。</FeedbackNotice>}
          {draftFeedback && (
            <div className="mt-5 grid gap-3">
              <div>
                <h3 className="font-black text-slate-950">AI 生成的导师反馈草稿</h3>
                <p className="mt-1 text-sm text-slate-500">上方四项是导师管理版草稿，可编辑；发布后会分别同步到学员端反馈收件箱和 HR 关注看板。</p>
              </div>
              {[
                ["表现亮点", "highlights"],
                ["待提升点", "improvements"],
                ["下阶段建议", "nextStep"],
                ["给实习生的话术", "messageToIntern"],
              ].map(([title, key]) => (
                <div key={title} className="rounded-2xl bg-slate-50 p-4" data-gsap-result="">
                  <p className="text-sm font-bold text-slate-950">{title}</p>
                  <textarea
                    value={draftFeedback[key as keyof AIFeedback]}
                    onChange={(event) =>
                      setDraftFeedback((current) => current ? { ...current, [key]: event.target.value } : current)
                    }
                    className="mt-2 min-h-16 w-full resize-none rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm leading-6 text-slate-700 outline-none focus:border-[var(--role-accent)] focus:ring-4 focus:ring-[var(--role-border)]"
                  />
                </div>
              ))}
              <div className="rounded-3xl border border-emerald-100 bg-emerald-50/70 p-4" data-gsap-result="">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-black text-emerald-800">学员端预览</p>
                    <p className="mt-1 text-xs font-semibold text-emerald-700">同步后，{selected.name} 会在「导师反馈收件箱」看到这张卡片。</p>
                  </div>
                  <span className="rounded-full bg-white px-3 py-1 text-xs font-bold text-emerald-700">发给学员</span>
                </div>
                <div className="mt-4 space-y-3 text-sm leading-6 text-slate-700">
                  <p><strong className="text-slate-950">表现亮点：</strong>{draftFeedback.highlights}</p>
                  <p><strong className="text-slate-950">待提升点：</strong>{draftFeedback.improvements}</p>
                  <p><strong className="text-slate-950">下阶段建议：</strong>{draftFeedback.nextStep}</p>
                  <p className="rounded-2xl bg-white p-3"><strong className="text-slate-950">导师想对你说：</strong>{draftFeedback.messageToIntern}</p>
                </div>
              </div>
            </div>
          )}
        </Card>
      </div>
      </div>
  );
}

function DataManagementPanel({
  user,
  managedInterns,
  onCreateIntern,
  onUpdateIntern,
  onDeleteIntern,
  onCreateTask,
  onUpdateTask,
  onDeleteTask,
  onCreateFeedback,
  onUpdateFeedback,
  onDeleteFeedback,
}: {
  user: AuthUser;
  managedInterns: ManagedIntern[];
  onCreateIntern: (form: InternFormState) => void;
  onUpdateIntern: (id: string, patch: ManagedInternPatch) => void;
  onDeleteIntern: (id: string) => void;
  onCreateTask: (internId: string, form: TaskFormState) => void;
  onUpdateTask: (internId: string, taskId: string, patch: Partial<GrowthTask>) => void;
  onDeleteTask: (internId: string, taskId: string) => void;
  onCreateFeedback: (internId: string, form: FeedbackFormState) => void;
  onUpdateFeedback: (internId: string, feedbackId: string, patch: Partial<MentorFeedbackRecord>) => void;
  onDeleteFeedback: (internId: string, feedbackId: string) => void;
}) {
  const [query, setQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<"全部" | string>("全部");
  const [riskFilter, setRiskFilter] = useState<"全部" | RiskLevel>("全部");
  const [selectedId, setSelectedId] = useState(managedInterns[0]?.id ?? "");
  const selected = selectedId ? managedInterns.find((intern) => intern.id === selectedId) ?? null : null;
  const internArchived = selected?.status === "已结束";
  const [internForm, setInternForm] = useState<InternFormState>(() => managedInterns[0] ? internToForm(managedInterns[0]) : emptyInternForm());
  const [taskForm, setTaskForm] = useState<TaskFormState>({ title: "", status: "未完成", due: defaultTaskDueDate, owner: "实习生", note: "" });
  const [feedbackForm, setFeedbackForm] = useState<FeedbackFormState>({ mentor: "王老师", content: "", score: 3 });
  const [formError, setFormError] = useState("");
  const filtered = managedInterns.filter((intern) => {
    const keyword = query.trim().toLowerCase();
    const matchedKeyword = !keyword || [intern.name, intern.role, intern.title, intern.department, intern.mentor, intern.reason, intern.todo, ...intern.riskTags].some((value) => value.toLowerCase().includes(keyword));
    const matchedRole = roleFilter === "全部" || intern.role === roleFilter;
    const matchedRisk = riskFilter === "全部" || intern.risk === riskFilter;
    return matchedKeyword && matchedRole && matchedRisk;
  });

  useEffect(() => {
    const timer = window.setTimeout(() => {
      if (!managedInterns.length) {
        setSelectedId("");
        setInternForm(emptyInternForm());
        return;
      }
      if (selectedId && managedInterns.some((intern) => intern.id === selectedId)) return;
      setSelectedId(managedInterns[0].id);
      setInternForm(internToForm(managedInterns[0]));
    }, 0);
    return () => window.clearTimeout(timer);
  }, [managedInterns, selectedId]);

  const submitIntern = () => {
    const requiredFields = [
      ["姓名", internForm.name],
      ["岗位名称", internForm.title],
      ["部门", internForm.department],
      ["导师", internForm.mentor],
      ["入职周数", internForm.week],
    ];
    const missing = requiredFields.find(([, value]) => !String(value).trim());
    if (missing) {
      setFormError(`请先填写${missing[0]}。`);
      return;
    }
    setFormError("");
    if (selected) {
      onUpdateIntern(selected.id, {
        ...internForm,
        riskTags: internForm.riskTagsText.split(/[、,，]/).map((tag) => tag.trim()).filter(Boolean),
      });
    } else {
      onCreateIntern(internForm);
    }
  };

  const startEditIntern = (intern: ManagedIntern) => {
    setSelectedId(intern.id);
    setInternForm(internToForm(intern));
    setFormError("");
  };

  return (
    <Card className="glass-panel">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
        <SectionTitle icon={LayoutDashboard} title="跟进记录与基础数据" subtitle="实习生、成长任务、导师反馈和跟进状态都在这里真实增删改查，并持久化保存到本地" />
        <Button variant="soft" onClick={() => {
          setSelectedId("");
          setInternForm(emptyInternForm());
        }}>
          <Plus className="h-4 w-4" />
          新增实习生
        </Button>
      </div>

      <div className="mt-5 grid gap-5 2xl:grid-cols-[1.15fr_0.85fr]">
        <div>
          <div className="grid gap-3 lg:grid-cols-[1fr_160px_160px]">
            <label className="glass-panel-soft rounded-2xl px-4 py-3">
              <span className="text-xs font-bold text-slate-500">查询</span>
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="搜索姓名、岗位、导师、风险原因"
                className="mt-1 w-full bg-transparent text-sm font-semibold text-slate-800 outline-none"
              />
            </label>
            <label className="glass-panel-soft rounded-2xl px-4 py-3">
              <span className="text-xs font-bold text-slate-500">岗位</span>
              <select value={roleFilter} onChange={(event) => setRoleFilter(event.target.value)} className="mt-1 w-full bg-transparent text-sm font-semibold text-slate-800 outline-none">
                {["全部", "产品", "研发", "销售", "HR"].map((role) => <option key={role}>{role}</option>)}
              </select>
            </label>
            <label className="glass-panel-soft rounded-2xl px-4 py-3">
              <span className="text-xs font-bold text-slate-500">关注状态</span>
              <select value={riskFilter} onChange={(event) => setRiskFilter(event.target.value as RiskLevel | "全部")} className="mt-1 w-full bg-transparent text-sm font-semibold text-slate-800 outline-none">
                {["全部", "低风险", "中风险", "高风险"].map((risk) => <option key={risk}>{risk === "全部" ? "全部" : attentionLabel[risk as RiskLevel]}</option>)}
              </select>
            </label>
          </div>

          <div className="mt-4 overflow-x-auto">
            <table className="app-table w-full min-w-[920px] text-left text-sm">
              <thead>
                <tr className="text-xs text-slate-500">
                  {["姓名", "岗位", "导师", "周数", "进度", "信号等级", "跟进", "操作"].map((head) => <th key={head} className="px-3 py-2 font-semibold">{head}</th>)}
                </tr>
              </thead>
              <tbody>
                {filtered.map((intern) => (
                  <tr
                    key={intern.id}
                    aria-selected={selected?.id === intern.id}
                    onClick={() => startEditIntern(intern)}
                    className={cn("glass-table-row cursor-pointer transition", selected?.id === intern.id && "bg-[var(--role-soft)] ring-2 ring-inset ring-[var(--role-border)]")}
                  >
                    <td className="rounded-l-2xl px-3 py-4 font-black text-slate-950">{intern.name}</td>
                    <td className="px-3 py-4 text-slate-600">{intern.role} · {intern.title}</td>
                    <td className="px-3 py-4 text-slate-600">{intern.mentor}</td>
                    <td className="px-3 py-4 text-slate-600">{intern.week}</td>
                    <td className="px-3 py-4 font-bold text-[var(--role-accent)]">{intern.progress}%</td>
                    <td className="px-3 py-4"><AttentionBadge risk={intern.risk} /></td>
                    <td className="px-3 py-4 text-slate-600">{intern.processStatus}</td>
                    <td className="rounded-r-2xl px-3 py-4">
                      <div className="flex flex-wrap gap-2">
                        <Button variant="ghost" className="px-3 py-2 text-xs" onClick={(event) => {
                          event.stopPropagation();
                          startEditIntern(intern);
                        }}>
                          <SquarePen className="h-3.5 w-3.5" />
                          编辑
                        </Button>
                        <Button variant="ghost" className="px-3 py-2 text-xs text-rose-600" onClick={(event) => {
                          event.stopPropagation();
                          onDeleteIntern(intern.id);
                        }}>
                          <Trash2 className="h-3.5 w-3.5" />
                          删除
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="space-y-4">
          <div className="glass-panel-soft rounded-3xl p-4">
            <p className="text-sm font-black text-slate-950">{selected ? `编辑 ${selected.name}` : "新增实习生"}</p>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {[
                ["姓名", "name"],
                ["岗位名称", "title"],
                ["部门", "department"],
                ["导师", "mentor"],
                ["入职周数", "week"],
                ["跟进建议", "todo"],
              ].map(([label, key]) => (
                <label key={key} className="rounded-2xl bg-white/50 px-3 py-2 ring-1 ring-white/60">
                  <span className="text-xs font-bold text-slate-500">{label}</span>
                  <input value={String(internForm[key as keyof InternFormState])} onChange={(event) => setInternForm((current) => ({ ...current, [key]: event.target.value }))} className="mt-1 w-full bg-transparent text-sm font-semibold text-slate-800 outline-none" />
                </label>
              ))}
              <label className="rounded-2xl bg-white/50 px-3 py-2 ring-1 ring-white/60">
                <span className="text-xs font-bold text-slate-500">岗位类型</span>
                <select value={internForm.role} onChange={(event) => setInternForm((current) => ({ ...current, role: event.target.value }))} className="mt-1 w-full bg-transparent text-sm font-semibold text-slate-800 outline-none">
                  {["产品", "研发", "销售", "HR"].map((role) => <option key={role}>{role}</option>)}
                </select>
              </label>
              <label className="rounded-2xl bg-white/50 px-3 py-2 ring-1 ring-white/60">
                <span className="text-xs font-bold text-slate-500">成长进度</span>
                <input type="number" min={0} max={100} value={internForm.progress} onChange={(event) => setInternForm((current) => ({ ...current, progress: Number(event.target.value) }))} className="mt-1 w-full bg-transparent text-sm font-semibold text-slate-800 outline-none" />
              </label>
              <label className="rounded-2xl bg-white/50 px-3 py-2 ring-1 ring-white/60">
                <span className="text-xs font-bold text-slate-500">成长信号等级</span>
                <select value={internForm.risk} onChange={(event) => setInternForm((current) => ({ ...current, risk: event.target.value as RiskLevel }))} className="mt-1 w-full bg-transparent text-sm font-semibold text-slate-800 outline-none">
                  {(["低风险", "中风险", "高风险"] as RiskLevel[]).map((risk) => <option key={risk} value={risk}>{attentionLabel[risk]}</option>)}
                </select>
              </label>
              <label className="rounded-2xl bg-white/50 px-3 py-2 ring-1 ring-white/60">
                <span className="text-xs font-bold text-slate-500">在岗状态</span>
                <select value={internForm.status} onChange={(event) => setInternForm((current) => ({ ...current, status: event.target.value as InternStatus }))} className="mt-1 w-full bg-transparent text-sm font-semibold text-slate-800 outline-none">
                  {(["在岗", "暂停", "已结束"] as InternStatus[]).map((s) => <option key={s}>{s}</option>)}
                </select>
              </label>
              <label className="rounded-2xl bg-white/50 px-3 py-2 ring-1 ring-white/60">
                <span className="text-xs font-bold text-slate-500">跟进状态</span>
                <select value={internForm.processStatus} onChange={(event) => setInternForm((current) => ({ ...current, processStatus: event.target.value as ProcessStatus }))} className="mt-1 w-full bg-transparent text-sm font-semibold text-slate-800 outline-none">
                  {["待 HR 沟通", "已同步导师", "复盘中", "已关闭"].map((status) => <option key={status}>{status}</option>)}
                </select>
              </label>
            </div>
            <label className="mt-3 block rounded-2xl bg-white/50 px-3 py-2 ring-1 ring-white/60">
              <span className="text-xs font-bold text-slate-500">成长信号摘要</span>
              <textarea value={internForm.reason} onChange={(event) => setInternForm((current) => ({ ...current, reason: event.target.value }))} className="mt-1 min-h-16 w-full resize-none bg-transparent text-sm font-semibold leading-6 text-slate-800 outline-none" />
            </label>
            <label className="mt-3 block rounded-2xl bg-white/50 px-3 py-2 ring-1 ring-white/60">
              <span className="text-xs font-bold text-slate-500">标签，用顿号分隔</span>
              <input value={internForm.riskTagsText} onChange={(event) => setInternForm((current) => ({ ...current, riskTagsText: event.target.value }))} className="mt-1 w-full bg-transparent text-sm font-semibold text-slate-800 outline-none" />
            </label>
            {formError && <FeedbackNotice tone="error" className="mt-3">{formError}</FeedbackNotice>}
            <Button className="mt-4" onClick={submitIntern} disabled={!internForm.name.trim()}>
              <UserCheck className="h-4 w-4" />
              {selected ? "保存实习生信息" : "创建实习生"}
            </Button>
          </div>

          {selected && (
            <>
              <div className="glass-panel-soft rounded-3xl p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="text-sm font-black text-slate-950">成长任务管理</p>
                    <p className="mt-1 text-xs font-semibold leading-5 text-slate-500">为当前实习生录入阶段任务；任务状态会同步到学生端成长地图和导师端带教视图。</p>
                  </div>
                  {internArchived ? (
                    <span className="rounded-md bg-slate-100 px-2 py-1 text-[11px] font-bold text-slate-500 ring-1 ring-slate-200">已归档 · 任务不可编辑</span>
                  ) : null}
                </div>
                <div className="mt-3 grid gap-2">
                  {selected.tasks.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/60 p-4 text-sm leading-6 text-slate-600">
                      还没有成长任务。在下方「新增任务名称」填一个任务、设置状态和到期日，就会出现在这里。完成后会同步到成长地图和导师端。
                    </div>
                  ) : null}
                  {selected.tasks.map((task) => (
	                    <div key={task.id} className="rounded-2xl bg-white/42 p-3">
	                      <label className="block">
	                        <span className="text-[11px] font-bold text-slate-500">任务名称</span>
	                        <input value={task.title} disabled={internArchived} onChange={(event) => onUpdateTask(selected.id, task.id, { title: event.target.value })} className="mt-1 w-full bg-transparent text-sm font-bold text-slate-900 outline-none disabled:opacity-60" />
	                      </label>
	                      <div className="mt-2 grid gap-2 sm:grid-cols-[1fr_1fr_auto]">
	                        <label className="block">
	                          <span className="text-[11px] font-bold text-slate-500">任务状态</span>
	                          <select disabled={internArchived} value={task.status} onChange={(event) => onUpdateTask(selected.id, task.id, { status: event.target.value as TaskStatus })} className="mt-1 w-full rounded-xl bg-white px-2 py-2 text-xs font-bold text-slate-700 outline-none disabled:opacity-60">
	                            {["未完成", "已完成"].map((status) => <option key={status}>{status}</option>)}
	                          </select>
	                        </label>
		                        <label className="block">
		                          <span className="text-[11px] font-bold text-slate-500">到期时间</span>
		                          <input type="date" disabled={internArchived} value={taskDueToDateValue(task.due)} onChange={(event) => onUpdateTask(selected.id, task.id, { due: event.target.value })} className="mt-1 w-full rounded-xl bg-white px-2 py-2 text-xs font-bold text-slate-700 outline-none disabled:opacity-60" />
		                        </label>
	                        <Button variant="ghost" disabled={internArchived} className="px-3 py-2 text-xs text-rose-600 disabled:opacity-50" onClick={() => onDeleteTask(selected.id, task.id)}>删除</Button>
	                      </div>
	                    </div>
                  ))}
                </div>
	                <div className="mt-3 rounded-2xl border border-[var(--role-border)] bg-[var(--role-soft)] p-3">
	                  <label className="block">
	                    <span className="text-[11px] font-black text-[var(--role-accent)]">新增任务名称</span>
	                    <input value={taskForm.title} onChange={(event) => setTaskForm((current) => ({ ...current, title: event.target.value }))} placeholder="例如：完成产品资料阅读" className="mt-1 w-full bg-transparent text-sm font-bold text-slate-900 outline-none" />
	                  </label>
		                  <div className="mt-2 grid gap-2 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] sm:items-end">
	                    <label className="block">
	                      <span className="text-[11px] font-bold text-slate-500">初始状态</span>
	                      <select value={taskForm.status} onChange={(event) => setTaskForm((current) => ({ ...current, status: event.target.value as TaskStatus }))} className="mt-1 w-full rounded-xl bg-white px-2 py-2 text-xs font-bold text-slate-700 outline-none">
	                        {["未完成", "已完成"].map((status) => <option key={status}>{status}</option>)}
	                      </select>
	                    </label>
		                    <label className="block">
		                      <span className="text-[11px] font-bold text-slate-500">到期时间</span>
		                      <input type="date" value={taskDueToDateValue(taskForm.due)} onChange={(event) => setTaskForm((current) => ({ ...current, due: event.target.value }))} className="mt-1 w-full rounded-xl bg-white px-2 py-2 text-xs font-bold text-slate-700 outline-none" />
		                    </label>
		                    <Button className="h-9 shrink-0 self-end whitespace-nowrap px-3 py-0 text-xs" disabled={internArchived} onClick={() => {
                      if (!taskForm.title.trim()) return;
                      onCreateTask(selected.id, taskForm);
	                      setTaskForm({ title: "", status: "未完成", due: defaultTaskDueDate, owner: "实习生", note: "" });
                    }}>
                      <Plus className="h-3.5 w-3.5" />
                      添加任务
                    </Button>
                  </div>
                </div>
              </div>

              <div className="glass-panel-soft rounded-3xl p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="text-sm font-black text-slate-950">导师反馈管理</p>
                    <p className="mt-1 text-xs font-semibold leading-5 text-slate-500">记录导师对当前实习生的阶段反馈；评分为 1-5 分，确认后会同步给学生端和 HRBP 信号中心。</p>
                  </div>
                  {internArchived ? (
                    <span className="rounded-md bg-slate-100 px-2 py-1 text-[11px] font-bold text-slate-500 ring-1 ring-slate-200">已归档 · 反馈只读</span>
                  ) : null}
                </div>
                <div className="mt-3 grid gap-2">
                  {selected.feedbacks.map((feedback) => {
                    const editable = canEditFeedback(user, feedback);
                    return (
	                    <div key={feedback.id} className="rounded-2xl bg-white/42 p-3">
	                      <div className="grid gap-2 sm:grid-cols-[1fr_80px_auto]">
	                        <label className="block">
	                          <span className="text-[11px] font-bold text-slate-500">反馈导师</span>
	                          <input value={feedback.mentor} disabled={!editable || internArchived} onChange={(event) => onUpdateFeedback(selected.id, feedback.id, { mentor: event.target.value })} className="mt-1 w-full rounded-xl bg-white px-2 py-2 text-xs font-bold text-slate-700 outline-none disabled:opacity-60" />
	                        </label>
	                        <label className="block">
	                          <span className="text-[11px] font-bold text-slate-500">评分</span>
	                          <input type="number" min={1} max={5} value={feedback.score} disabled={!editable || internArchived} onChange={(event) => onUpdateFeedback(selected.id, feedback.id, { score: Number(event.target.value) })} className="mt-1 w-full rounded-xl bg-white px-2 py-2 text-xs font-bold text-slate-700 outline-none disabled:opacity-60" />
	                        </label>
                        {editable && !internArchived ? (
                          <Button variant="ghost" className="px-3 py-2 text-xs text-rose-600" onClick={() => onDeleteFeedback(selected.id, feedback.id)}>删除</Button>
                        ) : (
                          <span className="px-3 py-2 text-[10px] font-bold text-slate-400">只读</span>
                        )}
                      </div>
                      <textarea value={feedback.content} disabled={!editable || internArchived} onChange={(event) => onUpdateFeedback(selected.id, feedback.id, { content: event.target.value })} className="mt-2 min-h-16 w-full resize-none rounded-xl bg-white px-2 py-2 text-sm leading-6 text-slate-700 outline-none disabled:opacity-60" />
                    </div>
                    );
                  })}
                </div>
                <div className="mt-3 rounded-2xl bg-emerald-50 p-3">
	                  <div className="grid gap-2 sm:grid-cols-[1fr_110px]">
	                    <label className="block">
	                      <span className="text-[11px] font-bold text-emerald-700">反馈导师</span>
	                      <input value={feedbackForm.mentor} onChange={(event) => setFeedbackForm((current) => ({ ...current, mentor: event.target.value }))} className="mt-1 w-full rounded-xl bg-white px-2 py-2 text-xs font-bold text-slate-700 outline-none" />
	                    </label>
	                    <label className="block">
	                      <span className="text-[11px] font-bold text-emerald-700">评分（1-5）</span>
	                      <input type="number" min={1} max={5} value={feedbackForm.score} onChange={(event) => setFeedbackForm((current) => ({ ...current, score: Number(event.target.value) }))} className="mt-1 w-full rounded-xl bg-white px-2 py-2 text-xs font-bold text-slate-700 outline-none" />
	                    </label>
	                  </div>
	                  <label className="mt-2 block">
	                    <span className="text-[11px] font-bold text-emerald-700">反馈内容</span>
	                    <textarea value={feedbackForm.content} onChange={(event) => setFeedbackForm((current) => ({ ...current, content: event.target.value }))} placeholder="例如：已完成首次沟通，建议下周补充业务指标理解。" className="mt-1 min-h-16 w-full resize-none rounded-xl bg-white px-2 py-2 text-sm leading-6 text-slate-700 outline-none" />
	                  </label>
                  <Button className="mt-2 px-3 py-2 text-xs" onClick={() => {
                    if (!feedbackForm.content.trim()) return;
                    onCreateFeedback(selected.id, feedbackForm);
                    setFeedbackForm({ mentor: feedbackForm.mentor, content: "", score: 3 });
                  }}>
                    <Plus className="h-3.5 w-3.5" />
                    添加反馈
                  </Button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </Card>
  );
}

function RiskCard({
  intern,
  records,
  onAddRecord,
}: {
  intern: Intern;
  records: CollaborationRecord[];
  onAddRecord: (record: Omit<CollaborationRecord, "id" | "createdAt">) => void;
}) {
  const riskRef = useRef<HTMLDivElement | null>(null);
  const [actionMessage, setActionMessage] = useState("");
  const [actionError, setActionError] = useState("");
  const [actionLoading, setActionLoading] = useState("");
  const relatedRecords = records.filter((record) => record.internName === intern.name);
	  const metricTone = {
	    normal: "bg-emerald-50 text-emerald-700 ring-emerald-100",
	    warning: "bg-amber-50 text-amber-700 ring-amber-100",
	    danger: "bg-rose-50 text-rose-700 ring-rose-100",
	  };
	  const hasHrToMentor = relatedRecords.some((record) => record.sourceRole === "HR" && record.targetRole === "导师");
	  const hasMentorFeedback = relatedRecords.some((record) => record.sourceRole === "导师");
		  const completedFlow = intern.processStatus === "已关闭" ? 4 : intern.processStatus === "复盘中" ? 3 : hasMentorFeedback ? 3 : hasHrToMentor ? 2 : 1;
		  const actionButtons: Array<{ label: string; icon: ElementType; status: CollaborationRecord["status"]; targetRole: "导师" | "HR" }> = [
    {
      label: "确认问题线索",
      icon: SquarePen,
      status: "已创建",
      targetRole: "HR",
    },
    {
      label: "分派导师跟进",
      icon: UserCheck,
      status: "待处理",
      targetRole: "导师",
    },
    {
      label: "沉淀复盘记录",
      icon: Clock3,
      status: "已创建",
      targetRole: "导师",
    },
  ];

  const generateHrAction = async (label: string, status: CollaborationRecord["status"], targetRole: "导师" | "HR") => {
    setActionLoading(label);
    setActionError("");
    setActionMessage("");
    try {
      const result = await requestAiGeneration<AIHrAction>("hrAction", {
        actionType: label,
        targetRole,
        intern,
        relatedRecords,
      });
      onAddRecord({
        internName: intern.name,
        sourceRole: "HR",
        targetRole,
        title: result.output.title,
        detail: result.output.detail,
        status,
      });
      setActionMessage(`已为 ${intern.name} ${label}，AI 生成的协同记录已同步到${targetRole === "导师" ? "导师端" : "HRBP 操作记录"}。`);
    } catch (error) {
      setActionError(error instanceof Error ? error.message : "AI 生成失败，请稍后重试。");
    } finally {
      setActionLoading("");
    }
  };

  useResultReveal(riskRef, [intern.name, actionMessage, actionError], "[data-gsap-result]");
  useGSAP(
    () => {
      if (!riskRef.current || shouldReduceMotion() || intern.risk !== "高风险") return;
      const ctx = gsap.context(() => {
        gsap.fromTo("[data-risk-badge]", { scale: 0.96 }, { scale: 1, duration: 0.24, repeat: 1, yoyo: true, overwrite: "auto" });
      }, riskRef);
      return () => ctx.revert();
    },
    { scope: riskRef, dependencies: [intern.name, intern.risk] },
  );

  return (
    <div ref={riskRef}>
	    <Card className="glass-ai-panel hrbp-insight-card h-fit" data-gsap-result="">
	      <SectionTitle icon={BrainCircuit} title="AI Insight" subtitle={`${intern.name} · ${intern.role} · ${signalSourceForIntern(intern)}`} />
	      <div className="mt-5 space-y-4">
	        <div className="glass-panel-soft flex items-center justify-between rounded-2xl p-4">
	          <span className="text-sm font-medium text-[#6F6E72]">待确认线索</span>
	          <span data-risk-badge=""><AttentionBadge risk={intern.risk} /></span>
	        </div>
	        <div className="grid grid-cols-2 gap-3">
	          <div className="glass-panel-soft rounded-2xl p-4">
	            <p className="text-xs font-semibold text-[var(--role-accent)]">信号置信度</p>
	            <p className="mt-1 text-2xl font-black text-[#1D0C3B]">{intern.confidence}%</p>
	          </div>
	          <div className="glass-panel-soft rounded-2xl p-4">
	            <p className="text-xs font-semibold text-[#6F6E72]">闭环状态</p>
	            <div className="mt-2"><LoopStatusPill status={processStatusToLoopStatus(intern.processStatus)} /></div>
	          </div>
	        </div>
	        <div className="glass-panel-soft rounded-2xl p-4">
	          <p className="text-sm font-bold text-[#1D0C3B]">成长信号摘要</p>
          <div className="mt-3 grid gap-2">
            {intern.evidenceMetrics.map((metric) => (
              <div key={metric.label} className={cn("flex items-center justify-between rounded-xl px-3 py-2 text-sm ring-1", metricTone[metric.status])} data-gsap-result="">
                <span>{metric.label}</span>
                <strong>{metric.value}</strong>
              </div>
            ))}
          </div>
	        </div>
		        <InfoBlock title="关键证据" items={intern.evidence} />
		        <div className="glass-panel-soft rounded-2xl p-4">
		          <p className="text-sm font-bold text-[#1D0C3B]">人工确认边界</p>
	          <div className="mt-3 grid gap-2">
	            {[
		              ["信号来源", signalSourceForIntern(intern)],
		              ["AI 解释", "归因和建议仅来自上方证据，不直接生成留用、淘汰或绩效结论"],
		              ["人工确认", "HRBP 或导师确认后才进入跟进闭环"],
	            ].map(([label, detail]) => (
	              <div key={label} className="rounded-xl bg-white/46 px-3 py-2 text-xs leading-5 text-[#6F6E72]">
	                <strong className="mr-2 text-[var(--role-accent)]">{label}</strong>{detail}
	              </div>
	            ))}
	          </div>
	        </div>
	        <div className="flex flex-wrap gap-2">
	          {intern.riskTags.map((tag) => (
	            <span key={tag} className="rounded-[10px] border border-[var(--role-border)] bg-[var(--role-soft)] px-3 py-1 text-xs font-bold text-[var(--role-accent)]">{tag}</span>
	          ))}
	        </div>
	        <InfoBlock title="导师反馈摘要" text={intern.mentorFeedback} />
	        <InfoBlock title="HRBP 跟进建议" text={intern.hrAction.replace("高风险", "重点关注")} />
        <div className="grid gap-2 sm:grid-cols-3 2xl:grid-cols-1">
          {actionButtons.map(({ label, icon: Icon, status, targetRole }) => (
            <Button
              key={label}
              variant="ghost"
              className="glass-muted-button justify-start"
              disabled={!!actionLoading}
              onClick={() => generateHrAction(label, status, targetRole)}
            >
              {actionLoading === label ? <Loader2 className="h-4 w-4 animate-spin" /> : <Icon className="h-4 w-4" />}
              {actionLoading === label ? "AI 正在分析..." : label}
            </Button>
          ))}
        </div>
	        {actionError && <FeedbackNotice tone="error">{actionError}</FeedbackNotice>}
	        {actionMessage && <FeedbackNotice tone="success">{actionMessage}</FeedbackNotice>}
	        <div className="glass-panel-soft rounded-2xl p-4">
		          <p className="text-sm font-bold text-[#1D0C3B]">跟进闭环状态</p>
	          <div className="mt-4 space-y-3">
	            {collaborationFlow.map((step, index) => {
	              const done = index < completedFlow;
	              const current = index === completedFlow;
	              return (
	                <div key={step} className="flex items-center gap-3 text-sm" data-gsap-result="">
	                  <span className={cn(
	                    "flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-black",
	                    done ? "bg-[#31B88A] text-white" : current ? "bg-[var(--role-accent)] text-white" : "bg-white/58 text-[#C1B5C2] ring-1 ring-white/60",
	                  )}>
	                    {index + 1}
	                  </span>
	                  <span className={cn("font-semibold", done || current ? "text-slate-800" : "text-slate-400")}>{step}</span>
	                </div>
	              );
	            })}
	          </div>
	        </div>
	        <div className="glass-panel-soft rounded-2xl p-4">
	          <p className="text-sm font-bold text-[#1D0C3B]">跨端协同记录</p>
	          <p className="mt-1 text-xs text-[#6F6E72]">展示导师同步给 HRBP、HRBP 分派给导师的最新记录。</p>
          <div className="mt-3 space-y-2">
            {relatedRecords.length > 0 ? (
              relatedRecords.slice(0, 4).map((record) => (
	                <div key={record.id} className="rounded-xl bg-white/42 px-3 py-2">
	                  <div className="flex items-center justify-between gap-3">
	                    <p className="text-xs font-black text-slate-800">{record.title}</p>
	                    <SyncFlowBadge record={record} compact />
	                  </div>
                  <p className="mt-1 text-xs leading-5 text-slate-500">{record.detail}</p>
                  <p className="mt-1 text-[11px] font-semibold text-slate-400">{record.createdAt}</p>
                </div>
              ))
            ) : (
              <p className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-3 py-4 text-xs text-slate-500">
                暂无跨端记录。导师保存反馈或 HRBP 同步导师后，这里会更新。
              </p>
            )}
          </div>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 2xl:grid-cols-1">
          <div className="glass-panel-soft rounded-2xl p-4">
	          <p className="text-xs font-semibold text-[var(--role-accent)]">是否需要分派导师</p>
            <p className="mt-1 text-sm font-bold text-[#1D0C3B]">{intern.syncMentor.replace("强制", "主动")}</p>
          </div>
          <div className="rounded-2xl border border-[#C25055]/15 bg-[#C25055]/10 p-4">
	          <p className="text-xs font-semibold text-[#C25055]">复盘提醒</p>
            <p className="mt-1 text-sm font-bold text-[#1D0C3B]">{intern.reviewReminder}</p>
          </div>
        </div>
        <div className="glass-panel-soft rounded-2xl p-4">
          <p className="text-sm font-bold text-[#1D0C3B]">操作记录</p>
          <div className="mt-3 space-y-2">
            {intern.activityLog.map((log) => (
              <div key={log} className="flex gap-2 text-xs leading-5 text-slate-600">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--role-accent)]" />
                {log}
              </div>
            ))}
          </div>
        </div>
      </div>
    </Card>
    </div>
  );
}

function InfoBlock({ title, text, items }: { title: string; text?: string; items?: string[] }) {
  return (
    <div className="rounded-2xl bg-slate-50 p-4">
      <p className="text-sm font-bold text-slate-950">{title}</p>
      {text && <p className="mt-2 text-sm leading-6 text-slate-600">{text}</p>}
      {items && (
        <ol className="mt-2 space-y-2">
          {items.map((item, index) => (
            <li key={item} className="flex gap-2 text-sm leading-6 text-slate-600">
              <span className="font-bold text-[var(--role-accent)]">{index + 1}.</span>
              {item}
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}

function SharedRosterPanel({ managedInterns }: { managedInterns: ManagedIntern[] }) {
  return (
    <Card className="glass-panel" data-list-panel="">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <SectionTitle
          icon={ShieldCheck}
          title="三端共享花名册"
          subtitle="姓名、导师绑定、岗位方向与账号映射属于共享主数据；HRBP 工作台只读展示，避免破坏学生端和导师端关联。"
        />
        <span className="w-fit rounded-[10px] border border-emerald-100 bg-emerald-50 px-3 py-2 text-xs font-bold text-emerald-700">
          localStorage 共享数据源
        </span>
      </div>
      <div className="mt-5 overflow-x-auto">
        <table className="app-table w-full min-w-[780px] text-left text-sm">
          <thead>
            <tr className="text-xs text-slate-500">
              {["对象", "学生端账号", "导师端绑定", "岗位方向", "数据状态", "同步说明"].map((head) => (
                <th key={head} className="px-3 py-2 font-semibold">{head}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {managedInterns.map((intern) => (
              <tr key={intern.id} className="glass-table-row">
                <td className="rounded-l-2xl px-3 py-4 font-black text-slate-950">{intern.name}</td>
                <td className="px-3 py-4 text-slate-600">{intern.name}</td>
                <td className="px-3 py-4 text-slate-600">{intern.mentor}</td>
                <td className="px-3 py-4">
                  <span className="inline-flex rounded-md border border-blue-100 bg-blue-50 px-2.5 py-1 text-xs font-black text-[#2563EB]">
                    {intern.role.includes("研发") ? "研发" : intern.role.includes("销售") ? "销售" : "产品"}
                  </span>
                </td>
                <td className="px-3 py-4">
                  <span className="rounded-md border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-semibold text-slate-600">
                    账号已激活 · 导师已绑定
                  </span>
                </td>
                <td className="rounded-r-2xl px-3 py-4 text-slate-500">任务、提问和导师反馈录入后会在三端同步。</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

function AccountProgramPanel({
  managedInterns,
  onUpdateIntern,
}: {
  managedInterns: ManagedIntern[];
  onUpdateIntern: (id: string, patch: ManagedInternPatch) => void;
}) {
  const [mentors, setMentors] = useState<DemoMentorAccount[]>(() => readMentorAccounts(managedInterns));
  const [programs, setPrograms] = useState<DemoInternProgram[]>(() => readDemoInternPrograms());
  const [mentorForm, setMentorForm] = useState({ name: "", email: "", department: "产品部" });
  const activeProgram = programs[0];
  const activeMentors = mentors.filter((mentor) => mentor.status !== "disabled");
  const directionOptions = ["研发", "产品", "销售"] as const;
  const directionForIntern = (intern: ManagedIntern): typeof directionOptions[number] => {
    if (intern.role.includes("研发")) return "研发";
    if (intern.role.includes("销售")) return "销售";
    return "产品";
  };
  const displayDirection = (value: string): typeof directionOptions[number] => {
    if (value.includes("研发") || value.includes("技术")) return "研发";
    if (value.includes("销售") || value.includes("商业")) return "销售";
    return "产品";
  };
  const directionCounts = directionOptions.map((direction) => ({
    direction,
    count: managedInterns.filter((intern) => directionForIntern(intern) === direction).length,
  }));

  useEffect(() => {
    setMentors((current) => {
      const merged = new Map<string, DemoMentorAccount>();
      [...seedMentorAccounts(managedInterns), ...current].forEach((mentor) => {
        if (mentor.name.trim()) merged.set(mentor.name, mentor);
      });
      const next = Array.from(merged.values());
      persistMentorAccounts(next);
      return next;
    });
  }, [managedInterns]);

  const addMentorAccount = () => {
    const name = mentorForm.name.trim();
    if (!name) return;
    const nextMentor: DemoMentorAccount = {
      id: createId("mentor"),
      name,
      email: mentorForm.email.trim() || defaultEmailForName(name),
      department: mentorForm.department.trim() || "未分配部门",
      status: "active",
      createdAt: nowLabel(),
    };
    setMentors((current) => {
      const next = [nextMentor, ...current.filter((mentor) => mentor.name !== name)];
      persistMentorAccounts(next);
      return next;
    });
    setMentorForm({ name: "", email: "", department: mentorForm.department });
  };

  const updateMentorStatus = (mentorId: string, status: DemoAccountStatus) => {
    setMentors((current) => {
      const next = current.map((mentor) => mentor.id === mentorId ? { ...mentor, status } : mentor);
      persistMentorAccounts(next);
      return next;
    });
  };

  const deleteMentorAccount = (mentor: DemoMentorAccount) => {
    setMentors((current) => {
      const next = current.filter((item) => item.id !== mentor.id);
      persistMentorAccounts(next);
      return next;
    });
    managedInterns
      .filter((intern) => intern.mentor === mentor.name)
      .forEach((intern) => onUpdateIntern(intern.id, { mentor: "" }));
  };

  const updateProgramStatus = (status: DemoInternProgram["status"]) => {
    setPrograms((current) => {
      const next = current.map((program, index) => index === 0 ? { ...program, status } : program);
      persistDemoInternPrograms(next);
      return next;
    });
  };

  return (
    <Card className="glass-panel" data-list-panel="">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
        <SectionTitle
          icon={Users}
          title="导师与成员关系管理"
          subtitle="按研发、产品、销售三个方向维护导师账号，并在同一张成员表里完成导师绑定调整"
        />
        <span className="w-fit rounded-[10px] border border-[#BFDBFE] bg-[#EFF6FF] px-3 py-2 text-xs font-bold text-[#2563EB]">
          grownest:mentors / grownest:interns
        </span>
      </div>

      <div className="mt-5 grid gap-4 xl:grid-cols-[360px_minmax(0,1fr)]">
        <div className="space-y-4">
          <div className="rounded-2xl border border-[#BFDBFE] bg-[#EFF6FF]/70 p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate text-sm font-black text-slate-950">{activeProgram?.name ?? "默认实习项目"}</p>
                <p className="mt-1 text-xs font-semibold text-slate-500">
                  {activeProgram?.startDate ?? "2026-06-15"} 至 {activeProgram?.endDate ?? "2026-09-12"}
                </p>
              </div>
              <select
                value={activeProgram?.status ?? "active"}
                onChange={(event) => updateProgramStatus(event.target.value as DemoInternProgram["status"])}
                className="shrink-0 rounded-lg border border-blue-100 bg-white px-3 py-2 text-xs font-bold text-slate-700 outline-none"
              >
                <option value="active">进行中</option>
                <option value="review">复盘中</option>
                <option value="closed">已关闭</option>
              </select>
            </div>
            <div className="mt-4 grid grid-cols-3 gap-2">
              {directionCounts.map(({ direction, count }) => (
                <div key={direction} className="rounded-xl bg-white/78 px-3 py-2 text-center ring-1 ring-blue-100">
                  <p className="text-[11px] font-black text-[#2563EB]">{direction}</p>
                  <p className="mt-1 text-lg font-black text-slate-950">{count}</p>
                </div>
              ))}
            </div>
            <div className="mt-3 flex items-center justify-between rounded-xl bg-white/70 px-3 py-2 text-xs font-bold text-slate-600">
              <span>{managedInterns.length} 名实习生</span>
              <span>{activeMentors.length} 位导师</span>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-100 bg-white/72 p-4">
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm font-black text-slate-950">导师账号</p>
              <span className="rounded-md bg-slate-50 px-2.5 py-1 text-[11px] font-bold text-slate-500">{mentors.length} 个账号</span>
            </div>
            <div className="mt-3 grid gap-2">
              <input value={mentorForm.name} onChange={(event) => setMentorForm((current) => ({ ...current, name: event.target.value }))} placeholder="导师姓名" className="rounded-xl border border-slate-100 bg-white px-3 py-2 text-sm font-semibold text-slate-800 outline-none" />
              <div className="grid gap-2 sm:grid-cols-[1fr_96px] xl:grid-cols-1 2xl:grid-cols-[1fr_96px]">
                <input value={mentorForm.email} onChange={(event) => setMentorForm((current) => ({ ...current, email: event.target.value }))} placeholder="邮箱，可选" className="rounded-xl border border-slate-100 bg-white px-3 py-2 text-sm font-semibold text-slate-800 outline-none" />
                <select value={mentorForm.department} onChange={(event) => setMentorForm((current) => ({ ...current, department: event.target.value }))} className="rounded-xl border border-slate-100 bg-white px-3 py-2 text-sm font-bold text-slate-700 outline-none">
                  {directionOptions.map((direction) => <option key={direction} value={`${direction}部`}>{direction}</option>)}
                </select>
              </div>
            </div>
            <Button className="mt-3 w-full justify-center px-3 py-2 text-xs" onClick={addMentorAccount} disabled={!mentorForm.name.trim()}>
              <Plus className="h-3.5 w-3.5" />
              新增导师账号
            </Button>

            <div className="mt-4 grid gap-2">
              {mentors.map((mentor) => (
                <div key={mentor.id} className="rounded-xl border border-slate-100 bg-slate-50/70 p-3">
                  <div className="grid gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-black text-slate-950">{mentor.name}</p>
                      <p className="mt-1 truncate text-xs font-semibold text-slate-500">{mentor.email}</p>
                      <span className="mt-2 inline-flex rounded-md bg-white px-2.5 py-1 text-[11px] font-black text-[#2563EB] ring-1 ring-blue-100">
                        {displayDirection(mentor.department)}
                      </span>
                    </div>
                    <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2">
                      <select value={mentor.status} onChange={(event) => updateMentorStatus(mentor.id, event.target.value as DemoAccountStatus)} className="min-w-0 rounded-lg border border-slate-200 bg-white px-2.5 py-2 text-xs font-bold text-slate-700 outline-none">
                        <option value="pending">待激活</option>
                        <option value="active">已激活</option>
                        <option value="disabled">已停用</option>
                      </select>
                      <Button variant="ghost" className="shrink-0 px-2.5 py-2 text-xs text-rose-600" onClick={() => deleteMentorAccount(mentor)}>
                        删除
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-100 bg-white/72 p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-sm font-black text-slate-950">成员绑定表</p>
              <p className="mt-1 text-xs font-semibold text-slate-500">只展示研发、产品、销售方向；在“绑定导师”列直接调整负责关系。</p>
            </div>
            <div className="flex flex-wrap gap-2">
              {directionCounts.map(({ direction, count }) => (
                <span key={direction} className="rounded-md border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-black text-slate-600">
                  {direction} {count}
                </span>
              ))}
            </div>
          </div>

          <div className="mt-4 overflow-x-auto">
            <table className="app-table w-full min-w-[720px] text-left text-sm">
              <thead>
                <tr className="text-xs text-slate-500">
                  {["实习生", "方向", "当前导师", "绑定导师", "状态"].map((head) => <th key={head} className="px-3 py-2 font-semibold">{head}</th>)}
                </tr>
              </thead>
              <tbody>
                {managedInterns.map((intern) => {
                  const internDirection = directionForIntern(intern);
                  const availableMentors = activeMentors.filter((mentor) => displayDirection(mentor.department) === internDirection);
                  return (
                  <tr key={intern.id} className="glass-table-row">
                    <td className="rounded-l-2xl px-3 py-3.5">
                      <p className="font-black text-slate-950">{intern.name}</p>
                      <p className="mt-1 text-xs font-semibold text-slate-500">{defaultEmailForName(intern.name)}</p>
                    </td>
                    <td className="px-3 py-3.5">
                      <span className="inline-flex rounded-md border border-blue-100 bg-blue-50 px-2.5 py-1 text-xs font-black text-[#2563EB]">
                        {internDirection}
                      </span>
                    </td>
                    <td className="px-3 py-3.5 text-sm font-bold text-slate-700">{intern.mentor || "未分配"}</td>
                    <td className="px-3 py-3.5">
                      <select value={intern.mentor} onChange={(event) => onUpdateIntern(intern.id, { mentor: event.target.value })} className="w-full min-w-[116px] rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 outline-none">
                        <option value="">未分配</option>
                        {[intern.mentor, ...availableMentors.map((mentor) => mentor.name)]
                          .filter((name, index, list) => Boolean(name) && list.indexOf(name) === index)
                          .map((mentorName) => <option key={mentorName} value={mentorName}>{mentorName}</option>)}
                      </select>
                    </td>
                    <td className="rounded-r-2xl px-3 py-3.5">
                      <span className={cn(
                        "rounded-md border px-2.5 py-1 text-xs font-semibold",
                        intern.mentor ? "border-emerald-100 bg-emerald-50 text-emerald-700" : "border-amber-100 bg-amber-50 text-amber-700",
                      )}>{intern.mentor ? "已绑定" : "待分配"}</span>
                    </td>
                  </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </Card>
  );
}

function HrRiskPanel({
  records,
  onAddRecord,
  managedInterns,
  hasStarted = true,
}: {
  records: CollaborationRecord[];
  onAddRecord: (record: Omit<CollaborationRecord, "id" | "createdAt">) => void;
  managedInterns: ManagedIntern[];
  hasStarted?: boolean;
}) {
  const currentInterns = useMemo(() => managedInterns.map(managedToIntern), [managedInterns]);
  const [selectedName, setSelectedName] = useState(currentInterns[0]?.name ?? "");
  const [riskFilter, setRiskFilter] = useState<RiskLevel | "全部">("全部");
	  const filteredInterns = !hasStarted || riskFilter === "全部" ? currentInterns : currentInterns.filter((intern) => intern.risk === riskFilter);
  const selected = currentInterns.find((intern) => intern.name === selectedName) ?? currentInterns[0];
  const selectedVisible = selected ? filteredInterns.some((intern) => intern.name === selected.name) : false;
  const visibleSelected = selectedVisible ? selected : filteredInterns[0] ?? currentInterns[0];
  const relatedRecords = visibleSelected ? records.filter((record) => record.internName === visibleSelected.name) : [];
  const visibleSelectedHasProgress = Boolean(
    visibleSelected &&
    (
      visibleSelected.progress > 0 ||
      relatedRecords.length > 0 ||
      visibleSelected.processStatus !== "待 HR 沟通"
    ),
  );

	  return (
	    <div className="hrbp-roster-workspace grid items-start gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(360px,420px)]">
      <Card className="glass-panel hrbp-object-list overflow-hidden">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
	          <SectionTitle
              icon={Users}
              title={hasStarted ? "关注对象列表" : "人员池花名册"}
              subtitle={hasStarted ? "按成长信号等级筛选，再进入对象详情确认跟进动作" : "当前展示已导入对象，任务、反馈和提问录入后自动汇总"}
            />
	          {hasStarted && <div className="flex flex-wrap gap-2">
		            {(["全部", "低风险", "中风险", "高风险"] as Array<RiskLevel | "全部">).map((risk) => (
	              <button
                key={risk}
                onClick={() => {
                  setRiskFilter(risk);
                  const nextList = risk === "全部" ? currentInterns : currentInterns.filter((intern) => intern.risk === risk);
                  if (nextList.length) setSelectedName(nextList[0].name);
                }}
                className={cn(
                  "rounded-[12px] px-3 py-2 text-xs font-bold ring-1 transition",
                  riskFilter === risk ? "bg-[var(--role-accent)] text-white ring-[var(--role-accent)]" : "bg-white/44 text-[#6F6E72] ring-white/60 hover:bg-white/66 hover:text-[var(--role-accent)]",
                )}
              >
	                {risk === "全部" ? "全部" : attentionLabel[risk]}
	              </button>
		            ))}
			            </div>}
        </div>
        <div className="mt-5 grid gap-3 sm:grid-cols-2 2xl:grid-cols-3">
          {filteredInterns.length > 0 ? (
            filteredInterns.map((intern) => (
              <button
                key={intern.name}
                onClick={() => setSelectedName(intern.name)}
                aria-selected={visibleSelected?.name === intern.name}
                className={cn(
                  "hrbp-object-card w-full rounded-[16px] border p-4 text-left transition",
                  visibleSelected?.name === intern.name
                    ? "border-[var(--role-accent)] bg-[var(--role-soft)] shadow-[0_8px_24px_-12px_rgba(80,70,120,0.35)] ring-1 ring-[var(--role-accent)]/40"
                    : "border-white/58 bg-white/64 hover:border-white/80 hover:bg-white/78",
                )}
                data-gsap-result=""
              >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-black text-slate-950">{intern.name}</p>
                  <p className="mt-1 text-xs font-semibold text-slate-500">{intern.role} · {intern.week}</p>
                </div>
	                  {intern.progress > 0 ? <AttentionBadge risk={intern.risk} /> : (
                      <span className="rounded-md border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-semibold text-slate-600">没有进度</span>
                    )}
                </div>
                <div className="mt-4 flex items-center gap-3">
                  <div className="h-2 flex-1 rounded-full bg-slate-200">
                    <div className="h-2 rounded-full bg-[#31B88A]" data-progress-fill="" style={{ width: `${intern.progress}%` }} />
                  </div>
                  <span className="text-xs font-black text-slate-700">{intern.progress}%</span>
                </div>
	                <p className="mt-3 line-clamp-2 text-xs leading-5 text-slate-600">{hasStarted ? intern.reason : "学生端和导师端录入任务进度、提问和反馈后会形成成长信号。"}</p>
	                <div className="mt-3 flex items-center justify-between gap-3">
	                  {hasStarted ? <LoopStatusPill status={processStatusToLoopStatus(intern.processStatus)} /> : (
                      <span className="inline-flex items-center rounded-md border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-semibold text-slate-600">来源：没有进度</span>
                    )}
	                  <span className="text-xs font-semibold text-[var(--role-accent)]">{hasStarted ? intern.todo : intern.role}</span>
                </div>
              </button>
            ))
          ) : (
	            <p className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-5 text-sm text-slate-500">当前筛选下没有关注对象，可切换状态或返回全部查看。</p>
          )}
        </div>
      </Card>

      {visibleSelected && (
        <div className="space-y-4 xl:sticky xl:top-4 xl:self-start xl:max-h-[calc(100vh-160px)] xl:overflow-y-auto xl:pr-1">
        <Card className="glass-panel">
	          <SectionTitle
              icon={ListChecks}
              title={`${visibleSelected.name} 的跟进详情`}
              subtitle={hasStarted ? "把 AI 信号转成人工确认、导师动作和复盘记录" : "当前展示基础信息，成长记录录入后自动汇总"}
            />
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            {[
              ["成长进度", `${visibleSelected.progress}%`],
              ["入职周数", visibleSelected.week],
	              ["当前状态", visibleSelectedHasProgress ? visibleSelected.processStatus : "没有进度"],
	              ["协同记录", `${relatedRecords.length} 条`],
            ].map(([label, value]) => (
              <div key={label} className="rounded-2xl border border-white/50 bg-white/48 p-4">
                <p className="text-xs font-bold text-slate-500">{label}</p>
                <p className="mt-2 text-lg font-black text-slate-950">{value}</p>
              </div>
            ))}
          </div>
          <div className="mt-5 space-y-4">
	            <InfoBlock title={visibleSelectedHasProgress ? "成长信号来源" : "数据状态"} text={visibleSelectedHasProgress ? signalSourceForIntern(visibleSelected) : "录入成长数据后会自动整理信号来源"} />
		            {visibleSelectedHasProgress && <InfoBlock title="AI 可解释摘要" items={visibleSelected.evidence} />}
		            {visibleSelectedHasProgress && <InfoBlock title="建议跟进动作" text={visibleSelected.todo} />}
          </div>
        </Card>
            {visibleSelectedHasProgress && visibleSelected && <RiskCard key={visibleSelected.name} intern={visibleSelected} records={records} onAddRecord={onAddRecord} />}
          </div>
      )}
    </div>
  );
}
function HRDashboard({
  user,
  records,
  onAddRecord,
  managedInterns,
  onCreateIntern,
  onUpdateIntern,
  onDeleteIntern,
  onCreateTask,
  onUpdateTask,
  onDeleteTask,
  onCreateFeedback,
  onUpdateFeedback,
  onDeleteFeedback,
  reviewRecords,
}: {
  user: AuthUser;
  records: CollaborationRecord[];
  onAddRecord: (record: Omit<CollaborationRecord, "id" | "createdAt">) => void;
  managedInterns: ManagedIntern[];
  onCreateIntern: (form: InternFormState) => void;
  onUpdateIntern: (id: string, patch: ManagedInternPatch) => void;
  onDeleteIntern: (id: string) => void;
  onCreateTask: (internId: string, form: TaskFormState) => void;
  onUpdateTask: (internId: string, taskId: string, patch: Partial<GrowthTask>) => void;
  onDeleteTask: (internId: string, taskId: string) => void;
  onCreateFeedback: (internId: string, form: FeedbackFormState) => void;
  onUpdateFeedback: (internId: string, feedbackId: string, patch: Partial<MentorFeedbackRecord>) => void;
  onDeleteFeedback: (internId: string, feedbackId: string) => void;
  reviewRecords: ReviewRecord[];
}) {
  type HrbpSectionKey = "accounts" | "mentors" | "signals" | "actions";
  const [activeSection, setActiveSection] = useState<HrbpSectionKey | null>(null);
  const activeRecords = records;
  const growthSignals = useMemo(
    () => getVisibleGrowthSignals(user, managedInterns, activeRecords),
    [managedInterns, activeRecords, user],
  );
  const mentorNames = Array.from(new Set(managedInterns.map((intern) => intern.mentor).filter(Boolean)));
  const unassignedInterns = managedInterns.filter((intern) => !intern.mentor.trim());
  const hasSharedSignals = activeRecords.length > 0 || managedInterns.some((intern) => intern.progress > 0 || intern.feedbacks.length > 0 || intern.tasks.some((task) => task.status === "已完成"));
  const studentSignalCount = growthSignals.filter((signal) => signal.source === "student").length;
  const mentorSyncedFeedbackCount = growthSignals.filter((signal) => signal.source === "mentor" || signal.type === "feedback").length;
  const pendingGrowthSignalCount = growthSignals.filter((signal) => signal.status === "pending").length;
  const activeGrowthSignalCount = growthSignals.filter((signal) => signal.type === "followup" || signal.status === "review").length;
  const pendingHrReview = managedInterns.filter((intern) => intern.processStatus === "待 HR 沟通").length;
  const pendingMentorSync = managedInterns.filter((intern) => intern.risk !== "低风险" && intern.processStatus !== "已同步导师").length;
  const inReview = managedInterns.filter((intern) => intern.processStatus === "复盘中").length;
  const activeFollowups = managedInterns.filter((intern) => intern.processStatus === "已同步导师").length;
  const completedReviews = managedInterns.filter((intern) => intern.processStatus === "已关闭").length;
  const homeStats = [
    { label: "实习生人数", value: `${managedInterns.length} 人`, icon: Users, tone: "blue" as const },
    { label: "导师人数", value: `${mentorNames.length} 人`, icon: UserCheck, tone: "green" as const },
    { label: "待确认信号", value: `${Math.max(pendingHrReview, pendingGrowthSignalCount)} 条`, icon: Flag, tone: "amber" as const },
    { label: "进行中跟进", value: `${Math.max(activeFollowups + inReview, activeGrowthSignalCount)} 项`, icon: ListChecks, tone: "blue" as const },
    { label: "复盘记录", value: `${Math.max(activeRecords.length, completedReviews)} 条`, icon: FileText, tone: "green" as const },
  ];
  const currentTodos = [
    {
      title: "待确认成长信号",
      value: `${Math.max(pendingHrReview, pendingGrowthSignalCount)} 条`,
      detail: "进入成长信号中心完成人工确认",
      action: "查看信号",
      section: "signals" as const,
    },
    {
      title: "未分配导师",
      value: `${unassignedInterns.length} 人`,
      detail: unassignedInterns.length ? "需要补齐导师绑定关系" : "当前人员均已绑定导师",
      action: "查看分配",
      section: "mentors" as const,
    },
    {
      title: "进行中跟进",
      value: `${Math.max(activeFollowups + inReview, activeGrowthSignalCount)} 项`,
      detail: "检查动作状态并推进闭环",
      action: "处理行动",
      section: "actions" as const,
    },
    {
      title: "待沉淀复盘",
      value: `${reviewRecords.length} 条`,
      detail: "把已完成动作转为复盘记录",
      action: "查看复盘",
      section: "actions" as const,
    },
  ];
  const hrbpSections = [
    { key: "accounts" as const, title: "项目与账号管理", description: "维护实习项目、实习生账号与导师账号，确保项目成员信息清晰可管理。", icon: Users, metric: `${managedInterns.length} 名实习生 · ${mentorNames.length} 位导师` },
    { key: "mentors" as const, title: "导师分配", description: "为实习生匹配导师，查看导师负责对象与带教负载。", icon: UserCheck, metric: unassignedInterns.length ? `${unassignedInterns.length} 人未分配` : "导师绑定完整" },
    { key: "signals" as const, title: "成长信号中心", description: "汇总任务进度、导师反馈和实习生提问，由 AI 辅助整理为可确认的问题线索。", icon: BrainCircuit, metric: `${growthSignals.length} 条成长信号` },
  ];
  const activeSectionMeta = hrbpSections.find((section) => section.key === activeSection);
  const ActiveSectionIcon = activeSectionMeta?.icon;

  useEffect(() => {
    if (!activeSection) return undefined;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setActiveSection(null);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [activeSection]);

  return (
    <div className="hrbp-dashboard space-y-5">
      <Card className="mentor-command-panel overflow-hidden border-[var(--role-border)] bg-gradient-to-br from-white via-white/80 to-slate-50/70 p-5">
        <div className="min-w-0 space-y-4">
          <SectionTitle
            icon={LayoutDashboard}
            title="HRBP 成长协同工作台"
            subtitle="汇总实习项目、成长信号与跟进行动，帮助 HRBP 以全局视角推动实习生成长闭环。"
          />
          <div className="mentor-sync-strip hrbp-sync-strip mt-4" aria-label="学生端、导师端、HRBP端数据同步状态">
            <div className="hrbp-sync-heading">
              <span>三端数据同步</span>
              <strong>实时汇总</strong>
            </div>
            <div className="hrbp-sync-grid">
              {[
                ["学生端", hasSharedSignals ? `${studentSignalCount} 条成长信号` : "任务录入后自动形成", "任务、提问、成长记录"],
                ["导师端", `${mentorSyncedFeedbackCount} 条反馈信号`, "反馈与带教动作回流"],
                ["HRBP端", `${activeRecords.length} 条协同记录`, "确认、分派、复盘沉淀"],
              ].map(([label, value, detail]) => (
                <div key={label} className="mentor-sync-pill">
                  <span className="mentor-sync-dot" />
                  <span className="mentor-sync-label">{label}</span>
                  <strong className="mentor-sync-value">{value}</strong>
                  <span className="mentor-sync-detail">{detail}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Card>

      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-5">
        {homeStats.map((stat) => (
          <StatCard key={stat.label} label={stat.label} value={stat.value} icon={stat.icon} tone={stat.tone} />
        ))}
      </div>

      <Card>
        <SectionTitle icon={Flag} title="当前待办" subtitle="只保留最需要 HRBP 处理的入口，详细信息进入对应分区查看" />
        <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {currentTodos.map((todo) => (
            <button
              key={todo.title}
              onClick={() => setActiveSection(todo.section)}
              className="rounded-2xl border border-slate-100 bg-white/82 p-4 text-left shadow-[0_12px_34px_rgba(21,41,71,0.045)] transition hover:-translate-y-0.5 hover:border-[var(--role-border)] hover:bg-[var(--role-soft)]"
            >
              <p className="text-xs font-bold text-[#6F6E72]">{todo.title}</p>
              <p className="mt-2 text-2xl font-black text-[#1D0C3B]">{todo.value}</p>
              <p className="mt-2 text-sm font-semibold leading-6 text-slate-600">{todo.detail}</p>
              <p className="mt-3 inline-flex items-center text-xs font-bold text-[var(--role-accent)]">
                {todo.action}
                <ChevronRight className="ml-1 h-3.5 w-3.5" />
              </p>
            </button>
          ))}
        </div>
      </Card>

      <Card>
        <SectionTitle icon={AlertTriangle} title="高优先级关注对象" subtitle="首页只展示最需要先看的对象，完整名单进入成长信号中心" />
        <div className="mt-5">
          {managedInterns.filter((intern) => intern.risk === "高风险" || intern.processStatus === "待 HR 沟通").length > 0 ? (
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {managedInterns
                .filter((intern) => intern.risk === "高风险" || intern.processStatus === "待 HR 沟通")
                .slice(0, 6)
                .map((intern) => (
                  <button
                    key={intern.name}
                    onClick={() => setActiveSection("signals")}
                    className="rounded-2xl border border-slate-100 bg-white/82 p-4 text-left transition hover:border-[var(--role-border)]"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-black text-slate-950">{intern.name}</p>
                      <AttentionBadge risk={intern.risk} />
                    </div>
                    <p className="mt-1 text-xs font-semibold text-slate-500">{intern.role} · {intern.week}</p>
                    <p className="mt-2 text-xs leading-5 text-slate-600 line-clamp-2">{intern.reason || "暂无具体描述"}</p>
                  </button>
                ))}
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/60 p-5 text-sm text-slate-500">
              暂无高优先级关注对象。成长信号录入后，HRBP 可从这里快速进入处理。
            </div>
          )}
        </div>
      </Card>

      <Card>
        <SectionTitle icon={LayoutDashboard} title="分区入口" subtitle="详细功能收纳在三个工作区中，点击卡片从右侧打开对应详情" />
        <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {hrbpSections.map(({ key, title, description, icon: Icon, metric }) => (
            <button
              key={key}
              type="button"
              onClick={() => setActiveSection(key)}
              className="group rounded-2xl border border-slate-100 bg-white/82 p-4 text-left shadow-[0_12px_34px_rgba(21,41,71,0.045)] transition hover:-translate-y-0.5 hover:border-[var(--role-border)] hover:bg-[var(--role-soft)]"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--role-soft)] text-[var(--role-accent)] ring-1 ring-[var(--role-border)]">
                <Icon className="h-4 w-4" />
              </div>
              <p className="mt-4 font-black text-slate-950">{title}</p>
              <p className="mt-2 text-sm leading-6 text-slate-600">{description}</p>
              <div className="mt-4 flex items-center justify-between gap-3">
                <span className="text-xs font-black text-[var(--role-accent)]">{metric}</span>
                <ChevronRight className="h-4 w-4 text-slate-400 transition group-hover:translate-x-0.5 group-hover:text-[var(--role-accent)]" />
              </div>
            </button>
          ))}
        </div>
      </Card>

      {activeSectionMeta && (
        <div
          className="fixed inset-0 z-50 flex justify-end bg-slate-950/25 p-0 backdrop-blur-[2px]"
          role="dialog"
          aria-modal="true"
          aria-label={activeSectionMeta.title}
          onClick={() => setActiveSection(null)}
        >
          <div
            className="h-full w-full max-w-[1180px] overflow-y-auto bg-[#f8fbff] p-6 shadow-[-24px_0_70px_rgba(15,23,42,0.18)]"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="-mx-6 -mt-6 mb-6 border-b border-slate-200 bg-[#f8fbff] px-6 py-4">
              <div className="rounded-2xl border border-slate-200 bg-white/92 p-4 shadow-[0_14px_40px_rgba(15,23,42,0.06)]">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex min-w-0 items-start gap-4">
                    {ActiveSectionIcon && (
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[var(--role-soft)] text-[var(--role-accent)] ring-1 ring-[var(--role-border)]">
                        <ActiveSectionIcon className="h-5 w-5" />
                      </div>
                    )}
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-xs font-black uppercase text-[var(--role-accent)]">HRBP 全局权限</p>
                        <span className="rounded-md border border-slate-200 bg-slate-50 px-2 py-1 text-xs font-bold text-slate-500">{activeSectionMeta.metric}</span>
                      </div>
                      <h2 className="mt-1 text-2xl font-black text-slate-950">{activeSectionMeta.title}</h2>
                      <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">{activeSectionMeta.description}</p>
                    </div>
                  </div>
                  <Button variant="ghost" className="shrink-0 px-3" onClick={() => setActiveSection(null)}>
                    <X className="h-4 w-4" />
                    关闭
                  </Button>
                </div>
              </div>
            </div>

            <div className="space-y-5">
              {activeSection === "accounts" && (
                <>
                  <AccountProgramPanel managedInterns={managedInterns} onUpdateIntern={onUpdateIntern} />
                  <DataManagementPanel
                    user={user}
                    managedInterns={managedInterns}
                    onCreateIntern={onCreateIntern}
                    onUpdateIntern={onUpdateIntern}
                    onDeleteIntern={onDeleteIntern}
                    onCreateTask={onCreateTask}
                    onUpdateTask={onUpdateTask}
                    onDeleteTask={onDeleteTask}
                    onCreateFeedback={onCreateFeedback}
                    onUpdateFeedback={onUpdateFeedback}
                    onDeleteFeedback={onDeleteFeedback}
                  />
                </>
              )}

              {activeSection === "mentors" && (
                <>
                  <AccountProgramPanel managedInterns={managedInterns} onUpdateIntern={onUpdateIntern} />
                  <Card className="glass-panel">
                    <SectionTitle icon={UserCheck} title="导师负载概览" subtitle="查看每位导师负责对象与带教负载；未分配对象可在上方直接完成绑定" />
                    <div className="mt-5 grid gap-3 md:grid-cols-3">
                      {mentorNames.map((mentor) => {
                        const owned = managedInterns.filter((intern) => intern.mentor === mentor);
                        return (
                          <div key={mentor} className="rounded-2xl bg-white/70 p-4 ring-1 ring-slate-100">
                            <p className="font-black text-slate-950">{mentor}</p>
                            <p className="mt-1 text-2xl font-black text-[var(--role-accent)]">{owned.length} 人</p>
                            <p className="mt-2 text-xs leading-5 text-slate-500">{owned.map((intern) => intern.name).join("、") || "暂无负责对象"}</p>
                          </div>
                        );
                      })}
                      {unassignedInterns.length > 0 && (
                        <div className="rounded-2xl border border-amber-100 bg-amber-50/80 p-4">
                          <p className="font-black text-amber-900">未分配导师</p>
                          <p className="mt-1 text-2xl font-black text-amber-700">{unassignedInterns.length} 人</p>
                          <p className="mt-2 text-xs leading-5 text-amber-700">{unassignedInterns.map((intern) => intern.name).join("、")}</p>
                        </div>
                      )}
                    </div>
                    {unassignedInterns.length > 0 && (
                      <FeedbackNotice tone="warning" className="mt-4">
                        仍有 {unassignedInterns.length} 位实习生未分配导师，请在上方"绑定导师"列补齐关系。
                      </FeedbackNotice>
                    )}
                  </Card>
                  <SharedRosterPanel managedInterns={managedInterns} />
                </>
              )}

              {activeSection === "signals" && (
                <div className="space-y-5">
                  <HrbpActionLoopSummary
                    growthSignals={growthSignals}
                    managedInterns={managedInterns}
                    pendingHrReview={pendingHrReview}
                    pendingMentorSync={pendingMentorSync}
                    inReview={inReview}
                    activeFollowups={activeFollowups}
                    completedReviews={completedReviews}
                    activeRecords={activeRecords}
                    onOpenWorkspace={() => setActiveSection("actions")}
                  />
                  <HrRiskPanel key={hasSharedSignals ? "started" : "empty"} records={activeRecords} onAddRecord={onAddRecord} managedInterns={managedInterns} hasStarted={hasSharedSignals} />
                </div>
              )}

              {activeSection === "actions" && (
                <>
                  <HrbpActionLoopWorkspace
                    growthSignals={growthSignals}
                    managedInterns={managedInterns}
                    reviewRecords={reviewRecords}
                    onOpenSignals={() => setActiveSection("signals")}
                  />
                  <Card className="glass-panel" data-list-panel="">
                    <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                      <SectionTitle
                        icon={ShieldCheck}
                        title="复盘沉淀记录"
                        subtitle="HRBP 在全局信号池标记复盘后，这里形成可追溯的闭环记录，对应学生端和导师端都能看到"
                      />
                      <span className="w-fit rounded-[10px] border border-emerald-100 bg-emerald-50 px-3 py-2 text-xs font-bold text-emerald-700">
                        {reviewRecords.length} 条已沉淀
                      </span>
                    </div>
                    <div className="mt-5 grid gap-3 md:grid-cols-2">
                      {reviewRecords.length > 0 ? (
                        reviewRecords.slice(0, 8).map((record) => (
                          <div key={record.id} className="rounded-2xl border border-emerald-100 bg-emerald-50/60 p-4">
                            <div className="flex flex-wrap items-center justify-between gap-2">
                              <p className="text-sm font-black text-slate-950">{record.internName} · {record.signalTitle}</p>
                              <span className="rounded-full bg-white px-2.5 py-1 text-[11px] font-bold text-emerald-700">已复盘</span>
                            </div>
                            <p className="mt-2 text-sm leading-6 text-slate-700">{record.conclusion}</p>
                            <p className="mt-2 text-[11px] font-semibold text-slate-500">下一步：{record.nextStep}</p>
                            <p className="mt-1 text-[11px] font-semibold text-slate-400">{record.createdAt} · {record.reviewer}</p>
                          </div>
                        ))
                      ) : (
                        <div className="md:col-span-2 rounded-2xl border border-dashed border-emerald-200 bg-emerald-50/30 px-4 py-6 text-sm font-semibold text-slate-500">
                          还没有复盘记录。在全局成长信号池点「标记复盘」即可沉淀阶段结论。
                        </div>
                      )}
                    </div>
                  </Card>
                </>
              )}
            </div>

            <div className="sticky bottom-0 -mx-5 mt-6 border-t border-slate-200 bg-white/92 px-5 py-4 backdrop-blur">
              <Button onClick={() => setActiveSection(null)}>
                <CheckCircle2 className="h-4 w-4" />
                返回工作台首页
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}




const retainedLegacyAIReport: AIReport | null = null;
void retainedLegacyAIReport;
const retainedLegacyDeclarations = [
  getRoleProgressData,
  getRiskDistributionData,
  managedInternStorageKey,
  grownestManagedInternStorageKey,
  rolePath,
  mvpScopes,
  permissionBoundaries,
  aiReliabilityChecks,
  deriveHiringFeedback,
  getTaskDrivenProgress,
  nextProcessStatusFromRecord,
  canAssignAction,
  readStoredUser,
  HrbpSignalPanel,
  MeasuredChart,
];
void retainedLegacyDeclarations;

export default function App() {
  const { user, login, logout } = useAuth();
  const { managedInterns, updateManagedInterns } = useInterns(seedManagedInterns);
  const [path, setPath] = useState<Path>(() => {
    if (typeof window === "undefined") return "/";
    return (window.location.pathname as Path) || "/";
  });
  const [records, setRecords] = useState<CollaborationRecord[]>(() => readCollaborationRecords());
  const [reviewRecords, setReviewRecords] = useState<ReviewRecord[]>(() => readReviewRecords());

  useEffect(() => {
    if (typeof window === "undefined") return;
    const onPop = () => setPath((window.location.pathname as Path) || "/");
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  useEffect(() => {
    persistCollaborationRecords(records);
  }, [records]);

  useEffect(() => {
    persistReviewRecords(reviewRecords);
  }, [reviewRecords]);

  const navigateTo = useCallback((next: Path) => {
    if (typeof window !== "undefined") {
      window.history.pushState({}, "", next);
    }
    setPath(next);
  }, []);

  const handleLogin = useCallback((nextUser: AuthUser) => {
    login(nextUser);
    const roleHome: Record<UserRole, Path> = {
      student: "/student",
      mentor: "/mentor",
      hr: "/hr",
      admin: "/admin",
    };
    navigateTo(roleHome[nextUser.role]);
  }, [login, navigateTo]);

  const handleLogout = useCallback(() => {
    logout();
    navigateTo("/");
  }, [logout, navigateTo]);

  const resetDemoData = useCallback(() => {
    updateManagedInterns(() => seedManagedInterns());
    setRecords([]);
    setReviewRecords([]);
  }, [updateManagedInterns]);

  const addCollaborationRecord = useCallback((record: Omit<CollaborationRecord, "id" | "createdAt">) => {
    setRecords((current) => [
      { id: createId("record"), createdAt: nowLabel(), ...record },
      ...current,
    ].slice(0, 80));
  }, []);

  const updateCollaborationRecord = useCallback((id: string, patch: Partial<CollaborationRecord>) => {
    setRecords((current) => current.map((record) => record.id === id ? { ...record, ...patch } : record));
  }, []);

  const createManagedIntern = useCallback((form: InternFormState) => {
    const createdAt = nowLabel();
    updateManagedInterns((current) => [
      {
        id: createId("intern"),
        name: form.name,
        role: form.role,
        title: form.title,
        department: form.department,
        mentor: form.mentor,
        week: form.week,
        progress: form.progress,
        risk: form.risk,
        reason: form.reason,
        todo: form.todo,
        processStatus: form.processStatus,
        status: form.status,
        riskTags: form.riskTagsText.split(/[、,，\s]+/).map((tag) => tag.trim()).filter(Boolean),
        tasks: [],
        feedbacks: [],
        createdAt,
        updatedAt: createdAt,
      },
      ...current,
    ]);
  }, [updateManagedInterns]);

  const updateManagedIntern = useCallback((id: string, patch: ManagedInternPatch) => {
    updateManagedInterns((current) => current.map((intern) => (
      intern.id === id ? { ...intern, ...patch, updatedAt: nowLabel() } : intern
    )));
  }, [updateManagedInterns]);

  const deleteManagedIntern = useCallback((id: string) => {
    updateManagedInterns((current) => current.filter((intern) => intern.id !== id));
  }, [updateManagedInterns]);

  const createTask = useCallback((internId: string, form: TaskFormState) => {
    updateManagedInterns((current) => current.map((intern) => (
      intern.id === internId
        ? {
            ...intern,
            tasks: [{ ...form, id: createId("task") }, ...intern.tasks],
            updatedAt: nowLabel(),
          }
        : intern
    )));
  }, [updateManagedInterns]);

  const updateTask = useCallback((internId: string, taskId: string, patch: Partial<GrowthTask>) => {
    updateManagedInterns((current) => current.map((intern) => (
      intern.id === internId
        ? {
            ...intern,
            tasks: intern.tasks.map((task) => task.id === taskId ? { ...task, ...patch } : task),
            updatedAt: nowLabel(),
          }
        : intern
    )));
  }, [updateManagedInterns]);

  const deleteTask = useCallback((internId: string, taskId: string) => {
    updateManagedInterns((current) => current.map((intern) => (
      intern.id === internId
        ? { ...intern, tasks: intern.tasks.filter((task) => task.id !== taskId), updatedAt: nowLabel() }
        : intern
    )));
  }, [updateManagedInterns]);

  const createFeedback = useCallback((internId: string, form: FeedbackFormState) => {
    updateManagedInterns((current) => current.map((intern) => (
      intern.id === internId
        ? {
            ...intern,
            feedbacks: [{ ...form, id: createId("feedback"), createdAt: nowLabel() }, ...intern.feedbacks],
            updatedAt: nowLabel(),
          }
        : intern
    )));
  }, [updateManagedInterns]);

  const updateFeedback = useCallback((internId: string, feedbackId: string, patch: Partial<MentorFeedbackRecord>) => {
    updateManagedInterns((current) => current.map((intern) => (
      intern.id === internId
        ? {
            ...intern,
            feedbacks: intern.feedbacks.map((feedback) => feedback.id === feedbackId ? { ...feedback, ...patch } : feedback),
            updatedAt: nowLabel(),
          }
        : intern
    )));
  }, [updateManagedInterns]);

  const deleteFeedback = useCallback((internId: string, feedbackId: string) => {
    updateManagedInterns((current) => current.map((intern) => (
      intern.id === internId
        ? { ...intern, feedbacks: intern.feedbacks.filter((feedback) => feedback.id !== feedbackId), updatedAt: nowLabel() }
        : intern
    )));
  }, [updateManagedInterns]);

  const title = useMemo(() => {
    if (!user) return "";
    if (user.role === "student") return "实习生成长端｜我的成长地图";
    if (user.role === "mentor") return "导师带教端｜带教任务与反馈助手";
    if (user.role === "hr") return "HRBP 成长运营台｜人员池管理与协同复盘";
    return "系统管理后台｜权限、批次与模板配置";
  }, [user]);

  if (path === "/preview-theme") {
    return <ThemePreviewPage />;
  }

  if (path === "/" && !user) {
    return <HomePage onNavigate={navigateTo} />;
  }

  if (path === "/login" || !user) {
    return <LoginPage onLogin={handleLogin} />;
  }

  const roleHome: Record<UserRole, Path> = {
    student: "/student",
    mentor: "/mentor",
    hr: "/hr",
    admin: "/admin",
  };

  if (path !== roleHome[user.role] && path !== "/") {
    navigateTo(roleHome[user.role]);
  }

  return (
    <AppLayout user={user} title={title} onLogout={handleLogout} onResetDemo={resetDemoData}>
      {user.role === "student" && (
        <StudentDashboard
          user={user}
          records={records}
          onAddRecord={addCollaborationRecord}
          onUpdateRecord={updateCollaborationRecord}
          managedInterns={managedInterns}
          onUpdateTask={updateTask}
          reviewRecords={reviewRecords}
        />
      )}
      {user.role === "mentor" && (
        <MentorDashboard
          user={user}
          records={records}
          onAddRecord={addCollaborationRecord}
          onUpdateRecord={updateCollaborationRecord}
          managedInterns={managedInterns}
          onCreateFeedback={createFeedback}
          reviewRecords={reviewRecords}
        />
      )}
      {user.role === "hr" && (
        <HRDashboard
          user={user}
          records={records}
          onAddRecord={addCollaborationRecord}
          managedInterns={managedInterns}
          onCreateIntern={createManagedIntern}
          onUpdateIntern={updateManagedIntern}
          onDeleteIntern={deleteManagedIntern}
          onCreateTask={createTask}
          onUpdateTask={updateTask}
          onDeleteTask={deleteTask}
          onCreateFeedback={createFeedback}
          onUpdateFeedback={updateFeedback}
          onDeleteFeedback={deleteFeedback}
          reviewRecords={reviewRecords}
        />
      )}
      {user.role === "admin" && (
        <Card className="glass-panel">
          <SectionTitle icon={LockKeyhole} title="系统管理后台" subtitle="配置账号、实习项目、岗位成长模板和权限范围，保障业务端数据可维护。" />
          <div className="mt-5 grid gap-3 md:grid-cols-3">
            {["账号与角色", "实习项目", "岗位模板"].map((item) => (
              <div key={item} className="rounded-2xl border border-slate-100 bg-white/70 p-4">
                <p className="font-black text-slate-950">{item}</p>
                <p className="mt-2 text-sm leading-6 text-slate-500">当前演示版本保留配置入口，详细管理能力可继续扩展。</p>
              </div>
            ))}
          </div>
        </Card>
      )}
    </AppLayout>
  );
}
