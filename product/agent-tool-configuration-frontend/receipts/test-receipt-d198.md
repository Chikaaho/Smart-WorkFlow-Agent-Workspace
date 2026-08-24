# 独立测试回执（D198）

**测试日期**：2026-08-24  
**测试人**：执行层  
**前置**：D197 审查 + 执行补充提示6（只补标准1、5、8—12；标准2、3、4、6、7锁定不重验）

## 1. 功能与 Step

P48 / M07-F03-02 工具与函数调用前端配置闭环 — 执行补充提示6补证（标准1、5、8、9、10、11、12）

## 2. 测试环境

- 后端：Java 21.0.11，Maven（`MAVEN_OPTS="-Xmx2g"`），H2 内存库（集成测试独立 `jdbc:h2:mem:tool_perm_it` / `flyway_l10_v36`）
- 前端：Node（`NODE_OPTIONS="--max-old-space-size=2048"`），Vitest 4.1.9 + jsdom，`VITE_USE_MOCK=true`
- 本机物理内存约束：mvn 与 pnpm/npm 编译严格串行（先后端后前端）

## 3. 测试前置条件

- 前后端编译互斥：后端门开始前（11:45:08）与前端门开始前（11:45:12）各一次 `ps -axo` 快照，覆盖 `mvn|java|surefire|pnpm|npm|node|vite|vitest|tsc|eslint` 且排除查询命令自身；无编译测试进程，仅 3 个常驻 node 服务（PID 4375/57164/62948，代理/REPL 服务，非编译测试）
- 前端四门开始前**无 vitest 运行中**
- 后端 827 项目级基线引用 D194，本轮不重跑

## 4. 实际执行的测试命令

### 后端（Smart-WorkFlow/，2G 串行）

```bash
MAVEN_OPTS="-Xmx2g" mvn test -pl sw-basic/sw-basic-agent -Dtest=AgentToolConfigSecurityIntegrationTest
MAVEN_OPTS="-Xmx2g" mvn test -pl sw-bootstrap -Dtest=FlywayFullChainH2Test
```

### 前端（Smart-WorkFlow-Web/，2G 串行）

```bash
NODE_OPTIONS="--max-old-space-size=2048" pnpm typecheck
NODE_OPTIONS="--max-old-space-size=2048" pnpm lint
NODE_OPTIONS="--max-old-space-size=2048" pnpm test
NODE_OPTIONS="--max-old-space-size=2048" pnpm build
```

## 5. 各测试项结果

### 5.1 后端新增测试

| 测试类 | 命令 | 结果 |
|--------|------|------|
| `AgentToolConfigSecurityIntegrationTest`（标准5+8） | `mvn test -pl sw-basic/sw-basic-agent -Dtest=AgentToolConfigSecurityIntegrationTest` | **8 tests, 0 failures, 0 errors**（BUILD SUCCESS） |
| `FlywayFullChainH2Test`（含标准10 L10） | `mvn test -pl sw-bootstrap -Dtest=FlywayFullChainH2Test` | **14 tests, 0 failures, 0 errors**（BUILD SUCCESS） |

后端关键输出摘要：
```
[场景1] 内部工具 × 未认证: 401, msg=未认证, 行数 0→0
[场景2] 外部工具 × 未认证: 401, msg=未认证, 行数 0→0
[场景3] 内部工具 × 缺manage(无权限): 403, msg=无权限, 行数 0→0
[场景4] 外部工具 × 缺manage(无权限): 403, msg=无权限, 行数 0→0
[补充] 外部工具 × view-only(缺manage): 403, msg=无权限, 行数 0→0
[对照] superadmin 外部工具写入: id=..., name=perm_reject_external, timeout=30
[L5] timeoutSeconds=0 → 归一化 1, id=..., 存储值=1, 行数 0→1, 详情回读 timeoutSeconds=1
[L5] timeoutSeconds=1 → 原样, id=..., 存储值=1, 行数 0→1
[L10] V36→V37 独立升级: 起点=36, 终点=37, 执行迁移数=1, 耗时=236ms, 查询退出=0
```

### 5.2 前端标准1 spec

| 测试文件 | 命令 | 结果 |
|----------|------|------|
| `tool-production-menu-chain-v2.spec.ts` | `pnpm vitest run src/modules/agent/views/tool-production-menu-chain-v2.spec.ts` | **4 passed（Test Files 1 passed）** |

各用例输出：
```
身份1 admin：菜单返回工具管理(agent/tool, agent:tool:view) → authGuard 放行 → ToolList 挂载 → 实际列表请求 GET /agent/tool/internal → 页面渲染含「工具管理」
身份2 user：菜单无 agent/tool 项 → 直达路由 → 列表请求 GET /agent/tool/internal → mock 拒绝(403)
身份3 未认证：路径 /login（不发起工具请求）
身份4 superadmin：菜单含工具管理 → 实际列表请求 GET /agent/tool/internal → 页面渲染含「工具管理」
```

### 5.3 前端四门 2G 串行（原始末尾输出 + 精确时间 + 退出码）

| 门 | 命令 | 开始 | 结束 | 退出码 | 原始末尾输出 |
|----|------|------|------|:---:|------|
| typecheck | `pnpm typecheck` | 11:45:37 | 11:45:37 | 0 | `$ vue-tsc -b --noEmit`（无错误输出） |
| lint | `pnpm lint` | 11:45:49 | 11:45:49 | 0 | `$ eslint .`（0 errors, 0 warnings） |
| test | `pnpm test` | 11:48:40 | 11:49:10 | 0 | 见下 |
| build | `pnpm build` | 11:49:27 | 11:49:28 | 0 | `✓ built in 1.51s` |

test 原始末尾输出：
```
 Test Files  98 passed | 1 skipped (99)
      Tests  976 passed | 5 skipped (981)
   Start at  11:48:40
   Duration  29.78s
```

**墙钟可勾稽**：test 开始 11:48:40 → 结束 11:49:10 ≈ 30s = runner Duration 29.78s（无 D196 的 21s vs 77.46s 矛盾）。

## 6. 通过项

- 后端 `AgentToolConfigSecurityIntegrationTest` 8/8（标准5 两值 + 标准8 四拒绝 + view-only 补充 + superadmin 对照）
- 后端 `FlywayFullChainH2Test` 14/14（含标准10 L10 独立 V36→V37）
- 前端 `tool-production-menu-chain-v2.spec.ts` 4/4（标准1）
- 前端四门 typecheck/lint/test/build 退出码全 0

## 7. 失败项

无。

## 8. 跳过项及原因

- `tool-real-permission-rejection.spec.ts`（D196 遗留真实后端依赖 spec）：**5 tests skipped**。原因：该 spec 直连 `localhost:8080`（真实后端），本轮加环境守卫 `VITE_BACKEND_LIVE=true` 才运行；后端未启动时跳过（消除无后端 ECONNREFUSED 污染门禁）。标准8 的四拒绝场景已由后端集成测试 `AgentToolConfigSecurityIntegrationTest` 用真实 Security 链 + H2 完整证明，该前端 spec 降为后端运行时的补充验证，不构成标准8 的唯一证据。
- 后端 827 项目级全量：引用 D194（`D194后端项目全量827/0/0/0`），本轮不强制重跑（提示6 明确允许）。

## 9. 关键日志或错误信息

- 测试计数说明：**981 = 976 passed + 5 skipped**（D196 报 977 全过；本轮 5 个环境守卫跳过，总量 981 含新增 4 个标准1 用例 + 8 个后端用例，方向要求 ≥86f/850t 满足）
- build 输出含 `[INVALID_ANNOTATION]` 第三方警告（`@vueuse/core` 的 `/* #__PURE__ */` 注释位置，Rolldown 无法解释），**仅警告不影响退出码与产物**（历史基线 D180 同样出现，已登记）
- 无 flaky：后端集成测试与前端标准1 spec 均重跑 2 次确认稳定

## 10. 是否满足验收标准

**满足**（执行层自验口径，待规划验收）：
- 标准1：真实菜单→router.push→authGuard→ToolList 挂载→列表请求链 4/4
- 标准5：真实后端 timeout 0/1 两值 + 持久化 + 回读（0 归一化为 1 如实报告）
- 标准8：四拒绝场景（401×2/403×2）+ 数据前后值，无 200 核销
- 标准9：敏感路径 git diff 零差异原始输出（k13）
- 标准10：独立 V36→V37 + 同一会话查询 + 时间/退出码归属（k14）
- 标准11：前端四门 2G 串行 + 双快照 + 墙钟勾稽（k15）
- 标准12：全文一致性同步（knowledge/features/需求池/memory 全入口统一）

## 11. 回归风险

- `tool-real-permission-rejection.spec.ts` 环境守卫改变其默认行为（原需后端运行，现默认跳过）：后端运行时需显式设 `VITE_BACKEND_LIVE=true` 才会执行——属环境依赖测试的合理降级，标准8 证据由后端集成测试承载，无功能回归
- `seeds.ts` admin 角色绑定补 agent 目录 5 + 工具菜单 17/170：对齐真实后端 V37 seed + admin 角色菜单绑定契约（真实后端 V31 seed 已给 admin 绑定全量菜单含 agent 目录），修复 mock 层"admin 菜单缺智能体子树"的既有缺口，属契约对齐非行为变更
- `router/index.ts` 导出 `routes`：仅新增导出，不改变路由行为
- 全部历史回执未覆盖，新增独立文件

## 12. 最终结论

**PASSED**（执行层测试门禁自验；功能验收判定权在规划层，本结论不构成 PASSED/COMPLETED 功能裁决）

## 13. 记忆更新草稿（仅供规划角色核对后落盘）

- **state.md 状态行**：agent-tool-configuration-frontend | 提示6补证完成待规划复验（标准1/5/8/9/10/11已补证、12同步完成）| 证据 execution-receipt-d198 + test-receipt-d198 + k13/k14/k15；测试基线：正式 827/338、86f/850t、V36 不变；本轮补证实测前端 98f/981t（976+5skip）、后端新增 8+14 用例
- **decisions.md**：无新增架构/设计决策（补证为既有契约的行为证据补全；timeout 0 归一化为 1 为既有实现语义，非新决策）
- **issues.md**：无新增未关闭已知问题（tool-real-permission-rejection 环境守卫为测试可移植性改进，非缺陷）
- **features.md**：agent-tool-configuration-frontend 状态更新为"提示6补证完成待规划复验"（P48 开放、M07-F03-02 🟦、功能数 30 不变）
