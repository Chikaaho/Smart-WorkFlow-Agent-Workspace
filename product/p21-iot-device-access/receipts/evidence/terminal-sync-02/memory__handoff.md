# 功能交接摘要

## 1. 功能名称
P21 IoT 设备接入、受控脚本与流程联动（`p21-iot-device-access`）。

## 2. 功能目标
在既有腾讯 IoT 最小能力上完成后台设备管理、自建 MQTT、通用物模型与 Topic、JavaScript/Java 受控脚本、设备事件/阈值发起流程，以及流程选择设备并执行能力的统一闭环。

## 3. 最终状态
**COMPLETED（待规划确认，2026-09-08）**。功能级PASSED继续锁定；阶段三复核01确认同步值和Planner可读入口正确，但缺knowledge/功能清单原样副本及机器终态。当前唯一补证入口为 `planning-execution-prompt-p21-iot-terminal-sync-01.md`。

## 4. 本轮做了什么
复核 `terminal-sync-p21-iot-device-access-01.md`：todo/memory、目录、体积和秘密扫描通过；回执未附Planner禁读权威文件副本，且没有机器终态末行与Validator原件，因此未确认COMPLETED。

## 5. Executor 内部 Step 汇总
快照 → knowledge-first 落唯一值 → 清单/索引/todo/memory 同步 → 旧口径检索 → 勾稽 → 终态校验 → 回执。

## 6. 实际修改范围
`knowledge/current-status.md`、`session-handoff.md`、`features/p21-iot-device-access.md`（新建）、`feature-reconciliation-index.md`、`known-issues.md`（I14）、`Smart-WorkFlow-Server/功能清单.md`、`todo/requirement-pool.md`、`memory/{state,features,handoff,README,issues}.md`。

## 7. 测试和验收结果
规划功能验收通过（规划验收08，A1—A8 功能级 PASSED）。基线：Server 12 模块汇总 **1182/0/0/0（BUILD SUCCESS）**、Web **124f+1sk/1168t+3sk**、Flyway **H2 V66（66）/PG V66（65）**、产品行为 Owner Broker 双向 MQTT/19 原子工作项 COMPLETED/r3 16/16 哈希/browser OPERABLE。

## 8. 关键设计决策
连接配置、设备管理状态和连接状态分离；流程设备资格为"已发布＋可接入流程使用"；腾讯与自建 MQTT 共用统一上层契约；JavaScript/Java 共用受控宿主函数且隔离执行；设备事件/阈值以版本化规则映射表单并幂等发起流程；腾讯实网因无账号按 Owner 本轮免验，不冒充真实云端已验证。

## 9. 当前系统状态
正式功能数 **44**、清单 **✅46/🟦22/⬜22**（90，M08 十行升✅，其余 80 行零变化）；P21 已核销、I14 已满足/关闭；M08 仍部分完成（10✅/1🟦/2⬜）。

## 10. 还有什么没做
只剩TS1权威全文副本与TS2机器终态；实现、同步值和全部行为均锁定。

## 11. 已知问题和风险
Owner Broker、REFERENCE、双语言、鉴权、审计、三策略、租户隔离、页面行为和工程基线均已锁定。腾讯实网免验不等于实网已验证；账号口令继续禁止落盘。M08-F04-01 按钮发送 🟦、F04-02 定时发送 ⬜、F05-02 指令模板 ⬜ 为保留边界。

## 12. 下一轮要做什么
Executor只按终态补证提示01复制15个权威文件、生成manifest/checks，并提交带机器终态和Validator原件的回执02。

## 13. 下一轮要达到什么结果
副本可复算全部唯一值、manifest全过、机器input等于回执末行且Validator exit=0；随后Planner确认COMPLETED并归档阶段三方向。

## 14. 下一轮开始前必须读取的知识文件
`product/p21-iot-device-access/receipts/planning-review-terminal-sync-p21-iot-01.md`、`planning-execution-prompt-p21-iot-terminal-sync-01.md`、原阶段三方向。

## 15. 新会话启动提示词
本会话角色：执行。P21功能级PASSED且同步值已落，当前只按 `product/p21-iot-device-access/receipts/planning-execution-prompt-p21-iot-terminal-sync-01.md` 补TS1/TS2，提交回执02；不得改值、重跑业务、执行Git或宣称规划已确认。
