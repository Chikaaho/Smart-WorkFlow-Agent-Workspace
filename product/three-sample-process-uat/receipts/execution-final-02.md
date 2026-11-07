# 执行总回执 02：三示例流程返修（G1—G6 / 0.3.0 同版本覆盖）

2026-11-07｜Executor｜依据 `receipts/planning-execution-prompt-three-sample-01.md`（唯一执行入口）｜返修版本号 **0.3.0**（Owner 已确认）

七阶段（整体）：总 7｜已完成 4（评估、执行-返修、合并、发版）｜进行中 1（发布后同步，随本回执批次落盘）｜未开始 2（规划验收、结束）。

## 1. G1：B 流程 Agent 驱动（UAT 实测两场景）

链路：IoT 阈值规则触发校园 Agent 图 → 查询近期流程记录（内部工具）→ 知识库检索（"校园活动与公告知识库"）→ LLM 生成检索词 → 联网搜索（外部工具，必应 RSS）→ LLM 研判 → 条件分支 → P1/P0 节点用内部工具"发起工单流程"自动发起 XY 流程，P0 另调"发送通知告警"通知负责人。两个实例的研判字段均只由 Agent 工具写入，无人工或 API 填写。

**场景①（知识库命中 → P1）**：南门注入 `visitor_flow=941` → Agent 执行 `2118895531709759489` SUCCESS，研判首行 `SPECIAL_EVENT`，依据引用知识库原文（"11 月 7 日全天南大门举办秋季招聘会与社团展示……941 人次可由此已报备活动解释"）；"发起工单流程"返回引擎实例 `2f60b14c-da54-11f1-8ed2-00163e0d142f` → 业务实例 `2118895602312478722`（XY-20261107-003），formData `activityAssessment=SPECIAL`、`recommendedPriority=P1`，实例停在 P1 节点（RUNNING）。

**场景②（无匹配 → P0 + 通知负责人）**：北门注入 `visitor_flow=517` → Agent 执行 `2118895639922802689` SUCCESS，研判首行 `NO_EXPLANATION`（知识库明确北大门无活动安排、联网检索无相关信息）；工单引擎实例 `41b9ce47-da54-11f1-8ed2-00163e0d142f` → 业务实例 `2118895730960171010`（XY-20261107-004），停 P0 节点（RUNNING）；站内信 IN_APP SUCCESS。为取得"每事件一条告警"的通知证据（见 §2 缺陷 6），补 `bizId` 后以北门 `visitor_flow=519` 重跑：Agent 执行 `2118903153368301569` SUCCESS → 实例 `2118903236847534081`，站内信 11:07:53 送达赵磊，收件箱截图见 `uat-shots-rework/rw-g1-zhaolei-notify.png`（顶部即本次告警原文：客流 519、NO_EXPLANATION、模板 bpm_e206b4fd2ed3427f）。

**节点轨迹原文留存**：`.runtime-030/rework-uat-e2e.json`（三执行 verdict/工具结果/实例 formData 摘要）；知识命中与联网搜索结果原文可通过执行节点接口回读（node_kb / node_search 输出已在上轮与本轮执行明细中验证，本轮回读样例：node_kb 命中"校园活动安排-2026秋季.txt"全天活动条款与"校门通行管理规范.txt"第 3、4 条）。

**来源纠正**：上轮回执把 UAT 的 XY-20261107-001/002 描述为"API 直传 formData 启动"，与本轮取证不符——实例 `2118777162222362626` 的引擎 ID 即 02:46:39 Agent 执行创建的 `70192b31-da12-11f1-8fc1-00163e0d142f`（createTime 02:46:55.106693 微秒级吻合），其 formData 为 Agent 研判文本。上轮链路实际已通，回执描述失实导致审查误判"G1 未跑"。本轮按 §1 两场景在新构建上重跑并留全链证据。

## 2. 新增缺陷修复（现象 → 根因 → 提交 → 测试）

| # | 现象 | 根因 | 修复 | 测试 |
|---|---|---|---|---|
| 1 | Agent/IoT/API 发起的实例详情页显示"表单数据暂时无法显示 / 暂未取到表单数据" | 详情链路按 `businessKey` 当表单记录 id 回查（`/form/data/{formKey}/{recordId}`）；程序化发起的实例 `businessKey` 是 UUID/`iot-*`，没有表单记录；实例变量里的 formData 引擎快照无人消费 | Server：我的实例详情与统一关系端点回传引擎历史变量中的 `formData`（与抄送详情同源；NONE 关系不回传）`a05fb7f4`；Web：`BusinessDetailDialog` 新增 `fallbackRecord` 回退（空对象不伪造空表单），我的实例页传详情 formData、关系端点 formData 兜底，`TaskDetail` 回退 `processVariables.formData` `c5eac9b` | Server 新增 2 用例（formData 回传/缺失不伪造，`BpmMyInstanceControllerTest` 13/13）；Web 新增 `BusinessDetailDialog.spec.ts` 4 例；Web 四连全绿（2026 通过/3 跳过）；Server 全量 **2413/0/0/32** |
| 2 | UAT 截图 `/agent/graph-defs`、`/form/app/manage` 404 | 截图脚本 URL 写错：Agent 图列表为菜单驱动路由 `/agent/graph-def`（sys_menu V26 行，`GraphDefList.vue`）；应用管理为 `/form/app-manage`（连字符）。前端无路由缺陷 | 重截两张正确页面（见 §3 截图清单） | 页面实际渲染截图 |
| 3 | Agent 工作台知识库卡片显示占位文案"知识库将在阶段 3 开放" | `AgentHome.vue` 卡片值绑定为阶段占位 i18n 键 | 卡片改为真实知识库数量（`pageKnowledgeBases` total，"N 个知识库"），保留 `/agent/knowledge` 跳转；i18n 两语言键替换；spec 断言更新（同提交 `c5eac9b`） | `AgentHome.spec.ts` 更新，全量 vitest 通过 |
| 4 | `activityAssessment`、`assessmentConclusion` 为 TEXT 且标签含英文枚举 | 表单定义以 TEXT 建列、标签写死枚举清单 | 新增字典 `activity_assessment`（与已知活动相关/无合理解释/暂无法判定）、`assessment_conclusion`（正常波动/缓慢升温/快速升温/超过停机阈值）；两字段发布新版本改为 DICT；条件边保持按字典值（编码）路由不变；Agent 提示词继续写编码值 | UAT/本地表单发布接口返回 0；导出包回读字段类型/标签正确；实例按新字段路由正确（§1/§4） |
| 5 | 通知幂等键不含事件维度，同一负责人第二次告警不再落新行（返回 SUCCESS 但收件箱无新消息） | `AgentNotifySendTool` 幂等键 `agent-tool-<渠道>-<bizType>-<bizId>-<接收人>`，图提示词未传 `bizId`，缺省 SYSTEM+空 → 同接收人全部告警合并 | 图提示词在"发送通知告警"入参示例补 `"bizId":<事件 reportTime 原值>`（每事件唯一、同事件重试仍合并）；UAT 两图重发布 v5，本地同步 | 重跑北门场景后赵磊收件箱出现 11:07 新告警行（`sw_notify_message.idempotency_key` 按事件区分，DB 回读） |
| 6 | 部署后 HTTPS 根 403 | web zip 解包后多一层 `dist/`（第一次部署脚本沿用旧写法未剥离） | 修正部署脚本为 `cp -a dist/.`（`uat-deploy-030rw2.sh`），目录已恢复，根 200 | 部署回读 root 200 |

## 3. 截图清单（均 headed 1440×900，本机留存不入 Git）

成功证据（`.runtime-030/uat-shots-rework/`）：

- `rw-g2-detail-01-XY-20261107-003.png` — P1 实例详情：完整 20 字段、"活动关联结论=与已知活动相关"、"建议处置级别=P1 重要"（G2/G5）
- `rw-g2-detail-02-XY-20261107-004.png` — P0 实例详情："无合理解释"、"P0 紧急"（G2/G5）
- `rw-g2-detail-03-MES-20261107-007.png` — C 流程 RAPID 实例详情：完整 23 字段、"研判结论=快速升温"、当前温度 81.2（G2/G5）
- `rw-g1-zhaolei-notify.png` — 负责人赵磊站内信列表：11:07 P0 告警原文（G1）
- `rw-g3-agent-graph-defs.png` — `/agent/graph-def` 图定义管理：两图 v5 已发布（G3）
- `rw-g3-app-manage.png` — `/form/app-manage` 应用管理：3 应用（G3）
- `rw-g4-agent-home.png` — Agent 工作台：知识库卡片"2 个知识库"（G4）

失败截图（上一轮，保留现场）：`.runtime-030/uat-shots/uat-04-agent-graphs.png`、`uat-06-app-manage.png`（404 页，原因见 §2 缺陷 2）。本轮登录赵磊账号曾 4 次失败（验证码识读，`rw-cap-1..4.png` 为验证码图片），第 5 次成功。

## 4. G6：NORMAL 研判取证（无需重跑）

UAT 执行 `2118782181717925889`（03:06:51，SUCCESS，v3 快照）原文已存档：`.runtime-030/g6-normal-execution/execution.json`、`nodes.json`。

- 输入温度序列（input.recentSeries）：79.1℃（03:04:11）→ 79.5℃（03:05:31）→ 80.4℃（03:06:51），约 0.98℃/分钟，慢速升至 80—85℃ 区间；
- 知识样本命中（node_kb）：`人工加料温度波动样本.txt`（S-2026-014 正常波动样本 / S-2026-021 快速升温反例，相似度 0.460）、`注塑工序温度控制要求.txt`（含"升温速率达到或超过 1.5℃/分钟判定为快速升温异常"，相似度 0.407）；
- 输出原文（node_judge）：`NORMAL` 开头，"最近约 2.7 分钟由 79.1 升至 80.4 摄氏度，升温速率约 0.98 摄氏度/分钟，低于 1.5 摄氏度/分钟判定值，且无人工加料阶段信息，未呈现快速升温或人工加料波动特征"——引用了知识样本中的判定规则；
- 未建单（CONDITION 默认分支走 END 记录节点），符合"只记录"。

## 5. 发布事实（0.3.0 同版本覆盖）

| 项 | Server | Web |
|---|---|---|
| 合并链 | fix `a05fb7f4` → develop `b6ecf32a`（CI `42326809516` success）→ main `a0ac3a1a`（CI `42326868207` success） | fix `c5eac9b` → develop `8b4303b`（CI `42326845813` success）→ main `420e0f9`（CI `42326879133` success） |
| tag 0.3.0 重指 | tag 对象 `3b350acc`→`3f4406af`（commit `b4af4c3e`→`a0ac3a1a`，force-with-lease） | tag 对象 `a00ea285`→`fbf5aa3`（commit `271d40c`→`420e0f9`，force-with-lease） |
| Release | `0.3.0` 资产替换为 CI 制品 `bootstrap-0.3.0.jar` 220,857,566 B sha256 `0ca4dcc3…`；说明追加覆盖记录；`releases/latest` 恢复 0.3.0 | `0.3.0` 资产替换为 `sw-web-dist-0.3.0.zip` 6,194,561 B sha256 `c3728e6d…`；说明追加覆盖记录；`releases/latest` 恢复 0.3.0 |
| 全量测试 | 本地全工程 `mvn test` **2413 tests / 0 failures / 0 errors / 32 skipped**（420 个测试类；0.3.0 基线 2410 + 本轮新增 2 例，差 1 为两轮统计口径波动） | typecheck 0 / lint 0 / vitest **2026 通过 + 3 跳过** / build exit 0 |
| UAT 部署 | 两次部署：第一次同源本地构建（sha256 `84ea5752…`，因 GitHub 网络中断临时使用）；第二次换 CI 制品，**运行包 sha256 `0ca4dcc3…` 与 Release 资产一致**；`build.version=0.3.0`、启动 167.774s、health UP（本机与 nginx）、HTTPS 根 200、新进程启动段 ERROR 0；DB 快照 `pre030rw`/`pre030rw2`，jar/web 备份 `bootstrap.jar.bak-030rw-pre`/`web.bak-030rw-pre.tar.gz`；Flyway 保持 v0.2.9（无新迁移）；磁盘可用 931M（96%） | 同上（web 目录层级修正后根 200） |

配置与环境收尾：UAT 新增两字典组并发布两表单新版本；校园知识库活动文档更新为"11 月 7 日全天"口径（业务人员可维护样本）；两 Agent 图重发布 v5（bizId）；临时 1884 回环注入监听器已移除、mosquitto 恢复仅 1883 认证监听、平台两条常驻连接重建（t0 挂 2 订阅）；`/root/upload` 冗余制品副本已清理（首发 jar/zip 在 `build-b4af4c3e`/`build-271d40c` Release 均有同字节资产可回读）。

应用包：`product/three-sample-process-uat/assets/operations-risk-workbench.appbundle.json`（26,029 B，`bundleFormatVersion=1`、`systemVersion=0.3.0`，平台导出）——含 6 字典组（新增 2 组）、`campus_gate_incident.activityAssessment`（DICT/`activity_assessment`/标签"活动关联结论"）、`mes_temperature_review.assessmentConclusion`（DICT/`assessment_conclusion`/标签"研判结论"）。

本地验证（隔离实例 18091，独立库 `smart_workflow_030`，用户 8080/5173 未动）：返修构建重启后 B 流程两分支实跑通过（南门 930→SPECIAL_EVENT→P1 实例 `2118882165419708417`；北门 515→UNDECIDED 默认分支→P0 实例 `2118883203660943362`+站内信 SUCCESS）、MES 快速升温（78→80.5，≈9.8℃/分钟）→RAPID_RISE→实例 `2118884246553661441`；三个新实例详情 API 均回传完整 formData。

## 6. 已知限制与边界（本轮）

1. 修复前发起的实例（如 MES-20261107-005，IoT FLOW 直发、发起人为系统）历史变量中无 formData 可回读，详情仍显示原提示；修复覆盖其后发起的实例。G2 验收的三实例（G1 两实例 + 新跑 C RAPID）均已验证。
2. IoT 系统发起的实例 `initiator=0`，"我发起的"端点按发起人 fail-closed 拒绝（既有权限设计）；其表单数据对流程参与人经任务详情回退可见。
3. UAT 磁盘 931M（96%），下次大版本升级前按运维手册 §9.2 清理。

## 7. 常规决定（一行）

本地使用隔离实例 18091（`E:\code\sw030-server` 工作树构建，用户 8080/5173 未动）；G5 采用"本地改配置→导出包、UAT 同套 API 原地发布新版本"路线（包导入会改名分叉，不覆盖既有实例）；遥测注入用临时 1884 回环监听器（用后即删）；通知幂等以图提示词传 `bizId` 修正（配置层，不改工具代码）；UAT 部署最终以 CI 制品为准并清理临时构建副本。
