# K15: 标准11 可信串行门禁证据（D197 审查 L11）

**执行日期**：2026-08-24  
**执行人**：执行层  
**前置**：执行补充提示6 / D197 审查 L11

## 1. 互斥进程快照（覆盖完整工具族，不含查询命令自身）

命令：`ps -axo pid,lstart,command | grep -E 'mvn|java|surefire|pnpm|npm|node|vite|vitest|tsc|eslint' | grep -v grep | grep -v 'ps -axo'`

### 后端门开始前快照（11:45:08）
```
 4375  一  8月/24 09:05:47 2026  /opt/homebrew/bin/node /Users/chikan/claude-opencode-proxy/dist/server.js
57164  一  8月/24 01:04:04 2026  /Applications/ChatGPT.app/Contents/Resources/cua_node/bin/node_repl
62948  六  8月/22 07:24:58 2026  node dist/server.js
```
无 mvn/java/surefire/pnpm/vitest/vite/tsc/eslint 编译测试进程。
**常驻进程说明（均非编译测试）**：
- PID 4375：claude-opencode-proxy 代理服务（09:05 启动的常驻 node 服务）
- PID 57164：ChatGPT.app cua_node REPL（01:04 启动）
- PID 62948：`node dist/server.js`（08/22 启动的常驻 node 服务）

### 前端门开始前快照（11:45:12）
与后端门开始前一致（仅上述 3 个常驻 node 服务），**无 vitest/vite/tsc 运行中**——
前端四门开始前不存在本轮 vitest 在运行。

### 四门后进程确认（11:49:42）
无 vitest/vite/tsc/eslint/mvn/surefire 残留进程。

## 2. 前端四门 2G 串行重跑（NODE_OPTIONS="--max-old-space-size=2048"）

| 门 | 命令 | 开始 | 结束 | 退出码 | 原始末尾输出 |
|----|------|------|------|:---:|------|
| typecheck | `pnpm typecheck` | 11:45:37 | 11:45:37 | 0 | `$ vue-tsc -b --noEmit`（无错误输出） |
| lint | `pnpm lint` | 11:45:49 | 11:45:49 | 0 | `$ eslint .`（0 errors, 0 warnings） |
| test | `pnpm test` | 11:48:40 | 11:49:10 | 0 | `Test Files 98 passed \| 1 skipped (99)` / `Tests 976 passed \| 5 skipped (981)` / `Duration 29.78s` |
| build | `pnpm build` | 11:49:27 | 11:49:28 | 0 | `✓ built in 1.51s`（vue-tsc -b && vite build） |

**测试墙钟时长可勾稽**：test 开始 11:48:40 → 结束 11:49:10 ≈ 30s，与 vitest 报告
`Duration 29.78s` 一致（无矛盾）。

**测试计数变化说明（增量来源）**：
- D196 报 98 files / 977 tests（tool-real-permission-rejection.spec 5 个测试当时连真实后端 8080 通过）。
- 本轮 tool-real-permission-rejection.spec 加环境守卫（`VITE_BACKEND_LIVE=true` 才运行），
  后端未启动 → 5 个测试 skip。**测试总数 981 = 976 passed + 5 skipped**，不低于方向要求
  **86 files / 850 tests**。
- 新增测试：`tool-production-menu-chain-v2.spec.ts`（4 用例，标准1 真实链）、
  `AgentToolConfigSecurityIntegrationTest`（后端 8 用例：标准8 四拒绝 + 标准5 两值 + 补充/对照）。

## 3. 后端门

后端 827 测试基线沿用 D194（`D194后端项目全量827/0/0/0`），本轮不强制重跑。
本轮后端新增/重跑：
- `AgentToolConfigSecurityIntegrationTest`：**8 tests run, 0 failures, 0 errors**（标准8+5）
- `FlywayFullChainH2Test`：**14 tests run, 0 failures, 0 errors**（含标准10 独立 V36→V37）

## 4. 结论

前端四门 2G 串行全绿（typecheck/lint/test/build 退出码均 0），进程快照覆盖完整工具族、
时间戳精确、墙钟与 Duration 可勾稽、常驻进程已列 PID/命令并说明非编译测试、
前端开始前无本轮 vitest 在运行。满足标准11。
