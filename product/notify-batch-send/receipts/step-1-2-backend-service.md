# Step 1-2 后端服务实现回执

## 完成状态：PASSED

## 编译结果
- 编译命令：`MAVEN_OPTS="-Xmx2g" mvn compile`
- 编译结果：**SUCCESS**（零错误）

## 修改文件清单

### 新建文件（2个）
1. `sw-basic/sw-basic-notify/sw-basic-notify-biz/src/main/java/com/sw/ck/notify/dto/NotifyBatchSendReq.java` — 批量发送请求DTO
2. `sw-basic/sw-basic-notify/sw-basic-notify-biz/src/main/java/com/sw/ck/notify/dto/NotifyBatchSendResp.java` — 批量发送响应DTO

### 修改文件（5个）
3. `sw-basic/sw-basic-notify/sw-basic-notify-biz/src/main/java/com/sw/ck/notify/mapper/NotifyMessageMapper.java`
   - 新增 `selectActiveUserIdsByDeptIds(List<Long> deptIds, Long tenantId)` — 按部门ID查有效用户
   - 新增 `selectActiveUserIdsByRoleCodes(List<String> roleCodes, Long tenantId)` — 按角色code查有效用户
   - 使用 `@InterceptorIgnore(tenantLine = "true")` 跳过租户拦截器（查询sys_user/sys_role表）
   - 手写 `tenant_id` 条件 + `deleted = 0` + `status = 0`

4. `sw-basic/sw-basic-notify/sw-basic-notify-biz/src/main/java/com/sw/ck/notify/service/NotifyMessageService.java`
   - 新增 `batchSend(NotifyBatchSendReq req)` 方法声明
   - 新增 `saveBatchMessages(List<NotifyMessage> messages)` 方法声明
   - 新增 `findActiveUserIdsByDeptIds(List<Long> deptIds)` 方法声明
   - 新增 `findActiveUserIdsByRoleCodes(List<String> roleCodes)` 方法声明
   - 新增 `NotifyBatchSendReq` import

5. `sw-basic/sw-basic-notify/sw-basic-notify-biz/src/main/java/com/sw/ck/notify/service/impl/NotifyMessageServiceImpl.java`
   - 新增构造器注入：`NotifyTemplateService`、`TemplateRenderService`、`LoginContextProvider`
   - 实现 `batchSend()` — 内容模式互斥校验 → 接收对象解析去重(LinkedHashSet) → 零接收人/超500拒绝 → 模板渲染或直接内容 → 构建消息列表 → saveBatch原子落库
   - 实现 `saveBatchMessages()` — 批量保存（分片500）
   - 实现 `findActiveUserIdsByDeptIds()` — 通过LoginContextProvider获取tenantId，委托Mapper
   - 实现 `findActiveUserIdsByRoleCodes()` — 通过LoginContextProvider获取tenantId，委托Mapper

6. `sw-basic/sw-basic-notify/sw-basic-notify-biz/src/main/java/com/sw/ck/notify/controller/NotifyController.java`
   - 新增 `POST /notify/messages/batch-send` 端点
   - 权限注解：`@PreAuthorize("hasPermi('notify:template:manage')")`
   - 新增 import：`NotifyBatchSendReq`、`NotifyBatchSendResp`、`@PreAuthorize`

7. `sw-basic/sw-basic-notify/sw-basic-notify-biz/src/main/java/com/sw/ck/notify/service/NotifyTemplateService.java`
   - 新增 `getEnabledByCode(String code)` 方法声明（返回null而非抛异常，供batchSend使用）
   - 新增 `NotifyTemplate` entity import

8. `sw-basic/sw-basic-notify/sw-basic-notify-biz/src/main/java/com/sw/ck/notify/service/impl/NotifyTemplateServiceImpl.java`
   - 实现 `getEnabledByCode()` — 按templateCode + enabled=true查询，未找到返回null

## 技术要点
- `@InterceptorIgnore` 属性为 `tenantLine`（非 `tenant`），适配 MyBatis-Plus 3.5.9
- 使用 `LoginContextProvider`（SPI接口，Spring Bean注入）获取 tenantId，而非静态方法
- `LoginContextProvider` 包路径：`com.sw.ck.common.security.LoginContextProvider`
- `R` 响应包装类包路径：`com.sw.ck.common.response.R`
- `BaseException` 构造器：`BaseException(ErrorCode, String)` 或 `BaseException(ErrorCode)`
- `CommonErrorCode` 实现 `ErrorCode` 接口，可用作构造器参数
