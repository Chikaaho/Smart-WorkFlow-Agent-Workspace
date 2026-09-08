# G1-01 连接测试（Owner Broker，口令经环境变量注入，不入附件）
时间: 2026-09-08 07:56:16  工作目录: Smart-WorkFlow-Server  后端: dev/H2 http://localhost:8080/api

## 连接配置创建与脱敏校验
- connId=2097112235588177921
- 响应含 passwordCipher: 0 (期望 0)
- 响应含明文口令: 0 命中（脱敏校验通过，前缀串不写入本附件）
- 连接测试真实输出: {"code":0,"msg":"success","data":{"healthStatus":"HEALTHY","detail":"连接建立成功 (cost=412ms)","category":"SUCCESS"}}

## G1 双向真实收发（Owner Broker 8.166.112.85:1883）
- 常驻连接: {"code":0,"msg":"success","data":{"connected":true,"subscriptions":2}}

### 下行双端原始输出
```
CLI sub (owner/p21/down/cmd, qos1) 收到:
Invalid value for option '-pw:env': cannot convert 'OWNER_MQTT_PW' to ByteBuffer (The given environment variable is not defined.)
Try 'mqtt sub --help' for more information.
```

### 下行双端原始输出（CLI sub 环境变量先行注入后启动）
```
CLI sub (owner/p21/down/cmd, qos1) 收到:
{"cmd":"restart","seq":302}
{"cmd":"restart","seq":302}
```

### 上行链路原始输出（Owner Broker）
```
$ mqtt pub -h 8.166.112.85 -p 1883 -u ch-paas -pw:env=OWNER_MQTT_PW -t owner/p21/up/property -m {"properties":{"temperature":42.5}} -q 1
exit=0
GET /iot/runtime/messages?parseStatus=PARSED → owner/p21/up/property PROPERTY PARSED qos=1
GET /iot/runtime/properties?deviceId=2097112412671692801 → temperature=42.5 preValue=None 2026-09-08T08:01:33
GET /iot/rules/2097112417490948097/triggers → SUCCESS processInstanceId=739cb378-ab18-11f1-85d1-66ff24301f3c formSnapshot={"temperature":"42.5","deviceKey":"dev-owner-01"}
```

### 去重证据
```
同 payload 二次发布后 messages 顶部: [('DUPLICATED', 'owner/p21/up/property'), ('PARSED', 'owner/p21/up/property')]
triggers:  1
GET /iot/rules/.../triggers 总数 = 1 (期望仍为 1)
```

### 解析失败证据（物模型未声明属性被拒）
```
owner/p21/up/property | 属性未在已发布物模型中声明: hacker
```

## G2/G4 命令与设备回执原始输出（PG 持久化）
```
GET /iot/runtime/commands?sourceType=FLOW → 三来源各一条：reboot(FIXED)/form_action(FORM_FIELD)/var_action(VARIABLE)，均 BROKER_ACK，flowInstanceId 与触发流程一致
设备经 owner/p21/up/ack 回报 ACTION_RESULT 后命令状态: 见下
```

## A1 认证失败分类（口令错误对照连接）
```
AUTH-FAIL-TEST 输出见回执正文
```

### 命令状态实测
```
2097135719507595266 SUCCESS   ← 设备经 ACTION_RESULT 回报后
2097135641107664898 BROKER_ACK
2097135239691800578 BROKER_ACK
```
### 认证失败分类（真实输出）
```
{"code":0,"data":{"healthStatus":"UNHEALTHY","detail":"连接失败: 无权连接 (cost=729ms)","category":"AUTH_FAILED"}}
```
