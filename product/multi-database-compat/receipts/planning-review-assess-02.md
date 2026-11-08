# P66 规划审查：B0 补充盘点（planning-review-assess-02）

| 项目 | 内容 |
|---|---|
| 审查对象 | `receipts/execution-assess-02.md`、`assets/assess-02/01—07` |
| 依据 | `ready/direction-multi-database-compat.md`、`receipts/planning-review-assess-01.md` §2、§4 |
| 日期 | 2026-11-08 |
| 审查角色 | Planner |
| 结论 | **通过**：B0 五项缺口补齐，第 8 节五项口径按本审查 §3 裁决，Executor 进入 B1 |
| 七阶段 | **1 / 1 / 5**（评估完成；执行进行中：A、B0 完成，进入 B1） |

## 1. 核对结果

| B0 缺口（审查 01 §2） | 回执位置 | 结论 |
|---|---|---|
| 1. 注解 SQL / JdbcTemplate 的其余 PG 写法 | §2、证据 01 | 通过。62 条注解 SQL + 52 处 JdbcTemplate 逐条列出；点名的 PG 写法实测为 0；新发现三参数 `CONCAT` 15 处、`CAST AS VARCHAR` 2 处 |
| 2. Wrapper 原生片段 | §3、证据 02/07 | 通过。`.last` 修正为 129 处（大写 97、小写 32），全部是 LIMIT；我抽查证据 07，计 129 行，与回执一致 |
| 3. 保留字与大小写折叠 | §4、证据 03/04 | 通过，附条件 C1。新发现 5 处 JDBC Map 小写键读取在 Oracle/达梦会取到 null，有文件:行与数据来源 |
| 4. 空字符串当 NULL | §5、证据 04 | 通过。种子 280 处 `''` 都在可空列，生产代码不依赖空串与 NULL 的区分；B2 冒烟项已列出 |
| 5. 长度与索引 | §6、证据 05 | 通过。宽列、索引键最大值、LOB 默认值、标识符长度都已给出 |

阶段 A 的计数口径（注解 105、`.last` 97）已在本回执修正。后续回执一律使用 62 / 129 / 143。

## 2. 发现的问题（B1 必须一并处理）

- **H1 JdbcTemplate 的 LIMIT 不走 MyBatis 拦截器。**
  - 回执 §7.1 把 6 处手写 LIMIT 并入拦截器测试语料，但 MyBatis 拦截器拦不到 `JdbcTemplate`。
  - FormDataQueryService 2 处、BpmResourceOpsService 2 处、TxnActionNodeDelegate 1 处，必须改为调用 `VendorDialect` 的分页/取首行方法。
  - PgKnowledgeVectorStore 1 处只在 PG 执行，保持不变。
  - 拦截器语料覆盖 129 处 `.last` 加 8 处注解 LIMIT；另 5 处由 `VendorDialect` 单测覆盖。合计 142 处有测试，另 1 处标为 PG 专用。
- **H2 行锁与 LIMIT 组合。**
  - Oracle 不允许 `FOR UPDATE` 与 `FETCH FIRST` 同用（ORA-02014）；SQL Server 的 `TOP` 加锁要用表提示。
  - B1 要盘出 6 处行锁 SQL 与 `.last` LIMIT 同时出现的站点。存在则按方言改写；不存在要在回执写明 0 处。
  - 拦截器遇到行锁加 LIMIT 的组合又无法改写时，必须报错。
- **H3 保留字只按内置常用集比对。**
  - 证据 03 写“没有命中完整保留字”，回执 §10 承认用的是内置集合。两处表述不一致。
  - Oracle 的 `LEVEL`、`SIZE`、`UID`、`SESSION`，达梦大量额外关键字，SQL Server 的 `KEY`、`USER`、`PERCENT` 等都可能命中。
  - B1 必须按 10 个数据库的官方保留字表固化脚本，重跑一次。新增命中列入 B1 回执，并按 §3 第 2、3 条处理。
- **H4 MySQL / SQL Server 排序规则还影响唯一键。**
  - MySQL 8.0 默认 `utf8mb4_0900_ai_ci`，SQL Server 默认 `_CI_`，都不区分大小写。
  - 影响不止 LIKE：编码类唯一索引会把 `ABC` 与 `abc` 判为重复，和 PG 行为不同。
  - 处理方式见 §3 第 1 条。
- **H5 达梦初始化参数决定多项行为，回执未涉及。**
  - `CASE_SENSITIVE` 决定标识符折叠与比较。
  - `LENGTH_IN_CHAR` 决定 `VARCHAR(n)` 按字节还是按字符计。默认按字节，`VARCHAR(1000)` 存中文会溢出。
  - `COMPATIBLE_MODE` 决定 `''` 是否等于 NULL。达梦默认不把 `''` 当 NULL，与 Oracle 不同。
  - B2 达梦回执必须记录这三项实际值。实例按以下取值初始化：`CASE_SENSITIVE=Y`、`LENGTH_IN_CHAR=1`，`COMPATIBLE_MODE` 保持默认。
  - 空串冒烟按实际语义执行。
- **H6 `CAST(... AS VARCHAR)` 优先消除，而不是按方言生成。**
  - AgentGraphExecutionMapper:38、:40 先改成参数侧类型一致的比较，例如 Java 侧转成同类型再绑定。
  - 确实消除不了，再走 `VendorDialect` 生成；回执写明原因。

## 3. 第 8 节五项口径裁决

1. **LIKE 与比较的大小写：跨库与 PostgreSQL 一致（区分大小写）。**
   - 靠库级排序规则实现，不改 SQL，不加 `LOWER(...)`。加 `LOWER` 会改变 PG 现有行为。
   - MySQL / MariaDB：`utf8mb4` 加 `utf8mb4_bin`。
   - SQL Server：区分大小写的排序规则（如 `Chinese_PRC_CS_AS`），文本列用 `NVARCHAR`。
   - Oracle、达梦（`CASE_SENSITIVE=Y`）、人大金仓、openGauss 默认区分大小写，不处理。
   - 启动时检查字符集和排序规则，不符合直接拒绝启动并给出明确提示。这一项与阶段 A 发现的 MySQL 5.7 容器默认 latin1 一并处理。
   - 部署文档写明各库的建库参数。
2. **`comment` 列：改名为 `opinion_comment`。**
   - 实体 Java 字段名不变，只改 `@TableField`。
   - PG / H2 新增 0.4.0 版本化迁移执行 `RENAME COLUMN`，历史脚本不改，校验和不变。
   - 新方言的迁移链与 PG 保持同一版本序列。UAT 升级到 0.4.0 时由该迁移就地改名，不清数据；发布说明写明。
   - B1 要全仓检索 `comment` 列在注解 SQL、JdbcTemplate、Wrapper 字符串和前端接口中的引用，结果列入回执。前端接口字段名应不变，变了要停下报告。
3. **`type` 列：同意 B2 在达梦实测后再定。**
   - B1 必须先把“按方言引用标识符”做成可配置的能力，实测命中时只加配置项，不改架构。
   - H3 重跑中如发现其他库命中 `type`，按同一机制处理。
4. **MySQL 索引前缀：把以下条件定为支持前提，29 个索引不缩短。**
   - MySQL 5.7.7 及以上，`innodb_default_row_format=DYNAMIC`，`innodb_large_prefix=ON`。5.7 默认满足。
   - MariaDB 按同等口径。
   - 启动时检查，不满足直接拒绝启动。
   - 部署文档写明。
5. **`VARCHAR(1000)` 列：接受 Oracle `VARCHAR2(1000 CHAR)`。**
   - 前提：Oracle 字符集为 AL32UTF8、`MAX_STRING_SIZE=STANDARD`，1000 字符最坏 4000 字节，正好在上限内。
   - 达梦按 H5 用 `LENGTH_IN_CHAR=1`。
   - 业务需要扩长度时另立需求改 CLOB。
   - `VARCHAR(2000)`、`VARCHAR(1024)`、`VARCHAR(20000)` 按回执 §6.1 处理。

**补充：`metadata_json text NOT NULL DEFAULT '{}'`。**
- 不采用回执建议的“MySQL 改 `VARCHAR(4000)`”，避免截断风险。
- 非 PG 方言脚本保持大文本类型，去掉库级默认值。
- 插入路径由实体层在值为 null 时填 `'{}'`。PG / H2 的库级默认值保留，行为不变。
- 补一条不传该字段时插入后回读为 `'{}'` 的测试，在 H2、PG 和至少一个非 PG 库上执行。
- 5 个 `TEXT DEFAULT NULL` 按回执在 B2 实测。

## 4. B1 范围（以回执 §7 为准，按本审查修订）

1. LIMIT：
   - 拦截器覆盖 129 处 `.last` 和 8 处注解 LIMIT，处理大小写，解析失败报错。
   - 5 处 JdbcTemplate LIMIT 改为调用 `VendorDialect`（H1）。
   - 处理行锁与 LIMIT 的组合（H2）。
2. 15 处三参数 `CONCAT` 统一改成嵌套 `CONCAT(CONCAT('%', #{p}), '%')`。PG 结果不变，要有测试证明。
3. `CAST` 优先消除（H6）。
4. JDBC Map 键归一化：抽出公共工具或统一用 `LinkedCaseInsensitiveMap`，修复 5 处。返回 Map 的 `@Select` 别名统一加引号小写。
5. 保留字：用官方表重跑（H3）；`comment` 改名（§3 第 2 条）；标识符引用做成可配置（§3 第 3 条）。
6. 启动检查：字符集、排序规则、MySQL 行格式和大前缀；达梦三项参数只记录、不阻断。不符合要求时拒绝启动。
7. 审查 01 已定的其余内容不变：`VendorDialect` 扩展、JSON 绑定、MySQL 5.7 原子领取加并发测试、非 PG 向量持久化、`SwVendorMigrationRunner`、种子两层比对工具。
8. 验证：B1 完成后 H2 和 PG 全量测试通过，PG / H2 迁移校验和不变。新增的 0.4.0 迁移在 H2、PG 上从空库和从 0.3.2 库升级各跑一次。

**分支**：`feature/0.4.0-multi-database`，从 Server 最新 `develop` 建。
**回执**：`receipts/execution-b1-01.md`。B1 可以分批提交进度回执，但每份回执都要写明已覆盖和未覆盖的站点数。

## 5. Owner 裁决（2026-11-08 追记）

- **Oracle：接受 21c XE 验收**，迁移和 SQL 只用 12.2+ 语法，不再等 19c 镜像。方向和回执里的“Oracle 19c”按“Oracle 21c XE（19c 语法兼容）”执行。
- **达梦、人大金仓授权：卡住再说。** Executor 先用公开渠道获取官方安装包或镜像。确实需要注册或授权时，停在该库，向 Owner 报告卡点和所需材料；其他库继续推进，不阻断整体。
