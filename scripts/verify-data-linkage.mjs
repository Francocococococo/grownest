import fs from "node:fs";

const app = fs.readFileSync(new URL("../src/App.tsx", import.meta.url), "utf8");
const mock = fs.readFileSync(new URL("../src/data/mock.ts", import.meta.url), "utf8");

const checks = [
  {
    name: "student task completion creates mentor-facing signal",
    pass:
      app.includes("完成成长任务") &&
      app.includes('sourceRole: "实习生"') &&
      app.includes('targetRole: "导师"'),
  },
  {
    name: "student question is sent to mentor",
    pass:
      app.includes("向导师提问") &&
      app.includes("question,") &&
      app.includes('status: "待处理"'),
  },
  {
    name: "mentor reply returns to student and syncs HRBP",
    pass:
      app.includes("导师回复：${answer}") &&
      app.includes("提问已由导师回复") &&
      app.includes('sourceRole: "导师"') &&
      app.includes('targetRole: "HR"'),
  },
  {
    name: "mentor feedback writes both student and HRBP records",
    pass:
      app.includes("已确认反馈") &&
      app.includes("导师反馈已同步 HRBP") &&
      app.includes('targetRole: "实习生"') &&
      app.includes('targetRole: "HR"'),
  },
  {
    name: "HRBP can render global cross-end records",
    pass:
      app.includes("跨端协同记录") &&
      app.includes("SyncFlowBadge") &&
      app.includes("activeRecords.slice(0, 6)"),
  },
  {
    name: "legacy project name is normalized without visible one-off wording",
    pass:
      app.includes("normalizeProjectName") &&
      !app.includes("预入职") &&
      !app.includes("校招预热") &&
      !app.includes("一次性") &&
      !mock.includes("夏令营") &&
      !mock.includes("批次"),
  },
];

const failed = checks.filter((check) => !check.pass);

for (const check of checks) {
  console.log(`${check.pass ? "PASS" : "FAIL"} ${check.name}`);
}

if (failed.length) {
  console.error(`\n${failed.length} data-linkage check(s) failed.`);
  process.exit(1);
}

console.log("\nAll GrowNest data-linkage checks passed.");
