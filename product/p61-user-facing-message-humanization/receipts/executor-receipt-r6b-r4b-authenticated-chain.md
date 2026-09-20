# P61 执行回执：R6b 认证后真实链 + R4b 双身份诊断访问

> 执行角色：执行（Executor）
> 日期：2026-09-16
> 对应原子项：R6b（认证后 403/业务失败/持久化诊断真实链）、R4b（双身份诊断访问正反验证）
> 证据目录：receipts/evidence/p61-r4b-r6b-01/

## 1. 运行环境（真实进程，非测试容器）

| 项 | 值 |
|---|---|
| 构建 | `MAVEN_OPTS="-Xmx2g" mvn -q -DskipTests package` → `sw-bootstrap/target/bootstrap.jar` |
| 启动 | `start.sh` 后台进程 + 日志轮询（`SPRING_PROFILES_ACTIVE=dev`，H2 内存库，端口 8080，context-path `/api`） |
| 身份通道 | `Authorization: Bearer test_<userId>`（DebugAuthenticationFilter：开关 + dev/test profile + loopback 三重门，属既有测试契约） |
| 身份 A | `test_1` = admin（系统管理员，超级管理员全权限）→ 授权运维 |
| 身份 B | 脚本经 `POST /system/user` 真实创建的无角色用户（无任何权限） |
| 确定性输入 | 本地一次性生成的 JWT / 摘要 / RSA 密钥；`SW_CIPHER_KEY` 取仓内 dev 值（须与 `sw.security.sso.cipher-key` 一致，否则 devseed 密文解不开） |

## 2. 真实 HTTP 结果（原始流见 evidence/runtime-http.txt）

| 场景 | HTTP | 响应要点 | 断言 |
|---|---|---|---|
| 匿名访问受保护资源 | 401 | `errorKey=common.unauthenticated`，`eventRef=req-<32hex>` | 通过；零堆栈/零类名 |
| 认证后业务失败（表单不存在） | 200 | `code=1000`，`errorKey=form.not_found`，`eventRef` 非空 | 通过；零内部细节 |
| 同一业务失败（zh-CN / en-US） | 200 | zh `表单不存在` / en `The form does not exist.`，**errorKey 相同** | 通过 |
| 身份 B 访问管理资源 | 403 | `errorKey=common.forbidden`，`eventRef` 非空 | 通过；零堆栈/零租户秘密 |
| 身份 B 读取持久化诊断（通知记录） | 403 | 同上，响应体零诊断字段 | 通过 |

### 持久化诊断（R4b 正反双向，同一对象）

- **制造诊断**：身份 A 经 `POST /notify/messages/batch-send`（channel=EMAIL，无 Provider）发送 → 落库记录 `deliveryStatus=FAILED`、`attemptCount=2`（真实失败流水，非注入）。
- **正向（授权运维可定位）**：A 经 `GET /notify/records` 与 `GET /notify/records/{id}` 读到该记录与详情；断言零 Java 栈帧、零内部主机/绝对路径/凭据。
- **反向（无权身份）**：B 读同一 `GET /notify/records` → 403，响应体零 `deliveryStatus/failureReason` 等诊断字段。

## 3. 本轮发现的真实缺陷（R6b 存在的意义）

**`R.fail(code, msg)` 直返的业务失败此前既无 errorKey 也无 eventRef。**

- 事实：匿名 401（经 `GlobalExceptionHandler`）两者齐全；而 `GET /form/def/by-key/...` 返回 `{"code":1000,"msg":"表单不存在"}`，**无 errorKey、无 eventRef**，且 msg 恒为中文、不随 `Accept-Language` 变化。
- 影响面：生产代码中有 67 处 `R.fail(...)` 直返（含 IoT 全部控制器），这些路径全部缺失 P61 错误契约。
- 根因：`R.fail(int,String)` 只设 code/msg；errorKey 与 eventRef 仅在异常处理链上补齐。

**修复（三处，最小改动）**：

1. 新增 `sw-common` `ErrorKeyRegistry`（数值码 → errorKey 运行期注册表；已登记的 5 个冲突码不猜测含义，查表返回 null）。
2. `R.fail(int,String)`：补齐 `eventRef`（`EventRef.current()`，无请求上下文时为 null）；按 code 解析 `errorKey`；`msg` 经 `LocalizedMessages.text(errorKey, 字面量)` 以目录为权威、字面量兜底 → 业务失败同样双语。
3. `sw-bootstrap` `ErrorKeyRegistryConfiguration`：启动期注册与 `ErrorCodeCatalogTest` 同一份枚举集合（Common/Auth/Form/Bpm/OpenApi）。启动日志：`已登记数值码 122 个，冲突码 5 个`——与目录登记的 5 个弃用冲突值一致。

修复后同一请求返回：`{"code":1000,"msg":"表单不存在","errorKey":"form.not_found","eventRef":"req-..."}`，en-US 下 `msg` 为 `The form does not exist.`。

## 4. 边界与未完成

- **R8c 的设备回写运行时层未验证**：代码修复（`IotDeviceServiceImpl.reportResult` 经 `DiagnosticText.sanitize(result, 2000)` 落库）与单测（2/2）已完成，但"受控标记经设备 ingest → 存储/API/页面三层"的真实链路尚未跑（需建产品/设备/命令）。
- **定时任务日志探针未产出**：`POST /job/info/{id}/trigger` 在 Quartz 线程执行时，`jobInfoService.getById` 因**调度线程缺租户上下文**在 MyBatis 租户拦截器处失败，未走到写日志分支。这是调度线程的基础设施事实（与 P61 无关），已改用通知失败流水作为持久化诊断对象。
- 本回执不涉及页面 DOM 证据（归 R7）。
