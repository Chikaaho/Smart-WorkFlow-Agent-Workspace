# P66 规划审查：B2 第一批（planning-review-b2-01）

| 项目 | 内容 |
|---|---|
| 审查对象 | `receipts/execution-b2-01.md`（Server `feature/0.4.0-multi-database` @ `21da4cea`） |
| 依据 | `receipts/planning-review-b1-01.md` §2—§3、`receipts/planning-review-assess-02.md` §3、§5 |
| 日期 | 2026-11-09 |
| 审查角色 | Planner |
| 结论 | **有条件通过（进度通过，单库未验收）**：R1—R4、R6、R7 关闭；R2 基本关闭；R5 证据存疑。MySQL 5.7/8.0 和 Oracle 21c XE 的迁移与种子部分通过，但单库验收项没做齐，要补做 S1—S6 |
| 七阶段 | **1 / 1 / 5** |

## 1. B1 遗留 R1—R7

| 编号 | 结论 | 说明 |
|---|---|---|
| R1 | 关闭 | 检查已移到迁移入口之前，并有测试证明检查失败时迁移一条都不执行 |
| R2 | 基本关闭 | 采用方案 (b)：保留行锁等待，理由成立（同一事务随后要 `incrementWithinCap`）。在真实 MySQL 5.7 上验证了：行被持有时 3 秒内返回、行空闲时返回 id、8 线程只有 1 个领取成功。**还缺**：一个断言“连接归还池子后 `innodb_lock_wait_timeout` 已恢复原值”的测试，回执只描述了实现。并入 S6 |
| R3 | 关闭 | 第二层比对已补；`sys_role_menu` 按业务键比对，合理 |
| R4 | 关闭 | 已改为 `V0.4.0` |
| R5 | **存疑，见 S1** | |
| R6 | 关闭 | MySQL、Oracle 建表直接使用 `opinion_comment` |
| R7 | 关闭 | 在最新提交上重跑全量，2,454 个测试 0 失败；`.last` 语料 129/129；有 OFFSET 但没有 ORDER BY 的站点为 0，命令已附 |

本批另外修复的 6 项跨库缺陷：`read`/`comment` 别名、MySQL 5.7 误走 SKIP LOCKED、`explicit_defaults_for_timestamp`、pgvector 初始化器、Oracle NULL 绑定。发现得及时，处理方式接受。

## 2. 问题

- **S1 R5 的结论和 UAT 的实际情况对不上。**
  - 回执说 0.3.2 在 PG（包括 UAT）上查智能体工具会报 `smallint = boolean`。
  - 但三示例流程的 C1、C2 在 UAT 0.3.2 上走了智能体读数链路，最终都是 APPROVED。
  - 所以“PG 上报错”要么只出现在特定路径，要么不成立。必须讲清楚：
    - 1）用 develop `4d606f60` 在真实 PG 上复现，给出报错的具体方法和堆栈；
    - 2）列出这 10 处调用中，哪些在 UAT 上被调用过、哪些没有；
    - 3）只读查看 UAT 后端日志里有没有这个错误。只读日志，不碰数据库。
  - 如果确认 UAT 有可感知的故障，Planner 会提请 Owner 决定：随 0.4.0 一起修，还是单独发 Server 0.3.3 补丁。在这之前，需求池里写的“随 0.4.0 发布”只算暂定。
- **S2 `sw_form_def.form_key` 的唯一约束可能和 PG 不一致。**
  - Oracle 去掉了内联 `UNIQUE(form_key)`，改成 `(form_key, deleted)` 唯一索引，回执说“与 PG/H2/MySQL 语义一致”。
  - 需要说明：
    - PG 和 H2 现在实际是哪种约束？
    - 如果 PG 是 `UNIQUE(form_key)`，Oracle 改成 `(form_key, deleted)` 后，同一个 `form_key` 删除后可以重建，行为就和 PG 不同了。
    - 如果 0.4.0 要对 PG 也统一，那是新增一条迁移改约束，属于行为变更，要单独列出并说明理由。
  - 拿真实的约束定义对照回答，不要只给结论。
- **S3 每个库要验的项目没做齐（审查 b1-01 §3 第 2 条）。** MySQL 5.7/8.0 和 Oracle 都缺：
  - 主流程业务冒烟：管理员登录、表单发布、发起审批到终态、定时任务各跑一次。
  - 向量持久化：在 `sw.knowledge.vector-store=database` 下写入、检索、删除各一次，并说明结果与 PG 是否一致。
  - Oracle 空串冒烟：审查 02 §5 的 4 项，包括可选文本留空回读、必填文本留空被拒、清空后再保存、审批意见留空。
  - `metadata_json` 回读测试：审查 b1-01 要求在“第一份涉及非 PG 脚本的回执”完成，本批就是，但又往后推了。
  - S3 做完之前，MySQL 和 Oracle 只算“迁移与种子通过”，不算单库验收通过。
- **S4 MySQL 8.0 用户变量的弃用告警。** `ROW_NUMBER` 改成了用户变量顺延。MySQL 8.0 对“在表达式里给用户变量赋值”有弃用告警，以后的版本可能移除。8.0 支持窗口函数，是否改走 8.0 专用分支，在回执里说明取舍。不阻断。
- **S5 SQL Server 的提前提醒。** `idempotent_key` 这类可空列加唯一约束：MySQL 和 Oracle 允许多个 NULL，SQL Server 只允许一个。轮到 SQL Server 时要改成带筛选条件的唯一索引（`WHERE ... IS NOT NULL`）。
- **S6 补证据。**
  - R2 的会话变量还原测试。
  - `read`/`comment` 两个 Java 字段改名后，加一条接口级契约测试：在 PG 上断言 JSON 键仍然是 `read` 和 `comment`。证明对外接口没变，Web 不受影响。

## 3. 下一步

1. **DM8 卡在授权**：按 Owner“卡住再说”的安排，已提请 Owner 提供材料（见第 4 节）。在此之前 DM8 暂停，不用社区镜像代替。
2. **其他库不等 DM8，先做**：
   - openGauss：用社区官方镜像 `opengauss/opengauss`，记录 sha256。
   - SQL Server 2019/2022 Developer：用微软官方 `mcr.microsoft.com/mssql/server`，排序规则 `Chinese_PRC_CS_AS`。
   - MariaDB 10.6：用官方镜像。
   - KingbaseES：先看官方能否免注册下载，需要授权就同样停下来报告。
   - 推荐顺序：openGauss → SQL Server → MariaDB；人大金仓视授权情况插入。
3. **S1、S2 写在下一份回执的最前面**，S3、S6 随下一批完成。
4. 回执 `receipts/execution-b2-02.md`。

## 4. 需提请 Owner

- **DM8 官方材料**：二选一。
  - 达梦官网注册后下载的 DM8 Docker 镜像包（`dm8_*.tar`）。
  - 或 DM8 安装包，加上开发版或试用授权。
  - 放到本机目录后告诉 Executor 路径，Executor 负责记录 sha256，并按 `CASE_SENSITIVE=Y`、`LENGTH_IN_CHAR=1` 初始化。
- **R5 的处理方式**：等 S1 结论出来再决定，现在不用决定。

## 5. Owner 裁决（2026-11-09 追记）

1. **DM8 先跳过实库验证。**
   - Executor 照常编写 DM8 迁移脚本和种子，走 `SwVendorMigrationRunner`；目录、初始化参数说明、连接示例、`SeedComparisonTest` 运行命令都要准备好。
   - Owner 自行在达梦上验证。有问题时，再单独开修复任务。
   - DM8 的完成口径改为“脚本与种子就绪，并通过静态检查”。静态检查包括：保留字、标识符长度、语法上避开不支持的写法，以及 Runner 用 H2 代理跑通。
   - 在 0.4.0 的发布说明里，DM8 标为“由 Owner 验证”。
   - 人大金仓如果也卡在授权，按同样口径处理，届时 Planner 会先报告 Owner 确认。
2. **R5 单独发 Server 补丁。**
   - 方向：`product/server-033-agent-tool-enabled-hotfix/ready/direction-server-033-hotfix.md`。
   - S1 的影响核实改由补丁任务第 1 步承接；P66 下一份回执不再回答 S1。
   - P66 在 0.4.0 发布前合入包含 0.3.3 的 `develop`。
