# AGENTS.md

## Project Overview

GrowNest 鹅苗成长舱 is a Vite + React + TypeScript demo for an AI-HR internship growth and mentoring collaboration product.

According to `README.md` and current source code, GrowNest is an AI-assisted growth management system for interns, mentors, HRBP, recruiting review, and system administration. The product connects intern tasks, mentor feedback, HRBP follow-up, evidence records, and review summaries.

This project should be treated as a working enterprise SaaS prototype, not a disposable landing page or simple student exercise. AI content in this product must remain assistive: rules and evidence are surfaced first, and humans confirm decisions.

## Tech Stack

Identified from `package.json`, `vite.config.ts`, and source imports:

- React 19
- React DOM 19
- TypeScript 6
- Vite 8
- Tailwind CSS 4 via `@tailwindcss/vite`
- GSAP and `@gsap/react`
- lucide-react
- recharts
- class-variance-authority
- clsx
- tailwind-merge
- ESLint 10
- Local Node API proxy in `api/server.mjs`
- DeepSeek API integration through `/api/generate`

## Common Commands

These scripts are defined in `package.json`:

- `npm run dev`: starts `node api/server.mjs` and Vite together.
- `npm run dev:api`: starts only the local API server.
- `npm run dev:ui`: starts only Vite.
- `npm run build`: runs `tsc -b && vite build`.
- `npm run lint`: runs `eslint .`.
- `npm run preview`: runs `vite preview`.

README also documents:

- `npm install`
- `cp .env.example .env`
- Optional local API port override with `INTERNFLOW_API_PORT=3002 npm run dev:api`

Do not invent additional commands.

## Project Structure

Key files and directories identified in the current project:

- `README.md`: product description, local run instructions, DeepSeek setup, build and Vercel deployment notes.
- `package.json`: scripts and dependencies.
- `vite.config.ts`: Vite config with React and Tailwind plugins, server host set to `127.0.0.1`.
- `index.html`: Vite HTML entry.
- `api/server.mjs`: local DeepSeek API proxy.
- `api/generate.js`: Vercel-compatible generic DeepSeek generation endpoint.
- `api/generate-feedback.js`: legacy AI feedback endpoint kept for compatibility.
- `public/favicon.svg`: branded favicon.
- `public/icons.svg`: public icon asset.
- `src/main.tsx`: React root entry.
- `src/App.tsx`: main single-page app, routing, dashboards, shared components, animations, localStorage updates, CRUD handlers, and AI UI flows.
- `src/index.css`: Tailwind import and global visual system styles.
- `src/ThemePreviewPage.tsx`: theme preview page.
- `src/data/mock.ts`: mock users, intern data, growth stages, role templates, recruiter summary.
- `src/constants/options.ts`: storage keys, role paths, role names, risk classes, labels, date constants.
- `src/types/index.ts`: shared TypeScript types.
- `src/hooks/useAuth.ts`: auth state hook backed by localStorage.
- `src/hooks/useInterns.ts`: managed intern state hook backed by localStorage.
- `src/utils/storage.ts`: localStorage read/write helpers and demo storage clearing.
- `src/utils/ai.ts`: local AI fallback generation and risk analysis helpers.
- `src/utils/calculations.ts`: progress, feedback rate, risk distribution, and role progress calculations.
- `src/utils/formatters.ts`: formatting helpers including `createId`.
- `src/lib/utils.ts`: className merge utility.
- `src/assets/hero.png`, `src/assets/react.svg`, `src/assets/vite.svg`: image/SVG assets.

Important size/risk note:

- `src/App.tsx` is a very large TSX file, measured at 5865 lines during this scan.
- `src/index.css` is also large, measured at 2127 lines during this scan.
- Large TSX/JSX edits are high risk. Make small, scoped changes and run `npm run build` after each meaningful change.

## Key Pages / Modules

Routes identified in `src/App.tsx`:

- `/`: homepage / landing page through `HomePage`.
- `/login`: login and role entry through `LoginPage`.
- `/student`: intern growth dashboard through `StudentDashboard`.
- `/mentor`: mentor dashboard through `MentorDashboard`.
- `/hr`: HRBP growth operations dashboard through `HRDashboard`.
- `/admin`: system admin dashboard through `AdminDashboard`.
- `/preview-theme`: theme preview through `ThemePreviewPage`.

Role routing identified in code:

- `student` maps to `/student`.
- `mentor` maps to `/mentor`.
- `hr` maps to `/hr`.
- `admin` maps to `/admin`.

Major modules and component areas identified in `src/App.tsx`:

- Homepage and login flow.
- App shell / authenticated navigation.
- Student growth dashboard.
- Mentor teaching and structured feedback dashboard.
- HRBP growth operations dashboard.
- Recruiting effectiveness review module embedded in HRBP.
- System administration dashboard.
- Shared cards, section titles, badges, status pills, feedback notices, charts, AI reliability panel, permission boundary, MVP scope panel.
- CRUD logic for managed interns, tasks, and mentor feedback.
- Collaboration record creation and updates across student, mentor, and HR views.
- GSAP animation hooks and result reveal animations.
- Recharts-based role/progress visualizations.

## Auth, Roles, Storage, and CRUD

Identified from `src/App.tsx`, `src/hooks/useAuth.ts`, `src/hooks/useInterns.ts`, and `src/utils/storage.ts`:

- Authentication state is stored in localStorage under `internflow_user`.
- Collaboration records are stored in localStorage under `internflow_collaboration_records`.
- Managed intern data is stored in localStorage under `internflow_managed_interns`.
- `useAuth` reads/persists/clears the current auth user.
- `useInterns` reads/persists managed intern state and exposes `updateManagedInterns`.
- App-level handlers create and update collaboration records.
- App-level CRUD exists for managed interns, tasks, and feedback:
  - create, update, delete intern
  - create, update, delete task
  - create, update, delete feedback
- Role access and routing are handled in `App.tsx`; avoid breaking login redirects and role-specific dashboards.

Git note:

- Running `git status --short` inside `internflow-demo` returned `fatal: not a git repository`. The parent workspace contains a `.git` directory, but this project directory itself was not detected as a standalone Git repository during this scan. Future agents should check the actual working directory before assuming git behavior.

## Product Context

The product context is visible in `README.md`, `src/App.tsx`, `src/data/mock.ts`, and `src/utils/ai.ts`.

Recognized product concepts:

- Three-side collaboration among intern, mentor, and HRBP.
- Intern growth path, stage tasks, today tasks, weekly tasks, mentor feedback, and question flow.
- Mentor-side structured feedback and teaching rhythm.
- HRBP-side growth operations, attention objects, evidence chain, follow-up loop, and review records.
- Recruiting effectiveness review as a lower-frequency module embedded in HRBP.
- System administration for accounts, roles, batches, templates, and permission boundaries.
- AI assists with growth signal aggregation, question generation, feedback drafts, HR action drafts, and weekly summaries.
- AI output must be treated as draft or evidence organization; it must not replace HRBP, mentor, business, or recruiting decisions.

Use language such as:

- growth signal
- stage task
- mentor observation
- structured feedback
- risk trend
- attention object
- follow-up suggestion
- human confirmation
- action record
- review record
- closed-loop follow-up

Avoid language that implies automatic judgment or punitive decisions.

## UX / Copy Rules

Current product copy is professional, HR-oriented, and evidence-based. Future copy should preserve this tone.

Preferred terms:

- 成长信号
- 阶段任务
- 导师观察
- 结构化反馈
- 风险趋势
- 关注对象
- 跟进建议
- 人工确认
- 行动记录
- 复盘沉淀
- 协同记录
- 成长记录
- 没有进度
- 暂无数据

Avoid terms:

- AI 判定适岗
- AI 决定去留
- 自动淘汰
- 问题员工
- 系统判定失败
- 绩效不合格
- 风险人员
- 表现差
- 不合格实习生

When a module has no real growth data yet, prefer neutral empty-state wording such as `没有进度`, `暂无成长记录`, or `等待首批成长信号`. Do not describe the entire product as temporary or only for opening preparation unless the user explicitly asks.

## Design Rules

The current UI direction is an enterprise AI-HR SaaS dashboard:

- professional
- restrained
- clean
- data-oriented
- slightly AI-forward
- suitable for repeated work
- not a student assignment
- not a generic template admin panel
- not a children's education product

Preserve current patterns:

- role-based workspaces
- dashboard cards and dense but readable work surfaces
- small, consistent labels
- status pills and progress indicators
- human-readable empty states
- GSAP entrance/reveal polish where already present
- lucide-react icons where the project already uses them
- charts through Recharts where already used

Avoid:

- colorful novelty cards
- large cartoon elements
- particle explosions
- strong glow effects
- decorative point-line networks that do not communicate data
- PPT-style flowcharts
- removing operational density just to make the page look simple

When modifying UI, preserve the existing visual language in `src/index.css` and the component patterns already used in `src/App.tsx`.

## Content Preservation Rule

This is one of the highest priority rules for this project.

未经用户明确允许，Agent 不得删除、删减、覆盖或大幅替换项目中已有内容。

具体要求：

1. 默认只允许新增、补充、微调和优化。
2. 不允许擅自删除已有页面、模块、组件、文案、数据、样式或交互。
3. 不允许为了“简化”“重构”“美化”而移除现有内容。
4. 不允许把已有模块整体替换成新模块，除非用户明确说“可以重做”或“可以删除原来的”。
5. 如果某个内容确实建议删除，必须先说明原因，并等待用户确认。
6. 如果需要调整已有内容，优先保留原有信息，只做结构、层级、样式、间距或文案上的优化。
7. 对大型改动，必须先列出将保留什么、将修改什么、是否会删除什么、是否会影响现有功能，并等待用户确认。
8. 修改前应尽量备份关键文件，尤其是 `src/App.tsx` 和 `src/index.css`。
9. 修改完成后必须说明是否删除了任何已有内容。
10. 如果误删内容，必须优先恢复，而不是继续优化。

## Safety Rules for Future Agents

Follow these rules before changing this project:

1. Read this `AGENTS.md` first.
2. Check the actual project directory and, if available, run `git status` before editing. If the current directory is not a Git repository, say so clearly.
3. Confirm the current task scope before editing.
4. Only modify files required for the task.
5. Do not use `sed` or regex batch replacement on large TSX/JSX files.
6. Do not automatically add JSX closing tags without understanding the tree.
7. Do not globally replace `</div>`, `className`, component names, routes, role names, or status labels.
8. Do not infer source code from `dist`.
9. Treat `src/App.tsx` as high risk because it contains routing, pages, state, CRUD, animation, and UI in one large file.
10. Make small edits and run `npm run build` after meaningful changes.
11. If build fails, diagnose the specific error before making more edits.
12. Do not break login, role routing, localStorage persistence, CRUD, collaboration records, or role permissions.
13. Do not modify unrelated pages.
14. Do not refactor the project without explicit user approval.
15. Do not change `package.json`, `vite.config.ts`, `index.html`, or API endpoints unless the user explicitly asks.
16. Do not delete, overwrite, or replace existing content unless the user explicitly approves it.

## Work Protocol

For future tasks in this project:

1. Read `AGENTS.md`.
2. Inspect the relevant files before deciding.
3. State the task scope.
4. State which files you plan to modify.
5. State whether any existing content will be deleted, overwritten, or replaced.
6. If deletion or replacement is needed, wait for user confirmation.
7. Make small, focused changes.
8. Run `npm run build` unless the user explicitly asks not to.
9. Report modified files.
10. Report what changed.
11. Report whether any content was deleted.
12. Report build result.

Do not:

- remake the whole project without approval
- perform large-scale refactors
- delete existing pages
- delete existing modules
- delete existing copy
- modify unrelated modules
- trade working behavior for visual polish
- edit large files without understanding the local structure

## Known Development Notes

- `npm run dev` starts both the local API server and Vite with `node api/server.mjs & vite`.
- `npm run dev:ui` is useful when only the frontend is needed.
- The frontend expects the Vite dev server at `127.0.0.1` according to `vite.config.ts`.
- README documents `VITE_API_BASE` for pointing the frontend at a custom local API port.
- If `DEEPSEEK_API_KEY` is absent, AI generation has local/mock fallback behavior according to README and `src/utils/ai.ts`.
- `src/App.tsx` currently contains duplicated or overlapping local types and logic alongside `src/types/index.ts`; avoid broad type cleanup unless explicitly requested.
- `src/App.tsx` contains significant GSAP code. Animation edits should be scoped and checked in-browser.
- `src/index.css` is the main global style file. Broad CSS changes can affect all routes.
- `dist/` is generated output and should not be edited as source.
- `node_modules/` is installed and should not be edited.

## Verification

After edits, prefer:

- `npm run build` for TypeScript and Vite validation.
- `npm run lint` when the task touches lint-sensitive code or when requested.
- Browser verification for visual/layout changes on the affected route.

This AGENTS.md was generated by scanning the current project files and should be updated when routes, architecture, scripts, or product scope change.
