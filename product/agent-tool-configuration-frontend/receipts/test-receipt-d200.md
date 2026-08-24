# 独立测试回执（D200）

**测试日期**：2026-08-24  
**测试人**：执行层  
**前置**：D199 审查 + 执行补充提示7（只补标准1、11、12；标准2—10锁定不重验）

## 1. 功能与 Step

P48 / M07-F03-02 工具与函数调用前端配置闭环 — 执行补充提示7补证（标准1、11、12）

## 2. 测试环境

- 后端：Java 21.0.11，dev profile（H2 内存库），`SW_CIPHER_KEY` 注入，`MAVEN_OPTS="-Xmx2g"`
- 前端：Node，`NODE_OPTIONS="--max-old-space-size=2048"`，Vitest 4.1.9 + jsdom
- 本机物理内存约束：mvn 与 pnpm/npm 编译严格串行

## 3. 测试前置条件

- 真实后端已启动（标准1 需要生产菜单响应）：`POST /api/auth/login` → 200（12:05:03）
- 普通用户 tooluser 已创建并绑定 V37 菜单 212/213（经真实 API）
- 前后端编译互斥：后端门与前端门串行执行，前端门开始前快照在后端门结束后采集

## 4. 实际执行的测试命令

### 后端（Smart-WorkFlow/，2G 串行，毫秒时间戳）

```bash
# 后端门1（12:11:19 → 12:11:27，退出码 0）
MAVEN_OPTS="-Xmx2g" mvn test -pl sw-basic/sw-basic-agent -Dtest=AgentToolConfigSecurityIntegrationTest -DfailIfNoTests=false
# 后端门2（1787573491704 → 1787573496699 ms，退出码 0）
MAVEN_OPTS="-Xmx2g" mvn test -pl sw-bootstrap -Dtest=FlywayFullChainH2Test -DfailIfNoTests=false
```

### 前端（Smart-WorkFlow-Web/，2G 串行，毫秒时间戳）

```bash
# 标准1 真实后端链（独立配置）
NODE_OPTIONS="--max-old-space-size=2048" pnpm vitest run --config vitest.live.config.ts src/modules/agent/views/tool-production-menu-chain-live.spec.ts
# 四门（串行）
NODE_OPTIONS="--max-old-space-size=2048" pnpm typecheck   # 1787574004489 → 1787574012542，退出 0
NODE_OPTIONS="--max-old-space-size=2048" pnpm lint        # 1787574012573 → 1787574024068，退出 0
NODE_OPTIONS="--max-old-space-size=2048" pnpm test        # 1787573957351 → 1787573986896，退出 0
NODE_OPTIONS="--max-old-space-size=2048" pnpm build       # 1787573989867 → 1787574000765，退出 0
```

## 5. 各测试项结果

### 5.1 标准1 真实后端链（tool-production-menu-chain-live.spec.ts）

```
Test Files  1 passed (1)
     Tests  2 passed (2)     # 0 failed 0 skipped
```

- superadmin：生产菜单工具项 → push → authGuard 放行 → ToolList 挂载 → `GET /system/auth/me, /system/auth/menus, /agent/tool/internal` → 渲染含「工具管理」
- 普通用户（tooluser，superAdmin=false，绑定 V37 菜单）：同上完整链

### 5.2 前端四门 2G 串行（原始末尾输出 + 毫秒时间戳 + 退出码）

| 门 | 开始_ms | 结束_ms | 退出码 | 原始末尾输出 |
|----|---------|---------|:---:|------|
| typecheck | 1787574004489 | 1787574012542 | 0 | `$ vue-tsc -b --noEmit`（无错误） |
| lint | 1787574012573 | 1787574024068 | 0 | `$ eslint .`（0 errors 0 warnings） |
| test | 1787573957351 | 1787573986896 | 0 | `Test Files 100 passed (100) / Tests 981 passed (981)`，Duration 28.72s |
| build | 1787573989867 | 1787574000765 | 0 | `✓ built in 2.14s` |

**墙钟可勾稽**：test 1787573957351→1787573986896 ≈ 29.5s，与 runner Duration 28.72s 一致。

### 5.3 后端定向（重跑确认）

| 测试类 | 结果 | 退出码 |
|--------|------|:---:|
| `AgentToolConfigSecurityIntegrationTest` | 8 tests, 0 failures, 0 errors | 0 |
| `FlywayFullChainH2Test` | 14 tests, 0 failures, 0 errors | 0 |

### 5.4 前端门开始前完整进程快照（1787573500116ms，后端门结束后采集）

```
 4375  /opt/homebrew/bin/node /Users/chikan/claude-opencode-proxy/dist/server.js   ← 常驻代理服务（非编译测试）
18150  /opt/homebrew/opt/openjdk@21/.../java ... Launcher -q spring-boot:run        ← 后端 dev server maven launcher（标准1 运行态）
18172  /opt/homebrew/Cellar/openjdk@21/.../java ... sw-bootstrap/target/classes ...   ← 后端 dev server JVM（标准1 运行态）
57164  /Applications/ChatGPT.app/.../cua_node/bin/node_repl                          ← 常驻 REPL（非编译测试）
62948  node dist/server.js                                                           ← 常驻 node 服务（非编译测试）
```

无 surefire/vitest/vite/tsc/eslint 编译测试进程；前端开始前无 vitest 运行。
**java 18150/18172 分类说明**：标准1 需要的后端运行态（spring-boot:run 提供服务），非编译测试进程——已如实分类而非遗漏。

## 6. 通过项

- 标准1 真实后端链 2/2（superadmin + 普通用户绑定 V37 菜单）
- 前端全量 **100 files / 981 tests 全过，0 failed 0 skipped**，四门退出码全 0
- 后端定向 8/8 + 14/14

## 7. 失败项

无。

## 8. 跳过项及原因

**无（0 skipped）**。`tool-real-permission-rejection.spec.ts` 改为运行时探测后端可达性：后端运行中（本验收环境）→ 真实执行 3/3（未认证 401 场景）；后端不可用时才整组 skip（标准8 证据由后端集成测试承载，环境依赖降级不影响验收）。

## 9. 关键日志或错误信息

- 测试计数：**100 files / 981 tests = 981 passed + 0 skipped**（D199 时 99f/981t 含 1 file/5 tests skipped 已消除——真实后端运行时 tool-real-permission-rejection 实际执行）
- build 含 `[INVALID_ANNOTATION]` 第三方警告（@vueuse/core 的 PURE 注释，历史基线同现），不影响产物与退出码
- 无 flaky：标准1 live spec 与全量均稳定通过

## 10. 是否满足验收标准

**满足**（执行层自验口径，待规划验收）：
- 标准1：真实后端生产菜单响应链（禁止 Mock 替代）2/2——身份、菜单响应项、路由动作、guard 结果、组件/请求/页面结果逐段输出
- 标准11：0 failed 0 skipped 全量 + 同一口径（100f/981t/981 passed）+ 毫秒时间戳 + 可验证串行（后端门结束→前端门快照→四门）+ 完整快照分类
- 标准12：knowledge/清单/需求池/memory 全入口统一 D199 口径，零残留命令输出

## 11. 回归风险

- `tool-production-menu-chain-live.spec.ts` 依赖真实后端运行（标准1 本质要求）；后端未启动时该 spec 会失败（fetch 拒绝）——验收环境必须起后端，已在前置说明
- `vitest.live.config.ts` 仅被 live spec 使用，不影响默认 `pnpm test` 的 mock 语义
- `tool-real-permission-rejection.spec.ts` 运行时探测：后端在则跑、不在则 skip（0 skip 需后端运行，验收命令已保证）
- 全部历史回执未覆盖

## 12. 最终结论

**PASSED**（执行层测试门禁自验；功能验收判定权在规划层，本结论不构成 PASSED/COMPLETED 功能裁决）

## 13. 记忆更新草稿（仅供规划角色核对后落盘）

- **state.md 状态行**：agent-tool-configuration-frontend | D199复验FAILED（9/12锁定）→ 提示7补证完成待规划复验（标准1真实后端链2/2、标准11零skip全量100f/981t、标准12唯一口径）| 证据 execution-receipt-d200 + test-receipt-d200 + k16；测试基线：正式 827/338、86f/850t、V36 不变
- **decisions.md**：无新增架构/设计决策（标准1 真实后端链为既有契约的行为证据补全；live 测试配置为测试基建）
- **issues.md**：无新增未关闭已知问题
- **features.md**：agent-tool-configuration-frontend 状态更新为"提示7补证完成待规划复验"（P48 开放、M07-F03-02 🟦、功能数 30 不变）
