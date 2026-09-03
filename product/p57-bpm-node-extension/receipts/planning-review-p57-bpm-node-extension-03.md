# P57 BPM Engine 统一流程节点扩展能力规划验收记录 03

> 审查角色：规划（Planner）  
> 审查日期：2026-09-02  
> 上一提示：`product/p57-bpm-node-extension/receipts/planning-execution-prompt-p57-bpm-node-extension-01.md`  
> 本轮回执：`product/p57-bpm-node-extension/receipts/execution-supplement-e1-e7-p57-bpm-node-extension-20260902.md`  
> 原始附件：`product/p57-bpm-node-extension/receipts/attachments/execution-output-e1-e7-20260902.txt`  
> 本轮结论：**FAILED（一级提示后仍未闭环）**  
> 功能状态：**VERIFYING**

## 1. 结论

本轮新增了真实应用、浏览器、持久化与原始附件，证据等级明显提高，但回执仍明确把 E2、E3、E5 标记为未完成，E4 只完成正常路径；因此不能裁决功能级 `PASSED`。

真实验证节点链路还暴露一个必须修复的行为矛盾：实例 `activeNodeIds=[]` 且流转记录已到 `End`，但业务状态仍为 `RUNNING`。这不是证据格式问题，而是可见结果与运行事实不一致；在状态闭合前，验收标准4和9均不能通过。

一级提示后仍有同类缺口，现按治理规则下发二级提示：`product/p57-bpm-node-extension/receipts/planning-execution-prompt-p57-bpm-node-extension-02.md`。二级提示删除已通过范围，只保留 R1—R6。

## 2. E1—E7 核销

| 包 | 结论 | 核销结果 |
|---|---|---|
| E1 隔离扩展全链 | 部分通过 | 锁定启动发现、真实前端能力识别、配置、保存、发布、启动及到达End；业务状态仍RUNNING，终态一致性未通过。 |
| E2 双租户普通授权 | 未通过 | 只创建过夹具，两个普通授权用户没有分别完成真实登录和能力请求；夹具随后已清理。 |
| E3 失败零写入 | 未通过 | 三类非法注册有`Application run failed`，但未证明应用未进入健康态；五类真实publish请求及逐类数据库/部署前后计数未执行。 |
| E4 真实设计器 | 部分通过 | 正常能力清单、真实DOM、配置、保存和发布已锁定；接口失败、畸形响应、缺字段三条fail-closed页面链未执行。 |
| E5 现有审批主链 | 未通过 | START→APPROVAL→END、DESIGNATED审批和skeleton入口未执行。 |
| E6 graph_json与存量边界 | **通过并锁定** | 固定输入、数据库原始值、服务回读逐字节相等；当前H2实例表计数和已部署BPMN已绑定，外部环境存量明确未验证。后续禁止重验。 |
| E7 原始输出 | 部分通过 | 已有附件可读取并绑定聚焦后端和前端输出；仍缺最终代码状态下的后端整体回归、前端整体回归及R1—R5原始行为输出。 |

## 3. 锁定并删除的范围

- `P57_VERIFY` 在`dev,p57-evidence`真实重建应用中被发现，注册表为4 translators；默认生产目录只含START、APPROVAL、END且无P57验证类型污染。
- 真实设计器已从能力接口识别`P57_VERIFY`，完成配置、保存、发布和表单提交；同一业务记录/实例已执行验证serviceTask并到达End。
- 正常能力清单响应、正常设计器DOM与保存成功不再重验；后续只验证三种fail-closed。
- E6整体通过并从剩余范围删除。
- 未认证401、无角色用户403、超级管理员200、未登录跳转登录页不再重验。
- 已有前后端聚焦测试原始附件保留；后续只在最终代码状态跑最终回归，不重复制作中间摘要。

## 4. 唯一剩余范围

剩余范围仅为二级提示中的R1—R6：验证实例终态一致性、双租户普通授权、发布/启动失败零残留、三种浏览器fail-closed、现有APPROVAL主链与skeleton、最终原始回归。其他内容不得重新展开。
