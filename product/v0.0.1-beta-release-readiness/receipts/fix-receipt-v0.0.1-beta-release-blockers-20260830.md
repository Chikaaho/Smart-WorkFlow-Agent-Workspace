# 修复回执：v0.0.1-beta 发布阻断 B1～B3 关闭

> 方向：`product/v0.0.1-beta-release-readiness/ready/direction-v0.0.1-beta-release-blockers.md`
> 会话角色：执行；2026-08-30。本回执为修复提交态回执，追加保留，不覆盖探索回执与规划审查。
> 结论：**B1/B2/B3 全部关闭（修复提交态），具备重新进入发布就绪核验的条件**。未自行裁决发布 READY，未创建 tag，未 commit/push。

## 一、B1/B2/B3 承接矩阵

| 缺口 | 修复前事实 | 实际修改 | 修复后行为证据 | 结论 |
|---|---|---|---|---|
| **B1** 前端基线不可复现 | 干净 H2 下 `pnpm test` = 1059/1060：`tool-production-menu-chain-live.spec.ts` 普通用户用例依赖工作区外手工账号 `tooluser/user123`（两仓无任何创建来源） | 仅改 `Smart-WorkFlow-Web/src/modules/agent/views/tool-production-menu-chain-live.spec.ts`：新增 `ensureTooluserFixture()` 版本化幂等前置并挂入 `beforeAll`——admin 登录 → `PUT /system/role/2/menus`=[212,213]（V37 工具菜单，全量替换为本 fixture 状态）→ 查询 `POST /system/user/page`，`tooluser` 不存在则 `POST /system/user` 创建、存在则 `PUT` 重置为 fixture 密码并绑回角色2 → 以 `tooluser/user123` 真实登录自证。断言零改动、零跳过、零 Mock | 全新 H2 后端 + 当前 checkout：`pnpm test` 退出码 0，**Test Files 110 passed (110)；Tests 1060 passed (1060)；0 failed / 0 skipped**（`fe-test-final.log`）。前置随 checkout 版本化，删除本地历史状态可复现（本次验证即全新 H2 库） | 关闭 |
| **B2** SW_CIPHER_KEY 前置缺失 | README 本地启动仅两条命令，无 SW_CIPHER_KEY；实测缺失时 `Application run failed`（AesGcmCipher） | 后端 `README.md`：①环境要求新增 **`SW_CIPHER_KEY`（必需）** 条目（用途、Base64 32 字节格式、`openssl rand -base64 32` 生成、export 注入、缺失即失败并含指引、禁止固定密钥入库/复用生产）；②本地启动新增第 0 步准备与排障指引。根 `README.md` 快速开始新增第 3 步（同口径）。**未提供任何固定密钥**，示例均为生成命令 | 干净 shell 按 README `export SW_CIPHER_KEY=$(openssl rand -base64 32)` 后启动 dev profile：44 迁移完成、Tomcat :8080 `/api`、登录 HTTP 200（`backend-boot-final.log`）；缺失时启动失败消息含明确指引（探索轮 `backend-boot-no-cipherkey.log`）。根/后端/前端 README 无冲突口径（前端 README 无启动前置表述） | 关闭 |
| **B3** Redis 依赖口径失真 + 故障误导为 401 | README 称「Redis（可选）」；实测无 Redis 时登录后所有受保护请求 401「未认证」（Redis 异常经 /error 重入安全链被改写） | ①后端 `README.md`：Redis 改为 **必需**（技术栈表、环境要求、本地启动、就绪检查 `redis-cli ping`、`REDIS_HOST/PORT/DATABASE/PASSWORD` 覆盖、503 排障指引）；根 README 同步一句指引。②代码最小修复：`sw-framework/sw-security/.../JwtAuthenticationFilter.java`——`loadByUserId` 基础设施异常直写 **HTTP 503** + 根因消息并**终止过滤链**（兑现该类 javadoc 既有分档承诺；token 失败路径仍 401 不变） | 实测三态：Redis 停机 → `GET /api/auth/menus` = **HTTP 503** `{"code":503,"msg":"登录上下文装载失败（认证基础设施未就绪，非账号或权限问题）: Unable to connect to Redis"}`；`redis-server --daemonize yes` 恢复 → `GET /api/agent/tool/internal` = **HTTP 200 code 0**；无 token → **HTTP 401 未认证**（契约不变）。见 `EVIDENCE-INDEX.md` §7 | 关闭 |

## 二、实际执行的验证命令与结果（行为证据）

| 命令 | 退出码 | 结果 |
|---|---|---|
| `MAVEN_OPTS=-Xmx2g mvn test`（后端根，过滤器首版后） | 0 | 955/0/0/0（backend-mvn-test-after-fix.log） |
| `MAVEN_OPTS=-Xmx2g mvn install -DskipTests`（后端根） | 0 | 修复代码进 ~/.m2（backend-install.log；发现 spring-boot:run 取 .m2 依赖，首验跑旧 jar 的偏差已纠正） |
| `MAVEN_OPTS=-Xmx2g mvn test`（后端根，最终代码状态） | 0 | **955/0/0/0**，BUILD SUCCESS（backend-mvn-test-final.log） |
| `pnpm typecheck` / `pnpm lint`（NODE_OPTIONS=2048） | 0 / 0 | 无错误（fe-typecheck-after.log / fe-lint-after.log） |
| `pnpm test`（后端+Redis 在线，全新 H2） | 0 | **110 files / 1060 tests 全过，0 skipped**（fe-test-final.log） |
| curl 三态（Redis 停机/恢复/无 token） | — | 503 带根因 / 200 code 0 / 401 未认证 |

已锁定项影响说明：后端全量 955/0/0/0 与 401/403 边界均按最终代码重新实测无回归；业务闭环、迁移链、前端 typecheck/lint/build 未受本轮修改影响（改动仅过滤器异常路径、live spec 前置、两份 README），故未重做完整业务验收。

## 三、修复后三仓状态（供冻结候选，均为未提交修改）

| 仓库 | 分支 | HEAD | 本轮修改（未提交） | 其他未提交改动（非本轮） |
|---|---|---|---|---|
| 根知识仓 | main | fe5ffa2 | `README.md` | `memory/{decisions,handoff,state}.md`、`todo/requirement-pool.md`、`search_task/verify-three-repository-readme-refresh.md` 删除、`search_task/.archive/`（规划角色）；`knowledge/evidence/`、`product/v0.0.1-beta-release-readiness/`、`search_fallback/…md`（核验与回执产物） |
| 后端 | develop | a7e9a54 | `README.md`、`JwtAuthenticationFilter.java` | 无 |
| 前端 | develop | d8df94f | `tool-production-menu-chain-live.spec.ts` | 无 |

以上均为**未提交工作区修改**，不构成可发布提交；候选冻结需 Owner/规划另行授权 Git 动作。tag 仍未创建（三仓无 `v0.0.1*`）。

## 四、偏差与风险

- 偏差 1：过滤器修复首版（写 503 后仍放行过滤链）被下游 401 覆盖，实测暴露后改为"返回 false 终止链条"，最终态已按三态 curl 复验。
- 偏差 2：`mvn spring-boot:run` 从 `~/.m2` 解析依赖，首验运行旧 sw-security jar；以 `mvn install -DskipTests` 纠正后重验（README 未记载此点，属本地构建习惯，不影响按 README 的 package/jar 路径）。
- 风险：live spec 前置将角色2 菜单锁定为 [212,213]（PUT 全量替换），在共享持久库上会覆盖角色2既有菜单绑定；对干净/专用测试库无影响。该行为与验收时既定做法一致并已在 spec 注释声明。
- 环境副产物清理：验证用 Redis 曾在工作区根落 `dump.rdb`，已删除并将 Redis 迁至 `/tmp` 目录运行。

## 五、判定

B1～B3 均有当前 checkout 行为证据，范围未扩大，文档入口一致 → 按方向 §9 达 **PASSED 条件（修复提交态）**，请规划复核并另行裁决最终发布核验与 tag 候选。
