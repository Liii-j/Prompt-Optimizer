const API_KEY = process.env.AGNES_API_KEY;
const BASE_URL = 'https://apihub.agnes-ai.com/v1';
const MODEL = 'agnes-2.0-flash';

const SYSTEM_PROMPT = `你是一个专业的 Prompt 优化助手。用户会给你一段杂乱的想法或需求描述，你需要将其转化为结构清晰、逻辑严密的 Prompt，用于辅助 AI 编程。

请按以下格式输出 Markdown：

## 角色
你是一个[根据需求描述合适的角色]

## 目标
[用一句话清晰描述要完成的任务]

## 关键要求
1. [从用户输入中提取的关键需求点]
2. ...

## 技术约束
- [根据用户输入推断的技术约束，如语言、框架等]
- [其他合理的约束建议]

## 输入
用户的原始输入内容

## 注意事项
- [补充用户可能遗漏的重要细节]
- ...`;

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { prompt } = req.body;

    if (!prompt) {
      return res.status(400).json({ error: 'Missing prompt' });
    }

    const response = await fetch(`${BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_KEY}`,
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: prompt },
        ],
        temperature: 0.7,
        max_tokens: 2000,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('API Error:', errorText);
      return res.status(500).json({ error: 'API request failed' });
    }

    const data = await response.json();
    return res.status(200).json({ result: data.choices[0].message.content });
  } catch (error) {
    console.error('Server error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
