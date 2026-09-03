# P57 BPM Engine 统一流程节点扩展能力规划验收记录 04

> 审查角色：规划（Planner）  
> 审查日期：2026-09-03  
> 上一提示：`product/p57-bpm-node-extension/receipts/planning-execution-prompt-p57-bpm-node-extension-02.md`  
> 本轮回执：`product/p57-bpm-node-extension/receipts/execution-supplement-r1-r6-p57-bpm-node-extension-20260902.md`  
> 原始附件：`product/p57-bpm-node-extension/receipts/attachments/execution-output-r1-r6-20260902.txt`  
> 本轮结论：**FAILED（二级提示后仍未闭环）**  
> 功能状态：**VERIFYING**

## 1. 结论

R1、R4、R5已经以同ID真实行为闭环，予以通过并锁定。R3的五类非法图通过受控客户端故障注入抵达未改写的真实publish和真实storage查询，五类业务码明确、草稿状态不变、三组持久化计数逐项为零增量；该证据足以验证服务端发布门和零写入，予以通过并锁定。三类非法profile未进入健康态且已按PID清理，同样锁定通过。

R2仍没有两个租户的普通授权用户真实认证和能力响应，不能由管理员结果、夹具定义或权限测试替代。

R6不能通过。除R2未完成和测试数据仍有残留外，附件的最终差异清单显示以下验证资产位于生产源码：

- `sw-biz/sw-bpm/sw-bpm-engine/src/main/java/com/sw/ck/bpm/engine/verification/`
- `sw-biz/sw-bpm/sw-bpm-process/src/main/java/com/sw/ck/bpm/process/controller/P57EvidenceController.java`

profile-only只能证明默认不启用，不能证明不进入生产构建产物。这与正式方向“隔离验证节点不得作为未定义业务节点进入正式生产目录”冲突，也影响验收标准3和11。验证fixture必须移入测试范围或独立且不进入生产产物的验证源集；相关控制器、非法profile与凭据/测试接口不得随正式jar交付。

二级提示后仍有同类缺口，现下发三级零裁量提示：`product/p57-bpm-node-extension/receipts/planning-execution-prompt-p57-bpm-node-extension-03.md`。

## 2. R1—R6 最终核销

| 包 | 结论 | 锁定事实或缺口 |
|---|---|---|
| R1 | **通过并锁定** | 同一业务记录和实例已完成、无活跃节点、到达End，页面不再显示RUNNING；终态修复有自动化回归。 |
| R2 | 未通过 | 两个固定租户普通授权用户没有真实登录与能力JSON逐字段对照。 |
| R3 | **通过并锁定** | 接受受控客户端故障注入作为抵达真实publish的手段；五类publish均真实执行、错误码明确、状态仍为草稿、三组计数零增量；三非法profile未健康并清理。 |
| R4 | **通过并锁定** | 真实production页面的502、畸形JSON、缺字段三场景均明确失败、控件禁用且无保存请求。 |
| R5 | **通过并锁定** | 同一processKey/businessKey/instanceId/taskId完成START→APPROVAL→END与DESIGNATED审批；结果/轨迹一致，skeleton兼容成立。 |
| R6 | 未通过 | R2未完成；P57验证控制器/translator fixture仍在生产源码；已发布R1/R5表单和流程测试对象尚未安全清理；清理后最终回归尚未执行。 |

## 3. 已锁定并禁止重验

- E6以及R1、R3、R4、R5全部锁定通过。
- 不再执行隔离节点全链、五类publish、三类非法profile、三种fail-closed、APPROVAL主链或graph_json验证。
- 不再讨论R3故障注入授权；Planner已确认该边界可核销。
- 后续唯一范围是三级提示中的Z1—Z4。

## 4. 状态与阻塞口径

当前仍有可执行的生产产物清理和测试数据收口，功能暂保持`VERIFYING`。执行层完成可执行项后，若仍无法取得两个普通用户的真实认证会话，必须提交精确阻塞回执并使用合法功能状态`BLOCKED`，不得继续重复管理员登录、验证码页面或夹具定义。
