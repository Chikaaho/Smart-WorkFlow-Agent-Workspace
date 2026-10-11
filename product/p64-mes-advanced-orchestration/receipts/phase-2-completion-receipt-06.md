# P64 阶段Ⅱ完成回执06（按提示04 七项精确剩余账本逐项独立证据包收敛）

2026-10-11；Executor；XL（P64 阶段Ⅱ）。依据[复审05](planning-review-phase-2-05.md)与唯一执行入口[提示04](planning-execution-prompt-p64-phase2-04.md)（替代提示03 作唯一当前账本；旧提示与回执仅作锁定证据追溯），在既有完整实施授权内完成七项精确剩余（P2-04a、P2-02b-V-C、P2-05b-A、P2-06a-C、P2-06b、P2-07b、P2-07b-G），追加本回执；证据树 [phase2-06](evidence/phase2-06/INDEX.md)（71 件，MANIFEST.sha256 工具生成并 71/71 `sha256sum -c` 回读 OK）。已锁定子事实（复审04/05 §1）未重验；阶段Ⅱ保持 **VERIFYING**、P64 整体 IN_PROGRESS、阶段Ⅰ PASSED、阶段Ⅲ未验收；不写功能 PASSED/COMPLETED、不核销 P、不晋级基线。

## 0. 对象与环境（不可变事实）

- 验证库 `smart_workflow_p64p2c`（PG 5432，0.1.9；Owner 服务 PID 32080 全程未动、只读 SQL 快照）；后端本轮=**local profile + `ch.dev.test-mock`（固定验证码 1234，登录零 OCR）+ 外置覆盖配置 `logs/p64p2h-r06/r06-local-override.yml`（不入库）**；进程族以 spring-boot:run（展开类路径——boot jar 嵌套类路径使脚本 worker 子进程无法加载 ScriptWorkerMain，实测启动失败原行留档后改道）承载，PID 演进 24820→39996→8040→19492→42176 每次重启均有构件刷新/启动方式修正原因。
- 本轮新建对象（全部终态，`raw/db/06-ru-final3.txt`：30 实例 **RUNNING=0/act_ru_task=0/act_ru_execution=0**；17 次 discard HTTP 200 以终态 SQL 为权威回读，不造 cleanup JSON）：P2-04a 分配对（父记录 6f317205→子 8605eb3b(jia)/0fa51602(yi)）；P2-02b-V-C 冲突恢复链（挂起 033878c2 系→UI 恢复；干净正向 877aa725→API 恢复）；P2-06b 在役链（在役父 ba547cec/76ec0e15 v3 + 新入口对照 c8717856/7e991429 v4）。历史对象（r04 主链 2e65f119 等）原样保留、只读引用。
- 取证通道：ZCode 内置浏览器（可见可交互、非 headless、宿主管理生命周期），7 幅像素+侧车 TXT（URL/视口/身份/对象）+ 29 条 ACCESS 请求索引。

## 1. 逐项处置（ID → 实际结果 → 证据包）

### P2-04a 系统派发对象的普通办理者正反权限 — `evidence/phase2-06/P2-04a.md`
- **确证缺陷→最小修复（P64 接缝，不改 data_scope、不重构全平台）**：派发子记录 create_by=父实例发起人（24 条历史记录 SQL 实值）+ SELF 域过滤（FormDataScopeSupport SELF→create_by 等值）⇒ 被分配办理人读不到派发给自己的记录（提示04 预判的 create_by 过滤缺陷）。
- 修复（Server `d594663`）：`FormDataSubmitFacade#submitOnBehalfOf`（form-api 新契约：记录归属人落库，校验/可见性/审计仍按调用方上下文权威执行）＋`FormSubmitService` recordOwnerUserId（主/子表 create_by/update_by=归属人；trace/flow submitter 仍真实）＋`OrchActionStartCommandHandler` 按目标定义已发布版首节点 FORM_FIELD/USER/MAIN 参与人字段解析归属人（解析不可得回退原语义，不新增派发失败模式）。
- 实机正向（jia/yi，SELF 域，各分配 1 子记录）：create_by=update_by=owner_id=各自办理人（SQL 原件）；详情 200、列表只含自己（jia=2 自有、yi=1 自有、admin=31 对照）、任务详情 200、节点表单授权来源行预填 200；**可办**：jia 办理命令 200→子实例 APPROVED。反向：互看详情 **1507**、互看任务 **403**、越权写 403（jia 无 form:data:edit——功能权限口径单独登记，不当对象隔离证明）。
- 单测：FormSubmitServiceTest +2（归属人落库/审计不模拟/空值回退）、OrchActionStartCommandHandlerTest +3（FORM_FIELD 解析/TABLE 回退/定义未发布回退）。

### P2-02b-V-C 已恢复冲突的当前/历史诊断区分 — `evidence/phase2-06/P2-02b-V-C.md`
- **确证缺陷→最小修复**：真实 API/DB 诊断源——WRITTEN 项 error_text 与 SETTLED 批次 block_reason 残留「已挂起等待有权处置」（锁定对象 2e65f119/batch 2108953698084405249 复读在案）。修复：applyWriteback 成功清 errorText＋settleBatch 显式 `.set(blockReason,null)`；**实机验证暴露次生缺陷：MyBatis-Plus `updateById` 忽略 null 字段致 error_text 未真清**（首轮 UI 恢复后 SQL 复查在案）→ retryWriteback 成功分支显式 wrapper `.set(error_text,null)`（Server `3341de5`，单测断言 wrapper sqlSet 必含 error_text）。
- Web 面板状态化渲染（Web `4333145`）：`isBatchBlockReasonCurrent`/`isItemDiagnosisCurrent`——未决（WAITING/BLOCKED；CONFLICT/FAILED/REFUSED）按当前待处置呈现；已结算/已恢复降级灰色「历史诊断（状态）：…」（vitest +1 用例）。
- 实链三像素（内置浏览器可见会话）：**真实未恢复冲突准确显示待处置**（BLOCKED+黄色 warning alert+CONFLICT 项+恢复回写入口，必要反向）→ 可见会话恢复后 **SETTLED 无阻断警告、WRITTEN 项诊断列空（API errorText=null 原值）** → r04 锁定面板 2e65f119 遗留残留行降级灰字（历史可留痕、不误报当前挂起；零数据迁移、动作/回写次数不增加）。

### P2-05b-A 委托链原安排/断言与实际 XML 关联 — `evidence/phase2-06/P2-05b-A.md`
- 5 个目标运行期方法（恰4跳成功[77,88]/5边拒绝/DEPT优先 orgQueries=0/跨租户/循环）+3 个配置期方法（同优先级歧义/循环/超4跳配置拒绝）的**源内原安排与断言逐行导出** ↔ 3 份 XML testcase 名逐一映射 ↔ 源文件/运行树 SHA256 关联（源文件 SHA 与回执05 运行身份记录一致＝本轮零改动）。不重跑测试、不新增 API 矩阵（按提示04 方法变化）。

### P2-06a-C 根链同根并发占用 — `evidence/phase2-06/P2-06a-C.md`
- **确证缺陷→最小修复**：真实 H2 MODE=PostgreSQL＋真实 bpm 迁移竞争验证（单批固定 999 计数 fixture，无 1000 对象/压测）——同根两个不同 batch 并发冻结在"selectList 求和→判定→insert"无串行化守卫下**双双放行、根链总额=1001>1000**（修复前原证 console+surefire XML 双留存）。
- 修复（Server `d594663`）：`BpmInstanceMapper#lockByProcessInstanceIdForUpdate`（根实例行 FOR UPDATE，调用方事务内持有至提交）＋freezeBatch 求和判定前加锁（同一根链全部派发解析到同一 root_instance_id ⇒ 同根冻结串行化；root 缺失告警按原语义继续）。修复后原证：**恰 1 放行＋1 拒绝（CHILD_CHAIN_OVER_LIMIT 2447 可诊断消息）、最终总额=1000、被拒方零新增批次/项/意图**；四 case 原断言与 26/0 XML 关联保持（包内逐条）。

### P2-06b 阶段Ⅱ在役对象收敛 — `evidence/phase2-06/P2-06b.md`
- 在役对象建立：v3 在役父实例 76ec0e15（WAITING 批次 2 项、轮次 roundNo=1、参与者=张三/李四）。
- **关闭新入口（值与产物）**：发布 **v4**（去 trg_child 触发器＋移除 SUBFLOW_WAIT 节点并重连边 node_ops→node_review；两次中间形态被发布校验 2450 拒绝均留痕——触发器已删等待节点仍在/无可等待动作）；产物=发布图原件+def def_version=4/published_version=4/PUBLISHED+版本快照行 v2/v3/v4（**v3 冻结行不动**，loadGraph(…,3) 在役可解析）。
- **新入口零意图**：新实例 7e991429（def_version=4）走完运维节点 → `sw_bpm_trigger_exec` **0 行**、child-batches **0**（SQL 原件）。
- **在役收敛**：张三/李四完成子任务（子记录 create_by=各自——P2-04a 接缝保证可读可办）→ 张三项 WRITTEN、李四项主记录版本冲突（张三项先行写回 0→1——与 r04 主链同款设计内冲突）→ admin 受控恢复一次 → **SETTLED 2/2、block_reason=null** → 等待唤醒 → 复核完成 → **在役父 APPROVED（def_version=3 原版原义）**；查询/办理/回调全程可用＋收敛像素。
- 边界：无跨部署旧代码在役对象（如实）——以"定义版本关闭+存量实例沿 v3 原义"为提示04 允许的登记替代；阶段Ⅰ P1-07a 锁定映射不重开。

### P2-07b 权威覆盖矩阵 — `evidence/phase2-06/P2-07b.md`
- knowledge 四入口逐字段更新＋回读原件（行号/更新后实读）：current-status L3 顶部新条目（回执05 条目历史化）、features p64 L17/L26、session-handoff L3（不保留旧唯一动作）、architecture L259。
- **Server 实际功能清单焦点**：`功能清单.md` L52 焦点行滚动更新为回执06 当前值（旧焦点原文化迁入历史标注），docs 批次 `7fffef9` 推送读回一致（纠正回执05 "拿错误码目录替功能清单"）。
- reconciliation 实际零命中：P64/p64 grep 计数 0/0 原件（不晋级 47/90/ADV64 依据经实际回读成立）。
- memory/todo/product：复用 Planner 复审05 修订回读（memory/handoff 唯一账本=提示04、追加回执06——与本轮链一致，无旧唯一动作残留）；新批次三仓 Git 关联。

### P2-07b-G 原流封装更正 — `evidence/phase2-06/P2-07b-G.md`
- 报告清单逐类复算（tests/fail/errors/skipped+exit+XML 数，见 §3）；锚 8 类 56/0 与 Nested 27/0 引用 phase2-05 `05-anchor-nested-counts.txt` 实际来源（零 bootstrap 域改动不重跑）；COUNT helper（waitingBatch/K=2/2/1/expectedCount=2）原行提取。
- **李四身份以 SQL/网络/像素三方锁定**（userId 2108817586460422146；r05 派发 task d4d26666/record da1ed544——phase2-05 原件引用），纠正回执05 §0 错误复用张三元信息的 JSON（该 JSON 仅作历史）。
- **探针 12:02/03 与 PID 43556(12:14 部署会话) 两采集时点分时点登记**：同库对象一致（SQL 可复算）、进程级因果不拼接。
- 自身终止/清理**实际原观察**：`06-service-teardown.txt`（taskkill //T //F 实际输出行＋8080/5173 零监听 NETSTAT_EXIT=1＋时间戳）＋`06-ru-final3.txt`（30 实例 0/0/0）；r05 的 teardown 缺原行缺口由本轮同格式原件补齐。

## 2. 本轮实际修改文件

**Server（批次一 `d594663`，10 文件）**：`FormDataSubmitFacade.java`（form-api 契约）、`FormDataSubmitFacadeImpl.java`、`FormSubmitService.java`、`FormSubmitServiceTest.java`（+2）、`ChildOrchestrationService.java`（诊断清除+根链锁）、`ChildOrchestrationServiceTest.java`（结算/恢复断言）、`OrchActionStartCommandHandler.java`（归属解析）、`OrchActionStartCommandHandlerTest.java`（+3）、`BpmInstanceMapper.java`（根行锁）、`ChildOrchestrationRootChainRaceTest.java`（新增）+ H2 迁移补丁 `V107__p64_phase2_h2_item_source_rows_json.sql`（测试库保真）。
**Server（批次二 `3341de5`，3 文件）**：`ChildOrchestrationService.java`（retryWriteback 显式清 error_text）、`ChildOrchestrationServiceTest.java`（显式清除断言）、`ChildOrchestrationRootChainRaceTest.java`（断言次序修正）。
**Server（文档批次 `7fffef9`）**：`功能清单.md`（焦点行滚动更新）。
**Web（`4333145`，3 文件）**：`p64-orchestration.ts`（两个状态判别纯函数）、`p64-orchestration.spec.ts`（+1 用例）、`ProcessInstanceList.vue`（批次阻断/项诊断按状态渲染+降级样式）。
**工作区**：本回执、证据树 phase2-06（本机留存，.gitignore）、knowledge 四件（current-status/features p64/session-handoff/architecture）。
**验证资产（不入库）**：`logs/p64p2h-r06/`（SQL 工具/登录/派发/探针/冲突/在役脚本、覆盖 yml、门禁日志、竞争验证原证）。

## 3. 门禁（本轮实跑，原件 `raw/gates/`、`raw/unit/`）

| 门禁 | 计数（工具逐类复算） | 退出码 | 说明 |
|---|---|---|---|
| engine test | **114/0/0/0**（30 XML） | 重跑 exit 0（BUILD SUCCESS） | 零 engine 改动；首跑 ScriptWorkerPoolTest worker-PID 复用断言偶发（expected 10448 got 26000，原始行保留），单独重跑全绿——与回执05 同款高负载偶发 |
| process test | **386/0/0/0**（78 XML） | exit 0 | 净 +5（竞争测试 1＋归属接缝 3＋显式清除断言并入既有 case） |
| system-biz test | **365/0/0/0**（45 XML） | 模块 SUCCESS | 委托域零改动（reactor 内先于 engine 偶发点完成） |
| form-biz test | **178/0/0/0**（26 XML） | exit 0 | 净 +2（本轮受影响模块纳入门禁） |
| Web 四门 | 0e/**3w 基线**、153+1 文件/**1386+3** 用例、build ✓2.87s | 四门 exit 0 | 最终文件状态复跑（首跑 python 写文件引入 CRLF→eslint --fix 后复跑，与回执05 同款流程） |
| bootstrap 锚 8 类 | **56/0/0/0**（r04 原件逐类复算） | B_EXIT=0（r04） | 本轮零 bootstrap 域改动不重跑 |

## 4. 与方向的偏差 / 遇到的问题 / 风险

1. **启动方式两次纠偏（有原证）**：boot jar 嵌套类路径使脚本 worker 子进程 `ClassNotFoundException: ScriptWorkerMain`（触发评估 FAILED 留痕+实例废弃清理）→改 spring-boot:run（宪法"后台进程+日志轮询+精确终止"口径）；首次未带 `-am` 用了本地仓库陈旧构件（create_by=1 实证旧代码在跑）→install 后重启。两次均按新对象重做、旧对象废弃登记。
2. **yi 任务首轮提交**：脚本载荷含未知字段 result_summary 被表单校验拒绝（命令终态 FAILED 留痕）；重试遇任务动作载荷守卫 2426（同任务异载荷拒绝——设计内），该实例 discard 登记；其"可办"以重派链路+同构 jia 办理命令证明。
3. **MP updateById 忽略 null 字段**：后端清诊断修复的实机验证暴露该次生缺陷（error_text 未真清），以显式 wrapper 补齐并加单测断言——已纳入门禁。
4. **竞争验证环境**：H2 MODE=PostgreSQL（行锁+READ COMMITTED，与生产 PG 同语义）；发布校验器不接受"仅去触发器"的 v4 中间形态（两次 2450 拒绝留痕），最终 v4 结构=去触发器+移除等待节点重连边。
5. **ScriptWorkerPoolTest 偶发**：与回执05 同款（零 engine 改动、单独重跑全绿），不升级。

## 5. 自身收尾与 Git

- **对象清理**：本轮 30 实例全部终态（APPROVED/DISCARDED）→ **RUNNING=0/act_ru_task=0/act_ru_execution=0**（`raw/db/06-ru-final3.txt`）；历史对象保留；PG Owner 服务未动。
- **服务收尾**：后端/vite 精确 taskkill //T //F（实际输出行）→ 8080/5173 **零监听**（NETSTAT_EXIT=1＋时间戳，`raw/gates/06-service-teardown.txt`）；内置浏览器标签页关闭；无孤儿进程。
- **三仓 Git**（普通批次提交推送授权内；提交后回读一致，`raw/git/06-three-repos-cutoff.txt`）：
  - Server `51ea1ce`→**`d594663`**→**`3341de5`**→**`7fffef9`**（docs）＝origin/feature/p64-mes-advanced-orchestration；
  - Web `5d058b9`→**`4333145`**＝origin；
  - 工作区 `develop-sw` 本批次（回执06+knowledge 四件）见提交后回读（memory/handoff 关联）；根索引 gitlink `78495dc`/`7af86f24` 保持不修改。
- **knowledge-first**：见 P2-07b 包（逐入口字段/值/位置/时点+reconciliation 零命中+memory 路由回读）。

## 6. 自验结论

提示04 七项精确剩余账本逐项闭合，每项独立证据包（ID→原件→实际结果→覆盖边界）：分配对象权限以确证缺陷最小修复+实机正反出口（含可办命令与像素）闭合；恢复诊断以双重修复（后端显式清除+前端状态化渲染）+三态像素（挂起/干净恢复/遗留降级）闭合；链长原断言三方关联不重跑；根链并发以真实竞争验证确证缺陷并修复（恰1放行+1拒绝、总额=1000）；在役收敛以 v4 关闭新入口+旧实例原版原义 APPROVED+零新意图实链闭合；knowledge-first 以行号级回读+Server 清单焦点滚动+reconciliation 零命中原件闭合；封装以逐类复算/来源引用/身份三方锁定/时点登记/终止原观察闭合。**自验通过，待规划按提示04 客观矩阵独立验收回执06 与 phase2-06 证据包。** Executor 不写功能 PASSED/COMPLETED、不核销 P、不移动方向到 passed/。
