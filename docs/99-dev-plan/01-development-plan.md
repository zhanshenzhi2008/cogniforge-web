# cogniforge-web 开发计划（跨仓同步）

## [变更记录]

| 日期 | 版本 | 变更摘要 | 负责人 |
|------|------|----------|--------|
| 2026-10-15 | v1.1 | 阶段十七：/prompts + 评估页 prompt/system_prompt | orjrs |
| 2026-10-15 | v1.0 | 阶段十六：/evals 评估页 | orjrs |

## [变更] 提示词页 + 评估联动（2026-10-15）

- **变更原因**：后端阶段十七；前端需管理提示词版本并在评估里选用
- **包含代码**：`pages/prompts.vue`、`composables/usePrompts.ts`；`pages/evals.vue`；`constants/nav.ts`；`i18n/messages.ts`；`e2e/prompts.spec.ts`
- **主仓设计**：`cogniforge/docs/01-requirements/09-prompt-engineering-design.md`
- **变更前 vs 变更后**：~~无提示词页~~（2026-10-15）→ 配置菜单「提示词」；评估可跑 prompt 目标或临时 system

## [变更] 评估页（2026-10-15）

- **包含代码**：`pages/evals.vue`、`composables/useEvals.ts`、`e2e/evals.spec.ts`
- **主仓设计**：`cogniforge/docs/01-requirements/08-eval-system-design.md`
