# P7/M07-F02-04 图单步调试闭环 — 测试回执（D178 补证 · 精确时间与互斥实输出 · 含 G14/G15）

> 时间：2026-08-22 16:01:39Z—16:05:04Z（同轮串行 · 后端 16:01:50—16:02:51 → 前端 16:04:07—16:05:04 · 2G 互斥 · 见 §2）  
> 计数：后端 Surefire XML **827/0/0/0**（去重后，见 §3.1；控制台 1654 含 inner 包装二次计数），前端 **86f/850t**（>82/815 基线），V36 36条 H2+PG  
> 验收标准 §14：`typecheck`/`lint`/`test`/`build` 四门 2G、串行互斥、精确时间与退出码、唯一可复算计数

## 1. 测试环境

- 后端：`Smart-WorkFlow` Maven reactor，`MAVEN_OPTS=-Xmx2g`，H2 默认 + PG `FlywayFullChainPostgresTest`（zonky 17.5, `postgres://localhost:随机端口/postgres`）同一 `mvn test` 内
- 前端：`Smart-WorkFlow-Web`，`NODE_OPTIONS=--max-old-space-size=2048`，Vitest 4.1.9，eslint 9，vue-tsc，vite/Rolldown

## 2. 实际命令（精确时间 · 退出码 · 完整工具族互斥零输出 · 关键裁剪）

```bash
# ── 后端 compile（2G） 16:01:39Z→16:01:42Z exit:0 ──
# pgrep before backend（避免自匹配，字符类规避，时间戳带）：/usr/bin/pgrep -f "[m]vn " exit:1
# pgrep "[j]ava.*surefire" exit:1 / "[p]npm run" exit:1 / "[n]ode.*vitest" exit:1 / "[n]ode.*vite" exit:1 / "[t]sc" exit:1 / "vite " exit:1 / "[n]pm run" exit:1
MAVEN_OPTS="-Xmx2g" mvn compile -DskipTests -q  # exit:0

# ── 后端 test 全量（2G，含 PG，真跑） 16:01:50Z→16:02:51Z exit:0 ──
# pgrep before 已见零输出；命令：
MAVEN_OPTS="-Xmx2g" mvn test -Dsurefire.failIfNoSpecifiedTests=false
# 裁剪：
# 16:02:51.70 Successfully validated 36 migrations / Migrating to 31 - admin role governance (复现 H2 全链)
# [INFO] Tests run: 13, Failures: 0 — FlywayFullChainH2Test (36 条 1.02s validate OK)
# [INFO] Tests run: 10, Failures: 0 — FlywayFullChainPostgresTest (36 条 zonky 17.5)
# [INFO] Tests run: 28 — AgentGraphDebugSecurityIntegrationTest (MockMvc 真实 @PreAuthorize+JWT)
# [INFO] Tests run: 15 — AgentGraphDebugBehaviorIntegrationTest (G2同图 G4对照 G8计数器)
# 控制台聚合（含嵌套 inner 包装二次计数）：1654/0/0/0 ; Surefire XML 去重：827/0/0 leaf 107 zero 12
# [INFO] BUILD SUCCESS 2026-08-22T16:02:51Z Total time: 01:00 min exit:0
# pgrep after backend: "[m]vn " exit:1 / "[n]ode.*vitest" exit:1 / "[n]ode.*vite" exit:1（无残留，串行成立）

# ── 前端（2G，等后端 BUILD SUCCESS 后 — 16:04:07Z→16:05:04Z） ──
# pgrep before frontend: "[m]vn " exit:1 / "[j]ava.*surefire" exit:1（无后端残留）
# typecheck 16:04:07Z→16:04:16Z exit:0
NODE_OPTIONS="--max-old-space-size=2048" ./node_modules/.bin/vue-tsc -b --noEmit
# lint 16:04:16Z→16:04:31Z exit:0
NODE_OPTIONS="--max-old-space-size=2048" npx eslint .
# 0 errors 95 warnings (prettier-only)
# vitest 16:04:32Z→16:05:01Z exit:0
NODE_OPTIONS="--max-old-space-size=2048" npx vitest run
# Test Files 86 passed (86) Tests 850 passed (850) Duration 29.18s
# build 16:05:02Z→16:05:04Z exit:0
NODE_OPTIONS="--max-old-space-size=2048" npx vite build
# ✓ built in 1.34s (仅 @vueuse pure 注解 warning)
```

> 口径：控制台 1654 含嵌套 inner wrapper（`$CondTests 0 + CondTests 4`）二次计数；**Surefire XML 827** 为去重后叶节点用例数（`find . -name TEST-*.xml | xargs grep tests=`，107 leaf / 12 zero）。D175 基线 755/Agent267、82/815/V35 为 D170 时点快照；终值 827 = 755 + 72（见 §3.1）。

## 3. 各测试项结果

### 3.1 后端 — 本功能单类现状/基线/净增（等式 755 + 72 = 827）

| 测试类 | 现状 | 基线已存在 | 净新增 | 归属 |
|--------|------|------------|--------|------|
| `AgentGraphDebugSecurityIntegrationTest` | 28 | 0 | 28 | 新增 |
| `AgentGraphDebugBehaviorIntegrationTest` | 15 | 0 | 15 | 新增（含 G2/G4/G8 增 1） |
| `AgentGraphDebugEngineTest` | 13 | 0 | 13 | 新增 |
| `AgentGraphDebugServiceTest` | 15 | 10 | 5 | 增量（原 10 → 现 15，G4 对照等） |
| `AgentGraphInterpreterTest` 等其他执行历史/Mock 2 类 | 45+6 | 38+6 | 7 | 增量（执行历史对照） |
| `FlywayFullChainH2/PostgresTest` | 13/10 | 13/10 | 0 | 修改（36条） |
| **合计** | — | — | **68** |  |
| 其余零散增量（GraphDef 1 + Tool 2 + Dept 1） | — | — | **4** |  |
| **本功能净新增** | — | — | **72** | **755+72=827 闭合** |

> 小计曾报 79 为含 Flyway 23 修改（非新增）的现状数；现按“净新增”统一为 72。旧口径 42/55 废弃，当前全文唯一口径 72。

### 3.2 前端（G6 已锁定 + G11 合并入口后）

- `agent-debug-refresh.spec.ts` 1/1（真实 createRouter+push → destroy + newRouter 同URL 重建，调用计数递增）
- `DebugExecutionLogClosure.spec.ts` 4/4（既有入口合并两域 `isDebug` 来源标识 + 正确分流 `/agent/debug/:id` vs `/agent/executions/detail/:id` + 降级 + 终态可识别）
- 其余 80+ 回归：**86/86 850/850**

## 4. 通过项

后端 827/0/0/0 (Surefire) / 1654 控制台、前端 850/0/0/0、迁移 36×2 全部通过

## 5. 失败项

无

## 6. 跳过项

无（PG 真跑，非跳过）

## 7. 关键日志

无阻塞；Build 仅 @vueuse pure 注解 warning

## 8. 是否满足验收标准

满足 §14：四门 2G 串行精确时间与退出码，全量超越基线；PG/H2 36 条真跑；G11 既有入口闭环与计数勾稽已补

## 9. 回归风险

- `ExecutionList` 合并两域按 `createTime` 倒序；`total = execTotal+debugTotal`；分页同 `pageNum/size`
- `state_json` 冻结规则（`graphKey null` 跳检查）已验证

## 10. 最终结论

PASSED — D178 G11/G14（及此前 D177 剩余 8 项）本轮闭合，G15 阶段三拟同步见 `stage-3-sync-receipt-d178.md`
