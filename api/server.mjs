// InternFlow 本地 API 服务器 — 代理 DeepSeek API
// 运行方式：node api/server.mjs

import { createServer } from 'node:http'
import { request as httpsRequest } from 'node:https'
import { readFileSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

// 读取 .env 文件
const __dirname = dirname(fileURLToPath(import.meta.url))
const envPath = resolve(__dirname, '..', '.env')
let API_KEY = ''
let MODEL = 'deepseek-v4-flash'
let ALLOW_INSECURE_TLS = process.env.DEEPSEEK_ALLOW_INSECURE_TLS === 'true'

try {
  const envContent = readFileSync(envPath, 'utf8')
  for (const line of envContent.split('\n')) {
    const eqIdx = line.indexOf('=')
    if (eqIdx === -1) continue
    const key = line.substring(0, eqIdx).trim()
    const val = line.substring(eqIdx + 1).trim()
    if (key === 'DEEPSEEK_API_KEY') API_KEY = val
    if (key === 'DEEPSEEK_MODEL') MODEL = val
    if (key === 'DEEPSEEK_ALLOW_INSECURE_TLS') ALLOW_INSECURE_TLS = val === 'true'
  }
} catch {
  console.warn('[InternFlow API] ⚠️  未找到 .env 文件')
}

const PORT = Number(process.env.INTERNFLOW_API_PORT || 3001)
const HOST = process.env.INTERNFLOW_API_HOST || '127.0.0.1'

if (!API_KEY || API_KEY === 'sk-your_api_key_here' || API_KEY === 'sk-your_deepseek_api_key_here') {
  console.warn('[InternFlow API] ⚠️  DEEPSEEK_API_KEY 未配置，AI 生成功能将返回未连接错误')
}

/** 从 req.url 中提取路径部分 */
function getPath(raw) {
  if (!raw) return ''
  if (raw.startsWith('http')) {
    try { return new URL(raw).pathname } catch { return raw }
  }
  return raw.split('?')[0]
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = []
    req.on('data', c => chunks.push(c))
    req.on('end', () => {
      try { resolve(JSON.parse(Buffer.concat(chunks).toString() || '{}')) }
      catch (e) { reject(e) }
    })
    req.on('error', reject)
  })
}

function extractJson(text) {
  const t = text.trim()
  const sanitize = value => value.replace(/,\s*([}\]])/g, '$1')
  if (t.startsWith('{')) return sanitize(t)
  const m = t.match(/\{[\s\S]*\}/)
  return sanitize(m?.[0] ?? t)
}

function scenarioPrompt(type) {
  const prompts = {
    feedback: '你是腾讯 HR-AI 实习带教助手。请根据导师观察生成结构化中文反馈，必须只输出 JSON，字段为 highlights, improvements, nextStep, messageToIntern。语气专业、具体、温和，每个字段 1 句话。',
    questions: '你是腾讯实习生成长教练。请基于实习生画像、任务状态、成长路径，以及用户传入的 focusTopic/studentDraft，生成给导师沟通用的 3 个高质量问题。必须只输出 JSON，字段为 questions，值为 3 个中文字符串数组。三条问题必须紧扣 focusTopic：如果 focusTopic 是业务指标，就围绕指标拆解、指标与任务关系、指标学习资源；如果是需求评审，就围绕会前材料、评审中关注点、会后复盘；如果是合格水平，就围绕能力标准、差距诊断、短期补齐路径。不要每次都生成同一套通用问题。',
    report: '你是腾讯 HRBP 的 AI 适岗分析助手。请基于实习生成长关注数据、岗位进度、导师反馈和跨端协同记录，生成一份第 3 周实习生适岗情况周报。必须只输出 JSON，字段为 report，值为中文周报正文。正文包含标题、整体情况、需关注原因、岗位差异、下周建议动作、招聘同步摘要。使用“稳定推进/需要支持/重点关注”，不要使用“低风险/中风险/高风险”。语气专业、克制、可直接复制到周会材料。',
    hrAction: '你是腾讯 HR-AI 成长关注协同助手。请根据单个实习生的关注分析和 HR 点击的动作类型，生成一条可写入协同流的动作记录。必须只输出 JSON，字段为 title, detail。title 不超过 24 个汉字，detail 1-2 句，明确给 HR 或导师下一步要做什么，不要给留用或淘汰结论。',
    dailyPlan: '你是腾讯实习生成长导航 AI。请基于前端传入的 frontendSuggestion、当天任务、岗位、成长支持项、mentorFeedbacks/latestFeedback 和完成情况，生成一条产品内“AI 今日建议”。它不是单纯任务排序，而是把当天任务和导师反馈组合成可执行建议。必须只输出 JSON，字段为 recommendation, reason, actions。recommendation 是一句今日判断，必须点到当天任务或导师反馈中的至少一个具体信息；reason 是一句说明为什么这样建议，必须引用导师反馈或说明暂无导师反馈时基于任务判断；actions 是 3 个中文动作数组，每条都要能对应到当天任务或导师反馈。没有导师反馈时不要编造反馈，只基于任务和支持项给轻量建议。语气要像产品内动态建议，不要写成长报告，不要泛泛鼓励。',
  }
  return prompts[type] || prompts.feedback
}

async function generateWithDeepSeek(type, body) {
  const result = await callDeepSeek({
    model: MODEL,
    messages: [
      {
        role: 'system',
        content: scenarioPrompt(type),
      },
      { role: 'user', content: JSON.stringify(body) },
    ],
    temperature: type === 'questions' ? 0.55 : type === 'report' ? 0.45 : 0.3,
  })

  if (result.status !== 200) {
    throw Object.assign(new Error(result.data?.error?.message || 'AI 生成失败'), { status: result.status, data: result.data })
  }

  const content = result.data?.choices?.[0]?.message?.content || '{}'
  const text = extractJson(content)
  return JSON.parse(text)
}

function sendJSON(res, code, data) {
  res.writeHead(code, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
  })
  res.end(JSON.stringify(data))
}

/**
 * 用原生 https 模块调用 DeepSeek API
 * 比内置 fetch 更稳定，兼容性更好
 */
function callDeepSeek(payload) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(payload)

    const options = {
      hostname: 'api.deepseek.com',
      port: 443,
      path: '/chat/completions',
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(data),
      },
      timeout: 60000,
      rejectUnauthorized: !ALLOW_INSECURE_TLS,
    }

    const req = httpsRequest(options, (res) => {
      const chunks = []
      res.on('data', c => chunks.push(c))
      res.on('end', () => {
        const body = Buffer.concat(chunks).toString()
        try {
          resolve({ status: res.statusCode, data: JSON.parse(body) })
        } catch {
          resolve({ status: res.statusCode, data: body })
        }
      })
    })

    req.on('error', (e) => {
      console.error('[InternFlow API] HTTPS 请求错误:', e.message)
      reject(e)
    })

    req.on('timeout', () => {
      req.destroy()
      reject(new Error('DeepSeek API 请求超时（60秒）'))
    })

    req.write(data)
    req.end()
  })
}

const server = createServer(async (req, res) => {
  // CORS preflight
  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    })
    res.end()
    return
  }

  const url = getPath(req.url)

  // 健康检查
  if (url === '/api/ping') {
    sendJSON(res, 200, { ok: true, model: MODEL, keySet: !!API_KEY })
    return
  }

  // DeepSeek 通用生成接口
  if (url === '/api/generate' && req.method === 'POST') {
    try {
      const body = await readBody(req)
      if (!API_KEY || API_KEY === 'sk-your_api_key_here' || API_KEY === 'sk-your_deepseek_api_key_here') {
        sendJSON(res, 503, { error: 'DEEPSEEK_API_KEY 未配置，AI 服务未连接。' })
        return
      }
      console.log(`[InternFlow API] 收到 ${body.type || 'feedback'} 生成请求，调用 DeepSeek...`)
      const output = await generateWithDeepSeek(body.type || 'feedback', body.payload || body)
      sendJSON(res, 200, { output })
    } catch (err) {
      console.error('[InternFlow API] ❌ 错误:', err.message || err)
      sendJSON(res, err.status || 500, { error: err.message || 'AI 生成失败' })
    }
    return
  }

  // DeepSeek 反馈接口，兼容旧前端
  if (url === '/api/generate-feedback' && req.method === 'POST') {
    try {
      const body = await readBody(req)
      if (!API_KEY || API_KEY === 'sk-your_api_key_here' || API_KEY === 'sk-your_deepseek_api_key_here') {
        sendJSON(res, 503, { error: 'DEEPSEEK_API_KEY 未配置，AI 服务未连接。' })
        return
      }
      console.log('[InternFlow API] 收到请求，调用 DeepSeek...')

      const feedback = await generateWithDeepSeek('feedback', body)
      console.log('[InternFlow API] ✅ 成功')
      sendJSON(res, 200, { feedback })
    } catch (err) {
      console.error('[InternFlow API] ❌ 错误:', err.message || err)
      sendJSON(res, 500, { error: err.message || 'AI 生成失败' })
    }
    return
  }

  // 404
  sendJSON(res, 404, { error: 'Not found', url })
})

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.warn(`[InternFlow API] ⚠️  ${HOST}:${PORT} 已被占用。若已有 API 服务在运行，可继续使用前端；否则请释放端口或设置 INTERNFLOW_API_PORT。`)
    process.exit(0)
  }
  console.error('[InternFlow API] ❌ 服务启动失败:', err.message || err)
  process.exit(1)
})

server.listen(PORT, HOST, () => {
  console.log(`[InternFlow API] 🚀 API 服务器运行在 http://${HOST}:${PORT}`)
  console.log(`[InternFlow API] model=${MODEL}, key=${API_KEY ? '已设置 ✅' : '未设置 ❌'}`)
  if (ALLOW_INSECURE_TLS) {
    console.warn('[InternFlow API] ⚠️  已允许不安全 TLS，仅建议在本地 VPN/代理调试时使用。')
  }
})
