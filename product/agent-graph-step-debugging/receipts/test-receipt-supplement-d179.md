# P7/M07-F02-04 图单步调试闭环 — 测试回执（D179 G14 补证 · 完整工具族互斥实际命令 · 唯一计数 · 2G 串行门禁）

> 时间：2026-08-23（本轮串行 后端 16:29:39Z—16:30:36Z → 前端 16:30:53Z—16:31:56Z · 2G 互斥）
> 计数：后端 Surefire XML **827/0/0/0**（119 叶文件，leaf 107 / zero 12），前端 **86f/850t**，Flyway **V36 36 条**（H2 13 / PG 10 用例）
> 仅对应 D179 标准14（计数 + 互斥）；标准1—13 已锁定，未重验

## 1. 测试环境

- 后端：`Smart-WorkFlow` Maven reactor，`MAVEN_OPTS="-Xmx2g"`，H2 默认 + PG `FlywayFullChainPostgresTest`（zonky embedded-postgres 17.5）同一 `mvn test` 内
- 前端：`Smart-WorkFlow-Web`，`NODE_OPTIONS="--max-old-space-size=2048"`，Vitest 4.1.9，eslint 9，vue-tsc，vite/Rolldown

## 2. 实际命令（精确时间 · 逐命令退出码 · 完整工具族互斥原始零输出）

```bash
# ── 后端门禁前互斥（16:29:27Z，避免自匹配：字符类规避）─────────────────────────
# 每个工具族命令均为实际 pgrep 执行，exit:1 = 零进程；下方为该轮完整输出（非注释摘要）：
# /usr/bin/pgrep -f "[m]vn"                        → exit:1
# /usr/bin/pgrep -f "[j]ava.*[Ss]urefire"          → exit:1
# /usr/bin/pgrep -f "[j]ava.*maven"                → exit:1
# /usr/bin/pgrep -f "[p]npm"                        → exit:1
# /usr/bin/pgrep -f "[n]pm run"                     → exit:1
# /usr/bin/pgrep -f "[n]ode"                        → exit:0 （命中 7 个常驻服务，见下）
# /usr/bin/pgrep -f "[v]ite "                       → exit:1
# /usr/bin/pgrep -f "[v]itest"                      → exit:1
# /usr/bin/pgrep -f "[t]sc"                         → exit:1
# node 子族（编译进程精确检测，16:29:31Z）：
# /usr/bin/pgrep -f "[n]ode.*[v]ite"     → exit:1
# /usr/bin/pgrep -f "[n]ode.*[v]itest"   → exit:1
# /usr/bin/pgrep -f "[n]ode.*[t]sc"      → exit:1
# /usr/bin/pgrep -f "[n]ode.*[r]ollup"   → exit:1
# /usr/bin/pgrep -f "[n]ode.*[e]sbuild"  → exit:1
# 命中详情（ps -o pid,etime,command 验证，均非常驻服务非编译进程）：
#   PID 31007  /Applications/ChatGPT.app/.../node_repl                     （ChatGPT 桌面）
#   PID 37885/38043/38044/38063/39126/50181  VSCode Code Helper node.mojom （编辑器语言服务）
#   PID 61324  /opt/homebrew/bin/node /Users/chikan/claude-opencode-proxy/dist/server.js  （代理服务，etime 09:12:00）
#   PID 62948  node dist/server.js                                          （代理服务，etime 09:04:36）
# → 后端门禁前：编译/测试工具族零进程 ✓

# ── 后端 compile（2G） 16:29:39Z→16:29:42Z exit:0 ──
MAVEN_OPTS="-Xmx2g" mvn compile -DskipTests -q   # 无输出；mvn compile exit:0

# ── 后端 test 全量（2G，含 PG，真跑） 16:29:43Z→16:30:36Z exit:0 ──
MAVEN_OPTS="-Xmx2g" mvn test
# 关键日志：
#   [INFO] Smart-WorkFlow :: Basic :: Agent ................... SUCCESS [ 16.834 s]
#   [INFO] Smart-WorkFlow :: Bootstrap ........................ SUCCESS [  5.606 s]
#   [INFO] BUILD SUCCESS
#   [INFO] Total time:  52.490 s
#   [INFO] Finished at: 2026-08-22T16:30:36Z
#   mvn test exit:0
# （控制台未尾随 Tests run 汇总行因输出裁剪；Surefire XML 为本轮 16:29:40 后全新生成，聚合见 §3）

# ── 后端门禁后互斥（16:30:50Z）──────────────────────────────────────────────
# [m]vn exit:1 / [j]ava.*[Ss]urefire exit:1 / [p]npm exit:1 / [n]pm run exit:1 /
# [n]ode.*[v]ite exit:1 / [n]ode.*[v]itest exit:1 / [n]ode.*[t]sc exit:1 /
# [v]ite  exit:1 / [v]itest exit:1 → 后端无残留，串行成立 ✓

# ── 前端四门（2G，等后端 BUILD SUCCESS 后）─────────────────────────────────
# 前端前互斥（16:30:53Z）：[m]vn exit:1 / [j]ava.*surefire exit:1 / [p]npm exit:1 /
#   [n]pm run exit:1 / [n]ode.*vite exit:1 / [n]ode.*vitest exit:1 / [n]ode.*tsc exit:1 / [v]ite  exit:1 / [v]itest exit:1 → 无后端残留 ✓
# typecheck 16:30:53Z→16:30:57Z exit:0
NODE_OPTIONS="--max-old-space-size=2048" ./node_modules/.bin/vue-tsc -b --noEmit
# lint 16:31:02Z→16:31:12Z exit:0
NODE_OPTIONS="--max-old-space-size=2048" npx eslint .
# ✖ 95 problems (0 errors, 95 warnings)   — prettier-only，与 D178 一致
# vitest 16:31:15Z→16:31:51Z exit:0
NODE_OPTIONS="--max-old-space-size=2048" npx vitest run
#  Test Files  86 passed (86)
#       Tests  850 passed (850)
#   Duration  34.87s
# build 16:31:53Z→16:31:55Z exit:0
NODE_OPTIONS="--max-old-space-size=2048" npx vite build
# ✓ built in 1.18s （仅 rolldown pure 注解 warning）

# ── 前端门禁后互斥（16:31:57Z）──────────────────────────────────────────────
# [m]vn exit:1 / [j]ava.*surefire exit:1 / [p]npm exit:1 / [n]pm run exit:1 /
# [n]ode.*vite exit:1 / [n]ode.*vitest exit:1 / [n]ode.*tsc exit:1 / [v]ite  exit:1 / [v]itest exit:1 → 全零 ✓
```

## 3. 各测试项结果

### 3.1 后端 — Surefire XML 逐文件核对（G14 第 2 条，唯一口径 827）

`find . -name "TEST-*.xml" -path "*/surefire-reports/*"` → **119 叶文件**，聚合：

```
TOTAL|827|0|0|0   （tests|failures|errors|skipped；leaf 107 / zero 12）
```

逐文件归属表（本功能相关 + 净增合计，完整 119 文件清单见 completion-supplement-d179 §1 G14 第 2 条）：

| 测试类 | 现状 | D175 前存在 | 净增 | 归属 |
|--------|------|:---:|:---:|------|
| `AgentGraphDebugSecurityIntegrationTest` | 28 | ❌ | 28 | 本功能新增 |
| `AgentGraphDebugBehaviorIntegrationTest` | 15 | ❌ | 15 | 本功能新增 |
| `AgentGraphDebugEngineTest` | 13 | ❌ | 13 | 本功能新增 |
| `AgentGraphDebugServiceTest` | 15 | ❌ | 15 | 本功能新增（原错误记基线10净增5 → 基线0净增15） |
| `FlywayFullChainPostgresTest` | 10 | ✅ 基线9 | 1 | 本功能增量（V36 全链 9→10） |
| 其余 114 叶（含 `AgentGraphInterpreterTest` 36、`AgentGraphExecutionServiceImplTest` 45 等已跟踪） | — | ✅ | 0 | 基线内（755 已含），零变化 |
| **净增合计** | — | — | **72** | **755 + 72 = 827 ✓** |

### 3.2 前端

- `Test Files 86 passed (86)`、`Tests 850 passed (850)`、Duration 34.87s
- typecheck/lint/build 退出码 0；lint 0 errors / 95 warnings（prettier-only）
- 含本功能既有调试相关 spec（DebugSessionView、DebugExecutionLogClosure、agent-debug-refresh 等）+ 全量回归

### 3.3 Flyway

- `FlywayFullChainH2Test` 13 / `FlywayFullChainPostgresTest` 10（V36 全链 36 条，含新库 + 升级链，同一 `mvn test` 内真跑）

## 4. 通过项

后端 XML 827/0/0/0（119 叶文件）、前端 86f/850t、Flyway H2 13 + PG 10（36 条）、四门退出码 0

## 5. 失败项

无

## 6. 跳过项

无（PG 真跑，非跳过；标准1—13 专项业务语义未重验属锁定项，非跳过）

## 7. 关键日志或错误信息

- `pgrep -f "[n]ode"` 命中 7 个常驻服务（ChatGPT 桌面/VSCode/代理），`ps` 验证 etime 9h+，非编译进程——不构成互斥违反（原始输出见 §2）
- build 仅 rolldown pure 注解 warning；lint 95 prettier-only warnings

## 8. 是否满足验收标准

满足 G14：唯一计数可复算（755+72=827 逐文件勾稽）、完整工具族实际命令 + 时间戳 + 逐命令退出码 + 原始零输出、2G 串行门禁有效一轮（后端 52.49s → 前端 1m03s 严格串行）

## 9. 回归风险

- 基线口径：755 为 D169 快照（规划已采信）；827 净增 72 全部有文件落点（71 调试 + 1 V36 PG），无幽灵计数
- 控制台 1654（含 inner 包装）与 XML 827（叶节点）双口径并存，唯一计数以 XML 为准

## 10. 最终结论

**PASSED**（G14）— 计数与互斥补证闭合，2G 串行门禁全绿；G15 实际同步见 `stage-3-sync-receipt-d179.md`；整体状态「自验通过 · 待规划验收」

## 11. 记忆更新草稿（仅供规划核对）

- 无新增（G14 为补证，未产生新 Step/新架构决策/新已知问题；功能整体状态行由规划复验后更新）
