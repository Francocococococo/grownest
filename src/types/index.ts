export type RiskLevel = "低风险" | "中风险" | "高风险";
export type UserRole = "student" | "mentor" | "hr" | "admin";
export type Path = "/login" | "/student" | "/mentor" | "/hr" | "/admin";
export type TaskStatus = "已完成" | "进行中" | "未开始" | "未完成";
export type ProcessStatus = "待 HR 沟通" | "已同步导师" | "复盘中" | "已关闭";
export type OwnerRole = "实习生" | "导师" | "HR";
export type SignalSource = "student" | "mentor" | "hrbp" | "ai";
export type SignalType = "task" | "question" | "feedback" | "risk" | "followup";
export type SignalStatus = "pending" | "confirmed" | "in_progress" | "completed" | "review";

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

export type AuthUser = Omit<MockUser, "password">;

export type GrowthTask = {
  id: string;
  title: string;
  status: TaskStatus;
  due: string;
  owner: OwnerRole;
  note: string;
};

export type MentorFeedbackRecord = {
  id: string;
  mentor: string;
  content: string;
  score: number;
  createdAt: string;
};

export type ManagedIntern = {
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
  status: "在岗" | "暂停" | "已结束";
  riskTags: string[];
  tasks: GrowthTask[];
  feedbacks: MentorFeedbackRecord[];
  createdAt: string;
  updatedAt: string;
};

export type InternFormState = Pick<ManagedIntern, "name" | "role" | "title" | "department" | "mentor" | "week" | "progress" | "risk" | "reason" | "todo" | "processStatus" | "status"> & {
  riskTagsText: string;
};

export type TaskFormState = Pick<GrowthTask, "title" | "status" | "due" | "owner" | "note">;
export type FeedbackFormState = Pick<MentorFeedbackRecord, "mentor" | "content" | "score">;
export type ManagedInternPatch = Partial<Omit<ManagedIntern, "id" | "tasks" | "feedbacks" | "createdAt">>;

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
  processStatus: ProcessStatus;
  activityLog: string[];
};

export type CollaborationRecord = {
  id: string;
  internName: string;
  sourceRole: OwnerRole;
  targetRole: OwnerRole;
  title: string;
  detail: string;
  status: "待处理" | "已同步" | "已创建";
  createdAt: string;
  question?: string;
  answer?: string;
  answeredAt?: string;
};

export type GrowthSignal = {
  id: string;
  internId: string;
  internName: string;
  mentorName: string;
  source: SignalSource;
  sourceLabel: string;
  type: SignalType;
  title: string;
  description: string;
  status: SignalStatus;
  statusLabel: string;
  visibleToStudent: boolean;
  visibleToMentor: boolean;
  visibleToHrbp: boolean;
  createdAt: string;
  updatedAt: string;
  sourceRecordId?: string;
};

export type ActionRecord = {
  id: string;
  internId: string;
  internName: string;
  ownerRole: "student" | "mentor" | "hrbp";
  ownerId: string;
  action: string;
  status: SignalStatus;
  sourceSignalId?: string;
  reviewNote?: string;
};

export type RiskInsight = {
  id: string;
  internId: string;
  internName: string;
  signalIds: string[];
  level: "low" | "medium" | "high";
  levelLabel: RiskLevel;
  reason: string;
  hrbpConfirmStatus: "待确认" | "已确认" | "复盘中";
  followupActionId?: string;
};

export type AIFeedback = {
  highlights: string;
  improvements: string;
  nextStep: string;
  messageToIntern: string;
};

export type AIQuestions = {
  questions: string[];
};

export type AIReport = {
  report: string;
};

export type AIHrAction = {
  title: string;
  detail: string;
};

export type AIDailyPlan = {
  recommendation: string;
  reason: string;
  actions: string[];
};

export type AIGenerationResult<T> = {
  output: T;
};

export type RiskAnalysis = {
  risk: RiskLevel;
  rationale: string;
  evidence: string[];
  possibleCause: string;
  suggestedActions: string[];
  needsHrFollowUp: boolean;
  humanReviewNotice: string;
};
