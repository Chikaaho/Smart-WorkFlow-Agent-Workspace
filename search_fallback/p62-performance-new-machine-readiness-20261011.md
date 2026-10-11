# P62新机就绪探索回执

2026-10-11；Executor按[探索任务](../search_task/p62-performance-new-machine-readiness-20261011.md)执行，全程只读（无压测/服务启停/构建/迁移/DB变更/sleep/后台），时点2026-10-11晚；未验证不写通过。

## 结论

新机满足继续规划条件，测量资产可自举复用，Planner可据此固定有限负载/预算；正式性能验证未启动未验证。

## 1 机器拓扑（Q1）

i5-12400 6C12T 2.5GHz；16GB（可用约3.4GB、负载21%）；Win11家庭版26200；2×1TB KIOXIA NVMe（E=工作区余215GB，C/D/F余39/14/304）。PG18.4+Redis=Owner Docker容器（Up约7h，0.0.0.0:5432/6379）与原生Redis服务（127.0.0.1自启）并存；WSL2承载Docker；Server/Web未运行（8080/5173未监听）；MQTT broker未运行；生产=chikaho.cn独立主机0.1.3。node进程=会话工具。未回显连接值；工具=Get-CimInstance/tasklist/netstat/docker ps。

## 2 构件与环境（Q2）

Server `feature/p64-mes-advanced-orchestration`＝origin（本批docs 3524de4→c0cbe60；业务截止3341de5；bootstrap.jar构建10-11 14:36）；Web同分支=`4333145`=origin（dist 10-11 14:33）；工作区develop-sw=`718a7ace`=origin（本批传播后推进，见§6）。
迁移链终点V0.1.9（隔离库p64p2/p64p2c实至）；主库smart_workflow停旧V1—V11（未入0.1.x；测量用内嵌PG不受影响）。`sw_bpm_resource_policy`默认enabled=false＝OFF（主库无该表）。
无运行Server（旧接缝不在线），但测量资产自举不依赖预运行服务。P64已改相关路径（3341de5）：两事件入口@Transactional(REQUIRED)、freezeBatch根行FOR UPDATE、claimTask候选、submitOnBehalfOf归属人、委托≤4跳、COUNT/根链护栏；验证须在当前源重测。

## 3 逐目标未验证输入（Q3，原机/新机分列）

原机（M1 8核8GiB/swap画像）历史保留：突发拒绝P99=1029.7ms>1s（RA02a2）；批项等待≥38.324s>30s（swap暖机段唯一批次）+正式窗批项零样本；归因不足：不判代码缺陷、不认定纯设备原因。原机已过（有限样本）：RA02b1独立可见max81ms、RA02b2 25项批次max1014ms。
新机：容量/突发拒绝、生产/OA推进、批项受理起等待、多租户公平全部未测。原合同目标与超限保留（实时300ms/轻受理2s/动作5s·单个30s/OA读1s/审批1s·30s/批项30s/恢复100条120s/拒绝1s）；未测提交ε不能构造上界；RG08 2h/固定长窗已撤回不恢复。
来源：资源合同§3、review-RA-10 L19-22、RA回执09§2/§5。

## 4 可复用资产（Q4）

sw-bootstrap p62包25类（内嵌PG17.5=zonky与合同一致）：BudgetMeasurement（G1a/G1b/G2b+OA待办+资源采样）、ResourceAssurance（RG02/RG03保障与突发、RG07恢复、500项整笔）、CommitVisibility（首次可见口径）等。
具备：真实HTTP入口、逐请求gzip CSV全样本（runId+CREATE_NEW）、样本回读复算、env-frozen、固定种子20260930/两租户1000对象/10%热点/并发16·64/池64/异步8/poll100ms/批50。
缺失（Planner固定）：本轮负载/预算与窗口（默认60s+300s，可-D缩短但标shortVerify不作判定样本）、runId/证据目录、OA正式窗并发口径、装置缺陷处置（maxItemWaitMs失效SQL、invocation_key索引、convergence/occupancy口径、openapi回调监听器——回执09§5登记）。未实现新验证程序。

## 5 有限生命周期能力（Q5）

前景mvn+JUnit：有限输入（时长自终止/HTTP超时10s）、稳定身份（runId+CREATE_NEW）、最小充分（分段）、增量进展（逐请求样本+[P62-EV]）、退出状态；tearDown关闭应用+内嵌PG，宿主终止沿既有先例。缺口：单条前台命令≤10min而G1单场景接近上限——替代=逐场景分段；超限场景须按execution_tasks登记（托管后台+观察+超时取消）后用。本轮未启动此类任务。

## 6 文档传播覆盖与Git实际结果

knowledge四入口（current-status/session-handoff/features p64/architecture）+reconciliation（P64零命中不受影响）+Server清单焦点行+memory五入口+todo三件+product路由（P62两方向+P64四方向）；唯一下一动作统一=Planner读取本回执固定有限性能方向；当前入口无"结果未收到"残留（仅L465历史段保留）；历史回执未改写，未提前写P64整体PASSED/COMPLETED。
Git：Server docs=c0cbe60（远端一致）；工作区批次A=920bb5db（30文件+Server指针→c0cbe60；基于Owner治理提交ef83a25f，未覆盖远端提交）；本回执自身提交SHA在会话交接报告；Web零改动、指针4333145a保持。

## 7 尚缺信息

- Planner决策输入：本轮负载/预算/窗口取值；先修装置缺陷（§4登记项）或按现有装置定边界。
- 环境限制：原生/Docker Redis并存（127.0.0.1优先原生），需Redis时须显式选型；MQTT不在线（P62不需要；P63需前置）。
