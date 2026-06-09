export type RiskLevel = "低风险" | "中风险" | "高风险";
export type UserRole = "student" | "mentor" | "hr" | "admin";

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
  mentor?: string;
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
    roleLabel: "实习生成长端",
    name: "林小鹅",
    title: "产品运营实习生",
    department: "PCG / 产品部",
    mentor: "王老师",
  },
  {
    username: "mentor",
    password: "123456",
    role: "mentor",
    roleLabel: "导师带教端",
    name: "王老师",
    department: "PCG / 产品部",
    ownedInterns: ["林小鹅", "王予安", "赵晴", "吴念", "唐雨", "罗曼", "白芷", "姚瑶"],
  },
  {
    username: "hr",
    password: "123456",
    role: "hr",
    roleLabel: "HRBP 成长运营台",
    name: "张婧怡",
    department: "HRBP",
    scope: "游戏业务部实习生",
  },
  {
    username: "admin",
    password: "123456",
    role: "admin",
    roleLabel: "系统管理后台",
    name: "系统管理员",
    title: "GrowNest Owner",
    department: "人才系统运营",
    scope: "全局配置与权限管理",
  },
];

export const studentWeeklyTasks = [
  { label: "完成竞品分析报告", status: "未完成", due: "本周三" },
  { label: "阅读产品 SOP", status: "未完成", due: "本周二" },
  { label: "参加需求评审会议", status: "未完成", due: "本周四" },
  { label: "向导师提交一次周反馈", status: "未完成", due: "本周五" },
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
  tasks: Array<{ label: string; status: "已完成" | "进行中" | "未开始" | "未完成" }>;
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

// 20 个在岗实习生账号：姓名 / 岗位 / 导师绑定。系统服务所有实习生，录入即可用，所有进度从 0 起步。
// 导师分配：王老师负责产品，李老师负责研发，陈老师负责销售。
export const internSeeds = [
  ["林小鹅", "产品", "王老师"],
  ["陈一鸣", "研发", "李老师"],
  ["周可可", "销售", "陈老师"],
  ["王予安", "产品", "王老师"],
  ["李想", "研发", "李老师"],
  ["赵晴", "产品", "王老师"],
  ["孙航", "销售", "陈老师"],
  ["吴念", "产品", "王老师"],
  ["许诺", "研发", "李老师"],
  ["蒋晨", "销售", "陈老师"],
  ["唐雨", "产品", "王老师"],
  ["刘昊", "研发", "李老师"],
  ["沈佳宁", "销售", "陈老师"],
  ["高远", "研发", "李老师"],
  ["罗曼", "产品", "王老师"],
  ["白芷", "产品", "王老师"],
  ["韩越", "销售", "陈老师"],
  ["程栩", "研发", "李老师"],
  ["姚瑶", "产品", "王老师"],
  ["马骁", "销售", "陈老师"],
] as const;

function createIntern(seed: typeof internSeeds[number]): Intern {
  const [name, role, mentor] = seed;
  return {
    name,
    role,
    week: "第 1 周",
    progress: 0,
    mentorFeedback: "",
    risk: "低风险",
    reason: "",
    todo: "",
    evidence: [],
    evidenceMetrics: [],
    possibleCause: "",
    hrAction: "",
    syncMentor: mentor ? `已绑定 ${mentor}` : "未分配导师",
    reviewReminder: "",
    confidence: 0,
    riskTags: [],
    processStatus: "已关闭",
    activityLog: [],
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
  poolName: "实习生成长人才池",
  retentionReady: interns.filter((intern) => intern.risk === "低风险" && intern.progress >= 75).length,
  watchList: interns.filter((intern) => intern.risk === "中风险").length,
  urgentRisk: interns.filter((intern) => intern.risk === "高风险").length,
  hiringSignal: "适岗趋势会在任务、导师反馈和复盘记录沉淀后自动生成。",
};
