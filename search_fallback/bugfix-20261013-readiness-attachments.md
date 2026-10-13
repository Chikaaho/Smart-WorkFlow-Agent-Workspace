# bugfix-20261013-readiness 探索附件（脱敏原始事实）

2026-10-13｜Executor 只读核实；连接凭据仅引用 `~/ssh/ssh/ssh_personal.sh` / `scp_personal.sh`（IP/密钥路径不落文档）。

## A. 三仓 Git 事实（核实时点 2026-10-13 上午 CST）

| 仓 | 分支 | HEAD | 跟踪 | ahead/behind | 工作树 |
|---|---|---|---|---|---|
| 根（Agent-Workspace） | develop-sw | 2a915ade | origin/develop-sw | +0/-0 | memory 4 文件 M；gitlink 漂移×2；未跟踪 changed-files/、product/bugfix-20261013/、search_task/本任务 |
| Server | develop | b962648 | origin/develop | +0/-0 | 干净 |
| Web | develop | 8c400b0 | origin/develop | +0/-0 | 干净 |

根远程另有 `main`=51732b1（governance 沿革线，非 develop-sw 祖先，与代码仓无关）。
根 gitlink：index 记 Server `7a32bf15`/Web `628b1d94`（=两仓 feature/p64 HEAD）；子模块现 checkout develop `b962648`/`8c400b0`。

### 远程分支（ls-remote，2026-10-13）

Server origin：0.1.1-bugfix=7ff4743、0.1.2-bugfix=fd704ff、develop=b962648、feature/p61-user-facing-message-humanization=6698b8ca、feature/p62-perf-bounded-20261011=7c305978、feature/p64-mes-advanced-orchestration=7a32bf15、main=8e23a2d。无 codex/bugfix-20261013。
Web origin：0.1.1-bugfix=281892e、0.1.2-bugfix=8618922、develop=8c400b0、feature/p61-msg-scope-corrected=d110ed8b、feature/p61-user-facing-message-humanization=29d90e8c、feature/p64-mes-advanced-orchestration=628b1d94、main=e3ae316。无 codex/bugfix-20261013。

### 包含关系（merge-base --is-ancestor）

Server：p64 7a32bf15→develop YES；p61 6698b8ca→YES；0.1.1-bugfix→YES；0.1.2-bugfix→YES；p62-perf 7c305978→本地对象不存在，经 GitHub compare develop...7c305978 = **diverged，ahead 16 / behind 10，files 23**。领先首条提交："test(p62): V0.1.10 invocation_key 查询索引迁移与六锚点链尾滚动"（含 postgresql/h2 V0.1.10__p62_invocation_key_lookup_index）。
Web：p64 628b1d94→YES；p61×2→YES；0.1.1/0.1.2-bugfix→YES。

### develop−main 差异（发布集合外内容盘点）

Server：163 提交，main 领先 0。主题分布（前 15）：docs(p62)22、fix(p64)19、docs(p64)19、test(bpm)14、fix(p62)12、test(p62)11、docs10、fix(p63)7、feat(bpm)5、docs(checklist)5、test(p63)4、feat(p64)4、feat(p63)4、fix(form)3、fix(bpm)3。
Web：41 提交，main 领先 0。fix(p63)10、feat(p64)8、fix(p64)7、feat(p63)5、fix(p62)2、test(p64)1、fix(layout)1、feat(p62)1、feat(form)1、docs(readme)1（末条="docs(readme): 当前版本口径更新至 0.1.3"）。

## B. 版本与 tag

本地/远程 tag（两仓一致形态）：`v0.0.1`、`v0.0.1-beta`（早期 v 前缀）、`0.0.2`、`0.1.0`、`0.1.2`、`0.1.3`；**无 0.1.1 tag**；另有 `build-<sha>` CI tag。
Server tag 0.1.3→main 8e23a2d；Web tag 0.1.3→main e3ae316（附注 tag，剥离后指 main HEAD）。
开发版本：Server develop `pom.xml` `<revision>0.1.3-SNAPSHOT</revision>`；Web develop `package.json` `"version": "0.1.3"`。
0.1.3 发布身份（release/0.1.3/RELEASE-NOTES.md）：Server `-Drevision=0.1.3` 正式构建；Web 发版批次投影 main HEAD 提交"chore(version): 包版本 0.1.2 → 0.1.3"；CI Server run 36603608187 / Web run 36602576798 success；UAT 部署回执 product/v0.1.3-release/receipts/deployment-20260930.md。
历史发布 tag 序列：0.0.2、0.1.0、0.1.2、0.1.3（release/ 下有 0.1.0/0.1.2/0.1.3 RELEASE-NOTES）。

## C. 迁移文件清单（sw-bootstrap/src/main/resources/db/migration）

develop（h2 与 postgresql 对称，各 17 迁移文件）：

- versioned：V0.1.0__baseline_seed、V0.1.1__form_local_transaction_actions、V0.1.2__tiered_command_semantics、V0.1.3__batch_command、V0.1.4__resource_assurance、V0.1.5__p63_dynamic_branch_semantics、V0.1.6__p63_iot_command_reservation、V0.1.7__p64_orchestration_data_action、V0.1.8__p64_phase2_parent_child、V0.1.9__p64_position_delegate
- repeatable（7）：R__i6_notify_menu_reconciliation、R__p62_form_txn_action_menu、R__p62_iot_command_verify_menu、R__p62_resource_ops_menu、R__p62_txn_batch_menu、R__p63_iot_reservation_menu、R__p64_position_delegate_menu
- mysql/、oracle/：仅 README（占位）

main：仅 V0.1.0__baseline_seed（h2+PG）+ R__i6_notify_menu_reconciliation（h2+PG）。develop−main=30 文件 +1521 行（9 versioned×2 + 6 R__×2）；V0.1.0 零改动（diff grep V0.1.0 = 0 条）。

其余边界：

- devseed（sw-bootstrap/src/dev/resources/db/migration/devseed）：仅 h2，V900—V903（i5 租户100/负例/三 provider 夹具）。
- 测试夹具（均 h2）：sw-bootstrap test bpm-fixture 23 个（V8—V104）；sw-bpm-process test bpm/h2 26 个；sw-biz-system test system/h2 3 个（V84/V87/V104 SSO）。
- prod-update（sw-bootstrap/src/main/resources/db/prod-update）：mysql/oracle 仅 README（"仅放 DML 不放 DDL"）；工程宪法 L266：生产 DML 补丁、失败故意阻断启动；UAT 实证独立历史表 flyway_schema_history_prod。
- p62 未合入分支独有：V0.1.10__p62_invocation_key_lookup_index（PG+H2）。

V0.1.1 变更史（git log --follow）：PG 与 H2 均唯一提交 e93824b（2026-09-30 13:34 +0800，feat(form): P62 本地事务动作），此后零修改。

## D. UAT 只读巡检原文（2026-10-13，只读命令：ls/cat/unzip -p/curl/psql SELECT/df）

```
=JAR=      -rw-r--r-- 1 root root 216837921 Sep 30 01:37 /opt/smart-workflow/server/bootstrap.jar
=PID=      1576953
=MANIFEST= Spring-Boot-Version 3.4.4；Build-Jdk-Spec 21；无 Implementation-Version 条目
=HEALTH=   HTTP 200        （127.0.0.1:8080/api/actuator/health）
=FLYWAY-MAIN=（flyway_schema_history，installed_rank|version|description|success|installed_on）
1|0.1.0|baseline seed|t|2026-09-30 01:41
2||(R)i6 notify menu reconciliation|t|2026-09-30 01:41
3|0.1.1|form local transaction actions|t|2026-09-30 15:11
4||(R)p62 form txn action menu|t|2026-09-30 15:11
5||(R)p62 form txn action menu|t|2026-09-30 15:13
=FLYWAY-TABLES= flyway_schema_history、flyway_schema_history_prod
=TABLECOUNT= 153（information_schema 口径，含视图；与部署回执"101 表"口径不同，未深究）
=DISK=     /dev/vda3 20G 已用 14G 可用 5.3G 72%
```

（psql 另有非致命告警 `could not change directory to "/root": Permission denied`，sudo 环境所致，不影响查询结果。）

交叉认定：jar 216,837,921B 与 deployment-20260930 回执字节数一致、PID 1576953=该回执第二次启动 PID → UAT 在役包=0.1.3 原件，连续运行至今（2026-10-13）。09-30 15:11 另有一次携带 V0.1.1 的增量部署（无对应 tag/Release，包为 develop 构建未入发布序列）。

## E. 运维手册定位

现行手册：根仓库 `docs/ops/production-ops.md`（318 行；基于 2026-09-01 只读巡检编写）。Server 仓 `docs/ops/` 目录不存在——探索任务中"Server docs/ops/production-ops.md"历史线索路径已失效，手册已上移工作区根。0.1.3 部署回执（2026-09-30）与本次巡检均按其执行，仍有效。

要点：UAT=手册所述单机（0.1.3 部署回执明示"环境：UAT（production-ops.md 所述单机，chikaho.cn，PostgreSQL 14/16 @5433，库 smart_workflow，/opt/smart-workflow）"）；手册标题为"生产运维手册"，实际该机按 UAT 使用，单一环境、无独立 UAT 手册。发布流程 §8（备份→停服→替换→启动→冒烟→回滚；迁移随启动自动执行、先备份后启动）；备份 §9.1 `pg_dump -Fc -p 5433 -d smart_workflow -f /data/backup/…dump`；健康 §6.3（8080 /api/actuator/health UP + nginx /sw/ 与 /sw-server/ 双 200）；server.env 高敏感（PG 凭据、SW_CIPHER_KEY、JWT_SECRET、SW_SSO_CIPHER_KEY 32 字节契约、OPENAI_API_KEY 等，0.1.3 契约变更见 release/0.1.3/CONFIG-CHANGES.md）。

## F. 未提交工作归属（根仓库）

- memory/README.md、features.md、handoff.md、state.md（共 7 行增删）：Planner 本轮 bugfix-20261013 目标登记（state.md 新条目含 Owner 目标、唯一下一动作=本次探索、总 5 阶段 0/1/4）。
- product/bugfix-20261013/（bug-ledger.md + ready/direction.md + ready/development-declaration.md）：本轮 L 级方向与台账。
- search_task/bugfix-20261013-readiness.md：本探索任务。
- changed-files/p63/LoopbackPeerProviderDevTest.java：p63 期遗留单文件，归属待确认。
- gitlink 漂移：index 仍记 feature/p64 两值，子模块已 checkout develop；随下一批次提交为新值即可。
