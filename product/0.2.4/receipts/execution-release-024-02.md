# 0.2.4 发布链回执 02（④ 合并 → ⑤ 发布/部署 → ⑥ 发布后同步）

2026-11-06｜Executor｜承接 `product/0.2.4/ready/direction-terminal-sync-024.md`。功能验收依据 `planning-review-024-03-passed.md`；阶段③见 `terminal-sync-024-01.md`。执行侧七阶段：**6/0/1**（发布后同步完成，待 Planner 终态复核）。

## ④ feature→develop→main

### Server

- 合入链（普通合并，无强推）：feature `8b65ae53` → develop 合并 `c99bdcf7` → 版本收敛 `a012fada`（pom/.github/workflows/build-release.yml/scripts 同步 0.2.4；`check-version-identity.sh develop` PASS，32/32 POM=0.2.4-SNAPSHOT）→ Flyway 断言修复 `71c2adc3` → main 合并 `41511bd4`。
- 版本收敛首个提交 `e8624ed2` 因文本写入把 4 文件行尾改为 CRLF（664 行伪差异），随即以 LF 重写修复为 `a012fada`；净差异仅为版本号。
- **全量门禁（develop，`mvn -o test`）**：
  - 首轮：`gates-server-full-024.log`，Notify I6G1a/b/c 3 例失败（既有 Redis 依赖偶发族）+ Bootstrap Flyway 断言 7 例失败（新增 V0.2.8/V0.2.9 后计数仍按 26/6）；I6 复跑 3/3 通过（`gates-notify-i6-rerun-024.log`）。
  - Flyway 断言修复（测试代码，`71c2adc3`）：全链 26→28（8 versioned + 19 R__）、存量衔接新增 6→8、快照外新增 13→15、终点 0.2.9；目标类 48 例全绿（`gates-flyway-fix-024.log`、`gates-flyway-legacy-024.log`）。
  - 终轮：`gates-server-full-024c.log` **BUILD SUCCESS EXIT=0**，**2404 tests / 0 failures / 0 errors / 32 skipped**。
- 远端回读：develop `71c2adc3`、main `41511bd4`（`git rev-parse` 与 `origin/*` 一致）。

### Web

- 合入链：feature `5d531ce` → develop 合并 `6622fc5` → 版本收敛 `5184c5d`（package.json 0.2.4）→ main 合并 `f4acc3d`。
- 四连（develop，`web-four-gates-024.log`）：typecheck 0 / lint 0 / **vitest 232 文件通过+1 跳过，2022 tests 通过+3 跳过** / build 4.35s **EXIT=0**。
- 远端回读：develop `5184c5d`、main `f4acc3d`。

## ⑤ 发布 0.2.4 与 UAT 部署

### CI 与制品

- Server main 推送 CI run **`42198270905` success**；Web main 推送 CI run **`42195066830` success**。
- 成对 annotated tag：Server `0.2.4`→`41511bd4`（tag 对象 `2d935dfd…`）、Web `0.2.4`→`f4acc3d`（tag 对象 `09d48daa…`）；`rev-parse 0.2.4^{commit}` 回读一致。
- 语义 Release（两仓 `releases/latest` 回读均为 0.2.4）：
  - Server「CH-aPaaS Server 0.2.4」id `436348472`，资产 `bootstrap-0.2.4.jar` **220,856,383 B** sha256 `1c73a5ee06be756ef96feb3654ec27d7f5dacf2f103ab6aa4609f77a5d25f545`；`build.version=0.2.4` 实测；下载后本地 sha256 与 Release digest 一致。
  - Web「CH-aPaaS Web 0.2.4」id `436316396`，资产 `sw-web-dist-0.2.4.zip` **6,194,537 B** sha256 `b40cf483c4537af24b0223c00bed4720b7c99ab26de638a82b612ae74a53ff61`；入口 `assets/index-egL2MRAT.js`；digest 回读一致。
  - `build-<sha>` 自动 Release 全部保留（Server `build-41511bd4…`、Web `build-f4acc3d…`），未删除/覆盖既有发布。

### UAT 预检

- 仓外配置：`server.env` 与 `/opt/smart-workflow` 未发现 `sw.notify.channels.*` 键位（前缀修正不会意外启用/改错渠道）；无需同步修改。
- 磁盘：升级前可用 **853M（96%）**；按 §9.2 清理 `/data/reasonix/.reasonix-sessions` 中早于 2026-11-01 的文件 **10,649 个 / 0.64 GB**，可用升至 **1.5G（92%）**。
- DB 版本：升级前 Flyway `0.2.7`；health UP。

### 升级执行

- 备份：DB `smart_workflow_20261106_pre024.dump`（691,433 B）、后端 `bootstrap.jar.bak-0.2.3`、前端 `web.bak-0.2.4-pre`。
- 上传：jar 与 web zip 远端 sha256 与发布资产一致（`1c73a5ee…` / `b40cf483…`）；`nginx -t` 通过。
- 停 0.2.3（PID 3228289）→ 换包 → 替换 web 静态 → `. ./server.env` 后 start.sh（按 §6.4 硬前置）→ nginx reload。

### 升级后回读

- 启动 **176.906s**，新 PID **3251012**；启动段 **ERROR 0**。
- Flyway：`0.2.8 - iot agent bridge` + `0.2.9 - agent failure channel secret`，**applied 2 migrations → v0.2.9**。
- health：本机 `/api/actuator/health` = `{"status":"UP"}`；经 nginx `/sw-server/api/actuator/health` = `{"status":"UP"}`。
- HTTPS 根 **200**，入口 `assets/index-egL2MRAT.js` 与发布 zip 一致；`build.version=0.2.4` 实测（`unzip -p bootstrap.jar META-INF/production-build.properties`）。
- 磁盘可用 **1.3G（94%）**。

## ⑥ 发布后同步（覆盖矩阵）

| 入口 | 写入值 | 回读 |
|---|---|---|
| `knowledge/current-status.md` | 头段改为 0.2.4 已发布/交付 UAT：6/0/1、两仓 0.2.4、tag/CI/资产、2404 门禁、UAT 176.906s/Flyway v0.2.9/health UP/`build.version=0.2.4`、固定计数、下一动作终态复核 | 头段含 0.2.4/6/0/1/51/v0.2.9 |
| `knowledge/session-handoff.md` | 新“当前续接：0.2.4 已发布并交付 UAT”；原阶段③段降为历史 | 当前段为 0.2.4 发布态 |
| `knowledge/features/0.2.4-readme-examples-2-3.md` | 状态行改为已发布/UAT 交付，补 tag/UAT 事实 | 回读一致 |
| `memory/state.md` / `handoff.md` / `features.md` | 当前任务=0.2.4 发布完成 6/0/1、下一动作终态复核；功能 51 | 三文件 <5KB |
| `todo/requirement-pool.md` | 当前入口改为已发布/UAT、下一动作终态复核 | 回读一致 |
| 根 `README.md` | 当前正式版本段改为 0.2.4（能力/合并链/门禁/迁移/UAT/回执） | 回读含 0.2.4 |
| Server/Web `README.md` | 当前正式发布版本改为 0.2.4，0.2.3 降为“此前” | 回读一致 |
| `CHANGELOG.md` | 新增 0.2.4 条目（发布事实/功能/真实链路/迁移/门禁/UAT/回执） | 回读一致 |
| `docs/ops/production-ops.md` | §8 新增 0.2.4 制品与 UAT 升级记录（键位核对/磁盘清理/server.env 前置/启动与 Flyway/健康） | 回读一致 |
| `version.json` | 重写为 0.2.4（分支链、0.2.4-SNAPSHOT/0.2.4、Flyway 终点 0.2.9 双方言、manifest sha256、UAT 部署与回滚备份） | JSON 可解析，version=0.2.4 |

## 发布后补记（README 回读提交与 CI 测试修复）

- README 回读提交：Server `4669a412`（main=develop）、Web `10c34cb`（main=develop，CI 两分支 run `42213049445`/`42213041638` **success**）。
- Server docs 提交在 develop 触发 CI run `42212991421` 失败：`AgentOrchestrationServiceImplTest.run_withToolCalls_shouldPersistToolCallLog` 报 `Values of types "SMALLINT" and "BOOLEAN" are not comparable`；同一提交 main run `42212981752` 通过，属测试 DDL 与 V0.2.3 生产列类型不一致的时序触发。
- 修复 `3e287692`（仅测试）：`sw_agent_tool_internal`/`sw_agent_tool_external` 测试 DDL 的 `enabled` 对齐 V0.2.3 的 `BOOLEAN`；Agent 模块全量 **351 tests 0 失败**（`gates-agent-postfix.log`）。已推 develop/main，main=develop=`3e287692`。
- 修复后 main CI run `42216097891` **success**；develop run `42216087469` 首轮命中既有 I6G1a/b/c 时序偶发族（恢复调度与断言竞态，非本修复引入），已 rerun，待最终回读。
- 该测试修复不改变 0.2.4 制品与 tag；已发布制品仍为 Server `bootstrap-0.2.4.jar` sha256 `1c73a5ee…`、Web `sw-web-dist-0.2.4.zip` sha256 `b40cf483…`。

## 终态与下一动作

- 正式功能 **51**；M **✅59/🟦18/⬜13=90**；ADV **✅1/🟦7/⬜56=64**；实际 P **63**，已核销集合不变，P35 部分、P20 未核销；问题 **57**；验证基线变更 **[]**。
- 执行侧七阶段 **6/0/1**：评估、实施、③同步、④合并、⑤发布/部署、⑥再同步完成；结束阶段待 Planner 终态复核。
- 下一动作：**Planner 终态复核 0.2.4**（通过后 `COMPLETED` 并归档 `direction-terminal-sync-024.md`）。
- 不泄露：OpenRouter/Command Code Key、163 授权码未进入任何提交、回执、日志摘录或制品；推送前暂存区已核对。
