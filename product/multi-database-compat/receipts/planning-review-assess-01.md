# 规划审查：P66 阶段 A 能力核对与方案（assess-01）

2026-11-08｜规划｜依据 `receipts/execution-assess-01.md`、`assets/assess-01/01—05`｜结论：**有条件通过**。方案总体确认，可以进入阶段 B，但阶段 B 第一步必须先补齐 §2 的盘点缺口（B0），B0 回执经规划确认后才能开始写方言脚本。

## 1. 认可的部分

| 项 | 判断 |
|---|---|
| 盘点 | 迁移链（H2/PG 各 28 支，基线 5,646 行）、种子（18 张表、340 条 INSERT）、97 处 `.last("LIMIT …")`、6 处行锁、JSON 绑定、pgvector、`VendorDialect` 只有两种、Spring `{vendor}` 不识别达梦/金仓/openGauss，这些发现都具体、有出处 |
| 第三方组件 | Flowable 7.1.0 缺达梦/金仓/openGauss 映射，可用 `databaseTypeMappings` 补；Quartz 是 RAMJobStore，不需要 `QRTZ_*` 表；MyBatis-Plus 3.5.9 分页已支持全部数据库，判断正确 |
| 脚本组织 | 每种数据库一套完整脚本；以 PG 为语义基准，用确定性的生成器出初稿，再逐库人工校对；生成器和产物都进仓库，不参与运行时。同意 |
| PG/H2 校验和 | 56 个文件一字不改，阶段 B 结束后只读比对 UAT `flyway_schema_history`。同意 |
| CI 分层 | 主流水线跑 H2 + PG + MySQL 8.0，其余每晚或发布前跑。同意 |
| 工作量 | 36—50 人日，XL 合理 |
| 冲突检查 | 与三示例流程无冲突（三示例流程已 COMPLETED） |

## 2. 盘点缺口（B0 必须补）

方向 §3 第 3 条点名要盘点的运行时写法，回执只覆盖了 LIMIT、行锁、JSON 绑定和 pgvector，以下几项没有统计结果：

1. **注解 SQL 和 JdbcTemplate SQL 的其余 PG 写法**：`ILIKE`、`::` 类型转换、`RETURNING`、JSON 操作符（`->`、`->>`、`@>`）、布尔字面量 `true/false`、`||` 字符串拼接（MySQL 默认是逻辑或）、`now()`/`INTERVAL`/`date_trunc` 等日期函数、`string_agg`/`array_agg`、`DISTINCT ON`、`COALESCE` 以外的 PG 专有函数。105 条注解 SQL 和全部 `JdbcTemplate` 调用都要逐条列出“文件:行、写法、影响哪些数据库”。
2. **MyBatis-Plus Wrapper 生成的写法**：`.apply(...)`、`.having(...)`、`.inSql(...)`、`.orderBy` 中拼接的原生片段，以及 `.last(...)` 里 LIMIT 以外的内容。
3. **保留字和标识符大小写**：
   - 所有表名、列名对照 MySQL 8.0、Oracle、SQL Server、达梦的保留字表（例如 `user`、`level`、`comment`、`date`、`size`、`mode`、`type`、`key`、`rank`、`groups`、`order`、`desc`），列出命中项。
   - Oracle 和达梦会把不加引号的标识符折成大写，要说明 MyBatis-Plus 实体映射、`JdbcTemplate` 按列名取值（如 `Map.get("tenant_id")`）在这两种数据库上是否还能取到。
4. **空字符串当 NULL 对业务代码的影响**：Oracle 和达梦把 `''` 当作 NULL。盘点代码中依赖空字符串语义的地方（例如 `WHERE x = ''`、`NOT NULL` 列写入 `''`、Java 里 `"".equals(...)` 判断取回值）。
5. **长度与类型边界**：`VARCHAR` 超过 4000 字节（Oracle `VARCHAR2` 上限）、MySQL 索引键长度（utf8mb4 下 767/3072 字节上限）、联合唯一索引是否超限，各列出命中项。

## 3. 第 4 节 5 项决策

| # | 事项 | 规划裁决 |
|---|---|---|
| 1 | 达梦/金仓/openGauss 的迁移引擎 | **同意方案 A**（项目内 `SwVendorMigrationRunner`）。附加要求：历史表加锁，防止多实例同时迁移；校验和不一致时拒绝启动，和 Flyway 的 validate 行为一致；已有业务表但没有历史表时拒绝自动 baseline；Runner 要有单元测试，并在三种数据库上实测“空库全链”和“重复启动不重复执行”。H2/PG/MySQL/MariaDB/Oracle/SQL Server 继续用 Flyway |
| 2 | 镜像与版本 | **达梦、金仓**：先去官方下载页取官方 Docker 镜像包或安装包（Owner 已允许 Docker 用不了时换其他安装方式）；如果需要注册账号或申请授权，立即反馈 Owner，由 Owner 提供。在此之前允许用社区镜像做预验证，但**正式验收必须用官方版本**，回执写明镜像来源和 sha256。**Oracle**：以 21c XE 作为验收版本，脚本只使用 12.2 及以上通用的语法（不用 21c/23ai 才有的 JSON 类型、BOOLEAN 类型等）。Owner 如果坚持精确验证 19c，提供授权镜像后补跑一次 |
| 3 | MySQL 5.7 的 SKIP LOCKED | **改为原子领取，但只走方言分支**：支持 `SKIP LOCKED` 的数据库保持现有写法（PG 行为不变是硬约束）；MySQL 5.7 等不支持的数据库用原子 `UPDATE … WHERE` 领取。在 MySQL 5.7 上补并发测试（多线程同时领取，不重复、不阻塞） |
| 4 | 非 PG 的向量检索 | **不接受“重启丢失”**。要求向量数据持久化在数据库里（例如向量存成文本或 CLOB 列），应用启动时载入、进程内计算相似度；检索性能不要求与 pgvector 相同。语义检索的质量与 PG 一致即可通过，大数据量性能写进验收边界 |
| 5 | Oracle 空字符串的比对口径 | **两层比对**：所有表比较行数；关键列逐值完全一致；其余列做 `''`/NULL 归一化后比较。另外冒烟测试要覆盖空字符串相关的业务路径（以 B0 第 4 项盘点结果为准） |

**偏差接受**：阶段 A 只拉取并启动了 MySQL 5.7，其余数据库只做了 manifest 可达性检查，因为磁盘空间不足（约 18 GB）。接受。阶段 B 每种数据库现拉、验证、清理容器和镜像，在进度回执里记录镜像大小和清理结果。

## 4. 阶段 B 执行要求

- **B0 补充盘点**：只读，回执写入 `receipts/execution-assess-02.md`，证据放 `assets/assess-02/`。规划确认后开始 B1。
- **B1 公共能力**：
  - 扩展 `VendorDialect`；
  - 标识符引用规则；
  - LIMIT 重写拦截器：要有单元测试覆盖全部 97 处 `.last` 的写法样本和 4 处手写 SQL，解析失败时直接报错，不能静默放过；SQL Server 带 OFFSET 时必须有 ORDER BY；
  - 行锁方言化；
  - JSON 绑定方言化；
  - 迁移 Runner；
  - 种子比对工具。
  - 完成后跑 H2 和 PG 全量测试，证明行为不变，再进入单库适配。
- **B2 起逐库适配**：顺序 MySQL 5.7/8.0 → Oracle → 达梦，完成标准和进度回执按方向 §4。
- 分支：`feature/0.4.0-multi-database`，从最新 develop 新建。

## 5. 七阶段

1 评估 ✅｜2 执行 🔄（阶段 A 有条件通过，下一步 B0）｜3—7 ⬜ → 已完成 1、进行中 1、未开始 5。
