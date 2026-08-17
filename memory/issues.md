# 未关闭问题

> 最后更新：2026-08-17（I51 已关闭）
> 仅列出未关闭问题。已修复问题在 `knowledge/known-issues.md`。
> **编号说明（2026-08-16 更新，D81）**：I46 已在 knowledge/known-issues.md 正式登记为「手写 SQL 通道无数据权限」（注册表为权威）——本文件原预留 I46 的 flow-graph adapter 条目**改号 I48**。**I47（bpm/h2 V8 partial index）与 I48（flow-graph adapter 限制）已于 2026-08-16（D81 bpm-plugin-architecture 知识库同步）正式登记入 knowledge/known-issues.md——悬空引用清理完毕**，本文件条目与注册表编号一致。
> **D83 探索回执回收（2026-08-16）**：I49/I50/I51 为新候选编号（两轮探索各自建议 I49，统一顺延）；**D84 核销：已由执行层正式登记入 knowledge/known-issues.md**；I26 影响面上调（H2 全链 V5 改名，严重程度 中→高，与 I47 合并排期建议）；I30 已关闭；memory I46 严重程度统一为注册表口径=高。
> **D84 关闭裁定（2026-08-16）**：I18（前提消失）、I30（已满足）正式关闭。

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
| I18 | 子项目 system.md 可能与 zip 不同步 | 中 | **已关闭**（D84 裁定：前提消失——工作区已无 zip，子项目 system.md 已同步 27,071/27,861 字节；未来如需重新登记） |
| I26 | SysRole 列名与 V5 Flyway 列重命名不一致 | 中 | **已关闭**（2026-08-17，D86；P13 已 PASSED） |
| I30/T10 | Mock BPMN XML 已增强（含 3 个 userTask 节点），可满足当前测试需求 | 低 | **已关闭**（D83/D84：代码已增强 processKey 参数化+3 userTask+activityId 对齐；known-issues 标已满足，todo T10 已删行） |
| I31-I44 | **Step5 清单审计虚高缺口**（详情在 knowledge/known-issues.md）：**I33/I43/I44 已修复**（2026-08-13 D76——停用登录/refresh 拦截 + V29 生产菜单 seed）；**I37 数据权限已修复**（2026-08-15 D79——data-scope-enforcement 五档全落地）。余项待排期：M01/M02 关联/筛选要素缺失、M03 控件库8/16/表单无删除/列表配置未持久化、M05 缺删除/过滤 | 中 | 余项待排期 |
| I45 | Step5 清单审计虚低汇总 15 条：清单已标⬜/🟦但代码有部分实现未达描述完整度（M07 前端管理页/Prompt配置/运行日志页/Token统计、M04节点配置1/7、M05发送仅单用户等），细节见审计回执 `search_fallback/feature-checklist-full-audit.md` | 低 | 记录性，按需排期 |
| I46 | 手写 SQL 通道无数据权限（已在 knowledge/known-issues.md 正式登记，2026-08-15）：动态宽表 JdbcTemplate 与 bpm 外部数据源 SqlExecutor 绕过 MP 拦截器链，数据权限/租户均不覆盖（与 I10 同源）——D77 方向明确不纳管，未来纳管需 SQL 构建层统一注入 | 中 | 已知限制，按设计 |
| I47 | BPM/H2 V8 partial index 方言不兼容，曾阻断真实 H2 全链迁移 | 中 | **已关闭**（2026-08-17，D88；P10 已 PASSED，30 条全链验证） |
| I48 | （原临时编号 I31→I46，2026-08-15 因 I46 被占再改号；已正式登记——D81，2026-08-16，悬空引用清理完毕）`flow-graph` adapter 契约无边点击事件、无命令式数据更新通道（Step9 现场发现，D65 偏差2/3）：M07 图设计器绕行方案可用但受限——若未来节点自定义渲染/直接点边编辑需求增多，需回规划层评估扩展 adapter 导出面 | 低 | 绕行方案已生效，扩展待评估 |
| I49 | （D83 发现，D84 已登记 knowledge 注册表）V29 菜单 seed 未 seed sys_role_menu（`V29__job_storage_menu_seed.sql:20` 注释「超管旁路」）——正式环境 job/storage 菜单仅超管可达，普通角色有 permission 也无菜单授权，I43/I44「生产菜单可达」口径仅对超管成立 | 中 | 待排期 |
| I50 | （D83 发现，D84 已登记 knowledge 注册表）`AuthController.login` 状态校验位于密码匹配之后（L88→L92）——停用账号仍消耗一次 BCrypt+用户查询，仅时序/资源问题无安全漏洞 | 低 | 待排期 |

---
> 本文件为压缩索引。已修复问题的完整描述在 `knowledge/known-issues.md`。
> 需要时：创建 search_task，范围 `knowledge/known-issues.md`
