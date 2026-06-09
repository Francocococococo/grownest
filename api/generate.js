function extractJsonText(text) {
  const trimmed = text.trim();
  const sanitize = (value) => value.replace(/,\s*([}\]])/g, "$1");
  if (trimmed.startsWith("{")) return sanitize(trimmed);

  const match = trimmed.match(/\{[\s\S]*\}/);
  return sanitize(match?.[0] ?? trimmed);
}

function resolveAiConfig() {
  return {
    apiKey: process.env.DEEPSEEK_API_KEY,
    model: process.env.DEEPSEEK_MODEL || "deepseek-v4-flash",
    url: "https://api.deepseek.com/chat/completions",
    missingKeyName: "DEEPSEEK_API_KEY",
  };
}

function scenarioPrompt(type) {
  const prompts = {
    feedback:
      "你是腾讯 HR-AI 实习带教助手。请根据导师观察生成结构化中文反馈，必须只输出 JSON，字段为 highlights, improvements, nextStep, messageToIntern。语气专业、具体、温和，每个字段 1 句话。",
    questions:
      "你是腾讯实习生成长教练。请基于实习生画像、任务状态、成长路径，以及用户传入的 focusTopic/studentDraft，生成给导师沟通用的 3 个高质量问题。必须只输出 JSON，字段为 questions，值为 3 个中文字符串数组。三条问题必须紧扣 focusTopic：如果 focusTopic 是业务指标，就围绕指标拆解、指标与任务关系、指标学习资源；如果是需求评审，就围绕会前材料、评审中关注点、会后复盘；如果是合格水平，就围绕能力标准、差距诊断、短期补齐路径。不要每次都生成同一套通用问题。",
    report:
      "你是腾讯 HRBP 的 AI 适岗分析助手。请基于实习生成长关注数据、岗位进度、导师反馈和跨端协同记录，生成一份第 3 周实习生适岗情况周报。必须只输出 JSON，字段为 report，值为中文周报正文。正文包含标题、整体情况、需关注原因、岗位差异、下周建议动作、招聘同步摘要。使用“稳定推进/需要支持/重点关注”，不要使用“低风险/中风险/高风险”。语气专业、克制、可直接复制到周会材料。",
    hrAction:
      "你是腾讯 HR-AI 成长关注协同助手。请根据单个实习生的关注分析和 HR 点击的动作类型，生成一条可写入协同流的动作记录。必须只输出 JSON，字段为 title, detail。title 不超过 24 个汉字，detail 1-2 句，明确给 HR 或导师下一步要做什么，不要给留用或淘汰结论。",
    dailyPlan:
      "你是腾讯实习生成长导航 AI。请基于前端传入的 frontendSuggestion、当天任务、岗位、成长支持项、mentorFeedbacks/latestFeedback 和完成情况，生成一条产品内“AI 今日建议”。它不是单纯任务排序，而是把当天任务和导师反馈组合成可执行建议。必须只输出 JSON，字段为 recommendation, reason, actions。recommendation 是一句今日判断，必须点到当天任务或导师反馈中的至少一个具体信息；reason 是一句说明为什么这样建议，必须引用导师反馈或说明暂无导师反馈时基于任务判断；actions 是 3 个中文动作数组，每条都要能对应到当天任务或导师反馈。没有导师反馈时不要编造反馈，只基于任务和支持项给轻量建议。语气要像产品内动态建议，不要写成长报告，不要泛泛鼓励。",
  };
  return prompts[type] || prompts.feedback;
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  const config = resolveAiConfig();
  const type = req.body?.type || "feedback";
  if (!config.apiKey) {
    res.status(503).json({ error: `${config.missingKeyName} 未配置，AI 服务未连接。` });
    return;
  }

  try {
    const aiResponse = await fetch(config.url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${config.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: config.model,
        messages: [
          {
            role: "system",
            content: scenarioPrompt(type),
          },
          {
            role: "user",
            content: JSON.stringify(req.body?.payload || req.body),
          },
        ],
        temperature: type === "questions" ? 0.55 : type === "report" ? 0.45 : 0.3,
      }),
    });

    const data = await aiResponse.json();
    if (!aiResponse.ok) {
      res.status(aiResponse.status).json({ error: data?.error?.message || "AI 生成失败，请稍后重试。" });
      return;
    }

    const text = extractJsonText(data.choices?.[0]?.message?.content || "{}");
    res.status(200).json({ output: JSON.parse(text) });
  } catch (error) {
    res.status(500).json({ error: error instanceof Error ? error.message : "AI 生成失败。" });
  }
}
