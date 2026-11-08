# B0 证据：运行时 SQL 方言点汇总

## 1. LIMIT 站点

| 类别 | 数量 | 说明 |
|---|---:|---|
| `.last("LIMIT …")` 大写 | 97 | main 97 |
| `.last("limit …")` 小写 | 32 | main 31 + dev 1 |
| `.last` 合计 | **129** | 涉及 68 个文件；全部是 MyBatis-Plus `last()` 尾部片段 |
| 注解 SQL `LIMIT` | 8 | NotifyMessageMapper、NotifySubjectBindingMapper、SsoAuthStateMapper、SsoUserBindingMapper×2、BpmInstanceMapper、BpmMonitorMapper、CopyRecordMapper |
| JdbcTemplate/动态 SQL `LIMIT` | 6 | FormDataQueryService×2（`LIMIT ? OFFSET ?`）、BpmResourceOpsService×2（`LIMIT ? OFFSET ?`）、TxnActionNodeDelegate×1（`LIMIT 1`）、PgKnowledgeVectorStore×1（`LIMIT ?`） |
| **合计** | **143** | assess-01 的 97 只统计了大写 `.last`，B0 修正为 143 |

## 2. 行锁站点

| 位置 | 写法 | 受影响数据库 |
|---|---|---|
| `SysTenantMapper:21` | `SELECT ... FOR UPDATE` | SQL Server 不支持；MySQL 5.7/8、Oracle、达梦、PG、Kingbase/openGauss 支持 |
| `BpmCommandMapper:19` | `SELECT ... FOR UPDATE` | 同上 |
| `BpmInstanceMapper:101` | `SELECT ... FOR UPDATE` | 同上 |
| `BpmResourceUsageMapper:62` | `FOR UPDATE SKIP LOCKED` | MySQL 5.7 不支持 SKIP LOCKED；SQL Server 不支持 FOR UPDATE；达梦待实测 |
| `ProcessThemeService:300` | `select ... for update` | SQL Server 需改 `WITH (UPDLOCK, ROWLOCK)` |
| `BpmUrgeServiceImpl:305` | `SELECT ... FOR UPDATE` | 同上 |

## 3. 其他运行时 SQL 可移植性点

| 点 | 数量/位置 | 影响 |
|---|---:|---|
| `CONCAT('%', param, '%')` 三参数 | **15 处**，分布在 6 个注解方法：JobInfoMapper 1、SysUserMapper 2、SysUserGroupMapper 4、CopyRecordMapper 8 | Oracle `CONCAT` 只接受两个参数；达梦 Oracle 模式同样；建议改成 `'%' || param || '%'`（PG/Oracle/达梦）或 `CONCAT(CONCAT('%', param), '%')`（全库） |
| `CAST(... AS VARCHAR)` | 2 处：AgentGraphExecutionMapper:38、:40 | MySQL 用 `CHAR`，Oracle/达梦用 `VARCHAR2(n)`，SQL Server 需长度；`VARCHAR` 无长度在 MySQL/Oracle 不合法 |
| `LIKE` 大小写 | 14 处搜索条件 | PG 大小写敏感，MySQL 默认不敏感，Oracle/SQL Server 取决于排序规则；若要求跨库一致，需 `LOWER(...) LIKE LOWER(...)` 或统一排序规则 |
| `information_schema` / `current_schema()` | 3 处：KnowledgeVectorColumnInitializer | PG 专用元数据链路；非 PG 不执行 |
| `pg_extension` / `<=>` / `CAST(... AS vector)` | 3 处：KnowledgeVectorColumnInitializer、PgKnowledgeVectorStore | pgvector 专用；非 PG 不执行 |
| `ILIKE`、`::`、`RETURNING`、`->`/`->>`/`@>`、布尔字面量、`||`、`now()`、`INTERVAL`、`date_trunc`、`string_agg`、`array_agg`、`DISTINCT ON` | 0 处真实 SQL | 规划审查列出的这些写法在当前注解/JdbcTemplate SQL 中不存在；`->` 的命中是 Java lambda |

## 4. JSON 绑定与向量

- `JsonStringTypeHandler`：`ps.setObject(i, parameter, Types.OTHER)`，8 个实体字段使用（FormConfig、FormSnapshot、TxnAction、TxnActionVersion、C1Policy、TxnInvocation、TxnReservation、TxnLedger）。
- 非 PG 数据库没有 pgvector；按规划裁决，向量改为持久化文本/CLOB 列 + 启动载入 + 进程内相似度，检索质量与 PG 一致即可。

## 5. 结论

- 运行时 SQL 的 PostgreSQL 专有写法比 assess-01 预估的少：没有 ILIKE、`::`、RETURNING、JSON 操作符、`||`、日期函数、聚合函数、DISTINCT ON。
- 真正的工作量集中在：129 处 `.last` LIMIT、8 处注解 LIMIT、6 处手写 LIMIT、6 处行锁、14 处三参数 CONCAT、2 处 CAST、JSON 绑定、pgvector、以及大小写/保留字/长度边界。
