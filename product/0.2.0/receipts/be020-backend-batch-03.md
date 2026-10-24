# be020 后端续办批次完成回执（G1 写拒绝 / G2 有界恢复）

2026-10-24｜Executor（后端）｜XL｜自验通过，待规划复核

总 7 阶段：已完成 1「需求评估」；进行中 1「分支实施」；未开始 5「验收同步、合并、发布、发布后同步、结束」。本回执是 0.2.0 后端两项续办（Owner 授权）的完成回执；明细见 `receipts/backend/be020-supplement-02.md`，历史批次回执 `be020-backend-batch-01/02.md` 保留。

## 交付摘要

- **BE020-G1 余项（授权替换写请求的实际拒绝）**：`ExternalDatasourceGrantsWriteAdmissionTest` 2 项——真实 HTTP + 真实安全过滤链 + 真实 `@EnableMethodSecurity` 方法级鉴权 + 真实租户拦截器 + 真实授权持久表。本租户无管理权限主体对 grants 替换被实际拒绝（HTTP 403）；持本租户管理权限的另一租户主体按对象租户过滤被拒（目标不可见，业务包络拒绝）；两租户授权集合持久回读零变化。未发现真实缺陷，产品代码零修改。
- **BE020-G2 余项（同一监听部分失败的有界恢复）**：`TriggerPartialFailureRecoveryTest` 1 项——真实持久命令队列（既有 `QueueH2TestConfig`）上：同一监听两动作（act-1/act-2 稳定标识）→ act-1 完成（效果 1、COMPLETED 结果在库）→ act-2 既有 `reject` 语义受控失败（零副作用、FAILED+原因在库）→ 经既有合法恢复入口 `ActionRefRecoveryService.retry` 复用同键命令重新入队 → 恢复后完成（效果恰 1）。最终持久结果解释三段去向；无恢复代新行、无第二实例、成功动作不重复执行。

## 验证与 Git

- `MAVEN_OPTS=-Xmx2g mvn test -pl sw-biz/sw-bpm/sw-bpm-engine,sw-biz/sw-bpm/sw-bpm-process -am` exit 0：bpm-engine **177/0/0/0**（175+2）、bpm-process **467/0/0/0**（466+1）。原文 `/tmp/g1-write-test.log`、`/tmp/g2-recovery-test.log`、`/tmp/g1g2-supplement2-full.log`（本机 Temp 留存）。
- Server 提交 `6995f88351c8adad19906433d820ecd2451fc4a8`（2 测试文件 +617，普通推送，远端 `origin/codex/0.2.0-tenant-form-flow` 回读同 SHA；前置 `b3aadbe`）。根仓与 knowledge/memory 由前端集成负责人统一收尾。

## 完成条件对照（续办任务原文）

| 余项 | 完成条件 | 结果 |
| --- | --- | --- |
| G1 写拒绝 | 无管理权本租户主体拒绝且授权集合/关联状态零变化；跨租户持权主体按隔离语义拒绝且双租户零变化；真实权限拦截/对象租户过滤/持久读取实际生效 | 2 项真实 HTTP 安全链用例逐项成立（403 + 不可见拒绝 + 双租户零变更持久回读） |
| G2 有界恢复 | 首次执行一成功一失败并留存各自结果与计数；既有恢复入口恢复失败部分且成功计数保持 1、与稳定动作标识关联、不重发业务；最终持久结果解释三段去向，不以 FAILED 可诊断冒称恢复 | 全部成立（同键复用、效果计数 1/1、INTENT_SUBMITTED 关联、命令/引用持久回读） |

## 边界与下一动作

- 等待规划复核本批两项余项；自验不裁决整版 PASSED/COMPLETED。密钥版本化、三节点语义、富文本交接仍为规划/协作待办，不纳入本次追加。
