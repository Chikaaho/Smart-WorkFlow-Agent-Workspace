# P62 配套信息治理方向

- 日期：2026-09-30；Planner；P62（XL）配套交付；本方向 READY，事实写入依赖探索核实。
- Owner 授权范围：同步 memory、knowledge、README、需求清单、功能清单等过期信息。
- 主方向：`direction-p62-lowcode-transaction-bpm-tiering.md`；前置探索已回传；裁决：`../receipts/planning-review-exploration-01.md`。本文件是当前唯一执行入口。

## 1. 目标

消除当前入口间的过期状态、遗漏功能、失效路径及不一致计数，形成一份有时点、有证据、可回读的现状。治理先支撑 P62 规划，之后随阶段交付持续同步，不推迟到 P62 整体结束。

## 2. 覆盖和写入授权

Executor 先核实事实并维护 knowledge 权威，再机械同步派生摘要。明确授权本任务必要的 memory/ 与 todo/requirement-pool.md 状态同步；允许更新本方向涉及的文档内容，不授权改业务实现或治理规则。

| 当前入口集合 | 必须核对的信息 |
|---|---|
| knowledge/current-status.md、索引、功能详情及 feature-reconciliation-index | 活动任务、状态、计数、正式基线、唯一下一动作、功能映射 |
| knowledge/known-issues.md、decisions、architecture 等受影响正文 | 开放/关闭问题、有效决策、实现能力与局限、版本身份 |
| 根 README、两工程 README 及当前版本说明 | 项目能力、入口、开发/发布/部署版本、适用环境、有效链接 |
| memory 全部 8 个短文件 | 当前摘要、交接、功能索引、问题、决策、约束与架构；不得形成第二状态源 |
| todo/requirement-pool.md、P62 需求及暂不修复索引 | P 编号状态、有效排期、延期边界、重复或遗漏映射 |
| Server 功能清单及实际存在的其他功能/需求索引 | 90 项逐行对应关系、分类和计数可复算、与 P 编号关联 |
| product 当前方向、审查入口、新会话入口及关联索引 | ready/passed 实际位置、当前回执与历史引用、下一动作 |

Executor 返回实际完整路径；不存在的候选入口标记不适用及依据，不凭空建副本。不可写的治理文件差异单列管理员事项，不扩权修改。历史回执及归档正文保留原始时点，只修当前索引。

## 3. 本轮固定状态口径

- P62：PLANNING；当前主规划；唯一下一动作=Planner 复核 `../receipts/information-governance-05.md`；复核通过后信息基线锁定、事务阶段方向置 READY。
- sso-admin-config：COMPLETED（规划已确认，2026-09-29），依据其最终审查记录。
- v0.1.3-release：EXECUTION_SUBMITTED / 待规划验收，发布/部署事实可按证据列示；不得改成 Planner 已确认 COMPLETED。
- 功能数、清单、ADV、其他 P 编号：不因信息治理增加或核销。沿用摘要 45、46/22/22、ADV64 需本次权威复核；若重算不符，列明差异及依据交 Planner 裁决，不自行挑值。
- 开发版本、公开 Release、每个部署环境、迁移终点、测试集合分别核实；0.1.2/1586/V102 与 0.1.3/1629/V0.1.0 只在各自证据作用域表述。
- V012-CODE-001、企业微信、外部通知、腾讯 IoT 及其他延期项保持原裁决，核对权威后列开放集合。

## 4. 已知差异种子（不是完整范围）

本次 Planner 读取发现：memory README/features 的当前任务未跟随排期；issues 将 V102 与旧测试集合作当前基线；decisions 留有旧开发版本；requirement-pool 的历史段落仍称“当前排期”；0.1.2 历史发布段留有 Latest/部署等易混口径。Planner 已在本轮修正可确定的摘要和时点；Executor 仍需对全部入口双向盘点，不能只核销这几个样例。

## 5. 验收矩阵

| ID | 完成条件与证据 |
|---|---|
| G01 | 全入口覆盖矩阵：文件、字段、旧值、新值、依据、核验时点、已改/不适用/待裁决、实际回读位置；没有未解释的遗漏 |
| G02 | knowledge 权威先更新，派生文件逐字段一致；不可由 Planner 直接读取的文件提供脱敏实际值及执行回读证据，不能只声明“已同步” |
| G03 | 功能清单 ↔ 功能详情 ↔ P 编号 ↔ product 裁决双向映射，逐行重算计数；遗漏、重复、部分交付与整体完成分别解释，差异经裁决后同步 |
| G04 | 发布、开发、部署、Git 和测试各有身份与时点；0.1.3 仍保留待规划验收；历史材料与当前入口明确分离，链接可用且当前下一动作唯一 |
| G05 | memory 每文件 <5KB、总量 <20KB；记录前后字节数及压缩保留范围；README/state/handoff/features/issues/decisions 等全文无未解决的当前口径冲突 |
| G06 | 同步后提交/推送或版本事实变化，重核受影响入口；覆盖矩阵最终绑定实际版本及核验时点，回读实际文件；无授权内剩余同步项 |

回执：`product/p62-lowcode-transaction-bpm-tiering/receipts/information-governance-01.md`。证据须可复核，历史业务测试不因纯文档修改重跑；采用与变更相称的文档、链接、计数与一致性检查。

## 6. 流转边界

探索已完成，本次进入信息治理执行。审查01已明确A5裁决与剩余核验，不重复整个探索。无争议且有证据支持的文档事实更正可在后续治理执行中按本方向直接完成；涉及功能状态裁决、计数或历史验收争议的字段提交 Planner 收敛，其余独立文档项继续。

治理回执由 Planner 按 G01—G06 独立审查。治理通过仅锁定信息基线，不代表 P62 业务通过或 0.1.3 发布审查完成。P62 最终 PASSED 后另行下发唯一终态值清单及同步方向；本文件不提前授权整体 COMPLETED。

## 7. 探索审查01后的具体授权与补齐范围

按 `../receipts/planning-review-exploration-01.md` 裁决落实A4/A5矩阵。新增明确覆盖根CHANGELOG的0.1.2/0.1.3简要历史发布条目及有效链接；0.1.3验收状态仍为待规划验收。旧“当前值”要在当前入口改为有效值或明确时点，不累积多份顶部覆盖声明。

45个业务功能逐名映射与known-issues全文复核是G03剩余范围；清单90=46/22/22、ADV64已有行级计数回传，但治理后仍需与文件最终值勾稽。附加矩阵要区分总记录数与开放数。Agent配置暴露面、MQTT租户及无界线程池是探索发现的待验证风险，登记其事实层级与P62后续归属，不宣称已发生故障或已修复。

部署只按回执时点表述即可，不因文档治理要求重新部署、登录生产或重复下载全部资产；如写“当前在线/健康”，必须补对应实时证据。代码javadoc修正留工程阶段，本次不改源码。

回执须将G01—G06逐项对应实际修改、全文核验、计数明细及回读证据。当前无新的状态裁决阻塞；若新增冲突，隔离该字段并继续其余确定项。

## 8. 当前复核边界

治理经审查01—04逐级收敛（映射/语义已锁定）；剩余收尾（IG1a 同步/I3 子句/转录纠正）按 `../receipts/planning-execution-prompt-information-governance-03.md` 由执行05完成（回执 `../receipts/information-governance-05.md`）；复核通过前保留治理方向 ready。01—04 回执与附件原文保留；不重跑业务验证。

## 9. 审查02后的唯一入口

剩余范围由 `../receipts/planning-execution-prompt-information-governance-01.md` 唯一承载，替代§8所指审查01剩余表。仅推进IG1a/IG2a/IG2b/IG3a，追加回执03；锁定项按审查02保留。

## 10. 审查03后执行入口

唯一当前入口=`../receipts/planning-execution-prompt-information-governance-02.md`，替代一级提示，仅处理IG1a/IG2a/IG2b的有限残余；IG3a及审查03锁定项不重验，追加回执04。

## 11. 审查04后唯一收尾入口

`../receipts/planning-execution-prompt-information-governance-03.md` 替代二级提示，全部映射和问题语义锁定，仅处理IG1a、I3残留及转录纠正，追加回执05。
