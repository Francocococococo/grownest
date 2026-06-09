# GrowNest 鹅苗成长舱

面向业务部实习生的 AI 成长导航与带教协同系统 Demo。

## Demo 重点

- 实习生成长端展示成长路径、任务、导师问答和支持项，不暴露内部关注标签。
- 导师带教端突出今日带教优先事项，并支持 AI 结构化反馈草稿。
- HRBP 成长运营台展示关注状态、证据链、规则触发原因和干预闭环，并内置低频使用的招聘效能复盘模块。
- 系统管理后台用于配置账号角色、批次、岗位成长模板和权限边界。
- AI 生成内容均保留“规则先判定、证据再生成、人工确认”的可靠性护栏。

## 本地运行

```bash
npm install
npm run dev
```

打开终端显示的本地地址，默认通常是 `http://127.0.0.1:5173/`。

## 接入真实 AI

页面中的 AI 生成能力会统一调用 `/api/generate`，使用 DeepSeek API 生成真实内容；`/api/generate-feedback` 仅作为旧版兼容接口保留。

本地开发：

```bash
cp .env.example .env
```

然后在 `.env` 中填写：

```text
DEEPSEEK_API_KEY=你的 DeepSeek API Key
DEEPSEEK_MODEL=deepseek-v4-flash
```

重新启动开发服务后即可使用真实 AI 生成反馈。未配置 Key 时，接口会返回本地演示 mock，页面会标记为“演示兜底样例”。

如本地 API 端口 `3001` 已被占用，可释放该端口，或单独启动 API 时指定端口：

```bash
INTERNFLOW_API_PORT=3002 npm run dev:api
```

前端也需要指向同一个地址：

```text
VITE_API_BASE=http://127.0.0.1:3002
```

如确实处在需要跳过证书校验的本地 VPN/代理调试环境，可显式设置：

```bash
DEEPSEEK_ALLOW_INSECURE_TLS=true npm run dev:api
```

## 打包

```bash
npm run build
```

打包产物会生成在 `dist/` 目录。

## 本地预览打包结果

```bash
npm run preview
```

## 部署到 Vercel

1. 将项目推送到 GitHub。
2. 在 Vercel 新建项目并选择该仓库。
3. Framework Preset 选择 `Vite`。
4. Build Command 使用 `npm run build`。
5. Output Directory 使用 `dist`。
6. 在 Environment Variables 中添加 `DEEPSEEK_API_KEY`，可选添加 `DEEPSEEK_MODEL`。
7. 点击 Deploy。

## 项目结构

```text
src/
  App.tsx         # 单页 Demo 主界面与组件
  data/mock.ts    # 实习生、风险、图表等基础演示数据
  lib/utils.ts    # className 合并工具
  index.css       # Tailwind 与全局视觉样式
api/
  generate.js          # Vercel 线上通用 DeepSeek 生成接口
  generate-feedback.js # 兼容旧版 AI 反馈生成接口
  server.mjs           # 本地 DeepSeek API 代理
vite.config.ts         # Vite 本地开发配置
```
