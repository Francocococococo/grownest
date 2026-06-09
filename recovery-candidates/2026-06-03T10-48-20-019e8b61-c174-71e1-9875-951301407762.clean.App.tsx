import { useEffect, useMemo, useRef, useState } from "react";
import type { CSSProperties, ElementType, HTMLAttributes, ReactNode, RefObject } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
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
  Gauge,
  GraduationCap,
  Home,
  LayoutDashboard,
  ListChecks,
  LockKeyhole,
  Loader2,
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
} from "lucide-react";
import { cn } from "./lib/utils";
import { useAuth } from "./hooks/useAuth";
import { useInterns } from "./hooks/useInterns";
import ThemePreviewPage from "./ThemePreviewPage";
import { generateFallbackOutput, generateRiskAnalysis } from "./utils/ai";
import { getAverageProgress, getMentorFeedbackRate } from "./utils/calculations";
import {
  growthStages,
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

gsap.registerPlugin(useGSAP);
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
type GrowthTask = {
  id: string;
  title: string;
  status: TaskStatus;
  due: string;
  owner: "实习生" | "导师" | "HR";
  note: string;
};
type ShowcaseRole = "student" | "mentor" | "hrbp";
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
  riskTags: string[];
  tasks: GrowthTask[];
  feedbacks: MentorFeedbackRecord[];
  createdAt: string;
  updatedAt: string;
};
type InternFormState = Pick<ManagedIntern, "name" | "role" | "title" | "department" | "mentor" | "week" | "progress" | "risk" | "reason" | "todo" | "processStatus"> & {
  riskTagsText: string;
};
type TaskFormState = Pick<GrowthTask, "title" | "status" | "due" | "owner" | "note">;
type FeedbackFormState = Pick<MentorFeedbackRecord, "mentor" | "content" | "score">;
type ManagedInternPatch = Partial<Omit<ManagedIntern, "id" | "tasks" | "feedbacks" | "createdAt">>;

const collaborationStorageKey = "internflow_collaboration_records";
const managedInternStorageKey = "internflow_managed_interns";
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

const roleThemes = {
  student: {
    accent: "#4B32C3",
    accentStrong: "#241A48",
    soft: "rgba(75, 50, 195, 0.07)",
    border: "rgba(80, 70, 120, 0.12)",
    shadow: "rgba(36, 26, 72, 0.08)",
  },
  mentor: {
    accent: "#4B32C3",
    accentStrong: "#241A48",
    soft: "rgba(75, 50, 195, 0.07)",
    border: "rgba(80, 70, 120, 0.12)",
    shadow: "rgba(36, 26, 72, 0.08)",
  },
  hr: {
    accent: "#4B32C3",
    accentStrong: "#241A48",
    soft: "rgba(75, 50, 195, 0.07)",
    border: "rgba(80, 70, 120, 0.12)",
    shadow: "rgba(36, 26, 72, 0.08)",
  },
  admin: {
    accent: "#4B32C3",
    accentStrong: "#241A48",
    soft: "rgba(75, 50, 195, 0.07)",
    border: "rgba(80, 70, 120, 0.12)",
    shadow: "rgba(36, 26, 72, 0.08)",
  },
} satisfies Record<UserRole, RoleTheme>;

const loginRoleThemes = {
  student: {
    labelText: "#4B32C3",
    bgBase: "#F6F4FA",
    wash: "#F6F4FA",
    panel: "rgba(255, 255, 255, 0.66)",
    panelAlt: "rgba(255, 255, 255, 0.56)",
    preview: "rgba(75, 50, 195, 0.05)",
  },
  mentor: {
    labelText: "#4B32C3",
    bgBase: "#F6F4FA",
    wash: "#F6F4FA",
    panel: "rgba(255, 255, 255, 0.67)",
    panelAlt: "rgba(255, 255, 255, 0.56)",
    preview: "rgba(75, 50, 195, 0.05)",
  },
  hr: {
    labelText: "#4B32C3",
    bgBase: "#F6F4FA",
    wash: "#F6F4FA",
    panel: "rgba(255, 255, 255, 0.67)",
    panelAlt: "rgba(255, 255, 255, 0.56)",
    preview: "rgba(75, 50, 195, 0.05)",
  },
  admin: {
    labelText: "#1D0C3B",
    bgBase: "#F4F1F8",
    wash: "radial-gradient(circle at 18% 10%, rgba(29, 12, 59, 0.12), transparent 34%), radial-gradient(circle at 82% 24%, rgba(255, 255, 255, 0.82), transparent 36%)",
    panel: "linear-gradient(140deg, rgba(255,255,255,0.84), rgba(244,241,248,0.72))",
    panelAlt: "rgba(244, 241, 248, 0.68)",
    preview: "rgba(29, 12, 59, 0.08)",
  },
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
  { role: "HRBP 成长运营台", canSee: "批次总览、关注原因、协同记录", hidden: "非必要私密沟通原文" },
  { role: "招聘效能复盘模块", canSee: "适岗趋势、高潜/观察摘要、画像反哺建议", hidden: "完整成长记录和私聊细节" },
  { role: "系统管理后台", canSee: "账号角色、批次、岗位模板、权限和数据字典", hidden: "非管理员不可见" },
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

const collaborationFlow = ["AI 标记关注", "HRBP 同步导师", "导师补充辅导", "一周复盘", "关闭观察"];

const hiringFeedbackLoops = [
  {
    segment: "研发岗 · 算法/后端方向",
    signal: "面试技术分高的同学进入后差异明显，主要差在工程规范和任务拆解。",
    suggestion: "后续面试增加一次代码走读或故障定位题，验证工程化表达。",
    confidence: "高",
  },
  {
    segment: "产品岗 · 用户增长方向",
    signal: "需求评审准备充分、用户反馈整理完整的同学适岗进度更稳定。",
    suggestion: "校招画像中提高用户洞察、结构化表达和指标理解的权重。",
    confidence: "中",
  },
  {
    segment: "销售岗 · 企业客户方向",
    signal: "客户场景训练不足会拉低早期适岗速度，压力表达集中在第 2-3 周。",
    suggestion: "面试中加入客户异议处理演练，并提前同步入职前产品学习包。",
    confidence: "中",
  },
];

type PositionRole = keyof typeof positionGrowthStages;

function inferPositionRole(user: AuthUser): PositionRole {
  const text = `${user.title ?? ""} ${user.department ?? ""}`;
  if (text.includes("研发") || text.toLowerCase().includes("engineer") || text.toLowerCase().includes("dev")) return "研发";
  if (text.includes("销售") || text.includes("客户")) return "销售";
  if (text.includes("HR") || text.includes("招聘") || text.includes("人力")) return "HR";
  return "产品";
}

function nowLabel() {
  return new Date().toLocaleString("zh-CN", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function createId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`;
}

function shouldReduceMotion() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function useScopedEntrance(
  scopeRef: RefObject<HTMLElement | null>,
  deps: unknown[],
  options: { login?: boolean } = {},
) {
  useGSAP(
    () => {
      if (!scopeRef.current || shouldReduceMotion()) return;
      const ctx = gsap.context(() => {
        const fromIfPresent = (selector: string, vars: gsap.TweenVars) => {
          const targets = gsap.utils.toArray<HTMLElement>(selector);
          if (targets.length) gsap.from(targets, vars);
        };
        const toIfPresent = (selector: string, vars: gsap.TweenVars) => {
          const targets = gsap.utils.toArray<HTMLElement>(selector);
          if (targets.length) gsap.to(targets, vars);
        };
        const fromToIfPresent = (selector: string, fromVars: gsap.TweenVars, toVars: gsap.TweenVars) => {
          const targets = gsap.utils.toArray<HTMLElement>(selector);
          if (targets.length) gsap.fromTo(targets, fromVars, toVars);
        };
        if (options.login) {
          const coverElements = gsap.utils.toArray<HTMLElement>("[data-gsap-cover-title], [data-gsap-cover-console]");
          if (coverElements.length) {
            const coverTl = gsap.timeline({ defaults: { ease: "power3.out" } });
            coverTl
              .from("[data-gsap-cover-nav]", { autoAlpha: 0, y: -10, duration: 0.34 })
              .from("[data-gsap-cover-title]", { autoAlpha: 0, y: 26, filter: "blur(6px)", duration: 0.62, clearProps: "filter" }, "<0.08")
              .from("[data-gsap-cover-metric]", { autoAlpha: 0, y: 18, scale: 0.96, stagger: 0.07, duration: 0.42 }, "-=0.24")
              .from("[data-gsap-cover-cta]", { autoAlpha: 0, y: 16, duration: 0.38 }, "-=0.18")
              .from("[data-gsap-cover-visual]", { autoAlpha: 0, y: 26, scale: 0.975, duration: 0.58 }, "intro-=0.42")
              .from("[data-gsap-cover-console]", { autoAlpha: 0, y: 30, scale: 0.96, duration: 0.66 }, "<0.08")
              .from("[data-gsap-cover-node]", { autoAlpha: 0, y: 18, scale: 0.94, stagger: 0.1, duration: 0.44 }, "-=0.28")
              .from("[data-gsap-cover-insight]", { autoAlpha: 0, y: 18, duration: 0.42 }, "-=0.2")
              .from("[data-gsap-cover-progress]", { autoAlpha: 0, x: -14, stagger: 0.07, duration: 0.34 }, "-=0.2")
              .from("[data-gsap-cover-bar]", { scaleX: 0, transformOrigin: "left center", stagger: 0.08, duration: 0.7 }, "-=0.28");
          }
          toIfPresent("[data-gsap-cover-orbit]", { rotation: 360, duration: 42, ease: "none", repeat: -1 });
          fromToIfPresent("[data-gsap-flow-packet]", { left: "0%", autoAlpha: 0 }, { left: "100%", autoAlpha: 1, duration: 3.2, ease: "power1.inOut", repeat: -1, stagger: 0.85 });
          fromToIfPresent("[data-gsap-cover-scan]", { y: 0, autoAlpha: 0 }, { y: 330, autoAlpha: 0.7, duration: 4.8, ease: "sine.inOut", repeat: -1, repeatDelay: 0.45 });
          toIfPresent("[data-gsap-cover-node]", { y: -3, duration: 2.4, ease: "sine.inOut", yoyo: true, repeat: -1, stagger: 0.28 });
          fromIfPresent("[data-gsap-logo]", { autoAlpha: 0, scale: 0.97, duration: 0.28 });
          fromIfPresent("[data-gsap-login-brand]", { autoAlpha: 0, y: 16, duration: 0.42 });
          fromIfPresent("[data-gsap-login-card]", { autoAlpha: 0, y: 20, duration: 0.44, delay: 0.08 });
          fromIfPresent("[data-gsap-role-entry]", { autoAlpha: 0, y: 10, stagger: 0.055, duration: 0.32, delay: 0.14 });
          fromIfPresent("[data-gsap-feature]", { autoAlpha: 0, y: 10, stagger: 0.05, duration: 0.32, delay: 0.2 });
          return;
        }

        fromIfPresent("[data-gsap-title]", { autoAlpha: 0, y: 12, duration: 0.34 });
        fromIfPresent("[data-stat-card]", { autoAlpha: 0, y: 14, stagger: 0.055, duration: 0.34, delay: 0.04 });
        fromIfPresent("[data-chart-card]", { autoAlpha: 0, y: 14, stagger: 0.06, duration: 0.38, delay: 0.08 });
        fromIfPresent("[data-list-panel]", { autoAlpha: 0, y: 12, stagger: 0.045, duration: 0.34, delay: 0.12 });
        fromIfPresent("[data-progress-fill]", { scaleX: 0, transformOrigin: "left center", stagger: 0.04, duration: 0.48, delay: 0.16 });
      }, scopeRef);
      return () => ctx.revert();
    },
    { scope: scopeRef, dependencies: deps },
  );
}

function useGsapHover(scopeRef: RefObject<HTMLElement | null>) {
  useGSAP(
    () => {
      if (!scopeRef.current || shouldReduceMotion()) return;
      const ctx = gsap.context(() => {
        const cards = gsap.utils.toArray<HTMLElement>("[data-gsap-hover]");
        const cleanup = cards.map((card) => {
          const enter = () => gsap.to(card, { y: -3, duration: 0.2, overwrite: "auto" });
          const leave = () => gsap.to(card, { y: 0, duration: 0.2, overwrite: "auto" });
          card.addEventListener("mouseenter", enter);
          card.addEventListener("mouseleave", leave);
          return () => {
            card.removeEventListener("mouseenter", enter);
            card.removeEventListener("mouseleave", leave);
          };
        });
        return () => cleanup.forEach((fn) => fn());
      }, scopeRef);
      return () => ctx.revert();
    },
    { scope: scopeRef },
  );
}

function useResultReveal(scopeRef: RefObject<HTMLElement | null>, deps: unknown[], selector = "[data-gsap-result]") {
  useGSAP(
    () => {
      if (!scopeRef.current || shouldReduceMotion()) return;
      const ctx = gsap.context(() => {
        gsap.from(selector, { autoAlpha: 0, y: 12, stagger: 0.055, duration: 0.32, overwrite: "auto" });
      }, scopeRef);
      return () => ctx.revert();
    },
    { scope: scopeRef, dependencies: deps, revertOnUpdate: true },
  );
}

function useHomeHeroAnimation(scopeRef: RefObject<HTMLElement | null>) {
  useGSAP(
    () => {
      if (!scopeRef.current) return;
      const root = scopeRef.current;
      const ctx = gsap.context(() => {
        const reduceMotion = shouldReduceMotion();
        const container = root.querySelector<HTMLElement>("[data-home-stage]");
        const cards = gsap.utils.toArray<HTMLElement>("[data-home-card]");
        const paths = gsap.utils.toArray<SVGPathElement>("[data-home-path]");
        const insights = gsap.utils.toArray<HTMLElement>("[data-home-insight]");

        paths.forEach((path) => {
          const length = path.getTotalLength();
          gsap.set(path, { strokeDasharray: length, strokeDashoffset: length });
        });

        if (reduceMotion) {
          gsap.from("[data-home-reveal]", { autoAlpha: 0, y: 12, stagger: 0.04, duration: 0.28 });
          gsap.set(paths, { strokeDashoffset: 0 });
          return;
        }

        const tl = gsap.timeline({ defaults: { ease: "power3.out" } });
        tl
          .from("[data-home-nav]", { autoAlpha: 0, y: -14, duration: 0.36 })
          .addLabel("heroIn", "-=0.08")
          .from("[data-home-title]", { autoAlpha: 0, y: 28, filter: "blur(8px)", duration: 0.72, clearProps: "filter" }, "heroIn")
          .from("[data-home-copy]", { autoAlpha: 0, y: 18, stagger: 0.08, duration: 0.44 }, "heroIn+=0.1")
          .from("[data-home-cta]", { autoAlpha: 0, y: 16, stagger: 0.06, duration: 0.36 }, "heroIn+=0.42")
          .fromTo("[data-home-glow]", { autoAlpha: 0, scale: 0.78, filter: "blur(26px)" }, { autoAlpha: 1, scale: 1, filter: "blur(0px)", duration: 0.9 }, "heroIn")
          .fromTo("[data-home-stage]", { autoAlpha: 0, scale: 0.97, y: 18, filter: "blur(8px)" }, { autoAlpha: 1, scale: 1, y: 0, filter: "blur(0px)", duration: 0.58, clearProps: "filter" }, "heroIn+=0.04")
          .from("[data-home-stage-ring]", { autoAlpha: 0, scale: 0.76, stagger: 0.08, duration: 0.48 }, "heroIn+=0.12")
          .from("[data-home-column='engine']", { autoAlpha: 0, y: 22, scale: 0.92, duration: 0.54, ease: "back.out(1.12)" }, "heroIn+=0.14")
          .from("[data-home-column='insight']", { autoAlpha: 0, x: 34, scale: 0.96, duration: 0.36 }, "heroIn+=0.24")
          .from("[data-home-column='roles']", { autoAlpha: 0, x: -34, scale: 0.96, duration: 0.36 }, "heroIn+=0.24")
          .from("[data-home-screen-row]", { autoAlpha: 0, y: 12, scale: 0.97, stagger: 0.08, duration: 0.3 }, "heroIn+=0.34")
          .from(insights, { autoAlpha: 0, y: 8, stagger: 0.07, duration: 0.24 }, "heroIn+=0.4")
          .from("[data-home-card]", { autoAlpha: 0, x: -14, scale: 0.98, stagger: 0.07, duration: 0.28 }, "heroIn+=0.42")
          .to(paths, { strokeDashoffset: 0, stagger: 0.1, duration: 0.56, ease: "power2.inOut" }, "heroIn+=0.46")
          .from("[data-home-showcase-card]", { autoAlpha: 0, y: 18, stagger: 0.08, duration: 0.36 }, "-=0.2");

        gsap.to("[data-home-stage]", { y: -4, duration: 3.8, ease: "sine.inOut", repeat: -1, yoyo: true, delay: 2.1 });
        gsap.to("[data-home-card]", { y: (index) => [-5, 4, -4][index] ?? -3, duration: 3.2, ease: "sine.inOut", repeat: -1, yoyo: true, stagger: 0.26, delay: 2.2 });
        gsap.to("[data-home-glow]", { x: 8, y: -6, scale: 1.025, duration: 6.5, ease: "sine.inOut", repeat: -1, yoyo: true });
        gsap.to(paths, { strokeDashoffset: "-=18", duration: 3.4, ease: "none", repeat: -1, delay: 2.4 });
        gsap.to("[data-home-insight-panel]", { y: -4, boxShadow: "0 20px 50px rgba(20,33,52,0.10)", duration: 2.8, ease: "sine.inOut", repeat: -1, yoyo: true, delay: 2.8 });
        gsap.to("[data-home-insight-icon]", { rotation: 8, scale: 1.08, duration: 1.7, ease: "sine.inOut", repeat: -1, yoyo: true, delay: 2.4 });

        const cardTweens = cards.map((card) => {
          const depth = Number(card.dataset.depth ?? "1");
          return {
            element: card,
            x: gsap.quickTo(card, "x", { duration: 0.42, ease: "power3.out" }),
            y: gsap.quickTo(card, "y", { duration: 0.42, ease: "power3.out" }),
            depth,
          };
        });
        const stageX = container ? gsap.quickTo(container, "x", { duration: 0.52, ease: "power3.out" }) : null;
        const stageY = container ? gsap.quickTo(container, "y", { duration: 0.52, ease: "power3.out" }) : null;

        const onMove = (event: MouseEvent) => {
          const rect = root.getBoundingClientRect();
          const relX = (event.clientX - rect.left) / rect.width - 0.5;
          const relY = (event.clientY - rect.top) / rect.height - 0.5;
          stageX?.(relX * -2.5);
          stageY?.(relY * -2);
          cardTweens.forEach((item) => {
            item.x(relX * item.depth * 3.5);
            item.y(relY * item.depth * 4);
          });
        };

        const onLeave = () => {
          stageX?.(0);
          stageY?.(0);
          cardTweens.forEach((item) => {
            item.x(0);
            item.y(0);
          });
        };

        root.addEventListener("mousemove", onMove);
        root.addEventListener("mouseleave", onLeave);

        const cleanups = cards.map((card) => {
          const flow = card.dataset.homeCard;
          const relatedPath = root.querySelector<SVGPathElement>(`[data-home-path="${flow}"]`);
          const enter = () => {
            gsap.to(card, { y: "-=4", borderColor: "rgba(23,50,77,0.22)", backgroundColor: "rgba(255,255,255,0.86)", duration: 0.22, overwrite: "auto" });
            if (relatedPath) gsap.to(relatedPath, { strokeWidth: 2.2, stroke: card.dataset.accent ?? "#4B32C3", duration: 0.2, overwrite: "auto" });
          };
          const leave = () => {
            gsap.to(card, { y: 0, borderColor: "rgba(80,70,120,0.12)", backgroundColor: "rgba(255,255,255,0.72)", duration: 0.24, overwrite: "auto" });
            if (relatedPath) gsap.to(relatedPath, { strokeWidth: 1.25, stroke: "rgba(23,50,77,0.18)", duration: 0.2, overwrite: "auto" });
          };
          card.addEventListener("mouseenter", enter);
          card.addEventListener("mouseleave", leave);
          return () => {
            card.removeEventListener("mouseenter", enter);
            card.removeEventListener("mouseleave", leave);
          };
        });

        const capabilitySection = root.querySelector<HTMLElement>("[data-capability-section]");
        const stageCards = gsap.utils.toArray<HTMLElement>("[data-capability-card]");
        const workbenchPanels = gsap.utils.toArray<HTMLElement>("[data-workbench-panel]");
        let stageLoop: gsap.core.Timeline | null = null;
        let activeWorkbenchIndex = 0;

        const activateStage = (activeIndex: number, immediate = false) => {
          stageCards.forEach((card, index) => {
            const active = index === activeIndex;
            const accent = card.dataset.accent ?? "#4B32C3";
            card.setAttribute("aria-pressed", active ? "true" : "false");
            const cardVars: gsap.TweenVars = {
              autoAlpha: 1,
              y: active ? -10 : 0,
              borderColor: active ? `${accent}55` : "rgba(80,70,120,0.10)",
              backgroundColor: active ? "rgba(255,255,255,0.82)" : "rgba(255,255,255,0.58)",
              boxShadow: active ? "0 30px 86px rgba(36,26,72,0.12)" : "0 18px 52px rgba(36,26,72,0.055)",
              overwrite: "auto",
            };
            if (immediate) gsap.set(card, cardVars);
            else gsap.to(card, { ...cardVars, duration: 0.42 });
            const visualStepVars: gsap.TweenVars = {
              y: active ? (stepIndex: number) => (stepIndex === 1 ? -5 : -2) : 0,
              opacity: active ? 1 : 0.72,
              stagger: 0.045,
              overwrite: "auto",
            };
            if (immediate) gsap.set(card.querySelectorAll("[data-capability-visual-step]"), visualStepVars);
            else gsap.to(card.querySelectorAll("[data-capability-visual-step]"), { ...visualStepVars, duration: 0.32 });
            const lineVars: gsap.TweenVars = {
              scaleX: active ? 1.06 : 1,
              transformOrigin: "left center",
              ease: "sine.out",
              overwrite: "auto",
            };
            if (immediate) gsap.fromTo(card.querySelector("[data-capability-line]"), { scaleX: 0, transformOrigin: "left center" }, { ...lineVars, duration: 0.62, delay: index * 0.08 });
            else gsap.to(card.querySelector("[data-capability-line]"), { ...lineVars, duration: active ? 0.42 : 0.28 });
          });
          workbenchPanels.forEach((panel, index) => {
            const active = index === activeIndex;
            const wasActive = index === activeWorkbenchIndex;
            panel.setAttribute("aria-hidden", active ? "false" : "true");
            gsap.killTweensOf(panel);
            gsap.killTweensOf(panel.querySelectorAll("[data-workbench-item]"));
            if (immediate) {
              gsap.set(panel, {
                autoAlpha: active ? 1 : 0,
                x: 0,
                y: active ? 0 : 16,
                scale: active ? 1 : 0.985,
                pointerEvents: active ? "auto" : "none",
              });
              gsap.set(panel.querySelectorAll("[data-workbench-item]"), { autoAlpha: active ? 1 : 0, y: 0 });
              return;
            }
            if (!active) {
              if (wasActive && activeWorkbenchIndex !== activeIndex) {
                gsap.to(panel, {
                  autoAlpha: 0,
                  x: -12,
                  y: 2,
                  scale: 0.992,
                  duration: 0.14,
                  ease: "power1.out",
                  overwrite: "auto",
                  pointerEvents: "none",
                });
              } else {
                gsap.set(panel, {
                  autoAlpha: 0,
                  x: 12,
                  y: 6,
                  scale: 0.992,
                  pointerEvents: "none",
                });
              }
              return;
            }
            gsap.fromTo(panel, {
              autoAlpha: 0,
              x: 14,
              y: 6,
              scale: 0.992,
            }, {
              autoAlpha: 1,
              x: 0,
              y: 0,
              scale: 1,
              duration: 0.26,
              ease: "power2.out",
              overwrite: "auto",
              pointerEvents: "auto",
            });
            gsap.fromTo(
              panel.querySelectorAll("[data-workbench-item]"),
              { autoAlpha: 0, y: 10 },
              { autoAlpha: 1, y: 0, stagger: 0.045, duration: 0.24, overwrite: "auto" },
            );
          });
          activeWorkbenchIndex = activeIndex;
        };

        const stageCardCleanups = stageCards.map((card, index) => {
          const activateFromPointer = () => {
            stageLoop?.pause();
            activateStage(index);
          };
          const resumeLoop = () => {
            stageLoop?.resume();
          };
          const activateFromKeyboard = (event: KeyboardEvent) => {
            if (event.key !== "Enter" && event.key !== " ") return;
            event.preventDefault();
            activateFromPointer();
          };
          card.addEventListener("mouseenter", activateFromPointer);
          card.addEventListener("focus", activateFromPointer);
          card.addEventListener("click", activateFromPointer);
          card.addEventListener("keydown", activateFromKeyboard);
          card.addEventListener("mouseleave", resumeLoop);
          card.addEventListener("blur", resumeLoop);
          return () => {
            card.removeEventListener("mouseenter", activateFromPointer);
            card.removeEventListener("focus", activateFromPointer);
            card.removeEventListener("click", activateFromPointer);
            card.removeEventListener("keydown", activateFromKeyboard);
            card.removeEventListener("mouseleave", resumeLoop);
            card.removeEventListener("blur", resumeLoop);
          };
        });
        activateStage(0, true);

          const playCapability = () => {
          const workflowNodes = gsap.utils.toArray<HTMLElement>("[data-workflow-node]");
          const actionLoopItems = gsap.utils.toArray<HTMLElement>("[data-action-loop-step]");
          const actionLoopIcons = gsap.utils.toArray<HTMLElement>("[data-action-loop-icon]");
          const actionLoopScan = root.querySelector<HTMLElement>("[data-action-loop-scan]");
          const actionLoopBar = root.querySelector<HTMLElement>("[data-action-loop-bar]");
          const workflowPrimary = "#4B32C3";

          const setActiveWorkflow = (activeIndex: number, immediate = false) => {
            workflowNodes.forEach((node, index) => {
              const active = index === activeIndex;
              const complete = index < activeIndex;
              const muted = !active && !complete;
              node.dataset.active = active ? "true" : "false";
              node.dataset.complete = complete ? "true" : "false";
              const nodeVars: gsap.TweenVars = {
                y: 0,
                scale: active ? 1.012 : 1,
                autoAlpha: muted ? 0.76 : 1,
                borderColor: active ? "rgba(75,50,195,0.5)" : "rgba(80,70,120,0.12)",
                backgroundColor: active ? "rgba(255,255,255,0.86)" : "rgba(255,255,255,0.76)",
                boxShadow: active ? "0 24px 68px rgba(36,26,72,0.10)" : "0 12px 34px rgba(36,26,72,0.052)",
                overwrite: "auto",
              };
              if (immediate) gsap.set(node, nodeVars);
              else gsap.to(node, { ...nodeVars, duration: 0.42 });
              const numberVars: gsap.TweenVars = {
                scale: active ? 1.04 : 1,
                backgroundColor: active ? workflowPrimary : complete ? "rgba(45,58,140,0.10)" : "rgba(45,58,140,0.07)",
                color: active ? "#FFFFFF" : complete ? "#4B32C3" : "#6F6A7A",
                boxShadow: active ? "0 10px 24px rgba(75,50,195,0.16)" : "inset 0 0 0 1px rgba(45,58,140,0.10)",
                overwrite: "auto",
              };
              if (immediate) gsap.set(node.querySelector("[data-workflow-number]"), numberVars);
              else gsap.to(node.querySelector("[data-workflow-number]"), { ...numberVars, duration: 0.3 });
              const titleVars: gsap.TweenVars = {
                color: active ? "#241A48" : "#171321",
                overwrite: "auto",
              };
              if (immediate) gsap.set(node.querySelector("[data-workflow-title]"), titleVars);
              else gsap.to(node.querySelector("[data-workflow-title]"), { ...titleVars, duration: 0.24 });
              const descriptionVars: gsap.TweenVars = {
/* RECOVERY_GAP_LINE_761 */
/* RECOVERY_GAP_LINE_762 */
/* RECOVERY_GAP_LINE_763 */
/* RECOVERY_GAP_LINE_764 */
/* RECOVERY_GAP_LINE_765 */
/* RECOVERY_GAP_LINE_766 */
/* RECOVERY_GAP_LINE_767 */
/* RECOVERY_GAP_LINE_768 */
/* RECOVERY_GAP_LINE_769 */
/* RECOVERY_GAP_LINE_770 */
/* RECOVERY_GAP_LINE_771 */
/* RECOVERY_GAP_LINE_772 */
/* RECOVERY_GAP_LINE_773 */
/* RECOVERY_GAP_LINE_774 */
/* RECOVERY_GAP_LINE_775 */
/* RECOVERY_GAP_LINE_776 */
/* RECOVERY_GAP_LINE_777 */
/* RECOVERY_GAP_LINE_778 */
/* RECOVERY_GAP_LINE_779 */
/* RECOVERY_GAP_LINE_780 */
/* RECOVERY_GAP_LINE_781 */
/* RECOVERY_GAP_LINE_782 */
/* RECOVERY_GAP_LINE_783 */
/* RECOVERY_GAP_LINE_784 */
/* RECOVERY_GAP_LINE_785 */
/* RECOVERY_GAP_LINE_786 */
/* RECOVERY_GAP_LINE_787 */
/* RECOVERY_GAP_LINE_788 */
/* RECOVERY_GAP_LINE_789 */
/* RECOVERY_GAP_LINE_790 */
/* RECOVERY_GAP_LINE_791 */
/* RECOVERY_GAP_LINE_792 */
/* RECOVERY_GAP_LINE_793 */
/* RECOVERY_GAP_LINE_794 */
/* RECOVERY_GAP_LINE_795 */
/* RECOVERY_GAP_LINE_796 */
/* RECOVERY_GAP_LINE_797 */
/* RECOVERY_GAP_LINE_798 */
/* RECOVERY_GAP_LINE_799 */
/* RECOVERY_GAP_LINE_800 */
/* RECOVERY_GAP_LINE_801 */
/* RECOVERY_GAP_LINE_802 */
/* RECOVERY_GAP_LINE_803 */
/* RECOVERY_GAP_LINE_804 */
/* RECOVERY_GAP_LINE_805 */
/* RECOVERY_GAP_LINE_806 */
/* RECOVERY_GAP_LINE_807 */
/* RECOVERY_GAP_LINE_808 */
/* RECOVERY_GAP_LINE_809 */
/* RECOVERY_GAP_LINE_810 */
/* RECOVERY_GAP_LINE_811 */
/* RECOVERY_GAP_LINE_812 */
/* RECOVERY_GAP_LINE_813 */
/* RECOVERY_GAP_LINE_814 */
/* RECOVERY_GAP_LINE_815 */
/* RECOVERY_GAP_LINE_816 */
/* RECOVERY_GAP_LINE_817 */
/* RECOVERY_GAP_LINE_818 */
/* RECOVERY_GAP_LINE_819 */
/* RECOVERY_GAP_LINE_820 */
/* RECOVERY_GAP_LINE_821 */
/* RECOVERY_GAP_LINE_822 */
/* RECOVERY_GAP_LINE_823 */
/* RECOVERY_GAP_LINE_824 */
/* RECOVERY_GAP_LINE_825 */
/* RECOVERY_GAP_LINE_826 */
/* RECOVERY_GAP_LINE_827 */
/* RECOVERY_GAP_LINE_828 */
/* RECOVERY_GAP_LINE_829 */
/* RECOVERY_GAP_LINE_830 */
/* RECOVERY_GAP_LINE_831 */
/* RECOVERY_GAP_LINE_832 */
/* RECOVERY_GAP_LINE_833 */
/* RECOVERY_GAP_LINE_834 */
/* RECOVERY_GAP_LINE_835 */
/* RECOVERY_GAP_LINE_836 */
/* RECOVERY_GAP_LINE_837 */
/* RECOVERY_GAP_LINE_838 */
/* RECOVERY_GAP_LINE_839 */
/* RECOVERY_GAP_LINE_840 */
/* RECOVERY_GAP_LINE_841 */
/* RECOVERY_GAP_LINE_842 */
/* RECOVERY_GAP_LINE_843 */
/* RECOVERY_GAP_LINE_844 */
/* RECOVERY_GAP_LINE_845 */
/* RECOVERY_GAP_LINE_846 */
/* RECOVERY_GAP_LINE_847 */
/* RECOVERY_GAP_LINE_848 */
/* RECOVERY_GAP_LINE_849 */
/* RECOVERY_GAP_LINE_850 */
/* RECOVERY_GAP_LINE_851 */
/* RECOVERY_GAP_LINE_852 */
/* RECOVERY_GAP_LINE_853 */
/* RECOVERY_GAP_LINE_854 */
/* RECOVERY_GAP_LINE_855 */
/* RECOVERY_GAP_LINE_856 */
/* RECOVERY_GAP_LINE_857 */
/* RECOVERY_GAP_LINE_858 */
/* RECOVERY_GAP_LINE_859 */
/* RECOVERY_GAP_LINE_860 */
/* RECOVERY_GAP_LINE_861 */
/* RECOVERY_GAP_LINE_862 */
/* RECOVERY_GAP_LINE_863 */
/* RECOVERY_GAP_LINE_864 */
/* RECOVERY_GAP_LINE_865 */
/* RECOVERY_GAP_LINE_866 */
/* RECOVERY_GAP_LINE_867 */
/* RECOVERY_GAP_LINE_868 */
/* RECOVERY_GAP_LINE_869 */
/* RECOVERY_GAP_LINE_870 */
/* RECOVERY_GAP_LINE_871 */
/* RECOVERY_GAP_LINE_872 */
/* RECOVERY_GAP_LINE_873 */
/* RECOVERY_GAP_LINE_874 */
/* RECOVERY_GAP_LINE_875 */
/* RECOVERY_GAP_LINE_876 */
/* RECOVERY_GAP_LINE_877 */
/* RECOVERY_GAP_LINE_878 */
/* RECOVERY_GAP_LINE_879 */
        if (capabilitySection) observer?.observe(capabilitySection);

        return () => {
          root.removeEventListener("mousemove", onMove);
          root.removeEventListener("mouseleave", onLeave);
          cleanups.forEach((cleanup) => cleanup());
          observer?.disconnect();
          capabilityCleanups.forEach((cleanup) => cleanup());
        };
      }, scopeRef);
      return () => ctx.revert();
    },
    { scope: scopeRef },
  );
}

function normalizeDepartment(value?: string) {
  return (value ?? "")
    .split("/")
    .map((part) => part.trim())
    .filter(Boolean)
    .at(-1) ?? "";
}

function isSameDepartment(left?: string, right?: string) {
  const normalizedLeft = normalizeDepartment(left);
  const normalizedRight = normalizeDepartment(right);
  return !!normalizedLeft && !!normalizedRight && normalizedLeft === normalizedRight;
}

function createDefaultTasks(intern: Intern): GrowthTask[] {
  const roleStages = positionGrowthStages[(intern.role as PositionRole) in positionGrowthStages ? intern.role as PositionRole : "产品"];
  return roleStages[0].tasks.slice(0, 4).map((task, index) => ({
    id: createId(`task-${intern.name}-${index}`),
    title: task.label,
    status: "未完成",
    due: index < 2 ? "本周内" : "下周前",
    owner: "实习生",
    note: `${intern.role}岗默认成长任务`,
  }));
}

function seedManagedInterns(): ManagedIntern[] {
  return interns.map((intern, index) => ({
    id: `intern-${index + 1}`,
    name: intern.name,
    role: intern.role,
    title: `${intern.role}实习生`,
    department: intern.role === "研发" ? "技术部" : intern.role === "销售" ? "商业化部" : intern.role === "HR" ? "HRBP" : "产品部",
    mentor: index % 3 === 0 ? "王老师" : index % 3 === 1 ? "李老师" : "陈老师",
    week: intern.week,
    progress: intern.progress,
    risk: intern.risk,
    reason: intern.reason,
    todo: intern.todo,
    processStatus: intern.processStatus,
    riskTags: intern.riskTags,
    tasks: createDefaultTasks(intern),
    feedbacks: [
      {
        id: `feedback-${index + 1}`,
        mentor: index % 3 === 0 ? "王老师" : index % 3 === 1 ? "李老师" : "陈老师",
        content: intern.mentorFeedback,
        score: intern.risk === "低风险" ? 4 : intern.risk === "高风险" ? 2 : 3,
        createdAt: "初始导入",
      },
    ],
    createdAt: "初始导入",
    updatedAt: "初始导入",
  }));
}

function managedToIntern(intern: ManagedIntern): Intern {
  const analysis = generateRiskAnalysis(intern);
  const danger = intern.risk === "高风险";
  const warning = intern.risk === "中风险";
  const status = danger ? "danger" : warning ? "warning" : "normal";
  const feedback = intern.feedbacks[0]?.content ?? "暂无导师反馈";
  return {
    name: intern.name,
    role: intern.role,
    week: intern.week,
    progress: intern.progress,
    mentorFeedback: feedback,
    risk: intern.risk,
    reason: intern.reason || "暂无风险说明",
    todo: intern.todo || "保持观察",
    evidence: analysis.evidence,
    evidenceMetrics: [
      { label: "任务完成度", value: `${intern.progress}%`, status },
      { label: "导师反馈", value: feedback, status },
      { label: "打卡信号", value: intern.reason || "暂无", status },
      { label: "沟通频率", value: danger ? "低于同岗均值" : warning ? "需要加强" : "稳定", status },
    ],
    possibleCause: analysis.possibleCause,
    hrAction: analysis.suggestedActions.join("；"),
    syncMentor: danger ? "必须同步导师" : warning ? "需要同步导师" : "无需强制同步",
    reviewReminder: danger ? "三天后复盘支持动作是否生效" : warning ? "下周检查改善动作完成情况" : "第 30 天阶段评价时复盘",
    confidence: danger ? 92 : warning ? 80 : 86,
    riskTags: intern.riskTags,
    processStatus: intern.processStatus,
    activityLog: [
      `${intern.updatedAt} 更新为${attentionLabel[intern.risk]}`,
      `${intern.todo || "保持观察"}，当前处置状态：${intern.processStatus}`,
    ],
  };
}

function getRoleProgressData(list: ManagedIntern[]) {
  return ["产品", "研发", "销售", "HR"].map((role) => {
    const roleList = list.filter((intern) => intern.role === role);
    const progress = roleList.length ? Math.round(roleList.reduce((sum, intern) => sum + intern.progress, 0) / roleList.length) : 0;
    return { role: `${role}岗`, progress };
  });
}

function getRiskDistributionData(list: ManagedIntern[]) {
  return [
    { name: "低风险", value: list.filter((intern) => intern.risk === "低风险").length, color: "#32B889" },
    { name: "中风险", value: list.filter((intern) => intern.risk === "中风险").length, color: "#C9922E" },
    { name: "高风险", value: list.filter((intern) => intern.risk === "高风险").length, color: "#C25055" },
  ];
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
    riskTagsText: intern.riskTags.join("、"),
  };
}

type AIGenerationType = "feedback" | "questions" | "report" | "hrAction" | "dailyPlan";

async function requestAiGeneration<T>(type: AIGenerationType, payload: unknown): Promise<AIGenerationResult<T>> {
/* RECOVERY_GAP_LINE_1041 */
/* RECOVERY_GAP_LINE_1042 */
/* RECOVERY_GAP_LINE_1043 */
/* RECOVERY_GAP_LINE_1044 */
/* RECOVERY_GAP_LINE_1045 */
/* RECOVERY_GAP_LINE_1046 */
/* RECOVERY_GAP_LINE_1047 */
/* RECOVERY_GAP_LINE_1048 */
/* RECOVERY_GAP_LINE_1049 */
/* RECOVERY_GAP_LINE_1050 */
/* RECOVERY_GAP_LINE_1051 */
/* RECOVERY_GAP_LINE_1052 */
/* RECOVERY_GAP_LINE_1053 */
/* RECOVERY_GAP_LINE_1054 */
/* RECOVERY_GAP_LINE_1055 */
/* RECOVERY_GAP_LINE_1056 */
/* RECOVERY_GAP_LINE_1057 */
/* RECOVERY_GAP_LINE_1058 */
/* RECOVERY_GAP_LINE_1059 */
/* RECOVERY_GAP_LINE_1060 */
/* RECOVERY_GAP_LINE_1061 */
/* RECOVERY_GAP_LINE_1062 */
/* RECOVERY_GAP_LINE_1063 */
/* RECOVERY_GAP_LINE_1064 */
/* RECOVERY_GAP_LINE_1065 */
/* RECOVERY_GAP_LINE_1066 */
/* RECOVERY_GAP_LINE_1067 */
/* RECOVERY_GAP_LINE_1068 */
/* RECOVERY_GAP_LINE_1069 */
/* RECOVERY_GAP_LINE_1070 */
/* RECOVERY_GAP_LINE_1071 */
/* RECOVERY_GAP_LINE_1072 */
/* RECOVERY_GAP_LINE_1073 */
/* RECOVERY_GAP_LINE_1074 */
/* RECOVERY_GAP_LINE_1075 */
/* RECOVERY_GAP_LINE_1076 */
/* RECOVERY_GAP_LINE_1077 */
/* RECOVERY_GAP_LINE_1078 */
/* RECOVERY_GAP_LINE_1079 */
/* RECOVERY_GAP_LINE_1080 */
/* RECOVERY_GAP_LINE_1081 */
/* RECOVERY_GAP_LINE_1082 */
/* RECOVERY_GAP_LINE_1083 */
/* RECOVERY_GAP_LINE_1084 */
/* RECOVERY_GAP_LINE_1085 */
/* RECOVERY_GAP_LINE_1086 */
/* RECOVERY_GAP_LINE_1087 */
/* RECOVERY_GAP_LINE_1088 */
/* RECOVERY_GAP_LINE_1089 */
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
        "fx-logo relative shrink-0 overflow-hidden rounded-xl border border-[#504678]/12 bg-white/72 shadow-sm",
        compact ? "h-9 w-9" : "h-12 w-12",
      )}
    >
      <svg viewBox="0 0 64 64" aria-hidden="true" className="h-full w-full">
        <circle cx="32" cy="32" r="21" fill="none" stroke="#4B32C3" strokeOpacity="0.16" strokeWidth="2" />
        <path d="M18 36c8-12 20-15 30-7" fill="none" stroke="#241A48" strokeLinecap="round" strokeWidth="3.4" />
        <path d="M23 40c7-6 15-7 24-2" fill="none" stroke="#4B32C3" strokeLinecap="round" strokeWidth="3.4" />
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
        variant === "primary" && "border border-[#4B32C3] bg-[#4B32C3] text-white shadow-none hover:border-[#241A48] hover:bg-[#241A48]",
        variant === "soft" && "border border-[#504678]/12 bg-[#4B32C3]/7 text-[#4B32C3] hover:border-[#4B32C3]/20 hover:bg-[#4B32C3]/10",
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
    未开始: "border-slate-200 bg-slate-100 text-slate-500",
    未完成: "border-slate-200 bg-slate-100 text-slate-600",
  };

  return <span className={cn("inline-flex items-center rounded-md border px-2.5 py-1 text-xs font-bold", styles[status] ?? styles.未开始)}>{status}</span>;
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
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[8px] bg-[#4B32C3]/7 text-[#4B32C3] ring-1 ring-[#504678]/10">
        <Icon className="h-[18px] w-[18px]" />
      </div>
      <div>
        <h2 className="text-sm font-semibold tracking-[0] text-[#171321]">{title}</h2>
        {subtitle && <p className="mt-1 text-sm text-[#6F6A7A]">{subtitle}</p>}
      </div>
    </div>
  );
}

function PermissionBoundary() {
  return (
    <Card>
      <SectionTitle icon={LockKeyhole} title="权限边界" subtitle="AI 负责整理信号，人保留关键判断，避免工具变成监控系统" />
      <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {permissionBoundaries.map((item) => (
          <div key={item.role} className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
            <p className="text-sm font-black text-slate-950">{item.role}</p>
            <p className="mt-3 text-xs font-bold text-[var(--role-accent)]">可见</p>
            <p className="mt-1 text-sm leading-6 text-slate-700">{item.canSee}</p>
            <p className="mt-3 text-xs font-bold text-rose-600">默认隐藏</p>
            <p className="mt-1 text-sm leading-6 text-slate-600">{item.hidden}</p>
          </div>
        ))}
      </div>
    </Card>
  );
}

function MvpScopePanel() {
  return (
    <Card>
      <SectionTitle icon={ListChecks} title="MVP 范围" subtitle="先解决当前最痛的标准化带教、成长迷茫和跨角色同步问题" />
      <div className="mt-5 grid gap-3 lg:grid-cols-5">
        {mvpScopes.map((scope) => (
          <div key={scope.title} className="rounded-2xl border border-slate-100 bg-white p-4">
            <span className={cn(
              "rounded-full px-2.5 py-1 text-xs font-black",
              scope.status === "MVP 必做" ? "bg-[var(--role-soft)] text-[var(--role-accent)]" : "bg-slate-100 text-slate-500",
            )}>
              {scope.status}
            </span>
            <p className="mt-4 font-black text-slate-950">{scope.title}</p>
            <p className="mt-2 text-sm leading-6 text-slate-600">{scope.detail}</p>
          </div>
        ))}
      </div>
    </Card>
  );
}

function AiReliabilityPanel({ compact = false }: { compact?: boolean }) {
  return (
    <Card className={cn("border-[var(--role-border)] bg-white", compact && "p-4")}>
      <SectionTitle icon={ShieldCheck} title="AI 可靠性护栏" subtitle="规则、证据和人工确认分层，避免把生成内容当成最终判断" />
      <div className={cn("mt-5 grid gap-3", compact ? "md:grid-cols-1" : "md:grid-cols-3")}>
        {aiReliabilityChecks.map((item, index) => (
          <div key={item.label} className="rounded-2xl border border-[var(--role-border)] bg-[var(--role-soft)] p-4">
            <span className="rounded-full bg-white px-2.5 py-1 text-xs font-black text-[var(--role-accent)]">0{index + 1}</span>
            <p className="mt-4 font-black text-slate-950">{item.label}</p>
            <p className="mt-2 text-sm leading-6 text-slate-600">{item.detail}</p>
          </div>
        ))}
      </div>
    </Card>
  );
}

function MeasuredChart({
  height = 288,
  minWidth = 280,
/* RECOVERY_GAP_LINE_1271 */
/* RECOVERY_GAP_LINE_1272 */
/* RECOVERY_GAP_LINE_1273 */
/* RECOVERY_GAP_LINE_1274 */
/* RECOVERY_GAP_LINE_1275 */
/* RECOVERY_GAP_LINE_1276 */
/* RECOVERY_GAP_LINE_1277 */
/* RECOVERY_GAP_LINE_1278 */
/* RECOVERY_GAP_LINE_1279 */
/* RECOVERY_GAP_LINE_1280 */
/* RECOVERY_GAP_LINE_1281 */
/* RECOVERY_GAP_LINE_1282 */
/* RECOVERY_GAP_LINE_1283 */
/* RECOVERY_GAP_LINE_1284 */
/* RECOVERY_GAP_LINE_1285 */
/* RECOVERY_GAP_LINE_1286 */
/* RECOVERY_GAP_LINE_1287 */
/* RECOVERY_GAP_LINE_1288 */
/* RECOVERY_GAP_LINE_1289 */
/* RECOVERY_GAP_LINE_1290 */
/* RECOVERY_GAP_LINE_1291 */
/* RECOVERY_GAP_LINE_1292 */
/* RECOVERY_GAP_LINE_1293 */
/* RECOVERY_GAP_LINE_1294 */
/* RECOVERY_GAP_LINE_1295 */
/* RECOVERY_GAP_LINE_1296 */
/* RECOVERY_GAP_LINE_1297 */
/* RECOVERY_GAP_LINE_1298 */
/* RECOVERY_GAP_LINE_1299 */
/* RECOVERY_GAP_LINE_1300 */
/* RECOVERY_GAP_LINE_1301 */
/* RECOVERY_GAP_LINE_1302 */
/* RECOVERY_GAP_LINE_1303 */
/* RECOVERY_GAP_LINE_1304 */
/* RECOVERY_GAP_LINE_1305 */
/* RECOVERY_GAP_LINE_1306 */
/* RECOVERY_GAP_LINE_1307 */
/* RECOVERY_GAP_LINE_1308 */
/* RECOVERY_GAP_LINE_1309 */
/* RECOVERY_GAP_LINE_1310 */
/* RECOVERY_GAP_LINE_1311 */
/* RECOVERY_GAP_LINE_1312 */
/* RECOVERY_GAP_LINE_1313 */
/* RECOVERY_GAP_LINE_1314 */
/* RECOVERY_GAP_LINE_1315 */
/* RECOVERY_GAP_LINE_1316 */
/* RECOVERY_GAP_LINE_1317 */
/* RECOVERY_GAP_LINE_1318 */
/* RECOVERY_GAP_LINE_1319 */
/* RECOVERY_GAP_LINE_1320 */
/* RECOVERY_GAP_LINE_1321 */
/* RECOVERY_GAP_LINE_1322 */
/* RECOVERY_GAP_LINE_1323 */
/* RECOVERY_GAP_LINE_1324 */
/* RECOVERY_GAP_LINE_1325 */
/* RECOVERY_GAP_LINE_1326 */
/* RECOVERY_GAP_LINE_1327 */
/* RECOVERY_GAP_LINE_1328 */
/* RECOVERY_GAP_LINE_1329 */
/* RECOVERY_GAP_LINE_1330 */
/* RECOVERY_GAP_LINE_1331 */
/* RECOVERY_GAP_LINE_1332 */
/* RECOVERY_GAP_LINE_1333 */
/* RECOVERY_GAP_LINE_1334 */
/* RECOVERY_GAP_LINE_1335 */
/* RECOVERY_GAP_LINE_1336 */
/* RECOVERY_GAP_LINE_1337 */
/* RECOVERY_GAP_LINE_1338 */
/* RECOVERY_GAP_LINE_1339 */
/* RECOVERY_GAP_LINE_1340 */
/* RECOVERY_GAP_LINE_1341 */
/* RECOVERY_GAP_LINE_1342 */
/* RECOVERY_GAP_LINE_1343 */
/* RECOVERY_GAP_LINE_1344 */
/* RECOVERY_GAP_LINE_1345 */
/* RECOVERY_GAP_LINE_1346 */
/* RECOVERY_GAP_LINE_1347 */
/* RECOVERY_GAP_LINE_1348 */
/* RECOVERY_GAP_LINE_1349 */
/* RECOVERY_GAP_LINE_1350 */
/* RECOVERY_GAP_LINE_1351 */
/* RECOVERY_GAP_LINE_1352 */
/* RECOVERY_GAP_LINE_1353 */
/* RECOVERY_GAP_LINE_1354 */
/* RECOVERY_GAP_LINE_1355 */
/* RECOVERY_GAP_LINE_1356 */
/* RECOVERY_GAP_LINE_1357 */
/* RECOVERY_GAP_LINE_1358 */
/* RECOVERY_GAP_LINE_1359 */
/* RECOVERY_GAP_LINE_1360 */
/* RECOVERY_GAP_LINE_1361 */
/* RECOVERY_GAP_LINE_1362 */
/* RECOVERY_GAP_LINE_1363 */
/* RECOVERY_GAP_LINE_1364 */
/* RECOVERY_GAP_LINE_1365 */
/* RECOVERY_GAP_LINE_1366 */
/* RECOVERY_GAP_LINE_1367 */
/* RECOVERY_GAP_LINE_1368 */
/* RECOVERY_GAP_LINE_1369 */
/* RECOVERY_GAP_LINE_1370 */
/* RECOVERY_GAP_LINE_1371 */
/* RECOVERY_GAP_LINE_1372 */
/* RECOVERY_GAP_LINE_1373 */
/* RECOVERY_GAP_LINE_1374 */
/* RECOVERY_GAP_LINE_1375 */
/* RECOVERY_GAP_LINE_1376 */
/* RECOVERY_GAP_LINE_1377 */
/* RECOVERY_GAP_LINE_1378 */
/* RECOVERY_GAP_LINE_1379 */
/* RECOVERY_GAP_LINE_1380 */
/* RECOVERY_GAP_LINE_1381 */
/* RECOVERY_GAP_LINE_1382 */
/* RECOVERY_GAP_LINE_1383 */
/* RECOVERY_GAP_LINE_1384 */
/* RECOVERY_GAP_LINE_1385 */
/* RECOVERY_GAP_LINE_1386 */
/* RECOVERY_GAP_LINE_1387 */
/* RECOVERY_GAP_LINE_1388 */
/* RECOVERY_GAP_LINE_1389 */
/* RECOVERY_GAP_LINE_1390 */
/* RECOVERY_GAP_LINE_1391 */
/* RECOVERY_GAP_LINE_1392 */
/* RECOVERY_GAP_LINE_1393 */
/* RECOVERY_GAP_LINE_1394 */
/* RECOVERY_GAP_LINE_1395 */
/* RECOVERY_GAP_LINE_1396 */
/* RECOVERY_GAP_LINE_1397 */
/* RECOVERY_GAP_LINE_1398 */
/* RECOVERY_GAP_LINE_1399 */
/* RECOVERY_GAP_LINE_1400 */
/* RECOVERY_GAP_LINE_1401 */
/* RECOVERY_GAP_LINE_1402 */
/* RECOVERY_GAP_LINE_1403 */
/* RECOVERY_GAP_LINE_1404 */
/* RECOVERY_GAP_LINE_1405 */
/* RECOVERY_GAP_LINE_1406 */
/* RECOVERY_GAP_LINE_1407 */
/* RECOVERY_GAP_LINE_1408 */
/* RECOVERY_GAP_LINE_1409 */
/* RECOVERY_GAP_LINE_1410 */
/* RECOVERY_GAP_LINE_1411 */
/* RECOVERY_GAP_LINE_1412 */
/* RECOVERY_GAP_LINE_1413 */
/* RECOVERY_GAP_LINE_1414 */
/* RECOVERY_GAP_LINE_1415 */
/* RECOVERY_GAP_LINE_1416 */
/* RECOVERY_GAP_LINE_1417 */
/* RECOVERY_GAP_LINE_1418 */
/* RECOVERY_GAP_LINE_1419 */
/* RECOVERY_GAP_LINE_1420 */
/* RECOVERY_GAP_LINE_1421 */
/* RECOVERY_GAP_LINE_1422 */
/* RECOVERY_GAP_LINE_1423 */
/* RECOVERY_GAP_LINE_1424 */
/* RECOVERY_GAP_LINE_1425 */
/* RECOVERY_GAP_LINE_1426 */
/* RECOVERY_GAP_LINE_1427 */
/* RECOVERY_GAP_LINE_1428 */
/* RECOVERY_GAP_LINE_1429 */
/* RECOVERY_GAP_LINE_1430 */
/* RECOVERY_GAP_LINE_1431 */
/* RECOVERY_GAP_LINE_1432 */
/* RECOVERY_GAP_LINE_1433 */
/* RECOVERY_GAP_LINE_1434 */
/* RECOVERY_GAP_LINE_1435 */
/* RECOVERY_GAP_LINE_1436 */
/* RECOVERY_GAP_LINE_1437 */
/* RECOVERY_GAP_LINE_1438 */
/* RECOVERY_GAP_LINE_1439 */
/* RECOVERY_GAP_LINE_1440 */
/* RECOVERY_GAP_LINE_1441 */
/* RECOVERY_GAP_LINE_1442 */
/* RECOVERY_GAP_LINE_1443 */
/* RECOVERY_GAP_LINE_1444 */
/* RECOVERY_GAP_LINE_1445 */
/* RECOVERY_GAP_LINE_1446 */
/* RECOVERY_GAP_LINE_1447 */
/* RECOVERY_GAP_LINE_1448 */
/* RECOVERY_GAP_LINE_1449 */
/* RECOVERY_GAP_LINE_1450 */
/* RECOVERY_GAP_LINE_1451 */
/* RECOVERY_GAP_LINE_1452 */
/* RECOVERY_GAP_LINE_1453 */
/* RECOVERY_GAP_LINE_1454 */
/* RECOVERY_GAP_LINE_1455 */
/* RECOVERY_GAP_LINE_1456 */
/* RECOVERY_GAP_LINE_1457 */
/* RECOVERY_GAP_LINE_1458 */
/* RECOVERY_GAP_LINE_1459 */
/* RECOVERY_GAP_LINE_1460 */
/* RECOVERY_GAP_LINE_1461 */
/* RECOVERY_GAP_LINE_1462 */
/* RECOVERY_GAP_LINE_1463 */
/* RECOVERY_GAP_LINE_1464 */
/* RECOVERY_GAP_LINE_1465 */
/* RECOVERY_GAP_LINE_1466 */
/* RECOVERY_GAP_LINE_1467 */
/* RECOVERY_GAP_LINE_1468 */
/* RECOVERY_GAP_LINE_1469 */
/* RECOVERY_GAP_LINE_1470 */
/* RECOVERY_GAP_LINE_1471 */
/* RECOVERY_GAP_LINE_1472 */
/* RECOVERY_GAP_LINE_1473 */
/* RECOVERY_GAP_LINE_1474 */
/* RECOVERY_GAP_LINE_1475 */
/* RECOVERY_GAP_LINE_1476 */
/* RECOVERY_GAP_LINE_1477 */
/* RECOVERY_GAP_LINE_1478 */
/* RECOVERY_GAP_LINE_1479 */
/* RECOVERY_GAP_LINE_1480 */
/* RECOVERY_GAP_LINE_1481 */
/* RECOVERY_GAP_LINE_1482 */
/* RECOVERY_GAP_LINE_1483 */
/* RECOVERY_GAP_LINE_1484 */
/* RECOVERY_GAP_LINE_1485 */
/* RECOVERY_GAP_LINE_1486 */
/* RECOVERY_GAP_LINE_1487 */
/* RECOVERY_GAP_LINE_1488 */
/* RECOVERY_GAP_LINE_1489 */
/* RECOVERY_GAP_LINE_1490 */
/* RECOVERY_GAP_LINE_1491 */
/* RECOVERY_GAP_LINE_1492 */
/* RECOVERY_GAP_LINE_1493 */
/* RECOVERY_GAP_LINE_1494 */
/* RECOVERY_GAP_LINE_1495 */
/* RECOVERY_GAP_LINE_1496 */
/* RECOVERY_GAP_LINE_1497 */
/* RECOVERY_GAP_LINE_1498 */
/* RECOVERY_GAP_LINE_1499 */
/* RECOVERY_GAP_LINE_1500 */
/* RECOVERY_GAP_LINE_1501 */
/* RECOVERY_GAP_LINE_1502 */
/* RECOVERY_GAP_LINE_1503 */
/* RECOVERY_GAP_LINE_1504 */
/* RECOVERY_GAP_LINE_1505 */
/* RECOVERY_GAP_LINE_1506 */
/* RECOVERY_GAP_LINE_1507 */
/* RECOVERY_GAP_LINE_1508 */
/* RECOVERY_GAP_LINE_1509 */
/* RECOVERY_GAP_LINE_1510 */
/* RECOVERY_GAP_LINE_1511 */
/* RECOVERY_GAP_LINE_1512 */
/* RECOVERY_GAP_LINE_1513 */
/* RECOVERY_GAP_LINE_1514 */
/* RECOVERY_GAP_LINE_1515 */
/* RECOVERY_GAP_LINE_1516 */
/* RECOVERY_GAP_LINE_1517 */
/* RECOVERY_GAP_LINE_1518 */
/* RECOVERY_GAP_LINE_1519 */
/* RECOVERY_GAP_LINE_1520 */
/* RECOVERY_GAP_LINE_1521 */
/* RECOVERY_GAP_LINE_1522 */
/* RECOVERY_GAP_LINE_1523 */
/* RECOVERY_GAP_LINE_1524 */
/* RECOVERY_GAP_LINE_1525 */
/* RECOVERY_GAP_LINE_1526 */
/* RECOVERY_GAP_LINE_1527 */
/* RECOVERY_GAP_LINE_1528 */
/* RECOVERY_GAP_LINE_1529 */
/* RECOVERY_GAP_LINE_1530 */
/* RECOVERY_GAP_LINE_1531 */
/* RECOVERY_GAP_LINE_1532 */
/* RECOVERY_GAP_LINE_1533 */
/* RECOVERY_GAP_LINE_1534 */
/* RECOVERY_GAP_LINE_1535 */
/* RECOVERY_GAP_LINE_1536 */
/* RECOVERY_GAP_LINE_1537 */
/* RECOVERY_GAP_LINE_1538 */
/* RECOVERY_GAP_LINE_1539 */
/* RECOVERY_GAP_LINE_1540 */
/* RECOVERY_GAP_LINE_1541 */
/* RECOVERY_GAP_LINE_1542 */
/* RECOVERY_GAP_LINE_1543 */
/* RECOVERY_GAP_LINE_1544 */
/* RECOVERY_GAP_LINE_1545 */
/* RECOVERY_GAP_LINE_1546 */
/* RECOVERY_GAP_LINE_1547 */
/* RECOVERY_GAP_LINE_1548 */
/* RECOVERY_GAP_LINE_1549 */
/* RECOVERY_GAP_LINE_1550 */
/* RECOVERY_GAP_LINE_1551 */
/* RECOVERY_GAP_LINE_1552 */
/* RECOVERY_GAP_LINE_1553 */
/* RECOVERY_GAP_LINE_1554 */
/* RECOVERY_GAP_LINE_1555 */
/* RECOVERY_GAP_LINE_1556 */
/* RECOVERY_GAP_LINE_1557 */
/* RECOVERY_GAP_LINE_1558 */
/* RECOVERY_GAP_LINE_1559 */
/* RECOVERY_GAP_LINE_1560 */
/* RECOVERY_GAP_LINE_1561 */
/* RECOVERY_GAP_LINE_1562 */
/* RECOVERY_GAP_LINE_1563 */
/* RECOVERY_GAP_LINE_1564 */
/* RECOVERY_GAP_LINE_1565 */
/* RECOVERY_GAP_LINE_1566 */
/* RECOVERY_GAP_LINE_1567 */
/* RECOVERY_GAP_LINE_1568 */
/* RECOVERY_GAP_LINE_1569 */
/* RECOVERY_GAP_LINE_1570 */
/* RECOVERY_GAP_LINE_1571 */
/* RECOVERY_GAP_LINE_1572 */
/* RECOVERY_GAP_LINE_1573 */
/* RECOVERY_GAP_LINE_1574 */
/* RECOVERY_GAP_LINE_1575 */
/* RECOVERY_GAP_LINE_1576 */
/* RECOVERY_GAP_LINE_1577 */
/* RECOVERY_GAP_LINE_1578 */
/* RECOVERY_GAP_LINE_1579 */
/* RECOVERY_GAP_LINE_1580 */
/* RECOVERY_GAP_LINE_1581 */
/* RECOVERY_GAP_LINE_1582 */
/* RECOVERY_GAP_LINE_1583 */
/* RECOVERY_GAP_LINE_1584 */
/* RECOVERY_GAP_LINE_1585 */
/* RECOVERY_GAP_LINE_1586 */
/* RECOVERY_GAP_LINE_1587 */
/* RECOVERY_GAP_LINE_1588 */
/* RECOVERY_GAP_LINE_1589 */
/* RECOVERY_GAP_LINE_1590 */
/* RECOVERY_GAP_LINE_1591 */
/* RECOVERY_GAP_LINE_1592 */
/* RECOVERY_GAP_LINE_1593 */
/* RECOVERY_GAP_LINE_1594 */
/* RECOVERY_GAP_LINE_1595 */
/* RECOVERY_GAP_LINE_1596 */
/* RECOVERY_GAP_LINE_1597 */
/* RECOVERY_GAP_LINE_1598 */
/* RECOVERY_GAP_LINE_1599 */
/* RECOVERY_GAP_LINE_1600 */
/* RECOVERY_GAP_LINE_1601 */
/* RECOVERY_GAP_LINE_1602 */
/* RECOVERY_GAP_LINE_1603 */
/* RECOVERY_GAP_LINE_1604 */
/* RECOVERY_GAP_LINE_1605 */
/* RECOVERY_GAP_LINE_1606 */
/* RECOVERY_GAP_LINE_1607 */
/* RECOVERY_GAP_LINE_1608 */
/* RECOVERY_GAP_LINE_1609 */
/* RECOVERY_GAP_LINE_1610 */
/* RECOVERY_GAP_LINE_1611 */
/* RECOVERY_GAP_LINE_1612 */
/* RECOVERY_GAP_LINE_1613 */
/* RECOVERY_GAP_LINE_1614 */
/* RECOVERY_GAP_LINE_1615 */
/* RECOVERY_GAP_LINE_1616 */
/* RECOVERY_GAP_LINE_1617 */
/* RECOVERY_GAP_LINE_1618 */
/* RECOVERY_GAP_LINE_1619 */
/* RECOVERY_GAP_LINE_1620 */
/* RECOVERY_GAP_LINE_1621 */
/* RECOVERY_GAP_LINE_1622 */
/* RECOVERY_GAP_LINE_1623 */
/* RECOVERY_GAP_LINE_1624 */
/* RECOVERY_GAP_LINE_1625 */
/* RECOVERY_GAP_LINE_1626 */
/* RECOVERY_GAP_LINE_1627 */
/* RECOVERY_GAP_LINE_1628 */
/* RECOVERY_GAP_LINE_1629 */
/* RECOVERY_GAP_LINE_1630 */
/* RECOVERY_GAP_LINE_1631 */
/* RECOVERY_GAP_LINE_1632 */
/* RECOVERY_GAP_LINE_1633 */
/* RECOVERY_GAP_LINE_1634 */
/* RECOVERY_GAP_LINE_1635 */
/* RECOVERY_GAP_LINE_1636 */
/* RECOVERY_GAP_LINE_1637 */
/* RECOVERY_GAP_LINE_1638 */
/* RECOVERY_GAP_LINE_1639 */
/* RECOVERY_GAP_LINE_1640 */
/* RECOVERY_GAP_LINE_1641 */
/* RECOVERY_GAP_LINE_1642 */
/* RECOVERY_GAP_LINE_1643 */
/* RECOVERY_GAP_LINE_1644 */
/* RECOVERY_GAP_LINE_1645 */
/* RECOVERY_GAP_LINE_1646 */
/* RECOVERY_GAP_LINE_1647 */
/* RECOVERY_GAP_LINE_1648 */
/* RECOVERY_GAP_LINE_1649 */
/* RECOVERY_GAP_LINE_1650 */
/* RECOVERY_GAP_LINE_1651 */
/* RECOVERY_GAP_LINE_1652 */
/* RECOVERY_GAP_LINE_1653 */
/* RECOVERY_GAP_LINE_1654 */
/* RECOVERY_GAP_LINE_1655 */
/* RECOVERY_GAP_LINE_1656 */
/* RECOVERY_GAP_LINE_1657 */
/* RECOVERY_GAP_LINE_1658 */
/* RECOVERY_GAP_LINE_1659 */
/* RECOVERY_GAP_LINE_1660 */
/* RECOVERY_GAP_LINE_1661 */
/* RECOVERY_GAP_LINE_1662 */
/* RECOVERY_GAP_LINE_1663 */
/* RECOVERY_GAP_LINE_1664 */
/* RECOVERY_GAP_LINE_1665 */
/* RECOVERY_GAP_LINE_1666 */
/* RECOVERY_GAP_LINE_1667 */
/* RECOVERY_GAP_LINE_1668 */
/* RECOVERY_GAP_LINE_1669 */
/* RECOVERY_GAP_LINE_1670 */
/* RECOVERY_GAP_LINE_1671 */
/* RECOVERY_GAP_LINE_1672 */
/* RECOVERY_GAP_LINE_1673 */
/* RECOVERY_GAP_LINE_1674 */
/* RECOVERY_GAP_LINE_1675 */
/* RECOVERY_GAP_LINE_1676 */
/* RECOVERY_GAP_LINE_1677 */
/* RECOVERY_GAP_LINE_1678 */
/* RECOVERY_GAP_LINE_1679 */
/* RECOVERY_GAP_LINE_1680 */
/* RECOVERY_GAP_LINE_1681 */
/* RECOVERY_GAP_LINE_1682 */
/* RECOVERY_GAP_LINE_1683 */
/* RECOVERY_GAP_LINE_1684 */
/* RECOVERY_GAP_LINE_1685 */
/* RECOVERY_GAP_LINE_1686 */
/* RECOVERY_GAP_LINE_1687 */
/* RECOVERY_GAP_LINE_1688 */
/* RECOVERY_GAP_LINE_1689 */
/* RECOVERY_GAP_LINE_1690 */
/* RECOVERY_GAP_LINE_1691 */
/* RECOVERY_GAP_LINE_1692 */
/* RECOVERY_GAP_LINE_1693 */
/* RECOVERY_GAP_LINE_1694 */
/* RECOVERY_GAP_LINE_1695 */
/* RECOVERY_GAP_LINE_1696 */
/* RECOVERY_GAP_LINE_1697 */
/* RECOVERY_GAP_LINE_1698 */
/* RECOVERY_GAP_LINE_1699 */
/* RECOVERY_GAP_LINE_1700 */
/* RECOVERY_GAP_LINE_1701 */
/* RECOVERY_GAP_LINE_1702 */
/* RECOVERY_GAP_LINE_1703 */
/* RECOVERY_GAP_LINE_1704 */
/* RECOVERY_GAP_LINE_1705 */
/* RECOVERY_GAP_LINE_1706 */
/* RECOVERY_GAP_LINE_1707 */
/* RECOVERY_GAP_LINE_1708 */
/* RECOVERY_GAP_LINE_1709 */
/* RECOVERY_GAP_LINE_1710 */
/* RECOVERY_GAP_LINE_1711 */
/* RECOVERY_GAP_LINE_1712 */
/* RECOVERY_GAP_LINE_1713 */
/* RECOVERY_GAP_LINE_1714 */
/* RECOVERY_GAP_LINE_1715 */
/* RECOVERY_GAP_LINE_1716 */
/* RECOVERY_GAP_LINE_1717 */
/* RECOVERY_GAP_LINE_1718 */
/* RECOVERY_GAP_LINE_1719 */
/* RECOVERY_GAP_LINE_1720 */
/* RECOVERY_GAP_LINE_1721 */
/* RECOVERY_GAP_LINE_1722 */
/* RECOVERY_GAP_LINE_1723 */
/* RECOVERY_GAP_LINE_1724 */
/* RECOVERY_GAP_LINE_1725 */
/* RECOVERY_GAP_LINE_1726 */
/* RECOVERY_GAP_LINE_1727 */
/* RECOVERY_GAP_LINE_1728 */
/* RECOVERY_GAP_LINE_1729 */
/* RECOVERY_GAP_LINE_1730 */
/* RECOVERY_GAP_LINE_1731 */
/* RECOVERY_GAP_LINE_1732 */
/* RECOVERY_GAP_LINE_1733 */
/* RECOVERY_GAP_LINE_1734 */
/* RECOVERY_GAP_LINE_1735 */
/* RECOVERY_GAP_LINE_1736 */
/* RECOVERY_GAP_LINE_1737 */
/* RECOVERY_GAP_LINE_1738 */
/* RECOVERY_GAP_LINE_1739 */
/* RECOVERY_GAP_LINE_1740 */
/* RECOVERY_GAP_LINE_1741 */
/* RECOVERY_GAP_LINE_1742 */
/* RECOVERY_GAP_LINE_1743 */
/* RECOVERY_GAP_LINE_1744 */
/* RECOVERY_GAP_LINE_1745 */
/* RECOVERY_GAP_LINE_1746 */
/* RECOVERY_GAP_LINE_1747 */
/* RECOVERY_GAP_LINE_1748 */
/* RECOVERY_GAP_LINE_1749 */
/* RECOVERY_GAP_LINE_1750 */
/* RECOVERY_GAP_LINE_1751 */
/* RECOVERY_GAP_LINE_1752 */
/* RECOVERY_GAP_LINE_1753 */
/* RECOVERY_GAP_LINE_1754 */
/* RECOVERY_GAP_LINE_1755 */
/* RECOVERY_GAP_LINE_1756 */
/* RECOVERY_GAP_LINE_1757 */
/* RECOVERY_GAP_LINE_1758 */
/* RECOVERY_GAP_LINE_1759 */
/* RECOVERY_GAP_LINE_1760 */
/* RECOVERY_GAP_LINE_1761 */
/* RECOVERY_GAP_LINE_1762 */
/* RECOVERY_GAP_LINE_1763 */
/* RECOVERY_GAP_LINE_1764 */
/* RECOVERY_GAP_LINE_1765 */
/* RECOVERY_GAP_LINE_1766 */
/* RECOVERY_GAP_LINE_1767 */
/* RECOVERY_GAP_LINE_1768 */
/* RECOVERY_GAP_LINE_1769 */
/* RECOVERY_GAP_LINE_1770 */
/* RECOVERY_GAP_LINE_1771 */
/* RECOVERY_GAP_LINE_1772 */
/* RECOVERY_GAP_LINE_1773 */
/* RECOVERY_GAP_LINE_1774 */
/* RECOVERY_GAP_LINE_1775 */
/* RECOVERY_GAP_LINE_1776 */
/* RECOVERY_GAP_LINE_1777 */
/* RECOVERY_GAP_LINE_1778 */
/* RECOVERY_GAP_LINE_1779 */
/* RECOVERY_GAP_LINE_1780 */
/* RECOVERY_GAP_LINE_1781 */
/* RECOVERY_GAP_LINE_1782 */
/* RECOVERY_GAP_LINE_1783 */
/* RECOVERY_GAP_LINE_1784 */
/* RECOVERY_GAP_LINE_1785 */
/* RECOVERY_GAP_LINE_1786 */
/* RECOVERY_GAP_LINE_1787 */
/* RECOVERY_GAP_LINE_1788 */
/* RECOVERY_GAP_LINE_1789 */
/* RECOVERY_GAP_LINE_1790 */
/* RECOVERY_GAP_LINE_1791 */
/* RECOVERY_GAP_LINE_1792 */
/* RECOVERY_GAP_LINE_1793 */
/* RECOVERY_GAP_LINE_1794 */
/* RECOVERY_GAP_LINE_1795 */
/* RECOVERY_GAP_LINE_1796 */
/* RECOVERY_GAP_LINE_1797 */
/* RECOVERY_GAP_LINE_1798 */
/* RECOVERY_GAP_LINE_1799 */
/* RECOVERY_GAP_LINE_1800 */
/* RECOVERY_GAP_LINE_1801 */
/* RECOVERY_GAP_LINE_1802 */
/* RECOVERY_GAP_LINE_1803 */
/* RECOVERY_GAP_LINE_1804 */
/* RECOVERY_GAP_LINE_1805 */
/* RECOVERY_GAP_LINE_1806 */
/* RECOVERY_GAP_LINE_1807 */
/* RECOVERY_GAP_LINE_1808 */
/* RECOVERY_GAP_LINE_1809 */
/* RECOVERY_GAP_LINE_1810 */
/* RECOVERY_GAP_LINE_1811 */
/* RECOVERY_GAP_LINE_1812 */
/* RECOVERY_GAP_LINE_1813 */
/* RECOVERY_GAP_LINE_1814 */
/* RECOVERY_GAP_LINE_1815 */
/* RECOVERY_GAP_LINE_1816 */
/* RECOVERY_GAP_LINE_1817 */
/* RECOVERY_GAP_LINE_1818 */
/* RECOVERY_GAP_LINE_1819 */
/* RECOVERY_GAP_LINE_1820 */
/* RECOVERY_GAP_LINE_1821 */
/* RECOVERY_GAP_LINE_1822 */
/* RECOVERY_GAP_LINE_1823 */
/* RECOVERY_GAP_LINE_1824 */
/* RECOVERY_GAP_LINE_1825 */
/* RECOVERY_GAP_LINE_1826 */
/* RECOVERY_GAP_LINE_1827 */
/* RECOVERY_GAP_LINE_1828 */
/* RECOVERY_GAP_LINE_1829 */
/* RECOVERY_GAP_LINE_1830 */
/* RECOVERY_GAP_LINE_1831 */
/* RECOVERY_GAP_LINE_1832 */
/* RECOVERY_GAP_LINE_1833 */
/* RECOVERY_GAP_LINE_1834 */
/* RECOVERY_GAP_LINE_1835 */
/* RECOVERY_GAP_LINE_1836 */
/* RECOVERY_GAP_LINE_1837 */
/* RECOVERY_GAP_LINE_1838 */
/* RECOVERY_GAP_LINE_1839 */
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
      detail: "管理批次状态、关注队列、导师反馈节奏和跨角色协同记录。",
    },
    admin: {
      shortLabel: "后台",
      title: "系统管理",
      detail: "配置账号、批次、岗位成长模板和权限范围，保障业务端数据可维护。",
    },
  };
  const portalShowcases: Record<string, {
    eyebrow: string;
    title: string;
    description: string;
    icon: ElementType;
    tone: string;
    rotate: number;
  }> = {
    student: {
      eyebrow: "Student Portal",
      title: "实习生成长端",
      description: "先看到今日任务、本周目标和导师反馈，再把不确定的问题整理成可沟通的提问。",
      icon: GraduationCap,
      tone: "from-white via-[#f7f4fb] to-[#eee9f6]",
      rotate: 0,
    },
    mentor: {
      eyebrow: "Mentor Portal",
      title: "导师带教端",
      description: "把带教对象、待反馈、待回复问题放在同一个工作面，减少导师凭经验漏动作。",
      icon: MessageSquareText,
      tone: "from-white via-[#eee9f6] to-[#f4eeee]",
      rotate: 0,
    },
    hr: {
      eyebrow: "HRBP Portal",
      title: "HRBP 运营台",
      description: "批次状态、关注队列、导师反馈完成率和适岗摘要集中管理，减少私聊追问。",
      icon: LayoutDashboard,
      tone: "from-white via-[#f7f4fb] to-[#f6eeef]",
      rotate: 0,
    },
    admin: {
      eyebrow: "Admin Console",
      title: "系统管理后台",
      description: "维护账号、批次、岗位模板和权限规则，保证前台数据长期可运营。",
      icon: LockKeyhole,
      tone: "from-white via-[#f7f4fb] to-[#e2e2e3]",
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
      eyebrow: "Student Growth",
      headline: "把“我该学什么”变成每天清楚的下一步",
      body: "实习生进入后先看到当前阶段、今日任务、本周目标和导师反馈，不需要反复私聊确认进度。",
      features: [
        ["今日任务", "优先展示今天最该完成的 3 件事。", ClipboardList],
        ["成长路径", "按岗位拆解 30-60-90 天阶段目标。", GraduationCap],
        ["导师反馈", "把反馈沉淀为下一步可执行建议。", MessageSquareText],
      ],
      aiTitle: "AI 成长赋能",
      aiBody: "AI 会把模糊困惑整理成能直接问导师的问题，也会根据任务状态给出学习建议。",
      aiChips: ["生成提问", "解释任务", "整理周报"],
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
      body: "HRBP 可以查看批次进度、关注队列、导师反馈完成率和适岗周报，减少跨角色反复同步。",
      features: [
        ["批次总览", "快速看到稳定推进、需支持和高潜观察。", LayoutDashboard],
        ["关注队列", "把需要 HRBP 介入的人和原因聚合起来。", AlertTriangle],
        ["适岗周报", "一键生成可同步给招聘侧的摘要。", FileText],
      ],
      aiTitle: "AI 运营赋能",
      aiBody: "AI 会汇总任务、反馈和协同记录，生成批次摘要、关注原因和下周动作建议。",
      aiChips: ["批次摘要", "关注原因", "周报生成"],
    },
    admin: {
      eyebrow: "Admin Console",
      headline: "把账号、批次、模板和权限配置清楚",
      body: "管理员维护基础数据和岗位成长模板，让前台的成长路径、反馈节奏和看板口径保持一致。",
      features: [
        ["账号权限", "维护不同角色可见和可操作范围。", LockKeyhole],
        ["批次管理", "管理实习生名单、导师绑定和岗位分布。", Users],
        ["模板配置", "维护不同岗位的成长阶段和默认任务。", ListChecks],
      ],
      aiTitle: "AI 配置赋能",
      aiBody: "AI 可以辅助生成岗位成长模板、默认任务清单和批次初始化建议。",
      aiChips: ["模板建议", "任务清单", "批次初始化"],
    },
  };
  const selectedRoleContent = roleContent[role] ?? roleContent.student;
  const portalAccessNotes: Record<UserRole, Array<[string, string]>> = {
    student: [
      ["今天先做什么", "把本周目标拆成清楚的下一步"],
      ["哪里需要帮助", "把困惑整理成更好问的问题"],
      ["进步看得见", "任务、反馈和成长建议放在一起"],
    ],
    mentor: [
      ["今天先看谁", "快速识别需要跟进的学员"],
      ["反馈更省力", "把观察整理成结构化草稿"],
      ["节奏不遗漏", "按周提醒关键带教动作"],
    ],
    hr: [
      ["整体有把握", "一眼看到批次成长状态"],
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

  const rotatePortal = () => {
    const currentIndex = Math.max(0, primaryPortalRoles.findIndex((item) => item.role === role));
    const next = primaryPortalRoles[(currentIndex + 1) % primaryPortalRoles.length];
    selectRole(next.role);
  };

  const submit = () => {
    const user = mockUsers.find((item) => item.username === username && item.password === password && item.role === role);
    if (!user) {
      setError("账号、密码或身份不匹配。可使用快速体验入口进入。");
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
              {role !== "admin" && !showLogin && (
                <button
                  type="button"
                  onClick={rotatePortal}
                  className="fx-portal-next absolute bottom-5 right-6 z-20 flex h-12 w-12 items-center justify-center rounded-[16px] bg-white/54 text-[var(--role-accent)] shadow-[0_12px_28px_rgba(29,12,59,0.09)] ring-1 ring-white/70 backdrop-blur transition hover:bg-white/75"
                  aria-label="切换端口"
                >
                  <ChevronRight className="h-5 w-5" />
                </button>
              )}
              <div className={cn("relative z-10 flex flex-col gap-7", showLogin ? "min-h-[420px] justify-between" : "min-h-[420px] justify-between")}>
                <div>
                  <p className="login-kicker">{selectedPortal.eyebrow}</p>
                  <h1 className="login-hero-title mt-5 max-w-[480px] text-4xl font-semibold leading-[1.12] text-[#171321] sm:text-[3.1rem]">
                    让实习生成长可见，让导师带教有序，让 HR 协同更轻。
                  </h1>
                  <p className="mt-6 max-w-[520px] text-base font-normal leading-8 text-[#6F6A7A]">
                    GrowNest 将成长路径、导师反馈与 HR 风险判断收敛到一个克制、可追踪的企业级 AI 工作台。
                  </p>
                </div>

                <div className="grid gap-3 sm:grid-cols-3">
                  {selectedAccessNotes.map(([label, detail]) => (
                    <div key={label} className="rounded-[14px] border border-[#504678]/10 bg-white/48 px-4 py-3" data-gsap-feature="">
                      <p className="text-sm font-medium text-[#171321]">{label}</p>
                      <p className="mt-2 text-xs leading-5 text-[#6F6A7A]">{detail}</p>
                    </div>
                  ))}
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {primaryPortalRoles.map((item) => {
                    const active = item.role === role;
                    return (
                      <button
                        key={item.role}
                        type="button"
                        onClick={() => selectRole(item.role)}
                        className={cn(
                          "rounded-[10px] border px-3 py-2 text-xs font-medium transition",
                          active ? "border-[#4B32C3]/20 bg-[#4B32C3]/8 text-[#4B32C3]" : "border-[#504678]/10 bg-white/42 text-[#6F6A7A] hover:bg-white/70 hover:text-[#171321]",
                        )}
                      >
                        {loginRoleMeta[item.role]?.shortLabel}
                      </button>
                    );
                  })}
                  <button
                    type="button"
                    onClick={() => openLogin(role)}
                    className="ml-auto inline-flex items-center gap-1.5 rounded-[10px] border border-[#4B32C3]/20 bg-[#4B32C3] px-3.5 py-2 text-xs font-medium text-white transition hover:bg-[#241A48]"
                  >
                    进入登录
                    <ChevronRight className="h-3.5 w-3.5" />
                  </button>
                </div>

                {showLogin && (
                  <div className="rounded-[16px] border border-[#504678]/10 bg-white/64 p-4 backdrop-blur">
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
                    <h2 className="mt-3 text-3xl font-semibold text-[#1D0C3B]">{selectedUser.roleLabel}</h2>
                    <p className="mt-2 max-w-md text-sm leading-6 text-[#6F6E72]">请输入该端口账号密码，系统会按当前端口权限进入对应工作台。</p>
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
                <h1 className="login-copy-title mt-4 text-3xl font-semibold leading-tight text-[#1D0C3B] lg:text-[2.72rem]">
                  {selectedRoleContent.headline}
                </h1>
                <p className="mt-5 text-base leading-8 text-[#6F6E72]">
                  {selectedRoleContent.body}
                </p>
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
                </p>
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

  return (
    <div ref={layoutRef} className={cn("enterprise-shell min-h-screen", user.role === "hr" && "glass-theme-shell")} style={roleThemeStyle(user.role)}>
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

      <div className="mx-auto flex max-w-[1440px] gap-4 px-4 py-4">
        <aside className="hidden w-[228px] shrink-0 xl:block">
          <div className="sticky top-24 space-y-3">
            <Card className="enterprise-sidebar min-h-[calc(100vh-120px)] p-2">
              <div className="mb-3 border-b border-slate-100 px-2 pb-3 pt-1">
                <BrandLogo small />
              </div>
              <button className="mb-1 flex w-full items-center gap-3 rounded-[9px] bg-[var(--role-accent)] px-3 py-2.5 text-left text-sm font-semibold text-white shadow-lg shadow-[var(--role-shadow)]">
                <Home className="h-4 w-4" />
                当前工作台
              </button>
              {nav.filter((item) => item.roles.includes(user.role)).map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.path}
                    className="mb-1 flex w-full items-center gap-3 rounded-[9px] px-3 py-2.5 text-left text-sm font-semibold text-slate-600 transition hover:bg-[var(--role-soft)] hover:text-[var(--role-accent)]"
                  >
                    <Icon className="h-4 w-4" />
                    {item.label}
                  </button>
                );
              })}
            </Card>
          </div>
        </aside>

        <main className="min-w-0 flex-1 space-y-4">
          <Card className="overflow-hidden p-0">
            <div className="relative overflow-hidden bg-white p-4" data-gsap-title="">
              <div className="absolute inset-x-0 top-0 h-1 bg-[var(--role-accent)]" />
              <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wide text-[var(--role-accent)]">
                    当前工作台
                  </p>
                  <h1 className="mt-1 text-xl font-black tracking-[0] text-slate-950 lg:text-2xl">{title}</h1>
                  <p className="mt-1 text-sm text-slate-600">
                    {user.name} / {roleName[user.role]}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {["实时同步", "AI 赋能"].map((item) => (
                    <span key={item} className="rounded-md bg-[var(--role-soft)] px-3 py-2 text-xs font-black text-[var(--role-accent)] ring-1 ring-[var(--role-border)]">
                      {item}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </Card>
          {children}
        </main>
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
  const mapStops = [
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
  const currentStop = mapStops[Math.min(selectedWeekIndex, mapStops.length - 1)];
  const progress = Math.min(100, Math.max(0, (selectedWeekIndex / 12) * 100));

  return (
    <div className="growth-map-route overflow-hidden rounded-lg border border-[var(--role-border)] bg-gradient-to-br from-white via-white/70 to-emerald-50/50 p-3">
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
      <div className="mt-3 overflow-x-auto rounded-lg bg-white/82 p-3 ring-1 ring-[var(--role-border)]">
        <div className="relative min-h-[245px] min-w-[760px] overflow-hidden rounded-lg border border-[var(--role-border)] bg-[radial-gradient(circle_at_18%_24%,rgba(37,99,235,0.12),transparent_18%),radial-gradient(circle_at_78%_32%,rgba(16,185,129,0.14),transparent_20%),linear-gradient(180deg,#f8fbff,#ffffff)] p-3 md:min-w-0">
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
          {mapStops.map((stop, index) => {
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
        <div className="mt-3 grid gap-2 md:grid-cols-4">
          <div className="rounded-lg border border-[var(--role-border)] bg-[var(--role-soft)] px-3 py-2">
            <p className="text-xs font-black text-[var(--role-accent)]">当前站点 · {currentStop.name}</p>
            <p className="mt-1 text-sm font-bold text-slate-700">{selectedDateLabel}，今日 {todayTasksCount} 个任务，待办 {pendingTasksCount} 个</p>
          </div>
          {milestones.map((item) => (
            <div key={item.day} className="rounded-lg bg-slate-50 px-3 py-2 ring-1 ring-slate-100">
              <p className="text-xs font-black text-[var(--role-accent)]">第 {item.day} 天 · {item.label}</p>
              <p className="mt-1 text-sm font-bold text-slate-700">{item.label}</p>
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

function inferTaskDateIndex(task: { due: string }, index: number) {
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
  managedInterns,
  onUpdateTask,
}: {
  user: AuthUser;
  records: CollaborationRecord[];
  onAddRecord: (record: Omit<CollaborationRecord, "id" | "createdAt">) => void;
  managedInterns: ManagedIntern[];
  onUpdateTask: (internId: string, taskId: string, patch: Partial<GrowthTask>) => void;
}) {
  const studentRef = useRef<HTMLDivElement | null>(null);
  const [showQuestions, setShowQuestions] = useState(false);
  const [questions, setQuestions] = useState<string[]>([]);
  const [studentQuestionDraft, setStudentQuestionDraft] = useState("");
  const [questionFocus, setQuestionFocus] = useState("业务指标怎么理解？");
  const [questionError, setQuestionError] = useState("");
  const [questionMessage, setQuestionMessage] = useState("");
  const currentIntern = managedInterns.find((intern) => intern.name === user.name);
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
  const mentorFeedbackRecords = records.filter(
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
  const mentorQuestionRecords = records.filter(
    (record) => record.internName === user.name && record.sourceRole === "实习生" && record.targetRole === "导师" && record.question,
  );
  const currentStageIndex = Math.min(2, Math.floor(selectedWeekIndex / 4));
  const currentStage = studentGrowthStagesForDisplay[currentStageIndex] ?? studentGrowthStagesForDisplay[0];
  const currentStageDone = currentStage?.tasks.filter((task) => task.status === "已完成").length ?? 0;
  const currentStageTotal = currentStage?.tasks.length ?? 0;

  useResultReveal(studentRef, [dailyPlan, showQuestions, taskMessage, questionMessage], "[data-gsap-result]");

  const generateDailyPlan = async () => {
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
    const targetTask = displayTasks.find((task) => task.id === taskId);
    if (!targetTask || targetTask.status === "已完成") return;
    const nextStatus = "已完成";

    if (currentIntern) {
      onUpdateTask(currentIntern.id, taskId, { status: nextStatus, due: nextStatus === "已完成" ? "已完成" : targetTask.due });
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
        <div className="border-b border-slate-100 bg-slate-50/80 px-4 py-3">
          <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
                <h2 className="text-xl font-black tracking-[0] text-slate-950 lg:text-2xl">
                  我的成长地图 · {selectedDate.label}
                </h2>
                <span className="rounded-full bg-[var(--role-soft)] px-2.5 py-1 text-xs font-black text-[var(--role-accent)] ring-1 ring-[var(--role-border)]">
                  第 {currentWeekNumber}/13 周 · 90 天路线
                </span>
                <span className="text-xs font-bold text-slate-500">
                  {currentWeekStart.monthDay}-{currentWeekEnd.monthDay} · {selectedDate.monthDay} {selectedDate.weekday}
                </span>
              </div>
              <div className="mt-2 flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1 text-xs font-bold text-slate-600">
                <span>{currentIntern?.title ?? user.title ?? "产品运营实习生"}</span>
                <span className="h-3 w-px bg-slate-200" />
                <span>导师 {currentIntern?.mentor ?? user.mentor ?? "王老师"}</span>
                <span className="h-3 w-px bg-slate-200" />
                <span className="min-w-0 truncate">重点 {supportFocus}</span>
              </div>
              <div className="mt-2 flex items-center gap-2 text-xs font-bold text-slate-500">
                <span className="h-2 w-2 rounded-full bg-[var(--role-accent)]" />
                <span>当前位置：{selectedDate.label}，本周范围 {currentWeekStart.monthDay}-{currentWeekEnd.monthDay}</span>
              </div>
            </div>
            <div className="flex w-full flex-wrap items-center justify-between gap-2 rounded-lg border border-slate-200 bg-white p-2 xl:w-auto">
              <div className="flex items-center gap-1">
                <button
                  className="inline-flex items-center gap-1 rounded-md px-2.5 py-1.5 text-xs font-black text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                  disabled={selectedWeekIndex === 0}
                  onClick={() => changeGrowthWeek(-1)}
                >
                  <ChevronRight className="h-3.5 w-3.5 rotate-180" />
                  上一周
                </button>
                <span className="text-xs font-black text-[var(--role-accent)]">90 天路线</span>
                <button
                  className="inline-flex items-center gap-1 rounded-md px-2.5 py-1.5 text-xs font-black text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                  disabled={selectedWeekIndex === maxGrowthWeekIndex}
                  onClick={() => changeGrowthWeek(1)}
                >
                  下一周
                  <ChevronRight className="h-3.5 w-3.5" />
                </button>
              </div>
              <div className="flex min-w-[150px] items-center gap-3">
                <div className="min-w-0">
                  <p className="text-xs font-bold text-slate-500">本周任务完成度</p>
                  <p className="text-lg font-black leading-none text-slate-950">{studentProgress}%</p>
                </div>
                <div className="min-w-[72px] flex-1">
                  <div className="h-1.5 rounded-full bg-slate-100">
                    <div className="h-1.5 rounded-full bg-[var(--role-accent)] transition-all duration-500" data-progress-fill="" style={{ width: `${studentProgress}%` }} />
                  </div>
                  <p className="mt-1 text-xs font-black text-emerald-700">{completedTasks}/{displayTasks.length} 已完成</p>
                </div>
              </div>
            </div>
          </div>
        </div>

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

        <div className="grid gap-4 p-4 xl:grid-cols-[minmax(0,1fr)_320px]">
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
                  <p className="text-base font-black text-slate-950">{selectedDate.label}节点任务</p>
                  <p className="mt-1 text-sm text-slate-500">沿着今天的成长节点推进学习和交付动作。</p>
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
                        <StatusPill status={task.status} />
                        <Button variant={task.status === "已完成" ? "ghost" : "primary"} className="px-3 py-2 text-xs" disabled={task.status === "已完成"} onClick={() => updateTaskStatus(task.id, task.label)}>
                          {task.status === "已完成" ? "已完成" : "完成"}
                        </Button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50 px-4 py-5 text-center text-sm text-slate-500">
                    这一天暂无节点任务，适合复盘本周记录或提前整理导师问题。
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
                    {dailyPlanLoading ? "AI 正在分析..." : "重新生成建议"}
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
                  <div className="rounded-lg bg-slate-50 p-3 ring-1 ring-slate-100" data-gsap-result="">
                    <p className="text-xs font-black text-[var(--role-accent)]">为什么这样建议</p>
                    <p className="mt-1 text-sm leading-6 text-slate-700">{dailyPlan.reason}</p>
                  </div>
                  <div className="rounded-lg bg-slate-50 p-3 ring-1 ring-slate-100" data-gsap-result="">
                    <p className="text-xs font-black text-[var(--role-accent)]">建议动作</p>
                    <div className="mt-2 space-y-2">
                      {dailyPlan.actions.slice(0, 4).map((action, index) => (
                        <div key={action} className="flex gap-2 rounded-lg bg-white px-3 py-2 text-sm leading-6 text-slate-700 ring-1 ring-slate-100" data-gsap-result="">
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
        <div className="mt-4 grid gap-4 xl:grid-cols-[0.9fr_1.1fr]">
          <div className="rounded-lg border border-[var(--role-border)] bg-[var(--role-soft)] p-4">
            <p className="text-xs font-black text-[var(--role-accent)]">{currentStage?.period ?? "当前阶段"} · 第 {currentWeekNumber} 周</p>
            <h3 className="mt-2 text-xl font-black text-slate-950">{currentStage?.theme ?? "阶段目标推进"}</h3>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              当前阶段已完成 {currentStageDone}/{currentStageTotal} 个节点。本周优先把「{primaryTask?.label ?? supportFocus}」推进到可反馈状态。
            </p>
            <div className="mt-4 h-2 rounded-full bg-white">
              <div className="h-2 rounded-full bg-[var(--role-accent)]" data-progress-fill="" style={{ width: `${currentStageTotal ? Math.round((currentStageDone / currentStageTotal) * 100) : 0}%` }} />
            </div>
          </div>
          <div className="grid gap-2 md:grid-cols-2">
            {(currentStage?.tasks ?? []).map((task) => (
              <div key={task.label} className="flex items-center justify-between gap-3 rounded-lg border border-slate-100 bg-slate-50 px-3 py-2.5" data-gsap-result="">
                <span className="text-sm font-semibold text-slate-700">{task.label}</span>
                <StatusPill status={task.status} />
              </div>
            ))}
          </div>
        </div>
      </Card>

      <div className="grid gap-4 xl:grid-cols-[1fr_390px]">
        <Card data-chart-card="">
          <SectionTitle icon={ClipboardList} title="本周待办池" subtitle="未完成和已完成分开沉淀，避免和今日任务重复" />
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
                    task.status === "已完成"
                      ? "cursor-default bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100"
                      : "bg-[var(--role-accent)] text-white shadow-sm shadow-[var(--role-shadow)] hover:bg-[var(--role-accent-strong)]",
                  )}
                  disabled={task.status === "已完成"}
                  onClick={() => updateTaskStatus(task.id, task.label)}
                >
                  {task.status === "已完成" ? "已完成" : "完成"}
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
                      <span className={cn("rounded-full px-3 py-1 text-xs font-bold", record.answer ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700")}>
                        {record.answer ? "导师已回复" : "等待导师回复"}
                      </span>
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
                  <p className="text-sm font-bold text-slate-600">暂无提问记录</p>
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
                      <span className="rounded-full bg-white px-3 py-1 text-xs font-bold text-[var(--role-accent)]">{record.status}</span>
                    </div>
                    <p className="mt-2 text-sm leading-6 text-slate-700">{record.detail}</p>
                  </div>
                ))
              ) : (
                <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-center">
                  <p className="text-sm font-bold text-slate-600">暂无导师反馈</p>
                  <p className="mt-2 text-sm text-slate-500">导师确认反馈后，你会在这里看到下一步成长重点。</p>
                </div>
              )}
            </div>
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
}: {
  user: AuthUser;
  records: CollaborationRecord[];
  onAddRecord: (record: Omit<CollaborationRecord, "id" | "createdAt">) => void;
  onUpdateRecord: (id: string, patch: Partial<CollaborationRecord>) => void;
  managedInterns: ManagedIntern[];
  onCreateFeedback: (internId: string, form: FeedbackFormState) => void;
}) {
  const mentorRef = useRef<HTMLDivElement | null>(null);
  const mentorViewInterns = useMemo(() => {
    const scoped = managedInterns.filter((intern) =>
      isSameDepartment(intern.department, user.department) &&
      (intern.mentor === user.name || user.ownedInterns?.includes(intern.name)),
    );
    return scoped.map((intern) => ({
      name: intern.name,
      title: intern.title,
      department: intern.department,
      progress: intern.progress,
      risk: intern.risk,
      action: intern.feedbacks.length ? "已记录反馈" : "待阶段反馈",
      detail: intern.reason || intern.todo || "当前暂无风险说明，建议保持每周反馈节奏。",
      observationHint: intern.feedbacks[0]?.content || `${intern.name}当前成长进度 ${intern.progress}%，主要关注点是${intern.reason || intern.todo || "阶段目标推进"}。`,
      focus: intern.risk === "低风险" ? "挑战任务安排" : intern.reason || "阶段能力补齐",
      weeklyRecord: intern.tasks.map((task) => `${task.title} ${task.status}`),
      aiSignals: [`成长进度 ${intern.progress}%`, `关注状态 ${attentionLabel[intern.risk]}`, `任务数量 ${intern.tasks.length}`],
      managedId: intern.id,
    }));
  }, [managedInterns, user.department, user.name, user.ownedInterns]);
  const [selectedName, setSelectedName] = useState(mentorViewInterns[0]?.name ?? "");
  const selected = useMemo(() => mentorViewInterns.find((intern) => intern.name === selectedName) ?? mentorViewInterns[0], [mentorViewInterns, selectedName]);
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
  if (!selected) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          <StatCard label="导师姓名" value={user.name} icon={UserRound} tone="blue" />
          <StatCard label="负责实习生" value="0 人" icon={Users} tone="green" />
          <StatCard label="本周待反馈" value="0 条" icon={MessageSquareText} tone="amber" />
          <StatCard label="需重点关注" value="0 人" icon={AlertTriangle} tone="rose" />
          <Card className="p-5">
            <p className="text-sm font-medium text-slate-500">部门</p>
            <p className="mt-2 text-xl font-black text-slate-950">{user.department}</p>
          </Card>
        </div>
        <Card className="border-[var(--role-border)] bg-[var(--role-soft)]">
          <SectionTitle icon={LockKeyhole} title="暂无可带教学员" subtitle="导师端只展示同部门且已绑定给当前导师的实习生" />
          <p className="mt-4 text-sm leading-6 text-slate-600">
            当前账号没有匹配到「{normalizeDepartment(user.department)}」下的绑定实习生。请由 HRBP 或系统管理员在批次管理中完成导师绑定后再查看。
          </p>
        </Card>
      </div>
    );
  }
  const relatedRecords = records.filter((record) => record.internName === selected.name);
  const studentQuestions = relatedRecords.filter(
    (record) => record.sourceRole === "实习生" && record.targetRole === "导师" && record.question,
  );
  const mentorInternCount = mentorViewInterns.length;
  const pendingFeedbackCount = mentorViewInterns.filter((intern) => intern.action.includes("待")).length;
  const attentionCount = mentorViewInterns.filter((intern) => intern.risk !== "低风险").length;
  const unansweredQuestionCount = records.filter(
    (record) => record.sourceRole === "实习生" && record.targetRole === "导师" && record.question && !record.answer,
  ).length;
  const hrSyncCount = records.filter((record) => record.sourceRole === "HR" && record.targetRole === "导师").length;
  const publishedFeedbackCount = records.filter((record) => record.sourceRole === "导师").length;
  const averageProgress = mentorViewInterns.length
    ? Math.round(mentorViewInterns.reduce((sum, intern) => sum + intern.progress, 0) / mentorViewInterns.length)
    : 0;
  const mentorCheckpoints = [
    { day: "第 1 天", action: "确认岗位目标、工具权限和首周学习资料", status: "已完成" },
    { day: "第 3 天", action: "完成新人 Check-in，确认是否知道该学什么", status: "已完成" },
    { day: "第 7 天", action: "检查首周任务产出，补充业务上下文", status: selected.risk === "低风险" ? "已完成" : "进行中" },
    { day: "第 14 天", action: "提交阶段反馈，明确一项待提升能力", status: selected.action.includes("待") ? "进行中" : "已完成" },
    { day: "第 30 天", action: "完成成长评价并同步 HR/招聘观察结论", status: "未开始" },
  ];

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
    setAnswerDrafts((current) => ({ ...current, [record.id]: "" }));
  };
  const mentorPriorityItems = [
    {
      title: "回复学员提问",
      detail: unansweredQuestionCount > 0 ? "学生端已有未回复问题，需要导师给出明确口径。" : "暂无未回复问题。",
      value: `${unansweredQuestionCount} 条`,
      source: "学生端",
      impact: "回复后回到学生端「导师沟通中心」。",
      icon: MessageSquareText,
      tone: "blue",
    },
    {
      title: "补齐阶段反馈",
      detail: pendingFeedbackCount > 0 ? "仍有实习生缺少本周阶段反馈，会影响 HRBP 对批次状态的判断。" : "本周阶段反馈已覆盖当前负责对象。",
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
      detail: hrSyncCount > 0 ? "HRBP 已同步过协同事项，导师需要结合当前对象查看详情。" : "暂无 HRBP 同步事项。",
      value: `${hrSyncCount} 条`,
      source: "HRBP端",
      impact: "导师反馈后关闭或推进协同闭环。",
      icon: LayoutDashboard,
      tone: "slate",
    },
  ];

  return (
    <div ref={mentorRef} className="mentor-dashboard space-y-6">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <StatCard label="导师姓名" value={user.name} icon={UserRound} tone="blue" />
        <StatCard label="负责实习生" value={`${mentorInternCount} 人`} icon={Users} tone="green" />
        <StatCard label="本周待反馈" value={`${pendingFeedbackCount} 条`} icon={MessageSquareText} tone="amber" />
        <StatCard label="需重点关注" value={`${attentionCount} 人`} icon={AlertTriangle} tone="rose" />
        <Card className="p-5">
          <p className="text-sm font-medium text-slate-500">部门</p>
          <p className="mt-2 text-xl font-black text-slate-950">{user.department}</p>
        </Card>
      </div>

      <Card className="mentor-command-panel overflow-hidden border-[var(--role-border)] bg-gradient-to-br from-white via-white/70 to-emerald-50/60">
        <div className="grid gap-5 xl:grid-cols-[minmax(0,1.35fr)_minmax(320px,0.65fr)]">
          <div className="min-w-0">
          <SectionTitle icon={ShieldCheck} title="今日带教工作台" subtitle="先看真实待办，再处理当前对象；导师端动作会回流学生端和 HRBP 看板" />
          <div className="mentor-sync-strip mt-5" aria-label="学生端、导师端、HRBP端数据同步状态">
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
          <div className="mt-5 grid gap-3 md:grid-cols-3">
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
              <div key={item.title} className="mentor-flow-card rounded-lg bg-white/88 p-4 ring-1 ring-[var(--role-border)]" data-list-panel="">
                  <div className={cn("flex h-9 w-9 items-center justify-center rounded-lg ring-1", item.tone)}>
                    <FlowIcon className="h-4 w-4" />
                  </div>
                  <p className="mt-4 text-sm font-black text-slate-950">{item.title}</p>
                  <p className="mt-1 text-xl font-black text-slate-950">{item.metric}</p>
                  <p className="mt-2 text-sm leading-6 text-slate-600">{item.detail}</p>
                </div>
              );
            })}
          </div>
          </div>
          <aside className="mentor-focus-card rounded-xl border border-[var(--role-border)] bg-white/88 p-4 shadow-[0_12px_30px_rgba(15,23,42,0.06)]">
            <div className="flex items-start justify-between gap-3">
              <div className="mentor-command-heading">
                <span className="mentor-kicker">Mentor Command</span>
                <p className="text-xs font-black text-[var(--role-accent)]">当前处理对象</p>
                <h3 className="mt-2 text-2xl font-black text-slate-950">{selected.name}</h3>
                <p className="mt-1 text-sm font-semibold text-slate-500">{selected.title} · {selected.department}</p>
              </div>
              <AttentionBadge risk={selected.risk} />
            </div>
            <div className="mt-5 rounded-lg bg-slate-50 p-4">
              <div className="flex items-end justify-between gap-3">
                <div>
                  <p className="text-xs font-bold text-slate-500">成长进度</p>
                  <p className="mt-1 text-4xl font-black text-slate-950">{selected.progress}%</p>
                </div>
                <span className="rounded-full bg-white px-3 py-1 text-xs font-black text-[var(--role-accent)] ring-1 ring-[var(--role-border)]">{selected.action}</span>
              </div>
              <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-200">
                <div className="mentor-progress-fill h-full rounded-full" data-progress-fill="" style={{ width: `${selected.progress}%` }} />
              </div>
            </div>
            <div className="mt-4 rounded-lg bg-[var(--role-soft)] p-3">
              <p className="text-xs font-black text-[var(--role-accent)]">本次辅导重点</p>
              <p className="mt-1 text-sm font-semibold leading-6 text-slate-700">{selected.focus}</p>
            </div>
          </aside>
        </div>
          <div className="mt-5 grid gap-3 rounded-lg border border-[var(--role-border)] bg-white/82 p-4 md:grid-cols-4">
            {[
              ["平均进度", `${averageProgress}%`, "来自学生任务状态"],
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

	      <Card>
	        <SectionTitle icon={CalendarCheck} title="今日带教优先事项" subtitle="只展示真实待处理信号；具体处理在下方问答、反馈和协同记录里完成" />
	        <div className="mt-5 grid gap-3 lg:grid-cols-4">
	        {mentorPriorityItems.map((item, index) => {
              const PriorityIcon = item.icon;
              return (
	            <div key={item.title} className={cn("mentor-priority-card rounded-2xl border p-4", `mentor-priority-${item.tone}`)} style={{ animationDelay: `${index * 80}ms` }}>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-3">
                    <span className="mentor-priority-icon">
                      <PriorityIcon className="h-4 w-4" />
                    </span>
	                  <p className="font-black text-slate-950">{item.title}</p>
                  </div>
                  <span className="shrink-0 rounded-full bg-white px-2.5 py-1 text-xs font-black text-[var(--role-accent)] ring-1 ring-[var(--role-border)]">{item.value}</span>
                </div>
	              <p className="mt-2 text-sm leading-6 text-slate-700">{item.detail}</p>
                <div className="mt-4 rounded-xl bg-white/80 px-3 py-2">
                  <p className="text-xs font-bold text-slate-500">来源：{item.source}</p>
                  <p className="mt-1 text-xs font-semibold leading-5 text-[var(--role-accent)]">{item.impact}</p>
                </div>
	            </div>
	          );
            })}
	        </div>
	      </Card>

      <div className="grid gap-5 2xl:grid-cols-[1fr_380px]">
        <Card data-chart-card="">
          <SectionTitle icon={Users} title="带教对象" subtitle={`仅展示 ${normalizeDepartment(user.department)} 下绑定给 ${user.name} 的实习生`} />
          <div className="mt-5 grid gap-3">
            {mentorViewInterns.map((intern, index) => (
              <button
                key={intern.name}
                onClick={() => selectIntern(intern)}
                className={cn(
                  "mentor-intern-card rounded-2xl border p-4 text-left transition hover:bg-[var(--role-soft)]",
                  selected.name === intern.name ? "border-[var(--role-border)] bg-[var(--role-soft)] ring-2 ring-[var(--role-border)]" : "border-slate-100 bg-white",
                )}
                style={{ animationDelay: `${index * 70}ms` }}
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-lg font-black text-slate-950">{intern.name}</p>
                    <p className="mt-1 text-sm text-slate-500">{intern.title} · {intern.department}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-bold text-[var(--role-accent)]">{intern.progress}%</span>
                    <AttentionBadge risk={intern.risk} />
                    <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600">{intern.action}</span>
                  </div>
                </div>
                <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-slate-100">
                  <div className="mentor-progress-fill h-full rounded-full" data-progress-fill="" style={{ width: `${intern.progress}%` }} />
                </div>
              </button>
            ))}
          </div>
        </Card>

        <Card className="mentor-detail-card h-fit" data-gsap-result="">
          <SectionTitle icon={BrainCircuit} title={`${selected.name} 成长详情`} subtitle={selected.department} />
          <div className="mt-5 rounded-2xl bg-slate-50 p-4">
            <p className="text-sm text-slate-500">成长进度</p>
            <p className="mt-1 text-4xl font-black text-slate-950">{selected.progress}%</p>
            <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-200">
              <div className="mentor-progress-fill h-full rounded-full" data-progress-fill="" style={{ width: `${selected.progress}%` }} />
            </div>
          </div>
          <div className="mt-4 rounded-2xl bg-[var(--role-soft)] p-4 text-sm leading-6 text-slate-700">{selected.detail}</div>
          <div className="mt-4 grid gap-2">
            {selected.aiSignals.map((signal) => (
              <div key={signal} className="flex items-center gap-2 rounded-xl bg-white px-3 py-2 text-xs font-bold text-slate-600 ring-1 ring-slate-100">
                <Sparkles className="h-3.5 w-3.5 shrink-0 text-[var(--role-accent)]" />
                {signal}
              </div>
            ))}
          </div>
        </Card>
      </div>

      <div className="grid gap-5 xl:grid-cols-[0.8fr_1.2fr]">
        <Card>
          <SectionTitle icon={CalendarCheck} title="带教节奏提醒" subtitle="本周需要完成的导师动作" />
          <div className="mentor-rhythm-track mt-5" aria-label="标准化带教时间轴">
            <div className="mentor-rhythm-rail">
              <span className="mentor-rhythm-playhead" aria-hidden="true" />
            </div>
            <div className="mentor-rhythm-clips">
              {mentorCheckpoints.map((checkpoint, index) => (
                <div key={checkpoint.day} className="mentor-rhythm-clip" style={{ animationDelay: `${index * 95}ms` }} data-gsap-result="">
                  <span>{checkpoint.day}</span>
                  <strong>{checkpoint.status}</strong>
                </div>
              ))}
            </div>
          </div>
          <div className="mt-5 space-y-3">
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
                      <span className="rounded-full bg-white px-2 py-1 text-xs font-bold text-[var(--role-accent)]">{record.status}</span>
                    </div>
                    <p className="mt-2 text-xs leading-5 text-slate-600">{record.detail}</p>
                    <p className="mt-2 text-xs font-semibold text-slate-400">{record.createdAt} · 来自 {record.sourceRole}</p>
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
                          回复并同步学员
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
        </Card>

        <Card>
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

function Dashboard({ managedInterns }: { managedInterns: ManagedIntern[] }) {
  const averageProgress = getAverageProgress(managedInterns);
  const highRiskCount = managedInterns.filter((intern) => intern.risk === "高风险").length;
  const mentorFeedbackRate = getMentorFeedbackRate(managedInterns);
  const roleProgressData = getRoleProgressData(managedInterns);
  const riskDistributionData = getRiskDistributionData(managedInterns);
  const stats = [
    { label: "实习生总数", value: String(managedInterns.length), icon: Users, tone: "blue" as const },
    { label: "平均成长进度", value: `${averageProgress}%`, icon: Gauge, tone: "green" as const },
    { label: "重点关注人数", value: String(highRiskCount), icon: AlertTriangle, tone: "rose" as const },
    { label: "导师反馈完成率", value: `${mentorFeedbackRate}%`, icon: CalendarCheck, tone: "amber" as const },
  ];

  return (
    <div className="space-y-5">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => <StatCard key={stat.label} {...stat} />)}
      </div>
      <div className="grid gap-5 xl:grid-cols-[1.6fr_1fr]">
        <Card>
          <SectionTitle icon={Target} title="岗位平均成长进度" subtitle="识别不同岗位的新人成长节奏" />
          <MeasuredChart height={288}>
            {(width, height) => (
	              <BarChart width={width} height={height} data={roleProgressData} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
	                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e8eef7" />
	                <XAxis dataKey="role" axisLine={false} tickLine={false} />
	                <YAxis axisLine={false} tickLine={false} domain={[0, 100]} />
	                <Tooltip cursor={{ fill: "#f2f7ff" }} />
	              <Bar dataKey="progress" radius={[12, 12, 0, 0]} fill={roleThemes.hr.accent} maxBarSize={44} />
	              </BarChart>
            )}
          </MeasuredChart>
        </Card>
        <Card>
          <SectionTitle icon={AlertTriangle} title="关注状态分布" subtitle="稳定推进、需要支持、重点关注人数占比" />
          <MeasuredChart height={288} minWidth={260} className="flex justify-center">
            {(width, height) => (
              <PieChart width={Math.min(width, 360)} height={height}>
                <Pie data={riskDistributionData} innerRadius={62} outerRadius={94} dataKey="value" paddingAngle={5}>
                  {riskDistributionData.map((item) => <Cell key={item.name} fill={item.color} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            )}
          </MeasuredChart>
          <div className="grid grid-cols-3 gap-2">
	            {riskDistributionData.map((item) => (
	              <div key={item.name} className="rounded-2xl bg-slate-50 p-3 text-center">
	                <p className="text-lg font-bold" style={{ color: item.color }}>{item.value}</p>
	                <p className="text-xs text-slate-500">{attentionLabel[item.name as RiskLevel]}</p>
	              </div>
	            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}

function DataManagementPanel({
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
  const [internForm, setInternForm] = useState<InternFormState>(() => managedInterns[0] ? internToForm(managedInterns[0]) : emptyInternForm());
  const [taskForm, setTaskForm] = useState<TaskFormState>({ title: "", status: "未完成", due: "本周五", owner: "实习生", note: "" });
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
        <SectionTitle icon={LayoutDashboard} title="数据管理中心" subtitle="实习生、成长任务、导师反馈和风险状态都在这里真实增删改查，并持久化保存到本地" />
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
                  {["姓名", "岗位", "导师", "周数", "进度", "状态", "处置", "操作"].map((head) => <th key={head} className="px-3 py-2 font-semibold">{head}</th>)}
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
                ["HRBP 待办", "todo"],
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
                <span className="text-xs font-bold text-slate-500">关注状态</span>
                <select value={internForm.risk} onChange={(event) => setInternForm((current) => ({ ...current, risk: event.target.value as RiskLevel }))} className="mt-1 w-full bg-transparent text-sm font-semibold text-slate-800 outline-none">
                  {(["低风险", "中风险", "高风险"] as RiskLevel[]).map((risk) => <option key={risk} value={risk}>{attentionLabel[risk]}</option>)}
                </select>
              </label>
              <label className="rounded-2xl bg-white/50 px-3 py-2 ring-1 ring-white/60">
                <span className="text-xs font-bold text-slate-500">处置状态</span>
                <select value={internForm.processStatus} onChange={(event) => setInternForm((current) => ({ ...current, processStatus: event.target.value as ProcessStatus }))} className="mt-1 w-full bg-transparent text-sm font-semibold text-slate-800 outline-none">
                  {["待 HR 沟通", "已同步导师", "复盘中", "已关闭"].map((status) => <option key={status}>{status}</option>)}
                </select>
              </label>
            </div>
            <label className="mt-3 block rounded-2xl bg-white/50 px-3 py-2 ring-1 ring-white/60">
              <span className="text-xs font-bold text-slate-500">风险原因</span>
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
                <p className="text-sm font-black text-slate-950">成长任务管理</p>
                <div className="mt-3 grid gap-2">
                  {selected.tasks.map((task) => (
                    <div key={task.id} className="rounded-2xl bg-white/42 p-3">
                      <input value={task.title} onChange={(event) => onUpdateTask(selected.id, task.id, { title: event.target.value })} className="w-full bg-transparent text-sm font-bold text-slate-900 outline-none" />
                      <div className="mt-2 grid gap-2 sm:grid-cols-[1fr_1fr_auto]">
                        <select value={task.status} onChange={(event) => onUpdateTask(selected.id, task.id, { status: event.target.value as TaskStatus })} className="rounded-xl bg-white px-2 py-2 text-xs font-bold text-slate-700 outline-none">
                          {["未完成", "已完成"].map((status) => <option key={status}>{status}</option>)}
                        </select>
                        <input value={task.due} onChange={(event) => onUpdateTask(selected.id, task.id, { due: event.target.value })} className="rounded-xl bg-white px-2 py-2 text-xs font-bold text-slate-700 outline-none" />
                        <Button variant="ghost" className="px-3 py-2 text-xs text-rose-600" onClick={() => onDeleteTask(selected.id, task.id)}>删除</Button>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-3 rounded-2xl border border-[var(--role-border)] bg-[var(--role-soft)] p-3">
                  <input value={taskForm.title} onChange={(event) => setTaskForm((current) => ({ ...current, title: event.target.value }))} placeholder="新增任务名称" className="w-full bg-transparent text-sm font-bold text-slate-900 outline-none" />
                  <div className="mt-2 grid gap-2 sm:grid-cols-3">
                    <select value={taskForm.status} onChange={(event) => setTaskForm((current) => ({ ...current, status: event.target.value as TaskStatus }))} className="rounded-xl bg-white px-2 py-2 text-xs font-bold text-slate-700 outline-none">
                      {["未完成", "已完成"].map((status) => <option key={status}>{status}</option>)}
                    </select>
                    <input value={taskForm.due} onChange={(event) => setTaskForm((current) => ({ ...current, due: event.target.value }))} className="rounded-xl bg-white px-2 py-2 text-xs font-bold text-slate-700 outline-none" />
                    <Button className="px-3 py-2 text-xs" onClick={() => {
                      if (!taskForm.title.trim()) return;
                      onCreateTask(selected.id, taskForm);
                      setTaskForm({ title: "", status: "未完成", due: "本周五", owner: "实习生", note: "" });
                    }}>
                      <Plus className="h-3.5 w-3.5" />
                      添加任务
                    </Button>
                  </div>
                </div>
              </div>

              <div className="glass-panel-soft rounded-3xl p-4">
                <p className="text-sm font-black text-slate-950">导师反馈管理</p>
                <div className="mt-3 grid gap-2">
                  {selected.feedbacks.map((feedback) => (
                    <div key={feedback.id} className="rounded-2xl bg-white/42 p-3">
                      <div className="grid gap-2 sm:grid-cols-[1fr_80px_auto]">
                        <input value={feedback.mentor} onChange={(event) => onUpdateFeedback(selected.id, feedback.id, { mentor: event.target.value })} className="rounded-xl bg-white px-2 py-2 text-xs font-bold text-slate-700 outline-none" />
                        <input type="number" min={1} max={5} value={feedback.score} onChange={(event) => onUpdateFeedback(selected.id, feedback.id, { score: Number(event.target.value) })} className="rounded-xl bg-white px-2 py-2 text-xs font-bold text-slate-700 outline-none" />
                        <Button variant="ghost" className="px-3 py-2 text-xs text-rose-600" onClick={() => onDeleteFeedback(selected.id, feedback.id)}>删除</Button>
                      </div>
                      <textarea value={feedback.content} onChange={(event) => onUpdateFeedback(selected.id, feedback.id, { content: event.target.value })} className="mt-2 min-h-16 w-full resize-none rounded-xl bg-white px-2 py-2 text-sm leading-6 text-slate-700 outline-none" />
                    </div>
                  ))}
                </div>
                <div className="mt-3 rounded-2xl bg-emerald-50 p-3">
                  <div className="grid gap-2 sm:grid-cols-[1fr_90px]">
                    <input value={feedbackForm.mentor} onChange={(event) => setFeedbackForm((current) => ({ ...current, mentor: event.target.value }))} className="rounded-xl bg-white px-2 py-2 text-xs font-bold text-slate-700 outline-none" />
                    <input type="number" min={1} max={5} value={feedbackForm.score} onChange={(event) => setFeedbackForm((current) => ({ ...current, score: Number(event.target.value) }))} className="rounded-xl bg-white px-2 py-2 text-xs font-bold text-slate-700 outline-none" />
                  </div>
                  <textarea value={feedbackForm.content} onChange={(event) => setFeedbackForm((current) => ({ ...current, content: event.target.value }))} placeholder="新增导师反馈" className="mt-2 min-h-16 w-full resize-none rounded-xl bg-white px-2 py-2 text-sm leading-6 text-slate-700 outline-none" />
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
	  const completedFlow = intern.processStatus === "已关闭" ? 5 : intern.processStatus === "复盘中" ? 4 : hasMentorFeedback ? 3 : hasHrToMentor ? 2 : 1;
	  const actionButtons: Array<{ label: string; icon: ElementType; status: CollaborationRecord["status"]; targetRole: "导师" | "HR" }> = [
    {
      label: "生成沟通建议",
      icon: SquarePen,
      status: "已创建",
      targetRole: "HR",
    },
    {
      label: "同步导师",
      icon: UserCheck,
      status: "待处理",
      targetRole: "导师",
    },
    {
      label: "创建复盘提醒",
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
    <Card className="glass-ai-panel h-fit" data-gsap-result="">
      <SectionTitle icon={BrainCircuit} title="AI 需关注分析卡" subtitle={`${intern.name} · ${intern.role}`} />
      <div className="mt-5 space-y-4">
        <div className="glass-panel-soft flex items-center justify-between rounded-2xl p-4">
          <span className="text-sm font-medium text-[#6F6E72]">关注状态</span>
          <span data-risk-badge=""><AttentionBadge risk={intern.risk} /></span>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="glass-panel-soft rounded-2xl p-4">
            <p className="text-xs font-semibold text-[var(--role-accent)]">AI 置信度</p>
            <p className="mt-1 text-2xl font-black text-[#1D0C3B]">{intern.confidence}%</p>
          </div>
          <div className="glass-panel-soft rounded-2xl p-4">
            <p className="text-xs font-semibold text-[#6F6E72]">处置状态</p>
            <p className="mt-2 text-sm font-black text-[#1D0C3B]">{intern.processStatus}</p>
          </div>
        </div>
        <div className="glass-panel-soft rounded-2xl p-4">
          <p className="text-sm font-bold text-[#1D0C3B]">AI 判断依据</p>
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
	          <p className="text-sm font-bold text-[#1D0C3B]">规则触发与人工确认</p>
	          <div className="mt-3 grid gap-2">
	            {[
	              ["规则触发", intern.risk === "高风险" ? "连续延期 + 低完成度 + 导师负向反馈" : intern.risk === "中风险" ? "完成度波动 + 单项能力需补强" : "完成稳定 + 可加挑战任务"],
	              ["AI 解释", "归因和建议仅来自上方证据，不直接生成留用/淘汰结论"],
	              ["人工确认", "HR 或导师点击同步后才进入协同流"],
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
        <InfoBlock title="可能原因" text={intern.possibleCause} />
        <InfoBlock title="建议 HR 动作" text={intern.hrAction.replace("高风险", "重点关注")} />
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
	          <p className="text-sm font-bold text-[#1D0C3B]">干预闭环状态</p>
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
          <p className="mt-1 text-xs text-[#6F6E72]">展示导师同步给 HRBP、HRBP 同步给导师的最新记录。</p>
          <div className="mt-3 space-y-2">
            {relatedRecords.length > 0 ? (
              relatedRecords.slice(0, 4).map((record) => (
                <div key={record.id} className="rounded-xl bg-white/42 px-3 py-2">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-xs font-black text-slate-800">{record.title}</p>
                    <span className="shrink-0 rounded-full bg-white px-2 py-0.5 text-[11px] font-bold text-[var(--role-accent)]">{record.sourceRole} → {record.targetRole}</span>
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
            <p className="text-xs font-semibold text-[var(--role-accent)]">是否需要同步导师</p>
            <p className="mt-1 text-sm font-bold text-[#1D0C3B]">{intern.syncMentor.replace("强制", "主动")}</p>
          </div>
          <div className="rounded-2xl border border-[#C25055]/15 bg-[#C25055]/10 p-4">
            <p className="text-xs font-semibold text-[#C25055]">一周后复盘提醒</p>
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

function HrRiskPanel({
  records,
  onAddRecord,
  managedInterns,
}: {
  records: CollaborationRecord[];
  onAddRecord: (record: Omit<CollaborationRecord, "id" | "createdAt">) => void;
  managedInterns: ManagedIntern[];
}) {
  const currentInterns = useMemo(() => managedInterns.map(managedToIntern), [managedInterns]);
  const [selectedName, setSelectedName] = useState(currentInterns[0]?.name ?? "");
  const [riskFilter, setRiskFilter] = useState<RiskLevel | "全部">("全部");
  const filteredInterns = riskFilter === "全部" ? currentInterns : currentInterns.filter((intern) => intern.risk === riskFilter);
  const selected = currentInterns.find((intern) => intern.name === selectedName) ?? currentInterns[0];
  const selectedVisible = selected ? filteredInterns.some((intern) => intern.name === selected.name) : false;
  const visibleSelected = selectedVisible ? selected : filteredInterns[0] ?? currentInterns[0];

  return (
    <div className="grid gap-5 2xl:grid-cols-[1fr_390px]">
      <Card className="glass-panel overflow-hidden">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <SectionTitle icon={Users} title={`${managedInterns.length} 人成长关注看板`} subtitle="点击任意实习生查看 AI 可解释信号和建议动作" />
          <div className="flex flex-wrap gap-2">
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
          </div>
        </div>
        <p className="mt-4 rounded-2xl border border-white/45 bg-white/42 px-4 py-3 text-sm font-semibold text-[#6F6E72]">
          当前筛选出 {filteredInterns.length} 名实习生，已选中 {visibleSelected?.name ?? "暂无"}。
        </p>
        <div className="mt-5 overflow-x-auto">
          <table className="app-table w-full min-w-[980px] text-left text-sm">
            <thead>
              <tr className="text-xs text-slate-500">
                {["姓名", "岗位", "入职周数", "成长进度", "关注状态", "处置状态", "AI 判断原因", "HRBP 待办"].map((head) => (
                  <th key={head} className="px-3 py-2 font-semibold">{head}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredInterns.map((intern) => (
                <tr
                  key={intern.name}
                  onClick={() => setSelectedName(intern.name)}
                  aria-selected={visibleSelected?.name === intern.name}
                  className={cn("glass-table-row cursor-pointer transition", visibleSelected?.name === intern.name && "bg-[var(--role-soft)]")}
                >
                  <td className="rounded-l-2xl px-3 py-4 font-bold text-slate-950">{intern.name}</td>
                  <td className="px-3 py-4 text-slate-600">{intern.role}</td>
                  <td className="px-3 py-4 text-slate-600">{intern.week}</td>
                  <td className="px-3 py-4">
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-20 rounded-full bg-slate-200">
                        <div className="h-2 rounded-full bg-[#31B88A]" data-progress-fill="" style={{ width: `${intern.progress}%` }} />
                      </div>
                      <span className="font-semibold text-slate-700">{intern.progress}%</span>
                    </div>
                  </td>
                  <td className="px-3 py-4"><AttentionBadge risk={intern.risk} /></td>
                  <td className="px-3 py-4">
                    <span className="rounded-full bg-white px-3 py-1 text-xs font-bold text-slate-600 ring-1 ring-slate-200">{intern.processStatus}</span>
                  </td>
                  <td className="px-3 py-4 text-slate-600">{intern.reason}</td>
                  <td className="rounded-r-2xl px-3 py-4 text-slate-600">{intern.todo}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
      {visibleSelected && <RiskCard key={visibleSelected.name} intern={visibleSelected} records={records} onAddRecord={onAddRecord} />}
    </div>
  );
}

function ReportModule({ records, managedInterns }: { records: CollaborationRecord[]; managedInterns: ManagedIntern[] }) {
  const reportRef = useRef<HTMLDivElement | null>(null);
  const [visible, setVisible] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [copied, setCopied] = useState(false);
  const [report, setReport] = useState("");
  const [reportError, setReportError] = useState("");
  const [reportMessage, setReportMessage] = useState("");
  const generateReport = async () => {
    setGenerating(true);
    setVisible(false);
    setCopied(false);
    setReportError("");
    setReportMessage("");
    try {
      const result = await requestAiGeneration<AIReport>("report", {
        summary: {
	          totalInterns: managedInterns.length,
	          averageProgress: `${getAverageProgress(managedInterns)}%`,
	          priorityAttentionCount: managedInterns.filter((intern) => intern.risk === "高风险").length,
	          mentorFeedbackRate: `${getMentorFeedbackRate(managedInterns)}%`,
	          currentWeek: "第 3 周",
	          department: "游戏业务部",
        },
        roleProgress: getRoleProgressData(managedInterns),
        riskDistribution: getRiskDistributionData(managedInterns),
        managedInterns,
        interns: managedInterns.map(managedToIntern),
        collaborationRecords: records,
      });
      setReport(result.output.report);
      setVisible(true);
      setReportMessage("适岗周报已生成，可复制到周会材料。");
    } catch (error) {
      setReportError(error instanceof Error ? error.message : "AI 生成失败，请稍后重试。");
    } finally {
      setGenerating(false);
    }
  };
  const copyReport = async () => {
    await navigator.clipboard.writeText(report);
    setCopied(true);
    setReportMessage("周报已复制。");
  };

  useResultReveal(reportRef, [visible, generating, copied, reportMessage], "[data-gsap-result]");

  return (
    <div ref={reportRef}>
    <Card id="report" className="glass-panel">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <SectionTitle icon={FileText} title="适岗周报生成模块" subtitle="汇总成长状态、关注原因和下周动作" />
        <Button onClick={generateReport} disabled={generating}>
          {generating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
          {generating ? "AI 正在分析..." : visible ? "重新生成周报" : "一键生成本周适岗周报"}
        </Button>
      </div>
      {reportMessage && <FeedbackNotice tone="success" className="mt-4" data-gsap-result="">{reportMessage}</FeedbackNotice>}
      {generating ? (
        <div className="glass-panel-soft mt-5 rounded-3xl p-6" data-gsap-result="">
          <div className="flex items-center gap-3 text-sm font-bold text-[var(--role-accent)]">
            <Loader2 className="h-5 w-5 animate-spin" />
            AI 正在汇总关注状态、导师反馈和下周动作...
          </div>
          <div className="mt-4 space-y-3">
            <div className="h-3 w-2/3 animate-pulse rounded-full bg-[var(--role-soft)]" />
            <div className="h-3 w-full animate-pulse rounded-full bg-[var(--role-soft)]" />
            <div className="h-3 w-5/6 animate-pulse rounded-full bg-[var(--role-soft)]" />
          </div>
        </div>
      ) : reportError ? (
        <div className="mt-5 rounded-3xl bg-rose-50 px-5 py-4 text-sm font-bold text-rose-700" data-gsap-result="">
          {reportError}
        </div>
      ) : visible ? (
        <div className="glass-panel-soft mt-5 rounded-3xl p-5" data-gsap-result="">
          <div className="flex flex-col gap-3 border-b border-[#C1B5C2]/30 pb-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm font-bold text-[var(--role-accent)]">已生成适岗周报，可复制到周会材料或招聘同步记录。</p>
            <Button variant="ghost" className="px-3 py-2" onClick={copyReport}>
              <Copy className="h-4 w-4" />
              {copied ? "已复制" : "复制周报"}
            </Button>
          </div>
          <div className="mt-4 whitespace-pre-line text-sm leading-7 text-slate-700" data-gsap-result="">
            {report}
          </div>
        </div>
      ) : (
        <div className="mt-5 rounded-3xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center text-sm text-slate-500">
          点击按钮后，这里会生成面向 HR 和招聘同学的本周适岗情况周报。
        </div>
      )}
    </Card>
    </div>
  );
}

function HRDashboard({
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
}: {
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
}) {
  const mentorFeedbackRate = getMentorFeedbackRate(managedInterns);
  const normalCount = managedInterns.filter((intern) => intern.risk === "低风险").length;
  const attentionCount = managedInterns.filter((intern) => intern.risk !== "低风险").length;
  const highPotentialCount = managedInterns.filter((intern) => intern.risk === "低风险" && intern.progress >= 80).length;
  const pendingHrReview = managedInterns.filter((intern) => intern.processStatus === "待 HR 沟通").length;
  const pendingMentorSync = managedInterns.filter((intern) => intern.risk !== "低风险" && intern.processStatus !== "已同步导师").length;
  const inReview = managedInterns.filter((intern) => intern.processStatus === "复盘中").length;
  const priorityQueue = [
    { label: "待 HR 沟通", value: `${pendingHrReview} 人`, detail: "优先约谈重点关注同学并确认支持卡点", tone: "rose" },
    { label: "待同步导师", value: `${pendingMentorSync} 人`, detail: "把 AI 关注证据转成导师可执行辅导动作", tone: "amber" },
    { label: "复盘中", value: `${inReview} 人`, detail: "检查一周改善动作是否完成", tone: "blue" },
    { label: "高潜加压", value: `${highPotentialCount} 人`, detail: "推动导师安排挑战任务验证上限", tone: "green" },
  ];

  return (
	    <div className="space-y-6">
	      <Dashboard managedInterns={managedInterns} />
        <DataManagementPanel
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
        <Card className="glass-panel">
          <SectionTitle icon={ClipboardList} title="今日处理队列" subtitle="HRBP 先处理动作，再查看说明和汇总材料" />
          <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            {priorityQueue.map((item) => (
              <div key={item.label} className="glass-panel-soft rounded-2xl p-4">
                <p className="text-xs font-bold text-[#6F6E72]">{item.label}</p>
                <p className="mt-2 text-2xl font-black text-[#1D0C3B]">{item.value}</p>
                <p className={cn(
                  "mt-2 text-sm font-semibold leading-6",
                  item.tone === "rose" && "text-rose-700",
                  item.tone === "amber" && "text-amber-700",
                  item.tone === "blue" && "text-[var(--role-accent)]",
                  item.tone === "green" && "text-emerald-700",
                )}>
                  {item.detail}
                </p>
              </div>
            ))}
          </div>
        </Card>
	      <div className="grid gap-5 xl:grid-cols-[1fr_1fr]">
        <Card className="glass-panel">
          <SectionTitle icon={LayoutDashboard} title="批次运营总览" subtitle="HRBP 先看整体状态，再进入个人关注卡处理" />
          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            {[
              ["正常成长", `${normalCount} 人`, "按当前节奏推进"],
              ["需关注", `${attentionCount} 人`, "需要导师或 HRBP 介入"],
              ["高潜观察", `${highPotentialCount} 人`, "适合安排挑战任务"],
            ].map(([label, value, detail]) => (
              <div key={label} className="glass-panel-soft rounded-2xl p-4">
                <p className="text-xs font-bold text-[#6F6E72]">{label}</p>
                <p className="mt-2 text-2xl font-black text-[#1D0C3B]">{value}</p>
                <p className="mt-1 text-xs font-semibold text-[var(--role-accent)]">{detail}</p>
              </div>
            ))}
          </div>
          <div className="glass-panel-soft mt-5 rounded-2xl p-4">
            <div className="flex items-center justify-between">
              <p className="text-sm font-black text-[#1D0C3B]">导师反馈完成率</p>
              <span className="text-sm font-black text-[var(--role-accent)]">{mentorFeedbackRate}%</span>
            </div>
            <div className="mt-3 h-2 rounded-full bg-slate-200">
              <div className="h-2 rounded-full bg-[#31B88A]" data-progress-fill="" style={{ width: `${mentorFeedbackRate}%` }} />
            </div>
            <p className="mt-3 text-sm leading-6 text-slate-600">未完成反馈会进入导师待办，HRBP 不需要逐个私聊追问。</p>
          </div>
        </Card>
        <Card className="glass-ai-panel">
          <SectionTitle icon={Bot} title="AI 批次助手" subtitle="把分散的任务、反馈和关注信号整理成可执行动作" />
          <div className="mt-5 space-y-3">
            {[
              "优先推动 2 位超过 10 天未反馈的导师补齐阶段评价。",
              "对 3 位重点关注实习生发起 HRBP 与导师联合复盘。",
              "销售岗整体客户场景训练不足，建议下周安排一次集中演练。",
            ].map((item) => (
              <div key={item} className="flex gap-3 rounded-2xl bg-white/42 p-4 text-sm font-semibold leading-6 text-[#6F6E72]">
                <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-[var(--role-accent)]" />
                {item}
              </div>
            ))}
          </div>
        </Card>
      </div>
      <HrRiskPanel records={records} onAddRecord={onAddRecord} managedInterns={managedInterns} />
      <ReportModule records={records} managedInterns={managedInterns} />
      <RecruiterDashboard records={records} managedInterns={managedInterns} />
      <div className="grid gap-5 xl:grid-cols-2">
        <AiReliabilityPanel compact />
        <PermissionBoundary />
      </div>
      <MvpScopePanel />
    </div>
  );
}

function RecruiterDashboard({ records, managedInterns }: { records: CollaborationRecord[]; managedInterns: ManagedIntern[] }) {
  const [copied, setCopied] = useState(false);
  const currentInterns = managedInterns.map(managedToIntern);
  const currentRoleProgress = getRoleProgressData(managedInterns);
  const retentionReady = managedInterns.filter((intern) => intern.risk === "低风险" && intern.progress >= 75).length;
  const watchList = managedInterns.filter((intern) => intern.risk === "中风险").length;
  const urgentRisk = managedInterns.filter((intern) => intern.risk === "高风险").length;
  const retentionCandidates = currentInterns
    .filter((intern) => intern.risk === "低风险" && intern.progress >= 75)
    .sort((a, b) => b.progress - a.progress);
  const watchCandidates = currentInterns
    .filter((intern) => intern.risk !== "低风险")
    .sort((a, b) => (a.risk === "高风险" ? -1 : 1) - (b.risk === "高风险" ? -1 : 1) || a.progress - b.progress);
  const recruiterBrief = `招聘效能摘要：${recruiterSummary.batch} 共 ${managedInterns.length} 人。可进入留用观察池 ${retentionReady} 人，需继续观察 ${watchList} 人，需 HRBP 先复盘 ${urgentRisk} 人。${recruiterSummary.hiringSignal}`;

  const copyBrief = async () => {
    await navigator.clipboard.writeText(recruiterBrief);
    setCopied(true);
  };

  return (
    <div className="space-y-6">
      <Card className="glass-panel">
        <SectionTitle icon={TrendingUp} title="招聘效能复盘模块" subtitle="嵌入 HRBP 成长运营台，供 TA/校招团队低频复盘使用，不参与日常带教管理" />
        <div className="mt-5 grid gap-3 md:grid-cols-3">
          {[
            ["看整体质量", "这批人入职后是否稳定适岗，哪些岗位需要继续观察。"],
            ["看留用信号", "提前识别表现稳定、高进度的同学，关注后续留用意愿。"],
            ["看画像反哺", "把适岗差异回流到筛选标准、面试题和入职前学习包。"],
          ].map(([title, detail]) => (
            <div key={title} className="glass-panel-soft rounded-2xl p-4">
              <p className="font-black text-slate-950">{title}</p>
              <p className="mt-2 text-sm leading-6 text-slate-600">{detail}</p>
            </div>
          ))}
        </div>
      </Card>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard label="批次人数" value={String(managedInterns.length)} icon={Users} tone="blue" />
        <StatCard label="留用观察池" value={`${retentionReady} 人`} icon={ShieldCheck} tone="green" />
        <StatCard label="继续观察" value={`${watchList} 人`} icon={Clock3} tone="amber" />
        <StatCard label="HRBP 先复盘" value={`${urgentRisk} 人`} icon={AlertTriangle} tone="rose" />
      </div>

      <div className="grid gap-5 xl:grid-cols-[1.15fr_0.85fr]">
        <Card className="glass-panel">
          <SectionTitle icon={TrendingUp} title="岗位适岗趋势" subtitle="只看汇总趋势和留用信号，不介入带教操作" />
          <MeasuredChart height={280}>
            {(width, height) => (
	              <BarChart width={width} height={height} data={currentRoleProgress} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
	                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e8eef7" />
	                <XAxis dataKey="role" axisLine={false} tickLine={false} />
	                <YAxis axisLine={false} tickLine={false} domain={[0, 100]} />
	                <Tooltip cursor={{ fill: "#f2f7ff" }} />
	                <Bar dataKey="progress" radius={[12, 12, 0, 0]} fill={roleThemes.hr.accent} maxBarSize={44} />
	              </BarChart>
            )}
          </MeasuredChart>
        </Card>

        <Card className="glass-panel">
          <SectionTitle icon={FileText} title="招聘效能摘要" subtitle="可复制到招聘复盘会或校招项目群" />
          <p className="mt-5 rounded-3xl bg-white/45 p-4 text-sm leading-7 text-slate-700">{recruiterBrief}</p>
          <div className="mt-4 flex flex-wrap gap-3">
            <Button onClick={copyBrief}>
              <Copy className="h-4 w-4" />
              {copied ? "已复制摘要" : "复制摘要"}
            </Button>
            <span className="rounded-[10px] bg-white/50 px-3 py-2 text-xs font-bold text-[var(--role-accent)] ring-1 ring-white/60">
              已合并 {records.length} 条跨端协同记录
            </span>
          </div>
        </Card>
      </div>

      <Card className="glass-panel">
        <SectionTitle icon={Target} title="招聘画像反哺" subtitle="把入职后的适岗信号回流到校招筛选和面试题设计" />
        <div className="mt-5 grid gap-3 xl:grid-cols-3">
          {hiringFeedbackLoops.map((item) => (
            <div key={item.segment} className="glass-panel-soft rounded-2xl p-4">
              <div className="flex items-start justify-between gap-3">
                <p className="font-black text-slate-950">{item.segment}</p>
                <span className="shrink-0 rounded-[10px] bg-white/50 px-2.5 py-1 text-xs font-black text-[var(--role-accent)] ring-1 ring-white/60">
                  置信度{item.confidence}
                </span>
              </div>
              <p className="mt-3 text-xs font-bold text-[var(--role-accent)]">适岗信号</p>
              <p className="mt-1 text-sm leading-6 text-slate-700">{item.signal}</p>
              <p className="mt-3 text-xs font-bold text-emerald-700">反哺建议</p>
              <p className="mt-1 text-sm leading-6 text-slate-700">{item.suggestion}</p>
            </div>
          ))}
        </div>
      </Card>

      <Card className="glass-panel">
        <SectionTitle icon={ShieldCheck} title="适岗观察原则" subtitle="模块只展示趋势和证据摘要，不展示完整私聊与过程明细" />
        <div className="mt-5 grid gap-3 md:grid-cols-3">
          {[
            ["上升", "状态稳定、高进度、导师反馈稳定", "进入留用观察池"],
            ["平稳", "任务推进正常，但仍需补充一次阶段验证", "继续观察 2 周"],
            ["下降", "连续延期、反馈缺失或岗位理解不足", "先由 HRBP 与导师复盘"],
          ].map(([trend, signal, action]) => (
            <div key={trend} className="glass-panel-soft rounded-2xl p-4">
              <p className="text-lg font-black text-slate-950">趋势：{trend}</p>
              <p className="mt-3 text-xs font-bold text-[var(--role-accent)]">判断信号</p>
              <p className="mt-1 text-sm leading-6 text-slate-700">{signal}</p>
              <p className="mt-3 text-xs font-bold text-emerald-700">建议动作</p>
              <p className="mt-1 text-sm leading-6 text-slate-700">{action}</p>
            </div>
          ))}
        </div>
      </Card>

      <div className="grid gap-5 xl:grid-cols-2">
        <Card className="glass-panel">
          <SectionTitle icon={UserCheck} title="留用观察池" subtitle="状态稳定且进度较高，建议招聘提前关注留用意愿" />
          <div className="mt-5 grid gap-3">
            {retentionCandidates.map((intern) => (
              <div key={intern.name} className="rounded-2xl border border-emerald-100 bg-emerald-50/50 p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="font-black text-slate-950">{intern.name}｜{intern.role}岗</p>
                    <p className="mt-1 text-sm text-slate-600">{intern.mentorFeedback}</p>
                  </div>
                  <span className="rounded-full bg-white px-3 py-1 text-sm font-black text-emerald-700">{intern.progress}%</span>
                </div>
                <p className="mt-3 text-sm leading-6 text-slate-600">复盘动作：提前进入留用意愿观察，结合导师终期评价判断是否发起留用沟通。</p>
              </div>
            ))}
          </div>
        </Card>

        <Card className="glass-panel">
          <SectionTitle icon={AlertTriangle} title="继续观察名单" subtitle="需支持同学由 HR 和导师先完成改善闭环" />
          <div className="mt-5 grid gap-3">
            {watchCandidates.slice(0, 8).map((intern) => (
              <div key={intern.name} className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="font-black text-slate-950">{intern.name}｜{intern.role}岗</p>
                    <p className="mt-1 text-sm text-slate-600">{intern.reason}</p>
                  </div>
                  <AttentionBadge risk={intern.risk} />
                </div>
                <p className="mt-3 text-sm leading-6 text-slate-600">复盘判断：暂不推进留用沟通，等待 HRBP 复盘结果和导师下一轮反馈。</p>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}

function AdminDashboard({
  managedInterns,
  records,
  onResetDemo,
}: {
  managedInterns: ManagedIntern[];
  records: CollaborationRecord[];
  onResetDemo: () => void;
}) {
  const roleCards = [
    { name: "实习生成长端", owner: "实习生本人", permission: "只看个人成长路径、任务、导师反馈和问答记录" },
    { name: "导师带教端", owner: "业务导师", permission: "只管理自己负责的实习生、任务反馈和问题回复" },
    { name: "HRBP 成长运营台", owner: "HRBP / 项目运营", permission: "管理本批次实习生、风险状态、任务、反馈和周报" },
    { name: "招聘效能复盘模块", owner: "校招/TA 团队", permission: "嵌入 HRBP 成长运营台，只读查看适岗趋势、留用观察和画像反哺建议" },
    { name: "系统管理后台", owner: "系统管理员 / 项目 Owner", permission: "维护账号、权限、批次、岗位模板和基础数据配置" },
  ];
  const batchConfig = [
    ["当前批次", "2026 夏令营实习生批次"],
    ["数据范围", `${managedInterns.length} 名实习生，${records.length} 条协同记录`],
    ["持久化方式", "浏览器 localStorage 本地保存"],
    ["AI 生成策略", "规则先判定、证据再生成、人工确认后同步"],
  ];
  const templateConfig = Object.entries(positionGrowthStages).map(([role, stages]) => ({
    role,
    stages: stages.length,
    tasks: stages.reduce((sum, stage) => sum + stage.tasks.length, 0),
  }));

  return (
    <div className="space-y-6">
      <Card className="border-[var(--role-border)] bg-gradient-to-br from-white via-white to-emerald-50">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <SectionTitle icon={LockKeyhole} title="系统管理后台" subtitle="统一管理账号角色、权限边界、批次配置、岗位模板和基础数据" />
          <Button variant="ghost" onClick={onResetDemo}>
            <RotateCcw className="h-4 w-4" />
            重置全部演示数据
          </Button>
        </div>
        <div className="mt-5 grid gap-3 md:grid-cols-4">
          {[
            ["系统用户", `${mockUsers.length} 个`],
            ["实习生数据", `${managedInterns.length} 人`],
            ["协同记录", `${records.length} 条`],
            ["岗位模板", `${templateConfig.length} 套`],
          ].map(([label, value]) => (
            <div key={label} className="rounded-2xl bg-white p-4 ring-1 ring-[var(--role-border)]">
              <p className="text-xs font-bold text-slate-500">{label}</p>
              <p className="mt-2 text-2xl font-black text-slate-950">{value}</p>
            </div>
          ))}
        </div>
      </Card>

      <div className="grid gap-5 xl:grid-cols-[1.25fr_0.75fr]">
        <Card>
          <SectionTitle icon={Users} title="账号、端口与模块权限" subtitle="高频角色保留为端口，低频协作方收敛为模块，系统后台负责统一配置与审计" />
          <div className="mt-5 overflow-x-auto">
            <table className="app-table w-full min-w-[760px] text-left text-sm">
              <thead>
                <tr className="text-xs text-slate-500">
                  {["端口/模块", "负责人", "权限说明"].map((head) => <th key={head} className="px-3 py-2 font-semibold">{head}</th>)}
                </tr>
              </thead>
              <tbody>
                {roleCards.map((role) => (
                  <tr key={role.name} className="bg-slate-50">
                    <td className="rounded-l-2xl px-3 py-4 font-black text-slate-950">{role.name}</td>
                    <td className="px-3 py-4 font-semibold text-[var(--role-accent)]">{role.owner}</td>
                    <td className="rounded-r-2xl px-3 py-4 text-slate-600">{role.permission}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        <Card>
          <SectionTitle icon={ClipboardList} title="批次与数据配置" subtitle="当前为本地产品原型配置，后续可接企业数据库" />
          <div className="mt-5 grid gap-3">
            {batchConfig.map(([label, value]) => (
              <div key={label} className="rounded-2xl bg-slate-50 p-4">
                <p className="text-xs font-bold text-slate-500">{label}</p>
                <p className="mt-1 font-black text-slate-950">{value}</p>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <Card>
        <SectionTitle icon={GraduationCap} title="岗位成长路径模板" subtitle="系统后台维护标准模板，HRBP 可基于模板生成批次成长任务" />
        <div className="mt-5 grid gap-3 md:grid-cols-4">
          {templateConfig.map((template) => (
            <div key={template.role} className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
              <p className="text-lg font-black text-slate-950">{template.role}岗模板</p>
              <div className="mt-4 grid grid-cols-2 gap-2">
                <div className="rounded-xl bg-white p-3">
                  <p className="text-xs font-bold text-slate-500">阶段</p>
                  <p className="mt-1 text-xl font-black text-[var(--role-accent)]">{template.stages}</p>
                </div>
                <div className="rounded-xl bg-white p-3">
                  <p className="text-xs font-bold text-slate-500">任务</p>
                  <p className="mt-1 text-xl font-black text-emerald-700">{template.tasks}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

function App() {
  const { user, login: persistLogin, logout: clearAuth } = useAuth();
  const [collaborationRecords, setCollaborationRecords] = useState<CollaborationRecord[]>(() => readCollaborationRecords());
  const { managedInterns, setManagedInterns, updateManagedInterns } = useInterns(seedManagedInterns);
  const [toast, setToast] = useState<{ tone: "success" | "error" | "info" | "warning"; message: string } | null>(null);
  const [path, setPath] = useState<Path>(() => {
    const storedUser = readStoredUser();
    const current = window.location.pathname as Path;
    if (current === "/" || current === "/preview-theme" || current === "/login") return current;
    if (!storedUser) {
      window.history.replaceState({}, "", "/login");
      return "/login";
    }
    const targetPath = rolePath[storedUser.role];
    if (current !== targetPath) {
      window.history.replaceState({}, "", targetPath);
      return targetPath;
    }
    return current;
  });

  const navigate = (nextPath: Path) => {
    window.history.pushState({}, "", nextPath);
    setPath(nextPath);
  };

  const showToast = (tone: "success" | "error" | "info" | "warning", message: string) => {
    setToast({ tone, message });
    window.setTimeout(() => setToast(null), 2600);
  };

  useEffect(() => {
    const onPop = () => {
      const storedUser = readStoredUser();
      const current = window.location.pathname as Path;
      if (current === "/" || current === "/preview-theme" || current === "/login") {
        setPath(current);
        return;
      }
      const targetPath = storedUser ? rolePath[storedUser.role] : "/login";
      if (window.location.pathname !== targetPath) {
        window.history.replaceState({}, "", targetPath);
      }
      setPath(targetPath);
    };
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  const login = (nextUser: AuthUser) => {
    persistLogin(nextUser);
    navigate(rolePath[nextUser.role]);
    showToast("success", `已进入${roleName[nextUser.role]}，权限边界已按角色加载。`);
  };

  const logout = () => {
    clearAuth();
    navigate("/login");
    showToast("info", "已退出登录。未登录访问工作台会自动回到登录页。");
  };

  const addCollaborationRecord = (record: Omit<CollaborationRecord, "id" | "createdAt">) => {
    const nextRecord: CollaborationRecord = {
      ...record,
      id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
      createdAt: "刚刚",
    };
    setCollaborationRecords((current) => {
      const next = [nextRecord, ...current].slice(0, 20);
      localStorage.setItem(collaborationStorageKey, JSON.stringify(next));
      return next;
    });
    showToast("success", "协同记录已同步，相关角色端会立即看到更新。");
  };

  const updateCollaborationRecord = (id: string, patch: Partial<CollaborationRecord>) => {
    setCollaborationRecords((current) => {
      const next = current.map((record) => record.id === id ? { ...record, ...patch } : record);
      localStorage.setItem(collaborationStorageKey, JSON.stringify(next));
      return next;
    });
    showToast("success", "协同记录已更新。");
  };

  const resetDemoData = () => {
    localStorage.removeItem(collaborationStorageKey);
    localStorage.removeItem(managedInternStorageKey);
    setCollaborationRecords([]);
    setManagedInterns(seedManagedInterns());
    showToast("info", "演示数据已重置为初始状态。");
  };

  const createManagedIntern = (form: InternFormState) => {
    const timestamp = nowLabel();
    const nextIntern: ManagedIntern = {
      id: createId("intern"),
      name: form.name.trim(),
      role: form.role,
      title: form.title,
      department: form.department,
      mentor: form.mentor,
      week: form.week,
      progress: Math.max(0, Math.min(100, Number(form.progress))),
      risk: form.risk,
      reason: form.reason,
      todo: form.todo,
      processStatus: form.processStatus,
      riskTags: form.riskTagsText.split(/[、,，]/).map((tag) => tag.trim()).filter(Boolean),
      tasks: [],
      feedbacks: [],
      createdAt: timestamp,
      updatedAt: timestamp,
    };
    updateManagedInterns((current) => [nextIntern, ...current]);
    showToast("success", `已新增实习生 ${nextIntern.name}。`);
  };

  const updateManagedIntern = (id: string, patch: ManagedInternPatch) => {
    updateManagedInterns((current) =>
      current.map((intern) => intern.id === id ? { ...intern, ...patch, updatedAt: nowLabel() } : intern),
    );
    showToast("success", "实习生信息已保存。");
  };

  const deleteManagedIntern = (id: string) => {
    const target = managedInterns.find((intern) => intern.id === id);
    if (!target || !window.confirm(`确认删除 ${target.name} 吗？相关任务和反馈也会从本地演示数据中移除。`)) return;
    updateManagedInterns((current) => current.filter((intern) => intern.id !== id));
    showToast("warning", `已删除 ${target.name}。`);
  };

  const createTask = (internId: string, form: TaskFormState) => {
    const task: GrowthTask = { ...form, id: createId("task") };
    updateManagedInterns((current) =>
      current.map((intern) => intern.id === internId ? { ...intern, tasks: [task, ...intern.tasks], updatedAt: nowLabel() } : intern),
    );
    showToast("success", "成长任务已添加。");
  };

  const updateTask = (internId: string, taskId: string, patch: Partial<GrowthTask>) => {
    updateManagedInterns((current) =>
      current.map((intern) => intern.id === internId ? { ...intern, tasks: intern.tasks.map((task) => task.id === taskId ? { ...task, ...patch } : task), updatedAt: nowLabel() } : intern),
    );
    if (patch.status === "已完成") showToast("success", "任务状态已更新，相关看板已重新计算。");
  };

  const deleteTask = (internId: string, taskId: string) => {
    if (!window.confirm("确认删除这条成长任务吗？")) return;
    updateManagedInterns((current) =>
      current.map((intern) => intern.id === internId ? { ...intern, tasks: intern.tasks.filter((task) => task.id !== taskId), updatedAt: nowLabel() } : intern),
    );
    showToast("warning", "成长任务已删除。");
  };

  const createFeedback = (internId: string, form: FeedbackFormState) => {
    const feedback: MentorFeedbackRecord = { ...form, id: createId("feedback"), createdAt: nowLabel() };
    updateManagedInterns((current) =>
      current.map((intern) => intern.id === internId ? { ...intern, feedbacks: [feedback, ...intern.feedbacks], updatedAt: nowLabel() } : intern),
    );
    showToast("success", "导师反馈已保存，并同步到 HR/学生端视图。");
  };

  const updateFeedback = (internId: string, feedbackId: string, patch: Partial<MentorFeedbackRecord>) => {
    updateManagedInterns((current) =>
      current.map((intern) => intern.id === internId ? { ...intern, feedbacks: intern.feedbacks.map((feedback) => feedback.id === feedbackId ? { ...feedback, ...patch } : feedback), updatedAt: nowLabel() } : intern),
    );
    showToast("success", "导师反馈已更新。");
  };

  const deleteFeedback = (internId: string, feedbackId: string) => {
    if (!window.confirm("确认删除这条导师反馈吗？")) return;
    updateManagedInterns((current) =>
      current.map((intern) => intern.id === internId ? { ...intern, feedbacks: intern.feedbacks.filter((feedback) => feedback.id !== feedbackId), updatedAt: nowLabel() } : intern),
    );
    showToast("warning", "导师反馈已删除。");
  };

  const title = useMemo(() => {
    if (!user) return "";
    if (user.role === "student") return "实习生成长端｜我的成长地图";
    if (user.role === "mentor") return "导师带教端｜带教任务与反馈助手";
    if (user.role === "hr") return "HRBP 成长运营台｜批次管理与协同复盘";
    return "系统管理后台｜权限、批次与模板配置";
  }, [user]);

  if (path === "/") {
    return <HomePage onNavigate={navigate} />;
  }

  if (path === "/preview-theme") {
    return <ThemePreviewPage />;
  }

  if (path === "/login" || !user) {
    return <LoginPage onLogin={login} />;
  }

  return (
    <AppLayout user={user} title={title} onLogout={logout} onResetDemo={resetDemoData}>
      {toast && (
        <div className="fixed right-5 top-20 z-[80] w-[min(360px,calc(100vw-40px))]">
          <FeedbackNotice tone={toast.tone} className="shadow-[0_18px_42px_rgba(15,23,42,0.14)]">
            {toast.message}
          </FeedbackNotice>
        </div>
      )}
      {user.role === "student" && <StudentDashboard user={user} records={collaborationRecords} onAddRecord={addCollaborationRecord} managedInterns={managedInterns} onUpdateTask={updateTask} />}
      {user.role === "mentor" && <MentorDashboard user={user} records={collaborationRecords} onAddRecord={addCollaborationRecord} onUpdateRecord={updateCollaborationRecord} managedInterns={managedInterns} onCreateFeedback={createFeedback} />}
      {user.role === "hr" && (
        <HRDashboard
          records={collaborationRecords}
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
        />
      )}
      {user.role === "admin" && <AdminDashboard records={collaborationRecords} managedInterns={managedInterns} onResetDemo={resetDemoData} />}
    </AppLayout>
  );
}

export default App;
