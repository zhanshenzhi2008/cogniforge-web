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
      { key: 'model', labelZh: '模型', required: true },
      { key: 'systemPrompt', labelZh: '系统提示', note: '支持 {{变量}}' },
      { key: 'prompt', labelZh: '用户提示', note: '支持 {{变量}}；空则接 last_agent_content / 流程输入' },
      { key: 'llmStream', labelZh: '流式收集', note: 'data.stream / llmStream' },
      { key: 'llmTemperature', labelZh: '温度', note: '0=默认；data.temperature' },
      { key: 'llmMaxTokens', labelZh: '最大生成长度', note: '0=默认；data.maxTokens / max_tokens' },
    ],
  },
  {
    kind: 'agent',
    inPalette: true,
    caption: '智能体名称',
    fields: [
      NAME_FIELD,
      { key: 'agentId', labelZh: '智能体', required: true },
      { key: 'prompt', labelZh: '用户提示', note: '支持 {{变量}}；空则用执行输入' },
    ],
  },
  {
    kind: 'team',
    inPalette: true,
    caption: '小队名称',
    fields: [
      NAME_FIELD,
      { key: 'teamId', labelZh: '小队', required: true },
      { key: 'prompt', labelZh: '任务说明', note: '支持 {{变量}}；空则接 last_agent_content' },
    ],
  },
  {
    kind: 'search',
    inPalette: true,
    caption: '知识库名 · 模式 · topK',
    fields: [
      NAME_FIELD,
      { key: 'knowledgeBaseId', labelZh: '知识库', required: true },
      {
        key: 'query',
        labelZh: '检索问句',
        note: '支持 {{变量}}；空则 input.query → last_agent_content',
      },
      { key: 'searchMode', labelZh: '检索方式覆盖' },
      { key: 'topK', labelZh: 'Top-K 覆盖' },
      { key: 'minScore', labelZh: '最低分覆盖' },
      { key: 'rerankMode', labelZh: 'Rerank 覆盖' },
      { key: 'rerankProviderId', labelZh: 'Rerank 模型' },
      { key: 'hybridSemanticWeight', labelZh: '混合语义权重' },
      {
        key: '_searchResultVars',
        labelZh: '结果变量',
        note: '运行后写 last_search_context / query / total',
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
        note: '同步嵌套；最多 3 层；不可选当前工作流',
      },
      {
        key: 'subflowInput',
        labelZh: '入参映射',
        note: '可选 JSON；字符串值支持 {{变量}}；空则透传当前上下文',
      },
      {
        key: '_subflowResultVars',
        labelZh: '结果变量',
        note: '运行后写 last_subflow_output；有 content 时写 last_agent_content',
      },
    ],
  },
  {
    kind: 'condition',
    inPalette: true,
    caption: '字段 运算符 值；须真/假两条出边',
    fields: [
      NAME_FIELD,
      { key: 'conditionField', labelZh: '比较字段', required: true },
      { key: 'conditionOperator', labelZh: '运算符' },
      { key: 'conditionValue', labelZh: '比较值', note: '支持 {{变量}}' },
      { key: 'description', labelZh: '说明' },
      {
        key: '_conditionResultVars',
        labelZh: '结果变量',
        note: '运行后写 last_condition_result / branch / field',
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
      { key: 'loopCount', labelZh: '次数', note: 'times' },
      { key: 'loopCondition', labelZh: '条件表达式', note: 'while；支持 {{变量}}' },
      { key: 'loopArrayVar', labelZh: '数组变量', required: true, note: 'for_each 必填' },
      { key: 'loopItemVar', labelZh: '元素变量', note: 'for_each' },
      { key: 'loopKeyVar', labelZh: '下标变量', note: 'for_each' },
      { key: 'loopMaxIter', labelZh: '最大迭代' },
      {
        key: '_loopResultVars',
        labelZh: '结果变量',
        note: '运行后写 last_loop_total / index / type',
      },
    ],
  },
  {
    kind: 'http',
    inPalette: true,
    caption: 'METHOD url；头/超时/严校验后缀',
    fields: [
      NAME_FIELD,
      { key: 'httpMethod', labelZh: '方法' },
      { key: 'httpUrl', labelZh: 'URL', required: true, note: '支持 {{变量}}' },
      { key: 'httpBody', labelZh: '请求体', note: '支持 {{变量}}' },
      { key: 'httpHeaders', labelZh: '请求头', note: 'JSON；值支持 {{变量}}' },
      { key: 'httpTimeout', labelZh: '超时秒', note: '默认 30，会作用于本次请求' },
      {
        key: 'httpFailOnError',
        labelZh: '非 2xx 失败',
        note: 'data.failOnError / fail_on_error；≥400 时节点失败',
      },
      {
        key: '_httpResultVars',
        labelZh: '结果变量',
        note: '运行后写 last_http_status / last_http_body',
      },
    ],
  },
  {
    kind: 'code',
    inPalette: true,
    caption: '语言: 首行；非默认超时带 · Ns（仅沙箱）',
    fields: [
      NAME_FIELD,
      { key: 'codeLanguage', labelZh: '语言', note: 'expression | python | javascript' },
      { key: 'codeSource', labelZh: '代码', required: true },
      {
        key: 'codeTimeout',
        labelZh: '超时秒',
        note: '默认 30，最长 60；仅 Python/JS 沙箱；data.timeout / codeTimeout',
      },
      {
        key: '_codeResultVars',
        labelZh: '结果变量',
        note: '运行后写 last_code_output',
      },
    ],
  },
  {
    kind: 'delay',
    inPalette: true,
    caption: '时长 + 单位',
    fields: [
      NAME_FIELD,
      { key: 'delayDuration', labelZh: '时长' },
      { key: 'delayUnit', labelZh: '单位', note: 'seconds | minutes | hours' },
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
      { key: 'timeoutSec', labelZh: '超时秒' },
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
