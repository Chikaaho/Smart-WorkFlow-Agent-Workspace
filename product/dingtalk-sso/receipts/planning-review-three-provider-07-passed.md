# 钉钉与飞书真实接入验收 PASSED

日期2026-09-29；Planner。依据实施09、审查06及已锁定证据。结论：**本轮原定范围功能PASSED**；企业微信依Owner决定延期/真实链未验证。未完成阶段三，不宣称COMPLETED。

## 剩余项核销

- R1b-F：实际解析r9b-feishu-mismatch-audit-full.json，AUTH_START后LOGIN_FAILED/ENTERPRISE_MISMATCH，窗口无LOGIN_SUCCESS；me前后同9002、bindings前后均空，结合既有拒绝断言通过。已目视错误页制品。
- R1c-F：实际解析r9c-feishu-personal-audit-full.json，personal换票、BIND、再次personal换票和LOGIN_SUCCESS关联9002；最终一条FEISHU6bb50608，已目视普通用户工作台。通过。
- R1封装：钉钉完整个人审计7条解析成功，personal→绑定→再次personal→LOGIN_SUCCESS；原截断缺口关闭。两平台拒绝审计与锁定安全断言组合采信。
- R2：r2-run-identity.txt给出完整两仓SHA、工作树、jar哈希、进程加载路径和时点；与门禁及真实场景串联一致。锁定Server7342e788d47868c0b10790c61fe19aef4269c781、Web d37a57b70de0b11466fac9a9fc98fcdff737031a；jar ea8c7ca97bcbc139b16112628d9c34c33244784b05676a1acc42f085c398baf6。受影响门禁319/0/0/0、Boot4/0/0/0、Web1301+3及既有四连结果保持各自采集时点。

## 边界与下一入口

A—F按历次锁定证据及本轮核销在Owner调整范围内通过；批量第二成员、企业微信和生产应用部署不冒称完成。生产应用仍0.1.2，nginx域名校验location已有变更。P31继续开放，功能数45、清单46/22/22不变（本轮为既有I5真实链补验，不新增业务计数）。

Owner随后新增B端手机号准入：用户必须预先存在于当前租户组织架构，可信手机号匹配后才可绑定/登录。**该新增行为不包含在本次PASSED中**，由后台SSO配置管理方向实现与独立验收；不得将历史手动绑定路径的通过直接投影为新准入通过。

主方向归档passed；阶段三入口为ready/direction-sso-terminal-sync-20260929.md。Owner“本轮验收通过后开发后台配置”的条件已满足；完成状态同步提交后可按product/sso-admin-config/ready/direction-sso-admin-config.md推进新主功能，无需另行申请。
