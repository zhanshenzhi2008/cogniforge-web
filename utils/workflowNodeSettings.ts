/**
 * 工作流节点设置总表（产品/开发对照）。
 * 与编辑器抽屉字段对齐；改抽屉时同步更新本表与单测。
 * 注意：不依赖 workflowNodeMeta（其拉 icons，vitest 下易解析失败）。
 */

export type WorkflowNodeKind =
  | 'start'
  | 'end'
  | 'llm'
  | 'agent'
  | 'team'
  | 'condition'
  | 'loop'
  | 'http'
  | 'code'
  | 'delay'
  | 'wait'
  | 'search'
  | 'subflow'
  | 'input'
  | 'output'

/** 与 WORKFLOW_PALETTE_TYPES 保持一致 */
export const WORKFLOW_SETTINGS_PALETTE: WorkflowNodeKind[] = [
  'start',
  'end',
  'llm',
  'agent',
  'team',
  'search',
  'subflow',
  'condition',
  'loop',
  'http',
  'code',
  'delay',
  'wait',
]

export type WorkflowNodeFieldSpec = {
  /** 抽屉 / data 主键 */
  key: string
  /** 中文名 */
  labelZh: string
  /** 是否保存/试跑必填 */
  required?: boolean
  /** 简要说明 */
  note?: string
}

export type WorkflowNodeSettingsSpec = {
  kind: WorkflowNodeKind
  /** 调色板是否可拖入（input/output 仅旧图） */
  inPalette: boolean
  /** 画布副文案来源摘要 */
  caption: string
  fields: WorkflowNodeFieldSpec[]
}

/** 所有节点共用：显示名 */
const NAME_FIELD: WorkflowNodeFieldSpec = {
  key: 'name',
  labelZh: '节点名称',
  note: '画布主标题',
}

export const WORKFLOW_NODE_SETTINGS: WorkflowNodeSettingsSpec[] = [
  {
    kind: 'start',
    inPalette: true,
    caption: '入参变量名列表',
    fields: [
      NAME_FIELD,
      { key: 'variables', labelZh: '入参变量', note: 'name/type/required/default/description；调试表单跟此契约' },
    ],
  },
  {
    kind: 'end',
    inPalette: true,
    caption: '「流程结束」',
    fields: [NAME_FIELD],
  },
  {
    kind: 'llm',
    inPalette: true,
    caption: '模型名；流式 / t= / maxN 后缀',
    fields: [
      NAME_FIELD,
      { key: 'model', labelZh: '模型', required: true, note: '模型 ID 或 {{变量}}' },
      { key: 'systemPrompt', labelZh: '系统提示', note: '支持 {{变量}}' },
      { key: 'prompt', labelZh: '用户提示', note: '支持 {{变量}}；空则接 last_agent_content / 流程输入' },
      { key: 'llmStream', labelZh: '流式收集', note: 'data.stream / llmStream' },
      { key: 'llmTemperature', labelZh: '温度', note: '数字或 {{变量}}；空/0=默认；data.temperature' },
      { key: 'llmMaxTokens', labelZh: '最大生成长度', note: '数字或 {{变量}}；空/0=默认；data.maxTokens / max_tokens' },
      {
        key: '_llmResultVars',
        labelZh: '结果变量',
        note: '成功后写 last_agent_content / last_llm_model / last_llm_tokens / last_llm_latency_ms',
      },
    ],
  },
  {
    kind: 'agent',
    inPalette: true,
    caption: '智能体名称',
    fields: [
      NAME_FIELD,
      { key: 'agentId', labelZh: '智能体', required: true, note: 'ID 或 {{变量}}' },
      {
        key: 'prompt',
        labelZh: '用户提示',
        note: '支持 {{变量}}；空则接 last_agent_content / 流程输入',
      },
      {
        key: '_agentContentResultVars',
        labelZh: '结果变量',
        note: '成功后写 last_agent_content / last_agent_id',
      },
    ],
  },
  {
    kind: 'team',
    inPalette: true,
    caption: '小队名称',
    fields: [
      NAME_FIELD,
      { key: 'teamId', labelZh: '小队', required: true, note: 'ID 或 {{变量}}' },
      { key: 'prompt', labelZh: '任务说明', note: '支持 {{变量}}；空则接 last_agent_content' },
      {
        key: '_agentContentResultVars',
        labelZh: '结果变量',
        note: '成功后写 last_agent_content / last_team_id（活跃成员兼写 last_agent_id）',
      },
    ],
  },
  {
    kind: 'search',
    inPalette: true,
    caption: '知识库名 · 模式 · topK',
    fields: [
      NAME_FIELD,
      { key: 'knowledgeBaseId', labelZh: '知识库', required: true, note: 'ID 或 {{变量}}' },
      {
        key: 'query',
        labelZh: '检索问句',
        note: '支持 {{变量}}；空则 input.query → last_agent_content',
      },
      { key: 'searchMode', labelZh: '检索方式覆盖', note: 'semantic/keyword/hybrid 或 {{变量}}；空跟库' },
      { key: 'topK', labelZh: 'Top-K 覆盖', note: '数字或 {{变量}}；空跟库' },
      { key: 'minScore', labelZh: '最低分覆盖', note: '数字或 {{变量}}；空跟库' },
      { key: 'rerankMode', labelZh: 'Rerank 覆盖' },
      { key: 'rerankProviderId', labelZh: 'Rerank 模型', note: 'ID 或 {{变量}}；空跟库' },
      { key: 'hybridSemanticWeight', labelZh: '混合语义权重', note: '数字或 {{变量}}；空跟库' },
      {
        key: '_searchResultVars',
        labelZh: '结果变量',
        note: '运行后写 last_search_context / query / total / kb_id / mode / rerank_provider_id',
      },
    ],
  },
  {
    kind: 'subflow',
    inPalette: true,
    caption: '嵌套工作流名；有自定义入参时带后缀；禁止指向自身',
    fields: [
      NAME_FIELD,
      {
        key: 'subflowWorkflowId',
        labelZh: '调用工作流',
        required: true,
        note: 'ID 或 {{变量}}；同步嵌套；最多 3 层；不可指向自身',
      },
      {
        key: 'subflowInput',
        labelZh: '入参映射',
        note: '可选 JSON；字符串值支持 {{变量}}；空则透传当前上下文',
      },
      {
        key: '_subflowResultVars',
        labelZh: '结果变量',
        note: '运行后写 last_subflow_output / last_subflow_workflow_id；有 content 时写 last_agent_content',
      },
    ],
  },
  {
    kind: 'condition',
    inPalette: true,
    caption: '字段 运算符 值；须真/假两条出边',
    fields: [
      NAME_FIELD,
      { key: 'conditionField', labelZh: '比较字段', required: true, note: '支持 {{变量}}（展开为字段名）' },
      { key: 'conditionOperator', labelZh: '运算符', note: '== / contains…或 {{变量}}' },
      { key: 'conditionValue', labelZh: '比较值', note: '支持 {{变量}}' },
      { key: 'description', labelZh: '说明' },
      {
        key: '_conditionResultVars',
        labelZh: '结果变量',
        note: '运行后写 last_condition_result / branch / field / operator',
      },
    ],
  },
  {
    kind: 'loop',
    inPalette: true,
    caption: '次数 / while 条件 / 数组→元素',
    fields: [
      NAME_FIELD,
      { key: 'loopType', labelZh: '循环方式', note: 'times | while | for_each' },
      { key: 'loopCount', labelZh: '次数', note: 'times；数字或 {{变量}}' },
      { key: 'loopCondition', labelZh: '条件表达式', note: 'while；支持 {{变量}}' },
      { key: 'loopArrayVar', labelZh: '数组变量', required: true, note: 'for_each 必填；支持 {{变量}}（展开为变量名）' },
      { key: 'loopItemVar', labelZh: '元素变量', note: 'for_each；支持 {{变量}}（展开为变量名）' },
      { key: 'loopKeyVar', labelZh: '下标变量', note: 'for_each；支持 {{变量}}（展开为变量名）' },
      { key: 'loopMaxIter', labelZh: '最大迭代', note: '数字或 {{变量}}；默认 100' },
      {
        key: '_loopResultVars',
        labelZh: '结果变量',
        note: '运行后写 last_loop_total / index / type；for_each 另写 item_var / key_var',
      },
    ],
  },
  {
    kind: 'http',
    inPalette: true,
    caption: 'METHOD url；头/超时/严校验后缀',
    fields: [
      NAME_FIELD,
      { key: 'httpMethod', labelZh: '方法', note: 'GET/POST…或 {{变量}}；展开后转大写' },
      { key: 'httpUrl', labelZh: 'URL', required: true, note: '支持 {{变量}}' },
      { key: 'httpBody', labelZh: '请求体', note: '支持 {{变量}}' },
      { key: 'httpHeaders', labelZh: '请求头', note: 'JSON；值支持 {{变量}}' },
      { key: 'httpTimeout', labelZh: '超时秒', note: '数字或 {{变量}}；默认 30' },
      {
        key: 'httpFailOnError',
        labelZh: '非 2xx 失败',
        note: 'data.failOnError / fail_on_error；≥400 时节点失败',
      },
      {
        key: '_httpResultVars',
        labelZh: '结果变量',
        note: '运行后写 last_http_method / status / body / ok（status<400）',
      },
    ],
  },
  {
    kind: 'code',
    inPalette: true,
    caption: '语言: 首行；非默认超时带 · Ns（仅沙箱）',
    fields: [
      NAME_FIELD,
      { key: 'codeLanguage', labelZh: '语言', note: 'expression | python | javascript 或 {{变量}}' },
      { key: 'codeSource', labelZh: '代码', required: true },
      {
        key: 'codeTimeout',
        labelZh: '超时秒',
        note: '数字或 {{变量}}；默认 30，最长 60；仅 Python/JS 沙箱',
      },
      {
        key: '_codeResultVars',
        labelZh: '结果变量',
        note: '运行后写 last_code_output / last_code_language',
      },
    ],
  },
  {
    kind: 'delay',
    inPalette: true,
    caption: '时长 + 单位',
    fields: [
      NAME_FIELD,
      { key: 'delayDuration', labelZh: '时长', note: '数字或 {{变量}}' },
      { key: 'delayUnit', labelZh: '单位', note: 'seconds | minutes | hours 或 {{变量}}' },
      {
        key: '_delayResultVars',
        labelZh: '结果变量',
        note: '运行后写 last_delay_ms / duration / unit',
      },
    ],
  },
  {
    kind: 'wait',
    inPalette: true,
    caption: '原因: 消息 · 超时',
    fields: [
      NAME_FIELD,
      { key: 'waitReason', labelZh: '等待原因', note: '默认 approval；支持 {{变量}}' },
      { key: 'waitMessage', labelZh: '提示文案', note: '支持 {{变量}}' },
      { key: 'timeoutSec', labelZh: '超时秒', note: '数字或 {{变量}}；空=不超时' },
      {
        key: '_waitResultVars',
        labelZh: '结果变量',
        note: '挂起写 last_wait_*；继续/审批后写 last_wait_decision',
      },
    ],
  },
  {
    kind: 'input',
    inPalette: false,
    caption: '变量名',
    fields: [
      NAME_FIELD,
      { key: 'variable', labelZh: '变量名', required: true },
    ],
  },
  {
    kind: 'output',
    inPalette: false,
    caption: '变量名',
    fields: [
      NAME_FIELD,
      { key: 'variable', labelZh: '变量名', required: true },
    ],
  },
]

export function workflowNodeSettingsByKind(kind: string): WorkflowNodeSettingsSpec | undefined {
  return WORKFLOW_NODE_SETTINGS.find(s => s.kind === kind)
}

/** 调色板类型必须都有总表条目 */
export function listMissingPaletteSettings(): WorkflowNodeKind[] {
  const have = new Set(WORKFLOW_NODE_SETTINGS.map(s => s.kind))
  return WORKFLOW_SETTINGS_PALETTE.filter(k => !have.has(k))
}

/**
 * 引擎写入的 last_* 结果变量速查（对齐 nodes/*.go）。
 * 下游可用 {{last_xxx}}；与 §11.1 / 抽屉 hint 同步维护。
 */
export type WorkflowLastResultVar = {
  name: string
  /** 写出该变量的节点类型 */
  writers: WorkflowNodeKind[]
  noteZh: string
}

export const WORKFLOW_LAST_RESULT_VARS: WorkflowLastResultVar[] = [
  {
    name: 'last_agent_content',
    writers: ['llm', 'agent', 'team', 'subflow'],
    noteZh: '文本输出；subflow 仅当结果含 content',
  },
  { name: 'last_agent_id', writers: ['agent', 'team'], noteZh: 'Agent ID；Team 写活跃成员' },
  { name: 'last_team_id', writers: ['team'], noteZh: '小队 ID' },
  { name: 'last_llm_model', writers: ['llm'], noteZh: '实际模型名' },
  { name: 'last_llm_tokens', writers: ['llm'], noteZh: '总 token' },
  { name: 'last_llm_latency_ms', writers: ['llm'], noteZh: '延迟毫秒' },
  { name: 'last_search_query', writers: ['search'], noteZh: '实际问句' },
  { name: 'last_search_context', writers: ['search'], noteZh: '拼接上下文' },
  { name: 'last_search_total', writers: ['search'], noteZh: '命中条数' },
  { name: 'last_search_kb_id', writers: ['search'], noteZh: '知识库 ID' },
  { name: 'last_search_mode', writers: ['search'], noteZh: '展开后的模式；空=跟库' },
  { name: 'last_search_rerank_provider_id', writers: ['search'], noteZh: '重排模型 ID；可空' },
  { name: 'last_subflow_output', writers: ['subflow'], noteZh: '子流程输出 JSON 字符串' },
  { name: 'last_subflow_workflow_id', writers: ['subflow'], noteZh: '嵌套工作流 ID' },
  { name: 'last_condition_result', writers: ['condition'], noteZh: '比较结果 bool' },
  { name: 'last_condition_branch', writers: ['condition'], noteZh: 'true / false 分支名' },
  { name: 'last_condition_field', writers: ['condition'], noteZh: '展开后的字段名' },
  { name: 'last_condition_operator', writers: ['condition'], noteZh: '展开后的运算符' },
  { name: 'last_loop_total', writers: ['loop'], noteZh: '实际迭代次数' },
  { name: 'last_loop_index', writers: ['loop'], noteZh: '末轮下标；无迭代为 -1' },
  { name: 'last_loop_type', writers: ['loop'], noteZh: 'times / while / for_each' },
  { name: 'last_loop_item_var', writers: ['loop'], noteZh: '仅 for_each；元素变量名' },
  { name: 'last_loop_key_var', writers: ['loop'], noteZh: '仅 for_each；下标变量名' },
  { name: 'last_http_method', writers: ['http'], noteZh: '实际方法（大写）' },
  { name: 'last_http_status', writers: ['http'], noteZh: 'HTTP 状态码' },
  { name: 'last_http_body', writers: ['http'], noteZh: '响应体文本' },
  { name: 'last_http_ok', writers: ['http'], noteZh: 'status < 400' },
  { name: 'last_code_output', writers: ['code'], noteZh: '代码输出' },
  { name: 'last_code_language', writers: ['code'], noteZh: '实际语言' },
  { name: 'last_delay_ms', writers: ['delay'], noteZh: '实际睡眠毫秒（含上限裁切）' },
  { name: 'last_delay_duration', writers: ['delay'], noteZh: '配置时长数字' },
  { name: 'last_delay_unit', writers: ['delay'], noteZh: 'seconds / minutes / hours' },
  { name: 'last_wait_reason', writers: ['wait'], noteZh: '挂起原因' },
  { name: 'last_wait_message', writers: ['wait'], noteZh: '挂起提示文案' },
  { name: 'last_wait_timeout_sec', writers: ['wait'], noteZh: '超时秒；无则 0' },
  {
    name: 'last_wait_decision',
    writers: ['wait'],
    noteZh: '继续/审批后写入（非节点内）；兼 approval_decision',
  },
]

/** 校验：每个调色板「有结果变量」节点在速查表里至少出现一次（writers） */
export function listPaletteKindsMissingLastVars(): WorkflowNodeKind[] {
  const withOutput: WorkflowNodeKind[] = [
    'llm',
    'agent',
    'team',
    'search',
    'subflow',
    'condition',
    'loop',
    'http',
    'code',
    'delay',
    'wait',
  ]
  const covered = new Set(WORKFLOW_LAST_RESULT_VARS.flatMap(v => v.writers))
  return withOutput.filter(k => !covered.has(k))
}

/** 某节点类型会写出的 last_*（抽屉「本节点写出」列表用） */
export function lastResultVarsForKind(kind: string): WorkflowLastResultVar[] {
  return WORKFLOW_LAST_RESULT_VARS.filter(v =>
    v.writers.includes(kind as WorkflowNodeKind),
  )
}
