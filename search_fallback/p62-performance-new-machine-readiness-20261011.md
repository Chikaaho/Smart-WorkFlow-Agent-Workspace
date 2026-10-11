# P62新机就绪探索回执

2026-10-11；Executor按[探索任务](../search_task/p62-performance-new-machine-readiness-20261011.md)执行，全程只读：无压测/基准、无服务启停、无构建/迁移、无业务/测试/策略/DB变更、无sleep/后台脱离；只采有限返回事实。未验证不写通过。

## 结论

新机满足继续规划条件，测量资产可自举复用，Planner可据此固定有限负载/预算；正式性能验证未启动未验证。

## 1 机器拓扑（Q1，时点2026-10-11晚）

- i5-12400 6C12T 2.5GHz；内存16GB（观测可用约3.4GB、CPU负载21%）；Win11家庭版26200（上次启动09-22）；2×KIOXIA 1TB NVMe：C余39.4/D余14.3/E余215.3（工作区）/F余303.8GB。
- PG18.4+Redis为Owner Docker容器（Up约7h，发布0.0.0.0:5432/6379）；另有原生Windows Redis服务（127.0.0.1:6379自启）并存；WSL2(Ubuntu)承载Docker。Server/Web进程未运行（8080/5173未监听）；MQTT broker未运行（P63受控broker前置不在线）；生产=chikaho.cn独立主机0.1.3，边界分离。node进程=会话工具非业务服务。未回显连接值/配置内容。
- 工具：PowerShell Get-CimInstance（CPU/内存/OS/磁盘）、tasklist/netstat/Get-Process、docker ps、wsl -l -v。

## 2 构件与环境（Q2）

- Server `feature/p64-mes-advanced-orchestration`＝origin（本批docs 3524de4→c0cbe60；业务截止3341de5保持；bootstrap.jar构建10-11 14:36/217MB）；Web同分支=`4333145`=origin（dist 10-11 14:33）；工作区develop-sw=`718a7ace`=origin（本批传播后推进，见§6）。两仓工作树仅日志目录未跟踪，代码干净。
- 迁移链源码终点V0.1.9；隔离库smart_workflow_p64p2/p64p2c实至0.1.9；主库smart_workflow停旧V1—V11链（2026-06-27建，未入0.1.x）。PG容器=18.4（测量资产用zonky内嵌17.5.0，与合同PG17.5行一致，不受主库影响）。
- 策略：`sw_bpm_resource_policy`代码默认enabled=false（BpmResourcePolicy：默认关闭、启用须过启用检查）＝新策略OFF；主库无该表。
- P62旧验证接缝：当前无运行Server服务（接缝不在线）；但测量资产自举（测试JVM boot+内嵌PG），不依赖预运行服务。P64已改相关路径（3341de5）：TriggerExecutionService两事件入口@Transactional(REQUIRED)、freezeBatch根行FOR UPDATE、claimTask+候选链接、submitOnBehalfOf归属人、委托walkChain≤4跳、COUNT/根链护栏——影响轻流程推进/OA领取办理/命令消费；正式验证须在当前源重测，不混用旧机数据。
- 工具：git rev-parse/log/status、jar时间戳、docker exec psql只读SELECT。

## 3 逐目标未验证输入（Q3，原机/新机分列）

- 原机（M1 8核8GiB/swap画像）历史保留：突发拒绝P99=1029.7ms>1s（RA02a2）；批项等待≥38.324s>30s（swap暖机段唯一批次，领取晚于受理）+正式窗批项零样本；归因不足（资源vs实现未分离），不判代码缺陷、不认定纯设备原因。原机已过（有限样本）：RA02b1独立可见max81ms、RA02b2 25项并存批次max1014ms。
- 新机：容量/突发拒绝、生产/OA推进、批项受理起等待、多租户公平全部未测、无新机数据。原合同目标与超限保留（实时≤300ms/轻流程受理≤2s/动作≤5s·每个≤30s/OA读≤1s/审批≤1s·动作≤5s·每个≤30s/批项≤30s/恢复100条≤120s/突发拒绝P99≤1s）；未测提交ε不能构造上界；RG08 2h/固定长窗已撤回不恢复。
- 来源：direction-p62-resource-assurance.md§3、planning-review-resource-assurance-10.md L19-22、resource-assurance-09.md§2/§5。

## 4 可复用资产（Q4）

sw-bootstrap p62测试包25类（24内嵌PG）：P62BudgetMeasurementPgTest（G1a实时/轻流程预算+G1b配对+恢复+G2b 64并发压界+真实OA待办并行+5s资源采样）、P62ResourceAssurancePgTest（RG02/RG03保障5/5/2/1+突发200单位/s与租户互换、RG07停新受理/100条恢复、500项整笔）、P62CommitVisibilityPgTest（独立连接首次可见正确口径）、P62ApprovalChain/LightProcessE2e/BatchInvoke/NodeLevelGuarantee/ProgressWindow（SIGKILL窗口）/ConsumerIsolation/RecoveryDrill。
具备：真实HTTP入口、逐请求gzip CSV全样本（runId+CREATE_NEW不可覆盖）、统计由样本回读复算、env-frozen、sha256、固定种子20260930/两租户各1000对象/10%热点/并发16·64/Druid64/Flowable异步8/poll100ms/批50/debug-auth租户bearer、分段手动开关。
缺失输入（Planner固定）：本轮负载/预算取值与窗口时长（装置默认60s预热+300s正式，-Dp62.formal.seconds可缩短但标注shortVerify=true不作判定样本）、runId/证据目录命名、OA正式窗并发口径、装置缺陷处置（maxItemWaitMs失效SQL、invocation_key索引迁移、convergence/occupancy口径、openapi回调监听器——回执09§5登记待方向裁决）。本探索未实现新验证程序。

## 5 有限生命周期能力（Q5）

现有方式=前景mvn（MAVEN_OPTS=-Xmx2g）+JUnit：有限输入（固定种子/并发/时长，while边界自终止，HTTP超时10s）、稳定身份（runId+CREATE_NEW）、最小充分（分段开关）、增量进展（逐请求样本+[P62-EV]日志）、退出状态与sha256/env-frozen；应用+内嵌PGtearDown关闭，宿主终止沿taskkill //T //F+端口零监听读回先例（回执06/07）。
缺口：单条前台命令上限约10min，G1单场景接近上限——替代=逐场景分段运行（装置已支持）；超10min场景须按execution_tasks登记完整生命周期（托管后台+tasklist观察+超时取消，回执06/07先例）后方可使用。本轮未启动任何此类任务。

## 6 文档传播覆盖与Git实际结果

knowledge-first传播（本轮+验收09）：knowledge四入口（current-status顶部新条目/session-handoff覆盖值/features p64登记/architecture §7.3）+reconciliation索引（P64零命中grep=不受影响）+Server功能清单焦点行+memory五入口（README/state/handoff/features/decisions）+todo三件（p62/p64/requirement-pool）+product路由（P62资源合同/恢复安排/P64授权/主方向/方案/阶段Ⅱ方向）；唯一下一动作统一=Planner读取本回执固定有限性能方向；当前入口无"结果未收到/探索已下发"残留（requirement-pool L465为2026-09-04历史段按时点保留）。历史回执与证据包未改写，未提前写P64整体PASSED/COMPLETED。
Git：Server docs批次=c0cbe60（推送后ls-remote回读一致，3524de4→c0cbe60）；工作区传播批次A=920bb5db（30文件：knowledge四+memory六含Planner先行constraints修订+todo三+product+search_task+Server指针→c0cbe60）；本回执自身提交在会话交接报告SHA（不回填自身）；Web零改动、指针4333145a保持（Owner认可值）。

## 7 尚缺信息

- Planner决策输入（非事实缺口）：本轮负载/预算/窗口取值；是否先修装置缺陷（§4登记项）或按现有装置定边界。
- 环境限制（如实）：原生Redis与Docker Redis并存（127.0.0.1优先原生）——正式验证若需Redis须显式选型并登记；MQTT broker不在线（P62性能路径不需要；P63两测需受控broker前置）。
