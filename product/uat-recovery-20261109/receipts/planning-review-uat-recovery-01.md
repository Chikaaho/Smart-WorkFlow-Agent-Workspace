# 规划审查：UAT 恢复（planning-review-uat-recovery-01）

| 项目 | 内容 |
|---|---|
| 审查对象 | `receipts/execution-uat-recovery-01.md`；附带 `product/server-033-agent-tool-enabled-hotfix/receipts/execution-033-01.md`、`product/multi-database-compat/receipts/execution-final-02.md` |
| 依据 | `ready/direction-uat-recovery.md` |
| 日期 | 2026-11-09 |
| 审查角色 | Planner |
| 结论 | **通过（COMPLETED）**：UAT 已恢复，根分区水位从 100% 降到 66%，原因已查清；方向归档到 `passed/`。剩余 3 项后续事项（W1—W3），不影响本任务结束 |

## 1. 核对结果

| 目标 | 结果 | 结论 |
|---|---|---|
| 查清原因 | 根分区写满（100%）→ checkpointer 写入失败并 PANIC → 崩溃恢复时无法扩展 FSM → 集群停止（10:00:48）。有日志原文为证 | 通过 |
| 清理只在授权范围内 | reasonix 盘点到 12 种形式，依赖已检查，清理清单逐项写了路径、大小、命令和依据；nginx 删除前已备份，执行了 `nginx -t` 和 reload。旧备份保留了“当前 + 最近回退”。PG 数据目录、WAL、uploads、`/data/backup` 都没动 | 通过（附 W1） |
| 水位低于 85% | 66%，可用 6.4G；inode 18% | 通过 |
| 恢复时没有破坏性操作 | 腾出空间后 PG 自行完成崩溃恢复（redo done），没有执行 `pg_resetwal`，没有删 WAL | 通过 |
| 恢复后回读 | PG 14.24 online；`flyway_schema_history` 31 行，全部成功，终点 0.2.9；health UP；`build.version=0.3.2`；首页和登录页返回 200；三示例实例只读打开 | 通过 |
| 2.4 两项 | P66 校验和比对 28/28 一致（见第 2 节）；0.3.3 日志统计 0 次（见第 3 节） | 已完成 |
| 防止再次发生的建议 | 日志每天约 500MB 是主要消耗；PG unit 设为 `Restart=no`；告警阈值与部署门槛都已给出 | 通过（附 W2） |

UAT 停机时间约 3 小时 21 分钟（10:00:48—13:22:11）。期间只有 PG 不可用，业务数据没有丢失。

## 2. P66 `execution-final-02.md`：通过

- 用同版本的 Flyway 11.3.4 `ChecksumCalculator` 计算，28 个脚本的当前生效校验和逐条一致；UAT jar 内的脚本与分支文件 SHA-256 也逐条一致。
- 两个可重复脚本存在多行历史，取 `installed_rank` 最大的一行比对，口径正确。
- 分支只新增 `V0.4.0` 和 `R__0.4.0` 两个脚本。
- 方向阶段 B 第 4 条“PostgreSQL 迁移校验和与 UAT 一致”**已满足**，P66 执行阶段的验证全部完成。剩下只等 0.3.3 发布后再合并和发版。

## 3. 0.3.3 `execution-033-01.md`：PARTIAL，认可

- 已读日志覆盖 2026-11-08 00:00 到 2026-11-09 13:39，这段时间内 `smallint = boolean` 一类报错 0 次。Executor 如实标为 PARTIAL，没有据此下“不受影响”的结论，这一点认可。
- 结合三示例流程的 C1、C2 智能体链路在 UAT 上正常走完这一事实，目前的倾向是：**10 处调用中，UAT 实际走到的路径很可能没有报错，或者根本没被调用过**。是否需要单独发补丁，要等复现结果和路径映射出来再定。
- 下一步：Executor 完成 0.3.3 第 1 步剩下的两项：用 `de8ec017` 在真实 PG 上复现，并把 10 处调用对应到业务路径。回执记为 `execution-033-02.md`，覆盖第 1 步全部内容；方向原定的第 2—6 步回执顺延为 `execution-033-03.md`。
  - 如果复现成功，且有路径在 UAT 上可以被触发：继续发 0.3.3。
  - 如果复现不出来，或者相关路径在 UAT 上走不到：Planner 报告 Owner，建议取消 0.3.3，修复直接随 0.4.0 发布。

## 4. 后续事项

- **W1 PM2 被整体停用，要补一项确认。**
  - Executor 除了删掉 reasonix 进程，还执行了 `pm2 kill`、`systemctl disable --now pm2-root`、`rm -rf /root/.pm2`，相当于把 PM2 守护本身整体移除了。
  - 回执只说明 CH-aPaaS 不依赖 reasonix，**没有说明 PM2 是否还管着其他进程**。
  - 请在下一份回执中补充：删除前 `pm2 list` 的输出（如有留存），或者删除后确认没有其他服务因此停止。服务器上目前的端口监听清单，与恢复前对比即可。
- **W2 防止再次发生：建议现在就做三件低风险的事（需要 Owner 授权）。** 后端日志每天约 500MB，现有 6.4G 大约 10 天就会再次写满。
  1. 后端日志级别从 DEBUG 改为 INFO，并按大小和时间轮转（单个文件 100MB、保留 14 天、总量 1G）。只改配置和 logback，不改代码。
  2. `postgresql@14-main` 增加 systemd drop-in `Restart=on-failure`。
  3. 每 5 分钟检查一次磁盘，超过 80% 写入告警日志。如果 Owner 有通知渠道，就接到通知渠道。
  - 前两项会各重启一次后端和 PG，可以放在 0.3.3 或 0.4.0 部署时一起做。
- **W3 两处保留项交 Owner 决定**：`/root/TODO-reasonix-openrouter.md`（4K）和 `/root/.claude/projects/-data-reasonix-files*`（6.5M）。都很小，Planner 建议保留，不必处理。

## 5. 归档

`ready/direction-uat-recovery.md` 已移到 `passed/`，UAT 恢复任务结束。W1 并入下一份 0.3.3 回执；W2 等 Owner 授权后，随下一次部署执行。
