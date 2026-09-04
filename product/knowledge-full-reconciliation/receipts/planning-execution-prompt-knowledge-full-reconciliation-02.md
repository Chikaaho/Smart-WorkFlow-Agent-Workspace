# 知识库全量整理执行补充提示02

日期：2026-09-04；Planner；二级提示。权威输入：`planning-review-sync-b-03.md`、本提示；上一版`planning-execution-prompt-knowledge-full-reconciliation-01.md`及旧回执仅作追溯。本提示为唯一执行待办，替代01。

## 1. 诊断与变化

- B1b-r是证据文件指针及当前状态文字错误，不是目录漏项或业务未完成。
- B2a是最终清单内容与报告不符，已有真实校验只覆盖1文件，不是权限或校验工作目录问题。
- 删除I表补全、55目录枚举、P1/P47两行修复、历史备份及业务状态重复验证；仅保留目录表指针/P51状态与最后封装。
- 原子映射：B1b→B1b-r（覆盖部分已锁定）；B2a保持ID。
- 改变方法：从“声明已覆盖”改成最终目录文件集合与清单路径集合的双向比对；目录证据逐条解析为明确文件路径，再检查存在性。不要通过反复重写报告替代这两类检查。

## 2. 剩余原子矩阵

| ID | 对象/失败事实 | 正向完成条件 | 反向条件 | 证据及下一动作 |
|---|---|---|---|---|
| B1b-r | `knowledge/feature-reconciliation-products.md`的证据指针列及P51行 | 每行至少一个实际存在的证据路径，或明确标注该证据缺失并指向既有审查缺口；P51为COMPLETED（已确认，2026-08-31），无独立活动P51 | 不将目录存在当回执文件存在；不引用缺失文件而不标缺失；不把旧本地VERIFYING作为当前第二状态 | 列55个目录键、展开后的根相对证据路径、exists/missing、缺失解释/替代指针；输出实际路径检查。只修错指针/状态，不补造历史裁决 |
| B2a | 新`evidence-sync-b-correction-03/final/` | 所有最终全文、diff、路径检查、源哈希及回执副本均在工具生成清单中；清单路径集合=实际最终载荷文件集合；校验全部OK | 清单不得被后续回执单项校验覆盖；missing/extra/duplicate=0；最终回读后不再改载荷；清单本身和校验结果不自包含 | 内容定稿后枚举载荷→生成清单一次→路径集合diff→shasum回读；日志放final外，报告数量取工具结果，不预写7或其他数字 |

两项合法停止条件：正反条件满足后提交；真实工具错误保留原始输出、试安全替代并完成独立项后按现有terminal-contract报告。不得将普通路径未找到当作外部阻塞。

## 3. 精确输入与允许范围

工作目录：`/usr/local/projects/Smart-WorkFlow`。

- 输入：本次审查/提示、`knowledge/feature-reconciliation-products.md`、`receipts/evidence-sync-b-correction-02/final/`三份全文、`product/p51-agent-coding-engine-decoupling/receipts/planning-final-reconciliation-p51-main-terminal-authority-03.md`；其余仅读取待校验路径及其父目录，必要时定位同功能下实际回执名称，不扫描业务实现。
- 唯一知识内容修改：`knowledge/feature-reconciliation-products.md`的证据指针和P51状态说明。引用应采用完整根相对路径，避免“passed/ + receipts/文件”含糊拼接；可在表头声明相对每行product目录的基准，但必须可机械解析。
- agent-model-orchestration已确认缺失feature文件：标明缺失，改引用现存product证据或已有主索引§5缺失说明；不恢复空壳文件。找不到某个历史裁决时允许明确登记缺失，不造文件或追认通过。
- 新增：`receipts/sync-b-01-correction-03.md`、`receipts/evidence-sync-b-correction-03/`（脚本/原始结果/final载荷）；旧证据只读。
- 当前指针允许修改：`knowledge/current-status.md`、`knowledge/session-handoff.md`、`knowledge/features/knowledge-full-reconciliation.md`、`memory/state.md`、`memory/handoff.md`、`todo/requirement-pool.md`仅本任务下一动作，统一为“Planner复核sync-b-01-correction-03（B1b-r/B2a）”，状态VERIFYING；若这些指针文件修改则在回执附其diff与最终源哈希。
- 禁止：修改I表/主索引业务内容、业务代码、ESLint、P/I注册、计数/基线、方向或旧回执；禁止提交推送、构建测试迁移部署。

## 4. 命令与顺序

允许文本读取/编辑、文件存在性检查、rg、awk或小型文本解析脚本、sort/uniq、diff、wc、shasum及只读git状态/diff。保留脚本和stdout/stderr、工作目录、退出码。

1. 先读取当前目录表，将55行证据路径展开，记录原始exists/missing；与已有缺口记录对照。
2. 修正错拼文件名、显式缺失项、P51当前状态，重新做路径检查。固定55目录键不变；不重复其他集合审计。
3. 更新本任务指针与回执，导出最终三份索引全文（主/I未变可复用已锁定文件但需注明）及本轮目录表diff、路径检查、源文件哈希、回执副本到新final。
4. final载荷定稿后生成唯一SHA256SUMS；禁止再次用单个回执的哈希重定向覆盖该清单。对实际载荷路径与清单路径做双向diff及重复检查。
5. 在final目录执行`shasum -a 256 -c SHA256SUMS`，原始输出保存于final外。清单及校验日志不加入自身覆盖。若内容再变，重新生成整个清单并回读，而非追加一个自述OK。

## 5. 锁定项与提交门

I54逐项表、product55键、P1/P47修正、五行状态变化、41业务计数、P/I源注册、历史备份、A验收全部锁定；不重新做全量业务验证。

提交前矩阵（必须用实际输出填充）：

| 检查 | 合格值 |
|---|---|
| 55目录键前后差集 | 空 |
| 无解释的缺失证据路径 | 0；允许明确缺失并引用已登记缺口 |
| P51当前状态 | COMPLETED（已确认），无活动P51 |
| final载荷与SHA清单路径missing/extra/duplicate | 0/0/0 |
| SHA回读 | 退出0，成功数=载荷数，失败0 |
| memory容量 | 单文件<5KB、总量<20KB，使用本轮实测 |
| 修改范围 | 仅本提示许可文件；旧证据零改写 |

每项证据包只写“ID→实际附件位置→工具结果→覆盖边界”，原始日志另存。全部合格后提交Planner，保持VERIFYING；不能自行PASSED/COMPLETED或进入阶段三。与现有work_items/remaining_actionable_count契约一致，不另造终态schema。
