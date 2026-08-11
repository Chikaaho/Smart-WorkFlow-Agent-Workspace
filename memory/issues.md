# 未关闭问题

> 最后更新：2026-08-11
> 仅列出未关闭问题。已修复问题在 `knowledge/known-issues.md`。

| # | 问题 | 严重程度 | 状态 |
|---|------|:---:|------|
| I3 | BPMN Viewer 完成 + 两个消费方已就绪（ProcessDefList + ProcessInstanceList），Modeler 不在范围 | 低 | 按设计（D40），可关闭 |
| I4 | 前端多页签未实现 | 低 | 待开发 |
| I10 | 动态宽表裸 SQL 隔离脆弱（手写 deleted+tenant_id） | 高 | 硬规则，靠测试兜底 |
| I11 | 发布冻结不可逆——字段错误成本高 | 中 | 设计器层强校验待做 |
| I12 | Quartz 单节点，集群未实现 | 中 | 升级路径预留 |
| I13 | M07 AI 引擎选型：编排/工具沙箱/图设计器均已落地完结（F01+F02，D53-D65）；仅 RAG（F03）选型未定 | 低 | 仅 RAG 待后续 |
| I14 | M08 IoT 腾讯接入路径待补全 | 中 | 待产品设计 |
| I15 | M09 OpenAPI 授权粒度/配额待定 | 低 | 最后优先级 |
| I16 | 跨环境导入导出未设计 | 中 | 后续设计 |
| I17 | RICH_TEXT 降级为 textarea | 低 | 已知限制 |
| I18 | 子项目 system.md 可能与 zip 不同步 | 中 | 定期检查 |
| I26 | SysRole 列名与 V5 Flyway 列重命名不一致 | 中 | 待修复 |
| I30/T10 | Mock BPMN XML 已增强（含 3 个 userTask 节点），可满足当前测试需求 | 低 | 可关闭 |
| I31 | `flow-graph` adapter 契约无边点击事件、无命令式数据更新通道（Step9 现场发现，D65 偏差2/3）：M07 图设计器绕行方案可用但受限——若未来节点自定义渲染/直接点边编辑需求增多，需回规划层评估扩展 adapter 导出面 | 低 | 绕行方案已生效，扩展待评估 |
| I32 | bpm/h2 迁移链 V8 含 PG 独有 partial index 语法（`WHERE active=true`），H2 不支持——全链 H2 Flyway 迁移从未可跑，模块测试均绕过 Flyway 直建 DDL（Step9 冒烟测试现场发现，非本轮引入） | 中 | 未修复，待排期 |

---
> 本文件为压缩索引。已修复问题的完整描述在 `knowledge/known-issues.md`。
> 需要时：创建 search_task，范围 `knowledge/known-issues.md`
