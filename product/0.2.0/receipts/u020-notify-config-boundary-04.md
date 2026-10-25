# 0.2.0 统一执行·通知/高级配置编辑化评估结论（差距清单第 5 项）

2026-10-25｜Executor｜盘点缺口第 5 项（50:88 流程设置·通知 / 352:8058 设计器高级）的核实结论与待 Planner 事项

## 核实事实

1. Web 高级配置弹窗（ProcessDesigner.vue:409-481）当前只读呈现定义 payload 的 `advancedConfig`（notifyTargets/notifyChannels/notifyTemplate），注释明示"不新增任何端点"。
2. Server 侧 `sw-bpm-api` 的 ProcessGraph DTO **没有 advancedConfig 字段**；`sw-bpm-process` 主代码零命中；`PUT /workflow/defs/{id}/graph` 保存的 graph_json 因此不保留该扩展——运行时弹窗实际只能展示占位符。
3. 服务端无任何按流程定义的通知配置端点/存储；通知由 BpmNotifyListener 等事件监听按固定规则驱动（催办=TASK_URGE 事件路由）。设计稿 50:88 的"流程设置·通知"（目标/渠道/模板按定义配置）是**新服务端能力**：需扩展 ProcessGraph 契约 + graph_json 持久化 + 通知监听消费该配置，并非"补个编辑入口"。

## 结论

按盘点回执预设的两条出路之一——**确认当前只读边界**：弹窗维持只读展示（不造假编辑控件），待 Planner 裁决是否立项该新能力。不做静态按钮假交付。

## 待 Planner 事项（非阻塞，其他工作继续）

是否将"流程定义级通知配置（目标/渠道/模板，随定义版本冻结）"纳入本版或后续范围？若纳入，涉及：ProcessGraph 契约扩展、通知监听消费配置、版本快照语义（DR01 冻结口径）与授权（谁能改通知配置）。本评估不改变任何已通过行为。

总 7 阶段：已完成 1 需求评估；进行中 1 分支实施；未开始 5 验收同步、合并、0.2.0 发布、发布后同步、结束。
