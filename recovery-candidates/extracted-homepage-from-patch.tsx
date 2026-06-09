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
      className: "left-0 top-[28%] lg:-left-2",
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
      className: "right-0 top-[11%] lg:-right-2",
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
      className: "bottom-[8%] right-[8%]",
      depth: 1.55,
    },
  ];
  const productModules = [
    ["实习生成长路径", "把阶段目标、任务推进和导师反馈沉淀成清晰的个人成长轨迹。"],
    ["导师反馈工作流", "把分散观察整理为结构化反馈，让带教动作稳定、可复用。"],
    ["HR 风险洞察", "聚合任务、反馈和协同记录，提前识别需要支持的对象。"],
  ];

  return (
    <main ref={homeRef} className="home-shell relative min-h-screen overflow-hidden bg-[#F6F4FA] text-[#171321]">
      <div className="home-ambient home-ambient-a" data-home-glow="" />
      <div className="home-ambient home-ambient-b" />

      <nav className="relative z-20 mx-auto flex max-w-7xl items-center justify-between gap-<truncated omitted_approx_tokens="1752" />ttom-[18%] left-[7%] z-40 w-[280px] rounded-[22px] border border-[#504678]/12 bg-white/72 p-4 shadow-[0_22px_60px_rgba(36,26,72,0.08)] backdrop-blur-[18px]" data-home-insight-panel="">
              <div className="mb-4 flex items-center justify-between">
                <p className="text-sm font-semibold text-[#171321]">AI Insight</p>
                <Sparkles className="h-4 w-4 text-[#4B32C3]" />
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

      <section id="capability" className="relative z-10 mx-auto max-w-7xl px-5 pb-20">
        <div className="grid gap-4 md:grid-cols-3">
          {productModules.map(([title, detail], index) => (
            <div key={title} className="rounded-[20px] border border-[#504678]/10 bg-white/58 p-5 backdrop-blur" data-home-showcase-card="">
              <span className="text-xs font-semibold text-[#4B32C3]">0{index + 1}</span>
              <h2 className="mt-4 text-lg font-semibold text-[#171321]">{title}</h2>
              <p className="mt-3 text-sm leading-7 text-[#6F6A7A]">{detail}</p>
            </div>
          ))}
        </div>
        <div id="design" className="mt-8 rounded-[22px] border border-[#504678]/10 bg-white/48 p-5 text-sm leading-7 text-[#6F6A7A] backdrop-blur">
          设计理念：用克制的玻璃拟态、低饱和角色色和叙事型动效表达“三端协同”，而不是把首页做成登录页或后台数据堆叠。
        </div>
      </section>
    </main>
  );
}

function LoginPage({ onLogin }: { onLogin: (user: AuthUser) => void }) {
