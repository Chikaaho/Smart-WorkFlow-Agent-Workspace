# P61 执行回执：R8c 设备/第三方可控 error 的外显边界

> 执行角色：执行（Executor）
> 日期：2026-09-16
> 对应原子项：R8c（一级执行提示 01 §2）
> 证据：receipts/evidence/p61-r4b-r6b-01/runtime-http.txt（R8c 段）+ p61-r4a-r8b-01/r4a-r8b-scan.txt

## 1. 完成条件对照

| 完成条件 | 实际结果 | 证据层级 |
|---|---|---|
| 受控恶意/技术文本进入系统后只在授权诊断层以安全方式出现 | 设备回写注入受控标记 → 存储/API 两层的文本已净化且限长，标记保留可定位 | 真实 HTTP（dev 进程 + H2） |
| 普通响应、列表和 DOM 零原始标记、零脚本/路径/密钥片段 | 无权身份读取同一对象被拒（403）；响应零标记 | 真实 HTTP 双身份 |
| 不需要真实厂商账号，可用受控输入 | 全程使用受控输入（自建设备 + 受控 result 载荷） | 真实 HTTP |

## 2. 缺口ID → 原始位置 → 实际结果 → 边界

**（a）设备回写文本未净化**：`IotDeviceServiceImpl.reportResult` 把设备可控 `result` **原样**入库（无清洗、无长度上限），而同模块的 MQTT ingest / 连接失败等设备侧输入均已用 `DiagnosticText.sanitize(text, max)`。→ 已改为 `DiagnosticText.sanitize(result, 2000)`，与 ingest 同口径。

**（b）运行时三层验证**（真实 HTTP，原始流见证据文件）：

1. 身份 A 建受控设备 → 下发命令 → 设备回写携带 `P61-R8C-MARKER-7f3a`、Java 栈帧、绝对路径、200 次重复路径噪声的载荷；
2. 读回同一对象（存储 + API 层）：**标记保留**（可定位）、**零栈帧**、**零绝对路径**、**已限长**（整体响应 643 字符）。

**（c）新发现的授权缺口**：`IotDeviceController` **零 `@PreAuthorize`**（同模块其余 7 个控制器均有），导致任意已认证用户（含零角色身份 B）都能读取设备命令及其诊断文本——"只在授权诊断层出现"的前提不成立。→ 已按同级口径补齐：读操作 `iot:view`，写操作（注册/下发/回写）`iot:device:manage`。补齐后 B 读同一对象 → **403**，响应零标记。

## 3. 单元/模块测试

| 命令 | 结果 |
|---|---|
| `mvn -pl sw-basic/sw-basic-iot -am test` | sw-basic-iot **tests=50 failures=0 errors=0** |
| 其中 `IotDeviceReportResultSanitizeTest`（本轮新增） | 2/2：栈帧被剥除、路径噪声被截断、可定位标识保留、非法 status 拒绝且不落库 |

## 4. 边界

- **页面（DOM）层未验证**：本轮覆盖存储与 API 两层；IoT 设备命令页面的 DOM 零标记断言归 R7 的可见浏览器验收。
- 设备回调 `reportResult` 现在需要 `iot:device:manage` 权限令牌。当前系统没有设备专用令牌机制（设备回调原本也只要求"已认证用户"），本次改动使该端点与同级控制器一致；如后续需要设备直连回调，应由方向文档定义设备身份方案，本轮不擅自设计。

## 5. 相关但不在本项范围

`R.fail(code,msg)` 直返业务失败缺 errorKey/eventRef 的缺陷及其修复见 `executor-receipt-r6b-r4b-authenticated-chain.md` §3；该修复使本轮 IoT 端点的失败响应同样携带 errorKey/eventRef。
