# Server 0.3.3 补丁第 1 步（日志部分）回执（execution-033-01）

| 项目 | 内容 |
|---|---|
| 任务 | Server 0.3.3 智能体工具 `enabled` 整数绑定：第 1 步影响核实的 UAT 日志部分 |
| 依据 | `product/server-033-agent-tool-enabled-hotfix/ready/direction-server-033-hotfix.md` §2.1；`product/uat-recovery-20261109/ready/direction-uat-recovery.md` §2.4 |
| 日期 | 2026-11-09 |
| 执行角色 | Executor |
| 状态 | **PARTIAL**：仅完成指定日志只读统计；第 1 步的真实 PG 复现、10 处调用路径映射与 UAT 是否受影响的判定未做 |
| 结论 | 可读日志窗口内 `smallint = boolean`、`operator does not exist`、`smallint`、`boolean` 均为 0 次；日志中的 ERROR 全部是 PG 停止导致的连接失败。该结果不足以证明 UAT 不受影响 |

## 1. 范围

本次只执行 UAT 恢复方向 §2.4 指定的“0.3.3 补丁第 1 步的日志部分”：

- 只读查看 UAT 后端日志，统计 `operator does not exist: smallint = boolean` 及同类报错；
- 记录次数与时间范围；
- 不连接、不改动 UAT 数据库。

0.3.3 方向 §2.1 要求的“用 `de8ec017` 代码在真实 PostgreSQL 上复现、列出 10 处调用及业务路径、判断 UAT 是否走过”尚未执行。因此本回执不能作为 0.3.3 停/继续发版的最终依据。

## 2. 日志窗口与方法

| 文件 | 大小（扫描时） | 覆盖时间（首行 → 末行） |
|---|---:|---|
| `/opt/smart-workflow/server/logs/server.log-20261109` | 509,126,371 B | 2026-11-08T00:00:56.775+08:00 → 2026-11-09T00:00:41.422+08:00 |
| `/opt/smart-workflow/server/logs/server.log` | 287,711,195 B | 2026-11-09T00:00:43.207+08:00 → 2026-11-09T13:39:17.540+08:00 |
| `/var/log/postgresql/postgresql-14-main.log` | 5,109 B | 仅近期尾部，已轮转 |

当前 UAT 后端包 `bootstrap.jar` 的 mtime 为 2026-11-08 04:30，`build.version=0.3.2`。可读日志从 2026-11-08 00:00 开始，覆盖 0.3.2 运行期绝大部分时间；2026-11-08 之前的轮转日志已不存在。

统计命令（只读）：

```bash
grep -a -i -c "smallint = boolean" <logfile>
grep -a -i -c "operator does not exist" <logfile>
grep -a -i -c "smallint" <logfile>
grep -a -i -c "boolean" <logfile>
```

## 3. 结果

| 日志 | `smallint = boolean` | `operator does not exist` | `smallint` | `boolean` |
|---|---:|---:|---:|---:|
| `server.log-20261109` | 0 | 0 | 0 | 0 |
| `server.log` | 0 | 0 | 0 | 0 |
| PG `postgresql-14-main.log` | 0 | — | — | — |

`server.log` 中 `ERROR` 行共 **24,698** 条；抽样与归类均为 PG 停止期间的连接失败：

- `create connection SQLException ... state 08001`（连接拒绝）约 24,117 条；
- `state 57P03`（数据库正在启动/恢复）等启动期失败；
- `P0 命令轮询异常`、`普通命令轮询异常`、定时任务对账异常等均由此派生。

`server.log-20261109` 中 `ERROR` 行为 0 条。

## 4. 结论与限制

1. 在可读日志窗口内，没有出现 `operator does not exist: smallint = boolean` 或任何包含 `smallint`/`boolean` 的报错。
2. 该结果**不能证明 UAT 不受影响**：
   - 0.3.2 的智能体工具列表/启用过滤路径未必在窗口内被访问；
   - 错误可能被业务层捕获、未写入当前日志级别；
   - 2026-11-08 之前的日志已轮转，无法回查；
   - PG 日志仅保留近期尾部。
3. 按 0.3.3 方向 §2.1，仍需在真实 PostgreSQL 上以 `de8ec017` 复现，给出调用入口、SQL、堆栈，并映射 10 处调用到业务路径后，才能判断 UAT 是否走过并决定是否继续发版。

## 5. 后续

- [ ] 用 `de8ec017` 代码在真实 PG（本机容器，前缀 `swmdb-` 或 `sw033-`）复现修复前失败、修复后通过。
- [ ] 列出 10 处 `.eq(getEnabled, true/false)` 调用所属业务路径，并与三示例流程 C1/C2 智能体链路对照。
- [ ] 由 Planner 根据“日志 0 次 + 复现结果 + 路径映射”裁决 0.3.3 是否继续。

## 6. 约束遵守

- 仅执行 `grep`/`psql SELECT` 等只读操作；未写 UAT 数据库、未改代码、未重启服务。
- 未记录任何凭据；日志内容未外传。
