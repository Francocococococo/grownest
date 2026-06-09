import { useEffect, useMemo, useState } from "react";
import {
  LockKeyhole,
  LogIn,
  LogOut,
  RotateCcw,
  Sparkles,
  } from "lucide-react";
import { useAuth } from "./hooks/useAuth";
import { useInterns } from "./hooks/useInterns";
import ThemePreviewPage from "./ThemePreviewPage";
import { roleName, rolePath } from "./constants/options";
import {
  type CollaborationRecord,
  type ManagedIntern,
  type MockUser,
  type UserRole,
} from "./types";
import { mockUsers as userSeeds } from "./data/mock";
import { readCollaborationRecords, readStoredUser } from "./utils/storage";
import { getAverageProgress, getMentorFeedbackRate } from "./utils/calculations";
import { generateRiskAnalysis, generateWeeklyReport } from "./utils/ai";
import { nowLabel } from "./utils/formatters";

type AuthUser = Omit<MockUser, "password">;
type Path = "/" | "/login" | "/student" | "/mentor" | "/hr" | "/admin" | "/preview-theme";

const collaborationStorageKey = "internflow_collaboration_records";

function createManagedInterns(): ManagedIntern[] {
  const names = [
    "林小鹅",
    "陈一鸣",
    "周可可",
    "王予安",
    "李想",
    "赵晴",
    "孙航",
    "吴念",
    "许诺",
    "蒋晨",
    "唐雨",
    "刘昊",
    "沈佳宁",
    "高远",
    "罗曼",
    "白芷",
    "韩越",
    "程栩",
    "姚瑶",
    "马骁",
  ];
  const roles = ["产品", "研发", "销售", "HR"];
  const mentors = ["王老师", "李老师", "陈老师"];
  return names.map((name, index) => {
    const role = roles[index % roles.length];
    const mentor = mentors[index % mentors.length];
    const progress = 50 + ((index * 7) % 40);
    return {
      id: `intern-${index + 1}`,
      name,
      role,
      title: `${role}实习生`,
      department: `${role}方向`,
      mentor,
      week: "第3周",
      progress,
      risk: progress >= 80 ? "低风险" : progress >= 60 ? "中风险" : "高风险",
      reason: progress >= 80 ? "表现稳定" : progress >= 60 ? "节奏需要支持" : "需要重点关注",
      todo: progress >= 80 ? "持续挑战任务" : "补充带教支持",
      processStatus: progress >= 80 ? "已关闭" : progress >= 60 ? "已同步导师" : "待 HR 沟通",
      riskTags: progress >= 80 ? ["稳定"] : ["关注"],
      tasks: [
        { id: `${index + 1}-1`, title: "完成阶段任务", status: index % 3 === 0 ? "已完成" : "进行中", due: "本周五", owner: "实习生", note: "阶段任务" },
        { id: `${index + 1}-2`, title: "提交周反馈", status: index % 4 === 0 ? "已完成" : "未开始", due: "本周五", owner: "实习生", note: "周反馈" },
      ],
      feedbacks: [],
      createdAt: nowLabel(),
      updatedAt: nowLabel(),
    };
  });
}

function App() {
  const { user, login: persistLogin, logout: clearAuth } = useAuth();
  const { managedInterns, setManagedInterns } = useInterns(createManagedInterns);
  const [collaborationRecords, setCollaborationRecords] = useState<CollaborationRecord[]>(() => readCollaborationRecords());
  const [path, setPath] = useState<Path>(() => {
    const current = window.location.pathname as Path;
    const storedUser = readStoredUser();
    if (current === "/" || current === "/login" || current === "/preview-theme") return current;
    if (!storedUser) {
      window.history.replaceState({}, "", "/login");
      return "/login";
    }
    return rolePath[storedUser.role];
  });

  useEffect(() => {
    const onPop = () => setPath(window.location.pathname as Path);
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  const navigate = (nextPath: Path) => {
    window.history.pushState({}, "", nextPath);
    setPath(nextPath);
  };

  const login = (nextUser: AuthUser) => {
    persistLogin(nextUser);
    navigate(rolePath[nextUser.role]);
  };

  const logout = () => {
    clearAuth();
    navigate("/login");
  };

  const resetDemo = () => {
    localStorage.removeItem(collaborationStorageKey);
    setCollaborationRecords([]);
    setManagedInterns(createManagedInterns());
  };

  const title = useMemo(() => {
    if (!user) return "GrowNest 鹅苗成长舱";
    return roleName[user.role];
  }, [user]);

  if (path === "/") return <HomePage onNavigate={navigate} />;
  if (path === "/preview-theme") return <ThemePreviewPage />;
  if (path === "/login" || !user) return <LoginPage onLogin={login} />;

  return (
    <AppLayout title={title} user={user} onLogout={logout} onReset={resetDemo}>
      {user.role === "hr" && (
        <HrPage
          managedInterns={managedInterns}
          collaborationRecords={collaborationRecords}
          onRefresh={() => {
            setCollaborationRecords(readCollaborationRecords());
          }}
        />
      )}
      {user.role === "student" && <StudentPage />}
      {user.role === "mentor" && <MentorPage />}
      {user.role === "admin" && <AdminPage />}
    </AppLayout>
  );
}

function HomePage({ onNavigate }: { onNavigate: (path: Path) => void }) {
  return (
    <main className="mx-auto flex min-h-screen max-w-6xl items-center justify-center px-6 py-12">
      <div className="w-full rounded-[20px] border border-white/60 bg-white/70 p-8 shadow-[0_18px_44px_rgba(36,26,72,0.08)]">
        <h1 className="text-3xl font-black text-slate-900">GrowNest 鹅苗成长舱</h1>
        <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-600">一个轻量的实习生成长协同原型。</p>
        <div className="mt-6 flex flex-wrap gap-3">
          {(Object.keys(rolePath) as UserRole[]).map((role) => (
            <button key={role} onClick={() => onNavigate(rolePath[role])} className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-bold text-white">
              进入{roleName[role]}
            </button>
          ))}
        </div>
      </div>
    </main>
  );
}

function LoginPage({ onLogin }: { onLogin: (user: AuthUser) => void }) {
  return (
    <main className="mx-auto flex min-h-screen max-w-5xl items-center px-6 py-10">
      <div className="grid w-full gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <section className="rounded-[20px] border border-white/60 bg-white/70 p-8 shadow-[0_18px_44px_rgba(36,26,72,0.08)]">
          <p className="text-xs font-black uppercase tracking-[0.12em] text-violet-700">GrowNest</p>
          <h1 className="mt-4 text-4xl font-black text-slate-900">鹅苗成长舱</h1>
          <p className="mt-4 text-sm leading-7 text-slate-600">让实习生成长可见，让导师带教有序，让 HR 协同更轻。</p>
          <div className="mt-8 grid gap-3 sm:grid-cols-2">
            {userSeeds.map((item) => (
              <button key={item.username} onClick={() => onLogin(item as AuthUser)} className="rounded-2xl border border-slate-200 bg-white px-4 py-4 text-left">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="font-black text-slate-900">{item.roleLabel}</p>
                    <p className="text-sm text-slate-500">{item.name}</p>
                  </div>
                  <LogIn className="h-4 w-4 text-violet-700" />
                </div>
              </button>
            ))}
          </div>
        </section>
        <section className="rounded-[20px] border border-white/60 bg-white/65 p-8">
          <LockKeyhole className="h-6 w-6 text-violet-700" />
          <div className="mt-6 grid gap-3">
            <div className="rounded-2xl bg-violet-50 p-4 text-sm text-slate-700">支持本地登录与 localStorage 持久化。</div>
            <div className="rounded-2xl bg-emerald-50 p-4 text-sm text-slate-700">保留 HRBP、导师、学生、管理员四个端口。</div>
          </div>
        </section>
      </div>
    </main>
  );
}

function AppLayout({
  title,
  user,
  onLogout,
  onReset,
  children,
}: {
  title: string;
  user: AuthUser;
  onLogout: () => void;
  onReset: () => void;
  children: React.ReactNode;
}) {
  return (
    <main className="min-h-screen px-6 py-6">
      <header className="mx-auto mb-4 flex max-w-7xl items-center justify-between gap-4 rounded-[18px] border border-white/60 bg-white/75 px-5 py-4 shadow-[0_14px_32px_rgba(36,26,72,0.06)]">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.12em] text-violet-700">GrowNest 鹅苗成长舱</p>
          <h1 className="mt-1 text-xl font-black text-slate-900">{title}</h1>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={onReset} className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-bold text-slate-700">
            <RotateCcw className="mr-2 inline h-4 w-4" />
            重置
          </button>
          <button onClick={onLogout} className="rounded-xl bg-slate-900 px-3 py-2 text-sm font-bold text-white">
            <LogOut className="mr-2 inline h-4 w-4" />
            退出
          </button>
        </div>
      </header>
      <div className="mx-auto max-w-7xl">{children}</div>
      <div className="mx-auto mt-6 max-w-7xl text-xs text-slate-500">当前用户：{user.name}</div>
    </main>
  );
}

function HrPage({
  managedInterns,
  collaborationRecords,
  onRefresh,
}: {
  managedInterns: ManagedIntern[];
  collaborationRecords: CollaborationRecord[];
  onRefresh: () => void;
}) {
  const stats = [
    { label: "关注对象", value: managedInterns.filter((item) => item.risk !== "低风险").length },
    { label: "待确认信号", value: collaborationRecords.length },
    { label: "进行中跟进", value: managedInterns.filter((item) => item.processStatus === "已同步导师").length },
    { label: "复盘记录", value: managedInterns.filter((item) => item.processStatus === "复盘中").length },
  ];
  const avgProgress = getAverageProgress(managedInterns);
  const feedbackRate = getMentorFeedbackRate(managedInterns);
  const report = generateWeeklyReport(managedInterns, collaborationRecords);
  const aiInsight = generateRiskAnalysis(managedInterns[0] ?? createManagedInterns()[0]);

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

      <section className="grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
        <div className="rounded-[18px] border border-white/60 bg-white/75 p-5">
          <p className="text-xs font-black uppercase tracking-[0.12em] text-violet-700">AI 辅助洞察</p>
          <h3 className="mt-1 text-lg font-black text-slate-900">当前状态</h3>
          <div className="mt-4 grid gap-3 md:grid-cols-3">
            <div className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-700">当前暂无任务进度、导师反馈或实习生提问，AI 不生成判断性建议。</div>
            <div className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-700">确认花名册与导师绑定即可。</div>
            <div className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-700">避免把准备数据误读为表现数据。</div>
          </div>
        </div>
        <div className="rounded-[18px] border border-white/60 bg-white/75 p-5">
          <p className="text-xs font-black uppercase tracking-[0.12em] text-violet-700">权限边界</p>
          <div className="mt-4 grid gap-2 text-sm text-slate-700">
            {[
              ["实习生成长端", "个人成长路径、任务、导师反馈", "内部关注标签和招聘判断"],
              ["导师带教端", "负责实习生的任务、提问、反馈草稿", "其他导师带教明细"],
              ["HRBP 成长运营台", "批次总览、关注原因、协同记录", "非必要私密沟通原文"],
            ].map(([role, canSee, hidden]) => (
              <div key={role} className="rounded-2xl bg-slate-50 p-4">
                <p className="font-black text-slate-900">{role}</p>
                <p className="mt-1 text-sm text-slate-600">可见：{canSee}</p>
                <p className="mt-1 text-sm text-slate-600">默认隐藏：{hidden}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
        <div className="rounded-[18px] border border-white/60 bg-white/75 p-5">
          <p className="text-xs font-black uppercase tracking-[0.12em] text-violet-700">AI 可靠性护栏</p>
          <div className="mt-4 grid gap-3 md:grid-cols-3">
            {[
              ["规则先判定", "任务完成度、延期次数、导师反馈缺失等硬信号先触发关注候选。"],
              ["证据再生成", "AI 只基于任务、成长路径、导师观察和协同记录生成建议。"],
              ["人工确认", "导师反馈、HRBP 介入和后续观察必须由对应角色确认后同步。"],
            ].map(([title, detail], index) => (
              <div key={title} className="rounded-2xl bg-slate-50 p-4">
                <p className="text-xs font-bold text-slate-500">{index + 1}</p>
                <p className="mt-2 font-black text-slate-900">{title}</p>
                <p className="mt-2 text-sm leading-6 text-slate-600">{detail}</p>
              </div>
            ))}
          </div>
        </div>
        <div className="rounded-[18px] border border-white/60 bg-white/75 p-5">
          <p className="text-xs font-black uppercase tracking-[0.12em] text-violet-700">MVP 范围</p>
          <div className="mt-4 grid gap-3">
            {[
              "成长路径：按岗位提供 30-60-90 天阶段目标、任务和验收标准。",
              "导师周反馈：每周一次轻量评分和 AI 反馈草稿，导师确认后同步。",
              "HRBP 成长运营台：聚合进度、导师反馈完成率、需关注和高潜名单。",
              "招聘效能复盘模块：作为 HRBP 成长运营台里的只读分析模块。",
            ].map((item) => (
              <div key={item} className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-700">{item}</div>
            ))}
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
