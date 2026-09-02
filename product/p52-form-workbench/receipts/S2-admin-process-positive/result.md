# S2 · 结果与断言

## 正向目标断言

| 断言 | 结果 |
|---|---|
| 管理员保存合法图（非绕过校验的伪装） | `PUT /workflow/defs/2094987379579838466/graph` code 0；图 3 元素含 START/END；独立 validate 端点 0 错误 |
| 管理员发布业务成功（非「权限网关放行但业务失败」） | `POST …/publish` HTTP 200 且 **code 0**；status=PUBLISHED、version=2、deploymentId=`74c244e4-a67c…`、processDefinitionId 已回填 |
| 发布持久化回查一致 | bpmn-xml 端点 200/code 0 取回 1641 字节部署 XML；列表回查 status=PUBLISHED、version=2 与发布响应一致 |
| 管理员删除业务成功 | `DELETE …/2094987380657774593` code 0 |
| 删除持久化回查 | 删除后按 id 读取 code 2010「流程定义不存在」；formKey 列表计数 2→1 |

## 对照说明

- limited 账号对流程保存/发布/删除三项 403 及零副作用已由第三次复验 §2 R5 锁定通过，本轮未重跑。
- 上一轮回执中 admin 发布仅到达业务码 2000（图缺少开始节点）、删除无原始证据——本轮以「合法初始图保存 + 发布 code 0 + 部署 XML 回查」与「删除全链原始证据」闭合。

## 结论

S2 缺口闭合：管理员对流程保存、发布、删除的管理操作均有业务成功的原始请求/响应与持久化回查证据，发布到达真实 Flowable 部署（BPMN XML 可取回）。
