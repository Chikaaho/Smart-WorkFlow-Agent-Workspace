# 未关闭项摘要

> 0.1.1 同步点：2026-09-23（阶段快照机械同步）；既有问题摘要截至 2026-09-15；业务问题权威注册：`knowledge/known-issues.md`。

- **0.1.1 当前开放项**：V011-BUG-021 处理中（失效入口待 Owner 提供具体复现输入；404 页返回动作已由 `dc4cf52` 落地）；V011-BUG-024 Owner 复开（普通滚轮、横向触控板式滚动与网格随动已补证，**Shift+滚轮专项仍未关闭**）。未处置合计 **2**；账本按行复算 25 = 23 已提交候选 + 2 开放，旧汇总「24 候选」已更正为 23。BUG-012 三比例 headed 页签居中补证已提交（`5eb6da1`）、待独立验收。当前同步入口 `product/v0.1.1-bugfix/ready/direction-current-state-sync-20260923.md`，补正入口 `product/v0.1.1-bugfix/receipts/planning-execution-prompt-current-state-sync-20260923-01.md`，补正回执 `product/v0.1.1-bugfix/receipts/current-state-sync-20260923-03.md` 待 Planner 复核（01/02 为历史）；完整缺陷事实见该功能 receipts。**另记（待 Planner 裁决，不计入上述计数）**：两仓 `0.1.1-bugfix` 已登记基点至本地 HEAD 之间（Server `750ad39..7ff4743`、Web `5eb6da1..281892e`）另有未登记提交、未推送（`knowledge/features/v0.1.1-bugfix.md` §3.1）。

- **2026-09-15 I6 规划确认终态投影轮**（I6 已为 `COMPLETED（规划已确认，2026-09-15）`）：`knowledge/known-issues.md` 无变化，I 集合维持 **54 条**（I1—I55 区间缺 I27，不增删）；R8 五外部通知渠道（SMS/EMAIL/FEISHU/DINGTALK/WECHAT_WORK）维持 **`Owner延期 / 未验证`**，不登记为缺陷、不占用 I 编号，继续由 P2 待办 `todo/i6-external-notification-channels-real-verification.md` 跟踪；P60/P31 及其他开放编号不核销，P2/P4/P34/P35/P37/P38/P39/P47 保持现状。
- **2026-09-14 I5 阶段三终态同步轮**：`knowledge/known-issues.md` 无变化，I 集合维持 **54 条**（I1—I55 区间缺 I27，不增删）；三 Provider（WECOM/FEISHU/DINGTALK）真实成功链按 Owner 明确裁决为**延期免验/未验证边界**，不登记为缺陷、不占用 I 编号（启用时按 `Smart-WorkFlow-aPaaS-server/docs/sso/owner-acceptance-handbook.md` 自验）；P60/P31 及其他开放编号本阶段不核销，P2/P4/P34/P35/P37/P38/P39/P47 保持现状。
- **历史轮次（已收敛）**：2026-09-08 p21 轮仅 I14 更新（◐→✅）、腾讯实网免验边界保留为记录；P59/P58/P57/P56/P52 轮 `known-issues.md` 无变化（P57 口径：非零租户无受支持登录入口为认证产品边界，不登记为缺陷，I5 已收口租户校验）；2026-09-04 全量对账轮 I 集合 54 条（I27 缺行待定位见索引 §5），五行 ⬜→🟦 为已交付子集登记、P34/P35/P37/P38/P39 未核销；治理一致性审计 16 项可修项已全部关闭，当前无未关闭治理项。
