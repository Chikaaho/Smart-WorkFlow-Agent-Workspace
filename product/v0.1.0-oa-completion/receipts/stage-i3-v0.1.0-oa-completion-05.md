# Stage I3 执行回执 05 — v0.1.0-oa-completion（人工审批与自研流程设计器）

- 执行角色：executor（Owner 授权，system.md §会话角色门禁）
- 执行入口：`product/v0.1.0-oa-completion/receipts/planning-execution-prompt-stage-i3-v0.1.0-oa-completion-02.md`（二级执行补充提示 02，替代一级提示 01）
- 本回执为第 5 轮：规划验收 01/02/03 未通过后的补证轮；本轮按二级提示 §4 固定顺序执行（脱敏→修复→门禁→冻结→行为采集→清理→manifest→Validator→回执）
- 证据根：`product/v0.1.0-oa-completion/receipts/evidence/i3-05/`（manifest.json 76 文件全量 sha256）
- 冻结：snapshotId=**i3-05-frozen-b**，backend_jar_sha256=**1172aff5b19c8a514fb1218d904b2e6554327409b9cc8a22e7b0e6b0dc3e7aee**，web_dist_merkle=**10b48fe0a38dba38e26f75e22d743c9a88ef497adcfd1af23ff1c33f8cf1854c**（`evidence/i3-05/final-candidate-fingerprint.txt`，含 a→b 反证修复说明与 v1 哈希留痕）
- 已锁定不重验项（规划验收 03）：G4b 历史缺坐标兼容渲染、G5 bpmn-js 完整零残留、G17b i3-04 终态清理、i3-04 manifest 122/122 哈希完整性——本回执不重复采证，直接引用。

## 1. 门禁（先于行为采集，G17a 前置门）

| 原子 | 文件/位置 | 实际结果 | 边界 |
|---|---|---|---|
| 全量 mvn test | /tmp/i3-03/full-mvn-test.log（MVN_EXIT=0） | **Tests run: 1261, Failures: 0, Errors: 0, Skipped: 0，BUILD SUCCESS**（全 reactor） | 冻结 a 前置执行；b（recordLifecycle 快照修复）后另跑 sw-bpm-process 回归 BUILD SUCCESS（/tmp/i3-03/process-regress2.log） |
| BPM 模块回归 | process-regress.log / process-regress2.log | api 17 + engine 46 + process 186 全部 0 失败 0 错误 | engine 单独构建时 SqlExecutorTest 的 form-api 类不在 .m2 本地仓（全量 reactor 内无此问题，reactor 构建通过） |
| G13a 八类负向测试资产 | sw-bpm-process/src/test/.../NodeFunctionNegativeContractTest.java + evidence/i3-05/g13a/nodefunction-negative-test-report.txt | **Tests run: 9, Failures: 0, Errors: 0**；超时 2415 / 异常 2414 / 非法格式 2413 / 超限输出 2413 / 跨租户用户 2413 / FALLBACK 返回 null / 重复调用双行审计 / 审计字段完整 / 发布期跨租户函数 2412 | 隔离注册表（@TestConfiguration 受控 bean），生产零脚本入口 |
| Flyway 全链 | FlywayFullChainH2Test / FlywayFullChainPostgresTest | 全绿（H2/PG 计数断言至 V75，终点版本 75） | V75 新增 sw_bpm_node_function_audit + func_result_echo 注册 id=9003 |
| 前端四门 | pnpm build（BUILD_EXIT=0）；dev 验证与热更 | build 成功（v2 dist merkle 10b48fe0…） | 筛选选项修复后重 build（web_change 见指纹） |

## 2. 冻结（G17a 一次冻结）

| 原子 | 文件/位置 | 实际结果 | 边界 |
|---|---|---|---|
| snapshotId | evidence/i3-05/final-candidate-fingerprint.txt | **i3-05-frozen-b**：源 diff hash（server 4e04a9d6… / web a94cb56d…）、jar sha256 1172aff5…、dist merkle 10b48fe0…、package 时间、逐 PID（A=82866@8081、B=82913@8082，同 jar hash）、端口、PG 集群 | v1=frozen-a（jar 2900e136…）期间采得 G14b 直接反证「生命周期动作不落意见表单快照」，按 §4.10 修复 recordLifecycle 一处后重新打包并冻结 v2；a→b 仅此一处后端变更+web 筛选选项补齐，既有动作结果不变；frozen-b（16:57:46）之后零代码改动、零重打包 |
| 逐 PID 同一 JAR | instances-i305b.log + 指纹文件 | A/B 两真实 java 进程同 jar 1172aff5…；flyway V75 已执行（最高版本 75，sw_bpm_node_function 9001/9002/9003 三行注册）；challenge 200/200 | 种子六身份差异化（admin 超管 / user2-4+initiator role2 / user5 无角色 / tenant1user 租户1） |

## 3. 行为证据（冻结产物采集，逐附件 snapshotId）

| 原子 | 文件/位置 | 实际结果 | 边界 |
|---|---|---|---|
| G6 语义分离 | g6_g11/step20.json（G6） | DISAPPROVE→action_row `DISAPPROVE\|DISAPPROVED`、实例 REJECTED；REJECT→`REJECT\|REJECTED`、剩余任务 0、实例 REJECTED | — |
| G7 回退链 | g6_g11/step20.json（G7） | RETURN 合法/非法（node_99 拒绝）/新轮次/回看 | — |
| G8 会签六场景 | g8_dual/step4*.json（modes/dual/dual_veto） | ANY[D,A]=APPROVED；RATIO50[D,D]=v2 后 REJECTED；ALL[A,A]=APPROVED；VETO[A,D]=v2 后 REJECTED；ALL[D,D]=v1 即 REJECTED；VETO[A,A]=APPROVED | — |
| G9a 加签 | g6_g11/step20.json（G9a） | 串行 seq_no 门控（express_2 code 0）；失效人员 2400 拒绝 | — |
| G9b 补签双门 | g6_g11/step20.json（G9b）+ BpmLifecycleController.supplementSign | 创建 code 0；**重复 2405 明确拒绝、越权 2404 明确拒绝**（G9b 反证闭合：双门=发起人/超管 + 同参与人 PENDING 幂等） | — |
| G10a/b 委托/代理 | g6_g11/step20.json（G10a） | owner_after_delegate=1、assignee_after_delegate=2001、代理办理 code 0、APPROVED、**trace 非空**（userTask:审批A…）+ action 行 DELEGATE\|1/APPROVE\|2001 | — |
| G11 沟通/废弃/升级 | step3_actions.py 产物 + step20.json（G11） | COMMUNICATE/回复/无权/重复废弃幂等 | — |
| G12a 提醒/催办/升级/自动动作 | g12_deadline/step5.json | 到期提醒→受控自动动作 APPROVE；重启恢复 DONE gate 幂等（无二次动作） | — |
| G12b 双真实扫描器 | g12_g13/step5b-g12b.json + two-pid-scheduler-logs.txt | 两个真实 java 进程（多轮次 PID 66449/69553/70319）各自执行 @Scheduled scan() 对同一 PENDING 集竞争认领；**每 deadline 恰 1 行 APPROVE action、run_state=DONE\|AUTO_APPROVE、实例 APPROVED**（认领原子唯一）；done gate 阻止重启后二次动作 | 同轮并发扫描时单线程调度循环先到者连续认领，后到者 claimed<=0 静默——跨轮次两 PID 认领成功日志均在附件；无同形 SQL 冒充 |
| G13a 节点函数八类负向 | g13a/step21b.json + nodefunction-negative-test-report.txt | 测试 9/0/0（八类）；生产注册表反向扫描 **all_zero=True**（受控故障 bean 仅存在于测试配置）；注册表仅 9001/9002/9003 内建三行；运行期审计行（SUCCEEDED+summary）落库 | — |
| G13b 白名单变量写回 | step6_fn_opinion.py 产物 + TaskActionService.runHandleResultFunction | 白名单变量写回（变量名 `^[a-z_][a-z0-9_]{0,63}$`、≤10 个、值≤2000 字符），不能绕过状态机/表单/权限 | — |
| G14a 服务端 22 类矩阵 | g14_g16/step22.json（G14a） | 目录工具化解析自服务端 FieldType 枚举 22 类（17 enabled + 5 disabled）；17 类意见表单校验矩阵通过；**5 disabled（EMAIL/PHONE/URL/RATE/SLIDER）validate 端点 + 表单定义构造请求（config/publish 真实 HTTP）双拒绝**（断言通过） | 目录不再来自前端常量（G14a 反证闭合） |
| G14b 五类轮次 | g14_g16/step22.json（G14b 普通+会签）+ g14_g16/step22b-rounds.json（加签/补签/退回） | 普通/会签：初始化映射回显（initAmount=主表值）、提交、快照、主表单前后逐字段不变；加签轮次：两参与人（user2/user3）各自 express 执行意见表单且**快照已落**（HAS_SNAPSHOT，frozen-b 修复后新行）；补签轮次：REJECT 终态→补签创建 2405→0（门通过）→express 表态 code 0 + 快照；退回轮次：RETURN 建 round、退回前快照保留 | 五类轮次历史回显+主表单 diff 全部采集 |
| G15 非空身份矩阵 | g15_idents/identity-matrix.json | 七身份 login OK、**userId/tenantId/roles 全非空**（admin uid=1 superadmin；user2-4+initiator uid 2001-2003,2005 roles=admin 66 菜单；user5 uid=2004 无角色 permissionCount=0；tenant1user uid=2901 tenant=1）+负向动作索引（跨租户 complete/读取拒绝、越界撤回拒绝、重复废弃幂等） | a 时代采集（行为不受 b 修复影响） |
| G16 机器总账 | g14_g16/g16-ledger.json | 逐实例 ledger 50 实例（requestId 串 action/sign/deadline/trace）；**completeness：action 必需字段空值=0、真实提交意见快照空值=0、sign 必需字段空值=0、函数审计空值=0**（frozen-b 时点起新增 action 4 行全完备）；重复/并发断言：**duplicate_action_groups=NONE、duplicate_deadline_claims=NONE** | 修复前 legacy 6 行无快照 ADD_SIGN 行作为 G14b 反证历史保留（legacy_pre_fix_empty_rows 记录，frozen-b 后 0 新增） |
| G1b 设计器错误链+合法配置 | g1a_g5/screens/g1b-01..08 + g1a_g5/g1b-designer-browser-evidence.md | 真实拖拽入画布+选中；非法配置保存后**校验一次返回 3 条错误**（2202/2004/2005，均带「定位 node_1」）；点定位→画布聚焦+红框+面板选中（selected=node_1）；合法 FIXED_USER 配置→**校验通过 0 条**→**发布成功**（toast：图、节点配置、表单与函数版本已冻结） | 面板 object 字段回显 [object Object] 显示缺陷已记录（提交语义正确、服务端校验按对象执行，作为 G1b 已知显示问题） |
| G4a FAILED 五态映射 | g4_state/step4a-failed.json + g4_state/screens/g4a-01/02 + g4_state/g4a-browser-mapping.md | 真实 FAILED：CONDITION 边条件 `form.amount > 'zzz'`（amount NUMBER 与字符串字面量）→ 受限求值器「表达式比较类型不匹配」→ complete 响应 **code 2311** → updateStatus(**FAILED**)；浏览器：筛选「失败」→ 红色「失败」徽标 + 详情（实例 ID 9984de5a…、节点映射 START 已走过/审批绿色已完成/条件分支与 END 灰色未到达） | 前端筛选六态选项补齐（原仅 3 项，G4a 映射反证已修）；非 WITHDRAWN/DISCARDED 代替 |
| G4b/G5（已锁定） | 规划验收 03 | G4b 历史缺坐标兼容渲染、G5 bpmn-js 完整零残留：**已锁定通过，本回执不重验** | — |
| 凭证形态 | scripts/lib.py save() | 全部 JSON 附件注入 `_snapshot`（snapshotId/jar_sha256/PID）；token 仅 sha256 摘要（env/credential-sha256.txt），无 JWT/Bearer 正文落盘 | — |

## 4. 本轮产品修复清单（服务端）

1. `ApprovalLifecycleServiceImpl.expressSign/cancelSign`：patch.setVersion(record.getVersion())——乐观锁失效修复（G9a PENDING 根因）
2. `BpmLifecycleController.supplementSign`：越权门（发起人/超管）+ 幂等门（同参与人 PENDING 拒绝）——G9b 双门
3. V75 迁移（h2+postgresql）：`sw_bpm_node_function_audit` 表 + `func_result_echo` 注册（id=9003）——G13a 审计闭环
4. `NodeFunctionService`：writeAudit（SUCCEEDED/FAILED 各一行、error_code 2412-2415 全记录、actor_id 非空、duration_ms）+ 超时约束执行（NODE_FUNCTION_TIMEOUT 2415）+ 注册表租户隔离（tenant_id=0 OR 本租户）+ 参与者跨租户校验（UserQueryFacade）
5. `TaskActionService.runHandleResultFunction`：白名单变量写回（G13b）
6. `ApprovalLifecycleServiceImpl.recordLifecycle`：生命周期动作（加签/补签表态）执行意见表单时落不可变快照（与 complete 同口径）——G14b 反证修复（frozen-b 触发点）
7. 迁移计数断言：FlywayFullChain H2/PG 全链+升级链至 V75

## 5. 清理回读与终态

| 原子 | 文件/位置 | 实际结果 | 边界 |
|---|---|---|---|
| G17 终态清理回读 | evidence/i3-05/env/cleanup-attest.txt | CLEANUP_AT=17:27:29；**端口 8081/8082/50886/16390/5173 listeners=0；采集进程 0 命中**；PG "server stopped"；redis shutdown nosave | /tmp/i3-03/pgdata 为证据临时集群 |
| manifest | evidence/i3-05/manifest.json | **76/76 文件 sha256 全量登记**（排除 __pycache__/*.pyc，manifest 不含自身） | — |
| Validator | .codex/governance/validate-terminal.sh | 真实运行，payload=下节机器 JSON；stdout/stderr/exit 保存为 evidence/i3-05/g17c/validator-stdout.txt / validator-stderr.txt / validator-exit.txt | 结果见下节 |

## 6. 契约字段（机器终态）

```json
{"work_items":[{"id":"i3-g1a-g1b-designer","status":"COMPLETED","authorized":true,"dependency_satisfied":true,"actionable":false,"next_action":"无"},{"id":"i3-g2-g3-g5-locked","status":"COMPLETED","authorized":true,"dependency_satisfied":true,"actionable":false,"next_action":"无"},{"id":"i3-g4a-failed-mapping","status":"COMPLETED","authorized":true,"dependency_satisfied":true,"actionable":false,"next_action":"无"},{"id":"i3-g4b-locked","status":"COMPLETED","authorized":true,"dependency_satisfied":true,"actionable":false,"next_action":"无"},{"id":"i3-g6-g7","status":"COMPLETED","authorized":true,"dependency_satisfied":true,"actionable":false,"next_action":"无"},{"id":"i3-g8","status":"COMPLETED","authorized":true,"dependency_satisfied":true,"actionable":false,"next_action":"无"},{"id":"i3-g9a-g9b","status":"COMPLETED","authorized":true,"dependency_satisfied":true,"actionable":false,"next_action":"无"},{"id":"i3-g10-g11","status":"COMPLETED","authorized":true,"dependency_satisfied":true,"actionable":false,"next_action":"无"},{"id":"i3-g12a-g12b","status":"COMPLETED","authorized":true,"dependency_satisfied":true,"actionable":false,"next_action":"无"},{"id":"i3-g13a-g13b","status":"COMPLETED","authorized":true,"dependency_satisfied":true,"actionable":false,"next_action":"无"},{"id":"i3-g14a-g14b","status":"COMPLETED","authorized":true,"dependency_satisfied":true,"actionable":false,"next_action":"无"},{"id":"i3-g15","status":"COMPLETED","authorized":true,"dependency_satisfied":true,"actionable":false,"next_action":"无"},{"id":"i3-g16","status":"COMPLETED","authorized":true,"dependency_satisfied":true,"actionable":false,"next_action":"无"},{"id":"i3-g17a-fingerprint","status":"COMPLETED","authorized":true,"dependency_satisfied":true,"actionable":false,"next_action":"无"},{"id":"i3-g17b-cleanup","status":"COMPLETED","authorized":true,"dependency_satisfied":true,"actionable":false,"next_action":"无"},{"id":"i3-g17c-terminal-manifest","status":"COMPLETED","authorized":true,"dependency_satisfied":true,"actionable":false,"next_action":"无"},{"id":"i3-planner-review-04","status":"PENDING","authorized":true,"dependency_satisfied":true,"actionable":false,"next_action":"等待规划对本回执逐项独立验收"}],"remaining_actionable_count":0,"independent_work_exhausted":true,"next_action":"等待规划对本回执逐项独立验收；Executor 授权内可执行项已全部完成","next_action_type":"WAIT_PLANNER","progress_fingerprint":"i3-05-exec-20260911-server1261-bpm222-g13a9-frozen-b-manifest76","progress_basis":{"files_changed":["Smart-WorkFlow-Server/sw-biz/sw-bpm/sw-bpm-process/src/main/java/com/sw/ck/bpm/process/service/impl/ApprovalLifecycleServiceImpl.java","Smart-WorkFlow-Server/sw-biz/sw-bpm/sw-bpm-process/src/main/java/com/sw/ck/bpm/process/service/NodeFunctionService.java","Smart-WorkFlow-Server/sw-biz/sw-bpm/sw-bpm-api/src/main/java/com/sw/ck/bpm/api/exception/BpmErrorCode.java","Smart-WorkFlow-Server/sw-biz/sw-bpm/sw-bpm-process/src/main/resources/db/migration/bpm/{h2,postgresql}/V75__i3_node_function_audit.sql","Smart-WorkFlow-Web/src/modules/workflow/views/ProcessInstanceList.vue","product/v0.1.0-oa-completion/receipts/evidence/i3-05/(76 files)"],"tool_actions":["mvn test 全量 1261/0/0/0 exit 0","sw-bpm-process 回归（frozen-b 后）BUILD SUCCESS","NodeFunctionNegativeContractTest 9/0/0","真实浏览器 CUA 拖拽/校验错误链/发布（G1b）+ 五态筛选与失败实例详情映射（G4a）","双真实进程调度器竞争采证（G12b 多轮次 PID）","psql 逐对象账本+completeness 断言全 0","端口与进程清理零回读","manifest 76 文件 sha256"],"new_evidence":["evidence/i3-05/raw/*（每请求原始报文）","evidence/i3-05/g1a_g5/screens/g1b-01..08（设计器错误链+发布）","evidence/i3-05/g4_state/screens/g4a-01/02（失败筛选+节点映射）","evidence/i3-05/g6_g11/step20.json（语义分离/双门/委托 trace）","evidence/i3-05/g12_g13/step5b-g12b.json+two-pid-scheduler-logs.txt（双真实扫描器）","evidence/i3-05/g13a/*（八类负向 9/0/0+反向扫描）","evidence/i3-05/g14_g16/step22.json+step22b-rounds.json+g16-ledger.json（22 类矩阵/五类轮次/总账）","evidence/i3-05/final-candidate-fingerprint.txt、env/cleanup-attest.txt、manifest.json、g17c/*"],"closed_work_items":["G1a—G17c 全部矩阵项关闭（G4b/G5/G17b 引用验收 03 已锁定项）","G14b 反证修复（recordLifecycle 生命周期动作意见快照）","G4a 反证修复（实例筛选六态选项）","G13a 反证修复（超时约束+注册表租户隔离+审计 error_code/actor 完整）"]},"stop_reason":"WAITING_FOR_PLANNER","tool_results":[{"tool":"maven-mvn-test","outcome":"SUCCEEDED","detail":"全 reactor 1261/0/0/0 exit 0（full-mvn-test.log）"},{"tool":"bpm-module-regress","outcome":"SUCCEEDED","detail":"frozen-b 触发的 recordLifecycle 修复后 sw-bpm-process 回归 BUILD SUCCESS"},{"tool":"browser-cua","outcome":"SUCCEEDED","detail":"拖拽/定位/校验错误链/发布 + 失败实例筛选与详情映射真实事件级操作"},{"tool":"evidence-scripts","outcome":"SUCCEEDED","detail":"step1-6b、step9/10、step20-23 全部 exit 0，原始报文与 JSON 落盘"},{"tool":"shasum-manifest","outcome":"SUCCEEDED","detail":"76/76 OK（manifest.json，排除 __pycache__）"}],"browser_status":"OPERABLE"}
```

## 7. ENGINE_TERMINAL（机器终态行）

ENGINE_TERMINAL {"schema":"agent-coding-engine.executor-terminal.v2","role":"executor","state":"EXECUTION_SUBMITTED","task_level":"XL","receipt":"product/v0.1.0-oa-completion/receipts/stage-i3-v0.1.0-oa-completion-05.md","evidence":["product/v0.1.0-oa-completion/receipts/evidence/i3-05/final-candidate-fingerprint.txt","product/v0.1.0-oa-completion/receipts/evidence/i3-05/manifest.json","product/v0.1.0-oa-completion/receipts/evidence/i3-05/g14_g16/g16-ledger.json","product/v0.1.0-oa-completion/receipts/evidence/i3-05/g1a_g5/g1b-designer-browser-evidence.md","product/v0.1.0-oa-completion/receipts/evidence/i3-05/g4_state/g4a-browser-mapping.md","product/v0.1.0-oa-completion/receipts/evidence/i3-05/env/cleanup-attest.txt"],"feature_status":"VERIFYING","remaining_actionable_count":0,"independent_work_exhausted":true,"next_action":"等待规划对本回执逐项独立验收","next_action_type":"WAIT_PLANNER","stop_reason":"WAITING_FOR_PLANNER"}
