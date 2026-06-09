import { useEffect, useMemo, useState } from "react";
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
  Loader2,
  LogOut,
  MessageSquareText,
  Rocket,
  Search,
  Send,
  ShieldCheck,
  Sparkles,
  SquarePen,
  Target,
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
  riskDistribution,
  roleProgress,
  studentWeeklyTasks,
  type Intern,
  type MockUser,
  type RiskLevel,
  type UserRole,
} from "./data/mock";

type AuthUser = Omit<MockUser, "password">;
type Path = "/login" | "/student" | "/mentor" | "/hr";
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

const collaborationStorageKey = "internflow_collaboration_records";

const rolePath: Record<UserRole, Path> = {
  student: "/student",
  mentor: "/mentor",
  hr: "/hr",
};

const roleName: Record<UserRole, string> = {
  student: "实习生",
  mentor: "导师",
  hr: "HR",
};

const riskClass: Record<RiskLevel, string> = {
  低风险: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  中风险: "bg-amber-50 text-amber-700 ring-amber-200",
  高风险: "bg-rose-50 text-rose-700 ring-rose-200",
};

async function requestAiGeneration<T>(type: "feedback" | "questions" | "report" | "hrAction", payload: unknown): Promise<T> {
  const apiBase = import.meta.env.DEV ? "http://127.0.0.1:3001" : "";
  const response = await fetch(`${apiBase}/api/generate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ type, payload }),
  });
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data?.error || "AI 生成失败，请稍后重试。");
  }

  return data.output as T;
}

function readStoredUser(): AuthUser | null {
  try {
    const raw = localStorage.getItem("internflow_user");
    return raw ? (JSON.parse(raw) as AuthUser) : null;
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
        "relative shrink-0 overflow-hidden rounded-2xl bg-gradient-to-br from-[#0868ff] to-[#0f7bff] shadow-[0_14px_30px_rgba(24,119,255,0.25)]",
        compact ? "h-9 w-9" : "h-12 w-12",
      )}
    >
      <span className="absolute left-[20%] top-[22%] h-[12%] w-[30%] rounded-sm bg-white" />
      <span className="absolute left-[20%] top-[42%] h-[40%] w-[12%] rounded-sm bg-white" />
      <span className="absolute left-[44%] top-[22%] h-[12%] w-[38%] rounded-sm bg-[#5de047]" />
      <span className="absolute left-[43%] top-[42%] h-[12%] w-[25%] rounded-sm bg-white" />
      <span className="absolute left-[43%] top-[56%] h-[25%] w-[12%] rounded-sm bg-white" />
    </div>
  );
}

function BrandLogo({ small = false }: { small?: boolean }) {
  return (
    <div className="flex items-center gap-3">
      <LogoMark compact={small} />
      <div>
        <div className={cn("font-black italic leading-none tracking-[0]", small ? "text-base" : "text-2xl")}>
          <span className="text-[#0b64e6]">InternFlow</span>
          <span className="ml-2 not-italic text-slate-950">实习能量站</span>
        </div>
        {!small && <p className="mt-2 text-sm tracking-wide text-slate-500">AI-powered Internship Growth Navigator</p>}
      </div>
    </div>
  );
}

function Card({ className, children, ...props }: HTMLAttributes<HTMLElement> & { children: ReactNode }) {
  return (
    <section
      className={cn(
        "rounded-[26px] border border-white/90 bg-white/90 p-5 shadow-[0_18px_45px_rgba(37,99,235,0.08)] backdrop-blur",
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
        "inline-flex items-center justify-center gap-2 rounded-2xl px-4 py-2.5 text-sm font-semibold transition active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60",
        variant === "primary" && "bg-[#1877ff] text-white shadow-lg shadow-blue-500/25 hover:bg-[#0f68e8]",
        variant === "soft" && "bg-blue-50 text-blue-700 hover:bg-blue-100",
        variant === "ghost" && "bg-white text-slate-700 ring-1 ring-slate-200 hover:bg-slate-50",
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}

function Badge({ risk }: { risk: RiskLevel }) {
  return <span className={cn("rounded-full px-2.5 py-1 text-xs font-semibold ring-1", riskClass[risk])}>{risk}</span>;
}

function StatusPill({ status }: { status: string }) {
  const styles: Record<string, string> = {
    已完成: "bg-emerald-50 text-emerald-700 ring-emerald-200",
    进行中: "bg-blue-50 text-blue-700 ring-blue-200",
    未开始: "bg-slate-100 text-slate-500 ring-slate-200",
  };

  return <span className={cn("rounded-full px-2.5 py-1 text-xs font-bold ring-1", styles[status] ?? styles.未开始)}>{status}</span>;
}

function SectionTitle({ icon: Icon, title, subtitle }: { icon: ElementType; title: string; subtitle?: string }) {
  return (
    <div className="flex items-start gap-3">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
        <Icon className="h-5 w-5" />
      </div>
      <div>
        <h2 className="text-lg font-bold tracking-[0] text-slate-950">{title}</h2>
        {subtitle && <p className="mt-1 text-sm text-slate-500">{subtitle}</p>}
      </div>
    </div>
  );
}

function LoginPage({ onLogin }: { onLogin: (user: AuthUser) => void }) {
  const [role, setRole] = useState<UserRole>("student");
  const [username, setUsername] = useState("student");
  const [password, setPassword] = useState("123456");
  const [error, setError] = useState("");

  const selectedUser = mockUsers.find((user) => user.role === role)!;

  const selectRole = (nextRole: UserRole) => {
    const user = mockUsers.find((item) => item.role === nextRole)!;
    setRole(nextRole);
    setUsername(user.username);
    setPassword("123456");
    setError("");
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
    <main className="relative min-h-screen overflow-hidden px-5 py-8">
      <div className="absolute -left-40 top-20 h-96 w-96 rounded-full bg-blue-200/35 blur-3xl" />
      <div className="absolute -right-36 bottom-20 h-96 w-96 rounded-full bg-emerald-200/35 blur-3xl" />
      <div className="mx-auto grid min-h-[calc(100vh-64px)] max-w-7xl items-center gap-10 lg:grid-cols-[1.05fr_0.95fr]">
        <section className="relative">
          <BrandLogo />
          <p className="mt-8 text-lg font-semibold text-blue-700">面向实习生、导师与 HR 的 AI 成长导航系统</p>
          <h1 className="mt-5 max-w-3xl text-4xl font-black leading-tight tracking-[0] text-slate-950 lg:text-6xl">
            让实习生成长可见，让导师带教有序，让 HR 协同更轻。
          </h1>
          <div className="mt-8 grid max-w-2xl gap-4">
            {[
              ["30-60-90 天成长路径清晰可见", Rocket],
              ["导师带教节奏与反馈模板智能生成", MessageSquareText],
              ["AI 风险识别，帮助 HR 提前发现适岗问题", ShieldCheck],
            ].map(([text, Icon]) => (
              <div key={text as string} className="flex items-center gap-4 rounded-3xl bg-white/72 p-4 shadow-[0_18px_45px_rgba(37,99,235,0.08)]">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-emerald-400 text-white">
                  <Icon className="h-6 w-6" />
                </div>
                <p className="font-semibold text-slate-700">{text as string}</p>
              </div>
            ))}
          </div>
        </section>

        <Card className="relative p-7">
          <div className="mb-6">
            <p className="text-sm font-bold text-blue-600">Welcome back</p>
            <h2 className="mt-2 text-3xl font-black tracking-[0] text-slate-950">欢迎登录 InternFlow</h2>
            <p className="mt-2 text-sm text-slate-500">请选择你的身份，进入对应工作台。</p>
          </div>

          <div className="grid gap-2 rounded-2xl bg-slate-100 p-1 sm:grid-cols-3">
            {mockUsers.map((user) => (
              <button
                key={user.role}
                onClick={() => selectRole(user.role)}
                className={cn(
                  "rounded-xl px-3 py-3 text-sm font-bold transition",
                  role === user.role ? "bg-white text-blue-700 shadow-sm" : "text-slate-500 hover:text-blue-700",
                )}
              >
                {user.roleLabel}登录
              </button>
            ))}
          </div>

          <div className="mt-6 space-y-4">
            <label className="block">
              <span className="text-sm font-semibold text-slate-600">账号</span>
              <input
                value={username}
                onChange={(event) => setUsername(event.target.value)}
                className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-800 outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
              />
            </label>
            <label className="block">
              <span className="text-sm font-semibold text-slate-600">密码</span>
              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-800 outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
              />
            </label>
          </div>

          {error && <p className="mt-4 rounded-2xl bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-600">{error}</p>}

          <Button onClick={submit} className="mt-6 w-full py-3">
            进入{selectedUser.roleLabel}工作台
            <ChevronRight className="h-4 w-4" />
          </Button>

          <div className="mt-6 border-t border-slate-100 pt-5">
            <p className="mb-3 text-sm font-semibold text-slate-500">快速体验</p>
            <div className="grid gap-2 sm:grid-cols-3">
              {mockUsers.map((user) => (
                <Button key={user.role} variant="ghost" onClick={() => onLogin(publicUser(user))} className="px-3">
                  以{user.roleLabel}身份进入
                </Button>
              ))}
            </div>
          </div>
        </Card>
      </div>
    </main>
  );
}

function UserMenu({ user, onLogout }: { user: AuthUser; onLogout: () => void }) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="flex items-center gap-3 rounded-2xl bg-blue-50 px-3 py-2">
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-600 text-sm font-black text-white">
          {user.name.slice(0, 1)}
        </div>
        <div>
          <p className="text-sm font-bold leading-none text-slate-950">{user.name}</p>
          <p className="mt-1 text-xs text-blue-700">{roleName[user.role]} · {user.department}</p>
        </div>
      </div>
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
}: {
  user: AuthUser;
  title: string;
  children: ReactNode;
  onLogout: () => void;
}) {
  const nav: Array<{ path: Path; label: string; roles: UserRole[]; icon: ElementType }> = [
    { path: "/student", label: "实习生端", roles: ["student"], icon: GraduationCap },
    { path: "/mentor", label: "导师端", roles: ["mentor"], icon: MessageSquareText },
    { path: "/hr", label: "HR 管理端", roles: ["hr"], icon: LayoutDashboard },
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
          results.push({ title: `${intern.name}｜${intern.role}`, meta: `${intern.progress}% · ${intern.risk} · ${intern.processStatus}`, type: "风险看板" });
        }
      });
    }

    return results.slice(0, 6);
  }, [searchTerm, user.role]);

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-40 border-b border-blue-100/70 bg-white/82 backdrop-blur-xl">
        <div className="mx-auto flex max-w-[1480px] flex-col gap-4 px-5 py-3 lg:flex-row lg:items-center lg:justify-between">
          <BrandLogo />
          <div className="relative hidden min-w-96 xl:block">
            <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-500 shadow-sm transition focus-within:border-blue-300 focus-within:ring-4 focus-within:ring-blue-100">
              <Search className="h-4 w-4" />
              <input
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="搜索任务、反馈、成长记录"
                className="w-full bg-transparent text-sm text-slate-700 outline-none placeholder:text-slate-400"
              />
            </div>
            {searchTerm.trim() && (
              <div className="absolute left-0 right-0 top-12 z-50 overflow-hidden rounded-2xl border border-blue-100 bg-white shadow-2xl shadow-blue-950/10">
                <div className="border-b border-slate-100 px-4 py-3 text-xs font-bold text-slate-500">
                  已按{roleName[user.role]}权限找到 {searchResults.length} 条结果
                </div>
                {searchResults.length > 0 ? (
                  <div className="max-h-80 overflow-auto p-2">
                    {searchResults.map((result) => (
                      <button
                        key={`${result.type}-${result.title}`}
                        onClick={() => setSearchTerm(result.title)}
                        className="block w-full rounded-xl px-3 py-3 text-left transition hover:bg-blue-50"
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
                  <p className="px-4 py-5 text-sm font-semibold text-slate-500">没有找到匹配内容，试试姓名、风险等级或任务关键词。</p>
                )}
              </div>
            )}
          </div>
          <UserMenu user={user} onLogout={onLogout} />
        </div>
      </header>

      <div className="mx-auto flex max-w-[1480px] gap-5 px-5 py-6">
        <aside className="hidden w-[248px] shrink-0 xl:block">
          <div className="sticky top-24 space-y-3">
            <Card className="min-h-[520px] p-3">
              <div className="mb-4 border-b border-slate-100 px-2 pb-4 pt-1">
                <BrandLogo small />
              </div>
              <button className="mb-1 flex w-full items-center gap-3 rounded-xl bg-[#1168f4] px-3 py-3 text-left text-sm font-semibold text-white shadow-lg shadow-blue-500/20">
                <Home className="h-4 w-4" />
                当前工作台
              </button>
              {nav.filter((item) => item.roles.includes(user.role)).map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.path}
                    className="mb-1 flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm font-semibold text-slate-600 transition hover:bg-blue-50 hover:text-blue-700"
                  >
                    <Icon className="h-4 w-4" />
                    {item.label}
                  </button>
                );
              })}
              <div className="mt-8 rounded-2xl bg-gradient-to-br from-[#0c6bff] to-[#23c66f] p-4 text-white">
                <p className="flex items-center gap-2 text-sm font-bold">
                  <Bot className="h-4 w-4" />
                  角色权限
                </p>
                <p className="mt-2 text-xs leading-5 text-white/85">
                  当前以{roleName[user.role]}身份访问，仅展示该角色可处理的成长协同信息。
                </p>
              </div>
            </Card>
          </div>
        </aside>

        <main className="min-w-0 flex-1 space-y-6">
          <Card className="overflow-hidden p-0">
            <div className="relative overflow-hidden bg-gradient-to-br from-white via-[#f4f9ff] to-[#e8f3ff] p-6">
              <div className="absolute -right-16 -top-24 h-72 w-72 rounded-full border border-white/90 bg-blue-100/60" />
              <div className="absolute right-16 top-10 h-32 w-32 rounded-full border border-emerald-200/60" />
              <p className="relative inline-flex rounded-full bg-white px-3 py-1.5 text-xs font-bold text-blue-700 shadow-sm">
                InternFlow Role Portal
              </p>
              <h1 className="relative mt-4 text-2xl font-black tracking-[0] text-slate-950 lg:text-3xl">{title}</h1>
              <p className="relative mt-2 text-sm text-slate-500">
                登录身份：{user.name} / {roleName[user.role]}，系统已按权限过滤当前页面内容。
              </p>
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
    blue: "bg-blue-50 text-blue-600",
    green: "bg-emerald-50 text-emerald-600",
    amber: "bg-amber-50 text-amber-600",
    rose: "bg-rose-50 text-rose-600",
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

function GrowthPath() {
  const statusStyle: Record<string, string> = {
    已完成: "bg-emerald-50 text-emerald-700 ring-emerald-200",
    进行中: "bg-blue-50 text-blue-700 ring-blue-200",
    未开始: "bg-slate-100 text-slate-500 ring-slate-200",
  };

  return (
    <div className="grid gap-4 lg:grid-cols-3">
      {growthStages.map((stage, index) => (
        <Card key={stage.title} className="relative overflow-hidden">
          <div className="absolute right-5 top-5 text-5xl font-black text-blue-50">0{index + 1}</div>
          <p className="text-sm font-semibold text-blue-600">{stage.period}</p>
          <h3 className="mt-1 text-lg font-bold text-slate-950">{stage.theme}</h3>
          <div className="mt-5 space-y-3">
            {stage.tasks.map((task) => (
              <div key={task.label} className="flex items-center justify-between gap-3 rounded-2xl bg-slate-50 px-3 py-3">
                <span className="text-sm text-slate-700">{task.label}</span>
                <span className={cn("shrink-0 rounded-full px-2 py-1 text-xs font-semibold ring-1", statusStyle[task.status])}>{task.status}</span>
              </div>
            ))}
          </div>
        </Card>
      ))}
    </div>
  );
}

function StudentDashboard({
  user,
  records,
  onAddRecord,
}: {
  user: AuthUser;
  records: CollaborationRecord[];
  onAddRecord: (record: Omit<CollaborationRecord, "id" | "createdAt">) => void;
}) {
  const [showQuestions, setShowQuestions] = useState(false);
  const [questions, setQuestions] = useState<string[]>([]);
  const [studentQuestionDraft, setStudentQuestionDraft] = useState("");
  const [questionFocus, setQuestionFocus] = useState("业务指标怎么理解？");
  const [questionError, setQuestionError] = useState("");
  const [questionMessage, setQuestionMessage] = useState("");
  const [tasks, setTasks] = useState(studentWeeklyTasks);
  const [taskMessage, setTaskMessage] = useState("");
  const [questionLoading, setQuestionLoading] = useState(false);
  const completedTasks = tasks.filter((task) => task.status === "已完成").length;
  const studentProgress = Math.min(92, 56 + completedTasks * 8);
  const mentorFeedbackRecords = records.filter(
    (record) => record.internName === user.name && record.sourceRole === "导师" && record.targetRole === "实习生",
  );
  const mentorQuestionRecords = records.filter(
    (record) => record.internName === user.name && record.sourceRole === "实习生" && record.targetRole === "导师" && record.question,
  );

  const updateTaskStatus = (label: string) => {
    setTasks((current) =>
      current.map((task) => {
        if (task.label !== label) return task;
        if (task.status === "已完成") return task;
        const nextStatus = task.status === "未开始" ? "进行中" : "已完成";
        return { ...task, status: nextStatus, due: nextStatus === "已完成" ? "已完成" : task.due };
      }),
    );
    setTaskMessage(`已更新「${label}」的任务状态，成长进度已重新计算。`);
  };

  const generateQuestions = async () => {
    setQuestionLoading(true);
    setShowQuestions(false);
    setQuestionError("");
    setQuestionMessage("");
    try {
      const output = await requestAiGeneration<AIQuestions>("questions", {
        student: {
          name: user.name,
          title: user.title,
          department: user.department,
          mentor: user.mentor,
          week: "第 3 周",
          progress: studentProgress,
          risk: "中风险",
        },
        weeklyTasks: tasks,
        growthStages,
        aiSuggestion: "本周任务完成情况较好，但对业务指标的理解仍偏浅，需要补充 GMV、转化率、留存率等基础指标。",
        focusTopic: questionFocus,
        studentDraft: studentQuestionDraft || "实习生没有输入具体问题，请根据当前任务和成长建议生成适合向导师请教的问题。",
      });
      setQuestions(output.questions?.slice(0, 3) ?? []);
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

  return (
    <div className="space-y-6">
      <div className="grid gap-5 xl:grid-cols-[1fr_360px]">
        <Card>
          <SectionTitle icon={UserRound} title="个人信息卡" subtitle="仅展示与你本人相关的成长数据" />
          <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {[
              ["姓名", user.name],
              ["岗位", user.title ?? "产品运营实习生"],
              ["部门", user.department],
              ["导师", user.mentor ?? "王老师"],
              ["入职周期", "第 3 周"],
              ["当前风险", "中风险"],
            ].map(([label, value]) => (
              <div key={label} className="rounded-2xl bg-slate-50 p-4">
                <p className="text-xs font-semibold text-slate-500">{label}</p>
                <p className="mt-1 text-base font-bold text-slate-950">{value}</p>
              </div>
            ))}
          </div>
        </Card>
        <Card className="bg-gradient-to-br from-blue-50 via-white to-emerald-50">
          <p className="text-sm font-semibold text-blue-700">当前成长进度</p>
          <p className="mt-3 text-5xl font-black text-slate-950">{studentProgress}%</p>
          <div className="mt-4 h-3 rounded-full bg-slate-200">
            <div className="h-3 rounded-full bg-gradient-to-r from-blue-600 to-emerald-400 transition-all duration-500" style={{ width: `${studentProgress}%` }} />
          </div>
          <p className="mt-3 text-xs font-semibold text-slate-500">{completedTasks}/{tasks.length} 个本周任务已完成</p>
          <p className="mt-4"><Badge risk="中风险" /></p>
        </Card>
      </div>

      <section className="space-y-4">
        <SectionTitle icon={GraduationCap} title="30-60-90 天成长路径" subtitle="阶段目标、任务状态和成长节奏一目了然" />
        <GrowthPath />
      </section>

      <div className="grid gap-5 xl:grid-cols-[1fr_420px]">
        <Card>
          <SectionTitle icon={ClipboardList} title="本周任务" subtitle="聚焦你本周需要完成的动作" />
          <div className="mt-5 grid gap-3">
            {tasks.map((task) => (
              <div key={task.label} className="flex items-center justify-between rounded-2xl border border-blue-50 bg-white p-4">
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
                <Button variant="ghost" className="px-3 py-2 text-xs" disabled={task.status === "已完成"} onClick={() => updateTaskStatus(task.label)}>
                  {task.status === "已完成" ? "已完成" : "推进状态"}
                </Button>
              </div>
            ))}
          </div>
          {taskMessage && <p className="mt-4 rounded-2xl bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-700">{taskMessage}</p>}
        </Card>
        <Card className="bg-gradient-to-br from-[#eaf4ff] via-white to-[#eafff2]">
          <SectionTitle icon={BrainCircuit} title="AI 本周成长建议" subtitle="先写下自己的困惑，AI 会帮你整理成更适合问导师的问题" />
          <p className="mt-5 text-sm leading-7 text-slate-600">
            你本周任务完成情况较好，但对业务指标的理解仍偏浅。建议下周重点补充 GMV、转化率、留存率等基础指标，并主动向导师确认当前任务与团队目标之间的关系。
          </p>
          <div className="mt-5 rounded-3xl border border-blue-100 bg-white/75 p-4">
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
              className="mt-3 min-h-28 w-full resize-none rounded-2xl border border-slate-200 bg-slate-50 p-3 text-sm leading-6 text-slate-700 outline-none transition focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-100"
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
          {questionError && <p className="mt-4 rounded-2xl bg-rose-50 px-4 py-3 text-sm font-bold text-rose-700">{questionError}</p>}
          {questionMessage && <p className="mt-4 rounded-2xl bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-700">{questionMessage}</p>}
          {showQuestions && (
            <div className="mt-5 rounded-3xl bg-white/80 p-4">
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-black text-slate-950">可直接发给导师的问题</p>
                <span className="rounded-full bg-emerald-50 px-2 py-1 text-xs font-bold text-emerald-700">AI 已结合你的困惑优化</span>
              </div>
              <ol className="mt-4 space-y-3">
                {questions.map((question, index) => (
                  <li key={question} className="flex gap-3 rounded-2xl bg-slate-50 p-3 text-sm leading-6 text-slate-700">
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
        <SectionTitle icon={Send} title="导师问答" subtitle="你发送给导师的问题和导师回复会在这里同步" />
        <div className="mt-5 grid gap-3">
          {mentorQuestionRecords.length > 0 ? (
            mentorQuestionRecords.map((record) => (
              <div key={record.id} className="rounded-3xl border border-blue-100 bg-white p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <p className="font-black text-slate-950">{record.question}</p>
                  <span className={cn("rounded-full px-3 py-1 text-xs font-bold", record.answer ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700")}>
                    {record.answer ? "导师已回复" : "等待导师回复"}
                  </span>
                </div>
                {record.answer ? (
                  <div className="mt-3 rounded-2xl bg-blue-50 p-3 text-sm leading-7 text-slate-700">
                    <strong className="text-slate-950">导师回复：</strong>{record.answer}
                    <p className="mt-2 text-xs font-semibold text-blue-700">{record.answeredAt ?? "刚刚"}</p>
                  </div>
                ) : (
                  <p className="mt-3 text-sm text-slate-500">问题已同步到导师端，导师回复后会自动显示在这里。</p>
                )}
              </div>
            ))
          ) : (
            <div className="rounded-3xl border border-dashed border-slate-200 bg-slate-50 px-5 py-8 text-center">
              <p className="text-sm font-bold text-slate-600">暂无提问记录</p>
              <p className="mt-2 text-sm text-slate-500">先在上方让 AI 优化问题，再点击“发送导师”。</p>
            </div>
          )}
        </div>
      </Card>

      <Card>
        <SectionTitle icon={MessageSquareText} title="导师反馈收件箱" subtitle="导师确认反馈后，会同步到这里，方便你查看下一步成长重点" />
        <div className="mt-5 grid gap-3">
          {mentorFeedbackRecords.length > 0 ? (
            mentorFeedbackRecords.map((record) => (
              <div key={record.id} className="rounded-3xl border border-blue-100 bg-blue-50/70 p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="font-black text-slate-950">{record.title}</p>
                    <p className="mt-1 text-xs font-semibold text-blue-700">{record.createdAt} · 来自导师</p>
                  </div>
                  <span className="rounded-full bg-white px-3 py-1 text-xs font-bold text-blue-700">{record.status}</span>
                </div>
                <p className="mt-3 text-sm leading-7 text-slate-700">{record.detail}</p>
              </div>
            ))
          ) : (
            <div className="rounded-3xl border border-dashed border-slate-200 bg-slate-50 px-5 py-8 text-center">
              <p className="text-sm font-bold text-slate-600">暂无导师反馈</p>
              <p className="mt-2 text-sm text-slate-500">导师在带教助手中保存反馈后，你会在这里看到表现亮点、待提升点和下阶段建议。</p>
            </div>
          )}
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
}: {
  user: AuthUser;
  records: CollaborationRecord[];
  onAddRecord: (record: Omit<CollaborationRecord, "id" | "createdAt">) => void;
  onUpdateRecord: (id: string, patch: Partial<CollaborationRecord>) => void;
}) {
  const [selectedName, setSelectedName] = useState(mentorInterns[0].name);
  const selected = useMemo(() => mentorInterns.find((intern) => intern.name === selectedName) ?? mentorInterns[0], [selectedName]);
  const [feedback, setFeedback] = useState(mentorInterns[0].observationHint);
  const [draftFeedback, setDraftFeedback] = useState<AIFeedback | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [aiError, setAiError] = useState("");
  const [saved, setSaved] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [answerDrafts, setAnswerDrafts] = useState<Record<string, string>>({});
  const relatedRecords = records.filter((record) => record.internName === selected.name);
  const studentQuestions = relatedRecords.filter(
    (record) => record.sourceRole === "实习生" && record.targetRole === "导师" && record.question,
  );

  const selectIntern = (intern: typeof mentorInterns[number]) => {
    setSelectedName(intern.name);
    setFeedback(intern.observationHint);
    setDraftFeedback(null);
    setIsGenerating(false);
    setAiError("");
    setSaved(false);
    setIsSaving(false);
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
        detail: `表现亮点：${draftFeedback.highlights}；待提升点：${draftFeedback.improvements}；下阶段建议：${draftFeedback.nextStep}`,
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
      const output = await requestAiGeneration<AIFeedback>("feedback", {
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
        },
      });
      setDraftFeedback(output);
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

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <StatCard label="导师姓名" value={user.name} icon={UserRound} tone="blue" />
        <StatCard label="负责实习生" value="3 人" icon={Users} tone="green" />
        <StatCard label="本周待反馈" value="2 条" icon={MessageSquareText} tone="amber" />
        <StatCard label="高风险实习生" value="1 人" icon={AlertTriangle} tone="rose" />
        <Card className="p-5">
          <p className="text-sm font-medium text-slate-500">部门</p>
          <p className="mt-2 text-xl font-black text-slate-950">{user.department}</p>
        </Card>
      </div>

      <div className="grid gap-5 2xl:grid-cols-[1fr_380px]">
        <Card>
          <SectionTitle icon={Users} title="我的实习生列表" subtitle="导师只能查看自己负责的实习生" />
          <div className="mt-5 grid gap-3">
            {mentorInterns.map((intern) => (
              <button
                key={intern.name}
                onClick={() => selectIntern(intern)}
                className={cn(
                  "rounded-2xl border p-4 text-left transition hover:bg-blue-50",
                  selected.name === intern.name ? "border-blue-300 bg-blue-50 ring-2 ring-blue-100" : "border-slate-100 bg-white",
                )}
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-lg font-black text-slate-950">{intern.name}</p>
                    <p className="mt-1 text-sm text-slate-500">{intern.title}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-bold text-blue-700">{intern.progress}%</span>
                    <Badge risk={intern.risk} />
                    <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600">{intern.action}</span>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </Card>

        <Card className="h-fit">
          <SectionTitle icon={BrainCircuit} title={`${selected.name} 成长详情`} subtitle={selected.department} />
          <div className="mt-5 rounded-2xl bg-slate-50 p-4">
            <p className="text-sm text-slate-500">成长进度</p>
            <p className="mt-1 text-4xl font-black text-slate-950">{selected.progress}%</p>
            <div className="mt-3 h-2 rounded-full bg-slate-200">
              <div className="h-2 rounded-full bg-gradient-to-r from-blue-600 to-emerald-400" style={{ width: `${selected.progress}%` }} />
            </div>
          </div>
          <div className="mt-4 rounded-2xl bg-blue-50 p-4 text-sm leading-6 text-slate-700">{selected.detail}</div>
        </Card>
      </div>

      <div className="grid gap-5 xl:grid-cols-[0.8fr_1.2fr]">
        <Card>
          <SectionTitle icon={CalendarCheck} title="带教节奏提醒" subtitle="本周需要完成的导师动作" />
          <div className="mt-5 space-y-3">
            {mentorRhythmTodos.map((todo) => (
              <div key={todo} className="flex gap-3 rounded-2xl bg-blue-50 p-4 text-sm font-semibold text-slate-700">
                <ChevronRight className="mt-0.5 h-4 w-4 shrink-0 text-blue-600" />
                {todo}
              </div>
            ))}
          </div>
          <div className="mt-5 rounded-3xl border border-blue-100 bg-white p-4">
            <p className="text-sm font-black text-slate-950">HR 协同记录</p>
            <p className="mt-1 text-xs text-slate-500">展示 HR 针对当前实习生同步给导师的动作。</p>
            <div className="mt-4 space-y-3">
              {relatedRecords.filter((record) => record.sourceRole === "HR" && record.targetRole === "导师").length > 0 ? (
                relatedRecords.filter((record) => record.sourceRole === "HR" && record.targetRole === "导师").map((record) => (
                  <div key={record.id} className="rounded-2xl bg-blue-50 p-3">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-sm font-bold text-slate-950">{record.title}</p>
                      <span className="rounded-full bg-white px-2 py-1 text-xs font-bold text-blue-700">{record.status}</span>
                    </div>
                    <p className="mt-2 text-xs leading-5 text-slate-600">{record.detail}</p>
                    <p className="mt-2 text-xs font-semibold text-slate-400">{record.createdAt} · 来自 {record.sourceRole}</p>
                  </div>
                ))
              ) : (
                <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-3 py-4 text-sm text-slate-500">
                  暂无 HR 同步事项。HR 在风险卡点击“同步导师”或“创建复盘提醒”后会出现在这里。
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
                      <p className="mt-2 rounded-xl bg-blue-50 px-3 py-2 text-xs leading-5 text-slate-600">已回复：{record.answer}</p>
                    ) : (
                      <>
                        <textarea
                          value={answerDrafts[record.id] ?? ""}
                          onChange={(event) => setAnswerDrafts((current) => ({ ...current, [record.id]: event.target.value }))}
                          placeholder="请输入给实习生的回复，例如：你可以先看 GMV、转化率和留存率分别对应哪个业务环节..."
                          className="mt-3 min-h-20 w-full resize-none rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm leading-6 text-slate-700 outline-none focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-100"
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
          <div className="mt-5 grid gap-3 rounded-3xl border border-blue-100 bg-blue-50/70 p-4 md:grid-cols-[0.8fr_1.2fr]">
            <div>
              <p className="text-xs font-bold text-blue-700">当前辅导重点</p>
              <p className="mt-1 text-lg font-black text-slate-950">{selected.focus}</p>
              <p className="mt-2 text-sm leading-6 text-slate-600">{selected.detail}</p>
            </div>
            <div className="grid gap-2">
              {selected.aiSignals.map((signal) => (
                <div key={signal} className="flex items-center gap-2 rounded-2xl bg-white px-3 py-2 text-sm font-semibold text-slate-700">
                  <Sparkles className="h-4 w-4 shrink-0 text-blue-600" />
                  {signal}
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
            className="mt-5 min-h-32 w-full resize-none rounded-3xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700 outline-none transition focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-100"
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
                className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-bold text-slate-600 transition hover:bg-blue-100 hover:text-blue-700"
              >
                + {record}
              </button>
            ))}
          </div>
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <Button onClick={generateFeedback} disabled={!feedback.trim() || isGenerating}>
              <Sparkles className="h-4 w-4" />
              {isGenerating ? "AI 正在分析..." : "AI 生成结构化反馈"}
            </Button>
            <Button
              variant="soft"
              onClick={saveFeedback}
              disabled={!draftFeedback || isSaving}
            >
              {isSaving && <Loader2 className="h-4 w-4 animate-spin" />}
              {isSaving ? "正在同步..." : saved ? "已同步给学员和 HR" : "同步给学员和 HR"}
            </Button>
          </div>
          {isGenerating && (
            <div className="mt-4 rounded-2xl bg-blue-50 px-4 py-3 text-sm font-semibold text-blue-700">
              正在分析导师观察、成长进度、风险标签和本周任务记录...
            </div>
          )}
          {aiError && <p className="mt-4 rounded-2xl bg-rose-50 px-4 py-3 text-sm font-bold text-rose-700">{aiError}</p>}
          {saved && <p className="mt-4 rounded-2xl bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-700">反馈已发送给学员，HR 可在风险看板中查看同步记录。</p>}
          {draftFeedback && (
            <div className="mt-5 grid gap-3">
              <div>
                <h3 className="font-black text-slate-950">AI 生成的导师反馈草稿</h3>
                <p className="mt-1 text-sm text-slate-500">上方四项是导师管理版草稿，可编辑；发布后会分别同步到学员端反馈收件箱和 HR 风险看板。</p>
              </div>
              {[
                ["表现亮点", "highlights"],
                ["待提升点", "improvements"],
                ["下阶段建议", "nextStep"],
                ["给实习生的话术", "messageToIntern"],
              ].map(([title, key]) => (
                <div key={title} className="rounded-2xl bg-slate-50 p-4">
                  <p className="text-sm font-bold text-slate-950">{title}</p>
                  <textarea
                    value={draftFeedback[key as keyof AIFeedback]}
                    onChange={(event) =>
                      setDraftFeedback((current) => current ? { ...current, [key]: event.target.value } : current)
                    }
                    className="mt-2 min-h-16 w-full resize-none rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm leading-6 text-slate-700 outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
                  />
                </div>
              ))}
              <div className="rounded-3xl border border-emerald-100 bg-emerald-50/70 p-4">
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

function Dashboard() {
  const stats = [
    { label: "实习生总数", value: "20", icon: Users, tone: "blue" as const },
    { label: "平均成长进度", value: "68%", icon: Gauge, tone: "green" as const },
    { label: "高风险人数", value: "3", icon: AlertTriangle, tone: "rose" as const },
    { label: "导师反馈完成率", value: "75%", icon: CalendarCheck, tone: "amber" as const },
  ];

  return (
    <div className="space-y-5">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => <StatCard key={stat.label} {...stat} />)}
      </div>
      <div className="grid gap-5 xl:grid-cols-[1.6fr_1fr]">
        <Card>
          <SectionTitle icon={Target} title="岗位平均成长进度" subtitle="识别不同岗位的新人成长节奏" />
          <div className="mt-4 overflow-x-auto">
            <div className="min-w-[620px]">
              <BarChart width={620} height={288} data={roleProgress}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e8eef7" />
                <XAxis dataKey="role" axisLine={false} tickLine={false} />
                <YAxis axisLine={false} tickLine={false} domain={[0, 100]} />
                <Tooltip cursor={{ fill: "#f2f7ff" }} />
                <Bar dataKey="progress" radius={[12, 12, 0, 0]} fill="#1877ff" barSize={44} />
              </BarChart>
            </div>
          </div>
        </Card>
        <Card>
          <SectionTitle icon={AlertTriangle} title="风险分布" subtitle="低、中、高风险人数占比" />
          <div className="mt-4 flex justify-center overflow-x-auto">
            <div className="min-w-[320px]">
              <PieChart width={320} height={288}>
                <Pie data={riskDistribution} innerRadius={62} outerRadius={94} dataKey="value" paddingAngle={5}>
                  {riskDistribution.map((item) => <Cell key={item.name} fill={item.color} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {riskDistribution.map((item) => (
              <div key={item.name} className="rounded-2xl bg-slate-50 p-3 text-center">
                <p className="text-lg font-bold" style={{ color: item.color }}>{item.value}</p>
                <p className="text-xs text-slate-500">{item.name}</p>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
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
  const [actionMessage, setActionMessage] = useState("");
  const [actionError, setActionError] = useState("");
  const [actionLoading, setActionLoading] = useState("");
  const relatedRecords = records.filter((record) => record.internName === intern.name);
  const metricTone = {
    normal: "bg-emerald-50 text-emerald-700 ring-emerald-100",
    warning: "bg-amber-50 text-amber-700 ring-amber-100",
    danger: "bg-rose-50 text-rose-700 ring-rose-100",
  };
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
      const output = await requestAiGeneration<AIHrAction>("hrAction", {
        actionType: label,
        targetRole,
        intern,
        relatedRecords,
      });
      onAddRecord({
        internName: intern.name,
        sourceRole: "HR",
        targetRole,
        title: output.title,
        detail: output.detail,
        status,
      });
      setActionMessage(`已为 ${intern.name} ${label}，AI 生成的协同记录已同步到${targetRole === "导师" ? "导师端" : "HR 操作记录"}。`);
    } catch (error) {
      setActionError(error instanceof Error ? error.message : "AI 生成失败，请稍后重试。");
    } finally {
      setActionLoading("");
    }
  };

  return (
    <Card className="h-fit border-blue-100">
      <SectionTitle icon={BrainCircuit} title="AI 风险分析卡" subtitle={`${intern.name} · ${intern.role}`} />
      <div className="mt-5 space-y-4">
        <div className="flex items-center justify-between rounded-2xl bg-slate-50 p-4">
          <span className="text-sm font-medium text-slate-500">风险等级</span>
          <Badge risk={intern.risk} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-2xl bg-blue-50 p-4">
            <p className="text-xs font-semibold text-blue-600">AI 置信度</p>
            <p className="mt-1 text-2xl font-black text-slate-950">{intern.confidence}%</p>
          </div>
          <div className="rounded-2xl bg-slate-50 p-4">
            <p className="text-xs font-semibold text-slate-500">处置状态</p>
            <p className="mt-2 text-sm font-black text-slate-950">{intern.processStatus}</p>
          </div>
        </div>
        <div className="rounded-2xl bg-slate-50 p-4">
          <p className="text-sm font-bold text-slate-950">AI 判断依据</p>
          <div className="mt-3 grid gap-2">
            {intern.evidenceMetrics.map((metric) => (
              <div key={metric.label} className={cn("flex items-center justify-between rounded-xl px-3 py-2 text-sm ring-1", metricTone[metric.status])}>
                <span>{metric.label}</span>
                <strong>{metric.value}</strong>
              </div>
            ))}
          </div>
        </div>
        <InfoBlock title="关键证据" items={intern.evidence} />
        <div className="flex flex-wrap gap-2">
          {intern.riskTags.map((tag) => (
            <span key={tag} className="rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-blue-700">{tag}</span>
          ))}
        </div>
        <InfoBlock title="可能原因" text={intern.possibleCause} />
        <InfoBlock title="建议 HR 动作" text={intern.hrAction} />
        <div className="grid gap-2 sm:grid-cols-3 2xl:grid-cols-1">
          {actionButtons.map(({ label, icon: Icon, status, targetRole }) => (
            <Button
              key={label}
              variant="ghost"
              className="justify-start"
              disabled={!!actionLoading}
              onClick={() => generateHrAction(label, status, targetRole)}
            >
              {actionLoading === label ? <Loader2 className="h-4 w-4 animate-spin" /> : <Icon className="h-4 w-4" />}
              {actionLoading === label ? "AI 生成中..." : label}
            </Button>
          ))}
        </div>
        {actionError && <p className="rounded-2xl bg-rose-50 px-4 py-3 text-sm font-bold text-rose-700">{actionError}</p>}
        {actionMessage && <p className="rounded-2xl bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-700">{actionMessage}</p>}
        <div className="rounded-2xl bg-white p-4 ring-1 ring-blue-100">
          <p className="text-sm font-bold text-slate-950">跨端协同记录</p>
          <p className="mt-1 text-xs text-slate-500">展示导师同步给 HR、HR 同步给导师的最新记录。</p>
          <div className="mt-3 space-y-2">
            {relatedRecords.length > 0 ? (
              relatedRecords.slice(0, 4).map((record) => (
                <div key={record.id} className="rounded-xl bg-slate-50 px-3 py-2">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-xs font-black text-slate-800">{record.title}</p>
                    <span className="shrink-0 rounded-full bg-white px-2 py-0.5 text-[11px] font-bold text-blue-700">{record.sourceRole} → {record.targetRole}</span>
                  </div>
                  <p className="mt-1 text-xs leading-5 text-slate-500">{record.detail}</p>
                  <p className="mt-1 text-[11px] font-semibold text-slate-400">{record.createdAt}</p>
                </div>
              ))
            ) : (
              <p className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-3 py-4 text-xs text-slate-500">
                暂无跨端记录。导师保存反馈或 HR 同步导师后，这里会更新。
              </p>
            )}
          </div>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 2xl:grid-cols-1">
          <div className="rounded-2xl bg-blue-50 p-4">
            <p className="text-xs font-semibold text-blue-600">是否需要同步导师</p>
            <p className="mt-1 text-sm font-bold text-slate-900">{intern.syncMentor}</p>
          </div>
          <div className="rounded-2xl bg-amber-50 p-4">
            <p className="text-xs font-semibold text-amber-600">一周后复盘提醒</p>
            <p className="mt-1 text-sm font-bold text-slate-900">{intern.reviewReminder}</p>
          </div>
        </div>
        <div className="rounded-2xl bg-slate-50 p-4">
          <p className="text-sm font-bold text-slate-950">操作记录</p>
          <div className="mt-3 space-y-2">
            {intern.activityLog.map((log) => (
              <div key={log} className="flex gap-2 text-xs leading-5 text-slate-600">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-blue-500" />
                {log}
              </div>
            ))}
          </div>
        </div>
      </div>
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
}: {
  records: CollaborationRecord[];
  onAddRecord: (record: Omit<CollaborationRecord, "id" | "createdAt">) => void;
}) {
  const [selected, setSelected] = useState<Intern>(interns[1]);
  const [riskFilter, setRiskFilter] = useState<RiskLevel | "全部">("全部");
  const filteredInterns = riskFilter === "全部" ? interns : interns.filter((intern) => intern.risk === riskFilter);
  const selectedVisible = filteredInterns.some((intern) => intern.name === selected.name);
  const visibleSelected = selectedVisible ? selected : filteredInterns[0] ?? interns[0];

  return (
    <div className="grid gap-5 2xl:grid-cols-[1fr_390px]">
      <Card className="overflow-hidden">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <SectionTitle icon={Users} title="20 人成长风险看板" subtitle="点击任意实习生查看 AI 风险分析" />
          <div className="flex flex-wrap gap-2">
            {(["全部", "低风险", "中风险", "高风险"] as Array<RiskLevel | "全部">).map((risk) => (
              <button
                key={risk}
                onClick={() => {
                  setRiskFilter(risk);
                  const nextList = risk === "全部" ? interns : interns.filter((intern) => intern.risk === risk);
                  if (nextList.length) setSelected(nextList[0]);
                }}
                className={cn(
                  "rounded-full px-3 py-2 text-xs font-bold ring-1 transition",
                  riskFilter === risk ? "bg-blue-600 text-white ring-blue-600" : "bg-white text-slate-600 ring-slate-200 hover:bg-blue-50 hover:text-blue-700",
                )}
              >
                {risk}
              </button>
            ))}
          </div>
        </div>
        <p className="mt-4 rounded-2xl bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-600">
          当前筛选出 {filteredInterns.length} 名实习生，已选中 {visibleSelected.name}。
        </p>
        <div className="mt-5 overflow-x-auto">
          <table className="w-full min-w-[980px] border-separate border-spacing-y-2 text-left text-sm">
            <thead>
              <tr className="text-xs text-slate-500">
                {["姓名", "岗位", "入职周数", "成长进度", "风险等级", "处置状态", "AI 判断原因", "HR 待办"].map((head) => (
                  <th key={head} className="px-3 py-2 font-semibold">{head}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredInterns.map((intern) => (
                <tr
                  key={intern.name}
                  onClick={() => setSelected(intern)}
                  className={cn("cursor-pointer bg-slate-50 transition hover:bg-blue-50", visibleSelected.name === intern.name && "bg-blue-50 ring-2 ring-blue-200")}
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
                  <td className="px-3 py-4"><Badge risk={intern.risk} /></td>
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
      <RiskCard key={visibleSelected.name} intern={visibleSelected} records={records} onAddRecord={onAddRecord} />
    </div>
  );
}

function ReportModule({ records }: { records: CollaborationRecord[] }) {
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
      const output = await requestAiGeneration<AIReport>("report", {
        summary: {
          totalInterns: 20,
          averageProgress: "68%",
          highRiskCount: 3,
          mentorFeedbackRate: "75%",
          currentWeek: "第 3 周",
          department: "游戏业务部",
        },
        roleProgress,
        riskDistribution,
        interns,
        collaborationRecords: records,
      });
      setReport(output.report);
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
        <SectionTitle icon={FileText} title="适岗周报生成模块" subtitle="汇总成长状态、风险原因和下周动作" />
        <Button onClick={generateReport} disabled={generating}>
          {generating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
          {generating ? "正在生成周报..." : visible ? "重新生成周报" : "一键生成本周适岗周报"}
        </Button>
      </div>
      {generating ? (
        <div className="mt-5 rounded-3xl border border-blue-100 bg-blue-50/70 p-6">
          <div className="flex items-center gap-3 text-sm font-bold text-blue-700">
            <Loader2 className="h-5 w-5 animate-spin" />
            AI 正在汇总风险分布、导师反馈和下周动作...
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
}: {
  records: CollaborationRecord[];
  onAddRecord: (record: Omit<CollaborationRecord, "id" | "createdAt">) => void;
}) {
  return (
    <div className="space-y-6">
      <Dashboard />
      <HrRiskPanel records={records} onAddRecord={onAddRecord} />
      <ReportModule records={records} />
    </div>
  );
}

function App() {
  const [user, setUser] = useState<AuthUser | null>(() => readStoredUser());
  const [collaborationRecords, setCollaborationRecords] = useState<CollaborationRecord[]>(() => readCollaborationRecords());
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
      createdAt: "刚刚",
    };
    setCollaborationRecords((current) => {
      const next = [nextRecord, ...current].slice(0, 20);
      localStorage.setItem(collaborationStorageKey, JSON.stringify(next));
      return next;
    });
  };

  const updateCollaborationRecord = (id: string, patch: Partial<CollaborationRecord>) => {
    setCollaborationRecords((current) => {
      const next = current.map((record) => record.id === id ? { ...record, ...patch } : record);
      localStorage.setItem(collaborationStorageKey, JSON.stringify(next));
      return next;
    });
  };

  const title = useMemo(() => {
    if (!user) return "";
    if (user.role === "student") return "实习生工作台｜我的成长地图";
    if (user.role === "mentor") return "导师工作台｜带教任务与反馈助手";
    return "HR 工作台｜成长风险总览看板";
  }, [user]);

  if (!user) {
    return <LoginPage onLogin={login} />;
  }

  return (
    <AppLayout user={user} title={title} onLogout={logout}>
      {user.role === "student" && <StudentDashboard user={user} records={collaborationRecords} onAddRecord={addCollaborationRecord} />}
      {user.role === "mentor" && <MentorDashboard user={user} records={collaborationRecords} onAddRecord={addCollaborationRecord} onUpdateRecord={updateCollaborationRecord} />}
      {user.role === "hr" && <HRDashboard records={collaborationRecords} onAddRecord={addCollaborationRecord} />}
    </AppLayout>
  );
}

export default App;
