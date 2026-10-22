# T020 IoT 预约、发送和补偿准入

2026-10-23｜Executor｜XL｜IN_PROGRESS

七阶段：需求评估完成；分支实施进行中；验收同步、合并、发布、发布后同步、结束未开始。本回执记录 A08 的 IoT 预约和命令发送边界，整项继续实施。

## 实施

预约 PENDING→DISPATCHING、命令 QUEUED/FAILED→SENDING、滞留命令和失败重试认领均使用 TenantWorkAdmission，在租户行锁下核对权威状态及有效期，持久 CAS 显式带对象租户。发送认领同时检查命令有效期。停用、过期或竞争失败时返回未认领，普通发送路径直接结束，不能外发或伪写失败/成功。

控制通道未装配导致的未开始命令失败记录也经租户准入，停用时保持原状态和重试次数。已经持久认领的发送保留原结果写回。补偿在成功认领后调用明确的已认领发送入口，传入 SENDING 对象，避免再次认领导致原动作失败；统一复用原生 MQTT/云厂商发送及结果处理。没有新增发送通道。

过期预约沿原 EXPIRED 对账规则收敛，不因重新启用补发。恢复尚有效预约继续原 reservationId 和稳定命令幂等键；重复调度不生成或发送第二条命令。

## 工程门与真实传输

`tenant-iot-module` 完整 common 36、security 23、IoT 75，共 134 用例，零失败、零错误、零跳过，BUILD SUCCESS。新增反例证明停用目标不调用预约更新/设备服务/发送器，普通命令不能认领、消耗重试预算或记通道失败；未认领 MQTT 不发布、不写 SENT。已认领补偿测试证明发送一次且不二次 markSending。

最终 `tenant-iot-final`：IoT 目标 23、bootstrap 12，共 35 用例，零失败、零错误、零跳过，BUILD SUCCESS。bootstrap 包含原生 MQTT 3、真实 PG 设备回执 1、预约未知结果 1、可靠事件门 7；后两条原有真实链继续保持 UNKNOWN 不自动重发、回执/人工核实及可靠接缝语义。原文在 `C:/Users/hjxch/.codex/evidence-020/tenant-identity/tenant-iot-module.log`、`tenant-iot-native.log`、`tenant-iot-final.log` 及对应结果文件。一次早期命令写了不存在的 Phase4IotCompensationH2Test 类名，实际仅执行原生 MQTT 3 用例，未把该名称计为通过；最终改用真实存在的 P62/P63 回执链与可靠事件门。

实际隔离 PostgreSQL、正式生产装配和受控原生 MQTT Broker：停用隔离夹具租户 9001，新建预约 `91933` 保持 PENDING、command_id 为空、Broker 零新增；同批新建的过期预约 `91934` 为 EXPIRED 且没有命令。恢复租户后原 `91933` 生成命令 `2113310203519815681`，状态 SENT，Broker 恰收 1 次；再调度仍为 1 次，按 approval_biz_id 回读命令数为 1，过期预约仍无命令。最终原生 MQTT 3 用例 38.21 秒。先前新增用例的独立运行也通过（36.64 秒），最终结论绑定最终原文。

这是受控 Broker 实际传输和持久状态证明，不是厂商设备执行证明；没有改动现场历史命令。租户启停只作用于随测试创建的隔离 PG 数据，finally 恢复原状态。自有应用/Broker/PG 已关闭，进程回读仅剩用户原 Redis 服务；MAVEN_OPTS=-Xmx2g，无前后端重任务并发。

## 提交及继续

Server `9f24775bf07e0eceecb640abaa2f65aeec140acc`，9 文件、193 insertions / 25 deletions，已普通推送。修改预约与补偿 job、命令服务接口/实现、共享发送器、三个 IoT 测试类和原生 MQTT PG 验证；Web 保持 `dd29316`。

IoT 流程触发初始处理/恢复、通知初始及恢复投递、OpenAPI 回调、BPM 时限和启停/过期审计仍待继续；再承接 F020/J020/W020 与 U020。A03 整体和 A08 未通过，T020 及整版没有验收完成；功能数、P 核销和正式验证基线不变。
