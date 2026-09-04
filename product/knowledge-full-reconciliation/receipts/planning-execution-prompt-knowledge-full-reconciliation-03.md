# 知识库全量整理执行补充提示03

2026-09-04；Planner；三级提示。替代提示02成为唯一执行入口，旧版仅作追溯。依据planning-review-sync-b-04.md；不改变主/B方向。

## 1. 诊断、输入与相对上版变化

仅保留B2a-r：提示02 §3已要求的六入口修改证据未提交，且memory/handoff当前段仍残留首轮补证描述。分类为缺证据及当前文字冲突，不是业务缺陷。已提交8载荷的SHA校验确已通过，不得再称该校验失败。

删除B1b-r目录表、P51修正、三索引导出及8载荷重封装；B2a拆分为已锁定封装与剩余B2a-r修改文件覆盖。替代路径是六入口逐文件台账与独立补证包，不再反复打包三索引。提交条件按下表可判定。

精确输入：本提示、planning-review-sync-b-04.md、提示02 §3、sync-b-01-correction-03.md、现有correction-01的full-text/diff-knowledge.txt与diff-memory.txt及diff-todo-pool.txt（仅按需定位前态），下列六文件。

## 2. 唯一原子与证据包

| ID | 对象身份 | 正向断言 | 反向断言 | 最小证据与替代 | 下一动作/停止 |
|---|---|---|---|---|---|
| B2a-r | 下列六个根相对路径的最终源文件；记录采集时间、diff基准 | 六文件逐项列明实际是否修改、当前状态/下一动作；已修改项有完整diff、最终源哈希与当前正文副本；源/副本一致；handoff单一当前口径 | 无未解释缺失条目；当前段无首轮补证中等旧动作；业务值、索引、基线零变更 | 单一独立证据包；旧前态确实不可得则明确不可恢复，使用可定位最近基准完整diff并标示历史变更边界，禁止造前态。不接受仅回执宣称同步 | 完成采集及回读后提交；真实工具限制保留结果，完成独立项并穷尽安全替代后按现有契约报告 |

六文件：

- knowledge/current-status.md
- knowledge/session-handoff.md
- knowledge/features/knowledge-full-reconciliation.md
- memory/state.md
- memory/handoff.md
- todo/requirement-pool.md

当前值保持knowledge-full-reconciliation VERIFYING；下一动作统一为Planner复核sync-b-01-correction-04（B2a-r）。无活动业务实现功能、41功能、34/28/28及全部既有业务状态不变。历史回执和历史时点结论不改写。

## 3. 范围与顺序

工作目录/usr/local/projects/Smart-WorkFlow。允许读取上述输入及六文件必要的只读diff基准。允许修改六文件中本任务当前进度、下一动作文字；不得改变其他状态/计数。只新增receipts/sync-b-01-correction-04.md及receipts/evidence-sync-b-correction-04/。禁止修改三索引、旧附件/回执、方向、业务代码、ESLint、P/I注册；禁止Git提交推送、工程测试构建迁移部署。

允许文本读写、rg、diff、sort/uniq、wc、shasum、只读git show/diff及文本解析工具；不需要浏览器、SQL或业务回归。

执行顺序：先确认六文件/前态基准→修正当前指针和handoff当前段→定稿回执→导出六文件全文、完整diff、源哈希、六行修改台账及回执副本到本项独立final包→一次生成完整SHA256SUMS→文件集合双向比对与回读，日志放final外。定稿后若改载荷必须重新生成完整清单，不修改已锁定correction-03包。保持源文件路径到副本文件名一一对应；原始输出含命令、工作目录、退出码。

## 4. 锁定与提交门

planning-review-sync-b-04.md锁定的B1b-r、correction-03八项封装与memory容量，以及此前A、I54、目录55、P1/P47、五行变化、业务计数和备份不重验。六入口实际改写后只复测memory容量，不扩大到业务。

以下全部为是才提交：

- 六路径台账齐全，是否修改及基准可解释？
- 修改项diff、最终源哈希、全文副本齐全且源/副本匹配？
- 六入口当前状态VERIFYING、下一动作correction-04一致，旧当前指令零残留（历史段可保留）？
- 业务值/索引/基线未变，修改仅授权文字？
- 独立final包清单missing/extra/duplicate均0，实际回读全OK，日志不自包含？
- memory单文件<5KB、总量<20KB？

回执仅写B2a-r→实际附件位置→实际结果→覆盖边界。保持VERIFYING，不自行PASSED/COMPLETED。work_items等使用现有terminal-contract；有授权可执行项继续完成，真实阻塞须工具证据与独立工作穷尽，不以材料缺失本身自称BLOCKED。
