# memory使用说明

当前任务 bugfix-20261013：**COMPLETED（规划验收通过，终态同步待复核）**（2026-10-15 规划复核 [planning-review-release-015-01-passed](../product/bugfix-20261013/receipts/planning-review-release-015-01-passed.md)）。BF001—053 共 53 项 Owner 关闭；R015-01/R015-02 通过。总5阶段 **5/0/0**。应用/部署版本 **0.1.5**（开发默认 0.1.5-SNAPSHOT、正式构建 `-Drevision=0.1.5`）；功能登记 **48**（本列车新增0）、清单 **46/22/22=90**、ADV64/问题57 保持；不新增/不核销 P 编号。活动功能无；应用中心仅下轮候选；P62 性能延期/OFF 保持。**唯一下一动作：Planner 复核 `product/bugfix-20261013/receipts/terminal-sync-015-01.md`**。

验证边界（BF015-VB01—VB04）：Server 本次 351 测试类 **2051/3/0/27 BUILD FAILURE**（3 项既有环境/时序失败保留；bootstrap 子集 290/3/0/27 不重复相加、不称全仓全绿）；Web `b069620` typecheck 退出0/lint 0错误3警告/vitest 1534 通过/build 通过（该次跳过数未明确）；双方言新旧种子直接内容一致、种子验证 5/0/0/0、升级通道 2/0、追加迁移 1/0、回滚边界 1/0、开发库 validate→migrate 0→再 validate 通过；UAT 0.1.5 可见会话验收通过，R015-01/02 通过。1280×720 备案行少量滚动、UAT 验收表单/流程/已办实例保留、SSO/性能未覆盖。Git：Server `8c25932`、Web `b069620` 已入修复分支/develop/main 并推送回读；未强推、未修改历史提交信息、未建 tag/Release。P64/P63 历史终态保持（COMPLETED，集合见 knowledge/features 登记）。

读取顺序 state→handoff→features→constraints；memory 为规划摘要与证据指针，`knowledge/current-status.md` 为持久权威。
