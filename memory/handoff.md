# 应用中心规划交接与0.1.5完成基线

2026-10-15：**应用中心与表单分类统一**，L / **READY**。方向：`product/application-center-form-classification/ready/direction-application-center.md`；探索已读，定稿记录：`product/application-center-form-classification/receipts/planning-readiness-review-01.md`。

后台应用管理：应用为一级分类，进入应用管理二级目录和表单，在表单内设计表单及流程。用户端应用中心：进入应用查看目录/表单，点击表单进入受权限约束的数据列表。表单有唯一应用归属，可直接位于应用内或归入一个目录。

总4阶段：现状探索完成、方向定稿完成、实施与验收进行中、终态同步未开始；已完成2/进行中1/未开始1。执行已承接（2026-10-15，两仓 feature/application-center：Server d7d376f、Web 3687d04）。唯一下一动作：执行角色推进实现与验证并提交正式回执。尚无本轮实现或行为验收结果；48/90/ADV64/57与P62性能延期/OFF保持。

常规裁决：复用全租户/指定用户可见范围；新建默认指定创建者，指定空集不可见；数据查询叠加既有行权限；目录继承应用范围。迁移冲突逐对象处理，应用停用/收窄保留旧待办和历史的既有合法访问。执行探索回执为 `search_fallback/application-center-form-classification-readiness-20261015.md`，仅有只读代码/文档/本地Git事实，未查库或验证。知识旧状态残留已纠正并回传（receipts/execution-intake-01.md）；实施进行中。

## 上轮已完成基线（0.1.5）

当前任务 bugfix-20261013：**COMPLETED（规划已确认）**（2026-10-15 规划复核 [终态最终复核](../product/bugfix-20261013/receipts/planning-review-terminal-sync-015-close-01-passed.md)）。BF001—053 共 53 项 Owner 关闭；R015-01/R015-02 通过。总5阶段 **5/0/0**。应用/部署版本 **0.1.5**（开发默认 0.1.5-SNAPSHOT、正式构建 `-Drevision=0.1.5`）；功能登记 **48**（本列车新增0）、清单 **46/22/22=90**、ADV64/问题57 保持；不新增/不核销 P 编号。该终态时点活动功能无；应用中心候选现已进入上述规划；P62 性能延期/OFF 保持。该轮“等待Owner选择下一目标”已由上述规划入口接替。

验证边界（BF015-VB01—VB04）：Server 本次 351 测试类 **2051/3/0/27 BUILD FAILURE**（3 项既有环境/时序失败保留；bootstrap 子集 290/3/0/27 不重复相加、不称全仓全绿）；Web `b069620` typecheck 退出0/lint 0错误3警告/vitest 1534 通过/build 通过（该次跳过数未明确）；双方言新旧种子直接内容一致、种子验证 5/0/0/0、升级通道 2/0、追加迁移 1/0、回滚边界 1/0、开发库 validate→migrate 0→再 validate 通过；UAT 0.1.5 可见会话验收通过，R015-01/02 通过。1280×720 备案行少量滚动、UAT 验收表单/流程/已办实例保留、SSO/性能未覆盖。Git：Server `8c25932`、Web `b069620` 已入修复分支/develop/main 并推送回读；未强推、未修改历史提交信息、未建 tag/Release。P64/P63 历史终态保持（COMPLETED，集合见 knowledge/features 登记）。

发布事实（终态值）：UAT 运行 0.1.5；每个支持方言一个 `V0.1.5__baseline_seed.sql`，开发新增迁移用 `V<yyyyMMddHHmmss>__<需求>.sql`；旧链与库存量衔接为**受控、备份后的历史衔接**（非“未修改迁移历史”），开发库 `migrate` 零重复、UAT 零 versioned 重放；根路径 `/` 进入系统、旧 `/sw*` 301 到根（保留子路径）、`/sw-server/` 与 `WW_verify` 保留、原根路径站点内容不再对外（服务保留、配置可恢复）；备案链接正确；审批实例 `46e5ba9b-c877-11f1-bca0-00163e0d142f` = APPROVED。

目录与入口：主方向与发布方向已归档 `product/bugfix-20261013/passed/`；开发声明 `ready/development-declaration.md` 仍适用；运维手册已同步根路径/重定向/API/0.1.5 升级边界与恢复入口。不清理 UAT 验收对象，不重跑已锁定验证。
