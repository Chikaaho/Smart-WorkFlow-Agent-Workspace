# BF20261019-01/02/03 实现回执：判断脚本 worker 修复与动态参与人端到端验证

- 日期：2026-10-19
- 分支：Server `fix/bpm-script-worker-launch`（自 develop 建立），批次提交 `b18697e` + `6d7f951`（均已推送，远端 SHA 回读一致）
- 台账：`product/bugfix-20261019/bug-ledger.md`
- 阶段：总 7 阶段（§3.0）＝1 评估完成、2 执行完成（本文回执）、3—7 未开始（3 验收同步、4 develop→main、5 发版〔版本待 Owner 确认〕、6 发布后同步、7 结束）

## 1. 修改内容（Server 8 文件，+386/−45）

| 文件 | 摘要 |
|---|---|
| `sw-bpm-engine/.../script/WorkerLaunchPlan.java`（新增） | BF20261019-01：worker 拉起计划解析——显式覆盖（系统属性/环境变量）＞fat jar 形态（`PropertiesLauncher` + `-Dloader.main` 在归档内拉起，前置校验 launcher 类存在）＞exploded 原语义；嵌套 URL 解析循环剥离组合协议前缀（真实形态 `jar:nested:…`）与尾斜杠 |
| `sw-bpm-engine/.../script/ScriptWorkerPool.java` | spawn 接入拉起计划并记录 `codeSource=`/`launch: source=…`；启动握手上限配置化 `sw.bpm.script.worker-startup-timeout-ms`（默认 30000）；握手失败区分「进程提前退出（exitCode）」与「无就绪应答（超时）」 |
| `sw-bpm-engine/.../script/BpmScriptRunner.java` | BF20261019-02：新增共享 `Engine` 构造与 `warmUp()`；脚本包裹改匿名函数表达式（共享 Engine 下具名函数声明会跨 Context 泄漏 `__p64Handle__`，单测实锤后修正） |
| `sw-bpm-engine/.../script/ScriptWorkerMain.java` | worker 启动先预热（共享 Engine + 平凡求值）再发 `__ready__`；预热失败 ready=false+errorMessage |
| `sw-bpm-process/.../TriggerExecutionService.java`、`BpmTriggerController.java` | BF20261019-03：判断超时改配置 `sw.bpm.script.timeout-ms`（默认 5000，沿用主方向 §3.5），三处调用点替换硬编码常量；字段缺省兜底非 Spring 构造 |
| 测试：`WorkerLaunchPlanTest.java`（新增）、`BpmScriptRunnerTest.java` | 拉起计划解析（覆盖优先/原语义/三种嵌套 URL 形态/launcher 条目探测）；共享 Engine 预热＋上下文零残留 |

## 2. 验证（证据摘录，原始日志本机留存）

**测试门**（`MAVEN_OPTS="-Xmx2g" mvn -q test`，2026-10-19）：

- `sw-bpm-engine`：全模块 34 个测试类全绿（含 ScriptWorkerPool 9、BpmScriptRunner 13、WorkerLaunchPlan 5）。
- `sw-bpm-process`：419/0/0。
- `sw-bootstrap`：312 中 1 失败＝`Phase4PgStartWindowCrashTest.scheduledFlowWindowCrashRecoversToExactlyOnce`（期望 1 实得 0）——**归因证据：干净 develop 基线（stash 本修复后）同断言同形态失败**（两次 236.7s/237.1s），属 known-issues 已登记 REG-P63-Phase4CrashTest 时序项；等效替代门 `P63FlowAdmissionRecoveryPgTest` 本轮通过。首轮全量曾在 bootstrap 报 42 个装配错误（`BpmScriptRunner` 双构造器破坏隐式注入），已修复（单参构造器标 `@Autowired`）并复跑收敛到上述唯一已知项。

**真实 fat jar 行为链**（本机打包 `bootstrap.jar` 218,051,630 B，prod profile + 一次性空库 `sw_scriptfix_probe`（Flyway 全链 0.1.7＋演示种子 22.2s），验证后已 DROP）：

1. **worker 拉起**：宿主日志 `launch: source=fat-jar, mainClass=org.springframework.boot.loader.launch.PropertiesLauncher, classpath=…/bootstrap.jar`——真实排障迭代三轮：①初版 `nested:…` 尾斜杠致 `isRegularFile` 误判（exploded 回退→老失败路径复现）；②真实 codeSource 为组合前缀 `jar:nested:…bootstrap.jar/!BOOT-INF/lib/sw-bpm-engine…jar!/`，单次顺序剥离失效（新增真实字符串直测复现→循环剥离修复）。
2. **脚本执行**：灾备演练同构流程（表单选部门→`PROCESS_START` 触发器脚本 `#获取流程变量('var_drill_depts')`→逐部门 `#获取分管领导`→`#设置流程变量('deptSupervisors', out.slice(0))`→EXPRESSION 参与人 `variables.deptSupervisors`）。触发器执行记录 `MATCHED / BOOLEAN=true / branch=b_ok / durationMs=57ms`（修复前同环境为 worker 无法启动或冷启动超时）。
3. **语法糖语义两连（真实排障，已写入口径）**：裸标识符参数按名字字符串加引号——`#获取分管领导(d)` 收到 `"d"`、`#设置流程变量('k', out)` 落库 `"out"`（node_2 受理人一度为字面量 `"out"`）；按既有语义改表达式传参后闭环。
4. **端到端（实例 20261019-006，processInstanceId `cece04ea-cbc5-…`）**：node_1 动态并行按表单部门 91002 派 李强（91103）；node_2「分管领导审批（脚本解析）」受理人 **91101 张伟**（纯脚本解析，节点配置零写死）；node_2 办理选「通过，建议补充」；实例 `APPROVED`，抄送送达。审批意见表单数据（`GET /workflow/instances/{id}/node-form-data`）：node_1＝`{"field_1":"1"}`（选「通过」备注隐藏未落值）、node_2＝`{"field_1":"2","field_2":"分管领导意见：…"}`（选 2 备注必填落库）。
5. 探针中间产物（实例 001—005：worker 失败/`"out"` 受理人等）已逐一 `discard`，一次性库已删除，本机探针密钥文件已删除。

## 3. 偏差与风险

- 业务配置在**本地**闭环；**UAT（0.1.8 制品）仍带此缺陷**——修复生效需部署含本修复的构建（§3.0 第四—六步，版本号待 Owner 确认）；UAT 灾备演练流程 v5（node_2 改 EXPRESSION + 触发器）已备好脚本（本机 `sw-scriptfix-e2e-20261019/uat-v5-config.mjs`），待部署授权后执行。
- `sw-bootstrap` 唯一失败为已登记时序项（develop 基线同因复现），未改断言未弱化；CI 复验随发布链走。
- 设计器 UI 的参与人策略下拉未暴露 FORM_FIELD/EXPRESSION（`ProcessDesigner.vue` 过滤），本轮配置经 API 完成；UI 补齐属功能需求，不并入本缺陷批次。

## 4. 自验结论

三条缺陷全部修复并在真实 fat jar 形态闭环验证；Owner 的业务口径（参与人从表单字段动态解析、体现脚本能力、无需按部门集发流程版本）已在本地达到。剩余 UAT 复验与发布依赖 Owner 版本确认与部署授权。
