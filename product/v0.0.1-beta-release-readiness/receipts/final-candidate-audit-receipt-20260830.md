# v0.0.1-beta 最终候选终验回执

> 日期：2026-08-30
> 执行角色：`executor`
> 终验对象：根知识 `a86cbbd` / 后端 `ba59539` / 前端 `f3a8988`
> 终验结论：`NOT_READY`

## 1. 固定提交与隔离工作树

本轮唯一输入为任务指定三元组。独立临时目录：

`/private/tmp/swf-v001-beta-audit.CA4aSy/`

| 仓库 | 分支事实 | HEAD | 工作树 |
|---|---|---|---|
| 根知识仓 | `main` | `a86cbbda34f307db3a3bcad2b4b267175b905dbb` | clean detached HEAD |
| 后端仓 | `develop` | `ba5953977ef8b8684e0d551216283727b7540ad4` | clean detached HEAD |
| 前端仓 | `develop` | `f3a89888e022d8b1c9de658e5a6cb5f97a8a9a2b` | clean detached HEAD |

三提交均可解析，且分别位于冻结前基线之后：根 `fe5ffa2`、后端 `a7e9a54`、前端 `d8df94f`。

## 2. 候选范围与影响矩阵

- 根知识候选仅包含 README、发布证据、产品回执、memory/search 文档和归档任务记录；未发现业务源代码、测试或构建配置变更。
- 后端候选仅变更 `README.md` 与 `sw-framework/sw-security/src/main/java/com/sw/ck/security/filter/JwtAuthenticationFilter.java`。
- 前端候选仅变更 `src/modules/agent/views/tool-production-menu-chain-live.spec.ts`。
- 三提交的变更范围与已通过的 B1（前端测试前置）、B2（密钥启动说明）和 B3（Redis 认证基础设施异常路径）修复一致；未发现越界业务实现变更。
- 因候选业务实现未触及锁定的最小链路，既有最小链路证据仍可作适用性依据；本轮不扩大为无差异页面全量复验。前端 live spec 的前置修复已随固定提交重新执行并通过全量测试。

## 3. 前端质量门

工作树：`/private/tmp/swf-v001-beta-audit.CA4aSy/frontend`

| 门禁 | 命令 | 结果 |
|---|---|---|
| 类型检查 | `NODE_OPTIONS="--max-old-space-size=2048" pnpm typecheck` | PASS |
| lint | `NODE_OPTIONS="--max-old-space-size=2048" pnpm lint` | PASS |
| 全量测试 | `NODE_OPTIONS="--max-old-space-size=2048" pnpm test` | PASS，110 files / 1060 tests / 0 skipped |
| 构建 | `NODE_OPTIONS="--max-old-space-size=2048" pnpm build` | PASS，Vite built in 1.46s |

## 4. 后端构建、全量测试与启动

### 4.1 构建

使用本轮隔离仓库 `/private/tmp/swf-v001-beta-audit.CA4aSy/m2` 执行：

`MAVEN_OPTS="-Xmx2g" mvn -Dmaven.repo.local=/private/tmp/swf-v001-beta-audit.CA4aSy/m2 install -DskipTests`

结果为 `BUILD SUCCESS`。候选产物为：

`/private/tmp/swf-v001-beta-audit.CA4aSy/backend/sw-bootstrap/target/sw-bootstrap-1.0.0-SNAPSHOT.jar`

### 4.2 全量测试

执行：

`MAVEN_OPTS="-Xmx2g" mvn test`

结果未达到任务要求的 `955/0/0/0`。`sw-bpm-engine` 的 `ApprovalProcessIntegrationTest` 在启动阶段发生 `Abort trap: 6`，Maven 记录 `Process Exit Code: 134`，该测试实际为 `Tests run: 0`；进程内定向复核仍复现。故此项为未通过/环境阻塞，不能宣称后端全量通过。

### 4.3 当前候选启动与 H2/V44

应用以候选工作树的 `sw-bootstrap/target/classes` 启动，Maven 依赖来自隔离仓库；环境注入为新生成的 `SW_CIPHER_KEY`、`REDIS_HOST=127.0.0.1`、`REDIS_PORT=6380`，未写入回执或日志正文。启动证据：

- Tomcat 监听 `8080`，上下文为 `/api`；
- H2 `jdbc:h2:mem:smart_workflow`；
- Flyway：`Successfully applied 44 migrations ... now at version v44`；
- `Started StarterApplication`。

## 5. 认证与 Redis 三态

使用 dev seed 的 admin 登录，仅记录状态码和业务 code，不记录 token：

| 场景 | 实测结果 |
|---|---|
| 无 token 访问 `/api/system/auth/menus` | HTTP `401`，code `401` |
| admin 登录 `/api/auth/login` | HTTP `200`，code `0`，access token 已签发 |
| Redis 停止后携 token 请求受保护接口 | HTTP `503`，code `503` |
| Redis 恢复并 `PING=PONG` 后携 token 请求 | HTTP `200`，code `0` |

Redis 使用独立端口 `6380`，未触碰已有 `6379` 实例。

## 6. tag 与发布追溯

在三仓库分别查询本地 tag 与 `origin` 的 `refs/tags/v0.0.1-beta*`，均无结果；当前不存在同名 tag 冲突。由于后端全量测试阻塞，本轮不创建 annotated tag、不推送远端。待后端全量门禁在可复现环境达到 `955/0/0/0` 后，仍按本三元组分别创建 tag，并保留三仓 commit 追溯记录。

## 7. 原始证据

- 前端类型检查：`/private/tmp/swf-v001-beta-audit.CA4aSy/frontend-typecheck.log`
- 前端 lint：`/private/tmp/swf-v001-beta-audit.CA4aSy/frontend-lint.log`
- 前端全量测试：`/private/tmp/swf-v001-beta-audit.CA4aSy/frontend-test.log`
- 前端构建：`/private/tmp/swf-v001-beta-audit.CA4aSy/frontend-build.log`
- 后端全量测试：`/private/tmp/swf-v001-beta-audit.CA4aSy/backend-test.log`
- 后端进程内复核：`/private/tmp/swf-v001-beta-audit.CA4aSy/bpm-approval-inprocess-final.log`
- 后端隔离构建：`/private/tmp/swf-v001-beta-audit.CA4aSy/backend-install-isolated.log`
- 后端启动与 V44：`/private/tmp/swf-v001-beta-audit.CA4aSy/backend-boot-pty.log`
- Redis：`/private/tmp/swf-v001-beta-audit.CA4aSy/redis.log`

## 8. 执行边界

本轮只写入本回执和 `search_fallback` 回退记录；未修改业务代码、测试、需求、治理文档，未创建/删除/移动/推送 tag，未提交 Git。最终状态为执行阻塞，发布裁决保留给规划角色。
