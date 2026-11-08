# B0 证据：标识符大小写与空字符串语义

## 1. 大小写折叠事实

- Oracle 和达梦在默认（Oracle 兼容）模式下，把**未加引号**的标识符折成大写；加引号的标识符保留原大小写。
- PostgreSQL/H2 把未加引号的标识符折成小写（H2 的 PostgreSQL 模式；当前 H2 固定表由未加引号 DDL 创建，行为与 PG 一致）。
- MyBatis 3.5.16 的 `org.apache.ibatis.reflection.Reflector` 有 `caseInsensitivePropertyMap` 和 `findPropertyName`，实体属性映射大小写不敏感；MyBatis-Plus 的实体查询结果映射通常不受 Oracle 大写列标签影响。
- `JdbcTemplate` 的 `ColumnMapRowMapper` 直接用驱动返回的列标签作为 Map 键；Oracle 未加引号的列/别名返回大写键，`Map.get("tenant_id")` 会取不到值。
- 动态宽表由 `VendorDialect.wrapIdentifier` 加双引号创建（小写），查询也加双引号（小写），因此在 Oracle 上动态宽表的 Map 键保持小写；固定表由未加引号 DDL 创建，Oracle 返回大写。

## 2. 未处理的 Map 键读取（Oracle/达梦会取到 null）

| 位置 | 读取的键 | 数据来源 | 影响 |
|---|---|---|---|
| `sw-biz/sw-bpm/sw-bpm-engine/src/main/java/com/sw/ck/bpm/engine/delegate/TxnActionNodeDelegate.java:169-172` | `error_code`、`error_msg`、`id` | `jdbcTemplate.queryForList("SELECT id, error_code, error_msg FROM sw_form_txn_invocation ...")` | Oracle/达梦返回 `ID`、`ERROR_CODE`、`ERROR_MSG`，取不到拒绝原因和调用 id；事务回滚后的拒绝结果会丢失 |
| `sw-biz/sw-biz-system/sw-biz-system-biz/src/main/java/com/sw/ck/system/service/impl/DeptFacadeImpl.java:68-71` | `dept_id`、`parent_id`、`leader_id` | `SysDeptMapper.selectDeptDirectory`（`@Select` 未加引号别名） | 部门目录行被跳过；BPM 节点函数/审批参与者解析拿不到部门树 |
| `sw-biz/sw-biz-system/sw-biz-system-biz/src/main/java/com/sw/ck/system/service/impl/UserFacadeImpl.java:224-226` | `dept_id`、`leader_id` | `SysUserMapper.selectDeptLeaderMap`（`@Select` 未加引号别名） | 部门负责人映射为空；P63 组织函数结果为空 |
| `sw-biz/sw-bpm/sw-bpm-process/src/main/java/com/sw/ck/bpm/process/controller/BpmProcessDefController.java:368-371` | `cnt` | `selectMaps(... "count(*) as cnt")` | Oracle/达梦返回 `CNT`，`instanceCount` 全部为 0；`processKey` 别名已加引号，不受影响 |
| `sw-biz/sw-bpm/sw-bpm-process/src/main/java/com/sw/ck/bpm/process/service/impl/ApprovalLifecycleServiceImpl.java:967、981、994` | `max_round`、`branch_total`、`total` | `selectMaps(... "MAX(round_no) AS max_round")` 等 | Oracle/达梦返回大写别名，审批生命周期统计为 null；可能影响分支轮次/参与人总数 |

## 3. 已处理的 Map 键读取（可作为 B1 的改造范式）

| 位置 | 处理方式 |
|---|---|
| `BpmResourceOpsService` 的 `lowerCaseKeys(...)` | 把 JDBC Map 的键统一转小写；注释明确说明 H2 返回大写、PG 返回小写，消费端按小写读取。Oracle/达梦可直接复用 |
| `BpmProcessFavoriteService` | 只读取 `processKey`，该别名在 SQL 里写成 `"processKey"`（加引号），大小写稳定；`cnt`/`lastTime` 只用于 ORDER BY，不读 Map |
| `BpmProcessDefController:283-284` | `SELECT id AS "id", name AS "name"`，别名加引号 |
| `FixedTableSql` | `SELECT id AS "id", name AS "name"`，别名加引号 |
| 动态宽表 | `VendorDialect.wrapIdentifier` 加双引号创建小写列，`DynamicTableSql.quote` 查询时加双引号小写，键稳定 |
| `DynamicTableSql.queryForLock` | 手工 `row.put("id", ...)`，键固定小写 |

## 4. 保留字

| 标识符 | 位置 | 命中数据库 | 说明 |
|---|---|---|---|
| `comment` | `sw_bpm_task_opinion_draft.comment`；`BpmTaskOpinionDraft.@TableField("comment")` | Oracle、达梦 | MyBatis-Plus 生成未加引号的 `comment`，Oracle/达梦会把它当关键字；需要在方言脚本/实体映射里加引用，或改名（建议改名为 `opinion_comment`，并在新版本迁移中统一） |
| `type` | `sw_bpm_ext_datasource.type`；`ExternalDatasource.@TableField("type")` | 待实测（MySQL 8.0、Oracle 19c、SQL Server 2019 均不是保留字；达梦需确认） | 若达梦报错，按方言加引用 |

DDL 表名、实体表名、`@TableField` 的其余列名没有命中 MySQL 8.0、Oracle、SQL Server、达梦的完整保留字；`sys_user` 这类“包含 user 但不是完整标识符”的名称不算命中。

## 5. 空字符串语义

- 种子中有 **280 处** `''`，主要集中在 `R__0.1.7_org_demo_seed.sql` 的组织/部门 `description` 等可空列，以及菜单/角色的可选文本列；关键值（主键、编码、菜单树、角色菜单关联、默认管理员）不使用空字符串。
- 生产 Java 中没有 `WHERE x = ''` 的 SQL；搜索到的 15 处 `!= ''`/`== ''` 都是 MyBatis `<if test="...">` 的 OGNL 判断（JobInfoMapper、BpmInstanceMapper、BpmMonitorMapper），在 Java 侧判断字符串是否为空，不生成 `= ''` SQL。
- 生产 Java 中没有 `"".equals(...)` 或 `.equals("")`；唯一的 `"".equals` 在测试代码 `DynamicTableManagerTest`。
- `StringUtils.isEmpty/isBlank` 等 15 处、`@NotBlank/@NotEmpty` 24 处：前者把 null 和空串同等处理，后者在写入前拒绝空串；这两类不会因为 Oracle 把 `''` 当 NULL 而产生语义反转。
- 用户可提交的空字符串主要落在动态宽表的可空业务列：Oracle/达梦会把 `''` 存成 NULL，回读为 null；前端通常把 null 和空串都渲染为空，但 JSON 契约会从 `""` 变成 `null`。阶段 B 的冒烟测试要覆盖：
  1. 可选文本字段留空提交，回读为 null/空；
  2. 必填文本字段留空提交，仍按既有校验拒绝；
  3. 表单数据更新时把已有值清空，Oracle 存 NULL 后可再次保存；
  4. 审批意见 `comment`（可空）留空提交，审批链路不因 NULL 失败。
- 用户可写的 NOT NULL 文本列（如 `sys_tenant.name/code`、`sys_user.username`、`sys_role.name/code`、`sw_bpm_ext_datasource.name/type/jdbc_url/driver_class/username`）由 `@NotBlank` 或服务层校验拦截；Oracle 把空串转 NULL 后若漏过校验会得到 `ORA-01400`，不是静默写入。`password_cipher TEXT NOT NULL` 存的是加密后的密文，空密码也会得到非空密文。

## 6. B1 建议

- 对 JDBC 返回的 Map 统一走 `lowerCaseKeys`（或 `LinkedCaseInsensitiveMap`），不要在每个消费点手写大小写兼容。
- 对 `@Select` 返回 Map 的方法，别名一律加引号（小写），或统一在 Mapper 层做键归一化。
- `comment` 列优先改名；如果改名，新增一个所有方言都执行的版本化迁移，不动历史脚本。
- 空字符串冒烟用例纳入 B2 的每库验收清单，Oracle/达梦单独记录 `''`→NULL 的观察结果。
