// 结构化 Prompt 优化器 - 支持多模型 API 调用 + 本地规则降级

// 默认 API 配置
const DEFAULT_CONFIG = {
  apiKey: import.meta.env.VITE_AGNES_API_KEY || '',
  baseUrl: import.meta.env.VITE_API_BASE_URL || 'https://apihub.agnes-ai.com/v1',
  model: import.meta.env.VITE_MODEL_NAME || 'agnes-2.0-flash',
  temperature: 0.7,
  maxTokens: 4096,
};

// 结构化 Prompt 的系统指令
const SYSTEM_PROMPT = `你是一个专业的 Prompt 工程师。用户会给你一段杂乱的想法或需求描述，你需要将其转化为一个完整的、结构化的 Prompt。

请严格按照以下模板格式输出 Markdown：

---

# Role: [根据需求设定一个精准的角色名]

## Profile
- Author: Prompt Optimizer
- Version: 1.0
- Language: 中文
- Description: [一句话描述该角色的核心职责]

### Skills
1. [核心技能1：与任务直接相关的能力]
2. [核心技能2：补充技能]
3. [核心技能3：工具或方法论技能]

## Rules
1. [必须遵守的规则1]
2. [必须遵守的规则2]
3. [必须遵守的规则3]
4. [禁止做的事情]

## Workflow
1. 首先，[第一步：理解与分析]
2. 然后，[第二步：规划与设计]
3. 接着，[第三步：执行与实现]
4. 最后，[第四步：验证与输出]

## OutputFormat
- [输出格式要求1]
- [输出格式要求2]

## Initialization
作为<Role>，你必须遵守上述 Rules，按照 Workflow 执行任务，并以 OutputFormat 指定的格式输出结果。

---

注意事项：
- 角色名要精准，能体现专业领域
- Skills 要具体、可操作，不要泛泛而谈
- Rules 要包含正面要求和负面约束
- Workflow 步骤要清晰、有逻辑顺序
- 根据用户输入自动推断技术栈、框架等约束
- 如果用户输入信息不足，合理补充最佳实践建议
- 全部使用中文输出`;

// 预设模型列表
export const PRESET_MODELS = [
  { name: 'Agnes 2.0 Flash', model: 'agnes-2.0-flash', baseUrl: 'https://apihub.agnes-ai.com/v1' },
  { name: 'OpenAI GPT-4o', model: 'gpt-4o', baseUrl: 'https://api.openai.com/v1' },
  { name: 'OpenAI GPT-4o-mini', model: 'gpt-4o-mini', baseUrl: 'https://api.openai.com/v1' },
  { name: 'DeepSeek V3', model: 'deepseek-chat', baseUrl: 'https://api.deepseek.com/v1' },
  { name: 'Gemini 2.5 Pro', model: 'gemini-2.5-pro', baseUrl: 'https://generativelanguage.googleapis.com/v1beta/openai' },
  { name: 'Claude 3.5 Sonnet', model: 'claude-sonnet-4-20250514', baseUrl: 'https://api.anthropic.com/v1' },
];

// 核心优化函数：优先调用 API，失败则降级到本地规则
export async function optimizePrompt(userInput, config = {}) {
  const cfg = { ...DEFAULT_CONFIG, ...config };

  if (!cfg.apiKey) {
    console.warn('未配置 API Key，使用本地规则优化');
    return { content: localOptimize(userInput), isFallback: true };
  }

  try {
    const response = await fetch(`${cfg.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${cfg.apiKey}`,
      },
      body: JSON.stringify({
        model: cfg.model,
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: userInput },
        ],
        temperature: cfg.temperature,
        max_tokens: cfg.maxTokens,
      }),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(`API 请求失败 (${response.status}): ${errorBody}`);
    }

    const data = await response.json();
    const text = data.choices?.[0]?.message?.content || '优化失败：未返回内容';
    return { content: text, isFallback: false };
  } catch (error) {
    console.error('API 调用失败，回退到本地规则优化:', error);
    return { content: localOptimize(userInput), isFallback: true };
  }
}

// 本地规则优化（降级方案：通过正则匹配技术栈，自动生成结构化 Prompt）
function localOptimize(input) {
  const trimmed = input.trim();
  if (!trimmed) return '';

  const role = detectRole(trimmed);
  const description = generateDescription(trimmed, role);
  const skills = extractSkills(trimmed);
  const rules = generateRules(trimmed);
  const workflow = generateWorkflow(trimmed);
  const outputFormat = generateOutputFormat(trimmed);

  return `# Role: ${role}

## Profile
- Author: Prompt Optimizer
- Version: 1.0
- Language: 中文
- Description: ${description}

### Skills
${skills.map((s, i) => `${i + 1}. ${s}`).join('\n')}

## Rules
${rules.map((r, i) => `${i + 1}. ${r}`).join('\n')}

## Workflow
${workflow.map((w, i) => `${i + 1}. ${w}`).join('\n')}

## OutputFormat
${outputFormat.map((o) => `- ${o}`).join('\n')}

## Initialization
作为${role}，你必须遵守上述 Rules，按照 Workflow 执行任务，并以 OutputFormat 指定的格式输出结果。`;
}

// --- 角色检测 ---

function detectRole(text) {
  if (/前端|页面|UI|界面|组件|React|Vue|CSS|样式/.test(text)) return '前端开发工程师';
  if (/后端|API|接口|数据库|服务器|Server/.test(text)) return '后端开发工程师';
  if (/全栈|完整项目|前后端/.test(text)) return '全栈开发工程师';
  if (/算法|数据|分析|模型|机器学习|AI/.test(text)) return '算法工程师';
  if (/文档|说明|README|注释/.test(text)) return '技术文档工程师';
  if (/测试|单元测试|e2e|bug|修复/.test(text)) return 'QA 测试工程师';
  if (/设计|原型|交互|UX/.test(text)) return 'UI/UX 设计师';
  if (/脚本|自动化|工具|CLI/.test(text)) return '自动化脚本工程师';
  return '高级软件工程师';
}

function generateDescription(text, role) {
  const action = detectAction(text);
  return `${role}，专注于${action}，能够将模糊的需求转化为高质量的实现方案。`;
}

function detectAction(text) {
  if (/创建|构建|开发|实现|做个|写一个|制作/.test(text)) return '从零构建高质量解决方案';
  if (/修复|解决|调试|debug|fix|bug/.test(text)) return '精准定位并修复技术问题';
  if (/优化|改进|重构|refactor|性能/.test(text)) return '系统性优化和改进现有方案';
  if (/设计|架构|规划/.test(text)) return '设计清晰合理的技术架构';
  return '解决复杂的技术问题';
}

// --- 技能提取：根据输入中的技术关键词匹配 ---

function extractSkills(text) {
  const skills = [];
  const lower = text.toLowerCase();

  if (/react|next\.?js/.test(lower)) skills.push('精通 React 生态（Hooks、状态管理、性能优化）');
  if (/vue|nuxt/.test(lower)) skills.push('精通 Vue 生态（Composition API、Pinia、Vue Router）');
  if (/typescript|ts\b/.test(lower)) skills.push('熟练使用 TypeScript 进行类型安全开发');
  if (/python|django|flask|fastapi/.test(lower)) skills.push('精通 Python 及主流 Web 框架');
  if (/node|express|koa|nest/.test(lower)) skills.push('精通 Node.js 后端开发');
  if (/java|spring/.test(lower)) skills.push('精通 Java 及 Spring 生态');
  if (/go|golang/.test(lower)) skills.push('精通 Go 语言及并发编程');
  if (/rust/.test(lower)) skills.push('精通 Rust 系统编程');

  if (/tailwind|css|样式|styled/.test(lower)) skills.push('熟练使用现代 CSS 方案（Tailwind CSS、CSS Modules 等）');
  if (/数据库|sql|mysql|postgres|mongo/.test(lower)) skills.push('熟练设计和使用关系型/非关系型数据库');
  if (/api|接口|rest|graphql/.test(lower)) skills.push('熟练设计和实现 RESTful / GraphQL API');
  if (/测试|unit test|jest|vitest/.test(lower)) skills.push('熟练编写单元测试和集成测试');
  if (/docker|容器|部署|devops/.test(lower)) skills.push('熟悉容器化部署和 DevOps 流程');
  if (/响应|移动|适配|mobile/.test(lower)) skills.push('精通响应式设计和移动端适配');

  if (skills.length === 0) {
    skills.push('快速理解需求并转化为技术方案');
    skills.push('编写清晰、可维护、高质量的代码');
    skills.push('遵循行业最佳实践和设计模式');
  }
  if (skills.length < 3) skills.push('良好的问题分析与解决能力');
  if (skills.length < 3) skills.push('注重代码质量和工程规范');

  return skills.slice(0, 5);
}

// --- 规则生成 ---

function generateRules(text) {
  const rules = [];
  const lower = text.toLowerCase();

  rules.push('严格遵循用户提出的需求，不擅自改变需求方向');
  rules.push('代码必须结构清晰、命名规范、包含必要注释');

  if (/typescript|ts\b/.test(lower)) rules.push('使用 TypeScript，避免 any 类型，充分利用类型系统');
  if (/react/.test(lower)) rules.push('使用函数组件和 Hooks，避免类组件');
  if (/性能|优化/.test(lower)) rules.push('关注性能优化，避免不必要的渲染和计算');
  if (/安全|auth|登录|权限/.test(lower)) rules.push('注意安全性，对用户输入进行校验和过滤');

  rules.push('不要编造不存在的 API 或库，只使用真实存在的技术');
  rules.push('如果需求信息不足，主动提出合理假设并说明');

  return rules;
}

// --- 工作流生成：根据任务类型选择不同步骤 ---

function generateWorkflow(text) {
  const steps = [];

  if (/修复|bug|debug|fix/.test(text)) {
    steps.push('分析用户描述的问题现象，定位可能的根因');
    steps.push('检查相关代码逻辑，确认问题所在');
    steps.push('提出修复方案，给出修改后的完整代码');
    steps.push('说明修复原理，并给出防止复现的建议');
  } else if (/优化|重构|refactor/.test(text)) {
    steps.push('理解现有代码的结构和问题点');
    steps.push('分析可优化的方向（性能、可读性、架构等）');
    steps.push('给出优化后的完整代码，标注关键改动');
    steps.push('对比说明优化前后的差异和收益');
  } else {
    steps.push('理解并分析用户需求，明确目标和约束条件');
    steps.push('设计技术方案，包括架构、数据流和关键模块');
    steps.push('逐步实现代码，确保每一步都可运行');
    steps.push('给出完整可运行的代码，附带使用说明');
  }

  return steps;
}

// --- 输出格式生成 ---

function generateOutputFormat(text) {
  const formats = ['使用 Markdown 格式输出，结构清晰'];
  const lower = text.toLowerCase();

  if (/代码|实现|开发|构建|创建/.test(text)) {
    formats.push('代码块标注语言类型，包含必要注释');
    formats.push('按模块/文件组织代码，说明文件结构');
  }
  if (/设计|架构|方案/.test(text)) formats.push('使用图表或列表说明架构设计');
  if (/api|接口/.test(text)) formats.push('API 接口说明包含请求方法、路径、参数和返回格式');

  formats.push('关键决策说明理由');
  return formats;
}
