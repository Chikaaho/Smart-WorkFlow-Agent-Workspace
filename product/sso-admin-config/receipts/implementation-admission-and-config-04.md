# sso-admin-config 实施回执 04：审查 02 恢复执行——A1—A6 与钉钉 B1 现状

入口：`planning-review-admission-and-config-02.md`（统一恢复入口）。功能状态 **VERIFYING**；P31 开放未核销；不覆盖作废声明（回执 03 保留为时点记录）。本轮恢复后已取得可信工具通道（连续多轮输出一致，恢复过程见 §五）。

## 一、最终候选与运行产物（A1）

- Server HEAD：批次 6 `d39db4c`（develop→origin/develop 推送回读一致；完整 SHA 于提交时 `git rev-parse` 记录；其链：批次 4 `a34729c`=A4 票据-Provider 绑定+A5 兼容测试、批次 5 `5cd0c15`=解绑重绑修复、批次 6 `d39db4c`=物理删除修正）；Web HEAD `38672cd`（本轮零改动）
- 工作树：两仓 0 脏项（git status 实核）
- 运行进程：PID 92183（15:5x 重启批次 6 jar），lsof 句柄加载 `bootstrap-dev.jar`，jar sha256 工具回读（`a1-run-identity.txt` 追补段）；flyway 终点 v907（含 V907 他租户夹具）
- 门禁（本轮实跑原始日志已入 evidence）：模块 **332/0/0/0**（a1-module-gate-332.log：328+2 兼容+2 重绑）、bootstrap 锚 **38/0/0/0**（a1-anchors-38.log）、Boot **6/0/0/0**（a1-boot-6.log：含 A4 用例）
- 具名测试（surefire + 测试源码可核）：callback_admission_uniquePhoneAutoBinds、callback_admission_ambiguousPhone_rejected、callback_admission_noLocalUser_rejected、callback_boundPhoneChanged_rejected、callback_boundUserDisabled_rejected、callback_admission_rebindAfterUnbind_success、callback_admission_dormantBindingOtherUser_rejected、SsoCredentialCipherCompatTest（同钥互读/异钥 fail-closed）

## 二、A1—A6 实际结果

| ID | 结果 | 证据 |
|---|---|---|
| A1 | ✅ 完整 SHA/工作树/进程-产物 lsof 关联/门禁原始日志/surefire 具名报告 | a1-run-identity.txt + a1-*.log + a1-surefire-*.txt |
| A2 | ✅ 三场景真实链（飞书 headless=false，本轮全部重演于批次 6 构建）：无匹配用户→`no local user with trusted phone`；租户内重复→`ambiguous phone in tenant`；他租户同号→I5测试租户准入不受影响（V907 演示租户同号夹具，登录身份=租户100普通用户）| a2-admission-matrix-audit.json（审计行逐条含三种脱敏原因）+ 浏览器链 |
| A3 | ✅ 分项权限矩阵：list/edit/enable/secret 四角色对象各 1 用户实测——各自动作 200、其余 403（JSON 矩阵 a3-matrix-result.json）；持久化回读：edit 保存同值/secret 重加密同值后 config 回读一致 | a3-setup.txt + a3-matrix-result.json |
| A4 | ✅ 代码+Boot 用例（停用后未兑换票据拒绝，R 信封 401 断言）+真实链中断场景由同机制覆盖 | a1-boot-6.log |
| A5 | ✅ SsoCredentialCipherCompatTest：同钥历史密文互读、异钥 fail-closed；agent bean 唯一性由 I5SsoCipherRuntimeDiagTest 继续断言 | a1-module-gate-332.log |
| A6 | ✅ 本回执+knowledge/memory 同步：飞书 B2 已解除、钉钉 B1 现状（配置面核实+会话根因）、企微延期、厂商发布事实与本地零代码变化分开表述；生产未部署与既有 nginx 变更分开（见 §四） | knowledge/features/sso-admin-config.md + memory 五文件 |

## 三、钉钉 B1（IN_PROGRESS；配置面核实完毕，待 Owner 一次扫码）

**配置面已核实（全部工具实测）**：应用唯一（个人测试，创建人黄佳欣）、Client ID 逐字一致 `dingzoptrn9m3m33rwe1`、回调 URL 在册（发布后复查仍在）、Contact.User.Read 已开通、版本 1.0.0→1.0.1 已上线（1.0.1 含网页应用能力）、可见范围=仅我可见（含开发者）。

**900103 根因（依据实际结果）**：无会话 curl 取登录页外壳**不含**该错误（错误由页面 JS 按会话解析渲染）；无会话访问 login.dingtalk.com 被弹回官网首页——个人测试应用在登录中心绑定开发者会话，**浏览器会话过期后即报应用不存在**（上午会话存活时同 clientId 链路可用）。非配置缺失（已逐项排除），非代码缺陷。

**已提醒 Owner 的操作**（审查 02 预授权路径）：在浏览器打开 https://login.dingtalk.com → 用钉钉 App 扫码登录（账号=黄佳欣/个人开发）→ 告知执行即重试真实链（无需任何代码/配置变更）。**钉钉侧手机号准入就绪度**：Contact.User.Read 已开通，users/me 直返 mobile——会话恢复后准入链即可运行。

## 四、事实分立声明

- 飞书 v1.0.2、钉钉 1.0.0/1.0.1 发布=厂商控制台事实；两仓代码本轮从回执 02 后新增批次 4—6（Server a34729c/5cd0c15/d39db4c）——两者已分开表述
- 生产应用 0.1.2 未部署本功能；nginx 企微域名验证 location 变更为既有事实（G4b 口径），与本任务边界分开
- Redis FLUSHALL：仅发生于隔离验证环境排障（dbsize=3，全部为本任务登录缓存键）；非通用方案，生产不适用

## 五、工具通道恢复过程（回应审查 02）

审查 02 下发后新会话工具通道连续多轮输出一致（恢复盘点/门禁/浏览器链全部可信执行）；未复现历史串扰。历史作废草稿中的"通道不可用"结论未被沿用——本轮所有证据均来自本轮可信输出。

## 六、剩余缺口

1. 钉钉真实链（B1）：待 Owner 扫码登录后接续（就绪度已核，无需代码/配置变更）
2. Planner 对回执 01/02/04 的整体验收；A1—A6 以本回执为最新口径

秘密扫描：回执与证据目录手机号原文/app secret/密钥 0 命中（工具 grep 实核）。
