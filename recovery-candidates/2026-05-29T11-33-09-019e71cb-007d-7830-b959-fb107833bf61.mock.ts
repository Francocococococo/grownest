export type RiskLevel = "低风险" | "中风险" | "高风险";
export type UserRole = "student" | "mentor" | "hr" | "recruiter";

export type MockUser = {
  username: string;
  password: string;
  role: UserRole;
  roleLabel: string;
  name: string;
  title?: string;
  department: string;
  mentor?: string;
  scope?: string;
  ownedInterns?: string[];
};

export type Intern = {
  name: string;
  role: string;
  week: string;
  progress: number;
  mentorFeedback: string;
  risk: RiskLevel;
  reason: string;
  todo: string;
  evidence: string[];
  evidenceMetrics: Array<{
    label: string;
    value: string;
    status: "normal" | "warning" | "danger";
  }>;
  possibleCause: string;
  hrAction: string;
  syncMentor: string;
  reviewReminder: string;
  confidence: number;
  riskTags: string[];
  processStatus: "待 HR 沟通" | "已同步导师" | "复盘中" | "已关闭";
  activityLog: string[];
};

export const mockUsers: MockUser[] = [
  {
    username: "student",
    password: "123456",
    role: "student",
    roleLabel: "实习生",
    name: "林小鹅",
    title: "产品运营实习生",
    department: "PCG / 产品部",
    mentor: "王老师",
  },
  {
    username: "mentor",
    password: "123456",
    role: "mentor",
    roleLabel: "导师",
    name: "王老师",
    department: "PCG / 产品部",
    ownedInterns: ["林小鹅", "赵晴", "吴念"],
  },
  {
    username: "hr",
    password: "123456",
    role: "hr",
    roleLabel: "HR",
    name: "张婧怡",
    department: "HRBP",
    scope: "游戏业务部实习生",
  },
  {
    username: "recruiter",
    password: "123456",
    role: "recruiter",
    roleLabel: "招聘",
    name: "Alice",
    title: "校招招聘负责人",
    department: "招聘中心",
    scope: "2026 夏令营实习生批次",
  },
];

export const studentWeeklyTasks = [
  { label: "完成竞品分析报告", status: "进行中", due: "本周三" },
  { label: "阅读产品 SOP", status: "已完成", due: "已完成" },
  { label: "参加需求评审会议", status: "未开始", due: "本周四" },
  { label: "向导师提交一次周反馈", status: "未开始", due: "本周五" },
];

export const mentorInterns = [
  {
    name: "林小鹅",
    title: "产品运营实习生",
    department: "PCG / 产品部",
    progress: 72,
    risk: "中风险" as RiskLevel,
    action: "待阶段反馈",
    detail: "执行稳定，业务理解需加强；建议补充 GMV、转化率、留存率等基础指标。",
    observationHint: "林小鹅执行力稳定，竞品分析和 SOP 阅读能按时推进，但主动提问较少，对 GMV、转化率、留存率等业务指标理解还不够深入。",
    focus: "业务指标理解",
    weeklyRecord: ["竞品分析进行中", "已完成产品 SOP 阅读", "需求评审会议待参加"],
    aiSignals: ["任务完成度 72%", "2 次打卡提到指标不清楚", "导师待补充阶段反馈"],
  },
  {
    name: "赵晴",
    title: "产品实习生",
    department: "PCG / 产品部",
    progress: 55,
    risk: "中风险" as RiskLevel,
    action: "待文档辅导",
    detail: "表达能力较好，但需求文档结构不稳定，需要导师提供模板和样例。",
    observationHint: "赵晴沟通表达比较清楚，也愿意主动同步进展，但需求文档产出偏慢，结构和优先级描述不够稳定，需要更多模板和样例辅导。",
    focus: "需求文档质量",
    weeklyRecord: ["需求说明草稿返工 1 次", "用户反馈整理完成度 60%", "需要补充 PRD 样例拆解"],
    aiSignals: ["成长进度 55%", "文档质量波动", "适合安排一次写作辅导"],
  },
  {
    name: "吴念",
    title: "产品实习生",
    department: "PCG / 产品部",
    progress: 91,
    risk: "低风险" as RiskLevel,
    action: "建议安排挑战任务",
    detail: "超额完成任务，业务敏感度好，适合安排独立小模块或更高挑战任务。",
    observationHint: "吴念本周超额完成任务，能主动补充竞品和用户反馈信息，业务敏感度较好，可以尝试承担一个边界清晰的小模块。",
    focus: "挑战任务安排",
    weeklyRecord: ["超额完成竞品分析", "主动补充 3 条用户反馈", "可进入小模块独立负责"],
    aiSignals: ["成长进度 91%", "低风险且反馈积极", "建议提高任务挑战度"],
  },
];

export const mentorRhythmTodos = [
  "与林小鹅完成一次 1v1 沟通",
  "给赵晴补充一次需求文档写作辅导",
  "为吴念安排更有挑战性的项目任务",
  "周五前完成阶段反馈",
];

export type GrowthStage = {
  title: string;
  period: string;
  theme: string;
  tasks: Array<{ label: string; status: "已完成" | "进行中" | "未开始" }>;
};

export const positionGrowthStages: Record<"产品" | "研发" | "销售" | "HR", GrowthStage[]> = {
  产品: [
  {
    title: "阶段一",
    period: "0-30 天",
    theme: "熟悉业务与工具",
    tasks: [
      { label: "完成部门介绍学习", status: "已完成" },
      { label: "阅读产品文档与业务 SOP", status: "已完成" },
      { label: "完成一次竞品分析", status: "进行中" },
      { label: "参加一次需求评审会议", status: "未开始" },
    ],
  },
  {
    title: "阶段二",
    period: "31-60 天",
    theme: "参与真实项目",
    tasks: [
      { label: "独立整理一次用户反馈", status: "未开始" },
      { label: "输出一份需求说明草稿", status: "未开始" },
      { label: "参与一次项目复盘", status: "未开始" },
      { label: "完成一次数据看板解读", status: "未开始" },
    ],
  },
  {
    title: "阶段三",
    period: "61-90 天",
    theme: "形成个人成果",
    tasks: [
      { label: "独立负责一个小模块", status: "未开始" },
      { label: "输出项目复盘报告", status: "未开始" },
      { label: "完成导师终期反馈", status: "未开始" },
      { label: "形成转正或留用建议参考", status: "未开始" },
    ],
  },
  ],
  研发: [
    {
      title: "阶段一",
      period: "0-30 天",
      theme: "环境搭建与代码理解",
      tasks: [
        { label: "完成开发环境与权限配置", status: "已完成" },
        { label: "阅读核心模块代码与接口文档", status: "进行中" },
        { label: "完成一次小型 Bug 修复", status: "未开始" },
        { label: "参加一次 Code Review", status: "未开始" },
      ],
    },
    {
      title: "阶段二",
      period: "31-60 天",
      theme: "参与真实需求开发",
      tasks: [
        { label: "拆解一个边界清晰的开发任务", status: "未开始" },
        { label: "提交一次可合并 Pull Request", status: "未开始" },
        { label: "补充单测或接口自测记录", status: "未开始" },
        { label: "完成一次技术方案复盘", status: "未开始" },
      ],
    },
    {
      title: "阶段三",
      period: "61-90 天",
      theme: "独立交付子模块",
      tasks: [
        { label: "独立负责一个小模块", status: "未开始" },
        { label: "输出技术总结或排障文档", status: "未开始" },
        { label: "完成导师终期代码评价", status: "未开始" },
        { label: "形成留用技术能力建议", status: "未开始" },
      ],
    },
  ],
  销售: [
    {
      title: "阶段一",
      period: "0-30 天",
      theme: "产品知识与客户画像",
      tasks: [
        { label: "完成产品卖点学习", status: "已完成" },
        { label: "梳理 3 类目标客户画像", status: "进行中" },
        { label: "观摩 2 次客户沟通", status: "未开始" },
        { label: "完成基础话术演练", status: "未开始" },
      ],
    },
    {
      title: "阶段二",
      period: "31-60 天",
      theme: "线索跟进与场景演练",
      tasks: [
        { label: "跟进一批低风险客户线索", status: "未开始" },
        { label: "输出客户异议处理清单", status: "未开始" },
        { label: "完成一次销售复盘", status: "未开始" },
        { label: "沉淀典型客户场景", status: "未开始" },
      ],
    },
    {
      title: "阶段三",
      period: "61-90 天",
      theme: "独立推进小型商机",
      tasks: [
        { label: "独立推进一个小型商机", status: "未开始" },
        { label: "完成客户跟进记录闭环", status: "未开始" },
        { label: "输出销售转化复盘", status: "未开始" },
        { label: "形成留用销售能力建议", status: "未开始" },
      ],
    },
  ],
  HR: [
    {
      title: "阶段一",
      period: "0-30 天",
      theme: "流程学习与候选人沟通",
      tasks: [
        { label: "熟悉招聘流程与系统", status: "已完成" },
        { label: "观摩候选人沟通", status: "已完成" },
        { label: "整理候选人跟进记录", status: "进行中" },
        { label: "参加一次面试复盘", status: "未开始" },
      ],
    },
    {
      title: "阶段二",
      period: "31-60 天",
      theme: "独立支持招聘项目",
      tasks: [
        { label: "独立维护一个岗位漏斗", status: "未开始" },
        { label: "输出候选人体验问题清单", status: "未开始" },
        { label: "参与一次 Offer 沟通", status: "未开始" },
        { label: "完成招聘数据周报", status: "未开始" },
      ],
    },
    {
      title: "阶段三",
      period: "61-90 天",
      theme: "形成项目复盘",
      tasks: [
        { label: "独立复盘一个招聘项目", status: "未开始" },
        { label: "提出流程优化建议", status: "未开始" },
        { label: "完成导师终期反馈", status: "未开始" },
        { label: "形成留用建议参考", status: "未开始" },
      ],
    },
  ],
};

export const growthStages = positionGrowthStages.产品;

export const mentorTodos = [
  "第 3 天：完成新人 Check-in",
  "第 14 天：完成阶段反馈",
  "第 30 天：完成成长评价",
  "每周五：更新一次实习生任务完成情况",
];

const internSeeds = [
  ["林小鹅", "产品", 72, "中风险", "执行稳定，业务理解需加强", "多次提到不清楚业务指标", "安排导师补充业务指标说明", "已同步导师", ["指标理解浅", "需要导师澄清"]],
  ["陈一鸣", "研发", 48, "高风险", "任务延期较多", "连续两周任务未完成，导师反馈适应慢", "HR 介入沟通", "待 HR 沟通", ["任务延期", "适应困难", "需 HR 介入"]],
  ["周可可", "销售", 61, "中风险", "沟通积极但业务知识薄弱", "客户场景理解不足", "安排业务知识训练", "复盘中", ["业务知识薄弱", "客户场景不足"]],
  ["王予安", "HR", 86, "低风险", "主动性强，学习快", "任务完成稳定，反馈积极", "无需介入", "已关闭", ["稳定适应", "可增加挑战"]],
  ["李想", "研发", 77, "低风险", "技术基础较好", "进度正常", "保持观察", "已关闭", ["进度正常"]],
  ["赵晴", "产品", 55, "中风险", "表达好但产出偏慢", "需求文档质量不稳定", "导师加强文档辅导", "已同步导师", ["文档质量不稳", "需要样例辅导"]],
  ["孙航", "销售", 39, "高风险", "适应困难", "打卡中多次表达压力大", "HR 约谈", "待 HR 沟通", ["压力表达", "支持不足", "需约谈"]],
  ["吴念", "产品", 91, "低风险", "表现突出", "超额完成任务", "安排挑战任务", "复盘中", ["表现突出", "适合挑战任务"]],
  ["许诺", "研发", 69, "中风险", "代码提交稳定但自测不足", "自测记录不完整", "补充测试清单", "复盘中", ["自测不足", "质量意识待加强"]],
  ["蒋晨", "销售", 82, "低风险", "客户沟通主动", "线索跟进稳定", "安排独立跟进", "已关闭", ["沟通主动", "适合加压"]],
  ["唐雨", "产品", 66, "中风险", "需求拆解还不稳定", "验收标准描述偏泛", "导师共创一次 PRD", "待 HR 沟通", ["需求边界不清", "需要模板"]],
  ["刘昊", "研发", 88, "低风险", "学习速度快", "能主动排查问题", "安排小模块开发", "已关闭", ["技术适应快"]],
  ["沈佳宁", "销售", 52, "中风险", "产品价值表达偏泛", "话术演练通过率偏低", "安排场景演练", "已同步导师", ["话术不稳", "产品理解浅"]],
  ["高远", "研发", 43, "高风险", "环境和任务拆解均滞后", "连续两次延期", "HR 与导师联合复盘", "待 HR 沟通", ["任务延期", "支持不足", "需拆解任务"]],
  ["罗曼", "HR", 79, "低风险", "流程执行稳定", "候选人记录完整", "保持观察", "已关闭", ["流程稳定"]],
  ["白芷", "产品", 84, "低风险", "用户理解较好", "能主动补充用户反馈", "安排小需求跟进", "复盘中", ["用户敏感度好"]],
  ["韩越", "销售", 73, "低风险", "学习投入度高", "客户记录质量稳定", "保持观察", "已关闭", ["记录完整", "投入度高"]],
  ["程栩", "研发", 58, "中风险", "代码理解速度偏慢", "核心模块理解不完整", "导师安排代码走读", "已同步导师", ["代码理解慢", "需要走读"]],
  ["姚瑶", "产品", 75, "低风险", "沟通表达清晰", "需求评审准备充分", "安排独立需求草稿", "已关闭", ["表达清晰", "进度正常"]],
  ["马骁", "销售", 64, "中风险", "客户分层判断不稳", "客户画像理解不足", "补充客户画像训练", "复盘中", ["客户画像不足"]],
] as const;

function createIntern(seed: typeof internSeeds[number]): Intern {
  const [name, role, progress, risk, mentorFeedback, reason, todo, processStatus, riskTags] = seed;
  const danger = risk === "高风险";
  const warning = risk === "中风险";
  const status = danger ? "danger" : warning ? "warning" : "normal";
  const syncMentor = danger ? "必须同步导师" : warning ? "需要同步导师" : "无需强制同步";
  const reviewReminder = danger ? "三天后复盘支持动作是否生效" : warning ? "下周检查改善动作完成情况" : "第 30 天阶段评价时复盘";

  return {
    name,
    role,
    week: "第3周",
    progress,
    mentorFeedback,
    risk,
    reason,
    todo,
    evidence: [
      `${role}岗任务完成度为 ${progress}%`,
      `导师反馈：${mentorFeedback}`,
      `近期信号：${reason}`,
    ],
    evidenceMetrics: [
      { label: "任务完成度", value: `${progress}%`, status },
      { label: "导师反馈", value: mentorFeedback, status },
      { label: "打卡信号", value: reason, status },
      { label: "沟通频率", value: danger ? "低于同岗均值" : warning ? "需要加强" : "稳定", status: danger ? "danger" : warning ? "warning" : "normal" },
    ],
    possibleCause: warning || danger ? "当前问题更像是早期适应和支持节奏不足，需要把任务拆小并增加导师反馈频率。" : "目前岗位匹配度较高，可以通过挑战任务继续验证成长上限。",
    hrAction: danger ? "建议 HR 尽快约谈，并同步导师把下周任务拆成更小的可执行动作。" : warning ? "建议 HR 推动导师补充一次针对性辅导，并设置一周后的复盘点。" : "保持观察，并鼓励导师给出更明确的阶段挑战任务。",
    syncMentor,
    reviewReminder,
    confidence: danger ? 92 : warning ? 80 : 86,
    riskTags: [...riskTags],
    processStatus,
    activityLog: [
      `今天 09:30 AI 标记为${risk}`,
      `${todo}，${reviewReminder}`,
    ],
  };
}

export const interns: Intern[] = internSeeds.map(createIntern);

function averageProgress(role: string) {
  const list = interns.filter((intern) => intern.role === role);
  return Math.round(list.reduce((sum, intern) => sum + intern.progress, 0) / list.length);
}

export const roleProgress = ["产品", "研发", "销售", "HR"].map((role) => ({
  role: `${role}岗`,
  progress: averageProgress(role),
}));

export const riskDistribution = [
  { name: "低风险", value: interns.filter((intern) => intern.risk === "低风险").length, color: "#16a34a" },
  { name: "中风险", value: interns.filter((intern) => intern.risk === "中风险").length, color: "#f59e0b" },
  { name: "高风险", value: interns.filter((intern) => intern.risk === "高风险").length, color: "#ef4444" },
];

export const recruiterSummary = {
  batch: "2026 夏令营实习生批次",
  retentionReady: interns.filter((intern) => intern.risk === "低风险" && intern.progress >= 75).length,
  watchList: interns.filter((intern) => intern.risk === "中风险").length,
  urgentRisk: interns.filter((intern) => intern.risk === "高风险").length,
  hiringSignal: "研发岗两极分化明显，产品岗整体适配较好，销售岗需要加强客户场景训练。",
};
