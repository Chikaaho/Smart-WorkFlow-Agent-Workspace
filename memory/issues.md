# 未关闭问题

> 最后更新：2026-07-30
> 仅列出未关闭问题。已修复问题在 `knowledge/known-issues.md`。

| # | 问题 | 严重程度 | 状态 |
|---|------|:---:|------|
| I3 | BPMN Viewer 完成 + 两个消费方已就绪（ProcessDefList + ProcessInstanceList），Modeler 不在范围 | 低 | 按设计（D40），可关闭 |
| I4 | 前端多页签未实现 | 低 | 待开发 |
| I10 | 动态宽表裸 SQL 隔离脆弱（手写 deleted+tenant_id） | 高 | 硬规则，靠测试兜底 |
| I11 | 发布冻结不可逆——字段错误成本高 | 中 | 设计器层强校验待做 |
| I12 | Quartz 单节点，集群未实现 | 中 | 升级路径预留 |
| I13 | M07 AI 引擎/工具沙箱/RAG 选型未定 | 中 | 待产品设计 |
| I14 | M08 IoT 腾讯接入路径待补全 | 中 | 待产品设计 |
| I15 | M09 OpenAPI 授权粒度/配额待定 | 低 | 最后优先级 |
| I16 | 跨环境导入导出未设计 | 中 | 后续设计 |
| I17 | RICH_TEXT 降级为 textarea | 低 | 已知限制 |
| I18 | 子项目 system.md 可能与 zip 不同步 | 中 | 定期检查 |
| I26 | SysRole 列名与 V5 Flyway 列重命名不一致 | 中 | 待修复 |
| I30/T10 | Mock BPMN XML 已增强（含 3 个 userTask 节点），可满足当前测试需求 | 低 | 可关闭 |
| 新 | process-monitoring Steps 1-3 共 10 个文件未 commit（8 后端 + 2 前端） | 中 | 待 git commit |

---
> 本文件为压缩索引。已修复问题的完整描述在 `knowledge/known-issues.md`。
> 需要时：创建 search_task，范围 `knowledge/known-issues.md`
