# M02-F01-01 通知模块前端落地

> 工作区统一知识库 — 功能追踪文件。
> 本文件记录 M02-F01-01 通知模块前端落地的完整规划、Step 状态和测试结果。

---

## 功能摘要

| 项目 | 内容 |
|------|------|
| **功能编号** | M02-F01-01 |
| **功能名称** | 通知模块前端落地 |
| **功能目标** | 实现通知列表页 + 标记已读交互，替换当前 `<BlankPage />` 占位，打通 Walking Skeleton 最后一环 |
| **Walking Skeleton 位置** | 第四环（最终环）：`登录 ✅ → 表单 ✅ → 单节点审批 ✅ → 通知 ✅` |
| **后端就绪度** | ✅ 完全就绪（`sw-basic-notify` 含 Controller、Facade、Mapper、测试、Flyway 建表） |
| **前端当前状态** | ✅ 已完成（NotifyHome.vue 替换为完整通知列表页 + 标记已读交互） |
| **总 Step 数** | 4（Step 0 ~ Step 3） |
| **最终状态** | **COMPLETED** ✅ |
| **完成日期** | 2026-07-15 |
| **推荐模型** | `deepseek-v4-flash`（纯前端，遵循已有模式，无跨项目变更） |

---

## 影响范围

### 涉及的文件

**新建（3 个）：**
| 文件 | 说明 |
|------|------|
| `Smart-WorkFlow-Web/src/contracts/notify.ts` | NotifyMessage TS 类型 |
| `Smart-WorkFlow-Web/src/modules/notify/api/index.ts` | API 层（queryNotifyMessages / markAsRead） |
| `Smart-WorkFlow-Web/src/modules/notify/api/index.spec.ts` | API 层单测 |

**修改（3 个）：**
| 文件 | 改动 |
|------|------|
| `Smart-WorkFlow-Web/src/foundation/mock/seeds.ts` | 追加 MOCK_NOTIFY_MESSAGES 种子 + `notify:view` 到 permissions |
| `Smart-WorkFlow-Web/src/foundation/mock/handlers.ts` | 追加 2 个 MSW handler |
| `Smart-WorkFlow-Web/src/modules/notify/views/NotifyHome.vue` | 替换为完整通知列表页 |

**数据库表：** 无改动

---

## Step 状态

| Step | 内容 | 状态 | 方案 | 执行回执 | 测试回执 | 验收结果 |
|:----:|------|:----:|:----:|:--------:|:--------:|:--------:|
| 0 | 测试基线验证 | **PASSED** ✅ | 📄 `ready/step-0-测试基线验证.md` | 2026-07-15 | 与执行回执合并 | ✅ |
| 1 | 前端通知基础设施 | **PASSED** ✅ | 📄 `ready/step-1-前端通知基础设施.md` | 2026-07-15 | 2026-07-15 | ✅ |
| 2 | 通知列表页 | **PASSED** ✅ | 📄 `ready/step-2-通知列表页.md` | 2026-07-15 | 2026-07-15 | ✅ |
| 3 | 端到端验证 + 回归 | **PASSED** ✅ | 📄 `ready/step-3-端到端验证.md` | 2026-07-15 | 与执行回执合并 | ✅ |

---

## 后端 API 参考

### GET /notify/messages

获取当前用户的通知列表（按 create_time DESC，不分页）。

**请求：** `GET /notify/messages`

**响应：**
```json
{
  "code": 0,
  "msg": "success",
  "data": [
    {
      "id": 1,
      "recipientId": 1,
      "title": "请假申请审批通过",
      "content": "您的请假申请（2026-07-01）已通过审批",
      "bizType": "WF_APPROVED",
      "bizId": "fd_001",
      "read": false,
      "createTime": "2026-07-15T10:00:00",
      "createBy": null,
      "updateTime": "2026-07-15T10:00:00",
      "updateBy": null,
      "tenantId": 1
    }
  ]
}
```

### POST /notify/messages/{id}/read

将指定通知标记为已读（验证 recipientId 归属）。

**请求：** `POST /notify/messages/{id}/read`

**响应：** `{ "code": 0, "msg": "success" }`

---

## 关键设计决策

| 决策 | 选项 | 选择 | 原因 |
|------|------|:----:|------|
| 页面文件名 | 新建 NotifyList.vue vs 直接替换 NotifyHome.vue | 直接替换 | 通知模块只有单页，不增加文件 |
| 列表布局 | 卡片列表 vs 表格(StandardListTemplate) | 表格 | 与 TodoList/ProcessDefList 模式一致 |
| bizType 展示 | 字典 vs 内联映射 | 内联映射 | 后端无字典配置，直接硬编码 |
| 分页 | 后端不分页 | 前端也不分页 | 后端设计为平铺列表 |

---

## bizType 映射表

| 枚举值 | 中文标签 | Tag 类型 | 说明 |
|--------|----------|:--------:|------|
| `WF_TODO` | 流程待办 | `warning` | 新任务到达、催办等 |
| `WF_APPROVED` | 审批结果 | `success` | 流程被通过/驳回后通知发起人 |

---

## NotifyMessage TS 合约定义

```typescript
interface NotifyMessage {
  id: number
  recipientId: number
  title: string
  content: string
  bizType: 'WF_TODO' | 'WF_APPROVED'
  bizId: string | null
  read: boolean
  createTime: string
  updateTime: string
  // BaseEntity 字段
  createBy: number | null
  updateBy: number | null
  tenantId: number
}
```
