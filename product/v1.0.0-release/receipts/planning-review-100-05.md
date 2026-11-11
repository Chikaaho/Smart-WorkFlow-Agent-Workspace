# 1.0.0 · 阶段 7 终审（planning-review-100-05）

日期：2026-11-12｜规划（Planner）｜依据：`execution-100-05.md`、`receipts/evidence/` 演示环境截图与文件、`todo/requirement-pool.md` 回读

## 1. 结论

**COMPLETED。1.0.0 列车结束，七阶段 7/0/0。** 两个仓库已合并到 main，都打了 `1.0.0` tag 并发布 Release（设为 Latest）。演示环境的 Server 和 Web 都升到了 1.0.0，Flyway 多了 1 行，F1—F4 复测通过。P27、P33、P40 作为第 53—55 个正式功能核销，方向已归档到 `passed/`。

## 2. 逐项裁决

| 项 | 裁决 | 依据 |
|---|---|---|
| 阶段 4 合并 | 通过 | 两仓 feature → develop → main 都是普通合并。CI：Server develop `43035313977`、main `43035353166`（attempt 2），Web feature/develop/main `43036986258`/`43037004490`/`43037042393`，全部 success。全量测试 2,492/0/0/45，`CommandQueueIntegrationTest` 7/7（含 p0）。feature 分支已删，保留的分支没动 |
| CI 首跑失败 | 接受 | Web：`PrintSheet.spec` 只在第一条用例前把时区设成上海，在 UTC 环境的 runner 上后两条用例失败。这是测试本身的问题，已修，修好后重新走了一遍合并。Server main 首跑失败的是 `JavaSubprocessSandboxTest`，不是 p0，所以不算触发「停下报告」的条件；同一份代码在 develop 上全绿，attempt 2 也全绿。这个类登记为新的 CI 偶发项，见 §3 |
| 阶段 5 发版 | 通过 | tag `1.0.0` → Server `aa7c86e5`、Web `a85aa8e2`。Release `441827517` / `441848348`，资产 `bootstrap-1.0.0.jar` 242,697,784 B、`sw-web-dist-1.0.0.zip` 6,221,796 B，并附 sha256。发布说明写进了三项已接受的限制。0.4.1/0.3.8 及更早的 tag 和 Release 没动 |
| 阶段 6 部署 | 通过 | 部署前剩余空间 6.4G。先备份数据库 dump、jar、配置和 Web 目录，再先 Server 后 Web 部署。部署后 `build.version=1.0.0`，health UP，Flyway 33→34 行、终点 1.0.0，启动日志没有 ERROR；运行中的 jar 和 Release 资产 sha256 一致。Web 入口 `index-BCCrQSgQ.js`，四个地址都返回 200 |
| F1 复测 | 通过 | 成功导入 3 行。含错误行的那批整批回滚，0 行入库。新账号第一次登录被拦截，改密前调接口返回 403 `system.must_change_password`，改密后正常。测试账号已停用（再登录返回 401），没有删除 |
| F2 复测 | 通过 | `f2_uat_print_preview.png` 和 `f2_uat_pdf_page_1.png` 是同一条记录：14 行明细，申请日期 `2026-11-11 10:00`，到货时间 `2026-11-12`，页脚「表单版本 v2（提交时版本）」，两边一致。明细表导出 15 行（表头加 14 行），日期和页面一致 |
| F3 复测 | 通过 | `f3_uat_audit_page.png`：时间格式、模块「认证」、动作「登录/修改密码」都对；登录失败记了原因「验证码校验未通过」；租户 0 和 9001 能区分开。异常日志为 0 条，是因为演示环境没有发生过未处理异常，这条路径在隔离环境验证过，接受 |
| F4 复测 | 通过（证据有出入） | `f4_uat_monitor_iot_detail.png` 中 `iot-2118780073471991810` 的发起人是「系统（IoT）」。但回执说 `f4_uat_monitor_iot_list.png` 里有 IoT 行，这张截图第 1 页其实没有。列表显示在阶段 3 已经用同一份代码验证过（`b9_iot_list_row.png`），所以这次不阻塞，只记作回执和证据对不上 |
| 同步 | 通过 | 需求池 P27、P33、P40 已标为已核销（第 53—55 个）；`version.json`、`CHANGELOG.md`、knowledge 的同步以执行回执为准（规划不读 knowledge） |

## 3. 遗留与登记

1. **`JavaSubprocessSandboxTest.testFileWriteBlockedBySecurityManager`**：CI 偶发，子进程被阻塞时输出为 null，抛空指针。登记为 CI 偶发项，等下一个 Server 版本一起处理。
2. **隔离环境清理（执行方）**：停掉 18093 和 5275 两个进程，删除本机克隆库 `smart_workflow_100` 和 `swmdb-*` 六个数据库容器。清理完在 memory 写一行确认，不用单独写回执。演示环境的测试数据保持停用，不删除。用户的 8080/5173 服务、`smart_workflow_f1v4b`、`smart_workflow_030`、`.runtime-*`、凭据密文和两个隔离 worktree 照旧保留。
3. **Web 界面观察**（已登记到 `todo/web-ui-defects-20261109.md`）：任务详情页底部操作栏浮在页面中间，遮住明细表；流程监控的发起人筛选不能输入 0，也不能按姓名选。
4. **回执准确性**：F4 列表截图和回执描述对不上，这类问题已经是第二次了。以后回执引用截图时，必须确认截图里确实有所说的内容。

## 4. 七阶段

已完成：评估、实施、验收、合并、发版、部署与同步、结束。**7/0/0**。
