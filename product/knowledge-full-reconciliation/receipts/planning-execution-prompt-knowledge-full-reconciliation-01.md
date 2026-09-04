# 知识库全量整理执行补充提示01

日期：2026-09-04；Planner；一级提示，首次提示。
依据：`planning-review-sync-b-02.md`。本提示替代`planning-review-sync-b-01.md`的补证待办作为唯一当前执行入口；旧方向保留总体目标，旧回执/附件只作证据指针。

## 0. 先诊断

- B1a/B1b：实际文档缺项＋检查对象不匹配。原标准是54个I、55个product稳定键逐项可定位，当前仅代表编号/总数声明；不是业务实现失败。
- B1c：报告整合错误，P1当前核销事实未传播到索引；旧P47实现结论未标历史。
- B2a：缺证据，当前全文/diff附件未有工具生成、可回读的覆盖清单。
- 当前指针不一致：上一轮允许修改范围不足，Planner本次更正授权，不计执行失败；不用加严规则惩罚范围冲突。

## 1. 输入与对象

工作区`/usr/local/projects/Smart-WorkFlow`。读取最新审查、本提示、B方向§2—§6；只按需引用：

- A基准：`receipts/evidence-correction-g1-g5/raw-i-ids.txt`、`raw-product-dirs-audited.txt`、`raw-p-unique.txt`、`raw-checklist-90.txt`。
- 当前证据：`receipts/evidence-sync-b-correction-01/full-text/feature-reconciliation-index.md`、`b2-index-collection-check.txt`、`b2-diff-90-vs-a.txt`及备份哈希三文件。
- 执行源：`knowledge/feature-reconciliation-index.md`、`knowledge/known-issues.md`及账本B中的逐目录证据路径；最新原始证据优先，A手工I27行已作废。

固定A审计集合：I=54个实际ID，product=55个实际目录键，P=56个实际ID。P13/P23、I27说明放备案区，不混入在册集合；本轮新增审计目录不混入原55目录。若源集合真的变化，先列差异及来源，不能通过调整期望数掩盖。

## 2. 唯一剩余矩阵

| 原子ID（父项） | 正向完成条件 | 反向断言 | 最小证据/下一动作 |
|---|---|---|---|
| B1a（B1）I完整映射 | 索引或其明确链接的持久子表含54个I稳定键，每项有当前状态、准确源锚点、对应P/明细/交付或独立范围说明 | 与raw-i-ids集合双向差集为空；重复键0；不以22个代表编号替代54项，不推断缺失I27状态 | 从实际known-issues读取并补齐逐项映射；输出期望/实际唯一键、missing/extra/duplicate原始结果。分类数字无可靠口径则删去39/15汇总，不强求无用分类 |
| B1b（B1）目录完整映射 | 55个product目录逐一有完整目录键、性质、已有证据指针、对应明细/P或明确独立范围；允许同一业务交付多目录，不能称41功能与目录严格一一对应 | 与raw-product-dirs-audited双向差集空、重复键0；不能grep“55”一次充当覆盖检查 | 复用已审计账本B逐目录记录生成持久表，引用历史证据，不重验旧业务；输出55键集合检查 |
| B1c（B1）当前语义 | M02-F01-01不再将P1列开放：P1已核销、该明细仍🟦，其余范围独立待核；P47旧“无设计器”结论明确历史未重验；三类查询/P3/五项部分实现口径保持 | 当前段无P1重新开放、无P47未经本轮验证却称当前事实；不升降其他明细、不新核销P编号 | 修正索引两行并查上下文，返回两行原文及同文件P1状态对照；零残留限定当前区，不清除历史事实 |
| B2a（B2）最终证据封装 | 最终索引及子表全文导出，源/副本哈希相同；本轮新回执附件/新增diff均被机器生成清单覆盖且回读OK | 不用手抄哈希、旧快照或仅源文件清单代替新附件覆盖；清单本身不自包含 | 修改结束后一次导出并生成相对固定目录的SHA清单；提供实际命令/工作目录/退出码/校验输出 |

上述各项合法停止条件相同：正反断言满足后提交；若真实只读/写入工具失败，记录工具原始错误，尝试安全替代、完成其他独立项后按现有终态契约报告，不能因普通无匹配或工作目录错误自称外部阻塞。

## 3. 锁定项

A阶段、41业务计数、业务测试基线、五个明细状态变化和其余85个状态不变、P/I源集合零增删、历史备份与HEAD比对、B3范围偏差登记及保留裁决均锁定。不得重跑业务测试、构建、迁移或重建备份；不得重新收集所有历史回执。只校验本轮改动不破坏锁定值。

## 4. 允许范围与顺序

- 修改：`knowledge/feature-reconciliation-index.md`；如需要拆表，仅允许新增`knowledge/feature-reconciliation-issues.md`和`knowledge/feature-reconciliation-products.md`，主索引必须明确链接。允许`knowledge/current-status.md`、`knowledge/session-handoff.md`、`knowledge/features/knowledge-full-reconciliation.md`、`memory/state.md`、`memory/handoff.md`、`todo/requirement-pool.md`仅更新本审计当前入口/下一动作；不改其他业务段。本轮实测memory字节后写入回执，不沿用旧大小。
- 新回执：`receipts/sync-b-01-correction-02.md`与`receipts/evidence-sync-b-correction-02/`；旧文件只读。
- 读取：上述输入、相关knowledge条目和既有product证据；允许只读Git身份/差异定位。
- 命令：限定文本枚举、集合比较、diff、wc、shasum及文档编辑；可用只读脚本准确解析稳定键，保存脚本与原始输出，不执行业务工程命令。
- 顺序：固定输入键集合→补全表/修正文案→双向集合校验→导出最终全文/diff→生成哈希回读→更新当前指针与回执并校验最终文件。修改后不得沿用修改前哈希。
- 当前指针统一为“Planner复核sync-b-01-correction-02（B1a/B1b/B1c/B2a）”，状态VERIFYING；若遇真实阻塞如实描述。其他历史下一动作标历史，不作为当前入口。
- 禁止：改业务代码、ESLint配置、正式计数/基线、P/I源注册表、历史附件、方向目录、Git提交/推送；不得为了集合通过增加伪造ID或凭目录存在追认验收。

## 5. 方法变化与证据格式

首次提示：删除已通过的备份/业务状态重复取证；将B1拆为I表、目录表、当前语义三个原子，B2缩为最终附件封装。替代路径是持久明细子表＋集合双向差集，不再用代表性编号或总数关键词匹配。完成条件由实际键集合相等、重复0和逐行证据指针确定。

回执每项仅写“原子ID→附件路径/位置→实际结果→边界”，完整流在附件。该任务证据层级为实际文件/命令输出，不冒称业务运行验证。

## 6. 提交自检

- 54 I和55目录的实际稳定键与基准完全相等，双向差集空、重复0；逐项状态/来源/映射或独立范围齐全。
- P1核销、P47历史限定正确，90明细状态与41业务数不变；ESLint待办保留。
- 最后一次改动后的源/全文副本一致，附件哈希校验通过；memory<5KB/文件、<20KB总量。
- 只改授权文件；全部原子有证据，remaining_actionable_count与实际工作项相符。

全部为是后提交Planner；保持VERIFYING，不自行PASSED/COMPLETED或进入阶段三。无法完成时依已有terminal-contract报告真实阻塞，不另建schema。
