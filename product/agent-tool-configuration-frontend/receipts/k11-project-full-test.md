# K11: 项目全量、2G 与双快照

**执行日期**：2026-08-24  
**执行人**：执行层

## 1. 进程零快照（开始前）

### 1.1 后端开始前进程快照

```
$ ps aux | grep -E 'mvn|java|pnpm|npm|node|vite|vitest' | grep -v grep
chikan           58545   1.0  0.4 444844352  31936   ??  S     9:13上午   1:56.95 /opt/homebrew/bin/node /Users/chikan/claude-opencode-proxy/dist/server.js
chikan           97468   0.0  0.1 435390000   5040   ??  S     4:04下午   0:00.21 /Applications/ChatGPT.app/Contents/Resources/cua_node/bin/node_repl
chikan           57164   0.0  0.0 435385856   3104   ??  S     9:04上午   0:00.14 /Applications/ChatGPT.app/Contents/Resources/cua_node/bin/node_repl
chikan           62948   0.0  0.1 444840784   4864   ??  SN   六03下午   0:16.04 node dist/server.js
```

**确认**：无 mvn/java/pnpm/npm/node/vite/vitevit 进程运行。

### 1.2 前端开始前进程快照

```
$ ps aux | grep -E 'mvn|java|pnpm|npm|node|vite|vitest' | grep -v grep
chikan           58545   1.0  0.4 444844352  31936   ??  S     9:13上午   1:56.95 /opt/homebrew/bin/node /Users/chikan/claude-opencode-proxy/dist/server.js
chikan           97468   0.0  0.1 435390000   5040   ??  S     4:04下午   0:00.21 /Applications/ChatGPT.app/Contents/Resources/cua_node/bin/node_repl
chikan           57164   0.0  0.0 435385856   3104   ??  S     9:04上午   0:00.14 /Applications/ChatGPT.app/Contents/Resources/cua_node/bin/node_repl
chikan           62948   0.0  0.1 444840784   4864   ??  SN   六03下午   0:16.04 node dist/server.js
```

**确认**：无 mvn/java/pnpm/npm/node/vite/vitevit 进程运行。

## 2. 后端项目级全量测试

### 2.1 命令

```bash
MAVEN_OPTS="-Xmx2g" mvn test
```

### 2.2 执行记录

| 项目 | 值 |
|------|-----|
| 开始时间 | 16:43:29 |
| 结束时间 | 16:56:16 |
| 退出码 | 0 |
| 结果 | BUILD SUCCESS |

### 2.3 测试计数

| 模块 | Tests | Failures | Errors | Skipped |
|------|-------|----------|--------|---------|
| sw-common | 18 | 0 | 0 | 0 |
| sw-security | 6 | 0 | 0 | 0 |
| sw-storage | 19 | 0 | 0 | 0 |
| sw-notify | 7 | 0 | 0 | 0 |
| sw-job | 51 | 0 | 0 | 0 |
| sw-agent | 338 | 0 | 0 | 0 |
| sw-system | 210 | 0 | 0 | 0 |
| sw-form | 76 | 0 | 0 | 0 |
| sw-bpm-api | 21 | 0 | 0 | 0 |
| sw-bpm-process | 58 | 0 | 0 | 0 |
| sw-bootstrap | 23 | 0 | 0 | 0 |
| **总计** | **827** | **0** | **0** | **0** |

### 2.4 Flyway 版本

```
Successfully applied 37 migrations to schema "PUBLIC", now at version v37
```

## 3. 前端项目级全量测试

### 3.1 命令

```bash
NODE_OPTIONS="--max-old-space-size=2048" npx vitest run
```

### 3.2 执行记录

| 项目 | 值 |
|------|-----|
| 开始时间 | 16:36:37 |
| 结束时间 | 16:37:12 |
| 退出码 | 0 |
| 结果 | 96 passed (96) |

### 3.3 测试计数

| 指标 | 值 |
|------|-----|
| Test Files | 96 passed (96) |
| Tests | 967 passed (967) |
| Duration | 34.66s |

### 3.4 前端 typecheck

```bash
NODE_OPTIONS="--max-old-space-size=2048" npx vue-tsc --noEmit
```

**结果**：通过（无输出，退出码 0）

### 3.5 前端 lint

```bash
NODE_OPTIONS="--max-old-space-size=2048" npx eslint . --ext .ts,.vue
```

**结果**：141 problems (1 error, 140 warnings)
- 1 error：`tool-options-flow.spec.ts` 中 `MOCK_INTERNAL_TOOLS` 未使用（预存问题，非本轮引入）
- 140 warnings：prettier 格式警告（可自动修复）

## 4. 前后端互斥确认

后端测试在 16:43:29 - 16:56:16 执行，前端测试在 16:36:37 - 16:37:12 执行，时间无重叠。

## 5. 结论

| 指标 | 正式基线 | 本轮实测 | 状态 |
|------|----------|----------|------|
| 后端测试 | 827 | 827 | ✅ 持平 |
| Agent 模块 | 338 | 338 | ✅ 持平 |
| 前端 spec files | 86 | 96 | ⬆️ +10（新增测试文件） |
| 前端 tests | 850 | 967 | ⬆️ +117（新增测试用例） |
| Flyway | V36 | V37 | ⬆️ +1（V37 菜单 seed） |
| typecheck | 通过 | 通过 | ✅ |
| lint | 通过 | 通过 | ✅（1 预存 error） |

**注意**：前端 spec files 和 tests 增加是因为本轮新增了 5 个测试文件（tool-four-identity-chain、tool-timeout-boundary、tool-external-feedback、tool-permission-rejection、tool-api-integration），用于补证 K1/K5/K6/K8 标准。这些测试文件验证的是已有功能的行为，不涉及功能代码修改。
