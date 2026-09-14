# i5-03 证据包对象索引（G2a/G5a/G6a/G6b/G7a/G9a — 建账）

> 采集时间：2026-09-13 20:00—21:30（+08:00）
> 数据库：dev profile H2 内存库（`jdbc:h2:mem:smart_workflow`，随进程生命周期，进程退出即销毁）
> 端口：8080（dev 后端）、5173（vite 前端）、8899（受控对端 CONNECT 计数代理）
> 候选：Server `ee9c6b6b…`（见 g9-server-changed-files-manifest.txt，本地未推送）/ Web 见清单
> 采集身份与对象（devseed 夹具 V900/V901/V902）：

| 对象 | 值 | 使用原子项 |
|---|---|---|
| 租户 | 0（默认）、100（有效）、200（停用）、300（过期，2020-01-01）、1000（启动后 +180s 过期） | G1a—G2b |
| 用户 | 1=admin(t0)、9001=t100admin、9101=t100nobody、9301=t300admin、9401=t1000admin | 全部 |
| 同键 formKey | `g3_leave_*`（每次运行生成唯一后缀，两租户同一键） | G1a/c |
| 表单/物理表 | 租户 0 `sw_form_zelpiicldk`、租户 100 `sw_form_ivefob8tup`（SQL 回读 distinct） | G1a |
| 流程定义/绑定 | `bpm_677c90545aa943ff`（示例批次）+ sw_bpm_form_binding tenantId=100 | G1b |
| 命令/实例/任务 | commandId `2099115448415780866`(t=100)、`sw_bpm_instance` tenantId=100、`ACT_RU_TASK.TENANT_ID_`=100、assignee=9001 | G1b |
| 通知 | `sw_notify_message` tenantId=100, recipientId=9001, WF_APPROVED/WF_TODO | G1b |
| 工作台布局 | sys_user_workspace (100,9001,'T100-MARKER') / (0,1,'T0-MARKER') 独立并存 | G1c |
| OpenAPI 应用 | `i5-openapi-t100`(t=100) / `i5-openapi-t300`(过期租户)，secret 仅 sha256 摘要落库 | G2a |
| SSO Provider | WECOM@tenant100（app=ww-sentinel-app-id，AES-GCM 密文 secret）；FEISHU/DINGTALK 未配置 | G5b/G6a |
| 外部主体 | `i5-g6a-subject-9f3a`、`i5-g6b-subject`（绑定列只存 sha256 摘要，明文仅作扫描哨兵） | G6a/b/G7b |
| 会话 | t1000admin 的 access+refresh（过期时序：登录 200→过期后 new-login/refresh/me 全拒绝） | G2b |
| 受控对端 | qyapi.weixin.qq.com 经 127.0.0.1:8899 CONNECT 计数：伪造 0 增量 / 有效 +1 / 重放 +0 | G5a/G5b |
| 浏览器 | IAB 真实 Chromium：PC 1280×720 与移动 375×812，同一会话/守卫 | G4b/G5c |

对象生命周期：全部为一次性验证对象；H2 内存库随 `spring-boot:run` 进程退出销毁（本轮多个
批次即多轮「进程退出=清库」），清理证据以进程退出与端口无监听为准；回执见各 raw 文件。

## 文件索引

| 文件 | 对应原子项 |
|---|---|
| `g1-g2a-g4a-g5b-g6-g7-matrix.raw.log` | G1a/b/c、G2a、G4a、G5b、G6a/b、G7a（真实 HTTP + SQL 回读原始流） |
| `sign-valid-positive-t100.json`（摘要行并入 matrix 流） | G2a 签名正向（合法签名+有效租户达业务校验层 1401） |
| `g2b-session-convergence.raw.log` | G2b（登录→过期→新登录/refresh/装载拒绝） |
| `g3-prod-final.log` | G3a/G3b（prod 完整启动、匿名矩阵、验证码正反、凭据逐项 fail-fast） |
| `g5a-whitelist-outbound-counts.raw.log` + `g5a-dev-server-boot3.log` | G5a（白名单正反 + 受控对端外呼计数） |
| `g5c-browser-*.png`、`g4b-browser-*.png` | G4b/G5c 真实浏览器截图 |
| `g7b-sentinel-rescan.txt` | G7b 修复后哨兵零残留重扫 |
| `g9-server-final.log`、`g9-web-four-gates.log`、`g9-server-changed-files-manifest.txt` | G9a/G9b 最后候选门禁与 manifest |
