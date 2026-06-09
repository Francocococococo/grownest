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
/* RECOVERY_GAP_LINE_526 */
/* RECOVERY_GAP_LINE_527 */
/* RECOVERY_GAP_LINE_528 */
/* RECOVERY_GAP_LINE_529 */
/* RECOVERY_GAP_LINE_530 */
/* RECOVERY_GAP_LINE_531 */
/* RECOVERY_GAP_LINE_532 */
/* RECOVERY_GAP_LINE_533 */
/* RECOVERY_GAP_LINE_534 */
/* RECOVERY_GAP_LINE_535 */
/* RECOVERY_GAP_LINE_536 */
/* RECOVERY_GAP_LINE_537 */
/* RECOVERY_GAP_LINE_538 */
/* RECOVERY_GAP_LINE_539 */
/* RECOVERY_GAP_LINE_540 */
/* RECOVERY_GAP_LINE_541 */
/* RECOVERY_GAP_LINE_542 */
/* RECOVERY_GAP_LINE_543 */
/* RECOVERY_GAP_LINE_544 */
/* RECOVERY_GAP_LINE_545 */
/* RECOVERY_GAP_LINE_546 */
/* RECOVERY_GAP_LINE_547 */
/* RECOVERY_GAP_LINE_548 */
/* RECOVERY_GAP_LINE_549 */
/* RECOVERY_GAP_LINE_550 */
/* RECOVERY_GAP_LINE_551 */
/* RECOVERY_GAP_LINE_552 */
/* RECOVERY_GAP_LINE_553 */
/* RECOVERY_GAP_LINE_554 */
/* RECOVERY_GAP_LINE_555 */
/* RECOVERY_GAP_LINE_556 */
/* RECOVERY_GAP_LINE_557 */
/* RECOVERY_GAP_LINE_558 */
/* RECOVERY_GAP_LINE_559 */
/* RECOVERY_GAP_LINE_560 */
/* RECOVERY_GAP_LINE_561 */
/* RECOVERY_GAP_LINE_562 */
/* RECOVERY_GAP_LINE_563 */
/* RECOVERY_GAP_LINE_564 */
/* RECOVERY_GAP_LINE_565 */
/* RECOVERY_GAP_LINE_566 */
/* RECOVERY_GAP_LINE_567 */
/* RECOVERY_GAP_LINE_568 */
/* RECOVERY_GAP_LINE_569 */
/* RECOVERY_GAP_LINE_570 */
/* RECOVERY_GAP_LINE_571 */
/* RECOVERY_GAP_LINE_572 */
/* RECOVERY_GAP_LINE_573 */
/* RECOVERY_GAP_LINE_574 */
/* RECOVERY_GAP_LINE_575 */
/* RECOVERY_GAP_LINE_576 */
/* RECOVERY_GAP_LINE_577 */
/* RECOVERY_GAP_LINE_578 */
/* RECOVERY_GAP_LINE_579 */
/* RECOVERY_GAP_LINE_580 */
/* RECOVERY_GAP_LINE_581 */
/* RECOVERY_GAP_LINE_582 */
/* RECOVERY_GAP_LINE_583 */
/* RECOVERY_GAP_LINE_584 */
/* RECOVERY_GAP_LINE_585 */
/* RECOVERY_GAP_LINE_586 */
/* RECOVERY_GAP_LINE_587 */
/* RECOVERY_GAP_LINE_588 */
/* RECOVERY_GAP_LINE_589 */
/* RECOVERY_GAP_LINE_590 */
/* RECOVERY_GAP_LINE_591 */
/* RECOVERY_GAP_LINE_592 */
/* RECOVERY_GAP_LINE_593 */
/* RECOVERY_GAP_LINE_594 */
/* RECOVERY_GAP_LINE_595 */
/* RECOVERY_GAP_LINE_596 */
/* RECOVERY_GAP_LINE_597 */
/* RECOVERY_GAP_LINE_598 */
/* RECOVERY_GAP_LINE_599 */
/* RECOVERY_GAP_LINE_600 */
/* RECOVERY_GAP_LINE_601 */
/* RECOVERY_GAP_LINE_602 */
/* RECOVERY_GAP_LINE_603 */
/* RECOVERY_GAP_LINE_604 */
/* RECOVERY_GAP_LINE_605 */
/* RECOVERY_GAP_LINE_606 */
/* RECOVERY_GAP_LINE_607 */
/* RECOVERY_GAP_LINE_608 */
/* RECOVERY_GAP_LINE_609 */
/* RECOVERY_GAP_LINE_610 */
/* RECOVERY_GAP_LINE_611 */
/* RECOVERY_GAP_LINE_612 */
/* RECOVERY_GAP_LINE_613 */
/* RECOVERY_GAP_LINE_614 */
/* RECOVERY_GAP_LINE_615 */
/* RECOVERY_GAP_LINE_616 */
/* RECOVERY_GAP_LINE_617 */
/* RECOVERY_GAP_LINE_618 */
/* RECOVERY_GAP_LINE_619 */
/* RECOVERY_GAP_LINE_620 */
/* RECOVERY_GAP_LINE_621 */
/* RECOVERY_GAP_LINE_622 */
/* RECOVERY_GAP_LINE_623 */
/* RECOVERY_GAP_LINE_624 */
/* RECOVERY_GAP_LINE_625 */
/* RECOVERY_GAP_LINE_626 */
/* RECOVERY_GAP_LINE_627 */
/* RECOVERY_GAP_LINE_628 */
/* RECOVERY_GAP_LINE_629 */
/* RECOVERY_GAP_LINE_630 */
/* RECOVERY_GAP_LINE_631 */
/* RECOVERY_GAP_LINE_632 */
/* RECOVERY_GAP_LINE_633 */
/* RECOVERY_GAP_LINE_634 */
/* RECOVERY_GAP_LINE_635 */
/* RECOVERY_GAP_LINE_636 */
/* RECOVERY_GAP_LINE_637 */
/* RECOVERY_GAP_LINE_638 */
/* RECOVERY_GAP_LINE_639 */
/* RECOVERY_GAP_LINE_640 */
/* RECOVERY_GAP_LINE_641 */
/* RECOVERY_GAP_LINE_642 */
/* RECOVERY_GAP_LINE_643 */
/* RECOVERY_GAP_LINE_644 */
/* RECOVERY_GAP_LINE_645 */
/* RECOVERY_GAP_LINE_646 */
/* RECOVERY_GAP_LINE_647 */
/* RECOVERY_GAP_LINE_648 */
/* RECOVERY_GAP_LINE_649 */
/* RECOVERY_GAP_LINE_650 */
/* RECOVERY_GAP_LINE_651 */
/* RECOVERY_GAP_LINE_652 */
/* RECOVERY_GAP_LINE_653 */
/* RECOVERY_GAP_LINE_654 */
/* RECOVERY_GAP_LINE_655 */
/* RECOVERY_GAP_LINE_656 */
/* RECOVERY_GAP_LINE_657 */
/* RECOVERY_GAP_LINE_658 */
/* RECOVERY_GAP_LINE_659 */
/* RECOVERY_GAP_LINE_660 */
/* RECOVERY_GAP_LINE_661 */
/* RECOVERY_GAP_LINE_662 */
/* RECOVERY_GAP_LINE_663 */
/* RECOVERY_GAP_LINE_664 */
/* RECOVERY_GAP_LINE_665 */
/* RECOVERY_GAP_LINE_666 */
/* RECOVERY_GAP_LINE_667 */
/* RECOVERY_GAP_LINE_668 */
/* RECOVERY_GAP_LINE_669 */
/* RECOVERY_GAP_LINE_670 */
/* RECOVERY_GAP_LINE_671 */
/* RECOVERY_GAP_LINE_672 */
/* RECOVERY_GAP_LINE_673 */
/* RECOVERY_GAP_LINE_674 */
/* RECOVERY_GAP_LINE_675 */
/* RECOVERY_GAP_LINE_676 */
/* RECOVERY_GAP_LINE_677 */
/* RECOVERY_GAP_LINE_678 */
/* RECOVERY_GAP_LINE_679 */
/* RECOVERY_GAP_LINE_680 */
/* RECOVERY_GAP_LINE_681 */
/* RECOVERY_GAP_LINE_682 */
/* RECOVERY_GAP_LINE_683 */
/* RECOVERY_GAP_LINE_684 */
/* RECOVERY_GAP_LINE_685 */
/* RECOVERY_GAP_LINE_686 */
/* RECOVERY_GAP_LINE_687 */
/* RECOVERY_GAP_LINE_688 */
/* RECOVERY_GAP_LINE_689 */
/* RECOVERY_GAP_LINE_690 */
/* RECOVERY_GAP_LINE_691 */
/* RECOVERY_GAP_LINE_692 */
/* RECOVERY_GAP_LINE_693 */
/* RECOVERY_GAP_LINE_694 */
/* RECOVERY_GAP_LINE_695 */
/* RECOVERY_GAP_LINE_696 */
/* RECOVERY_GAP_LINE_697 */
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
          });
          activeWorkbenchIndex = activeIndex;
        };

        const stageCardCleanups = stageCards.map((card, index) => {
          const activateFromPointer = () => {
            stageLoop?.pause();
/* RECOVERY_GAP_LINE_716 */
/* RECOVERY_GAP_LINE_717 */
/* RECOVERY_GAP_LINE_718 */
/* RECOVERY_GAP_LINE_719 */
/* RECOVERY_GAP_LINE_720 */
/* RECOVERY_GAP_LINE_721 */
/* RECOVERY_GAP_LINE_722 */
/* RECOVERY_GAP_LINE_723 */
/* RECOVERY_GAP_LINE_724 */
/* RECOVERY_GAP_LINE_725 */
/* RECOVERY_GAP_LINE_726 */
/* RECOVERY_GAP_LINE_727 */
/* RECOVERY_GAP_LINE_728 */
/* RECOVERY_GAP_LINE_729 */
/* RECOVERY_GAP_LINE_730 */
/* RECOVERY_GAP_LINE_731 */
/* RECOVERY_GAP_LINE_732 */
/* RECOVERY_GAP_LINE_733 */
/* RECOVERY_GAP_LINE_734 */
/* RECOVERY_GAP_LINE_735 */
/* RECOVERY_GAP_LINE_736 */
/* RECOVERY_GAP_LINE_737 */
/* RECOVERY_GAP_LINE_738 */
/* RECOVERY_GAP_LINE_739 */
/* RECOVERY_GAP_LINE_740 */
/* RECOVERY_GAP_LINE_741 */
/* RECOVERY_GAP_LINE_742 */
/* RECOVERY_GAP_LINE_743 */
/* RECOVERY_GAP_LINE_744 */
/* RECOVERY_GAP_LINE_745 */
/* RECOVERY_GAP_LINE_746 */
/* RECOVERY_GAP_LINE_747 */
/* RECOVERY_GAP_LINE_748 */
/* RECOVERY_GAP_LINE_749 */
/* RECOVERY_GAP_LINE_750 */
/* RECOVERY_GAP_LINE_751 */
/* RECOVERY_GAP_LINE_752 */
/* RECOVERY_GAP_LINE_753 */
/* RECOVERY_GAP_LINE_754 */
/* RECOVERY_GAP_LINE_755 */
/* RECOVERY_GAP_LINE_756 */
/* RECOVERY_GAP_LINE_757 */
/* RECOVERY_GAP_LINE_758 */
/* RECOVERY_GAP_LINE_759 */
/* RECOVERY_GAP_LINE_760 */
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
/* RECOVERY_GAP_LINE_880 */
/* RECOVERY_GAP_LINE_881 */
/* RECOVERY_GAP_LINE_882 */
/* RECOVERY_GAP_LINE_883 */
/* RECOVERY_GAP_LINE_884 */
/* RECOVERY_GAP_LINE_885 */
/* RECOVERY_GAP_LINE_886 */
/* RECOVERY_GAP_LINE_887 */
/* RECOVERY_GAP_LINE_888 */
/* RECOVERY_GAP_LINE_889 */
/* RECOVERY_GAP_LINE_890 */
/* RECOVERY_GAP_LINE_891 */
/* RECOVERY_GAP_LINE_892 */
/* RECOVERY_GAP_LINE_893 */
/* RECOVERY_GAP_LINE_894 */
/* RECOVERY_GAP_LINE_895 */
/* RECOVERY_GAP_LINE_896 */
/* RECOVERY_GAP_LINE_897 */
/* RECOVERY_GAP_LINE_898 */
/* RECOVERY_GAP_LINE_899 */
921:function normalizeDepartment(value?: string) {
929:function isSameDepartment(left?: string, right?: string) {
                }
              },
              { threshold: 0.28 },
            )
          : null;
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
      { label: "成长信号", value: intern.reason || "暂无", status },
      { label: "沟通频率", value: danger ? "低于同岗均值" : warning ? "需要加强" : "稳定", status },
    ],
    possibleCause: analysis.possibleCause,
    hrAction: analysis.suggestedActions.join("；"),
    syncMentor: danger ? "必须同步导师" : warning ? "需要同步导师" : "无需强制同步",
    reviewReminder: danger ? "后续复盘支持动作是否生效" : warning ? "下次检查改善动作完成情况" : "阶段反馈时复盘",
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
  try {
    const response = await fetch(`${apiBase}/api/generate`, {

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

function BrandLogo({ small = false, stacked = false }: { small?: boolean; stacked?: boolean }) {
  return (
    <div className={cn("flex min-w-0 items-center gap-3", stacked && "items-start gap-2")}>
      <LogoMark compact={small} />
      <div className="min-w-0">
        <div className={cn("font-black leading-none tracking-[0]", stacked ? "text-[13px] leading-tight" : "whitespace-nowrap", small && !stacked ? "text-sm" : "text-xl sm:text-2xl")}>
          <span className={cn("inline-block text-[#241A48]", stacked && "block")}>GrowNest</span>
          <span className={cn("inline-block text-[#171321]", stacked ? "mt-1 block" : "ml-2")}>鹅苗成长舱</span>
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
    待确认: loopStatusStyles.待确认,
    待复盘: loopStatusStyles.待复盘,
  };

  return <span className={cn("inline-flex items-center rounded-md border px-2.5 py-1 text-xs font-bold", styles[status] ?? styles.未开始)}>{status}</span>;
}

function LoopStatusPill({ status }: { status: LoopStatus }) {
  return <span className={cn("inline-flex items-center rounded-md border px-2.5 py-1 text-xs font-semibold", loopStatusStyles[status])}>{status}</span>;
}

function ActionLoopPanel({
  title,
  subtitle,
  items,
}: {
  title: string;
  subtitle: string;
  items: Array<{ label: string; detail: string; status: LoopStatus }>;
}) {
  return (
    <Card className="action-loop-panel" data-list-panel="">
      <SectionTitle icon={ClipboardList} title={title} subtitle={subtitle} />
      <div className="mt-4 grid gap-3 lg:grid-cols-4">
        {items.map((item, index) => (
          <div key={item.label} className="action-loop-step rounded-[14px] border border-slate-100 bg-white/74 p-4" data-gsap-result="">
            <div className="flex items-start justify-between gap-3">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-[var(--role-soft)] text-xs font-bold text-[var(--role-accent)] ring-1 ring-[var(--role-border)]">
                {index + 1}
              </span>
              <LoopStatusPill status={item.status} />
            </div>
            <p className="mt-4 text-sm font-semibold text-slate-950">{item.label}</p>
            <p className="mt-2 text-sm leading-6 text-slate-600">{item.detail}</p>
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
      }, showcaseRef);
      return () => ctx.revert();
    },
    { scope: showcaseRef },

  return (
    <div
      ref={showcaseRef}
      className="role-collab-showcase capability-summary relative overflow-hidden rounded-[24px] border border-[#504678]/10 bg-white/54 p-6 backdrop-blur-[18px]"
      data-workflow-header=""
    >
      <p className="text-sm leading-7 text-[#6F6A7A]" data-role-showcase-copy="">
        GrowNest 将 <span className="text-[#17324D]">任务进度</span>、<span className="text-[#17324D]">导师反馈</span> 与 <span className="text-[#17324D]">HRBP 跟进</span> 连接起来，让每一次成长信号都能被确认、跟进并沉淀为复盘记录。
      </p>

      <div className="role-flow-strip mt-5 rounded-full border border-[#504678]/10 bg-white/48 px-4 py-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.72)]" data-role-showcase-tabs="">
        <div className="role-flow-track relative flex items-center justify-between gap-3">
          <span className="role-flow-line" data-role-flow-line="" aria-hidden="true" />
          {collaborationShowcaseRoles.map(({ id, label, accent }) => (
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
/* RECOVERY_GAP_LINE_1840 */
/* RECOVERY_GAP_LINE_1841 */
/* RECOVERY_GAP_LINE_1842 */
/* RECOVERY_GAP_LINE_1843 */
/* RECOVERY_GAP_LINE_1844 */
/* RECOVERY_GAP_LINE_1845 */
/* RECOVERY_GAP_LINE_1846 */
/* RECOVERY_GAP_LINE_1847 */
/* RECOVERY_GAP_LINE_1848 */
/* RECOVERY_GAP_LINE_1849 */
/* RECOVERY_GAP_LINE_1850 */
/* RECOVERY_GAP_LINE_1851 */
/* RECOVERY_GAP_LINE_1852 */
/* RECOVERY_GAP_LINE_1853 */
/* RECOVERY_GAP_LINE_1854 */
/* RECOVERY_GAP_LINE_1855 */
/* RECOVERY_GAP_LINE_1856 */
/* RECOVERY_GAP_LINE_1857 */
/* RECOVERY_GAP_LINE_1858 */
/* RECOVERY_GAP_LINE_1859 */
/* RECOVERY_GAP_LINE_1860 */
/* RECOVERY_GAP_LINE_1861 */
/* RECOVERY_GAP_LINE_1862 */
/* RECOVERY_GAP_LINE_1863 */
/* RECOVERY_GAP_LINE_1864 */
/* RECOVERY_GAP_LINE_1865 */
/* RECOVERY_GAP_LINE_1866 */
/* RECOVERY_GAP_LINE_1867 */
/* RECOVERY_GAP_LINE_1868 */
/* RECOVERY_GAP_LINE_1869 */
/* RECOVERY_GAP_LINE_1870 */
/* RECOVERY_GAP_LINE_1871 */
/* RECOVERY_GAP_LINE_1872 */
/* RECOVERY_GAP_LINE_1873 */
/* RECOVERY_GAP_LINE_1874 */
/* RECOVERY_GAP_LINE_1875 */
/* RECOVERY_GAP_LINE_1876 */
/* RECOVERY_GAP_LINE_1877 */
/* RECOVERY_GAP_LINE_1878 */
/* RECOVERY_GAP_LINE_1879 */
/* RECOVERY_GAP_LINE_1880 */
/* RECOVERY_GAP_LINE_1881 */
/* RECOVERY_GAP_LINE_1882 */
/* RECOVERY_GAP_LINE_1883 */
/* RECOVERY_GAP_LINE_1884 */
/* RECOVERY_GAP_LINE_1885 */
/* RECOVERY_GAP_LINE_1886 */
/* RECOVERY_GAP_LINE_1887 */
/* RECOVERY_GAP_LINE_1888 */
/* RECOVERY_GAP_LINE_1889 */
/* RECOVERY_GAP_LINE_1890 */
/* RECOVERY_GAP_LINE_1891 */
/* RECOVERY_GAP_LINE_1892 */
/* RECOVERY_GAP_LINE_1893 */
/* RECOVERY_GAP_LINE_1894 */
/* RECOVERY_GAP_LINE_1895 */
/* RECOVERY_GAP_LINE_1896 */
/* RECOVERY_GAP_LINE_1897 */
/* RECOVERY_GAP_LINE_1898 */
/* RECOVERY_GAP_LINE_1899 */
/* RECOVERY_GAP_LINE_1900 */
/* RECOVERY_GAP_LINE_1901 */
/* RECOVERY_GAP_LINE_1902 */
/* RECOVERY_GAP_LINE_1903 */
/* RECOVERY_GAP_LINE_1904 */
/* RECOVERY_GAP_LINE_1905 */
/* RECOVERY_GAP_LINE_1906 */
/* RECOVERY_GAP_LINE_1907 */
/* RECOVERY_GAP_LINE_1908 */
/* RECOVERY_GAP_LINE_1909 */
/* RECOVERY_GAP_LINE_1910 */
/* RECOVERY_GAP_LINE_1911 */
/* RECOVERY_GAP_LINE_1912 */
/* RECOVERY_GAP_LINE_1913 */
/* RECOVERY_GAP_LINE_1914 */
/* RECOVERY_GAP_LINE_1915 */
/* RECOVERY_GAP_LINE_1916 */
/* RECOVERY_GAP_LINE_1917 */
/* RECOVERY_GAP_LINE_1918 */
/* RECOVERY_GAP_LINE_1919 */
/* RECOVERY_GAP_LINE_1920 */
/* RECOVERY_GAP_LINE_1921 */
/* RECOVERY_GAP_LINE_1922 */
/* RECOVERY_GAP_LINE_1923 */
/* RECOVERY_GAP_LINE_1924 */
/* RECOVERY_GAP_LINE_1925 */
/* RECOVERY_GAP_LINE_1926 */
/* RECOVERY_GAP_LINE_1927 */
/* RECOVERY_GAP_LINE_1928 */
/* RECOVERY_GAP_LINE_1929 */
/* RECOVERY_GAP_LINE_1930 */
/* RECOVERY_GAP_LINE_1931 */
/* RECOVERY_GAP_LINE_1932 */
/* RECOVERY_GAP_LINE_1933 */
/* RECOVERY_GAP_LINE_1934 */
/* RECOVERY_GAP_LINE_1935 */
/* RECOVERY_GAP_LINE_1936 */
/* RECOVERY_GAP_LINE_1937 */
/* RECOVERY_GAP_LINE_1938 */
/* RECOVERY_GAP_LINE_1939 */
/* RECOVERY_GAP_LINE_1940 */
/* RECOVERY_GAP_LINE_1941 */
/* RECOVERY_GAP_LINE_1942 */
/* RECOVERY_GAP_LINE_1943 */
/* RECOVERY_GAP_LINE_1944 */
/* RECOVERY_GAP_LINE_1945 */
/* RECOVERY_GAP_LINE_1946 */
/* RECOVERY_GAP_LINE_1947 */
/* RECOVERY_GAP_LINE_1948 */
/* RECOVERY_GAP_LINE_1949 */
/* RECOVERY_GAP_LINE_1950 */
/* RECOVERY_GAP_LINE_1951 */
/* RECOVERY_GAP_LINE_1952 */
/* RECOVERY_GAP_LINE_1953 */
/* RECOVERY_GAP_LINE_1954 */
/* RECOVERY_GAP_LINE_1955 */
/* RECOVERY_GAP_LINE_1956 */
/* RECOVERY_GAP_LINE_1957 */
/* RECOVERY_GAP_LINE_1958 */
/* RECOVERY_GAP_LINE_1959 */
/* RECOVERY_GAP_LINE_1960 */
/* RECOVERY_GAP_LINE_1961 */
/* RECOVERY_GAP_LINE_1962 */
/* RECOVERY_GAP_LINE_1963 */
/* RECOVERY_GAP_LINE_1964 */
/* RECOVERY_GAP_LINE_1965 */
/* RECOVERY_GAP_LINE_1966 */
/* RECOVERY_GAP_LINE_1967 */
/* RECOVERY_GAP_LINE_1968 */
/* RECOVERY_GAP_LINE_1969 */
/* RECOVERY_GAP_LINE_1970 */
/* RECOVERY_GAP_LINE_1971 */
/* RECOVERY_GAP_LINE_1972 */
/* RECOVERY_GAP_LINE_1973 */
/* RECOVERY_GAP_LINE_1974 */
/* RECOVERY_GAP_LINE_1975 */
/* RECOVERY_GAP_LINE_1976 */
/* RECOVERY_GAP_LINE_1977 */
/* RECOVERY_GAP_LINE_1978 */
/* RECOVERY_GAP_LINE_1979 */
/* RECOVERY_GAP_LINE_1980 */
/* RECOVERY_GAP_LINE_1981 */
/* RECOVERY_GAP_LINE_1982 */
/* RECOVERY_GAP_LINE_1983 */
/* RECOVERY_GAP_LINE_1984 */
/* RECOVERY_GAP_LINE_1985 */
/* RECOVERY_GAP_LINE_1986 */
/* RECOVERY_GAP_LINE_1987 */
/* RECOVERY_GAP_LINE_1988 */
/* RECOVERY_GAP_LINE_1989 */
/* RECOVERY_GAP_LINE_1990 */
/* RECOVERY_GAP_LINE_1991 */
/* RECOVERY_GAP_LINE_1992 */
/* RECOVERY_GAP_LINE_1993 */
/* RECOVERY_GAP_LINE_1994 */
/* RECOVERY_GAP_LINE_1995 */
/* RECOVERY_GAP_LINE_1996 */
/* RECOVERY_GAP_LINE_1997 */
/* RECOVERY_GAP_LINE_1998 */
/* RECOVERY_GAP_LINE_1999 */
/* RECOVERY_GAP_LINE_2000 */
/* RECOVERY_GAP_LINE_2001 */
/* RECOVERY_GAP_LINE_2002 */
/* RECOVERY_GAP_LINE_2003 */
/* RECOVERY_GAP_LINE_2004 */
/* RECOVERY_GAP_LINE_2005 */
/* RECOVERY_GAP_LINE_2006 */
/* RECOVERY_GAP_LINE_2007 */
/* RECOVERY_GAP_LINE_2008 */
/* RECOVERY_GAP_LINE_2009 */
/* RECOVERY_GAP_LINE_2010 */
/* RECOVERY_GAP_LINE_2011 */
/* RECOVERY_GAP_LINE_2012 */
/* RECOVERY_GAP_LINE_2013 */
/* RECOVERY_GAP_LINE_2014 */
/* RECOVERY_GAP_LINE_2015 */
/* RECOVERY_GAP_LINE_2016 */
/* RECOVERY_GAP_LINE_2017 */
/* RECOVERY_GAP_LINE_2018 */
/* RECOVERY_GAP_LINE_2019 */
/* RECOVERY_GAP_LINE_2020 */
/* RECOVERY_GAP_LINE_2021 */
/* RECOVERY_GAP_LINE_2022 */
/* RECOVERY_GAP_LINE_2023 */
/* RECOVERY_GAP_LINE_2024 */
/* RECOVERY_GAP_LINE_2025 */
/* RECOVERY_GAP_LINE_2026 */
/* RECOVERY_GAP_LINE_2027 */
/* RECOVERY_GAP_LINE_2028 */
/* RECOVERY_GAP_LINE_2029 */
/* RECOVERY_GAP_LINE_2030 */
/* RECOVERY_GAP_LINE_2031 */
/* RECOVERY_GAP_LINE_2032 */
/* RECOVERY_GAP_LINE_2033 */
/* RECOVERY_GAP_LINE_2034 */
/* RECOVERY_GAP_LINE_2035 */
/* RECOVERY_GAP_LINE_2036 */
/* RECOVERY_GAP_LINE_2037 */
/* RECOVERY_GAP_LINE_2038 */
/* RECOVERY_GAP_LINE_2039 */
/* RECOVERY_GAP_LINE_2040 */
/* RECOVERY_GAP_LINE_2041 */
/* RECOVERY_GAP_LINE_2042 */
/* RECOVERY_GAP_LINE_2043 */
/* RECOVERY_GAP_LINE_2044 */
/* RECOVERY_GAP_LINE_2045 */
/* RECOVERY_GAP_LINE_2046 */
/* RECOVERY_GAP_LINE_2047 */
/* RECOVERY_GAP_LINE_2048 */
/* RECOVERY_GAP_LINE_2049 */
/* RECOVERY_GAP_LINE_2050 */
/* RECOVERY_GAP_LINE_2051 */
/* RECOVERY_GAP_LINE_2052 */
/* RECOVERY_GAP_LINE_2053 */
/* RECOVERY_GAP_LINE_2054 */
/* RECOVERY_GAP_LINE_2055 */
/* RECOVERY_GAP_LINE_2056 */
/* RECOVERY_GAP_LINE_2057 */
/* RECOVERY_GAP_LINE_2058 */
/* RECOVERY_GAP_LINE_2059 */
/* RECOVERY_GAP_LINE_2060 */
/* RECOVERY_GAP_LINE_2061 */
/* RECOVERY_GAP_LINE_2062 */
/* RECOVERY_GAP_LINE_2063 */
/* RECOVERY_GAP_LINE_2064 */
/* RECOVERY_GAP_LINE_2065 */
/* RECOVERY_GAP_LINE_2066 */
/* RECOVERY_GAP_LINE_2067 */
/* RECOVERY_GAP_LINE_2068 */
/* RECOVERY_GAP_LINE_2069 */
/* RECOVERY_GAP_LINE_2070 */
/* RECOVERY_GAP_LINE_2071 */
/* RECOVERY_GAP_LINE_2072 */
/* RECOVERY_GAP_LINE_2073 */
/* RECOVERY_GAP_LINE_2074 */
/* RECOVERY_GAP_LINE_2075 */
/* RECOVERY_GAP_LINE_2076 */
/* RECOVERY_GAP_LINE_2077 */
/* RECOVERY_GAP_LINE_2078 */
/* RECOVERY_GAP_LINE_2079 */
/* RECOVERY_GAP_LINE_2080 */
/* RECOVERY_GAP_LINE_2081 */
/* RECOVERY_GAP_LINE_2082 */
/* RECOVERY_GAP_LINE_2083 */
/* RECOVERY_GAP_LINE_2084 */
/* RECOVERY_GAP_LINE_2085 */
/* RECOVERY_GAP_LINE_2086 */
/* RECOVERY_GAP_LINE_2087 */
/* RECOVERY_GAP_LINE_2088 */
/* RECOVERY_GAP_LINE_2089 */
/* RECOVERY_GAP_LINE_2090 */
/* RECOVERY_GAP_LINE_2091 */
/* RECOVERY_GAP_LINE_2092 */
/* RECOVERY_GAP_LINE_2093 */
/* RECOVERY_GAP_LINE_2094 */
/* RECOVERY_GAP_LINE_2095 */
/* RECOVERY_GAP_LINE_2096 */
/* RECOVERY_GAP_LINE_2097 */
/* RECOVERY_GAP_LINE_2098 */
/* RECOVERY_GAP_LINE_2099 */
/* RECOVERY_GAP_LINE_2100 */
/* RECOVERY_GAP_LINE_2101 */
/* RECOVERY_GAP_LINE_2102 */
/* RECOVERY_GAP_LINE_2103 */
/* RECOVERY_GAP_LINE_2104 */
/* RECOVERY_GAP_LINE_2105 */
/* RECOVERY_GAP_LINE_2106 */
/* RECOVERY_GAP_LINE_2107 */
/* RECOVERY_GAP_LINE_2108 */
/* RECOVERY_GAP_LINE_2109 */
/* RECOVERY_GAP_LINE_2110 */
/* RECOVERY_GAP_LINE_2111 */
/* RECOVERY_GAP_LINE_2112 */
/* RECOVERY_GAP_LINE_2113 */
/* RECOVERY_GAP_LINE_2114 */
/* RECOVERY_GAP_LINE_2115 */
/* RECOVERY_GAP_LINE_2116 */
/* RECOVERY_GAP_LINE_2117 */
/* RECOVERY_GAP_LINE_2118 */
/* RECOVERY_GAP_LINE_2119 */
/* RECOVERY_GAP_LINE_2120 */
/* RECOVERY_GAP_LINE_2121 */
/* RECOVERY_GAP_LINE_2122 */
/* RECOVERY_GAP_LINE_2123 */
/* RECOVERY_GAP_LINE_2124 */
/* RECOVERY_GAP_LINE_2125 */
/* RECOVERY_GAP_LINE_2126 */
/* RECOVERY_GAP_LINE_2127 */
/* RECOVERY_GAP_LINE_2128 */
/* RECOVERY_GAP_LINE_2129 */
/* RECOVERY_GAP_LINE_2130 */
/* RECOVERY_GAP_LINE_2131 */
/* RECOVERY_GAP_LINE_2132 */
/* RECOVERY_GAP_LINE_2133 */
/* RECOVERY_GAP_LINE_2134 */
/* RECOVERY_GAP_LINE_2135 */
/* RECOVERY_GAP_LINE_2136 */
/* RECOVERY_GAP_LINE_2137 */
/* RECOVERY_GAP_LINE_2138 */
/* RECOVERY_GAP_LINE_2139 */
/* RECOVERY_GAP_LINE_2140 */
/* RECOVERY_GAP_LINE_2141 */
/* RECOVERY_GAP_LINE_2142 */
/* RECOVERY_GAP_LINE_2143 */
/* RECOVERY_GAP_LINE_2144 */
/* RECOVERY_GAP_LINE_2145 */
/* RECOVERY_GAP_LINE_2146 */
/* RECOVERY_GAP_LINE_2147 */
/* RECOVERY_GAP_LINE_2148 */
/* RECOVERY_GAP_LINE_2149 */
/* RECOVERY_GAP_LINE_2150 */
/* RECOVERY_GAP_LINE_2151 */
/* RECOVERY_GAP_LINE_2152 */
/* RECOVERY_GAP_LINE_2153 */
/* RECOVERY_GAP_LINE_2154 */
/* RECOVERY_GAP_LINE_2155 */
/* RECOVERY_GAP_LINE_2156 */
/* RECOVERY_GAP_LINE_2157 */
/* RECOVERY_GAP_LINE_2158 */
/* RECOVERY_GAP_LINE_2159 */
/* RECOVERY_GAP_LINE_2160 */
/* RECOVERY_GAP_LINE_2161 */
/* RECOVERY_GAP_LINE_2162 */
/* RECOVERY_GAP_LINE_2163 */
/* RECOVERY_GAP_LINE_2164 */
/* RECOVERY_GAP_LINE_2165 */
/* RECOVERY_GAP_LINE_2166 */
/* RECOVERY_GAP_LINE_2167 */
/* RECOVERY_GAP_LINE_2168 */
/* RECOVERY_GAP_LINE_2169 */
/* RECOVERY_GAP_LINE_2170 */
/* RECOVERY_GAP_LINE_2171 */
/* RECOVERY_GAP_LINE_2172 */
/* RECOVERY_GAP_LINE_2173 */
/* RECOVERY_GAP_LINE_2174 */
/* RECOVERY_GAP_LINE_2175 */
/* RECOVERY_GAP_LINE_2176 */
/* RECOVERY_GAP_LINE_2177 */
/* RECOVERY_GAP_LINE_2178 */
/* RECOVERY_GAP_LINE_2179 */
/* RECOVERY_GAP_LINE_2180 */
/* RECOVERY_GAP_LINE_2181 */
/* RECOVERY_GAP_LINE_2182 */
/* RECOVERY_GAP_LINE_2183 */
/* RECOVERY_GAP_LINE_2184 */
/* RECOVERY_GAP_LINE_2185 */
/* RECOVERY_GAP_LINE_2186 */
/* RECOVERY_GAP_LINE_2187 */
/* RECOVERY_GAP_LINE_2188 */
/* RECOVERY_GAP_LINE_2189 */
/* RECOVERY_GAP_LINE_2190 */
/* RECOVERY_GAP_LINE_2191 */
/* RECOVERY_GAP_LINE_2192 */
/* RECOVERY_GAP_LINE_2193 */
/* RECOVERY_GAP_LINE_2194 */
/* RECOVERY_GAP_LINE_2195 */
/* RECOVERY_GAP_LINE_2196 */
/* RECOVERY_GAP_LINE_2197 */
/* RECOVERY_GAP_LINE_2198 */
/* RECOVERY_GAP_LINE_2199 */
/* RECOVERY_GAP_LINE_2200 */
/* RECOVERY_GAP_LINE_2201 */
/* RECOVERY_GAP_LINE_2202 */
/* RECOVERY_GAP_LINE_2203 */
/* RECOVERY_GAP_LINE_2204 */
/* RECOVERY_GAP_LINE_2205 */
/* RECOVERY_GAP_LINE_2206 */
/* RECOVERY_GAP_LINE_2207 */
/* RECOVERY_GAP_LINE_2208 */
/* RECOVERY_GAP_LINE_2209 */
/* RECOVERY_GAP_LINE_2210 */
/* RECOVERY_GAP_LINE_2211 */
/* RECOVERY_GAP_LINE_2212 */
/* RECOVERY_GAP_LINE_2213 */
/* RECOVERY_GAP_LINE_2214 */
/* RECOVERY_GAP_LINE_2215 */
/* RECOVERY_GAP_LINE_2216 */
/* RECOVERY_GAP_LINE_2217 */
/* RECOVERY_GAP_LINE_2218 */
/* RECOVERY_GAP_LINE_2219 */
/* RECOVERY_GAP_LINE_2220 */
/* RECOVERY_GAP_LINE_2221 */
/* RECOVERY_GAP_LINE_2222 */
/* RECOVERY_GAP_LINE_2223 */
/* RECOVERY_GAP_LINE_2224 */
/* RECOVERY_GAP_LINE_2225 */
/* RECOVERY_GAP_LINE_2226 */
/* RECOVERY_GAP_LINE_2227 */
/* RECOVERY_GAP_LINE_2228 */
/* RECOVERY_GAP_LINE_2229 */
/* RECOVERY_GAP_LINE_2230 */
/* RECOVERY_GAP_LINE_2231 */
/* RECOVERY_GAP_LINE_2232 */
/* RECOVERY_GAP_LINE_2233 */
/* RECOVERY_GAP_LINE_2234 */
/* RECOVERY_GAP_LINE_2235 */
/* RECOVERY_GAP_LINE_2236 */
/* RECOVERY_GAP_LINE_2237 */
/* RECOVERY_GAP_LINE_2238 */
/* RECOVERY_GAP_LINE_2239 */
/* RECOVERY_GAP_LINE_2240 */
/* RECOVERY_GAP_LINE_2241 */
/* RECOVERY_GAP_LINE_2242 */
/* RECOVERY_GAP_LINE_2243 */
/* RECOVERY_GAP_LINE_2244 */
/* RECOVERY_GAP_LINE_2245 */
/* RECOVERY_GAP_LINE_2246 */
/* RECOVERY_GAP_LINE_2247 */
/* RECOVERY_GAP_LINE_2248 */
/* RECOVERY_GAP_LINE_2249 */
/* RECOVERY_GAP_LINE_2250 */
/* RECOVERY_GAP_LINE_2251 */
/* RECOVERY_GAP_LINE_2252 */
/* RECOVERY_GAP_LINE_2253 */
/* RECOVERY_GAP_LINE_2254 */
/* RECOVERY_GAP_LINE_2255 */
/* RECOVERY_GAP_LINE_2256 */
/* RECOVERY_GAP_LINE_2257 */
/* RECOVERY_GAP_LINE_2258 */
/* RECOVERY_GAP_LINE_2259 */
/* RECOVERY_GAP_LINE_2260 */
/* RECOVERY_GAP_LINE_2261 */
/* RECOVERY_GAP_LINE_2262 */
/* RECOVERY_GAP_LINE_2263 */
/* RECOVERY_GAP_LINE_2264 */
/* RECOVERY_GAP_LINE_2265 */
/* RECOVERY_GAP_LINE_2266 */
/* RECOVERY_GAP_LINE_2267 */
/* RECOVERY_GAP_LINE_2268 */
/* RECOVERY_GAP_LINE_2269 */
/* RECOVERY_GAP_LINE_2270 */
/* RECOVERY_GAP_LINE_2271 */
/* RECOVERY_GAP_LINE_2272 */
/* RECOVERY_GAP_LINE_2273 */
/* RECOVERY_GAP_LINE_2274 */
/* RECOVERY_GAP_LINE_2275 */
/* RECOVERY_GAP_LINE_2276 */
/* RECOVERY_GAP_LINE_2277 */
/* RECOVERY_GAP_LINE_2278 */
/* RECOVERY_GAP_LINE_2279 */
/* RECOVERY_GAP_LINE_2280 */
/* RECOVERY_GAP_LINE_2281 */
/* RECOVERY_GAP_LINE_2282 */
/* RECOVERY_GAP_LINE_2283 */
/* RECOVERY_GAP_LINE_2284 */
/* RECOVERY_GAP_LINE_2285 */
/* RECOVERY_GAP_LINE_2286 */
/* RECOVERY_GAP_LINE_2287 */
/* RECOVERY_GAP_LINE_2288 */
/* RECOVERY_GAP_LINE_2289 */
/* RECOVERY_GAP_LINE_2290 */
/* RECOVERY_GAP_LINE_2291 */
/* RECOVERY_GAP_LINE_2292 */
/* RECOVERY_GAP_LINE_2293 */
/* RECOVERY_GAP_LINE_2294 */
/* RECOVERY_GAP_LINE_2295 */
/* RECOVERY_GAP_LINE_2296 */
/* RECOVERY_GAP_LINE_2297 */
/* RECOVERY_GAP_LINE_2298 */
/* RECOVERY_GAP_LINE_2299 */
/* RECOVERY_GAP_LINE_2300 */
/* RECOVERY_GAP_LINE_2301 */
/* RECOVERY_GAP_LINE_2302 */
/* RECOVERY_GAP_LINE_2303 */
/* RECOVERY_GAP_LINE_2304 */
/* RECOVERY_GAP_LINE_2305 */
/* RECOVERY_GAP_LINE_2306 */
/* RECOVERY_GAP_LINE_2307 */
/* RECOVERY_GAP_LINE_2308 */
/* RECOVERY_GAP_LINE_2309 */
/* RECOVERY_GAP_LINE_2310 */
/* RECOVERY_GAP_LINE_2311 */
/* RECOVERY_GAP_LINE_2312 */
/* RECOVERY_GAP_LINE_2313 */
/* RECOVERY_GAP_LINE_2314 */
/* RECOVERY_GAP_LINE_2315 */
/* RECOVERY_GAP_LINE_2316 */
/* RECOVERY_GAP_LINE_2317 */
/* RECOVERY_GAP_LINE_2318 */
/* RECOVERY_GAP_LINE_2319 */
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
    <Card className={cn("enterprise-sidebar p-2", user.role === "mentor" ? "mentor-sidebar-card" : "min-h-[calc(100vh-120px)]")}>
      <div className="mb-3 border-b border-slate-100 px-2 pb-3 pt-1">
        <BrandLogo small />
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
  );

  const workbenchCard = (
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
        "mx-auto max-w-[1440px] gap-4 px-4 py-4",
        user.role === "mentor" ? "grid xl:grid-cols-[228px_minmax(0,1fr)]" : "flex",
      )}>
        <aside className="hidden w-[228px] shrink-0 xl:block">
          <div className="sticky top-24 space-y-3">{sidebarCard}</div>
        </aside>

        {user.role === "mentor" ? (
          <>
            <main className="min-w-0 space-y-4">{workbenchCard}</main>
            <section className="min-w-0 space-y-4 xl:contents">
              {children}
            </section>
          </>
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
/* RECOVERY_GAP_LINE_2556 */
/* RECOVERY_GAP_LINE_2557 */
/* RECOVERY_GAP_LINE_2558 */
/* RECOVERY_GAP_LINE_2559 */
/* RECOVERY_GAP_LINE_2560 */
/* RECOVERY_GAP_LINE_2561 */
/* RECOVERY_GAP_LINE_2562 */
/* RECOVERY_GAP_LINE_2563 */
/* RECOVERY_GAP_LINE_2564 */
/* RECOVERY_GAP_LINE_2565 */
/* RECOVERY_GAP_LINE_2566 */
/* RECOVERY_GAP_LINE_2567 */
/* RECOVERY_GAP_LINE_2568 */
/* RECOVERY_GAP_LINE_2569 */
/* RECOVERY_GAP_LINE_2570 */
/* RECOVERY_GAP_LINE_2571 */
/* RECOVERY_GAP_LINE_2572 */
/* RECOVERY_GAP_LINE_2573 */
/* RECOVERY_GAP_LINE_2574 */
/* RECOVERY_GAP_LINE_2575 */
/* RECOVERY_GAP_LINE_2576 */
/* RECOVERY_GAP_LINE_2577 */
/* RECOVERY_GAP_LINE_2578 */
/* RECOVERY_GAP_LINE_2579 */
/* RECOVERY_GAP_LINE_2580 */
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
  const studentLoopItems = [
    {
      label: "收到阶段行动",
      detail: primaryTask ? `当前优先推进「${primaryTask.label}」，完成后再整理交付物和问题。` : "当前阶段暂无待办，可整理成长记录。",
      status: pendingTasks.length ? "进行中" as LoopStatus : "已完成" as LoopStatus,
    },
    {
      label: "完成本周动作",
      detail: completedWeekTasks.length ? `已完成 ${completedWeekTasks.length} 个动作，记录会同步到成长进度。` : "先完成最明确的一项任务，避免本周行动停在计划层。",
      status: completedWeekTasks.length ? "已完成" as LoopStatus : "进行中" as LoopStatus,
    },
    {
      label: "向导师确认",
      detail: mentorQuestionRecords.length ? "已向导师发送问题，等待回复或继续补充上下文。" : "把不确定点整理成一句具体问题后发送导师。",
      status: mentorQuestionRecords.some((record) => record.answer) ? "已完成" as LoopStatus : mentorQuestionRecords.length ? "待确认" as LoopStatus : "进行中" as LoopStatus,
    },
    {
      label: "沉淀成长记录",
      detail: combinedMentorFeedbackRecords.length ? "导师反馈已沉淀，可作为下一阶段行动依据。" : "导师确认后，反馈会进入这里形成复盘线索。",
      status: combinedMentorFeedbackRecords.length ? "待复盘" as LoopStatus : "待确认" as LoopStatus,
    },
  ];

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
                  我的成长路径 · {selectedDate.label}
                </h2>
                <span className="rounded-full bg-[var(--role-soft)] px-2.5 py-1 text-xs font-black text-[var(--role-accent)] ring-1 ring-[var(--role-border)]">
                  第 {currentWeekNumber}/13 周 · 阶段路径
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
                <span>当前阶段：{currentStage?.theme ?? "阶段目标推进"}，本周范围 {currentWeekStart.monthDay}-{currentWeekEnd.monthDay}</span>
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
                <span className="text-xs font-black text-[var(--role-accent)]">阶段路径</span>
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
                  <p className="text-xs font-bold text-slate-500">本周行动进度</p>
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
                  <p className="text-sm font-black text-[var(--role-accent)]">AI 辅助整理</p>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="ghost" className="px-3 py-1.5 text-xs" onClick={generateDailyPlan} disabled={dailyPlanLoading}>
                    {dailyPlanLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
                    {dailyPlanLoading ? "AI 正在整理..." : "重新整理建议"}
                  </Button>
                </div>
              </div>
              {dailyPlanError && <FeedbackNotice tone="warning" className="mt-3 text-xs">{dailyPlanError}</FeedbackNotice>}
              {dailyPlan ? (
                <div className="mt-3 space-y-2">
                  <div className="rounded-lg bg-[var(--role-soft)] p-3 ring-1 ring-[var(--role-border)]" data-gsap-result="">
                    <p className="text-xs font-black text-[var(--role-accent)]">今日建议</p>
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
                  {dailyPlanLoading ? "AI 正在根据当前任务和岗位整理行动建议..." : "点击“重新整理建议”获取今日建议。"}
                </div>
              )}
            </div>
          </div>
        </div>
      </Card>

      <Card data-list-panel="">
          <SectionTitle icon={GraduationCap} title="当前成长阶段" subtitle="回答“我现在在哪、这周做什么、需要向导师确认什么”" />
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
        <SectionTitle icon={ClipboardList} title="本周阶段任务" subtitle="把待推进动作和已完成记录分开沉淀，避免只看进度数字" />
          <div className="mt-4 grid gap-2">
/* RECOVERY_GAP_LINE_3216 */
/* RECOVERY_GAP_LINE_3217 */
/* RECOVERY_GAP_LINE_3218 */
/* RECOVERY_GAP_LINE_3219 */
/* RECOVERY_GAP_LINE_3220 */
/* RECOVERY_GAP_LINE_3221 */
/* RECOVERY_GAP_LINE_3222 */
/* RECOVERY_GAP_LINE_3223 */
/* RECOVERY_GAP_LINE_3224 */
/* RECOVERY_GAP_LINE_3225 */
/* RECOVERY_GAP_LINE_3226 */
/* RECOVERY_GAP_LINE_3227 */
/* RECOVERY_GAP_LINE_3228 */
/* RECOVERY_GAP_LINE_3229 */
/* RECOVERY_GAP_LINE_3230 */
/* RECOVERY_GAP_LINE_3231 */
/* RECOVERY_GAP_LINE_3232 */
/* RECOVERY_GAP_LINE_3233 */
/* RECOVERY_GAP_LINE_3234 */
/* RECOVERY_GAP_LINE_3235 */
/* RECOVERY_GAP_LINE_3236 */
/* RECOVERY_GAP_LINE_3237 */
/* RECOVERY_GAP_LINE_3238 */
/* RECOVERY_GAP_LINE_3239 */
/* RECOVERY_GAP_LINE_3240 */
/* RECOVERY_GAP_LINE_3241 */
/* RECOVERY_GAP_LINE_3242 */
/* RECOVERY_GAP_LINE_3243 */
/* RECOVERY_GAP_LINE_3244 */
/* RECOVERY_GAP_LINE_3245 */
/* RECOVERY_GAP_LINE_3246 */
/* RECOVERY_GAP_LINE_3247 */
/* RECOVERY_GAP_LINE_3248 */
/* RECOVERY_GAP_LINE_3249 */
/* RECOVERY_GAP_LINE_3250 */
/* RECOVERY_GAP_LINE_3251 */
/* RECOVERY_GAP_LINE_3252 */
/* RECOVERY_GAP_LINE_3253 */
/* RECOVERY_GAP_LINE_3254 */
/* RECOVERY_GAP_LINE_3255 */
/* RECOVERY_GAP_LINE_3256 */
/* RECOVERY_GAP_LINE_3257 */
/* RECOVERY_GAP_LINE_3258 */
/* RECOVERY_GAP_LINE_3259 */
/* RECOVERY_GAP_LINE_3260 */
/* RECOVERY_GAP_LINE_3261 */
/* RECOVERY_GAP_LINE_3262 */
/* RECOVERY_GAP_LINE_3263 */
/* RECOVERY_GAP_LINE_3264 */
/* RECOVERY_GAP_LINE_3265 */
/* RECOVERY_GAP_LINE_3266 */
/* RECOVERY_GAP_LINE_3267 */
/* RECOVERY_GAP_LINE_3268 */
/* RECOVERY_GAP_LINE_3269 */
/* RECOVERY_GAP_LINE_3270 */
/* RECOVERY_GAP_LINE_3271 */
/* RECOVERY_GAP_LINE_3272 */
/* RECOVERY_GAP_LINE_3273 */
/* RECOVERY_GAP_LINE_3274 */
/* RECOVERY_GAP_LINE_3275 */
/* RECOVERY_GAP_LINE_3276 */
/* RECOVERY_GAP_LINE_3277 */
/* RECOVERY_GAP_LINE_3278 */
/* RECOVERY_GAP_LINE_3279 */
/* RECOVERY_GAP_LINE_3280 */
/* RECOVERY_GAP_LINE_3281 */
/* RECOVERY_GAP_LINE_3282 */
/* RECOVERY_GAP_LINE_3283 */
/* RECOVERY_GAP_LINE_3284 */
/* RECOVERY_GAP_LINE_3285 */
/* RECOVERY_GAP_LINE_3286 */
/* RECOVERY_GAP_LINE_3287 */
/* RECOVERY_GAP_LINE_3288 */
/* RECOVERY_GAP_LINE_3289 */
/* RECOVERY_GAP_LINE_3290 */
/* RECOVERY_GAP_LINE_3291 */
/* RECOVERY_GAP_LINE_3292 */
/* RECOVERY_GAP_LINE_3293 */
/* RECOVERY_GAP_LINE_3294 */
/* RECOVERY_GAP_LINE_3295 */
/* RECOVERY_GAP_LINE_3296 */
/* RECOVERY_GAP_LINE_3297 */
/* RECOVERY_GAP_LINE_3298 */
/* RECOVERY_GAP_LINE_3299 */
/* RECOVERY_GAP_LINE_3300 */
/* RECOVERY_GAP_LINE_3301 */
/* RECOVERY_GAP_LINE_3302 */
/* RECOVERY_GAP_LINE_3303 */
/* RECOVERY_GAP_LINE_3304 */
/* RECOVERY_GAP_LINE_3305 */
/* RECOVERY_GAP_LINE_3306 */
/* RECOVERY_GAP_LINE_3307 */
/* RECOVERY_GAP_LINE_3308 */
/* RECOVERY_GAP_LINE_3309 */
/* RECOVERY_GAP_LINE_3310 */
/* RECOVERY_GAP_LINE_3311 */
/* RECOVERY_GAP_LINE_3312 */
/* RECOVERY_GAP_LINE_3313 */
/* RECOVERY_GAP_LINE_3314 */
/* RECOVERY_GAP_LINE_3315 */
/* RECOVERY_GAP_LINE_3316 */
/* RECOVERY_GAP_LINE_3317 */
/* RECOVERY_GAP_LINE_3318 */
/* RECOVERY_GAP_LINE_3319 */
/* RECOVERY_GAP_LINE_3320 */
/* RECOVERY_GAP_LINE_3321 */
/* RECOVERY_GAP_LINE_3322 */
/* RECOVERY_GAP_LINE_3323 */
/* RECOVERY_GAP_LINE_3324 */
/* RECOVERY_GAP_LINE_3325 */
/* RECOVERY_GAP_LINE_3326 */
/* RECOVERY_GAP_LINE_3327 */
/* RECOVERY_GAP_LINE_3328 */
/* RECOVERY_GAP_LINE_3329 */
/* RECOVERY_GAP_LINE_3330 */
/* RECOVERY_GAP_LINE_3331 */
/* RECOVERY_GAP_LINE_3332 */
/* RECOVERY_GAP_LINE_3333 */
/* RECOVERY_GAP_LINE_3334 */
/* RECOVERY_GAP_LINE_3335 */
/* RECOVERY_GAP_LINE_3336 */
/* RECOVERY_GAP_LINE_3337 */
/* RECOVERY_GAP_LINE_3338 */
/* RECOVERY_GAP_LINE_3339 */
/* RECOVERY_GAP_LINE_3340 */
/* RECOVERY_GAP_LINE_3341 */
/* RECOVERY_GAP_LINE_3342 */
/* RECOVERY_GAP_LINE_3343 */
/* RECOVERY_GAP_LINE_3344 */
/* RECOVERY_GAP_LINE_3345 */
/* RECOVERY_GAP_LINE_3346 */
/* RECOVERY_GAP_LINE_3347 */
/* RECOVERY_GAP_LINE_3348 */
/* RECOVERY_GAP_LINE_3349 */
/* RECOVERY_GAP_LINE_3350 */
/* RECOVERY_GAP_LINE_3351 */
/* RECOVERY_GAP_LINE_3352 */
/* RECOVERY_GAP_LINE_3353 */
/* RECOVERY_GAP_LINE_3354 */
/* RECOVERY_GAP_LINE_3355 */
/* RECOVERY_GAP_LINE_3356 */
/* RECOVERY_GAP_LINE_3357 */
/* RECOVERY_GAP_LINE_3358 */
/* RECOVERY_GAP_LINE_3359 */
/* RECOVERY_GAP_LINE_3360 */
/* RECOVERY_GAP_LINE_3361 */
/* RECOVERY_GAP_LINE_3362 */
/* RECOVERY_GAP_LINE_3363 */
/* RECOVERY_GAP_LINE_3364 */
/* RECOVERY_GAP_LINE_3365 */
/* RECOVERY_GAP_LINE_3366 */
/* RECOVERY_GAP_LINE_3367 */
/* RECOVERY_GAP_LINE_3368 */
/* RECOVERY_GAP_LINE_3369 */
/* RECOVERY_GAP_LINE_3370 */
/* RECOVERY_GAP_LINE_3371 */
/* RECOVERY_GAP_LINE_3372 */
/* RECOVERY_GAP_LINE_3373 */
/* RECOVERY_GAP_LINE_3374 */
/* RECOVERY_GAP_LINE_3375 */
/* RECOVERY_GAP_LINE_3376 */
/* RECOVERY_GAP_LINE_3377 */
/* RECOVERY_GAP_LINE_3378 */
/* RECOVERY_GAP_LINE_3379 */
/* RECOVERY_GAP_LINE_3380 */
/* RECOVERY_GAP_LINE_3381 */
/* RECOVERY_GAP_LINE_3382 */
/* RECOVERY_GAP_LINE_3383 */
/* RECOVERY_GAP_LINE_3384 */
/* RECOVERY_GAP_LINE_3385 */
/* RECOVERY_GAP_LINE_3386 */
/* RECOVERY_GAP_LINE_3387 */
/* RECOVERY_GAP_LINE_3388 */
/* RECOVERY_GAP_LINE_3389 */
/* RECOVERY_GAP_LINE_3390 */
/* RECOVERY_GAP_LINE_3391 */
/* RECOVERY_GAP_LINE_3392 */
/* RECOVERY_GAP_LINE_3393 */
/* RECOVERY_GAP_LINE_3394 */
/* RECOVERY_GAP_LINE_3395 */
/* RECOVERY_GAP_LINE_3396 */
/* RECOVERY_GAP_LINE_3397 */
/* RECOVERY_GAP_LINE_3398 */
/* RECOVERY_GAP_LINE_3399 */
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
    return scoped.map((intern) => {
      const completedTaskCount = intern.tasks.filter((task) => task.status === "已完成").length;
      const taskProgress = intern.tasks.length ? Math.round((completedTaskCount / intern.tasks.length) * 100) : intern.progress;
      return {
        name: intern.name,
        role: intern.role,
        title: intern.title,
        department: intern.department,
        progress: taskProgress,
        completedTaskCount,
        taskCount: intern.tasks.length,
        tasks: intern.tasks,
        risk: intern.risk,
        action: intern.feedbacks.length ? "已记录反馈" : "待阶段反馈",
        detail: intern.reason || intern.todo || "当前暂无风险说明，建议保持每周反馈节奏。",
        observationHint: intern.feedbacks[0]?.content || `${intern.name}当前成长进度 ${taskProgress}%，主要关注点是${intern.reason || intern.todo || "阶段目标推进"}。`,
        focus: intern.risk === "低风险" ? "挑战任务安排" : intern.reason || "阶段能力补齐",
        weeklyRecord: intern.tasks.map((task) => `${task.title} ${task.status}`),
        aiSignals: [`成长信号：${attentionLabel[intern.risk]}`, `学生端任务进度：${completedTaskCount}/${intern.tasks.length || 0} 已完成`, `导师观察重点：${intern.reason || intern.todo || "阶段目标推进"}`],
        managedId: intern.id,
      };
    });
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
  const [selectedWeekIndex, setSelectedWeekIndex] = useState(0);
  const [selectedDateKey, setSelectedDateKey] = useState(studentCalendarStartDate);
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
  const currentWeekStart = weekDays[0] ?? allGrowthDays[0];
  const currentWeekEnd = weekDays[weekDays.length - 1] ?? currentWeekStart;
  const currentWeekNumber = selectedWeekIndex + 1;
  const selectedDate = allGrowthDays.find((day) => day.key === selectedDateKey) ?? currentWeekStart;
  const selectedRoleStages = positionGrowthStages[(selected.role as PositionRole) in positionGrowthStages ? selected.role as PositionRole : "产品"];
  const selectedDisplayTasks = selected.tasks.map((task, index) => ({
    id: task.id,
    label: task.title,
    status: task.status,
    due: task.due,
    owner: task.owner,
    note: task.note,
    dateKey: allGrowthDays[inferTaskDateIndex(task, index)]?.key ?? allGrowthDays[0].key,
  }));
  const selectedTodayTasks = selectedDisplayTasks.filter((task) => task.dateKey === selectedDateKey);
  const selectedPendingTasks = selectedDisplayTasks.filter((task) => task.status !== "已完成");
  const selectedTaskStatusByLabel = new Map<string, TaskStatus>(selectedDisplayTasks.map((task) => [task.label, task.status]));
  const selectedStageIndex = Math.min(2, Math.floor(selectedWeekIndex / 4));
  const selectedStage = selectedRoleStages[selectedStageIndex] ?? selectedRoleStages[0];
  const selectedStageTasks = (selectedStage?.tasks ?? []).map((task) => ({
    ...task,
    status: selectedTaskStatusByLabel.get(task.label) ?? "未完成",
  }));
  const selectedStageDone = selectedStageTasks.filter((task) => task.status === "已完成").length;
  const selectedStageTotal = selectedStageTasks.length;
  const hasMentorFeedbackRecord = relatedRecords.some(
    (record) => record.sourceRole === "导师" && record.targetRole === "实习生",
  );
  const mentorCheckpoints = weekDays.map((day) => {
    const dayTasks = selectedDisplayTasks.filter((task) => task.dateKey === day.key);
    const hasCompletedStudentTask = dayTasks.some((task) => task.status === "已完成");
    const hasActiveStudentTask = dayTasks.some((task) => task.status !== "已完成");
    const status = hasMentorFeedbackRecord && hasCompletedStudentTask
      ? "已完成"
      : hasCompletedStudentTask
        ? "待确认"
        : hasActiveStudentTask
          ? "进行中"
          : "未开始";
    const action = dayTasks.length
      ? dayTasks.map((task) => task.label).join(" / ")
      : "暂无需要导师处理的阶段任务";
    return {
      dateKey: day.key,
      day: day.monthDay,
      weekday: day.weekday,
      action,
      status,
    };
  });
  const todayDate = startOfDay(new Date());
  const rhythmDay = weekDays.find((day) => day.key === toDateKey(todayDate))
    ?? (todayDate < currentWeekStart.date ? currentWeekStart : currentWeekEnd);
  const rhythmDateKey = rhythmDay?.key ?? selectedDateKey;
  const selectedWeekDayIndex = Math.max(0, weekDays.findIndex((day) => day.key === rhythmDateKey));
  const mentorRhythmProgress = weekDays.length ? ((selectedWeekDayIndex + 0.5) / weekDays.length) * 100 : 0;
  const mentorRhythmStyle = {
    "--mentor-rhythm-progress": `${mentorRhythmProgress}%`,
  } as CSSProperties;
  const mentorLoopItems = [
    {
      label: "确认负责对象",
      detail: `当前负责 ${mentorInternCount} 名实习生，已选中 ${selected.name} 作为本次处理对象。`,
      status: "已完成" as LoopStatus,
    },
    {
      label: "处理待反馈",
      detail: saved
        ? "本次阶段反馈已由导师确认并同步到学生端与 HRBP。"
        : draftFeedback
          ? "AI 已整理草稿，仍需要导师确认后发布。"
          : "当前负责对象还需要导师确认阶段反馈。",
      status: saved ? "已完成" as LoopStatus : draftFeedback ? "待确认" as LoopStatus : "进行中" as LoopStatus,
    },
    {
      label: "确认 AI 建议",
      detail: draftFeedback ? "AI 已整理反馈建议，请导师编辑确认后再同步。" : "先补充导师观察，再生成可编辑反馈建议。",
      status: saved ? "已完成" as LoopStatus : draftFeedback ? "待确认" as LoopStatus : "进行中" as LoopStatus,
    },
    {
      label: "同步 HRBP",
      detail: saved ? "反馈已同步给学员与 HRBP，可进入后续复盘。" : "导师确认后会形成跨端协同记录。",
      status: saved ? "待复盘" as LoopStatus : "待确认" as LoopStatus,
    },
  ];

  useResultReveal(mentorRef, [selectedName, draftFeedback, saved], "[data-gsap-result]");

  const selectIntern = (intern: typeof mentorViewInterns[number]) => {
    setSelectedName(intern.name);
    const nextStart = allGrowthDays[selectedWeekIndex * studentGrowthWeekSize] ?? allGrowthDays[0];
    if (nextStart) setSelectedDateKey(nextStart.key);
    setFeedback(intern.observationHint);
    setDraftFeedback(null);
    setIsGenerating(false);
    setAiError("");
    setSaved(false);
    setFeedbackGenerated(false);
    setIsSaving(false);
    setMentorScores(createDefaultMentorScores(intern));
  };

  const changeMentorGrowthWeek = (direction: -1 | 1) => {
    const next = Math.max(0, Math.min(maxGrowthWeekIndex, selectedWeekIndex + direction));
    const nextStart = allGrowthDays[next * studentGrowthWeekSize];
    setSelectedWeekIndex(next);
    if (nextStart) setSelectedDateKey(nextStart.key);
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
/* RECOVERY_GAP_LINE_3696 */
/* RECOVERY_GAP_LINE_3697 */
/* RECOVERY_GAP_LINE_3698 */
/* RECOVERY_GAP_LINE_3699 */
/* RECOVERY_GAP_LINE_3700 */
/* RECOVERY_GAP_LINE_3701 */
/* RECOVERY_GAP_LINE_3702 */
/* RECOVERY_GAP_LINE_3703 */
/* RECOVERY_GAP_LINE_3704 */
/* RECOVERY_GAP_LINE_3705 */
/* RECOVERY_GAP_LINE_3706 */
/* RECOVERY_GAP_LINE_3707 */
/* RECOVERY_GAP_LINE_3708 */
/* RECOVERY_GAP_LINE_3709 */
/* RECOVERY_GAP_LINE_3710 */
/* RECOVERY_GAP_LINE_3711 */
/* RECOVERY_GAP_LINE_3712 */
/* RECOVERY_GAP_LINE_3713 */
/* RECOVERY_GAP_LINE_3714 */
/* RECOVERY_GAP_LINE_3715 */
/* RECOVERY_GAP_LINE_3716 */
/* RECOVERY_GAP_LINE_3717 */
/* RECOVERY_GAP_LINE_3718 */
/* RECOVERY_GAP_LINE_3719 */
/* RECOVERY_GAP_LINE_3720 */
/* RECOVERY_GAP_LINE_3721 */
/* RECOVERY_GAP_LINE_3722 */
/* RECOVERY_GAP_LINE_3723 */
/* RECOVERY_GAP_LINE_3724 */
/* RECOVERY_GAP_LINE_3725 */
/* RECOVERY_GAP_LINE_3726 */
/* RECOVERY_GAP_LINE_3727 */
/* RECOVERY_GAP_LINE_3728 */
/* RECOVERY_GAP_LINE_3729 */
/* RECOVERY_GAP_LINE_3730 */
/* RECOVERY_GAP_LINE_3731 */
/* RECOVERY_GAP_LINE_3732 */
/* RECOVERY_GAP_LINE_3733 */
/* RECOVERY_GAP_LINE_3734 */
/* RECOVERY_GAP_LINE_3735 */
/* RECOVERY_GAP_LINE_3736 */
/* RECOVERY_GAP_LINE_3737 */
/* RECOVERY_GAP_LINE_3738 */
/* RECOVERY_GAP_LINE_3739 */
/* RECOVERY_GAP_LINE_3740 */
/* RECOVERY_GAP_LINE_3741 */
/* RECOVERY_GAP_LINE_3742 */
/* RECOVERY_GAP_LINE_3743 */
/* RECOVERY_GAP_LINE_3744 */
/* RECOVERY_GAP_LINE_3745 */
/* RECOVERY_GAP_LINE_3746 */
/* RECOVERY_GAP_LINE_3747 */
/* RECOVERY_GAP_LINE_3748 */
/* RECOVERY_GAP_LINE_3749 */
/* RECOVERY_GAP_LINE_3750 */
/* RECOVERY_GAP_LINE_3751 */
/* RECOVERY_GAP_LINE_3752 */
/* RECOVERY_GAP_LINE_3753 */
/* RECOVERY_GAP_LINE_3754 */
/* RECOVERY_GAP_LINE_3755 */
/* RECOVERY_GAP_LINE_3756 */
/* RECOVERY_GAP_LINE_3757 */
/* RECOVERY_GAP_LINE_3758 */
/* RECOVERY_GAP_LINE_3759 */
/* RECOVERY_GAP_LINE_3760 */
/* RECOVERY_GAP_LINE_3761 */
/* RECOVERY_GAP_LINE_3762 */
/* RECOVERY_GAP_LINE_3763 */
/* RECOVERY_GAP_LINE_3764 */
/* RECOVERY_GAP_LINE_3765 */
/* RECOVERY_GAP_LINE_3766 */
/* RECOVERY_GAP_LINE_3767 */
/* RECOVERY_GAP_LINE_3768 */
/* RECOVERY_GAP_LINE_3769 */
/* RECOVERY_GAP_LINE_3770 */
/* RECOVERY_GAP_LINE_3771 */
/* RECOVERY_GAP_LINE_3772 */
/* RECOVERY_GAP_LINE_3773 */
/* RECOVERY_GAP_LINE_3774 */
/* RECOVERY_GAP_LINE_3775 */
/* RECOVERY_GAP_LINE_3776 */
/* RECOVERY_GAP_LINE_3777 */
/* RECOVERY_GAP_LINE_3778 */
/* RECOVERY_GAP_LINE_3779 */
/* RECOVERY_GAP_LINE_3780 */
/* RECOVERY_GAP_LINE_3781 */
/* RECOVERY_GAP_LINE_3782 */
/* RECOVERY_GAP_LINE_3783 */
/* RECOVERY_GAP_LINE_3784 */
/* RECOVERY_GAP_LINE_3785 */
/* RECOVERY_GAP_LINE_3786 */
/* RECOVERY_GAP_LINE_3787 */
/* RECOVERY_GAP_LINE_3788 */
/* RECOVERY_GAP_LINE_3789 */
/* RECOVERY_GAP_LINE_3790 */
/* RECOVERY_GAP_LINE_3791 */
/* RECOVERY_GAP_LINE_3792 */
/* RECOVERY_GAP_LINE_3793 */
/* RECOVERY_GAP_LINE_3794 */
/* RECOVERY_GAP_LINE_3795 */
/* RECOVERY_GAP_LINE_3796 */
/* RECOVERY_GAP_LINE_3797 */
/* RECOVERY_GAP_LINE_3798 */
/* RECOVERY_GAP_LINE_3799 */
/* RECOVERY_GAP_LINE_3800 */
/* RECOVERY_GAP_LINE_3801 */
/* RECOVERY_GAP_LINE_3802 */
/* RECOVERY_GAP_LINE_3803 */
/* RECOVERY_GAP_LINE_3804 */
/* RECOVERY_GAP_LINE_3805 */
/* RECOVERY_GAP_LINE_3806 */
/* RECOVERY_GAP_LINE_3807 */
/* RECOVERY_GAP_LINE_3808 */
/* RECOVERY_GAP_LINE_3809 */
/* RECOVERY_GAP_LINE_3810 */
/* RECOVERY_GAP_LINE_3811 */
/* RECOVERY_GAP_LINE_3812 */
/* RECOVERY_GAP_LINE_3813 */
/* RECOVERY_GAP_LINE_3814 */
/* RECOVERY_GAP_LINE_3815 */
/* RECOVERY_GAP_LINE_3816 */
/* RECOVERY_GAP_LINE_3817 */
/* RECOVERY_GAP_LINE_3818 */
/* RECOVERY_GAP_LINE_3819 */
/* RECOVERY_GAP_LINE_3820 */
/* RECOVERY_GAP_LINE_3821 */
/* RECOVERY_GAP_LINE_3822 */
/* RECOVERY_GAP_LINE_3823 */
/* RECOVERY_GAP_LINE_3824 */
/* RECOVERY_GAP_LINE_3825 */
/* RECOVERY_GAP_LINE_3826 */
/* RECOVERY_GAP_LINE_3827 */
/* RECOVERY_GAP_LINE_3828 */
/* RECOVERY_GAP_LINE_3829 */
/* RECOVERY_GAP_LINE_3830 */
/* RECOVERY_GAP_LINE_3831 */
/* RECOVERY_GAP_LINE_3832 */
/* RECOVERY_GAP_LINE_3833 */
/* RECOVERY_GAP_LINE_3834 */
/* RECOVERY_GAP_LINE_3835 */
/* RECOVERY_GAP_LINE_3836 */
/* RECOVERY_GAP_LINE_3837 */
/* RECOVERY_GAP_LINE_3838 */
/* RECOVERY_GAP_LINE_3839 */
/* RECOVERY_GAP_LINE_3840 */
/* RECOVERY_GAP_LINE_3841 */
/* RECOVERY_GAP_LINE_3842 */
/* RECOVERY_GAP_LINE_3843 */
/* RECOVERY_GAP_LINE_3844 */
/* RECOVERY_GAP_LINE_3845 */
/* RECOVERY_GAP_LINE_3846 */
/* RECOVERY_GAP_LINE_3847 */
/* RECOVERY_GAP_LINE_3848 */
/* RECOVERY_GAP_LINE_3849 */
/* RECOVERY_GAP_LINE_3850 */
/* RECOVERY_GAP_LINE_3851 */
/* RECOVERY_GAP_LINE_3852 */
/* RECOVERY_GAP_LINE_3853 */
/* RECOVERY_GAP_LINE_3854 */
/* RECOVERY_GAP_LINE_3855 */
/* RECOVERY_GAP_LINE_3856 */
/* RECOVERY_GAP_LINE_3857 */
/* RECOVERY_GAP_LINE_3858 */
/* RECOVERY_GAP_LINE_3859 */
/* RECOVERY_GAP_LINE_3860 */
/* RECOVERY_GAP_LINE_3861 */
/* RECOVERY_GAP_LINE_3862 */
/* RECOVERY_GAP_LINE_3863 */
/* RECOVERY_GAP_LINE_3864 */
/* RECOVERY_GAP_LINE_3865 */
/* RECOVERY_GAP_LINE_3866 */
/* RECOVERY_GAP_LINE_3867 */
/* RECOVERY_GAP_LINE_3868 */
/* RECOVERY_GAP_LINE_3869 */
/* RECOVERY_GAP_LINE_3870 */
/* RECOVERY_GAP_LINE_3871 */
/* RECOVERY_GAP_LINE_3872 */
/* RECOVERY_GAP_LINE_3873 */
/* RECOVERY_GAP_LINE_3874 */
/* RECOVERY_GAP_LINE_3875 */
/* RECOVERY_GAP_LINE_3876 */
/* RECOVERY_GAP_LINE_3877 */
/* RECOVERY_GAP_LINE_3878 */
/* RECOVERY_GAP_LINE_3879 */
/* RECOVERY_GAP_LINE_3880 */
/* RECOVERY_GAP_LINE_3881 */
/* RECOVERY_GAP_LINE_3882 */
/* RECOVERY_GAP_LINE_3883 */
/* RECOVERY_GAP_LINE_3884 */
/* RECOVERY_GAP_LINE_3885 */
/* RECOVERY_GAP_LINE_3886 */
/* RECOVERY_GAP_LINE_3887 */
/* RECOVERY_GAP_LINE_3888 */
/* RECOVERY_GAP_LINE_3889 */
/* RECOVERY_GAP_LINE_3890 */
/* RECOVERY_GAP_LINE_3891 */
/* RECOVERY_GAP_LINE_3892 */
/* RECOVERY_GAP_LINE_3893 */
/* RECOVERY_GAP_LINE_3894 */
/* RECOVERY_GAP_LINE_3895 */
/* RECOVERY_GAP_LINE_3896 */
/* RECOVERY_GAP_LINE_3897 */
/* RECOVERY_GAP_LINE_3898 */
/* RECOVERY_GAP_LINE_3899 */
/* RECOVERY_GAP_LINE_3900 */
/* RECOVERY_GAP_LINE_3901 */
/* RECOVERY_GAP_LINE_3902 */
/* RECOVERY_GAP_LINE_3903 */
/* RECOVERY_GAP_LINE_3904 */
/* RECOVERY_GAP_LINE_3905 */
/* RECOVERY_GAP_LINE_3906 */
/* RECOVERY_GAP_LINE_3907 */
/* RECOVERY_GAP_LINE_3908 */
/* RECOVERY_GAP_LINE_3909 */
/* RECOVERY_GAP_LINE_3910 */
/* RECOVERY_GAP_LINE_3911 */
/* RECOVERY_GAP_LINE_3912 */
/* RECOVERY_GAP_LINE_3913 */
/* RECOVERY_GAP_LINE_3914 */
/* RECOVERY_GAP_LINE_3915 */
/* RECOVERY_GAP_LINE_3916 */
/* RECOVERY_GAP_LINE_3917 */
/* RECOVERY_GAP_LINE_3918 */
/* RECOVERY_GAP_LINE_3919 */
/* RECOVERY_GAP_LINE_3920 */
/* RECOVERY_GAP_LINE_3921 */
/* RECOVERY_GAP_LINE_3922 */
/* RECOVERY_GAP_LINE_3923 */
/* RECOVERY_GAP_LINE_3924 */
/* RECOVERY_GAP_LINE_3925 */
/* RECOVERY_GAP_LINE_3926 */
/* RECOVERY_GAP_LINE_3927 */
/* RECOVERY_GAP_LINE_3928 */
/* RECOVERY_GAP_LINE_3929 */
/* RECOVERY_GAP_LINE_3930 */
/* RECOVERY_GAP_LINE_3931 */
/* RECOVERY_GAP_LINE_3932 */
/* RECOVERY_GAP_LINE_3933 */
/* RECOVERY_GAP_LINE_3934 */
/* RECOVERY_GAP_LINE_3935 */
/* RECOVERY_GAP_LINE_3936 */
/* RECOVERY_GAP_LINE_3937 */
/* RECOVERY_GAP_LINE_3938 */
/* RECOVERY_GAP_LINE_3939 */
/* RECOVERY_GAP_LINE_3940 */
/* RECOVERY_GAP_LINE_3941 */
/* RECOVERY_GAP_LINE_3942 */
/* RECOVERY_GAP_LINE_3943 */
/* RECOVERY_GAP_LINE_3944 */
/* RECOVERY_GAP_LINE_3945 */
/* RECOVERY_GAP_LINE_3946 */
/* RECOVERY_GAP_LINE_3947 */
/* RECOVERY_GAP_LINE_3948 */
/* RECOVERY_GAP_LINE_3949 */
/* RECOVERY_GAP_LINE_3950 */
/* RECOVERY_GAP_LINE_3951 */
/* RECOVERY_GAP_LINE_3952 */
/* RECOVERY_GAP_LINE_3953 */
/* RECOVERY_GAP_LINE_3954 */
/* RECOVERY_GAP_LINE_3955 */
/* RECOVERY_GAP_LINE_3956 */
/* RECOVERY_GAP_LINE_3957 */
/* RECOVERY_GAP_LINE_3958 */
/* RECOVERY_GAP_LINE_3959 */
/* RECOVERY_GAP_LINE_3960 */
/* RECOVERY_GAP_LINE_3961 */
/* RECOVERY_GAP_LINE_3962 */
/* RECOVERY_GAP_LINE_3963 */
/* RECOVERY_GAP_LINE_3964 */
/* RECOVERY_GAP_LINE_3965 */
/* RECOVERY_GAP_LINE_3966 */
/* RECOVERY_GAP_LINE_3967 */
/* RECOVERY_GAP_LINE_3968 */
/* RECOVERY_GAP_LINE_3969 */
/* RECOVERY_GAP_LINE_3970 */
/* RECOVERY_GAP_LINE_3971 */
/* RECOVERY_GAP_LINE_3972 */
/* RECOVERY_GAP_LINE_3973 */
/* RECOVERY_GAP_LINE_3974 */
/* RECOVERY_GAP_LINE_3975 */
/* RECOVERY_GAP_LINE_3976 */
/* RECOVERY_GAP_LINE_3977 */
/* RECOVERY_GAP_LINE_3978 */
/* RECOVERY_GAP_LINE_3979 */
/* RECOVERY_GAP_LINE_3980 */
/* RECOVERY_GAP_LINE_3981 */
/* RECOVERY_GAP_LINE_3982 */
/* RECOVERY_GAP_LINE_3983 */
/* RECOVERY_GAP_LINE_3984 */
/* RECOVERY_GAP_LINE_3985 */
/* RECOVERY_GAP_LINE_3986 */
/* RECOVERY_GAP_LINE_3987 */
/* RECOVERY_GAP_LINE_3988 */
/* RECOVERY_GAP_LINE_3989 */
/* RECOVERY_GAP_LINE_3990 */
/* RECOVERY_GAP_LINE_3991 */
/* RECOVERY_GAP_LINE_3992 */
/* RECOVERY_GAP_LINE_3993 */
/* RECOVERY_GAP_LINE_3994 */
/* RECOVERY_GAP_LINE_3995 */
/* RECOVERY_GAP_LINE_3996 */
/* RECOVERY_GAP_LINE_3997 */
/* RECOVERY_GAP_LINE_3998 */
/* RECOVERY_GAP_LINE_3999 */
/* RECOVERY_GAP_LINE_4000 */
/* RECOVERY_GAP_LINE_4001 */
/* RECOVERY_GAP_LINE_4002 */
/* RECOVERY_GAP_LINE_4003 */
/* RECOVERY_GAP_LINE_4004 */
/* RECOVERY_GAP_LINE_4005 */
/* RECOVERY_GAP_LINE_4006 */
/* RECOVERY_GAP_LINE_4007 */
/* RECOVERY_GAP_LINE_4008 */
/* RECOVERY_GAP_LINE_4009 */
/* RECOVERY_GAP_LINE_4010 */
/* RECOVERY_GAP_LINE_4011 */
/* RECOVERY_GAP_LINE_4012 */
/* RECOVERY_GAP_LINE_4013 */
/* RECOVERY_GAP_LINE_4014 */
/* RECOVERY_GAP_LINE_4015 */
/* RECOVERY_GAP_LINE_4016 */
/* RECOVERY_GAP_LINE_4017 */
/* RECOVERY_GAP_LINE_4018 */
/* RECOVERY_GAP_LINE_4019 */
/* RECOVERY_GAP_LINE_4020 */
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
/* RECOVERY_GAP_LINE_4040 */
/* RECOVERY_GAP_LINE_4041 */
/* RECOVERY_GAP_LINE_4042 */
/* RECOVERY_GAP_LINE_4043 */
/* RECOVERY_GAP_LINE_4044 */
/* RECOVERY_GAP_LINE_4045 */
/* RECOVERY_GAP_LINE_4046 */
/* RECOVERY_GAP_LINE_4047 */
/* RECOVERY_GAP_LINE_4048 */
/* RECOVERY_GAP_LINE_4049 */
/* RECOVERY_GAP_LINE_4050 */
/* RECOVERY_GAP_LINE_4051 */
/* RECOVERY_GAP_LINE_4052 */
/* RECOVERY_GAP_LINE_4053 */
/* RECOVERY_GAP_LINE_4054 */
/* RECOVERY_GAP_LINE_4055 */
/* RECOVERY_GAP_LINE_4056 */
/* RECOVERY_GAP_LINE_4057 */
/* RECOVERY_GAP_LINE_4058 */
/* RECOVERY_GAP_LINE_4059 */
/* RECOVERY_GAP_LINE_4060 */
/* RECOVERY_GAP_LINE_4061 */
/* RECOVERY_GAP_LINE_4062 */
/* RECOVERY_GAP_LINE_4063 */
/* RECOVERY_GAP_LINE_4064 */
/* RECOVERY_GAP_LINE_4065 */
/* RECOVERY_GAP_LINE_4066 */
/* RECOVERY_GAP_LINE_4067 */
/* RECOVERY_GAP_LINE_4068 */
/* RECOVERY_GAP_LINE_4069 */
/* RECOVERY_GAP_LINE_4070 */
/* RECOVERY_GAP_LINE_4071 */
/* RECOVERY_GAP_LINE_4072 */
/* RECOVERY_GAP_LINE_4073 */
/* RECOVERY_GAP_LINE_4074 */
/* RECOVERY_GAP_LINE_4075 */
/* RECOVERY_GAP_LINE_4076 */
/* RECOVERY_GAP_LINE_4077 */
/* RECOVERY_GAP_LINE_4078 */
/* RECOVERY_GAP_LINE_4079 */
/* RECOVERY_GAP_LINE_4080 */
/* RECOVERY_GAP_LINE_4081 */
/* RECOVERY_GAP_LINE_4082 */
/* RECOVERY_GAP_LINE_4083 */
/* RECOVERY_GAP_LINE_4084 */
/* RECOVERY_GAP_LINE_4085 */
/* RECOVERY_GAP_LINE_4086 */
/* RECOVERY_GAP_LINE_4087 */
/* RECOVERY_GAP_LINE_4088 */
/* RECOVERY_GAP_LINE_4089 */
/* RECOVERY_GAP_LINE_4090 */
/* RECOVERY_GAP_LINE_4091 */
/* RECOVERY_GAP_LINE_4092 */
/* RECOVERY_GAP_LINE_4093 */
/* RECOVERY_GAP_LINE_4094 */
/* RECOVERY_GAP_LINE_4095 */
/* RECOVERY_GAP_LINE_4096 */
/* RECOVERY_GAP_LINE_4097 */
/* RECOVERY_GAP_LINE_4098 */
/* RECOVERY_GAP_LINE_4099 */
/* RECOVERY_GAP_LINE_4100 */
/* RECOVERY_GAP_LINE_4101 */
/* RECOVERY_GAP_LINE_4102 */
/* RECOVERY_GAP_LINE_4103 */
/* RECOVERY_GAP_LINE_4104 */
/* RECOVERY_GAP_LINE_4105 */
/* RECOVERY_GAP_LINE_4106 */
/* RECOVERY_GAP_LINE_4107 */
/* RECOVERY_GAP_LINE_4108 */
/* RECOVERY_GAP_LINE_4109 */
/* RECOVERY_GAP_LINE_4110 */
/* RECOVERY_GAP_LINE_4111 */
/* RECOVERY_GAP_LINE_4112 */
/* RECOVERY_GAP_LINE_4113 */
/* RECOVERY_GAP_LINE_4114 */
/* RECOVERY_GAP_LINE_4115 */
/* RECOVERY_GAP_LINE_4116 */
/* RECOVERY_GAP_LINE_4117 */
/* RECOVERY_GAP_LINE_4118 */
/* RECOVERY_GAP_LINE_4119 */
/* RECOVERY_GAP_LINE_4120 */
/* RECOVERY_GAP_LINE_4121 */
/* RECOVERY_GAP_LINE_4122 */
/* RECOVERY_GAP_LINE_4123 */
/* RECOVERY_GAP_LINE_4124 */
/* RECOVERY_GAP_LINE_4125 */
/* RECOVERY_GAP_LINE_4126 */
/* RECOVERY_GAP_LINE_4127 */
/* RECOVERY_GAP_LINE_4128 */
/* RECOVERY_GAP_LINE_4129 */
/* RECOVERY_GAP_LINE_4130 */
/* RECOVERY_GAP_LINE_4131 */
/* RECOVERY_GAP_LINE_4132 */
/* RECOVERY_GAP_LINE_4133 */
/* RECOVERY_GAP_LINE_4134 */
/* RECOVERY_GAP_LINE_4135 */
/* RECOVERY_GAP_LINE_4136 */
/* RECOVERY_GAP_LINE_4137 */
/* RECOVERY_GAP_LINE_4138 */
/* RECOVERY_GAP_LINE_4139 */
/* RECOVERY_GAP_LINE_4140 */
/* RECOVERY_GAP_LINE_4141 */
/* RECOVERY_GAP_LINE_4142 */
/* RECOVERY_GAP_LINE_4143 */
/* RECOVERY_GAP_LINE_4144 */
/* RECOVERY_GAP_LINE_4145 */
/* RECOVERY_GAP_LINE_4146 */
/* RECOVERY_GAP_LINE_4147 */
/* RECOVERY_GAP_LINE_4148 */
/* RECOVERY_GAP_LINE_4149 */
/* RECOVERY_GAP_LINE_4150 */
/* RECOVERY_GAP_LINE_4151 */
/* RECOVERY_GAP_LINE_4152 */
/* RECOVERY_GAP_LINE_4153 */
/* RECOVERY_GAP_LINE_4154 */
/* RECOVERY_GAP_LINE_4155 */
/* RECOVERY_GAP_LINE_4156 */
/* RECOVERY_GAP_LINE_4157 */
/* RECOVERY_GAP_LINE_4158 */
/* RECOVERY_GAP_LINE_4159 */
/* RECOVERY_GAP_LINE_4160 */
/* RECOVERY_GAP_LINE_4161 */
/* RECOVERY_GAP_LINE_4162 */
/* RECOVERY_GAP_LINE_4163 */
/* RECOVERY_GAP_LINE_4164 */
/* RECOVERY_GAP_LINE_4165 */
/* RECOVERY_GAP_LINE_4166 */
/* RECOVERY_GAP_LINE_4167 */
/* RECOVERY_GAP_LINE_4168 */
/* RECOVERY_GAP_LINE_4169 */
/* RECOVERY_GAP_LINE_4170 */
/* RECOVERY_GAP_LINE_4171 */
/* RECOVERY_GAP_LINE_4172 */
/* RECOVERY_GAP_LINE_4173 */
/* RECOVERY_GAP_LINE_4174 */
/* RECOVERY_GAP_LINE_4175 */
/* RECOVERY_GAP_LINE_4176 */
/* RECOVERY_GAP_LINE_4177 */
/* RECOVERY_GAP_LINE_4178 */
/* RECOVERY_GAP_LINE_4179 */
/* RECOVERY_GAP_LINE_4180 */
/* RECOVERY_GAP_LINE_4181 */
/* RECOVERY_GAP_LINE_4182 */
/* RECOVERY_GAP_LINE_4183 */
/* RECOVERY_GAP_LINE_4184 */
/* RECOVERY_GAP_LINE_4185 */
/* RECOVERY_GAP_LINE_4186 */
/* RECOVERY_GAP_LINE_4187 */
/* RECOVERY_GAP_LINE_4188 */
/* RECOVERY_GAP_LINE_4189 */
/* RECOVERY_GAP_LINE_4190 */
/* RECOVERY_GAP_LINE_4191 */
/* RECOVERY_GAP_LINE_4192 */
/* RECOVERY_GAP_LINE_4193 */
/* RECOVERY_GAP_LINE_4194 */
/* RECOVERY_GAP_LINE_4195 */
/* RECOVERY_GAP_LINE_4196 */
/* RECOVERY_GAP_LINE_4197 */
/* RECOVERY_GAP_LINE_4198 */
/* RECOVERY_GAP_LINE_4199 */
/* RECOVERY_GAP_LINE_4200 */
/* RECOVERY_GAP_LINE_4201 */
/* RECOVERY_GAP_LINE_4202 */
/* RECOVERY_GAP_LINE_4203 */
/* RECOVERY_GAP_LINE_4204 */
/* RECOVERY_GAP_LINE_4205 */
/* RECOVERY_GAP_LINE_4206 */
/* RECOVERY_GAP_LINE_4207 */
/* RECOVERY_GAP_LINE_4208 */
/* RECOVERY_GAP_LINE_4209 */
/* RECOVERY_GAP_LINE_4210 */
/* RECOVERY_GAP_LINE_4211 */
/* RECOVERY_GAP_LINE_4212 */
/* RECOVERY_GAP_LINE_4213 */
/* RECOVERY_GAP_LINE_4214 */
/* RECOVERY_GAP_LINE_4215 */
/* RECOVERY_GAP_LINE_4216 */
/* RECOVERY_GAP_LINE_4217 */
/* RECOVERY_GAP_LINE_4218 */
/* RECOVERY_GAP_LINE_4219 */
/* RECOVERY_GAP_LINE_4220 */
/* RECOVERY_GAP_LINE_4221 */
/* RECOVERY_GAP_LINE_4222 */
/* RECOVERY_GAP_LINE_4223 */
/* RECOVERY_GAP_LINE_4224 */
/* RECOVERY_GAP_LINE_4225 */
/* RECOVERY_GAP_LINE_4226 */
/* RECOVERY_GAP_LINE_4227 */
/* RECOVERY_GAP_LINE_4228 */
/* RECOVERY_GAP_LINE_4229 */
/* RECOVERY_GAP_LINE_4230 */
/* RECOVERY_GAP_LINE_4231 */
/* RECOVERY_GAP_LINE_4232 */
/* RECOVERY_GAP_LINE_4233 */
/* RECOVERY_GAP_LINE_4234 */
/* RECOVERY_GAP_LINE_4235 */
/* RECOVERY_GAP_LINE_4236 */
/* RECOVERY_GAP_LINE_4237 */
/* RECOVERY_GAP_LINE_4238 */
/* RECOVERY_GAP_LINE_4239 */
/* RECOVERY_GAP_LINE_4240 */
/* RECOVERY_GAP_LINE_4241 */
/* RECOVERY_GAP_LINE_4242 */
/* RECOVERY_GAP_LINE_4243 */
/* RECOVERY_GAP_LINE_4244 */
/* RECOVERY_GAP_LINE_4245 */
/* RECOVERY_GAP_LINE_4246 */
/* RECOVERY_GAP_LINE_4247 */
/* RECOVERY_GAP_LINE_4248 */
/* RECOVERY_GAP_LINE_4249 */
/* RECOVERY_GAP_LINE_4250 */
/* RECOVERY_GAP_LINE_4251 */
/* RECOVERY_GAP_LINE_4252 */
/* RECOVERY_GAP_LINE_4253 */
/* RECOVERY_GAP_LINE_4254 */
/* RECOVERY_GAP_LINE_4255 */
/* RECOVERY_GAP_LINE_4256 */
/* RECOVERY_GAP_LINE_4257 */
/* RECOVERY_GAP_LINE_4258 */
/* RECOVERY_GAP_LINE_4259 */
/* RECOVERY_GAP_LINE_4260 */
/* RECOVERY_GAP_LINE_4261 */
/* RECOVERY_GAP_LINE_4262 */
/* RECOVERY_GAP_LINE_4263 */
/* RECOVERY_GAP_LINE_4264 */
/* RECOVERY_GAP_LINE_4265 */
/* RECOVERY_GAP_LINE_4266 */
/* RECOVERY_GAP_LINE_4267 */
/* RECOVERY_GAP_LINE_4268 */
/* RECOVERY_GAP_LINE_4269 */
/* RECOVERY_GAP_LINE_4270 */
/* RECOVERY_GAP_LINE_4271 */
/* RECOVERY_GAP_LINE_4272 */
/* RECOVERY_GAP_LINE_4273 */
/* RECOVERY_GAP_LINE_4274 */
/* RECOVERY_GAP_LINE_4275 */
/* RECOVERY_GAP_LINE_4276 */
/* RECOVERY_GAP_LINE_4277 */
/* RECOVERY_GAP_LINE_4278 */
/* RECOVERY_GAP_LINE_4279 */
/* RECOVERY_GAP_LINE_4280 */
/* RECOVERY_GAP_LINE_4281 */
/* RECOVERY_GAP_LINE_4282 */
/* RECOVERY_GAP_LINE_4283 */
/* RECOVERY_GAP_LINE_4284 */
/* RECOVERY_GAP_LINE_4285 */
/* RECOVERY_GAP_LINE_4286 */
/* RECOVERY_GAP_LINE_4287 */
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
      setActionMessage(`已为 ${intern.name} ${label}，协同记录已同步到${targetRole === "导师" ? "导师端" : "HRBP 操作记录"}。`);
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
      <SectionTitle icon={BrainCircuit} title="AI Insight 关注卡" subtitle={`${intern.name} · ${intern.role} · HRBP 人工确认`} />
      <div className="mt-5 space-y-4">
        <div className="glass-panel-soft flex items-center justify-between rounded-2xl p-4">
          <span className="text-sm font-medium text-[#6F6E72]">关注状态</span>
          <span data-risk-badge=""><AttentionBadge risk={intern.risk} /></span>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="glass-panel-soft rounded-2xl p-4">
            <p className="text-xs font-semibold text-[var(--role-accent)]">信号可信度</p>
            <p className="mt-1 text-2xl font-black text-[#1D0C3B]">{intern.confidence}%</p>
          </div>
          <div className="glass-panel-soft rounded-2xl p-4">
            <p className="text-xs font-semibold text-[#6F6E72]">处置状态</p>
            <p className="mt-2 text-sm font-black text-[#1D0C3B]">{intern.processStatus}</p>
          </div>
        </div>
        <div className="glass-panel-soft rounded-2xl p-4">
          <p className="text-sm font-bold text-[#1D0C3B]">成长信号依据</p>
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
	              ["规则触发", intern.risk === "高风险" ? "延期信号 + 完成度偏低 + 导师需补充观察" : intern.risk === "中风险" ? "完成度波动 + 单项能力需补强" : "完成稳定 + 可加挑战任务"],
	              ["AI 解释", "归因和建议仅来自上方证据，不直接生成组织结论"],
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
        <InfoBlock title="跟进建议" text={intern.hrAction.replace("高风险", "重点关注").replace("HR", "HRBP")} />
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
              {actionLoading === label ? "正在整理..." : label}
            </Button>
          ))}
        </div>
	        {actionError && <FeedbackNotice tone="error">{actionError}</FeedbackNotice>}
	        {actionMessage && <FeedbackNotice tone="success">{actionMessage}</FeedbackNotice>}
	        <div className="glass-panel-soft rounded-2xl p-4">
	          <p className="text-sm font-bold text-[#1D0C3B]">行动闭环状态</p>
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
                    <span className="shrink-0 rounded-full bg-white px-2 py-0.5 text-[11px] font-bold text-[var(--role-accent)]">{record.sourceRole} → {record.targetRole} · {toLoopStatus(record.status)}</span>
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
        <div className="flex flex-col gap-4">
          <SectionTitle icon={Users} title="关注对象列表" subtitle="按成长信号、当前状态和最近来源筛选需要 HRBP 关注的对象" />
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

        <div className="mt-5 space-y-3">
          {filteredInterns.length > 0 ? (
            filteredInterns.map((intern) => (
              <button
                key={intern.name}
                type="button"
                onClick={() => setSelectedName(intern.name)}
                aria-selected={visibleSelected?.name === intern.name}
                className="hrbp-object-card w-full rounded-[14px] border border-[var(--role-border)] bg-white/64 p-4 text-left transition hover:bg-white/88"
                data-hrbp-list-item=""
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-black text-[#171321]">{intern.name}</p>
                    <p className="mt-1 text-xs font-semibold text-slate-500">{intern.role}方向 · {intern.week}</p>
                  </div>
                  <AttentionBadge risk={intern.risk} />
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  <LoopStatusPill status={processStatusToLoopStatus(intern.processStatus)} />
                  <span className="inline-flex items-center rounded-md border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-semibold text-slate-600">
                    来源：{signalSourceForIntern(intern)}
                  </span>
                </div>
                <p className="mt-3 line-clamp-2 text-sm leading-6 text-slate-600">{intern.reason}</p>
              </button>
            ))
          ) : (
            <div className="rounded-[14px] border border-dashed border-slate-200 bg-slate-50 px-4 py-8 text-center text-sm text-slate-500">
              当前筛选下暂无关注对象，可切换状态或返回全部查看。
            </div>
          )}
        </div>
      </Card>

      {visibleSelected && (
        <Card className="glass-panel" data-hrbp-detail="">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <SectionTitle icon={Target} title="当前对象详情" subtitle="将成长信号、导师反馈和建议动作整理为可确认线索" />
            <LoopStatusPill status={processStatusToLoopStatus(visibleSelected.processStatus)} />
          </div>
          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            {[
              ["岗位方向", visibleSelected.role],
              ["最近来源", signalSourceForIntern(visibleSelected)],
              ["当前状态", processStatusToLoopStatus(visibleSelected.processStatus)],
            ].map(([label, value]) => (
              <div key={label} className="rounded-[14px] border border-[var(--role-border)] bg-white/58 p-4">
                <p className="text-xs font-semibold text-slate-500">{label}</p>
                <p className="mt-2 text-sm font-black text-[#171321]">{value}</p>
              </div>
            ))}
          </div>
          <div className="mt-5 space-y-4">
            <InfoBlock title="成长信号摘要" text={visibleSelected.reason} />
            <InfoBlock title="AI 整理的问题线索" items={visibleSelected.evidence} />
            <InfoBlock title="导师反馈摘要" text={visibleSelected.mentorFeedback} />
            <div className="rounded-2xl border border-[var(--role-border)] bg-white/66 p-4">
              <div className="flex items-start gap-3">
                <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-[8px] bg-[var(--role-soft)] text-[var(--role-accent)] ring-1 ring-[var(--role-border)]">
                  <ListChecks className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-sm font-bold text-[#1D0C3B]">HRBP 跟进建议</p>
                  <p className="mt-2 text-sm leading-6 text-slate-600">{visibleSelected.todo}</p>
                  <p className="mt-2 text-xs leading-5 text-slate-500">建议先与导师确认带教节奏，再决定是否同步给实习生或进入复盘沉淀。</p>
                </div>
              </div>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-sm font-bold text-[#1D0C3B]">跟进记录链路</p>
              <div className="mt-4 grid gap-3 sm:grid-cols-4">
                {collaborationFlow.map((step, index) => {
      </div>
      <ActionLoopPanel
        title="跟进闭环记录"
        subtitle="识别信号、人工确认、推动跟进和复盘沉淀统一形成可追溯依据"
        items={hrLoopItems}
      />
      <HrRiskPanel key={hasStarted ? "started" : "prestart"} records={activeRecords} onAddRecord={onAddRecord} managedInterns={managedInterns} hasStarted={hasStarted} />
      {hasStarted && <ReportModule records={activeRecords} managedInterns={managedInterns} />}
      <SharedRosterPanel managedInterns={managedInterns} />
      {hasStarted && <RecruiterDashboard records={activeRecords} managedInterns={managedInterns} />}
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
  const recruiterBrief = `成长复盘摘要：${recruiterSummary.batch} 共 ${managedInterns.length} 人。状态稳定可进入后续观察 ${retentionReady} 人，需继续跟进 ${watchList} 人，需 HRBP 先复盘 ${urgentRisk} 人。${recruiterSummary.hiringSignal}`;

  const copyBrief = async () => {
    await navigator.clipboard.writeText(recruiterBrief);
    setCopied(true);
  };

  return (
    <div className="space-y-6">
      <Card className="glass-panel">
        <SectionTitle icon={TrendingUp} title="成长复盘沉淀模块" subtitle="嵌入 HRBP 成长运营台，供 TA/校招团队低频复盘使用，不参与日常带教管理" />
        <div className="mt-5 grid gap-3 md:grid-cols-3">
          {[
                      <p className="mt-3 text-xs font-bold">{step}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </Card>
      )}

      {visibleSelected && <RiskCard key={visibleSelected.name} intern={visibleSelected} records={records} onAddRecord={onAddRecord} />}
    </div>
  );
}
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
      setReportMessage("复盘摘要已生成，可复制到周会材料。");
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
        <SectionTitle icon={FileText} title="复盘摘要生成模块" subtitle="汇总成长状态、关注原因和后续动作" />
        <Button onClick={generateReport} disabled={generating}>
          {generating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
          {generating ? "AI 正在整理..." : visible ? "重新生成摘要" : "一键生成复盘摘要"}
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
            <p className="text-sm font-bold text-[var(--role-accent)]">已生成复盘摘要，可复制到周会材料或招聘同步记录。</p>
            <Button variant="ghost" className="px-3 py-2" onClick={copyReport}>
              <Copy className="h-4 w-4" />
              {copied ? "已复制" : "复制摘要"}
            </Button>
          </div>
          <div className="mt-4 whitespace-pre-line text-sm leading-7 text-slate-700" data-gsap-result="">
            {report}
          </div>
        </div>
      ) : (
        <div className="mt-5 rounded-3xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center text-sm text-slate-500">
          点击按钮后，这里会生成面向 HRBP 和招聘同学的成长复盘摘要。
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
  const closedCount = managedInterns.filter((intern) => intern.processStatus === "已关闭").length;
  const priorityQueue = [
    { label: "待 HR 沟通", value: `${pendingHrReview} 人`, detail: "优先约谈重点关注同学并确认支持卡点", tone: "rose" },
    { label: "待同步导师", value: `${pendingMentorSync} 人`, detail: "把 AI 关注证据转成导师可执行辅导动作", tone: "amber" },
    { label: "复盘中", value: `${inReview} 人`, detail: "检查一周改善动作是否完成", tone: "blue" },
    { label: "挑战观察", value: `${highPotentialCount} 人`, detail: "推动导师安排边界清晰的挑战任务", tone: "green" },
  ];
  const hrLoopItems = [
    {
      label: "看到成长信号",
      detail: attentionCount > 0 ? `${attentionCount} 名对象需要 HRBP 关注，先查看证据摘要。` : "当前批次整体稳定，保持常规观察节奏。",
      status: attentionCount > 0 ? "进行中" as LoopStatus : "已完成" as LoopStatus,
    },
    {
      label: "确认跟进动作",
      detail: pendingMentorSync > 0 ? "将关注信号转成导师可执行的辅导动作。" : "当前无需新增导师同步动作。",
      status: pendingMentorSync > 0 ? "待确认" as LoopStatus : "已完成" as LoopStatus,
    },
    {
      label: "记录处理状态",
      detail: `${inReview} 条记录处于复盘中，${closedCount} 条已完成处理。`,
      status: inReview > 0 ? "待复盘" as LoopStatus : "进行中" as LoopStatus,
    },
    {
      label: "进入复盘沉淀",
      detail: records.length ? `已沉淀 ${records.length} 条跨端协同记录，可用于后续复盘。` : "完成同步后会自动形成跨端协同记录。",
      status: records.length ? "已完成" as LoopStatus : "待确认" as LoopStatus,
    },
  ];

  return (
	    <div className="space-y-6">
	      <Dashboard managedInterns={managedInterns} />
        <Card className="glass-panel">
          <SectionTitle icon={ClipboardList} title="今日处理队列" subtitle="HRBP 先处理动作，再查看说明和汇总材料" />
          <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            {priorityQueue.map((item) => (
              <div key={item.label} className="glass-panel-soft rounded-2xl p-4">
                <p className="text-xs font-bold text-[#6F6E72]">{item.label}</p>
  };

  return (
    <div className="space-y-6">
      <Card className="glass-panel">
        <SectionTitle icon={TrendingUp} title="成长复盘沉淀模块" subtitle="嵌入 HRBP 成长运营台，供 TA/校招团队低频复盘使用，不参与日常带教管理" />
        <div className="mt-5 grid gap-3 md:grid-cols-3">
          {[
            ["看成长节奏", "这批人入职后哪些支持动作更有效，哪些岗位需要继续观察。"],
            ["看后续观察", "提前识别状态稳定、任务推进顺畅的同学，关注后续发展意愿。"],
            ["看支持反哺", "把成长差异回流到筛选标准、面试题和入职前学习包。"],
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
        <StatCard label="后续观察" value={`${retentionReady} 人`} icon={ShieldCheck} tone="green" />
        <StatCard label="继续观察" value={`${watchList} 人`} icon={Clock3} tone="amber" />
        <StatCard label="HRBP 先复盘" value={`${urgentRisk} 人`} icon={AlertTriangle} tone="rose" />
      </div>

      <div className="grid gap-5 xl:grid-cols-[1.15fr_0.85fr]">
        <Card className="glass-panel">
          <SectionTitle icon={TrendingUp} title="岗位成长趋势" subtitle="只看汇总趋势和观察信号，不介入带教操作" />
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
        <SectionTitle icon={Target} title="招聘画像反哺" subtitle="把入职后的成长信号回流到校招筛选和面试题设计" />
/* RECOVERY_GAP_LINE_5329 */
/* RECOVERY_GAP_LINE_5330 */
/* RECOVERY_GAP_LINE_5331 */
/* RECOVERY_GAP_LINE_5332 */
/* RECOVERY_GAP_LINE_5333 */
/* RECOVERY_GAP_LINE_5334 */
/* RECOVERY_GAP_LINE_5335 */
/* RECOVERY_GAP_LINE_5336 */
/* RECOVERY_GAP_LINE_5337 */
/* RECOVERY_GAP_LINE_5338 */
/* RECOVERY_GAP_LINE_5339 */
/* RECOVERY_GAP_LINE_5340 */
/* RECOVERY_GAP_LINE_5341 */
/* RECOVERY_GAP_LINE_5342 */
/* RECOVERY_GAP_LINE_5343 */
/* RECOVERY_GAP_LINE_5344 */
/* RECOVERY_GAP_LINE_5345 */
/* RECOVERY_GAP_LINE_5346 */
/* RECOVERY_GAP_LINE_5347 */
/* RECOVERY_GAP_LINE_5348 */
/* RECOVERY_GAP_LINE_5349 */
/* RECOVERY_GAP_LINE_5350 */
/* RECOVERY_GAP_LINE_5351 */
/* RECOVERY_GAP_LINE_5352 */
/* RECOVERY_GAP_LINE_5353 */
/* RECOVERY_GAP_LINE_5354 */
/* RECOVERY_GAP_LINE_5355 */
/* RECOVERY_GAP_LINE_5356 */
/* RECOVERY_GAP_LINE_5357 */
/* RECOVERY_GAP_LINE_5358 */
/* RECOVERY_GAP_LINE_5359 */
/* RECOVERY_GAP_LINE_5360 */
/* RECOVERY_GAP_LINE_5361 */
/* RECOVERY_GAP_LINE_5362 */
/* RECOVERY_GAP_LINE_5363 */
/* RECOVERY_GAP_LINE_5364 */
/* RECOVERY_GAP_LINE_5365 */
/* RECOVERY_GAP_LINE_5366 */
/* RECOVERY_GAP_LINE_5367 */
/* RECOVERY_GAP_LINE_5368 */
/* RECOVERY_GAP_LINE_5369 */
/* RECOVERY_GAP_LINE_5370 */
/* RECOVERY_GAP_LINE_5371 */
/* RECOVERY_GAP_LINE_5372 */
/* RECOVERY_GAP_LINE_5373 */
/* RECOVERY_GAP_LINE_5374 */
/* RECOVERY_GAP_LINE_5375 */
/* RECOVERY_GAP_LINE_5376 */
/* RECOVERY_GAP_LINE_5377 */
/* RECOVERY_GAP_LINE_5378 */
/* RECOVERY_GAP_LINE_5379 */
/* RECOVERY_GAP_LINE_5380 */
/* RECOVERY_GAP_LINE_5381 */
/* RECOVERY_GAP_LINE_5382 */
/* RECOVERY_GAP_LINE_5383 */
/* RECOVERY_GAP_LINE_5384 */
/* RECOVERY_GAP_LINE_5385 */
/* RECOVERY_GAP_LINE_5386 */
/* RECOVERY_GAP_LINE_5387 */
/* RECOVERY_GAP_LINE_5388 */
/* RECOVERY_GAP_LINE_5389 */
/* RECOVERY_GAP_LINE_5390 */
/* RECOVERY_GAP_LINE_5391 */
/* RECOVERY_GAP_LINE_5392 */
/* RECOVERY_GAP_LINE_5393 */
/* RECOVERY_GAP_LINE_5394 */
/* RECOVERY_GAP_LINE_5395 */
/* RECOVERY_GAP_LINE_5396 */
/* RECOVERY_GAP_LINE_5397 */
/* RECOVERY_GAP_LINE_5398 */
/* RECOVERY_GAP_LINE_5399 */
/* RECOVERY_GAP_LINE_5400 */
/* RECOVERY_GAP_LINE_5401 */
/* RECOVERY_GAP_LINE_5402 */
/* RECOVERY_GAP_LINE_5403 */
/* RECOVERY_GAP_LINE_5404 */
/* RECOVERY_GAP_LINE_5405 */
/* RECOVERY_GAP_LINE_5406 */
/* RECOVERY_GAP_LINE_5407 */
/* RECOVERY_GAP_LINE_5408 */
/* RECOVERY_GAP_LINE_5409 */
/* RECOVERY_GAP_LINE_5410 */
/* RECOVERY_GAP_LINE_5411 */
/* RECOVERY_GAP_LINE_5412 */
/* RECOVERY_GAP_LINE_5413 */
/* RECOVERY_GAP_LINE_5414 */
/* RECOVERY_GAP_LINE_5415 */
/* RECOVERY_GAP_LINE_5416 */
/* RECOVERY_GAP_LINE_5417 */
/* RECOVERY_GAP_LINE_5418 */
/* RECOVERY_GAP_LINE_5419 */
/* RECOVERY_GAP_LINE_5420 */
/* RECOVERY_GAP_LINE_5421 */
/* RECOVERY_GAP_LINE_5422 */
/* RECOVERY_GAP_LINE_5423 */
/* RECOVERY_GAP_LINE_5424 */
/* RECOVERY_GAP_LINE_5425 */
/* RECOVERY_GAP_LINE_5426 */
/* RECOVERY_GAP_LINE_5427 */
    }
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
      current.map((intern) => {
        if (intern.id !== internId) return intern;
        const nextTasks = [task, ...intern.tasks];
        return {
          ...intern,
          progress: getTaskDrivenProgress(nextTasks, intern.progress),
          tasks: nextTasks,
          updatedAt: nowLabel(),
        };
      }),
    );
    showToast("success", "成长任务已添加。");
  };

  const updateTask = (internId: string, taskId: string, patch: Partial<GrowthTask>) => {
    updateManagedInterns((current) =>
      current.map((intern) => {
        if (intern.id !== internId) return intern;
        const nextTasks = intern.tasks.map((task) => task.id === taskId ? { ...task, ...patch } : task);
        return {
          ...intern,
          progress: getTaskDrivenProgress(nextTasks, intern.progress),
          processStatus: patch.status === "已完成" && getTaskDrivenProgress(nextTasks, intern.progress) === 100 ? "复盘中" : intern.processStatus,
          tasks: nextTasks,
          updatedAt: nowLabel(),
        };
      }),
    );
    if (patch.status === "已完成") showToast("success", "任务状态已更新，相关看板已重新计算。");
  };

  const deleteTask = (internId: string, taskId: string) => {
    if (!window.confirm("确认删除这条成长任务吗？")) return;
    updateManagedInterns((current) =>
      current.map((intern) => {
        if (intern.id !== internId) return intern;
        const nextTasks = intern.tasks.filter((task) => task.id !== taskId);
        return {
          ...intern,
          progress: getTaskDrivenProgress(nextTasks, intern.progress),
          tasks: nextTasks,
          updatedAt: nowLabel(),
        };
      }),
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
/* RECOVERY_GAP_LINE_5706 */
/* RECOVERY_GAP_LINE_5707 */
/* RECOVERY_GAP_LINE_5708 */
/* RECOVERY_GAP_LINE_5709 */
/* RECOVERY_GAP_LINE_5710 */
/* RECOVERY_GAP_LINE_5711 */
/* RECOVERY_GAP_LINE_5712 */
/* RECOVERY_GAP_LINE_5713 */
/* RECOVERY_GAP_LINE_5714 */
/* RECOVERY_GAP_LINE_5715 */
/* RECOVERY_GAP_LINE_5716 */
/* RECOVERY_GAP_LINE_5717 */
/* RECOVERY_GAP_LINE_5718 */
/* RECOVERY_GAP_LINE_5719 */
/* RECOVERY_GAP_LINE_5720 */
/* RECOVERY_GAP_LINE_5721 */
/* RECOVERY_GAP_LINE_5722 */
/* RECOVERY_GAP_LINE_5723 */
/* RECOVERY_GAP_LINE_5724 */
/* RECOVERY_GAP_LINE_5725 */
/* RECOVERY_GAP_LINE_5726 */
/* RECOVERY_GAP_LINE_5727 */
      );
    }
    showToast("success", "协同记录已同步，相关角色端会立即看到更新。");
  };

  const updateCollaborationRecord = (id: string, patch: Partial<CollaborationRecord>) => {
    const mergedRecord = collaborationRecords.find((record) => record.id === id);
    setCollaborationRecords((current) => {
      const next = current.map((record) => record.id === id ? { ...record, ...patch } : record);
      localStorage.setItem(collaborationStorageKey, JSON.stringify(next));
      return next;
    });
    if (mergedRecord && patch.answer) {
      updateManagedInterns((current) =>
        current.map((intern) => intern.name === mergedRecord.internName
          ? { ...intern, processStatus: "复盘中", updatedAt: nowLabel() }
          : intern),
      );
    }
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
/* RECOVERY_GAP_LINE_5779 */
/* RECOVERY_GAP_LINE_5780 */
/* RECOVERY_GAP_LINE_5781 */
/* RECOVERY_GAP_LINE_5782 */
/* RECOVERY_GAP_LINE_5783 */
/* RECOVERY_GAP_LINE_5784 */
/* RECOVERY_GAP_LINE_5785 */
/* RECOVERY_GAP_LINE_5786 */
/* RECOVERY_GAP_LINE_5787 */
/* RECOVERY_GAP_LINE_5788 */
/* RECOVERY_GAP_LINE_5789 */
/* RECOVERY_GAP_LINE_5790 */
/* RECOVERY_GAP_LINE_5791 */
/* RECOVERY_GAP_LINE_5792 */
/* RECOVERY_GAP_LINE_5793 */
/* RECOVERY_GAP_LINE_5794 */
/* RECOVERY_GAP_LINE_5795 */
/* RECOVERY_GAP_LINE_5796 */
/* RECOVERY_GAP_LINE_5797 */
/* RECOVERY_GAP_LINE_5798 */
/* RECOVERY_GAP_LINE_5799 */
/* RECOVERY_GAP_LINE_5800 */
/* RECOVERY_GAP_LINE_5801 */
/* RECOVERY_GAP_LINE_5802 */
/* RECOVERY_GAP_LINE_5803 */
/* RECOVERY_GAP_LINE_5804 */
/* RECOVERY_GAP_LINE_5805 */
/* RECOVERY_GAP_LINE_5806 */
/* RECOVERY_GAP_LINE_5807 */
/* RECOVERY_GAP_LINE_5808 */
/* RECOVERY_GAP_LINE_5809 */
/* RECOVERY_GAP_LINE_5810 */
/* RECOVERY_GAP_LINE_5811 */
/* RECOVERY_GAP_LINE_5812 */
/* RECOVERY_GAP_LINE_5813 */
/* RECOVERY_GAP_LINE_5814 */
/* RECOVERY_GAP_LINE_5815 */
/* RECOVERY_GAP_LINE_5816 */
/* RECOVERY_GAP_LINE_5817 */
/* RECOVERY_GAP_LINE_5818 */
/* RECOVERY_GAP_LINE_5819 */
/* RECOVERY_GAP_LINE_5820 */
/* RECOVERY_GAP_LINE_5821 */
/* RECOVERY_GAP_LINE_5822 */
/* RECOVERY_GAP_LINE_5823 */
/* RECOVERY_GAP_LINE_5824 */
/* RECOVERY_GAP_LINE_5825 */
/* RECOVERY_GAP_LINE_5826 */
/* RECOVERY_GAP_LINE_5827 */
/* RECOVERY_GAP_LINE_5828 */
/* RECOVERY_GAP_LINE_5829 */
/* RECOVERY_GAP_LINE_5830 */
/* RECOVERY_GAP_LINE_5831 */
/* RECOVERY_GAP_LINE_5832 */
/* RECOVERY_GAP_LINE_5833 */
/* RECOVERY_GAP_LINE_5834 */
/* RECOVERY_GAP_LINE_5835 */
/* RECOVERY_GAP_LINE_5836 */
/* RECOVERY_GAP_LINE_5837 */
/* RECOVERY_GAP_LINE_5838 */
/* RECOVERY_GAP_LINE_5839 */
/* RECOVERY_GAP_LINE_5840 */
/* RECOVERY_GAP_LINE_5841 */
/* RECOVERY_GAP_LINE_5842 */
/* RECOVERY_GAP_LINE_5843 */
/* RECOVERY_GAP_LINE_5844 */
/* RECOVERY_GAP_LINE_5845 */
/* RECOVERY_GAP_LINE_5846 */
/* RECOVERY_GAP_LINE_5847 */
/* RECOVERY_GAP_LINE_5848 */
/* RECOVERY_GAP_LINE_5849 */
/* RECOVERY_GAP_LINE_5850 */
/* RECOVERY_GAP_LINE_5851 */
/* RECOVERY_GAP_LINE_5852 */
/* RECOVERY_GAP_LINE_5853 */
/* RECOVERY_GAP_LINE_5854 */
/* RECOVERY_GAP_LINE_5855 */
/* RECOVERY_GAP_LINE_5856 */
/* RECOVERY_GAP_LINE_5857 */
/* RECOVERY_GAP_LINE_5858 */
/* RECOVERY_GAP_LINE_5859 */
/* RECOVERY_GAP_LINE_5860 */
/* RECOVERY_GAP_LINE_5861 */
/* RECOVERY_GAP_LINE_5862 */
/* RECOVERY_GAP_LINE_5863 */
/* RECOVERY_GAP_LINE_5864 */
/* RECOVERY_GAP_LINE_5865 */
/* RECOVERY_GAP_LINE_5866 */
/* RECOVERY_GAP_LINE_5867 */
/* RECOVERY_GAP_LINE_5868 */
/* RECOVERY_GAP_LINE_5869 */
/* RECOVERY_GAP_LINE_5870 */
/* RECOVERY_GAP_LINE_5871 */
/* RECOVERY_GAP_LINE_5872 */
/* RECOVERY_GAP_LINE_5873 */
/* RECOVERY_GAP_LINE_5874 */
/* RECOVERY_GAP_LINE_5875 */
/* RECOVERY_GAP_LINE_5876 */
/* RECOVERY_GAP_LINE_5877 */
/* RECOVERY_GAP_LINE_5878 */
/* RECOVERY_GAP_LINE_5879 */
/* RECOVERY_GAP_LINE_5880 */
/* RECOVERY_GAP_LINE_5881 */
/* RECOVERY_GAP_LINE_5882 */
/* RECOVERY_GAP_LINE_5883 */
/* RECOVERY_GAP_LINE_5884 */
/* RECOVERY_GAP_LINE_5885 */
/* RECOVERY_GAP_LINE_5886 */
/* RECOVERY_GAP_LINE_5887 */
/* RECOVERY_GAP_LINE_5888 */
/* RECOVERY_GAP_LINE_5889 */
/* RECOVERY_GAP_LINE_5890 */
/* RECOVERY_GAP_LINE_5891 */
/* RECOVERY_GAP_LINE_5892 */
/* RECOVERY_GAP_LINE_5893 */
/* RECOVERY_GAP_LINE_5894 */
/* RECOVERY_GAP_LINE_5895 */
/* RECOVERY_GAP_LINE_5896 */
/* RECOVERY_GAP_LINE_5897 */
/* RECOVERY_GAP_LINE_5898 */
/* RECOVERY_GAP_LINE_5899 */
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
