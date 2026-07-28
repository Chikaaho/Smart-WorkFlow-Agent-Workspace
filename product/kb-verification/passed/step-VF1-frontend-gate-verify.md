# Step VF1：前端四连校验门运行期复验（纯前端）

## 1. 当前状态

知识库对账（2026-07-22）发现：前端基线记为「54 spec files / 471 tests / 四连全绿」并曾标 CONFIRMED，但规划层静态取证得 spec 文件 54（吻合）、`it(`/`test(` 调用 463（与 471 差 8），且「四连是否当前仍全绿」属运行期事实，规划层无权运行无法复验（见 [[known-issues]] I25）。本 Step 交前端执行代理运行真值回填。此为 kb-verification 功能的独立前端任务，与后端 VB1 无依赖。

## 2. Step 目标

运行前端四连校验门，取得各命令退出码与运行期真实测试用例数，回填知识库并说明 463↔运行数差异。

## 3. 推荐模型

```
推荐模型：deepseek-v4-flash
选择理由：仅运行既有校验命令并如实记录输出，无代码设计与架构决策
是否触发升级条件：否
```

## 4. 模型选择理由

纯运行 + 取证记录，不改任何源码，属最简机械任务，Flash 足够。

## 5. 已知上下文

- 前端为 Vue 3.5 + TS 6.0 + Vite 8 严格分层 SPA
- 四连校验门见 `knowledge/development-workflow.md` §2.2：`pnpm typecheck && pnpm lint && pnpm test && pnpm build`
- 规划层静态取证结果（供你比对）：`.spec.ts` 文件 54 个，`it(`/`test(` 调用静态计数 463
- 疑点：知识库「471 tests」来源为 2026-07-21 job-scheduler F3 验收回执

## 6. 执行前必须读取的文件

1. `knowledge/development-workflow.md` §2.2（前端四连校验门）
2. `knowledge/known-issues.md` I25（问题背景）

## 7. 允许修改的文件范围

- 仅允许**新建**回执文件：
  - `product/kb-verification/receipts/step-VF1-frontend-gate-verify-execution.md`
  - `product/kb-verification/receipts/step-VF1-frontend-gate-verify-test.md`
- **不得修改任何源码、测试、配置、package.json、lock 文件**

## 8. 禁止修改的范围

- `Smart-WorkFlow-Web/` 下**全部**业务代码、测试、配置、package.json、pnpm-lock — 一律禁止改动
- 本任务是「只读运行 + 记录」，任何源码 diff 都视为越界

## 9. 详细执行方案

在 `Smart-WorkFlow-Web/` 目录下按序执行（如依赖未装先 `pnpm install`，但不得改动 lock 文件的受控内容——仅安装）：

1. `pnpm typecheck` — 记录退出码
2. `pnpm lint` — 记录退出码 + errors/warnings 计数
3. `pnpm test` — 记录退出码 + Vitest 汇总行 `Test Files N passed`、`Tests N passed`（运行期真实用例数）
4. `pnpm build` — 记录退出码
5. 针对静态 463 与运行期 `Tests N passed` 的差异据实说明来源（`it.each`/`test.each` 参数化、`describe.each`、动态生成用例等）

## 10. 关键实现约束

- 只运行命令、只读输出，不改任何文件（回执除外）
- 报告运行期真实数字，不得沿用知识库旧数字「471」充数
- 四条命令的退出码逐一如实记录，任一非 0 即须在回执反映

## 11. 边界情况

- 若某命令因环境失败：如实记录失败命令、完整错误、退出码，结论标 BLOCKED，不得伪造全绿
- 若实测用例数既非 471 也非 463：如实报告，这正是本任务价值

## 12. 风险和回滚方案

- 本任务不改源码，无回滚需求
- 副作用为 `node_modules/`（若 install）与 `dist/`（build 产物），属正常输出

## 13. 测试方案

### 13.1 静态检查
- 确认执行前后 `git status` 中 `Smart-WorkFlow-Web/` 无源码/配置改动（仅 dist/、node_modules/ 变化）

### 13.2 单元测试
- 本任务即运行全量前端单测（`pnpm test`）；无需新增用例

### 13.3 集成测试
- 无（不新增）

### 13.4 手工验证
- 人工核对 Vitest 汇总行 `Test Files` 与 `Tests` 两个数字

### 13.5 回归检查
- 四连全绿即回归通过；记录任一红灯

## 14. 验收标准

1. 回执含四条命令（typecheck/lint/test/build）逐一退出码
2. 回执含 `pnpm test` 的运行期 `Test Files N passed` 与 `Tests N passed` 真实数字
3. 回执明确回答：运行期用例总数是多少？与静态 463 差异来源是什么？
4. 回执确认 `Smart-WorkFlow-Web/` 无源码/配置 diff（仅 dist/node_modules）
5. 结论为 PASSED（四连全绿且数字取得）/ FAILED（有红灯）/ BLOCKED（环境不可运行）之一

## 15. 执行回执格式

按 `knowledge/shared-constraints.md` §2.4 + 根 `system.md` §7.1 的 13 项，写入 `product/kb-verification/receipts/step-VF1-frontend-gate-verify-execution.md`。

## 16. 测试回执格式

按根 `system.md` §7.2 的 12 项，写入 `product/kb-verification/receipts/step-VF1-frontend-gate-verify-test.md`；§5 各测试项须给出运行期真实计数与各命令退出码。

## 17. 明确禁止事项

- ❌ 不改任何源码/测试/配置/package.json/lock
- ❌ 不「顺手」修任何 lint 告警或测试
- ❌ 不沿用知识库旧数字，必须报实测
- ❌ 不做后端相关任何操作（后端复验是独立的 VB1）
