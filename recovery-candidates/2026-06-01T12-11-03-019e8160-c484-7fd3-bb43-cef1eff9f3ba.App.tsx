import { useEffect, useMemo, useRef, useState } from "react";
import type { ElementType, HTMLAttributes, ReactNode } from "react";
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

type AuthUser = Omit<MockUser, "password">;
type Path = "/login" | "/student" | "/mentor" | "/hr" | "/admin";
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

const riskClass: Record<RiskLevel, string> = {
  低风险: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  中风险: "bg-amber-50 text-amber-700 ring-amber-200",
  高风险: "bg-rose-50 text-rose-700 ring-rose-200",
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

function readManagedInterns(): ManagedIntern[] {
  try {
    const raw = localStorage.getItem(managedInternStorageKey);
    return raw ? (JSON.parse(raw) as ManagedIntern[]) : seedManagedInterns();
  } catch {
    return seedManagedInterns();
  }
}

function persistManagedInterns(next: ManagedIntern[]) {
  localStorage.setItem(managedInternStorageKey, JSON.stringify(next));
}

function managedToIntern(intern: ManagedIntern): Intern {
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
    evidence: [
      `${intern.role}岗任务完成度为 ${intern.progress}%`,
      `导师反馈：${feedback}`,
      `近期信号：${intern.reason || "暂无"}`,
    ],
    evidenceMetrics: [
      { label: "任务完成度", value: `${intern.progress}%`, status },
      { label: "导师反馈", value: feedback, status },
      { label: "打卡信号", value: intern.reason || "暂无", status },
      { label: "沟通频率", value: danger ? "低于同岗均值" : warning ? "需要加强" : "稳定", status },
    ],
    possibleCause: warning || danger ? "当前问题更像是早期适应和支持节奏不足，需要把任务拆小并增加导师反馈频率。" : "目前岗位匹配度较高，可以通过挑战任务继续验证成长上限。",
    hrAction: danger ? "建议 HR 尽快约谈，并同步导师把下周任务拆成更小的可执行动作。" : warning ? "建议 HR 推动导师补充一次针对性辅导，并设置一周后的复盘点。" : "保持观察，并鼓励导师给出更明确的阶段挑战任务。",
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
    { name: "低风险", value: list.filter((intern) => intern.risk === "低风险").length, color: "#16a34a" },
    { name: "中风险", value: list.filter((intern) => intern.risk === "中风险").length, color: "#f59e0b" },
    { name: "高风险", value: list.filter((intern) => intern.risk === "高风险").length, color: "#ef4444" },
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
    const raw = localStorage.getItem("internflow_user");
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
    const raw = localStorage.getItem(collaborationStorageKey);
    return raw ? (JSON.parse(raw) as CollaborationRecord[]) : [];
  } catch {
    return [];
  }
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
        "fx-logo relative shrink-0 overflow-hidden rounded-xl border border-[#c1b5c2]/50 bg-white shadow-sm",
        compact ? "h-9 w-9" : "h-12 w-12",
      )}
    >
      <svg viewBox="0 0 64 64" aria-hidden="true" className="h-full w-full">
        <defs>
          <linearGradient id="grownest-wave" x1="10" x2="55" y1="49" y2="27" gradientUnits="userSpaceOnUse">
            <stop stopColor="#5723ec" />
            <stop offset="1" stopColor="#c25055" />
          </linearGradient>
          <linearGradient id="grownest-neck" x1="18" x2="36" y1="16" y2="38" gradientUnits="userSpaceOnUse">
            <stop stopColor="#a995ff" />
            <stop offset="1" stopColor="#7c4df0" />
          </linearGradient>
        </defs>
        <path
          d="M8 33c8.8 11.4 24.6 15.4 45 5.6-3.4 10.9-13.9 19.1-27.4 18.3C16.1 56.3 9.4 47.4 8 33Z"
          fill="url(#grownest-wave)"
        />
        <path
          d="M13.2 42.2c8.2 5.7 21.8 8.9 37.2 1.2"
          fill="none"
          stroke="#fff"
          strokeLinecap="round"
          strokeWidth="3.8"
        />
        <path
          d="M20.4 35.7c8.8-6.7 9.4-10.9 9.9-17.3.4-5.2 3.3-8.7 8-8.3 3.8.3 6.3 2.4 7.6 5.3"
          fill="none"
          stroke="url(#grownest-neck)"
          strokeLinecap="round"
          strokeWidth="7"
        />
        <path d="M43.4 21.8c2.7 1.8 5.5 2.4 8.5 1.9-1.4 2.7-4.5 4.3-9 4.2 1-1.8 1.2-3.8.5-6.1Z" fill="#f0a38e" />
        <circle cx="39.3" cy="16.4" r="2.3" fill="#1d0c3b" />
        <path d="M31.8 42.5V32.4" stroke="#8b6cf0" strokeLinecap="round" strokeWidth="3.4" />
        <path d="M31.8 34.6c-4.6-1.1-7.3-4-8.2-8.6 4.8.2 8 2.9 9.5 8" fill="#c1b5c2" />
        <path d="M32.8 34.4c2.2-5 6.2-7.5 11.8-7.4-2.2 4.8-6.1 7.4-11.8 7.4Z" fill="#a995ff" />
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
          <span className="inline-block bg-gradient-to-r from-blue-700 to-teal-700 bg-clip-text text-transparent">GrowNest</span>
          <span className="ml-2 inline-block text-slate-950">鹅苗成长舱</span>
        </div>
        {!small && <p className="mt-2 text-sm tracking-wide text-slate-500">业务部实习生成长协同工具</p>}
      </div>
    </div>
  );
}

function Card({ className, children, ...props }: HTMLAttributes<HTMLElement> & { children: ReactNode }) {
  return (
    <section
      className={cn(
        "future-card fx-reveal rounded-xl border border-slate-200/90 bg-white/95 p-4 shadow-[0_5px_14px_rgba(15,23,42,0.04)] backdrop-blur",
        className,
      )}
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
        "fx-button inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold transition active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60",
        variant === "primary" && "border border-blue-700 bg-blue-700 text-white shadow-sm hover:bg-blue-800 hover:shadow-[0_8px_18px_rgba(37,99,235,0.18)]",
        variant === "soft" && "border border-blue-200 bg-blue-50 text-blue-800 hover:bg-blue-100 hover:shadow-[0_8px_18px_rgba(37,99,235,0.08)]",
        variant === "ghost" && "border border-slate-200 bg-white/92 text-slate-700 ring-1 ring-slate-100 hover:bg-blue-50 hover:text-blue-800",
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}

function AttentionBadge({ risk }: { risk: RiskLevel }) {
  return <span className={cn("rounded-full px-2.5 py-1 text-xs font-semibold ring-1", riskClass[risk])}>{attentionLabel[risk]}</span>;
}

function StatusPill({ status }: { status: string }) {
  const styles: Record<string, string> = {
    已完成: "bg-emerald-50 text-emerald-700 ring-emerald-200",
    进行中: "bg-blue-50 text-blue-700 ring-blue-200",
    未开始: "bg-slate-100 text-slate-500 ring-slate-200",
    未完成: "bg-slate-100 text-slate-600 ring-slate-200",
  };

  return <span className={cn("rounded-full px-2.5 py-1 text-xs font-bold ring-1", styles[status] ?? styles.未开始)}>{status}</span>;
}

function SectionTitle({ icon: Icon, title, subtitle }: { icon: ElementType; title: string; subtitle?: string }) {
  return (
    <div className="flex items-start gap-3">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-700 ring-1 ring-blue-100">
        <Icon className="h-[18px] w-[18px]" />
      </div>
      <div>
        <h2 className="text-base font-bold tracking-[0] text-slate-950">{title}</h2>
        {subtitle && <p className="mt-1 text-sm text-slate-500">{subtitle}</p>}
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
            <p className="mt-3 text-xs font-bold text-blue-700">可见</p>
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
              scope.status === "MVP 必做" ? "bg-blue-50 text-blue-700" : "bg-slate-100 text-slate-500",
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
    <Card className={cn("border-blue-100 bg-white", compact && "p-4")}>
      <SectionTitle icon={ShieldCheck} title="AI 可靠性护栏" subtitle="规则、证据和人工确认分层，避免把生成内容当成最终判断" />
      <div className={cn("mt-5 grid gap-3", compact ? "md:grid-cols-1" : "md:grid-cols-3")}>
        {aiReliabilityChecks.map((item, index) => (
          <div key={item.label} className="rounded-2xl border border-blue-100 bg-blue-50/70 p-4">
            <span className="rounded-full bg-white px-2.5 py-1 text-xs font-black text-blue-700">0{index + 1}</span>
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

function PortalPreview({ role, icon: Icon }: { role: UserRole; icon: ElementType }) {
  const previews: Record<UserRole, { label: string; value: string; rows: Array<[string, string, string]>; footer: string }> = {
    student: {
      label: "Student Access",
      value: "成长入口",
      rows: [["成长路径", "查看阶段目标", "个人"], ["任务导航", "理解本周重点", "清晰"], ["导师沟通", "整理问题再提问", "协同"]],
      footer: "登录后展示个人任务、反馈和成长建议",
    },
    mentor: {
      label: "Mentor Access",
      value: "带教入口",
      rows: [["带教节奏", "按周检查关键动作", "规范"], ["反馈助手", "生成结构化草稿", "高效"], ["学员问答", "集中处理问题", "同步"]],
      footer: "登录后展示负责学员、反馈待办和问答",
    },
    hr: {
      label: "HRBP Access",
      value: "运营入口",
      rows: [["批次总览", "掌握整体成长节奏", "全局"], ["关注队列", "识别需支持对象", "预警"], ["适岗摘要", "同步招聘复盘", "洞察"]],
      footer: "登录后展示批次数据、风险信号和周报",
    },
    admin: {
      label: "Admin Access",
      value: "配置入口",
      rows: [["账号权限", "维护角色范围", "安全"], ["岗位模板", "配置成长路径", "标准"], ["数据字典", "统一评价口径", "治理"]],
      footer: "登录后维护账号、模板和基础配置",
    },
  };
  const preview = previews[role];

  return (
    <div className="fx-float-card relative w-full max-w-[240px] overflow-hidden rounded-[1.45rem] border border-white/80 bg-white/88 p-4 shadow-[0_20px_44px_rgba(29,12,59,0.11)] backdrop-blur">
      <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-[#5723ec] via-[#4731a3] to-[#c25055]" />
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-black uppercase tracking-wide text-[#4731a3]">{preview.label}</p>
          <p className="mt-1 text-xl font-black text-slate-950">{preview.value}</p>
        </div>
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[#1d0c3b] text-white shadow-lg shadow-[#1d0c3b]/10">
          <Icon className="h-5 w-5" />
        </div>
      </div>
      <div className="mt-4 space-y-2">
        {preview.rows.map(([name, detail, status], index) => (
          <div key={`${name}-${detail}`} className="fx-stagger-item rounded-2xl border border-[#c1b5c2]/40 bg-[#f7f4fb]/76 px-3 py-2" style={{ animationDelay: `${index * 80}ms` }}>
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm font-black text-slate-950">{name}</p>
              <span className="rounded-full bg-white px-2 py-1 text-xs font-black text-[#4731a3]">{status}</span>
            </div>
            <p className="mt-1 text-xs font-bold text-slate-500">{detail}</p>
          </div>
        ))}
      </div>
      <div className="mt-3 rounded-2xl bg-gradient-to-r from-[#f7f4fb] to-[#fff4f1] px-3 py-2 text-xs font-bold leading-5 text-[#4731a3]">
        {preview.footer}
      </div>
    </div>
  );
}

function LoginPage({ onLogin }: { onLogin: (user: AuthUser) => void }) {
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
    <main className="relative min-h-screen px-5 py-8">
      {!showLogin && (
        <button
          type="button"
          onClick={() => openLogin(adminUser.role)}
          className="absolute right-5 top-5 z-30 hidden items-center gap-2 rounded-full border border-slate-200 bg-white/76 px-4 py-2 text-xs font-bold text-slate-500 shadow-sm backdrop-blur transition hover:border-[#c1b5c2] hover:bg-white hover:text-[#4731a3] lg:flex"
        >
          <LockKeyhole className="h-3.5 w-3.5" />
          管理员入口
        </button>
      )}
      <div className="mx-auto grid min-h-[calc(100vh-64px)] max-w-6xl items-center gap-10 lg:grid-cols-[1.08fr_0.92fr]">
        <section className="relative min-w-0">
          <BrandLogo />
          <div className="mt-8 max-w-xl">
            <div
              key={role}
              className={cn(
                "portal-stage relative overflow-hidden rounded-[2rem] border border-white/80 bg-gradient-to-br p-6 pb-10 shadow-[0_24px_68px_rgba(29,12,59,0.12)] lg:min-h-[520px]",
                selectedPortal.tone,
              )}
              style={{ transform: `rotate(${selectedPortal.rotate}deg)` }}
            >
              <span className="fx-soft-blob absolute -left-10 top-8 h-28 w-36 rounded-[48%_52%_62%_38%/45%_62%_38%_55%] bg-white/42" />
              <span className="fx-soft-blob-delayed absolute -bottom-14 right-12 h-36 w-44 rounded-[45%_55%_42%_58%/60%_40%_60%_40%] bg-[#c1b5c2]/18" />
              {role !== "admin" && !showLogin && (
                <button
                  type="button"
                  onClick={rotatePortal}
                  className="fx-portal-next absolute bottom-5 right-6 z-20 flex h-12 w-12 items-center justify-center rounded-full bg-white/84 text-[#4731a3] shadow-[0_12px_28px_rgba(29,12,59,0.12)] ring-1 ring-white/80 backdrop-blur transition hover:bg-white"
                  aria-label="切换端口"
                >
                  <ChevronRight className="h-5 w-5" />
                </button>
              )}
              <div className={cn("relative z-10 flex flex-col gap-6 pb-7", showLogin ? "min-h-[445px] justify-between" : "min-h-[430px] justify-between")}>
                <div className="grid gap-7 sm:grid-cols-[0.86fr_1.14fr] sm:items-center">
                  <div>
                    <p className="text-xs font-black uppercase tracking-wide text-[#4731a3]">{selectedPortal.eyebrow}</p>
                    <div className="mt-4 max-w-[230px]">
                      <h2 className="text-4xl font-black leading-[1.08] tracking-[0] text-slate-950 sm:text-[3.25rem]">
                        {selectedPortal.title}
                      </h2>
                      <p className="mt-6 text-sm font-bold leading-7 text-slate-700">
                        {selectedPortal.description}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center justify-center sm:justify-end sm:pr-4">
                    <PortalPreview role={role} icon={PortalIcon} />
                  </div>
                </div>

                {!showLogin && (
                  <div className="mr-14 rounded-[1.4rem] border border-white/80 bg-white/70 p-4 shadow-[0_16px_38px_rgba(29,12,59,0.07)] backdrop-blur">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <p className="text-xs font-black uppercase tracking-wide text-[#4731a3]">After Login</p>
                      <button
                        type="button"
                        onClick={() => openLogin(role)}
                        className="inline-flex items-center gap-1.5 rounded-full bg-[#5723ec] px-3 py-1.5 text-xs font-black text-white shadow-sm shadow-[#5723ec]/20 transition hover:bg-[#4731a3]"
                      >
                        进入登录
                        <ChevronRight className="h-3.5 w-3.5" />
                      </button>
                    </div>
                    <div className="mt-3 grid gap-2 sm:grid-cols-3">
                      {selectedAccessNotes.map(([label, detail]) => (
                        <div key={label} className="rounded-2xl bg-white/78 px-3 py-3 ring-1 ring-[#c1b5c2]/28">
                          <p className="text-xs font-black text-slate-950">{label}</p>
                          <p className="mt-1 text-xs font-semibold leading-5 text-slate-500">{detail}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {showLogin && (
                  <div className="rounded-[1.6rem] border border-white/80 bg-white/72 p-4 shadow-[0_18px_42px_rgba(29,12,59,0.08)] backdrop-blur">
                    <Button variant="ghost" onClick={() => setShowLogin(false)} className="w-full rounded-xl bg-white/88">
                      返回端口选择
                    </Button>
                  </div>
                )}
              </div>
              <div className="absolute bottom-5 left-6 z-20 flex items-center gap-1.5">
                {primaryPortalRoles.map((item) => (
                  <button
                    key={item.role}
                    type="button"
                    onClick={() => selectRole(item.role)}
                    className={cn(
                      "h-1.5 rounded-full transition-all duration-300",
                      item.role === role ? "w-7 bg-[#1d0c3b]/75" : "w-1.5 bg-[#1d0c3b]/18",
                    )}
                    aria-label={`切换到${loginRoleMeta[item.role]?.shortLabel}端口`}
                  />
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="space-y-6 lg:min-h-[520px]">
          {showLogin ? (
            <div className="overflow-hidden rounded-[1.75rem] border border-[#c1b5c2]/40 bg-white/92 shadow-[0_22px_60px_rgba(29,12,59,0.1)] backdrop-blur">
              <div className="h-1 bg-gradient-to-r from-[#5723ec] via-[#4731a3] to-[#c25055]" />
              <div className="p-6">
                <div className="mb-6 flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <p className="text-xs font-black uppercase tracking-wide text-[#4731a3]">{loginRoleMeta[role]?.title} Login</p>
                    <h2 className="mt-3 text-3xl font-black tracking-[0] text-slate-950">{selectedUser.roleLabel}</h2>
                    <p className="mt-2 max-w-md text-sm leading-6 text-slate-500">请输入该端口账号密码，系统会按当前端口权限进入对应工作台。</p>
                  </div>
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#1d0c3b] text-white shadow-lg shadow-[#1d0c3b]/10">
                    <PortalIcon className="h-5 w-5" />
                  </div>
                </div>

                <div className="space-y-4 rounded-2xl border border-slate-100 bg-slate-50/72 p-4">
                  <label className="block">
                    <span className="text-sm font-bold text-slate-600">账号</span>
                    <div className="mt-2 flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-3 py-3 shadow-sm transition focus-within:border-[#c1b5c2] focus-within:ring-4 focus-within:ring-[#c1b5c2]/22">
                      <UserRound className="h-4 w-4 shrink-0 text-[#4731a3]" />
                      <input
                        value={username}
                        onChange={(event) => setUsername(event.target.value)}
                        className="min-w-0 flex-1 bg-transparent text-base font-semibold text-slate-800 outline-none"
                      />
                    </div>
                  </label>
                  <label className="block">
                    <span className="text-sm font-bold text-slate-600">密码</span>
                    <div className="mt-2 flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-3 py-3 shadow-sm transition focus-within:border-[#c1b5c2] focus-within:ring-4 focus-within:ring-[#c1b5c2]/22">
                      <LockKeyhole className="h-4 w-4 shrink-0 text-[#4731a3]" />
                      <input
                        type="password"
                        value={password}
                        onChange={(event) => setPassword(event.target.value)}
                        className="min-w-0 flex-1 bg-transparent text-base font-semibold text-slate-800 outline-none"
                      />
                    </div>
                  </label>
                </div>
                {error && <p className="mt-4 rounded-xl bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-600 ring-1 ring-rose-100">{error}</p>}
                <Button onClick={submit} className="mt-5 h-12 w-full rounded-xl px-5">
                  进入工作台
                  <ChevronRight className="h-4 w-4" />
                </Button>
                <Button variant="ghost" onClick={() => onLogin(publicUser(selectedUser))} className="mt-3 h-12 w-full rounded-xl px-5">
                  快速体验
                </Button>
              </div>
            </div>
          ) : (
            <>
              <div key={`${role}-copy`} className="fx-role-panel">
                <p className="text-sm font-black uppercase tracking-wide text-[#4731a3]">{selectedRoleContent.eyebrow}</p>
                <h1 className="mt-4 text-3xl font-black leading-tight tracking-[0] text-slate-950 lg:text-5xl">
                  {selectedRoleContent.headline}
                </h1>
                <p className="mt-5 text-base leading-8 text-slate-600">
                  {selectedRoleContent.body}
                </p>
              </div>

              <div className="grid gap-4">
                {selectedRoleContent.features.map(([title, detail, Icon]) => (
                  <div key={title as string} className="future-card flex items-start gap-4 rounded-[1.6rem] border border-slate-200/90 bg-white/86 p-4 shadow-sm">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#f7f4fb] text-[#4731a3] ring-1 ring-[#c1b5c2]/40">
                      <Icon className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="font-black text-slate-950">{title as string}</p>
                      <p className="mt-1 text-sm leading-6 text-slate-600">{detail as string}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="rounded-[1.5rem] border border-[#c1b5c2]/40 bg-gradient-to-br from-white via-[#f7f4fb] to-[#fff4f1] p-5">
                <p className="text-sm font-black text-[#4731a3]">{selectedRoleContent.aiTitle}</p>
                <p className="mt-2 text-sm leading-7 text-slate-600">
                  {selectedRoleContent.aiBody}
                </p>
                <div className="mt-4 grid gap-3 sm:grid-cols-3">
                  {selectedRoleContent.aiChips.map((item) => (
                    <div key={item} className="rounded-2xl bg-white/82 px-3 py-3 text-center text-xs font-black text-slate-700">
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
      <div className="flex items-center gap-3 rounded-xl bg-slate-100 px-3 py-2">
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-700 text-sm font-black text-white">
          {user.name.slice(0, 1)}
        </div>
        <div>
          <p className="text-sm font-bold leading-none text-slate-950">{user.name}</p>
          <p className="mt-1 text-xs text-blue-700">{roleName[user.role]} · {user.department}</p>
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
                    </div>
                  ))}
                </div>
              </div>
            </>
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

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-40 border-b border-slate-200/90 bg-white/90 backdrop-blur-xl">
        <div className="mx-auto flex max-w-[1480px] flex-col gap-4 px-5 py-3 lg:flex-row lg:items-center lg:justify-between">
          <BrandLogo />
          <div className="relative hidden min-w-96 xl:block">
            <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-500 shadow-sm transition focus-within:border-blue-300 focus-within:ring-4 focus-within:ring-blue-100">
              <Search className="h-4 w-4" />
              <input
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="搜索任务、反馈、成长记录"
                className="w-full bg-transparent text-sm text-slate-700 outline-none placeholder:text-slate-400"
              />
            </div>
            {searchTerm.trim() && (
              <div className="absolute left-0 right-0 top-12 z-50 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-2xl shadow-slate-900/10">
                <div className="border-b border-slate-100 px-4 py-3 text-xs font-bold text-slate-500">
                  已按{roleName[user.role]}权限找到 {searchResults.length} 条结果
                </div>
                {searchResults.length > 0 ? (
                  <div className="max-h-80 overflow-auto p-2">
                    {searchResults.map((result) => (
                      <button
                        key={`${result.type}-${result.title}`}
                        onClick={() => setSearchTerm(result.title)}
                        className="block w-full rounded-lg px-3 py-3 text-left transition hover:bg-blue-50"
                      >
                        <div className="flex items-center justify-between gap-3">
                          <p className="text-sm font-bold text-slate-950">{result.title}</p>
                          <span className="shrink-0 rounded-full bg-blue-50 px-2 py-1 text-xs font-bold text-blue-700">{result.type}</span>
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
            <Card className="min-h-[calc(100vh-120px)] p-2">
              <div className="mb-3 border-b border-slate-100 px-2 pb-3 pt-1">
                <BrandLogo small />
              </div>
              <button className="mb-1 flex w-full items-center gap-3 rounded-lg bg-blue-700 px-3 py-2.5 text-left text-sm font-semibold text-white shadow-lg shadow-blue-700/15">
                <Home className="h-4 w-4" />
                当前工作台
              </button>
              {nav.filter((item) => item.roles.includes(user.role)).map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.path}
                    className="mb-1 flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-semibold text-slate-600 transition hover:bg-blue-50 hover:text-blue-800"
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
            <div className="relative overflow-hidden bg-white p-4">
              <div className="absolute inset-x-0 top-0 h-1 bg-blue-700" />
              <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wide text-blue-700">
                    当前工作台
                  </p>
                  <h1 className="mt-1 text-xl font-black tracking-[0] text-slate-950 lg:text-2xl">{title}</h1>
                  <p className="mt-1 text-sm text-slate-600">
                    {user.name} / {roleName[user.role]}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {["实时同步", "AI 赋能"].map((item) => (
                    <span key={item} className="rounded-full bg-blue-50 px-3 py-2 text-xs font-black text-blue-700 ring-1 ring-blue-100">
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
    blue: "border border-blue-100 bg-blue-50 text-blue-700",
    green: "border border-emerald-100 bg-emerald-50 text-emerald-700",
    amber: "border border-amber-100 bg-amber-50 text-amber-700",
    rose: "border border-rose-100 bg-rose-50 text-rose-700",
  };
  return (
    <Card className="p-5">
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
    <div className="overflow-hidden rounded-lg border border-blue-100 bg-gradient-to-br from-white via-blue-50/70 to-emerald-50/50 p-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <div className="flex items-center gap-2">
            <MapPinned className="h-4 w-4 text-blue-700" />
            <p className="text-sm font-black text-slate-950">90 天成长地图</p>
          </div>
          <p className="mt-1 text-xs font-semibold text-slate-500">沿着路线推进 13 个成长站点，点击站点切换周。</p>
        </div>
        <span className="rounded-full bg-white px-2.5 py-1 text-xs font-black text-blue-700 ring-1 ring-blue-100">
          当前第 {currentWeek} 周 · {currentStop.name}
        </span>
      </div>
      <div className="mt-3 overflow-x-auto rounded-lg bg-white/82 p-3 ring-1 ring-blue-100">
        <div className="relative min-h-[245px] min-w-[760px] overflow-hidden rounded-lg border border-blue-50 bg-[radial-gradient(circle_at_18%_24%,rgba(37,99,235,0.12),transparent_18%),radial-gradient(circle_at_78%_32%,rgba(16,185,129,0.14),transparent_20%),linear-gradient(180deg,#f8fbff,#ffffff)] p-3 md:min-w-0">
          <div className="absolute left-[8%] top-[16%] rounded-full bg-white/75 px-3 py-1 text-[11px] font-black text-blue-700 ring-1 ring-blue-100">学习湾</div>
          <div className="absolute left-[44%] top-[14%] rounded-full bg-white/75 px-3 py-1 text-[11px] font-black text-emerald-700 ring-1 ring-emerald-100">协作桥</div>
          <div className="absolute bottom-[13%] left-[72%] rounded-full bg-white/75 px-3 py-1 text-[11px] font-black text-blue-700 ring-1 ring-blue-100">复盘谷</div>
          <svg className="absolute inset-0 h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
            <path d="M 7 68 C 18 20 31 24 42 70 S 61 20 74 31 S 90 84 98 56" fill="none" stroke="#e2e8f0" strokeLinecap="round" strokeWidth="3" />
            <path
              d="M 7 68 C 18 20 31 24 42 70 S 61 20 74 31 S 90 84 98 56"
              fill="none"
              pathLength="100"
              stroke="#2563eb"
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
                    active && "border-blue-600 bg-blue-600 text-white shadow-blue-600/25 ring-4 ring-blue-100",
                    passed && !active && "border-emerald-200 bg-emerald-50 text-emerald-700",
                    !passed && !active && "border-slate-200 bg-white text-slate-500",
                  )}
                >
                  {milestone ? <Flag className="h-4 w-4" /> : index + 1}
                </span>
                <span className={cn("mt-1 block whitespace-nowrap text-[10px] font-bold", active ? "text-blue-700" : "text-slate-500")}>W{index + 1}</span>
                <span className={cn("block whitespace-nowrap text-[10px] font-semibold opacity-0 transition group-hover:opacity-100", active ? "text-blue-700 opacity-100" : "text-slate-500")}>{stop.name}</span>
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
          <div className="rounded-lg border border-blue-100 bg-blue-50 px-3 py-2">
            <p className="text-xs font-black text-blue-700">当前站点 · {currentStop.name}</p>
            <p className="mt-1 text-sm font-bold text-slate-700">{selectedDateLabel}，今日 {todayTasksCount} 个任务，待办 {pendingTasksCount} 个</p>
          </div>
          {milestones.map((item) => (
            <div key={item.day} className="rounded-lg bg-slate-50 px-3 py-2 ring-1 ring-slate-100">
              <p className="text-xs font-black text-blue-700">第 {item.day} 天 · {item.label}</p>
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
  const taskStatusByLabel = useMemo(() => new Map<string, TaskStatus>(displayTasks.map((task) => [task.label, task.status as TaskStatus])), [displayTasks]);
  const studentGrowthStagesForDisplay = useMemo(
    () =>
      studentGrowthStages.map((stage) => ({
        ...stage,
        tasks: stage.tasks.map((task) => ({
          ...task,
          status: taskStatusByLabel.get(task.label) ?? "未完成",
        })),
      })),
    [studentGrowthStages, taskStatusByLabel],
  );
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
    } catch (error) {
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
    void generateDailyPlan();
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
    <div className="space-y-4">
      <Card className="overflow-hidden border-slate-200 bg-white p-0 shadow-sm">
        <div className="border-b border-slate-100 bg-slate-50/80 px-4 py-3">
          <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
                <h2 className="text-xl font-black tracking-[0] text-slate-950 lg:text-2xl">
                  我的成长地图 · {selectedDate.label}
                </h2>
                <span className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-black text-blue-700 ring-1 ring-blue-100">
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
                <span className="h-2 w-2 rounded-full bg-blue-600" />
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
                <span className="text-xs font-black text-blue-700">90 天路线</span>
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
                    <div className="h-1.5 rounded-full bg-blue-600 transition-all duration-500" style={{ width: `${studentProgress}%` }} />
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
                      active && "border-blue-500 bg-blue-50 ring-2 ring-blue-100",
                      !active && weekend && "border-slate-100 bg-slate-50/70 text-slate-400 hover:border-slate-200",
                      !active && !weekend && "border-slate-200 bg-white hover:border-blue-200 hover:bg-slate-50",
                    )}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="whitespace-nowrap text-xs font-black text-blue-700">{day.label}</span>
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
                <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-blue-700 ring-1 ring-blue-100">
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
              {taskMessage && <p className="mt-3 rounded-lg bg-emerald-50 px-3 py-2 text-sm font-bold text-emerald-700">{taskMessage}</p>}
            </div>
          </div>

          <div className="min-w-0 space-y-3">
            <div className="rounded-lg border border-blue-100 bg-white p-3 shadow-[0_8px_24px_rgba(24,119,255,0.06)]">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-blue-700" />
                  <p className="text-sm font-black text-blue-900">AI 今日建议</p>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="ghost" className="px-3 py-1.5 text-xs" onClick={generateDailyPlan} disabled={dailyPlanLoading}>
                    {dailyPlanLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
                    {dailyPlanLoading ? "生成中" : "重新生成建议"}
                  </Button>
                </div>
              </div>
              {dailyPlanError && <p className="mt-3 rounded-lg bg-amber-50 px-3 py-2 text-xs font-bold text-amber-700">{dailyPlanError}</p>}
              {dailyPlan ? (
                <div className="mt-3 space-y-2">
                  <div className="rounded-lg bg-blue-50/70 p-3 ring-1 ring-blue-100">
                    <p className="text-xs font-black text-blue-700">今日判断</p>
                    <p className="mt-1 text-sm leading-6 text-slate-700">{dailyPlan.recommendation}</p>
                  </div>
                  <div className="rounded-lg bg-slate-50 p-3 ring-1 ring-slate-100">
                    <p className="text-xs font-black text-blue-700">为什么这样建议</p>
                    <p className="mt-1 text-sm leading-6 text-slate-700">{dailyPlan.reason}</p>
                  </div>
                  <div className="rounded-lg bg-slate-50 p-3 ring-1 ring-slate-100">
                    <p className="text-xs font-black text-blue-700">建议动作</p>
                    <div className="mt-2 space-y-2">
                      {dailyPlan.actions.slice(0, 4).map((action, index) => (
                        <div key={action} className="flex gap-2 rounded-lg bg-white px-3 py-2 text-sm leading-6 text-slate-700 ring-1 ring-slate-100">
                          <span className="font-black text-blue-700">{index + 1}.</span>
                          {action}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="mt-3 rounded-lg bg-blue-50/70 p-4 text-sm font-semibold text-slate-500 ring-1 ring-blue-100">
                  {dailyPlanLoading ? "AI 正在根据当前任务和岗位生成今日建议..." : "点击“重新生成建议”获取今日建议。"}
                </div>
              )}
            </div>
          </div>
        </div>
      </Card>

      <Card>
        <SectionTitle icon={GraduationCap} title="当前站点详情" subtitle="把地图里的当前位置翻译成今天该推进的成长动作" />
        <div className="mt-4 grid gap-4 xl:grid-cols-[0.9fr_1.1fr]">
          <div className="rounded-lg border border-blue-100 bg-blue-50/70 p-4">
            <p className="text-xs font-black text-blue-700">{currentStage?.period ?? "当前阶段"} · 第 {currentWeekNumber} 周</p>
            <h3 className="mt-2 text-xl font-black text-slate-950">{currentStage?.theme ?? "阶段目标推进"}</h3>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              当前阶段已完成 {currentStageDone}/{currentStageTotal} 个节点。本周优先把「{primaryTask?.label ?? supportFocus}」推进到可反馈状态。
            </p>
            <div className="mt-4 h-2 rounded-full bg-white">
              <div className="h-2 rounded-full bg-blue-600" style={{ width: `${currentStageTotal ? Math.round((currentStageDone / currentStageTotal) * 100) : 0}%` }} />
            </div>
          </div>
          <div className="grid gap-2 md:grid-cols-2">
            {(currentStage?.tasks ?? []).map((task) => (
              <div key={task.label} className="flex items-center justify-between gap-3 rounded-lg border border-slate-100 bg-slate-50 px-3 py-2.5">
                <span className="text-sm font-semibold text-slate-700">{task.label}</span>
                <StatusPill status={task.status} />
              </div>
            ))}
          </div>
        </div>
      </Card>

      <div className="grid gap-4 xl:grid-cols-[1fr_390px]">
        <Card>
          <SectionTitle icon={ClipboardList} title="本周待办池" subtitle="未完成和已完成分开沉淀，避免和今日任务重复" />
          <div className="mt-4 grid gap-2">
            {weekTodoTasks.length > 0 ? weekTodoTasks.map((task) => (
              <div key={task.label} className="future-card flex items-center justify-between rounded-lg border border-slate-100 bg-white p-3">
                <div className="flex items-center gap-3">
                  <CheckCircle2 className={cn("h-5 w-5", task.status === "已完成" ? "text-emerald-500" : "text-blue-500")} />
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
                      : "bg-blue-600 text-white shadow-sm shadow-blue-600/15 hover:bg-blue-700",
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
          {taskMessage && <p className="mt-3 rounded-lg bg-emerald-50 px-3 py-2 text-sm font-bold text-emerald-700">{taskMessage}</p>}
        </Card>
        <Card className="bg-white/92">
          <SectionTitle icon={BrainCircuit} title="AI 本周成长建议" subtitle="先写下自己的困惑，AI 会帮你整理成更适合问导师的问题" />
          <p className="mt-4 text-sm leading-6 text-slate-600">
            你当前的成长重点是「{supportFocus}」。建议先围绕「{primaryTask?.label ?? "本周核心任务"}」确认验收标准，再把不确定点整理成 1v1 问题。
          </p>
          <div className="mt-4 rounded-lg border border-blue-100 bg-white/75 p-3">
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
              className="mt-2 min-h-24 w-full resize-none rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm leading-6 text-slate-700 outline-none transition focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-100"
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
                    questionFocus === prompt ? "bg-blue-600 text-white shadow-md shadow-blue-500/20" : "bg-blue-50 text-blue-700 hover:bg-blue-100",
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
            {questionLoading ? "AI 正在整理问题..." : studentQuestionDraft.trim() ? "AI 优化成提问清单" : "AI 帮我生成提问清单"}
          </Button>
          {questionError && <p className="mt-3 rounded-lg bg-rose-50 px-3 py-2 text-sm font-bold text-rose-700">{questionError}</p>}
          {questionMessage && <p className="mt-3 rounded-lg bg-emerald-50 px-3 py-2 text-sm font-bold text-emerald-700">{questionMessage}</p>}
          {showQuestions && (
            <div className="mt-4 rounded-lg bg-white/80 p-3 ring-1 ring-slate-100">
              <p className="text-sm font-black text-slate-950">可直接发给导师的问题</p>
              <ol className="mt-3 space-y-2">
                {questions.map((question, index) => (
                  <li key={question} className="flex gap-3 rounded-lg bg-slate-50 p-3 text-sm leading-6 text-slate-700">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-600 text-xs font-bold text-white">{index + 1}</span>
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

      <Card>
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
                      <div className="mt-3 rounded-lg bg-blue-50 p-3 text-sm leading-7 text-slate-700">
                        <strong className="text-slate-950">导师回复：</strong>{record.answer}
                        <p className="mt-2 text-xs font-semibold text-blue-700">{record.answeredAt ?? "刚刚"}</p>
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
              <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-blue-700 ring-1 ring-blue-100">{combinedMentorFeedbackRecords.length} 条</span>
            </div>
            <div className="mt-3 grid gap-2">
              {combinedMentorFeedbackRecords.length > 0 ? (
                combinedMentorFeedbackRecords.map((record) => (
                  <div key={record.id} className="rounded-lg border border-blue-100 bg-blue-50/70 p-3">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <p className="font-black text-slate-950">{record.title}</p>
                        <p className="mt-1 text-xs font-semibold text-blue-700">{record.createdAt} · 来自导师</p>
                      </div>
                      <span className="rounded-full bg-white px-3 py-1 text-xs font-bold text-blue-700">{record.status}</span>
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
        <Card className="border-blue-100 bg-blue-50/70">
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

  const selectIntern = (intern: typeof mentorViewInterns[number]) => {
    setSelectedName(intern.name);
    setFeedback(intern.observationHint);
    setDraftFeedback(null);
    setIsGenerating(false);
    setAiError("");
    setSaved(false);
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
    <div className="mentor-dashboard space-y-6">
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

      <Card className="mentor-command-panel overflow-hidden border-blue-100 bg-gradient-to-br from-white via-blue-50/70 to-emerald-50/60">
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
                tone: "text-blue-700 bg-blue-50 ring-blue-100",
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
                <div key={item.title} className="mentor-flow-card rounded-lg bg-white/88 p-4 ring-1 ring-blue-100">
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
          <aside className="mentor-focus-card rounded-xl border border-blue-100 bg-white/88 p-4 shadow-[0_12px_30px_rgba(15,23,42,0.06)]">
            <div className="flex items-start justify-between gap-3">
              <div className="mentor-command-heading">
                <span className="mentor-kicker">Mentor Command</span>
                <p className="text-xs font-black text-blue-700">当前处理对象</p>
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
                <span className="rounded-full bg-white px-3 py-1 text-xs font-black text-blue-700 ring-1 ring-blue-100">{selected.action}</span>
              </div>
              <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-200">
                <div className="mentor-progress-fill h-full rounded-full" style={{ width: `${selected.progress}%` }} />
              </div>
            </div>
            <div className="mt-4 rounded-lg bg-blue-50/80 p-3">
              <p className="text-xs font-black text-blue-700">本次辅导重点</p>
              <p className="mt-1 text-sm font-semibold leading-6 text-slate-700">{selected.focus}</p>
            </div>
          </aside>
        </div>
          <div className="mt-5 grid gap-3 rounded-lg border border-blue-100 bg-white/82 p-4 md:grid-cols-4">
            {[
              ["平均进度", `${averageProgress}%`, "来自学生任务状态"],
              ["待反馈", `${pendingFeedbackCount} 条`, "进入导师今日动作"],
              ["学员提问", `${studentQuestions.length} 条`, "回复后回流学生端"],
              ["当前对象", selected.name, "右侧所有操作对象"],
            ].map(([label, value, detail]) => (
              <div key={label}>
                <p className="text-xs font-bold text-slate-500">{label}</p>
                <p className="mt-1 text-lg font-black text-slate-950">{value}</p>
                <p className="mt-1 text-xs font-semibold text-blue-700">{detail}</p>
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
                  <span className="shrink-0 rounded-full bg-white px-2.5 py-1 text-xs font-black text-blue-700 ring-1 ring-blue-100">{item.value}</span>
                </div>
	              <p className="mt-2 text-sm leading-6 text-slate-700">{item.detail}</p>
                <div className="mt-4 rounded-xl bg-white/80 px-3 py-2">
                  <p className="text-xs font-bold text-slate-500">来源：{item.source}</p>
                  <p className="mt-1 text-xs font-semibold leading-5 text-blue-700">{item.impact}</p>
                </div>
	            </div>
	          );
            })}
	        </div>
	      </Card>

      <div className="grid gap-5 2xl:grid-cols-[1fr_380px]">
        <Card>
          <SectionTitle icon={Users} title="带教对象" subtitle={`仅展示 ${normalizeDepartment(user.department)} 下绑定给 ${user.name} 的实习生`} />
          <div className="mt-5 grid gap-3">
            {mentorViewInterns.map((intern, index) => (
              <button
                key={intern.name}
                onClick={() => selectIntern(intern)}
                className={cn(
                  "mentor-intern-card rounded-2xl border p-4 text-left transition hover:bg-blue-50",
                  selected.name === intern.name ? "border-blue-300 bg-blue-50 ring-2 ring-blue-100" : "border-slate-100 bg-white",
                )}
                style={{ animationDelay: `${index * 70}ms` }}
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-lg font-black text-slate-950">{intern.name}</p>
                    <p className="mt-1 text-sm text-slate-500">{intern.title} · {intern.department}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-bold text-blue-700">{intern.progress}%</span>
/* RECOVERY_GAP_LINE_2581 */
/* RECOVERY_GAP_LINE_2582 */
/* RECOVERY_GAP_LINE_2583 */
/* RECOVERY_GAP_LINE_2584 */
/* RECOVERY_GAP_LINE_2585 */
/* RECOVERY_GAP_LINE_2586 */
/* RECOVERY_GAP_LINE_2587 */
/* RECOVERY_GAP_LINE_2588 */
/* RECOVERY_GAP_LINE_2589 */
/* RECOVERY_GAP_LINE_2590 */
/* RECOVERY_GAP_LINE_2591 */
/* RECOVERY_GAP_LINE_2592 */
/* RECOVERY_GAP_LINE_2593 */
/* RECOVERY_GAP_LINE_2594 */
/* RECOVERY_GAP_LINE_2595 */
/* RECOVERY_GAP_LINE_2596 */
/* RECOVERY_GAP_LINE_2597 */
/* RECOVERY_GAP_LINE_2598 */
/* RECOVERY_GAP_LINE_2599 */
/* RECOVERY_GAP_LINE_2600 */
/* RECOVERY_GAP_LINE_2601 */
/* RECOVERY_GAP_LINE_2602 */
/* RECOVERY_GAP_LINE_2603 */
/* RECOVERY_GAP_LINE_2604 */
/* RECOVERY_GAP_LINE_2605 */
/* RECOVERY_GAP_LINE_2606 */
/* RECOVERY_GAP_LINE_2607 */
/* RECOVERY_GAP_LINE_2608 */
/* RECOVERY_GAP_LINE_2609 */
/* RECOVERY_GAP_LINE_2610 */
/* RECOVERY_GAP_LINE_2611 */
/* RECOVERY_GAP_LINE_2612 */
/* RECOVERY_GAP_LINE_2613 */
/* RECOVERY_GAP_LINE_2614 */
/* RECOVERY_GAP_LINE_2615 */
/* RECOVERY_GAP_LINE_2616 */
/* RECOVERY_GAP_LINE_2617 */
/* RECOVERY_GAP_LINE_2618 */
/* RECOVERY_GAP_LINE_2619 */
/* RECOVERY_GAP_LINE_2620 */
/* RECOVERY_GAP_LINE_2621 */
/* RECOVERY_GAP_LINE_2622 */
/* RECOVERY_GAP_LINE_2623 */
/* RECOVERY_GAP_LINE_2624 */
/* RECOVERY_GAP_LINE_2625 */
/* RECOVERY_GAP_LINE_2626 */
/* RECOVERY_GAP_LINE_2627 */
/* RECOVERY_GAP_LINE_2628 */
/* RECOVERY_GAP_LINE_2629 */
/* RECOVERY_GAP_LINE_2630 */
/* RECOVERY_GAP_LINE_2631 */
/* RECOVERY_GAP_LINE_2632 */
/* RECOVERY_GAP_LINE_2633 */
/* RECOVERY_GAP_LINE_2634 */
/* RECOVERY_GAP_LINE_2635 */
/* RECOVERY_GAP_LINE_2636 */
/* RECOVERY_GAP_LINE_2637 */
/* RECOVERY_GAP_LINE_2638 */
/* RECOVERY_GAP_LINE_2639 */
/* RECOVERY_GAP_LINE_2640 */
/* RECOVERY_GAP_LINE_2641 */
/* RECOVERY_GAP_LINE_2642 */
/* RECOVERY_GAP_LINE_2643 */
/* RECOVERY_GAP_LINE_2644 */
/* RECOVERY_GAP_LINE_2645 */
/* RECOVERY_GAP_LINE_2646 */
/* RECOVERY_GAP_LINE_2647 */
/* RECOVERY_GAP_LINE_2648 */
/* RECOVERY_GAP_LINE_2649 */
/* RECOVERY_GAP_LINE_2650 */
/* RECOVERY_GAP_LINE_2651 */
/* RECOVERY_GAP_LINE_2652 */
/* RECOVERY_GAP_LINE_2653 */
/* RECOVERY_GAP_LINE_2654 */
/* RECOVERY_GAP_LINE_2655 */
/* RECOVERY_GAP_LINE_2656 */
/* RECOVERY_GAP_LINE_2657 */
/* RECOVERY_GAP_LINE_2658 */
/* RECOVERY_GAP_LINE_2659 */
/* RECOVERY_GAP_LINE_2660 */
/* RECOVERY_GAP_LINE_2661 */
/* RECOVERY_GAP_LINE_2662 */
/* RECOVERY_GAP_LINE_2663 */
/* RECOVERY_GAP_LINE_2664 */
/* RECOVERY_GAP_LINE_2665 */
/* RECOVERY_GAP_LINE_2666 */
/* RECOVERY_GAP_LINE_2667 */
/* RECOVERY_GAP_LINE_2668 */
/* RECOVERY_GAP_LINE_2669 */
/* RECOVERY_GAP_LINE_2670 */
/* RECOVERY_GAP_LINE_2671 */
/* RECOVERY_GAP_LINE_2672 */
/* RECOVERY_GAP_LINE_2673 */
/* RECOVERY_GAP_LINE_2674 */
/* RECOVERY_GAP_LINE_2675 */
/* RECOVERY_GAP_LINE_2676 */
/* RECOVERY_GAP_LINE_2677 */
/* RECOVERY_GAP_LINE_2678 */
/* RECOVERY_GAP_LINE_2679 */
/* RECOVERY_GAP_LINE_2680 */
/* RECOVERY_GAP_LINE_2681 */
/* RECOVERY_GAP_LINE_2682 */
/* RECOVERY_GAP_LINE_2683 */
/* RECOVERY_GAP_LINE_2684 */
/* RECOVERY_GAP_LINE_2685 */
/* RECOVERY_GAP_LINE_2686 */
/* RECOVERY_GAP_LINE_2687 */
/* RECOVERY_GAP_LINE_2688 */
/* RECOVERY_GAP_LINE_2689 */
/* RECOVERY_GAP_LINE_2690 */
/* RECOVERY_GAP_LINE_2691 */
/* RECOVERY_GAP_LINE_2692 */
/* RECOVERY_GAP_LINE_2693 */
/* RECOVERY_GAP_LINE_2694 */
/* RECOVERY_GAP_LINE_2695 */
/* RECOVERY_GAP_LINE_2696 */
/* RECOVERY_GAP_LINE_2697 */
/* RECOVERY_GAP_LINE_2698 */
/* RECOVERY_GAP_LINE_2699 */
/* RECOVERY_GAP_LINE_2700 */
/* RECOVERY_GAP_LINE_2701 */
/* RECOVERY_GAP_LINE_2702 */
/* RECOVERY_GAP_LINE_2703 */
/* RECOVERY_GAP_LINE_2704 */
/* RECOVERY_GAP_LINE_2705 */
/* RECOVERY_GAP_LINE_2706 */
/* RECOVERY_GAP_LINE_2707 */
/* RECOVERY_GAP_LINE_2708 */
/* RECOVERY_GAP_LINE_2709 */
/* RECOVERY_GAP_LINE_2710 */
/* RECOVERY_GAP_LINE_2711 */
/* RECOVERY_GAP_LINE_2712 */
/* RECOVERY_GAP_LINE_2713 */
/* RECOVERY_GAP_LINE_2714 */
/* RECOVERY_GAP_LINE_2715 */
/* RECOVERY_GAP_LINE_2716 */
/* RECOVERY_GAP_LINE_2717 */
/* RECOVERY_GAP_LINE_2718 */
/* RECOVERY_GAP_LINE_2719 */
/* RECOVERY_GAP_LINE_2720 */
/* RECOVERY_GAP_LINE_2721 */
/* RECOVERY_GAP_LINE_2722 */
/* RECOVERY_GAP_LINE_2723 */
/* RECOVERY_GAP_LINE_2724 */
/* RECOVERY_GAP_LINE_2725 */
/* RECOVERY_GAP_LINE_2726 */
/* RECOVERY_GAP_LINE_2727 */
/* RECOVERY_GAP_LINE_2728 */
/* RECOVERY_GAP_LINE_2729 */
/* RECOVERY_GAP_LINE_2730 */
/* RECOVERY_GAP_LINE_2731 */
/* RECOVERY_GAP_LINE_2732 */
/* RECOVERY_GAP_LINE_2733 */
/* RECOVERY_GAP_LINE_2734 */
/* RECOVERY_GAP_LINE_2735 */
/* RECOVERY_GAP_LINE_2736 */
/* RECOVERY_GAP_LINE_2737 */
/* RECOVERY_GAP_LINE_2738 */
/* RECOVERY_GAP_LINE_2739 */
/* RECOVERY_GAP_LINE_2740 */
/* RECOVERY_GAP_LINE_2741 */
/* RECOVERY_GAP_LINE_2742 */
/* RECOVERY_GAP_LINE_2743 */
/* RECOVERY_GAP_LINE_2744 */
/* RECOVERY_GAP_LINE_2745 */
/* RECOVERY_GAP_LINE_2746 */
/* RECOVERY_GAP_LINE_2747 */
/* RECOVERY_GAP_LINE_2748 */
/* RECOVERY_GAP_LINE_2749 */
/* RECOVERY_GAP_LINE_2750 */
/* RECOVERY_GAP_LINE_2751 */
/* RECOVERY_GAP_LINE_2752 */
/* RECOVERY_GAP_LINE_2753 */
/* RECOVERY_GAP_LINE_2754 */
/* RECOVERY_GAP_LINE_2755 */
/* RECOVERY_GAP_LINE_2756 */
/* RECOVERY_GAP_LINE_2757 */
/* RECOVERY_GAP_LINE_2758 */
/* RECOVERY_GAP_LINE_2759 */
/* RECOVERY_GAP_LINE_2760 */
/* RECOVERY_GAP_LINE_2761 */
/* RECOVERY_GAP_LINE_2762 */
/* RECOVERY_GAP_LINE_2763 */
/* RECOVERY_GAP_LINE_2764 */
/* RECOVERY_GAP_LINE_2765 */
/* RECOVERY_GAP_LINE_2766 */
/* RECOVERY_GAP_LINE_2767 */
/* RECOVERY_GAP_LINE_2768 */
/* RECOVERY_GAP_LINE_2769 */
/* RECOVERY_GAP_LINE_2770 */
/* RECOVERY_GAP_LINE_2771 */
/* RECOVERY_GAP_LINE_2772 */
/* RECOVERY_GAP_LINE_2773 */
/* RECOVERY_GAP_LINE_2774 */
/* RECOVERY_GAP_LINE_2775 */
/* RECOVERY_GAP_LINE_2776 */
/* RECOVERY_GAP_LINE_2777 */
/* RECOVERY_GAP_LINE_2778 */
/* RECOVERY_GAP_LINE_2779 */
/* RECOVERY_GAP_LINE_2780 */
/* RECOVERY_GAP_LINE_2781 */
/* RECOVERY_GAP_LINE_2782 */
/* RECOVERY_GAP_LINE_2783 */
/* RECOVERY_GAP_LINE_2784 */
/* RECOVERY_GAP_LINE_2785 */
/* RECOVERY_GAP_LINE_2786 */
/* RECOVERY_GAP_LINE_2787 */
/* RECOVERY_GAP_LINE_2788 */
/* RECOVERY_GAP_LINE_2789 */
/* RECOVERY_GAP_LINE_2790 */
/* RECOVERY_GAP_LINE_2791 */
/* RECOVERY_GAP_LINE_2792 */
/* RECOVERY_GAP_LINE_2793 */
/* RECOVERY_GAP_LINE_2794 */
/* RECOVERY_GAP_LINE_2795 */
/* RECOVERY_GAP_LINE_2796 */
/* RECOVERY_GAP_LINE_2797 */
/* RECOVERY_GAP_LINE_2798 */
/* RECOVERY_GAP_LINE_2799 */
/* RECOVERY_GAP_LINE_2800 */
/* RECOVERY_GAP_LINE_2801 */
/* RECOVERY_GAP_LINE_2802 */
/* RECOVERY_GAP_LINE_2803 */
/* RECOVERY_GAP_LINE_2804 */
/* RECOVERY_GAP_LINE_2805 */
/* RECOVERY_GAP_LINE_2806 */
/* RECOVERY_GAP_LINE_2807 */
/* RECOVERY_GAP_LINE_2808 */
/* RECOVERY_GAP_LINE_2809 */
/* RECOVERY_GAP_LINE_2810 */
/* RECOVERY_GAP_LINE_2811 */
/* RECOVERY_GAP_LINE_2812 */
/* RECOVERY_GAP_LINE_2813 */
/* RECOVERY_GAP_LINE_2814 */
/* RECOVERY_GAP_LINE_2815 */
/* RECOVERY_GAP_LINE_2816 */
/* RECOVERY_GAP_LINE_2817 */
/* RECOVERY_GAP_LINE_2818 */
/* RECOVERY_GAP_LINE_2819 */
/* RECOVERY_GAP_LINE_2820 */
/* RECOVERY_GAP_LINE_2821 */
/* RECOVERY_GAP_LINE_2822 */
/* RECOVERY_GAP_LINE_2823 */
/* RECOVERY_GAP_LINE_2824 */
/* RECOVERY_GAP_LINE_2825 */
/* RECOVERY_GAP_LINE_2826 */
/* RECOVERY_GAP_LINE_2827 */
/* RECOVERY_GAP_LINE_2828 */
/* RECOVERY_GAP_LINE_2829 */
/* RECOVERY_GAP_LINE_2830 */
/* RECOVERY_GAP_LINE_2831 */
/* RECOVERY_GAP_LINE_2832 */
/* RECOVERY_GAP_LINE_2833 */
/* RECOVERY_GAP_LINE_2834 */
/* RECOVERY_GAP_LINE_2835 */
/* RECOVERY_GAP_LINE_2836 */
/* RECOVERY_GAP_LINE_2837 */
/* RECOVERY_GAP_LINE_2838 */
/* RECOVERY_GAP_LINE_2839 */
/* RECOVERY_GAP_LINE_2840 */
/* RECOVERY_GAP_LINE_2841 */
/* RECOVERY_GAP_LINE_2842 */
/* RECOVERY_GAP_LINE_2843 */
/* RECOVERY_GAP_LINE_2844 */
/* RECOVERY_GAP_LINE_2845 */
/* RECOVERY_GAP_LINE_2846 */
/* RECOVERY_GAP_LINE_2847 */
/* RECOVERY_GAP_LINE_2848 */
/* RECOVERY_GAP_LINE_2849 */
/* RECOVERY_GAP_LINE_2850 */
/* RECOVERY_GAP_LINE_2851 */
/* RECOVERY_GAP_LINE_2852 */
/* RECOVERY_GAP_LINE_2853 */
/* RECOVERY_GAP_LINE_2854 */
/* RECOVERY_GAP_LINE_2855 */
/* RECOVERY_GAP_LINE_2856 */
/* RECOVERY_GAP_LINE_2857 */
/* RECOVERY_GAP_LINE_2858 */
/* RECOVERY_GAP_LINE_2859 */
/* RECOVERY_GAP_LINE_2860 */
/* RECOVERY_GAP_LINE_2861 */
/* RECOVERY_GAP_LINE_2862 */
/* RECOVERY_GAP_LINE_2863 */
/* RECOVERY_GAP_LINE_2864 */
/* RECOVERY_GAP_LINE_2865 */
/* RECOVERY_GAP_LINE_2866 */
/* RECOVERY_GAP_LINE_2867 */
/* RECOVERY_GAP_LINE_2868 */
/* RECOVERY_GAP_LINE_2869 */
/* RECOVERY_GAP_LINE_2870 */
/* RECOVERY_GAP_LINE_2871 */
/* RECOVERY_GAP_LINE_2872 */
/* RECOVERY_GAP_LINE_2873 */
/* RECOVERY_GAP_LINE_2874 */
/* RECOVERY_GAP_LINE_2875 */
/* RECOVERY_GAP_LINE_2876 */
/* RECOVERY_GAP_LINE_2877 */
/* RECOVERY_GAP_LINE_2878 */
/* RECOVERY_GAP_LINE_2879 */
/* RECOVERY_GAP_LINE_2880 */
/* RECOVERY_GAP_LINE_2881 */
/* RECOVERY_GAP_LINE_2882 */
/* RECOVERY_GAP_LINE_2883 */
/* RECOVERY_GAP_LINE_2884 */
/* RECOVERY_GAP_LINE_2885 */
/* RECOVERY_GAP_LINE_2886 */
/* RECOVERY_GAP_LINE_2887 */
/* RECOVERY_GAP_LINE_2888 */
/* RECOVERY_GAP_LINE_2889 */
/* RECOVERY_GAP_LINE_2890 */
/* RECOVERY_GAP_LINE_2891 */
/* RECOVERY_GAP_LINE_2892 */
/* RECOVERY_GAP_LINE_2893 */
/* RECOVERY_GAP_LINE_2894 */
/* RECOVERY_GAP_LINE_2895 */
/* RECOVERY_GAP_LINE_2896 */
/* RECOVERY_GAP_LINE_2897 */
/* RECOVERY_GAP_LINE_2898 */
/* RECOVERY_GAP_LINE_2899 */
/* RECOVERY_GAP_LINE_2900 */
/* RECOVERY_GAP_LINE_2901 */
/* RECOVERY_GAP_LINE_2902 */
/* RECOVERY_GAP_LINE_2903 */
/* RECOVERY_GAP_LINE_2904 */
/* RECOVERY_GAP_LINE_2905 */
/* RECOVERY_GAP_LINE_2906 */
/* RECOVERY_GAP_LINE_2907 */
/* RECOVERY_GAP_LINE_2908 */
/* RECOVERY_GAP_LINE_2909 */
/* RECOVERY_GAP_LINE_2910 */
/* RECOVERY_GAP_LINE_2911 */
/* RECOVERY_GAP_LINE_2912 */
/* RECOVERY_GAP_LINE_2913 */
/* RECOVERY_GAP_LINE_2914 */
/* RECOVERY_GAP_LINE_2915 */
/* RECOVERY_GAP_LINE_2916 */
/* RECOVERY_GAP_LINE_2917 */
/* RECOVERY_GAP_LINE_2918 */
/* RECOVERY_GAP_LINE_2919 */
/* RECOVERY_GAP_LINE_2920 */
/* RECOVERY_GAP_LINE_2921 */
/* RECOVERY_GAP_LINE_2922 */
/* RECOVERY_GAP_LINE_2923 */
/* RECOVERY_GAP_LINE_2924 */
/* RECOVERY_GAP_LINE_2925 */
/* RECOVERY_GAP_LINE_2926 */
/* RECOVERY_GAP_LINE_2927 */
/* RECOVERY_GAP_LINE_2928 */
/* RECOVERY_GAP_LINE_2929 */
/* RECOVERY_GAP_LINE_2930 */
/* RECOVERY_GAP_LINE_2931 */
/* RECOVERY_GAP_LINE_2932 */
/* RECOVERY_GAP_LINE_2933 */
/* RECOVERY_GAP_LINE_2934 */
/* RECOVERY_GAP_LINE_2935 */
/* RECOVERY_GAP_LINE_2936 */
/* RECOVERY_GAP_LINE_2937 */
/* RECOVERY_GAP_LINE_2938 */
/* RECOVERY_GAP_LINE_2939 */
/* RECOVERY_GAP_LINE_2940 */
/* RECOVERY_GAP_LINE_2941 */
/* RECOVERY_GAP_LINE_2942 */
/* RECOVERY_GAP_LINE_2943 */
/* RECOVERY_GAP_LINE_2944 */
/* RECOVERY_GAP_LINE_2945 */
/* RECOVERY_GAP_LINE_2946 */
/* RECOVERY_GAP_LINE_2947 */
/* RECOVERY_GAP_LINE_2948 */
/* RECOVERY_GAP_LINE_2949 */
/* RECOVERY_GAP_LINE_2950 */
/* RECOVERY_GAP_LINE_2951 */
/* RECOVERY_GAP_LINE_2952 */
/* RECOVERY_GAP_LINE_2953 */
/* RECOVERY_GAP_LINE_2954 */
/* RECOVERY_GAP_LINE_2955 */
/* RECOVERY_GAP_LINE_2956 */
/* RECOVERY_GAP_LINE_2957 */
/* RECOVERY_GAP_LINE_2958 */
/* RECOVERY_GAP_LINE_2959 */
/* RECOVERY_GAP_LINE_2960 */
/* RECOVERY_GAP_LINE_2961 */
/* RECOVERY_GAP_LINE_2962 */
/* RECOVERY_GAP_LINE_2963 */
/* RECOVERY_GAP_LINE_2964 */
/* RECOVERY_GAP_LINE_2965 */
/* RECOVERY_GAP_LINE_2966 */
/* RECOVERY_GAP_LINE_2967 */
/* RECOVERY_GAP_LINE_2968 */
/* RECOVERY_GAP_LINE_2969 */
/* RECOVERY_GAP_LINE_2970 */
/* RECOVERY_GAP_LINE_2971 */
/* RECOVERY_GAP_LINE_2972 */
/* RECOVERY_GAP_LINE_2973 */
/* RECOVERY_GAP_LINE_2974 */
/* RECOVERY_GAP_LINE_2975 */
/* RECOVERY_GAP_LINE_2976 */
/* RECOVERY_GAP_LINE_2977 */
/* RECOVERY_GAP_LINE_2978 */
/* RECOVERY_GAP_LINE_2979 */
/* RECOVERY_GAP_LINE_2980 */
/* RECOVERY_GAP_LINE_2981 */
/* RECOVERY_GAP_LINE_2982 */
/* RECOVERY_GAP_LINE_2983 */
/* RECOVERY_GAP_LINE_2984 */
/* RECOVERY_GAP_LINE_2985 */
/* RECOVERY_GAP_LINE_2986 */
/* RECOVERY_GAP_LINE_2987 */
/* RECOVERY_GAP_LINE_2988 */
/* RECOVERY_GAP_LINE_2989 */
/* RECOVERY_GAP_LINE_2990 */
/* RECOVERY_GAP_LINE_2991 */
/* RECOVERY_GAP_LINE_2992 */
/* RECOVERY_GAP_LINE_2993 */
/* RECOVERY_GAP_LINE_2994 */
/* RECOVERY_GAP_LINE_2995 */
/* RECOVERY_GAP_LINE_2996 */
/* RECOVERY_GAP_LINE_2997 */
/* RECOVERY_GAP_LINE_2998 */
/* RECOVERY_GAP_LINE_2999 */
/* RECOVERY_GAP_LINE_3000 */
/* RECOVERY_GAP_LINE_3001 */
/* RECOVERY_GAP_LINE_3002 */
/* RECOVERY_GAP_LINE_3003 */
/* RECOVERY_GAP_LINE_3004 */
/* RECOVERY_GAP_LINE_3005 */
/* RECOVERY_GAP_LINE_3006 */
/* RECOVERY_GAP_LINE_3007 */
/* RECOVERY_GAP_LINE_3008 */
/* RECOVERY_GAP_LINE_3009 */
/* RECOVERY_GAP_LINE_3010 */
/* RECOVERY_GAP_LINE_3011 */
/* RECOVERY_GAP_LINE_3012 */
/* RECOVERY_GAP_LINE_3013 */
/* RECOVERY_GAP_LINE_3014 */
/* RECOVERY_GAP_LINE_3015 */
/* RECOVERY_GAP_LINE_3016 */
/* RECOVERY_GAP_LINE_3017 */
/* RECOVERY_GAP_LINE_3018 */
/* RECOVERY_GAP_LINE_3019 */
/* RECOVERY_GAP_LINE_3020 */
/* RECOVERY_GAP_LINE_3021 */
/* RECOVERY_GAP_LINE_3022 */
/* RECOVERY_GAP_LINE_3023 */
/* RECOVERY_GAP_LINE_3024 */
/* RECOVERY_GAP_LINE_3025 */
/* RECOVERY_GAP_LINE_3026 */
/* RECOVERY_GAP_LINE_3027 */
/* RECOVERY_GAP_LINE_3028 */
/* RECOVERY_GAP_LINE_3029 */
/* RECOVERY_GAP_LINE_3030 */
/* RECOVERY_GAP_LINE_3031 */
/* RECOVERY_GAP_LINE_3032 */
/* RECOVERY_GAP_LINE_3033 */
/* RECOVERY_GAP_LINE_3034 */
/* RECOVERY_GAP_LINE_3035 */
/* RECOVERY_GAP_LINE_3036 */
/* RECOVERY_GAP_LINE_3037 */
/* RECOVERY_GAP_LINE_3038 */
/* RECOVERY_GAP_LINE_3039 */
/* RECOVERY_GAP_LINE_3040 */
/* RECOVERY_GAP_LINE_3041 */
/* RECOVERY_GAP_LINE_3042 */
/* RECOVERY_GAP_LINE_3043 */
/* RECOVERY_GAP_LINE_3044 */
/* RECOVERY_GAP_LINE_3045 */
/* RECOVERY_GAP_LINE_3046 */
/* RECOVERY_GAP_LINE_3047 */
/* RECOVERY_GAP_LINE_3048 */
/* RECOVERY_GAP_LINE_3049 */
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
    <Card className="border-blue-100">
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
            <label className="rounded-2xl border border-slate-200 bg-white px-4 py-3">
              <span className="text-xs font-bold text-slate-500">查询</span>
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="搜索姓名、岗位、导师、风险原因"
                className="mt-1 w-full bg-transparent text-sm font-semibold text-slate-800 outline-none"
              />
            </label>
            <label className="rounded-2xl border border-slate-200 bg-white px-4 py-3">
              <span className="text-xs font-bold text-slate-500">岗位</span>
              <select value={roleFilter} onChange={(event) => setRoleFilter(event.target.value)} className="mt-1 w-full bg-transparent text-sm font-semibold text-slate-800 outline-none">
                {["全部", "产品", "研发", "销售", "HR"].map((role) => <option key={role}>{role}</option>)}
              </select>
            </label>
            <label className="rounded-2xl border border-slate-200 bg-white px-4 py-3">
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
                    className={cn("cursor-pointer bg-slate-50 transition hover:bg-blue-50", selected?.id === intern.id && "bg-blue-50 ring-2 ring-inset ring-blue-200")}
                  >
                    <td className="rounded-l-2xl px-3 py-4 font-black text-slate-950">{intern.name}</td>
                    <td className="px-3 py-4 text-slate-600">{intern.role} · {intern.title}</td>
                    <td className="px-3 py-4 text-slate-600">{intern.mentor}</td>
                    <td className="px-3 py-4 text-slate-600">{intern.week}</td>
                    <td className="px-3 py-4 font-bold text-blue-700">{intern.progress}%</td>
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
          <div className="rounded-3xl border border-blue-100 bg-blue-50/60 p-4">
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
                <label key={key} className="rounded-2xl bg-white px-3 py-2 ring-1 ring-blue-100">
                  <span className="text-xs font-bold text-slate-500">{label}</span>
                  <input value={String(internForm[key as keyof InternFormState])} onChange={(event) => setInternForm((current) => ({ ...current, [key]: event.target.value }))} className="mt-1 w-full bg-transparent text-sm font-semibold text-slate-800 outline-none" />
                </label>
              ))}
              <label className="rounded-2xl bg-white px-3 py-2 ring-1 ring-blue-100">
                <span className="text-xs font-bold text-slate-500">岗位类型</span>
                <select value={internForm.role} onChange={(event) => setInternForm((current) => ({ ...current, role: event.target.value }))} className="mt-1 w-full bg-transparent text-sm font-semibold text-slate-800 outline-none">
                  {["产品", "研发", "销售", "HR"].map((role) => <option key={role}>{role}</option>)}
                </select>
              </label>
              <label className="rounded-2xl bg-white px-3 py-2 ring-1 ring-blue-100">
                <span className="text-xs font-bold text-slate-500">成长进度</span>
                <input type="number" min={0} max={100} value={internForm.progress} onChange={(event) => setInternForm((current) => ({ ...current, progress: Number(event.target.value) }))} className="mt-1 w-full bg-transparent text-sm font-semibold text-slate-800 outline-none" />
              </label>
              <label className="rounded-2xl bg-white px-3 py-2 ring-1 ring-blue-100">
                <span className="text-xs font-bold text-slate-500">关注状态</span>
                <select value={internForm.risk} onChange={(event) => setInternForm((current) => ({ ...current, risk: event.target.value as RiskLevel }))} className="mt-1 w-full bg-transparent text-sm font-semibold text-slate-800 outline-none">
                  {(["低风险", "中风险", "高风险"] as RiskLevel[]).map((risk) => <option key={risk} value={risk}>{attentionLabel[risk]}</option>)}
                </select>
              </label>
              <label className="rounded-2xl bg-white px-3 py-2 ring-1 ring-blue-100">
                <span className="text-xs font-bold text-slate-500">处置状态</span>
                <select value={internForm.processStatus} onChange={(event) => setInternForm((current) => ({ ...current, processStatus: event.target.value as ProcessStatus }))} className="mt-1 w-full bg-transparent text-sm font-semibold text-slate-800 outline-none">
                  {["待 HR 沟通", "已同步导师", "复盘中", "已关闭"].map((status) => <option key={status}>{status}</option>)}
                </select>
              </label>
            </div>
            <label className="mt-3 block rounded-2xl bg-white px-3 py-2 ring-1 ring-blue-100">
              <span className="text-xs font-bold text-slate-500">风险原因</span>
              <textarea value={internForm.reason} onChange={(event) => setInternForm((current) => ({ ...current, reason: event.target.value }))} className="mt-1 min-h-16 w-full resize-none bg-transparent text-sm font-semibold leading-6 text-slate-800 outline-none" />
            </label>
            <label className="mt-3 block rounded-2xl bg-white px-3 py-2 ring-1 ring-blue-100">
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
              <div className="rounded-3xl border border-slate-100 bg-white p-4">
                <p className="text-sm font-black text-slate-950">成长任务管理</p>
                <div className="mt-3 grid gap-2">
                  {selected.tasks.map((task) => (
                    <div key={task.id} className="rounded-2xl bg-slate-50 p-3">
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
                <div className="mt-3 rounded-2xl bg-blue-50 p-3">
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

              <div className="rounded-3xl border border-slate-100 bg-white p-4">
                <p className="text-sm font-black text-slate-950">导师反馈管理</p>
                <div className="mt-3 grid gap-2">
                  {selected.feedbacks.map((feedback) => (
                    <div key={feedback.id} className="rounded-2xl bg-slate-50 p-3">
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
  records: CollaborationRecord[];
  onAddRecord: (record: Omit<CollaborationRecord, "id" | "createdAt">) => void;
}) {
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

  return (
    <Card className="h-fit border-blue-100">
      <SectionTitle icon={BrainCircuit} title="AI 需关注分析卡" subtitle={`${intern.name} · ${intern.role}`} />
      <div className="mt-5 space-y-4">
        <div className="flex items-center justify-between rounded-2xl bg-slate-50 p-4">
          <span className="text-sm font-medium text-slate-500">关注状态</span>
          <AttentionBadge risk={intern.risk} />
        </div>
        <div className="grid grid-cols-2 gap-3">
    </Card>
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
              <span className="font-bold text-blue-600">{index + 1}.</span>
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
      <Card className="overflow-hidden">
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
                  "rounded-full px-3 py-2 text-xs font-bold ring-1 transition",
                  riskFilter === risk ? "bg-blue-600 text-white ring-blue-600" : "bg-white text-slate-600 ring-slate-200 hover:bg-blue-50 hover:text-blue-700",
                )}
              >
                {risk === "全部" ? "全部" : attentionLabel[risk]}
              </button>
            ))}
          </div>
        </div>
        <p className="mt-4 rounded-2xl bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-600">
          当前筛选出 {filteredInterns.length} 名实习生，已选中 {visibleSelected?.name ?? "暂无"}。
        </p>
        <div className="mt-5 overflow-x-auto">
          <table className="w-full min-w-[980px] border-separate border-spacing-y-2 text-left text-sm">
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
                  className={cn("cursor-pointer bg-slate-50 transition hover:bg-blue-50", visibleSelected?.name === intern.name && "bg-blue-50 ring-2 ring-blue-200")}
                >
                  <td className="rounded-l-2xl px-3 py-4 font-bold text-slate-950">{intern.name}</td>
                  <td className="px-3 py-4 text-slate-600">{intern.role}</td>
                  <td className="px-3 py-4 text-slate-600">{intern.week}</td>
                  <td className="px-3 py-4">
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-20 rounded-full bg-slate-200">
                        <div className="h-2 rounded-full bg-blue-600" style={{ width: `${intern.progress}%` }} />
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
  const [visible, setVisible] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [copied, setCopied] = useState(false);
  const [report, setReport] = useState("");
  const [reportError, setReportError] = useState("");
  const generateReport = async () => {
    setGenerating(true);
    setVisible(false);
    setCopied(false);
    setReportError("");
    try {
      const result = await requestAiGeneration<AIReport>("report", {
        summary: {
	          totalInterns: managedInterns.length,
	          averageProgress: `${managedInterns.length ? Math.round(managedInterns.reduce((sum, intern) => sum + intern.progress, 0) / managedInterns.length) : 0}%`,
	          priorityAttentionCount: managedInterns.filter((intern) => intern.risk === "高风险").length,
	          mentorFeedbackRate: "75%",
	          currentWeek: "第 3 周",
	          department: "游戏业务部",
        },
        roleProgress: getRoleProgressData(managedInterns),
        riskDistribution: getRiskDistributionData(managedInterns),
        interns: managedInterns.map(managedToIntern),
        collaborationRecords: records,
      });
      setReport(result.output.report);
      setVisible(true);
    } catch (error) {
      setReportError(error instanceof Error ? error.message : "AI 生成失败，请稍后重试。");
    } finally {
      setGenerating(false);
    }
  };
  const copyReport = async () => {
    await navigator.clipboard.writeText(report);
    setCopied(true);
  };

  return (
    <Card id="report" className="border-blue-100">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <SectionTitle icon={FileText} title="适岗周报生成模块" subtitle="汇总成长状态、关注原因和下周动作" />
        <Button onClick={generateReport} disabled={generating}>
          {generating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
          {generating ? "正在生成周报..." : visible ? "重新生成周报" : "一键生成本周适岗周报"}
        </Button>
      </div>
      {generating ? (
        <div className="mt-5 rounded-3xl border border-blue-100 bg-blue-50/70 p-6">
          <div className="flex items-center gap-3 text-sm font-bold text-blue-700">
            <Loader2 className="h-5 w-5 animate-spin" />
            AI 正在汇总关注状态、导师反馈和下周动作...
          </div>
          <div className="mt-4 space-y-3">
            <div className="h-3 w-2/3 animate-pulse rounded-full bg-blue-100" />
            <div className="h-3 w-full animate-pulse rounded-full bg-blue-100" />
            <div className="h-3 w-5/6 animate-pulse rounded-full bg-blue-100" />
          </div>
        </div>
      ) : reportError ? (
        <div className="mt-5 rounded-3xl bg-rose-50 px-5 py-4 text-sm font-bold text-rose-700">
          {reportError}
        </div>
      ) : visible ? (
        <div className="mt-5 rounded-3xl border border-blue-100 bg-blue-50/70 p-5">
          <div className="flex flex-col gap-3 border-b border-blue-100 pb-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm font-bold text-blue-700">已生成适岗周报，可复制到周会材料或招聘同步记录。</p>
            <Button variant="ghost" className="px-3 py-2" onClick={copyReport}>
              <Copy className="h-4 w-4" />
              {copied ? "已复制" : "复制周报"}
            </Button>
          </div>
          <div className="mt-4 whitespace-pre-line text-sm leading-7 text-slate-700">
            {report}
          </div>
        </div>
      ) : (
        <div className="mt-5 rounded-3xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center text-sm text-slate-500">
          点击按钮后，这里会生成面向 HR 和招聘同学的本周适岗情况周报。
        </div>
      )}
    </Card>
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
  const mentorFeedbackRate = 75;
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
        <Card className="border-blue-100 bg-gradient-to-br from-white via-blue-50 to-white">
          <SectionTitle icon={ClipboardList} title="今日处理队列" subtitle="HRBP 先处理动作，再查看说明和汇总材料" />
          <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            {priorityQueue.map((item) => (
              <div key={item.label} className="rounded-2xl bg-white p-4 ring-1 ring-blue-100">
                <p className="text-xs font-bold text-slate-500">{item.label}</p>
                <p className="mt-2 text-2xl font-black text-slate-950">{item.value}</p>
                <p className={cn(
                  "mt-2 text-sm font-semibold leading-6",
                  item.tone === "rose" && "text-rose-700",
                  item.tone === "amber" && "text-amber-700",
                  item.tone === "blue" && "text-blue-700",
                  item.tone === "green" && "text-emerald-700",
                )}>
                  {item.detail}
                </p>
              </div>
            ))}
          </div>
        </Card>
	      <div className="grid gap-5 xl:grid-cols-[1fr_1fr]">
        <Card className="bg-gradient-to-br from-white via-blue-50 to-white">
          <SectionTitle icon={LayoutDashboard} title="批次运营总览" subtitle="HRBP 先看整体状态，再进入个人关注卡处理" />
          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            {[
              ["正常成长", `${normalCount} 人`, "按当前节奏推进"],
              ["需关注", `${attentionCount} 人`, "需要导师或 HRBP 介入"],
              ["高潜观察", `${highPotentialCount} 人`, "适合安排挑战任务"],
            ].map(([label, value, detail]) => (
              <div key={label} className="rounded-2xl bg-white p-4 ring-1 ring-blue-100">
                <p className="text-xs font-bold text-slate-500">{label}</p>
                <p className="mt-2 text-2xl font-black text-slate-950">{value}</p>
                <p className="mt-1 text-xs font-semibold text-blue-700">{detail}</p>
              </div>
            ))}
          </div>
          <div className="mt-5 rounded-2xl bg-white p-4 ring-1 ring-blue-100">
            <div className="flex items-center justify-between">
              <p className="text-sm font-black text-slate-950">导师反馈完成率</p>
              <span className="text-sm font-black text-blue-700">{mentorFeedbackRate}%</span>
            </div>
            <div className="mt-3 h-2 rounded-full bg-slate-200">
              <div className="h-2 rounded-full bg-blue-600" style={{ width: `${mentorFeedbackRate}%` }} />
            </div>
            <p className="mt-3 text-sm leading-6 text-slate-600">未完成反馈会进入导师待办，HRBP 不需要逐个私聊追问。</p>
          </div>
        </Card>
        <Card>
          <SectionTitle icon={Bot} title="AI 批次助手" subtitle="把分散的任务、反馈和关注信号整理成可执行动作" />
          <div className="mt-5 space-y-3">
            {[
              "优先推动 2 位超过 10 天未反馈的导师补齐阶段评价。",
              "对 3 位重点关注实习生发起 HRBP 与导师联合复盘。",
              "销售岗整体客户场景训练不足，建议下周安排一次集中演练。",
            ].map((item) => (
              <div key={item} className="flex gap-3 rounded-2xl bg-slate-50 p-4 text-sm font-semibold leading-6 text-slate-700">
                <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-blue-600" />
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
      <Card className="border-blue-100 bg-gradient-to-br from-white via-blue-50 to-emerald-50">
        <SectionTitle icon={TrendingUp} title="招聘效能复盘模块" subtitle="嵌入 HRBP 成长运营台，供 TA/校招团队低频复盘使用，不参与日常带教管理" />
        <div className="mt-5 grid gap-3 md:grid-cols-3">
          {[
            ["看整体质量", "这批人入职后是否稳定适岗，哪些岗位需要继续观察。"],
            ["看留用信号", "提前识别表现稳定、高进度的同学，关注后续留用意愿。"],
            ["看画像反哺", "把适岗差异回流到筛选标准、面试题和入职前学习包。"],
          ].map(([title, detail]) => (
            <div key={title} className="rounded-2xl bg-white p-4 ring-1 ring-blue-100">
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
        <Card>
          <SectionTitle icon={TrendingUp} title="岗位适岗趋势" subtitle="只看汇总趋势和留用信号，不介入带教操作" />
          <MeasuredChart height={280}>
            {(width, height) => (
	              <BarChart width={width} height={height} data={currentRoleProgress} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
	                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e8eef7" />
	                <XAxis dataKey="role" axisLine={false} tickLine={false} />
	                <YAxis axisLine={false} tickLine={false} domain={[0, 100]} />
	                <Tooltip cursor={{ fill: "#f2f7ff" }} />
	                <Bar dataKey="progress" radius={[12, 12, 0, 0]} fill="#1877ff" maxBarSize={44} />
	              </BarChart>
            )}
          </MeasuredChart>
        </Card>

        <Card className="bg-gradient-to-br from-blue-50 via-white to-emerald-50">
          <SectionTitle icon={FileText} title="招聘效能摘要" subtitle="可复制到招聘复盘会或校招项目群" />
          <p className="mt-5 rounded-3xl bg-white/80 p-4 text-sm leading-7 text-slate-700">{recruiterBrief}</p>
          <div className="mt-4 flex flex-wrap gap-3">
            <Button onClick={copyBrief}>
              <Copy className="h-4 w-4" />
              {copied ? "已复制摘要" : "复制摘要"}
            </Button>
            <span className="rounded-full bg-white px-3 py-2 text-xs font-bold text-blue-700 ring-1 ring-blue-100">
              已合并 {records.length} 条跨端协同记录
            </span>
          </div>
        </Card>
      </div>

      <Card className="border-blue-100">
        <SectionTitle icon={Target} title="招聘画像反哺" subtitle="把入职后的适岗信号回流到校招筛选和面试题设计" />
        <div className="mt-5 grid gap-3 xl:grid-cols-3">
          {hiringFeedbackLoops.map((item) => (
            <div key={item.segment} className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
              <div className="flex items-start justify-between gap-3">
                <p className="font-black text-slate-950">{item.segment}</p>
                <span className="shrink-0 rounded-full bg-white px-2.5 py-1 text-xs font-black text-blue-700 ring-1 ring-blue-100">
                  置信度{item.confidence}
                </span>
              </div>
              <p className="mt-3 text-xs font-bold text-blue-700">适岗信号</p>
              <p className="mt-1 text-sm leading-6 text-slate-700">{item.signal}</p>
              <p className="mt-3 text-xs font-bold text-emerald-700">反哺建议</p>
              <p className="mt-1 text-sm leading-6 text-slate-700">{item.suggestion}</p>
            </div>
          ))}
        </div>
      </Card>

      <Card>
        <SectionTitle icon={ShieldCheck} title="适岗观察原则" subtitle="模块只展示趋势和证据摘要，不展示完整私聊与过程明细" />
        <div className="mt-5 grid gap-3 md:grid-cols-3">
          {[
            ["上升", "状态稳定、高进度、导师反馈稳定", "进入留用观察池"],
            ["平稳", "任务推进正常，但仍需补充一次阶段验证", "继续观察 2 周"],
            ["下降", "连续延期、反馈缺失或岗位理解不足", "先由 HRBP 与导师复盘"],
          ].map(([trend, signal, action]) => (
            <div key={trend} className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
              <p className="text-lg font-black text-slate-950">趋势：{trend}</p>
              <p className="mt-3 text-xs font-bold text-blue-700">判断信号</p>
              <p className="mt-1 text-sm leading-6 text-slate-700">{signal}</p>
              <p className="mt-3 text-xs font-bold text-emerald-700">建议动作</p>
              <p className="mt-1 text-sm leading-6 text-slate-700">{action}</p>
            </div>
          ))}
        </div>
      </Card>

      <div className="grid gap-5 xl:grid-cols-2">
        <Card>
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

        <Card>
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
      <Card className="border-blue-100 bg-gradient-to-br from-white via-blue-50 to-emerald-50">
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
            <div key={label} className="rounded-2xl bg-white p-4 ring-1 ring-blue-100">
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
            <table className="w-full min-w-[760px] border-separate border-spacing-y-2 text-left text-sm">
              <thead>
                <tr className="text-xs text-slate-500">
                  {["端口/模块", "负责人", "权限说明"].map((head) => <th key={head} className="px-3 py-2 font-semibold">{head}</th>)}
                </tr>
              </thead>
              <tbody>
                {roleCards.map((role) => (
                  <tr key={role.name} className="bg-slate-50">
                    <td className="rounded-l-2xl px-3 py-4 font-black text-slate-950">{role.name}</td>
                    <td className="px-3 py-4 font-semibold text-blue-700">{role.owner}</td>
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
                  <p className="mt-1 text-xl font-black text-blue-700">{template.stages}</p>
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
  const [user, setUser] = useState<AuthUser | null>(() => readStoredUser());
  const [collaborationRecords, setCollaborationRecords] = useState<CollaborationRecord[]>(() => readCollaborationRecords());
  const [managedInterns, setManagedInterns] = useState<ManagedIntern[]>(() => readManagedInterns());
  const [, setPath] = useState<Path>(() => {
    const storedUser = readStoredUser();
    const current = window.location.pathname as Path;
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

  useEffect(() => {
    const onPop = () => {
      const storedUser = readStoredUser();
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
    localStorage.setItem("internflow_user", JSON.stringify(nextUser));
    setUser(nextUser);
    navigate(rolePath[nextUser.role]);
  };

  const logout = () => {
    localStorage.removeItem("internflow_user");
    setUser(null);
    navigate("/login");
  };

  const addCollaborationRecord = (record: Omit<CollaborationRecord, "id" | "createdAt">) => {
    const nextRecord: CollaborationRecord = {
      ...record,
      id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
/* RECOVERY_GAP_LINE_4021 */
/* RECOVERY_GAP_LINE_4022 */
/* RECOVERY_GAP_LINE_4023 */
/* RECOVERY_GAP_LINE_4024 */
/* RECOVERY_GAP_LINE_4025 */
/* RECOVERY_GAP_LINE_4026 */
/* RECOVERY_GAP_LINE_4027 */
/* RECOVERY_GAP_LINE_4028 */
/* RECOVERY_GAP_LINE_4029 */
/* RECOVERY_GAP_LINE_4030 */
/* RECOVERY_GAP_LINE_4031 */
/* RECOVERY_GAP_LINE_4032 */
/* RECOVERY_GAP_LINE_4033 */
/* RECOVERY_GAP_LINE_4034 */
/* RECOVERY_GAP_LINE_4035 */
/* RECOVERY_GAP_LINE_4036 */
/* RECOVERY_GAP_LINE_4037 */
/* RECOVERY_GAP_LINE_4038 */
/* RECOVERY_GAP_LINE_4039 */
    stages: stages.length,
    tasks: stages.reduce((sum, stage) => sum + stage.tasks.length, 0),
  }));

  return (
    <div className="space-y-6">
      <Card className="border-blue-100 bg-gradient-to-br from-white via-blue-50 to-emerald-50">
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
            <div key={label} className="rounded-2xl bg-white p-4 ring-1 ring-blue-100">
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
                    <td className="px-3 py-4 font-semibold text-blue-700">{role.owner}</td>
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
                  <p className="mt-1 text-xl font-black text-blue-700">{template.stages}</p>
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
  const [, setPath] = useState<Path>(() => {
    const storedUser = readStoredUser();
    const current = window.location.pathname as Path;
    if (!storedUser) {
      window.history.replaceState({}, "", "/login");
      return "/login";
    }
    const targetPath = rolePath[storedUser.role];
    if (current !== targetPath) {
      window.history.replaceState({}, "", targetPath);
      return targetPath;
    }
