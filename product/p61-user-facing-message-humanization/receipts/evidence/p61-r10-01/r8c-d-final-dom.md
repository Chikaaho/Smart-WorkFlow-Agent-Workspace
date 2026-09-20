# R8c-D IoT 页面 DOM 授权/未授权（最终快照）

> 快照：`r7-f-snapshot-manifest.json`。设备对象：`p61a / d61a`（本轮内存库新建等价对象，
> 旧对象随 H2 进程销毁，按 R8c-D 允许替代口径登记：旧 ID 已失效，不伪称同一对象）。

## 1. 授权身份（admin）：设备页只显示安全摘要

- `/iot/devices-manage`（en-US，`final-en-iot-devices-r8cd.png`）：设备行显示
  业务键/名称/类型/管理状态 Draft/连接状态 Offline 等安全摘要字段。
- DOM 反向扫描（页面全文 + outerHTML）：`at java.`、`Caused by`、`java.lang.`、
  `org.apache`、绝对路径（`C:\secret`、`C:\Users`、`/home/`）、`SQLException`、
  命令结果原文 `connect failed` —— **全部零命中**（受控命令失败结果的原始文本
  只存在于服务端日志与脱敏落库列，页面 DOM 不含）。
- 命令结果脱敏链路在 API 层已由 `p61-r4a-a-carrier-matrix.mjs` C1 证明
  （写回含栈/路径噪声 → 落库为脱敏摘要 → A 读回零噪声）。

## 2. 未授权身份（无角色用户 p61buser，tenant 0）：无法进入、无法读取

以 B 登录（真实登录表单）后逐路由访问：

| 路由 | 结果 | 泄漏扫描 |
|---|---|---|
| `/iot/devices-manage` | 跳转 `/404`（Page Not Found；菜单驱动的路由对无权身份不存在） | 零栈/路径 |
| `/iot/connections` | `/404` | 零 |
| `/iot/scripts` | `/404` | 零 |
| `/notify/record` | `/403`（Access Denied） | 零 |

- 截图：`final-en-iot-devices-unauthorized-b.png`。
- 结论：无权身份既看不到数据，也拿不到「对象存在性」之外的任何诊断信息；
  HTTP 层的 403 判定由 `p61-r4a-a-carrier-matrix.mjs`（B 403 × 4 载体）支撑。

## 3. 对应 R7-C 页面族

- IoT 连接/脚本/设备三页在最终快照下 zh/en 成对截图（`final-zh-iot_*.png`、`final-en_iot_*.png`），
  本文件登记同一受控命令对象在页面族的可见性与安全性断言。
