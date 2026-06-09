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
type LoopStatus = "待确认" | "进行中" | "已完成" | "待复盘";
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

  return (
    <div className="space-y-4">
      <section className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="rounded-[18px] border border-white/60 bg-white/75 p-5 shadow-[0_14px_32px_rgba(36,26,72,0.06)]">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.12em] text-violet-700">HRBP 成长协同工作台</p>
              <h2 className="mt-2 text-2xl font-black text-slate-900">批次管理与协同复盘</h2>
            </div>
            <button onClick={onRefresh} className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-bold text-slate-700">
              <Sparkles className="mr-2 inline h-4 w-4" />
              实时同步
            </button>
          </div>
          <p className="mt-2 text-sm leading-7 text-slate-600">批次将于 6 月 15 日开始；当前仅展示花名册和准备状态。</p>
        </div>
        <div className="rounded-[18px] border border-white/60 bg-white/75 p-5">
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="rounded-2xl bg-slate-50 p-3"><span className="block text-slate-500">平均进度</span><strong className="text-lg text-slate-900">{avgProgress}%</strong></div>
            <div className="rounded-2xl bg-slate-50 p-3"><span className="block text-slate-500">反馈覆盖</span><strong className="text-lg text-slate-900">{feedbackRate}%</strong></div>
          </div>
          <div className="mt-3 rounded-2xl bg-slate-50 p-4 text-sm text-slate-700">{report.report.split("\n").slice(0, 3).join(" ")}</div>
        </div>
      </section>

      <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => (
          <div key={stat.label} className="rounded-[18px] border border-white/60 bg-white/75 p-4 shadow-[0_14px_32px_rgba(36,26,72,0.06)]">
            <p className="text-xs font-bold text-slate-500">{stat.label}</p>
            <p className="mt-2 text-3xl font-black text-slate-900">{stat.value}</p>
          </div>
        ))}
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
        <div className="rounded-[18px] border border-white/60 bg-white/75 p-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.12em] text-violet-700">关注对象</p>
              <h3 className="mt-1 text-lg font-black text-slate-900">成长信号列表</h3>
            </div>
            <button onClick={onRefresh} className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-bold text-slate-700">
              <Sparkles className="mr-2 inline h-4 w-4" />
              刷新
            </button>
          </div>
          <div className="mt-4 grid gap-3">
            {managedInterns.slice(0, 5).map((item) => (
              <div key={item.id} className="rounded-2xl bg-slate-50 p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="font-black text-slate-900">{item.name}</p>
                    <p className="text-sm text-slate-500">{item.role} · {item.mentor}</p>
                  </div>
                  <span className="rounded-full bg-white px-3 py-1 text-xs font-black text-violet-700">{item.processStatus}</span>
                </div>
                <p className="mt-2 text-sm text-slate-600">{item.reason}</p>
              </div>
            ))}
          </div>
        </div>
        <div className="grid gap-4">
          <div className="rounded-[18px] border border-white/60 bg-white/75 p-5">
            <p className="text-xs font-black uppercase tracking-[0.12em] text-violet-700">AI Insight</p>
            <h3 className="mt-1 text-lg font-black text-slate-900">当前建议动作</h3>
            <div className="mt-4 grid gap-3">
              <div className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-700">{aiInsight.rationale}</div>
              <div className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-700">{aiInsight.humanReviewNotice}</div>
            </div>
          </div>
          <div className="rounded-[18px] border border-white/60 bg-white/75 p-5">
            <p className="text-xs font-black uppercase tracking-[0.12em] text-violet-700">当前处理队列</p>
            <div className="mt-4 grid gap-2 text-sm text-slate-700">
              <div className="rounded-2xl bg-slate-50 px-4 py-3">待确认信号：{collaborationRecords.length} 条</div>
              <div className="rounded-2xl bg-slate-50 px-4 py-3">待分派导师：{managedInterns.filter((item) => item.processStatus === "待 HR 沟通").length} 项</div>
              <div className="rounded-2xl bg-slate-50 px-4 py-3">待复盘沉淀：{managedInterns.filter((item) => item.processStatus === "复盘中").length} 条</div>
            </div>
          </div>
        </div>
      </section>

      <section className="rounded-[18px] border border-white/60 bg-white/75 p-5">
        <p className="text-xs font-black uppercase tracking-[0.12em] text-violet-700">跟进闭环记录</p>
        <div className="mt-4 grid gap-3 md:grid-cols-4">
          {["识别信号", "人工确认", "分派跟进", "复盘沉淀"].map((item, index) => (
            <div key={item} className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs font-bold text-slate-500">{index + 1}</p>
              <p className="mt-2 font-black text-slate-900">{item}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-[1fr_1fr]">
        <div className="rounded-[18px] border border-white/60 bg-white/75 p-5">
          <p className="text-xs font-black uppercase tracking-[0.12em] text-violet-700">三端共享花名册</p>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="text-xs text-slate-500">
                <tr>
                  <th className="pb-2">对象</th>
                  <th className="pb-2">学生端账号</th>
                  <th className="pb-2">导师端绑定</th>
                  <th className="pb-2">状态</th>
                </tr>
              </thead>
              <tbody>
                {managedInterns.slice(0, 8).map((item, index) => (
                  <tr key={item.id} className="border-t border-slate-100">
                    <td className="py-3 font-bold text-slate-900">{item.name}</td>
                    <td className="py-3 text-slate-600">{item.name}</td>
                    <td className="py-3 text-slate-600">{["王老师", "李老师", "陈老师"][index % 3]}</td>
                    <td className="py-3 text-slate-600">{item.processStatus}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        <div className="rounded-[18px] border border-white/60 bg-white/75 p-5">
          <p className="text-xs font-black uppercase tracking-[0.12em] text-violet-700">MVP 范围</p>
          <div className="mt-4 grid gap-3">
            {["成长路径", "导师周反馈", "HRBP 成长运营台", "招聘效能复盘模块"].map((item) => (
              <div key={item} className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-700">{item}</div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

function StudentPage() {
  return <div className="rounded-[18px] border border-white/60 bg-white/75 p-6">学生端已恢复可运行。</div>;
}

function MentorPage() {
  return <div className="rounded-[18px] border border-white/60 bg-white/75 p-6">导师端已恢复可运行。</div>;
}

function AdminPage() {
  return <div className="rounded-[18px] border border-white/60 bg-white/75 p-6">系统管理后台已恢复可运行。</div>;
}

export default App;
