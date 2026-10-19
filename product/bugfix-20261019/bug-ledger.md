# 持续修复问题台账（bugfix-20261019）

2026-10-19｜Owner 指令：流程参与人必须从表单字段动态解析，审批节点配置写死用户/部门没有业务意义（"部门一多是不是每发起一个流程要发一个流程版本"）；前期版本交付的脚本能力（触发器 GraalJS + `#获取分管领导/#设置流程变量` + EXPRESSION 参与人）正是为该场景而建，执行会话报告"脚本无法运行"即为缺陷，走 bug 修复流程（"这样业务根本不达标，你说的这些全都是bug，走bug修复流程"）。

## 缺陷清单（本轮登记）

> 状态更新（2026-10-19 实现回执）：三项缺陷已修复并本地闭环验证，见 `receipts/bf20261019-script-worker-01.md`；Server 分支 `fix/bpm-script-worker-launch`（`b18697e`+`6d7f951` 已推送回读一致）。UAT 生效待部署含修复的构建（版本待 Owner 确认）。

| ID | 缺陷 | 根因 | 修复 | 状态 |
|---|---|---|---|---|
| BF20261019-01 | fat jar 部署下判断 worker 无法启动（`Could not find or load main class …ScriptWorkerMain`），触发器/节点脚本全链不可用；UAT 只能靠运维手工解包 211MB + `SW_BPM_SCRIPT_WORKER_CLASSPATH` 环境变量绕过 | `ScriptWorkerPool.Worker.spawn` 用宿主 `java.class.path` 作 worker `-cp`；Spring Boot fat jar 下该属性只有 `bootstrap.jar` 一个条目，`ScriptWorkerMain` 在 `BOOT-INF/classes` 内对 `-cp` 不可见 | `WorkerLaunchPlan` 按宿主运行形态解析拉起计划：fat jar 形态经 `-cp bootstrap.jar -Dloader.main=… PropertiesLauncher` 在归档内拉起（PropertiesLauncher 将 `BOOT-INF/classes`+`BOOT-INF/lib/*` 并入类路径，无需解包；前置校验 launcher 类存在，缺失给出可诊断错误）；exploded/测试形态语义不变；显式覆盖仍最高优先。真实制品排障追加两处修复：嵌套 URL 尾斜杠、组合协议前缀（`jar:nested:`）循环剥离 | **已修复（本地 fat jar 实证：`launch: source=fat-jar`，worker 正常执行）** |
| BF20261019-02 | worker 首个脚本必超时（UAT 实测平凡 `return 1;` 也超时，worker 被强制销毁→每次执行都冷启动，脚本链路事实上不可用） | `ScriptWorkerMain` 在 GraalJS 语言初始化**之前**发送 `__ready__` 握手；首个真实判断支付全部冷启动，慢宿主上超出固定 5s 预算 | worker 启动先预热（进程内共享 Polyglot `Engine` + 平凡脚本求值）再握手，冷启动成本只付一次；连带修复共享 Engine 下具名函数声明跨 Context 泄漏（`eval("function __p64Handle__…")` 改匿名函数表达式，不落全局绑定）；宿主启动握手上限放宽并配置化（`sw.bpm.script.worker-startup-timeout-ms`，默认 30000） | **已修复（本地 fat jar 实证：触发器首判 57–88ms）** |
| BF20261019-03 | 判断执行超时 5000ms 硬编码（`BpmScriptEvaluatePort.DEFAULT_TIMEOUT_MS` 三处调用点写死），慢宿主无法调参 | API 常量被调用点直接引用，无配置面 | 新增 `sw.bpm.script.timeout-ms`（默认 5000，沿用主方向 §3.5 口径）；`TriggerExecutionService`（触发器/映射脚本两处）与 `BpmTriggerController`（预览）改注入值，字段缺省兜底非 Spring 构造 | **已修复** |

## 业务达标口径（Owner 2026-10-19 指令的验收面）

- 审批节点参与人不得写死：流程图级 `PROCESS_START` 触发器脚本读取表单所选部门（`#获取流程变量`），按 `#获取分管领导` 逐部门解析并集，`#设置流程变量('deptSupervisors', out.slice(0))`；`node_2` 参与人策略 `EXPRESSION`，值 `variables.deptSupervisors`——换部门/加部门**不需要新流程版本**。
- 脚本语法糖语义（写脚本必读，真实排障两连）：`#函数(参数)` 的**裸标识符按名字字符串处理**（自动加引号）；传运行时值必须写表达式：`#获取分管领导("" + d)`、`#设置流程变量('k', arr.slice(0))`。
- 验收链（本地已闭环，见回执）：真实 fat jar 启动 → 表单/流程发布 → 提交实例（选部门）→ 触发器 MATCHED（57ms）→ node_1 动态并行按所选部门派负责人 → node_2 参与人=脚本解析的分管领导（张伟 91101）→ 审批意见表单按显隐语义落库 → 全链 APPROVED → 抄送送达。
- UAT（0.1.8 制品）复验与发布：待 Owner 确认版本后按 §3.0 第四—六步执行；灾备演练流程发布 v5（同上配置）替换 v4 的 node_2 写死配置（配置脚本已备：本机 `sw-scriptfix-e2e-20261019/uat-v5-config.mjs`）。

## 进度

- 总 7 阶段（§3.0）：1 评估完成；2 执行完成（`receipts/bf20261019-script-worker-01.md`）；3—7 未开始（3 验收同步、4 develop→main、5 发版〔版本待 Owner 确认〕、6 发布后同步、7 结束）。
