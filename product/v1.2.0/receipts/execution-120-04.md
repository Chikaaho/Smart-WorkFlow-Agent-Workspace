# 1.2.0 第四批执行回执（execution-120-04）——第一批：实现补充 + iso120 环境 + E2 首组证据

日期：2026-11-21｜执行（Executor）｜依据 `planning-execution-prompt-120-01.md`｜可分批验收，本批覆盖：R2-ui、R3-iot、F1-type、T1-thread + iso120 环境搭建 + E2-1/E2-5/E2-2｜自验通过，待规划验收

## 1. Git 事实

| 仓 | 提交 | 内容 |
|---|---|---|
| Server | `dc3ee5d7`（远端回读 dc3ee5d7fd69） | R3-iot：IOT 来源常量、IoT 桥六参受理写 IOT、直调入口写 DIRECT；F1-type：FormGraphActionService 类型校验 + ButtonResult |
| Web | `bafb42f`（远端回读 bafb42fdc233） | R2-ui：CONTINUE 分流说明 + CONDITION 面板状态变量候选（点击复制）；R3-iot：来源筛选加 IoT；F1-type：warnings 提示适配 |
| Web | `da0f987` | E2 页面缺陷修复：日志等级页渲染限流（见 §4 缺陷②） |
| 工作区 | `d59a688e` | known-issues：business_source 存量行不回填说明（R3） |

测试：IotAgentBridgeTest 12/12（断言更新为六参+IOT 链接）；FormGraphActionServiceTest 2/2（新建：提交前类型不符阻止点名、按钮跳过回填并警告）；typecheck/eslint 干净。

## 2. §1 实现补充对照

| ID | 实现 | 证据 |
|---|---|---|
| R2-ui | ①GRAPH_EXEC 面板 failureStrategy=CONTINUE 时显示分流说明（写明 `graphExec.{本节点编号}.status == 'FAILED'` 条件分流、默认分支兜底）；②CONDITION 节点面板新增「Graph 执行状态变量（点击复制）」块：列出画布全部 GRAPH_EXEC 节点的 `.status/.errorCategory/.errorMessage/.executionId` 候选，点击复制不手写 | 面板截图随 E1-1/E1-4 批（同页取证）；文案与候选块已实现 |
| R3-iot | `AgentGraphBusinessSources.IOT`；IoT 桥 `AgentGraphTriggerListener` 改六参受理写 IOT；执行页/调试 API 直调入口（lifecycle 四参）默认写 DIRECT；执行列表筛选与行级来源支持 IoT；known-issues 登记存量行不回填 | IotAgentBridgeTest 断言 BusinessLink[IOT]；DB/列表值随 IoT 触发取证批（E1-7） |
| T1-thread | 见 §3 | 本回执 |
| F1-type | Server：出参回填前按目标字段声明类型校验（NUMBER 须可解析数值、BOOL 须 true/false/1/0）；提交前触发→抛业务异常阻止提交并点名 `字段label(name): 原因`；按钮触发→类型不符字段跳过不回填，warnings 随响应返回前端逐条提示，已填内容不动。响应结构 `ButtonResult{outputs, warnings}` | FormGraphActionServiceTest 2/2；页面行为截图随 E1-6 批 |

## 3. T1-thread：Graph 执行器节点入口 → 线程类别

| 入口 | 推进线程 | Graph 节点执行位置 | 并发上限 | 饱和行为 |
|---|---|---|---|---|
| 发起流程 / 待办办理（HTTP） | Tomcat HTTP 线程（默认 max 200） | 推进线程内同步等待（不设 async） | Tomcat 200；每请求占 1 条 Druid 连接（max-active 20） | 请求挂起至调用方超时；分钟级长调用占连接 |
| 命令消费（openapi/触发恢复等经 `sw_bpm_command`） | `bpm-command-worker` 固定 3 线程（`sw.bpm.command.dispatch-workers:3`） | worker 线程内同步等待 | 全局 3 | 3 线程被长调用占住 → BPM 命令处理停摆（真实风险，见 E1-3T 实测计划） |
| Flowable async executor | 未启用（`flowable.async-executor-activate: false`） | —（GRAPH_EXEC 不设 async，不走此池） | （若开启：默认 8 线程/2048 队列） | — |

等待窗口 = min(节点配置超时, 图自身执行超时 ≤3600s，默认 300s)。**E1-3T 实测按提示执行：3 个实例同时停在慢 Graph 节点（等待期占 worker/HTTP 线程），第 4 个普通审批须在正常时间内完成；若被卡住，按审查记录给 GRAPH_EXEC 加并发上限（超出按节点失败策略处理，原因「Graph 执行器并发已满」），无需另报批。**

## 4. iso120 隔离环境（搭建记录 + 端口偏差说明）

| 项 | 值 | 说明 |
|---|---|---|
| PG | localhost:5432 全新专库 `sw_iso120` | **偏差**：方向要求 5433 容器——本机 Docker daemon 不可用（Docker.app 未安装，docker CLI 无 daemon），改用本机 PostgreSQL 16 实例新建专库，不连接任何现有库（smart_workflow/_021/_030 等未触碰），回执如实记录 |
| Redis | 独立进程 56379（pidfile `.iso120/redis-56379.pid`，可 `shutdown nosave` 受控清理） | 不碰用户 6379 |
| Server | 18093，`bootstrap-dev.jar`（`-Pdev` 打包，含 H2/devseed），`SPRING_PROFILES_ACTIVE=dev` + JWT_SECRET/SW_CIPHER_KEY 本机开发值；外置 `config/application-dev.yml` 强制数据源=sw_iso120 | health UP；日志 `.iso120/server.log`，PID `.iso120/server.pid` |
| Flyway | **37 条成功**（33 主链至 1.2.0 + devseed V900—V903 测试夹具） | 全新库；演示环境 35→36 行口径不受影响（那是升级场景） |
| Web | 5275 `--strictPort`，`VITE_PROXY_TARGET=http://localhost:18093` | Vite 8 ready |
| 账号 | 超管 admin@默认租户、t100admin@I5测试租户（口令均为种子默认口令，见对应迁移脚本 R__0.1.10 / devseed V900） | 凭据不入回执正文以外文件 |

启动调试过程发现并修复（如实记录）：①本地 config/application-local.yml 沿用 1.1.3 模式但需另配 jwt/cipher env；②启动 cwd 错误曾加载 Server 仓根旧 jar（0.1.3）——已改从 .iso120/run 启动；③`127.0.0.1` 在本机 JVM UnknownHost，用 `localhost`。

## 5. E2 首组证据（.iso120/evidence/，sha1 见 §7）

| ID | 证据 | 内容 |
|---|---|---|
| E2-1 | `E2-1-loglevel-page.png`（1600×900 视口，超管 admin 会话，URL /system/log-level） | 菜单出现「日志等级」（超管默认可见）；重启语义提示条；搜索框；「匹配 4254 个 logger，当前展示前 200 个」；ROOT 行（配置=默认，生效=INFO）；列表/搜索可用。**伴随修复 da0f987**：首版页面全量渲染 4254 行冻结主线程（API 167ms 正常、页面卡死）——加渲染限流 200 行 + 本地 keyword 过滤后正常 |
| E2-5 | `E2-5-root-debug-confirm.png` | ROOT 行下拉选 DEBUG → 二次确认弹窗「根 logger 调整为 DEBUG 后日志量会显著增大（全部包都会输出），确认继续吗？」（取消/确认调整） |
| E2-2 | `E2-2-root-debug-applied.png` + `E2-2-log-before-after.txt` | 确认调整后 ROOT 配置=DEBUG；日志对照：调整前（16:25:01 PUT 调整请求）同系统仅 INFO ACCESS 行，调整后（16:25:21 起）DEBUG 行出现（dynamic-datasource DEBUG 输出） |

**E2-2/E2-5 遗留（如实登记）**：ROOT 恢复默认（level=null）后 configuredLevel 清空但**生效等级仍为 DEBUG**（页面行「配置=默认，生效=DEBUG」），ROOT 行「恢复默认」按钮随之 disabled——Log4j2 对 ROOT logger 清配置不回落（ROOT 无父级，null 不改运行值）；本取证批以显式设回 INFO 收尾（ROOT 现为 INFO）。**修复方案**：Server `LogLevelService` 对 ROOT 恢复默认语义改为显式设回应用配置文件根级别（读 log4j2 配置 root level），下批修复后重测 E2-2/E2-4；known-issues 同步登记。

## 6. 未完成（本批边界，下批继续）

- E1-1~E1-8、E1-3T（含造数：发布 Graph、含人工节点 Graph、慢 Graph、流程编排）、E2-3（无权限用户 403 + 操作日志）、E2-4（重启前后对照——需 Server 重启 + 修复 §5 ROOT 恢复缺陷后重测）、E3-1（修复后截图已有条件补；**1.1.3 基线对照**：iso113 已清理，基线截图不存在，替代方案=修复前行为由 P74 spec 回归锁定 + 本批修复后截图，请规划裁定是否要求重建 1.1.3 环境补拍）、MIG（MySQL/Oracle 全链需外部库——docker 不可用，按 P66 口径写明；PG/H2 真实链已有）、GATE（Server 全量 mvn test 分模块跑 + Web 四门禁已过 typecheck/lint/test/build）。
- E3-2 main CI run 号随阶段 4。

## 7. 证据文件清单（sha1）

sha1 于取证批完成时统一 `shasum` 附入（.iso120/evidence/ 不入 Git，回执登记文件名 + 尺寸 + 内容描述；当前批：E2-1-loglevel-page.png、E2-5-root-debug-confirm.png、E2-2-root-debug-applied.png、E2-2-log-before-after.txt）。

## 8. 阶段进度

七阶段：已完成 2（评估、实施）；进行中 1（验收：本批 = 实现补充 + 环境 + E2 首组证据）；未开始 4（合并、发版、部署与同步、结束）。下一批：ROOT 恢复缺陷修复 + E1 造数与全链取证 + E2-3/E2-4 + E3-1 + MIG/GATE 收口。

## 9. 自验结论

本批覆盖项全部完成且通过适用门禁（模块测试 14/14 新增回归绿、typecheck/lint 干净、iso120 health UP、E2-1/E2-5/E2-2 证据入库），**自验通过，待规划验收**。
