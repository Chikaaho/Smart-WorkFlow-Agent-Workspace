# 规划审查：Server 0.3.3 第 1 步影响核实（planning-review-033-02）

| 项目 | 内容 |
|---|---|
| 审查对象 | `receipts/execution-033-02.md`（附 `execution-033-01.md`） |
| 依据 | `ready/direction-server-033-hotfix.md` §2.1；`product/uat-recovery-20261109/receipts/planning-review-uat-recovery-01.md` §3、§4 W1 |
| 日期 | 2026-11-09 |
| 审查角色 | Planner |
| 结论 | **第 1 步通过，触发停止条件**：UAT 不受影响。建议 Owner 取消 0.3.3，方向暂停为 `STOPPED`，等 Owner 确认后归档。P66 新增合并前必修项 X1 |

## 1. 核对

| 项 | 证据 | 结论 |
|---|---|---|
| UAT 列类型 | `information_schema` 中两表 `enabled` 均为 `boolean`；`V0.2.3`（rank 29）已成功应用，它把 SMALLINT 转成了 BOOLEAN | 成立 |
| 用 0.3.2 真实复现 | `de8ec017` 在 PG 空库上迁移到 0.2.9 后列为 boolean，`enabled=true` 查询返回 200；人为把列改回 SMALLINT 后，同一接口返回 500，报 `smallint = boolean`，SQL 和堆栈都附上了 | 成立：缺陷前提是旧列类型，UAT 不满足 |
| 路径映射 | 实际是 12 处（10 处字面量 + 2 处动态筛选），逐处列了业务入口；3/4/7/8 在 UAT 校园图的执行里成功走过（TOOL 节点 ×2、LLM 内部工具调用） | 成立：有正向证据 |
| 反向验证 | 在 boolean 列上执行 `enabled = 1`，报 `boolean = integer` | 成立：P66 的 `1/0` 绑定在 PG 上是错的 |
| W1 PM2 | 删除后 journal 显示 PM2 启动时 "No process found"；没有失败的 systemd 单元；当前监听端口全部能对上归属；只有删除前的 `pm2 list` 原件没有保存下来 | 关闭。缺口如实记录，有旁证，不需要 Owner 补证 |

## 2. 判定

1. **0.3.3 的前提不成立。** B1 的 R5 当初只看了基线建表语句（SMALLINT），没有核对整条迁移链跑完后的最终列类型。Planner 当时也没有复核，就直接把它定为线上缺陷。这一条记为教训。
2. **建议取消 0.3.3**（需要 Owner 确认，因为单独发补丁是 Owner 裁决的）。取消后 UAT 继续用 0.3.2，不建 hotfix 分支，不打 tag。
3. 方向 §6 的运维附带项，按原定写法**并入 0.4.0 部署**，已写入 P66 方向 §4 阶段 D。

## 3. P66 新增 X1（合并 0.4.0 前必修，阻塞合并）

P66 分支 `26d0e8a7` 把 12 处绑定改成了 `1/0`。PG（含 UAT 升级路径）上这两列是 BOOLEAN，0.4.0 一上线智能体工具查询就会报错。P66 之前的 PG 冒烟没有覆盖智能体工具查询，所以没发现。要求：

1. 列出这两个字段在 10 种方言最终表结构中的实际类型（以迁移链跑完后的结果为准）。
2. 绑定必须与列类型一致。推荐的做法是**恢复 Boolean 绑定**，由各驱动把 Boolean 映射成 BIT/TINYINT/NUMBER(1)。如果某个方言做不到，再在方言层单独处理，不要在业务代码里写死 `1/0`。不改迁移，PG 校验和不变。
3. 补真实 PG 集成测试，覆盖 12 处查询：启用过滤、图执行工具白名单、LLM 工具回调。MySQL 5.7/8.0、Oracle、MariaDB、openGauss、SQL Server 的业务冒烟各加一条智能体工具启用过滤查询。
4. 改完后全量 `mvn test`，六库冒烟在最终提交上重跑（和 V2 MySQL 5.7 冒烟合并成一轮）。

## 4. 下一步

- Owner 确认取消 0.3.3 → Planner 把方向归档到 `passed/`（标记 CANCELLED）。
- P66 Executor：X1 → V2（最终提交上的六库冒烟）→ V3（远端 CI）→ 合并发布 0.4.0（含 0.3.3 方向 §6 的运维附带项）→ 发布后同步，并按方向重排 README。

## 5. Owner 裁决（2026-11-09）

确认取消 0.3.3。方向已归档到 `passed/`，标记为 `CANCELLED`；UAT 维持 Server 0.3.2；不建 hotfix 分支、不打 tag。
