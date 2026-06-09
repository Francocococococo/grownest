// @env browser
import type { AuthUser, CollaborationRecord, ManagedIntern } from "../types";
import {
  authStorageKey,
  collaborationStorageKey,
  grownestAuthStorageKey,
  grownestCollaborationStorageKey,
  grownestManagedInternStorageKey,
  managedInternStorageKey,
} from "../constants/options";

function readJson<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  }
  catch {
    return fallback;
  }
}

function readJsonFromKeys<T>(keys: string[], fallback: T): T {
  for (const key of keys) {
    const value = readJson<T | null>(key, null);
    if (value !== null) return value as T;
  }
  return fallback;
}

function persistJsonToKeys<T>(keys: string[], value: T): void {
  const serialized = JSON.stringify(value);
  keys.forEach((key) => localStorage.setItem(key, serialized));
}

export function readStoredUser(): AuthUser | null {
  const user = readJsonFromKeys<AuthUser | null>([authStorageKey, grownestAuthStorageKey], null);
  if (!user || !["student", "mentor", "hr", "admin"].includes(user.role)) {
    localStorage.removeItem(authStorageKey);
    localStorage.removeItem(grownestAuthStorageKey);
    return null;
  }
  return user;
}

export function persistStoredUser(user: AuthUser): void {
  persistJsonToKeys([authStorageKey, grownestAuthStorageKey], user);
}

export function clearStoredUser(): void {
  localStorage.removeItem(authStorageKey);
  localStorage.removeItem(grownestAuthStorageKey);
}

export function readCollaborationRecords(): CollaborationRecord[] {
  return readJsonFromKeys<CollaborationRecord[]>([collaborationStorageKey, grownestCollaborationStorageKey], []);
}

export function persistCollaborationRecords(records: CollaborationRecord[]): void {
  persistJsonToKeys([collaborationStorageKey, grownestCollaborationStorageKey], records);
}

// 老 localStorage 数据可能带假进度/假任务/假反馈，迁移时只保留身份字段（id/name/role/mentor/department/title），
// 其余全部清零，确保 UI 看到的是"录入后自动..."型空状态，而不是历史假数据。
function sanitizeLegacyIntern(intern: ManagedIntern): ManagedIntern {
  const looksLegacy =
    intern.progress > 0 ||
    intern.tasks.length > 0 ||
    intern.feedbacks.length > 0 ||
    intern.reason !== "" ||
    intern.todo !== "" ||
    intern.riskTags.length > 0;
  if (!looksLegacy) return intern;
  return {
    ...intern,
    week: "第 1 周",
    progress: 0,
    risk: "低风险",
    reason: "",
    todo: "",
    processStatus: "已关闭",
    status: intern.status ?? "在岗",
    riskTags: [],
    tasks: [],
    feedbacks: [],
    createdAt: intern.createdAt || "初始导入",
    updatedAt: "初始导入",
  };
}

export function readManagedInterns(seed: () => ManagedIntern[]): ManagedIntern[] {
  const fallback = seed();
  const stored = readJsonFromKeys<ManagedIntern[]>([managedInternStorageKey, grownestManagedInternStorageKey], fallback);
  const isValid = Array.isArray(stored) && stored.every((intern) =>
    intern &&
    typeof intern.id === "string" &&
    typeof intern.name === "string" &&
    typeof intern.progress === "number" &&
    Array.isArray(intern.tasks) &&
    Array.isArray(intern.feedbacks) &&
    ["待 HR 沟通", "已同步导师", "复盘中", "已关闭"].includes(intern.processStatus),
  );
  if (!isValid) {
    localStorage.removeItem(managedInternStorageKey);
    localStorage.removeItem(grownestManagedInternStorageKey);
    return fallback;
  }
  return stored.map(sanitizeLegacyIntern);
}

export function persistManagedInterns(interns: ManagedIntern[]): void {
  persistJsonToKeys([managedInternStorageKey, grownestManagedInternStorageKey], interns);
}

export function clearDemoStorage(): void {
  localStorage.removeItem(collaborationStorageKey);
  localStorage.removeItem(managedInternStorageKey);
  localStorage.removeItem(grownestCollaborationStorageKey);
  localStorage.removeItem(grownestManagedInternStorageKey);
}
