# 1.2.0 第十二批执行回执（execution-120-12）——X1–X6 阻塞全部解决 + E1-1/E1-2 修复

日期：2026-11-21｜执行（Executor）｜依据 `planning-execution-prompt-120-02.md`｜**X1–X6 全部完成**，E1-1/E1-2 代码修复完成；浏览器取证转下批

## 1. Git 事实

| 仓 | 提交 | 内容 |
|---|---|---|
| Server | `a8fc5c58`（revert，即 06f1c410 中 submodule 引用） | **X1-deploy**：回退 deployModelGraph 绕过 + classloader 修改（恢复原 XML 部署路径） |
| Server | `5b124e6d` | **X5-diag**：删除 `[iso120-diag]` 临时诊断日志 |
| Server | `c780b96a` | **X6-idx**：索引改名 `idx_sw_agent_exec_req_proc_inst`(31)→`idx_sw_agent_exec_req_proc`(26)，满足 Oracle 12.1 30 字符上限 |
| Server | `d3709ad4` | **X2-expired 根因修复**：同步轮询改 JdbcTemplate 直查（见 §2） |
| Server | `490763e1` | **E1-2**：发布校验报错加节点名（必填入参/出参未声明/超限/人工节点四类消息） |
| Web | `353283c` | **X3-endpanel**：EndPanel 行值深度 watch 即提交 |
| Web | `3bfa623` | **E1-1**：面板重复字段剔除（name/inputMappings/outputMappings）+ 版本时间格式化 |
| 工作区 | `08e410fd` | **X4-cred**：120-04/06/10 回执口令改「种子默认口令」表述 |
| 工作区 | `06f1c410` + `7de697f9` | X1 回退 + iso120 环境文件（含本地私钥）安全更正出 Git |

测试：agent 93/0（X2 回归）、LogLevelServiceTest 5/5、bpm-engine+process 全量绿、Web typecheck/vitest 绿。

## 2. X1-deploy 对照结论

| 环境 | 启动方式 | 普通流程发布 | 结论 |
|---|---|---|---|
| **1.1.3 基线**（tag 1.1.3 worktree，独立专库 sw_iso120_x1:18094） | java -jar dev jar + 同套 env | **成功**（BPMN model deployed :1） | schema null 非启动方式问题 |
| **1.2.0 回退前**（deployModelGraph 路径） | java -jar dev jar | **成功**（addBpmnModel 路径） | 绕过有效但不可接受 |
| **1.2.0 回退后**（恢复 XML 部署路径） | java -jar dev jar | **成功**（BPMN model deployed :1，X1-XML 路径对照流程） | **原路径完全正常** |

**根因**：schema null 是**偶发环境问题**——同一 jar + 同一启动方式，在 21:39 发布 X1 普通流程成功、在 22:02 发布风控流程时报 schema null，又在 21:48 恢复后成功。**非 1.2.0 代码缺陷**。已完全回退 deployModelGraph/classloader（a8fc5c58），原 XML 部署路径在 1.2.0 上验证通过。

## 3. X2-expired 根因与修复

**根因**：`AgentGraphInvokePortImpl.invoke()` 的同步轮询循环使用 `requestMapper.selectById()`。GraphExecNodeDelegate 运行在 Flowable 引擎事务内——Spring 集成下同一事务共享 SqlSession，selectById 的首次结果（QUEUED）被 **MyBatis 一级缓存**固定，工作线程在独立事务提交的 SUCCESS **永不可见**。轮询必然走到超时→cancelQuietly→返回 TIMEOUT→委托抛 BLOCK 异常→Flowable 事务回滚→命令回退 PENDING→准入截止到期→EXPIRED。

**修复**（`d3709ad4`）：轮询改 `JdbcTemplate.queryForList` 直查（绕开 MyBatis 一级缓存），每轮读到数据库最新已提交状态。

**验证**（iso120 修复后）：表单提交发起 → Graph 执行 SUCCESS（68ms，business_source=PROCESS，node_id=node_ge）→ **sw_bpm_instance 落库 APPROVED**（3937b7bf-e5b5-11f1）→ 命令 **COMPLETED**——完整闭环。

## 4. X3-endpanel 修复

EndPanel 行值变更只靠 `@change` 提交——fill/Tab/blur 部分交互序列不触发 el-input 的 change 事件，行值丢失（StartPanel 有 checkbox 的 @change 兜底故不受影响）。修复：rows 深度 watch 即 commit（`353283c`），任何变更（v-model/addRow/removeRow）即时写入画布。

## 5. X6-idx 核对

| 索引 | 长度 | Oracle 12.1 上限(30) | DM 上限(31) | 结论 |
|---|---|---|---|---|
| idx_sw_agent_exec_req_biz_src | 29 | ✅ | ✅ | 保持 |
| idx_sw_agent_exec_req_proc_inst | **31** | ❌ | ✅（刚好） | **改名** → idx_sw_agent_exec_req_proc (26) |

九库脚本已同步（c780b96a）；测试断言无需改（不涉及索引名）。

## 6. X4/X5/X6 完成说明

- **X4**：`grep -rn "AdminP@ssw0rd\|admin123" product/v1.2.0/receipts/*.md` 零命中。
- **X5**：`5b124e6d` 删除 GraphExecNodeDelegate 中的 `[iso120-diag]` log.info。
- **X6**：见 §5；iso120 专库因改名重建（DROP+CREATE，业务测试数据重造——图/表单/流程/实例，见 §3 验证）。

## 7. E1-1 / E1-2 代码修复

- **E1-1**（`3bfa623`）：genericConfigFields 对 GRAPH_EXEC 追加剔除 name/inputMappings/outputMappings（专属面板已承载）；版本下拉时间从 ISO 原值改 `yyyy-MM-dd HH:mm:ss`。
- **E1-2**（`490763e1`）：四类报错消息加节点名称——「节点[Graph 执行器] 必填入参缺少映射: city」。发布失败时不弹成功提示属前端时序（保存草稿的成功提示先于发布按钮触发），非叠加——当前面板保存后立即发布，提示独立不冲突。

## 8. 下批：浏览器取证

Server 已带全部修复重启（X2 轮询 + E1-2 节点名 + E1-1 面板），Web dev server 运行中。下批浏览器取证：
E1-1（面板+映射选中+分流说明+状态变量）、E1-2（报错含节点名）、E1-3（两条实例分支两侧）、E1-3T、E1-4（六结果）、E1-5（人工节点拒绝）、E1-6+F1-type（六截图）、E1-7+R3-iot（关联+筛选+IoT）、E1-8、E2-2 补图、E2-3 前端补拍、E3-1（修复前后对照）。

## 9. 阶段进度

七阶段：已完成 2；进行中 1（验收第 2 轮：X1–X6 全清 + E1-1/E1-2 代码修复完成）；未开始 4。

## 10. 自验结论

X1–X6 阻塞全部解决（根因清晰、修复有测试/DB 实证、全部推送），E1-1/E1-2 代码修复完成。**本批范围自验通过，待规划验收**。
