# 未关闭项摘要

> 0.1.1 同步点：2026-09-24（Owner 范围关闭）；既有问题摘要截至 2026-09-15；业务问题权威注册：`knowledge/known-issues.md`。

- **0.1.1 已关闭记录**：V011-BUG-021/024 按 Owner 确认退出开放集合，25 项缺陷收口、开放修复项 0；2026-09-24 Owner 明确该列车已结束，结论 `COMPLETED（Owner 范围关闭）`。不表示远程 `develop`、`main`、`0.1.1` tag/Release 或部署已完成。
- **当前正式基线**：Server compile exit 0、test **1586/0/0/0**；Web 四连全 exit 0（vitest 1301 passed + 3 skipped）——2026-09-28 0.1.2 发布门禁实跑；Flyway 制品终点 **V102**（生产当前 V96，待部署应用 V97—V102）。Phase 6C 时点 1570/V96 仅作历史。
- **后端架构候选池（最终去向，总体任务已收口）**：BAO-01 `DEFERRED`（传递依赖污染成立、API 类型污染不成立，不拆 `sw-common`）；BAO-02 `PARTIAL`（IoT 完成，Knowledge/Agent 不拆）；BAO-03/04、BAO-05、BAO-06/07、BAO-08/10、BAO-09 共 8 项 `COMPLETED`。PG 为生产权威，H2 仅 test/dev 辅助。
- **Phase 6B 接受边界**：不把 dev H2 外推为生产证明，不证明腾讯 IoT 真实云端送达；版本身份已由 Phase 6C 完成。
- **I6 五外部通知渠道**：SMS/EMAIL/FEISHU/DINGTALK/WECHAT_WORK 维持 `Owner 延期 / 未验证`，不占用 I 编号，由 P2 待办 `todo/i6-external-notification-channels-real-verification.md` 跟踪。
- **I5 三 Provider 真实链**：钉钉/飞书已按 `direction-three-provider-sso-20260928` 完成真实授权链验收 **`PASSED（2026-09-29，审查07）`**（企业矩阵/个人模式/错配拒绝均真实链证据）；**WECOM（企业微信）保持 `Owner 延期 / 未验证`**（保留配置，nginx 域名验证 location 已有变更），启用时重入真实链验证。B 端手机号准入为新规则，由 `sso-admin-config` 方向实现与独立验收。
- **其他未核销边界**：P2/P4/P34/P35/P37/P38/P39/P47 保持现状；多宿主 Supervisor 真实 ZCode 闭环仍开放。

- `sso-admin-config` VERIFYING；回执09完成：A3a/b升级为显式点击展开弹窗（无hover依赖），390实测App ID 20位与callback全文可见（Web `519a817`，四连exit0 1301+3）；R1定证统一控制台无secret重置入口（五项探查），控制台步骤需Owner（钉钉客户端侧应用管理），新值经受控通道到达后执行本地只写更新+最小复验。审查08核销B1钉钉真实链与S1定向检查，既有A1/A2/A4/A5锁定。原剩余触屏项已闭合、R1已授权凭据轮换及A6一次同步。唯一执行入口 `product/sso-admin-config/receipts/planning-execution-prompt-sso-admin-config-02.md`；下一回执09。企业微信延期，P31开放。
