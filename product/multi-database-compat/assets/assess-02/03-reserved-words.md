# B0 证据：保留字与标识符大小写

## DDL 列名命中保留字

| 列名 | 命中数据库 |
|---|---|
| comment | Oracle, 达梦 |

## DDL 表名命中保留字

| 表名 | 命中数据库 |
|---|---|

## MyBatis-Plus 实体表名命中

| 表名 | 命中数据库 | 位置 |
|---|---|---|

## MyBatis-Plus @TableField 列名命中

| 列名 | 命中数据库 | 位置 |
|---|---|---|
| comment | Oracle, 达梦 | sw-biz/sw-bpm/sw-bpm-process/src/main/java/com/sw/ck/bpm/process/entity/BpmTaskOpinionDraft.java:28 |

## 待实测项

| 标识符 | 位置 | 说明 |
|---|---|---|
| `type` | `sw_bpm_ext_datasource.type`；`ExternalDatasource.@TableField("type")` | MySQL 8.0、Oracle 19c、SQL Server 2019 的保留字表中 `TYPE` 不是保留字；达梦需在 DM8 上实测，若报错则按方言加引用或改列名 |

## 说明

- 以上只按“完整标识符”比对，`sys_user` 不会因为包含 `user` 被判为命中。
- 保留字集合覆盖了规划点名的 `user`、`level`、`comment`、`date`、`size`、`mode`、`type`、`key`、`rank`、`groups`、`order`、`desc`，以及 MySQL 8.0、Oracle 19c、SQL Server 2019、DM8 的常用保留字；完整官方列表在 B1 固化为脚本后再跑一次。
- 命中项需要在对应方言脚本中加引用（MySQL 反引号、Oracle/达梦双引号、SQL Server 方括号），或改列名；MyBatis-Plus 生成 SQL 时不会自动为保留字加引用。
- Oracle/达梦把未加引号的标识符折成大写；MyBatis-Plus 实体映射按属性名大小写不敏感匹配，通常不受影响；`JdbcTemplate` 的 `Map.get("tenant_id")` 依赖驱动返回的列标签，需单独核对（见 `04-case-folding-and-empty-string.md`）。

