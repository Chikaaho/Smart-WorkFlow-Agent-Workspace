# 下一功能候选比较探索回执（2026-08-25）

> 对应任务：`search_task/next-feature-candidate-comparison-20260825.md`。本回执只报告静态事实与比较，不构成方向选择。

---

## 探索结论

五个候选中，**P36（M05-F02-01 消息模板）边界最清晰、可复用基础最厚、风险最低**，为首选；**P9（图节点级多 Key 轮询）可行但触及核心执行引擎**，次选。P19（RAG）受 I13 显式限制阻塞，P25（I50）过薄不宜独立立项，P32/P33 存在未决选型。

## 检查范围

- `knowledge/current-status.md`、`knowledge/known-issues.md`（I13/I49/I50/I51 条目）、`knowledge/features/` 目录清单
- `todo/requirement-pool.md` 全量（P1-P50 各段）
- `Smart-WorkFlow/功能清单.md` M03/M05/M07 行
- `product/` 全目录树（ready/passed 分布核查）
- 后端源码抽查：AuthController、AgentOrchestrationServiceImpl、AgentGraphInterpreter、sw-basic-notify API/entity、sw-basic-knowledge 全模块
- 方式：3 个并行 Sub Agent 分头探索 + 父代理对全部载重结论逐一 grep 抽查证实（下述行号均为父代理复核过的）

## 候选逐项事实

### A. P19 · M07-F03-03 知识库 RAG —— 受治理限制阻塞

- I13 明文：「**仍未收敛**：……RAG 向量库选型……三项继续适用该限制（不投入编码资源）」（known-issues.md L224-233）。
- 代码仅骨架：`sw-basic-knowledge` 仅 2 个 Java 文件（`KnowledgeAutoConfiguration.java` L9 按 `sw.knowledge.enabled` 默认关闭；Properties 仅连接三字段）；迁移目录仅 .gitkeep。
- 依赖已预置但从未裁定：`sw-dependencies/pom.xml` spring-ai 1.0.4 / tika 3.1.0 / pgvector 0.1.6，子 pom 已引 pgvector starter——隐含 pgvector 路线但知识层无决策记录。
- 无任何 embedding/vector 业务代码；前端零代码；无 ready/passed 方向。

### B. P9 · M07 图节点级多 Key 轮询 —— 已有实现待扩展，非零起点

- **编排直连路径已完整**：`AgentOrchestrationServiceImpl.java` L243 检测 429 → 锁定（lockedUntil）→ L251 `findNextCandidate` 同 groupKey 切换重试；数据底座 V24 四列就位（L57-60 javadoc 注明 M07-Step5）。
- **图执行引擎路径零轮询**：`AgentGraphInterpreter.java` L48 javadoc「LLM 节点按 config.agentModelConfigId 指向单个配置单跳调用」，L389 `callLlmNode` 单配置调用，L394/L421/L440 一切异常统一包装 `MODEL_CALL_FAILED` 上抛——含 429，无候选切换。「每节点可选不同模型」已实现（前端下拉写 agentModelConfigId），缺的是节点级 Key 容灾。
- 功能清单 F01-04 已 ✅（L146），其验收边界只覆盖配置管理面+编排直连路径的轮询；图引擎节点级轮询属 ✅ 边界外的增强，**不推进任何清单行状态**。需求池 P9 定级「低」。
- 无 ready/passed 方向。

### C. P36 · M05-F02-01 消息模板 —— 三重现成模式，范围最清晰

- 发送链路已闭环（D210）：`SendNotifyCommand.java` L18-33 仅 recipientId/title/content/bizType/bizId/tenantId 直存，**全模块零 template 概念**（唯一命中是测试类 JdbcTemplate 无关词）。
- 前端 `NotifyHome.vue` + api 已有列表/已读/删除/过滤管理页先例；后端 CRUD+菜单 seed+双方言迁移均有大量先例（V9/V37 等）。
- 缺口：后端模板实体+CRUD+占位符替换服务+迁移+seed，前端模板管理页+mock。需求池登记于 L74（D 组「清单独有」），另见 P3 行注记「消息模板仍待排期，不核销 P3」。功能清单 L122 ⬜——完成后可推进真实清单行。
- 无 ready/passed 方向。

### D. P32 / P33 · M03 两候选 —— 均有未决选型

- **P32 导入导出**（功能清单 L90 ⬜，需求池 L70）：全仓库零 Excel 代码，无 poi/EasyExcel 依赖——需先引入首个 Excel 库（库选型属设计决策）。可复用数据面：`FormDataQueryService.queryFormData` 返回 PageResult<Map>。前端无 xlsx 依赖，仅 storage 有 Blob 下载先例。
- **P33 打印模板/PDF**（L91 ⬜，需求池 L71）：零打印代码；pdfbox 仅被 knowledge 模块声明且无任何使用；「套打」语义、PDF 生成路径（前端打印 vs 后端生成）均未定义——未知数最多。可复用 storage 文件下载模式。

### E. P25 · I50 登录状态校验时序 —— 仍在，但过薄不宜独立立项

- 代码事实成立未修：`AuthController.java` **L88 `passwordEncoder.matches`（BCrypt）→ L93 才做 `statusDenyMessage` 状态校验**，顺序与登记一致（known-issues.md L62 待修复、L609 条目无修复注记）。纯时序/资源问题，无安全漏洞。
- 原「随 I51 修复轮顺带」的载体已消失：I51 已于 2026-08-17 status-semantics-alignment 闭环（前端 constants.ts 与后端口径一致）。
- 范围极小：预计单文件（login 方法内校验对调）+ AuthControllerTest/AuthFlowIntegrationTest 断言调整。作为独立功能轮偏薄；P45（验证码/密码策略）是独立功能级缺口，不宜搭车合并。

## 候选比较表

| 排序 | 候选 | 清单收益 | 边界清晰度 | 可复用基础 | 栈跨度 | 主要风险/未知数 |
|:---:|------|------|------|------|------|------|
| 1 | **P36 消息模板** | 推进 M05-F02-01 ⬜ 行 | 高 | 高（通知 CRUD/菜单 seed/迁移三重现成） | 后端+前端+迁移 | 占位符语法细节待定义 |
| 2 | **P9 节点级多 Key 轮询** | 无清单行推进（✅ 外增强） | 中高 | 中高（findNextCandidate/V24/锁定语义现成） | 仅后端 | 改核心执行引擎，回归面大，调试引擎需同步 |
| 3 | P32 导入导出 | 推进 M03-F04-02 | 中 | 中（查询服务现成） | 后端+前端 | Excel 库选型未定；导入校验复杂 |
| 4 | P33 打印模板 | 推进 M03-F06-01 | 低 | 低 | 后端+前端+迁移 | 套打语义/PDF 路径均未定义 |
| 5 | P25(I50) 时序修正 | 关闭已知问题，不动清单 | 高（极小） | 高 | 仅后端 | 过薄，不宜占一轮主功能 |
| 6 | P19 RAG | 推进 M07-F03-03 | 低 | 低（半骨架） | 后端+前端+迁移 | **I13 明文限制：选型未收敛不得投入编码** |

## 分析推测（推测，非事实）

- P36 若立项，其方向文档大概率只需明确：模板字段口径、占位符语法（如 `${var}`）、适用范围（站内信发送入口是否强制走模板）三项，其余均可沿用既有模式——此为基于先例密度的推测，供规划参考。
- P9 的回归面主要在既有图执行测试（agent 模块基线 338 tests）与单步调试链路（D175-D180），若立项需重点覆盖 429 注入场景。

## 未确认事项

- 各候选的优先级权重（业务价值取向）属规划层判断，本回执不代判。
- P36 与 P3 的登记重叠（P36 为 D 组清单独有条目、P3 注记亦提及消息模板），核销时如何联动由规划裁决。

## 冲突信息

- `knowledge/current-status.md` 快照（同步点 D210）称 governance-contract-consolidation 方向在 `ready/`、管理员执行中、为当前唯一下一动作；但文件系统现状是该方向已在 `passed/`，且存在 `product/governance-contract-consolidation/receipts/planning-final-review-2026-08-25.md`。两者不一致，孰是孰非超出本任务范围，仅如实报告——该不一致影响「下一功能何时可选」的前置判断，请规划层先行核实。

## 是否需要继续探索

否。指定候选全部覆盖且证据闭环，无缺失材料项。

## 建议返回规划层的最小结论

1. 首选 **P36 消息模板**：边界清晰、三重现成模式、能推进真实清单行；
2. 次选 **P9 节点级多 Key 轮询**：依赖全部现成，但属核心引擎改造且无清单行收益；
3. P19(RAG) 在 I13 收敛前不可启动；P32/P33 各有未决选型；P25(I50) 建议挂靠后续任一后端轮次顺带处理而非独立立项；
4. 规划选择前需先核实 current-status.md 与 governance-contract-consolidation 实际归档状态的冲突。
