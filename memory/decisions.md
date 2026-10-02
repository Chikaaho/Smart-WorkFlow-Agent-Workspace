# 近期有效决策摘要

> 同步点：2026-09-30（P62规划启动）；权威详情：`knowledge/decisions.md`（D1—D48 历史档案）与对应回执。

- 当前状态与历史物理分离；当前值只见 `knowledge/current-status.md`，历史见 `knowledge/history/`。终态机器契约单一源 `.codex/governance/terminal-contract.json`，校验入口 `.codex/governance/validate-terminal.sh`。
- Planner 以 `memory/` 最小摘要恢复；冲突时按 knowledge 权威修正，不反向裁决。
- P60（P0/XL）成熟 OA `0.1.0` 路线已完成整体终态；更广平台能力按 `ADV-M11`—`ADV-M18` 独立立项（8 模块/64 明细）。第三方 SSO 与外部通知只有取得真实 Provider 行为证据才可写为验证通过。
- P60 I3—I6 关键裁决：I3 沿用 P57 节点能力与 `ProcessGraph` 契约，`bpmn-js` 移出生产依赖与构建产物（P47 纳入不核销）；I4 外部联调用受控真实 HTTP 对端证明签名/重试/去重/失败恢复，不绑定厂商；I5 三 Provider 真实链 **延期免验/未验证**（该边界已被 2026-09-29 更新：钉钉/飞书经 `direction-three-provider-sso-20260928` 真实链验收 `PASSED`（审查07），企业微信仍 Owner 延期）；I6 通知投递以持久化为权威、失败不回滚已合法审批，五渠道固定 **Owner 延期/未验证**（P37/P38/P39 不核销）。
- P61：旧数值 `code` 保持兼容，以可选且全局唯一的 `errorKey` 消歧；公共 `msg` 不承载原始诊断；启用 `zh-CN/en-US` 且防枚举。
- **BAO（backend-architecture-optimization）已整体 `COMPLETED（规划已确认，2026-09-26）`**，Phase 1—6C 与 Final 的逐阶段裁决细节不再在 memory 展开，权威记录见 `knowledge/decisions.md`、`knowledge/current-status.md` 历史区与 `product/backend-architecture-optimization/`；10 项候选去向=BAO-01 `DEFERRED` + BAO-02 `PARTIAL` + 8 项 `COMPLETED`。仍有效的关键边界：动态宽表 SQL 唯一受控入口 `DynamicTableSql`（fail closed）；引擎与业务写入共享同一提交边界、流程发起与业务实例同事务；生产 IoT 无 provider 503 fail closed、缺凭据启动失败；`${revision}` 双版本机制（0.1.2值为历史；0.1.3执行回执报告开发 `0.1.3-SNAPSHOT`/正式 `0.1.3`，当前值待执行核验）与生产入口 `scripts/build-prod.sh` 制品门禁继续生效；PG 为生产权威，不证明腾讯真实云送达。

- P62（Owner 2026-09-30）：事务优先，ADR001/002保持；首事务COMPLETED，分级执行VERIFYING。复核06关闭身份补证；提示05已交付——同键异载荷由恢复语义改为明确拒绝（新错误码2426，载荷指纹比对+旧行payload回推兼容，U02合同语义落入生产行为）、旧FLOW_START双实例归因夹具并以跨键重放验证SKIP_DUPLICATE防护，回执07待复核；0.1.3 Owner已验收。
