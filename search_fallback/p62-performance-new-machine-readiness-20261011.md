# P62新机就绪探索回执

2026-10-11；Executor按[探索任务](../search_task/p62-performance-new-machine-readiness-20261011.md)执行，全程只读：无压测、无服务启停、无构建/迁移、无业务/测试/策略/DB变更、无sleep/后台脱离。未验证不写通过。

## 结论

新机满足继续规划条件，测量资产可自举复用，Planner可据此固定有限负载/预算；正式性能验证未启动未验证。

## 1 机器拓扑（Q1，2026-10-11晚）

i5-12400 6C12T 2.5GHz；16GB（观测可用约3.4GB、负载21%）；Win11家庭版26200；2×KIOXIA 1TB NVMe（C余39.4/D余14.3/E余215.3=工作区/F余303.8GB）。PG18.4+Redis=Owner Docker容器（Up约7h，0.0.0.0:5432/6379）+原生Windows Redis服务（127.0.0.1自启）并存；WSL2承载Docker；Server/Web未运行（8080/5173未监听）；MQTT broker未运行；生产=chikaho.cn独立主机0.1.3。node进程=会话工具。未回显连接值/配置。
工具：Get-CimInstance/tasklist/netstat/docker ps/wsl -l -v。

## 2 构件与环境（Q2）

Server `feature/p64-mes-advanced-orchestration`＝origin（本批docs 3524de4→c0cbe60；业务截止3341de5；bootstrap.jar构建10-11 14:36）；Web同分支=`4333145`=origin（dist 10-11 14:33）；工作区develop-sw=`718a7ace`=origin（本批传播后推进，见§6）；两仓工作树仅日志未跟踪。
迁移链源码终点V0.1.9；隔离库smart_workflow_p64p2/p64p2c实至0.1.9；主库smart_workflow停旧V1—V11（未入0.1.x，测量资产用内嵌PG不受影响）。`sw_bpm_resource_policy`代码默认enabled=false＝OFF；主库无该表。
P62旧接缝不在线（无运行Server）；但测量资产自举（测试JVM boot+内嵌PG），不依赖预运行服务。P64已改相关路径（3341de5）：TriggerExecutionService两事件入口@Transactional(REQUIRED)、freezeBatch根行FOR UPDATE、claimTask候选链接、submitOnBehalfOf归属人、委托≤4跳、COUNT/根链护栏——影响轻流程推进/OA领取/命令消费；正式验证须在当前源重测，不混用旧机数据。

## 3 逐目标未验证输入（Q3，原机/新机分列）

原机（M1 8核8GiB/swap画像）历史保留：突发拒绝P99=1029.7ms>1s（RA02a2）；批项等待≥38.324s>30s（swap暖机段唯一批次，领取晚于受理）+正式窗批项零样本；归因不足，不判代码缺陷、不认定纯设备原因。原机已过（有限样本）：RA02b1独立可见max81ms、RA02b2 25项批次max1014ms。
新机：容量/突发拒绝、生产/OA推进、批项受理起等待、多租户公平全部未测。原合同目标与超限保留（实时≤300ms/轻流程受理≤2s/动作≤5s·每个≤30s/OA读≤1s/审批≤1s·每个≤30s/批项≤30s/恢复100条≤120s/突发拒绝≤1s）；未测提交ε不能构造上界；RG08 2h/固定长窗已撤回不恢复。
来源：direction-p62-resource-assurance.md§3、planning-review-resource-assurance-10.md L19-22、resource-assurance-09.md§2/§5。

## 4 可复用资产（Q4）

sw-bootstrap p62包25类（24类内嵌PG17.5=zonky，与合同环境行一致）：BudgetMeasurement（G1a预算+G1b配对+恢复+G2b 64并发压界+真实OA待办+5s资源采样）、ResourceAssurance（RG02/RG03保障5/5/2/1+突发200单位/s租户互换、RG07停新受理/100条恢复、500项整笔）、CommitVisibility（独立连接首次可见正确口径）、ApprovalChain/LightProcessE2e/BatchInvoke/NodeLevelGuarantee/ProgressWindow/ConsumerIsolation/RecoveryDrill。
具备：真实HTTP入口、逐请求gzip CSV全样本（runId+CREATE_NEW不可覆盖）、统计由样本回读复算、env-frozen、种子20260930/两租户各1000对象/10%热点/并发16·64/Druid64/异步8/poll100ms/批50、分段手动开关。
缺失（Planner固定）：本轮负载/预算与窗口（装置默认60s预热+300s正式，-Dp62.formal.seconds可缩短但标shortVerify=true不作判定样本）、runId/证据目录、OA正式窗并发口径、装置缺陷处置（maxItemWaitMs失效SQL、invocation_key索引、convergence/occupancy口径、openapi回调监听器——回执09§5登记待方向裁决）。未实现新验证程序。

## 5 有限生命周期能力（Q5）

前景mvn+JUnit具备：有限输入（固定种子/并发/时长自终止、HTTP超时10s）、稳定身份（runId+CREATE_NEW）、最小充分（分段开关）、增量进展（逐请求样本+[P62-EV]日志）、退出状态/env-frozen；tearDown关闭应用+内嵌PG，宿主终止沿taskkill+端口零监听先例（回执06/07）。缺口：单条前台命令上限约10min，G1单场景接近上限——替代=逐场景分段运行；超限场景须按execution_tasks登记完整生命周期（托管后台+tasklist观察+超时取消，回执06/07先例）后方可使用。本轮未启动任何此类任务。

## 6 文档传播覆盖与Git实际结果

knowledge四入口（current-status顶部新条目/session-handoff/features p64/architecture §7.3）+reconciliation索引（P64零命中=不受影响）+Server功能清单焦点行+memory五入口+todo三件+product路由（P62资源合同/恢复安排/P64授权/主方向/方案/阶段Ⅱ方向）；唯一下一动作统一=Planner读取本回执固定有限性能方向；当前入口无"结果未收到"残留（requirement-pool L465为2026-09-04历史段按时点保留）；历史回执未改写，未提前写P64整体PASSED/COMPLETED。
Git：Server docs=c0cbe60（远端回读一致）；工作区批次A=920bb5db（30文件+Server指针→c0cbe60，基于Owner并行治理提交ef83a25f之上，推送未覆盖任何远端提交）；本回执自身提交SHA在会话交接报告（不回填自身）；Web零改动、指针4333145a保持（Owner认可值）。

## 7 尚缺信息

- Planner决策输入（非事实缺口）：本轮负载/预算/窗口取值；先修装置缺陷（§4登记项）或按现有装置定边界。
- 环境限制（如实）：原生/Docker Redis并存（127.0.0.1优先原生），正式验证若需Redis须显式选型并登记；MQTT broker不在线（P62性能路径不需要；P63两测需受控broker前置）。
