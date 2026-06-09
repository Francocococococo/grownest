import fs from "node:fs";
import path from "node:path";

const sessions = [
  "/Users/sunkong/.codex/sessions/2026/05/29/rollout-2026-05-29T11-17-28-019e71bc-a265-7f70-ae72-2cab33f97dc1.jsonl",
  "/Users/sunkong/.codex/sessions/2026/05/29/rollout-2026-05-29T11-33-09-019e71cb-007d-7830-b959-fb107833bf61.jsonl",
  "/Users/sunkong/.codex/sessions/2026/06/01/rollout-2026-06-01T12-11-03-019e8160-c484-7fd3-bb43-cef1eff9f3ba.jsonl",
  "/Users/sunkong/.codex/sessions/2026/06/03/rollout-2026-06-03T10-48-20-019e8b61-c174-71e1-9875-951301407762.jsonl",
  "/Users/sunkong/.codex/sessions/2026/06/03/rollout-2026-06-03T14-47-36-019e8c3c-d28f-7d20-98eb-b9b38844c5f8.jsonl",
];

const outdir = "/Users/sunkong/Desktop/夏令营/internflow-demo/recovery-candidates";
fs.mkdirSync(outdir, { recursive: true });

function parseArgs(value) {
  if (typeof value !== "string") return value ?? {};
  try {
    return JSON.parse(value);
  } catch {
    return { cmd: value };
  }
}

function extractOutput(value) {
  const marker = "Output:\n";
  const index = value.indexOf(marker);
  return index >= 0 ? value.slice(index + marker.length) : value;
}

for (const file of sessions) {
  if (!fs.existsSync(file)) continue;

  const calls = new Map();
  const chunks = {};
  const lines = fs.readFileSync(file, "utf8").split("\n");

  for (const line of lines) {
    if (!line.trim()) continue;

    let item;
    try {
      item = JSON.parse(line);
    } catch {
      continue;
    }

    const payload = item.payload ?? {};
    if (item.type === "response_item" && payload.type === "function_call" && payload.name === "exec_command") {
      const { cmd = "" } = parseArgs(payload.arguments);
      const match = cmd.match(/sed -n ['"](\d+),(\d+)p['"]\s+([^\s&;]+)/);
      if (!match) continue;

      const targetPath = match[3];
      if (!targetPath.includes("src/App.tsx") && !targetPath.includes("src/index.css") && !targetPath.includes("src/data/mock.ts")) continue;

      calls.set(payload.call_id, {
        start: Number(match[1]),
        end: Number(match[2]),
        target: targetPath.includes("index.css") ? "index.css" : targetPath.includes("data/mock.ts") ? "mock.ts" : "App.tsx",
        timestamp: item.timestamp ?? "",
      });
    }

    if (item.type === "response_item" && payload.type === "function_call_output" && calls.has(payload.call_id)) {
      const meta = calls.get(payload.call_id);
      let text = extractOutput(payload.output ?? "");
      text = text.replace(/\n+$/g, "");
      if (text.includes("truncated") || text.includes("…")) continue;
      chunks[meta.target] ??= [];
      chunks[meta.target].push({ ...meta, text });
    }
  }

  for (const [target, records] of Object.entries(chunks)) {
    records.sort((a, b) => a.start - b.start || String(a.timestamp).localeCompare(String(b.timestamp)) || b.end - a.end);

    const lineMap = new Map();
    for (const record of records) {
      const outputLines = record.text.split("\n");
      for (let offset = 0; offset < outputLines.length; offset += 1) {
        const lineNumber = record.start + offset;
        if (lineNumber <= record.end && !lineMap.has(lineNumber)) {
          lineMap.set(lineNumber, outputLines[offset]);
        }
      }
    }

    const numbers = [...lineMap.keys()].sort((a, b) => a - b);
    if (numbers.length < 50) continue;

    const min = numbers[0];
    const max = numbers[numbers.length - 1];
    let gaps = 0;
    const body = [];
    for (let lineNumber = min; lineNumber <= max; lineNumber += 1) {
      if (!lineMap.has(lineNumber)) gaps += 1;
      body.push(lineMap.get(lineNumber) ?? `/* RECOVERY_GAP_LINE_${lineNumber} */`);
    }

    const name = path.basename(file, ".jsonl").replace(/^rollout-/, "");
    const out = path.join(outdir, `${name}.${target}`);
    fs.writeFileSync(out, `${body.join("\n")}\n`);
    console.log(`${out} lines=${numbers.length} range=${min}-${max} gaps=${gaps}`);

    if (target === "App.tsx") {
      const marker = "\nexport default App;\n";
      const text = `${body.join("\n")}\n`;
      const markerIndex = text.indexOf(marker);
      if (markerIndex >= 0) {
        const cleanOut = path.join(outdir, `${name}.clean.App.tsx`);
        fs.writeFileSync(cleanOut, text.slice(0, markerIndex + marker.length));
        console.log(`${cleanOut} cleanThroughExportDefault=true`);
      }
    }
  }
}
