# IG1a 附件：当前入口统一与快照回读（information-governance-03 补证）

> 生成：2026-09-30 执行03。工作目录：工作区仓库根。方法：对每个受影响当前入口，先采集"修正前"实际文本（python 逐行提取关键句快照），完成统一修正后再以同一规则采集"修正后"文本；两列均为逐字摘录（≤260 字符，UTF-8 严格读写），不做转述。

## 1. 逐入口 修正前 → 修正后 实际文本对照

### `knowledge/current-status.md`

- 关键句「信息治理执行 01 审查未通过」
  - 修正前 L3: > **2026-09-30 P62 规划启动为当前主规划（XL，PLANNING；含配套信息治理）——探索已回传并审查，首阶段方向与 ADR-P62-001 已形成；信息治理执行 01 审查未通过（IG1—IG4），执行 02 已定向补证提交待规划复核**：Owner 2026-09-30 启动 P62 低代码事务能力与 BPM 分级执行架构规划并纳入信息治理（正式需求 `todo/p62-lowcode-transaction-bpm-tiering.md` R01—R10/A01—A12；主方向、治理方向、事
  - 修正后: （该关键句已不在文件中——整句替换，见上/下一行新口径）
- 关键句「当前唯一下一动作 = Planner 复核」
  - 修正前 L8: > **【历史快照，当前值唯一见顶部 2026-09-30 P62 规划条目】2026-09-29 三方 SSO 真实接入功能级 `PASSED`、接入功能状态 `COMPLETED（待规划确认，2026-09-29）`（规划验收审查 07 `product/dingtalk-sso/receipts/planning-review-three-provider-07-passed.md`；阶段三同步方向 `product/dingtalk-sso/ready/direction-sso-terminal-sync
  - 修正后 L3: > **2026-09-30 P62 规划启动为当前主规划（XL，PLANNING；含配套信息治理）——探索已回传并审查，首阶段方向与 ADR-P62-001 已形成；信息治理执行 02 部分锁定（审查02），剩余 IG1a/IG2a/IG2b/IG3a 已按一级补充提示01 由执行03 补证完成、待规划复核**：Owner 2026-09-30 启动 P62 低代码事务能力与 BPM 分级执行架构规划并纳入信息治理（正式需求 `todo/p62-lowcode-transaction-bpm-tiering.md

### `knowledge/session-handoff.md`

- 关键句「当前唯一下一动作 = Planner 复核」
  - 修正前 L3: > **当前任务覆盖值（2026-09-30 P62 规划、探索审查与信息治理执行01/02）**：P62 低代码事务能力与 BPM 分级执行架构（XL，PLANNING）为当前主规划（正式需求 `todo/p62-lowcode-transaction-bpm-tiering.md`；主方向、治理方向、事务阶段方向 `ready/direction-p62-local-transaction-actions.md` 与 ADR `ready/adr-p62-001-transaction-foundation.m
  - 修正后 L3: > **当前任务覆盖值（2026-09-30 P62 规划、探索审查与信息治理执行01/02）**：P62 低代码事务能力与 BPM 分级执行架构（XL，PLANNING）为当前主规划（正式需求 `todo/p62-lowcode-transaction-bpm-tiering.md`；主方向、治理方向、事务阶段方向 `ready/direction-p62-local-transaction-actions.md` 与 ADR `ready/adr-p62-001-transaction-foundation.m

### `memory/state.md`

- 关键句「同步点：」
  - 修正前 L3: 同步点：2026-09-30，信息治理执行 02。knowledge/current-status.md 为完整权威；执行01审查未通过（IG1—IG4），执行02已按审查定向补证提交（45逐名映射/90行明细/54问题明细三附件+风险登记I56—I58+完整提交回读）；审查02未通过，按一级提示补证。
  - 修正后 L3: 同步点：2026-09-30，信息治理执行 03。knowledge/current-status.md 为完整权威；执行02审查02未通过（IG1—IG4），执行03已按一级补充提示01补证提交（IG2a 45逐名映射与状态依据/IG2b 54条正文状态句比对/IG3a 入口正文与链接/IG1a 全入口统一，证据在 receipts/evidence/information-governance-03/）；待 Planner 复核回执03。
- 关键句「唯一下一动作：」
  - 修正前 L9: - 唯一下一动作：Executor 按 `product/p62-lowcode-transaction-bpm-tiering/receipts/planning-execution-prompt-information-governance-01.md` 补齐四项并追加回执03。
  - 修正后 L9: - 唯一下一动作：Planner 复核 `product/p62-lowcode-transaction-bpm-tiering/receipts/information-governance-03.md`。
- 关键句「功能数45沿用；」
  - 修正前 L20: - 功能数45沿用；执行已报告登记存在性，附件①已提交但45/44及状态依据未通过，按IG2a补证；清单46/22/22（90）已行级复算且与映射索引双向一致；ADV64同。P62/信息治理不增加或核销。
  - 修正后 L20: - 功能数45沿用；IG2a 已补证：45 行=45 唯一 ID=45 唯一登记路径全部存在（#1 由 bpm-single-node-approval 承载登记；#23 登记文件头部陈旧快照差异已列报交 Planner），状态依据完整句见回执03附件；清单46/22/22（90）行级复算且与映射索引双向一致；ADV64同。P62/信息治理不增加或核销。

### `memory/README.md`

- 关键句「唯一下一动作：」
  - 修正前 L7: - 唯一下一动作：Executor 按 `product/p62-lowcode-transaction-bpm-tiering/receipts/planning-execution-prompt-information-governance-01.md` 补齐四项并追加回执03。探索已审查，首阶段范围及 ADR 已收敛，业务未 READY。
  - 修正后 L7: - 唯一下一动作：Planner 复核 `product/p62-lowcode-transaction-bpm-tiering/receipts/information-governance-03.md`。探索已审查，首阶段范围及 ADR 已收敛，业务未 READY。
- 关键句「信息治理：」
  - 修正前 L8: - 信息治理：`product/p62-lowcode-transaction-bpm-tiering/ready/direction-p62-information-governance.md`；执行 01 审查01未通过（IG1—IG4），执行 02 已按审查补证提交（三附件+风险登记 I56—I58+提交回读），审查02未通过，按一级提示补证。
  - 修正后 L8: - 信息治理：`product/p62-lowcode-transaction-bpm-tiering/ready/direction-p62-information-governance.md`；执行 01/02 审查未通过，执行 03 已按一级补充提示01 补证提交（IG2a/IG2b/IG3a/IG1a 四项，证据在 receipts/evidence/information-governance-03/），待复核。

### `memory/handoff.md`

- 关键句「同步点：」
  - 修正前 L3: 同步点：2026-09-30，信息治理审查02。P62整体PLANNING，业务未READY。
  - 修正后 L3: 同步点：2026-09-30，信息治理执行03。P62整体PLANNING，业务未READY。
- 关键句「锁定：」
  - 修正前 L9: 锁定：90明细46/22/22一致；54问题分类31/3/5/15可复算；风险I56—I58登记、失效索引注记更正及回执02正文提交远端回读已补齐。审查02读取时memory18136B、最大4575B是当时容量，不作为后续编辑后的实时值。
  - 修正后 L9: 锁定：90明细46/22/22一致；54问题分类31/3/5/15可复算；风险I56—I58登记、失效索引注记更正及回执02正文提交远端回读已补齐。审查02读取时memory18136B、最大4575B是当时容量，不作为后续编辑后的实时值；执行03收尾快照与最终字节数以回执03容量节为准。
- 关键句「## 唯一下一动作」
  - 修正前 L13: ## 唯一下一动作
  - 修正后 L13: ## 唯一下一动作

### `memory/features.md`

- 关键句「功能数45沿用；」
  - 修正前 L4: > 功能数45沿用；逐名映射明细见治理回执02附件①（45/45 登记路径存在，#1 Walking Skeleton 由 A 组目录承载）待规划复核；清单46/22/22（90）与映射索引双向一致、ADV64已行级复算；本轮零核销。以下既有功能按各裁决时点引用。
  - 修正后 L4: > 功能数45沿用；IG2a 补证后口径：45 行=45 唯一 ID=45 唯一登记路径全部存在（#1 由 bpm-single-node-approval 承载登记、#23 登记文件头部陈旧快照差异列报），状态依据完整句见回执03附件；清单46/22/22（90）与映射索引双向一致、ADV64已行级复算；本轮零核销。以下既有功能按各裁决时点引用。
- 关键句「P62：主方向」
  - 修正前 L19: - P62：主方向、首阶段方向 `ready/direction-p62-local-transaction-actions.md` 与 ADR-001 位于 `product/p62-lowcode-transaction-bpm-tiering/ready/`；PLANNING，探索已审查、首阶段范围与 ADR 已收敛；治理审查02未通过，剩余IG1a/IG2a/IG2b/IG3a，业务未READY。
  - 修正后 L19: - P62：主方向、首阶段方向 `ready/direction-p62-local-transaction-actions.md` 与 ADR-001 位于 `product/p62-lowcode-transaction-bpm-tiering/ready/`；PLANNING，探索已审查、首阶段范围与 ADR 已收敛；治理审查02未通过，剩余IG1a/IG2a/IG2b/IG3a，业务未READY。

### `memory/issues.md`

- 关键句「> 2026-09-30」
  - 修正前 L3: > 2026-09-30 P62 规划侧纠偏；治理审查01未通过，执行02已按 IG1—IG4 补证提交（回执02）待复核；业务问题权威注册：`knowledge/known-issues.md`。
  - 修正后 L3: > 2026-09-30 P62 规划侧纠偏；治理审查01/02 未通过，执行03已按一级补充提示01 完成 IG1a/IG2a/IG2b/IG3a 补证（回执03）待复核；业务问题权威注册：`knowledge/known-issues.md`。
- 关键句「信息治理执行02已提交」
  - 修正前 L6: - **信息治理执行02已提交**：执行01审查01未通过（IG1—IG4）；执行02补证=45功能逐名映射附件①、90行明细附件②、known-issues 逐条明细附件③，并按审查登记 3 条风险（I56 Agent工具配置可达性/I57 MQTT上行线程无租户身份/I58 无界线程池与无限流，均"登记待验证"，集合变 57 条=I1—I58 缺 I27；I1—I55 分类不变：关闭31+部分3（I3/I13/I45）+待修复5+限制预留15）。0.1.2 的1586/0/0/0、Web1301+3及V102是
  - 修正后: （该关键句已不在文件中——整句替换，见上/下一行新口径）

### `todo/requirement-pool.md`

- 关键句「2026-09-30 当前排期」
  - 修正前 L12: Owner 2026-09-30 当前排期：P62（XL）PLANNING，首阶段范围与ADR已形成，信息治理审查02未通过。唯一下一动作：Executor 按 `product/p62-lowcode-transaction-bpm-tiering/receipts/planning-execution-prompt-information-governance-01.md` 补齐IG1a/IG2a/IG2b/IG3a并追加回执03；0.1.3仍待规划验收，完成数与P核销不变。此前带日期的排期仅作历史。
  - 修正后 L12: Owner 2026-09-30 当前排期：P62（XL）PLANNING，首阶段范围与ADR已形成，信息治理审查02未通过。执行03已按一级补充提示01补齐IG1a/IG2a/IG2b/IG3a并提交回执03（`product/p62-lowcode-transaction-bpm-tiering/receipts/information-governance-03.md`）；唯一下一动作：Planner 复核回执03；0.1.3仍待规划验收，完成数与P核销不变。此前带日期的排期仅作历史。
- 关键句「| P62 |」
  - 修正前 L158: | P62 | 低代码事务能力与 BPM 分级执行架构（OA / MES / WMS / IoT） | Owner 2026-09-30；XL；[正式需求](p62-lowcode-transaction-bpm-tiering.md)；[CTO 评审输入](p62-architecture-review-source-20260930.md) | PLANNING：治理审查02未通过，按一级提示补齐IG1a/IG2a/IG2b/IG3a；业务未READY |
  - 修正后 L158: | P62 | 低代码事务能力与 BPM 分级执行架构（OA / MES / WMS / IoT） | Owner 2026-09-30；XL；[正式需求](p62-lowcode-transaction-bpm-tiering.md)；[CTO 评审输入](p62-architecture-review-source-20260930.md) | PLANNING：执行03已按一级提示补齐IG1a/IG2a/IG2b/IG3a（回执03）待规划复核；业务未READY |

### `todo/p62-lowcode-transaction-bpm-tiering.md`

- 关键句「- 状态：」
  - 修正前 L6: - 状态：PLANNING（信息治理审查02未通过；一级补充提示已下发，业务未READY）
  - 修正后 L6: - 状态：PLANNING（信息治理审查02未通过；执行03已按一级补充提示01完成IG1a/IG2a/IG2b/IG3a补证（回执03）待规划复核）

### `Smart-WorkFlow-aPaaS-server/功能清单.md`

- 关键句「当前焦点：」
  - 修正前 L49: > 当前焦点：**P62 低代码事务能力与 BPM 分级执行架构（XL，PLANNING，2026-09-30 启动；探索已回传并审查，首阶段方向与 ADR 已形成；信息治理审查01未通过，执行02已按 IG1—IG4 补证提交待规划复核）**；当前发布版本 **0.1.3**（v0.1.3-release EXECUTION_SUBMITTED 待规划验收，UAT 为种子基线 v0.1.0、仅支持全新建库）。历史（P60 轮）：`v0.1.0-oa-completion`（P60 成熟 OA 目标 `0.1.0`
  - 修正后 L49: > 当前焦点：**P62 低代码事务能力与 BPM 分级执行架构（XL，PLANNING，2026-09-30 启动；探索已回传并审查，首阶段方向与 ADR 已形成；信息治理执行02部分锁定（审查02），执行03已按一级补充提示01完成 IG1a/IG2a/IG2b/IG3a 补证（回执03）待规划复核）**；当前发布版本 **0.1.3**（v0.1.3-release EXECUTION_SUBMITTED 待规划验收，UAT 为种子基线 v0.1.0、仅支持全新建库）。历史（P60 轮）：`v0.1.0-oa

### `product/p62-lowcode-transaction-bpm-tiering/ready/direction-p62-lowcode-transaction-bpm-tiering.md`

- 关键句「P62 维持 PLANNING；本轮不新增」
  - 修正前 L53: P62 维持 PLANNING；本轮不新增已完成功能、不核销 P62 或关联 P 编号，不晋级测试基线。清单46/22/22（90）、ADV64已由探索行级复算且与映射索引双向一致；功能数45沿用权威值，45/45 登记路径存在性已报告，功能—登记—裁决逐名映射明细已随治理回执02附件补齐、待规划复核。
  - 修正后 L53: P62 维持 PLANNING；本轮不新增已完成功能、不核销 P62 或关联 P 编号，不晋级测试基线。清单46/22/22（90）、ADV64已由探索行级复算且与映射索引双向一致；功能数45沿用权威值，IG2a 补证后口径：45 行=45 唯一 ID=45 唯一登记路径全部存在（#1 由 bpm-single-node-approval 承载登记、#23 登记文件头部陈旧快照差异列报），状态依据完整句见回执03附件、待规划复核。
- 关键句「当前可执行工作为信息治理」
  - 修正前 L55: 阶段方向（`ready/direction-p62-local-transaction-actions.md`）与 ADR-P62-001 已形成；当前可执行工作为信息治理剩余覆盖核验（按治理审查01 IG1—IG4）。信息治理按配套方向规定的授权和裁决边界执行；业务实现待治理复核通过后由事务阶段方向置 READY。0.1.3 发布审查保持独立，不由文档治理代替验收。发布、部署、破坏性操作不在本方向授权内。
  - 修正后 L55: 阶段方向（`ready/direction-p62-local-transaction-actions.md`）与 ADR-P62-001 已形成；当前可执行工作为信息治理剩余覆盖核验（审查02后按一级补充提示01 IG1a/IG2a/IG2b/IG3a，执行03已完成）。信息治理按配套方向规定的授权和裁决边界执行；业务实现待治理复核通过后由事务阶段方向置 READY。0.1.3 发布审查保持独立，不由文档治理代替验收。发布、部署、破坏性操作不在本方向授权内。

## 2. memory 八文件容量终测（执行03 收尾快照，wc -c 等价 os.path.getsize）

- memory/README.md: 1150 B
- memory/architecture.md: 857 B
- memory/constraints.md: 1405 B
- memory/decisions.md: 2805 B
- memory/features.md: 4645 B
- memory/handoff.md: 1483 B
- memory/issues.md: 3217 B
- memory/state.md: 2855 B

**总量 18417 B（<20,000B 上限）；最大单文件 features.md 4645 B（<5,000B 上限）。** 本值为执行03 全部编辑完成后的实时快照；此前 18,136B/4,575B（审查02 读取时点）与 18,637B/4,543B（执行01 时点）均为各自历史快照，不作为当前值。

## 3. 旧口径残留检索（执行03 收尾）

- `grep -rn "补齐IG1a/IG2a/IG2b/IG3a并追加回执03"` 于 knowledge/ memory/ todo/ product/p62…/ready/ 功能清单 → 仅历史回执/审查原文（information-governance-02.md 附录说明段、planning-review/execution-prompt 两份规划文件）命中，当前入口 0 命中。
- `grep -rn "待规划复核"` 当前入口统一指向 information-governance-03。
- 回执01/02 与审查/提示文件按约定保留原文，不计残留。
