# 知识库全量整理执行补充提示04

2026-09-04；Planner；三级后继续收敛。替代提示03，唯一当前执行入口。权威输入planning-review-sync-b-05.md；提示03和correction-04只作证据。目标仍为B2a-r，不扩大业务范围。

## 1. 诊断与方法变化

删除已通过的六正文补齐、源/副本哈希和10项封装补证、memory/handoff首轮文案修复。B2a-r拆为r1真实差异证据、r2当前入口一致性。原方法引用不存在的correction-03六正文导致全文冒充diff；现在固定已校验correction-04正文作为修改前态。旧轮范围需要追溯时用可定位旧基准，不尝试恢复不存在的快照。内容检查从几个关键词改为逐个“当前任务/最近审查/下一动作/启动提示”语义段。

## 2. 剩余矩阵与独立证据包

| ID | 对象与失败事实 | 正向/反向断言 | 最小证据、替代与完成条件 |
|---|---|---|---|
| B2a-r1 | 六入口；所谓diff为基准缺失后的全文 | diff来自真实存在的前后文件；无基准缺失全文冒充diff；旧基准声明真实 | 独立r1包：六路径前态到现态映射、前后哈希、真实unified diff与退出码（0无变化/1有差异/大于1失败）。新修改基准固定correction-04/final六正文；此前轮次范围可用correction-01已有副本或只读git中实际存在的版本做累计diff，明确基准/时间和历史变更边界。确无前态的逐文件说明不可证范围，不虚构“已证明仅改几处”，交Planner裁决 |
| B2a-r2 | current-status副本20/21/25/47行与35行不一致，feature第13行剩余项未限定历史 | 六入口当前段一致指向correction-05；历史记录仅为历史，不作待办 | 独立r2包：修改文件最终全文及六入口当前语义段清单（源路径、行号、原文、判定）；旧回执编号可在明确历史段保留。当前状态VERIFYING、最新审查05、下一动作Planner复核correction-05；未解释旧当前动作数量0 |

两项完成后提交；有授权可执行项继续。真实工具错误保存原始输出，安全替代/独立工作穷尽后按现有terminal-contract报告阻塞，不用不存在前态诱导伪造证据。

## 3. 精确范围及顺序

工作目录/usr/local/projects/Smart-WorkFlow。允许读取本提示、审查05、correction-04/final、必要的correction-01既有全文及六入口真实只读Git基准。六入口仍为knowledge/current-status.md、knowledge/session-handoff.md、knowledge/features/knowledge-full-reconciliation.md、memory/state.md、memory/handoff.md、todo/requirement-pool.md。

仅允许修改六入口本任务当前进度/下一动作/历史限定语；新增receipts/sync-b-01-correction-05.md与receipts/evidence-sync-b-correction-05/。不改三索引、旧证据/方向、业务代码、ESLint、P/I、计数、基线；不提交推送或运行工程测试构建迁移。

允许文本读写、rg、diff、sort/uniq、wc、shasum、只读git show/diff及文本解析。顺序：确认前态存在并记录哈希→读取六入口全部当前语义段→修正r2→生成r1真实diff→定稿简短回执→封装本轮证据清单并回读。每个命令记录工作目录和退出码；不将输出当前全文的fallback标成diff。旧台账不覆盖，在新回执撤销其不成立的基准声明。

## 4. 锁定及提交门

审查05已通过项及此前全部锁定证据不重跑。新快照仅验证受影响正文、真实diff及新封装，不重复索引/业务审计。业务值继续41、34/28/28，P4等开放状态不变；ESLint保持TODO。

全部为是才提交：前态路径真实存在且哈希明确？r1为真实diff或如实列出不可证范围？六入口当前语义段逐项一致且旧当前动作0？改动限授权文字？新载荷/清单集合missing/extra/duplicate为0且回读全OK？memory单文件<5KB、总量<20KB？回执数量和结果来自实际输出？

回执仅按ID→附件位置→真实结果→覆盖边界报告；源哈希与副本一一对应，校验日志放清单载荷外，不自包含。保持VERIFYING，不自行PASSED/COMPLETED。新旧对象映射为correction-04前态→correction-05后态；原件只读保留。
