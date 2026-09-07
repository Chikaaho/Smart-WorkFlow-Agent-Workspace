# v0.0.2 OA 阶段三终态同步方向

2026-09-07；Planner。等级 L，状态 READY。前置裁决：`../receipts/planning-review-v0.0.2-oa-06-passed.md`（A1—A8 功能级 PASSED）。权威值探索：`../../../search_fallback/v0.0.2-oa-terminal-values.md`。

本方向只执行终态状态同步，不修改两仓业务实现或 README，不运行编译、测试、迁移，不创建提交、推送、标签或 Release。执行层不得重新计算或自行选择下列值。

## 1. 唯一终态值清单

| 字段 | 唯一值 |
|---|---|
| 功能名称 | `v0.0.2-oa` |
| 功能状态 | `COMPLETED（待规划确认，2026-09-07）`；执行同步后仍须 Planner 最终复核，不能自写“规划已确认” |
| 正式完成功能数 | **43**（42＋1，第43个正式功能） |
| 清单计数 | **✅36 / 🟦26 / ⬜28 = 90** |
| M04-F05-01 待办中心 | **🟦→✅**；四个人入口、流程中心、抄送查询和催办已覆盖该明细完整描述 |
| M06-F04-01 发送记录 | **🟦→✅**；状态查询、管理入口、失败重发、单发/批量失败子记录和关联日志已覆盖 P3 剩余范围 |
| M03-F01-02 控件库 | **保持🟦**；A5 只交付本版四控件子集 |
| M03-F03-01 联动校验 | **保持🟦**；A5 交付显隐/默认值/必填，计算公式等仍开放 |
| P2 | **开放、部分实现未核销** |
| P3 | **已核销/完成（2026-09-07）** |
| P4 | **开放、部分实现未整体核销**；本轮流程中心、抄送查询和催办已完成，转办/委托/加签/撤回、流程版本/挂起激活等候选仍开放 |
| P54 | **已核销/完成（2026-09-07）** |
| P55 | **已核销/完成（2026-09-07）** |
| I 问题集合 | **54条，I1—I55缺I27，本轮不增删**；I38/I39/I40/I45保持开放 |
| 活动功能 | **无** |
| 当前唯一下一动作 | **准备 v0.0.2 最终发布候选：修正工作区根 README 指向两仓已删除 `#快速开始` 的旧锚点，整理两仓本地候选提交并核对 develop→main 与 Release 触发条件；远程合并、推送、标签和发布须另获 Owner 明确授权** |
| 主方向目录 | `product/v0.0.2-oa/passed/direction-v0.0.2-oa.md` |
| A8 方向目录 | `product/v0.0.2-oa/passed/direction-v0.0.2-oa-readme-closeout.md` |
| 阶段三方向目录 | 同步执行期间位于 `product/v0.0.2-oa/ready/direction-v0.0.2-oa-terminal-sync.md`；Planner 最终复核通过后移入 `passed/` |

## 2. 唯一验证基线集合

本功能实际涉及 Server、Web 与数据库迁移，终态入口统一登记最近锁定基线：

| 范围 | 唯一基线 |
|---|---|
| Server | **181份 Surefire 报告 / 1156 tests / 0 failures / 0 errors / 0 skipped；`mvn -q test` exit 0** |
| Web | **124 files passed + 1 skipped / 1168 tests passed + 3 skipped；typecheck、lint、test、build exit 0** |
| Flyway | **H2 V58（58）/ PostgreSQL V58（57）** |
| A8 文档 | 两仓链接/敏感信息/Markdown/`git diff --check` 通过；Logo及最终证据包哈希 **10/10 OK** |

基线来源为 completion 01—04 的最近生效工程证据、规划验收03/04锁定结果，以及 completion 06 / planning-review 06 的 A8 证据。不得沿用 P4 的 1128/1153/V55 旧快照，也不得把回执中未被规划采信的中间数字登记为正式基线。

## 3. 必须同步的当前状态入口

执行角色按实际文件结构同步所有当前入口，至少包括：

1. `knowledge/current-status.md`；
2. `knowledge/session-handoff.md`；
3. `knowledge/features/v0.0.2-oa.md`（新建正式功能记录）；
4. `knowledge/feature-reconciliation-index.md`；
5. `knowledge/known-issues.md`（只确认 I 集合不变，不伪造关闭）；
6. `Smart-WorkFlow-Server/功能清单.md`；
7. `todo/requirement-pool.md`；
8. `memory/state.md`、`memory/features.md`、`memory/handoff.md`、`memory/README.md`，以及为消除旧下一动作残留确需同步的其他短记忆文件；
9. 当前终态机器契约及项目既有要求的状态投影入口。

全文搜索并清除这些过期当前口径：v0.0.2 仍为 VERIFYING/A8待验、功能数42、清单34/28/28、P54/P55待规划、P3仍缺状态查询/重发/日志、P4仍缺流程中心/抄送查询/催办、当前下一动作为等待选择需求。历史回执和历史时点必须保留原文，不作追溯性改写。

## 4. memory 压缩门槛

同步前已核对8个短文件合计 **16,490字节**，单文件最大 `features.md` **4,777字节**。同步后必须满足：

- 每个短记忆文件 `<5KB`；
- `memory/` 8个短文件合计 `<20KB`；
- 回执逐文件给出同步前/后字节数、保留摘要和移除的过期范围；
- memory 只保留当前决策摘要，完整证据继续引用 product/knowledge，不复制正文。

## 5. 执行与验收门禁

执行顺序：建立当前值快照 → 按第1—3节同步 → 全文检索旧当前口径 → 校验清单与功能数 → 校验基线三方一致 → 统计 memory 字节 → 校验终态契约 → 提交回执。

提交前必须全部为是：

- [ ] 所有当前入口仅出现功能数43和清单36/26/28，三类总和90？
- [ ] M04-F05-01、M06-F04-01均为✅，其余未授权明细零变化？
- [ ] P3/P54/P55已核销，P2/P4仍开放且部分实现边界准确？
- [ ] I集合54条不变，未因P3核销错误关闭共享I45？
- [ ] Server/Web/Flyway/A8基线与第2节逐字一致？
- [ ] 活动功能为空，唯一下一动作是本地发布候选准备且没有宣称已获远程授权？
- [ ] 主方向/A8方向在passed，阶段三方向仍在ready？
- [ ] memory每文件和总量均低于上限，回执含前后字节表？
- [ ] 没有修改业务代码、两个代码仓库README或历史证据，没有运行工程测试或执行Git发布动作？

当前补差以 `../receipts/planning-execution-prompt-v0.0.2-oa-terminal-sync-01.md` 为唯一入口。只修正T4后提交 `product/v0.0.2-oa/receipts/terminal-sync-v0.0.2-oa-03.md`，状态使用 `COMPLETED（待规划确认） / EXECUTION_SUBMITTED`。Planner 将按角色规则全文复核；只有复核通过后才确认 `COMPLETED` 并归档本方向。
