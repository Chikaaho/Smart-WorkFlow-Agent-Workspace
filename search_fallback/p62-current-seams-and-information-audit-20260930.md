# P62 现状接缝与信息治理探索回执（p62-current-seams-and-information-audit-20260930）

- 角色：执行（Planner 委派探索）；日期：2026-09-30；入口：`search_task/` 同名文件。只读探索：未改代码/库/配置/历史回执，未运行编译测试部署，未读或输出秘密；核验时点 2026-09-30。
- 附件（脱敏可回读）：A 状态与治理矩阵 `…-20260930-governance-matrix.md`；B 能力接缝与 R/A 映射 `…-20260930-capability-map.md`；C 首阶段约束与预算 `…-20260930-stage-constraints.md`（同名前缀）。

## 六问结论

**Q1 权威状态**：功能数 45、清单 ✅46/🟦22/⬜22（90）、ADV64 行级重算一致（A1）。Git/CI/Release 实测（A2）：Server `8e23a2d`、Web `e3ae316`，develop=main=远端，tag/Release 0.1.3 双仓 Latest，CI 36603608187/36602576798 success。0.1.3 身份（A3）：发布=tag/Release；部署=UAT（chikaho.cn 单机）删库重建至种子基线 v0.1.0（部署回执层级）；开发版本=Server 0.1.3-SNAPSHOT；迁移=V0.1.0__baseline_seed 仅全新建库；待验收=v0.1.3-release EXECUTION_SUBMITTED、1629 非锁定基线；与 memory 无冲突。

**Q2 信息治理**（A4/A5）：高优 2 处——①`knowledge/session-handoff.md` 顶部停于 2026-09-29 SSO、载"生产 0.1.2/V102"旧事实；②`Server/功能清单.md:49` 当前焦点段为 0.1.0 时点（1423/V93、下一动作=等待 Owner）、`:229` "功能数 44"。`current-status.md` 4 处过期"当前"（顶部 sso-admin-config 仍写"待规划确认"与 2026-09-29 终局裁决冲突等）。轻微：memory features BAO 基线无时点词、shared-constraints §7 锚漂移、CHANGELOG 缺 0.1.2/0.1.3 条目、两工程 README 锚 0.1.0。memory 8 文件均 <5KB、总量 17,176B（G05 达标）。待裁决 5 项（A5），其余为无争议可落实更正。

**Q3 写入通道**（B0）：宽表 6 条写路径全部收敛 `DynamicTableSql` 单一出口（白名单、强制 tenant_id+deleted、参数绑定、父行锁、10s 锁等待硬编码），表单/导入/OpenAPI 复用同一保存链，Phase 3"宽表旁路 0"代码上可复现。管辖外豁免 5 处（theme_seq 裸 SQL、BpmUrge 只读行锁、外部 DS 仅 SELECT、IoT 补偿挂起租户、Agent 工具配置治理，详 B0.3）。发布校验无超时/脚本权限/等级/事务边界项。受控动作原语（原子条件更新/预占确认释放/台账）**真实缺失**。

**Q4 BAO/命令**（B1）：引擎与业务共享提交边界已证实（同 DataSource/TM 绑定；G3a/G3b 真实 PG 故障注入测试在仓=Phase 4 当时行为证据，本次未重跑，引入 @DS/换 TM 即失效）。`sw_bpm_command`+五道意图接缝齐备；领取/租约/stale 回收/退避/FAILED 终态在五条接缝各自同构独立实现。命令身份跨 NORMAL/P0 双通道统一；幂等=稳定键+6 唯一索引+PG 保存点。缺口：命令状态机无 EXPIRED/外部待核实态；ReliableEventGateTest 为源码文本断言型；无 Outbox 表（等效路线=意图表+恢复调度）；`FormSubmitService.java:42` 过时 javadoc 残留。

**Q5 P21/P57/P58/租户**（B2/B3）：IoT 双通道命令链路完整（RequestId 落库、correlationId、补偿任务）；**UNKNOWN 态无生产调用方、无对账任务、设备回调只收 SUCCESS/FAILED**——A08 未知结果可对账未实现。节点注册器 fail-fast 可插拔（8 类节点）、ProcessGraph contractVersion、能力清单前后端共享；IOT_COMMAND 仅前端 mock、后端无翻译器。版本快照（PUBLISHED 不可变+实例绑定+表单 snapshot）在位。调度=Quartz+DB 队列双车道，无限流/准入组件，NodeFunctionService 无界线程池、MQTT 上行线程无租户身份（fail-closed 断链）隐患。租户拦截器 fail-closed+DataScope 成体系。R/A 映射见 B3。

**Q6 首阶段与预算**（C）：首阶段可复用基座=共享提交边界、命令身份/幂等/回查、宽表受控入口、租户/权限体系、版本快照；受控动作原语/C1 分类/EXPIRED 态/UNKNOWN 对账/发布校验扩展为新建设。前置决策见 C2（兼容窗口/事务参与者/在途对象/迁移回滚/恢复实现收敛）。**性能证据不充分**：全仓无性能/负载/延迟测量资产（在仓并发测试仅证正确性），两原稿均自述无实测；预算输入全部缺失，A06/A07 验收前须固定。

## 事实/推测/未确认/冲突

- 已确定：A1/A2/A4 实测值、B0—B2 代码证据（file:line 在附件）。
- 推测：Agent 工具白名单实际暴露面取决于运维配置，未审计配置数据。
- 未确认：45/45 登记路径未逐名复验；known-issues 全文未逐行重审；UAT 远端运行态未登录复核；Release 资产 sha256 未重新复算。
- 唯一实质冲突：current-status.md 的 sso-admin-config "待规划确认" vs 终局裁决"COMPLETED（规划已确认，2026-09-29）"；治理方向 §3 已固定值，留治理执行落实。
- 六问均有结论，无需继续探索；交 Planner 收敛阶段方向与 ADR，信息治理按 G01—G06 单独回执。
