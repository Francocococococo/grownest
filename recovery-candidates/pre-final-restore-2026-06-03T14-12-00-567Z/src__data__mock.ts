export type RiskLevel = "低风险" | "中风险" | "高风险";
export type UserRole = "student" | "mentor" | "hr";

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

export const interns: Intern[] = [
  {
    name: "林小鹅",
    role: "产品",
    week: "第3周",
    progress: 72,
    mentorFeedback: "执行稳定，业务理解需加强",
    risk: "中风险",
    reason: "多次提到不清楚业务指标",
    todo: "安排导师补充业务指标说明",
    evidence: ["任务完成稳定但问题集中在指标理解", "打卡中两次提到业务目标不清楚", "导师反馈主动追问偏少"],
    evidenceMetrics: [
      { label: "任务完成度", value: "72%", status: "normal" },
      { label: "导师反馈", value: "业务理解需加强", status: "warning" },
      { label: "打卡信号", value: "2 次指标困惑", status: "warning" },
      { label: "沟通频率", value: "每周 1 次", status: "normal" },
    ],
    possibleCause: "该同学执行力在线，但还没有把日常任务和部门核心指标建立连接。",
    hrAction: "建议 HR 推动导师补充一次业务指标说明，并让实习生复述当前任务与目标的关系。",
    syncMentor: "需要同步导师",
    reviewReminder: "一周后检查提问清单完成情况",
    confidence: 78,
    riskTags: ["指标理解浅", "需要导师澄清"],
    processStatus: "已同步导师",
    activityLog: ["今天 18:42 AI 标记为中风险", "今天 18:46 已生成导师沟通建议"],
  },
  {
    name: "陈一鸣",
    role: "研发",
    week: "第3周",
    progress: 48,
    mentorFeedback: "任务延期较多",
    risk: "高风险",
    reason: "连续两周任务未完成，导师反馈适应慢",
    todo: "HR 介入沟通",
    evidence: ["连续两周任务完成度低于 60%", "导师反馈“任务拆解能力弱，适应速度慢”", "本人打卡中出现“不知道从哪里开始”的表述"],
    evidenceMetrics: [
      { label: "任务完成度", value: "48%", status: "danger" },
      { label: "导师反馈", value: "适应速度慢", status: "danger" },
      { label: "打卡信号", value: "不知道从哪里开始", status: "danger" },
      { label: "沟通频率", value: "低于同岗均值", status: "warning" },
    ],
    possibleCause: "该同学可能不是能力不足，而是任务颗粒度过大、导师反馈不够及时，导致早期适应困难。",
    hrAction: "建议 HR 先进行一次 15 分钟沟通，确认是能力问题、任务理解问题还是导师支持不足。随后同步导师，将下周任务拆分为更小的可执行动作，并在一周后复盘。",
    syncMentor: "需要同步导师",
    reviewReminder: "一周后复盘任务拆解后的完成度",
    confidence: 91,
    riskTags: ["任务延期", "适应困难", "需 HR 介入"],
    processStatus: "待 HR 沟通",
    activityLog: ["昨天 19:20 导师反馈任务拆解能力弱", "今天 09:12 AI 升级为高风险", "今天 09:18 待 HR 发起 1v1"],
  },
  {
    name: "周可可",
    role: "销售",
    week: "第3周",
    progress: 61,
    mentorFeedback: "沟通积极但业务知识薄弱",
    risk: "中风险",
    reason: "客户场景理解不足",
    todo: "安排业务知识训练",
    evidence: ["客户角色识别不稳定", "销售话术练习中产品价值表达偏泛", "导师反馈愿意沟通但知识储备不足"],
    evidenceMetrics: [
      { label: "任务完成度", value: "61%", status: "warning" },
      { label: "导师反馈", value: "业务知识薄弱", status: "warning" },
      { label: "打卡信号", value: "客户场景不清", status: "warning" },
      { label: "沟通频率", value: "积极", status: "normal" },
    ],
    possibleCause: "该同学投入度较高，但行业、客户和产品知识还没有形成结构。",
    hrAction: "安排一次业务知识训练，并让导师提供 3 个典型客户场景做演练。",
    syncMentor: "建议同步导师",
    reviewReminder: "下周五复盘演练结果",
    confidence: 74,
    riskTags: ["业务知识薄弱", "客户场景不足"],
    processStatus: "复盘中",
    activityLog: ["今天 10:10 已安排业务知识训练", "下周五复盘客户场景演练"],
  },
  {
    name: "王予安",
    role: "HR",
    week: "第3周",
    progress: 86,
    mentorFeedback: "主动性强，学习快",
    risk: "低风险",
    reason: "任务完成稳定，反馈积极",
    todo: "无需介入",
    evidence: ["任务按时完成", "主动补充候选人沟通记录", "导师评价学习速度快"],
    evidenceMetrics: [
      { label: "任务完成度", value: "86%", status: "normal" },
      { label: "导师反馈", value: "主动性强", status: "normal" },
      { label: "打卡信号", value: "积极复盘", status: "normal" },
      { label: "沟通频率", value: "稳定", status: "normal" },
    ],
    possibleCause: "匹配度较高，能够主动把流程要求转化为行动。",
    hrAction: "保持观察，可以安排参与一次更完整的招聘项目。",
    syncMentor: "无需强制同步",
    reviewReminder: "两周后观察挑战任务表现",
    confidence: 86,
    riskTags: ["稳定适应", "可增加挑战"],
    processStatus: "已关闭",
    activityLog: ["今天 11:00 AI 维持低风险", "建议两周后复盘挑战任务"],
  },
  {
    name: "李想",
    role: "研发",
    week: "第3周",
    progress: 77,
    mentorFeedback: "技术基础较好",
    risk: "低风险",
    reason: "进度正常",
    todo: "保持观察",
    evidence: ["开发任务稳定提交", "代码 Review 修改及时", "能主动记录技术问题"],
    evidenceMetrics: [
      { label: "任务完成度", value: "77%", status: "normal" },
      { label: "导师反馈", value: "技术基础较好", status: "normal" },
      { label: "打卡信号", value: "主动记录问题", status: "normal" },
      { label: "沟通频率", value: "正常", status: "normal" },
    ],
    possibleCause: "技术基础和学习习惯较好，目前适应节奏正常。",
    hrAction: "保持观察，鼓励导师给出更明确的阶段目标。",
    syncMentor: "无需强制同步",
    reviewReminder: "第 30 天阶段评价时复盘",
    confidence: 82,
    riskTags: ["进度正常"],
    processStatus: "已关闭",
    activityLog: ["今天 14:05 进度正常", "第 30 天阶段评价时复盘"],
  },
  {
    name: "赵晴",
    role: "产品",
    week: "第3周",
    progress: 55,
    mentorFeedback: "表达好但产出偏慢",
    risk: "中风险",
    reason: "需求文档质量不稳定",
    todo: "导师加强文档辅导",
    evidence: ["需求草稿返工次数较多", "会议表达清晰但落文档慢", "对验收标准理解不稳定"],
    evidenceMetrics: [
      { label: "任务完成度", value: "55%", status: "warning" },
      { label: "导师反馈", value: "产出偏慢", status: "warning" },
      { label: "打卡信号", value: "文档返工", status: "warning" },
      { label: "沟通频率", value: "稳定", status: "normal" },
    ],
    possibleCause: "该同学沟通表达有优势，但产品文档结构和边界意识需要训练。",
    hrAction: "建议导师给出模板和优秀样例，安排一次文档共创。",
    syncMentor: "需要同步导师",
    reviewReminder: "下周检查文档返工次数",
    confidence: 80,
    riskTags: ["文档质量不稳", "需要样例辅导"],
    processStatus: "已同步导师",
    activityLog: ["今天 15:30 已同步导师补充文档模板", "下周检查返工次数"],
  },
  {
    name: "孙航",
    role: "销售",
    week: "第3周",
    progress: 39,
    mentorFeedback: "适应困难",
    risk: "高风险",
    reason: "打卡中多次表达压力大",
    todo: "HR 约谈",
    evidence: ["任务完成度低于 50%", "打卡出现压力大和不知道找谁", "导师反馈跟进节奏断续"],
    evidenceMetrics: [
      { label: "任务完成度", value: "39%", status: "danger" },
      { label: "导师反馈", value: "适应困难", status: "danger" },
      { label: "打卡信号", value: "压力大", status: "danger" },
      { label: "沟通频率", value: "断续", status: "danger" },
    ],
    possibleCause: "可能同时存在岗位认知落差和支持资源不足，需要尽快判断是否适岗。",
    hrAction: "建议 HR 约谈，确认压力来源，并同步导师建立每日 10 分钟短反馈。",
    syncMentor: "必须同步导师",
    reviewReminder: "三天后确认状态是否缓解",
    confidence: 94,
    riskTags: ["压力表达", "支持不足", "需约谈"],
    processStatus: "待 HR 沟通",
    activityLog: ["今天 09:30 AI 标记为高风险", "今天 09:35 待 HR 约谈确认压力来源"],
  },
  {
    name: "吴念",
    role: "产品",
    week: "第3周",
    progress: 91,
    mentorFeedback: "表现突出",
    risk: "低风险",
    reason: "超额完成任务",
    todo: "安排挑战任务",
    evidence: ["提前完成竞品分析", "主动提出需求优化建议", "导师评价业务敏感度好"],
    evidenceMetrics: [
      { label: "任务完成度", value: "91%", status: "normal" },
      { label: "导师反馈", value: "表现突出", status: "normal" },
      { label: "打卡信号", value: "主动建议", status: "normal" },
      { label: "沟通频率", value: "积极", status: "normal" },
    ],
    possibleCause: "该同学适应速度快，需要更高挑战来保持成长斜率。",
    hrAction: "安排挑战任务，记录可沉淀的优秀案例。",
    syncMentor: "建议同步导师",
    reviewReminder: "下周复盘挑战任务表现",
    confidence: 89,
    riskTags: ["表现突出", "适合挑战任务"],
    processStatus: "复盘中",
    activityLog: ["今天 16:00 已建议安排挑战任务", "下周复盘挑战任务表现"],
  },
];

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
