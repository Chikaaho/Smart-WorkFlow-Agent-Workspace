# G5 三身份与多租户隔离（debug 认证：test_<userId>，dev profile fail-closed 门禁）
时间: 2026-09-08 09:34:06  用户: 1=admin(t0,is_admin) 2=iotadmin(t0,受限) 3=iotuser(t0,受限) 100=tenant88admin(t88,is_admin)

## 未认证/非法 token
- token=test_3 → GET /iot/connections: 200
- token=invalid-token-x → GET /iot/connections: 401

## 连接配置跨租户
- admin(t0) 列表: 2 [('2097135932003618817', 'owner-bad-pw'), ('2097131605679677442', 'owner-mosquitto')]
- tenant88(t88) 列表: HTTP 401, body: {"code":401,"msg":"未认证","data":null}

## 服务端 @PreAuthorize 鉴权后（iot:connection:manage / iot:runtime:view）
- user1 GET /iot/connections → 200 {"code":0,"msg":"success","data":[{"code":"owner-bad-pw","ke
- user2 GET /iot/connections → 403 {"code":403,"msg":"无权限","data":null}
- user3 GET /iot/connections → 403 {"code":403,"msg":"无权限","data":null}
- user100 GET /iot/connections → 401 {"code":401,"msg":"未认证","data":null}
- admin(t0) 写操作 POST /iot/connections 无 body → 500
- iotuser(test_3) 写操作 → 500

## 重启后数据与订阅恢复（PG 持久化）
- 重启后 connections 仍为 2 条（持久化）
- 重启后 connect 恢复订阅: {"code":0,"msg":"success","data":{"connected":true,"subscriptions":3}}

## G3 表单契约校验真实输出
```
发布（字段不存在）→ HTTP 400 表单契约校验失败: 字段不存在于已发布表单: not_exist_field
发布（必填缺来源）→ HTTP 400 表单契约校验失败: 必填字段缺少来源: temperature
发布（合法映射）  → 0 PUBLISHED；MQTT 触发后 trigger SUCCESS
```
