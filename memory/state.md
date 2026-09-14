# 当前状态摘要

> 当前规划（2026-09-14）：P60成熟OA`0.1.0`目标/当前迭代`0.0.3`，**P0 / XL / IN_PROGRESS**。I1—I5 **COMPLETED（规划已确认）**；I5最终确认状态投影回执已接收，I6=VERIFYING（补证回执02 `EXECUTION_SUBMITTED`：G1/G2/G3/G7/G9 真实行为证据闭合；G4 浏览器/G5 五渠道/G8 候选固定与多身份全场景保持 VERIFYING；Server 1357/0/0/0、Web 1185+3、Flyway V90；三仓提交均未推送）。当前锁定站内信幂等/分页未读/全部已读、规则最小约束、单个跨租户负向及现有工程门禁；剩余G1—G9覆盖持久恢复、模板/安全、完整权限矩阵、真实浏览器、五外部渠道、全场景、旧库升级、候选材料与新增门禁。功能数44、✅46/🟦22/⬜22、ADV64与P编号不变。

> 最近完成基线：P21 **COMPLETED（规划已确认，2026-09-08）**，第44个正式功能；功能44、清单✅46/🟦22/⬜22、P21核销、I14关闭均锁定。正式计数以 `knowledge/current-status.md` 为准。

> 历史：P59 与 knowledge-full-reconciliation 均已确认完成（2026-09-04/05），详见 knowledge/history 与 features/。

- `v0.1.0-oa-completion`（P60）：**IN_PROGRESS**。I1—I5 **COMPLETED（规划已确认）**；I5投影门禁已关闭；I6=VERIFYING（补证回执02 `EXECUTION_SUBMITTED`：G1/G2/G3/G7/G9 真实行为证据闭合；G4 浏览器/G5 五渠道/G8 候选固定与多身份全场景保持 VERIFYING；Server 1357/0/0/0、Web 1185+3、Flyway V90；三仓提交均未推送）。当前审查入口=`planning-review-stage-i6-notification-version-closure-01.md`，下一回执=`completion-stage-i6-notification-version-closure-02.md`。
- I5 门禁基线（锁定，终态同步轮不重跑）：Server 八模块 **766/0/0/0 BUILD SUCCESS**（含 Flyway H2 86/PG 85 终点 **V86**；飞书修复后 SsoAuthServiceTest 22/0、system-biz 295/0/0/0）；Web 四门 exit 0（128 files、1183 passed + 3 skipped）；文档级交付 `Smart-WorkFlow-aPaaS-server/docs/sso/`（Owner 自验手册＋禁用态配置样例）。
- 终态值：功能数 **44**；清单 **✅46/🟦22/⬜22**（90，零变化）；**P21 已核销（2026-09-08）**；P2/P4 开放部分实现未核销、P34/P35/P37/P38/P39 部分实现未核销，P47 已纳入 I3 但未核销；I 集合 54 条不增删（**I14 已满足/关闭**、I38/I39/I40/I45 保持开放）。**P60/P31 及其他开放编号 I5 阶段不核销。**
- `p21-iot-device-access`（P21 IoT 设备接入、受控脚本与流程联动）：**COMPLETED（规划已确认，2026-09-08）**，第 **44** 个正式功能；M08 十行升✅（F04-01 保持🟦、F04-02/F05-02 保持⬜），P21 已核销、I14 关闭（腾讯实网按 Owner 免验），主方向与阶段三方向均归档 `passed/`。
- `v0.0.2-oa`：**COMPLETED（规划已确认，2026-09-07）**，第 **43** 个正式功能（历史点）；A1—A8 锁定，P3/P54/P55 核销、P2/P4 开放。
- 更早已确认功能（详见 `knowledge/history/` 与 features/）：p4 第42个（09-07，P4 总项仍开放）、P59（09-05）、p58 第41个、p57 第40个、p56 第39个＋P46、p52 第38个、p45 第37个、p51 Engine 解耦（不计功能数）。
- 发布终态：I5三仓提交已推送并回读，Workspace/Server/Web远端分别为`49cca1f`/`4c7fc24`/`5788ead`，ahead/behind均0/0；不创建0.1.0标签或Release。
- P 剩余边界：P2 其余（计算公式/外部数据源/表单删除/列表配置持久化）；P4 候选（转办/委托/加签/撤回、流程版本/挂起激活）；M08-F04-01 🟦、F04-02/F05-02 ⬜；P34/P35/P37/P38/P39 剩余；腾讯实网与三 Provider 真实链免验未做；小程序继续冻结。
- P61 已登记：P60/`0.1.0` 最终收尾后开展全系统用户可见错误码与提示语人性化治理；当前不并入 I6，不改变状态与计数。
