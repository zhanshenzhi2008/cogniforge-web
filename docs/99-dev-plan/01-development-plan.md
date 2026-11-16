# cogniforge-web 开发计划（跨仓同步）

## [变更记录]

| 日期 | 版本 | 变更摘要 | 负责人 |
|------|------|----------|--------|
| 2026-11-16 | v1.51 | 文档抽屉：上传区常驻、标题栏收矮、去掉文档数说明 | orjrs |
| 2026-11-16 | v1.50 | 文档列表分页；上传改抽屉内分步；默认设置改弹窗 | orjrs |
| 2026-11-16 | v1.49 | 知识库列表上方关键字搜索（无标题、带搜索图标） | orjrs |
| 2026-11-16 | v1.48 | 知识库列表去掉目录层，只按库名展示 | orjrs |
| 2026-11-16 | v1.47 | 向量模型创建后锁定；目录项与「新建」分层 | orjrs |
| 2026-11-15 | v1.46 | 知识库文档预览工具栏加最大化 | orjrs |
| 2026-11-15 | v1.45 | 知识库检索测试：多行问句框 + 文字按钮 | orjrs |
| 2026-11-15 | v1.44 | 知识库分段/检索字段帮助图标悬浮说明 | orjrs |
| 2026-11-15 | v1.43 | 模型页：Scope 徽章、公开开关、只读与个人默认 | orjrs |
| 2026-11-15 | v1.42 | CfModal 内 Select portal=false；PDF 预览错误更清晰 | orjrs |
| 2026-11-15 | v1.41 | 弹窗「取消」去掉 X 图标（与右上角关闭重复） | orjrs |
| 2026-11-15 | v1.39 | 卡片操作图标悬停显示；删除须确认 | orjrs |
| 2026-11-15 | v1.38 | 知识库卡片改为文档/编辑/删除图标按钮 | orjrs |
| 2026-11-15 | v1.37 | CfModal 内 Select 下拉抬层，修目录点不开 | orjrs |
| 2026-11-15 | v1.36 | 知识库文档：预览 / Markdown 编辑切换并保存 | orjrs |
| 2026-11-15 | v1.35 | 知识库抽屉设置页：默认分段/检索 + 权限占位 | orjrs |
| 2026-11-15 | v1.34 | 检索测试可调 Top-K / 最低相似度 | orjrs |
| 2026-11-15 | v1.33 | 知识库上传两步：分段设置 + 分块预览 | orjrs |
| 2026-11-15 | v1.32 | CfModal 叠在 USlideover 上可点击（修知识库上传无反应） | orjrs |
| 2026-11-13 | v1.31 | LLM 节点可配用户提示；与后端 execute 修复同步 | orjrs |
| 2026-11-11 | v1.30 | 共用 SSE 读取：缓冲/取消/连接重试/断线提示 | orjrs |
| 2026-11-09 | v1.29 | 评估 e2e：适配聊天模型下拉，修 CI | orjrs |
| 2026-11-09 | v1.28 | 评估页：聊天模型改为下拉（读 /models） | orjrs |
| 2026-11-08 | v1.27 | 模型页：厂商决定卡片小字，不再默认 OpenAI | orjrs |
| 2026-11-08 | v1.26 | 模型页：快捷模板可改、模型可手填 | orjrs |
| 2026-11-08 | v1.25 | 模型页：智谱 BigModel（免费 Flash 优先） | orjrs |
| 2026-11-07 | v1.24 | 17.14：Playground Agent 对话传提示词变量 | orjrs |
| 2026-11-07 | v1.23 | Agent：构成一览 + 新建表单三段分组 | orjrs |
| 2026-11-06 | v1.22 | 提示词导入：Agent 或 Skill | orjrs |
| 2026-10-26 | v1.21 | W3：审批通过/拒绝；wait 超时秒数配置 | orjrs |
| 2026-10-26 | v1.20 | W2：wait 节点 + 执行条继续/取消；修正 executions API 路径 | orjrs |
| 2026-10-26 | v1.19 | W1：调试轮询按 node_runs 高亮画布节点 | orjrs |
| 2026-10-26 | v1.18 | 阶段十八：工作流画布跟 Checkpoint/节点高亮（设计同步） | orjrs |
| 2026-10-24 | v1.17 | P1：试跑 / 评估变量表单 / 顶栏邮箱 | orjrs |
| 2026-10-18 | v1.16 | 共用 CfModal：拖动/缩放/最大化，替换 UModal | orjrs |
| 2026-10-18 | v1.15 | MCP 卡片 UI：筛选/开关/工具数/刷新 | orjrs |
| 2026-10-18 | v1.14 | MCP 文案：Streamable HTTP 已可用；stdio 需网关 | orjrs |
| 2026-10-18 | v1.13 | MCP 页：内置工具明细 + 飞书配置提示 | orjrs |
| 2026-10-17 | v1.12 | 提示词展示来源；同 Agent 再导入同步新版 | orjrs |
| 2026-10-17 | v1.11 | 提示词 UI 去掉 UUID；名称防重由后端保证 | orjrs |
| 2026-10-17 | v1.10 | 窄屏汉堡菜单：双列紧凑卡片 + 更窄抽屉 | orjrs |
| 2026-10-17 | v1.9 | 用户名格式：无空格，与后端 util.ValidateUsername 对齐 | orjrs |
| 2026-10-17 | v1.8 | 提示词前端剩余任务：试跑/变量表单/顶栏邮箱等 | orjrs |
| 2026-10-17 | v1.7 | 提示词工业闭环：发布/变量/Agent 绑定/导入/评估变量 | orjrs |
| 2026-10-17 | v1.6 | 提示词：删版本/设当前/双版对比/{{var}} 预览 | orjrs |
| 2026-10-17 | v1.5 | CD 改 workflow_run：等 CI 成功再部署 | orjrs |
| 2026-10-16 | v1.4 | GHCR 镜像扁平化：`.../cogniforge-web`（去掉中间目录） | orjrs |
| 2026-10-16 | v1.3 | CD 登录 GHCR 改用 GITHUB_TOKEN | orjrs |
| 2026-10-15 | v1.2 | 评估页：提示词/版本下拉，免手抄 version id | orjrs |
| 2026-10-15 | v1.1 | 阶段十七：/prompts + 评估页 prompt/system_prompt | orjrs |
| 2026-10-15 | v1.0 | 阶段十六：/evals 评估页 | orjrs |

## [变更] 文档抽屉上传区常驻（2026-11-16）

- **原因**：上传不要再点一次按钮才出现；标题下的「几个文档」和标签上的数量重复，标题栏也偏高
- **行为**：文档页上方直接是两步上传；「设置默认」在步骤右边；标题只留库名，高度收矮
- **包含代码**：`pages/knowledge.vue`
- **主仓**：见主仓开发计划 v1.150、前端设计 v1.70

## [变更] 知识库文档抽屉改版（2026-11-16）

- **原因**：上传弹窗盖在抽屉下面，点「上传文档」像没反应；设置不必占一个标签
- **行为**：文档列表每页 8 条；上传在列表上方分两步（选文件、本次分段）；「设置默认」弹窗改库的默认分段和检索
- **包含代码**：`pages/knowledge.vue`、`components/CfModal.vue`、i18n
- **主仓**：见主仓开发计划 v1.149、前端设计 v1.69

## [变更] 知识库列表搜索（2026-11-16）

- **原因**：库多了之后不好找
- **行为**：列表上方一个搜索框，无标题，占位符写「搜索知识库名称或说明」，左侧自带搜索图标；按名称和说明过滤
- **包含代码**：`pages/knowledge.vue`、`i18n/messages.ts`
- **主仓**：见主仓开发计划 v1.147、前端设计 v1.68

## [变更] 知识库去掉目录层（2026-11-16）

- **原因**：知识库名本身就是那一箱文件的名字，外面再套目录和常见产品不一致，也容易看混
- **行为**：首页直接排知识库卡片；创建/编辑/详情不再选目录
- **包含代码**：`pages/knowledge.vue`
- **主仓**：接口仍保留 folders，页面不再调用；见主仓开发计划 v1.145

## [变更] 知识库模型锁定与目录分层（2026-11-16）

- **原因**：向量模型必须跟库走；上传分段和库默认容易看混；目录下拉里「新建」和目录值长得一样，还叠了两个加号
- **行为**：编辑时向量库/模型只读并注明创建后不能改；设置写明「以后上传的默认」，上传写明「只改这一批」；「新建目录」只留小加号，分隔线 + 强调色
- **包含代码**：`pages/knowledge.vue`、`i18n/messages.ts`
- **主仓**：见主仓开发计划 v1.144、前端设计 v1.66

## [变更] 知识库预览最大化（2026-11-15）

- **原因**：预览偏窄；对齐 CfModal 最大化图标
- **行为**：工具栏最大化/还原；最大化隐藏左侧列表并加高阅读区；关闭预览重置
- **包含代码**：`pages/knowledge.vue`
- **主仓**：见主仓开发计划 v1.143、前端设计 v1.65

## [变更] 知识库检索测试多行输入（2026-11-15）

- **原因**：单行小框 + 纯图标按钮不协调；测试问句常要多行
- **行为**：Textarea；Enter 检索、Shift+Enter 换行；工具栏放 Top-K/最低分与「清空/检索」文字按钮
- **包含代码**：`pages/knowledge.vue`、`i18n/messages.ts`
- **主仓**：见主仓开发计划 v1.142、前端设计 v1.64

## [变更] 知识库分段字段帮助提示（2026-11-15）

- **原因**：分段方式、重叠、Top-K 等术语不好懂
- **行为**：设置页与上传「分段设置」标签旁加 `?` 图标，悬停解释智能递归 / 块大小 / 重叠等
- **包含代码**：`pages/knowledge.vue`、`i18n/messages.ts`
- **主仓**：见主仓开发计划 v1.141、前端设计 v1.63

## [变更] 模型页 Scope + 权限一期（2026-11-15）

- **原因**：管理员可发布全站公开模型；普通用户只能管自己的私有配置
- **行为**：卡片/列表显示公开·私有·全站默认·我的默认；admin 表单有「公开」开关；无 `can_write` 隐藏编辑/删除/启停；设默认：admin→全站，普通用户→个人偏好
- **包含代码**：`pages/models.vue`、`useProviders.ts`、i18n
- **主仓**：`ai_providers` owner/scope、鉴权、`GetActiveForChat(userID)`；见主仓开发计划 v1.140

## [变更] 弹窗内下拉与 PDF 预览（2026-11-15）

- **原因**：上传第二步「分段方式」点不开；PDF 预览分块报错含糊
- **行为**：CfModal 内 USelect `portal=false` + 面板可溢出；预览失败给出可读错误
- **包含代码**：`CfModal.vue`、`knowledge.vue`、`main.css`；主仓/AI 路径与空 PDF 提示

## [变更] 弹窗取消按钮去图标（2026-11-15）

- **原因**：页脚「取消」带 X，与 CfModal 右上角关闭重复
- **行为**：知识库各弹窗取消只留文字
- **包含代码**：`pages/knowledge.vue`

## [变更] 卡片悬停显示操作图标（2026-11-15）

- **原因**：图标常显占地方；删除要防误触
- **行为**：鼠标悬停/焦点才显示文档·编辑·删除；触屏仍常显；删库/删文档走确认弹窗
- **包含代码**：`pages/knowledge.vue`、i18n

## [变更] 知识库卡片图标操作（2026-11-15）

- **原因**：卡片只有「⋯」菜单，不好发现；与 MCP/智能体页图标操作不一致
- **行为**：卡片右上改为文档 / 编辑 / 删除三个图标按钮
- **包含代码**：`pages/knowledge.vue`

## [变更] CfModal 内 Select 下拉可见（2026-11-15）

- **原因**：弹窗里点目录下拉像没反应（实际被 CfModal 盖住）
- **行为**：打开态 content/listbox `z-index:300`；CfModal 点击层拆到遮罩/面板
- **包含代码**：`main.css`、`CfModal.vue`、`knowledge.vue`

## [变更] 文档预览 / Markdown 编辑（2026-11-15）

- **原因**：右侧只能预览，无法改 Markdown 正文
- **行为**：工具栏「预览 | 编辑」；保存调用 `PUT .../content` 并重新解析
- **包含代码**：`pages/knowledge.vue`、`useKnowledgeBases.ts`、i18n

## [变更] 知识库设置页（2026-11-15）

- **原因**：阶段3，库级默认分段/检索可保存；权限先占位
- **行为**：抽屉「设置」页编辑并 PUT；可见范围目前仅「仅自己」
- **包含代码**：`pages/knowledge.vue`、i18n

## [变更] 检索测试 Top-K / 最低分（2026-11-15）

- **原因**：阶段2，检索参数跟知识库默认走且可临时覆盖
- **行为**：检索面板增加 Top-K、最低相似度；打开 KB 时同步库默认
- **包含代码**：`pages/knowledge.vue`、i18n

## [变更] 上传分段设置 + 分块预览（2026-11-15）

- **原因**：阶段1，上传前可调分段并预览
- **行为**：上传弹窗两步；调用 `POST .../documents/preview` 与带分段参数的 upload
- **包含代码**：`pages/knowledge.vue`、`useKnowledgeBases.ts`、i18n

## [变更] CfModal 叠在侧栏可点（2026-11-15）

- **原因**：知识库抽屉开着时，上传/删文档等 CfModal 看得见但点不动
- **行为**：`CfModal` 设 `pointer-events: auto`、`z-index: 200`；未选文件点上传给 toast
- **包含代码**：`components/CfModal.vue`、`pages/knowledge.vue`、i18n `kb.needFiles`

## [变更] LLM 节点用户提示（2026-11-13）

- **原因**：主仓 execute 空 500；画布 LLM 只配系统提示，缺 user prompt 时跑不起来
- **行为**：节点配置增加「用户提示」（可选）；不填时后端用流程输入 + 上游输出兜底
- **包含代码**：`pages/workflows/[id].vue`、i18n
- **主仓**：`generateID` panic 修复 + LLM 兜底；需重新部署后「执行」才可用

## [变更] 共用 SSE 流式加固（2026-11-11）

- **原因**：对话 / Agent / 提示词试跑各自 `getReader`，Agent 缺缓冲与取消；断线提示不清
- **行为**：`utils/sseStream.ts` 统一缓冲、Abort、连接失败重试 1 次；中途断线保留已收到文字并提示；不做中途续传（后端无 Last-Event-ID）
- **包含代码**：`sseStream.ts`、单测、`playground.vue`、`useAgentChat.ts`、`prompts.vue`、i18n

## [变更] 评估页聊天模型下拉（2026-11-09）

- **原因**：跑 prompt/model 时要手抄模型 ID，还得去模型页看
- **行为**：目标为 model / prompt 时，聊天模型用 `GET /api/v1/models` 下拉；无模型时提示先去「配置 → 模型」
- **包含代码**：`pages/evals.vue`、i18n
- **CI**：`e2e/evals.spec.ts` 不再 `fill` 旧 placeholder，改为断言下拉「选择聊天模型」+ 默认已选可运行

## [变更] 卡片小字=所选厂商（2026-11-08）

- **原因**：新增时厂商默认是 `openai`，格子又写成「只是预填」，保存后卡片第二行一直是 OpenAI
- **行为**：新增不预选；点哪个厂商，预览和卡片小字就是哪个（智谱 →「智谱 BigModel」）；地址能认出厂商时，没选会自动对上，选错了给出「改成…」；「自定义兼容」的小字就是「自定义兼容」
- **包含代码**：`pages/models.vue`、`useProviders.ts`、i18n
- **主仓**：列表时把「厂商仍是 openai、地址却是智谱等」改正

## [变更] 智谱 BigModel（2026-11-08）

- **包含代码**：`useProviders.ts`、`pages/models.vue`、i18n `models.zhipuHint`
- **行为**：供应商类型增加智谱；默认对话 `glm-4.7-flash`；下拉免费 Flash 在前
- **主仓**：`provider=zhipu`、`CatalogModels`、OpenAI 路径支持 `/v4`

## [变更] 模型页快捷模板（2026-11-08）

- **行为**：类型格子→可选预填；模型/向量改为输入框 + 推荐芯片；新增「自定义兼容」；编辑可换模板
- **包含代码**：`pages/models.vue`、`useProviders.ts`、i18n；主仓 Update 支持 `provider`

## [变更] 17.14 Playground 提示词变量（2026-11-07）

- **行为**：选中绑定 Prompt 的 Agent → 参数面板出变量表单；发送 `/agents/:id/chat` 带 `variables`
- **包含代码**：`pages/playground.vue`、`PlaygroundConfigPanel.vue`、`useAgentChat.ts`、i18n
- **主仓**：`POST /agents/:id/chat` 已支持 `variables`；设计见 `09-prompt-engineering-design.md` v2.6

## [变更] Agent 构成一览与新建分组（2026-11-07）

- **详情**：构成卡片展示模型 / 人设 / MCP / 来源 Skill（可读摘要，运行时仍走库表）
- **新建/编辑**：分段「从哪开始 → 它是谁 → 它能用什么」；空白或 Skill 预填
- **包含代码**：`pages/agents.vue`、`i18n/messages.ts`

## [变更] 提示词从 Skill 导入（2026-11-06）

- **包含代码**：`pages/prompts.vue` 导入来源切换；`usePrompts.importFromSkill`

## [变更] W3 审批 UI（2026-10-26）

- **包含代码**：执行条「审批通过 / 拒绝」；wait 节点 `timeoutSec`；`approveExecution` / `rejectExecution`
- **行为**：`wait_reason=approval` 时展示审批按钮；展示 `wait_until`

## [变更] W2 wait + resume UI（2026-10-26）

- **包含代码**：`pages/workflows/[id].vue` 执行条；`WorkflowCanvas` wait 节点；`useWorkflows.resumeExecution`；修正 `GET/POST .../workflows/executions/:id`
- **行为**：waiting 横幅 +「继续」；取消；画布 `run-waiting`；节点面板可拖 wait

## [变更] W1 画布节点高亮（2026-10-26）

- **包含代码**：`pages/workflows/[id].vue` `applyNodeRunHighlight`；`useWorkflows` 类型含 `node_runs`
- **行为**：调试轮询执行详情后，按 running/succeeded/failed 给 Vue Flow 节点加 `run-*` class

## [变更] 阶段十八工作流前端跟进（2026-10-26）

- **变更原因**：主仓立项工作流 Checkpoint；Web 继续用 Vue Flow，按 W0–W2 跟 UI
- **主仓设计**：`cogniforge/docs/01-requirements/10-workflow-checkpoint-design.md`
- **前端计划**：
  | 阶段 | 页面改动 |
  |------|----------|
  | W0 | 调试/结果展示真实 LLM/Agent 输出 |
  | W1 | ✅ 画布按 node_runs 高亮 |
  | W2 | ✅ 「继续 / 取消」；waiting 提示；wait 节点 |
  | W3 | ✅ 审批通过 / 拒绝；超时秒数 |

## [变更] 提示词 P1：试跑 / 变量表单 / 顶栏邮箱（2026-10-24）

- **变更原因**：工业闭环后的体验缺口（验人设、评估变量、同名用户）
- **包含代码**：`pages/prompts.vue`、`pages/evals.vue`、`layouts/default.vue`、`components/PromptVarForm.vue`、`utils/promptVars.ts`、i18n
- **能力**：
  - `/prompts` 详情：选版本 + 变量表单 + 模型 + 一轮流式回答（render + chat/stream）
  - `/evals` target=prompt：按变量定义出表单（替 JSON）；agent 仍 JSON
  - 顶栏用户芯片显示邮箱
- **主仓**：`cogniforge/docs/01-requirements/09-prompt-engineering-design.md` v2.4

## [变更] 共用 CfModal（2026-10-18）

- **变更原因**：全站弹窗要可拖动、缩放、最大化；UModal 做不到
- **包含代码**：`components/CfModal.vue`；各页 `UModal` → `CfModal`
- **用法**：与 UModal 相同（`v-model:open` / `title` / `#body` / `#footer`）；侧栏仍用 `USlideover`

## [变更] MCP 卡片式管理 UI（2026-10-18）

- **变更原因**：对标 Cursor / Claude / Comis：卡片 + 开关 + 工具数，替代纯表格
- **包含代码**：`pages/mcp.vue`、`useMcpServers.ts`、i18n
- **能力**：筛选（全部/内置/自定义）、搜索、行内启用开关、详情刷新工具

## [变更] MCP Streamable HTTP 文案（2026-10-18）

- **变更原因**：后端已支持标准 MCP；前端提示需同步
- **包含代码**：`i18n/messages.ts`（feishuHint / toolsEmpty / httpLimitHint）

## [变更] MCP 内置工具明细 + 飞书配置提示（2026-10-18）

- **变更原因**：列表看不到内置有哪些工具；新建只有 URL，飞书等无法配置明白
- **包含代码**：`pages/mcp.vue`、`composables/useMcpServers.ts`（listTools）、`i18n/messages.ts`
- **能力**：点行打开明细滑层（工具名/说明/参数）；创建表单加说明、鉴权提示与飞书路径说明

## [变更] 窄屏汉堡菜单紧凑化（2026-10-17）

- **变更原因**：小屏侧栏条目过多、单列过高，观感松散
- **包含代码**：`layouts/default.vue` `.mobile-nav*`；抽屉 `max-w-[17.5rem]`；双列胶囊链接
- **效果**：主功能/账户分区；高度约减半；当前项高亮描边

## [变更] 用户名格式规范（2026-10-17）

- **变更原因**：与 Go 端一致，禁止空格并统一提示
- **包含代码**：`utils/username.ts`；`pages/register.vue`；`pages/admin/users.vue`；i18n
- **规则**：2–20 字；无空格；字母、数字、`_`、`-`、中文

## [变更] 提示词前端剩余任务清单（2026-10-17）

- **变更原因**：工业 UI 已写、未部署；需记清前端还要做什么
- **主仓对齐**：`cogniforge/docs/01-requirements/09-prompt-engineering-design.md` §6.2；开发计划阶段十七
- **前端剩余**（P1 已于 2026-10-24 完成，见上节）：
  | 优先级 | 项 | 页面 |
  |--------|----|------|
  | P0 | 合入部署当前改动 / 冒烟 | CD |
  | ~~P1~~ | ~~17.10 / 17.12 / 17.13~~ | ✅ |
  | P2 | 17.11 Skill 导入；17.15 行级 diff；17.16 Tags | `/prompts` |
  | P3 | 17.18 工业 e2e | `e2e/prompts.spec.ts` |

## [变更] 提示词工业闭环前端（2026-10-17）

- **变更原因**：与主仓 v2.0 对齐，可上线
- **包含代码**：`pages/prompts.vue`、`agents.vue`、`evals.vue`、`usePrompts.ts`、`useAgents.ts`、i18n
- **能力**：草稿/发布、变量定义、从 Agent 导入、usages、Agent 绑定 prompt_id、评估 variables JSON
- **主仓设计**：`cogniforge/docs/01-requirements/09-prompt-engineering-design.md` v2.0
- **状态**：本地已改，**待 push / CD**

## [变更] 提示词页加厚（2026-10-17）

- **变更原因**：缺版本删除、并排对比；列表删除易被忽略
- **包含代码**：`pages/prompts.vue`、`composables/usePrompts.ts`、`i18n/messages.ts`、`e2e/prompts.spec.ts`
- **能力**：删整条（列表+详情 UModal）、删单版、设当前、勾选两版对比、`{{var}}` 示例预览
- **主仓设计**：`cogniforge/docs/01-requirements/09-prompt-engineering-design.md`

## [变更] CD 等 CI 成功再部署（2026-10-17）

- **变更原因**：与主仓方案 B 对齐；避免 CI 红仍部署
- **包含代码**：`.github/workflows/cd.yml`（`workflow_run` + `head_sha`）
- **主仓文档**：`cogniforge/docs/06-devops/01-deployment.md`

## [变更] GHCR 镜像扁平化（2026-10-16）

- **变更原因**：与 ai-job-hunter / 主仓对齐
- **包含代码**：`.github/workflows/cd.yml`、`docker-compose-web.yml`
- **变更前 vs 变更后**：~~`ghcr.io/<owner>/cogniforge/cogniforge-web`~~ → `ghcr.io/<owner>/cogniforge-web`
- **主仓文档**：`cogniforge/docs/06-devops/01-deployment.md`

## [变更] CD GHCR 改用 GITHUB_TOKEN（2026-10-16）

- **变更原因**：与主仓对齐；PAT 失效导致 `denied`
- **包含代码**：`.github/workflows/cd.yml`（开启 `packages: write`）
- **主仓文档**：`cogniforge/docs/06-devops/01-deployment.md`

## [变更] 评估页提示词版本下拉（2026-10-15）

- **变更原因**：手抄 version id 易错
- **包含代码**：`pages/evals.vue`；i18n
- **变更前 vs 变更后**：~~粘贴版本 ID~~（2026-10-15）→ 选提示词 → 选版本 → 填模型跑卷

## [变更] 提示词页 + 评估联动（2026-10-15）

- **变更原因**：后端阶段十七；前端需管理提示词版本并在评估里选用
- **包含代码**：`pages/prompts.vue`、`composables/usePrompts.ts`；`pages/evals.vue`；`constants/nav.ts`；`i18n/messages.ts`；`e2e/prompts.spec.ts`
- **主仓设计**：`cogniforge/docs/01-requirements/09-prompt-engineering-design.md`
- **变更前 vs 变更后**：~~无提示词页~~（2026-10-15）→ 配置菜单「提示词」；评估可跑 prompt 目标或临时 system

## [变更] 评估页（2026-10-15）

- **包含代码**：`pages/evals.vue`、`composables/useEvals.ts`、`e2e/evals.spec.ts`
- **主仓设计**：`cogniforge/docs/01-requirements/08-eval-system-design.md`
