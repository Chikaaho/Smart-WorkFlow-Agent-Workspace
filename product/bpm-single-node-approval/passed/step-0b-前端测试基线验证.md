# Step 0b：前端测试基线验证

> 需求：M04-F01-01 BPM 单节点审批前后端联通
> 定位：前置验证 — 前端
> 目标：确认 33 个 spec 文件基线健康，不修复任何问题

---

## 1. 当前状态

功能 M04-F01-01 BPM 单节点审批前后端联通处于 PLANNING 阶段。前端 33 个 spec 文件当前通过状态为 REPORTED，未经新环境独立验证。此前端基线验证与后端基线验证（Step 0a）并行无依赖。

## 2. Step 目标

在具备 Node 20+ + pnpm 环境的机器上执行四连校验门 `pnpm typecheck && pnpm lint && pnpm test && pnpm build`，确认 33 个 spec 基线健康状态，报告结果。**不修复任何问题。**

## 3. 推荐模型

```text
推荐模型：deepseek-v4-flash
选择理由：纯机械执行四个 pnpm 命令并捕获输出，零代码修改，零推理需求
是否触发升级条件：否
```

## 4. 模型选择理由

本 Step 唯一动作是运行已有 pnpm scripts，不写代码、不做决策。

## 5. 已知上下文

- Vue 3.5 + TypeScript 6.0 + Vite 8 + Vitest 4
- 33 个 spec 文件，使用 `jsdom` 测试环境
- 自定义 mock 框架（`foundation/mock/`），非 MSW
- `vitest.config.ts`：`globals: true`、`css: false`、自定义 CSS mock 插件、Element Plus 自动导入（`importStyle: false`）
- 无 `setupFiles`，测试自行处理 mock
- 校验门：四连 `&&` 串联，任一步失败则停止

## 6. 执行前必须读取的文件

（无强制性读取。以下为可选的参考文件）

1. `Smart-WorkFlow-Web/package.json` — 确认 scripts 和依赖
2. `Smart-WorkFlow-Web/vitest.config.ts` — 确认测试配置

## 7. 允许修改的文件范围

**本 Step 不修改任何文件。** 仅执行命令并报告结果。

## 8. 禁止修改的范围

- 禁止修改 `Smart-WorkFlow-Web/` 下的任何 `.vue`、`.ts`、`.json`、`.js` 文件
- 禁止安装/删除/升级任何 npm 依赖（`pnpm install` 恢复已有依赖除外）
- 禁止执行 `pnpm dev` 或 `pnpm dev:mock`
- 禁止修改 `vite.config.ts`、`vitest.config.ts`、`tsconfig.json`、`.eslintrc` 等配置文件

## 9. 详细执行方案

```bash
# 0. 环境检查
node --version
pnpm --version

# 1. 进入前端项目目录
cd /data/reasonix/files/Smart-WorkFlow-Web

# 2. 如果 node_modules 不存在，先安装依赖
# pnpm install --frozen-lockfile

# 3. 四连校验门
pnpm typecheck && pnpm lint && pnpm test && pnpm build
```

**每步预期**：

| 命令 | 预期退出码 | 关键输出 |
|------|:---:|------|
| `node --version` | 0 | ≥ v20.x |
| `pnpm --version` | 0 | ≥ 8.x |
| `pnpm typecheck` | 0 | `vue-tsc` 类型检查通过 |
| `pnpm lint` | 0 | ESLint 0 error（如有 warning 记录数量） |
| `pnpm test` | 0 | `Test Files N passed`（预期 33）+ `Tests N passed` |
| `pnpm build` | 0 | `✓ built in X.Xs` |

## 10. 关键实现约束

- **只读操作**：四个命令不修改源文件，`pnpm build` 只在 `dist/` 生成构建产物
- **不修复**：无论结果如何，只报告不修改
- **全量运行**：不使用 `--grep` 或文件过滤
- **串行执行**：`&&` 串联，任一步失败则停止，需报告当前进度
- **退出码精确捕获**

## 11. 边界情况

- **node_modules 不存在**：先执行 `pnpm install`，在回执 §9 中注明
- **pnpm 不可用**：检查 `npm` 是否可用，尝试 `npm run` 替代，报告差异
- **`pnpm lint` 有 warning**：记录数量和来源文件。warning 不改变退出码，不阻塞 `&&`
- **`pnpm build` 较慢**：首次构建耗时正常，无需干预
- **依赖版本冲突**：使用 `pnpm install --frozen-lockfile` 严格按 lockfile

## 12. 风险和回滚方案

- **风险**：`node_modules` 不完整或版本不匹配
- **缓解**：必要时 `pnpm install --frozen-lockfile`
- **风险**：`jsdom` 缺少浏览器 API（`ResizeObserver` 等）
- **缓解**：已有测试已处理；新环境暴露的新问题仅报告
- **回滚**：无需回滚。如 `pnpm install` 改变了 `node_modules`，可 `git checkout -- package.json pnpm-lock.yaml` 后重新安装

## 13. 测试方案

### 13.1 静态检查

- `node --version` ≥ 20
- `pnpm --version` ≥ 8

### 13.2 ~ 13.5

本 Step 本身就是测试执行，不新增测试。

## 14. 验收标准

| # | 标准 | 验证方式 |
|---|------|----------|
| S0b-1 | `node --version` 和 `pnpm --version` 已报告 | 回执 §6 |
| S0b-2 | `pnpm typecheck` 退出码已报告 | 回执 §7 |
| S0b-3 | `pnpm lint` 退出码已报告（含 warning 数量） | 回执 §7 |
| S0b-4 | `pnpm test` 已执行，含完整测试计数（Test Files N passed, Tests N passed） | 回执 §7 |
| S0b-5 | `pnpm build` 退出码已报告 | 回执 §7 |
| S0b-6 | 如存在失败，列出所有失败项详情 | 回执 §7 |

## 15. 执行回执格式

```markdown
# 执行回执

## 1. Step 编号和名称
Step 0b：前端测试基线验证

## 2. 使用模型
（实际使用的模型名称）

## 3. 实际读取的文件
（列出执行前读取的文件，无则写"无"）

## 4. 实际修改的文件
无

## 5. 每个文件的修改摘要
无

## 6. 实际执行的命令
（逐条列出：node --version、pnpm --version、pnpm typecheck、pnpm lint、pnpm test、pnpm build）
（如执行了 pnpm install，列出完整命令）

## 7. 命令输出摘要
- Node 版本：
- pnpm 版本：
- typecheck（退出码、错误数）：
- lint（退出码、error 数、warning 数）：
- test（Test Files N passed、Tests N passed、退出码）：
- build（退出码、构建时间）：

## 8. 与原方案的偏差
（是否严格按方案执行，如有偏差说明原因）

## 9. 遇到的问题
（node_modules 缺失、依赖版本不匹配等）

## 10. 未完成内容
（方案要求但未执行的内容及原因）

## 11. 风险和注意事项
（发现的环境相关风险）

## 12. Git diff 摘要
无 diff（未修改任何文件）；如 build 生成了 dist/，注明

## 13. 建议执行的测试
（如有测试失败，建议排查方向）
```

## 16. 测试回执格式

本 Step 执行与测试合一，仅需执行回执（§15），不需要单独的测试回执。

## 17. 明确禁止事项

- ❌ 禁止修改任何 `.vue`、`.ts`、`.json`、`.js` 文件
- ❌ 禁止跳过任何 spec 文件
- ❌ 禁止安装/删除/升级任何 npm 依赖（`pnpm install` 恢复 lockfile 已有依赖除外）
- ❌ 禁止启动 `pnpm dev` 或 `pnpm dev:mock`
- ❌ 禁止修改 `vitest.config.ts`、`vite.config.ts`、`tsconfig.json`、`.eslintrc`
- ❌ 禁止修改 `.env` 或 `.env.mock`
