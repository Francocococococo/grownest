import {
  Bot,
  CheckCircle2,
  ChevronRight,
  Copy,
  FileText,
  GraduationCap,
  LayoutDashboard,
  LockKeyhole,
  MessageSquareText,
  Send,
  Sparkles,
  SquarePen,
} from "lucide-react";
import { cn } from "./lib/utils";

const colors = [
  ["Mist White", "#F4F1F8"],
  ["Deep Ink", "#1D0C3B"],
  ["Deep Violet", "#4731A3"],
  ["Electric Violet", "#5723EC"],
  ["Lavender Gray", "#C1B5C2"],
  ["Mist Gray", "#E2E2E3"],
  ["Soft Gray", "#6F6E72"],
  ["Coral", "#C25055"],
  ["Mint", "#31B88A"],
];

const glassCard =
  "theme-glass rounded-[24px] border border-white/45 bg-white/[0.58] shadow-[0_24px_70px_rgba(29,12,59,0.11)] backdrop-blur-[18px]";
const quietGlass =
  "rounded-[20px] border border-white/45 bg-white/[0.42] shadow-[0_14px_44px_rgba(29,12,59,0.08)] backdrop-blur-[16px]";

function PreviewButton({ variant = "primary", children }: { variant?: "primary" | "secondary"; children: React.ReactNode }) {
  return (
    <button
      className={cn(
        "inline-flex h-11 items-center justify-center gap-2 rounded-[14px] px-5 text-sm font-bold transition duration-200 hover:-translate-y-0.5 active:translate-y-0",
        variant === "primary"
          ? "bg-[#5723EC] text-white shadow-[0_12px_32px_rgba(87,35,236,0.22)] hover:bg-[#4731A3]"
          : "border border-white/55 bg-white/45 text-[#4731A3] backdrop-blur hover:bg-white/65",
      )}
    >
      {children}
    </button>
  );
}

function PreviewBadge({ tone, children }: { tone: "risk" | "growth" | "ai"; children: React.ReactNode }) {
  const styles = {
    risk: "border-[#C25055]/20 bg-[#C25055]/10 text-[#9D3E43]",
    growth: "border-[#31B88A]/20 bg-[#31B88A]/12 text-[#197D61]",
    ai: "border-[#5723EC]/20 bg-[#5723EC]/10 text-[#4731A3]",
  };
  return <span className={cn("inline-flex rounded-[10px] border px-3 py-1 text-xs font-bold", styles[tone])}>{children}</span>;
}

function MetricGlass({ label, value, detail, tone = "violet" }: { label: string; value: string; detail: string; tone?: "violet" | "mint" | "coral" }) {
  const toneClass = tone === "mint" ? "text-[#197D61]" : tone === "coral" ? "text-[#C25055]" : "text-[#4731A3]";
  return (
    <div className={cn(quietGlass, "p-5 transition duration-200 hover:-translate-y-1 hover:bg-white/58")}>
      <p className="text-xs font-bold uppercase tracking-[0.08em] text-[#6F6E72]">{label}</p>
      <p className={cn("mt-3 text-3xl font-black tracking-[-0.02em]", toneClass)}>{value}</p>
      <p className="mt-2 text-sm leading-6 text-[#6F6E72]">{detail}</p>
    </div>
  );
}

function ProgressLine({ value = 72 }: { value?: number }) {
  return (
    <div className="h-2 overflow-hidden rounded-full bg-white/60 ring-1 ring-[#C1B5C2]/25">
      <div className="h-full rounded-full bg-[#31B88A] shadow-[0_0_18px_rgba(49,184,138,0.24)]" style={{ width: `${value}%` }} />
    </div>
  );
}

function LoginPreview() {
  const roles = [
    ["实习生", "今日任务与导师反馈", GraduationCap],
    ["导师", "反馈草稿与问答", MessageSquareText],
    ["HRBP", "批次状态与协同", LayoutDashboard],
  ] as const;

  return (
    <section className={cn(glassCard, "relative min-h-[520px] overflow-hidden p-7")}>
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white to-transparent" />
      <div className="flex items-start justify-between gap-5">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.12em] text-[#4731A3]">Access Preview</p>
          <h2 className="mt-4 max-w-[320px] text-4xl font-black leading-[1.03] tracking-[-0.03em] text-[#1D0C3B]">
            进入一间更轻的成长舱
          </h2>
          <p className="mt-5 max-w-[360px] text-sm leading-7 text-[#6F6E72]">
            登录入口保留清楚的角色边界，视觉上用柔和玻璃层级替代传统后台卡片。
          </p>
        </div>
        <div className="flex h-13 w-13 items-center justify-center rounded-[18px] border border-white/60 bg-white/50 text-[#5723EC] shadow-[0_14px_34px_rgba(87,35,236,0.16)] backdrop-blur">
          <LockKeyhole className="h-5 w-5" />
        </div>
      </div>

      <div className="mt-8 grid gap-3">
        {roles.map(([role, detail, Icon], index) => (
          <button
            key={role}
            className={cn(
              "group flex items-center justify-between rounded-[18px] border px-4 py-4 text-left transition duration-200 hover:-translate-y-0.5",
              index === 2
                ? "border-[#5723EC]/20 bg-[#5723EC]/10 shadow-[0_16px_44px_rgba(87,35,236,0.13)]"
                : "border-white/45 bg-white/38 hover:bg-white/58",
            )}
          >
            <span className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-[14px] bg-white/58 text-[#4731A3] ring-1 ring-white/60">
                <Icon className="h-4 w-4" />
              </span>
              <span>
                <strong className="block text-sm text-[#1D0C3B]">{role}</strong>
                <span className="mt-1 block text-xs font-semibold text-[#6F6E72]">{detail}</span>
              </span>
            </span>
            <ChevronRight className="h-4 w-4 text-[#C1B5C2] transition group-hover:translate-x-0.5 group-hover:text-[#5723EC]" />
          </button>
        ))}
      </div>

      <div className="mt-8 rounded-[22px] border border-white/45 bg-white/45 p-5 backdrop-blur">
        <p className="text-xs font-black uppercase tracking-[0.1em] text-[#4731A3]">After Login</p>
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          {["成长任务", "导师反馈", "HR 协同"].map((item) => (
            <div key={item} className="rounded-[16px] bg-white/45 px-3 py-4 text-center text-xs font-black text-[#1D0C3B] ring-1 ring-white/50">
              {item}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function HrDashboardPreview() {
  return (
    <section className={cn(glassCard, "overflow-hidden p-7")}>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.12em] text-[#4731A3]">HR Dashboard</p>
          <h2 className="mt-3 text-3xl font-black tracking-[-0.03em] text-[#1D0C3B]">批次成长看板</h2>
          <p className="mt-2 max-w-xl text-sm leading-7 text-[#6F6E72]">用轻透明数据层表达“可观察”，不让界面变成厚重后台。</p>
        </div>
        <PreviewButton>
          <Sparkles className="h-4 w-4" />
          生成摘要
        </PreviewButton>
      </div>

      <div className="mt-7 grid gap-4 md:grid-cols-4">
        <MetricGlass label="实习生" value="28" detail="当前批次" />
        <MetricGlass label="平均进度" value="76%" detail="较上周 +8%" tone="mint" />
        <MetricGlass label="需支持" value="4" detail="进入 HR 队列" tone="coral" />
        <MetricGlass label="反馈完成" value="82%" detail="导师已同步" />
      </div>

      <div className="mt-6 rounded-[22px] border border-white/45 bg-white/48 p-4 backdrop-blur">
        <div className="grid grid-cols-[1.15fr_0.8fr_0.8fr_1fr] gap-3 border-b border-[#C1B5C2]/25 pb-3 text-xs font-black uppercase tracking-[0.08em] text-[#6F6E72]">
          <span>姓名</span>
          <span>岗位</span>
          <span>进度</span>
          <span>状态</span>
        </div>
        {[
          ["林知夏", "产品", 86, "稳定推进", "growth"],
          ["周景行", "研发", 64, "需要支持", "ai"],
          ["许亦辰", "销售", 42, "重点关注", "risk"],
        ].map(([name, role, progress, status, tone]) => (
          <div key={name as string} className="grid grid-cols-[1.15fr_0.8fr_0.8fr_1fr] items-center gap-3 rounded-[16px] px-2 py-3 text-sm transition hover:bg-white/45">
            <strong className="text-[#1D0C3B]">{name}</strong>
            <span className="text-[#6F6E72]">{role}</span>
            <span className="font-black text-[#4731A3]">{progress}%</span>
            <PreviewBadge tone={tone as "risk" | "growth" | "ai"}>{status}</PreviewBadge>
          </div>
        ))}
      </div>
    </section>
  );
}

function StudentCardPreview() {
  return (
    <section className={cn(glassCard, "p-6")}>
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.12em] text-[#4731A3]">Student Card</p>
          <h3 className="mt-3 text-2xl font-black tracking-[-0.02em] text-[#1D0C3B]">今日成长节点</h3>
        </div>
        <PreviewBadge tone="growth">第 3 周</PreviewBadge>
      </div>
      <div className="mt-6 rounded-[20px] border border-white/45 bg-white/42 p-5">
        <div className="flex items-center justify-between text-sm font-bold text-[#1D0C3B]">
          <span>任务完成度</span>
          <span>72%</span>
        </div>
        <div className="mt-3"><ProgressLine value={72} /></div>
        <div className="mt-5 grid gap-3">
          {["完成竞品分析摘要", "向导师确认评审标准", "整理本周复盘"].map((task, index) => (
            <div key={task} className="flex items-center gap-3 rounded-[16px] bg-white/42 px-3 py-3 text-sm font-semibold text-[#1D0C3B] ring-1 ring-white/45">
              <CheckCircle2 className={cn("h-4 w-4", index === 0 ? "text-[#31B88A]" : "text-[#C1B5C2]")} />
              {task}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function MentorGeneratorPreview() {
  return (
    <section className={cn(glassCard, "p-6")}>
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.12em] text-[#4731A3]">Mentor AI</p>
          <h3 className="mt-3 text-2xl font-black tracking-[-0.02em] text-[#1D0C3B]">结构化反馈生成器</h3>
        </div>
        <SquarePen className="h-5 w-5 text-[#5723EC]" />
      </div>
      <div className="mt-5 rounded-[18px] border border-white/45 bg-white/40 p-4">
        <label className="text-xs font-black uppercase tracking-[0.08em] text-[#6F6E72]">导师观察</label>
        <p className="mt-3 text-sm leading-7 text-[#1D0C3B]">任务拆解能力提升明显，但需求评审前仍需要补足业务指标判断。</p>
      </div>
      <div className="mt-4 flex flex-wrap gap-3">
        <PreviewButton>
          <Sparkles className="h-4 w-4" />
          AI 生成反馈
        </PreviewButton>
        <PreviewButton variant="secondary">保存草稿</PreviewButton>
      </div>
    </section>
  );
}

function RiskInsightPreview() {
  return (
    <section className={cn(glassCard, "relative overflow-hidden p-6")}>
      <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-[#5723EC] via-[#C1B5C2] to-[#C25055]" />
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.12em] text-[#4731A3]">AI Risk Insight</p>
          <h3 className="mt-3 text-2xl font-black tracking-[-0.02em] text-[#1D0C3B]">需关注分析卡</h3>
        </div>
        <PreviewBadge tone="risk">重点关注</PreviewBadge>
      </div>
      <div className="mt-5 grid gap-3">
        {[
          ["任务完成度", "42%", "低于同岗均值"],
          ["导师反馈", "业务指标理解不足", "需补充辅导"],
          ["建议动作", "HRBP 同步导师", "一周后复盘"],
        ].map(([label, value, detail]) => (
          <div key={label} className="rounded-[17px] border border-white/45 bg-white/42 px-4 py-3">
            <div className="flex items-center justify-between gap-3">
              <span className="text-xs font-black uppercase tracking-[0.08em] text-[#6F6E72]">{label}</span>
              <strong className="text-sm text-[#1D0C3B]">{value}</strong>
            </div>
            <p className="mt-1 text-xs font-semibold text-[#C25055]">{detail}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

function ComponentSpecPreview() {
  return (
    <section className={cn(glassCard, "p-7")}>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.12em] text-[#4731A3]">Component System</p>
          <h2 className="mt-3 text-3xl font-black tracking-[-0.03em] text-[#1D0C3B]">组件规范片段</h2>
        </div>
        <div className="flex gap-3">
          <PreviewButton>主按钮</PreviewButton>
          <PreviewButton variant="secondary">次按钮</PreviewButton>
        </div>
      </div>
      <div className="mt-7 grid gap-5 lg:grid-cols-[0.9fr_1.1fr]">
        <div className="grid gap-3">
          <input className="h-12 rounded-[16px] border border-white/50 bg-white/45 px-4 text-sm font-semibold text-[#1D0C3B] outline-none backdrop-blur placeholder:text-[#6F6E72] focus:ring-4 focus:ring-[#5723EC]/10" placeholder="搜索实习生、任务或反馈" />
          <div className="flex flex-wrap gap-2">
            <PreviewBadge tone="ai">AI 生成中</PreviewBadge>
            <PreviewBadge tone="growth">已完成</PreviewBadge>
            <PreviewBadge tone="risk">需复盘</PreviewBadge>
          </div>
          <div className={cn(quietGlass, "p-5")}>
            <div className="flex items-center gap-3">
              <Bot className="h-5 w-5 text-[#5723EC]" />
              <strong className="text-[#1D0C3B]">AI Insight 卡片</strong>
            </div>
            <p className="mt-3 text-sm leading-7 text-[#6F6E72]">把分散任务、导师反馈和风险信号转成可执行下一步。</p>
          </div>
        </div>
        <div className={cn(quietGlass, "p-5")}>
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.08em] text-[#6F6E72]">Weekly Report</p>
              <h3 className="mt-2 text-xl font-black text-[#1D0C3B]">适岗周报生成卡</h3>
            </div>
            <FileText className="h-5 w-5 text-[#4731A3]" />
          </div>
          <p className="mt-4 text-sm leading-7 text-[#6F6E72]">生成适合 HRBP、导师和招聘复盘共用的批次摘要。</p>
          <div className="mt-5 flex flex-wrap gap-3">
            <PreviewButton>
              <Copy className="h-4 w-4" />
              复制周报
            </PreviewButton>
            <PreviewButton variant="secondary">
              <Send className="h-4 w-4" />
              同步导师
            </PreviewButton>
          </div>
        </div>
      </div>
    </section>
  );
}

function PalettePreview() {
  return (
    <section className={cn(glassCard, "p-7")}>
      <p className="text-xs font-black uppercase tracking-[0.12em] text-[#4731A3]">Palette</p>
      <h2 className="mt-3 text-3xl font-black tracking-[-0.03em] text-[#1D0C3B]">半透明主题色板</h2>
      <div className="mt-6 grid gap-3 sm:grid-cols-3 lg:grid-cols-9">
        {colors.map(([name, hex]) => (
          <div key={hex} className="rounded-[18px] border border-white/45 bg-white/38 p-3 backdrop-blur">
            <div className="h-14 rounded-[14px] ring-1 ring-white/50" style={{ backgroundColor: hex }} />
            <p className="mt-3 text-xs font-black text-[#1D0C3B]">{name}</p>
            <p className="mt-1 text-[11px] font-bold text-[#6F6E72]">{hex}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

export default function ThemePreviewPage() {
  return (
    <main className="theme-preview relative min-h-screen overflow-hidden px-5 py-6 text-[#1D0C3B] sm:px-8 lg:px-10">
      <div className="theme-orb theme-orb-a" />
      <div className="theme-orb theme-orb-b" />
      <div className="theme-orb theme-orb-c" />

      <header className="mx-auto flex max-w-[1440px] flex-col gap-5 rounded-[26px] border border-white/45 bg-white/38 px-5 py-5 shadow-[0_18px_60px_rgba(29,12,59,0.08)] backdrop-blur-[18px] lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.16em] text-[#4731A3]">半透明主题预览</p>
          <h1 className="mt-3 text-4xl font-black leading-[1.02] tracking-[-0.04em] text-[#1D0C3B] lg:text-6xl">
            GrowNest 鹅苗成长舱
          </h1>
          <p className="mt-4 max-w-3xl text-base leading-8 text-[#6F6E72]">
            让实习生成长可见，让导师带教有序，让 HR 协同更轻。
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <PreviewButton>
            <Sparkles className="h-4 w-4" />
            Glass Theme
          </PreviewButton>
          <PreviewButton variant="secondary">只作视觉预览</PreviewButton>
        </div>
      </header>

      <div className="mx-auto mt-6 grid max-w-[1440px] gap-6 xl:grid-cols-[0.88fr_1.12fr]">
        <LoginPreview />
        <HrDashboardPreview />
      </div>

      <div className="mx-auto mt-6 grid max-w-[1440px] gap-6 lg:grid-cols-3">
        <StudentCardPreview />
        <MentorGeneratorPreview />
        <RiskInsightPreview />
      </div>

      <div className="mx-auto mt-6 grid max-w-[1440px] gap-6">
        <ComponentSpecPreview />
        <PalettePreview />
      </div>

      <footer className="mx-auto max-w-[1440px] px-2 py-8 text-center text-xs font-bold text-[#6F6E72]">
        Preview only · 不影响现有登录、角色权限、CRUD 与 localStorage
      </footer>
    </main>
  );
}
