# 0.2.3 功能清单全量对账

2026-11-05｜本会话角色：规划，委派角色：执行。

## 目标

Owner 要求更新已做但清单仍标未做的功能。对照原始需求、正式验收和当前实现，形成可用于一次裁决与同步的完整差异表。承接 product/0.2.3/receipts/planning-review-assessment-023-01.md；属于0.2.3需求评估，不新增业务功能或发布任务。

## 问题与范围

1. 清点 Server 功能清单的全部90条稳定明细、高级能力清单全部64条稳定明细、todo/requirement-pool.md 全部实际P编号（保留编号空洞，不推算数量）。读取 knowledge/current-status.md、feature-reconciliation-index.md、相关功能/问题索引，确认现行权威文件位置、条目总数和状态口径。
2. 每条映射原始要求→已验收交付→当前实现定位。闭合且证据一致的历史项只引用终态，不重新审计实现；对仍标未做/部分做、过时描述、互相矛盾的条目定向核实代码。覆盖全表，但不扩成全仓安全或质量审计。
3. 重点逐断言核对 P9/P19/P15（0.2.2）、P29/P65/P2/P4（0.2.0及P60）、P26/P47（P60/P63）。同时检查其余P和对应明细，不能只更新这几个示例。确认P18真实剩余，P20会话列表/详情与聊天窗口/SSE的差别。
4. 分类明确：已验收且范围全覆盖、已验收部分范围、仅实现未验收、真实未实现、Owner延期/暂不修复、事实不足。代码存在不等于通过；历史“不核销”不等于永远不允许按原范围核销，不增加原需求没有的条件。
5. 输出拟更新的逐项旧值→新值、证据、保留缺口、跨表映射；提出可核销P及不能核销的具体原因，复算三类计数与总量，分开正式功能数、90明细、ADV64、P、问题计数。仅文档对账不得新增业务功能数或升级测试基线。
6. 给出同步覆盖矩阵：knowledge权威状态/索引/功能/问题、两仓实际功能清单及相关当前版本说明、todo、memory、product当前入口。只列本次受影响文件，不重写历史回执。报告当前Git快照与在途改动，保护他人成果。

## 已有证据入口

- search_fallback/v023-agent-execution-lifecycle-assessment.md。
- product/0.2.2/receipts/planning-review-f1-stage1-02.md（G5）、planning-review-f1-stage1-03.md、planning-review-f1-stage3-01/02.md、planning-review-f2-01/03/04.md、planning-final-review-022-completed.md。
- product/0.2.0/receipts/planning-review-unified-020-38-passed.md、planning-final-review-terminal-sync-020-completed.md及passed/direction-020.md。
- product/v0.1.0-oa-completion/receipts/planning-review-stage-i2-v0.1.0-oa-completion-06-passed.md、planning-review-stage-i3-v0.1.0-oa-completion-08-passed.md。
- product/p63-mes-workflow-foundations/receipts/planning-review-readiness-01.md及planning-final-review-terminal-sync-p63-mes-workflow-foundations-02-completed.md。

其他项按现有索引定向追溯。Planner已可读取的证据只引用，不复制正文或代码。

## 约束与证据格式

执行角色按 system.md 完成本机检查，读取对应工程宪法后只读核实。禁止修改业务/测试/配置、运行编译测试迁移部署、启动服务、调用付费模型、读取秘密、清库或接触用户服务。本轮只写 search_fallback 对账成果和必要完整只读输出，不修改正式状态、勾选、P核销、knowledge、memory或需求池。后续同步须等Planner明确裁决值。

主回执 `search_fallback/v023-feature-inventory-reconciliation.md`，目标<5KB，结论优先。完整逐条矩阵存 `search_fallback/v023-feature-inventory-reconciliation-matrix.md`（可超过5KB，以完整覆盖为准），不截断。列：稳定ID、原断言、当前标记、已过范围/证据、实际剩余、建议值、证据层级、关联ID。相同能力映射多个表不得重复计数。真实工具输出如有独立文件，放同名-evidence目录；无需另建证据包或非必要哈希。无法证实的项保留未知与精确原因。

## 完成与交接

90/64/实际P全覆盖，重复和缺失ID明确；建议计数可按行复算；每项升降都有原范围和证据，延期项保留Owner决定；同步覆盖清单明确。执行按本任务自己的实际终态契约交回规划，不自行转入实现或核销。没有新行为变化，不要求重跑已有验收。

信息不足时记录已核实范围、具体缺证和真实工具失败，继续其他独立条目；不无限扩搜或等待。仅提交自己的文档批次，按system.md既有Git规则处理，不混入其他在途文件。
