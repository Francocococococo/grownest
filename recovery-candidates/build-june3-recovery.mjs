import fs from "node:fs";
import path from "node:path";

const root = "/Users/sunkong/Desktop/夏令营/internflow-demo";
const candidates = path.join(root, "recovery-candidates");
const source = path.join(candidates, "2026-06-03T10-48-20-019e8b61-c174-71e1-9875-951301407762.clean.App.tsx");
const output = path.join(candidates, "june3-afternoon-restored.App.tsx");

let text = fs.readFileSync(source, "utf8");
const helperBlock = text.match(/function StatCard\(\{[\s\S]*?\n(?=function StudentDashboard)/)?.[0] ?? "";

const animationGap = `                color: active ? "#4A415D" : "#6F6A7A",
                overwrite: "auto",
              };
              const description = node.querySelector("[data-workflow-description]");
              if (immediate) gsap.set(description, descriptionVars);
              else gsap.to(description, { ...descriptionVars, duration: 0.24 });
            });

            actionLoopItems.forEach((item, index) => {
              const active = index === activeIndex;
              const accent = index === 0 ? "#32B889" : index === 1 ? "#C9922E" : "#4B32C3";
              const itemVars: gsap.TweenVars = {
                y: active ? -7 : 0,
                scale: active ? 1.012 : 1,
                autoAlpha: active ? 1 : 0.72,
                borderColor: active ? \`\${accent}55\` : "rgba(80,70,120,0.10)",
                backgroundColor: active ? "rgba(255,255,255,0.84)" : "rgba(255,255,255,0.58)",
                boxShadow: active ? "0 24px 64px rgba(36,26,72,0.10)" : "0 12px 34px rgba(36,26,72,0.05)",
                overwrite: "auto",
              };
              if (immediate) gsap.set(item, itemVars);
              else gsap.to(item, { ...itemVars, duration: 0.38 });
              const iconVars: gsap.TweenVars = {
                scale: active ? 1.08 : 1,
                color: active ? accent : "#6F6A7A",
                overwrite: "auto",
              };
              if (immediate) gsap.set(actionLoopIcons[index], iconVars);
              else gsap.to(actionLoopIcons[index], { ...iconVars, duration: 0.28 });
            });

            if (actionLoopBar) {
              const barVars: gsap.TweenVars = {
                scaleX: activeIndex === 0 ? 0.34 : activeIndex === 1 ? 0.67 : 1,
                transformOrigin: "left center",
                overwrite: "auto",
              };
              if (immediate) gsap.set(actionLoopBar, barVars);
              else gsap.to(actionLoopBar, { ...barVars, duration: 0.42, ease: "power2.out" });
            }
          };

          setActiveWorkflow(0, true);

          const capTl = gsap.timeline({ defaults: { ease: "power3.out" } });
          capTl
            .from("[data-capability-kicker]", { autoAlpha: 0, y: 16, duration: 0.38 })
            .from("[data-capability-title]", { autoAlpha: 0, y: 22, duration: 0.48 }, "-=0.2")
            .from("[data-capability-summary]", { autoAlpha: 0, y: 18, duration: 0.42 }, "-=0.24")
            .from("[data-workflow-node]", { autoAlpha: 0, y: 20, scale: 0.96, stagger: 0.09, duration: 0.42 }, "-=0.12")
            .from("[data-action-loop-step]", { autoAlpha: 0, y: 18, stagger: 0.08, duration: 0.38 }, "-=0.26")
            .from("[data-capability-card]", { autoAlpha: 0, y: 42, scale: 0.95, stagger: 0.14, duration: 0.58 }, "-=0.18")
            .from("[data-capability-visual]", { autoAlpha: 0, y: 14, stagger: 0.08, duration: 0.34 }, "-=0.36")
            .from("[data-capability-line]", { scaleX: 0, transformOrigin: "left center", stagger: 0.1, duration: 0.55 }, "-=0.28")
            .from("[data-capability-chip]", { autoAlpha: 0, y: 8, stagger: 0.035, duration: 0.24 }, "-=0.26");

          stageLoop?.kill();
          stageLoop = gsap.timeline({ repeat: -1, repeatDelay: 0.22, delay: 0.6 });
          [0, 1, 2].forEach((index) => {
            stageLoop?.call(() => {
              activateStage(index);
              setActiveWorkflow(index);
            }).to({}, { duration: 1.45 });
          });
          if (actionLoopScan) {
            gsap.to(actionLoopScan, { xPercent: 118, duration: 2.8, ease: "none", repeat: -1, delay: 0.6 });
          }
        };

        const capabilityCleanups = stageCardCleanups;
        let capabilityPlayed = false;
        let observer: IntersectionObserver | null = null;
        observer = capabilitySection
          ? new IntersectionObserver(
              ([entry]) => {
                if (!capabilityPlayed && entry.isIntersecting) {
                  capabilityPlayed = true;
                  playCapability();
                  observer?.disconnect();
                }
              },
              { threshold: 0.24 },
            )
          : null;`;

const requestBlock = `async function requestAiGeneration<T>(type: AIGenerationType, payload: unknown): Promise<AIGenerationResult<T>> {
  const apiBase = import.meta.env.DEV ? (import.meta.env.VITE_API_BASE ?? "http://127.0.0.1:3001") : "";
  const response = await fetch(\`\${apiBase}/api/generate\`, {
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
}`;

const homeBlock = `function MeasuredChart({
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

function HomePage({ onNavigate }: { onNavigate: (path: Path) => void }) {
  const homeRef = useRef<HTMLElement | null>(null);
  useHomeHeroAnimation(homeRef);

  const roleCards = [
    {
      id: "student",
      label: "Student",
      title: "成长路径",
      body: "30-60-90 天成长轨道",
      detail: "明确本周任务与下一步行动",
      accent: "#32B889",
      icon: GraduationCap,
      className: "left-[2%] top-[3%]",
      depth: 1.15,
    },
    {
      id: "mentor",
      label: "Mentor",
      title: "导师反馈",
      body: "AI 结构化带教反馈",
      detail: "把经验带教变成标准动作",
      accent: "#C9922E",
      icon: MessageSquareText,
      className: "right-[2%] top-[3%]",
      depth: 1.35,
    },
    {
      id: "hr",
      label: "HR",
      title: "风险洞察",
      body: "适岗风险识别与跟进建议",
      detail: "提前发现需要关注的人",
      accent: "#4B32C3",
      icon: LayoutDashboard,
      className: "bottom-[3%] right-[2%]",
      depth: 1.55,
    },
  ];

  const productModules = [
    {
      title: "实习生成长路径",
      detail: "把阶段目标、任务推进和导师反馈沉淀成清晰的个人成长轨迹。",
      accent: "#32B889",
      chips: ["阶段目标", "本周任务", "导师提问"],
      flow: ["目标拆解", "任务推进", "问题沉淀"],
      summary: "个人成长输入",
      icon: GraduationCap,
      workbenchTitle: "实习生成长工作台",
      workbenchMeta: "当前第 3 周 · 任务确认",
      workbenchItems: ["确认本周阶段目标", "整理 2 个导师提问", "完成业务资料复盘"],
    },
    {
      title: "导师反馈工作流",
      detail: "把分散观察整理为结构化反馈，让带教动作稳定、可复用。",
      accent: "#C9922E",
      chips: ["观察记录", "反馈草稿", "同步确认"],
      flow: ["观察记录", "AI 整理", "反馈确认"],
      summary: "带教动作加工",
      icon: MessageSquareText,
      workbenchTitle: "导师反馈工作台",
      workbenchMeta: "本周待反馈 · 结构化生成",
      workbenchItems: ["整理带教观察", "生成反馈草稿", "确认后同步实习生"],
    },
    {
      title: "HR 风险洞察",
      detail: "聚合任务、反馈和协同记录，提前识别需要支持的对象。",
      accent: "#4B32C3",
      chips: ["关注信号", "风险原因", "跟进行动"],
      flow: ["信号聚合", "风险判断", "行动同步"],
      summary: "组织跟进输出",
      icon: ShieldCheck,
      workbenchTitle: "HR 风险洞察台",
      workbenchMeta: "关注队列 · 自动生成行动",
      workbenchItems: ["风险原因：反馈缺失 1 次", "建议动作：同步导师跟进", "复盘节点：下周三前确认"],
    },
  ];

  return (
    <main ref={homeRef} className="home-shell relative min-h-screen overflow-hidden bg-[#F6F4FA] text-[#171321]">
      <div className="home-ambient home-ambient-a" data-home-glow="" />
      <div className="home-ambient home-ambient-b" />

      <nav className="relative z-20 mx-auto flex max-w-7xl items-center justify-between gap-5 px-5 py-5" data-home-nav="">
        <BrandLogo />
        <div className="hidden items-center gap-7 rounded-full border border-[#504678]/10 bg-white/48 px-5 py-2 text-sm font-medium text-[#6F6A7A] backdrop-blur md:flex">
          <a href="#intro" className="transition hover:text-[#171321]">产品介绍</a>
          <a href="#capability" className="transition hover:text-[#171321]">核心能力</a>
          <a href="#design" className="transition hover:text-[#171321]">设计理念</a>
        </div>
        <button
          type="button"
          onClick={() => onNavigate("/login")}
          className="rounded-[12px] bg-[#241A48] px-4 py-2.5 text-sm font-semibold text-white shadow-[0_14px_34px_rgba(36,26,72,0.18)] transition hover:bg-[#4B32C3]"
        >
          登录
        </button>
      </nav>

      <section id="intro" className="relative z-10 mx-auto grid min-h-[calc(100vh-82px)] max-w-7xl items-center gap-10 px-5 pb-20 pt-8 lg:grid-cols-[0.88fr_1.12fr]">
        <div className="max-w-3xl">
          <p className="text-sm font-semibold text-[#4B32C3]" data-home-copy="">AI-powered Internship Growth & Mentorship System</p>
          <h1 className="mt-5 text-[clamp(3rem,7vw,7.2rem)] font-semibold leading-[0.94] tracking-[0] text-[#171321]" data-home-title="">
            GrowNest 鹅苗成长舱
          </h1>
          <p className="mt-7 max-w-xl text-lg leading-8 text-[#6F6A7A]" data-home-copy="">
            面向实习生、导师与 HR 的 AI 成长协同系统。
          </p>
          <p className="mt-4 max-w-2xl text-2xl font-semibold leading-snug text-[#241A48]" data-home-copy="">
            让实习生成长可见，让导师带教有序，让 HR 协同更轻。
          </p>
          <div className="mt-9 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => onNavigate("/login")}
              className="inline-flex items-center gap-2 rounded-[14px] bg-[#4B32C3] px-5 py-3 text-sm font-semibold text-white shadow-[0_18px_44px_rgba(75,50,195,0.18)] transition hover:bg-[#241A48]"
              data-home-cta=""
            >
              进入系统
              <ChevronRight className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => document.getElementById("capability")?.scrollIntoView({ behavior: "smooth" })}
              className="rounded-[14px] border border-[#504678]/12 bg-white/54 px-5 py-3 text-sm font-semibold text-[#241A48] backdrop-blur transition hover:bg-white/82"
              data-home-cta=""
            >
              查看产品设计
            </button>
          </div>
        </div>

        <div className="relative min-h-[620px] lg:min-h-[700px]" data-home-reveal="">
          <div className="absolute inset-0" data-home-stage="">
            <svg className="pointer-events-none absolute inset-0 z-10 h-full w-full" viewBox="0 0 760 680" fill="none" aria-hidden="true">
              <path data-home-path="student" d="M132 302 C220 254 262 284 330 340" stroke="rgba(75,50,195,0.32)" strokeWidth="1.4" strokeLinecap="round" />
              <path data-home-path="mentor" d="M604 172 C522 218 484 250 438 330" stroke="rgba(75,50,195,0.32)" strokeWidth="1.4" strokeLinecap="round" />
              <path data-home-path="hr" d="M575 512 C520 476 506 434 468 378" stroke="rgba(75,50,195,0.32)" strokeWidth="1.4" strokeLinecap="round" />
              <path data-home-path="insight" d="M468 348 C544 338 590 350 640 392" stroke="rgba(75,50,195,0.3)" strokeWidth="1.4" strokeLinecap="round" />
            </svg>

            <div className="absolute left-1/2 top-1/2 z-0 h-[560px] w-[560px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-[#504678]/10" />
            <div className="absolute left-1/2 top-1/2 z-0 h-[390px] w-[390px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-[#504678]/10" />

            <div className="home-product-shell absolute left-1/2 top-1/2 z-20 w-[min(70vw,340px)] -translate-x-1/2 -translate-y-1/2 rounded-[28px] border border-[#504678]/12 bg-white/68 p-4 shadow-[0_28px_84px_rgba(36,26,72,0.10)] backdrop-blur-[22px]">
              <div className="flex items-center justify-between border-b border-[#504678]/10 pb-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-[#4B32C3]">Collaboration Layer</p>
                  <p className="mt-1 text-lg font-semibold text-[#171321]">三端成长协同引擎</p>
                </div>
                <BrainCircuit className="h-7 w-7 text-[#4B32C3]" />
              </div>
              <div className="mt-4 grid gap-2.5">
                {[
                  ["01", "成长路径", "实习生确认阶段任务", "#32B889"],
                  ["02", "反馈生成", "导师沉淀结构化建议", "#C9922E"],
                  ["03", "风险同步", "HR 获取跟进行动", "#4B32C3"],
                ].map(([step, label, detail, color]) => (
                  <div key={label} className="rounded-[16px] border border-[#504678]/10 bg-white/58 p-2.5" data-home-screen-row="">
                    <div className="flex items-start gap-3">
                      <span className="mt-0.5 rounded-full px-2 py-1 text-[10px] font-semibold text-white" style={{ backgroundColor: color }}>
                        {step}
                      </span>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-[#171321]">{label}</p>
                        <p className="mt-1 text-[11px] leading-5 text-[#6F6A7A]">{detail}</p>
                      </div>
                    </div>
                    <div className="mt-3 flex items-center gap-1.5">
                      {[0, 1, 2, 3].map((index) => (
                        <span
                          key={index}
                          className="h-1.5 flex-1 rounded-full"
                          style={{ backgroundColor: index < Number(step) + 1 ? color : "rgba(80,70,120,0.10)" }}
                        />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {roleCards.map(({ id, label, title, body, detail, accent, icon: Icon, className, depth }) => (
              <div
                key={id}
                className={cn("home-role-card absolute z-30 w-[200px] rounded-[22px] border border-[#504678]/12 bg-white/68 p-3.5 shadow-[0_22px_60px_rgba(36,26,72,0.08)] backdrop-blur-[18px]", className)}
                data-home-card={id}
                data-depth={depth}
                data-accent={accent}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold" style={{ color: accent }}>{label}</p>
                    <p className="mt-2 text-lg font-semibold text-[#171321]">{title}</p>
                  </div>
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[14px] bg-white/70 ring-1 ring-[#504678]/10">
                    <Icon className="h-5 w-5" style={{ color: accent }} />
                  </div>
                </div>
                <p className="mt-3 text-sm font-medium text-[#241A48]">{body}</p>
                <p className="mt-2 text-xs leading-5 text-[#6F6A7A]">{detail}</p>
              </div>
            ))}

            <div className="home-insight-panel absolute bottom-[-1%] left-[-3%] z-40 w-[220px] rounded-[22px] border border-[#504678]/12 bg-white/72 p-3.5 shadow-[0_22px_60px_rgba(36,26,72,0.08)] backdrop-blur-[18px]" data-home-insight-panel="">
              <div className="mb-4 flex items-center justify-between">
                <p className="text-sm font-semibold text-[#171321]">AI Insight</p>
                <Sparkles className="h-4 w-4 text-[#4B32C3]" data-home-insight-icon="" />
              </div>
              {["识别成长阻塞点", "生成导师反馈建议", "同步 HR 跟进行动"].map((item) => (
                <div key={item} className="mb-2 rounded-[12px] border border-[#504678]/10 bg-[#F6F4FA]/76 px-3 py-2 text-xs font-medium text-[#241A48]" data-home-insight="">
                  {item}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section id="capability" className="capability-section relative z-30 px-5 pt-14 pb-24" data-capability-section="">
        <div className="mx-auto max-w-7xl">
          <div className="mb-8 grid gap-6 lg:grid-cols-[0.92fr_1.08fr] lg:items-end">
            <div>
              <p className="text-sm font-semibold text-[#4B32C3]" data-capability-kicker="">Core Capability</p>
              <h2 className="mt-3 max-w-2xl text-3xl font-semibold leading-tight text-[#171321] md:text-[3.2rem]" data-capability-title="">
                三个角色，不是三套系统，而是一条成长协同链路。
              </h2>
            </div>
            <div className="capability-summary rounded-[24px] border border-[#504678]/10 bg-white/54 p-5 backdrop-blur-[18px]" data-capability-summary="">
              <p className="text-sm leading-7 text-[#6F6A7A]">
                从个人成长任务，到导师反馈，再到 HR 跟进行动，信息在同一条产品逻辑里流转。
              </p>
              <div className="mt-4 grid grid-cols-3 gap-2 text-center text-xs font-semibold text-[#241A48]">
                {["Student", "Mentor", "HRBP"].map((item) => (
                  <span key={item} className="rounded-[12px] border border-[#504678]/10 bg-white/58 px-2 py-2">{item}</span>
                ))}
              </div>
            </div>
          </div>

          <div className="capability-workbench grid gap-5 rounded-[28px] border border-[#4E4965]/10 bg-[#FFFFFF]/48 p-4 shadow-[0_24px_70px_rgba(36,26,72,0.06)] backdrop-blur-[20px] lg:grid-cols-[0.38fr_0.62fr]">
            <div className="grid gap-3">
              {productModules.map(({ title, detail, accent, chips, icon: Icon }, index) => (
                <div key={title} className="capability-card relative overflow-hidden rounded-[22px] border border-[#4E4965]/10 bg-[#FFFFFF]/62 p-4 shadow-[0_18px_52px_rgba(36,26,72,0.055)] backdrop-blur-[18px]" data-capability-card="" data-home-showcase-card="" data-accent={accent}>
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
                    {chips.map((chip, chipIndex) => (
                      <span key={chip} className="rounded-full border border-[#4E4965]/10 bg-[#F8F7FB]/72 px-3 py-1.5 text-[11px] font-medium text-[#2D2544]" data-capability-chip="">
                        <span className="mr-1.5 inline-block h-1.5 w-1.5 rounded-full" style={{ backgroundColor: chipIndex === 0 ? accent : "rgba(80,70,120,0.22)" }} />
                        {chip}
                      </span>
                    ))}
                  </div>
                  <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-[#4E4965]/10">
                    <div className="h-full rounded-full" style={{ backgroundColor: accent }} data-capability-line="" />
                  </div>
                </div>
              ))}
            </div>

            <div className="capability-console relative min-h-[520px] overflow-hidden rounded-[24px] border border-[#4E4965]/10 bg-[#F8F7FB]/76 p-5">
              <div className="mb-5 flex items-center justify-between border-b border-[#4E4965]/10 pb-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-[#5E4CB2]">Simulated Workbench</p>
                  <p className="mt-1 text-lg font-semibold text-[#171321]">成长协同模拟工作台</p>
                </div>
                <Bot className="h-6 w-6 text-[#5E4CB2]" />
              </div>

              {productModules.map(({ workbenchTitle, workbenchMeta, workbenchItems, accent, flow }, index) => (
                <div key={workbenchTitle} className="absolute inset-x-5 top-[92px]" data-workbench-panel="" style={{ opacity: index === 0 ? 1 : 0, visibility: index === 0 ? "visible" : "hidden" }}>
                  <div className="rounded-[22px] border border-[#504678]/10 bg-white/72 p-5 shadow-[0_18px_54px_rgba(36,26,72,0.06)]">
                    <div className="flex items-start justify-between gap-4" data-workbench-item="">
                      <div>
                        <p className="text-sm font-semibold" style={{ color: accent }}>{workbenchMeta}</p>
                        <h3 className="mt-2 text-2xl font-semibold text-[#171321]">{workbenchTitle}</h3>
                      </div>
                      <span className="rounded-full px-3 py-1.5 text-xs font-semibold text-white" style={{ backgroundColor: accent }}>Active</span>
                    </div>
                    <div className="mt-5 grid gap-3">
                      {workbenchItems.map((item) => (
                        <div key={item} className="rounded-[16px] border border-[#504678]/10 bg-[#F6F4FA]/72 px-4 py-3 text-sm font-medium text-[#241A48]" data-workbench-item="">
                          {item}
                        </div>
                      ))}
                    </div>
                    <div className="mt-5 grid grid-cols-3 gap-3" data-workbench-item="">
                      {flow.map((step, flowIndex) => (
                        <div key={step} className="rounded-[15px] bg-white/72 p-3 text-center" data-capability-visual-step="">
                          <span className="mx-auto block h-1.5 w-10 rounded-full" style={{ backgroundColor: flowIndex === 1 ? accent : "rgba(80,70,120,0.16)" }} />
                          <p className="mt-2 truncate text-[11px] font-semibold text-[#241A48]">{step}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div id="design" className="mt-8 rounded-[22px] border border-[#504678]/10 bg-white/48 p-5 text-sm leading-7 text-[#6F6A7A] backdrop-blur">
            设计理念：用克制的玻璃拟态、低饱和角色色和叙事型动效表达“三端协同”，而不是把首页做成登录页或后台数据堆叠。
          </div>
        </div>
      </section>
    </main>
  );
}`;

const layoutBlock = `function UserMenu({ user, onLogout, onResetDemo }: { user: AuthUser; onLogout: () => void; onResetDemo: () => void }) {
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
          results.push({ title: task.label, meta: \`\${task.status} · \${task.due}\`, type: "本周任务" });
        }
      });
      growthStages.forEach((stage) => {
        if (matches([stage.period, stage.theme])) {
          results.push({ title: stage.theme, meta: \`\${stage.title} · \${stage.period}\`, type: "成长路径" });
        }
        stage.tasks.forEach((task) => {
          if (matches([task.label, task.status, stage.theme])) {
            results.push({ title: task.label, meta: \`\${stage.period} · \${task.status}\`, type: "成长任务" });
          }
        });
      });
    }

    if (user.role === "mentor") {
      mentorInterns.forEach((intern) => {
        if (matches([intern.name, intern.title, intern.risk, intern.action, intern.detail, intern.focus, ...intern.weeklyRecord, ...intern.aiSignals])) {
          results.push({ title: \`\${intern.name}｜\${intern.title}\`, meta: \`\${intern.progress}% · \${intern.risk} · \${intern.action}\`, type: "负责实习生" });
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
          results.push({ title: \`\${intern.name}｜\${intern.role}\`, meta: \`\${intern.progress}% · \${attentionLabel[intern.risk]} · \${intern.processStatus}\`, type: "关注看板" });
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
                        key={\`\${result.type}-\${result.title}\`}
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
}`;

text = text.replace(/\/\* RECOVERY_GAP_LINE_761 \*\/[\s\S]*?\/\* RECOVERY_GAP_LINE_879 \*\//, animationGap);
text = text.replace(/async function requestAiGeneration<T>\(type: AIGenerationType, payload: unknown\): Promise<AIGenerationResult<T>> \{[\s\S]*?\n(?=function LogoMark)/, `${requestBlock}\n\n`);
text = text.replace(/function MeasuredChart\(\{[\s\S]*?\n(?=function LoginPage)/, `${homeBlock}\n\n`);
text = text.replace(/function UserMenu\(\{[\s\S]*?\n(?=function StudentDashboard)/, `${layoutBlock}\n\n${helperBlock}`);
text = text.replace('import { generateFallbackOutput, generateRiskAnalysis } from "./utils/ai";', 'import { generateRiskAnalysis } from "./utils/ai";');
text = text.replace('type ShowcaseRole = "student" | "mentor" | "hrbp";\n', "");

const remaining = text.match(/RECOVERY_GAP_LINE_/g)?.length ?? 0;
fs.writeFileSync(output, text);
console.log(JSON.stringify({ output, remaining, bytes: Buffer.byteLength(text) }, null, 2));
