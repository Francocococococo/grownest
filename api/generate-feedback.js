function extractJsonText(text) {
  const trimmed = text.trim();
  if (trimmed.startsWith("{")) return trimmed;

  const match = trimmed.match(/\{[\s\S]*\}/);
  return match?.[0] ?? trimmed;
}

function resolveAiConfig() {
  return {
    apiKey: process.env.DEEPSEEK_API_KEY,
    model: process.env.DEEPSEEK_MODEL || "deepseek-v4-flash",
    url: "https://api.deepseek.com/chat/completions",
    missingKeyName: "DEEPSEEK_API_KEY",
  };
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  const config = resolveAiConfig();
  if (!config.apiKey) {
    res.status(500).json({ error: `AI 服务未配置：请在环境变量中设置 ${config.missingKeyName}。` });
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
            content:
              "你是腾讯 HR-AI 实习带教助手。请根据导师观察生成结构化中文反馈，必须只输出 JSON，字段为 highlights, improvements, nextStep, messageToIntern。语气专业、具体、温和，每个字段 1 句话。",
          },
          {
            role: "user",
            content: JSON.stringify(req.body),
          },
        ],
        temperature: 0.3,
      }),
    });

    const data = await aiResponse.json();
    if (!aiResponse.ok) {
      res.status(aiResponse.status).json({ error: data?.error?.message || "AI 生成失败，请稍后重试。" });
      return;
    }

    const text = extractJsonText(data.choices?.[0]?.message?.content || "{}");
    res.status(200).json({ feedback: JSON.parse(text) });
  } catch (error) {
    res.status(500).json({ error: error instanceof Error ? error.message : "AI 生成失败。" });
  }
}
