/**
 * 优化用户输入的 Prompt
 * 当前使用本地规则处理，预留 LLM API 接口位置
 */
export async function optimizePrompt(userInput) {
  // TODO: 接入 LLM API
  // const response = await fetch('your-api-endpoint', {
  //   method: 'POST',
  //   headers: { 'Content-Type': 'application/json' },
  //   body: JSON.stringify({ prompt: userInput })
  // });
  // const data = await response.json();
  // return data.optimizedPrompt;

  // 模拟异步延迟
  await new Promise((resolve) => setTimeout(resolve, 600));

  return localOptimize(userInput);
}

function localOptimize(input) {
  const trimmed = input.trim();
  if (!trimmed) return '';

  // 提取关键信息
  const lines = trimmed.split('\n').filter((l) => l.trim());

  // 尝试识别意图
  const intent = detectIntent(trimmed);

  // 构建结构化 Prompt
  let result = '';

  result += `## 目标\n${intent}\n\n`;

  // 提取关键要点
  const keyPoints = extractKeyPoints(trimmed);
  if (keyPoints.length > 0) {
    result += `## 关键要求\n`;
    keyPoints.forEach((point, i) => {
      result += `${i + 1}. ${point}\n`;
    });
    result += '\n';
  }

  // 添加技术约束建议
  const constraints = suggestConstraints(trimmed);
  if (constraints.length > 0) {
    result += `## 技术约束\n`;
    constraints.forEach((c) => {
      result += `- ${c}\n`;
    });
    result += '\n';
  }

  // 添加输出格式建议
  result += `## 输出要求\n`;
  result += `- 代码结构清晰，包含必要的注释\n`;
  result += `- 遵循最佳实践和设计模式\n`;
  result += `- 确保代码可运行且无错误\n`;

  return result;
}

function detectIntent(text) {
  const lower = text.toLowerCase();

  if (/做个|创建|开发|构建|实现|写一个|制作/.test(lower)) {
    // 提取"做什么"的部分
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
    // 跳过太短的句子（可能是语气词）
    if (trimmed.length < 2) continue;
    // 跳过意图句（已在目标中体现）
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
