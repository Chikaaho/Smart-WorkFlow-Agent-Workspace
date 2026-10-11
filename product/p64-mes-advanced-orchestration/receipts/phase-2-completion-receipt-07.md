# P64 阶段Ⅱ完成回执07（按提示05 五个父ID精确剩余账本收敛）

2026-10-11；Executor；XL（P64 阶段Ⅱ）。依据[复审06](planning-review-phase-2-06.md)与唯一执行入口[提示05](planning-execution-prompt-p64-phase2-05.md)（替代提示04 作唯一当前账本；旧提示与回执仅作锁定证据追溯），在既有完整实施授权内收口 5 个父ID精确剩余（P2-04a、P2-05b-A、P2-06a-C、P2-07b、P2-07b-G），追加本回执；证据树 [phase2-07](evidence/phase2-07/INDEX.md)（工具清点与 MANIFEST 见 §6）。已锁定子事实（复审04/05/06 §1）未重验；阶段Ⅱ保持 **VERIFYING**、P64 整体 IN_PROGRESS、阶段Ⅰ PASSED、阶段Ⅲ未验收；不写功能 PASSED/COMPLETED、不核销 P、不晋级基线。**本轮零业务代码改动**（无 Server/Web 代码提交；唯一 Server 变更=docs 焦点行批次）。

## 0. 对象与环境（不可变事实）

- 验证库 `smart_workflow_p64p2c`（PG 5432；Owner 服务 PID 32080=com.docker.backend 全程存活未动，只读 SQL 快照）；后端本轮=**local profile + `ch.dev.test-mock`（固定验证码 1234，登录零 OCR，admin/jia/yi 各 attempt=1）**+ 外置覆盖配置 `logs/p64p2h-r06/r06-local-override.yml`（复用，不入库）；spring-boot:run（展开类路径），构件 16:37:42 刷新（INSTALL_EXIT=0，`raw/gates/07-install.log`）。**启动方式纠偏一次**：首次误以 prod profile 启动（无 mock 验证码）→ 精确终止自身 31488 树（`raw/gates/07-profile-fix-restart.txt` 实际输出）→ local 重启（PID 34472）。
- 本轮新建对象（**全部终态 APPROVED**，`raw/db/07-ru-final3.txt`：本轮对象 **RUNNING=0/act_ru_task=0/act_ru_execution=0**）：
  - **最小使能**：父流程 def `2108817690357526529` 发布 **v5 = v3 版本快照图原样**（恢复 trg_child 触发器+等待节点=原派发语义；v3 快照 2108885353981132801，`raw/live/07-v5-publish.json`）。**状态变化如实登记**：P2-06b 的 v4 关闭事实（去触发器版本行/零意图原证/在役收敛原证）为历史锁定不动；v4 中途实例 ce4df356（07-dispatch-attempt1 留痕=运维通过后无派发）按 **v4 原义**复核收敛 APPROVED（def_version=4）。
  - 对1：父记录 83b273be（父实例 85498759，def_version=5）、甲 8a6709e8/4efceab8、乙 8a6709e7/510f4ad1；
  - 对2：父记录 dba606ee（8609fbf7）、甲 8a0608f6/c0db58a2、乙 8a0608f5/3fb90459；
  - 对3：父记录 2b3f7c48（5830a925）、甲 5c1dc1fd/693ffe98、乙 5c1dc204/c18dc07b。
- 旧→新ID登记（提示05 P2-04a）：旧对 8605eb3b/0fa51602（任务 c2085cf3/c2085cfb，已 discard 终态）追溯引用；乙 2426 失败原件（phase2-06 `raw/live/06-yi-complete-result2.json`）**原样保留、未由甲替代**。
- 取证通道：**本轮无浏览器会话**（无新 UI 主张；P2-04a 以 HTTP 请求/响应+命令+SQL 终态原件锁定；像素为回执06 锁定项）。

## 1. 逐项处置（ID → 实际结果 → 证据包）

### P2-04a 乙本人真实成功办理+必要反向 — `evidence/phase2-07/P2-04a.md`
- **KEY 正向（乙成功）**：乙以自身会话读自己被派发记录 510f4ad1（HTTP 200 code0）→ 节点表单授权来源行（3960da94）→ 合法完整载荷（与回执06 失败载荷区别：无未知字段、来源行取自本人子记录）→ `POST /workflow/commands/tasks/8a6709e7/complete` **HTTP 200 code 0**（`raw/live/07-yi-success.json` 含完整请求/响应）→ 命令 **COMPLETED**（2109204808439259137，create_by=乙）→ 子实例 APPROVED、批次项 WRITTEN、批次 SETTLED 2/2 block_reason=null；对2/对3 同构成功。归属接缝在新对象复现：**create_by=update_by=owner_id=各自办理人**（`raw/db/07-pair-records.txt`、`07-pair3-records.txt`，6 条新记录）。
- **必要反向（对象隔离判别，干净时序）**：乙对甲**活跃**任务 5c1dc1fd 发起 complete（HTTP 200 code0=受理）→ **命令执行 FAILED「无权处理该任务」**（create_by=乙，finished 17:01:57，`raw/db/07-reverse-cmd-final.txt`）→ **甲任务保持活跃** → 甲随后以自身载荷完成 code0（无业务效果证明）。前两次尝试（对1 并发 180ms、对2 命令分发延迟 16s）均 FAILED「节点已被处理」——**如实留痕、不当权限判别**（`raw/db/07-cmd-outcomes.txt`、`07-reverse-cmd-outcome.txt`）。
- 设计内同批写回版本冲突（甲先写回）出现 3 次，均 admin `retry-writeback` code0 → **SETTLED 2/2** → 复核 code0 → 父 APPROVED（`raw/live/07-pair-convergence.json` 等）——r04/r06 同款机制，非新缺陷。

### P2-05b-A 委托链源原文提取（工具导出，不重跑） — `evidence/phase2-07/P2-05b-A.md`
- 5 运行期方法（恰4边[77,88]/5边拒绝/DEPT orgQueries=0/跨租户/循环）+4 配置 case（自委托/同优先级歧义/循环链/超4跳配置）+2 helper（post/rule）**源原文带行号落 product**（`raw/source/07-05bA-delegate-test-source-excerpts.txt`，11 块；文件头含源路径/SHA256/提取命令/时间戳）↔ 锁定 XML testcase 名（FacadeImplTest 9/0、ServiceImplTest 5/0，phase2-05 原件 SHA 引用）逐项关联。源文件本轮零改动（SHA 与回执05 04-run-identity 一致）。

### P2-06a-C 根链护栏原安排/断言提取与最新实现关联 — `evidence/phase2-07/P2-06a-C.md`
- 四计数 case（L776-791/L795-808/L812-826/L830-842）+ rootBatch/waitingBatch helper + 竞争方法 `concurrentFreezeOnSameRootAdmitsAtMostOneAcrossLimit`（L316-343，断言 admitted==1/rejectedCount==1/rootOccupancySum==1000/rootBatchCount==2/零副作用）+ 8 个 helper + `freezeBatch` **L145 根行 FOR UPDATE（同一事务持有至提交）** 源原文落 product（`raw/source/07-06aC-rootchain-source-excerpts.txt`，16 块）。
- 关联：3341de5（当前 HEAD 业务代码）源 SHA ↔ 修复前(1001 双放行)/修复后(1允1拒/总额1000)竞争 XML 原证（phase2-06 raw/unit 保留）↔ **本轮 process 实测新鲜报告**（四 case XML tests=26、竞争 XML tests=1，SHA/时点逐类 `raw/gates/07-process-xml-per-class.txt`）。不重跑竞争实验；H2 MODE=PostgreSQL 层级如实。

### P2-07b 当前权威纠偏+Git — `evidence/phase2-07/P2-07b.md`
- knowledge 四入口（current-status 顶部新条目+旧条历史化、session-handoff L3、features p64 当前状态行、architecture L259）逐字段更新为**回执07 链**（含 386→384 更正、v5 使能登记、乙成功+无权反向）；回执07 链=复审06/提示05→回执07，Ⅰ PASSED/Ⅱ VERIFYING/Ⅲ 未验收/整体 IN_PROGRESS；功能 47、46/22/22=90、ADV64、问题 57、P63=COMPLETED、P62 延期/策略 OFF、gitlinks 保持。
- Server `功能清单.md` 焦点行滚动更新（docs 批次，旧行历史化）。
- memory 受影响字段：state.md 唯一下一动作 → **Planner 验收回执07**（handoff 指令性叙述保持原时点）；memory/todo/product 其余路由复用 Planner 复审06 同步回读。
- 三仓批次 Git：见 §5 与 `raw/git/07-three-repos-cutoff.txt`（提交/远端回读/gitlink 索引实值）。

### P2-07b-G 最终 process 实测+锚/Nested/COUNT+转录更正+自身结束 — `evidence/phase2-07/P2-07b-G.md`
- 最终 process **实测复算**：`MAVEN_OPTS="-Xmx2g" mvn -B -pl sw-biz/sw-bpm/sw-bpm-process -am test` @HEAD 7fffef9 → **EXIT=0、BUILD SUCCESS、384/0/0/0（77 XML）**（2026-10-11T16:30+0800，`raw/gates/07-gate-process-final.log`+`07-process-xml-per-class.txt` 逐类 SHA/时点+`raw/unit/process-final/` 77 份原件）。**回执06"386/78 净+5"更正**：残留件 `TaskActionCommandHandlerSerializationTest.xml`（mtime 2026-10-09，tests=2）污染求和 → **384/77、382→384=+2**（残留件移出留痕；v4 静默日志无汇总如实登记，不当作失败或成功）。
- **锚 8 类 56/0**：r04 幸存 XML（bootstrap target 71 件中 8 类）逐类身份/tests/fail/SHA前16/mtime（2026-10-10T23:19–23:20+0800）→ `raw/gates/07-anchor8-xml.txt`；**Nested 27/0**（BpmTodoControllerTest$×6+父0）本轮新鲜报告逐类行；**COUNT helper 原行**（waitingBatch L902-923/rootBatch L926-938，`raw/source/07-06aC-rootchain-source-excerpts.txt`）。
- **转录更正表**：证据树 phase2-06 实数 **72 文件/71 条目全 MATCH/MANIFEST 实含 INDEX**（尾注"不含 INDEX"系转录误差）；d594663 实为 **11 文件**（git show --stat，含 V107）；process 386/78→384/77；像素03 对象=**d08fa98e/033878c2**（非 877aa725）。
- **自身结束观察**：回执06 已登记 mvn 父 **40132**/后端 **42176**/vite **6608**/npm 父 **3924** 当前**已结束**（tasklist 实际输出"没有运行的任务匹配指定标准"×4，只查不杀）+ 8080/5173 零 LISTENING（2026-10-11T16:36:57+0800，`raw/gates/07-parent-process-end-observation.txt`）——补齐"父进程 40132 结束"缺口；本轮自身收尾=mvn 父 33732 树 taskkill //T //F 实际输出 3 行+零 LISTENING+三 PID 已结束+Owner PG 存活（`raw/gates/07-teardown-pids.txt`/`07-teardown-final.txt`）。

## 2. 本轮实际修改文件

- **工作区**：本回执、knowledge 四件（current-status/session-handoff/features p64/architecture）、证据树 phase2-07（本机留存，gitignored）；memory/state.md 唯一下一动作字段（工作树内更新，随 Planner 层提交节奏，见 §5 边界）。
- **Server（docs 批次）**：`功能清单.md`（焦点行滚动+旧行历史化）。
- **验证资产（不入库）**：`logs/p64p2h-r07/`（登录/派发对/完成/反向/收敛脚本、SQL 工具、XML 求和与源摘录提取工具、门禁与 teardown 日志）。
- **零业务代码改动**：Server/Web 无代码提交；未触发整套装工程测试（process 模块为 P2-07b-G 实测目标所需的最小有界运行）。

## 3. 门禁（本轮实跑）

| 门禁 | 结果 | 说明 |
|---|---|---|
| process test（唯一受影响模块补证） | **77 XML / 384/0/0/0，EXIT=0，BUILD SUCCESS** | @HEAD 7fffef9；engine 114/0、system-biz 365/0、form-biz 178/0、Web 四门为回执06 锁定值不重跑 |
| 锚 8 类（不重跑） | 56/0（r04 幸存 XML 逐类身份关联） | 零 bootstrap 域改动 |
| Web 四门（不重跑） | 回执06 锁定（0e/3w、1386+3、build✓） | 零 Web 改动 |

## 4. 与方向的偏差 / 遇到的问题 / 风险

1. **v5 发布（状态变化登记）**：P2-06b 的 v4 去触发器使新实例无法派发（07-dispatch-attempt1 留痕）；为建立提示05 要求的"最小乙分配目标"，以 v3 版本快照图**原样**发布 v5 恢复派发语义。v4 历史事实/原证/版本行不动；v4 中途实例按 v4 原义收敛 APPROVED。Planner 验收时如对 v5 状态另有裁决，按唯一终态值清单机械落实。
2. **反向两次未遂（如实）**：对1（乙命令与甲命令 180ms 并发）与对2（命令分发延迟 16s，甲先完成）均 FAILED「节点已被处理」——不构成权限判别；对3 以"乙命令 SQL 轮询至真终态后再动甲"的严格时序取得 **FAILED「无权处理该任务」** 干净判别。
3. **命令分发延迟**：乙反向命令受理后 ~16s 才执行（对2/对3 轮询实测）；对"接受≠执行"的命令语义，以命令终态+任务活跃性双原件锁定。
4. **admin token 中途过期一次**（pair3 首次运行 401 中止，未创建对象）→ 重新登录（attempt=1）后重跑成功。
5. **设计内同批写回冲突×3**：均甲先写回（0→1）致乙项 CONFLICT → admin retry → SETTLED——r04/r06 锁定的同款机制，顺带出现并收敛，不另立缺陷。

## 5. 自身收尾与 Git

- **对象清理**：本轮对象全部终态 APPROVED → `raw/db/07-ru-final3.txt` **RUNNING=0/act_ru_task=0/act_ru_execution=0**（>2026-10-11 16:30 窗口）；历史对象保留；Owner PG 未动。
- **服务收尾**：后端 mvn 父 33732 树精确 taskkill //T //F（实际输出 3 行：6668/34472/33732）→ 8080/5173 **零 LISTENING**（仅 TIME_WAIT 客户端套接字）→ 三 PID tasklist 已结束核实+Owner PG（32080）存活（17:04:55+0800，`raw/gates/07-teardown-final.txt`）；本轮无 vite、无浏览器会话。
- **三仓 Git**（普通批次提交推送授权内；提交后回读 `raw/git/07-three-repos-cutoff.txt`）：
  - Server：docs 批次（功能清单焦点行）→ feature/p64-mes-advanced-orchestration 推送读回一致（业务代码截止仍为 7fffef9=3341de5+docs）；
  - Web：无新提交（当前截止仍 `4333145`=origin，命令与状态在 cutoff 原件标注）；
  - 工作区 develop-sw：本批次（回执07+knowledge 四件）提交后回读；根索引 gitlink `78495dc`/`7af86f24` **保持不修改**（其"modified"实际值在 cutoff 原件如实登记）；Planner 层未提交文档（memory/todo/product-ready/提示05/复审06 等）保持工作树状态、不称已推送。

## 6. 证据树与自验结论

- 证据树 `evidence/phase2-07/`：5 包（ID→原件→实际结果→边界）+ raw/source(2)+raw/db(14)+raw/live(12)+raw/gates(11)+raw/unit/process-final(77)+raw/git(1)+INDEX+MANIFEST；文件计数/哈希以工具清点与 `sha256sum -c` 全量回读为准（结果见 INDEX 与本回执提交留痕）。
- 提示05 五个父ID逐项闭合：乙本人成功办理原件（2426 未被替代）+干净权限反向+v5 使能登记；委托链/根链源原文落 product 并与锁定 XML 及最新实现关联；最终 process 以实测 384/77 复算并更正 386/78 转录；锚 8/Nested/COUNT 以实际报告身份关联；转录更正表落档；自身父子进程结束以实际观察收口；knowledge/memory/清单按最新裁决一致并完成三仓批次 Git。**自验通过，待规划按提示05 客观矩阵独立验收回执07 与 phase2-07 证据包。** Executor 不写功能 PASSED/COMPLETED、不核销 P、不移动方向到 passed/。
