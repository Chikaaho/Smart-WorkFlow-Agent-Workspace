# P64阶段Ⅲ既有工单关闭与数量核实

> 本只读任务已完成，结果已由[裁决04](../product/p64-mes-advanced-orchestration/receipts/planning-review-phase-3-04.md)审查；当前执行入口为[数量差异关闭收尾](../product/p64-mes-advanced-orchestration/receipts/planning-execution-prompt-p64-phase3-03.md)。以下保留下发时点要求。

2026-10-12；本会话角色：规划，委派角色：执行。承接Owner“修复，以业务导向为要求”的授权与[验收03](../product/p64-mes-advanced-orchestration/receipts/planning-review-phase-3-03.md)。

目标：用既有对象的实际结果确定最后两个关闭事实。UI、领料补办、成品入库、受控设备反馈及此前通过项锁定。

1. 读取运行库sw_p64_phase3中341/342现有实例终态、结束时间/当前待办或等待原因。实例分别661adeda-c631-11f1-aae8-2214eaf7855f、7ec9fddf-c631-11f1-aae8-2214eaf7855f；业务记录分别28223a87-520f-4371-8f8f-7ff95a17ce01、0ced9f49-9763-4005-bdd0-117093c8ca38。现有原录RUNNING与回执APPROVED可能只是异步时点差，以读取结果消解。
2. 342工单qty=10、成品0，回执称报废3。读取已存在的报工/终检与报废单e439b9a2-9acf-4dc6-9399-954f68c07c1e，解释计划数量、实际产出、报废/未生产/其余数量及关闭依据；不要假定10必须全量生产。提供真实字段值及语义核实结论，无需实现正文。

范围：既有运行库目标记录、既有日志与必要权威语义核实；连接秘密沿既有本机配置，不回显。优先读取、不启动服务、不重建或重跑场景、不编译测试、不改代码或业务数据、不校验哈希、不延时轮询。无法读取时说明实际失败及可用替代结果，不据缺附件推定严重缺陷。

结果：写search_fallback/p64-phase3-close-readback-20261012.md，附最小实际输出（可直接放在该文件或product既有证据目录）。不要求新的整包/完成回执；说明核实时点与两个问题答案即可。若发现真实缺陷，本探索仅回传事实及业务影响，保留已通过结果。

状态：P64整体IN_PROGRESS，Ⅰ/ⅡPASSED、ⅢVERIFYING；3阶段完成2/进行中1/未开始0；47、46/22/22=90、ADV64、问题57与正式基线保持，P62性能延期/OFF保持。沿既有knowledge-first授权同步当前路由，下一动作=Planner读取本核实结果裁决关闭；普通文档Git按既有授权收尾，不扩大发布权限。
