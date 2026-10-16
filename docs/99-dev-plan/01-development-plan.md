# cogniforge-web 开发计划（跨仓同步）

## [变更记录]

| 日期 | 版本 | 变更摘要 | 负责人 |
|------|------|----------|--------|
| 2026-10-16 | v1.4 | GHCR 镜像扁平化：`.../cogniforge-web`（去掉中间目录） | orjrs |
| 2026-10-16 | v1.3 | CD 登录 GHCR 改用 GITHUB_TOKEN | orjrs |
| 2026-10-15 | v1.2 | 评估页：提示词/版本下拉，免手抄 version id | orjrs |
| 2026-10-15 | v1.1 | 阶段十七：/prompts + 评估页 prompt/system_prompt | orjrs |
| 2026-10-15 | v1.0 | 阶段十六：/evals 评估页 | orjrs |

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
