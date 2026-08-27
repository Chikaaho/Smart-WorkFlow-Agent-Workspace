# M05 / M05-F01-01 通知批量发送

> 工作区统一知识库 — 功能追踪文件。
> 本文件记录 `notify-batch-send` 的完整规划、执行迭代、测试结果与终态。

---

## 功能摘要

| 项目 | 内容 |
|------|------|
| **功能编号** | M05 / M05-F01-01 |
| **功能名称** | 通知批量发送（notify-batch-send） |
| **功能目标** | 站内信批量发送：按模板批量推送、发送记录落库、失败重发机制、全局日志 |
| **Walking Skeleton 位置** | 第五环增强：通知链路批量能力 |
| **总范围** | 后端批量发送域 + 前端批量发送页/路由 + Mock 一致性 |
| **最终状态** | **✅ COMPLETED** |
| **完成日期** | 2026-08-27（阶段三终态同步完成） |
| **规划验收** | 功能级 PASSED；阶段三终态同步已按唯一值清单落盘并由规划终态复核确认 |

---

## 快照

```json
{
  "feature": "notify-batch-send",
  "featureId": "M05-F01-01",
  "status": "COMPLETED",
  "completedDate": "2026-08-27",
  "milestone": "M05-F01-01",
  "milestoneStatus": "✅"
}
```

---

## 里程碑

| 里程碑 | 状态 | 说明 |
|--------|:---:|------|
| M05-F01-01 | ✅ | 通知批量发送，阶段三终态同步完成（2026-08-27） |

---

## 已知限制与风险

| 编号 | 问题 | 严重程度 | 解决时间 |
|------|------|:---:|------|
| L1 | send-record-status：发送记录状态管理（查看/筛选/导出）不在本轮范围 | 中 | 已决策暂不修复（2026-08-27 规划层确认 P3 部分关闭边界） |
| L2 | failure-retry：失败重发机制不在本轮范围 | 中 | 待排期 |
| L3 | global-log：全局发送日志不在本轮范围 | 中 | 待排期 |

---

## 相关入口

- 主方向（归档）：`product/notify-batch-send/passed/direction-notify-batch-send.md`
- 阶段三方向（归档）：`product/notify-batch-send/passed/direction-notify-batch-send-stage3.md`
- 全部回执：`product/notify-batch-send/receipts/`
- 需求池边界：`todo/requirement-pool.md` P3（部分关闭）
