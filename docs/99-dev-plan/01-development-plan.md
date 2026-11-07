# cogniforge-web 开发计划（跨仓同步）

## [变更记录]

| 日期 | 版本 | 变更摘要 | 负责人 |
|------|------|----------|--------|
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
