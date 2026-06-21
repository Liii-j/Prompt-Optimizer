export async function optimizePrompt(userInput) {
  try {
    const response = await fetch('/api/optimize', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ prompt: userInput }),
    });

    if (!response.ok) {
      throw new Error(`API 请求失败: ${response.status}`);
    }

    const data = await response.json();
    return data.result;
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
