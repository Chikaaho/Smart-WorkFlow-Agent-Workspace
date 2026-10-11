# P64 阶段Ⅱ完成回执05（按三级提示03 七项账本逐项独立证据包收敛）

2026-10-11；Executor；XL（P64 阶段Ⅱ）。依据[复审04](planning-review-phase-2-04.md)与唯一执行入口[三级提示03](planning-execution-prompt-p64-phase2-03.md)，在既有完整实施授权内完成七项剩余账本（P2-04a、P2-02b-V、P2-05b-A、P2-06a-C、P2-06b、P2-07b、P2-07b-G），追加本回执；证据树 [phase2-05](evidence/phase2-05/INDEX.md)（56 件，MANIFEST.sha256 工具生成并 56/56 `sha256sum -c` 回读 OK）。已锁定子事实（复审04§1）未重验；阶段Ⅱ保持 **VERIFYING**、P64 整体 IN_PROGRESS、阶段Ⅰ PASSED、阶段Ⅲ未验收；不写功能 PASSED/COMPLETED、不核销 P、不晋级基线。

## 0. 对象与环境（不可变事实）

- 验证库 `smart_workflow_p64p2c`（PG 5432，0.1.9；Owner 服务 PID 32080 全程未动）；后端本轮=**local profile + `ch.dev.test-mock`（Owner 指示切换：固定验证码 1234，登录零 OCR；纯 local 守卫内，I5 fail-closed 保持）** + 外置覆盖配置 `logs/p64p2h-r05/r05-local-override.yml`（不入库）指向同一验证库。
- 本轮新建对象（全部可复算、已清理）：对照角色 `biz_handler_self`（id 2108954000100000001，SELF 域，权限串 form:data:query+submit）授甲/乙；最小派发 2 父 2 子（父记录 550d578f→子任务 9bc5e844（张三）、父记录 6e3cc908→子任务 d4d26666（李四））；甲正向探针自建记录 94177cad（其表单绑定流程自启动实例 a8dff859 一并识别清理）。**终态：4+1 实例全部 DISCARDED，act_ru_task=0 / act_ru_execution=0 / RUNNING=0**（`evidence/phase2-05/raw/db/05-ru-final.txt`、`raw/live/05-self-cleanup-dispatch.json`）。
- 历史对象（r04 主链等 75 实例）原样保留；r04 50/75 两时点快照不拼接（封装处置见 P2-07b-G §7）。
- 取证通道：**ZCode 内置浏览器（Owner 本轮指示切换；可见可交互、非 headless、宿主管理生命周期）**；视觉像素+URL/视口/身份文本头（`evidence/phase2-05/raw/ui/`）。

## 1. 逐项处置（ID → 实际结果 → 证据包）

### P2-04a 跨负责人隔离（权限快照 + 目标数据出口）— `evidence/phase2-05/P2-04a.md`
- 权限快照（DB 实值）：张三/李四=同角色 `biz_handler`、**data_scope=0（DataScope 枚举 ordinal 0=ALL）**、同部门 tenant 0，权限串 form:data:query+submit；admin=超管。既有 ALL 对互读对方子记录 200=合法全局授权（对照保留，完整 body 原件）。
- 普通办理者合同（登记替代角色 biz_handler_self=SELF 授甲/乙）：实际出口探针**全部拒绝或不给对方数据**——详情 code=1507（无数据）、列表 0 条（admin 24 对照）、导出 403、写 403（零变更）、办理出口 403；正向自建记录自读 200、对方 1507、列表 1 vs 0。
- **无缺陷确认 → 不修 P64 关联对象授权代码**（提示03"已有异常确认则修边界"分支未触发；"保留对照+固定普通办理者"分支成立）。

### P2-02b-V 页面可用性 — `evidence/phase2-05/P2-02b-V.md`
- 双根因确证并最小修复：①`[object Object]`=数据表单卡 TABLE 字段值 `String(v)` 兜底（Web `TaskDetail.vue` 逐行键值渲染修复）；②768 裁切=900px 抽屉右锚定+窄屏阈值 768 过宽+viewportWidth 无 resize 监听（Web `ProcessInstanceList.vue` isNarrowViewport<900 全额宽+基本信息单列+break-all+resize 监听）。
- 修复后像素（18 份 ui 原件，零 `[object Object]`）：活子任务（张三/李四，办理人本人身份）数据表单反馈明细逐行+节点表单表格（src_row_id/feedback/操作）滚动像素；admin 完结复核主机表逐行（R04-ZS-4/R04-LS-2 实值）；实例回查批次面板桌面+768（单列基本信息 7 字段标题完整、长 UUID 完整、流程图四节点可读）。
- 边界：完结子任务深链对原办理人 403（历史 assignee 空+对象权限锁定语义）→ 活像素经本轮最小派发（**不重演完整主链**，仅 1 父 1 子取证后清理）；节点表单 DynamicField 标签双行显示为 r04 已存在且未被复审列为剩余项的原有呈现，不扩 scope。

### P2-05b-A 部门优先/链长 — `evidence/phase2-05/P2-05b-A.md`
- **确证缺陷→最小修复**：链长按边计数——修正前运行期把第 4 条边拒绝（既有用例固化错误语义）；修复后恰 4 跳（4 条边）成功（`chainOfExactlyFourHopsResolvesFinalAssignees`：末跳 P_D5 有效任职 [77,88]+逐跳审计）**、第 5 条边拒绝**（更新后 `chainOverFourHopsRejectedAtRuntime` 5 条边）。
- 精确部门优先方法判别：DEPT 命中后 **ORG 范围查询=0**（按查询范围应答桩判别，非仅结果断言）；同优先级歧义=配置期既有用例 `samePriorityOverlapRejected` 复跑通过；跨租户/循环/解析失败沿 r04 锁定不重演。

### P2-06a-C 根链护栏计数口径 — `evidence/phase2-05/P2-06a-C.md`
- **确证缺陷→最小修复**：修正前按**批次数**计数（单批多子实例只计 1）；修复后按**自动发起实例数**（同根批次 `expected_count` 求和+本批）。
- 断言四面：999 既有+2 新增=1001→拒绝（零 insert/零唤醒）；**999+1=恰 1000→临界允许**；**单批 expectedCount=1000（批次数=1）+1→拒绝**（实例口径判别）；998+2=1000→允许。非压测，方法级断言。

### P2-06b 旧在役影响映射 — `evidence/phase2-05/P2-06b-inflight-mapping.md`
- 逐路径映射：冻结语义/关闭入口（P1-07a `07a-5/18/19` 原件+冻结触发用例，本轮零改动）锁定；受影响路径=wait 接口（r04 Optional 重构；r04 真实主链等待节点 WAITING→SETTLED→唤醒→复核 APPROVED 原件+本轮回查像素复现）与 claim（可加路径，旧办理路径在 r04 主链中未经领取完成即收敛）。
- 本轮新改（walkChain/freezeBatch）生效面=**新解析/新冻结**；已冻结轮次/批次只读零写路径；回退边界引用 r04 锁定原件（专门 Flyway 配置不当默认启动回退门）。验证库无跨部署旧实例（全部创建于 r04 代码后）——如实声明。

### P2-07b 权威覆盖矩阵 — `evidence/phase2-05/P2-07b.md`
- knowledge 权威先写：`current-status.md` 顶部新条目（回执04 条目历史化）、`features/p64-…md` 当前状态行+当前规划复核行、**`session-handoff.md` 顶部覆盖值段（发现 r04 轮未更新、仍为回执03 值——即复审04 指认覆盖缺证的实例，本轮补齐）**、`architecture.md` §7.3 当前活动行。
- reconciliation 三件 P64 零提及复核（不晋级依据）；Server `error-code-catalog.md` §2 178/5 不变+`git diff` 空（不受影响依据）。
- memory 五/todo 两/product 四按提示03 **复用 Planner 修订、只回读不覆写**（回读=当前路由全部指向提示03/复审04/回执05；回执04 字样均为锁定/档案截止语义）。

### P2-07b-G 原流封装 — `evidence/phase2-05/P2-07b-G.md`
- 门禁A（本轮实跑 exit0）：engine **114/0**（30 XML）+process **382/0**（77 XML，净+3）+system-biz **365/0**（45 XML，净+2）逐类求和；首跑 engine ScriptWorkerPoolTest worker-PID 复用断言在高负载窗口偶发失败（零 engine 改动，单独重跑 8/0 全绿，原始行保留）。
- 锚 8 类 56/0 逐类复算（r04 幸存 XML+B_EXIT=0 原件，本轮零 bootstrap 域改动不重跑）；Web 四门 exit0（lint 0e/**3w 基线**、vitest 153+1 文件/1385+3 用例、build ✓3.08s；首跑 lint 0e/5w 为新格式警告，eslint --fix 后复跑为最终状态）。
- 控制器 Nested=Claim 3+Complete 5+Detail 9+Processed 3+Reject 4+Todo 3=**27/0**（外层 0=容器行）；COUNT fixture expectedCount=2/K=2·2·1（helper 实值摘录）。
- **父实例错误标签纠正**：正确父实例=**2e65f119-c4c5-11f1-aad4-00ff9e2a8dfb**（回查原件+SQL 锁定；回执04 §0 写的 97f89219 为错误元信息，仅作历史说明）；batch 2108953698084405249（SETTLED/预期 2/ALL/轮 1）两项 WRITTEN 与来源行/子记录/子实例 SQL 关联可复算（查询时点 2026-10-11T12:4x+08）。
- 生命周期：后端 PID 43556（8080）/vite 41612（5173）精确 taskkill 后**零监听**（`05-service-teardown.txt`）；内置浏览器取证标签页关闭（宿主管理，无自建 Chrome 进程）；对象清理 0/0/0 终态。
- P63 两失败：原始错误行+受控 broker 前置+本轮影响依据（零 P63 域代码触碰、受影响模块门禁全绿），不重开 P63。
- 文件计数：56 件工具清点+MANIFEST 回读（不引用与列举不符的声明数）。

## 2. 本轮实际修改文件

**Server（4 文件，提交 `51ea1ce`）**：`PositionDelegateFacadeImpl.java`（walkChain 按边计数）、`PositionDelegateFacadeImplTest.java`（+恰4跳成功/+部门优先判别/超跳用例改 5 边）、`ChildOrchestrationService.java`（freezeBatch 实例口径）、`ChildOrchestrationServiceTest.java`（+3 护栏用例+rootBatch fixture）。
**Web（2 文件，提交 `5d058b9`）**：`TaskDetail.vue`（formatFieldValue/formatTableRowValue）、`ProcessInstanceList.vue`（isNarrowViewport/单列/resize/断行）。
**工作区**：本回执、证据树 phase2-05（本机留存，`.gitignore`）、knowledge 四件（current-status/features p64/session-handoff/architecture）。
**验证资产（不入库）**：`logs/p64p2h-r05/`（SQL 工具/探针/派发脚本/覆盖 yml/门禁日志原件）。

## 3. 门禁（本轮实跑，原件 `raw/gates/`）

| 门禁 | 计数 | 退出码 | 说明 |
|---|---|---|---|
| Server engine test | **114/0/0/0** | 0（BUILD SUCCESS） | 零 engine 改动；首跑 ScriptWorkerPoolTest 高负载偶发（注记保留） |
| Server process test | **382/0/0/0** | 0 | 净 +3（本轮护栏新断言） |
| Server system-biz test | **365/0/0/0** | 0 | 净 +2（恰4跳/部门优先） |
| bootstrap 锚 8 类 | **56/0/0/0**（r04 原件逐类复算） | B_EXIT=0（r04） | 本轮零 bootstrap 域改动不重跑 |
| Web typecheck/lint/vitest/build | 0e/**3w**、153+1 文件/1385+3 用例、✓3.08s | 四门 exit0 | 最终文件状态复跑 |

## 4. 与方向的偏差 / 遇到的问题 / 风险

1. **取证通道按 Owner 指令切换**：CDP 自建 Chrome→ZCode 内置浏览器；登录经 `ch.dev.test-mock`（local profile+外置配置文件指向同一验证库；prod 下 test-mock 仍 fail-closed，安全守卫未动）。dev profile 缺 `sw.bpm.enabled` 等模块开关无法承载全栈，故取 local——已按最小覆盖集（数据源/模块开关/AI 占位）实现，与 prod 语义差异（cookie.secure/存储 provider）不影响本轮验证面。
2. **负向写探针的 403 语义**：jia 无 `form:data:edit` 权限串（biz_handler 菜单仅 query/submit）→ PUT 403 为功能门拒绝；即令持有，更新服务 create_by 域过滤同样拒绝——两层独立，不影响"越权写被拒"结论。
3. **甲探针的流程自启动**：`POST /form/data/{formKey}` 触发表单绑定的流程自启（P64B子反馈流程实例 a8dff859，发起人=甲）——非预期但已识别、discard、计入清理原件；该行为本身证明表单提交-流程绑定通路在验证库正常。
4. **r04 遗留封装差异**：50/75 两时点快照不拼接；三模块"待聚合原件"由本轮门禁对受影响模块补齐（114/382/365 逐类 XML+exit）；锚 8 类以 r04 幸存 XML 复算 56/0。
5. **ScriptWorkerPoolTest 偶发**：worker PID 复用断言在后端+vitest 并发窗口失败一次，单独重跑全绿；零 engine 改动，不升级。

## 5. 自身收尾与 Git

- **对象清理**：4+1 实例 discard（逐项 200）→ **ru_task=0/act_ru_execution=0/RUNNING=0**；历史对象保留；PG 未动。
- **服务收尾**：后端 PID 43556、vite PID 41612 精确 taskkill → 8080/5173 **零监听**（`05-service-teardown.txt`）；内置浏览器标签页关闭；无孤儿进程。
- **三仓 Git**（普通批次提交推送授权内；提交后回读）：
  - Server `d773f1d2`→**`51ea1ce`**（fix: 委托链恰4跳合法按边计数与根链护栏按自动发起实例计数）＝origin/feature/p64-mes-advanced-orchestration；
  - Web `115f9c0b`→**`5d058b9`**（fix: 数据表单表格值逐行可读与实例抽屉窄屏字段完整可访问）＝origin；
  - 工作区 `develop-sw` 本批次（回执05+knowledge 四件）见提交后回读（memory/handoff 关联）；根索引 gitlink `78495dc`/`7af86f24` 保持不修改。
- **knowledge-first**：见 P2-07b 包（逐入口字段/值/时点）。

## 6. 自验结论

三级提示03 七项账本逐项闭合，每项独立证据包（ID→原件→实际结果→覆盖边界）：隔离以权限快照+五类实际数据出口正反闭合（无边界缺陷、不修代码）；页面双根因修复+内置浏览器像素补采（零 [object Object]、768 字段完整）；链长按边计数与护栏实例口径两处确证缺陷最小修复并有恰4跳成功/999+2 拒绝等正反断言；在役影响按映射+受影响路径实跑原件闭合；封装可复算（exit/逐类计数/Nested/fixture/正确父实例/生命周期）。**自验通过，待规划按三级提示03 客观矩阵独立验收回执05 与 phase2-05 证据包。** Executor 不写功能 PASSED/COMPLETED、不核销 P、不移动方向到 passed/。
