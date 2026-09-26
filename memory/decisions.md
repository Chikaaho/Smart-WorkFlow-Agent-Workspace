# 近期有效决策摘要

> 同步点：2026-09-26；权威详情：`knowledge/decisions.md`（D1—D48 历史档案）与对应回执。

- 当前状态与历史物理分离；当前值只见 `knowledge/current-status.md`，历史见 `knowledge/history/`。终态机器契约单一源 `.codex/governance/terminal-contract.json`，校验入口 `.codex/governance/validate-terminal.sh`。
- Planner 以 `memory/` 最小摘要恢复；冲突时按 knowledge 权威修正，不反向裁决。
- P60（P0/XL）成熟 OA `0.1.0` 路线已完成整体终态；更广平台能力按 `ADV-M11`—`ADV-M18` 独立立项（8 模块/64 明细）。第三方 SSO 与外部通知只有取得真实 Provider 行为证据才可写为验证通过。
- P60 I3—I6 关键裁决：I3 沿用 P57 节点能力与 `ProcessGraph` 契约，`bpmn-js` 移出生产依赖与构建产物（P47 纳入不核销）；I4 外部联调用受控真实 HTTP 对端证明签名/重试/去重/失败恢复，不绑定厂商；I5 三 Provider 真实链 **延期免验/未验证**；I6 通知投递以持久化为权威、失败不回滚已合法审批，五渠道固定 **Owner 延期/未验证**（P37/P38/P39 不核销）。
- P61：旧数值 `code` 保持兼容，以可选且全局唯一的 `errorKey` 消歧；公共 `msg` 不承载原始诊断；启用 `zh-CN/en-US` 且防枚举。
- **Phase 1 后端 API `Optional` 契约（2026-09-24）**：`Optional<T>` 是模块内部调用的统一规范结果，对应 Controller 层 `Result<T>`，真实错误不吞为 empty；121 AM = 113 保留合规 + 8 删除闭合，174 个生产调用全部显式消费。`COMPLETED`。
- **总体范围（2026-09-24）**：`backend-api-optional-contract` 调整为 XL 总体任务 `backend-architecture-optimization` 的 Phase 1；10 项扫描发现仅作 BAO-01—BAO-10 候选，先按代码事实审计再分别决定立项/合并/延期/不执行，不一次性授权全部重构。
- **Phase 2 裁决（2026-09-24）**：8 `CONFIRMED` + 2 `PARTIAL`；BAO-06/07 合并为下一阶段，BAO-05 独立高优先级，BAO-03/04/08/09/10 归构建与制品治理，BAO-02 独立边界阶段，BAO-01 延期。
- **Phase 3 `COMPLETED`（2026-09-24）**：BAO-06/07 `PASSED` 17/17；唯一受控入口 `DynamicTableSql`、fail closed 与 PG 并发引用完整性收口。残余：10 秒固定超时未配置化、极端死锁以 1511+回滚兜底无自动重试、H2 不承担 PG 锁语义证明。
- **Phase 4 `COMPLETED`（2026-09-24）**：BAO-05 五道 must-deliver 接缝 `PASSED` 21/21；统一为事务内持久意图 + 恢复调度/租约回收 + 稳定业务幂等 + 有限重试与可审计终态，`FormSubmittedEvent` 兜底退役（权威路径 `FlowStartPort + sw_bpm_command`）。关键决策：**引擎与业务写入共享同一 DataSource 与事务管理器（单一提交边界）**，且**流程发起与业务实例记录同事务**。边界：外部五类 Provider 真实送达延期/未验证；引入 `@DS` 或改 Flowable DataSource/事务管理器则 G3a/G3b 快照失效；交付语义至少一次 + 业务幂等。
- **Phase 5 `COMPLETED`（2026-09-25）**：BAO-02 裁决 `PARTIAL`（IoT 完成、Knowledge/Agent 不拆）；抽取零基础设施依赖 `sw-basic-iot-api`，`sw-basic-iot` 原地保留实现，BPM 移除完整 IoT 与 entity/mapper 依赖并保持 Phase 4 fail-closed 语义。边界：`agent→knowledge` 死边、BAO-03 版本治理、IoT 异常文本脱敏。
- **Phase 6A（BAO-03/04）`COMPLETED`（2026-09-25）**：第三方版本归 `sw-dependencies`；Enforcer 在 `validate` 对 32/32 模块守门，分叉 14→0；POI 5.4.0，最终基线 1563/0/0/0。
- **Phase 6B（BAO-08/10）`COMPLETED`（2026-09-26）**：唯一生产入口自带 clean/test/package/制品门禁；正式 Jar 负向 10 项全 0、正向 6 项齐备；H2/mock/dev-only 归 test/dev；生产 IoT 无 provider 时 503 fail closed、缺凭据启动失败。边界：PG 为生产权威，不证明腾讯真实云送达。
- **Phase 6C `ci-friendly-version-identity`（BAO-09）`COMPLETED`（2026-09-26）**：CI-friendly `${revision}`；开发默认 `0.2.0-SNAPSHOT`、正式构建显式 `0.2.0`；Flatten 保证可消费 POM，effective version/制品标记/Release 元数据同源，四向身份漂移 fail closed；仓外 consumer 以唯一临时仓离线解析 `sw-basic-iot-api:0.2.0` 成功。边界：快照版本非发布主张；历史 refs 不改。
- **Final `repository-presentation-hygiene` + 总体收口（2026-09-26）**：双仓 About 与根 POM canonical URL（`https://github.com/Chikaaho/Smart-WorkFlow-aPaaS-server`）按 Owner 授权更新并写后回读逐字一致；根 POM 8/8 hunks 穷尽归属（Final 仅 URL 一处），证据计数以机器输出冻结（9/7、5/3）。**总体任务 `backend-architecture-optimization` `COMPLETED`**：10 项候选去向=BAO-01 `DEFERRED` + BAO-02 `PARTIAL` + 8 项 `COMPLETED`。边界：GitHub About 已更新但两仓未 commit/push/tag/Release/deploy，后端 POM 为本地工作树变更；公开版本仍 0.1.0。
