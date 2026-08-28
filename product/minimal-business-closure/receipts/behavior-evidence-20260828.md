
## 0. 前置：admin 登录

### POST /auth/login admin
```json
{"code":0,"msg":"success","data":{"accessToken":"eyJhbGciOiJIUzM4NCJ9.eyJzdWIiOiIxIiwiaWF0IjoxNzg3ODUyMjk2LCJleHAiOjE3ODc4NTMxOTZ9.moMz-iBSrfoppg7uiVjxFArYzQnuhmFtBXQMnfzGZPDkynylesJ6PXucz8PW7iF4","expiresIn":"900"}}

```

## 1. 创建部门（组织准备）

### POST /system/dept
```json
{"code":0,"msg":"success","data":"2093030350104788994"}

```

## 2. 创建用户（初始部门=根部门1）

### POST /system/user
```json
{"code":0,"msg":"success","data":"2093030350801043458"}

```

## 3. 分配角色 + 分配部门（真实权限链）

### PUT /system/user/2093030350801043458/roles body=[2]
```json
{"code":0,"msg":"success","data":null}

```
### PUT /system/user（分配部门 deptId=2093030350104788994）
```json
{"code":0,"msg":"success","data":null}

```
### GET /system/user/2093030350801043458/roles（角色分配回查）
```json
{"code":0,"msg":"success","data":["2"]}

```
### GET /system/user/2093030350801043458（部门分配回查）
```json
{"code":0,"msg":"success","data":{"id":"2093030350801043458","createTime":"2026-08-28T01:38:16.911675","createBy":"1","updateTime":"2026-08-28T01:38:16.988396","updateBy":"1","deleted":0,"version":"0","tenantId":"0","username":"evidence_user_1064","password":"$2a$10$9OhdMzp7o5Qtc9R8DwXP3OQsKOuq5x4MqrEaJufwsx0tnm7iA9rOO","realName":"链路验证用户","email":null,"phone":null,"sex":0,"status":0,"deptId":"2093030350104788994","isAdmin":0,"avatar":null,"roleIds":null,"postIds":null}}

```

## 4. 新用户登录 + 权限生效验证

### POST /auth/login evidence_user_1064（初始密码）
```json
{"code":0,"msg":"success","data":{"accessToken":"eyJhbGciOiJIUzM4NCJ9.eyJzdWIiOiIyMDkzMDMwMzUwODAxMDQzNDU4IiwiaWF0IjoxNzg3ODUyMjk3LCJleHAiOjE3ODc4NTMxOTd9.s7Z2GmquOnmIPoyYi6THynXXVcVg58zNVeNyBCYFW6Hh8l9xqkLjP0cm0BBX4Xf9","expiresIn":"900"}}

```
### GET /system/auth/me（当前用户）
```json
{"code":0,"msg":"success","data":{"user":{"id":"2093030350801043458","username":"evidence_user_1064","displayName":"链路验证用户","deptId":"2093030350104788994","tenantId":"0","avatar":null},"permissions":["job:create","job:update","job:delete","job:pause","job:resume","job:trigger","storage:upload","storage:delete","storage:download"],"roles":["admin"],"superAdmin":false}}

```
### POST /system/user/page（普通用户，预期 403 无权限）
```json
{"code":403,"msg":"无权限","data":null}

```
### GET /workflow/defs（普通用户，预期可访问）
```json
{"code":0,"msg":"success","data":{"records":[],"total":"0","pageNum":"1","pageSize":"10"}}

```

## 5. 修改密码 + 新密码重登录

### POST /auth/password（旧密码改新密码）
```json
{"code":0,"msg":"success","data":null}

```
### POST /auth/login（旧密码，预期失败）
```json
{"code":401,"msg":"用户名或密码错误","data":null}

```
### POST /auth/login（新密码，预期成功）
```json
{"code":0,"msg":"success","data":{"accessToken":"eyJhbGciOiJIUzM4NCJ9.eyJzdWIiOiIyMDkzMDMwMzUwODAxMDQzNDU4IiwiaWF0IjoxNzg3ODUyMjk3LCJleHAiOjE3ODc4NTMxOTd9.s7Z2GmquOnmIPoyYi6THynXXVcVg58zNVeNyBCYFW6Hh8l9xqkLjP0cm0BBX4Xf9","expiresIn":"900"}}

```

## 6. 审批人确认（admin 作为 DESIGNATED 审批人）

审批人 userId=1

## 7. 表单管理：创建/修改/发布/删除

### POST /api/form/def（创建草稿）
```json
{"code":0,"msg":"success","data":{"id":"835e1ca5-98c3-4e3f-b28c-7d82a20657c0","formKey":"ev_form_1064","name":"链路验证表单1064","logicalTableName":"ev_form_1064","status":"DRAFT","physicalTableName":null,"formVersion":1,"description":"端到端验证","createTime":"2026-08-28T01:38:17.839367","updateTime":"2026-08-28T01:38:17.839372"}}

```
### PUT /api/form/def/835e1ca5-98c3-4e3f-b28c-7d82a20657c0（修改表单）
```json
{"code":0,"msg":"success","data":{"id":"835e1ca5-98c3-4e3f-b28c-7d82a20657c0","formKey":"ev_form_1064","name":"链路验证表单1064-已改名","logicalTableName":"ev_form_1064","status":"DRAFT","physicalTableName":null,"formVersion":1,"description":"端到端验证","createTime":"2026-08-28T01:38:17.839367","updateTime":"2026-08-28T01:38:17.887674"}}

```
### POST /api/form/def/835e1ca5-98c3-4e3f-b28c-7d82a20657c0/config（保存字段定义）
```json
{"code":0,"msg":"success","data":null}

```
### POST /api/form/def/835e1ca5-98c3-4e3f-b28c-7d82a20657c0/publish（发布，建宽表）
```json
{"code":0,"msg":"success","data":null}

```
### DELETE /api/form/def/05824de5-ee49-4594-8f53-5cb22ff53dcf（删除草稿表单）
```json
{"code":0,"msg":"success","data":null}

```
### GET /api/form/def/by-key/ev_form_1064（表单状态回查）
```json
{"code":0,"msg":"success","data":{"id":"835e1ca5-98c3-4e3f-b28c-7d82a20657c0","formKey":"ev_form_1064","name":"链路验证表单1064-已改名","logicalTableName":"ev_form_1064","status":"PUBLISHED","physicalTableName":"sw_form_v07jaxkiol","formVersion":2,"description":"端到端验证","createTime":"2026-08-28T01:38:17.839367","updateTime":"2026-08-28T01:38:17.938229"}}

```

## 8. 设备注册（模拟设备）

### POST /iot/devices（注册设备）
```json
{"code":0,"msg":"success","data":{"id":"2093030355578355714","createTime":"2026-08-28T01:38:18.051066","createBy":"1","updateTime":"2026-08-28T01:38:18.051072","updateBy":"1","deleted":0,"version":"0","tenantId":"0","deviceKey":"ev_device_1064","name":"验证开关1064","deviceType":"switch","status":"ONLINE","lastOnlineTime":"2026-08-28T01:38:18.050731"}}

```
### GET /iot/devices/ev_device_1064（设备状态）
```json
{"code":0,"msg":"success","data":{"id":"2093030355578355714","createTime":"2026-08-28T01:38:18.051066","createBy":"1","updateTime":"2026-08-28T01:38:18.051072","updateBy":"1","deleted":0,"version":"0","tenantId":"0","deviceKey":"ev_device_1064","name":"验证开关1064","deviceType":"switch","status":"ONLINE","lastOnlineTime":"2026-08-28T01:38:18.050731"}}

```

## 9. 流程管理：创建/修改/绑定表单/发布/删除

### POST /workflow/defs（创建流程定义，绑定表单 ev_form_1064）
```json
{"code":0,"msg":"success","data":{"defId":"2093030355750322178","graph":{"processKey":"bpm_40a2a9c7a676439b","name":"链路验证流程1064","formKey":"ev_form_1064","version":1,"elements":[{"id":"node_start","kind":"node","type":"START","source":null,"target":null,"config":{},"style":{"x":100,"y":300}},{"id":"node_end","kind":"node","type":"END","source":null,"target":null,"config":{},"style":{"x":700,"y":300}},{"id":"edge_1","kind":"edge","type":null,"source":"node_start","target":"node_end","config":{},"style":{}}],"canvas":{}}}}

```
### PUT /workflow/defs/2093030355750322178/graph（保存含审批节点图，审批人=1）
```json
{"code":0,"msg":"success","data":null}

```
### PUT /workflow/defs/2093030355750322178（修改流程定义名称）
```json
{"code":0,"msg":"success","data":{"processKey":"bpm_40a2a9c7a676439b","name":"链路验证流程1064-已改名","formKey":"ev_form_1064","version":1,"elements":[{"id":"node_start","kind":"node","type":"START","source":null,"target":null,"config":{},"style":{"x":100,"y":300}},{"id":"node_approval","kind":"node","type":"APPROVAL","source":null,"target":null,"config":{"name":"主管审批","approver":{"type":"DESIGNATED","value":["1"]}},"style":{"x":400,"y":300}},{"id":"node_end","kind":"node","type":"END","source":null,"target":null,"config":{},"style":{"x":700,"y":300}},{"id":"e1","kind":"edge","type":null,"source":"node_start","target":"node_approval","config":{},"style":{}},{"id":"e2","kind":"edge","type":null,"source":"node_approval","target":"node_end","config":{},"style":{}}],"canvas":{}}}

```
### POST /workflow/defs/2093030355750322178/validate（图校验）
```json
{"code":0,"msg":"success","data":[]}

```
### POST /workflow/defs/2093030355750322178/publish（发布，Flowable 部署+表单绑定）
```json
{"code":0,"msg":"success","data":{"id":"2093030355750322178","createTime":"2026-08-28T01:38:18.091691","createBy":"2093030350801043458","updateTime":"2026-08-28T01:38:18.091803","updateBy":"2093030350801043458","deleted":0,"version":"3","tenantId":"0","processKey":"bpm_40a2a9c7a676439b","name":"链路验证流程1064-已改名","formKey":"ev_form_1064","defVersion":1,"status":"PUBLISHED","deploymentId":"16fae767-a23e-11f1-b162-6eb98e9cd88f","processDefinitionId":"bpm_40a2a9c7a676439b:1:16fc9519-a23e-11f1-b162-6eb98e9cd88f","graphJson":"{\"processKey\":\"bpm_40a2a9c7a676439b\",\"name\":\"链路验证流程1064-已改名\",\"formKey\":\"ev_form_1064\",\"version\":1,\"elements\":[{\"id\":\"node_start\",\"kind\":\"node\",\"type\":\"START\",\"source\":null,\"target\":null,\"config\":{},\"style\":{\"x\":100,\"y\":300}},{\"id\":\"node_approval\",\"kind\":\"node\",\"type\":\"APPROVAL\",\"source\":null,\"target\":null,\"config\":{\"name\":\"主管审批\",\"approver\":{\"type\":\"DESIGNATED\",\"value\":[\"1\"]}},\"style\":{\"x\":400,\"y\":300}},{\"id\":\"node_end\",\"kind\":\"node\",\"type\":\"END\",\"source\":null,\"target\":null,\"config\":{},\"style\":{\"x\":700,\"y\":300}},{\"id\":\"e1\",\"kind\":\"edge\",\"type\":null,\"source\":\"node_start\",\"target\":\"node_approval\",\"config\":{},\"style\":{}},{\"id\":\"e2\",\"kind\":\"edge\",\"type\":null,\"source\":\"node_approval\",\"target\":\"node_end\",\"config\":{},\"style\":{}}],\"canvas\":{}}"}}

```
### DELETE /workflow/defs/2093030356547239937（删除流程定义）
```json
{"code":0,"msg":"success","data":null}

```

## 10. 发起流程：提交表单数据（携带 deviceKey/commandKey）

### POST /api/form/data/ev_form_1064（提交→触发流程发起）
```json
{"code":0,"msg":"success","data":"1b36d7ee-c9dd-4cd2-81f8-e1ec78203640"}

```
### GET /workflow/instances（发起人查实例列表）
```json
{"code":0,"msg":"success","data":{"records":[{"id":"2093030356996030466","processInstanceId":"170d0fda-a23e-11f1-b162-6eb98e9cd88f","processDefKey":"bpm_40a2a9c7a676439b","processName":"链路验证流程1064-已改名","businessKey":"1b36d7ee-c9dd-4cd2-81f8-e1ec78203640","formKey":"ev_form_1064","initiatorId":"2093030350801043458","status":"RUNNING","createTime":"2026-08-28T01:38:18.389289"}],"total":"1","pageNum":"1","pageSize":"10"}}

```

## 11. 审批人待办 → 通过审批

### GET /workflow/tasks/todo（审批人待办）
```json
{"code":0,"msg":"success","data":{"records":[{"taskId":"170f59d6-a23e-11f1-b162-6eb98e9cd88f","processInstanceId":"170d0fda-a23e-11f1-b162-6eb98e9cd88f","processName":"链路验证流程1064-已改名","formKey":"ev_form_1064","businessKey":"1b36d7ee-c9dd-4cd2-81f8-e1ec78203640","createTime":"2026-08-28T01:38:18.365"}],"total":"1","pageNum":"1","pageSize":"10"}}

```
待办 taskId=170f59d6-a23e-11f1-b162-6eb98e9cd88f
### GET /workflow/tasks/170f59d6-a23e-11f1-b162-6eb98e9cd88f（审批详情）
```json
{"code":0,"msg":"success","data":{"taskId":"170f59d6-a23e-11f1-b162-6eb98e9cd88f","taskName":"主管审批","processInstanceId":"170d0fda-a23e-11f1-b162-6eb98e9cd88f","processDefinitionKey":"bpm_40a2a9c7a676439b","processName":"链路验证流程1064-已改名","formKey":"ev_form_1064","businessKey":"1b36d7ee-c9dd-4cd2-81f8-e1ec78203640","assignee":"1","initiatorId":"2093030350801043458","createTime":"2026-08-28T01:38:18.365","processVariables":{"approver":"2093030350801043458","recordId":"1b36d7ee-c9dd-4cd2-81f8-e1ec78203640","submitter":"2093030350801043458","formKey":"ev_form_1064","tenantId":"0","commandKey":"power_on","deviceKey":"ev_device_1064"},"approvalHistory":[]}}

```
### POST /workflow/tasks/170f59d6-a23e-11f1-b162-6eb98e9cd88f/complete（通过审批）
```json
{"code":0,"msg":"success","data":null}

```

## 12. 结果落库回看（发起人视角 + 实例状态）

### GET /workflow/instances?initiatorId=2093030350801043458（发起人视角）
```json
{"code":0,"msg":"success","data":{"records":[{"id":"2093030356996030466","processInstanceId":"170d0fda-a23e-11f1-b162-6eb98e9cd88f","processDefKey":"bpm_40a2a9c7a676439b","processName":"链路验证流程1064-已改名","businessKey":"1b36d7ee-c9dd-4cd2-81f8-e1ec78203640","formKey":"ev_form_1064","initiatorId":"2093030350801043458","status":"APPROVED","createTime":"2026-08-28T01:38:18.389289"}],"total":"1","pageNum":"1","pageSize":"10"}}

```
### GET /workflow/instances/170d0fda-a23e-11f1-b162-6eb98e9cd88f（实例详情+流转历史）
```json
{"code":0,"msg":"success","data":{"id":"2093030356996030466","processInstanceId":"170d0fda-a23e-11f1-b162-6eb98e9cd88f","processDefKey":"bpm_40a2a9c7a676439b","processName":"链路验证流程1064-已改名","businessKey":"1b36d7ee-c9dd-4cd2-81f8-e1ec78203640","formKey":"ev_form_1064","initiatorId":"2093030350801043458","status":"APPROVED","createTime":"2026-08-28T01:38:18.389289","activeNodeIds":[],"flowTrace":[{"activityId":"node_start","activityName":"Start","activityType":"startEvent","startTime":"2026-08-28T01:38:18.362","endTime":"2026-08-28T01:38:18.364","assignee":null,"taskId":null},{"activityId":"e1","activityName":null,"activityType":"sequenceFlow","startTime":"2026-08-28T01:38:18.365","endTime":"2026-08-28T01:38:18.365","assignee":null,"taskId":null},{"activityId":"e2","activityName":null,"activityType":"sequenceFlow","startTime":"2026-08-28T01:38:22.52","endTime":"2026-08-28T01:38:22.52","assignee":null,"taskId":null},{"activityId":"node_approval","activityName":"主管审批","activityType":"userTask","startTime":"2026-08-28T01:38:18.365","endTime":"2026-08-28T01:38:22.52","assignee":null,"taskId":"170f59d6-a23e-11f1-b162-6eb98e9cd88f"},{"activityId":"node_end","activityName":"End","activityType":"endEvent","startTime":"2026-08-28T01:38:22.521","endTime":"2026-08-28T01:38:22.522","assignee":null,"taskId":null}]}}

```

## 13. 设备执行结果回查（审批结果驱动设备）

### GET /iot/devices/ev_device_1064/commands（命令+执行结果）
```json
{"code":0,"msg":"success","data":[{"id":"2093030374419169282","createTime":"2026-08-28T01:38:22.54285","createBy":"1","updateTime":"2026-08-28T01:38:22.542858","updateBy":"1","deleted":0,"version":"1","tenantId":"0","deviceKey":"ev_device_1064","commandKey":"power_on","payload":null,"status":"SUCCESS","result":"{\"executed\":true,\"deviceKey\":\"ev_device_1064\",\"commandKey\":\"power_on\",\"executedAt\":\"2026-08-28T01:38:22.543656\"}","approvalBizId":"170d0fda-a23e-11f1-b162-6eb98e9cd88f"}]}

```
### GET /iot/devices/ev_device_1064（设备最终状态）
```json
{"code":0,"msg":"success","data":{"id":"2093030355578355714","createTime":"2026-08-28T01:38:18.051066","createBy":"1","updateTime":"2026-08-28T01:38:18.051072","updateBy":"1","deleted":0,"version":"0","tenantId":"0","deviceKey":"ev_device_1064","name":"验证开关1064","deviceType":"switch","status":"ONLINE","lastOnlineTime":"2026-08-28T01:38:18.050731"}}

```

## 14. 设备命令手动下发 + 结果回写（独立设备链）

### POST /iot/devices/ev_device_1064/commands（手动下发）
```json
{"code":0,"msg":"success","data":{"id":"2093030387635421186","createTime":"2026-08-28T01:38:25.694027","createBy":"1","updateTime":"2026-08-28T01:38:25.694033","updateBy":"1","deleted":0,"version":"1","tenantId":"0","deviceKey":"ev_device_1064","commandKey":"power_off","payload":"{\"reason\":\"manual\"}","status":"SUCCESS","result":"{\"executed\":true,\"deviceKey\":\"ev_device_1064\",\"commandKey\":\"power_off\",\"executedAt\":\"2026-08-28T01:38:25.694696\"}","approvalBizId":null}}

```
### POST /iot/devices/commands/2093030387635421186/result（设备回写失败结果）
```json
{"code":0,"msg":"success","data":{"id":"2093030387635421186","createTime":"2026-08-28T01:38:25.694027","createBy":"1","updateTime":"2026-08-28T01:38:25.694033","updateBy":"1","deleted":0,"version":"2","tenantId":"0","deviceKey":"ev_device_1064","commandKey":"power_off","payload":"{\"reason\":\"manual\"}","status":"FAILED","result":"{\"error\":\"hardware_fault\"}","approvalBizId":null}}

```
### GET /iot/devices/ev_device_1064/commands（最终命令列表）
```json
{"code":0,"msg":"success","data":[{"id":"2093030387635421186","createTime":"2026-08-28T01:38:25.694027","createBy":"1","updateTime":"2026-08-28T01:38:25.694033","updateBy":"1","deleted":0,"version":"2","tenantId":"0","deviceKey":"ev_device_1064","commandKey":"power_off","payload":"{\"reason\":\"manual\"}","status":"FAILED","result":"{\"error\":\"hardware_fault\"}","approvalBizId":null},{"id":"2093030374419169282","createTime":"2026-08-28T01:38:22.54285","createBy":"1","updateTime":"2026-08-28T01:38:22.542858","updateBy":"1","deleted":0,"version":"1","tenantId":"0","deviceKey":"ev_device_1064","commandKey":"power_on","payload":null,"status":"SUCCESS","result":"{\"executed\":true,\"deviceKey\":\"ev_device_1064\",\"commandKey\":\"power_on\",\"executedAt\":\"2026-08-28T01:38:22.543656\"}","approvalBizId":"170d0fda-a23e-11f1-b162-6eb98e9cd88f"}]}

```
DONE
