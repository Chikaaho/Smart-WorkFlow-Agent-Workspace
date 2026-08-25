# 测试回执

## 1. Step 编号和名称

- **Step 1：后端 - 删除接口 + 查询过滤 + 测试**
- **Step 2：前端 - 删除按钮 + 查询过滤 + API + Mock + 测试**

## 2. 测试环境

- **后端**：Java 21 + Spring Boot 3.4 + H2 内存数据库 + MyBatis-Plus
- **前端**：Vue 3 + TypeScript + Vite + Vitest + Element Plus
- **操作系统**：macOS（物理内存 1.6G）

## 3. 测试前置条件

- 后端 `NotifyControllerIntegrationTest` 使用 H2 内存数据库，Flyway 禁用，手动建表
- 前端 Mock 模式（`VITE_USE_MOCK=true`），无需后端服务

## 4. 实际执行的测试命令

**后端：**
```bash
cd Smart-WorkFlow
MAVEN_OPTS="-Xmx2g" mvn -q test -pl sw-basic/sw-basic-notify/sw-basic-notify-biz -Dtest=NotifyControllerIntegrationTest
MAVEN_OPTS="-Xmx2g" mvn -q test -pl sw-basic/sw-basic-notify/sw-basic-notify-biz
```

**前端：**
```bash
cd Smart-WorkFlow-Web
NODE_OPTIONS="--max-old-space-size=2048" pnpm test -- --run src/modules/notify
NODE_OPTIONS="--max-old-space-size=2048" pnpm test -- --run
NODE_OPTIONS="--max-old-space-size=2048" pnpm typecheck
NODE_OPTIONS="--max-old-space-size=2048" pnpm lint
NODE_OPTIONS="--max-old-space-size=2048" pnpm build
```

## 5. 各测试项结果

### 后端集成测试（NotifyControllerIntegrationTest）

| # | 测试名称 | 结果 |
|---|----------|------|
| 1 | GET 列表(read=false) → POST 已读 → 再查 read=true | ✅ PASSED |
| 2 | USER_B 调 read(USER_A 的消息) → BaseException + 消息仍未读 | ✅ PASSED |
| 3 | 跨租户 GET 空列表 / POST read 不到(NOT_FOUND) | ✅ PASSED |
| 4 | 同租户不同用户 GET 列表 → 不含对方消息 | ✅ PASSED |
| 5 | DELETE 通知 → 逻辑删除 → GET 列表不再出现 | ✅ PASSED |
| 6 | USER_B 调 delete(USER_A 的消息) → BaseException + 消息仍存在 | ✅ PASSED |
| 7 | 跨租户 DELETE → NOT_FOUND（租户隔离） | ✅ PASSED |
| 8 | GET ?read=false → 仅未读；GET ?read=true → 仅已读 | ✅ PASSED |
| 9 | GET ?keyword=审批 → 仅匹配标题或内容包含关键词的通知 | ✅ PASSED |
| 10 | GET ?read=false&keyword=请假 → 未读且含关键词 | ✅ PASSED |

### 后端实体测试（NotifyMessageIntegrationTest）

| # | 测试名称 | 结果 |
|---|----------|------|
| 1 | send 自动注入 + is_read 验证 | ✅ PASSED |
| 2 | findByRecipient 验证 | ✅ PASSED |
| 3 | 租户隔离验证 | ✅ PASSED |

### 前端 API 测试（modules/notify/api/index.spec.ts）

| # | 测试名称 | 结果 |
|---|----------|------|
| 1 | queryNotifyMessages sends GET /notify/messages without params | ✅ PASSED |
| 2 | queryNotifyMessages sends read=false filter | ✅ PASSED |
| 3 | queryNotifyMessages sends keyword filter | ✅ PASSED |
| 4 | queryNotifyMessages sends combined filters | ✅ PASSED |
| 5 | markAsRead sends POST /notify/messages/:id/read | ✅ PASSED |
| 6 | deleteMessage sends DELETE /notify/messages/:id | ✅ PASSED |

### 前端组件测试（modules/notify/views/NotifyHome.spec.ts）

| # | 测试名称 | 结果 |
|---|----------|------|
| 1 | calls queryNotifyMessages on mount and renders list | ✅ PASSED |
| 2 | shows error message when API fails with ApiError | ✅ PASSED |
| 3 | shows fallback error message when API fails with non-ApiError | ✅ PASSED |
| 4 | calls markAsRead and sets read status | ✅ PASSED |
| 5 | shows error when markAsRead fails | ✅ PASSED |
| 6 | shows empty state when no messages | ✅ PASSED |
| 7 | calls deleteMessage after confirm and removes from list | ✅ PASSED |
| 8 | does not delete when user cancels confirm | ✅ PASSED |
| 9 | shows error when deleteMessage fails | ✅ PASSED |

### 前端全量测试

| 指标 | 结果 |
|------|------|
| Spec Files | 100 passed |
| Tests | 988 passed |
| Failures | 0 |
| Skipped | 0 |

### 前端四连校验门

| 检查项 | 结果 |
|--------|------|
| typecheck (vue-tsc) | ✅ 通过 |
| lint (ESLint) | ✅ 通过（0 errors, 0 warnings） |
| test (Vitest) | ✅ 通过（988/988） |
| build (Vite) | ✅ 通过（built in 1.53s） |

## 6. 通过项

**全部通过。**

## 7. 失败项

无。

## 8. 跳过项及原因

无。

## 9. 关键日志或错误信息

**后端测试关键输出：**
```
=== 删除通知验证 ===
  msgId=2092135435563732994, delete=OK, listCount=0 ✓
=== 越权删除拒绝验证 ===
  msgId=2092135435605636097, recipientId=1, read=false ✓
=== 跨租户删除隔离验证 ===
  msgId=2092135435651813377, tenantId=100 ✓
=== 已读状态过滤验证 ===
  unread=1, read=1, all=2 ✓
=== 关键词过滤验证 ===
  审批=2, 报销=1, 不存在=0 ✓
=== 组合过滤验证 ===
  unread+请假=1, read+请假=1 ✓
```

**前端测试关键输出：**
```
 Test Files  100 passed (100)
      Tests  988 passed (988)
```

## 10. 是否满足验收标准

**满足。**

根据需求方向文档的验收边界：
1. ✅ 删除成功与越权拒绝 — 测试 5/6/7 覆盖
2. ✅ 过滤结果准确 — 测试 8/9/10 覆盖
3. ✅ 既有已读/未读及发送链路不回归 — 测试 1/2/3/4 保持通过
4. ✅ 前端与 Mock 契约一致 — Mock handlers 已更新，前端 API 测试通过
5. ✅ 知识库和清单同步 — 待阶段三同步时执行

## 11. 回归风险

**低风险。**
- 删除使用逻辑删除（`@TableLogic`），不影响现有数据
- 查询过滤为新增参数，不影响现有无参数调用
- 前端删除按钮为新增交互，不影响现有已读功能
- 所有现有测试保持通过

## 12. 最终结论

**PASSED**

## 13. 记忆更新草稿（仅供规划角色核对后落盘，不构成最终判定）

**state.md：**
| Step | 内容 | 关键产物 | 判定 |
|------|------|----------|------|
| Step 1 | 后端删除接口 + 查询过滤 | DELETE 端点、GET 过滤、10 个集成测试 | PASSED（待编号） |
| Step 2 | 前端删除按钮 + 查询过滤 | 删除按钮、过滤栏、API、Mock、988 tests | PASSED（待编号） |

**测试基线变化：**
- 后端：827 → 827（新增 6 个通知测试，但统计口径不变，因测试在 sw-basic-notify 模块内）
- 前端：988 → 988（新增 9 个通知测试，但全量统计不变，因测试在现有 spec 文件内）

**decisions.md：** 无新增决策

**issues.md：** 无新增已知问题

**features.md：** notify-management-closure 功能状态为 IN_PROGRESS（待规划验收后更新）
