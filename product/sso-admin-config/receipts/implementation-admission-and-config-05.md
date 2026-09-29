# sso-admin-config 实施回执 05：审查 02 新账本 A1—A6 补证完成（钉钉 B1 维持 BLOCKED）

入口：`planning-review-admission-and-config-02.md` 当前账本（2026-09-29 更新版）。功能状态 **VERIFYING**；P31 开放；**钉钉 B1=BLOCKED（Owner 等待人工验证，本轮零接触：未重试、未改控制台、未催扫码）**；企业微信延期。03 作废占位保留。

## 最终候选与运行产物（A1）

- Server HEAD 完整 40 位：`964f2cb19187d2b54119dabdd506358aa1819a54`（develop→origin/develop；=d39db4c+批次 7；工作树 0 脏项）
- Web HEAD：`38672cd506e023e5a128e16e0c521d71ce75daee`（本轮零改动，工作树 0 脏项）
- 运行进程 PID 95780（lsof 加载 jar 句柄在册），jar sha256 工具回读见 `a1-run-identity.txt` 追补段；flyway 终点 v907
- 门禁（批次 7 时点实跑）：模块 **334/0/0/0**（a1-module-gate-334.log：332+2 A4 在途用例）、Boot **6/0/0/0**（a1-boot-6-head.log，d39db4c+批次 7 重跑——回应"Boot 日志属批次 4"差异）、锚 **38/0/0/0**（批次 4—7 无迁移变更，文件级依赖范围=git diff --name-only 8d5fe6b..HEAD 已导出）
- 具名用例报告入 evidence：a1-surefire-SsoAuthServiceTest.xml（42 例含全部 admission/config/rebind 用例名）、SsoPhoneNormalizerTest、SsoCredentialCipherCompatTest、I5SsoBindingSessionBootTest（6 含 A4）、I5SsoCipherRuntimeDiagTest

## A2（批次 7 产物上全场景重演，审计单文件自洽）

`a2-batch7-matrix-audit.json`（python json.load 解析 OK，18 行，秘密扫描 0 命中）：
1. **他租户同号隔离+正验**（16:46:16-21）：演示租户同号用户 t1phoneholder（V907 夹具，tenant 1）存在下，I5测试租户准入唯一命中 t100user → BIND phone-admission auto-bind + LOGIN_SUCCESS
2. **租户内重复**（16:47:05-10）：新建 t100dup 同号 → `ADMISSION_REJECTED ambiguous phone in tenant`，零绑定增量
3. **恢复**（16:47:43-47）：t100dup 改号中立化 → 自动绑定恢复
4. **无匹配用户**（16:49:01-18）：t100user 解绑+改无匹配号 → `ADMISSION_REJECTED no local user with trusted phone`，零增量
5. **终态正验**（16:49:47-52）：手机号恢复 → 重绑 + LOGIN_SUCCESS
对比说明：回执 04 期审计（15:48/15:50）为批次 5 构建时点（其中 15:50 为"binding unique constraint rejected"=当时未修缺陷的真实拒绝，已由批次 6 修复并以其构建重演本矩阵）——两份审计分别保留原时点，不互相改写。

## A3（分项权限，含请求/响应索引与实际改值）

`a3-full-matrix.json`（requests+matrix 双段；四角色夹具身份 rid/uid 已锁定）：19 条目全部符合预期——
- u_a3flist：config/check 200；basic/enabled/secret 403
- u_a3fedit：basic **实际改值**（appId→temp）200 → **GET 持久化回读 appId=temp** ✓ → enabled/secret 403 → 已恢复真实 appId
- u_a3fenable：enabled **实际改值 false** 200 → 回读 false ✓ → basic/secret 403 → 已恢复 true
- u_a3fsecret：secret **临时值** 200 → check secretUsable=true ✓ → basic/enabled 403 → **恢复真实值** → check true ✓
最终权限页面回读截图：a3-final-permission-page.png（t100admin 全权限视角，三行终态正确：DingTalk/Feishu 启用+已配置、WECOM 延期只读仅 Check）；列文案在此宽度存在视觉裁切，关键字段完整值经 API 回读与 DOM 证实（截断为 CSS 省略+tooltip，非数据缺失），移动端 390 布局另见 mobile-sso-config-390.png。

## A4（在途配置变化——新增具名用例，回应"不能以同机制覆盖代替"）

- `callback_inFlightConfigChange_usesCurrentConfig`：两阶段配置桩（旧 appId/secret → 新 appId/secret），捕获式 client 断言每次回调按**当时**配置换票（旧→ww-test-corp/secret-value；新→new-app-id/new-secret-value）——不串用旧配置
- `callback_inFlightModeChanged_mismatchRejected`：身份模式/企业标识变更后在途回调安全失败（ENTERPRISE_MISMATCH，零绑定插入）
- 停用 Provider 在途回调拒绝：Boot 层由 ticketExchangeRejectedWhenProviderDisabled 与既有 disabled 检查覆盖（回调入口在换票前先查 enabled——a1-boot-6-head.log 6/0/0/0）
- 均为模块内隔离集成（不出站），符合审查 02 "允许隔离集成/HTTP，不强制厂商扫码"

## A5（加密兼容边界）

`a5-crypto-boundary.txt`：同钥互读/异钥 fail-closed 具名测试（SsoCredentialCipherCompatTest 2/0/0/0）、历史密文两类来源（V903 dev 键哨兵/V904 独立密钥重加密）、迁移=旧钥解密→新钥加密→原子替换（reencrypt.mjs 模式）、回退=旧钥+旧密文备份、启动 fail-fast 实证（AEADBadTag）、agent bean 唯一性与密钥隔离（I5SsoCipherRuntimeDiagTest）。未操作生产密钥。

## A6（当前入口——Planner 已更新 memory 五文件，执行侧 knowledge 已同步）

- knowledge/features/sso-admin-config.md：900103 会话过期措辞**降级为工作假设**（"根因待验证，不排除应用配置或代码问题"）；knowledge/current-status.md 顶层条目 sso-admin-config 更新为 VERIFYING+审查 02 账本指针
- 飞书进展三分法：审计事实（BIND/LOGIN_SUCCESS/ADMISSION_REJECTED 各行）/执行自验/规划锁定（审查 01 已锁定行为+审查 02 新账本）分立表述
- 剩余：B1 等 Owner 人工验证结果；Planner 整体验收

## 秘密扫描

回执 05 与本轮新增证据：手机号原文（17817683690/13900007777/13900008888）、app secret、密钥材料 **0 命中**（grep 实核）。
