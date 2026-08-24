# 独立测试回执 — P48 / M07-F03-02 工具与函数调用前端配置闭环

**测试轮次**：D186（D185 首轮验收 FAILED 后补证）
**测试日期**：2026-08-24

---

## 1. 前端测试

### 1.1 typecheck

```
$ NODE_OPTIONS="--max-old-space-size=2048" npx vue-tsc --noEmit
# 退出码：0
# 错误数：0
```

### 1.2 lint

```
$ NODE_OPTIONS="--max-old-space-size=2048" npx eslint src/
# 退出码：0
# 错误数：0（新增 3 个 spec 文件已通过 eslint 检查）
```

### 1.3 vitest 全量

```
$ NODE_OPTIONS="--max-old-space-size=2048" npx vitest run
# 退出码：0
# 开始时间：2026-08-24 11:51:02
# 结束时间：2026-08-24 11:51:27
# 耗时：25.04s
# Test Files：89 passed (89)
# Tests：880 passed (880)
# 失败数：0
```

**计数说明**：
- D185 首轮：86 files / 850 tests（含 2 个失败）
- D186 补证：89 files / 880 tests（0 失败）
- 变化：+3 个新增 spec 文件（ToolList + InternalToolFormDialog + ExternalToolFormDialog），+30 个新测试用例
- 2 个预存在失败（agent-debug-handlers.spec.ts）已修复：expiresAt 时区 bug → 880 tests 全绿

### 1.4 vite build

```
$ NODE_OPTIONS="--max-old-space-size=2048" npx vite build
# 退出码：0
# 耗时：1.29s
# 构建成功
```

---

## 2. 后端测试

### 2.1 Agent 模块

```
$ MAVEN_OPTS="-Xmx2g" mvn test -pl sw-basic/sw-basic-agent
# 退出码：0
# Tests run: 338, Failures: 0, Errors: 0, Skipped: 0
# BUILD SUCCESS
```

### 2.2 Bootstrap（Flyway 迁移）

```
$ MAVEN_OPTS="-Xmx2g" mvn test -pl sw-bootstrap
# 退出码：0
# FlywayFullChainH2Test: 13 tests passed
# FlywayFullChainPostgresTest: 10 tests passed
# Tests run: 23, Failures: 0, Errors: 0, Skipped: 0
# BUILD SUCCESS
# V37 双方言全链确认
```

---

## 3. 互斥进程快照

```
$ ps aux | grep -E "mvn|java|pnpm|npm|node|vite|vitest" | grep -v grep
# 结果：无 Maven/Java/pnpm/npm/node/vite/vitest 项目进程
# 前端编译期间无后端进程；后端编译期间无前端进程
# 完整工具族互斥确认：mvn ✓ pnpm ✓ npm ✓ node ✓ vite ✓ vitest ✓ java ✓
```

---

## 4. 测试基线核对

| 项目 | D185 首轮 | D186 补证 | 变化 | 基线要求 |
|------|----------|----------|------|---------|
| 前端 spec files | 86 | 89 | +3 | ≥86 ✅ |
| 前端 tests | 850（2 failed） | 880（0 failed） | +30 | ≥850 ✅ 全绿 ✅ |
| 后端 Agent 模块 | 338 | 338 | 持平 | ≥338 ✅ |
| Bootstrap | 23 | 23 | 持平 | ≥23 ✅ |
| Flyway | V37 | V37 | 持平 | V37 双方言 ✅ |
| vue-tsc | 0 errors | 0 errors | 持平 | 0 errors ✅ |
| eslint | 0 errors | 0 errors | 持平 | 0 errors ✅ |
| vite build | 通过 | 通过 | 持平 | 通过 ✅ |

---

**测试时间**：2026-08-24
**测试者**：执行代理
