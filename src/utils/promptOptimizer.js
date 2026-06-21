const API_KEY = import.meta.env.VITE_AGNES_API_KEY;
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

export async function optimizePrompt(userInput) {
  if (!API_KEY) {
    console.warn('未配置 API Key，使用本地优化');
    return localOptimize(userInput);
  }

  try {
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
          { role: 'user', content: userInput },
        ],
        temperature: 0.7,
        max_tokens: 2000,
      }),
    });

    if (!response.ok) {
      throw new Error(`API 请求失败: ${response.status}`);
    }

    const data = await response.json();
    return data.choices[0].message.content;
  } catch (error) {
    console.error('LLM API 调用失败，回退到本地优化:', error);
    return localOptimize(userInput);
  }
}

function localOptimize(input) {
  const trimmed = input.trim();
  if (!trimmed) return '';

  const intent = detectIntent(trimmed);
  let result = '';

  result += `## 目标\n${intent}\n\n`;

  const keyPoints = extractKeyPoints(trimmed);
  if (keyPoints.length > 0) {
    result += `## 关键要求\n`;
    keyPoints.forEach((point, i) => {
      result += `${i + 1}. ${point}\n`;
    });
    result += '\n';
  }

  const constraints = suggestConstraints(trimmed);
  if (constraints.length > 0) {
    result += `## 技术约束\n`;
    constraints.forEach((c) => {
      result += `- ${c}\n`;
    });
    result += '\n';
  }

  result += `## 输出要求\n`;
  result += `- 代码结构清晰，包含必要的注释\n`;
  result += `- 遵循最佳实践和设计模式\n`;
  result += `- 确保代码可运行且无错误\n`;

  return result;
}

function detectIntent(text) {
  const lower = text.toLowerCase();

  if (/做个|创建|开发|构建|实现|写一个|制作/.test(lower)) {
    const match = text.match(/(?:做个|创建|开发|构建|实现|写一个|制作)\s*(.+?)(?:[，。,.]|$)/);
    return match ? `构建${match[1].trim()}` : text;
  }

  if (/修复|解决|调试|debug|fix/.test(lower)) {
    return `修复问题：${text}`;
  }

  if (/优化|改进|重构|refactor/.test(lower)) {
    return `优化改进：${text}`;
  }

  return text;
}

function extractKeyPoints(text) {
  const points = [];
  const sentences = text.split(/[，。；\n,;]/).filter((s) => s.trim());

  for (const sentence of sentences) {
    const trimmed = sentence.trim();
    if (trimmed.length < 2) continue;
    if (/^(?:做个|创建|开发|构建|实现|写一个|制作)/.test(trimmed)) continue;
    points.push(trimmed);
  }

  return points;
}

function suggestConstraints(text) {
  const constraints = [];
  const lower = text.toLowerCase();

  if (/react|vue|angular|svelte/.test(lower)) {
    const framework = text.match(/(react|vue|angular|svelte)/i)?.[1];
    constraints.push(`使用 ${framework} 框架`);
  }

  if (/typescript|ts/.test(lower)) {
    constraints.push('使用 TypeScript');
  }

  if (/tailwind|css/.test(lower)) {
    constraints.push('使用 Tailwind CSS 进行样式处理');
  }

  if (/响应|移动|手机|适配/.test(lower)) {
    constraints.push('支持响应式布局，适配移动端');
  }

  if (/测试|test/.test(lower)) {
    constraints.push('编写单元测试');
  }

  if (constraints.length === 0) {
    constraints.push('代码简洁、可维护');
  }

  return constraints;
}
