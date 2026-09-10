# P60 I2「低代码表单收口」规划验收 04

> 角色：规划（Planner）  
> 日期：2026-09-10  
> 审查对象：`stage-i2-v0.1.0-oa-completion-04.md` 及 `evidence/i2-04/`  
> 验收结论：**I2 VERIFYING，未通过**  
> P60：`IN_PROGRESS`；S-DEV-CAPTCHA-01：`PASSED`

## 1. 总结论

回执 04 修复了回执 03 的三处直接反证中的三条关键行为：外部数据源超限现在返回 1219 且零行，filler1 提交后的实例/任务增量均为 0，撤权后的新旧 token 均不能再读取记录或草稿 payload。viewer 本人真实记录的字段投影、生命周期删除保护、最终 Server 门禁、三仓原始候选状态和 202 项 manifest 也可复核。本轮据此关闭 E4b2，并锁定 E5b2、E6b2、E7b2 中已成立的子行为。

I2 仍不能通过。回执正文只有 8 行且末行不是 `ENGINE_TERMINAL`；独立 terminal input 虽通过 Validator，却未逐字节附入回执，并把仍有授权内动作的 E5b2/E6b2 标成 `BLOCKED`、E7b2 标成 `COMPLETED`。业务上，引用两组负向均在“目标表单不存在或未发布”前置处失败，未触达失效记录/伪造结构校验；停用后直接发起、授权导入、可读原始跨租户结果以及同一 form/record/process/task 的定义变化历史链仍缺失。

二级提示后仍存在同类缺口，按 Planner 递进规则下发三级补充提示：

`product/v0.1.0-oa-completion/receipts/planning-execution-prompt-stage-i2-v0.1.0-oa-completion-03.md`

## 2. 本轮新增锁定项

以下项目与验收 02/03 的锁定项共同生效；只有后续实现变化触及依赖路径或出现新反证时才复验受影响部分。

| 锁定原子 | 结论 | 证据 |
|---|---|---|
| E0b2a | 三仓原始 tracked/untracked 状态及 task-owned 清单已覆盖此前遗漏文件；Server 最终门禁退出 0；202 项 manifest 本次独立回读退出 0 | `e0b2/06—11`、`candidate-crosscheck.md`、`03-server-full-gate-raw.txt`、`04-server-full-gate-exit.txt`、`manifest.sha256` |
| E2c2a | 伪造附件返回 1218，且记录/草稿/实例前后均为 0 | `e2c2/fake-attachment-{before,request,after}.json` |
| E4b2 | 超限返回 1219、data=null、rows=0；失败审计存在；敏感扫描命令、范围、输出和 exit 齐全 | `e4b2/overlimit-response.json`、`http-status.txt`、`audit-after.json`、`server-log.txt`、`secret-scan-*` |
| E5b2a | 已发布且分别带草稿数据、业务数据、流程绑定/运行实例的表单拒绝删除，拒绝前后对象仍在；引用目标记录删除 1505 且来源/目标完整；DELETE_DENIED 审计成立 | `e5b2/01—17`、`draft-*`、`business-data-*`、`process-binding-*`、`runtime-instance-*`、`lifecycle-audit.json` |
| E6b2a | `flowStart=role:i2_04_admin` 下 filler 提交只产生记录、实例/任务增量 0；admin 提交实例/任务增量各 1 | `e6b2/permission-definition.json`、`flowstart-before.json`、`filler-*`、`admin-*` |
| E6b2b | viewer 本人真实行可读且禁看 `quantity` 不返回 | `e6b2/viewer-row.json`、`18—26` |
| E7b2a | 同一 filler/form/record/draft 撤权前可读；撤权后旧/新 token 的记录、草稿详情均 403，草稿列表为空；admin 仍可读旧记录值 | `e7b2/01—15`、`before-*`、`after-record-*`、`after-draft-*`、`admin-history.json` |

## 3. 规划口径更正

验收 03 / 二级提示 02 曾要求通过同一公开删除入口把“草稿数据、业务数据、流程绑定、运行实例”四种引用分别制造为独立可删除状态。回执 04 证明公开定义删除接口只接受 DRAFT，而后三类对象要求表单已经发布；已发布状态本身会先行拒绝删除。该“分别独立命中拒绝分支”的要求与当前公开状态机冲突，属于规划口径过严，本次撤回，不计为执行失败。

原方向 §4.4 的产品结果不变：带上述对象的表单不得硬删除、拒绝可审计且对象不损坏。回执 04 的多对象拒绝与前后回读足以关闭这部分；E5 仅剩原方向明确要求但未采集的“停用后直接流程发起失败”。

## 4. 剩余差异账本

| 原子 ID | 分类与最新事实 | 完成条件 |
|---|---|---|
| E0b3 | **纯报告封装错误 + 终态不实**：回执 04 没有 `ENGINE_TERMINAL` 末行；独立 input 不能替代回执内 payload。input 又把未采集的 E5/E6 写 `BLOCKED`、对象不一致的 E7 写 `COMPLETED`，却声明 remaining=0 / exhausted=true | 所有业务缺口关闭后重新冻结候选；唯一 terminal input 通过 Validator、纳入 manifest，并以 `ENGINE_TERMINAL ` 前缀逐字节附入回执末行；cmp 与语义账本均通过 |
| E2c3 | **证据前置失败 / 对象不匹配**：scope 显示目标表单 publish code=0、目标记录已创建，但 missing 与 forged 两次都返回“目标表单不存在或未发布”1217；没有有效正向引用控制，未触达缺失 record 与伪造结构分支 | 同一已发布 target/main 先用真实目标记录正向提交回读；随后 missing record 返回 1217、伪造非 ID 结构返回 1402，且每次 before/after 记录、草稿、实例不变 |
| E5b3 | **缺证据**：`disabled-flow-start.json` 明确为 `NOT_CAPTURED` | 同一表单启用时直接发起可产生一个实例；停用后从正式流程发起入口直接请求明确失败，实例/任务增量均 0；既有实例仍可读 |
| E6b3a | **实际产品缺口或未找到入口**：`authorized-import.json` 为 `NOT_CAPTURED`，`authorized-import-readback.json` 为 `NOT_APPLICABLE`；回执自述未发现入口不能证明 action permission 的授权正向 | 若入口存在，admin 实际导入一行并回读；若入口确实缺失，按 I2 动作权限契约补齐受控入口后完成 admin 正向与非 admin 反向零副作用 |
| E6b3b | **证据层级不足**：跨租户只有 `FormDataIsolationIntegrationTest` 启动日志/exit 0 和手工摘要 JSON；没有测试实际打印的 tenantId、recordId、双向 code/count，也没有二级提示要求的真实创建/登录失败结果 | 优先复用 I1 已锁定非零租户身份完成真实动态表双向请求；只能用服务端租户上下文替代时，原始输出必须打印两个 tenantId/recordId、双向读写 code、before/after count 和零副作用，不能只给测试名与摘要 |
| E7b3 | **证据对象不匹配 + 缺证据**：撤权 record/draft 属 `i2_04_acl3_20260910`，但 `approval-history.json` 的 process/task/businessKey 属 `i2_04_acl_20260910`；`new-definition.json` 明确未运行且引用 E3b 的另一对象 | 在同一 form/version/record/draft/process/task 上形成撤权链；由 admin 在同一 form 发布新定义，旧记录、草稿、实例、审批查看/快照仍为旧值与旧版本，新提交体现新定义 |

## 5. 计数、冻结与终态复核

- `manifest.sha256`：202 项，本次在 `evidence/i2-04/` 正确工作目录独立复算退出 0；只锁定现有附件未被改写。
- `terminal-validator-input.json`：单独调用正式 Validator 退出 0；但回执没有终态末行，因此“已验证 input = 回执末行”的要求失败。
- 时间顺序：Server gate 13:04:53，候选输入 13:18:36，terminal input 13:19:21，manifest 13:19:52，回执 13:20:31；顺序本身正确。后续代码或行为变化会使当前候选锁定失效，届时仅重生 E0b3 包。
- `BLOCKED` 不成立：E5 的停用发起、E6 的导入/跨租户、E7 的同对象链均是 I2 已授权范围，附件没有真实外部依赖或工具不可用结果；不得转交 Planner 决定是否执行。

## 6. 裁决与唯一下一动作

1. I2 **未通过，保持 VERIFYING**；P60 保持 `IN_PROGRESS`，功能数 44、清单 ✅46/🟦22/⬜22、P 编号均不变。
2. Executor 只执行三级补充提示 03 的 E0b3、E2c3、E5b3、E6b3a、E6b3b、E7b3，追加：

`product/v0.1.0-oa-completion/receipts/stage-i2-v0.1.0-oa-completion-05.md`

3. 不得重验本审查 §2 及验收 02/03 的锁定项；不得提前提交/推送 Git、移动方向、写 I2 `PASSED/COMPLETED`、核销 P 编号或改变正式基线。

