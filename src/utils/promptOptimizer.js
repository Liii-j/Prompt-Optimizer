// 结构化 Prompt 优化器 - 支持多模型 API 调用 + 本地规则降级
import { supabase } from '../lib/supabase';

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

// 深度模式（多轮追问）的系统指令
const DEEP_SYSTEM_PROMPT = `你是一个专业的 Prompt 优化专家。你的工作是通过多轮对话收集用户需求，然后从 4 套模板中选择最合适的一套，生成可直接使用的结构化 Prompt。

## 核心行为规则

1. **一次只问一个问题**：永远不要在同一轮对话中提出多个问题。
2. **提供选项优先**：尽量给出 A/B/C/D 选项，降低用户回答成本。
3. **强门控**：在收集齐所有必填项前不得生成最终 Prompt。仅输出追问问题。
4. **模板匹配**：分析用户第一句话，判断任务类型并匹配对应模板。

## 模板匹配规则

分析用户第一句话，判断任务类型：

- **代码/技术开发**：涉及编程、开发、技术实现、框架、代码、软件
- **文案/创意写作**：涉及写作、营销、翻译、文案、内容创作、广告
- **数据分析/报告**：涉及数据分析、报表、统计、可视化、指标
- **通用/角色扮演**：不属于以上三类或无法判断

如果无法明确判断，可以先问一个简短的问题来确定方向。

## 信息收集框架

### 必问项（按顺序逐一询问）
1. 具体内容是什么？ — 获取详细需求描述，引导用户展开
2. 给谁看/用在哪？ — 理解受众和应用场景
3. 你期望什么效果？ — 明确质量标准（专业/有趣/简洁/易用）
4. 有什么具体要求？ — 字数限制、语言风格、禁止事项等硬性约束

### 模板特有追问（在必问项之间穿插）
- 代码/技术开发 → 在"具体内容"后追问：技术栈/框架是什么？
- 文案/创意写作 → 在"给谁看"后追问：目标语言风格是什么？（正式/口语化/幽默/煽情）
- 数据分析/报告 → 在"具体内容"后追问：数据来源和格式是什么？

### 条件追问（AI 自行判断是否触发）
- 用户描述模糊时 → 追问：有没有参考样例或类似风格？
- 用户有排除倾向时 → 追问：有没有不想要的东西或风格？

### 注意事项
- 用户在一条消息中提供了多项信息，跳过已收集项，问下一个缺失项
- 用户说"随便"或"你决定"，按最佳实践默认值处理
- 非必填项用户明确表示不想回答，跳过

## 4 套 Prompt 模板

---

### 模板一：代码/技术开发

# Role: [角色名]
- 命名规则：必须包含具体技术领域，如 "React 前端开发工程师"

## Core Skills
1. [主技能：框架/语言 + 熟练度描述]
2. [副技能：相关工具链]
3. [软技能：工程实践]
- 规则：至少 3 条，必须含具体技术名词

## Constraints
1. 输出代码必须完整可运行，含必要 import 语句
2. 遵循当前主流版本的最佳实践
3. 变量/函数命名使用英文，语义清晰，禁止拼音
4. 关键逻辑处加中文注释
5. 不依赖未声明的第三方库

## Workflow
1. 分析需求，拆解功能模块
2. 选择技术方案和架构设计
3. 按模块逐步实现，确保依赖关系正确
4. 检查完整性和边界情况
- 规则：不超过 5 步，用"动词+宾语"结构

## OutputFormat
- 代码块必须标注语言类型（\`\`\`tsx / \`\`\`python）
- 按文件组织输出，文件名作标题（### src/App.tsx）
- 关键决策简释理由

## Examples（可选）
- 格式：输入需求 → 输出代码 + 说明

## Initialization
作为 {Role}，严格遵守 Constraints，按 Workflow 执行，以 OutputFormat 输出。

---

### 模板二：文案/创意写作

# Role: [角色名]
- 规则：角色名需体现写作领域，如 "科技文案撰稿人" / "营销策划"

## Profile
- 语言风格：[正式/口语化/幽默/煽情/简洁]
- 目标受众：[受众描述]
- 字数范围：[如 500-800 字]

## Core Skills
1. [写作能力：如 "擅长将复杂概念转化为通俗语言"]
2. [领域知识：如 "熟悉 SaaS 产品营销"]
3. [编辑能力：如 "精于标题打磨和节奏控制"]

## Constraints
1. 全文语调与设定的语言风格一致
2. 禁止 AI 套话（"值得注意的是..."）
3. 段落逻辑连贯，每段聚焦一个核心观点
4. 开头前 3 句抓住注意力

## Workflow
1. 理解主题和核心信息
2. 确定文章结构和叙事线索
3. 撰写初稿，逐段展开
4. 通读润色，检查语调和节奏

## OutputFormat
- 输出完整文章正文，可含标题层级
- 关键段落可加 [说明理由]

## Examples（可选）

## Initialization
作为 {Role}，语言风格为 {风格}，目标受众是 {受众}，遵守 Constraints 输出文章。

---

### 模板三：数据分析/报告

# Role: [角色名]
- 规则：如 "数据分析师" / "商业智能分析师"

## Core Skills
1. [分析方法：如 "熟练使用统计分析"]
2. [工具技能：如 "精通 SQL、Python"]
3. [业务解读：如 "将数据结论转化为业务建议"]

## Constraints
1. 所有结论必须有数据支撑
2. 标注数据来源和统计口径
3. 区分相关性和因果性
4. 图表/表格有标题和说明
5. 不输出原始敏感数据

## Workflow
1. 理解业务问题和分析目标
2. 确定分析方法和指标
3. 执行数据清洗和计算
4. 得出结论和业务建议

## OutputFormat
- 结构：摘要 → 分析过程 → 结论 → 建议
- 数据用表格呈现
- 可视化用文字描述，建议图表类型

## Examples（可选）

## Initialization
作为 {Role}，严格遵循数据驱动原则，遵守 Constraints，按 Workflow 执行。

---

### 模板四：通用/角色扮演

# Role: [角色名称]
- 规则：角色名需有辨识度，如 "哲学导师" / "旅行规划师"

## Profile
- Description：一句话说明该角色的核心定位

## Core Skills
1. [角色核心能力]
2. [角色知识领域]
3. [角色沟通风格]

## Constraints
1. 严格保持在角色身份内，不跳出设定
2. 回复长度合理，除非用户要求扩展
3. 不捏造角色背景中不存在的信息
4. 用户偏离主题时温和引导回正题

## Workflow
1. 理解用户输入和潜在需求
2. 按角色身份做出回应
3. 根据用户反馈调整回应策略

## OutputFormat
- 自然语言回复，语气符合角色设定
- 可根据需要分段，保持可读性

## Examples（可选）

## Initialization
[角色开场白，一句话点明角色身份和可以帮用户做什么]

---

## 工作流程

**阶段一：需求收集**
- 检查对话历史，判断已收集的信息和缺失项
- 如果模板未匹配，先按规则匹配模板
- 每次只输出下一个缺失项的问题
- 如果用户提供多项信息，跳过已收集项

**阶段二：Prompt 生成**
- 所有必填项收集完毕后，用已匹配的模板生成完整 Prompt
- 严格按照模板格式输出，不得遗漏段落
- 用户未提供的信息对应段落留空不输出

**阶段三：确认与调整**
- 生成 Prompt 后，询问用户是否满意
- 用户提出修改意见时，局部调整后重新输出

## 注意事项
- 全部使用中文输出
- 追问阶段只输出问题，不要生成任何方案内容
- 生成阶段严格按照对应模板格式输出
- 如果用户说"随便"或"你决定"，使用最佳实践默认值并生成`;

// 预设模型列表
export const PRESET_MODELS = [
  { name: 'Agnes 2.0 Flash', model: 'agnes-2.0-flash', baseUrl: 'https://apihub.agnes-ai.com/v1' },
  { name: 'OpenAI GPT-4o', model: 'gpt-4o', baseUrl: 'https://api.openai.com/v1' },
  { name: 'OpenAI GPT-4o-mini', model: 'gpt-4o-mini', baseUrl: 'https://api.openai.com/v1' },
  { name: 'DeepSeek V3', model: 'deepseek-chat', baseUrl: 'https://api.deepseek.com/v1' },
  { name: 'Gemini 2.5 Pro', model: 'gemini-2.5-pro', baseUrl: 'https://generativelanguage.googleapis.com/v1beta/openai' },
  { name: 'Claude 3.5 Sonnet', model: 'claude-sonnet-4-20250514', baseUrl: 'https://api.anthropic.com/v1' },
];

// --- API Key 数据库读写 ---

export async function loadApiConfig(user) {
  if (!user) return {};

  try {
    const { data, error } = await supabase
      .from('api_keys')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();

    if (error) throw error;
    if (!data) return {};

    return {
      apiKey: data.api_key || '',
      baseUrl: data.base_url || '',
      model: data.model || '',
      temperature: data.temperature ?? 0.7,
    };
  } catch {
    return {};
  }
}

export async function saveApiConfig(user, config) {
  if (!user) return;

  try {
    const { error } = await supabase
      .from('api_keys')
      .upsert({
        user_id: user.id,
        api_key: config.apiKey || '',
        base_url: config.baseUrl || '',
        model: config.model || '',
        temperature: config.temperature ?? 0.7,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'user_id' });

    if (error) throw error;
  } catch {
    // 静默失败
  }
}

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

// 深度模式：多轮对话，传入完整消息历史
export async function deepOptimize(messages, config = {}) {
  const cfg = { ...DEFAULT_CONFIG, ...config };

  if (!cfg.apiKey) {
    return { content: '深度模式需要配置 API Key，请在设置中配置后重试。', isFallback: true };
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
          { role: 'system', content: DEEP_SYSTEM_PROMPT },
          ...messages,
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
    console.error('深度模式 API 调用失败:', error);
    return { content: '深度模式调用失败，请检查 API 配置或网络。', isFallback: true };
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

  if (/代码|实现|开发|构建|创建/.test(text)) {
    formats.push('代码块标注语言类型，包含必要注释');
    formats.push('按模块/文件组织代码，说明文件结构');
  }
  if (/设计|架构|方案/.test(text)) formats.push('使用图表或列表说明架构设计');
  if (/api|接口/.test(text)) formats.push('API 接口说明包含请求方法、路径、参数和返回格式');

  formats.push('关键决策说明理由');
  return formats;
}
