# 后台 SSO 配置管理与 B 端手机号准入（sso-admin-config，执行跟踪）

> 任务：`product/sso-admin-config/ready/direction-sso-admin-config.md`（L）；关联 P31（开放未核销）。
> **功能状态 `VERIFYING`（回执 05 未通过，执行补证推进中，待规划验收）**。
> 唯一执行入口与剩余账本：`product/sso-admin-config/receipts/planning-review-admission-and-config-02.md`
> 当前裁决（2026-09-29 回执 05 复核：整体 VERIFYING 未通过；剩余账本 A1/A2/A3/A4/A6/S1+B1）。

## 当前状态（2026-09-29 19:3x 更新，回执 06 补证轮）

- **钉钉 900103 根因已由 Owner 人工验证裁决（B1 解除）**：本地种子脚本 09-29 12:29 轮换
  加密密钥重写时把钉钉 Client ID 手写错值——`dingzoptrn9m33rwe1`（18 位）≠
  控制台真实值 `dingzoptrn9m3m33rwe1`（20 位）。Owner A/B 探针判决：错值 → 钉钉
  challenge 页内嵌 errorCode 900103「应用不存在」（b1-dingtalk-challenge-wrong-*）；
  正确值 → 正常登录页（b1-dingtalk-challenge-correct-*）。正确值有真实链背书：
  上午 10:14—10:16 完整链（AUTH_START→EXCHANGE→BIND 9002→LOGIN_SUCCESS，
  b1-dingtalk-morning-chain-audit.json）。本地夹具 V904 已修正为 20 位正确值；
  **钉钉新准入链（B 端手机号自动绑定）待 Owner 扫码后重跑**（真实人机验证为外部依赖）
- **S1 秘密入证据（已确认+已处置）**：e7b4371（已推送 origin/develop-sw）的
  a3-full-matrix.json 曾含真实 appSecret 与明文测试密码、回执 05 曾含两个原始手机号；
  Planner 已就地脱敏，执行已补齐（桩值脱敏+采集端脱敏工具 s1-redact-evidence.py+
  扫描器 s1-secret-scan.py，s1-final-scan.txt 40 文件 0 命中 exit 0）。历史提交与远端
  暴露范围已核实（单提交单分支）；**不改写历史；凭据轮换为 Owner 决策项**
- **A4 验收目标修正（实现已改）**：旧实现"在途回调按当前配置换票"（usesCurrentConfig）
  与方向 §三"旧配置发起未完成授权安全失败"相反。已实现配置生命周期绑定：
  sys_sso_auth_state 新增 config_digest（V104），state/票据绑定签发时刻配置指纹
  （provider|appId|解密secret|企业标识|启停 的 SHA-256）；appId/secret/身份模式/
  企业标识/启停任一变化 → 在途回调与未兑换票据安全失败并可重新发起，不串用新旧配置。
  具名用例：回调侧 5 维拒绝+历史行 fail-closed+新配置重发起成功（模块内）；
  票据侧 5 维拒绝+一致兑换+会话零签发（SsoTicketExchangeConfigChangeTest）
- **A2 零增量与租户隔离（具名集成断言）**：SsoAdmissionZeroIncrementIntegrationTest
  （真实 DB/拦截器链+受控厂商桩）4 用例：无匹配用户/租户内重复/仅他租户同号 →
  sys_user 与 sys_sso_user_binding 零增量、无 LOGIN_SUCCESS、拒绝审计精确一条；
  正验对照（唯一命中自动绑定且不新建用户）证明夹具有效。与已锁定真实链审计
  （a2-batch7-matrix-audit.json）组合覆盖
- **A3 恢复值差异（已定位+已修正+已回读）**：本地种子 V904 即错值源头（16:0x 的 A3
  矩阵"恢复"忠实写回了种子错值）；种子已修正，重启后回读：GET /system/sso/config 的
  DINGTALK appId=`dingzoptrn9m3m33rwe1`（len=20）✓；PC 完整字段证据：appId tooltip
  全串、callback tooltip 全串（Web 9375359 局部修复使 callback 列 tooltip 恢复）、
  WECOM 延期标签+仅 Check、受限身份 u_a3flist 仅 list+Check 无编辑/凭据/审计/开关
  （a3-fixed-admin-list / a3-tooltip-appid-full / a3-tooltip-callback-full /
  a3-restricted-ua3flist-page 四图）。差异事实仅指向本地夹具，不外推生产/控制台
- 已锁定保留：飞书准入真实链四段闭环、A2-b 重绑缺陷修复（deleteDormantUnboundRows）、
  A3 分项权限矩阵、A5 加密兼容（审查 01/02 已核销范围）
- **企业微信**：Owner 延期（保留配置记录只读，本期无新增启用入口）

## 候选与门禁

- Server：964f2cb → **`dff266a`**（V104+配置生命周期指纹+A2 集成测试+Boot 夹具适配；
  完整 40 位 dff266add04a59e0859547f11b647772b20f8e6a，origin/develop 回读一致）；
  Web `38672cd` → **`86c5ec1`**（A3 tooltip+延期标记列宽局部修复；四连 exit0）
- 门禁（dff266a 树实跑）：模块 **351/0/0/0**（347+4 A2 集成）、bootstrap **173/0/0/0**
  （锚+Boot；Boot=I5SsoBindingSessionBootTest 5 + I5SsoCipherRuntimeDiagTest 1，
  XML 与日志同轮同源；锚测试随 V104 机械更新：全链 105(H2)/103(PG)、终点 V104）
- 运行实例：dev jar sha256 `46405d10…`（dff266a 构建），PID 18938（20:01:15 启动），
  flyway 113 迁移终点 v907 含 V104
- 证据：`receipts/evidence/admission-chain-01/`（A1—A6+S1+B1：运行身份、门禁日志、
  审计 JSON、A3 矩阵（已脱敏）、S1 扫描报告、B1 Owner 探针四件+修复后 URL/页面、
  A3 UI 四图）

## 已证实事实（供后续复核）

- 飞书 mobile 属敏感字段：contact:user.phone:readonly（获取用户手机号）为必要权限；
  contact:contact.base:readonly / contact:user.base:readonly 均不携带
- 钉钉个人测试应用经 open-dev 控制台「应用开发」入口进入；发版后能力变更才生效；
  **授权 URL 的 clientId 来自本地配置行，手写种子时必须逐字符核对**
- 隔离验证环境 H2 内存库：重启即清库，审计/绑定不跨重启；Redis 缓存跨重启存活
  （权限装配排障时曾 FLUSHALL，限定本任务命名空间）
- V84 绑定唯一索引含 deleted 列的历史缺陷及修复（见上）
