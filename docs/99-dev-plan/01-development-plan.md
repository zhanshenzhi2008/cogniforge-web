# cogniforge-web 开发计划（跨仓同步）

## [变更记录]

| 日期 | 版本 | 变更摘要 | 负责人 |
|------|------|----------|--------|
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
- **前端剩余**：
  | 优先级 | 项 | 页面 |
  |--------|----|------|
  | P0 | 合入部署当前改动 | CD |
  | P1 | 17.10 试跑一轮 | `/prompts` |
  | P1 | 17.12 评估变量表单（替 JSON） | `/evals` |
  | P1 | 17.13 顶栏显示邮箱（区分同名 admin） | layout / 用户菜单 |
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
