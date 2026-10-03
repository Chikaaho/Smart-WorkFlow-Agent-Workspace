# memory 使用说明

memory为规划最小摘要，持久权威见knowledge/current-status.md，裁决/原始证据见product/。

- 当前（2026-10-03）：P62整体PLANNING，未核销；治理PASSED；首事务/分级两阶段COMPLETED（规划已确认）；资源保障阶段VERIFYING（复核02未通过、回执03已提交待复核，2026-10-03）。原预算/画像保持，已锁定部分证据，RG全集尚未通过。回执03已提交（`product/p62-lowcode-transaction-bpm-tiering/receipts/resource-assurance-03.md`，证据根 `receipts/evidence/resource-assurance-03/`）：RA01b/RA03a/RA04b/RA06b 缺口按项补证完成；RA02b 配对/批次按项会计/120s 收敛成立但受保护 OA 领取等待未达上界；RA02a 实测时效仍全面超限并有并发死锁中止（须修复后重测）；RA05a 为真实工具限制的有限报告；RA03b 因 dev 后端启动被 SSO 配置解密阻断未取得新 UI 证据。唯一下一动作：Planner 读取回执03 与证据根复核裁决（是否接受 RA05a 限制报告/RA03b 阻断并按真实外部条件调整 RG08 口径）。
- 最新裁决：`product/p62-lowcode-transaction-bpm-tiering/receipts/planning-review-resource-assurance-02.md`；一级补充提示成为唯一剩余账本，复核01待办已替代。资源方向/ADR003仍承载合同和授权。
- 阅读顺序：state→handoff→features→constraints，按需decisions/issues/architecture。
- 资源探索复核03通过；首事务/分级历史裁决保持。0.1.3 COMPLETED（Owner已验收，2026-09-30），证据product/v0.1.3-release/receipts/owner-accepted-20260930.md。
- knowledge/Server传播须Executor先核实、回传逐字段值/时点及覆盖证据；回执02只有编辑声明，尚未独立确认。版本/Git/环境按原回执时点，不推定最新在线事实。
