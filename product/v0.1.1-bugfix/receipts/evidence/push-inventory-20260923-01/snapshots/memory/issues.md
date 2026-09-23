# 未关闭项摘要

> 0.1.1 同步点：2026-09-23（阶段快照机械同步）；既有问题摘要截至 2026-09-15；业务问题权威注册：`knowledge/known-issues.md`。

- **0.1.1 当前开放项（已由 Owner 裁决收口）**：V011-BUG-021、V011-BUG-024 均记为「**Owner确认通过**（2026-09-23）」并退出开放缺陷集合，**开放修复项 0**；此前「失效入口待复现输入」「Shift+滚轮专项未关闭」为历史执行记录，不再作为修复阶段继续执行的要求，通过依据为 Owner 本次确认（未新增行为测试或浏览器证据，不描述为工具补证完成）。登记 25 项 = 23 项已提交候选 + 2 项 Owner确认通过；本轮收件关闭，后续转全部推送准备。裁决记录 `product/v0.1.1-bugfix/receipts/planning-owner-bugfix-stage-close-20260923.md`；推送准备盘点 `product/v0.1.1-bugfix/receipts/push-inventory-20260923-01.md`；完整缺陷事实见该功能 receipts。**另记（纳入推送准备盘点，不计入上述计数）**：两仓 `0.1.1-bugfix` 已登记基点至本地 HEAD 之间（Server `750ad39..7ff4743`、Web `5eb6da1..281892e`）另有未登记提交、未推送，补充归档及对应关系；V95 仅发现迁移断言静态漂移风险，未运行测试，不改写成实测失败或已验证（`knowledge/features/v0.1.1-bugfix.md` §3.1）。

- **2026-09-15 I6 规划确认终态投影轮**（I6 已为 `COMPLETED（规划已确认，2026-09-15）`）：`knowledge/known-issues.md` 无变化，I 集合维持 **54 条**（I1—I55 区间缺 I27，不增删）；R8 五外部通知渠道（SMS/EMAIL/FEISHU/DINGTALK/WECHAT_WORK）维持 **`Owner延期 / 未验证`**，不登记为缺陷、不占用 I 编号，继续由 P2 待办 `todo/i6-external-notification-channels-real-verification.md` 跟踪；P60/P31 及其他开放编号不核销，P2/P4/P34/P35/P37/P38/P39/P47 保持现状。
- **2026-09-14 I5 阶段三终态同步轮**：`knowledge/known-issues.md` 无变化，I 集合维持 **54 条**（I1—I55 区间缺 I27，不增删）；三 Provider（WECOM/FEISHU/DINGTALK）真实成功链按 Owner 明确裁决为**延期免验/未验证边界**，不登记为缺陷、不占用 I 编号（启用时按 `Smart-WorkFlow-aPaaS-server/docs/sso/owner-acceptance-handbook.md` 自验）；P60/P31 及其他开放编号本阶段不核销，P2/P4/P34/P35/P37/P38/P39/P47 保持现状。
- **历史轮次（已收敛）**：2026-09-08 p21 轮仅 I14 更新（◐→✅）、腾讯实网免验边界保留为记录；P59/P58/P57/P56/P52 轮 `known-issues.md` 无变化（P57 口径：非零租户无受支持登录入口为认证产品边界，不登记为缺陷，I5 已收口租户校验）；2026-09-04 全量对账轮 I 集合 54 条（I27 缺行待定位见索引 §5），五行 ⬜→🟦 为已交付子集登记、P34/P35/P37/P38/P39 未核销；治理一致性审计 16 项可修项已全部关闭，当前无未关闭治理项。
