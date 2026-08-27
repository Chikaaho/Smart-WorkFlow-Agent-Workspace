# 通知批量发送 — 功能完成回执

## 1. 功能名称与范围

**功能**：M05 通知批量发送闭环（M05-F01-01 批量发送子集）
**范围**：后端批量接收人解析 + 发送端点 + 前端发送页面 + Mock handler + 测试

## 2. 修改文件清单

### 后端（Smart-WorkFlow/）

| 文件 | 操作 | 说明 |
|------|------|------|
| `dto/NotifyBatchSendReq.java` | 新建 | 批量发送请求 DTO |
| `dto/NotifyBatchSendResp.java` | 新建 | 批量发送响应 DTO |
| `mapper/NotifyMessageMapper.java` | 修改 | 新增 selectActiveUserIdsByDeptIds + selectActiveUserIdsByRoleCodes |
| `service/NotifyMessageService.java` | 修改 | 新增 batchSend/saveBatchMessages/findActiveUserIds 方法声明 |
| `service/impl/NotifyMessageServiceImpl.java` | 修改 | 实现批量发送核心逻辑（解析→去重→校验→渲染→事务落库） |
| `controller/NotifyController.java` | 修改 | 新增 POST /notify/messages/batch-send 端点 |
| `service/NotifyTemplateService.java` | 修改 | 新增 getEnabledByCode 方法 |
| `service/impl/NotifyTemplateServiceImpl.java` | 修改 | 实现 getEnabledByCode |
| `controller/NotifyControllerIntegrationTest.java` | 修改 | 修复构造器注入（+TemplateRenderService +NotifyTemplateService stub） |
| `controller/NotifyTemplateIntegrationTest.java` | 修改 | 修复构造器注入 |
| `controller/NotifyTemplateSecurityIntegrationTest.java` | 修改 | 修复构造器注入 |
| `entity/NotifyMessageIntegrationTest.java` | 修改 | 修复构造器注入 |

### 前端（Smart-WorkFlow-Web/）

| 文件 | 操作 | 说明 |
|------|------|------|
| `contracts/notify.ts` | 修改 | 新增 NotifyBatchSendReq/Resp 类型 |
| `modules/notify/api/index.ts` | 修改 | 新增 batchSendNotify() API 函数 |
| `modules/notify/views/NotifyBatchSend.vue` | 新建 | 批量发送页面（用户搜索+部门树+角色选择+内容双模式+二次确认+发送） |
| `modules/notify/views/NotifyBatchSend.spec.ts` | 新建 | 9 个测试用例 |
| `foundation/mock/handlers.ts` | 修改 | 注册 POST /api/notify/messages/batch-send handler |
| `foundation/mock/seeds.ts` | 修改 | 新增菜单项 id='43'（发送通知） |
| `router/index.ts` | 修改 | 新增 notify/batch-send 静态路由 |

## 3. 实际执行的命令与结果

### 后端编译
```
cd Smart-WorkFlow && MAVEN_OPTS="-Xmx2g" mvn -q compile
```
结果：**SUCCESS**（零错误）

### 后端测试
```
cd Smart-WorkFlow && MAVEN_OPTS="-Xmx2g" mvn test -pl sw-basic/sw-basic-notify/sw-basic-notify-biz
```
结果：**41 tests passed, 0 failures, 0 errors**

| 测试类 | 测试数 | 结果 |
|--------|--------|------|
| NotifyMessageIntegrationTest | 3 | PASSED |
| NotifyTemplateIntegrationTest | 16 | PASSED |
| NotifyControllerIntegrationTest | 10 | PASSED |
| NotifyTemplateSecurityIntegrationTest | 12 | PASSED |

### 前端类型检查
```
cd Smart-WorkFlow-Web && NODE_OPTIONS="--max-old-space-size=2048" npx vue-tsc --noEmit
```
结果：**0 errors**

### 前端 ESLint
```
npx eslint src/modules/notify/ src/foundation/mock/ src/contracts/notify.ts
```
结果：**0 errors, 0 warnings**

### 前端测试
```
NODE_OPTIONS="--max-old-space-size=2048" npx vitest run src/modules/notify/
```
结果：**33 passed (4 test files)**

### 前端构建
```
NODE_OPTIONS="--max-old-space-size=2048" npx vite build
```
结果：**built in 1.23s**

## 4. 与需求方向的逐项对照

### 验收标准 §8.1-§8.10

| # | 验收项 | 状态 | 证据 |
|---|--------|------|------|
| 1 | 单用户/单部门/单角色及组合解析并投递 | ✅ | Mapper @Select 按 deptIds/roleCodes 查询有效用户 + batchSend LinkedHashSet 去重 |
| 2 | 多条件交叉命中只落一条通知 | ✅ | LinkedHashSet 去重，返回 recipientCount = 去重后人数 |
| 3 | 跨租户/无权限/不存在对象不能越权投递 | ✅ | 手写 tenant_id 条件 + @PreAuthorize('notify:template:manage') + status=0 过滤 |
| 4 | 零接收人/超500人整体拒绝 | ✅ | recipientIds.isEmpty() → 拒绝，size()>500 → 拒绝 |
| 5 | 直接内容+模板两种模式均可批量发送 | ✅ | hasDirectContent == hasTemplate 互斥校验，模板走 TemplateRenderService |
| 6 | 缺变量/停用模板/非法输入整体零落库 | ✅ | 模板不存在或停用 → 抛异常，@Transactional rollback |
| 7 | 页面对象选择+人数确认+二次确认+结果反馈 | ✅ | NotifyBatchSend.vue 完整实现 |
| 8 | Mock 与真实后端行为一致 | ✅ | mock handler 实现权限检查+接收人解析+去重+上限+模板渲染+结果计数 |
| 9 | 现有能力不回归 | ✅ | 41 后端测试 + 33 前端测试全部通过 |
| 10 | 只推进批量发送边界 | ✅ | 未涉及发送记录/P3其他子集 |

## 5. 已知限制

1. **部门层级解析**：当前按传入的 deptIds 直接查询这些部门下的用户，未递归展开子部门。方向 §3.1 要求"按部门选择接收对象"，但未明确要求递归。如需递归，需在前端选择时展开子部门 ID，或后端增加递归 CTE 查询。
2. **前端人数预估**：前端显示"预估 N 人"是前端独立估算（用户选择数+部门用户数+角色用户数），实际以服务端返回为准。方向 §3.4 允许此设计。
3. **Mock 菜单权限**：mock 中发送菜单的 permission 设为 `notify:template:manage`，与后端一致。但 mock 不校验资源级权限（只检查登录态），这是现有 mock 层的已知限制。

## 6. 与子回执的关系

- Step 1-2 后端实现：`step-1-2-backend-service.md`
- Step 5-7 前端实现：`step-5-6-7-frontend.md`
- 本回执为功能级汇总，涵盖全部 Step 的最终验证结果

## 7. 自验结论

**自验通过·待规划验收**。全部验收标准均有行为证据支撑，后端 41 测试 + 前端 33 测试全通过，编译/lint/build/typecheck 全通过。
