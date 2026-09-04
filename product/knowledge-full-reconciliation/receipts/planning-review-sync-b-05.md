# B阶段规划复验05

2026-09-04；Planner；审查sync-b-01-correction-04及提示03。结论：**VERIFYING**，B2a-r未完整关闭。

## 已通过并锁定

- correction-04/final清单独立shasum回读10/10 OK、退出0；载荷集合diff空、重复空。回执标题“8项”为转录错误，以10项实际输出为准，不推翻校验。
- 六正文副本哈希与six-entry-source.sha256全部一致；memory/state、memory/handoff、todo/requirement-pool三个允许直接核读的源文件哈希也一致。knowledge源身份依据执行层提交的源哈希记录，不冒称Planner直接读取源。
- memory实测16101B，最大4113B；memory/handoff旧首轮补证描述已修正。
- 既有A、目录/I映射、P51、P1/P47、业务计数、五行变化、备份及correction-03封装继续锁定。

## 剩余差异

1. **B2a-r1：diff与基准声明不实。** six-entry-diff.txt逐段标“基准缺失，输出当前内容”，没有unified diff；回执和台账却称基于correction-03 final同文件副本。该包上一轮根本未包含这六份正文，不能作前态。缺失后输出全文可作为现态证据，不能证明修改范围。提示03已允许选择可定位最近基准并说明边界，此替代未执行。
2. **B2a-r2：当前指令仍冲突。** correction-04/final/current-status.md第20行当前活动任务仍待correction-01，第21行“最近审查”为首轮，第25行待sync-b-01，第47行启动提示待correction-01；第35行却要求correction-04。feature副本第13行仍有未限定历史的“剩余四项按提示01补齐”。不得用仅检查memory/handoff某几个词的零命中替代六入口当前段检查。

本轮为同一入口证据/文字收尾问题；不是新增业务缺陷。提示04替代03，采用已存在且已校验的correction-04六正文作为后续固定前态。历史修订范围另以真实可定位旧基准说明，不伪造已缺失前态。主/B方向仍ready，不整体PASSED或COMPLETED。
