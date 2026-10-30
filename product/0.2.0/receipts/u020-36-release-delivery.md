# 0.2.0 执行提示36回执：合并、发布与既有环境交付（A17 交付完成）

2026-10-31｜Executor｜配套提示36（revision54）。本轮完成阶段4—6：候选门禁阻断判定与精确修复、三仓合并、0.2.0 tag/Release/制品发布、UAT 与本机 dev 既有环境交付、发布后同步。未核销P、未晋级基线、未宣称整版 PASSED/COMPLETED；整版终态待 Planner 复核裁决。

## 一、门禁阻断判定与修复（先于合并）

27 项既有基线失败（notify I6×3、agent×13、bpm×1、bootstrap×9、form G1×1）经 surefire 原始输出逐项定性：**全部为 0.2.0 开发漂移的真实门禁失败，阻断 CI 全量门禁**（build-prod.sh 第一步 `clean test`）。按精确原因修复，不删/降检查：

| 模块 | 失败 | 精确原因与修复 |
|---|---|---|
| bootstrap | FlywayFullChain×2、I6G7×2、AppCenterLegacy、AppCenterContinuity、TenantAdministration、P62NonEmpty、P64×2 | 迁移链断言仍按 0.1.x 形态——0.2.0 化（19=V0.2.0+18 R__）；存量衔接流程改走 `upgrade-to-0.2.0-from-0.1.7` 发布资产；TenantAdministration 旧链夹具改用归档逐字节原件；P64 终点断言 0.2.0 化 |
| bootstrap | ErrorCodeCatalog、Bilingual | 错误码目录 §2 189→200/184→195 并登记 11 个新码；i18n zh/en 各补 11 键（zh 用枚举原文） |
| form | DynamicTableSqlGate G1 | FormIntegrationService.assertSubmitter 改经 FormTraceMapper（受控入口），JdbcTemplate 移除 |
| agent | ×13 | 测试手建 DDL 缺 `effect_scope`（主链由 R__0.2.0_form_integration 幂等补列）——两测试补列 |
| bpm | TriggerPartialFailureRecovery | 命令键已收敛 `P64ACT:<sha256>`（128 字符超限修复）——测试改经 sw_bpm_action_ref 按 action_id 回查，动作归属显式传入 |
| bootstrap | P62ReceiptBoundary | dev profile 叠加 devseed（V901 PG 镜像含 I5 专用密文 WECOM 启用配置）触发启动期 SSO fail-fast——测试覆盖 flyway locations 排除 devseed（自备数据，不削检查） |
| iot | CommandQueueServiceTest（CI 2 Errors，本地全量偶绿） | 隔离复现证实：markSending/markFailed 的 IntSupplier 体内构造 MP lambdaUpdate 依赖实体元数据缓存，靠同 JVM 其他测试先注册——@BeforeEach 显式 initTableInfo，消除跨类顺序依赖 |

有界验证后终验：**本地全量 `clean test` 403 类/2338 测试 0 失败 0 错误（25:20）**，与 CI 同口径。

## 二、种子压缩与版本收敛（Server，提交 4c54272c/修复批/版本收敛批 → tip befd32eb）

- `V0.2.0__baseline_seed.sql`（h2 318,113 B／pg 341,260 B）＝V0.1.7+0.1.8+0.1.9+0.1.10 逐字节拼接+段头；**独立复核：剥离新增注释后与归档原件拼接 sha256 双方言一致**（h2 `fb5eba74…`、pg `6577a094…`，与 README 记载一致）。原文件 git mv 至 `db/upgrade/0.2.0/legacy-0.1.10/`；README 给出六类入口状态判定；transition-history 与 upgrade-from-0.1.7 双方言脚本（衔接段单事务，checksum 与种子一致）。
- 版本收敛：根 pom `revision` 0.1.10-SNAPSHOT→0.2.0-SNAPSHOT；CI 断言、build-prod.sh、check-version-identity.sh 同步；`mvn help:evaluate` 实测 0.2.0-SNAPSHOT。
- 过程中修复：`R__0.2.0_form_integration` 对升级通道存量库不自足（本机首启实证 `sw_agent_tool_external` 不存在）——双方言按种子原文幂等补表补索引后再补列（R__ checksum 变化按设计单次重放）。

## 三、合并与发布（均可回读）

| 仓 | 分支与提交 | tag/Release |
|---|---|---|
| Web | 任务 eadd20b（版本收敛提交）→ develop `3c1cfe2` → main `f5ec5a1`（合并提交推送） | tag 0.2.0→f5ec5a1；Release「CH-aPaaS Web 0.2.0」+ sw-web-dist-0.2.0.zip（6,153,509 B，sha256 `5d80c964…`）；CI run **41092067995 success** |
| Server | 任务 tip `befd32eb` → develop `a1674f30` → main `fbacde47` → 修复后 main `39dcedb7` | tag 0.2.0 首指 fbacde47（CI **41091926626 failure**＝iot 顺序族，未产出 Release/制品）→ 重指 `39dcedb7`（CI **41097671140 success**）；Release「CH-aPaaS Server 0.2.0」+ bootstrap-0.2.0.jar（218,547,155 B，sha256 `524cbf2f…`，**build.version=0.2.0 实测**） |
| 根 | 任务分支合并 develop-sw（23 处冲突：治理取 develop-sw、memory/todo/knowledge/version 取任务分支、CHANGELOG/README 取收口版）→ `bfa1e07a`；develop-sw FF 同步 | —（root main 见§五遗留） |

发布查重先行：两仓 `0.2.0` tag 与语义 Release 此前均不存在；CI `build-<sha>` Release 同源制品，无覆盖既有发布。

## 四、既有环境交付（§8.1/8.2/8.3/9.1 全程）

- **UAT 8.166.112.85**：①发布前巡检发现磁盘 100%——按 §9.2 清理 0.1.8/0.1.9 历史 jar 备份 ×7、481M 未压缩轮转日志、npm 缓存 → 可用 1.8G；②备份 DB `smart_workflow_20261031_0215_pre0200.dump`（649,831 B）+ jar 轮换（.bak=0.1.10、.bak2）+ `web.bak-20261031_0218`；③停服后 `upgrade-to-0.2.0-from-0.1.7.postgresql.sql` 单事务执行（0.1.9 段回填 4 租户管理员、0.1.10 审计表创建、历史 DELETE 1/INSERT 1）→ **versioned 终点单条 0.2.0（checksum 1897854550）**；④替换 jar（服务端 sha256 与 CI 制品一致）与 web；⑤启动 **172.021s、日志 ERROR 0、`/api/actuator/health` {"status":"UP"}**、4 支新 R__（0.2.0×3+u020）单次应用、`Successfully validated`、web 指纹 `assets/index-DMDsHDv8.js` 与 CI 制品一致。nginx 根路由自 2026-10-16 起由同机 agent 服务（5173/38784）承载——**先于 0.1.10 部署的既有状态，本轮未改**（conf mtime 10-16 佐证），已登记 memory/issues。
- **本机 dev**：`smart_workflow_dev`（真实业务库，8 租户/35 用户/22 表单定义）按 transition-history 衔接单条 0.2.0；devseed V900-903 历史行按备份恢复（衔接脚本删除非主链 devseed 行而夹具非全幂等——首启 V900 唯一键冲突实证，恢复后消除）；`bootstrap-dev.jar`（-Pdev 重建，注意 dev profile 产物名为 bootstrap-dev.jar）启动 **16.52s、health UP**；Vite 5175 服务中。
- 过程偏差如实记录：一次误以未带 -Pdev 的 jar 启动（回落主配置连到废弃 scratch 库 smart_workflow，两次失败即止，未触及业务库；该 scratch 库被写入少量幂等 R__ 对账产物）；一次误传本地 dev jar 至服务器 /tmp（已删除）。

## 五、保留在途与遗留上报

- 根 main 未合并：main 与 develop-sw **双向治理分叉**（main 72 个独有治理提交、`.codex/governance/terminal-contract.json` 双方各自新增、system.md 七阶段规则在 main）——合并属治理对账，需显式裁决；沿 0.1.10 先例（root main 落后 659 提交完成发布）本轮不阻塞交付。merge-tree 预演与中止记录在案。
- Web `vite.config.ts` 既有本地改动（allowedHosts）继续保留未提交；根仓 `memory/architecture.md`（纯 EOL）、`search_task/`×3、`product/0.2.0/receipts/review-305-visual/`（JPG 图包）、`.tmp-a03-schema.json` 未纳入提交。
- 工作流公网入口路由为既有状态（见§四）；UAT 域名恢复由 Owner 决策。

## 六、覆盖矩阵（提示36五行）

| 行 | 结果 |
|---|---|
| 本版文档与在途 | 根 2b917684（96 件：memory×7、todo、ready×14、receipts 批、ui-copy 方向、两 gitlink）+ bfa1e07a（合并）；逐文件核对，排除临时/图包/非授权目录 |
| 候选工程门禁 | 27 项失败全修（精确原因），终验 403 类/2338 测试 0 失败 0 错误；CI 同口径 success；未删/降检查 |
| 开发分支→develop→main | Web/Server 完成（含 tag 0.2.0）；根任务分支+develop-sw 完成，root main 留待治理对账裁决 |
| 0.2.0 发布/既有环境交付 | 工作流（2×success）、制品（bootstrap-0.2.0.jar build.version=0.2.0 实测 / dist 指纹一致）、部署（UAT+dev 双环境 health UP）三层面分别核实；无重复/覆盖发布 |
| 发布后同步 | knowledge → memory（state/handoff/features/issues/README）→ todo → version.json/CHANGELOG/README → 本回执 |

## 七、剩余动作

Planner：按本回执复核 A17 与整版终态并裁决结束；对根 main 治理对账与 UAT 域名路由作出安排。Executor：无授权内剩余动作。
