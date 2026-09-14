# I5 iteration-05 对象账本与执行计划

> atomic_id=ALL
> captured_at=2026-09-14T00:20:00+08:00（本轮采集刷新；终态核对 2026-09-14T02:09:00+08:00）
> server_sha=4d98b6710f6d3e5ba9ad4bdef4e59afc191dc889
> server_modified_tree_sha256=采集起始 a78ef93c40e5b3ff091ce909ffd80851f010404957800d8f52924f64f254cd10 → 最终 db8b25556bd9a9958d06ab727372a1fe1853b26e（中途两处真实缺陷修复：拒绝审计独立事务、票据兑换租户挂起；新增 V903 夹具与两个 BootTest；逐包不失效证明见 g9a1-candidate.raw）
> web_sha=5788ead33c4347214a350d124331237e85068bdf（本轮零修改）
> environment=Windows 11；Java 21；Maven 3.9.1；Node 22；dev server 以 `java -jar sw-bootstrap-1.0.0-SNAPSHOT.jar --spring.profiles.active=dev`（jar 晚于全部 main 源码，即当前候选）；出站经 127.0.0.1:8899 计数代理（JAVA_TOOL_OPTIONS）；无真实秘密落盘
> database=dev=H2（每批次独立 JVM 内存库）；PG 层=zonky 内嵌真实 PostgreSQL 二进制（sw-bootstrap 测试依赖，I4 先例）；Redis=本机 6379 真实实例

## 固定对象

| 领域 | 固定身份 | 原子项 |
|---|---|---|
| 租户 | `0` 基线有效；`100` 有效；`200` 停用；`300` 过期；`1000` 登录后 180 秒过期 | G1/G2/G4/G6/G7 |
| 用户 | `1`(t0 admin)、`9001`(t100 admin)、`9101`(t100 空角色)、`9201`(t200)、`9301`(t300)、`9401`(t1000)；口令为 dev 夹具统一值（V900 注释，不复制到本目录） | G1—G7 |
| 表单 | 单一新生成 formKey，仅 t0/t100 双租户使用；definition/config/snapshot/list-config 对象 ID 落盘于 g1a1 | G1a1/G1a2/G1c1 |
| 流程链 | t100：同一 formKey 的流程定义+同租户绑定+提交+任务+APPROVED 实例+轨迹 | G1b1 |
| 布局 | `(0,1)` 与 `(100,9001)` 两对，独立 marker | G1c1/G4b1 |
| OpenAPI | app `i5-openapi-t*`（V902 seed，tenant 100/300）；secret 仅存 SHA-256；签名材料=appId+ts+nonce+sha256(body) | G2a1 |
| IoT | t100 真实登记产品+设备+HTTP 命令入口 | G2a2 |
| 异步 | sw_bpm_command 持久队列：NORMAL 受理→消费；无效租户命令行 SQL 注入后消费拒绝 | G2a3 |
| SSO Provider | WECOM/FEISHU/DINGTALK 三配置（tenant 100，enabled；密文为 dev 密钥 AES-GCM）；受控对端=真实 Provider 域（凭据被官方拒绝=受控失败），出站经计数代理 | G5/G6 |
| 审计 | sys_sso_audit_record：真实 DENIED 事件 + result/摘要前缀筛选 | G7a1 |
| 哨兵映射 | hashLabel↔真实测试值映射仅存 `$TEMP/i5-driver/`（不写入 product） | G7b1 |

## 独立证据文件

每原子一个文件；正向/反向断言与对象身份全部为是才关闭：

- `g1a1-form-objects.raw`（H2 双租户同键四对象 + 跨租户拒绝 + 行数不变）
- `g1a2-form-pg.raw`（zonky PG：两租户同键不同物理表 + 同租户重复拒绝；新增 BootTest 资产）
- `g1b1-trace.raw`（完成实例 APPROVED + 同 task/node/actor 轨迹 + 无异租户 activity/task）
- `g1c1-cross-tenant.raw`（定义/绑定/实例/task/布局跨租户读改办理全拒绝，before/after 行数）
- `g2a1-openapi-http-pg.raw`（zonky PG + RANDOM_PORT 真实 HTTP + PG nonce/业务行回读）
- `g2a2-iot.raw`（真实设备命令入口正反 + before/after 增量）
- `g2a3-async.raw`（有效信封入队消费 + 无效租户命令消费拒绝 + 增量 0）
- `g2b1-session.raw`（t1000 时间序列：登录成功→到期→新登录/refresh/me 拒绝+会话清理）
- `g3b1-db-auth.raw`（独立 OS 进程：正确凭据成功；错误账号/密码首因 PG 认证；secret scan）
- `g3b2-provider-boot.raw`（独立 OS 进程：三 Provider disabled 可启动；enabled+缺失/占位各自 fail-fast）
- `g4a1-permission.raw`（同候选已闭合；本轮复核）
- `g4b1-browser.raw` + `g4b1-pc.png` + `g4b1-mobile.png`
- `g5a1-allowlist.raw`（白名单内三 Provider redirect_uri；白名单外 8081 负向 boot 外呼 delta=0）
- `g5b1-state-code.raw`（三 Provider state/code 首次进受控换票边界；过期/篡改/错配/重放无第二外呼）
- `g5c1-browser.raw` + `g5c1-pc.png` + `g5c1-mobile.png`
- `g6a1-pg-concurrency.raw`（zonky PG barrier 两租户同主体并发；失败侧三表增量 0）
- `g6b1-binding-session.raw`（受控票据兑换会话 + 租户禁用/解绑拒绝 + role 表增量 0；票据经真实 SsoTicketStore bean 受控注入——G8 外部依赖边界）
- `g7a1-audit.raw`（result=DENIED 命中 + 摘要筛选命中 + 无权 403/匿名 401/跨租户空集）
- `g7b1-residue.raw`（要求表面哨兵命中 0；hashLabel 报告无自命中）
- `g9a1-candidate.raw`（old..final diff、每包 SHA、manifest）
- `g9a1-manifest.sha256` / `g9a1-verify.stdout` / `g9a1-verify.stderr` / `g9a1-verify.exit`
- `g9b1-gates.raw`（最终受影响模块/迁移/IoT/Web 门禁原始计数）

## 执行顺序（三级提示 §5 固定）

1. 本账本（已刷新）。
2. dev server 重启（计数代理+白名单 env）→ G2b1 第一步抢在租户 1000 到期前 → 依次采集不依赖 G8 的全部行为包，每包当场核对正反断言。
3. 任一断言为否：立即修复并重取该包，再继续。
4. 全部行为包后定候选，逐包核对 captured SHA。
5. 最终门禁（受影响模块/迁移/IoT/Web）failures=0、errors=0。
6. manifest 生成+回读+verify 落盘。
7. 自检矩阵全为是 → iteration-05 回执 + ENGINE_TERMINAL。

## 边界

- G8 三 Provider 真实成功链保持 PENDING（无官方应用凭据/HTTPS 白名单域/测试身份）。
- 票据兑换正向使用真实 `SsoTicketStore` bean 受控签发（等价受控 Provider 对端），其余会话/租户/解绑行为全部走真实 HTTP+DB。
- product 仅新增本目录与 iteration-05 回执；不修改历史回执/evidence；不推送、不核销 P 编号、不写 PASSED/COMPLETED。
