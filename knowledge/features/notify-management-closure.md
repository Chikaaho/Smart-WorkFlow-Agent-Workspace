# M05 通知管理缺口闭环

> 工作区统一知识库 — 功能追踪文件。
> 本文件记录 M05 通知管理缺口闭环的完整规划、Step 状态和测试结果。

---

## 功能摘要

| 项目 | 内容 |
|------|------|
| **功能编号** | P3 / I41 / I42 / I45 |
| **功能名称** | M05 通知管理缺口闭环 |
| **功能目标** | 补齐站内信的基础管理闭环：删除能力 + 查询条件过滤 |
| **Walking Skeleton 位置** | 第四环增强：通知列表 + 标记已读 + **删除** + **过滤** |
| **后端就绪度** | ✅ 完全就绪（sw-basic-notify 含 Controller、Facade、Mapper、测试、Flyway 建表） |
| **前端当前状态** | ✅ 已完成（NotifyHome.vue 增强为删除 + 过滤） |
| **总 Step 数** | 2（Step 1 后端 + Step 2 前端） |
| **最终状态** | **COMPLETED** ✅ |
| **完成日期** | 2026-08-25 |
| **规划验收** | D210 功能级 PASSED |

---

## 影响范围

### 涉及的文件

**后端修改（4 个）：**
| 文件 | 改动 |
|------|------|
| `NotifyController.java` | 新增 DELETE /notify/messages/{id} 端点；增强 GET /notify/messages 支持 ?read/keyword 过滤 |
| `NotifyMessageService.java` | 新增 findByRecipientWithFilter 和 deleteMessage 方法签名 |
| `NotifyMessageServiceImpl.java` | 实现 findByRecipientWithFilter（LambdaQueryWrapper 动态条件）和 deleteMessage |
| `NotifyControllerIntegrationTest.java` | 新增 6 个测试：删除端到端、越权删除、跨租户删除、已读状态过滤、关键词过滤、组合过滤 |

**前端修改（5 个）：**
| 文件 | 改动 |
|------|------|
| `api/index.ts` | 新增 NotifyQueryParams 接口、deleteMessage 函数；queryNotifyMessages 支持 params 参数 |
| `views/NotifyHome.vue` | 新增过滤栏（状态下拉 + 关键词搜索）、删除按钮（带确认对话框） |
| `api/index.spec.ts` | 新增 6 个测试：无参数查询、read 过滤、keyword 过滤、组合过滤、deleteMessage |
| `views/NotifyHome.spec.ts` | 新增 3 个测试：删除确认后删除、用户取消删除、删除失败处理 |
| `foundation/mock/handlers.ts` | 新增 DELETE Mock handler；增强 GET handler 支持 read/keyword 过滤 |

**数据库表：** 无改动（逻辑删除由 @TableLogic 支持）

---

## Step 状态

| Step | 内容 | 状态 | 执行回执 | 测试回执 | 验收结果 |
|:----:|------|:----:|:--------:|:--------:|:--------:|
| 1 | 后端 - 删除接口 + 查询过滤 + 测试 | **PASSED** ✅ | 2026-08-25 | 2026-08-25 | ✅ |
| 2 | 前端 - 删除按钮 + 查询过滤 + API + Mock + 测试 | **PASSED** ✅ | 2026-08-25 | 2026-08-25 | ✅ |

---

## 后端 API 参考

### GET /notify/messages（增强）

获取当前用户的通知列表，支持已读状态和关键词过滤。

**请求：** `GET /notify/messages?read=false&keyword=审批`

**参数：**
- `read` (可选): `true` = 仅已读，`false` = 仅未读，不传 = 全部
- `keyword` (可选): 关键词，匹配标题或内容

**响应：** 同原有格式

### POST /notify/messages/{id}/read

将指定通知标记为已读（验证 recipientId 归属）。无变化。

### DELETE /notify/messages/{id}（新增）

删除指定通知（逻辑删除，验证 recipientId 归属）。

**请求：** `DELETE /notify/messages/{id}`

**响应：** `{ "code": 0, "msg": "success" }`

**权限：** 仅收件人本人可删除（recipientId 校验）

---

## 关键设计决策

| 决策 | 选项 | 选择 | 原因 |
|------|------|:----:|------|
| 删除方式 | 逻辑删除 vs 物理删除 | 逻辑删除 | 沿用 BaseEntity @TableLogic，数据可审计 |
| 删除权限 | 仅本人 vs 管理员可删 | 仅本人 | 符合方向文档"不得自行扩大权限"要求 |
| 查询过滤 | 后端过滤 vs 前端过滤 | 后端过滤 | 减少数据传输，支持大数据量 |
| 关键词匹配 | 精确匹配 vs 模糊匹配 | 模糊匹配（LIKE） | 用户体验更好 |

---

## 测试结果

**后端集成测试（10 个）：**
1. GET 列表(read=false) → POST 已读 → 再查 read=true ✅
2. USER_B 调 read(USER_A 的消息) → BaseException + 消息仍未读 ✅
3. 跨租户 GET 空列表 / POST read 不到(NOT_FOUND) ✅
4. 同租户不同用户 GET 列表 → 不含对方消息 ✅
5. DELETE 通知 → 逻辑删除 → GET 列表不再出现 ✅
6. USER_B 调 delete(USER_A 的消息) → BaseException + 消息仍存在 ✅
7. 跨租户 DELETE → NOT_FOUND（租户隔离） ✅
8. GET ?read=false → 仅未读；GET ?read=true → 仅已读 ✅
9. GET ?keyword=审批 → 仅匹配标题或内容包含关键词的通知 ✅
10. GET ?read=false&keyword=请假 → 未读且含关键词 ✅

**前端测试：** 100 spec files / 988 tests passed (0 failed, 0 skipped)

**前端四连校验门：** typecheck ✅ / lint ✅ / test ✅ / build ✅
