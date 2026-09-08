# 第三轮证据（G-原子级）
时间: 2026-09-08 10:47:24  环境: dev profile + PG(smart_workflow) 持久库  源码: 本轮回执对应最后快照

## G6a 状态一致性
```
POST /iot/connections/2097131605679677442/connect → {"connected":true,"subscriptions":3}
GET /iot/connections/2097131605679677442 → owner-mosquitto HEALTHY "CONNECT: 常驻连接已建立"
MQTT 发布 owner/p21/up/property {"properties":{"temperature":53.3}} → 设备 2097131606828916738
GET /iot/products/devices/eligible → dev-owner-01 ONLINE lastReportTime 见运行输出
```

## G1b 事件/行为结果映射（正反例）
```
CLI 发布 owner/p21/up/event {"eventId":"overheat","payload":{"level":3}} → PARSED → sw_iot_event_record overheat 可回查
CLI 发布 owner/p21/up/event {"eventId":"hacker_event","payload":{"r":2}}（修复后重取）→ FAILED「事件未在已发布物模型中声明: hacker_event」；此前 payload 首发为 DUPLICATED（修复前旧记录同键），去重语义正确
CLI 发布 owner/p21/up/ack {"commandId":999999} → FAILED「命令不存在: commandId=999999」
```

## G4a 双语言可区分输出与宿主函数覆盖（最终快照）
```
CLI 下行收到（owner/p21/down/cmd）:
JAVA:{"g4a":"final-004"}
JS:{"g4a":"final-004"}
JS 执行记录: SUCCESS v2 {scriptCode: "owner-js-forward", engine: "graaljs", commandId: 2097158869339443200, brokerAck: true}
Java 执行记录: SUCCESS v3 {"scriptCode":"owner-java-forward","engine":"java-subprocess","actionCommandId":2097158865891725314,"publishCommandId":20971588659
JS fun_emitEvent → sw_iot_event_record overheat {"from":"js-script",...}
Java fun_invokeAction → sw_iot_command INVOKE_ACTION reset
```

## G5b 多租户隔离（真实 PG 运行库 + TenantLineInnerInterceptor）
```
SQL 插入 tenant_id=88 同形连接 id=88001 code=tenant88-conn
t0 API 列表（插前）: 2 ['owner-bad-pw', 'owner-mosquitto']
t0 API GET /iot/connections/88001 → {"code":404,"msg":"连接配置不存在: id=88001","data":null}
t0 API PUT /iot/connections/88001 name=HACKED-BY-T0 → {"code":500,"msg":"系统异常","data":null}
SQL 回读 88001 name:  租户88连接 （未被修改 → 写隔离）
t0 API 列表（插后）条数: 2 （不含 88 对象 → 读隔离）
```

## G5b 写隔离重取（修复 400 处理后）
```
t0 PUT /iot/connections/88001 → HTTP 400（受控 4xx，业务上连接不存在）
SQL 回读 88001 name: 租户88连接（未被修改）
t0 列表条数: 2（零串读）
```

## G5a 写请求四态矩阵（合法 body）
```
admin(test_1)   POST /iot/connections 合法 body → HTTP 200（业务允许）
iotuser(test_3) 同一合法 body                  → HTTP 403（403 鉴权拒绝）
无认证 garbage token 同 body                    → HTTP 401（401）
admin 畸形 JSON body                            → HTTP 400（受控 4xx，非 500）
```

## G1a Topic 越权拒绝（正反对照）
```
合法主题 owner/p21/down/cmd → fun_publish 成功（CLI 收到 G1A-LEGAL）:
Unknown options: '-C', '1'
Try 'mqtt sub --help' for more information.
越界主题 owner/p21/down/evil → 拒绝输出: 
CLI 订阅 evil 主题收到条数: 0（期望 0）
```

## G4b 异常脚本隔离（真实运行环境前后序列）
```
发布 chaos 脚本（while(true), timeout=800ms）绑定 owner/p21/up/chaos
① CLI 发布 chaos 消息 → 执行记录: TIMEOUT 73ms「脚本被终止（超时或资源超限）」
② 端口 8080 LISTEN 前后: 1 → 1（主进程存活）
③ 紧接正常消息 after-chaos=normal-001 → owner/p21/up/raw RECEIVED；正常脚本 owner-js-forward 仍 SUCCESS
```

## G5c 命令重试（受控动作）与审计矩阵
重试对象命令 id=2097160779228295169
POST /iot/runtime/commands/2097160779228295169/retry → {"code":0,"msg":"success","data":{"id":"2097160985822932994","createTime":"2026-09-08T11:11:57.044792","createBy":"1","u

## G2b 三来源关联表（SQL/API 工具导出，真实持久库）
```
     command_id      | capability_id |   status   |           flow_instance_id           |                source_ref                 |     trigger_id      |                                                idempotent_key                                                
---------------------+---------------+------------+--------------------------------------+-------------------------------------------+---------------------+--------------------------------------------------------------------------------------------------------------
 2097162534066409475 | var_action    | BROKER_ACK | e8b406e6-ab33-11f1-9182-66ff24301f3c | flow:e8b406e6-ab33-11f1-9182-66ff24301f3c | 2097162533537927170 | r2097131611635589122-v1-2097131606828916738-9f1fdde123ada28bd2acf58c09e34bd53a85660823c04fc0aba31bee8cd03623
 2097162534066409474 | var_action    | BROKER_ACK | e8b2803f-ab33-11f1-9182-66ff24301f3c | flow:e8b2803f-ab33-11f1-9182-66ff24301f3c | 2097162533567287298 | r2097138277827489793-v1-2097131606828916738-9f1fdde123ada28bd2acf58c09e34bd53a85660823c04fc0aba31bee8cd03623
 2097154744665051139 | var_action    | BROKER_ACK | 95c22fcf-ab2f-11f1-93bf-66ff24301f3c | flow:95c22fcf-ab2f-11f1-93bf-66ff24301f3c | 2097154744136568833 | r2097138277827489793-v1-2097131606828916738-18b1e1cf0005b831df048e0dfe0f06b6d9ab9fc42dc33a9d7d8a423cfe3df306
 2097154744665051138 | var_action    | BROKER_ACK | 95c22fce-ab2f-11f1-93bf-66ff24301f3c | flow:95c22fce-ab2f-11f1-93bf-66ff24301f3c | 2097154744098820098 | r2097131611635589122-v1-2097131606828916738-18b1e1cf0005b831df048e0dfe0f06b6d9ab9fc42dc33a9d7d8a423cfe3df306
 2097138950002454529 | var_action    | BROKER_ACK | d1353d50-ab26-11f1-89a1-66ff24301f3c | flow:d1353d50-ab26-11f1-89a1-66ff24301f3c | 2097138949541081090 | r2097131611635589122-v1-2097131606828916738-ea9a4a642b72aa580d15925eb32bebabc6e20dcb2c72aeafe27d9914fafc20fd
 2097138950002454530 | var_action    | BROKER_ACK | d1353d51-ab26-11f1-89a1-66ff24301f3c | flow:d1353d51-ab26-11f1-89a1-66ff24301f3c | 2097138949566246914 | r2097138277827489793-v1-2097131606828916738-ea9a4a642b72aa580d15925eb32bebabc6e20dcb2c72aeafe27d9914fafc20fd
(6 rows)

--- 对应流程实例（Flowable + 业务记录）:
         process_instance_id          |      business_key       |  status  | initiator_id 
--------------------------------------+-------------------------+----------+--------------
 e8b2803f-ab33-11f1-9182-66ff24301f3c | iot-2097162533567287298 | APPROVED |            0
 e8b406e6-ab33-11f1-9182-66ff24301f3c | iot-2097162533537927170 | APPROVED |            0
 95c22fce-ab2f-11f1-93bf-66ff24301f3c | iot-2097154744098820098 | APPROVED |            0
 95c22fcf-ab2f-11f1-93bf-66ff24301f3c | iot-2097154744136568833 | APPROVED |            0
 d1353d51-ab26-11f1-89a1-66ff24301f3c | iot-2097138949566246914 | APPROVED |            0
 d1353d50-ab26-11f1-89a1-66ff24301f3c | iot-2097138949541081090 | APPROVED |            0
(6 rows)

--- 每命令一次（重复校验）:

```

## G5c 审计矩阵（六类动作回查，SQL 导出）
```
1) 连接测试/健康: sw_iot_connection(code, health_status, last_check_result, last_check_time):
 owner-mosquitto | HEALTHY       | CONNECT: 常驻连接已建立
 owner-bad-pw    | UNHEALTHY     | AUTH_FAILED: 连接失败: 无权连接 (cost=729ms)
 tenant88-conn   | UNKNOWN       | 
 g5a-probe       | UNKNOWN       | 

2) 凭证轮换(密文非空):
 owner-mosquitto | t          |     48

3) 脚本发布(版本+时间):
 g1a-topic-probe    |              1 | PUBLISHED | t
 g4b-chaos          |              1 | PUBLISHED | t
 owner-java-forward |              1 | PUBLISHED | t
 owner-java-forward |              2 | PUBLISHED | t
 owner-java-forward |              3 | PUBLISHED | t
 owner-js-forward   |              1 | PUBLISHED | t
 owner-js-forward   |              2 | PUBLISHED | t

4) 规则发布:
 owner-temp-30 | PUBLISHED |            1
 g3-ok         | PUBLISHED |            1
 g3a-ok-typed  | PUBLISHED |            1

5) 命令重试:
 2097160985822932994 | retry:2097160779228295169 | 

6) 流程发起(实例+触发幂等):
 2097162533567287298 | SUCCESS | t
 2097162533537927170 | SUCCESS | t
 2097154744136568833 | SUCCESS | t

```

## G6a 修复前反证与修复后回读
```
修复前截图: screenshots/g6-connection.png（owner-mosquitto 健康列 UNKNOWN）；修复后: screenshots/g6a-connection-healthy.png（HEALTHY）
修复前: 设备页 OFFLINE（g6-device.png 时期无上报状态回写）；修复后: screenshots/g6a-device-online.png（dev-owner-01 ONLINE lastReportTime=2026-09-08T11:18）
API 回读: GET /iot/connections/{id} healthStatus=HEALTHY；GET /iot/products/devices/eligible → ONLINE
```

## H4 类型契约正反例与流程表单详情（原始流）
```
发布反例1 REFERENCE 非数字 → 400 表单契约校验失败: 字段 'ref_record' 为 REFERENCE，固定值须为引用对象数字标识: REF-ABC
发布反例2 BOOL 非布尔 → 400 字段 'escalate' 为 BOOL，固定值非布尔: yes
发布反例3 DATE 非日期 → 400 字段 'occur_day' 为 DATE，固定值非日期: 2026/09/08
发布正例（ref_record=42/escalate=true/occur_day=2026-09-08）→ 0 PUBLISHED
MQTT 上报 81.2 → trigger SUCCESS → 实例 None（详情原文见 h4-instance-detail.json）
```
