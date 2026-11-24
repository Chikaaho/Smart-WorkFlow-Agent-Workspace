# planning-review-120-04：1.2.0 阶段 3 第 3 轮复核（120-14 ~ 120-15）

2026-11-24｜规划｜依据 `execution-120-14.md`、`execution-120-15.md`，以及 `.iso120/evidence/` 下本轮新增的 23 张截图（逐张看过）。`.iso120/evidence/*.png` 全部 sha1 互不相同。｜**基本通过**：本轮锁定 12 项，剩下 4 个小尾巴，都是 S 级。

## 锁定

| 项 | 依据 | 说明 |
|---|---|---|
| S1 | `6bc67191`、`00d764fd`；规划回读 | `git ls-files .iso120 .zcode/plans` 输出为空；回执目录 grep 不到两个口令 |
| X4 | 同上 | 120-12 第 54 行已改 |
| X1-timeline | 120-15 §9 | 时间线已按部署表拆开，前后不再矛盾 |
| X3 | `X3-endpanel-persist.png` | 图「X3结束节点参数图 v1」，结束节点属性里有输出参数 `x3_probe`，来源 `input`，说明是「X3 持久化验证参数」；画布结束节点显示「1 个出参」 |
| E1-1 | `E1-1-panel-continue-top.png`、`-bottom.png`、`E1-1-condition-status-vars.png` | 面板从上到下只有一个「节点名称」，没有「入参映射 []」；版本显示「v2 · 2026-11-23 12:34:21」；选 CONTINUE 后有分流说明；条件节点「失败分流」能列出 `graphExec.node_ge.status/errorCategory/errorMessage/executionId`，点击可复制。文案有一处小问题，见下面的 T1 |
| E1-3 | `E1-3-hit-high-trace.png`、`E1-3-miss-low-trace.png`、`E1-3-exec-detail-io.png`、`E1-3-exec-detail-low.png` | 新图输出的是常量：北京 → `{"result":"high"}`，实例停在「高侧人工确认」（运行中）；石家庄 → `{"result":"low"}`，实例「已完成」，流程图绿线一直到 END。执行详情的输入、输出两栏都有内容。根因是执行行没有写结构化入参和出参，已修，修法合理 |
| E1-3T | 120-15 §5，DB 时间戳 | 三条慢请求在 11:52:15.5 开始，11:52:35.7 结束；普通审批在 11:52:15.979 完成。**按 §7.1 自查**：这一项要证明的是普通审批不会被慢图卡住，DB 时间戳已经能证明，截图只是辅证，上一轮要求截图和 DB 逐一对上，是规划要求过度了。所以按 DB 证据锁定。说明一下：`E1-3T-approval-completed.png` 的流转记录时间是「11-23 22:25」，那是任务到达的时间，不是办理时间（见 P79），和 DB 并不矛盾 |
| E1-4 | `E1-4-continue-timeout/error/output-missing.png`、`E1-4-block-failure-visible.png` | CONTINUE 的三种失败都停在「Graph 失败人工处理」（业务单号 ac38091e、b34ecc3f、615ba758）。BLOCK 时，发起页错误条显示「流程发起失败：Graph 执行失败[EXECUTION_ERROR]: 图执行失败，请查看节点记录」。超时的分类已经统一成 TIMEOUT |
| E1-6 | `E1-6-before-submit-fail.png`、`-button-ok.png`、`-button-fail.png`、`-button-type-mismatch.png` | #2 报错写明「提交前 Graph 动作失败[TIMEOUT]: 等待图执行超时（超过 2 秒）」；#3 提示「操作成功」；#4 提示写明 TIMEOUT 原因，城市框还保留「成」字；#6 只有黄色警告，没有成功提示。截图时窗口宽 1280，城市输入框太窄，只能看到一个字，这和表单定义的列宽有关，不影响结论 |
| E1-7 计数 | 120-15 §8.1 | 63 − 15 + 7 = 55，这个解释可以接受；流程 19 对 53 的差别来自取数时刻不同。6 条残留已经收尾 |
| E4-2 已办 | `E4-2-processed-view-button.png`、`-processed-detail.png`、`-todo-tab-handle.png` | 工作台「已办 9」5 行全是「查看」，打开后是只读详情，流转记录正常；「待办 2」仍然是「办理」。根因是伪任务 ID `ACTION#…` 在路由的 `#` 处被截断，已经查清 |

## 小尾巴（本轮没锁）

| ID | 问题 | 依据 |
|---|---|---|
| T1 E1-1 文案 | 分流说明写的是「按 graphExec.node_ge.status 分流（SUCCESS / FAILED / TIMEOUT / OUTPUT_MISSING）」，但 status 实际只有 SUCCESS 和 FAILED（E1-4 三条都是 status=FAILED，原因在 errorCategory 里），用户照这句写 `status=='TIMEOUT'` 永远走不到。另外条件节点的变量说明文字超出右边界，被截断了（「失败分类（TI…」「GRAPH_FAIL」「OUTPUT_MI」） | `E1-1-panel-continue-top.png`、`E1-1-condition-status-vars.png` |
| T2 E1-7 来源 | 执行运行中时「来源」显示成「直接调用」：`E1-3T-three-running-slow.png` 顶部三条，DB 里是 PROCESS。这会导致筛「流程」时漏掉正在跑的流程执行，筛「直接调用」时混进流程执行，正好违反 E1-7 的反向断言「筛选结果里没有别的来源」。来源应该在执行创建时就确定 | 120-15 §5 自己披露的 |
| T3 E4-1 收尾 | ① 「审批意见详情」弹窗头部的时间是 ISO 原值 `2026-11-24T12:35:46.774`，就在 Owner 报缺陷的这个弹窗里，一起改成 `yyyy-MM-dd HH:mm:ss`；② 回执说打印/PDF 和页面同源，所以一处修好就全好了，但没有实测。下载一次这条实例的服务端 PDF，抽出文本确认没有 `DynamicData@` 和 `com.sw.`，同时有「90 分钟」这类可读值 | `E4-1-opinion-detail-after.png` |
| T4 E4-2 收尾 | ① 服务端把 `ACTION#` 行从已办里整类去掉了。列出会产生这类行的动作有哪些（撤回、催办、终止等），确认里面没有用户期望在已办里看到的「办理」类动作；如果有，就改成保留显示，点「查看」打开实例详情，不要直接丢掉。② 方向要求顺带检查抄送。回执说工作台抄送页签用 taskId 打开任务详情，接收人可能 403，但没有实测。用一个只被抄送、不是办理人的用户实际点一次，出问题就修 | 120-15 §11 |

## 裁定执行方提的两点

1. **E4-1 修复前的截图**：用 Owner 2026-11-23 的截图作基线就可以，再加上 `ApprovalHistoryEnricherTest` 6/6，不用回退旧构建重拍。
2. **E1-3T 列表来源**：不认为这是「既有口径」，按 T2 修。

## 观察和登记

- **P79**：流转记录的「时间」列显示的是任务到达时间，事件列却写「已同意」，看起来像办理时间。例如 E4-1 实例的现场指挥确认显示 12:24，审批详情里的审批时间是 12:33。登记，未排期。
- 夹具 ID `#2124830000000000101`（E1-3常量分流图）和 `#2125080000000000001`（E4-1审批意见展示）明显是手工编的，应该是用 SQL 直接写的。用 SQL 造夹具可以接受，但回执要写明，而且不能拿这类夹具证明设计器或发布路径。本轮的结论都不依赖它们走过设计器，不影响验收。下一批回执补一句说明。

## 阶段 3 的出口

T1~T4 交齐后，阶段 3 就完成了。最后一批还要在最终提交上重跑一次门禁：Web typecheck/lint/test/build，Server 受影响模块（agent、bpm、form、workflow）的 `mvn test` 计数。然后进入阶段 4（合并、main CI）。

## 进度

共 7 个阶段，已完成 2 个，进行中 1 个（验收：第 3 轮基本通过，剩 4 个小尾巴），未开始 4 个。下一步的入口是 `planning-execution-prompt-120-04.md`。
