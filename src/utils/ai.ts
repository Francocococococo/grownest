import type {
  AIDailyPlan,
  AIFeedback,
  AIHrAction,
  AIQuestions,
  AIReport,
  CollaborationRecord,
  ManagedIntern,
  MentorFeedbackRecord,
  RiskAnalysis,
  RiskLevel,
} from "../types";
import { attentionLabel } from "../constants/options";
import { getAverageProgress, getMentorFeedbackRate, getRiskDistributionData, getRoleProgressData } from "./calculations";

type MentorQuestionInput = {
  student: { name: string; title?: string; progress?: number; supportStatus?: string };
  weeklyTasks: Array<{ label?: string; title?: string; status: string; due?: string }>;
  focusTopic?: string;
  studentDraft?: string;
};

type FeedbackInput = {
  intern: { name: string; focus: string; progress: number; risk: RiskLevel; weeklyRecord: string[]; aiSignals: string[] };
  observation: string;
  context?: { mentorScores?: Record<string, number> };
};

type ReportInput = {
  managedInterns?: ManagedIntern[];
  interns?: ManagedIntern[];
  collaborationRecords: CollaborationRecord[];
};

type HrActionInput = {
  intern: { name: string; risk: RiskLevel; reason: string; todo: string; evidence?: string[] };
  action: string;
};

type DailyPlanInput = {
  student: { name: string; title?: string; supportFocus?: string };
  todayTasks: Array<{ name?: string; label?: string; status: string; note?: string }>;
  weekTasks: Array<{ name?: string; label?: string; status: string; due?: string }>;
  latestFeedback?: string;
};

export function generateRiskAnalysis(intern: ManagedIntern): RiskAnalysis {
  const completedTasks = intern.tasks.filter((task) => task.status === "已完成").length;
  const completionRate = intern.tasks.length ? Math.round((completedTasks / intern.tasks.length) * 100) : intern.progress;
  const latestFeedback = intern.feedbacks[0]?.content ?? "暂无导师反馈";
  const lowProgress = completionRate < 60 || intern.progress < 60;
  const missingFeedback = intern.feedbacks.length === 0;
  const needsHrFollowUp = intern.risk === "高风险" || lowProgress || missingFeedback;
  const risk: RiskLevel = needsHrFollowUp ? (intern.risk === "低风险" ? "中风险" : intern.risk) : intern.risk;

  return {
    risk,
    rationale: `AI 依据任务完成度、导师反馈覆盖和当前关注标签，将 ${intern.name} 判断为「${attentionLabel[risk]}」。`,
    evidence: [
      `任务完成：${completedTasks}/${intern.tasks.length || 0}，折算完成度 ${completionRate}%`,
      `成长进度：${intern.progress}%`,
      `导师反馈：${latestFeedback}`,
      `打卡/风险信号：${intern.reason || "暂无明显异常"}`,
    ],
    possibleCause: lowProgress
      ? "可能是任务拆解不够细，或对岗位验收标准理解不足。"
      : missingFeedback
        ? "当前风险更多来自反馈缺口，HR 需要推动导师补齐观察证据。"
        : "当前状态较稳定，风险判断主要用于提醒持续观察。",
    suggestedActions: needsHrFollowUp
      ? ["HRBP 与导师同步一次支持动作", "把下周任务拆成可验收的小交付", "一周后复盘完成度和反馈变化"]
      : ["保持每周反馈节奏", "安排一项边界清晰的挑战任务", "在阶段节点确认成长证据"],
    needsHrFollowUp,
    humanReviewNotice: "AI 不替代 HR 做判断。请 HRBP 结合导师真实观察、业务上下文和实习生本人沟通后确认。",
  };
}

export function generateMentorFeedback(input: FeedbackInput): AIFeedback {
  const scoreText = input.context?.mentorScores
    ? Object.entries(input.context.mentorScores).map(([key, value]) => `${key}${value}/5`).join("、")
    : "暂无评分";

  return {
    highlights: `${input.intern.name}当前进度 ${input.intern.progress}%，在「${input.intern.focus}」相关任务上已有可观察投入。依据：${input.intern.weeklyRecord.slice(0, 2).join("；")}。`,
    improvements: `需要继续确认「${input.intern.focus}」的验收标准。关键证据：${input.intern.aiSignals.join("；")}；导师补充观察：${input.observation}`,
    nextStep: `建议下周安排一次 20 分钟对齐，把任务拆成“交付物、截止时间、验收标准”三项，并记录 ${scoreText} 的变化。`,
    messageToIntern: "这份反馈是 AI 草稿，导师已基于真实观察确认。你可以先按建议推进，再把卡点整理成具体问题同步导师。",
  };
}

export function generateWeeklyReport(interns: ManagedIntern[], records: CollaborationRecord[]): AIReport {
  const averageProgress = getAverageProgress(interns);
  const feedbackRate = getMentorFeedbackRate(interns);
  const riskData = getRiskDistributionData(interns);
  const roleData = getRoleProgressData(interns);
  const highRisk = interns.filter((intern) => intern.risk === "高风险");
  const middleRisk = interns.filter((intern) => intern.risk === "中风险");
  const highPotential = interns.filter((intern) => intern.risk === "低风险" && intern.progress >= 80);
  const latestRecords = records.slice(0, 3).map((record) => `- ${record.sourceRole}→${record.targetRole}：${record.title}`).join("\n") || "- 暂无跨端协同记录";

  return {
    report: [
      "GrowNest 本周适岗周报",
      "",
      `判断依据：当前共 ${interns.length} 名实习生，平均成长进度 ${averageProgress}%，导师反馈覆盖率 ${feedbackRate}%。`,
      `岗位表现：${roleData.map((item) => `${item.role}${item.progress}%`).join("；")}。`,
      `风险分布：${riskData.map((item) => `${attentionLabel[item.name]} ${item.value} 人`).join("；")}。`,
      "",
      `关键证据：高风险 ${highRisk.length} 人（${highRisk.map((item) => item.name).join("、") || "无"}），中风险 ${middleRisk.length} 人，高潜观察 ${highPotential.length} 人。`,
      `可能原因：风险对象通常集中在任务完成度不足、导师反馈缺口或岗位标准不清晰；低风险高进度对象适合安排挑战任务验证上限。`,
      "",
      "建议动作：",
      "1. HRBP 先跟进高风险对象，确认是否需要 1v1 沟通。",
      "2. 推动导师补齐缺失反馈，反馈必须包含证据、下一步动作和复盘时间。",
      "3. 对高潜对象安排更高挑战任务，避免只用完成度判断留用潜力。",
      "",
      `跨端记录：\n${latestRecords}`,
      "",
      "是否需要 HR 跟进：高风险和反馈缺失对象需要 HRBP 主动跟进。",
      "人工确认提示：AI 只做早期信号聚合，不替代 HR、导师或业务负责人做最终判断。",
    ].join("\n"),
  };
}

export function generateQuestionsForMentor(input: MentorQuestionInput): AIQuestions {
  const pendingTasks = input.weeklyTasks.filter((task) => task.status !== "已完成");
  const task = pendingTasks[0] ?? input.weeklyTasks[0];
  const taskName = task?.label ?? task?.title ?? input.focusTopic ?? "当前任务";

  return {
    questions: [
      `关于「${taskName}」，我现在最不确定的是验收标准。您能帮我确认最终交付物应该包含哪些关键点吗？`,
      `我当前成长重点是「${input.student.supportStatus ?? input.focusTopic ?? "岗位理解"}」，下周最应该优先补齐哪一项能力？`,
      input.studentDraft?.trim()
        ? `我把自己的问题整理为：「${input.studentDraft.trim()}」。您看这个问题是否准确，还是应该换成更贴近业务目标的问法？`
        : `基于我目前 ${input.student.progress ?? 0}% 的进度，您建议我先推进任务产出，还是先补齐业务背景理解？`,
    ],
  };
}

export function generateHrAction(input: HrActionInput): AIHrAction {
  const needsUrgent = input.intern.risk === "高风险";
  return {
    title: `${input.action}｜${input.intern.name}`,
    detail: [
      `判断依据：${input.intern.reason || input.intern.todo}`,
      `关键证据：${input.intern.evidence?.join("；") || "当前成长记录与导师反馈信号"}`,
      `可能原因：${needsUrgent ? "任务拆解和沟通频率不足，可能需要 HRBP 介入稳定节奏。" : "当前更适合通过导师补充反馈和任务澄清推进。"}`,
      `建议动作：${input.action}，并设置一周后复盘点。`,
      `是否需要 HR 跟进：${needsUrgent ? "是" : "视导师反馈补齐情况确认"}`,
      "人工确认提示：AI 生成的是协同草稿，请 HRBP 结合真实沟通后确认。",
    ].join("\n"),
  };
}

export function generateDailyPlan(input: DailyPlanInput): AIDailyPlan {
  const pendingTasks = input.weekTasks.filter((task) => task.status !== "已完成");
  const todayTask = input.todayTasks.find((task) => task.status !== "已完成") ?? input.todayTasks[0] ?? pendingTasks[0];
  const taskName = todayTask?.name ?? todayTask?.label ?? "当前成长任务";

  return {
    recommendation: `今天优先推进「${taskName}」，先产出一个可让导师快速判断质量的小交付。`,
    reason: `判断依据：本周仍有 ${pendingTasks.length} 个待办，当前支持重点是「${input.student.supportFocus ?? "岗位理解"}」。${input.latestFeedback ? `导师最近反馈提到：${input.latestFeedback}` : "暂无最新导师反馈，因此建议用小交付主动制造反馈机会。"}`,
    actions: [
      `用 25 分钟完成「${taskName}」的第一版`,
      "记录 1 条不确定的验收标准，转成可直接问导师的问题",
      "完成后更新任务状态，让 HR 和导师看到最新进度",
    ],
  };
}

export function generateFallbackOutput(type: string, payload: unknown): unknown {
  if (type === "feedback") return generateMentorFeedback(payload as FeedbackInput);
  if (type === "questions") return generateQuestionsForMentor(payload as MentorQuestionInput);
  if (type === "report") {
    const input = payload as ReportInput;
    return generateWeeklyReport(input.managedInterns ?? input.interns ?? [], input.collaborationRecords);
  }
  if (type === "hrAction") return generateHrAction(payload as HrActionInput);
  if (type === "dailyPlan") return generateDailyPlan(payload as DailyPlanInput);
  return {};
}

export function summarizeFeedbacks(feedbacks: MentorFeedbackRecord[]): string {
  return feedbacks.length
    ? feedbacks.slice(0, 2).map((feedback) => `${feedback.mentor}：${feedback.content}`).join("；")
    : "暂无导师反馈";
}
