# README 首例收尾事实核实（019）

2026-10-21 00:20—00:40 CST｜执行｜只读核实。

## 1. knowledge 权威状态

`knowledge/current-status.md` 顶部与 0.1.9 条目：功能 49、清单 46/22/22=90、ADV64/问题 57、P 核销空、P62 延期/OFF；当前发布 0.1.9、UAT 运行 0.1.9（Web `index-DDQRXD9F.js`、Server `74716dd`）。与方向确定值一致，未见本轮外新变化。顶部「下一动作＝规划确认整轮结束与 Owner 业务验收」为待同步旧文案。

## 2. Git 事实

- 根仓库 `develop-sw` 与 origin 同步；未提交内容为本轮规划侧文件：memory 5 件已修改、`product/readme-first-example-acceptance/{passed,ready}`、`receipts/planning-review-20261021-passed.md`、`search_task/` 未跟踪。
- Server：origin/main=`74716dd`、origin/develop=`3234369`，均与远端一致，工作树干净；develop 包含于 main，main 独有 `49b818e`（0.1.9 覆盖合并）与 `74716dd`（发布源，含 R__ 迁移）。发布源无未交付代码。
- Web：origin/main=`e967e24`、origin/develop=`1e67c20`，均与远端一致，工作树干净；main 领先 develop 5 个本轮修复提交（86c09bd…e967e24）。
- 本轮任务分支待清理（清删前需逐条验证 0 独有提交）：Server 本地 4 条（fix/bpm-script-warmup-budget、fix/bpm-script-worker-launch、fix/consensus-async-tenant、fix/process-expression-script；前三条有远端）；Web 本地 3 条（fix/business-acceptance-ui-019、fix/process-expression-script、fix/process-expression-script-note；均无远端跟踪）。

## 3. 发布与部署

- tag `0.1.9`：Server→`74716dd`、Web→`e967e24`（annotated，指向与发布源一致）。
- Release 0.1.9 资产：Server `bootstrap-0.1.9.jar` 218,061,187 B；Web `sw-web-dist-0.1.9.zip` 1,351,539 B。两仓 CI build Release（build-74716dd、build-e967e24）持 Latest 标记，标题均为 0.1.9，制品指向与发布源一致。
- UAT 回读（10-21 00:29）：健康 200；前端 assets 唯一入口 `index-DDQRXD9F.js`；`/opt/smart-workflow/server/bootstrap.jar` 218,061,187 B（mtime 10-20 20:00）。与 bf20261020-07 回执一致，无第五/七轮之后的再部署。
- DB：版本化终点保持 V0.1.7，本轮无新增 V__ 迁移；`R__bf20261020_form_data_admin_grants.sql`（h2+postgresql 各 28 行）在 main `74716dd`，已于第五轮覆盖部署应用（role 2/9501/9503 各 7 项，据 bf20261020-05）。

## 4. 版本来源与模块边界

Server pom `<revision>0.1.9-SNAPSHOT`（开发默认）、Web package.json 0.1.9；根 README/CHANGELOG/version.json 均已 0.1.9 口径。模块边界脚本按 `src/modules` 动态扫描＋eslint 配置生效，共享组件 `src/components/business-detail/` 不属模块清单，无需清单变更（本轮无模块增删改）。

## 5. 预约 2112002084486819842 到点结果（UAT 库/日志回读）

due 2026-10-20 20:00 本地。20:00:06 由 0.1.9 后端（pid 2432620）认领置 DISPATCHING，命令 `2112514190181191681` 入队并置 SENDING；**20:03:14 后端重启**（第五次覆盖部署窗口，新 pid 2451064），发送中断；20:08:15 新进程回收滞留 SENDING，标记失败（last_error=「命令状态不允许发送: SENDING」，retry_count=2），补偿重试未在窗口（expiry 20:10）内完成外发。命令终态 **FAILED**（无 tencent_request_id、无 device_output）；预约滞留 **DISPATCHING**、command_id 空——进程死亡导致 FAILED 兜底未执行。productId/deviceName 记录为 unknown。当时 UAT 已运行 0.1.9，非 0.1.8 构建；设备执行回执不存在（未外发），Broker SENT 与设备执行仍为不同含义。

## 6. 时间/部门选择待办

`todo/uat-drill-usability.md` 两项在本轮回执中无专项复验记录：AC01 通过基于 91002/91005 实际提交与流转，未单独验证 UI 日期选择器未来时间输入与普通发起人部门选择入口。两项保留待办原状，不核销；本轮业务验收通过不自动关闭它们。

## 7. 未确认/缺口

- 边界检查脚本本轮运行结果未取得（上次执行被中止）；如需可作为同步期受影响门禁补跑。
- UAT 重启（20:03:14）与部署窗口的因果为时间线推断：备份名 bootstrap.jar.bak-20261020_195953-0.1.9-fifth 与启动时刻吻合，判定为第五次覆盖部署所致。
