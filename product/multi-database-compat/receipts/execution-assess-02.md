# P66 多数据库兼容：B0 补充盘点（execution-assess-02）

| 项目 | 内容 |
|---|---|
| 功能 | P66 多数据库兼容：迁移脚本与 SQL 种子适配（XL，目标版本 0.4.0） |
| 依据 | `product/multi-database-compat/ready/direction-multi-database-compat.md`、`receipts/planning-review-assess-01.md` |
| 阶段 | B0 补充盘点（只读，未改业务代码） |
| 日期 | 2026-11-08 |
| 执行角色 | Executor |
| 自验结论 | B0 五项缺口已补齐，等待 Planner 确认后进入 B1 |
| 七阶段进度 | **1 / 1 / 5**（需求评估完成；执行进行中，B0 已完成；验收与同步、合并、发版、发布后同步、结束未开始） |

## 1. 结论

B0 按规划审查 §2 的五项缺口逐条补齐。盘点结果修正了阶段 A 的三处计数口径，也暴露出阶段 A 没有覆盖的两个实际缺陷：

1. **注解 SQL 不是 105 条，是 62 条**。阶段 A 的 105 来自原始文本计数（50 个 `@Select`、2 个 `@Insert`、8 个 `@Update`、45 个 `@Delete` 类文本）；其中 38 个是 `@DeleteMapping` HTTP 端点，只有 8 个是 SQL `@Delete`，另有 6 个 `@Select` 是 Javadoc 提及，其余差异来自注释/统计口径。逐条解析后可执行注解 SQL 为 62 条（main 60 + dev 2）。
2. **`.last("LIMIT …")` 不是 97 处，是 129 处**。阶段 A 只统计了大写 `LIMIT`；还有 31 处 main + 1 处 dev 写成小写 `"limit "`。加上 8 处注解 LIMIT、6 处手写 LIMIT，运行时 LIMIT 站点共 **143 处**。
3. **规划点名的 PostgreSQL 写法在真实运行时 SQL 中基本不存在**。`ILIKE`、`::` 类型转换、`RETURNING`、JSON 操作符、布尔字面量、`||` 字符串拼接、`now()`/`INTERVAL`/`date_trunc`、`string_agg`/`array_agg`、`DISTINCT ON` 在注解 SQL 和 JdbcTemplate SQL 中都是 0 处；`->` 的 6 次命中是 Java lambda，不是 SQL。
4. **新增两个实际缺陷**：
   - **15 处三参数 `CONCAT('%', param, '%')`**，Oracle/达梦的 `CONCAT` 只接受两个参数，会在搜索时直接报错。
   - **5 处 JDBC Map 键在 Oracle/达梦会取不到值**：`TxnActionNodeDelegate`、`DeptFacadeImpl`、`UserFacadeImpl`、`BpmProcessDefController`、`ApprovalLifecycleServiceImpl`；原因是未加引号的别名被折成大写，消费端仍按小写键读取。
5. **保留字命中只有 `comment` 一处**：`sw_bpm_task_opinion_draft.comment` 与 `BpmTaskOpinionDraft.@TableField("comment")`，Oracle/达梦会把它当关键字；`type` 在 MySQL/Oracle/SQL Server 不是保留字，达梦待实测。
6. **空字符串影响有限但需要冒烟覆盖**：种子 280 处 `''` 都在可空列；生产代码没有 `WHERE x = ''`，没有 `"".equals`；15 处 OGNL 空判断、15 处 `StringUtils` 空判断、24 处 `@NotBlank/@NotEmpty` 都不依赖空串与 NULL 的区分。Oracle/达梦把 `''` 存成 NULL 后，动态表单的可选文本回读会从 `""` 变成 `null`，需要 B2 冒烟验证。
7. **长度边界集中在少数列**：`sw_bpm_task_opinion_draft.comment VARCHAR(20000)` 在 MySQL utf8mb4 下约 80,000 字节，超过单行 65,535 字节上限，必须改 `LONGTEXT`；Oracle/达梦改 `CLOB`，SQL Server 改 `NVARCHAR(MAX)`。另有 `VARCHAR(2000)`、`VARCHAR(1024)` 和 12 个 `VARCHAR(1000)` 需要按 Oracle 4,000 字节上限处理。索引最大约 1,428 字节，低于 MySQL 3,072 和 SQL Server 1,700；29 个索引在 MySQL 767 字节旧前缀口径下超限，但 5.7 默认 DYNAMIC 行格式可用 3,072。`metadata_json text NOT NULL DEFAULT '{}'` 和 5 个 `TEXT DEFAULT NULL` 需要按 MySQL/Oracle 的 LOB 默认值限制处理。

B1 的实现清单需要按上述结果修订：LIMIT 拦截器的测试语料从 97 扩到 143 并覆盖大小写；增加 CONCAT/CAST/LIKE 三项 SQL 重写；增加 JDBC Map 键归一化和 `comment` 列处理；长度映射按 4,000/65,535 边界生成。

## 2. B0-1 注解 SQL 与 JdbcTemplate 的其余 PG 写法

逐条清单见 `assets/assess-02/01-annotation-and-jdbc-sql.md`（62 条注解 SQL、52 处 JdbcTemplate 调用，含文件:行、命中写法、SQL 摘录）。

### 2.1 计数

| 项 | 数量 | 说明 |
|---|---:|---|
| 可执行注解 SQL | 62 | main 60 + dev 2 |
| `@Select` | 44 | main 42 + dev 2 |
| `@Insert` | 2 | — |
| `@Update` | 8 | — |
| `@Delete` | 8 | 另有 38 个 `@DeleteMapping` HTTP 端点，不是 SQL |
| JdbcTemplate 调用 | 52 | main 50 + dev 2 |
| 其中直接承载 SQL | 35 | 其余 17 处为 DataSource 访问、变量 SQL 或 RowMapper lambda |

### 2.2 命中

| 写法 | 注解 SQL | JdbcTemplate | 真实 SQL 结论 |
|---|---:|---:|---|
| `LIMIT` | 8 | 4 | 需要方言重写；另有 129 处 `.last` 和 2 处动态 `LIMIT ? OFFSET ?` |
| `LIKE` | 6 个方法 | — | 语法可移植，大小写敏感度不同：PG 敏感，MySQL 默认不敏感，Oracle/SQL Server 取决于排序规则 |
| 三参数 `CONCAT` | 6 个方法 / 15 处 | — | Oracle/达梦只支持两个参数，必须改写 |
| `FOR UPDATE` | 4 | 2 | SQL Server 不支持；MySQL 5.7 不支持 `SKIP LOCKED` |
| `CAST` | 1 个方法 / 2 处 | 2 | `CAST(... AS VARCHAR)` 的类型名/长度在各库不同；`CAST(? AS vector)` 是 pgvector 专用 |
| `ILIKE`、`::`、`RETURNING`、JSON 操作符、布尔字面量、`||`、`now()`、`INTERVAL`、`date_trunc`、`string_agg`、`array_agg`、`DISTINCT ON` | 0 | 0 | 阶段 A 规划点名，但真实 SQL 中不存在；`->` 命中是 Java lambda |
| `current_schema()`/`information_schema`/`pg_extension` | — | 4 | pgvector/PostgreSQL 元数据链路，非 PG 不执行 |

### 2.3 需要 B1 处理的具体点

- **三参数 CONCAT 15 处**：JobInfoMapper 1、SysUserMapper 2、SysUserGroupMapper 4、CopyRecordMapper 8。建议改成 `'%' || #{param} || '%'`（PG/Oracle/达梦）或 `CONCAT(CONCAT('%', #{param}), '%')`（全库）；前者在 MySQL 需要 `PIPES_AS_CONCAT`，所以跨库统一用嵌套 `CONCAT` 更稳。
- **`CAST(... AS VARCHAR)` 2 处**：AgentGraphExecutionMapper:38、:40。MySQL 用 `CHAR`，Oracle/达梦用 `VARCHAR2(n)`，SQL Server 需要长度；B1 需要按方言生成或改成不依赖类型转换的比较（例如 `CAST(create_by AS CHAR)` 统一？需逐库验证）。
- **LIKE 大小写 6 个方法 / 15 处搜索表达式**：如果要求与 PostgreSQL 一致，B1 需要把 `LIKE` 改成 `LOWER(col) LIKE LOWER(#{param})` 或为 MySQL/SQL Server 指定区分大小写的排序规则；这是产品行为决定，需要 Planner 确认是否要求跨库一致。
- **LIMIT**：见第 3 节。

## 3. B0-2 MyBatis-Plus Wrapper 原生片段

清单见 `assets/assess-02/02-wrapper-raw-fragments.md`。

- `.apply` / `.having` / `.inSql`：3 处；真实 Wrapper 原生片段只有 `BpmCommandController:156` 的 `(command_key LIKE {0} OR command_key LIKE {1})`，另外 2 处是 `Function.apply`/`appNameOf.apply`，不是 Wrapper。
- `.last(...)`：**129 处**，全部是 LIMIT；大写 97、小写 32；没有非 LIMIT 的 `.last`。逐站点清单见 `assets/assess-02/07-last-limit-sites.md`。
- `.orderBy*` 原生字符串：8 处，都是简单列名/别名（`create_time`、`cnt`、`process_def_key`、`lastTime`），没有函数或表达式。
- `.select(...)` 含 SQL 表达式：7 处；其中 `count(*) as cnt`、`MAX(round_no) AS max_round`、`COUNT(*) AS branch_total`、`COUNT(DISTINCT participant_id) AS total` 的别名未加引号，Oracle/达梦会折成大写，消费端按小写读取会取不到（见第 4 节）。
- `.groupBy(...)`：3 处，都是 `process_def_key`。

**LIMIT 总站点**：

| 类别 | 数量 |
|---|---:|
| `.last("LIMIT …")` 大写 | 97 |
| `.last("limit …")` 小写 | 32 |
| `.last` 合计 | **129** |
| 注解 SQL `LIMIT` | 8 |
| JdbcTemplate/动态 SQL `LIMIT` | 6 |
| **合计** | **143** |

JdbcTemplate/动态 SQL 的 6 处：FormDataQueryService 2（`LIMIT ? OFFSET ?`）、BpmResourceOpsService 2（`LIMIT ? OFFSET ?`）、TxnActionNodeDelegate 1（`LIMIT 1`）、PgKnowledgeVectorStore 1（`LIMIT ?`）。

## 4. B0-3 保留字与标识符大小写

清单见 `assets/assess-02/03-reserved-words.md` 与 `assets/assess-02/04-case-folding-and-empty-string.md`。

### 4.1 保留字

- 按完整标识符比对 DDL 表名、DDL 列名、MyBatis-Plus `@TableName`、`@TableField`，命中项只有 **`comment`**（Oracle、达梦）。
- `comment` 出现在 `sw_bpm_task_opinion_draft.comment` 和 `BpmTaskOpinionDraft.@TableField("comment")`；MyBatis-Plus 生成未加引号的 `comment`，Oracle/达梦会报语法错误。
- `type`（`sw_bpm_ext_datasource.type`、`ExternalDatasource.@TableField("type")`）在 MySQL 8.0、Oracle 19c、SQL Server 2019 的保留字表中不是保留字；达梦待实测。
- 表名没有命中；`sys_user` 不会因为包含 `user` 被判为命中。

### 4.2 大小写折叠

- Oracle/达梦把未加引号的标识符折成大写；PostgreSQL/H2 折成小写；动态宽表由 `VendorDialect` 加双引号创建小写列，查询也加双引号，键稳定。
- MyBatis 3.5.16 的 `Reflector` 有 `caseInsensitivePropertyMap`/`findPropertyName`，实体映射大小写不敏感；`JdbcTemplate` 的 `ColumnMapRowMapper` 直接用驱动返回的列标签作为 Map 键，Oracle 未加引号的别名返回大写键。

### 4.3 未处理的 Map 键读取（Oracle/达梦会取到 null）

| 位置 | 读取的键 | 影响 |
|---|---|---|
| `TxnActionNodeDelegate:169-172` | `error_code`、`error_msg`、`id` | 拒绝原因/调用 id 丢失，事务回滚后的拒绝结果为空 |
| `DeptFacadeImpl:68-71` | `dept_id`、`parent_id`、`leader_id` | 部门目录行被跳过，BPM 节点函数/参与者解析拿不到部门树 |
| `UserFacadeImpl:224-226` | `dept_id`、`leader_id` | 部门负责人映射为空，P63 组织函数结果为空 |
| `BpmProcessDefController:368-371` | `cnt` | `instanceCount` 全部为 0（`processKey` 别名已加引号，不受影响） |
| `ApprovalLifecycleServiceImpl:967、981、994` | `max_round`、`branch_total`、`total` | 审批生命周期统计为 null，可能影响分支轮次/参与人总数 |

**已处理的范式**：`BpmResourceOpsService` 的 `lowerCaseKeys(...)` 已把 JDBC Map 键统一转小写；`BpmProcessFavoriteService` 只读加引号的 `processKey`；`BpmProcessDefController:283`、`FixedTableSql`、动态宽表都使用加引号的小写别名。B1 建议把 `lowerCaseKeys` 抽成公共工具，或统一使用 `LinkedCaseInsensitiveMap`，不要在每个消费点手写兼容。

## 5. B0-4 空字符串当 NULL

清单见 `assets/assess-02/04-case-folding-and-empty-string.md`。

| 项 | 数量/结论 |
|---|---|
| 种子 `''` | 280 处，集中在演示组织/部门的可空 `description` 等列；关键值不使用空串 |
| 生产 SQL `WHERE x = ''` | 0 处 |
| 生产 `"".equals(...)` / `.equals("")` | 0 处（唯一一处在测试代码） |
| MyBatis OGNL `!= ''` / `== ''` | 15 处（JobInfoMapper、BpmInstanceMapper、BpmMonitorMapper），是 Java 侧空判断，不生成 SQL |
| `StringUtils.isEmpty/isBlank` 等 | 15 处；null 和空串同等处理，安全 |
| `@NotBlank/@NotEmpty` | 24 处；写入前拒绝空串 |
| 动态表单可选文本 | Oracle/达梦把 `''` 存成 NULL，回读为 null；前端通常同样显示为空，但 JSON 契约从 `""` 变 `null` |

B2 冒烟必须覆盖：可选文本留空提交与回读、必填文本留空仍被拒绝、已有值清空的再次保存、审批意见 `comment` 留空提交。NOT NULL 文本列由校验拦截；漏过校验时 Oracle 会报 `ORA-01400`，不会静默写入。`password_cipher TEXT NOT NULL` 存的是加密后的密文，空密码也会得到非空密文。

## 6. B0-5 长度与类型边界

清单见 `assets/assess-02/05-length-and-index.md`（135 张表、236 个索引的解析结果）。

### 6.1 宽列

| 列 | 类型 | 最坏字节 | 处理 |
|---|---|---:|---|
| `sw_bpm_task_opinion_draft.comment` | `VARCHAR(20000)` | 80,000 | MySQL `LONGTEXT`（单行 65,535 上限）、Oracle/达梦 `CLOB`、SQL Server `NVARCHAR(MAX)` |
| `sw_bpm_node_function_audit.summary` | `varchar(2000)` | 8,000 | Oracle/达梦 `CLOB` 或缩短 |
| `sw_storage_file.storage_url` | `VARCHAR(1024)` | 4,096 | Oracle/达梦 `CLOB` 或 `VARCHAR2(1000 CHAR)` |
| 12 个 `varchar(1000)` 列 | `varchar(1000)` | 4,000 | Oracle `VARCHAR2(1000 CHAR)` 正好在上限；业务增长时改 CLOB |

### 6.2 索引键

- 最大约 **1,428 字节**（`uk_form_integration_invocation_identity`），低于 MySQL utf8mb4 的 3,072 字节和 SQL Server 非聚集索引的 1,700 字节；低于 Oracle 8K 块的索引键上限。
- **29 个索引**在 MySQL 767 字节旧前缀口径下超限；MySQL 5.7 默认 `DYNAMIC` 行格式 + `innodb_large_prefix=ON` 时可用 3,072，阶段 B 要确认 MySQL 5.7 容器和后续生产实例的 `innodb_default_row_format`。
- 没有索引使用 `TEXT`/`CLOB` 列；主键都是 `bigint id`（8 字节）。

### 6.3 TEXT/JSONB 默认值

- `sys_workspace_card_type.metadata_json text not null default '{}'`：MySQL 5.7 的 TEXT/BLOB/JSON 不允许非 NULL 默认值；Oracle CLOB 默认值也受限。建议 MySQL 用 `VARCHAR(4000) NOT NULL DEFAULT '{}'`（该列是卡片元数据，长度有限），Oracle 用 `VARCHAR2(4000 CHAR)` 或由应用写入默认值。
- 5 个 `TEXT DEFAULT NULL`（`bean_params`、`form_data`、`job_params`、`result_msg`、`exception_stack`）：MySQL 5.7 可能拒绝显式 `DEFAULT NULL`，阶段 B 实测；必要时删除 `DEFAULT NULL` 或改 `LONGTEXT`。

### 6.4 标识符长度

- 最长标识符 41 字符（`idx_sw_agent_tool_external_tenant_deleted`），Oracle 19c 支持 128，MySQL 64，PostgreSQL 63，SQL Server 128，均在范围内；Oracle 11g 不在本次范围。

## 7. B1 实现清单的修订

按 B0 结果，B1 公共能力按以下清单执行（与规划审查 §4 的 B1 要求合并）：

1. **LIMIT 重写拦截器**：测试语料覆盖 **143 处**（129 `.last` + 8 注解 + 6 手写），必须处理大小写 `LIMIT/limit`；Oracle 改 `FETCH FIRST n ROWS ONLY`；SQL Server 无 OFFSET 用 `TOP n`，有 OFFSET 必须有 `ORDER BY ... OFFSET m ROWS FETCH NEXT n ROWS ONLY`；解析失败直接报错，不静默放过。
2. **SQL 重写/改写**：15 处三参数 `CONCAT` 改嵌套 `CONCAT(CONCAT(...))` 或方言拼接；2 处 `CAST AS VARCHAR` 按方言生成类型；6 个方法的 `LIKE` 大小写策略按 Planner 确认的口径处理。
3. **JDBC Map 键归一化**：把 `lowerCaseKeys` 抽成公共工具或统一 `LinkedCaseInsensitiveMap`；修复第 4.3 节 5 处未处理点；`@Select` 返回 Map 的别名统一加引号小写。
4. **保留字**：`comment` 列建议改名 `opinion_comment`，并新增一个所有方言都执行的版本化迁移（不修改历史脚本）；如果 Planner 选择保留列名，则实体映射和所有方言 SQL 都要加引用，且 Oracle/达梦按大写 `"COMMENT"` 处理。`type` 在 DM8 实测后决定是否引用。
5. **JSON 绑定**：按规划裁决保留持久化；`JsonStringTypeHandler` 按方言选择 `Types.OTHER` / `setString` / `setCharacterStream`。
6. **向量存储**：非 PG 用持久化文本/CLOB 列 + 启动载入 + 进程内相似度（规划裁决 4）；不执行 pgvector 元数据链路。
7. **MySQL 5.7 原子领取**：只走方言分支，支持 `SKIP LOCKED` 的数据库保持现有写法；MySQL 5.7 用原子 `UPDATE ... WHERE` 领取，并补多线程并发测试（规划裁决 3）。
8. **类型/长度映射**：`VARCHAR(20000)` → MySQL `LONGTEXT`、Oracle/达梦 `CLOB`、SQL Server `NVARCHAR(MAX)`；`VARCHAR(2000)`/`VARCHAR(1024)` 按 Oracle 4,000 边界转 CLOB；`VARCHAR(1000)` 用 `VARCHAR2(1000 CHAR)`；`metadata_json` 和 `TEXT DEFAULT NULL` 按第 6.3 节处理。
9. **验证**：B1 完成后先跑 H2 和 PG 全量测试，证明行为不变；再进入 B2 单库适配。MySQL 5.7 的并发领取测试、Oracle/达梦的空串冒烟、Kingbase/openGauss 的 `CONCAT`/`CAST` 实测都纳入对应进度回执。

## 8. 需要 Planner 确认的事项

1. **`LIKE` 大小写口径**：是否要求跨库与 PostgreSQL 完全一致（区分大小写）？如果要一致，B1 改 `LOWER(...) LIKE LOWER(...)` 或指定排序规则；如果不需要，记录 MySQL/SQL Server 默认不敏感的差异。
2. **`comment` 列处理**：改名 `opinion_comment`（推荐，新增一个全方言版本化迁移），还是保留列名并在实体/所有方言 SQL 中加引用？
3. **`type` 列**：是否允许在 DM8 实测后再决定引用方式，还是 B1 直接按保留字处理（加引用/改名）？
4. **MySQL 767 字节旧前缀**：生产 MySQL 5.7 实例是否保证 `DYNAMIC` 行格式 + `innodb_large_prefix=ON`？如果不保证，29 个索引需要缩短或加前缀。
5. **`VARCHAR(1000)` 列**：Oracle 用 `VARCHAR2(1000 CHAR)` 正好在 4,000 字节上限；是否接受“当前上限、业务增长再改 CLOB”，还是 B1 直接对这些列统一用 CLOB？

以上 5 项是 B1 开始前的口径确认；未确认前 B1 不写方言脚本。

## 9. 证据索引

| 证据 | 路径 |
|---|---|
| 62 条注解 SQL + 52 处 JdbcTemplate 逐条清单 | `product/multi-database-compat/assets/assess-02/01-annotation-and-jdbc-sql.md` |
| Wrapper 原生片段与 LIMIT 分类 | `product/multi-database-compat/assets/assess-02/02-wrapper-raw-fragments.md` |
| 保留字比对 | `product/multi-database-compat/assets/assess-02/03-reserved-words.md` |
| 大小写折叠与空字符串 | `product/multi-database-compat/assets/assess-02/04-case-folding-and-empty-string.md` |
| 长度与索引边界 | `product/multi-database-compat/assets/assess-02/05-length-and-index.md` |
| 运行时 SQL 方言点汇总 | `product/multi-database-compat/assets/assess-02/06-runtime-sql-summary.md` |
| 129 处 `.last` LIMIT 站点 | `product/multi-database-compat/assets/assess-02/07-last-limit-sites.md` |

主要命令：

```text
# 注解 SQL 与 JdbcTemplate 提取（main + dev）
py -3 -I b0_extract_sql.py
# Wrapper 原生片段
py -3 -I b0_wrapper.py
# 保留字
py -3 -I b0_reserved.py
# DDL 宽列/索引键
py -3 -I b0_ddl_scan.py
# 129 处 .last LIMIT 站点
py -3 -I b0_last_sites.py
# 关键 grep
grep -rn '@Select\|@Insert\|@Update\|@Delete' --include='*.java' src/main
grep -rn 'CONCAT(\|CAST(\|LIKE' --include='*.java' src/main
grep -rn 'selectMaps\|queryForList\|queryForMap' --include='*.java' src/main
```

## 10. 自验与偏差

- B0 是只读补充盘点，未修改 Server/Web 业务代码，未新增迁移脚本，未连接 UAT 数据库。
- 已覆盖规划审查 §2 的五项缺口：注解/JdbcTemplate 其余 PG 写法、Wrapper 原生片段、保留字与大小写、空字符串语义、长度与索引边界。
- **偏差/限制**：
  - 保留字比对使用内置的常用保留字集合（含规划点名项），完整官方列表在 B1 固化为脚本后再跑一次。
  - `type` 在达梦、MySQL 5.7 的 `TEXT DEFAULT NULL`、`VARCHAR(1000)` 在 Oracle 的实际边界需要在 B2 单库实测确认；B0 给出的是静态判断和待测项。
  - 未做新的 Docker 拉取/启动；B0 不需要，阶段 B 按规划裁决逐库现拉现清理。

## 11. 七阶段与下一步

| 阶段 | 状态 |
|---|---|
| 1 新需求评估 | ✅ 完成 |
| 2 执行（A→B0→B1→B2→C） | 进行中：阶段 A 有条件通过，B0 已完成并提交，待 Planner 确认 B1 口径 |
| 3 验收与同步 | ⬜ 未开始 |
| 4 合并 | ⬜ 未开始 |
| 5 发版（0.4.0） | ⬜ 未开始 |
| 6 发布后同步 | ⬜ 未开始 |
| 7 结束 | ⬜ 未开始 |

已完成 **1**，进行中 **1**，未开始 **5**。

下一步：Planner 审阅本回执与第 8 节 5 项口径，确认后 Executor 进入 B1（公共能力：VendorDialect、LIMIT 重写、行锁、JSON、迁移 Runner、种子比对工具），B1 完成后先跑 H2/PG 全量测试，再进入 B2 单库适配。

## 12. 本轮实际读取/修改文件

- 读取：`product/multi-database-compat/ready/direction-multi-database-compat.md`、`receipts/planning-review-assess-01.md`、`receipts/execution-assess-01.md`、`knowledge/current-status.md`。
- 读取（Server 代码/配置）：`application.yml`、`FlywayConfiguration.java`、`VendorDialect.java`、`DynamicTableSql.java`、`DynamicTableManager.java`、`JsonStringTypeHandler.java`、`PgKnowledgeVectorStore.java`、`KnowledgeVectorColumnInitializer.java`、`BpmResourceUsageMapper.java`、`BpmCommandMapper.java`、`BpmInstanceMapper.java`、`SysTenantMapper.java`、`SysDeptMapper.java`、`SysUserMapper.java`、`DeptFacadeImpl.java`、`UserFacadeImpl.java`、`TxnActionNodeDelegate.java`、`BpmProcessDefController.java`、`ApprovalLifecycleServiceImpl.java`、`BpmProcessFavoriteService.java`、`BpmResourceOpsService.java`、`JobInfoMapper.java`、`SysUserGroupMapper.java`、`CopyRecordMapper.java`、`FormDataQueryService.java`、`BpmResourceOpsService.java`、`ProcessThemeService.java`、`BpmUrgeServiceImpl.java`、`SqlExecutor.java`、`JobStartupRunner.java` 等。
- 读取（迁移/种子）：`db/migration/h2/` 与 `db/migration/postgresql/` 全部 56 个 SQL 文件的文件清单与关键写法。
- 读取（JAR）：MyBatis 3.5.16 `Reflector`、Flowable 7.1.0 `DbUtil`、Spring Boot 3.4.4 `DatabaseDriver`、Flyway 11.3.4 数据库类型。
- 新增：本回执与 `assets/assess-02/` 下 7 份 markdown 证据、2 份原始 JSON。未修改业务代码。
